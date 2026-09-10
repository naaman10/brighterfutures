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

export type BftLearnContentItem = {
  name: string;
  entryId: string;
  type: string;
  subject: string;
  ageGroup: string;
};

export type BftLearnContentResponse = {
  filters: {
    type: string[];
    subject: string[];
    ageGroup: string[];
  };
  items: BftLearnContentItem[];
};

export type BftLearnContentFilters = {
  type?: string;
  subject?: string;
  ageGroup?: string;
};

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
  filters: BftLearnContentFilters = {}
): Promise<{ data: BftLearnContentResponse } | { error: string; status?: number; url?: string }> {
  const keyResult = getAdminApiKey();
  if ("error" in keyResult) return keyResult;

  const params = new URLSearchParams();
  if (filters.type?.trim()) params.set("type", filters.type.trim());
  if (filters.subject?.trim()) params.set("subject", filters.subject.trim());
  if (filters.ageGroup?.trim()) params.set("ageGroup", filters.ageGroup.trim());

  const query = params.toString();
  const url = buildBftContentUrl(query);

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
    const data = (await response.json()) as BftLearnContentResponse;
    return {
      data: {
        filters: {
          type: data.filters?.type ?? [],
          subject: data.filters?.subject ?? [],
          ageGroup: data.filters?.ageGroup ?? [],
        },
        items: data.items ?? [],
      },
    };
  } catch (e) {
    console.error("[bft-learn] fetch content invalid JSON:", e);
    return { error: "Invalid response from BFT Learn API." };
  }
}
