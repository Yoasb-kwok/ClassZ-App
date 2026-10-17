import { useState, type ReactNode } from "react"
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { SvgXml } from "react-native-svg"
import Feather from "@expo/vector-icons/Feather"
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
  charlie: require("../assets/figma/coach/schedule/going3.png"),
  hostCentre: require("../assets/figma/coach/schedule/host-centre.jpg"),
}
const GOING = [require("../assets/figma/coach/schedule/going1.png"), require("../assets/figma/coach/schedule/going2.png"), require("../assets/figma/coach/schedule/going3.png"), require("../assets/figma/coach/schedule/going4.png")]
const STUDENTS: Array<{ name: string; photo: ImageSourcePropType }> = [
  { name: "Charlotte", photo: require("../assets/figma/coach/schedule/student-charlotte.jpg") },
  { name: "Joshua", photo: require("../assets/figma/coach/schedule/student-joshua.jpg") },
  { name: "Tommy", photo: require("../assets/figma/coach/schedule/student-tommy.jpg") },
  { name: "Dennis", photo: require("../assets/figma/coach/schedule/student-dennis.jpg") },
  { name: "Candy", photo: require("../assets/figma/coach/schedule/student-candy.jpg") },
]

const INK = "#222222", GREY = "#5E5E5E", LINE = "#EBEBEB", TEAL = "#0ABAB5", CAL_INK = "#222B45", CAL_MUTED = "#8F9BB3"
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const LESSONS = 8
const HOST_CENTRE = "ClassZ Playgroup Bright Kids Drawing Centre"

type Attendee = { kind: "group"; count: number } | { kind: "single"; name: string; photo: ImageSourcePropType }
type Program = { key: string; title: string; time: string; startMinutes: number; color: string; image: ImageSourcePropType; attendee: Attendee; sen: boolean; course: string }
export type CoachClass = Program & { id: string; date: Date; lesson: number }

const PROGRAMS: Program[] = [
  { key: "watercolour", title: "Watercolour Painting", time: "10:00AM-12:00PM", startMinutes: 600, color: TEAL, image: IMG.checkin, attendee: { kind: "group", count: 5 }, sen: true, course: "Watercolour (intermediate)" },
  { key: "guitar", title: "ClassZ Guitar Program", time: "10:00AM-01:00PM", startMinutes: 600, color: TEAL, image: IMG.guitar, attendee: { kind: "group", count: 7 }, sen: true, course: "Guitar (beginner)" },
  { key: "academic", title: "Rising Star Academic Program", time: "02:00PM-03:00PM", startMinutes: 840, color: "#FFAF36", image: IMG.reading, attendee: { kind: "single", name: "Shelly Wong", photo: IMG.shelly }, sen: false, course: "Academic (junior)" },
  { key: "painting", title: "ClassZ Painting Program", time: "04:00PM-06:00PM", startMinutes: 960, color: "#FC5555", image: IMG.painting, attendee: { kind: "single", name: "Lucas Wong", photo: IMG.lucas }, sen: false, course: "Painting (junior)" },
  { key: "guitar-private", title: "ClassZ Guitar Program", time: "10:00AM-01:00PM", startMinutes: 600, color: "#FFC943", image: IMG.guitar, attendee: { kind: "single", name: "Charlie Wong", photo: IMG.charlie }, sen: false, course: "Guitar (private)" },
]
const BY_WEEKDAY: string[][] = [[], ["guitar", "academic", "painting"], ["guitar-private"], ["watercolour", "academic"], ["guitar", "academic", "painting"], ["guitar-private", "painting"], ["watercolour", "academic", "painting"]]

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b)
const shortDate = (d: Date) => `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`
const rangeDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`
const slashDate = (d: Date, longYear = true) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${longYear ? d.getFullYear() : String(d.getFullYear()).slice(2)}`

