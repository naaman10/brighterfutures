import { neon } from "@neondatabase/serverless";

import type { SessionStatus } from "./session-status";
import { SESSION_STATUS_LABELS, SESSION_STATUSES } from "./session-status";

export type { SessionStatus };
export { SESSION_STATUS_LABELS, SESSION_STATUSES };

const sql = neon(process.env.DATABASE_URL!);

export type StudentSummary = {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  start_date: string | null;
  start_time: string | null;
};

export type Parent = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  contact_number: string | null;
  session_rate: number | null;
  child_name: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  students: StudentSummary[];
};

/**
 * Fetches all parents with their students (for accordion display).
 */
export async function getParents(): Promise<Parent[]> {
  const rows = await sql`
    SELECT
      p.id,
      p.first_name,
      p.last_name,
      p.email,
      p.contact_number,
      p.session_rate,
      (
        SELECT string_agg(s.first_name || ' ' || s.last_name, ', ' ORDER BY s.last_name, s.first_name)
        FROM students s
        WHERE s.parent_id = p.id
      ) AS child_name,
      p.created_at,
      p.updated_at,
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', s.id, 'first_name', s.first_name, 'last_name', s.last_name, 'age', s.age, 'start_date', s.start_date, 'start_time', s.start_time) ORDER BY s.last_name, s.first_name)
          FROM students s
          WHERE s.parent_id = p.id
        ),
        '[]'::json
      ) AS students
    FROM parents p
    ORDER BY p.created_at DESC NULLS LAST, p.last_name ASC NULLS LAST, p.first_name ASC NULLS LAST
  `;
  return (rows as (Parent & { students?: string | StudentSummary[] })[]).map((row) => ({
    ...row,
    students: Array.isArray(row.students)
      ? row.students
      : (typeof row.students === "string" ? JSON.parse(row.students) : []) as StudentSummary[],
  })) as Parent[];
}

export type ParentBasic = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  contact_number: string | null;
  session_rate: number | null;
  relationship: string | null;
  secondary_contact_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  town: string | null;
  post_code: string | null;
  emergency_first_name: string | null;
  emergency_last_name: string | null;
  emergency_relation: string | null;
  emergency_contact: string | null;
};

/**
 * Fetches a parent by id (for viewing/editing).
 */
export async function getParentById(id: string): Promise<ParentBasic | null> {
  const rows = await sql`
    SELECT
      id, first_name, last_name, email, contact_number, session_rate,
      relationship, secondary_contact_number,
      address_line_1, address_line_2, town, post_code,
      emergency_first_name, emergency_last_name, emergency_relation, emergency_contact
    FROM parents
    WHERE id = ${id}
  `;
  const row = rows[0];
  return (row as ParentBasic) ?? null;
}

/**
 * Fetches all students for a parent (for parent view page).
 */
export async function getStudentsByParentId(parentId: string): Promise<StudentSummary[]> {
  const rows = await sql`
    SELECT id, first_name, last_name, age, start_date, start_time
    FROM students
    WHERE parent_id = ${parentId}
    ORDER BY last_name ASC NULLS LAST, first_name ASC NULLS LAST
  `;
  return rows as StudentSummary[];
}

export type StudentWithParent = StudentSummary & {
  parent_name: string | null;
};

/**
 * Fetches all students with their parent name (for list display).
 */
