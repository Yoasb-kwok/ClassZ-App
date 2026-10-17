import { createContext, useContext, useRef, useState, type ReactNode } from "react"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Alert, Image, Modal, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { SvgXml } from "react-native-svg"
import Feather from "@expo/vector-icons/Feather"
import * as ImagePicker from "expo-image-picker"
import { assetUrl } from "./api"
import { FONT } from "./typography"
import { COACH_SCHEDULE_SVGS as ICON } from "./coach-schedule-svgs"

const IMG = {
  centreLogo: require("../assets/figma/coach/schedule/centre-logo-lg.png"),
  checkin: require("../assets/figma/coach/schedule/checkin.jpg"),
  guitar: require("../assets/figma/coach/schedule/guitar.jpg"),
  reading: require("../assets/figma/coach/schedule/reading.jpg"),
  painting: require("../assets/figma/coach/schedule/painting.jpg"),
  shelly: require("../assets/figma/coach/schedule/shelly.jpg"),
  lucas: require("../assets/figma/coach/schedule/lucas.jpg"),
  hostCentre: require("../assets/figma/coach/schedule/host-centre.jpg"),
  programGuitar: require("../assets/figma/coach/schedule/program-guitar.jpg"),
  mural: require("../assets/figma/coach/schedule/feedback-mural.jpg"),
  male: require("../assets/figma/coach/schedule/male.png"),
}
const GOING = [require("../assets/figma/coach/schedule/going1.png"), require("../assets/figma/coach/schedule/going2.png"), require("../assets/figma/coach/schedule/going3.png"), require("../assets/figma/coach/schedule/going4.png")]

const INK = "#222222", GREY = "#5E5E5E", LINE = "#EBEBEB", TEAL = "#0ABAB5", CAL_INK = "#222B45", CAL_MUTED = "#8F9BB3"
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const LESSONS = 8
const HOST_CENTRE = "ClassZ Playgroup Bright Kids Drawing Centre"

export const NO_PHOTO: ImageSourcePropType = { uri: "" }
function Photo({ source, fallback, label }: { source: ImageSourcePropType; fallback?: ImageSourcePropType; label?: string }) {
  const [failed, setFailed] = useState(false)
  if (source === NO_PHOTO || (failed && !fallback)) return <View accessibilityLabel={label} style={[s.photoFill, s.photoEmpty]}><Feather name="user" size={28} color="#9AA0A6" /></View>
  return <Image source={failed ? fallback! : source} style={s.photoFill} accessibilityLabel={label} onError={() => setFailed(true)} />
}

export type Student = { enrolledAt?: string; enrollmentId?: number; profileId?: number; name: string; photo: ImageSourcePropType; sen: boolean; age: number; male: boolean }
type Attendee = { kind: "group"; count: number } | { kind: "single"; student: Student }
type Program = { key: string; title: string; time: string; startMinutes: number; endMinutes: number; color: string; image: ImageSourcePropType; attendee: Attendee; sen: boolean; course: string }
export type CoachClass = Program & { id: string; date: Date; lesson: number; roster?: Student[]; totalLessons?: number; centerName?: string; sessionDates?: Date[]; price?: number|null; rating?: number|null; capacity?: number; location?: string; language?: string; ageTag?: string }
export const CoachScheduleContext = createContext<CoachClass[] | null>(null)
export type Announcement = { id: string; text: string; image?: string }

const KIDS: Student[] = [
  { name: "Allan Eliot", photo: require("../assets/figma/coach/schedule/kid-allan.jpg"), sen: true, age: 6, male: true },
  { name: "Tommy Ho", photo: require("../assets/figma/coach/schedule/kid-tommy.jpg"), sen: false, age: 5, male: true },
  { name: "Candy Lou", photo: require("../assets/figma/coach/schedule/kid-candy.jpg"), sen: false, age: 5, male: false },
  { name: "Joshua Ho", photo: require("../assets/figma/coach/schedule/kid-joshua.jpg"), sen: true, age: 6, male: true },
  { name: "Elaine Gomez", photo: require("../assets/figma/coach/schedule/kid-elaine.jpg"), sen: false, age: 4, male: false },
  { name: "Charlie Wong", photo: require("../assets/figma/coach/schedule/kid-charlie.jpg"), sen: true, age: 6, male: true },
  { name: "Charlotte Chan", photo: require("../assets/figma/coach/schedule/student-charlotte.jpg"), sen: false, age: 5, male: false },
  { name: "Dennis Lee", photo: require("../assets/figma/coach/schedule/student-dennis.jpg"), sen: false, age: 4, male: true },
  { name: "Kayla Ng", photo: require("../assets/figma/coach/schedule/student-candy.jpg"), sen: false, age: 5, male: false },
]
const kid = (name: string) => KIDS.find((k) => k.name === name)!
const PROGRAMS: Program[] = [
  { key: "watercolour", title: "Watercolour Painting", time: "10:00AM-12:00PM", startMinutes: 600, endMinutes: 720, color: TEAL, image: IMG.checkin, attendee: { kind: "group", count: 6 }, sen: true, course: "Watercolour (intermediate)" },
  { key: "guitar", title: "ClassZ Guitar Program", time: "10:00AM-01:00PM", startMinutes: 600, endMinutes: 780, color: TEAL, image: IMG.guitar, attendee: { kind: "group", count: 7 }, sen: false, course: "Guitar (beginner)" },
  { key: "academic", title: "Rising Star Academic Program", time: "02:00PM-03:00PM", startMinutes: 840, endMinutes: 900, color: "#FFAF36", image: IMG.reading, attendee: { kind: "single", student: { name: "Shelly Wong", photo: IMG.shelly, sen: false, age: 7, male: false } }, sen: false, course: "Academic (junior)" },
  { key: "painting", title: "ClassZ Painting Program", time: "04:00PM-06:00PM", startMinutes: 960, endMinutes: 1080, color: "#FC5555", image: IMG.painting, attendee: { kind: "single", student: { name: "Lucas Wong", photo: IMG.lucas, sen: false, age: 6, male: true } }, sen: false, course: "Painting (junior)" },
  { key: "guitar-private", title: "ClassZ Guitar Program", time: "10:00AM-01:00PM", startMinutes: 600, endMinutes: 780, color: "#FFC943", image: IMG.guitar, attendee: { kind: "single", student: kid("Charlie Wong") }, sen: false, course: "Guitar (private)" },
]
const PROGRAM_IMAGES: Record<string, ImageSourcePropType> = { "ClassZ Guitar Program": IMG.programGuitar }
const FEEDBACK_IMAGES: Record<string, ImageSourcePropType> = { watercolour: IMG.mural }
const PROGRAM_TITLES = ["ClassZ Guitar Program", ...new Set(PROGRAMS.map((p) => p.title).filter((t) => t !== "ClassZ Guitar Program"))]
const SPOTS = 11
export const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  { id: "sample-1", text: "Please bring the homework from the previous class." },
  { id: "sample-2", text: "Please practice the song from previous class." },
]
const BY_WEEKDAY: string[][] = [[], ["guitar", "academic", "painting"], ["guitar-private"], ["watercolour", "academic"], ["guitar", "academic", "painting"], ["guitar-private", "painting"], ["watercolour", "academic", "painting"]]

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b)
const shortDate = (d: Date) => `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`
const rangeDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`
const slashDate = (d: Date, longYear = true) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${longYear ? d.getFullYear() : String(d.getFullYear()).slice(2)}`