export function classesOn(date: Date, cancelled: ReadonlySet<string>): CoachClass[] {
  const day = startOfDay(date)
  return BY_WEEKDAY[day.getDay()].map((key) => PROGRAMS.find((p) => p.key === key)!)
    .map((p) => ({ ...p, id: `${p.key}-${dayKey(day)}`, date: day, lesson: (Math.floor((day.getDate() - 1) / 7) % LESSONS) + 1 }))
    .filter((c) => !cancelled.has(c.id))
    .sort((a, b) => a.startMinutes - b.startMinutes)
}
export function upcomingClasses(from: Date, days: number, cancelled: ReadonlySet<string>) {
  return Array.from({ length: days }, (_, i) => classesOn(addDays(from, i), cancelled)).flat()
}
export function findClass(id: string, cancelled: ReadonlySet<string>) {
  const key = id.slice(id.length - 10)
  const [y, m, d] = key.split("-").map(Number)
  return classesOn(new Date(y, m - 1, d), cancelled).find((c) => c.id === id) ?? null
}
const programDates = (c: CoachClass) => Array.from({ length: LESSONS }, (_, i) => addDays(c.date, (i - (c.lesson - 1)) * 7))

function Screen({ title, large = false, onBack, children, footer }: { title: string; large?: boolean; onBack: () => void; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return <View style={s.page}>
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} style={s.back} onPress={onBack}><SvgXml xml={ICON.back} width={16} height={16} /></Pressable>
      <Text accessibilityRole="header" numberOfLines={1} style={large ? s.titleLarge : s.title}>{title}</Text>
    </View>
    <ScrollView contentContainerStyle={[s.content, !footer && { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      {children}
      {footer && <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>}
    </ScrollView>
  </View>
}

function Dot() { return <View style={s.dot} /> }
function SeeAll({ label = "See All", onPress }: { label?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}><Text style={s.seeAll}>{label}</Text></Pressable>
}

export function CentreProfile({ centreName, cancelled, onBack, onSchedule, onOpenClass, onDisconnect }: { centreName: string; cancelled: ReadonlySet<string>; onBack: () => void; onSchedule: () => void; onOpenClass: (c: CoachClass) => void; onDisconnect: () => void }) {
  const today = startOfDay(new Date())
  const checkins = classesOn(today, cancelled)
  const lastWatercolour = Array.from({ length: 7 }, (_, i) => addDays(today, -i - 1)).find((d) => BY_WEEKDAY[d.getDay()].includes("watercolour")) ?? today
  const soon = (what: string) => Alert.alert(what, "This will be available soon.")
  const actions: Array<{ label: string; icon: string; size: number; onPress: () => void }> = [
    { label: "Programs", icon: ICON.book, size: 25, onPress: () => soon("Programs") },
    { label: "Schedule", icon: ICON.calendarAdd, size: 24, onPress: onSchedule },
    { label: "Announce", icon: ICON.announce, size: 24, onPress: () => soon("Announce") },
  ]
  return <Screen title={centreName} large onBack={onBack}>
    <Image source={IMG.centreLogo} style={s.centreLogo} accessibilityLabel={`${centreName} logo`} />
    <View style={s.actions}>{actions.map((a, i) => <View key={a.label} style={s.actionWrap}>
      {i > 0 && <View style={s.actionDivider} />}
      <Pressable accessibilityRole="button" style={s.action} onPress={a.onPress}><SvgXml xml={a.icon} width={a.size} height={a.size} /><Text style={s.actionLabel}>{a.label}</Text></Pressable>
    </View>)}</View>

    <View style={s.section}>
      <View style={s.sectionHeadTight}>
        <View style={s.sectionHead}><Text style={s.sectionTitle}>Today’s check-ins :</Text><SeeAll onPress={onSchedule} /></View>
        <Text style={s.date}>{slashDate(today)}</Text>
      </View>
      {checkins.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.bleed} contentContainerStyle={s.checkinRow}>
        {checkins.map((c) => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`${c.title}, ${c.time}`} style={s.checkin} onPress={() => onOpenClass(c)}>
          <View style={s.checkinPhotoWrap}>
            <Image source={c.image} style={s.photoFill} />
            {c.sen && <View style={s.senBadge}><SvgXml xml={ICON.tick} width={14} height={14} /><Text style={s.senText}>SEN</Text></View>}
          </View>
          <View style={s.checkinBody}>
            <Text numberOfLines={1} style={s.checkinTitle}>{c.title}</Text>
            <View style={s.inline}><Text style={s.checkinTime}>{c.time}</Text><Dot /><Text style={s.checkinLesson}>Lesson {c.lesson} of {LESSONS}</Text></View>
          </View>
        </Pressable>)}
      </ScrollView> : <Text style={s.empty}>No check-ins today.</Text>}
    </View>

    <View style={s.section}>
      <View style={s.sectionHead}><Text style={s.sectionTitle}>Pending feedback</Text><SeeAll onPress={() => soon("Pending feedback")} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.bleed} contentContainerStyle={s.feedbackRow}>
        {STUDENTS.map((st) => <Pressable key={st.name} accessibilityRole="button" accessibilityLabel={`Write feedback for ${st.name}`} style={s.feedback} onPress={() => soon(`Feedback for ${st.name}`)}>
          <Image source={st.photo} style={s.feedbackPhoto} />
          <View style={s.feedbackCopy}>
            <Text numberOfLines={1} style={s.feedbackName}>{st.name}</Text>
            <Text numberOfLines={1} style={s.feedbackText}>Watercolour (intermediate)</Text>
            <Text style={[s.feedbackText, { color: GREY }]}>{slashDate(lastWatercolour, false)}</Text>
          </View>
        </Pressable>)}
      </ScrollView>
    </View>

    <Pressable accessibilityRole="button" hitSlop={8} style={s.disconnect} onPress={onDisconnect}>
      <SvgXml xml={ICON.trash} width={18.5} height={18.5} /><Text style={s.disconnectText}>Disconnect centre</Text>
    </Pressable>
  </Screen>
}

