import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import type { FigmaFlowItem } from "./figma-flow"
import { FIGMA_ASSETS } from "./figma-asset-urls"

export type Program = {
  id: string
  centreId?: string
  programCode?: string
  title: string
  category: string
  location: string
  venue?: string
  price: number
  rating: number
  intro?: string
  instructor?: string
  language?: string
  ageTag?: string
  imageUrl?: string | null
  courseType?: string
}

export type CentreMember = {
  id: string
  name: string
  role: string
  photoUrl: string | null
}

export type Centre = {
  id: string
  name: string
  detailName?: string
  categories: string[]
  location: string
  address: string
  description?: string
  priceFrom: number
  rating: number
  reviewCount: number
  supportsSen: boolean
  imageIndex: number
  imageUrl?: string | null
  features?: string[]
  members?: CentreMember[]
}

type Booking = {
  id: string
  programId: string
  title: string
  lessonCount: number
  dateRange: string
  total: number
}

export type Student = {
  id: string
  name: string
  parent: string
  phone: string
  level: string
  years: number
  connected: boolean
  age: number | null
  sen: boolean
  image: string
  imageScale: number
  imageOffsetY: number
  dateOfBirth: string | null
  school: string
  medicalNotes: string
}

export const EMPTY_STUDENT: Student = {
  id: "",
  name: "No child yet",
  parent: "",
  phone: "",
  level: "Beginner",
  years: 0,
  connected: false,
  age: null,
  sen: false,
  image: FIGMA_ASSETS.reservation.child,
  imageScale: 1,
  imageOffsetY: 0,
  dateOfBirth: null,
  school: "",
  medicalNotes: "",
}

export function selectedStudentOf(state: Pick<FlowAppState, "students" | "selectedStudentId">, id?: string | null): Student {
  const wanted = id ?? state.selectedStudentId
  return state.students.find((s) => s.id === wanted) || state.students[0] || EMPTY_STUDENT
}

type Companion = "Rabbit" | "Owl" | "Dolphin" | "Turtle" | "Fox" | "Bee"

export type FlowAppState = {
  programs: Program[]
  centres: Centre[]
  searchQuery: string
  selectedCategory: string | null
  selectedProgramId: string | null
  selectedCentreId: string | null
  couponCode: string
  bookings: Booking[]
  students: Student[]
  learningRecords: Record<string, number>
  selectedStudentId: string
  generatedCompanions: Record<string, Companion>
}

export function createInitialFlowAppState(): FlowAppState {
  return {
    programs: [],
    centres: [],
    searchQuery: "",
    selectedCategory: null,
    selectedProgramId: "",
    selectedCentreId: "",
    couponCode: "",
    bookings: [],
    students: [],
    learningRecords: {},
    selectedStudentId: "",
    generatedCompanions: {},
  }
}

type Props = {
  item: FigmaFlowItem
  state: FlowAppState
  setState: React.Dispatch<React.SetStateAction<FlowAppState>>
  onGoToFlowName?: (name: string) => void
}

export function FlowApplicationSurface({ item, state, setState, onGoToFlowName }: Props) {
  const name = item.name.toLowerCase()

  if (name.includes("main")) return <MainFeature state={state} setState={setState} onGoToFlowName={onGoToFlowName} />
  if (name.includes("search")) return <SearchFeature state={state} setState={setState} onGoToFlowName={onGoToFlowName} />
  if (name.includes("reservation")) return <ReservationFeature state={state} setState={setState} onGoToFlowName={onGoToFlowName} />
  if (name.includes("schedule") || name.includes("calendar") || name.includes("attendance")) return <ScheduleFeature state={state} />
  if (name.includes("learning record") || name.includes("pending review") || name.includes("student list") || name.includes("academic") || name.includes("activity")) {
    return <LearningRecordFeature state={state} setState={setState} onGoToFlowName={onGoToFlowName} />
  }
  if (name.includes("learning companion") || name.includes("rabbit") || name.includes("owl") || name.includes("dolphin") || name.includes("turtle") || name.includes("fox") || name.includes("bee")) {
    return <CompanionFeature state={state} setState={setState} />
  }
  if (name.includes("profile")) return <ProfileFeature state={state} />
  if (name.includes("inbox") || name.includes("notification")) return <InboxFeature />
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Interactive Block</Text>
      <Text style={styles.text}>Functional implementation is available for core user flows. This screen is still mapped and reachable.</Text>
    </View>
  )
}

function MainFeature({
  state,
  setState,
  onGoToFlowName,
}: {
  state: FlowAppState
  setState: React.Dispatch<React.SetStateAction<FlowAppState>>
  onGoToFlowName?: (name: string) => void
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Main Application Feature</Text>
      {state.programs.slice(0, 3).map((p) => (
        <Pressable
          key={p.id}
          style={styles.card}
          onPress={() => {
            setState((prev) => ({ ...prev, selectedProgramId: p.id }))
            onGoToFlowName?.("Reservation")
          }}
        >
          <Text style={styles.cardTitle}>{p.title}</Text>
          <Text style={styles.text}>${p.price} lesson · {p.location} · ★{p.rating}</Text>
          <Text style={styles.link}>Tap to open Reservation flow</Text>
        </Pressable>
      ))}
    </View>
  )
}