export async function getStudents(): Promise<StudentWithParent[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.first_name,
      s.last_name,
      s.age,
      s.start_date,
      s.start_time,
      p.first_name || ' ' || p.last_name AS parent_name
    FROM students s
    LEFT JOIN parents p ON p.id = s.parent_id
    ORDER BY s.last_name ASC NULLS LAST, s.first_name ASC NULLS LAST
  `;
  return rows as StudentWithParent[];
}

export type Invoice = {
  id: number;
  invoice_number: string;
  parents_id: string;
  parent_name: string | null;
  parent_first_name?: string | null;
  parent_email?: string | null;
  billing_month: string | null;
  issued_date: string | null;
  due_date: string | null;
  status: string;
  subtotal: string;
  total: string | null;
  discount_amount: string | null;
  discount_pct: string | null;
  created_at: string | Date | null;
  paid_at: string | Date | null;
};

/**
 * Fetches all invoices with parent name.
 */
export async function getInvoices(): Promise<Invoice[]> {
  const rows = await sql`
    SELECT
      i.id,
      i.invoice_number,
      i.parents_id,
      p.first_name || ' ' || p.last_name AS parent_name,
      i.billing_month,
      i.issued_date,
      i.due_date,
      i.status,
      i.subtotal::text,
      COALESCE(i.total::text, i.subtotal::text) AS total,
      COALESCE(i.discount_amount::text, '0') AS discount_amount,
      COALESCE(i.discount_pct::text, '0') AS discount_pct,
      i.created_at,
      i.paid_at
    FROM invoices i
    LEFT JOIN parents p ON p.id = i.parents_id
    ORDER BY i.created_at DESC NULLS LAST, i.invoice_number DESC
  `;
  return rows as Invoice[];
}

/**
 * Fetches a single invoice by id with parent details.
 */
export async function getInvoiceById(id: number): Promise<Invoice | null> {
  const rows = await sql`
    SELECT
      i.id,
      i.invoice_number,
      i.parents_id,
      p.first_name || ' ' || p.last_name AS parent_name,
      p.first_name AS parent_first_name,
      p.email AS parent_email,
      (i.billing_month::date)::text AS billing_month,
      i.issued_date,
      i.due_date,
      i.status,
      i.subtotal::text,
      COALESCE(i.total::text, i.subtotal::text) AS total,
      COALESCE(i.discount_amount::text, '0') AS discount_amount,
      COALESCE(i.discount_pct::text, '0') AS discount_pct,
      i.created_at,
      i.paid_at
    FROM invoices i
    LEFT JOIN parents p ON p.id = i.parents_id
    WHERE i.id = ${id}
  `;
  const row = rows[0];
  return (row as Invoice) ?? null;
}

/**
 * Returns totals for the next billing month:
 * - billing_month: first day of that month
 * - total_owed: sum of subtotal for all invoices in that month (excluding cancelled)
 * - total_paid: sum of subtotal for invoices in that month with status = 'paid'
 */
export async function getInvoiceTotalsForNextMonth(): Promise<{
  billing_month: string | null;
  total_owed: number;
  total_paid: number;
}> {
  const rows = await sql`
    WITH next_month AS (
      SELECT date_trunc('month', CURRENT_DATE + INTERVAL '1 month')::date AS start_date
    )
    SELECT
      nm.start_date AS billing_month,
      COALESCE(SUM(CASE WHEN i.id IS NOT NULL AND i.status != 'cancelled' THEN i.subtotal ELSE 0 END), 0)::float AS total_owed,
      COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.subtotal ELSE 0 END), 0)::float AS total_paid
    FROM next_month nm
    LEFT JOIN invoices i
      ON i.billing_month >= nm.start_date
     AND i.billing_month < nm.start_date + INTERVAL '1 month'
    GROUP BY nm.start_date
  `;
  const row = rows[0] as {
    billing_month: string | null;
    total_owed: number | null;
    total_paid: number | null;
  };
  return {
    billing_month: row?.billing_month ?? null,
    total_owed: row?.total_owed ?? 0,
    total_paid: row?.total_paid ?? 0,
  };
}

/**
 * Updates an invoice's status (e.g. to "issued" after emailing, or "cancelled").
 */
export async function updateInvoiceStatus(
  id: number,
  status: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`UPDATE invoices SET status = ${status} WHERE id = ${id}`;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Updates an invoice's subtotal and optionally issued_date. Use only for draft invoices.
 */
export async function updateInvoice(
  id: number,
  data: { subtotal: number; issued_date?: string }
): Promise<{ ok: true } | { error: string }> {
  try {
    if (data.issued_date != null) {
      await sql`
        UPDATE invoices SET subtotal = ${data.subtotal}, issued_date = ${data.issued_date}::date WHERE id = ${id}
      `;
    } else {
      await sql`UPDATE invoices SET subtotal = ${data.subtotal} WHERE id = ${id}`;
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Updates an invoice's discount amount and/or percentage. Use only when status is not issued or paid.
 */
export async function updateInvoiceDiscount(
  id: number,
  data: { discount_amount?: number; discount_pct?: number }
): Promise<{ ok: true } | { error: string }> {
  try {
    if (data.discount_amount != null && data.discount_pct != null) {
      await sql`
        UPDATE invoices SET discount_amount = ${data.discount_amount}, discount_pct = ${data.discount_pct} WHERE id = ${id}
      `;
    } else if (data.discount_amount != null) {
      await sql`UPDATE invoices SET discount_amount = ${data.discount_amount} WHERE id = ${id}`;
    } else if (data.discount_pct != null) {
      await sql`UPDATE invoices SET discount_pct = ${data.discount_pct} WHERE id = ${id}`;
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Deletes invoices by id. Returns the number of rows deleted.
 */
export async function deleteInvoices(
  ids: number[]
): Promise<{ ok: true; deleted: number } | { error: string }> {
  if (ids.length === 0) {
    return { ok: true, deleted: 0 };
  }
  try {
    for (const id of ids) {
      await sql`DELETE FROM invoices WHERE id = ${id}`;
    }
    return { ok: true, deleted: ids.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

export type SessionForInvoice = {
  id: string;
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  session_date: string;
  session_time: string;
  subject: string;
  status: SessionStatus;
  session_rate: number | null;
};

/**
 * Fetches sessions for invoice PDF: all sessions for a parent in a billing month
 * (including planned_reschedule, which are shown as no-cost rescheduled sessions).
 */
export async function getSessionsForInvoice(
  parentsId: string,
  billingMonthStart: string
): Promise<SessionForInvoice[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.student_id,
      st.first_name AS student_first_name,
      st.last_name AS student_last_name,
      (s.session_date::date)::text AS session_date,
      s.session_time,
      s.subject,
      s.status,
      p.session_rate
    FROM sessions s
    JOIN students st ON st.id = s.student_id
    JOIN parents p ON p.id = st.parent_id
    WHERE st.parent_id = ${parentsId}
      AND (s.session_date::date) >= (${billingMonthStart}::date)
      AND (s.session_date::date) < (${billingMonthStart}::date + INTERVAL '1 month')
    ORDER BY s.session_date ASC, s.session_time ASC
  `;
  return rows as SessionForInvoice[];
}

