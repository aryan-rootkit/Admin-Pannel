/**
 * Path for the people REST resource, relative to {@link getApiBase} (which ends with `/api`).
 * Resolved URL: `…/api/people` — use with `fetchJson`, `apiGet`, etc.
 */
export const API_PEOPLE = "/people" as const;

/** `GET` → `…/api/analytics/profit` */
export const API_ANALYTICS_PROFIT = "/analytics/profit" as const;

/** `GET` → `…/api/analytics/monthly` (optional `?months=12`) */
export const API_ANALYTICS_MONTHLY = "/analytics/monthly" as const;

/** `GET` → `…/api/analytics/finance` */
export const API_ANALYTICS_FINANCE = "/analytics/finance" as const;

/** Personal finance module base path (`/api` prefix via {@link getApiBase}). */
export const API_PERSONAL_FINANCE = "/personal-finance" as const;

/** Browser-safe GET helper — uses NEXT_PUBLIC_API_BASE_URL */
export function getApiBase(): string {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  const trimmed = API.replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    // e.g. http://localhost:5000 → …/api (routes live under /api/*)
    if (url.pathname === "/" || url.pathname === "") {
      return `${url.origin}/api`;
    }
  } catch {
    if (!/\/api$/i.test(trimmed)) return `${trimmed}/api`;
  }
  return trimmed;
}

export async function fetchJson<T>(path: string): Promise<T> {
  const API = getApiBase();
  const url = path.startsWith("/") ? `${API}${path}` : `${API}/${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