export function classesOn(date: Date, cancelled: ReadonlySet<string>, source: CoachClass[] | null = null): CoachClass[] {
  if(source) return source.filter(c => sameDay(c.date,date) && !cancelled.has(c.id))
  const day = startOfDay(date)
  return BY_WEEKDAY[day.getDay()].map((key) => PROGRAMS.find((p) => p.key === key)!)
    .map((p) => ({ ...p, id: `${p.key}-${dayKey(day)}`, date: day, lesson: (Math.floor((day.getDate() - 1) / 7) % LESSONS) + 1 }))
    .filter((c) => !cancelled.has(c.id))
    .sort((a, b) => a.startMinutes - b.startMinutes)
}
export function upcomingClasses(from: Date, days: number, cancelled: ReadonlySet<string>, source: CoachClass[] | null = null) {
  return Array.from({ length: days }, (_, i) => classesOn(addDays(from, i), cancelled, source)).flat()
}
export function findClass(id: string, cancelled: ReadonlySet<string>, source: CoachClass[] | null = null) {
  if(source) return source.find(c => c.id === id && !cancelled.has(id)) ?? null
  const key = id.slice(id.length - 10)
  const [y, m, d] = key.split("-").map(Number)
  return classesOn(new Date(y, m - 1, d), cancelled).find((c) => c.id === id) ?? null
}
const programDates = (c: CoachClass) => c.sessionDates ?? Array.from({ length: LESSONS }, (_, i) => addDays(c.date, (i - (c.lesson - 1)) * 7))
const clock = (minutes: number) => { const h = Math.floor(minutes / 60), m = minutes % 60; return `${h % 12 || 12}:${String(m).padStart(2, "0")}${h < 12 ? "AM" : "PM"}` }
const lessonDay = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${WEEKDAYS[(d.getDay() + 6) % 7]}`
const hours = (c: Program) => { const h = (c.endMinutes - c.startMinutes) / 60; return `${h} hour${h === 1 ? "" : "s"}` }
export const rosterOf = (c: CoachClass): Student[] => c.roster ?? (c.attendee.kind === "group" ? KIDS.slice(0, c.attendee.count) : [c.attendee.student])
export const studentKey=(st:Student)=>st.enrollmentId?String(st.enrollmentId):st.name
export const feedbackKey = (c: CoachClass, st: Student) => `${c.id}|${studentKey(st)}`
export type PendingClass = { item: CoachClass; pending: Student[]; total: number }
export function pendingFeedback(cancelled: ReadonlySet<string>, done: ReadonlySet<string>, source: CoachClass[] | null = null): PendingClass[] {
  const today = startOfDay(new Date())
  return (source ? source.filter(c => c.date <= new Date() && !cancelled.has(c.id)) : [1, 2, 3].flatMap((n) => classesOn(addDays(today, -n), cancelled).reverse()))
    .map((item) => { const roster = rosterOf(item); return { item, total: roster.length, pending: roster.filter((st) => !done.has(feedbackKey(item, st))) } })
    .filter((p) => p.pending.length > 0)
}

type ProgramSchedule = { id: string; first: CoachClass; dates: Date[] }
function schedulesOf(title: string, cancelled: ReadonlySet<string>, source: CoachClass[] | null = null): ProgramSchedule[] {
  const seen = new Set<string>()
  return upcomingClasses(startOfDay(new Date()), 365, cancelled, source).filter((c) => c.title === title).flatMap((c) => {
    const run = `${c.key}-${c.date.getDay()}`
    if (seen.has(run)) return []
    seen.add(run)
    return [{ id: c.id, first: c, dates: source ? source.filter(v => v.title === title).map(v => v.date) : programDates(c) }]
  })
}

export function useCoachSchedule() {
  const source = useContext(CoachScheduleContext)
  return {
    classesOn: (d: Date, c: ReadonlySet<string>) => classesOn(d,c,source),
    upcomingClasses: (d: Date,n: number,c: ReadonlySet<string>) => upcomingClasses(d,n,c,source),
    findClass: (id: string,c: ReadonlySet<string>) => findClass(id,c,source),
    pendingFeedback: (c: ReadonlySet<string>,done: ReadonlySet<string>) => pendingFeedback(c,done,source),
    schedulesOf: (title: string,c: ReadonlySet<string>) => schedulesOf(title,c,source),
    titles: source ? [...new Set(source.map(c=>c.title))] : PROGRAM_TITLES,
  }
}

function Screen({ title, large = false, medium = false, onBack, children, footer }: { title: string; large?: boolean; medium?: boolean; onBack: () => void; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return <View style={s.page}>
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} style={s.back} onPress={onBack}><SvgXml xml={ICON.back} width={16} height={16} /></Pressable>
      <Text accessibilityRole="header" numberOfLines={1} style={large || medium ? [s.titleLarge, medium && s.titleMedium] : s.title}>{title}</Text>
    </View>
    <ScrollView contentContainerStyle={[s.content, !footer && { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
      {footer && <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>}
    </ScrollView>
  </View>
}

function Dot() { return <View style={s.dot} /> }
function SeeAll({ label = "See All", onPress }: { label?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}><Text style={s.seeAll}>{label}</Text></Pressable>
}

export function CentreProfile({ centreName, cancelled, checked, pending, onBack, onPrograms, onSchedule, onAnnounce, onOpenClass, onCheckIns, onPendingFeedback, onFeedback, onDisconnect }: { centreName: string; cancelled: ReadonlySet<string>; checked: Record<string, string[]>; pending: PendingClass[]; onBack: () => void; onPrograms: () => void; onSchedule: () => void; onAnnounce: (c: CoachClass) => void; onOpenClass: (c: CoachClass) => void; onCheckIns: () => void; onPendingFeedback: () => void; onFeedback: (c: CoachClass, st: Student) => void; onDisconnect: () => void }) {
  const { classesOn, upcomingClasses, schedulesOf, titles: PROGRAM_TITLES } = useCoachSchedule()

  const today = startOfDay(new Date())
  const checkins = classesOn(today, cancelled)
  const waiting = pending.flatMap((p) => p.pending.map((st) => ({ item: p.item, st }))).slice(0, 10)
  const actions: Array<{ label: string; icon: string; size: number; onPress: () => void }> = [
    { label: "Programs", icon: ICON.book, size: 25, onPress: onPrograms },
    { label: "Schedule", icon: ICON.calendarAdd, size: 24, onPress: onSchedule },
    { label: "Announce", icon: ICON.announce, size: 24, onPress: () => { const next = upcomingClasses(today, 30, cancelled)[0]; if (next) onAnnounce(next); else Alert.alert("Announce", "There is no upcoming class to announce to.") } },
  ]
  return <Screen title={centreName} large onBack={onBack}>
    <Image source={IMG.centreLogo} style={s.centreLogo} accessibilityLabel={`${centreName} logo`} />
    <View style={s.actions}>{actions.map((a, i) => <View key={a.label} style={s.actionWrap}>
      {i > 0 && <View style={s.actionDivider} />}
      <Pressable accessibilityRole="button" style={s.action} onPress={a.onPress}><SvgXml xml={a.icon} width={a.size} height={a.size} /><Text numberOfLines={1} style={s.actionLabel}>{a.label}</Text></Pressable>
    </View>)}</View>

    <View style={s.section}>
      <View style={s.sectionHeadTight}>
        <View style={s.sectionHead}><Text style={s.sectionTitle}>Today’s check-ins :</Text><SeeAll onPress={onCheckIns} /></View>
        <Text style={s.date}>{slashDate(today)}</Text>
      </View>
      {checkins.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.bleed, s.fixedHorizontal]} contentContainerStyle={s.checkinRow}>
        {checkins.map((c) => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`${c.title}, ${c.time}`} style={s.checkin} onPress={() => onOpenClass(c)}>
          <View style={s.checkinPhotoWrap}>
            <Photo source={c.image} fallback={IMG.checkin} />
            {c.sen && <View style={s.senBadge}><SvgXml xml={ICON.tick} width={14} height={14} /><Text style={s.senText}>SEN</Text></View>}
          </View>
          <View style={s.checkinBody}>
            <View style={s.inline}><Text style={s.checkinTime}>{c.time}</Text><SvgXml xml={ICON.peopleSm} width={12} height={12} /><Text style={s.checkinLesson}>{(checked[c.id] ?? []).length}/{rosterOf(c).length}</Text></View>
            <Text numberOfLines={1} style={[s.checkinTitle, { fontSize: FONT.caption }]}>{c.course}</Text>
          </View>
        </Pressable>)}
      </ScrollView> : <Text style={s.empty}>No check-ins today.</Text>}
    </View>

    <View style={s.section}>
      <View style={s.sectionHead}><Text style={s.sectionTitle}>Pending feedback</Text><SeeAll onPress={onPendingFeedback} /></View>
      {waiting.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.bleed, s.fixedHorizontal]} contentContainerStyle={s.feedbackRow}>
        {waiting.map(({ item, st }) => <Pressable key={feedbackKey(item, st)} accessibilityRole="button" accessibilityLabel={`Write feedback for ${st.name}`} style={s.feedback} onPress={() => onFeedback(item, st)}>
          <View style={s.feedbackPhoto}><Photo source={st.photo} /></View>
          <View style={s.feedbackCopy}>
            <Text numberOfLines={1} style={s.feedbackName}>{st.name.split(" ")[0]}</Text>
            <Text numberOfLines={1} style={s.feedbackText}>{item.course}</Text>
            <Text style={[s.feedbackText, { color: GREY }]}>{slashDate(item.date, false)}</Text>
          </View>
        </Pressable>)}
      </ScrollView> : <Text style={s.empty}>All feedback is up to date.</Text>}
    </View>

    <Pressable accessibilityRole="button" hitSlop={8} style={s.disconnect} onPress={onDisconnect}>
      <SvgXml xml={ICON.trash} width={18.5} height={18.5} /><Text style={s.disconnectText}>Disconnect centre</Text>
    </Pressable>
  </Screen>
}

function Going({ attendee: a }: { attendee: Attendee }) {
  return a.kind === "group"
    ? <View style={s.inline}><View style={s.going}>{GOING.map((src, i) => <Image key={i} source={src} style={[s.goingAvatar, i > 0 && s.goingOverlap]} />)}</View><Text style={s.goingText}>+{Math.max(0, a.count - GOING.length)} Going</Text></View>
    : <View style={s.inline}><View style={s.studentAvatar}><Photo source={a.student.photo} /></View><Text style={s.studentName}>{a.student.name}</Text></View>
}

function ClassCard({ item, dated = true, editing = false, onPress }: { item: CoachClass; dated?: boolean; editing?: boolean; onPress: () => void }) {
  const a = item.attendee
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}, ${shortDate(item.date)}, ${item.time}`} style={[s.classCard, editing && s.classCardEditing]} onPress={onPress}>
    <View style={s.timeRow}><View style={[s.ring, { borderColor: item.color }]} /><Text style={s.time}>{item.time}</Text>{dated && <><Dot /><Text style={s.cardDate}>{shortDate(item.date)}</Text></>}</View>
    <View style={s.classRow}>
      <View style={s.classPhoto}><Photo source={item.image} fallback={IMG.checkin} /></View>
      <View style={s.classCopy}>
        <Text numberOfLines={1} style={s.classTitle}>{item.title}</Text>
        <Text style={s.lesson}>Lesson {item.lesson} of {item.totalLessons??LESSONS}</Text>
        <Going attendee={a} />
        <Text numberOfLines={2} style={s.host}>{item.centerName||HOST_CENTRE}</Text>
      </View>
    </View>
  </Pressable>
}

export type ScheduleView = { tab: "calendar" | "upcoming"; month: Date; selected: Date }
const TRASH_WHITE = ICON.trash.replace(/#5E5E5E/g, "#FFFFFF")
const dayHeading = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, d.getMonth() === 8 ? 4 : 3)} ${d.getFullYear()}`

export function CoachSchedule({ view, cancelled, onChange, onBack, onOpenClass, onViewAll, onDelete }: { view: ScheduleView; cancelled: ReadonlySet<string>; onChange: (next: ScheduleView) => void; onBack: () => void; onOpenClass: (c: CoachClass) => void; onViewAll: () => void; onDelete: (c: CoachClass) => void }) {
  const { classesOn, upcomingClasses, schedulesOf, titles: PROGRAM_TITLES } = useCoachSchedule()

  const today = startOfDay(new Date())
  const [editing, setEditing] = useState(false)
  const list = view.tab === "calendar" ? classesOn(view.selected, cancelled) : upcomingClasses(today, 30, cancelled).slice(0, 3)
  const canEdit = view.tab === "calendar" && editing && list.length > 0
  const confirmDelete = (c: CoachClass) => {
    const message = `Delete ${c.title} on ${shortDate(c.date)}? This class will be cancelled.`
    if (Platform.OS !== "web") return Alert.alert("Delete class", message, [{ text: "Keep class", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => onDelete(c) }])
    if ((globalThis as { confirm?: (m: string) => boolean }).confirm?.(message)) onDelete(c)
  }
  return <Screen title="Coach Schedule" onBack={onBack}>
    <View accessibilityRole="tablist" style={s.pills}>{(["calendar", "upcoming"] as const).map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: view.tab === tab }} style={[s.pill, view.tab === tab && s.pillOn]} onPress={() => onChange({ ...view, tab })}>
      <Text style={s.pillText}>{tab === "calendar" ? "Calendar" : "Upcoming"}</Text>
    </Pressable>)}</View>
    {view.tab === "calendar"
      ? <MonthCalendar month={view.month} selected={view.selected} cancelled={cancelled} onMonth={(month) => onChange({ ...view, month })} onSelect={(selected) => onChange({ ...view, selected, month: new Date(selected.getFullYear(), selected.getMonth(), 1) })} />
      : <View style={s.viewAll}><SeeAll label="View All" onPress={onViewAll} /></View>}
    {view.tab === "calendar" && <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{dayHeading(view.selected)}</Text>
      {list.length > 0 && <SeeAll label={canEdit ? "Done" : "Edit"} onPress={() => setEditing(!canEdit)} />}
    </View>}
    {list.map((c) => canEdit
      ? <View key={c.id} style={s.editRow}>
          <ClassCard item={c} editing onPress={() => onOpenClass(c)} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${c.title}, ${shortDate(c.date)}`} style={s.deleteStrip} onPress={() => confirmDelete(c)}><SvgXml xml={TRASH_WHITE} width={14} height={14} /></Pressable>
        </View>
      : <ClassCard key={c.id} item={c} onPress={() => onOpenClass(c)} />)}
    {!list.length && <Text style={s.empty}>{view.tab === "calendar" ? "No classes on this day." : "No upcoming classes."}</Text>}
  </Screen>
}

