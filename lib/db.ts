import { neon } from "@neondatabase/serverless";

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

export type StudentDetail = {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  start_date: string | null;
  start_time: string | null;
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
    SELECT id, student_id, session_date, session_time, subject, summary_markdown, feedback_markdown, feedback_sent_at, created_at, updated_at
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
};

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
      s.session_date,
      s.session_time,
      s.subject,
      s.summary_markdown,
      s.feedback_markdown,
      s.feedback_sent_at,
      s.created_at,
      s.updated_at,
      st.first_name AS student_first_name,
      st.last_name AS student_last_name
    FROM sessions s
    JOIN students st ON st.id = s.student_id
    WHERE s.session_date = ${dateStr}
    ORDER BY s.session_time ASC
  `;
  return rows as SessionWithStudent[];
}

/**
 * Fetches a single session by id. Returns null if not found.
 */
export async function getSessionById(sessionId: string): Promise<Session | null> {
  const rows = await sql`
    SELECT id, student_id, session_date, session_time, subject, summary_markdown, feedback_markdown, feedback_sent_at, created_at, updated_at
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
};

/**
 * Inserts a single session.
 */
export async function createSession(
  data: CreateSessionInput
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql`
      INSERT INTO sessions (student_id, session_date, session_time, subject)
      VALUES (${data.student_id}, ${data.session_date}, ${data.session_time}, ${data.subject})
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
      SET first_name = ${data.first_name}, last_name = ${data.last_name}, age = ${data.age ?? null}, start_date = ${data.start_date ?? null}, start_time = ${data.start_time ?? null}, updated_at = NOW()
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
      INSERT INTO parents (first_name, last_name, email, contact_number)
      VALUES (${data.first_name}, ${data.last_name}, ${data.email}, ${data.contact_number ?? null})
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
