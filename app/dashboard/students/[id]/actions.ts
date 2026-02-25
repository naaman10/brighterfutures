"use server";

import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import {
  createSession,
  getSessionsByStudentId,
  getStudentById,
  setStudentWelcomeSent,
  updateStudentAISummary,
  updateStudentWelcomeSentAt,
} from "@/lib/db";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";
import { sendTemplate } from "@/lib/email";

const WELCOME_TEMPLATE_ID = "d-ed0dda2b7cf54a348006d3804db1a5ad";

function formatDate(value: string | Date | null): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/** Formats date as dd/mm/yyyy for the welcome email. */
function formatDateDDMMYYYY(value: string | Date | null): string {
  if (value == null) return "";
  const d = value instanceof Date ? value : new Date(String(value).slice(0, 10));
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(value: string | Date | null): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toTimeString().slice(0, 5);
  if (typeof value === "string") return value.slice(0, 5);
  return String(value);
}

export async function sendWelcomeEmail(studentId: string): Promise<{ error?: string }> {
  const student = await getStudentById(studentId);
  if (!student) return { error: "Student not found" };

  const hasStartDate = student.start_date != null && formatDate(student.start_date) !== "";
  const hasStartTime = student.start_time != null && formatTime(student.start_time) !== "";
  const hasFirstName = (student.first_name ?? "").trim() !== "";
  const parentEmail = (student.parent_email ?? "").trim();
  const parentFirstName = (student.parent_first_name ?? "").trim();
  const welcomeNotSent = student.welcome === false;

  if (!hasStartDate || !hasStartTime) {
    return { error: "Student must have a start date and start time to send the welcome email." };
  }
  if (!hasFirstName) return { error: "Student must have a first name." };
  if (!parentEmail) return { error: "Parent must have an email address." };
  if (!parentFirstName) return { error: "Parent must have a first name." };
  if (!welcomeNotSent) return { error: "Welcome email has already been sent for this student." };

  const result = await sendTemplate({
    to: parentEmail,
    templateId: WELCOME_TEMPLATE_ID,
    dynamicTemplateData: {
      parent_name: parentFirstName,
      child_name: student.first_name.trim(),
      start_date: formatDateDDMMYYYY(student.start_date),
      start_time: formatTime(student.start_time),
    },
  });

  if (!result.success) return { error: result.error };

  // Only mark welcome sent and set welcome_sent_at when SendGrid succeeded
  const updateResult = await setStudentWelcomeSent(studentId);
  if ("error" in updateResult) return { error: updateResult.error };

  revalidatePath(`/dashboard/students/${studentId}`);
  return {};
}

export async function resendWelcomeEmail(studentId: string): Promise<{ error?: string }> {
  const student = await getStudentById(studentId);
  if (!student) return { error: "Student not found" };

  const hasStartDate = student.start_date != null && formatDate(student.start_date) !== "";
  const hasStartTime = student.start_time != null && formatTime(student.start_time) !== "";
  const hasFirstName = (student.first_name ?? "").trim() !== "";
  const parentEmail = (student.parent_email ?? "").trim();
  const parentFirstName = (student.parent_first_name ?? "").trim();

  if (!hasStartDate || !hasStartTime) {
    return { error: "Student must have a start date and start time to send the welcome email." };
  }
  if (!hasFirstName) return { error: "Student must have a first name." };
  if (!parentEmail) return { error: "Parent must have an email address." };
  if (!parentFirstName) return { error: "Parent must have a first name." };

  const result = await sendTemplate({
    to: parentEmail,
    templateId: WELCOME_TEMPLATE_ID,
    dynamicTemplateData: {
      parent_name: parentFirstName,
      child_name: student.first_name.trim(),
      start_date: formatDateDDMMYYYY(student.start_date),
      start_time: formatTime(student.start_time),
    },
  });

  if (!result.success) return { error: result.error };

  const updateResult = await updateStudentWelcomeSentAt(studentId);
  if ("error" in updateResult) return { error: updateResult.error };

  revalidatePath(`/dashboard/students/${studentId}`);
  return {};
}

/**
 * Get the first date on or after start that has the given day of week.
 */
function getFirstMatchingWeekday(startDate: Date, dayOfWeek: number): Date {
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  while (cur.getDay() !== dayOfWeek) {
    cur.setDate(cur.getDate() + 1);
  }
  return cur;
}

/** 1-based: which occurrence of this weekday in the month (e.g. 2 = second Monday). */
function getWeekdayOccurrenceInMonth(d: Date): number {
  const dayOfWeek = d.getDay();
  let count = 0;
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  for (let i = 1; i <= d.getDate(); i++) {
    first.setDate(i);
    if (first.getDay() === dayOfWeek) count++;
  }
  return count;
}

/** Get the nth occurrence of weekday in the given month (1-based). If month has fewer, returns the last occurrence. */
function getNthWeekdayInMonth(
  year: number,
  month: number,
  dayOfWeek: number,
  n: number
): Date {
  const d = new Date(year, month, 1);
  let count = 0;
  let last: Date | null = null;
  while (d.getMonth() === month) {
    if (d.getDay() === dayOfWeek) {
      count++;
      last = new Date(d);
      if (count === n) return last;
    }
    d.setDate(d.getDate() + 1);
  }
  return last ?? new Date(year, month, 1);
}

/**
 * Get dates for recurring sessions based on interval.
 * dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 * interval: "1" = every week, "2" = every two weeks, "3" = every three weeks, "monthly" = same day of month each month.
 */
