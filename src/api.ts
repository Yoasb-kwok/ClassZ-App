const RAW_API_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3003").replace(/\/$/, "").replace(/\/api\/?$/, "")

export const API_BASE = `${RAW_API_URL}/api`

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${RAW_API_URL}${path.startsWith("/") ? "" : "/"}${path}`
}

type ApiErrorBody = { success?: boolean; msg?: string; message?: string; errors?: { msg?: string }[] }

export async function apiRequest<T>(
  path: string,
  init: { token?: string; method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody
  if (!res.ok || data.success === false) {
    throw new Error(data.msg || data.message || data.errors?.[0]?.msg || `Request failed (${res.status})`)
  }
  return data
}

export function errorMessage(err: unknown, fallback = "Please try again."): string {
  return err instanceof Error && err.message ? err.message : fallback
}
