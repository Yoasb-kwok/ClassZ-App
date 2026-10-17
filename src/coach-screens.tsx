import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import { Alert, BackHandler, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type ImageSourcePropType, type KeyboardTypeOptions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Feather from "@expo/vector-icons/Feather"
import { BlurTargetView, BlurView } from "expo-blur"
import { apiRequest, assetUrl, errorMessage } from "./api"
import { coachClasses, coachSavedState, type CoachBootstrap } from "./coach-api"
import { FONT } from "./typography"
import { pickProfileImage } from "./pick-profile-image"
import { CoachScheduleContext, useCoachSchedule, AllEnrollment, Announce, Attendance, CentreProfile, CheckIns, ClassDetail, CoachSchedule, Feedback, feedbackKey, findClass, LearningRecord, PendingFeedback, pendingFeedback, ProgramDetail, Programs, rosterOf, SAMPLE_ANNOUNCEMENTS, StudentList, studentKey, type Announcement, type CoachClass, type LearningRecordValue, type ScheduleView, type Student } from "./coach-schedule-screens"

const CoachBlurContext=createContext<RefObject<View|null>|undefined>(undefined)
function ModalShade(){const target=useContext(CoachBlurContext);return <BlurView pointerEvents="none" style={StyleSheet.absoluteFill} blurTarget={target} blurMethod="dimezisBlurViewSdk31Plus" intensity={18} tint="dark"/>}

const TEAL = "#0ABAB5"
const COUNTRY_CODES = ["+852", "+853", "+86", "+886", "+65"]
const COLLAPSED_ACCREDITATION_YEARS = 1
const COLLAPSED_EXPERIENCES = 2
const CENTRE_LOGO = require("../assets/figma/coach/schedule/centre-logo-lg.png")
const SAMPLE_AVATAR = require("../assets/figma/coach/avatar.jpg")

type Centre = { id: string; name: string; district: string }
type CentreRole = "Coach" | "Manager"
type Connection = { id: string; centreId: string; role: CentreRole; status: "invited" | "requested" | "connected" }
export type CoachSupportTarget = "password" | "language" | "terms" | "contact"
const DEMO_CENTRES: Centre[] = [
  { id: "1234567890C", name: "AAA Art Centre", district: "Tsim Sha Tsui" },
  { id: "1234567891C", name: "BBB Music Studio", district: "Kennedy Town" },
  { id: "1234567892C", name: "Bright Minds Learning Centre", district: "Tseung Kwan O" },
  { id: "1234567893C", name: "Joy Dance Academy", district: "Mong Kok" },
]
const centreOf = (id: string) => DEMO_CENTRES.find((c) => c.id === id)

type Accreditation = { id: string; skill: string; result: string; year: string; organisation: string }
type Experience = { id: string; position: string; from: string; to: string; workplace: string }
type CoachProfile = {
  fullName: string; displayName: string; country: string; phone: string; email: string; hkid: string; avatar: string | ImageSourcePropType | null
  activities?: boolean; promotions?: boolean; location: string; joinedYear: number; affiliation: string; bio: string; skills: string[]; accreditations: Accreditation[]; experiences: Experience[]
}
type Screen = "register" | "home" | "profile" | "addAccreditation" | "addExperience" | "centres" | "settings" | "account" | "centre" | "schedule" | "enrollments" | "classDetail" | "students" | "announce" | "programs" | "programDetail"
  | "checkins" | "attendance" | "pendingFeedback" | "pendingStudents" | "feedback" | "learningRecord"

let nextId = 0
const uid = () => `local-${Date.now()}-${nextId++}`
const sampleProfile = (name: string, email: string): CoachProfile => ({
  fullName: name, displayName: name, country: "+852", phone: "88888888", email, hkid: "A1234567", avatar: SAMPLE_AVATAR, location: "Hong Kong", joinedYear: new Date().getFullYear() - 2,
  affiliation: "ClassZ Playgroup Bright Kids Drawing Centre",
  bio: "I'm Athena Wang, an experienced music coach with a specialization in piano. For over 15 years, I've had the privilege of helping students of all ages and skill levels develop their musical talents and reach new heights.",
  skills: ["Piano", "Flute", "Violin"],
  accreditations: [
    ...["2022", "2021", "2020"].flatMap((year) => [
      { id: uid(), year, skill: "Flute", result: "Grade 10", organisation: "ABRSM" },
      { id: uid(), year, skill: "Flute", result: "Grade 10", organisation: "Registered member at ABC Violin Association" },
    ]),
    { id: uid(), year: "2021", skill: "Flute", result: "Grade 10", organisation: "ABRSM" },
    { id: uid(), year: "2020", skill: "Flute", result: "Grade 10", organisation: "ABRSM" },
  ],
  experiences: ["2022", "2021", "2020"].map((year) => ({ id: uid(), position: "Music Teacher", from: `01/${year}`, to: `11/${year}`, workplace: "ABC ClassZ International School" })),
})
const emptyProfile = (email: string): CoachProfile => ({ ...sampleProfile("", email), phone: "", hkid: "", avatar: null, affiliation: "", bio: "", skills: [], accreditations: [], experiences: [], joinedYear: new Date().getFullYear() })

const MONTH_YEAR = /^(0[1-9]|1[0-2])\/(\d{4})$/
const toMonths = (v: string) => { const m = MONTH_YEAR.exec(v.trim()); return m ? Number(m[2]) * 12 + Number(m[1]) - 1 : null }
function monthsOf(e: Experience) {
  const now = new Date(), from = toMonths(e.from), to = /^present$/i.test(e.to.trim()) ? now.getFullYear() * 12 + now.getMonth() : toMonths(e.to)
  return from == null || to == null ? 0 : Math.max(0, to - from)
}
const yearOf = (e: Experience) => MONTH_YEAR.exec(e.from.trim())?.[2] ?? e.from
function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>()
  items.forEach((item) => map.set(key(item), [...(map.get(key(item)) ?? []), item]))
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

type AccountForm = Pick<CoachProfile, "fullName" | "displayName" | "country" | "phone" | "email" | "hkid">
function normaliseAccount(form: AccountForm): { value: AccountForm; problem: string } {
  const value = { ...form, fullName: form.fullName.trim(), displayName: form.displayName.trim(), email: form.email.trim(), phone: form.phone.replace(/\s/g, ""), hkid: form.hkid.replace(/[\s()]/g, "").toUpperCase() }
  const problem = !/^\S+@\S+\.\S+$/.test(value.email) ? "Please enter a valid email address."
    : !/^\d{6,11}$/.test(value.phone) || (value.country === "+852" && value.phone.length !== 8) ? "Please enter a valid phone number."
    : !/^[A-Z]{1,2}\d{6}[\dA]$/.test(value.hkid) ? "Please enter a valid HK ID, e.g. A123456(7)." : ""
  return { value, problem }
}

type CoachFlowProps = { start: "register" | "home"; token?: string; name?: string; email?: string; onExit?: () => void; onSignOut: () => void; onOpenSupport?: (target: CoachSupportTarget) => void }
export function CoachFlow(props: CoachFlowProps) {
  const blurTarget=useRef<View|null>(null)
  const [data,setData]=useState<CoachBootstrap|null>(null)
  const [problem,setProblem]=useState("")
  const reload=async()=>{ if(!props.token)return; const r=await apiRequest<{data:CoachBootstrap}>("/coach/bootstrap",{token:props.token});setData(r.data);setProblem("") }
  useEffect(()=>{reload().catch(e=>setProblem(errorMessage(e)))},[props.token])
  const classes=useMemo(()=>data?coachClasses(data):[],[data])
  if(props.token&&!data)return <Page title="Profile"><Text style={s.emptyTitle}>{problem||"Loading your coach account…"}</Text>{!!problem&&<Primary label="Retry" onPress={()=>reload().catch(e=>setProblem(errorMessage(e)))} />}</Page>
  return <CoachBlurContext.Provider value={blurTarget}><BlurTargetView ref={blurTarget} style={{flex:1}}><CoachScheduleContext.Provider value={props.token?classes:null}><CoachFlowContent {...props} data={data} reload={reload}/></CoachScheduleContext.Provider></BlurTargetView></CoachBlurContext.Provider>
}
function CoachFlowContent({ start, token, data, reload, name = "", email = "", onExit, onSignOut, onOpenSupport }: CoachFlowProps & {data:CoachBootstrap|null;reload:()=>Promise<void>}) {
  const {findClass,pendingFeedback}=useCoachSchedule()
  const api=async(path:string,method="POST",body?:unknown)=>apiRequest(path,{token,method,body})
  const attempt=async(action:()=>Promise<void>)=>{try{await action()}catch(e){Alert.alert("Unable to save",errorMessage(e))}}

  const [stack, setStack] = useState<Screen[]>([start])
  const [profile, setProfile] = useState<CoachProfile>(() => data ? {...emptyProfile(email),...data.profile,avatar:assetUrl(data.profile.avatar),displayName:data.profile.displayName||name} as CoachProfile : start === "register" ? emptyProfile(email) : sampleProfile(name || "Athena Young", email))
  const screen = stack[stack.length - 1]
  const open = (next: Screen) => setStack((prev) => [...prev, next])
  const back = () => { if (stack.length > 1) setStack((prev) => prev.slice(0, -1)); else onExit?.() }
  const patch = (next: Partial<CoachProfile>) => {
    if(!token){setProfile(prev=>({...prev,...next}));return}
    void attempt(async()=>{const r=await apiRequest<{data:Partial<CoachProfile>}>("/coach/profile",{token,method:"PATCH",body:next});setProfile(prev=>({...prev,...r.data,avatar:typeof r.data.avatar==="string"?assetUrl(r.data.avatar):r.data.avatar??prev.avatar}))})
  }
  const [connections, setConnections] = useState<Connection[]>(() => data ? data.connections.map(c=>({id:String(c.id),centreId:String(c.centre_id),role:c.role,status:c.status})) : start === "register" ? [] : [
    { id: uid(), centreId: DEMO_CENTRES[0].id, role: "Manager", status: "invited" },
    { id: uid(), centreId: DEMO_CENTRES[0].id, role: "Coach", status: "invited" },
  ])
  const [invitation,setInvitation]=useState<Connection|null>(null)
  const [pending, setPending] = useState<{ centreId: string; apply: () => void } | null>(null)
  function guardSwitch(centreId: string, apply: () => void) {
    const current = connections.find((c) => c.status === "connected")
    if (current && current.centreId !== centreId) setPending({ centreId, apply: () => { if(!token)setConnections((prev) => prev.filter((c) => !(c.status === "connected" && c.centreId === current.centreId))); apply() } })
    else apply()
  }
  const centres:Centre[]=data?data.centres.map(c=>({...c,id:String(c.id)})):DEMO_CENTRES
  const accept = (c: Connection) => guardSwitch(c.centreId, () => { if(token)void attempt(async()=>{await api(`/coach/connections/${c.id}/respond`,"POST",{accept:true});await reload()});else setConnections(prev=>prev.map(v=>v.id===c.id?{...v,status:"connected"}:v)) })
  const connect = (centre: Centre) => guardSwitch(centre.id, () => { if(token)void attempt(async()=>{await api("/coach/connections","POST",{center_id:Number(centre.id)});await reload()});else setConnections(prev=>[...prev,{id:uid(),centreId:centre.id,role:"Coach",status:"requested"}]) })
  const support = (target: CoachSupportTarget) => onOpenSupport ? onOpenSupport(target) : Alert.alert("Please log in first", "This setting is available after you log in.")
  const [centreId, setCentreId] = useState<string | null>(null)
  const [classId, setClassId] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState<ReadonlySet<string>>(() => new Set())
  const [checkedIn, setCheckedIn] = useState<Record<string, string[]>>({})
  const [feedbackDone, setFeedbackDone] = useState<ReadonlySet<string>>(() => new Set())
  const [studentName, setStudentName] = useState("")
  const [selectedLesson, setSelectedLesson] = useState<CoachClass | null>(null)
  const [recordClassId,setRecordClassId]=useState<string|null>(null)
  const [recordLesson, setRecordLesson] = useState<number | null>(null)
  const [savedRecords, setSavedRecords] = useState<Record<string, LearningRecordValue>>({})
  const [disconnecting, setDisconnecting] = useState(false)
  const [scheduleView, setScheduleView] = useState<ScheduleView>(() => { const now = new Date(); return { tab: "calendar", month: new Date(now.getFullYear(), now.getMonth(), 1), selected: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } })
  const [programTitle, setProgramTitle] = useState("")
  const [announcements, setAnnouncements] = useState<Record<string, Announcement[]>>({})
  const openClass = (c: CoachClass, next: Screen = "classDetail") => { setClassId(c.id); setSelectedLesson(c); open(next) }
  const openCentre = (id: string) => { setCentreId(id); open("centre") }
  const openFeedback = (c: CoachClass, st: Student) => { setClassId(c.id); setSelectedLesson(c); setStudentName(studentKey(st)); setRecordClassId(null); setRecordLesson(null); open("feedback") }
  const pendingList = useMemo(() => pendingFeedback(cancelled, feedbackDone), [cancelled, feedbackDone])

  useEffect(()=>{
    if(!data)return
    setConnections(data.connections.map(c=>({id:String(c.id),centreId:String(c.centre_id),role:c.role,status:c.status})))
    const live=coachSavedState(data,coachClasses(data));setSavedRecords(live.records);setCheckedIn(live.checked);setFeedbackDone(live.done);setAnnouncements(live.announcements)
  },[data])
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { if (stack.length > 1) { back(); return true } return false })
    return () => sub.remove()
  })

  if (screen === "register") return <CoachRegistration profile={profile} onBack={back} onSubmit={(next) => { patch(next); setStack(["home"]) }} />
  if (screen === "profile") return <CoachProfileScreen profile={profile} onBack={back} onChange={patch} onAddAccreditation={() => open("addAccreditation")} onAddExperience={() => open("addExperience")} />
  if (screen === "addAccreditation") return <AddForm title="Add Accreditation" onBack={back} fields={[
    [{ key: "skill", placeholder: "Skill" }], [{ key: "result", placeholder: "Results" }, { key: "year", placeholder: "Year of attained", keyboardType: "number-pad", maxLength: 4, validate: (v) => /^\d{4}$/.test(v) && Number(v) <= new Date().getFullYear() ? "" : "Enter a valid year, e.g. 2022." }], [{ key: "organisation", placeholder: "Organisation or competition name" }],
  ]} onConfirm={(v) => { patch({ accreditations: [{ id: uid(), skill: v.skill, result: v.result, year: v.year, organisation: v.organisation }, ...profile.accreditations] }); back() }} />
  if (screen === "addExperience") return <AddForm title="Add Experience" onBack={back} fields={[
    [{ key: "position", placeholder: "Position" }], [{ key: "from", placeholder: "From (MM/YYYY)", maxLength: 7, validate: (v) => toMonths(v) == null ? "Use MM/YYYY for From, e.g. 01/2022." : "" }, { key: "to", placeholder: "To (MM/YYYY)", maxLength: 7, validate: (v, all) => { const to = toMonths(v), from = toMonths(all.from); return to == null ? "Use MM/YYYY for To, e.g. 11/2022." : from != null && to < from ? "To must be after From." : "" } }], [{ key: "workplace", placeholder: "Name of workplace" }],
  ]} onConfirm={(v) => { patch({ experiences: [{ id: uid(), position: v.position, from: v.from, to: v.to, workplace: v.workplace }, ...profile.experiences] }); back() }} />
  const centre = centreId ? centres.find(c=>c.id===centreId) : undefined
  if (screen === "centre" && centre) return <>
    <CentreProfile centreName={centre.name} cancelled={cancelled} checked={checkedIn} pending={pendingList} onBack={back} onPrograms={() => open("programs")} onSchedule={() => open("schedule")} onAnnounce={(c) => openClass(c, "announce")} onOpenClass={(c) => openClass(c)}
      onCheckIns={() => open("checkins")} onPendingFeedback={() => open("pendingFeedback")} onFeedback={openFeedback} onDisconnect={() => setDisconnecting(true)} />
    <SwitchWarning visible={disconnecting} variant="disconnect" onContinue={() => { setDisconnecting(false); if(token)void attempt(async()=>{await api(`/coach/connections/${centre.id}`,"DELETE");await reload();back()});else{setConnections((prev) => prev.filter((c) => c.centreId !== centre.id));back()} }} onBack={() => setDisconnecting(false)} />
  </>
  if (screen === "schedule") return <CoachSchedule view={scheduleView} cancelled={cancelled} onChange={setScheduleView} onBack={back} onOpenClass={(c) => openClass(c)} onViewAll={() => open("enrollments")}
    onDelete={(c) => {if(token)void attempt(async()=>{await api(`/coach/classes/${c.id}/cancel`);await reload()});else setCancelled(prev=>new Set(prev).add(c.id))}} />
  if (screen === "enrollments") return <AllEnrollment cancelled={cancelled} onBack={back} onOpenClass={(c) => openClass(c)} />
  if (screen === "programs") return <Programs cancelled={cancelled} onBack={back} onOpen={(title) => { setProgramTitle(title); open("programDetail") }} />
  if (screen === "programDetail") return <ProgramDetail title={programTitle} cancelled={cancelled} onBack={back} />
  if (screen === "checkins") return <CheckIns cancelled={cancelled} onBack={back} onOpen={(c) => openClass(c, "attendance")} />
  if (screen === "pendingFeedback") return <PendingFeedback pending={pendingList} onBack={back} onOpen={(c) => openClass(c, "pendingStudents")} />
  const coachName = profile.displayName || profile.fullName
  const coachAvatar = profile.avatar == null ? null : typeof profile.avatar === "string" ? { uri: profile.avatar } : profile.avatar
  const lesson = classId && !cancelled.has(classId) ? (selectedLesson?.id === classId ? selectedLesson : findClass(classId, cancelled)) : null
  const student = lesson ? rosterOf(lesson).find((st) => studentKey(st) === studentName) : undefined
  if (lesson && screen === "students") return <StudentList item={lesson} onBack={back} onOpen={(st) => openFeedback(lesson, st)} />
  if (lesson && screen === "attendance") return <Attendance item={lesson} checked={checkedIn[lesson.id] ?? []} onBack={back}
    onVerify={token?async(code,enrollment_id)=>{await api(`/coach/classes/${lesson.id}/check-in`,"POST",{code,enrollment_id});await reload()}:undefined}
    onCheckIn={(name) => setCheckedIn((prev) => ({ ...prev, [lesson.id]: [...(prev[lesson.id] ?? []), name] }))} />
  if (lesson && screen === "pendingStudents") return <StudentList title="Pending Feedback" item={lesson} students={rosterOf(lesson).filter((st) => !feedbackDone.has(feedbackKey(lesson, st)))} onBack={back} onOpen={(st) => openFeedback(lesson, st)} />
  if (lesson && student && screen === "feedback") return <Feedback item={lesson} student={student} coachName={coachName} coachAvatar={coachAvatar} onBack={back} recordSubmitted={feedbackDone.has(feedbackKey(lesson, student))} onRecord={() => { setRecordClassId(null); setRecordLesson(null); open("learningRecord") }}
    history={token&&data?coachClasses(data).filter(c=>c.id!==lesson.id&&data.classes.find(r=>String(r.id)===c.id)?.records.some((r:any)=>Number(r.profile_id)===student.profileId)&&data.classes.find(r=>String(r.id)===c.id)?.program_code===data.classes.find(r=>String(r.id)===lesson.id)?.program_code):[]}
    onViewHistory={c=>{setRecordClassId(c.id);setRecordLesson(c.lesson);open("learningRecord")}}
    onViewRecord={(n) => { setRecordClassId(null); setRecordLesson(n); open("learningRecord") }} />
  const recordItem=recordClassId?findClass(recordClassId,cancelled)??lesson:lesson
  const recordStudent=recordItem&&student?rosterOf(recordItem).find(s=>s.profileId===student.profileId&&s.name===student.name)??student:student
  if (lesson && student && recordItem && recordStudent && screen === "learningRecord") return <LearningRecord key={`${lesson.id}-${student.name}-${recordLesson ?? "draft"}`} item={recordItem} student={recordStudent} onBack={back}
    readOnly={recordLesson != null} initialValue={savedRecords[`${feedbackKey(recordItem, recordStudent)}|${recordLesson ?? recordItem.lesson}`]}
    onSave={async(record) => { if(token){await api(`/coach/classes/${lesson.id}/records`,"POST",{enrollment_id:student.enrollmentId,form:record});await reload();setStack(prev=>prev.slice(0,-2));return} setSavedRecords((prev) => ({ ...prev, [`${feedbackKey(lesson, student)}|${lesson.lesson}`]: record })); setFeedbackDone((prev) => new Set(prev).add(feedbackKey(lesson, student))); setStack((prev) => prev.slice(0, -2)) }} />
  if (lesson && screen === "announce") return <Announce item={lesson} coachName={coachName} messages={announcements[lesson.id] ?? (token?[]:SAMPLE_ANNOUNCEMENTS)} onBack={back} onStudents={() => open("students")}
    onSend={async(text,image) => {if(token){await api(`/coach/classes/${lesson.id}/announcements`,"POST",{text,image});await reload()}else setAnnouncements(prev=>({...prev,[lesson.id]:[...(prev[lesson.id]??SAMPLE_ANNOUNCEMENTS),{id:uid(),text}]}))}} />
  if (lesson && screen === "classDetail") return <ClassDetail item={lesson} coachName={coachName} coachAvatar={coachAvatar} attended={(checkedIn[lesson.id]?.length ?? 0) >= rosterOf(lesson).length}
    onRearrange={token?async()=>{await api(`/coach/classes/${lesson.id}/rearrangement`)}:undefined}
    onBack={back} onStudents={() => open("students")} onAttendance={() => open("attendance")} onCancel={() => {if(token)void attempt(async()=>{await api(`/coach/classes/${lesson.id}/cancel`);await reload();back()});else{back();setCancelled(prev=>new Set(prev).add(lesson.id))}}} />
  const warning = <><SwitchWarning visible={!!pending} onContinue={() => { pending?.apply(); setPending(null) }} onBack={() => setPending(null)} />
    <Modal visible={!!invitation} transparent animationType="fade" onRequestClose={()=>setInvitation(null)}><View style={s.backdrop}><ModalShade/><View style={s.warning}><Pressable accessibilityRole="button" accessibilityLabel="Close invitation" style={s.warningClose} onPress={()=>setInvitation(null)}><Feather name="x" size={16}/></Pressable><View style={{flexDirection:"row",alignItems:"center",gap:12,marginBottom:20}}><Image source={CENTRE_LOGO} style={{width:48,height:48}}/><View style={{flex:1}}><Text style={s.name}>{centres.find(c=>c.id===invitation?.centreId)?.name}</Text><Text style={s.muted}>{centres.find(c=>c.id===invitation?.centreId)?.district}</Text></View></View><Text style={s.warningCopy}>You have been assigned{`\n`}as a {invitation?.role==="Manager"?"Centre Manager":"Coach"} for the above centre</Text><Text style={s.warningAsk}>{invitation?.role==="Manager"?"Please oversee operations, manage schedules, and ensure smooth communication within ClassZ.":"Please take attendance, and provide learning feedback after each session."}</Text><View style={s.warningActions}><Pressable accessibilityRole="button" style={s.warningPrimary} onPress={()=>{if(invitation){accept(invitation);setInvitation(null)}}}><Text style={s.warningPrimaryText}>Accept</Text></Pressable><Pressable accessibilityRole="button" style={s.warningSecondary} onPress={()=>{if(!invitation)return;const id=invitation.id;if(token)void attempt(async()=>{await api(`/coach/connections/${id}/respond`,"POST",{accept:false});await reload();setInvitation(null)});else{setConnections(prev=>prev.filter(c=>c.id!==id));setInvitation(null)}}}><Text style={s.warningSecondaryText}>Reject</Text></Pressable></View></View></View></Modal></>
  if (screen === "centres") return <>{<CentreSearch centres={centres} connections={connections} onBack={back} onConnect={connect} />}{warning}</>
  if (screen === "settings") return <CoachSettings profile={profile} onBack={back} onChange={patch} onAccount={() => open("account")} onSupport={support} onSignOut={onSignOut} />
  if (screen === "account") return <MyAccount token={token} profile={profile} onBack={back} onSave={(next) => { patch(next); back() }} />
  return <>{<CoachHome centres={centres} profile={profile} connections={connections} onAccept={setInvitation} onEditPhoto={() => choosePhoto((avatar) => patch({ avatar }))} onOpenProfile={() => open("profile")} onOpenCentre={openCentre} onSearch={() => open("centres")} onSettings={() => open("settings")} />}{warning}</>
}