function ClassCard({ item, onPress }: { item: CoachClass; onPress: () => void }) {
  const a = item.attendee
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}, ${shortDate(item.date)}, ${item.time}`} style={s.classCard} onPress={onPress}>
    <View style={s.timeRow}><View style={[s.ring, { borderColor: item.color }]} /><Text style={s.time}>{item.time}</Text><Dot /><Text style={s.cardDate}>{shortDate(item.date)}</Text></View>
    <View style={s.classRow}>
      <View style={s.classPhoto}><Image source={item.image} style={s.photoFill} /></View>
      <View style={s.classCopy}>
        <Text numberOfLines={1} style={s.classTitle}>{item.title}</Text>
        <Text style={s.lesson}>Lesson {item.lesson} of {LESSONS}</Text>
        {a.kind === "group"
          ? <View style={s.inline}><View style={s.going}>{GOING.map((src, i) => <Image key={i} source={src} style={[s.goingAvatar, i > 0 && s.goingOverlap]} />)}</View><Text style={s.goingText}>+{Math.max(0, a.count - GOING.length)} Going</Text></View>
          : <View style={s.inline}><Image source={a.photo} style={s.studentAvatar} /><Text style={s.studentName}>{a.name}</Text></View>}
        <Text numberOfLines={2} style={s.host}>{HOST_CENTRE}</Text>
      </View>
    </View>
  </Pressable>
}

export type ScheduleView = { tab: "calendar" | "upcoming"; month: Date; selected: Date }
export function CoachSchedule({ view, cancelled, onChange, onBack, onOpenClass, onViewAll }: { view: ScheduleView; cancelled: ReadonlySet<string>; onChange: (next: ScheduleView) => void; onBack: () => void; onOpenClass: (c: CoachClass) => void; onViewAll: () => void }) {
  const today = startOfDay(new Date())
  const list = view.tab === "calendar" ? classesOn(view.selected, cancelled) : upcomingClasses(today, 30, cancelled).slice(0, 3)
  return <Screen title="Coach Schedule" onBack={onBack}>
    <View accessibilityRole="tablist" style={s.pills}>{(["calendar", "upcoming"] as const).map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: view.tab === tab }} style={[s.pill, view.tab === tab && s.pillOn]} onPress={() => onChange({ ...view, tab })}>
      <Text style={s.pillText}>{tab === "calendar" ? "Calendar" : "Upcoming"}</Text>
    </Pressable>)}</View>
    {view.tab === "calendar"
      ? <MonthCalendar month={view.month} selected={view.selected} cancelled={cancelled} onMonth={(month) => onChange({ ...view, month })} onSelect={(selected) => onChange({ ...view, selected, month: new Date(selected.getFullYear(), selected.getMonth(), 1) })} />
      : <View style={s.viewAll}><SeeAll label="View All" onPress={onViewAll} /></View>}
    {list.map((c) => <ClassCard key={c.id} item={c} onPress={() => onOpenClass(c)} />)}
    {!list.length && <Text style={s.empty}>{view.tab === "calendar" ? "No classes on this day." : "No upcoming classes."}</Text>}
  </Screen>
}

function MonthCalendar({ month, selected, cancelled, onMonth, onSelect }: { month: Date; selected: Date; cancelled: ReadonlySet<string>; onMonth: (m: Date) => void; onSelect: (d: Date) => void }) {
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
    <View style={s.calGrid}>{WEEKDAYS.map((w) => <Text key={w} style={s.weekday}>{w}</Text>)}</View>
    <View style={s.calGrid}>{cells.map((d) => {
      const inMonth = d.getMonth() === month.getMonth(), on = sameDay(d, selected)
      const dots = inMonth ? classesOn(d, cancelled).map((c) => c.color) : []
      return <Pressable key={dayKey(d)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${dots.length} classes`} style={s.dayCell} onPress={() => onSelect(d)}>
        <View style={[s.dayBox, on && s.dayBoxOn]}><Text style={[s.day, !inMonth && { color: CAL_MUTED }, on && s.dayOn]}>{d.getDate()}</Text></View>
        <View style={s.dayDots}>{dots.map((color, i) => <View key={i} style={[s.dayDot, { borderColor: color }]} />)}</View>
      </Pressable>
    })}</View>
  </View>
}

