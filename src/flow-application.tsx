import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import type { FigmaFlowItem } from "./figma-flow"

type Program = {
  id: string
  title: string
  category: string
  location: string
  price: number
  rating: number
}

type Centre = {
  id: string
  name: string
  detailName?: string
  categories: string[]
  location: string
  address: string
  priceFrom: number
  rating: number
  reviewCount: number
  supportsSen: boolean
  imageIndex: number
}

type Booking = {
  id: string
  programId: string
  title: string
  lessonCount: number
  dateRange: string
  total: number
}

type Student = {
  id: string
  name: string
  parent: string
  phone: string
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
    programs: [
      { id: "p1", title: "ClassZ Guitar Program", category: "Music", location: "Central", price: 299, rating: 4.91 },
      { id: "p2", title: "Junior STEM Explorer", category: "STEM", location: "Causeway Bay", price: 320, rating: 4.88 },
      { id: "p3", title: "Creative Art Lab", category: "Art", location: "Tsim Sha Tsui", price: 280, rating: 4.72 },
      { id: "p4", title: "Academic Focus Class", category: "Academic", location: "Mong Kok", price: 340, rating: 4.85 },
    ],
    centres: [
      { id: "c1", name: "ClassZ Playgroup Centre", detailName: "ClassZ Playgroup Bright Kids Drawing Centre", categories: ["Music"], location: "Causeway Bay", address: "Shop 18, Class Mall, Central, Hong Kong", priceFrom: 299, rating: 4.91, reviewCount: 50, supportsSen: true, imageIndex: 0 },
      { id: "c2", name: "Harmony Music Academy", categories: ["Music"], location: "Central", address: "28 Queen's Road Central, Hong Kong", priceFrom: 360, rating: 4.85, reviewCount: 38, supportsSen: false, imageIndex: 1 },
      { id: "c3", name: "ClassZ STEM Lab", categories: ["STEM"], location: "Causeway Bay", address: "88 Hennessy Road, Causeway Bay", priceFrom: 320, rating: 4.88, reviewCount: 44, supportsSen: true, imageIndex: 1 },
      { id: "c4", name: "ClassZ Art Studio", categories: ["Art"], location: "Tsim Sha Tsui", address: "18 Cameron Road, Tsim Sha Tsui", priceFrom: 280, rating: 4.72, reviewCount: 31, supportsSen: true, imageIndex: 0 },
      { id: "c5", name: "Active Kids Sports Centre", categories: ["Sports"], location: "Tai Po", address: "12 On Pong Road, Tai Po", priceFrom: 260, rating: 4.79, reviewCount: 27, supportsSen: false, imageIndex: 1 },
      { id: "c6", name: "Bright Path Learning Centre", categories: ["Academic"], location: "Mong Kok", address: "700 Nathan Road, Mong Kok", priceFrom: 340, rating: 4.85, reviewCount: 42, supportsSen: true, imageIndex: 0 },
      { id: "c7", name: "Creative Horizons Centre", categories: ["Others"], location: "Tsuen Wan", address: "8 Yeung Uk Road, Tsuen Wan", priceFrom: 250, rating: 4.68, reviewCount: 19, supportsSen: false, imageIndex: 1 },
    ],
    searchQuery: "",
    selectedCategory: null,
    selectedProgramId: "p1",
    selectedCentreId: "c1",
    couponCode: "",
    bookings: [],
    students: [
      { id: "s1", name: "Charlie Wong", parent: "Wong Ka Yan", phone: "91234567" },
      { id: "s4", name: "Joseph Wong", parent: "Wong Ka Yan", phone: "91234567" },
      { id: "s2", name: "Sophie Chan", parent: "Chan Yuki", phone: "93445566" },
      { id: "s3", name: "Leo Ng", parent: "Ng Ka Ho", phone: "95556677" },
    ],
    learningRecords: { s1: 2, s2: 1, s3: 0, s4: 0 },
    selectedStudentId: "s1",
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
  setState,
  onGoToFlowName,
}: {
  state: FlowAppState
  setState: React.Dispatch<React.SetStateAction<FlowAppState>>
  onGoToFlowName?: (name: string) => void
}) {
  const active = state.programs.find((p) => p.id === state.selectedProgramId) || state.programs[0]
  const lessonCount = 8
  const discount = state.couponCode.trim().toUpperCase() === "SAVE800" ? 800 : 0
  const total = active.price * lessonCount - discount + 5

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Reservation Feature</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{active.title}</Text>
        <Text style={styles.text}>{lessonCount} lessons · Oct 23 - Nov 28</Text>
      </View>
      <TextInput
        value={state.couponCode}
        onChangeText={(t) => setState((prev) => ({ ...prev, couponCode: t }))}
        placeholder="Coupon code (try SAVE800)"
        style={styles.input}
      />
      <View style={styles.card}>
        <Text style={styles.text}>Lesson fee: ${active.price * lessonCount}</Text>
        <Text style={styles.text}>Discount: -${discount}</Text>
        <Text style={styles.text}>Platform fee: $5</Text>
        <Text style={styles.cardTitle}>Total: ${total}</Text>
      </View>
      <Pressable
        style={styles.primary}
        onPress={() => {
          const booking: Booking = {
            id: `b${Date.now()}`,
            programId: active.id,
            title: active.title,
            lessonCount,
            dateRange: "Oct 23 - Nov 28",
            total,
          }
          setState((prev) => ({ ...prev, bookings: [booking, ...prev.bookings] }))
          onGoToFlowName?.("Schedule all")
        }}
      >
        <Text style={styles.primaryText}>Reserve & Go Schedule</Text>
      </Pressable>
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
  onGoToFlowName,
}: {
  state: FlowAppState
  setState: React.Dispatch<React.SetStateAction<FlowAppState>>
  onGoToFlowName?: (name: string) => void
}) {
  const selected = state.students.find((s) => s.id === state.selectedStudentId) || state.students[0]
  const recordCount = state.learningRecords[selected.id] || 0
  const canGenerate = recordCount >= 3

  function generateCompanionFor(studentId: string) {
    const animals: Companion[] = ["Rabbit", "Owl", "Dolphin", "Turtle", "Fox", "Bee"]
    const idx = (state.learningRecords[studentId] || 0) % animals.length
    const pick = animals[idx]
    setState((prev) => ({
      ...prev,
      generatedCompanions: { ...prev.generatedCompanions, [studentId]: pick },
    }))
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Learning Record Feature</Text>
      {state.students.map((s) => {
        const count = state.learningRecords[s.id] || 0
        return (
          <Pressable key={s.id} style={[styles.card, s.id === selected.id ? styles.cardActive : null]} onPress={() => setState((prev) => ({ ...prev, selectedStudentId: s.id }))}>
            <Text style={styles.cardTitle}>{s.name}</Text>
            <Text style={styles.text}>{s.parent} · {s.phone}</Text>
            <Text style={styles.text}>Records: {count}/3+</Text>
          </Pressable>
        )
      })}
      <Pressable
        style={styles.primary}
        onPress={() =>
          setState((prev) => ({
            ...prev,
            learningRecords: {
              ...prev.learningRecords,
              [selected.id]: (prev.learningRecords[selected.id] || 0) + 1,
            },
          }))
        }
      >
        <Text style={styles.primaryText}>Add 1 Learning Record</Text>
      </Pressable>
      <Pressable
        style={[styles.primary, !canGenerate ? styles.primaryDisabled : null]}
        disabled={!canGenerate}
        onPress={() => {
          generateCompanionFor(selected.id)
          onGoToFlowName?.("Learning Companion")
        }}
      >
        <Text style={styles.primaryText}>{canGenerate ? "Generate Learning Companion" : `Need ${3 - recordCount} more records`}</Text>
      </Pressable>
    </View>
  )
}

function CompanionFeature({
  state,
  setState,
}: {
  state: FlowAppState
  setState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const selected = state.students.find((s) => s.id === state.selectedStudentId) || state.students[0]
  const animal = state.generatedCompanions[selected.id] || "Rabbit"
  const allAnimals: Companion[] = ["Rabbit", "Owl", "Dolphin", "Turtle", "Fox", "Bee"]
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Learning Companion Feature</Text>
      <Text style={styles.text}>Student: {selected.name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {allAnimals.map((a) => (
            <Pressable
              key={a}
              style={[styles.chip, a === animal ? styles.chipActive : null]}
              onPress={() =>
                setState((prev) => ({
                  ...prev,
                  generatedCompanions: { ...prev.generatedCompanions, [selected.id]: a },
                }))
              }
            >
              <Text style={styles.chipText}>{a}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{animal} Companion</Text>
        <Text style={styles.text}>What may help · Why we think this · Supporting companion · Next steps</Text>
      </View>
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
