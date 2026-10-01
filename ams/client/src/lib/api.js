export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function cookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : '';
}

const listeners = new Set();
/** Subscribe to auth-related failures (401 / forced password change). */
export const onAuthError = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export async function api(path, { method = 'GET', body, form, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (method !== 'GET') headers['X-CSRF-Token'] = cookie('ams_csrf');
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload, credentials: 'same-origin', signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.');
  }
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const err = new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.details);
    if (res.status === 401 || data?.details?.code === 'PASSWORD_CHANGE_REQUIRED') listeners.forEach((fn) => fn(err));
    throw err;
  }
  return data;
}

export const get = (p, o) => api(p, o);
export const post = (p, body) => api(p, { method: 'POST', body: body ?? {} });
export const put = (p, body) => api(p, { method: 'PUT', body });
export const del = (p) => api(p, { method: 'DELETE' });
export const upload = (p, fields, file) => {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v));
  form.append('file', file);
  return api(p, { method: 'POST', form });
};

/** Downloads a protected file (session cookie) and saves it with the server-provided name. */
export async function download(path, fallbackName = 'download') {
  const res = await fetch(`/api${path}`, { credentials: 'same-origin' });
  if (!res.ok) {
    let msg = `Download failed (${res.status})`;
    try {
      msg = (await res.json()).error || msg;
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, msg);
  }
  const disp = res.headers.get('content-disposition') || '';
  const star = disp.match(/filename\*=UTF-8''([^;]+)/);
  const plain = disp.match(/filename="([^"]+)"/);
  const name = star ? decodeURIComponent(star[1]) : plain ? plain[1] : fallbackName;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Opens a protected PDF/image in a new tab. */
export async function openInNewTab(path) {
  const w = window.open('', '_blank');
  try {
    const res = await fetch(`/api${path}`, { credentials: 'same-origin' });
    if (!res.ok) throw new ApiError(res.status, (await res.json().catch(() => ({}))).error || 'Unable to open file.');
    const blob = await res.blob();
    w.location.href = URL.createObjectURL(blob);
  } catch (e) {
    w?.close();
    throw e;
  }
}

export const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};
