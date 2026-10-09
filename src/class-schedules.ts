import type { ApiClass } from "./account-data"
import type { Program } from "./flow-application"

export type LessonDate = {
  lesson: number
  dateLabel: string
  weekday: string
  time: string
}

export type ClassScheduleOption = {
  id: string
  classIds: number[]
  lessonCount: number
  dateRange: string
  originalPrice: number | null
  price: number
  spotsLeft: number
  goingCount: number
  language: string
  address: string
  coachName: string
  lessonDates: LessonDate[]
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const

function parseClassDate(raw?: string | null): Date | null {
  if (!raw) return null
  const text = String(raw).trim()
  const isoish = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(text) ? text.replace(" ", "T") : text
  const parsed = new Date(isoish)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function clock(value: Date): string {
  return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "")
}

function dateLabel(value: Date): string {
  return `${MONTHS[value.getMonth()]} ${value.getDate()}`
}

function rangeLabel(start: Date | null, end: Date | null): string {
  if (start && end) return `${dateLabel(start)} - ${dateLabel(end)}`
  if (start) return dateLabel(start)
  return "Dates TBC"
}

/** Upcoming class rows for one published course, grouped by weekday and start time. */
export function schedulesForProgram(program: Program, classes: ApiClass[]): ClassScheduleOption[] {
  const code = String(program.programCode || "").trim().toLowerCase()
  if (!code) return []
  const rows = classes
    .filter((row) => {
      if (row.is_cancelled) return false
      if (String(row.program_code || "").trim().toLowerCase() !== code) return false
      if (program.centreId && row.center_id != null && String(row.center_id) !== program.centreId) return false
      return true
    })
    .slice()
    .sort((a, b) => String(a.start_time || "").localeCompare(String(b.start_time || "")))

  const groups = new Map<string, ApiClass[]>()
  rows.forEach((row) => {
    const start = parseClassDate(row.start_time)
    const key = start ? `${start.getDay()}-${start.getHours()}-${start.getMinutes()}` : `session-${row.id}`
    const list = groups.get(key)
    if (list) list.push(row)
    else groups.set(key, [row])
  })

  return [...groups.values()].map((group) => {
    const first = group[0]
    const start = parseClassDate(first.start_time)
    const last = parseClassDate(group[group.length - 1].start_time)
    const capacity = Number(first.capacity) || 0
    const enrolled = Number(first.enrolled_count) || 0
    const lessonDates = group.map((row, index) => {
      const when = parseClassDate(row.start_time)
      const until = parseClassDate(row.end_time)
      const time = when && until ? `${clock(when)} - ${clock(until)}` : when ? clock(when) : "Time TBC"
      return {
        lesson: index + 1,
        dateLabel: when ? dateLabel(when) : "Date TBC",
        weekday: when ? WEEKDAYS[when.getDay()] : "",
        time,
      }
    })
    return {
      id: String(first.id),
      classIds: group.map((row) => row.id),
      lessonCount: Number(first.total_lessons) || group.length,
      dateRange: rangeLabel(start, last),
      originalPrice: null,
      price: program.price,
      spotsLeft: capacity > 0 ? Math.max(capacity - enrolled, 0) : 0,
      goingCount: enrolled,
      language: program.language || "Language TBC",
      address: first.location || program.venue || program.location || "Location TBC",
      coachName: first.instructor || program.instructor || "Coach TBC",
      lessonDates,
    }
  })
}