function SearchFeature({
  state,
  setState,
  onGoToFlowName,
}: {
  state: FlowAppState
  setState: React.Dispatch<React.SetStateAction<FlowAppState>>
  onGoToFlowName?: (name: string) => void
}) {
  const categories = ["STEM", "Sports", "Academic", "Art", "Music", "Others"]
  const filtered = state.centres.filter((centre) => {
    const keyword = state.searchQuery.trim().toLowerCase()
    const categoryOk = !state.selectedCategory || centre.categories.includes(state.selectedCategory)
    const queryOk = !keyword
      || centre.name.toLowerCase().includes(keyword)
      || centre.location.toLowerCase().includes(keyword)
      || centre.categories.some((category) => category.toLowerCase().includes(keyword))
    return categoryOk && queryOk
  })

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Search Feature</Text>
      <TextInput
        value={state.searchQuery}
        onChangeText={(t) => setState((prev) => ({ ...prev, searchQuery: t }))}
        placeholder="What to learn?"
        style={styles.input}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {categories.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, state.selectedCategory === c ? styles.chipActive : null]}
              onPress={() => setState((prev) => ({ ...prev, selectedCategory: prev.selectedCategory === c ? null : c }))}
            >
              <Text style={styles.chipText}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {filtered.map((centre) => (
        <Pressable
          key={centre.id}
          style={styles.card}
          onPress={() => {
            setState((prev) => ({ ...prev, selectedCentreId: centre.id }))
          }}
        >
          <Text style={styles.cardTitle}>{centre.name}</Text>
          <Text style={styles.text}>{centre.categories.join(" · ")} · {centre.location}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function ReservationFeature({
  state,
}: {
  state: FlowAppState
  setState?: React.Dispatch<React.SetStateAction<FlowAppState>>
  onGoToFlowName?: (name: string) => void
}) {
  const active = state.programs.find((p) => p.id === state.selectedProgramId) || state.programs[0]
  if (!active) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Reservation Feature</Text>
        <Text style={styles.text}>Choose a published program before reserving.</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Reservation Feature</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{active.title}</Text>
        <Text style={styles.text}>${active.price} per lesson</Text>
      </View>
      <Text style={styles.text}>Checkout from the class screen. This preview does not place a booking.</Text>
    </View>
  )
}

function ScheduleFeature({ state }: { state: FlowAppState }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Schedule Feature</Text>
      {!state.bookings.length ? <Text style={styles.text}>No bookings yet. Reserve from Reservation flow first.</Text> : null}
      {state.bookings.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.cardTitle}>{b.title}</Text>
          <Text style={styles.text}>{b.lessonCount} lessons · {b.dateRange}</Text>
          <Text style={styles.text}>Total paid: ${b.total}</Text>
        </View>
      ))}
    </View>
  )
}

function LearningRecordFeature({
  state,
  setState,
}: {
  state: FlowAppState
  setState: React.Dispatch<React.SetStateAction<FlowAppState>>
  onGoToFlowName?: (name: string) => void
}) {
  const selected = selectedStudentOf(state)

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Learning Record Feature</Text>
      {state.students.length === 0 ? <Text style={styles.text}>Child profiles appear after the centre publishes them.</Text> : null}
      {state.students.map((s) => (
        <Pressable key={s.id} style={[styles.card, s.id === selected.id ? styles.cardActive : null]} onPress={() => setState((prev) => ({ ...prev, selectedStudentId: s.id }))}>
          <Text style={styles.cardTitle}>{s.name}</Text>
          <Text style={styles.text}>{s.parent}{s.phone ? ` · ${s.phone}` : ""}</Text>
        </Pressable>
      ))}
      <Text style={styles.text}>Learning records are published by the centre. This preview cannot add them.</Text>
    </View>
  )
}

function CompanionFeature({
  state,
}: {
  state: FlowAppState
  setState?: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const selected = selectedStudentOf(state)
  const animal = state.generatedCompanions[selected.id]
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Learning Companion Feature</Text>
      <Text style={styles.text}>Student: {selected.name}</Text>
      <Text style={styles.text}>{animal ? `${animal} companion` : "A learning companion appears after your centre publishes records."}</Text>
    </View>
  )
}

function ProfileFeature({ state }: { state: FlowAppState }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Profile Feature</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current selected child</Text>
        <Text style={styles.text}>{state.students.find((s) => s.id === state.selectedStudentId)?.name || "N/A"}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bookings made</Text>
        <Text style={styles.text}>{state.bookings.length}</Text>
      </View>
    </View>
  )
}

function InboxFeature() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Inbox Feature</Text>
      {["Class reminder", "Payment confirmed", "Centre announcement"].map((m) => (
        <View key={m} style={styles.card}>
          <Text style={styles.cardTitle}>{m}</Text>
          <Text style={styles.text}>Just now</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F8FAFC", gap: 8 },
  title: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  text: { fontSize: 12, color: "#475569" },
  card: { borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#fff", padding: 10, gap: 4 },
  cardActive: { borderColor: "#0ABAB5", backgroundColor: "#ECFEFF" },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  input: { borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  row: { flexDirection: "row", gap: 6 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { borderColor: "#0ABAB5", backgroundColor: "#E6FFFB" },
  chipText: { fontSize: 12, color: "#1F2937", fontWeight: "600" },
  primary: { borderRadius: 10, backgroundColor: "#0ABAB5", paddingVertical: 10, alignItems: "center" },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  link: { marginTop: 2, fontSize: 11, color: "#0B8A84", textDecorationLine: "underline" },
})