export type SessionsByParentForInvoice = {
  parents_id: string;
  parent_first_name: string | null;
  parent_last_name: string | null;
  session_count: number;
  session_rate: number | null;
};

/**
 * Fetches session count and rate for one parent in a given billing month (first day YYYY-MM-DD).
 * Excludes sessions with status 'planned_reschedule'. Returns null if parent has no sessions that month.
 */
export async function getSessionsByParentForMonth(
  parentId: string,
  billingMonthStart: string
): Promise<SessionsByParentForInvoice | null> {
  const rows = await sql`
    SELECT
      st.parent_id AS parents_id,
      p.first_name AS parent_first_name,
      p.last_name AS parent_last_name,
      COUNT(*)::int AS session_count,
      p.session_rate
    FROM sessions s
    JOIN students st ON st.id = s.student_id
    JOIN parents p ON p.id = st.parent_id
    WHERE st.parent_id = ${parentId}
      AND (s.session_date::date) >= (${billingMonthStart}::date)
      AND (s.session_date::date) < (${billingMonthStart}::date + INTERVAL '1 month')
      AND s.status != 'planned_reschedule'
    GROUP BY st.parent_id, p.first_name, p.last_name, p.session_rate
  `;
  const row = rows[0];
  return (row as SessionsByParentForInvoice) ?? null;
}

/**
 * Returns whether an invoice already exists for the given parent and billing month.
 */
