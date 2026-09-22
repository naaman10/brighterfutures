function getBftApiBaseUrl(): string {
  return process.env.BFT_API_BASE_URL?.trim().replace(/\/$/, "") ?? "https://bft-api.onrender.com";
}

function buildBftContentUrl(query: string): string {
  const base = getBftApiBaseUrl();
  if (base.endsWith("/admin/content")) {
    return query ? `${base}?${query}` : base;
  }
  return `${base}/admin/content${query ? `?${query}` : ""}`;
}

function buildBftAdminUrl(path: string): string {
  const base = getBftApiBaseUrl();
  if (base.endsWith("/admin/content")) {
    return `${base.replace(/\/admin\/content$/, "")}${path}`;
  }
  return `${base}${path}`;
}

export type BftLearnProgressStatus =
  | "not_started"
  | "in_progress"
  | "to_assess"
  | "completed"
  | "assessed";

export type BftLearnContentItem = {
  name: string;
  entryId: string;
  type: string;
  subject: string;
  ageGroup: string;
};

export type BftLearnEnrollment = {
  id: string;
  entryId: string;
  name: string;
  type: string;
  subject: string;
  ageGroup: string;
  status: string;
  progressStatus: string;
};

export type BftLearnReviewQuestion = {
  questionId: string;
  questionContent: Record<string, unknown>;
  studentAnswer: unknown;
  correctAnswer: unknown;
  points: number;
  status: string;
  updatedAt?: string;
  completedAt?: string;
};

export type BftLearnReview = {
  enrollment: {
    id: string;
    studentId: string;
    contentId: string;
    status: string;
    progressStatus: string;
    enrolledAt: string;
    startedAt: string | null;
    completedAt: string | null;
    lastActivityAt: string | null;
  };
  student: {
    id: string;
    name: string;
    email: string;
  } | null;
  content: {
    entryId: string;
    name: string;
    type: string;
    subject: string;
    ageGroup: string;
    stage: string;
    requiresAssessment: boolean;
  };
  sections: unknown[];
  questions: BftLearnReviewQuestion[];
};

export type BftLearnContentResponse = {
  filters: {
    type: string[];
    subject: string[];
    ageGroup: string[];
  };
  items: BftLearnContentItem[];
  enrollments: BftLearnEnrollment[];
};

export type BftLearnContentFilters = {
  type?: string;
  subject?: string;
  ageGroup?: string;
};

export type BftLearnContentQuery = BftLearnContentFilters & {
  studentId?: string;
};

export const BFT_LEARN_PROGRESS_STATUS_LABELS: Record<BftLearnProgressStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  to_assess: "To assess",
  completed: "Completed",
  assessed: "Assessed",
};

export function bftLearnProgressStatusLabel(status: string): string {
  return (
    BFT_LEARN_PROGRESS_STATUS_LABELS[status as BftLearnProgressStatus] ??
    status.replaceAll("_", " ")
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function bftLearnReviewAdminUserId(userId: string | undefined): string {
  if (userId && UUID_RE.test(userId)) return userId;
  return "00000000-0000-4000-8000-000000000001";
}

function parseEnrollment(value: unknown): BftLearnEnrollment | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const entryId = asString(raw.entryId).trim() || asString(raw.contentId).trim();
  if (!entryId) return null;

  return {
    id: asString(raw.id).trim() || asString(raw.enrollmentId).trim(),
    entryId,
    name: asString(raw.name),
    type: asString(raw.type),
    subject: asString(raw.subject),
    ageGroup: asString(raw.ageGroup),
    status: asString(raw.status) || "enrolled",
    progressStatus: asString(raw.progressStatus) || "not_started",
  };
}

export function parseBftLearnEnrollments(value: unknown): BftLearnEnrollment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const enrollment = parseEnrollment(item);
    return enrollment ? [enrollment] : [];
  });
}

function getAdminApiKey(): { apiKey: string } | { error: string } {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    return { error: "ADMIN_API_KEY is not set. Add it in environment variables." };
  }
  return { apiKey };
}

async function parseBftApiError(response: Response): Promise<string> {
  let message = `BFT Learn API error (${response.status})`;
  const responseText = await response.text();
  try {
    const data = JSON.parse(responseText) as { error?: unknown; message?: unknown };
    if (typeof data.error === "string" && data.error.trim()) {
      message = data.error;
    } else if (typeof data.message === "string" && data.message.trim()) {
      message = data.message;
    } else if (responseText.trim()) {
      message = responseText.trim();
    }
  } catch {
    if (responseText.trim()) message = responseText.trim();
  }

  if (response.status === 401 && message.startsWith("BFT Learn API error")) {
    return "Invalid or missing admin API key.";
  }
  if (response.status === 503 && message.startsWith("BFT Learn API error")) {
    return "Contentful is not configured on the BFT Learn API.";
  }

  return message;
}