function Page({ title, subtitle, onBack, left = false, right, children, footer }: { title: string; subtitle?: string; onBack?: () => void; left?: boolean; right?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <View style={[s.header, { paddingTop: insets.top + 12 }]}>
      {left ? <Text accessibilityRole="header" style={s.homeTitle}>{title}</Text> : <>
        {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} style={s.round} onPress={onBack}><Feather name="chevron-left" size={20} color="#292929" /></Pressable> : <View style={s.roundSpacer} />}
        <View style={s.headerTitles}><Text accessibilityRole="header" style={s.headerTitle}>{title}</Text>{!!subtitle && <Text style={s.headerSubtitle}>{subtitle}</Text>}</View>
      </>}
      {right ?? <View style={s.roundSpacer} />}
    </View>
    <View style={s.sheet}>
      <ScrollView contentContainerStyle={[s.content, !footer && { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
      {footer && <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>{footer}</View>}
    </View>
  </KeyboardAvoidingView>
}

function Avatar({ uri, size, onEdit }: { uri: CoachProfile["avatar"]; size: number; onEdit?: () => void }) {
  const source: ImageSourcePropType | null = uri == null ? null : typeof uri === "string" ? { uri } : uri
  return <View style={{ width: size, height: size }}>
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>{source ? <Image source={source} style={s.fill} /> : <Feather name="user" size={size * 0.42} color="#BDBDBD" />}</View>
    {onEdit && <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" hitSlop={8} style={s.editBadge} onPress={onEdit}><Feather name="edit-2" size={11} color="white" /></Pressable>}
  </View>
}

function Field({ value, onChangeText, placeholder, keyboardType, maxLength, autoCapitalize, style }: { value: string; onChangeText: (v: string) => void; placeholder: string; keyboardType?: KeyboardTypeOptions; maxLength?: number; autoCapitalize?: "none" | "characters" | "words"; style?: object }) {
  return <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#AAAAAA" keyboardType={keyboardType} maxLength={maxLength} autoCapitalize={autoCapitalize} style={[s.input, style]} />
}

function Primary({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} style={[s.primary, disabled && s.primaryOff]} onPress={onPress}><Text style={s.primaryText}>{label}</Text></Pressable>
}

async function choosePhoto(onPicked: (uri: string) => void) {
  try { const picked = await pickProfileImage(); if (picked) onPicked(picked.dataUrl) }
  catch (err) { Alert.alert("Unable to choose photo", (err as Error).message) }
}

function CoachRegistration({ profile, onBack, onSubmit }: { profile: CoachProfile; onBack: () => void; onSubmit: (next: Partial<CoachProfile>) => void }) {
  const [form, setForm] = useState({ fullName: profile.fullName, displayName: profile.displayName, country: profile.country, phone: profile.phone, email: profile.email, hkid: profile.hkid })
  const [avatar, setAvatar] = useState(profile.avatar)
  const [picker, setPicker] = useState(false)
  const [error, setError] = useState("")
  const set = (key: keyof typeof form) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }))
  const filled = Object.values(form).every((v) => v.trim())
  function submit() {
    const { value, problem } = normaliseAccount(form)
    if (problem) { setError(problem); return }
    onSubmit({ ...value, avatar })
  }
  return <Page title="Registration" subtitle="Coach" onBack={onBack} footer={<Primary label="Register" disabled={!filled} onPress={submit} />}>
    <View style={s.registerAvatar}><Avatar uri={avatar} size={110} onEdit={() => choosePhoto(setAvatar)} /></View>
    <Field value={form.fullName} onChangeText={set("fullName")} placeholder="Full Name" autoCapitalize="words" />
    <Field value={form.displayName} onChangeText={set("displayName")} placeholder="Display Name" autoCapitalize="words" />
    <View style={s.phoneRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Country code ${form.country}`} style={s.country} onPress={() => setPicker(true)}>
        <Text style={s.countryLabel}>Country</Text><View style={s.inline}><Text style={s.countryValue}>{form.country}</Text><Feather name="chevron-down" size={14} color="#555555" /></View>
      </Pressable>
      <Field value={form.phone} onChangeText={set("phone")} placeholder="Phone" keyboardType="phone-pad" maxLength={11} style={s.phoneInput} />
    </View>
    <Field value={form.email} onChangeText={set("email")} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
    <Field value={form.hkid} onChangeText={set("hkid")} placeholder="HK ID" autoCapitalize="characters" maxLength={11} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <CountryPicker visible={picker} value={form.country} onClose={() => setPicker(false)} onPick={set("country")} />
  </Page>
}

function CountryPicker({ visible, value, onClose, onPick }: { visible: boolean; value: string; onClose: () => void; onPick: (code: string) => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={s.backdrop} onPress={onClose}><View style={s.modal}>
    {COUNTRY_CODES.map((code) => <Pressable key={code} accessibilityRole="radio" accessibilityState={{ checked: value === code }} style={s.modalRow} onPress={() => { onPick(code); onClose() }}>
      <Text style={s.modalText}>{code}</Text>{value === code && <Feather name="check" size={16} color="#222222" />}
    </Pressable>)}
  </View></Pressable></Modal>
}

function CentreCard({ centre, children, onPress }: { centre: Centre; children: ReactNode; onPress?: () => void }) {
  return <Pressable accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={onPress ? `Open ${centre.name}` : undefined} style={[s.card, s.centreCard]} onPress={onPress}>
    <Image source={CENTRE_LOGO} style={s.centreLogo} />
    <View style={s.itemCopy}>
      <Text numberOfLines={1} style={s.centreName}>{centre.name}</Text>
      <View style={s.inline}><Feather name="map-pin" size={13} color="#555555" /><Text style={s.centreMeta}>{centre.district}</Text></View>
      <Text style={s.centreId}>ID: #{centre.id}</Text>
    </View>
    <View style={s.centreActions}>{children}</View>
  </Pressable>
}

function CoachHome({ centres, profile, connections, onAccept, onEditPhoto, onOpenProfile, onOpenCentre, onSearch, onSettings }: { profile: CoachProfile; centres: Centre[]; connections: Connection[]; onAccept: (c: Connection) => void; onEditPhoto: () => void; onOpenProfile: () => void; onOpenCentre: (centreId: string) => void; onSearch: () => void; onSettings: () => void }) {
  const [notice, setNotice] = useState("")
  const years = Math.floor(profile.experiences.reduce((sum, e) => sum + monthsOf(e), 0) / 12)
  const stats: Array<[number, string]> = [[profile.skills.length, "Skills"], [profile.accreditations.length, "Certificate"], [years, "Years of Experience"]]
  const right = <View style={s.inline}>
    <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={s.round} onPress={() => setNotice("No new notifications.")}><Feather name="bell" size={18} color="#292929" /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={s.round} onPress={onSettings}><Feather name="settings" size={18} color="#292929" /></Pressable>
  </View>
  return <Page title="Profile" left right={right}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open coach profile of ${profile.displayName}`} style={s.card} onPress={onOpenProfile}>
      <View style={s.homeCard}>
        <View style={s.homeIdentity}><Avatar uri={profile.avatar} size={84} onEdit={onEditPhoto} /><Text numberOfLines={1} style={s.name}>{profile.displayName || profile.fullName}</Text><Text style={s.muted}>{profile.location}</Text></View>
        <View style={s.stats}>{stats.map(([n, label], i) => <View key={label} style={[s.stat, i > 0 && s.statDivider]}><Text style={s.statNumber}>{n}</Text><Text style={s.muted}>{label}</Text></View>)}</View>
      </View>
      <Feather name="arrow-right" size={16} color="#292929" style={s.cardArrow} />
    </Pressable>
    <View style={s.sectionHead}><Text style={s.sectionTitle}>Connected Centre</Text>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={onSearch}><Text style={s.link}>Search centre</Text></Pressable>
    </View>
    {connections.length ? connections.map((c) => { const centre = centres.find(v=>v.id===c.centreId); return centre && <CentreCard key={c.id} centre={centre} onPress={c.status === "connected" ? () => onOpenCentre(centre.id) : undefined}>
      <Text style={s.rolePill}>{c.role}</Text>
      {c.status === "invited" && <Pressable accessibilityRole="button" accessibilityLabel={`Accept ${c.role} invitation from ${centre.name}`} style={s.centreActionButton} hitSlop={8} onPress={() => onAccept(c)}><Feather name="plus" size={11} color="#555555" /><Text style={s.actionText}>Accept</Text></Pressable>}
      {c.status === "requested" && <Text style={s.muted}>Pending</Text>}
    </CentreCard> })
    : <View style={s.empty}><Text style={s.emptyTitle}>No centre yet</Text><Text style={s.muted}>Search for centre by name, ID, place to send invitation</Text></View>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
  </Page>
}

function RemoveButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${label}`} hitSlop={10} onPress={onPress}><Feather name="x" size={15} color="#AAAAAA" /></Pressable>
}
function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return <View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text>{onAdd && <Pressable accessibilityRole="button" accessibilityLabel={`Add ${title}`} hitSlop={8} style={s.inline} onPress={onAdd}><Feather name="plus" size={13} color="#292929" /><Text style={s.addText}>Add</Text></Pressable>}</View>
}
function Toggle({ open, onPress }: { open: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} hitSlop={8} style={s.toggle} onPress={onPress}><Text style={s.muted}>{open ? "Hide" : "More"}</Text><Feather name={open ? "chevron-up" : "chevron-down"} size={12} color="#AAAAAA" /></Pressable>
}

function CoachProfileScreen({ profile, onBack, onChange, onAddAccreditation, onAddExperience }: { profile: CoachProfile; onBack: () => void; onChange: (next: Partial<CoachProfile>) => void; onAddAccreditation: () => void; onAddExperience: () => void }) {
  const [showAllAccreditations, setShowAllAccreditations] = useState(false)
  const [showAllExperiences, setShowAllExperiences] = useState(false)
  const [skillDraft, setSkillDraft] = useState<string | null>(null)
  const [editingBio,setEditingBio]=useState(false)
  const [bio,setBio]=useState(profile.bio)
  const accreditationYears = useMemo(() => groupBy(profile.accreditations, (a) => a.year), [profile.accreditations])
  const experiences = useMemo(() => [...profile.experiences].sort((a, b) => (toMonths(b.from) ?? 0) - (toMonths(a.from) ?? 0)), [profile.experiences])
  const visibleYears = showAllAccreditations ? accreditationYears : accreditationYears.slice(0, COLLAPSED_ACCREDITATION_YEARS)
  const visibleExperiences = showAllExperiences ? experiences : experiences.slice(0, COLLAPSED_EXPERIENCES)
  const yearsOnClassZ = Math.max(0, new Date().getFullYear() - profile.joinedYear)
  function addSkill() {
    const skill = skillDraft?.trim()
    if (skill && !profile.skills.some((v) => v.toLowerCase() === skill.toLowerCase())) onChange({ skills: [...profile.skills, skill] })
    setSkillDraft(null)
  }
  return <Page title="Coach Profile" onBack={onBack}>
    <View style={[s.card, s.profileCard]}>
      <View style={s.profileTop}>
        <Avatar uri={profile.avatar} size={72} onEdit={() => choosePhoto((avatar) => onChange({ avatar }))} />
        <View style={s.profileCopy}>
          <Text style={s.name}>{profile.displayName || profile.fullName}</Text>
          <Text style={s.muted}><Text style={s.bigNumber}>{yearsOnClassZ}</Text> Years on ClassZ</Text>
          {!!profile.affiliation && <Text style={s.affiliation}>{profile.affiliation}</Text>}
        </View>
      </View>
      {editingBio?<><TextInput accessibilityLabel="Coach description" value={bio} onChangeText={setBio} multiline maxLength={2000} style={[s.bio,{minHeight:90,borderWidth:1,borderColor:"#ddd",padding:10}]}/><Pressable accessibilityRole="button" onPress={()=>{onChange({bio:bio.trim()});setEditingBio(false)}}><Text style={s.link}>Save description</Text></Pressable></>:<><Text style={s.bio}>{profile.bio}</Text><Pressable accessibilityRole="button" onPress={()=>{setBio(profile.bio);setEditingBio(true)}}><Text style={s.link}>Edit description</Text></Pressable></>}
    </View>

    <SectionHeader title="Skills" />
    <View style={s.chips}>
      {profile.skills.map((skill) => <View key={skill} style={s.chip}><Text style={s.chipText}>{skill}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${skill}`} hitSlop={8} onPress={() => onChange({ skills: profile.skills.filter((v) => v !== skill) })}><Feather name="x" size={11} color="#292929" /></Pressable></View>)}
      {skillDraft == null
        ? <Pressable accessibilityRole="button" accessibilityLabel="Add skill" hitSlop={8} style={s.chipAdd} onPress={() => setSkillDraft("")}><Feather name="plus" size={14} color="#292929" /></Pressable>
        : <TextInput accessibilityLabel="New skill" autoFocus value={skillDraft} onChangeText={setSkillDraft} onSubmitEditing={addSkill} onBlur={addSkill} returnKeyType="done" placeholder="Skill" placeholderTextColor="#AAAAAA" maxLength={30} style={s.chipInput} />}
    </View>

    <SectionHeader title="Accreditation" onAdd={onAddAccreditation} />
    {accreditationYears.length ? <View style={[s.card, s.listCard]}>
      {visibleYears.map(([year, items]) => <View key={year} style={s.yearGroup}>
        <Text style={s.year}>{year}</Text>
        <View style={s.timeline}>{items.map((a) => <View key={a.id} style={s.item}>
          <View style={s.itemCopy}><Text style={s.itemTitle}>{a.skill}</Text><Text style={s.itemText}>{a.result}</Text><Text style={s.itemText}>{a.organisation}</Text></View>
          <RemoveButton label={`${a.skill} ${a.year}`} onPress={() => onChange({ accreditations: profile.accreditations.filter((v) => v.id !== a.id) })} />
        </View>)}</View>
      </View>)}
    </View> : <Text style={s.muted}>No accreditation yet. Tap Add to include your certificates.</Text>}
    {accreditationYears.length > COLLAPSED_ACCREDITATION_YEARS && <Toggle open={showAllAccreditations} onPress={() => setShowAllAccreditations((v) => !v)} />}

    <SectionHeader title="Experience" onAdd={onAddExperience} />
    {visibleExperiences.map((e) => <View key={e.id} style={[s.card, s.listCard]}>
      <Text style={s.year}>{yearOf(e)}</Text>
      <View style={[s.item, s.experienceItem]}>
        <View style={s.itemCopy}><Text style={s.itemTitle}>{e.position}</Text><Text style={s.itemText}>{monthsOf(e)} months experience</Text><Text style={s.itemText}>{e.workplace}</Text></View>
        <RemoveButton label={`${e.position} at ${e.workplace}`} onPress={() => onChange({ experiences: profile.experiences.filter((v) => v.id !== e.id) })} />
      </View>
    </View>)}
    {!experiences.length && <Text style={s.muted}>No experience yet. Tap Add to include your teaching history.</Text>}
    {experiences.length > COLLAPSED_EXPERIENCES && <Toggle open={showAllExperiences} onPress={() => setShowAllExperiences((v) => !v)} />}
  </Page>
}

