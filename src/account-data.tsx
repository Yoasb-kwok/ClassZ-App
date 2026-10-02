import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AppState } from "react-native"
import { apiRequest, assetUrl } from "./api"
import { fetchCatalog } from "./catalog-api"
import { FIGMA_ASSETS } from "./figma-asset-urls"
import type { FlowAppState, Student } from "./flow-application"

const POLL_INTERVAL_MS = 30_000

export type ApiAccount = {
  name: string | null
  full_name: string | null
  email: string
  mobile: string | null
  country_code: string | null
}

type ApiProfile = {
  id: number
  name: string
  age: number | null
  level: string
  photo_url: string | null
  date_of_birth: string | null
  contact_number: string
  parents_name: string
  school?: string
  medical_notes?: string
}

export type ApiClass = {
  id: number
  name: string
  instructor: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  program_code: string | null
  center_id?: number
  capacity: number | null
  enrolled_count: number | null
}

export type ApiTrial = {
  id: string
  class_name: string
  status: string
  applied_date: string | null
  preferred_datetime: string | null
}

export type ApiOrder = {
  id: number
  order_id: string
  package_name: string | null
  total: number
  payment_status: string
  payment_method: string | null
  token_count: number | null
  created_at: string
}

export type ApiEnrollment = {
  id: string
  status: string
  profile_id: string | null
  user_name: string | null
  class: {
    name: string
    instructor: string | null
    start_time: string
    end_time: string | null
    program_code: string | null
    location: string | null
  }
  total_lessons: number | null
}

export type ApiNotification = {
  id: string
  type: string
  title?: string
  message?: string
  titleKey?: string
  messageKey?: string
  date: string
  daysLeft?: string
  remainingTokens?: string
  studentName?: string
}

export type ApiToken = {
  id: string
  remaining_tokens: number
  total_tokens: number
  expiry_date: string
}

type AccountData = {
  account: ApiAccount | null
  orders: ApiOrder[]
  enrollments: ApiEnrollment[]
  notifications: ApiNotification[]
  tokens: ApiToken[]
  classes: ApiClass[]
  trials: ApiTrial[]
  loaded: boolean
  refresh: () => Promise<void>
}

const AccountDataContext = createContext<AccountData>({
  account: null,
  orders: [],
  enrollments: [],
  notifications: [],
  tokens: [],
  classes: [],
  trials: [],
  loaded: false,
  refresh: async () => {},
})

export function useAccountData() {
  return useContext(AccountDataContext)
}

function toStudent(profile: ApiProfile, account: ApiAccount | null): Student {
  return {
    id: String(profile.id),
    name: profile.name,
    parent: profile.parents_name || account?.name || account?.full_name || "",
    phone: profile.contact_number || account?.mobile || "",
    level: profile.level || "Beginner",
    years: 0,
    connected: Boolean(profile.school),
    age: profile.age,
    sen: Boolean(profile.medical_notes && /sen/i.test(profile.medical_notes)),
    image: assetUrl(profile.photo_url) || FIGMA_ASSETS.reservation.child,
    imageScale: 1,
    imageOffsetY: 0,
    dateOfBirth: profile.date_of_birth,
    school: profile.school || "",
    medicalNotes: profile.medical_notes || "",
  }
}

export function AccountDataProvider({
  token,
  setFlowAppState,
  children,
}: {
  token: string
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
  children: ReactNode
}) {
  const [account, setAccount] = useState<ApiAccount | null>(null)
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [enrollments, setEnrollments] = useState<ApiEnrollment[]>([])
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [classes, setClasses] = useState<ApiClass[]>([])
  const [trials, setTrials] = useState<ApiTrial[]>([])
  const [loaded, setLoaded] = useState(false)
  const activeToken = useRef(token)
  activeToken.current = token

  const refresh = useCallback(async () => {
    const requestToken = token
    const [passport, ordersRes, upcomingRes, notificationsRes, tokensRes, catalog, classesRes, trialsRes] = await Promise.allSettled([
      apiRequest<{ data: { account: ApiAccount; profiles: ApiProfile[] } }>("/student/passport", { token }),
      apiRequest<{ data: ApiOrder[] }>("/orders/me", { token }),
      apiRequest<{ data: ApiEnrollment[] }>("/student/upcoming-classes", { token }),
      apiRequest<{ data: ApiNotification[] }>("/student/notifications", { token }),
      apiRequest<{ data: ApiToken[] }>("/student/tokens", { token }),
      fetchCatalog(),
      apiRequest<{ data: ApiClass[] }>("/classes"),
      apiRequest<{ data: ApiTrial[] }>("/student/trial-applications", { token }),
    ])
    if (activeToken.current !== requestToken) return

    if (passport.status === "fulfilled") {
      const { account: acct, profiles } = passport.value.data
      setAccount(acct)
      const students = (profiles || []).map((p) => toStudent(p, acct))
      setFlowAppState((prev) => ({
        ...prev,
        students,
        selectedStudentId: students.some((s) => s.id === prev.selectedStudentId) ? prev.selectedStudentId : students[0]?.id || "",
      }))
    }
    if (ordersRes.status === "fulfilled") setOrders(ordersRes.value.data || [])
    if (upcomingRes.status === "fulfilled") setEnrollments(upcomingRes.value.data || [])
    if (notificationsRes.status === "fulfilled") setNotifications(notificationsRes.value.data || [])
    if (tokensRes.status === "fulfilled") setTokens(tokensRes.value.data || [])
    if (classesRes.status === "fulfilled") setClasses(classesRes.value.data || [])
    if (trialsRes.status === "fulfilled") setTrials(trialsRes.value.data || [])
    if (catalog.status === "fulfilled" && catalog.value.programs.length && catalog.value.centres.length) {
      const { programs, centres } = catalog.value
      setFlowAppState((prev) => ({
        ...prev,
        programs,
        centres,
        selectedProgramId: programs.some((p) => p.id === prev.selectedProgramId) ? prev.selectedProgramId : programs[0].id,
        selectedCentreId: centres.some((c) => c.id === prev.selectedCentreId) ? prev.selectedCentreId : centres[0].id,
      }))
    }

    const failed = [passport, ordersRes, upcomingRes, notificationsRes, tokensRes, catalog, classesRes, trialsRes].filter((r) => r.status === "rejected")
    if (failed.length) {
      console.warn("[account-data] some requests failed:", failed.map((r) => (r as PromiseRejectedResult).reason?.message))
    }
    setLoaded(true)
  }, [token, setFlowAppState])

  useEffect(() => {
    refresh()
    let timer: ReturnType<typeof setInterval> | null = setInterval(refresh, POLL_INTERVAL_MS)
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh()
        if (!timer) timer = setInterval(refresh, POLL_INTERVAL_MS)
      } else if (timer) {
        clearInterval(timer)
        timer = null
      }
    })
    return () => {
      if (timer) clearInterval(timer)
      subscription.remove()
    }
  }, [refresh])

  const value = useMemo(
    () => ({ account, orders, enrollments, notifications, tokens, classes, trials, loaded, refresh }),
    [account, orders, enrollments, notifications, tokens, classes, trials, loaded, refresh],
  )
  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>
}
