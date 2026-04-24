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