export function AllEnrollment({ cancelled, onBack, onOpenClass }: { cancelled: ReadonlySet<string>; onBack: () => void; onOpenClass: (c: CoachClass) => void }) {
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

export function ClassDetail({ item, coachName, coachAvatar, attended, onBack, onAttendance, onCancel }: { item: CoachClass; coachName: string; coachAvatar: ImageSourcePropType | null; attended: boolean; onBack: () => void; onAttendance: () => void; onCancel: () => void }) {
  const [showDates, setShowDates] = useState(false)
  const dates = programDates(item)
  const students = item.attendee.kind === "group" ? item.attendee.count : 1
  const cancel = () => Alert.alert("Cancel class", `Cancel ${item.title} on ${shortDate(item.date)}? Students will be notified.`, [{ text: "Keep class", style: "cancel" }, { text: "Cancel class", style: "destructive", onPress: onCancel }])
  const attendance = () => Alert.alert("Attendance taking", `Mark attendance for ${students} student${students > 1 ? "s" : ""} in this class?`, [{ text: "Cancel", style: "cancel" }, { text: "Confirm", onPress: onAttendance }])
  const footer = <View style={s.detailFooter}>
    <Pressable accessibilityRole="button" style={s.rearrange} onPress={() => Alert.alert("Rearrange class", `A rearrangement request for ${shortDate(item.date)} has been sent to the centre.`)}><Text style={s.buttonText}>Rearrange class</Text></Pressable>
    <Pressable accessibilityRole="button" hitSlop={8} onPress={cancel}><Text style={s.cancelText}>Cancel class</Text></Pressable>
  </View>
  return <Screen title="Class Detail" onBack={onBack} footer={footer}>
    <View style={s.detailCard}>
      <View style={s.timeRow}><View style={[s.ring, { borderColor: item.color }]} /><Text style={s.time}>{item.time}</Text><Dot /><Text style={s.cardDate}>{shortDate(item.date)}</Text></View>
      <View style={s.classRow}>
        <View style={s.classPhoto}><Image source={item.image} style={s.photoFill} /></View>
        <View style={s.classCopy}>
          <Text style={s.classTitle}>{item.title}</Text>
          <View style={s.inlineWide}><Text style={s.lesson}>Lesson {item.lesson} of {LESSONS}</Text><View style={s.inlineTight}><SvgXml xml={ICON.people} width={14} height={14} /><Text style={s.count}>{students}</Text></View></View>
          <View style={s.metaRow}><SvgXml xml={ICON.global} width={16} height={16} /><Text style={s.meta}>Cantonese</Text></View>
          <View style={s.metaRow}><SvgXml xml={ICON.location} width={16} height={16} /><Text style={s.meta}>Shop 1B, Class Mall, Central, Hong Kong</Text></View>
        </View>
      </View>
      <View style={s.priceBlock}>
        <View style={s.price}><Text style={s.priceValue}>$299</Text><Text style={s.priceUnit}>whole program</Text></View>
        <View style={s.inline}><Text style={s.lesson}>{LESSONS} lessons</Text><Dot /><Text style={s.cardDate}>{rangeDate(dates[0])} - {rangeDate(dates[LESSONS - 1])}</Text></View>
        {showDates && <View style={s.fullDates}>{dates.map((d, i) => <Text key={dayKey(d)} style={[s.fullDate, i + 1 === item.lesson && s.fullDateOn]}>Lesson {i + 1} · {WEEKDAYS[(d.getDay() + 6) % 7]}, {shortDate(d)}</Text>)}</View>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDates }} hitSlop={8} style={s.showDates} onPress={() => setShowDates((v) => !v)}>
          <Text style={s.showDatesText}>{showDates ? "Hide full dates" : "Show full dates"}</Text>
          <View style={showDates && s.flip}><SvgXml xml={ICON.arrowDown} width={16} height={16} /></View>
        </Pressable>
        <View style={s.rule} />
      </View>
    </View>

    <View style={s.attendance}>
      <Text style={s.attendanceHint}>{attended ? "Attendance taken. Payment for this class is secured." : "Take attendance before class to secure payment"}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: attended }} disabled={attended} style={[s.button, attended && s.buttonOff]} onPress={attendance}><Text style={s.buttonText}>{attended ? "Attendance taken" : "Attendance taking"}</Text></Pressable>
    </View>
    <View style={[s.rule, s.ruleInset]} />

    <View style={s.hosted}>
      <Text style={s.hostedTitle}>Hosted by</Text>
      <View style={s.hostRow}>
        <Image source={IMG.hostCentre} style={s.hostAvatar} />
        <Text style={s.hostName}>{HOST_CENTRE}</Text>
        <View style={s.inlineTight}><SvgXml xml={ICON.star} width={14} height={14} /><Text style={s.rating}>4.91</Text></View>
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

