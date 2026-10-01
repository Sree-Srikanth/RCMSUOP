// src/services/applicationApi.ts
// Client for the application-module PHP endpoints (backend/api/*).
// Configure with Vite env vars (fallbacks match the existing XAMPP layout):
//   VITE_APPLICATION_API_BASE = http://localhost/application-management-system/backend/application-module/api
//   VITE_FILE_BASE_URL        = http://localhost/application-management-system/backend/

import type { VacancyInfo } from "../app/(other)/apply/types";

const env = (import.meta as any).env || {};

export const FILE_BASE_URL: string = (
  env.VITE_FILE_BASE_URL || "http://localhost/application-management-system/backend/"
).replace(/\/?$/, "/");

export const APPLICATION_API_BASE: string = (
  env.VITE_APPLICATION_API_BASE || `${FILE_BASE_URL}application-module/api`
).replace(/\/$/, "");

/** Route paths used by the module — change here if your router differs. */
export const ROUTES = {
  vacancies: env.VITE_VACANCIES_PATH || "/other/vacancies",
  login: env.VITE_LOGIN_PATH || "/login",
  home: env.VITE_HOME_PATH || "/other/home",
  apply: "/apply",
};

export const fileUrl = (path: string) =>
  !path ? "" : /^(https?:|blob:|data:)/.test(path) ? path : `${FILE_BASE_URL}${path.replace(/^\//, "")}`;

// ─── auth helpers (match the existing app's localStorage usage) ─────────────

export const getStoredUser = (): { id: number; email?: string; role?: string } | null => {
  try {
    const raw = localStorage.getItem("userData");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u && u.id ? { ...u, id: Number(u.id) } : null;
  } catch {
    return null;
  }
};

const getToken = (): string | null => {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("university_token")
    );
  } catch {
    return null;
  }
};

export const isLoggedIn = () => getStoredUser() !== null;

const authHeaders = (): Record<string, string> => {
  const h: Record<string, string> = {};
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  const user = getStoredUser();
  if (user) h["X-User-Id"] = String(user.id);
  return h;
};

export interface ApiResult<T = unknown> {
  success: boolean;
  error?: string;
  code?: string;
  data?: T;
  [k: string]: any;
}

async function request<T = any>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { ...authHeaders(), ...(init.headers as any) };
  let body = init.body;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  try {
    const res = await fetch(`${APPLICATION_API_BASE}/${path}`, {
      ...init,
      headers,
      body,
      credentials: "include",
    });
    const text = await res.text();
    let parsed: any;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      return { success: false, error: `Unexpected server response (${res.status}).` };
    }
    if (!res.ok && parsed.success === undefined) parsed.success = false;
    return parsed;
  } catch {
    return { success: false, error: "Network error — check your connection.", code: "network" };
  }
}

// ─── vacancies ───────────────────────────────────────────────────────────────

export const getVacancyStatus = (vacancyId: number) =>
  request<VacancyInfo>(`vacancies/status.php?vacancy_id=${vacancyId}`);

/** Preview of the next advertisement reference no. (admin, New Advertisement form). */
export const getNextVacancyReference = () =>
  request<{ reference_no: string }>("vacancies/next_reference.php");

/** Search vacancies AND applications by reference no. (admin). */
export const searchByReference = (q: string) =>
  request<{
    vacancies: Array<{ vacancy_id: number; reference_no: string; title: string; closing_date: string | null }>;
    applications: Array<{
      application_id: number;
      reference_no: string;
      applicant_name: string;
      vacancy_title: string;
      status: string;
      submitted_at: string | null;
    }>;
  }>(`references/search.php?q=${encodeURIComponent(q)}`);

// ─── applications ────────────────────────────────────────────────────────────

export const getMyApplication = (vacancyId: number) =>
  request<any>(`applications/get.php?vacancy_id=${vacancyId}`);

export interface SavePayload {
  application_id: number | null;
  vacancy_id: number;
  selected_job: string;
  current_step: number;
  form_data: unknown;
}

export const saveDraft = (payload: SavePayload, opts: { keepalive?: boolean } = {}) =>
  request<{ application_id: number; reference_no: string; updated_at: string }>(
    "applications/save.php",
    { method: "POST", json: payload, keepalive: opts.keepalive },
  );

export const uploadDocument = (
  vacancyId: number,
  documentKey: string,
  file: File,
): Promise<ApiResult<{ path: string; name: string }>> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("document_key", documentKey);
  fd.append("vacancy_id", String(vacancyId));
  return request("applications/upload.php", { method: "POST", body: fd });
};

export const submitApplication = (applicationId: number, pdf: Blob) => {
  const fd = new FormData();
  fd.append("application_id", String(applicationId));
  fd.append("pdf", pdf, "application.pdf");
  return request<{
    reference_no: string;
    submitted_at: string;
    pdf_path: string;
    emails: { applicant: boolean; referees_sent: number; referees_total: number };
  }>("applications/submit.php", { method: "POST", body: fd });
};

// ─── "Apply Online" intent (blocks direct-URL access to /apply) ──────────────

const INTENT_KEY = "applyIntent";
const INTENT_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Call this from the "Apply Online" button on the vacancies page:
 *   <button onClick={() => startApplication(navigate, vacancy.vacancy_id)}>Apply Online</button>
 * It records that the user came from the vacancy list, then the ApplyGuard
 * sends them to login (if needed) and back to the form.
 */
export const startApplication = (navigate: (to: string) => void, vacancyId: number) => {
  try {
    sessionStorage.setItem(INTENT_KEY, JSON.stringify({ vacancyId, at: Date.now() }));
  } catch {
    /* storage blocked — guard falls back to "existing draft" check */
  }
  navigate(`${ROUTES.apply}?vacancyId=${vacancyId}`);
};

export const hasApplyIntent = (vacancyId: number): boolean => {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return false;
    const { vacancyId: v, at } = JSON.parse(raw);
    return Number(v) === vacancyId && Date.now() - Number(at) < INTENT_TTL_MS;
  } catch {
    return false;
  }
};

export const rememberRedirectAfterLogin = (path: string) => {
  try {
    localStorage.setItem("redirectAfterLogin", path);
  } catch {
    /* ignore */
  }
};