export async function hasInvoiceForParentAndMonth(
  parentId: string,
  billingMonthStart: string
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM invoices
    WHERE parents_id = ${parentId}
      AND billing_month = ${billingMonthStart}::date
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Returns the invoice for the given parent and billing month, or null.
 */
export async function getInvoiceByParentAndMonth(
  parentId: string,
  billingMonthStart: string
): Promise<Invoice | null> {
  const rows = await sql`
    SELECT
      i.id,
      i.invoice_number,
      i.parents_id,
      p.first_name || ' ' || p.last_name AS parent_name,
      i.billing_month,
      i.issued_date,
      i.due_date,
      i.status,
      i.subtotal::text,
      COALESCE(i.total::text, i.subtotal::text) AS total,
      COALESCE(i.discount_amount::text, '0') AS discount_amount,
      COALESCE(i.discount_pct::text, '0') AS discount_pct,
      i.created_at,
      i.paid_at
    FROM invoices i
    LEFT JOIN parents p ON p.id = i.parents_id
    WHERE i.parents_id = ${parentId}
      AND i.billing_month = ${billingMonthStart}::date
    LIMIT 1
  `;
  const row = rows[0];
  return (row as Invoice) ?? null;
}

/**
 * Fetches parents with session counts for the given billing month (first day YYYY-MM-DD).
 * Excludes 'planned_reschedule' status. Includes each parent's session_rate (£).
 * Pass the same billing month used for invoice creation so session range matches (avoids
 * timezone mismatch between app and DB).
 */
export async function getSessionsByParentForNextMonth(
  billingMonthStart: string
): Promise<SessionsByParentForInvoice[]> {
  const rows = await sql`
    SELECT
      st.parent_id AS parents_id,
      p.first_name AS parent_first_name,
      p.last_name AS parent_last_name,
      COUNT(*)::int AS session_count,
      p.session_rate
    FROM sessions s
    JOIN students st ON st.id = s.student_id
    JOIN parents p ON p.id = st.parent_id
    WHERE (s.session_date::date) >= (${billingMonthStart}::date)
      AND (s.session_date::date) < (${billingMonthStart}::date + INTERVAL '1 month')
      AND s.status != 'planned_reschedule'
    GROUP BY st.parent_id, p.first_name, p.last_name, p.session_rate
  `;
  return rows as SessionsByParentForInvoice[];
}

export type CreateInvoiceInput = {
  parents_id: string;
  billing_month: string;
  issued_date: string;
  due_date: string;
  subtotal: number;
  discount_amount?: number;
  discount_pct?: number;
};

/**
 * Inserts an invoice. Returns the new invoice id and invoice_number.
 */
export async function createInvoice(
  data: CreateInvoiceInput
): Promise<{ ok: true; id: number; invoice_number: string } | { error: string }> {
  try {
    const discountAmount = data.discount_amount ?? 0;
    const discountPct = data.discount_pct ?? 0;
    const rows = await sql`
      INSERT INTO invoices (parents_id, billing_month, issued_date, due_date, subtotal, discount_amount, discount_pct, tax_pct)
      VALUES (
        ${data.parents_id},
        ${data.billing_month}::date,
        ${data.issued_date}::date,
        ${data.due_date}::date,
        ${data.subtotal},
        ${discountAmount},
        ${discountPct},
        0
      )
      RETURNING id, invoice_number
    `;
    const row = rows[0] as { id: number; invoice_number: string };
    return { ok: true, id: row.id, invoice_number: row.invoice_number };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

export type StudentDetail = {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  start_date: string | null;
  start_time: string | null;
  dob: string | null;
  current_school: string | null;
  current_year_group: string | null;
  sen_needs: string | null;
  exam_board: string | null;
  medical_conditions: string | null;
  medication: string | null;
  collector_name: string | null;
  leave_independantly: boolean | null;
  welcome: boolean;
  welcome_sent_at: string | Date | null;
  ai_summary: string | null;
  ai_summary_updated: string | Date | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  parent_id: string;
  parent_name: string | null;
  parent_first_name: string | null;
  parent_email: string | null;
};

export type Session = {
  id: string;
  student_id: string;
  session_date: string;
  session_time: string;
  subject: string;
  status: SessionStatus;
  summary_markdown: string | null;
  feedback_markdown: string | null;
  feedback_sent_at: string | Date | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

/**
 * Fetches all sessions for a student, newest first.
 */
export async function getSessionsByStudentId(studentId: string): Promise<Session[]> {
  const rows = await sql`
    SELECT
      id,
      student_id,
      (session_date::date)::text AS session_date,
      session_time,
      subject,
      status,
      summary_markdown,
      feedback_markdown,
      feedback_sent_at,
      created_at,
      updated_at
    FROM sessions
    WHERE student_id = ${studentId}
    ORDER BY session_date ASC, session_time ASC
  `;
  return rows as Session[];
}

/**
 * Session with student names for dashboard "sessions today" list.
 */
export type SessionWithStudent = Session & {
  student_first_name: string;
  student_last_name: string;
  student_dob: string | null;
};

/**
 * Fetches all sessions for a calendar month (startDate to endDate inclusive),
 * ordered by session_date, session_time.
 */
export async function getSessionsForMonth(
  startDate: string,
  endDate: string
): Promise<SessionWithStudent[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.student_id,
      (s.session_date::date)::text AS session_date,
      s.session_time,
      s.subject,
      s.status,
      s.summary_markdown,
      s.feedback_markdown,
      s.feedback_sent_at,
      s.created_at,
      s.updated_at,
      st.first_name AS student_first_name,
      st.last_name AS student_last_name,
      (st.dob::date)::text AS student_dob
    FROM sessions s
    JOIN students st ON st.id = s.student_id
    WHERE s.session_date >= ${startDate}::date
      AND s.session_date <= ${endDate}::date
    ORDER BY s.session_date ASC, s.session_time ASC
  `;
  return rows as SessionWithStudent[];
}

/**
 * Fetches all sessions for a given date (YYYY-MM-DD), ordered by session_time.
 */
export async function getSessionsForDate(
  dateStr: string
): Promise<SessionWithStudent[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.student_id,
      (s.session_date::date)::text AS session_date,
      s.session_time,
      s.subject,
      s.status,
      s.summary_markdown,
      s.feedback_markdown,
      s.feedback_sent_at,
      s.created_at,
      s.updated_at,
      st.first_name AS student_first_name,
      st.last_name AS student_last_name,
      (st.dob::date)::text AS student_dob
    FROM sessions s
    JOIN students st ON st.id = s.student_id
    WHERE s.session_date = ${dateStr}
    ORDER BY s.session_time ASC
  `;
  return rows as SessionWithStudent[];
}

/**
 * Fetches all sessions with student names, soonest first (by date then time).
 * Optional status filter: only sessions with this status are returned.
 */
export async function getSessions(status?: string | null): Promise<SessionWithStudent[]> {
  const validStatuses = ["planned", "in_progress", "completed", "rescheduled", "planned_reschedule"] as const;
  const filterStatus =
    status && validStatuses.includes(status as (typeof validStatuses)[number])
      ? status
      : null;

  const rows = filterStatus
    ? await sql`
        SELECT
          s.id,
          s.student_id,
          (s.session_date::date)::text AS session_date,
          s.session_time,
          s.subject,
          s.status,
          s.summary_markdown,
          s.feedback_markdown,
          s.feedback_sent_at,
          s.created_at,
          s.updated_at,
          st.first_name AS student_first_name,
          st.last_name AS student_last_name,
          (st.dob::date)::text AS student_dob
        FROM sessions s
        JOIN students st ON st.id = s.student_id
        WHERE s.status = ${filterStatus}
        ORDER BY s.session_date ASC, s.session_time ASC
      `
    : await sql`
        SELECT
          s.id,
          s.student_id,
          (s.session_date::date)::text AS session_date,
          s.session_time,
          s.subject,
          s.status,
          s.summary_markdown,
          s.feedback_markdown,
          s.feedback_sent_at,
          s.created_at,
          s.updated_at,
          st.first_name AS student_first_name,
          st.last_name AS student_last_name,
          (st.dob::date)::text AS student_dob
        FROM sessions s
        JOIN students st ON st.id = s.student_id
        ORDER BY s.session_date ASC, s.session_time ASC
      `;
  return rows as SessionWithStudent[];
}

/**
 * Fetches a single session by id. Returns null if not found.
 */
export async function getSessionById(sessionId: string): Promise<Session | null> {
  const rows = await sql`
    SELECT id, student_id, session_date, session_time, subject, status, summary_markdown, feedback_markdown, feedback_sent_at, created_at, updated_at
    FROM sessions
    WHERE id = ${sessionId}
  `;
  const row = rows[0];
  return (row as Session) ?? null;
}

/**
 * Updates a session's summary_markdown. Call from session view auto-save.
 */
export async function updateSessionSummary(
  sessionId: string,
  summary_markdown: string | null
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE sessions SET summary_markdown = ${summary_markdown}, updated_at = NOW() WHERE id = ${sessionId}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Updates a session's feedback_markdown. Call from session view auto-save.
 */
export async function updateSessionFeedback(
  sessionId: string,
  feedback_markdown: string | null
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE sessions SET feedback_markdown = ${feedback_markdown}, updated_at = NOW() WHERE id = ${sessionId}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Updates a session's status.
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE sessions SET status = ${status}, updated_at = NOW() WHERE id = ${sessionId}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Sets feedback_sent_at to NOW() after sending feedback email. Call only after SendGrid success.
 */
export async function updateSessionFeedbackSentAt(
  sessionId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE sessions SET feedback_sent_at = NOW(), updated_at = NOW() WHERE id = ${sessionId}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

export type CreateSessionInput = {
  student_id: string;
  session_date: string;
  session_time: string;
  subject: string;
  status?: SessionStatus;
};

/**
 * Inserts a single session.
 */
export async function createSession(
  data: CreateSessionInput
): Promise<{ ok: true } | { error: string }> {
  const status = data.status ?? "planned";
  try {
    await sql`
      INSERT INTO sessions (student_id, session_date, session_time, subject, status)
      VALUES (${data.student_id}, ${data.session_date}, ${data.session_time}, ${data.subject}, ${status})
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Fetches a single student by id with parent info for the detail view.
 */
export async function getStudentById(
  id: string
): Promise<StudentDetail | null> {
  const rows = await sql`
    SELECT
      s.id,
      s.first_name,
      s.last_name,
      s.age,
      s.start_date,
      s.start_time,
      (s.dob::date)::text AS dob,
      s.current_school,
      s.current_year_group,
      s.sen_needs,
      s.exam_board,
      s.medical_conditions,
      s.medication,
      s.collector_name,
      s.leave_independantly,
      s.welcome,
      s.welcome_sent_at,
      s.ai_summary,
      s.ai_summary_updated,
      s.created_at,
      s.updated_at,
      s.parent_id,
      p.first_name || ' ' || p.last_name AS parent_name,
      p.first_name AS parent_first_name,
      p.email AS parent_email
    FROM students s
    JOIN parents p ON p.id = s.parent_id
    WHERE s.id = ${id}
  `;
  const row = rows[0];
  return (row as StudentDetail) ?? null;
}

/**
 * Updates a student's ai_summary (e.g. after generating from Claude).
 */
export async function updateStudentAISummary(
  id: string,
  ai_summary: string | null
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE students SET ai_summary = ${ai_summary}, ai_summary_updated = NOW(), updated_at = NOW() WHERE id = ${id}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Marks a student's welcome email as sent (welcome = TRUE, welcome_sent_at = NOW()).
 * Call only after SendGrid returns success.
 */
export async function setStudentWelcomeSent(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE students SET welcome = TRUE, welcome_sent_at = NOW(), updated_at = NOW() WHERE id = ${id}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Updates welcome_sent_at to NOW() (e.g. after resending the welcome email).
 * Call only after SendGrid returns success.
 */
export async function updateStudentWelcomeSentAt(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE students SET welcome_sent_at = NOW(), updated_at = NOW() WHERE id = ${id}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

export type UpdateStudentInput = {
  first_name: string;
  last_name: string;
  age?: number | null;
  start_date?: string | null;
  start_time?: string | null;
  dob?: string | null;
  current_school?: string | null;
  current_year_group?: string | null;
  sen_needs?: string | null;
  exam_board?: string | null;
  medical_conditions?: string | null;
  medication?: string | null;
  collector_name?: string | null;
  leave_independantly?: boolean | null;
};

/**
 * Updates a student by id.
 */
export async function updateStudent(
  id: string,
  data: UpdateStudentInput
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE students
      SET
        first_name = ${data.first_name},
        last_name = ${data.last_name},
        age = ${data.age ?? null},
        start_date = ${data.start_date ?? null},
        start_time = ${data.start_time ?? null},
        dob = ${data.dob ?? null}::date,
        current_school = ${data.current_school ?? null},
        current_year_group = ${data.current_year_group ?? null},
        sen_needs = ${data.sen_needs ?? null},
        exam_board = ${data.exam_board ?? null},
        medical_conditions = ${data.medical_conditions ?? null},
        medication = ${data.medication ?? null},
        collector_name = ${data.collector_name ?? null},
        leave_independantly = ${data.leave_independantly ?? null},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

export type CreateParentInput = {
  first_name: string;
  last_name: string;
  email: string;
  contact_number?: string | null;
  session_rate?: number | null;
};

export type UpdateParentInput = {
  first_name: string;
  last_name: string;
  email: string;
  contact_number?: string | null;
  session_rate?: number | null;
  relationship?: string | null;
  secondary_contact_number?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  town?: string | null;
  post_code?: string | null;
  emergency_first_name?: string | null;
  emergency_last_name?: string | null;
  emergency_relation?: string | null;
  emergency_contact?: string | null;
};

export type CreateStudentInput = {
  first_name: string;
  last_name: string;
  age?: number | null;
  start_date?: string | null;
  start_time?: string | null;
};

/**
 * Inserts a parent and returns the new parent's id.
 */
export async function createParent(data: CreateParentInput): Promise<{ id: string } | { error: string }> {
  try {
    const rows = await sql`
      INSERT INTO parents (first_name, last_name, email, contact_number, session_rate)
      VALUES (${data.first_name}, ${data.last_name}, ${data.email}, ${data.contact_number ?? null}, ${data.session_rate ?? null})
      RETURNING id
    `;
    const row = rows[0] as { id: string } | undefined;
    if (!row?.id) return { error: "Failed to create parent" };
    return { id: row.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Updates a parent's details.
 */
export async function updateParent(
  id: string,
  data: UpdateParentInput
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      UPDATE parents
      SET
        first_name = ${data.first_name},
        last_name = ${data.last_name},
        email = ${data.email},
        contact_number = ${data.contact_number ?? null},
        session_rate = ${data.session_rate ?? null},
        relationship = ${data.relationship ?? null},
        secondary_contact_number = ${data.secondary_contact_number ?? null},
        address_line_1 = ${data.address_line_1 ?? null},
        address_line_2 = ${data.address_line_2 ?? null},
        town = ${data.town ?? null},
        post_code = ${data.post_code ?? null},
        emergency_first_name = ${data.emergency_first_name ?? null},
        emergency_last_name = ${data.emergency_last_name ?? null},
        emergency_relation = ${data.emergency_relation ?? null},
        emergency_contact = ${data.emergency_contact ?? null},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}

/**
 * Inserts a student linked to a parent.
 */
export async function createStudent(
  parentId: string,
  data: CreateStudentInput
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      INSERT INTO students (parent_id, first_name, last_name, age, start_date, start_time)
      VALUES (${parentId}, ${data.first_name}, ${data.last_name}, ${data.age ?? null}, ${data.start_date ?? null}, ${data.start_time ?? null})
    `;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { error: message };
  }
}
