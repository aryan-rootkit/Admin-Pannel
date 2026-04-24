import { getApiBase } from "./fetchApi";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  let message = `Request failed: ${res.status}`;
  const body = await parseJsonSafe(res);
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message?: string }).message;
    if (m) message = m;
  }
  throw new ApiError(message, res.status);
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, { cache: "no-store" });
  await throwIfNotOk(res);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return (await res.json()) as T;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return (await res.json()) as T;
}

export async function apiDelete<T = { ok: boolean }>(path: string): Promise<T> {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${base}${p}`, { method: "DELETE" });
  await throwIfNotOk(res);
  return (await res.json()) as T;
}
