"use server";

import { revalidatePath } from "next/cache";
import type { SessionStatus } from "@/lib/db";
import {
  createSession,
  getSessionById,
  getStudentById,
  updateSessionFeedback,
  updateSessionFeedbackSentAt,
  updateSessionStatus,
  updateSessionSummary,
} from "@/lib/db";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";
import { sendTemplate } from "@/lib/email";

const FEEDBACK_TEMPLATE_ID = "d-21f0024fd59847d48961a61b7ed33c22";

export async function saveSessionSummaryAction(
  sessionId: string,
  studentId: string,
  summaryMarkdown: string | null
): Promise<{ error?: string }> {
  const result = await updateSessionSummary(sessionId, summaryMarkdown);
  if ("error" in result) return { error: result.error };
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/students/${studentId}/sessions/${sessionId}`);
  return {};
}

export async function updateSessionStatusAction(
  sessionId: string,
  studentId: string,
  status: SessionStatus
): Promise<{ error?: string }> {
  const result = await updateSessionStatus(sessionId, status);
  if ("error" in result) return { error: result.error };
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/students/${studentId}/sessions/${sessionId}`);
  return {};
}

export async function saveSessionFeedbackAction(
  sessionId: string,
  studentId: string,
  feedbackMarkdown: string | null
): Promise<{ error?: string }> {
  const result = await updateSessionFeedback(sessionId, feedbackMarkdown);
  if ("error" in result) return { error: result.error };
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/students/${studentId}/sessions/${sessionId}`);
  return {};
}

export async function sendSessionFeedbackEmailAction(
  sessionId: string,
  studentId: string
): Promise<{ error?: string }> {
  const [session, student] = await Promise.all([
    getSessionById(sessionId),
    getStudentById(studentId),
  ]);
  if (!session || !student || session.student_id !== studentId) {
    return { error: "Session or student not found" };
  }
  const feedback = (session.feedback_markdown ?? "").trim();
  const parentEmail = (student.parent_email ?? "").trim();
  const parentName = (student.parent_first_name ?? "").trim() || (student.parent_name ?? "").trim();
  if (!feedback) return { error: "Add feedback before sending." };
  if (!parentEmail) return { error: "Parent has no email address." };
  if (!parentName) return { error: "Parent name is required." };

  const result = await sendTemplate({
    to: parentEmail,
    templateId: FEEDBACK_TEMPLATE_ID,
    dynamicTemplateData: {
      parent_name: parentName,
      student_first_name: student.first_name?.trim() ?? "",
      student_last_name: student.last_name?.trim() ?? "",
      session_date: formatDisplayDate(session.session_date),
      session_time: formatDisplayTime(session.session_time),
      session_feedback: feedback,
    },
  });

  if (!result.success) return { error: result.error };

  const updateResult = await updateSessionFeedbackSentAt(sessionId);
  if ("error" in updateResult) return { error: updateResult.error };

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/students/${studentId}/sessions/${sessionId}`);
  return {};
}

export async function rescheduleSessionAction(
  sessionId: string,
  studentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSessionById(sessionId);
  if (!session || session.student_id !== studentId) {
    return { error: "Session not found." };
  }
  if (session.status === "rescheduled" || session.status === "planned_reschedule") {
    return { error: "This session is already rescheduled." };
  }

  const session_date = (formData.get("session_date") as string)?.trim();
  const session_time = (formData.get("session_time") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim() || session.subject;

  if (!session_date || !session_time) {
    return { error: "Date and time are required for the new session." };
  }

  const updateResult = await updateSessionStatus(sessionId, "rescheduled");
  if ("error" in updateResult) return { error: updateResult.error };

  const createResult = await createSession({
    student_id: studentId,
    session_date,
    session_time,
    subject,
    status: "planned_reschedule",
  });
  if ("error" in createResult) {
    return { error: "Original session marked rescheduled but failed to create new session." };
  }

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/students/${studentId}/sessions/${sessionId}`);
  return {};
}