type FormField = { key: string; placeholder: string; keyboardType?: KeyboardTypeOptions; maxLength?: number; validate?: (value: string, all: Record<string, string>) => string }
function AddForm({ title, fields, onBack, onConfirm }: { title: string; fields: FormField[][]; onBack: () => void; onConfirm: (values: Record<string, string>) => void }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const all = fields.flat()
  const filled = all.every((f) => values[f.key]?.trim())
  function confirm() {
    const trimmed = Object.fromEntries(all.map((f) => [f.key, (values[f.key] ?? "").trim()]))
    const problem = all.map((f) => f.validate?.(trimmed[f.key], trimmed) ?? "").find(Boolean)
    if (problem) { setError(problem); return }
    onConfirm(trimmed)
  }
  return <Page title={title} onBack={onBack}>
    {fields.map((row) => <View key={row.map((f) => f.key).join()} style={s.formRow}>{row.map((f) => <Field key={f.key} value={values[f.key] ?? ""} onChangeText={(v) => { setError(""); setValues((prev) => ({ ...prev, [f.key]: v })) }} placeholder={f.placeholder} keyboardType={f.keyboardType} maxLength={f.maxLength} style={s.flex} />)}</View>)}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Primary label="Confirm" disabled={!filled} onPress={confirm} />
  </Page>
}