const shadow = { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4 }
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "white" },
  header: { paddingHorizontal: 16, paddingBottom: 20, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  back: { position: "absolute", left: 16, bottom: 20, width: 35, height: 35, borderRadius: 100, backgroundColor: LINE, alignItems: "center", justifyContent: "center" },
  title: { height: 35, lineHeight: 35, maxWidth: "70%", fontSize: FONT.headline, color: "black" }, titleLarge: { height: 35, lineHeight: 35, maxWidth: "70%", fontSize: FONT.title, color: "black", fontWeight: "600" },
  content: { paddingHorizontal: 16, gap: 20 }, footer: { marginHorizontal: -16, paddingHorizontal: 24, paddingTop: 16 },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 }, inlineTight: { flexDirection: "row", alignItems: "center", gap: 2 }, inlineWide: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 2, height: 2, borderRadius: 1, backgroundColor: INK },
  empty: { fontSize: FONT.caption, color: GREY, textAlign: "center" },
  seeAll: { fontSize: FONT.caption, lineHeight: 18, color: INK, fontWeight: "600", textDecorationLine: "underline" },

  centreLogo: { width: 135, height: 135, borderRadius: 67.5, alignSelf: "center" },
  actions: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20 }, actionWrap: { flexDirection: "row", alignItems: "center", gap: 20 },
  actionDivider: { width: 1, height: 60, backgroundColor: LINE }, action: { width: 66, padding: 12, gap: 5, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "white" },
  actionLabel: { fontSize: FONT.micro, color: INK, fontWeight: "600", textAlign: "center" },
  section: { gap: 16 }, sectionHeadTight: { gap: 5 }, sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { flex: 1, fontSize: FONT.headline, lineHeight: 24, color: INK, fontWeight: "600" }, date: { fontSize: FONT.body, lineHeight: 21, color: INK },
  bleed: { marginHorizontal: -16 }, checkinRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  checkin: { width: 290, height: 230, borderRadius: 12, backgroundColor: "white", ...shadow },
  checkinPhotoWrap: { flex: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: "hidden", padding: 16 },
  senBadge: { alignSelf: "flex-start", height: 25, paddingHorizontal: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.8)", flexDirection: "row", alignItems: "center", gap: 2 },
  senText: { fontSize: FONT.body, color: INK, fontWeight: "600" },
  checkinBody: { padding: 16, gap: 12 }, checkinTitle: { fontSize: FONT.body, color: INK, fontWeight: "600" }, checkinTime: { fontSize: FONT.body, color: INK }, checkinLesson: { fontSize: FONT.body, color: GREY },
  feedbackRow: { paddingHorizontal: 16, gap: 12 }, feedback: { width: 70, gap: 4 }, feedbackPhoto: { width: 70, height: 70, borderRadius: 8 },
  feedbackCopy: { paddingHorizontal: 2, gap: 2 }, feedbackName: { fontSize: FONT.micro, lineHeight: 15, color: INK, fontWeight: "500" }, feedbackText: { fontSize: FONT.micro, lineHeight: 15, color: INK },
  disconnect: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }, disconnectText: { fontSize: FONT.caption, lineHeight: 18, color: GREY, textDecorationLine: "underline" },

  pills: { alignSelf: "center", flexDirection: "row", padding: 4, borderRadius: 50, backgroundColor: LINE }, pill: { width: 151, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 500, alignItems: "center" },
  pillOn: { backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8.5, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, pillText: { fontSize: FONT.body, color: INK, fontWeight: "600" },
  viewAll: { alignItems: "flex-end", marginBottom: -4 },
  calendar: { padding: 16, borderRadius: 12, backgroundColor: "white", ...shadow },
  calHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  calArrow: { width: 29, height: 29, borderRadius: 8.6, borderWidth: 0.86, borderColor: "#CED3DE", alignItems: "center", justifyContent: "center" },
  calTitle: { alignItems: "center" }, calMonth: { fontSize: FONT.headerTitle, color: CAL_INK, fontWeight: "500" }, calYear: { fontSize: FONT.micro, color: CAL_MUTED, fontWeight: "500" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" }, weekday: { width: `${100 / 7}%`, textAlign: "center", fontSize: 11, lineHeight: 14, color: CAL_MUTED, fontWeight: "500", marginBottom: 12 },
  dayCell: { width: `${100 / 7}%`, height: 44.7, alignItems: "center" }, dayBox: { width: 26, height: 26, borderRadius: 8.6, alignItems: "center", justifyContent: "center" }, dayBoxOn: { backgroundColor: TEAL },
  day: { fontSize: FONT.secondary, color: CAL_INK, fontWeight: "500" }, dayOn: { color: "white", fontWeight: "700" },
  dayDots: { flexDirection: "row", gap: 1.8, marginTop: 2 }, dayDot: { width: 3.6, height: 3.6, borderRadius: 1.8, borderWidth: 0.9 },

  classCard: { padding: 16, gap: 10, borderRadius: 12, backgroundColor: "white", ...shadow },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 }, ring: { width: 9.8, height: 9.8, borderRadius: 4.9, borderWidth: 2 },
  time: { fontSize: FONT.caption, lineHeight: 14, color: INK, letterSpacing: 0.75 }, cardDate: { fontSize: FONT.caption, color: INK },
  classRow: { flexDirection: "row", gap: 10 }, classPhoto: { width: 93, minHeight: 100, borderRadius: 12, overflow: "hidden" }, photoFill: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  classCopy: { flex: 1, gap: 10 }, classTitle: { fontSize: FONT.body, color: INK, fontWeight: "600" }, lesson: { fontSize: FONT.caption, color: INK, fontWeight: "600" },
  going: { flexDirection: "row" }, goingAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "white" }, goingOverlap: { marginLeft: -4 },
  goingText: { fontSize: FONT.caption, lineHeight: 19, color: GREY, fontWeight: "500", marginLeft: 2 },
  studentAvatar: { width: 24, height: 24, borderRadius: 12 }, studentName: { fontSize: FONT.micro, color: INK, fontWeight: "600" },
  host: { fontSize: FONT.micro, color: GREY },

  detailCard: { padding: 24, gap: 10, borderRadius: 18, backgroundColor: "white", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  count: { fontSize: FONT.caption, lineHeight: 18, color: INK },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 }, meta: { flex: 1, fontSize: FONT.micro, color: GREY },
  priceBlock: { gap: 10 }, price: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginBottom: -6 }, priceValue: { fontSize: FONT.headline, lineHeight: 24, color: INK, fontWeight: "500" }, priceUnit: { fontSize: FONT.body, lineHeight: 21, color: INK },
  fullDates: { gap: 4 }, fullDate: { fontSize: FONT.caption, color: GREY }, fullDateOn: { color: INK, fontWeight: "600" },
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
})
