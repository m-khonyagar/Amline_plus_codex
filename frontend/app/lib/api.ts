export function apiBaseUrl(): string {
  // Browser-safe: default to localhost.
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:18000";
}

type Tokens = {
  access_token: string;
  refresh_token: string;
};

const ACCESS_KEY = "amline_access";
const REFRESH_KEY = "amline_refresh";

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  const access = localStorage.getItem(ACCESS_KEY);
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!access || !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

export function setTokens(t: Tokens) {
  localStorage.setItem(ACCESS_KEY, t.access_token);
  localStorage.setItem(REFRESH_KEY, t.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshToken(): Promise<string | null> {
  const t = getTokens();
  if (!t) return null;

  const r = await fetch(`${apiBaseUrl()}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: t.refresh_token })
  });

  if (!r.ok) return null;
  const data = (await r.json()) as Tokens;
  setTokens(data);
  return data.access_token;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBaseUrl()}${path}`;
  const tokens = getTokens();

  const headers = new Headers(init?.headers || undefined);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");
  if (tokens?.access_token) headers.set("Authorization", `Bearer ${tokens.access_token}`);

  const r1 = await fetch(url, { ...init, headers });
  if (r1.status !== 401) {
    if (!r1.ok) throw new Error(await r1.text());
    return (await r1.json()) as T;
  }

  // Try refresh once.
  const newAccess = await refreshToken();
  if (!newAccess) {
    clearTokens();
    throw new Error("unauthorized");
  }

  headers.set("Authorization", `Bearer ${newAccess}`);
  const r2 = await fetch(url, { ...init, headers });
  if (!r2.ok) throw new Error(await r2.text());
  return (await r2.json()) as T;
}
