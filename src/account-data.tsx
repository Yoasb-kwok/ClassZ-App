import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AppState } from "react-native"
import { apiRequest, assetUrl, isMissingRoute } from "./api"
import { fetchCatalog } from "./catalog-api"
import { FIGMA_ASSETS } from "./figma-asset-urls"
import type { FlowAppState, Student } from "./flow-application"

import type { InboxThread, InboxChatMessage } from "./inbox"

const POLL_INTERVAL_MS = 30_000

export type ApiAccount = {
  name: string | null
  full_name: string | null
  email: string
  mobile: string | null
  country_code: string | null
  photo_url?: string | null
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
  total_lessons?: number | null
  weekday?: number | null
  is_cancelled?: number | boolean | null
}

export type FavouriteItem = {
  item_type: "course" | "centre"
  item_id: number
}

export type PassportCompanion = {
  primary_companion?: string | null
  supporting_companions?: string[]
  narrative_json?: Record<string, unknown> | null
  records_used?: number
  records_required?: number
  status?: string
}

export type PassportRecord = { id: number; class_focus?: string; progress_level?: string; observed?: string[]; strongest_areas?: string[]; attention_areas?: string[]; student_work_on?: string; learning_traits?: string[]; additional_comment?: string; created_at?: string; photo_url?: string }

export type PassportLesson = {
  records?: PassportRecord[]
  id: string
  title: string
  kind?: "academic" | "activity"
  location?: string
  instructor?: string
  center_name?: string
  latest_at?: string
  record_count?: number
}

export type PassportMedia = {
  id: number | string
  title: string
  lessonLabel?: string
  centre?: string
  date?: string | null
  image?: string | null
}

export type LearningSnapshot = {
  profileId?: string
  companion: PassportCompanion | null
  lessons: PassportLesson[]
  workSamples: PassportMedia[]
  moments: PassportMedia[]
  differences: { program: string; kind?: string; repeated_strength?: string[]; repeated_support?: string[] }[]
  help: string[]
}

export type ApiTrial = {
  id: string
  class_name: string
  status: string
  full_name?: string
  location?: string
  program_code?: string
  applied_date: string | null
  preferred_datetime: string | null
  preferred_end_datetime?: string | null
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
    id?: number
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
  inbox: InboxThread[]
  readIds: string[]
  markRead: (id:string)=>Promise<void>
  updateThread: (id:string,change:Record<string,boolean>)=>Promise<void>
  getMessages: (id:string)=>Promise<InboxChatMessage[]>
  sendMessage: (id:string,text:string)=>Promise<void>

  account: ApiAccount | null
  orders: ApiOrder[]
  enrollments: ApiEnrollment[]
  notifications: ApiNotification[]
  classNotices: ApiNotification[]
  tokens: ApiToken[]
  classes: ApiClass[]
  trials: ApiTrial[]
  learning: LearningSnapshot | null
  favourites: FavouriteItem[]
  favouritesAvailable: boolean
  toggleFavourite: (type: FavouriteItem["item_type"], id: number) => Promise<boolean>
  loaded: boolean
  refresh: () => Promise<void>
}

const EMPTY_ACCOUNT_DATA: AccountData = {
  inbox: [], readIds: [], markRead: async()=>{}, updateThread: async()=>{},getMessages:async()=>[],sendMessage:async()=>{},
  account: null,
  orders: [],
  enrollments: [],
  notifications: [],
  classNotices: [],
  tokens: [],
  classes: [],
  trials: [],
  learning: null,
  favourites: [],
  favouritesAvailable: false,
  toggleFavourite: async () => false,
  loaded: false,
  refresh: async () => {},
}