function getRecurringDates(
  startDate: Date,
  endDate: Date,
  dayOfWeek: number,
  interval: string
): string[] {
  const out: string[] = [];
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (interval === "monthly") {
    const first = getFirstMatchingWeekday(startDate, dayOfWeek);
    const occurrenceN = getWeekdayOccurrenceInMonth(first);
    let cur = new Date(first);
    while (cur <= end) {
      out.push(cur.toISOString().slice(0, 10));
      cur = getNthWeekdayInMonth(
        cur.getFullYear(),
        cur.getMonth() + 1,
        dayOfWeek,
        occurrenceN
      );
    }
    return out;
  }

  const weeks = interval === "1" ? 1 : interval === "2" ? 2 : 3;
  const stepDays = weeks * 7;

  let cur = getFirstMatchingWeekday(startDate, dayOfWeek);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + stepDays);
  }
  return out;
}

export async function addSessions(
  studentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const mode = formData.get("mode") as string;
  const subject = (formData.get("subject") as string)?.trim();
  if (!subject) return { error: "Subject is required" };

  if (mode === "single") {
    const session_date = (formData.get("session_date") as string)?.trim();
    const session_time = (formData.get("session_time") as string)?.trim();
    if (!session_date || !session_time) return { error: "Date and time are required" };
    const result = await createSession({
      student_id: studentId,
      session_date,
      session_time,
      subject,
    });
    if ("error" in result) return { error: result.error };
    revalidatePath(`/dashboard/students/${studentId}`);
    return {};
  }

  // Recurring
  const dayOfWeekStr = formData.get("day_of_week") as string;
  const interval = (formData.get("recurring_interval") as string)?.trim() || "1";
  const validIntervals = ["1", "2", "3", "monthly"];
  const recurringInterval = validIntervals.includes(interval) ? interval : "1";
  const session_time = (formData.get("recurring_time") as string)?.trim();
  const endDateStr = (formData.get("recurring_end_date") as string)?.trim();
  const startDateStr = (formData.get("recurring_start_date") as string)?.trim();
  if (dayOfWeekStr == null || dayOfWeekStr === "" || !session_time || !endDateStr) {
    return { error: "Day, time and end date are required for recurring sessions" };
  }
  const dayOfWeek = parseInt(dayOfWeekStr, 10);
  if (dayOfWeek < 0 || dayOfWeek > 6) return { error: "Invalid day of week" };
  const endDate = new Date(endDateStr);
  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  if (endDate < startDate) return { error: "End date must be on or after start date" };

  const dates = getRecurringDates(startDate, endDate, dayOfWeek, recurringInterval);
  for (const session_date of dates) {
    const result = await createSession({
      student_id: studentId,
      session_date,
      session_time,
      subject,
    });
    if ("error" in result) {
      return { error: result.error };
    }
  }
  revalidatePath(`/dashboard/students/${studentId}`);
  return {};
}

/** Strip HTML tags to get plain text for AI context. */
function stripHtml(html: string | null): string {
  if (!html || !html.trim()) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CLAUDE_SONNET_MODEL = "claude-sonnet-4-5-20250929";

export async function generateStudentAISummary(
  studentId: string
): Promise<{ summary?: string; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "ANTHROPIC_API_KEY is not set. Add it in environment variables." };

  const [student, sessions] = await Promise.all([
    getStudentById(studentId),
    getSessionsByStudentId(studentId),
  ]);
  if (!student) return { error: "Student not found" };

  if (sessions.length === 0) {
    return { error: "No sessions yet. Add at least one session with summary or feedback to generate an AI summary." };
  }

  const sessionBlocks = sessions.map((s, i) => {
    const date = formatDisplayDate(s.session_date);
    const time = formatDisplayTime(s.session_time);
    const summaryText = stripHtml(s.summary_markdown);
    const feedbackText = stripHtml(s.feedback_markdown);
    return [
      `## Session ${i + 1} — ${date} ${time} — ${s.subject}`,
      summaryText ? `**Summary:** ${summaryText}` : "",
      feedbackText ? `**Feedback:** ${feedbackText}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  });

  const sessionData = sessionBlocks.join("\n\n---\n\n");
  const studentName = `${student.first_name} ${student.last_name}`.trim();

  const systemPrompt = `You are a teaching assistant. Review the summary and feedback for all of the student's previous sessions and provide a concise summary of their progress and recommend any areas the student should focus on. Be clear and practical.`;

  const userMessage = `Student: ${studentName}\n\nBelow are the session summaries and feedback (oldest to newest):\n\n${sessionData}`;

  const anthropic = new Anthropic({ apiKey });
  const maxRetries = 3;
  const baseDelayMs = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: CLAUDE_SONNET_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
      const textParts = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text);
      const summary = textParts.length ? textParts.join("\n").trim() : null;
      if (!summary) return { error: "No response from AI." };

      const updateResult = await updateStudentAISummary(studentId, summary);
      if ("error" in updateResult) return { error: updateResult.error };

      revalidatePath(`/dashboard/students/${studentId}`);
      return { summary };
    } catch (err) {
      const status = err && typeof err === "object" && "status" in err ? (err as { status: unknown }).status : null;
      const is429 = status === 429;
      const isLastAttempt = attempt === maxRetries;

      if (is429 && !isLastAttempt) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      if (is429 && isLastAttempt) {
        return {
          error:
            "Anthropic rate limit exceeded. Check usage at https://console.anthropic.com/ or wait a minute and try again.",
        };
      }

      const message = err instanceof Error ? err.message : "Claude API request failed";
      return { error: message };
    }
  }

  return { error: "Claude API request failed after retries." };
}
