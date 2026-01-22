export async function apiRequest(method, url, accessToken, body = null) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  if (body !== null) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body)
  });

  // Many player endpoints return 204 No Content on success
  if (res.status === 204) return { ok: true, status: 204, data: null };

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg =
      (data && data.error && (data.error.message || data.error.reason)) ||
      (typeof data === "string" ? data : `HTTP ${res.status}`);
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return { ok: true, status: res.status, data };
}