const AccountDataContext = createContext<AccountData>(EMPTY_ACCOUNT_DATA)

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
  selectedProfileId,
  setFlowAppState,
  children,
}: {
  token: string
  selectedProfileId?: string
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
  children: ReactNode
}) {
  const [inbox,setInbox]=useState<InboxThread[]>([])
  const [readIds,setReadIds]=useState<string[]>([])
  const [account, setAccount] = useState<ApiAccount | null>(null)
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [enrollments, setEnrollments] = useState<ApiEnrollment[]>([])
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [classNotices, setClassNotices] = useState<ApiNotification[]>([])
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [classes, setClasses] = useState<ApiClass[]>([])
  const [trials, setTrials] = useState<ApiTrial[]>([])
  const [learning, setLearning] = useState<LearningSnapshot | null>(null)
  const [favourites, setFavourites] = useState<FavouriteItem[]>([])
  const [favouritesAvailable, setFavouritesAvailable] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const requestVersion = useRef(0)
  const activeToken = useRef(token)
  activeToken.current = token

  const refresh = useCallback(async () => {
    const requestToken = token
    const version = ++requestVersion.current
    const [passport, ordersRes, upcomingRes, notificationsRes, noticesRes, tokensRes, catalog, classesRes, trialsRes, favouritesRes, inboxRes, prefsRes] = await Promise.allSettled([
      apiRequest<{ data: {
        account: ApiAccount
        profiles: ApiProfile[]
        profile?: {id:number}|null
        companion?: PassportCompanion | null
        lessons?: PassportLesson[]
        work_samples?: PassportMedia[]
        moments?: PassportMedia[]
        differences_across_programs?: LearningSnapshot["differences"]
        help_across_programs?: string[]
      } }>(`/student/passport${selectedProfileId ? `?profile_id=${encodeURIComponent(selectedProfileId)}` : ""}`, { token }),
      apiRequest<{ data: ApiOrder[] }>("/orders/me", { token }),
      apiRequest<{ data: ApiEnrollment[] }>("/student/upcoming-classes", { token }),
      apiRequest<{ data: ApiNotification[] }>("/student/notifications", { token }),
      apiRequest<{ data: ApiNotification[] }>("/student/class-notices", { token }),
      apiRequest<{ data: ApiToken[] }>("/student/tokens", { token }),
      fetchCatalog(),
      apiRequest<{ data: ApiClass[] }>("/classes"),
      apiRequest<{ data: ApiTrial[] }>("/student/trial-applications", { token }),
      apiRequest<{ data: FavouriteItem[] }>("/student/favourites", { token }),
      apiRequest<{data:InboxThread[]}>("/student/inbox",{token}),
      apiRequest<{data:{readIds?:string[]}}>("/student/preferences",{token}),
    ])
    if (activeToken.current !== requestToken || version !== requestVersion.current) return

    if (passport.status === "fulfilled") {
      const payload = passport.value.data
      const acct = payload.account
      setAccount(acct)
      const students = (payload.profiles || []).map((p) => toStudent(p, acct))
      setLearning({
        profileId: payload.profile?.id ? String(payload.profile.id) : selectedProfileId,
        companion: payload.companion || null,
        lessons: payload.lessons || [],
        workSamples: payload.work_samples || [],
        moments: payload.moments || [],
        differences: payload.differences_across_programs || [],
        help: payload.help_across_programs || [],
      })
      setFlowAppState((prev) => ({
        ...prev,
        students,
        selectedStudentId: students.some((s) => s.id === prev.selectedStudentId) ? prev.selectedStudentId : students[0]?.id || "",
      }))
    }
    if(inboxRes.status==="fulfilled")setInbox(inboxRes.value.data||[])
    if(prefsRes.status==="fulfilled")setReadIds(prefsRes.value.data.readIds||[])
    if (ordersRes.status === "fulfilled") setOrders(ordersRes.value.data || [])
    if (upcomingRes.status === "fulfilled") setEnrollments(upcomingRes.value.data || [])
    if (notificationsRes.status === "fulfilled") setNotifications(notificationsRes.value.data || [])
    if (noticesRes.status === "fulfilled") setClassNotices(noticesRes.value.data || [])
    if (tokensRes.status === "fulfilled") setTokens(tokensRes.value.data || [])
    if (classesRes.status === "fulfilled") setClasses(classesRes.value.data || [])
    if (trialsRes.status === "fulfilled") setTrials(trialsRes.value.data || [])
    if (favouritesRes.status === "fulfilled") {
      setFavouritesAvailable(true)
      setFavourites(favouritesRes.value.data || [])
    } else if (isMissingRoute((favouritesRes as PromiseRejectedResult).reason)) {
      setFavouritesAvailable(false)
      setFavourites([])
    }
    if (catalog.status === "fulfilled") {
      const { programs, centres } = catalog.value
      setFlowAppState((prev) => ({
        ...prev,
        programs,
        centres,
        selectedProgramId: programs.some((p) => p.id === prev.selectedProgramId) ? prev.selectedProgramId : programs[0]?.id || "",
        selectedCentreId: centres.some((c) => c.id === prev.selectedCentreId) ? prev.selectedCentreId : centres[0]?.id || "",
      }))
    }

    const failed = [passport, ordersRes, upcomingRes, notificationsRes, noticesRes, tokensRes, catalog, classesRes, trialsRes, favouritesRes]
      .filter((r) => r.status === "rejected" && !isMissingRoute((r as PromiseRejectedResult).reason))
    if (failed.length) {
      console.warn("[account-data] some requests failed:", failed.map((r) => (r as PromiseRejectedResult).reason?.message))
    }
    setLoaded(true)
  }, [token, selectedProfileId, setFlowAppState])

  useEffect(() => {
    setLearning(null)
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

  const toggleFavourite = useCallback(async (type: FavouriteItem["item_type"], id: number) => {
    if (!favouritesAvailable) {
      throw new Error("Saving favourites isn't available yet.")
    }
    const res = await apiRequest<{ data?: { favourited?: boolean } }>("/student/favourites/toggle", {
      token,
      method: "POST",
      body: { item_type: type, item_id: id },
    })
    const favourited = Boolean(res.data?.favourited)
    setFavourites((current) => {
      const without = current.filter((item) => !(item.item_type === type && item.item_id === id))
      return favourited ? [...without, { item_type: type, item_id: id }] : without
    })
    return favourited
  }, [favouritesAvailable, token])

  const getMessages=useCallback(async(id:string)=>(await apiRequest<{data:InboxChatMessage[]}>(`/student/inbox/${id}`,{token})).data,[token])
  const sendMessage=useCallback(async(id:string,text:string)=>{await apiRequest(`/student/inbox/${id}`,{token,method:"POST",body:{text}});await refresh()},[token,refresh])
  const updateThread=useCallback(async(id:string,change:Record<string,boolean>)=>{await apiRequest(`/student/inbox/${id}`,{token,method:"PATCH",body:change});await refresh()},[token,refresh])
  const markRead=useCallback(async(id:string)=>{const next=[...new Set([...readIds,id])];await apiRequest("/student/preferences",{token,method:"PATCH",body:{readIds:next}});setReadIds(next)},[token,readIds])
  const value = useMemo(
    () => ({
      inbox,readIds,getMessages,sendMessage,updateThread,markRead,
      account,
      orders,
      enrollments,
      notifications,
      classNotices,
      tokens,
      classes,
      trials,
      learning: learning?.profileId===selectedProfileId?learning:null,
      favourites,
      favouritesAvailable,
      toggleFavourite,
      loaded,
      refresh,
    }),
    [selectedProfileId,inbox,readIds,getMessages,sendMessage,updateThread,markRead,account, orders, enrollments, notifications, classNotices, tokens, classes, trials, learning, favourites, favouritesAvailable, toggleFavourite, loaded, refresh],
  )
  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>
}