function MonthCalendar({ month, selected, cancelled, onMonth, onSelect }: { month: Date; selected: Date; cancelled: ReadonlySet<string>; onMonth: (m: Date) => void; onSelect: (d: Date) => void }) {
  const { classesOn, upcomingClasses, schedulesOf, titles: PROGRAM_TITLES } = useCoachSchedule()

  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, i) => addDays(first, i - offset))
  const shift = (n: number) => onMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  return <View style={s.calendar}>
    <View style={s.calHead}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={6} style={s.calArrow} onPress={() => shift(-1)}><Feather name="chevron-left" size={16} color={CAL_INK} /></Pressable>
      <View style={s.calTitle}><Text style={s.calMonth}>{MONTH_NAMES[month.getMonth()]}</Text><Text style={s.calYear}>{month.getFullYear()}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={6} style={s.calArrow} onPress={() => shift(1)}><Feather name="chevron-right" size={16} color={CAL_INK} /></Pressable>
    </View>
    <View style={s.calRow}>{WEEKDAYS.map((w) => <Text key={w} numberOfLines={1} style={s.weekday}>{w}</Text>)}</View>
    {Array.from({ length: cells.length / 7 }, (_, row) => <View key={row} style={s.calRow}>{cells.slice(row * 7, row * 7 + 7).map((d) => {
      const inMonth = d.getMonth() === month.getMonth(), on = sameDay(d, selected)
      const dots = inMonth ? classesOn(d, cancelled).map((c) => c.color) : []
      return <Pressable key={dayKey(d)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${dots.length} classes`} style={s.dayCell} onPress={() => onSelect(d)}>
        <View style={[s.dayBox, on && s.dayBoxOn]}><Text style={[s.day, !inMonth && { color: CAL_MUTED }, on && s.dayOn]}>{d.getDate()}</Text></View>
        <View style={s.dayDots}>{dots.map((color, i) => <View key={i} style={[s.dayDot, { borderColor: color }]} />)}</View>
      </Pressable>
    })}</View>)}
  </View>
}

export function AllEnrollment({ cancelled, onBack, onOpenClass }: { cancelled: ReadonlySet<string>; onBack: () => void; onOpenClass: (c: CoachClass) => void }) {
  const { classesOn, upcomingClasses, schedulesOf, titles: PROGRAM_TITLES } = useCoachSchedule()

  const list = upcomingClasses(startOfDay(new Date()), 30, cancelled)
  return <Screen title="All Enrollment" onBack={onBack}>
    {list.map((c) => <ClassCard key={c.id} item={c} onPress={() => onOpenClass(c)} />)}
    {!list.length && <Text style={s.empty}>No upcoming classes.</Text>}
  </Screen>
}

const ACKNOWLEDGEMENTS = [
  "You have responsibility to coach the class on time with quality service",
  "Missed class may be subject to a service charge",
  "Students are be able join at any point during the course. If student joining mid-course, the student only pays for the remaining classes (e.g. 2 out of 5 classes already finished, thus the student only pays for the 3 remaining classes, not the full program)",
]

function LessonDates({ dates, startMinutes, endMinutes, duration, inset = false }: { dates: Date[]; startMinutes: number; endMinutes: number; duration?: string; inset?: boolean }) {
  return <View style={[s.lessonDates, inset && s.lessonDatesInset]}>
    <Text style={s.lessonDatesTitle}>Lesson dates</Text>
    {dates.map((d, i) => <View key={dayKey(d)} style={s.lessonDate}>
      <Text style={s.lessonNumber}>{i + 1}</Text><Dot />
      <View style={s.lessonCopy}>
        <Text style={s.lessonDay}>{lessonDay(d)}</Text>
        <View style={s.lessonTimeRow}><Text style={s.lessonTime}>{clock(startMinutes)} - {clock(endMinutes)}</Text>{duration && <Text style={s.lessonDuration}>({duration})</Text>}</View>
      </View>
    </View>)}
  </View>
}

function DatesToggle({ open, label = "Show full dates", onPress }: { open: boolean; label?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} hitSlop={8} style={s.showDates} onPress={onPress}>
    <Text style={s.showDatesText}>{open ? "Hide full dates" : label}</Text>
    <View style={open && s.flip}><SvgXml xml={ICON.arrowDown} width={16} height={16} /></View>
  </Pressable>
}

export function ClassDetail({ item, coachName, coachAvatar, attended, onBack, onStudents, onAttendance, onCancel, onRearrange }: { onRearrange?:()=>Promise<void>; item: CoachClass; coachName: string; coachAvatar: ImageSourcePropType | null; attended: boolean; onBack: () => void; onStudents: () => void; onAttendance: () => void; onCancel: () => void }) {
  const [showDates, setShowDates] = useState(false)
  const dates = programDates(item)
  const students = item.attendee.kind === "group" ? item.attendee.count : 1
  const cancel = () => Alert.alert("Cancel class", `Cancel ${item.title} on ${shortDate(item.date)}? This class will be cancelled.`, [{ text: "Keep class", style: "cancel" }, { text: "Cancel class", style: "destructive", onPress: onCancel }])
  const footer = <View style={s.detailFooter}>
    <Pressable accessibilityRole="button" style={s.rearrange} onPress={async()=>{try{if(onRearrange)await onRearrange();Alert.alert("Rearrange class",`A rearrangement request for ${shortDate(item.date)} has been sent to the centre.`)}catch(e){Alert.alert("Unable to request rearrangement",(e as Error).message)}}}><Text style={s.buttonText}>Rearrange class</Text></Pressable>
    <Pressable accessibilityRole="button" hitSlop={8} onPress={cancel}><Text style={s.cancelText}>Cancel class</Text></Pressable>
  </View>
  return <Screen title="Class Detail" onBack={onBack} footer={footer}>
    <View style={s.detailCard}>
      <View style={s.timeRow}><View style={[s.ring, { borderColor: item.color }]} /><Text style={s.time}>{item.time}</Text><Dot /><Text style={s.cardDate}>{shortDate(item.date)}</Text></View>
      <View style={s.classRow}>
        <View style={s.classPhoto}><Photo source={item.image} fallback={IMG.checkin} /></View>
        <View style={s.classCopy}>
          <Text style={s.classTitle}>{item.title}</Text>
          <View style={s.inlineWide}><Text style={s.lesson}>Lesson {item.lesson} of {item.totalLessons??LESSONS}</Text><Pressable accessibilityRole="button" accessibilityLabel={`View ${students} student${students > 1 ? "s" : ""}`} hitSlop={8} style={s.inlineTight} onPress={onStudents}><SvgXml xml={ICON.people} width={14} height={14} /><Text style={s.count}>{students}</Text></Pressable></View>
          <View style={s.metaRow}><SvgXml xml={ICON.global} width={16} height={16} /><Text style={s.meta}>{item.roster?item.language||"Language TBC":"Cantonese"}</Text></View>
          <View style={s.metaRow}><SvgXml xml={ICON.location} width={16} height={16} /><Text style={s.meta}>{item.roster?item.location||"Location TBC":"Shop 1B, Class Mall, Central, Hong Kong"}</Text></View>
        </View>
      </View>
      <View style={s.priceBlock}>
        <View style={s.price}><Text style={s.priceValue}>{item.roster ? (item.price!=null?`$${item.price}`:"Price TBC") : "$299"}</Text><Text style={s.priceUnit}>whole program</Text></View>
        <View style={s.inline}><Text style={s.lesson}>{item.totalLessons??LESSONS} lessons</Text><Dot /><Text style={s.cardDate}>{rangeDate(dates[0])} - {rangeDate(dates[dates.length - 1])}</Text></View>
        <DatesToggle open={showDates} onPress={() => setShowDates((v) => !v)} />
        <View style={s.rule} />
      </View>
      {showDates && <LessonDates dates={dates} startMinutes={item.startMinutes} endMinutes={item.endMinutes} duration={hours(item)} inset />}
    </View>

    <View style={s.attendance}>
      <Text style={s.attendanceHint}>{attended ? "Attendance taken. Payment for this class is secured." : "Take attendance before class to secure payment"}</Text>
      <Pressable accessibilityRole="button" style={s.button} onPress={onAttendance}><Text style={s.buttonText}>{attended ? "Attendance taken" : "Attendance taking"}</Text></Pressable>
    </View>
    <View style={[s.rule, s.ruleInset]} />

    <View style={s.hosted}>
      <Text style={s.hostedTitle}>Hosted by</Text>
      <View style={s.hostRow}>
        <Image source={IMG.hostCentre} style={s.hostAvatar} />
        <Text style={s.hostName}>{item.centerName||HOST_CENTRE}</Text>
        <View style={s.inlineTight}><SvgXml xml={ICON.star} width={14} height={14} /><Text style={s.rating}>{item.roster?(item.rating!=null?Number(item.rating).toFixed(2):"—"):"4.91"}</Text></View>
      </View>
      <View style={s.hostRow}>
        <View style={[s.hostAvatar, s.hostAvatarEmpty]}>{coachAvatar ? <Image source={coachAvatar} style={s.hostAvatar} /> : <Feather name="user" size={22} color="#BDBDBD" />}</View>
        <View style={s.coachCopy}><Text style={s.hostName}>{coachName}</Text><Text style={s.coachRole}>Program Coach</Text></View>
      </View>
    </View>

    <View style={s.notes}>
      <View style={s.rule} />
      <View style={s.noteBlock}><Text style={s.noteLabel}>Special note:</Text><Text style={s.noteText}>{item.sen ? "Special note: SEN-friendly" : "No special note"}</Text></View>
      <View style={s.rule} />
      <View style={s.ack}>
        <Text style={s.noteLabel}>By proceeding, you acknowledged that</Text>
        {ACKNOWLEDGEMENTS.map((text, i) => <View key={i} style={s.ackRow}><Text style={s.ackNumber}>{i + 1}.</Text><Text style={s.ackText}>{text}</Text></View>)}
      </View>
    </View>
  </Screen>
}

export function StudentList({ item, students, title = "Student List", onBack, onOpen }: { item: CoachClass; title?: string; students?: Student[]; onBack: () => void; onOpen?: (st: Student) => void }) {
  const enrolled = addDays(programDates(item)[0], -14)
  const roster = rosterOf(item), list = students ?? roster
  return <Screen title={title} onBack={onBack}>
    <Text style={s.studentsProgram}>{item.title}</Text>
    <View style={s.studentGrid}>{list.map((st) => <Pressable key={studentKey(st)} accessibilityRole={onOpen ? "button" : undefined} accessibilityLabel={onOpen ? `Write feedback for ${st.name}` : undefined} disabled={!onOpen} style={s.studentCell} onPress={() => onOpen?.(st)}>
      <View style={s.kidPhoto}><Photo source={st.photo} label={st.name} /><View style={s.kidShade} /></View>
      <View style={s.kidCopy}>
        <View style={s.kidNameRow}><Text numberOfLines={1} style={s.kidName}>{st.name}</Text>{st.sen && <View style={s.senPill}><Text style={s.senPillText}>SEN</Text></View>}</View>
        <Text style={s.kidDate}>{st.enrolledAt?slashDate(new Date(st.enrolledAt)):item.roster?"":slashDate(addDays(enrolled, -roster.indexOf(st)))}</Text>
      </View>
    </Pressable>)}</View>
    {!list.length && <Text style={s.empty}>All feedback for this class has been submitted.</Text>}
  </Screen>
}

export function Announce({ item, coachName, messages, onBack, onSend, onStudents }: { item: CoachClass; coachName: string; messages: Announcement[]; onBack: () => void; onSend: (text: string,image?:string) => void|Promise<void>; onStudents: () => void }) {
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState("")
  const [attachment,setAttachment]=useState<string|undefined>()
  const [sending,setSending]=useState(false)
  const send = async () => { const text=draft.trim();if((!text&&!attachment)||sending)return;setSending(true);try{await onSend(text,attachment);setDraft("");setAttachment(undefined)}catch(e){Alert.alert("Unable to send",(e as Error).message)}finally{setSending(false)} }
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <View style={[s.announceHeader, { paddingTop: insets.top + 8 }]}>
      <View style={s.announceTitleRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} style={[s.back, s.backInline]} onPress={onBack}><SvgXml xml={ICON.back} width={16} height={16} /></Pressable>
        <Text accessibilityRole="header" numberOfLines={1} style={s.announceTitle}>{item.title}</Text>
      </View>
      <Text style={s.announceBy}>by {coachName}</Text>
    </View>
    <ScrollView contentContainerStyle={s.announceBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="View student list" style={s.announceCard} onPress={onStudents}>
        <View style={s.timeRow}><View style={[s.ring, { borderColor: item.color }]} /><Text style={s.time}>{item.time}</Text></View>
        <View style={s.announceKids}>{rosterOf(item).slice(0, 4).map((st) => <View key={studentKey(st)} style={s.announceKid}>
          <View style={s.announceKidPhoto}><Photo source={st.photo} /><View style={s.kidShade} /></View>
          <Text style={s.announceKidName}>{st.name.split(" ")[0]}</Text>
        </View>)}</View>
      </Pressable>
      <Text style={s.announceNote}>Only current enrolled student will receive the announcement. New students can only view new announcement after their enrolment.</Text>
      {!!messages.length && <View style={s.todayBadge}><Text style={s.todayText}>Today</Text></View>}
      {messages.map((m) => <View key={m.id} style={s.bubble}>
        <View style={s.flip}><SvgXml xml={ICON.info} width={24} height={24} /></View>
        <Text style={s.bubbleText}>{m.text}</Text>{m.image&&<Image source={{uri:assetUrl(m.image)!}} style={{width:220,height:180,borderRadius:8}} resizeMode="contain"/>}
      </View>)}
    </ScrollView>
    {attachment&&<Pressable accessibilityRole="button" accessibilityLabel="Remove attached photo" onPress={()=>setAttachment(undefined)}><Image source={{uri:attachment}} style={{width:80,height:80,margin:12}}/></Pressable>}
    <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 32) }]}>
      <View style={s.composerInput}>
        <TextInput accessibilityLabel="Type message" value={draft} onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" placeholder="Type message" placeholderTextColor="#B0B0B0" maxLength={500} style={s.composerText} />
        <Pressable accessibilityRole="button" accessibilityLabel="Attach photo" hitSlop={8} onPress={()=>pickPhotos(1).then(result=>setAttachment(result.uris[0])).catch(e=>Alert.alert("Photo",e.message))}><SvgXml xml={ICON.camera} width={20} height={20} /></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Send announcement" accessibilityState={{ disabled: !draft.trim() }} style={s.back} onPress={send}><SvgXml xml={ICON.send} width={24} height={24} /></Pressable>
    </View>
  </KeyboardAvoidingView>
}

export function Programs({ cancelled, onBack, onOpen }: { cancelled: ReadonlySet<string>; onBack: () => void; onOpen: (title: string) => void }) {
  const { classesOn, upcomingClasses, schedulesOf, titles: PROGRAM_TITLES } = useCoachSchedule()

  const sessions = upcomingClasses(startOfDay(new Date()), 60, cancelled)
  return <Screen title="Programs" onBack={onBack}>
    {PROGRAM_TITLES.map((title) => {
      const program = (sessions.find(p=>p.title===title) ?? PROGRAMS.find((p) => p.title === title)!) as CoachClass, count = sessions.filter((c) => c.title === title).length
      return <Pressable key={title} accessibilityRole="button" accessibilityLabel={`${title}, ${count} schedules`} style={s.programCard} onPress={() => onOpen(title)}>
        <View style={s.programPhoto}>
          <Photo source={PROGRAM_IMAGES[title] ?? program.image} fallback={IMG.checkin} />
          {program.sen && <View style={s.senBadge}><SvgXml xml={ICON.tick} width={14} height={14} /><Text style={s.senText}>SEN</Text></View>}
        </View>
        <View style={s.programBody}>
          <View style={s.programInfo}>
            <Text numberOfLines={1} style={s.checkinTitle}>{title}</Text>
            <View style={s.inline}><Text style={s.checkinTime}><Text style={s.bold}>{program.roster?(program.price!=null?`$${program.price}`:"Price TBC"):"$299"}</Text> lesson</Text><Dot /><Text style={s.checkinLesson}>{program.roster ? program.ageTag ? `Age ${program.ageTag}` : "Age TBC" : "Age 3-6"}</Text></View>
          </View>
          <Text style={s.schedules}>{count >= 10 ? "10+" : count} schedules</Text>
        </View>
      </Pressable>
    })}
  </Screen>
}

function ScheduleCard({ schedule }: { schedule: ProgramSchedule }) {
  const [open, setOpen] = useState(false)
  const { first, dates } = schedule, a = first.attendee
  const spots = a.kind === "group" ? (first.capacity??SPOTS) - a.count : 0
  return <View style={s.scheduleCard}>
    <View style={s.scheduleInfo}>
      <View style={s.inline}><Text style={s.scheduleLessons}>{first.totalLessons??LESSONS} lessons</Text><Dot /><Text style={s.scheduleRange}>{rangeDate(dates[0])} - {rangeDate(dates[dates.length - 1])}</Text></View>
      <View style={s.scheduleGoing}><Going attendee={a} />{spots > 0 && <Text style={s.spots}>{spots} spots left</Text>}</View>
      <View style={s.metaRow}><SvgXml xml={ICON.global} width={16} height={16} /><Text style={s.meta}>{first.roster?first.language||"Language TBC":"Cantonese"}</Text></View>
      <View style={s.metaRow}><SvgXml xml={ICON.location} width={16} height={16} /><Text style={s.meta}>{first.roster?first.location||"Location TBC":"Shop 1B, Class Mall, Central, Hong Kong"}</Text></View>
      <DatesToggle open={open} label="View full dates" onPress={() => setOpen((v) => !v)} />
    </View>
    {open && <><View style={s.rule} /><LessonDates dates={dates} startMinutes={first.startMinutes} endMinutes={first.endMinutes} /></>}
  </View>
}

export function ProgramDetail({ title, cancelled, onBack }: { title: string; cancelled: ReadonlySet<string>; onBack: () => void }) {
  const { classesOn, upcomingClasses, schedulesOf, titles: PROGRAM_TITLES } = useCoachSchedule()

  const program = PROGRAMS.find((p) => p.title === title)
  const schedules = schedulesOf(title, cancelled)
  return <Screen title="Program Details" onBack={onBack}>
    {program && <View style={s.heroPhoto}><Photo source={PROGRAM_IMAGES[title] ?? program.image} fallback={IMG.checkin} /></View>}
    <View style={s.programIntro}>
      <Text style={s.programTitle}>{title}</Text>
      <Text style={s.programDesc}>This is {title}! Our centre is designed to provide a stimulating and supportive environment where learners of all ages can engage.</Text>
    </View>
    <View style={[s.rule, s.ruleInset]} />
    {schedules.map((sch) => <ScheduleCard key={sch.id} schedule={sch} />)}
    {!schedules.length && <Text style={s.empty}>No upcoming schedules.</Text>}
  </Screen>
}

export function CheckIns({ cancelled, onBack, onOpen }: { cancelled: ReadonlySet<string>; onBack: () => void; onOpen: (c: CoachClass) => void }) {
  const { classesOn, upcomingClasses, schedulesOf, titles: PROGRAM_TITLES } = useCoachSchedule()

  const list = classesOn(startOfDay(new Date()), cancelled)
  return <Screen title="Today’s Check In" medium onBack={onBack}>
    {list.map((c) => <ClassCard key={c.id} item={c} dated={false} onPress={() => onOpen(c)} />)}
    {!list.length && <Text style={s.empty}>No check-ins today.</Text>}
  </Screen>
}

function AttendanceScanner({onScan,onClose}:{onScan:(code:string,enrollmentId:number)=>Promise<void>;onClose:()=>void}) {
  const [permission,requestPermission]=useCameraPermissions()
  const [error,setError]=useState("")
  const busy=useRef(false)
  return <Modal visible animationType="slide" onRequestClose={onClose}><View style={{flex:1,padding:24,paddingTop:60,backgroundColor:"#fff"}}><Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose}><Feather name="x" size={28}/></Pressable><Text style={s.title}>Scan parent’s class QR code</Text>
    {!permission?.granted?<><Text style={s.codeHint}>Allow camera access to scan the parent's class code.</Text><Pressable accessibilityRole="button" style={s.back} onPress={()=>requestPermission()}><Text>Allow camera</Text></Pressable></>:<CameraView style={{flex:1,marginVertical:24}} facing="back" barcodeScannerSettings={{barcodeTypes:["qr"]}} onBarcodeScanned={async({data})=>{if(busy.current)return;const match=/^classz:attendance:(\d+):(\d{4})$/.exec(data);if(!match){setError("This is not a ClassZ attendance code.");return}busy.current=true;try{await onScan(match[2],Number(match[1]));onClose()}catch(e){setError((e as Error).message);busy.current=false}}}/>}
    {!!error&&<Text accessibilityRole="alert" style={s.formError}>{error}</Text>}
  </View></Modal>
}
export function Attendance({ item, checked, onBack, onCheckIn, onVerify }: { onVerify?: (code:string,enrollmentId?:number)=>Promise<void>; item: CoachClass; checked: string[]; onBack: () => void; onCheckIn: (name: string) => void }) {
  const roster = rosterOf(item)
  const [code, setCode] = useState("")
  const [scanNote, setScanNote] = useState(false)
  const [verificationError,setVerificationError]=useState("")
  const [verifying,setVerifying]=useState(false)
  const next = roster.find((st) => !checked.includes(studentKey(st)))
  const enter = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 4)
    setCode(digits.length === 4 ? "" : digits)
    if (digits.length === 4 && next) { if(onVerify){setVerifying(true);setVerificationError("");onVerify(digits).catch(e=>setVerificationError(e.message)).finally(()=>setVerifying(false))} else onCheckIn(next.name) }
  }
  return <Screen title="Verification" onBack={onBack}>
    <View style={s.attendCard}>
      <View style={s.attendCount}><SvgXml xml={ICON.peopleSm} width={16} height={16} /><Text style={s.attendCountText}>{checked.length}/{roster.length}</Text></View>
      <View style={s.rule} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.attendKids}>
        {roster.map((st) => { const on = checked.includes(studentKey(st)); return <View key={studentKey(st)} accessible accessibilityLabel={`${st.name}, ${on ? "checked in" : "not checked in"}`} style={s.attendKid}>
          <View>
            <View style={[s.attendPhoto, on && s.attendPhotoOn]}><Photo source={st.photo} /></View>
            {on && <View style={s.attendTick}><SvgXml xml={ICON.checkWhite} width={10} height={10} /></View>}
          </View>
          <Text numberOfLines={1} style={s.attendName}>{st.name.split(" ")[0]}</Text>
        </View> })}
      </ScrollView>
    </View>
    <View style={[s.rule, s.ruleInset]} />
    <Text style={s.codeHint}>{next ? "Remember to take\na photo for each student for the progress check" : "All students have checked in."}</Text>
    <View style={s.codeRow}>
      {[0, 1, 2, 3].map((i) => <View key={i} style={[s.codeBox, !next && s.codeBoxOff]}><Text style={s.codeDigit}>{code[i] ?? ""}</Text></View>)}
      <TextInput accessibilityLabel="Check-in code" value={code} onChangeText={enter} editable={!!next&&!verifying} keyboardType="number-pad" maxLength={4} caretHidden style={s.codeInput} />
    </View>
    {!!verificationError&&<Text accessibilityRole="alert" style={s.formError}>{verificationError}</Text>}
    <View style={s.orRow}><View style={s.orLine} /><Text style={s.orText}>or</Text><View style={s.orLine} /></View>
    <Pressable accessibilityRole="button" hitSlop={8} style={s.scan} onPress={() => setScanNote(true)}><Text style={s.scanText}>Scan QR Code</Text></Pressable>
    {scanNote && onVerify && <AttendanceScanner onClose={()=>setScanNote(false)} onScan={onVerify}/>}
  </Screen>
}

export function PendingFeedback({ pending, onBack, onOpen }: { pending: PendingClass[]; onBack: () => void; onOpen: (c: CoachClass) => void }) {
  return <Screen title="Pending Feedback" medium onBack={onBack}>
    {pending.map(({ item, pending: left, total }) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}, ${shortDate(item.date)}, ${total - left.length} of ${total} feedback submitted`} style={s.programCard} onPress={() => onOpen(item)}>
      <View style={s.programPhoto}>
        <Photo source={item.image} fallback={IMG.checkin} />
        {item.sen && <View style={s.senBadge}><SvgXml xml={ICON.tick} width={14} height={14} /><Text style={s.senText}>SEN</Text></View>}
      </View>
      <View style={s.pendingBody}>
        <View style={s.programInfo}>
          <Text numberOfLines={1} style={s.checkinTitle}>{item.title}</Text>
          <View style={s.inline}><Text style={s.checkinTime}>{item.time}</Text><Dot /><Text style={s.checkinLesson}>Lesson {item.lesson} of {item.totalLessons??LESSONS}</Text></View>
        </View>
        <View style={s.pendingCount}><SvgXml xml={ICON.warning} width={22} height={22} /><Text style={s.pendingCountText}>{total - left.length}/{total}</Text></View>
      </View>
    </Pressable>)}
    {!pending.length && <Text style={s.empty}>All feedback is up to date.</Text>}
  </Screen>
}

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`
const recordDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} (${WEEKDAYS[(d.getDay() + 6) % 7]})`

function RecordCard({ item, lesson, date, coachName, coachAvatar, onPress, pending = false }: { pending?: boolean; item: CoachClass; lesson: number; date: Date; coachName: string; coachAvatar: ImageSourcePropType | null; onPress?: () => void }) {
  return <Pressable accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={onPress ? `${pending ? "Write" : "View"} ${ordinal(lesson)} lesson record` : undefined} disabled={!onPress} style={s.recordCard} onPress={onPress}>
    <View style={s.recordInfo}>
      <View style={s.recordHead}>
        <Text style={s.recordTitle}>{item.title}</Text>
        {pending && <View style={s.inline}><SvgXml xml={ICON.warningSm} width={20} height={20} /><Text style={s.recordPending}>Pending</Text></View>}
      </View>
      <View style={s.recordRow}><SvgXml xml={ICON.menuBoard} width={16} height={16} /><Text style={s.meta}>{ordinal(lesson)} lesson</Text></View>
      <View style={s.recordRow}>
        <View style={s.recordHalf}><SvgXml xml={ICON.menuBoard} width={16} height={16} /><Text style={s.meta}>{recordDate(date)}</Text></View>
        <View style={s.recordHalf}><SvgXml xml={ICON.menuBoard} width={16} height={16} /><Text style={s.meta}>{clock(item.startMinutes)}-{clock(item.endMinutes)}</Text></View>
      </View>
      <View style={s.recordRow}><SvgXml xml={ICON.location} width={16} height={16} /><Text style={s.meta}>{item.centerName||HOST_CENTRE}</Text></View>
    </View>
    <View style={s.recordBy}>
      <View style={[s.recordAvatar, s.hostAvatarEmpty]}>{coachAvatar ? <Image source={coachAvatar} style={s.photoFill} /> : <Feather name="user" size={14} color="#BDBDBD" />}</View>
      <Text style={s.recordByText}>By {coachName}</Text>
    </View>
  </Pressable>
}

export function Feedback({ item, student, coachName, coachAvatar, onBack, onRecord, onViewRecord, recordSubmitted = false, history = [], onViewHistory }: { history?:CoachClass[]; onViewHistory?:(item:CoachClass)=>void; onViewRecord: (lesson: number) => void; recordSubmitted?: boolean; item: CoachClass; student: Student; coachName: string; coachAvatar: ImageSourcePropType | null; onBack: () => void; onRecord: () => void }) {
  const dates = programDates(item)
  const past = item.roster ? [] : Array.from({ length: item.lesson - 1 }, (_, i) => item.lesson - 1 - i)
  return <Screen title="Feedback" onBack={onBack}>
    <View style={s.heroPhoto}><Photo source={FEEDBACK_IMAGES[item.key] ?? PROGRAM_IMAGES[item.title] ?? item.image} fallback={IMG.checkin} /></View>
    <View style={s.programIntro}>
      <Text style={s.programTitle}>{item.key === "watercolour" ? "Watercolour painting\n(intermediate)" : item.title}</Text>
      <View style={s.feedbackMeta}>
        <View style={s.feedbackMetaLine}>
          <View style={s.inline}><SvgXml xml={ICON.menuBoard} width={12} height={12} /><Text style={s.meta}>{ordinal(item.lesson)} lesson</Text></View>
          <View style={s.inline}><SvgXml xml={ICON.menuBoard} width={12} height={12} /><Text style={s.meta}>{recordDate(item.date)}</Text></View>
          <View style={s.inline}><SvgXml xml={ICON.menuBoard} width={12} height={12} /><Text style={s.meta}>{clock(item.startMinutes)}-{clock(item.endMinutes)}</Text></View>
        </View>
        <View style={s.metaRow}><SvgXml xml={ICON.location} width={12} height={12} /><Text style={s.meta}>{item.roster ? item.location || item.centerName || "Centre" : "Centre"}</Text></View>
      </View>
    </View>
    <View style={s.section}>
      <Text style={s.blockTitle}>Feedback for</Text>
      <View style={s.hostRow}>
        <View style={[s.hostAvatar, s.hostAvatarEmpty]}><Photo source={student.photo} /></View>
        <View style={s.forCopy}>
          <Text style={s.hostName}>{student.name}</Text>
          <View style={s.inline}>{student.male ? <Image source={IMG.male} style={s.gender} /> : <SvgXml xml={ICON.female} width={15} height={15} />}<Text style={s.forAge}>Age {student.age}</Text></View>
        </View>
      </View>
    </View>
    <View style={s.hosted}>
      <Text style={s.blockTitle}>Feedback by</Text>
      <View style={s.hostRow}><Image source={IMG.hostCentre} style={s.hostAvatar} /><Text style={s.hostName}>{item.centerName||HOST_CENTRE}</Text><View style={s.inlineTight}><SvgXml xml={ICON.star} width={14} height={14} /><Text style={s.rating}>{item.roster?(item.rating!=null?Number(item.rating).toFixed(2):"—"):"4.91"}</Text></View></View>
      <View style={s.hostRow}><View style={[s.hostAvatar, s.hostAvatarEmpty]}>{coachAvatar ? <Image source={coachAvatar} style={s.hostAvatar} /> : <Feather name="user" size={22} color="#BDBDBD" />}</View><View style={s.coachCopy}><Text style={s.hostName}>{coachName}</Text><Text style={s.coachRole}>Program Coach</Text></View></View>
    </View>
    {!recordSubmitted && <View style={s.section}>
      <Text style={s.blockTitle}>In Progress</Text>
      <RecordCard pending item={item} lesson={item.lesson} date={item.date} coachName={coachName} coachAvatar={coachAvatar} onPress={onRecord} />
    </View>}
    {(past.length > 0 || history.length > 0 || recordSubmitted) && <View style={s.section}>
      <Text style={s.blockTitle}>Records</Text>
      {recordSubmitted && <RecordCard item={item} lesson={item.lesson} date={item.date} coachName={coachName} coachAvatar={coachAvatar} onPress={() => onViewRecord(item.lesson)} />}
      {history.map(c=><RecordCard key={c.id} item={c} lesson={c.lesson} date={c.date} coachName={coachName} coachAvatar={coachAvatar} onPress={()=>onViewHistory?.(c)}/>)}
      {past.map((n) => <RecordCard key={n} item={item} lesson={n} date={dates[n - 1]} coachName={coachName} coachAvatar={coachAvatar} onPress={() => onViewRecord(n)} />)}
    </View>}
  </Screen>
}

type Option = { label: string; hint?: string }
const PROGRESS: Option[] = [
  { label: "Supported", hint: "Needs close support" },
  { label: "Guided", hint: "Can attempt with demonstration or reminders" },
  { label: "Developing", hint: "Can complete familiar parts with light support" },
  { label: "Independent", hint: "Can complete independently" },
]
const TRAITS = ["Participates actively", "Responds well to feedback", "Works carefully", "Tries independently", "Needs encouragement to start", "Stays focused", "Collaborates well", "Shows persistence", "Hesitant with new tasks", "Shows initiative", "Asks questions", "Checks mistakes carefully"]
const ACTIVITY_AREAS = ["Technique/ Control", "Consistency/ Quality", "Focus/ Persistence", "Confidence to try", "Communication/ Expression", "Teamwork/ Collaboration", "Creativity", "Problem Solving", "Physical Coordination", "Independence"]
const ACADEMIC_AREAS = ["Concept understanding", "Method/ Process", "Application", "Accuracy", "Question interpretation", "Explanation/ Writing", "Memory/ Recall", "Exam Technique", "Independent practice", "Learning consistency"]
const RECORD_OPTIONS = {
  activity: {
    title: "Activity Record", areas: ACTIVITY_AREAS,
    observed: ["Needed demonstration first", "Completed with reminders", "Corrected after feedback", "Repeated more consistently", "Tried independently", "Completed with focus", "Applied in a new situation", "Worked well with others", "Showed original ideas", "Stayed engaged during challenge"],
  },
  academic: {
    title: "Academic Record", areas: ACADEMIC_AREAS,
    observed: ["Need step-by-step guidance", "Understood after explanation", "Corrected after reminder", "Solved familiar questions with support", "Solved familiar questions independently", "Applied method to mixed questions", "Explained the method clearly", "Made repeated accuracy mistakes", "Struggled to identify question type", "Completed task with good accuracy"],
  },
}
const MAX_PICKS = 2, MAX_PHOTOS = 5, MAX_PHOTO_BYTES = 5 * 1024 * 1024, MAX_WORDS = 100
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

function TextBox({ label, placeholder, value, onChange, tall = false, readOnly = false }: { readOnly?: boolean; label: string; placeholder: string; value: string; onChange: (v: string) => void; tall?: boolean }) {
  const [focus, setFocus] = useState(false)
  return <View style={[s.formBox, focus && s.formBoxOn, tall && s.formBoxTall]}>
    <Text style={s.formLabel}>{label}</Text>
    <TextInput editable={!readOnly} accessibilityLabel={label} value={value} onChangeText={onChange} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} placeholder={placeholder} placeholderTextColor="#B0B0B0" multiline={tall} textAlignVertical="top" style={[s.formValue, tall && s.formValueTall]} />
  </View>
}

function SelectBox({ label, open, onToggle, children, menu, readOnly = false }: { readOnly?: boolean; label: string; open: boolean; onToggle: () => void; children: ReactNode; menu: ReactNode }) {
  return <View style={open && s.selectOpen}>
    <Pressable accessibilityRole="button" disabled={readOnly} accessibilityLabel={label} accessibilityState={{ expanded: open, disabled: readOnly }} style={[s.formBox, open && s.formBoxOn]} onPress={onToggle}>
      <Text style={s.formLabel}>{label}</Text>
      <View style={s.selectRow}><View style={s.selectValue}>{children}</View><SvgXml xml={ICON.selectArrow} width={18.5} height={18.5} /></View>
    </Pressable>
    {open && menu}
  </View>
}

function MultiSelect({ label, options, value, open, onToggle, onChange, readOnly = false }: { readOnly?: boolean; label: string; options: string[]; value: string[]; open: boolean; onToggle: () => void; onChange: (v: string[]) => void }) {
  const full = value.length >= MAX_PICKS
  const menu = <View style={s.multiMenu}><ScrollView nestedScrollEnabled style={s.multiScroll} contentContainerStyle={s.multiList} showsVerticalScrollIndicator={false}>
    {options.map((o) => { const on = value.includes(o), off = full && !on; return <Pressable key={o} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: off }} disabled={off} style={[s.multiOption, off && s.multiOff]} onPress={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}>
      <SvgXml xml={on ? ICON.tickOn : ICON.tickOff} width={18.5} height={18.5} /><Text style={s.multiText}>{o}</Text>
    </Pressable> })}
  </ScrollView></View>
  return <SelectBox readOnly={readOnly} label={label} open={open} onToggle={onToggle} menu={menu}>
    {value.length ? <View style={s.chips}>{value.map((v) => <View key={v} style={s.chip}>
      <Text style={s.chipText}>{v}</Text>
      {!readOnly && <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${v}`} hitSlop={8} onPress={() => onChange(value.filter((x) => x !== v))}><SvgXml xml={ICON.closeMd} width={14} height={14} /></Pressable>}
    </View>)}</View> : <Text style={s.formPlaceholder}>Select 1-2</Text>}
  </SelectBox>
}

async function pickPhotos(limit: number) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) throw new Error("Photo library permission is required.")
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, base64: true, selectionLimit: limit, quality: 0.7 })
  if (result.canceled) return { uris: [], tooLarge: 0 }
  const ok = result.assets.filter((a) => !a.fileSize || a.fileSize <= MAX_PHOTO_BYTES).slice(0, limit)
  return { uris: ok.map((a) => a.base64 ? `data:${a.mimeType||"image/jpeg"};base64,${a.base64}` : a.uri), tooLarge: result.assets.length - ok.length }
}

export type LearningRecordValue = { focus: string; progress: string; observed: string[]; strongest: string[]; attention: string[]; suggestion: string; traits: string[]; comment: string; photos: string[] }
export function LearningRecord({ item, student, onBack, onSave, initialValue, readOnly = false }: { initialValue?: LearningRecordValue; readOnly?: boolean; item: CoachClass; student: Student; onBack: () => void; onSave: (record: LearningRecordValue) => void | Promise<void> }) {
  const insets = useSafeAreaInsets()
  const kind = item.key === "academic" ? RECORD_OPTIONS.academic : RECORD_OPTIONS.activity
  const [form, setForm] = useState<LearningRecordValue>(initialValue ?? (readOnly ? { focus: item.key === "academic" ? "Understanding number patterns" : "Colour blending and control", progress: "Guided", observed: [kind.observed[1]], strongest: [kind.areas[0]], attention: [kind.areas[1]], suggestion: "Practise the techniques covered in this lesson.", traits: [TRAITS[0]], comment: "", photos: [] } : { focus: "", progress: "", observed: [], strongest: [], attention: [], suggestion: "", traits: [], comment: "", photos: [] }))
  const [openField, setOpenField] = useState<string | null>(null)
  const [error, setError] = useState("")
  const set = <K extends keyof LearningRecordValue>(key: K, value: LearningRecordValue[K]) => { if (readOnly) return; setForm((prev) => ({ ...prev, [key]: value })); setError("") }
  const toggle = (key: string) => !readOnly && setOpenField((prev) => prev === key ? null : key)
  const multi = (key: "observed" | "strongest" | "attention" | "traits", label: string, options: string[]) =>
    <MultiSelect readOnly={readOnly} label={label} options={options} value={form[key]} open={openField === key} onToggle={() => toggle(key)} onChange={(v) => set(key, v)} />
  const addPhotos = () => pickPhotos(MAX_PHOTOS - form.photos.length)
    .then(({ uris, tooLarge }) => { if (uris.length) set("photos", [...form.photos, ...uris]); if (tooLarge) setError(`${tooLarge} photo${tooLarge > 1 ? "s were" : " was"} over 5MB and skipped.`) })
    .catch((e: Error) => setError(e.message))
  const [saving,setSaving]=useState(false)
  const save = async () => {
    if(saving)return
    setOpenField(null)
    const missing = [
      !form.focus.trim() && "focus of the class", !form.progress && "progress level", !form.observed.length && "what was observed", !form.strongest.length && "strongest area",
      !form.attention.length && "what needs more attention", !form.suggestion.trim() && "suggestion", !form.traits.length && "learning trait",
    ].filter(Boolean)
    if (missing.length) return setError(`Please complete: ${missing.join(", ")}.`)
    setSaving(true)
    try { await onSave({ ...form, focus: form.focus.trim(), suggestion: form.suggestion.trim(), comment: form.comment.trim() }) } catch(e) {setError((e as Error).message)} finally {setSaving(false)}
  }
  const first = student.name.split(" ")[0]
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <View style={[s.recordHeader, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} style={[s.back, s.backInline]} onPress={onBack}><SvgXml xml={ICON.back} width={16} height={16} /></Pressable>
      <Text accessibilityRole="header" numberOfLines={1} style={s.recordHeaderTitle}>{kind.title}</Text>
    </View>
    <ScrollView contentContainerStyle={[s.formContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <TextBox readOnly={readOnly} label="What was the focus of the class today?" placeholder="e.g colour blending, bow control" value={form.focus} onChange={(v) => set("focus", v)} />
      <SelectBox readOnly={readOnly} label="What is the current progress level?" open={openField === "progress"} onToggle={() => toggle("progress")} menu={<View style={s.menu}>
        {PROGRESS.map((o) => { const on = form.progress === o.label; return <Pressable key={o.label} accessibilityRole="radio" accessibilityState={{ checked: on }} style={[s.menuOption, on && s.menuOptionOn]} onPress={() => { set("progress", o.label); setOpenField(null) }}>
          <View style={s.menuCopy}><Text style={s.menuTitle}>{o.label}</Text><Text style={s.menuHint}>{o.hint}</Text></View>
          {on && <SvgXml xml={ICON.optionCheck} width={11} height={7} />}
        </Pressable> })}
      </View>}>
        <Text style={form.progress ? s.formSelected : s.formPlaceholder}>{form.progress || "Select"}</Text>
      </SelectBox>
      {multi("observed", "What was observed?", kind.observed)}
      {multi("strongest", "What is the strongest area in learning today?", kind.areas)}
      {multi("attention", "What required more attention from today’s learning", kind.areas)}
      <TextBox readOnly={readOnly} label="What would you suggest the student to work on?" placeholder="e.g Practice slower movements" value={form.suggestion} onChange={(v) => set("suggestion", v)} />
      {multi("traits", "How would you describe student’s learning trait?", TRAITS)}
      <TextBox readOnly={readOnly} tall label="Additional comment (optional)" placeholder={`no more than ${MAX_WORDS} words`} value={form.comment} onChange={(v) => { if (words(v) <= MAX_WORDS) set("comment", v) }} />
      <View style={s.uploadBlock}>
        <Text style={s.formLabel}>Upload {first}’s best moments</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Upload photos" accessibilityState={{ disabled: readOnly || form.photos.length >= MAX_PHOTOS }} disabled={readOnly || form.photos.length >= MAX_PHOTOS} style={s.upload} onPress={addPhotos}>
          <SvgXml xml={ICON.cloudUpload} width={24} height={24} />
          <Text style={s.formLabel}>Photos</Text>
          <Text style={s.uploadHint}>{form.photos.length >= MAX_PHOTOS ? `Up to ${MAX_PHOTOS} photos` : "Max file size up to 5MB"}</Text>
        </Pressable>
        {!!form.photos.length && <View style={s.thumbs}>{form.photos.map((uri) => <View key={uri} style={s.thumb}>
          <Image source={{ uri }} style={s.photoFill} />
          <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" hitSlop={6} style={s.thumbRemove} onPress={() => set("photos", form.photos.filter((p) => p !== uri))}><Feather name="x" size={12} color="white" /></Pressable>
        </View>)}</View>}
      </View>
      <View style={s.saveBlock}>
        {!!error && <Text accessibilityRole="alert" style={s.formError}>{error}</Text>}
        <Text numberOfLines={1} style={s.saveNote}>{readOnly ? (initialValue ? "Saved record" : "Sample record") : "*Details are not amendable after saving"}</Text>
        {!readOnly && <Pressable accessibilityRole="button" style={s.button} onPress={save}><Text style={s.buttonText}>Save</Text></Pressable>}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
}

const shadow = { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4 }
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "white" },
  header: { paddingHorizontal: 16, paddingBottom: 20, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  back: { position: "absolute", left: 16, bottom: 20, width: 35, height: 35, borderRadius: 100, backgroundColor: LINE, alignItems: "center", justifyContent: "center" },
  title: { height: 35, lineHeight: 35, maxWidth: "70%", fontSize: FONT.headline, color: "black" }, titleLarge: { height: 35, lineHeight: 35, maxWidth: "70%", fontSize: FONT.title, color: "black", fontWeight: "600" }, titleMedium: { fontWeight: "500" },
  content: { paddingHorizontal: 16, gap: 20 }, footer: { marginHorizontal: -16, paddingHorizontal: 24, paddingTop: 16 },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 }, inlineTight: { flexDirection: "row", alignItems: "center", gap: 2 }, inlineWide: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 2, height: 2, borderRadius: 1, backgroundColor: INK },
  empty: { fontSize: FONT.caption, color: GREY, textAlign: "center" },
  seeAll: { fontSize: FONT.caption, lineHeight: 18, color: INK, fontWeight: "600", textDecorationLine: "underline" },

  centreLogo: { width: 135, height: 135, borderRadius: 67.5, alignSelf: "center" },
  actions: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20 }, actionWrap: { flexDirection: "row", alignItems: "center", gap: 20 },
  actionDivider: { width: 1, height: 60, backgroundColor: LINE }, action: { minWidth: 66, paddingVertical: 12, paddingHorizontal: 8, gap: 5, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "white" },
  actionLabel: { fontSize: FONT.micro, color: INK, fontWeight: "600", textAlign: "center" },
  section: { gap: 16 }, sectionHeadTight: { gap: 5 }, sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { flex: 1, fontSize: FONT.headline, lineHeight: 24, color: INK, fontWeight: "600" }, date: { fontSize: FONT.body, lineHeight: 21, color: INK },
  bleed: { marginHorizontal: -16 }, fixedHorizontal: { flexGrow: 0, flexShrink: 0 }, checkinRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  checkin: { width: 200, height: 186, borderRadius: 12, backgroundColor: "white", ...shadow },
  checkinPhotoWrap: { flex: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: "hidden" },
  senBadge: { position: "absolute", top: 16, left: 16, height: 25, paddingHorizontal: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.8)", flexDirection: "row", alignItems: "center", gap: 2 },
  senText: { fontSize: FONT.body, color: INK, fontWeight: "600" },
  checkinBody: { padding: 12, gap: 8 }, checkinTitle: { fontSize: FONT.body, color: INK, fontWeight: "600" }, checkinTime: { fontSize: FONT.micro, color: INK }, checkinLesson: { fontSize: FONT.micro, color: GREY },
  feedbackRow: { paddingHorizontal: 16, gap: 12 }, feedback: { width: 70, gap: 4 }, feedbackPhoto: { width: 70, height: 70, borderRadius: 8, overflow: "hidden" },
  feedbackCopy: { paddingHorizontal: 2, gap: 2 }, feedbackName: { fontSize: FONT.micro, lineHeight: 15, color: INK, fontWeight: "500" }, feedbackText: { fontSize: FONT.micro, lineHeight: 15, color: INK },
  disconnect: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8, paddingVertical: 12 }, disconnectText: { fontSize: FONT.caption, lineHeight: 18, color: GREY, textDecorationLine: "underline" },

  pills: { alignSelf: "center", flexDirection: "row", padding: 4, borderRadius: 50, backgroundColor: LINE }, pill: { width: 151, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 500, alignItems: "center" },
  pillOn: { backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8.5, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, pillText: { fontSize: FONT.body, color: INK, fontWeight: "600" },
  viewAll: { alignItems: "flex-end", marginBottom: -4 },
  calendar: { padding: 16, borderRadius: 12, backgroundColor: "white", ...shadow },
  calHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  calArrow: { width: 29, height: 29, borderRadius: 8.6, borderWidth: 0.86, borderColor: "#CED3DE", alignItems: "center", justifyContent: "center" },
  calTitle: { alignItems: "center" }, calMonth: { fontSize: FONT.headerTitle, color: CAL_INK, fontWeight: "500" }, calYear: { fontSize: FONT.micro, color: CAL_MUTED, fontWeight: "500" },
  calRow: { flexDirection: "row" }, weekday: { flex: 1, textAlign: "center", fontSize: 11, lineHeight: 14, color: CAL_MUTED, fontWeight: "500", marginBottom: 12 },
  dayCell: { flex: 1, height: 44.7, alignItems: "center" }, dayBox: { width: 26, height: 26, borderRadius: 8.6, alignItems: "center", justifyContent: "center" }, dayBoxOn: { backgroundColor: TEAL },
  day: { fontSize: FONT.secondary, color: CAL_INK, fontWeight: "500" }, dayOn: { color: "white", fontWeight: "700" },
  dayDots: { flexDirection: "row", gap: 1.8, marginTop: 2 }, dayDot: { width: 3.6, height: 3.6, borderRadius: 1.8, borderWidth: 0.9 },

  classCard: { padding: 16, gap: 10, borderRadius: 12, backgroundColor: "white", ...shadow },
  classCardEditing: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, shadowOpacity: 0, elevation: 0 },
  editRow: { flexDirection: "row", borderRadius: 12, ...shadow }, deleteStrip: { width: 26, alignItems: "center", justifyContent: "center", borderTopRightRadius: 12, borderBottomRightRadius: 12, backgroundColor: "#FF5A5F" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 }, ring: { width: 9.8, height: 9.8, borderRadius: 4.9, borderWidth: 2 },
  time: { fontSize: FONT.caption, lineHeight: 14, color: INK, letterSpacing: 0.75 }, cardDate: { fontSize: FONT.caption, color: INK },
  classRow: { flexDirection: "row", gap: 10 }, classPhoto: { width: 93, minHeight: 100, borderRadius: 12, overflow: "hidden" }, photoFill: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }, photoEmpty: { alignItems: "center", justifyContent: "center", backgroundColor: "#F1F1F1" },
  classCopy: { flex: 1, gap: 10 }, classTitle: { fontSize: FONT.body, color: INK, fontWeight: "600" }, lesson: { fontSize: FONT.caption, color: INK, fontWeight: "600" },
  going: { flexDirection: "row" }, goingAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "white" }, goingOverlap: { marginLeft: -4 },
  goingText: { fontSize: FONT.caption, lineHeight: 19, color: GREY, fontWeight: "500", marginLeft: 2 },
  studentAvatar: { width: 24, height: 24, borderRadius: 12, overflow: "hidden" }, studentName: { fontSize: FONT.micro, color: INK, fontWeight: "600" },
  host: { fontSize: FONT.micro, color: GREY },

  detailCard: { padding: 24, gap: 10, borderRadius: 18, backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  count: { fontSize: FONT.caption, lineHeight: 18, color: INK },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 }, meta: { flex: 1, fontSize: FONT.micro, color: GREY },
  priceBlock: { gap: 10 }, price: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginBottom: -6 }, priceValue: { fontSize: FONT.headline, lineHeight: 24, color: INK, fontWeight: "500" }, priceUnit: { fontSize: FONT.body, lineHeight: 21, color: INK },
  lessonDates: { gap: 10 }, lessonDatesInset: { padding: 16 }, lessonDatesTitle: { fontSize: FONT.body, color: INK, fontWeight: "600" },
  lessonDate: { flexDirection: "row", alignItems: "center", gap: 10 }, lessonNumber: { width: 12, fontSize: 18, color: INK, fontWeight: "600" }, lessonCopy: { gap: 5 },
  lessonDay: { fontSize: FONT.body, color: INK, fontWeight: "600" }, lessonTimeRow: { flexDirection: "row", gap: 5 }, lessonTime: { fontSize: FONT.body, color: INK }, lessonDuration: { fontSize: FONT.body, color: "#B0B0B0" },
  showDates: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }, showDatesText: { fontSize: FONT.micro, color: GREY, fontWeight: "600" }, flip: { transform: [{ rotate: "180deg" }] },
  rule: { height: 1, backgroundColor: LINE }, ruleInset: { marginHorizontal: 8 },
  attendance: { paddingHorizontal: 16, gap: 20 }, attendanceHint: { fontSize: FONT.caption, color: INK, fontWeight: "600", textAlign: "center" },
  button: { height: 48, borderRadius: 8, backgroundColor: INK, alignItems: "center", justifyContent: "center" }, buttonOff: { backgroundColor: "#BDBDBD" }, buttonText: { fontSize: FONT.secondary, color: "white", fontWeight: "600" },
  hosted: { gap: 16 }, hostedTitle: { fontSize: FONT.headline, color: "black", fontWeight: "600" },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 16 }, hostAvatar: { width: 50, height: 50, borderRadius: 25 }, hostAvatarEmpty: { backgroundColor: "#F2F2F2", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  hostName: { flex: 1, fontSize: FONT.body, color: INK, fontWeight: "600" }, rating: { fontSize: FONT.body, color: INK, marginLeft: 2 },
  coachCopy: { flex: 1, gap: 4 }, coachRole: { fontSize: FONT.body, color: GREY },
  notes: { paddingHorizontal: 12, gap: 12 }, noteBlock: { gap: 2 }, noteLabel: { fontSize: FONT.caption, lineHeight: 18, color: INK }, noteText: { fontSize: FONT.caption, lineHeight: 18, color: GREY },
  ack: { gap: 8 }, ackRow: { flexDirection: "row", paddingLeft: 4 }, ackNumber: { width: 18, fontSize: FONT.caption, lineHeight: 18, color: GREY }, ackText: { flex: 1, fontSize: FONT.caption, lineHeight: 18, color: GREY },
  detailFooter: { alignItems: "center", gap: 10 }, rearrange: { width: 200, height: 48, borderRadius: 8, backgroundColor: INK, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: FONT.caption, lineHeight: 16, color: GREY, textDecorationLine: "underline", textAlign: "center" },

  studentsProgram: { fontSize: FONT.body, lineHeight: 26, color: INK, fontWeight: "600", marginBottom: -4 },
  studentGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 20 }, studentCell: { width: "50%", alignItems: "center", gap: 10 },
  kidPhoto: { width: 106, height: 106, borderRadius: 53, overflow: "hidden" }, kidShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)" },
  kidCopy: { alignSelf: "stretch", paddingHorizontal: 32 }, kidNameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  kidName: { flexShrink: 1, fontSize: FONT.caption, lineHeight: 18, color: INK, fontWeight: "600" }, kidDate: { fontSize: FONT.micro, lineHeight: 15, color: GREY },
  senPill: { paddingHorizontal: 6, borderRadius: 50, borderWidth: 1, borderColor: "#B0B0B0" }, senPillText: { fontSize: FONT.micro, lineHeight: 15, color: INK },

  announceHeader: { paddingHorizontal: 16, paddingBottom: 20, backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5, zIndex: 1 },
  announceTitleRow: { height: 35, flexDirection: "row", alignItems: "center", gap: 12 }, backInline: { position: "relative", left: 0, bottom: 0 },
  announceTitle: { flex: 1, fontSize: FONT.headline, color: "black" }, announceBy: { paddingLeft: 47, fontSize: FONT.micro, lineHeight: 15, color: GREY },
  announceBody: { paddingHorizontal: 16, paddingVertical: 20, gap: 20, alignItems: "center" },
  announceCard: { alignSelf: "stretch", padding: 16, gap: 10, borderRadius: 12, backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 4 },
  announceKids: { flexDirection: "row", gap: 20 }, announceKid: { alignItems: "center", gap: 2 }, announceKidPhoto: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  announceKidName: { fontSize: FONT.caption, lineHeight: 18, color: INK, textTransform: "capitalize" },
  announceNote: { fontSize: FONT.caption, lineHeight: 18, color: GREY, textAlign: "center" },
  todayBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: "rgba(215,244,243,0.8)" }, todayText: { fontSize: FONT.micro, color: INK, fontWeight: "600" },
  bubble: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: INK, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18 },
  bubbleText: { flex: 1, fontSize: FONT.caption, lineHeight: 18, color: "white" },
  composer: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: -6 }, elevation: 6 },
  composerInput: { flex: 1, minHeight: 40, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#B0B0B0" },
  composerText: { flex: 1, fontSize: FONT.caption, color: INK, paddingVertical: 10 }, sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: TEAL, alignItems: "center", justifyContent: "center" },

  programCard: { height: 230, borderRadius: 12, backgroundColor: "white", ...shadow }, programPhoto: { height: 152, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: "hidden" },
  programBody: { height: 78, padding: 16, flexDirection: "row", justifyContent: "space-between", gap: 12 }, programInfo: { flexShrink: 1, gap: 12 },
  bold: { fontWeight: "600" }, schedules: { fontSize: FONT.body, color: INK, textDecorationLine: "underline" },
  heroPhoto: { height: 212, borderRadius: 12, overflow: "hidden" }, programIntro: { gap: 16 },
  programTitle: { fontSize: FONT.title, color: "black", fontWeight: "600", textAlign: "center" }, programDesc: { fontSize: FONT.caption, lineHeight: 16, color: GREY, textAlign: "center" },
  scheduleCard: { padding: 16, gap: 10, borderRadius: 12, backgroundColor: "white", ...shadow }, scheduleInfo: { gap: 10 },
  scheduleLessons: { fontSize: FONT.body, color: INK, fontWeight: "600" }, scheduleRange: { fontSize: FONT.body, color: INK },
  scheduleGoing: { flexDirection: "row", alignItems: "center", gap: 12 }, spots: { fontSize: FONT.caption, lineHeight: 19, color: TEAL, fontWeight: "500" },

  attendCard: { padding: 16, gap: 12, borderRadius: 12, backgroundColor: "white", ...shadow },
  attendCount: { flexDirection: "row", alignItems: "center", gap: 5 }, attendCountText: { fontSize: FONT.caption, lineHeight: 18, color: INK },
  attendKids: { flexGrow: 1, justifyContent: "space-between", gap: 12 }, attendKid: { alignItems: "center", gap: 2 },
  attendPhoto: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" }, attendPhotoOn: { borderWidth: 1.5, borderColor: TEAL },
  attendTick: { position: "absolute", top: 1, left: 27, padding: 1, borderRadius: 100, backgroundColor: TEAL }, attendName: { maxWidth: 48, fontSize: FONT.caption, lineHeight: 18, color: INK },
  codeHint: { fontSize: FONT.caption, lineHeight: 18, color: GREY, textAlign: "center" },
  codeRow: { flexDirection: "row", justifyContent: "center", gap: 12, paddingHorizontal: 16 }, codeBox: { flex: 1, height: 74, borderRadius: 8, borderWidth: 1, borderColor: "#B0B0B0", alignItems: "center", justifyContent: "center" }, codeBoxOff: { borderColor: "#B0B0B0" },
  codeDigit: { fontSize: FONT.heading, color: INK }, codeInput: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  orRow: { flexDirection: "row", alignItems: "center", gap: 8 }, orLine: { flex: 1, height: 1, backgroundColor: LINE }, orText: { fontSize: FONT.caption, lineHeight: 18, color: INK },
  scan: { padding: 16, alignItems: "center" }, scanText: { fontSize: FONT.body, lineHeight: 21, color: GREY, textDecorationLine: "underline" },

  pendingBody: { height: 78, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 12 },
  pendingCount: { flexDirection: "row", alignItems: "flex-end", gap: 4 }, pendingCountText: { paddingVertical: 3, fontSize: FONT.caption, color: INK },

  feedbackMetaLine: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }, feedbackMeta: { gap: 10 }, blockTitle: { fontSize: FONT.headline, color: "black", fontWeight: "600" },
  forCopy: { flex: 1, gap: 8, opacity: 0.8 }, gender: { width: 16, height: 16 }, forAge: { fontSize: FONT.body, color: GREY },
  recordCard: { padding: 16, borderRadius: 12, backgroundColor: "white", ...shadow }, recordInfo: { gap: 10 },
  recordHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, recordTitle: { flexShrink: 1, fontSize: FONT.body, color: INK }, recordPending: { fontSize: FONT.body, color: "#EB913B" },
  recordRow: { minHeight: 17, flexDirection: "row", alignItems: "center", gap: 4 }, recordHalf: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  recordBy: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4 }, recordAvatar: { width: 24, height: 24, borderRadius: 12 }, recordByText: { fontSize: FONT.micro, color: INK, fontWeight: "600" },

  recordHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 20, backgroundColor: "white" }, recordHeaderTitle: { flex: 1, fontSize: FONT.headline, color: "black" },
  formContent: { paddingHorizontal: 16, gap: 20 },
  formBox: { minHeight: 69, paddingHorizontal: 12, paddingVertical: 16, gap: 4, borderRadius: 8, borderWidth: 1, borderColor: "#B0B0B0", backgroundColor: "white" }, formBoxOn: { borderColor: INK }, formBoxTall: { minHeight: 100 },
  formLabel: { fontSize: FONT.caption, color: "#717171" }, formValue: { padding: 0, fontSize: FONT.headline, color: INK }, formValueTall: { minHeight: 50 },
  formPlaceholder: { fontSize: FONT.headline, color: "#B0B0B0" }, formSelected: { fontSize: FONT.headline, color: INK },
  selectOpen: { zIndex: 20, elevation: 20 }, selectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, selectValue: { flex: 1 },
  chips: { alignItems: "flex-start", gap: 10 }, chip: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24, backgroundColor: "rgba(10,186,181,0.08)" }, chipText: { flexShrink: 1, fontSize: FONT.body, lineHeight: 16, color: INK },
  menu: { position: "absolute", top: "100%", left: 12, right: 12, marginTop: 6, padding: 10, gap: 10, borderRadius: 12, borderWidth: 0.5, borderColor: LINE, backgroundColor: "white", ...shadow },
  menuOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }, menuOptionOn: { backgroundColor: LINE },
  menuCopy: { flex: 1, gap: 5 }, menuTitle: { fontSize: FONT.caption, lineHeight: 16, color: INK, fontWeight: "500" }, menuHint: { fontSize: FONT.caption, lineHeight: 16, color: GREY },
  multiMenu: { position: "absolute", top: "100%", left: 12, minWidth: 200, maxWidth: 300, marginTop: 4, borderRadius: 12, backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  multiScroll: { maxHeight: 187 }, multiList: { padding: 20, gap: 20 }, multiOption: { flexDirection: "row", alignItems: "center", gap: 10 }, multiOff: { opacity: 0.4 }, multiText: { flexShrink: 1, fontSize: FONT.caption, lineHeight: 16, color: INK },
  uploadBlock: { gap: 10 }, upload: { paddingHorizontal: 12, paddingVertical: 16, gap: 4, alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: "#B0B0B0" }, uploadHint: { fontSize: FONT.caption, color: "#B0B0B0" },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, thumb: { width: 64, height: 64, borderRadius: 8, overflow: "hidden" },
  thumbRemove: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  saveBlock: { gap: 10 }, saveNote: { paddingHorizontal: 8, fontSize: FONT.caption, lineHeight: 18, color: GREY }, formError: { paddingHorizontal: 8, fontSize: FONT.caption, lineHeight: 18, color: "#E5484D" },
})