function CentreSearch({ centres, connections, onBack, onConnect }: { centres: Centre[]; connections: Connection[]; onBack: () => void; onConnect: (centre: Centre) => void }) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const results = centres.filter((c) => !q || [c.name, c.id, c.district].some((v) => v.toLowerCase().includes(q.replace(/^#/, ""))))
  const statusOf = (centre: Centre) => connections.find((c) => c.centreId === centre.id && c.role === "Coach")?.status
  return <Page title="Centre" onBack={onBack}>
    <View style={s.search}><Feather name="search" size={15} color="#AAAAAA" /><TextInput accessibilityLabel="Search centre" value={query} onChangeText={setQuery} placeholder="Search centre by name, ID, place" placeholderTextColor="#AAAAAA" autoCorrect={false} style={s.searchInput} /></View>
    {results.map((centre) => { const status = statusOf(centre); return <CentreCard key={centre.id} centre={centre}>
      {status ? <Text style={s.muted}>{status === "connected" ? "Connected" : status === "requested" ? "Pending" : "Invited"}</Text>
        : <Pressable accessibilityRole="button" accessibilityLabel={`Connect to ${centre.name}`} style={s.centreActionButton} hitSlop={8} onPress={() => onConnect(centre)}><Feather name="plus" size={11} color="#555555" /><Text style={s.connectText}>Connect</Text></Pressable>}
    </CentreCard> })}
    {!results.length && <Text style={s.notice}>No centre matches "{query.trim()}".</Text>}
  </Page>
}

function SwitchWarning({ visible, variant = "switch", onContinue, onBack }: { visible: boolean; variant?: "switch" | "disconnect"; onContinue: () => void; onBack: () => void }) {
  const disconnect = variant === "disconnect"
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onBack}><View style={s.backdrop}><ModalShade/><View style={s.warning}>
    <Pressable accessibilityRole="button" accessibilityLabel="Close confirmation" hitSlop={8} style={s.warningClose} onPress={onBack}><Feather name="x" size={16} color="#555555" /></Pressable>
    <Text accessibilityRole="header" style={s.warningCopy}>{disconnect ? "Are you sure want to\ndisconnect?" : "Connecting to a new\ncentre will lost access to\nthe connected centre"}</Text>
    <Text style={s.warningAsk}>{disconnect ? "Permission will be revoked immediately" : "Do you still want to proceed it?"}</Text>
    <View style={s.warningActions}>
      <Pressable accessibilityRole="button" style={s.warningPrimary} onPress={onContinue}><Text style={s.warningPrimaryText}>Yes</Text></Pressable>
      <Pressable accessibilityRole="button" style={s.warningSecondary} onPress={onBack}><Text style={s.warningSecondaryText}>No</Text></Pressable>
    </View>
  </View></View></Modal>
}

function SettingsRow({ icon, label, onPress, right }: { icon: keyof typeof Feather.glyphMap; label: string; onPress?: () => void; right?: ReactNode }) {
  return <Pressable accessibilityRole={onPress ? "button" : undefined} disabled={!onPress} style={s.settingsRow} onPress={onPress}>
    <Feather name={icon} size={16} color="#292929" /><Text style={s.settingsLabel}>{label}</Text>{right ?? <Feather name="chevron-right" size={16} color="#292929" />}
  </Pressable>
}

function CoachSettings({ profile, onBack, onChange, onAccount, onSupport, onSignOut }: { profile: CoachProfile; onBack: () => void; onChange: (next: Partial<CoachProfile>) => void; onAccount: () => void; onSupport: (target: CoachSupportTarget) => void; onSignOut: () => void }) {
  const [notify, setNotify] = useState(profile.activities!==false)
  const [promotions,setPromotions]=useState(!!profile.promotions)
  const sections: Array<{ title: string; rows: Array<{ icon: keyof typeof Feather.glyphMap; label: string; onPress?: () => void; right?: ReactNode }> }> = [
    { title: "Profile", rows: [{ icon: "user", label: "My account", onPress: onAccount }] },
    { title: "Preference", rows: [{ icon: "globe", label: "Language", onPress: () => onSupport("language") }, { icon: "bell", label: "Activities notification", right: <Switch accessibilityLabel="Activities notification" value={notify} onValueChange={value=>{setNotify(value);onChange({activities:value})}} trackColor={{ true: TEAL, false: "#E0E0E0" }} thumbColor="white" /> }, {icon:"send",label:"Promotion notification",right:<Switch accessibilityLabel="Promotion notification" value={promotions} onValueChange={value=>{setPromotions(value);onChange({promotions:value})}} trackColor={{true:TEAL,false:"#E0E0E0"}} thumbColor="white"/>}] },
    { title: "Privacy", rows: [{ icon: "lock", label: "Change password", onPress: () => onSupport("password") }, { icon: "file-text", label: "Terms & Conditions", onPress: () => onSupport("terms") }] },
    { title: "Assistance", rows: [{ icon: "help-circle", label: "Help centre", onPress: () => onSupport("contact") }, { icon: "phone", label: "Contact us", onPress: () => onSupport("contact") }, { icon: "flag", label: "Report", onPress: () => onSupport("contact") }] },
  ]
  return <Page title="Settings" onBack={onBack}>
    <View style={s.settingsHead}><Avatar uri={profile.avatar} size={100} onEdit={() => choosePhoto((avatar) => onChange({ avatar }))} /><Text style={s.name}>{profile.displayName || profile.fullName}</Text></View>
    {sections.map((section) => <View key={section.title} style={s.settingsSection}><Text style={s.sectionTitle}>{section.title}</Text>{section.rows.map((row) => <SettingsRow key={row.label} {...row} />)}</View>)}
    <Pressable accessibilityRole="button" hitSlop={8} style={s.deleteAccount} onPress={() => Alert.alert("Delete account", "To delete your coach account, please contact ClassZ support.", [{ text: "Cancel", style: "cancel" }, { text: "Contact us", onPress: () => onSupport("contact") }])}><Text style={s.deleteText}>Delete account</Text></Pressable>
    <Pressable accessibilityRole="button" style={[s.primary, s.logout]} onPress={() => Alert.alert("Log Out", "Are you sure you want to log out?", [{ text: "Cancel", style: "cancel" }, { text: "Log Out", style: "destructive", onPress: onSignOut }])}><Text style={s.primaryText}>Log Out</Text></Pressable>
  </Page>
}

function LabeledField({ label, value, onChangeText, keyboardType, maxLength, autoCapitalize, style }: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: KeyboardTypeOptions; maxLength?: number; autoCapitalize?: "none" | "characters" | "words"; style?: object }) {
  const [focused, setFocused] = useState(false)
  return <View style={[s.labeled, focused && s.labeledOn, style]}>
    <View style={s.flex}><Text style={s.countryLabel}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} keyboardType={keyboardType} maxLength={maxLength} autoCapitalize={autoCapitalize} style={s.labeledInput} /></View>
    {focused && !!value && <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${label}`} hitSlop={8} onPress={() => onChangeText("")}><Feather name="x-circle" size={16} color="#292929" /></Pressable>}
  </View>
}

function MyAccount({ token, profile, onBack, onSave }: { token?:string; profile: CoachProfile; onBack: () => void; onSave: (next: Partial<CoachProfile>) => void }) {
  const [form, setForm] = useState<AccountForm>({ fullName: profile.fullName, displayName: profile.displayName, country: profile.country, phone: profile.phone, email: profile.email, hkid: profile.hkid })
  const [avatar, setAvatar] = useState(profile.avatar)
  const [picker, setPicker] = useState(false)
  const [error, setError] = useState("")
  const set = (key: keyof AccountForm) => (v: string) => { setError(""); setForm((prev) => ({ ...prev, [key]: v })) }
  const [otp,setOtp]=useState("")
  const [verificationEmail,setVerificationEmail]=useState("")
  const [busy,setBusy]=useState(false)
  async function save() {
    const { value, problem } = normaliseAccount(form)
    if (problem) { setError(problem); return }
    setBusy(true)
    try {
      if(token&&value.email.toLowerCase()!==profile.email.toLowerCase()){
        if(verificationEmail!==value.email){await apiRequest("/user/send-verify-email",{token,method:"POST",body:{newEmail:value.email}});setVerificationEmail(value.email);setOtp("");return}
        if(!/^\d{6}$/.test(otp))throw new Error("Enter the six-digit code sent to your new email.")
        await apiRequest("/user/confirm-email",{token,method:"POST",body:{newEmail:value.email,otp}})
      }
      onSave({ ...value, avatar })
    }catch(e){setError(errorMessage(e))}finally{setBusy(false)}
  }
  return <Page title="My Account" onBack={onBack}>
    <View style={s.registerAvatar}><Avatar uri={avatar} size={100} onEdit={() => choosePhoto(setAvatar)} /></View>
    <LabeledField label="Full name" value={form.fullName} onChangeText={set("fullName")} autoCapitalize="words" />
    <LabeledField label="Display name" value={form.displayName} onChangeText={set("displayName")} autoCapitalize="words" />
    <View style={s.phoneRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Country code ${form.country}`} style={s.country} onPress={() => setPicker(true)}>
        <Text style={s.countryLabel}>Country</Text><View style={s.inline}><Text style={s.countryValue}>{form.country}</Text><Feather name="chevron-down" size={14} color="#555555" /></View>
      </Pressable>
      <LabeledField label="Phone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" maxLength={11} style={s.flex} />
    </View>
    <LabeledField label="Email address" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
    <LabeledField label="HK ID" value={form.hkid} onChangeText={set("hkid")} autoCapitalize="characters" maxLength={11} />
    {!!verificationEmail&&<LabeledField label="Email verification code" value={otp} onChangeText={v=>setOtp(v.replace(/\D/g,"").slice(0,6))} keyboardType="number-pad" maxLength={6}/>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Primary label={busy?"Saving…":verificationEmail?"Verify and save":"Save"} disabled={busy||!Object.values(form).every((v) => v.trim())} onPress={save} />
    <CountryPicker visible={picker} value={form.country} onClose={() => setPicker(false)} onPick={set("country")} />
  </Page>
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "white" }, flex: { flex: 1 }, fill: { width: "100%", height: "100%" }, inline: { flexDirection: "row", alignItems: "center", gap: 6 },
  header: { minHeight: 72, paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "white" },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" }, roundSpacer: { width: 40 },
  headerTitles: { flex: 1, alignItems: "center" }, headerTitle: { fontSize: FONT.headerTitle, color: "#292929", fontWeight: "500" }, headerSubtitle: { fontSize: FONT.secondary, color: "#555555", marginTop: 4 },
  homeTitle: { flex: 1, fontSize: FONT.title, color: "#292929", fontWeight: "600" },
  sheet: { flex: 1, backgroundColor: "white" }, content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 16 },
  footer: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EEEEEE", backgroundColor: "white" },
  input: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: "#E0E0E0", paddingHorizontal: 16, fontSize: FONT.body, color: "#292929" },
  primary: { minHeight: 52, borderRadius: 12, backgroundColor: "#222222", alignItems: "center", justifyContent: "center" }, primaryOff: { backgroundColor: "#BDBDBD" }, primaryText: { color: "white", fontSize: FONT.headline, fontWeight: "500" },
  error: { fontSize: FONT.caption, color: "#E16E65" }, notice: { fontSize: FONT.caption, color: "#555555", textAlign: "center" }, muted: { fontSize: FONT.micro, color: "#AAAAAA", lineHeight: 15 },
  avatar: { backgroundColor: "#F2F2F2", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  editBadge: { position: "absolute", right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: TEAL, borderWidth: 2, borderColor: "white", alignItems: "center", justifyContent: "center" },
  registerAvatar: { alignItems: "center", marginVertical: 12 },
  phoneRow: { flexDirection: "row", gap: 8 }, country: { width: 92, minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: "#E0E0E0", paddingHorizontal: 12, justifyContent: "center", gap: 2 },
  countryLabel: { fontSize: FONT.micro, color: "#AAAAAA" }, countryValue: { fontSize: FONT.body, color: "#292929" }, phoneInput: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 32 }, modal: { width: "100%", maxWidth: 300, backgroundColor: "white", borderRadius: 16, paddingVertical: 8 },
  modalRow: { minHeight: 48, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, modalText: { fontSize: FONT.body, color: "#292929" },
  card: { borderRadius: 14, backgroundColor: "white", borderWidth: 1, borderColor: "#F0F0F0", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  homeCard: { flexDirection: "row", padding: 16, gap: 16 }, homeIdentity: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 }, name: { fontSize: FONT.body, color: "#292929", fontWeight: "600" },
  stats: { flex: 1 }, stat: { paddingVertical: 8, gap: 2 }, statDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E0E0E0" }, statNumber: { fontSize: FONT.body, color: "#292929", fontWeight: "600" },
  cardArrow: { alignSelf: "flex-end", marginRight: 16, marginBottom: 12, marginTop: -8 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }, sectionTitle: { fontSize: FONT.bodyLg, color: "#292929", fontWeight: "600" },
  link: { fontSize: FONT.caption, color: "#292929", textDecorationLine: "underline" }, addText: { fontSize: FONT.caption, color: "#292929" },
  empty: { gap: 6, marginTop: -6 }, emptyTitle: { fontSize: FONT.body, color: "#292929", fontWeight: "500" },
  profileCard: { padding: 16, gap: 12 }, profileTop: { flexDirection: "row", gap: 14, alignItems: "center" }, profileCopy: { flex: 1, gap: 4 },
  bigNumber: { fontSize: FONT.heading, color: "#292929", fontWeight: "600" }, affiliation: { fontSize: FONT.micro, color: "#555555" }, bio: { fontSize: FONT.caption, color: "#555555", lineHeight: 19 },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: -6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: "#D7F4F3" }, chipText: { fontSize: FONT.caption, color: "#292929" },
  chipAdd: { width: 26, height: 26, alignItems: "center", justifyContent: "center" }, chipInput: { minWidth: 90, minHeight: 30, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: "#222222", fontSize: FONT.caption, color: "#292929" },
  listCard: { padding: 16, gap: 12 }, yearGroup: { gap: 10 }, year: { fontSize: FONT.body, color: "#292929", fontWeight: "600" },
  timeline: { marginLeft: 8, paddingLeft: 14, borderLeftWidth: 1.5, borderLeftColor: "#292929", gap: 14 },
  item: { flexDirection: "row", alignItems: "center", gap: 12 }, experienceItem: { paddingLeft: 22 }, itemCopy: { flex: 1, gap: 2 },
  itemTitle: { fontSize: FONT.caption, color: "#292929", fontWeight: "600" }, itemText: { fontSize: FONT.micro, color: "#555555", lineHeight: 15 },
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: -6 },
  formRow: { flexDirection: "row", gap: 12 },
  centreCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }, centreLogo: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: "#EEEEEE" }, centreName: { fontSize: FONT.body, color: "#292929", fontWeight: "600" },
  centreMeta: { fontSize: FONT.micro, color: "#555555" }, centreId: { fontSize: FONT.micro, color: "#AAAAAA" },
  centreActions: { alignItems: "flex-end", justifyContent: "space-between", alignSelf: "stretch", gap: 10 },
  rolePill: { fontSize: FONT.micro, color: "#292929", borderWidth: 1, borderColor: "#BDBDBD", borderRadius: 12, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 3 },
  centreActionButton: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, minHeight: 24, marginTop: "auto" }, actionText: { fontSize: FONT.micro, color: "#555555" }, connectText: { fontSize: FONT.micro, color: "#555555" },
  search: { minHeight: 52, borderRadius: 8, borderWidth: 1, borderColor: "#E0E0E0", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 }, searchInput: { flex: 1, fontSize: FONT.body, color: "#292929", paddingVertical: 10 },
  warning: { width: "100%", maxWidth: 305, backgroundColor: "white", borderRadius: 16, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 24, gap: 10, alignItems: "center" }, warningTitle: { fontSize: FONT.headline, color: "#292929", fontWeight: "600" },
  warningClose: { position: "absolute", top: 20, right: 20 }, warningCopy: { fontSize: FONT.headline, color: "#292929", textAlign: "center", lineHeight: 24 }, warningAsk: { fontSize: FONT.caption, color: "#999999", textAlign: "center", lineHeight: 18 },
  warningActions: { flexDirection: "row", gap: 8, marginTop: 10, alignSelf: "stretch" }, warningSecondary: { flex: 1, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: "#777777", alignItems: "center", justifyContent: "center" }, warningSecondaryText: { fontSize: FONT.body, color: "#555555" },
  warningPrimary: { flex: 1, minHeight: 44, borderRadius: 8, backgroundColor: "#222222", alignItems: "center", justifyContent: "center" }, warningPrimaryText: { fontSize: FONT.body, color: "white", fontWeight: "500" },
  settingsHead: { alignItems: "center", gap: 10, marginBottom: 4 }, settingsSection: { gap: 2 },
  settingsRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EEEEEE" }, settingsLabel: { flex: 1, fontSize: FONT.caption, color: "#292929" },
  deleteAccount: { alignSelf: "center", marginTop: 8 }, deleteText: { fontSize: FONT.caption, color: "#555555", textDecorationLine: "underline" }, logout: { alignSelf: "center", width: "60%" },
  labeled: { minHeight: 56, borderRadius: 12, borderWidth: 1, borderColor: "#E0E0E0", paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 }, labeledOn: { borderColor: "#292929" },
  labeledInput: { fontSize: FONT.body, color: "#292929", paddingVertical: 2 },
})
