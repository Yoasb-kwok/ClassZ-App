export type ClassNotification = {
  id: string
  category: "class_update" | "account"
  centre: string
  note: string
  date: string
  time: string
  /** ISO for sorting latest → oldest */
  createdAt: string
  unread: boolean
}

type ApiNotice = {
  id?: string | number
  type?: string
  title?: string
  message?: string
  titleKey?: string
  messageKey?: string
  date?: string
  created_at?: string
  center_name?: string
  centre?: string
  unread?: boolean
}

function parseWhen(raw?: string | null): Date | null {
  if (!raw) return null
  const text = String(raw).trim()
  const isoish = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(text) ? text.replace(" ", "T") : text
  const parsed = new Date(isoish)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function noticeToNotification(row: ApiNotice, index: number): ClassNotification {
  const when = parseWhen(row.date || row.created_at)
  const type = String(row.type || "").toLowerCase()
  return {
    id: String(row.id ?? `notice-${index}`),
    category: type.includes("account") ? "account" : "class_update",
    centre: row.centre || row.center_name || row.title || "ClassZ",
    note: row.message || row.messageKey || row.title || "",
    date: when ? when.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "",
    time: when ? when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toLowerCase() : "",
    createdAt: when ? when.toISOString() : "",
    unread: row.unread !== false,
  }
}

export function getNotificationsLatestFirst(items: ClassNotification[]): ClassNotification[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