export async function createBftLearnAccount(params: {
  studentId: string;
  email: string;
  name: string;
}): Promise<{ ok: true } | { error: string }> {
  const keyResult = getAdminApiKey();
  if ("error" in keyResult) return keyResult;

  let response: Response;
  try {
    response = await fetch(buildBftAdminUrl("/admin/user/create"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Api-Key": keyResult.apiKey,
      },
      body: JSON.stringify({
        studentId: params.studentId,
        email: params.email,
        name: params.name,
      }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    console.error("[bft-learn] create account request failed:", e);
    return { error: message };
  }

  if (!response.ok) {
    const message = await parseBftApiError(response);
    console.error("[bft-learn] create account failed:", response.status, message);
    return { error: message };
  }

  return { ok: true };
}

export async function enrollStudentInContent(params: {
  studentId: string;
  contentIds: string[];
}): Promise<{ ok: true } | { error: string; status?: number }> {
  const keyResult = getAdminApiKey();
  if ("error" in keyResult) return keyResult;

  const studentId = params.studentId.trim();
  const contentIds = params.contentIds.map((id) => id.trim()).filter(Boolean);
  if (!studentId) return { error: "Student ID is required." };
  if (contentIds.length === 0) return { error: "At least one content ID is required." };

  const url = buildBftAdminUrl(`/admin/enroll/${encodeURIComponent(studentId)}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Api-Key": keyResult.apiKey,
      },
      body: JSON.stringify({ contentIds }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    console.error("[bft-learn] enroll request failed:", e);
    return { error: message };
  }

  if (!response.ok) {
    const message = await parseBftApiError(response);
    console.error("[bft-learn] enroll failed:", response.status, url, message);
    return { error: message, status: response.status };
  }

  return { ok: true };
}

export async function getBftLearnContent(
  query: BftLearnContentQuery = {}
): Promise<{ data: BftLearnContentResponse } | { error: string; status?: number; url?: string }> {
  const keyResult = getAdminApiKey();
  if ("error" in keyResult) return keyResult;

  const params = new URLSearchParams();
  if (query.studentId?.trim()) params.set("studentId", query.studentId.trim());
  if (query.type?.trim()) params.set("type", query.type.trim());
  if (query.subject?.trim()) params.set("subject", query.subject.trim());
  if (query.ageGroup?.trim()) params.set("ageGroup", query.ageGroup.trim());

  const search = params.toString();
  const url = buildBftContentUrl(search);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Admin-Api-Key": keyResult.apiKey,
      },
      cache: "no-store",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    console.error("[bft-learn] fetch content request failed:", e);
    return { error: message };
  }

  if (!response.ok) {
    const message = await parseBftApiError(response);
    console.error("[bft-learn] fetch content failed:", {
      status: response.status,
      url,
      baseUrl: getBftApiBaseUrl(),
      message,
    });
    return { error: message, status: response.status, url };
  }

  try {
    const data = (await response.json()) as Partial<BftLearnContentResponse>;
    return {
      data: {
        filters: {
          type: data.filters?.type ?? [],
          subject: data.filters?.subject ?? [],
          ageGroup: data.filters?.ageGroup ?? [],
        },
        items: data.items ?? [],
        enrollments: parseBftLearnEnrollments(data.enrollments),
      },
    };
  } catch (e) {
    console.error("[bft-learn] fetch content invalid JSON:", e);
    return { error: "Invalid response from BFT Learn API." };
  }
}

export async function getBftLearnEnrollment(
  studentId: string,
  entryId: string
): Promise<
  | { enrollment: BftLearnEnrollment }
  | { error: string; status?: number }
  | { notFound: true }
> {
  const result = await getBftLearnContent({ studentId });
  if ("error" in result) {
    return { error: result.error, status: result.status };
  }

  const enrollment = result.data.enrollments.find((item) => item.entryId === entryId);
  if (!enrollment) return { notFound: true };
  return { enrollment };
}

function parseReviewQuestion(value: unknown): BftLearnReviewQuestion | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const questionId = asString(raw.questionId).trim();
  if (!questionId) return null;

  return {
    questionId,
    questionContent: asRecord(raw.questionContent) ?? {},
    studentAnswer: raw.studentAnswer,
    correctAnswer: raw.correctAnswer,
    points: typeof raw.points === "number" ? raw.points : 0,
    status: asString(raw.status),
    updatedAt: asString(raw.updatedAt) || undefined,
    completedAt: asString(raw.completedAt) || undefined,
  };
}

function collectSectionQuestions(value: unknown, seen: Set<string>): BftLearnReviewQuestion[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSectionQuestions(item, seen));
  }

  const record = asRecord(value);
  if (!record) return [];

  const contentType = asString(record.contentType);
  const entryId = asString(record.entryId).trim();
  const fields = asRecord(record.fields);
  const collected: BftLearnReviewQuestion[] = [];

  if (
    fields &&
    entryId &&
    !seen.has(entryId) &&
    (contentType === "question" || contentType === "questionMultipleChoice")
  ) {
    seen.add(entryId);
    collected.push({
      questionId: entryId,
      questionContent: fields,
      studentAnswer: undefined,
      correctAnswer: fields.answer,
      points: typeof fields.points === "number" ? fields.points : 0,
      status: "",
    });
  }

  for (const child of Object.values(fields ?? record)) {
    collected.push(...collectSectionQuestions(child, seen));
  }

  return collected;
}

function parseReview(value: unknown): BftLearnReview | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const enrollmentRaw = asRecord(raw.enrollment);
  const contentRaw = asRecord(raw.content);
  const enrollmentId = asString(enrollmentRaw?.id).trim();
  const contentId =
    asString(contentRaw?.entryId).trim() || asString(enrollmentRaw?.contentId).trim();
  if (!enrollmentId || !contentId) return null;

  const studentRaw = asRecord(raw.student);
  const questions = Array.isArray(raw.questions)
    ? raw.questions.flatMap((item) => {
        const question = parseReviewQuestion(item);
        return question ? [question] : [];
      })
    : [];
  const seen = new Set(questions.map((question) => question.questionId));
  const sectionQuestions = collectSectionQuestions(raw.sections, seen);

  return {
    enrollment: {
      id: enrollmentId,
      studentId: asString(enrollmentRaw?.studentId),
      contentId: asString(enrollmentRaw?.contentId) || contentId,
      status: asString(enrollmentRaw?.status),
      progressStatus: asString(enrollmentRaw?.progressStatus),
      enrolledAt: asString(enrollmentRaw?.enrolledAt),
      startedAt: enrollmentRaw?.startedAt == null ? null : asString(enrollmentRaw.startedAt),
      completedAt:
        enrollmentRaw?.completedAt == null ? null : asString(enrollmentRaw.completedAt),
      lastActivityAt:
        enrollmentRaw?.lastActivityAt == null ? null : asString(enrollmentRaw.lastActivityAt),
    },
    student: studentRaw
      ? {
          id: asString(studentRaw.id),
          name: asString(studentRaw.name),
          email: asString(studentRaw.email),
        }
      : null,
    content: {
      entryId: contentId,
      name: asString(contentRaw?.name),
      type: asString(contentRaw?.type),
      subject: asString(contentRaw?.subject),
      ageGroup: asString(contentRaw?.ageGroup),
      stage: asString(contentRaw?.stage),
      requiresAssessment: contentRaw?.requiresAssessment === true,
    },
    sections: Array.isArray(raw.sections) ? raw.sections : [],
    questions: [...questions, ...sectionQuestions],
  };
}

function richTextToPlain(value: unknown): string {
  const record = asRecord(value);
  if (!record) return "";
  if (typeof record.value === "string") return record.value;
  if (Array.isArray(record.content)) {
    return record.content.map(richTextToPlain).filter(Boolean).join(" ").trim();
  }
  return "";
}

export function formatBftReviewValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatBftReviewValue).filter(Boolean).join(", ");
  }

  const record = asRecord(value);
  if (!record) return "";
  if (record.nodeType === "document" || Array.isArray(record.content)) {
    const text = richTextToPlain(record);
    if (text) return text;
  }
  for (const key of ["label", "text", "value", "name", "title", "questionText"]) {
    const inner = formatBftReviewValue(record[key]);
    if (inner) return inner;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function bftLearnQuestionPrompt(fields: Record<string, unknown>): string {
  for (const key of ["questionText", "question", "prompt", "text", "title", "name"]) {
    const text = formatBftReviewValue(fields[key]);
    if (text) return text;
  }
  return "";
}

export async function getBftLearnReview(
  enrollmentId: string,
  adminUserId: string
): Promise<{ data: BftLearnReview } | { error: string; status?: number; url?: string }> {
  const keyResult = getAdminApiKey();
  if ("error" in keyResult) return keyResult;
  const apiKey = keyResult.apiKey;

  const id = enrollmentId.trim();
  if (!id) return { error: "Enrollment ID is required." };
  if (!UUID_RE.test(id)) return { error: "Invalid enrollment ID." };

  const reviewerId = UUID_RE.test(adminUserId)
    ? adminUserId
    : bftLearnReviewAdminUserId(adminUserId);
  const url = buildBftAdminUrl(`/admin/review/${encodeURIComponent(id)}`);

  async function request(includeBody: boolean): Promise<Response> {
    return fetch(url, {
      method: "GET",
      headers: {
        "X-Admin-Api-Key": apiKey,
        ...(includeBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(includeBody ? { body: JSON.stringify({ adminUserId: reviewerId }) } : {}),
      cache: "no-store",
    });
  }

  let response: Response;
  try {
    response = await request(true);
    if (response.status === 400) {
      const retry = await request(false);
      if (retry.ok) response = retry;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    console.error("[bft-learn] fetch review request failed:", e);
    return { error: message };
  }

  if (!response.ok) {
    const message = await parseBftApiError(response);
    console.error("[bft-learn] fetch review failed:", {
      status: response.status,
      url,
      message,
    });
    return { error: message, status: response.status, url };
  }

  try {
    const parsed = parseReview(await response.json());
    if (!parsed) return { error: "Invalid response from BFT Learn API." };
    return { data: parsed };
  } catch (e) {
    console.error("[bft-learn] fetch review invalid JSON:", e);
    return { error: "Invalid response from BFT Learn API." };
  }
}
