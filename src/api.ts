const RAW_API_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3003").replace(/\/$/, "").replace(/\/api\/?$/, "")

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_BASE_URL || "https://www.classz.co").replace(/\/$/, "")

export const API_BASE = `${RAW_API_URL}/api`

// Seeded catalogue images (/images/...) are hosted by the ClassZ website, not the API.
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const rel = path.startsWith("/") ? path : `/${path}`
  return `${rel.startsWith("/images/") ? WEB_URL : RAW_API_URL}${rel}`
}

type ApiErrorBody = { success?: boolean; msg?: string; message?: string; errors?: { msg?: string }[] }

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export function isMissingRoute(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.status === 405)
}

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
    throw new ApiError(
      data.msg || data.message || data.errors?.[0]?.msg || `Request failed (${res.status})`,
      res.status,
    )
  }
  return data
}

export function errorMessage(err: unknown, fallback = "Please try again."): string {
  return err instanceof Error && err.message ? err.message : fallback
}
