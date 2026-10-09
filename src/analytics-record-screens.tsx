import { useState } from "react"
import Feather from "@expo/vector-icons/Feather"
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAccountData, type PassportLesson, type PassportMedia } from "./account-data"
import { assetUrl } from "./api"
import { FONT } from "./typography"

function formatRecordDate(raw?: string | null) {
  if (!raw) return ""
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function lessonsFor(kind: "academic" | "activity", lessons: PassportLesson[]) {
  return lessons.filter((lesson) => !lesson.kind || lesson.kind === kind)
}

function RecordHeader({ navigation, title }: { navigation: any; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={18} color="#858585" />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  )
}

function Meta({ icon, children }: { icon: keyof typeof Feather.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.metaRow}>
      <Feather name={icon} size={13} color="#6C7477" />
      <Text style={styles.metaText}>{children}</Text>
    </View>
  )
}

function RecordList({ navigation, title, lessons }: { navigation: any; title: string; lessons: PassportLesson[] }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <RecordHeader navigation={navigation} title={title} />
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {lessons.length === 0 ? (
          <Text style={styles.noteBody}>No records yet.</Text>
        ) : lessons.map((record) => (
          <Pressable
            key={record.id}
            accessibilityRole="button"
            style={styles.recordListCard}
            onPress={() => navigation.navigate("ProgramRecordApp", { programTitle: record.title })}
          >
            <View style={[styles.recordListImage, { backgroundColor: "#F3F4F6" }]} />
            <View style={styles.recordListCopy}>
              <Text style={styles.recordListTitle} numberOfLines={1}>{record.title}</Text>
              <Meta icon="file-text">{record.record_count ? `${record.record_count} records` : "Record"}</Meta>
              <Meta icon="map-pin">{record.center_name || record.location || "Centre"}</Meta>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export function AcademicRecordScreen({ navigation }: { navigation: any }) {
  const { learning } = useAccountData()
  return <RecordList navigation={navigation} title="Academic Record" lessons={lessonsFor("academic", learning?.lessons || [])} />
}

export function ActivityRecordScreen({ navigation }: { navigation: any }) {
  const { learning } = useAccountData()
  return <RecordList navigation={navigation} title="Activity Record" lessons={lessonsFor("activity", learning?.lessons || [])} />
}

export function ProgramRecordScreen({ navigation, route }: { navigation: any; route: { params: { programTitle: string } } }) {
  const { learning } = useAccountData()
  const title = route.params.programTitle
  const lesson = (learning?.lessons || []).find((item) => item.title === title)
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <RecordHeader navigation={navigation} title="Program Record" />
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>{title}</Text>
        {lesson?.record_count ? <Meta icon="file-text">{lesson.record_count} records</Meta> : null}
        <Meta icon="map-pin">{lesson?.center_name || lesson?.location || "Centre"}</Meta>
        {lesson?.instructor ? <Meta icon="user">{lesson.instructor}</Meta> : null}
        {lesson?.latest_at ? <Meta icon="calendar">{formatRecordDate(lesson.latest_at)}</Meta> : null}
        {/* TODO(backend): passport lessons do not include coach notes, progress charts, or per-lesson writeups. */}
        <Text style={styles.noteBody}>Coach notes for this program have not been published yet.</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

export function ClassRecordScreen({ navigation, route }: { navigation: any; route: { params: { programTitle: string; lesson: string } } }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <RecordHeader navigation={navigation} title="Class Record" />
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>{route.params.programTitle}</Text>
        <Meta icon="calendar">{route.params.lesson}</Meta>
        {/* TODO(backend): there is no per-lesson observation endpoint for parents yet. */}
        <Text style={styles.noteBody}>A lesson-by-lesson writeup is not available yet.</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function MediaList({ navigation, title, items }: { navigation: any; title: string; items: PassportMedia[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const current = selected !== null ? items[selected] : null
  const imageOf = (item: PassportMedia) => assetUrl(item.image)
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <RecordHeader navigation={navigation} title={title} />
      <ScrollView contentContainerStyle={styles.samplesContent} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? <Text style={styles.noteBody}>Nothing has been published yet.</Text> : items.map((item, index) => {
          const image = imageOf(item)
          return (
            <Pressable key={String(item.id)} accessibilityRole="button" accessibilityLabel={`View ${item.title}`} style={styles.sampleItem} onPress={() => image && setSelected(index)}>
              {image ? <Image source={{ uri: image }} style={styles.sampleImage} resizeMode="cover" /> : <View style={[styles.sampleImage, { backgroundColor: "#F3F4F6" }]} />}
              <Text style={styles.sampleTitle}>{item.title}</Text>
              <View style={styles.sampleMeta}>
                {item.date ? <Text style={styles.sampleDate}>{formatRecordDate(item.date)}</Text> : null}
                {item.centre ? <Text style={styles.sampleCentreName} numberOfLines={1}>{item.centre}</Text> : null}
              </View>
            </Pressable>
          )
        })}
      </ScrollView>
      <Modal visible={current != null && Boolean(imageOf(current))} animationType="fade" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.previewOverlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.previewClose} onPress={() => setSelected(null)}><Feather name="x" size={22} color="#222222" /></Pressable>
          {current && imageOf(current) ? <Image source={{ uri: imageOf(current) || "" }} style={styles.fullSample} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export function MomentsScreen({ navigation }: { navigation: any }) {
  const { learning } = useAccountData()
  return <MediaList navigation={navigation} title="Moments" items={learning?.moments || []} />
}

export function WorkSamplesScreen({ navigation }: { navigation: any }) {
  const { learning } = useAccountData()
  return <MediaList navigation={navigation} title="Work Samples" items={learning?.workSamples || []} />
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { width: "100%", maxWidth: 520, alignSelf: "center", height: 62, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: FONT.headerTitle, fontWeight: "500", color: "#222222", textAlign: "center" },
  headerSpacer: { width: 38 },
  listContent: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  dateGroup: { gap: 12 },
  dateHeading: { fontSize: FONT.heading, fontWeight: "700", color: "#222222", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E6E6E6", paddingBottom: 7 },
  recordListCard: { minHeight: 112, padding: 12, borderRadius: 8, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000000", shadowOpacity: 0.11, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4 },
  recordListImage: { width: 88, height: 88, borderRadius: 7 },
  recordListCopy: { flex: 1, gap: 7, minWidth: 0 },
  recordListTitle: { fontSize: FONT.headline, fontWeight: "600", color: "#222222" },
  recordListMetaLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  patternBadge: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 2, fontSize: FONT.micro, color: "#555555", overflow: "hidden" },
  warmBadge: { backgroundColor: "#FFF7DF" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 },
  metaText: { fontSize: FONT.caption, color: "#5E5E5E", flexShrink: 1 },
  detailContent: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  heroImage: { width: "100%", maxWidth: 343, aspectRatio: 343 / 213, alignSelf: "center", borderRadius: 9 },
  heroTitle: { fontSize: FONT.heading, fontWeight: "700", color: "#222222", textAlign: "center", marginTop: 4 },
  programMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hostLabel: { marginTop: 10, fontSize: FONT.body, fontWeight: "700", color: "#222222" },
  hostRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10 },
  hostAvatar: { width: 46, height: 46, borderRadius: 23 },
  hostAvatarSmall: { width: 42, height: 42, borderRadius: 21 },
  hostCopy: { flex: 1, minWidth: 0 },
  hostName: { fontSize: FONT.body, fontWeight: "600", color: "#222222" },
  hostRole: { marginTop: 3, fontSize: FONT.caption, color: "#777777" },
  hostRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  hostRatingText: { fontSize: FONT.caption, color: "#222222" },
  chartWrap: { minHeight: 220, paddingTop: 15, position: "relative", justifyContent: "center" },
  chartAxis: { position: "absolute", left: 0, top: 85, fontSize: FONT.micro, color: "#667078", transform: [{ rotate: "-90deg" }] },
  chartBottomAxis: { alignSelf: "center", marginTop: -9, fontSize: FONT.micro, color: "#667078" },
  sectionCard: { padding: 16, borderRadius: 8, backgroundColor: "#FFFFFF", shadowColor: "#000000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 9, elevation: 3 },
  noteCardHeading: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  noteArt: { width: 42, height: 42 },
  sectionTitle: { fontSize: FONT.headline, fontWeight: "600", color: "#222222" },
  noteBlock: { paddingVertical: 15, gap: 7 },
  noteDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E2E2" },
  noteTitle: { fontSize: FONT.body, fontWeight: "600", color: "#222222" },
  noteBody: { fontSize: FONT.caption, lineHeight: 18, color: "#333333" },
  sectionHeading: { marginTop: 8, fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  recentCard: { padding: 14, borderRadius: 8, backgroundColor: "#FFFFFF", shadowColor: "#000000", shadowOpacity: 0.09, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3, gap: 7 },
  recentTitle: { fontSize: FONT.body, fontWeight: "600", color: "#222222" },
  recentMeta: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 6 },
  recentCoach: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 5 },
  recentCoachAvatar: { width: 22, height: 22, borderRadius: 11 },
  recentCoachName: { fontSize: FONT.micro, color: "#333333" },
  classMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  focusCard: { marginTop: 12 },
  focusTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  focusBody: { marginTop: 7, fontSize: FONT.caption, color: "#555555" },
  samplePreview: { width: "100%", height: 210, borderRadius: 8 },
  samplesContent: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 16, paddingBottom: 28, gap: 14 },
  sampleItem: { gap: 6 },
  sampleImage: { width: "100%", height: 210, borderRadius: 8 },
  sampleTitle: { fontSize: FONT.headline, fontWeight: "600", color: "#222222" },
  sampleMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  sampleDate: { fontSize: FONT.caption, color: "#6A6A6A" },
  sampleCentreLogo: { width: 18, height: 18, borderRadius: 9, marginLeft: 8 },
  sampleCentreName: { flex: 1, fontSize: FONT.micro, color: "#222222" },
  previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", padding: 12 },
  previewClose: { position: "absolute", top: 45, right: 20, zIndex: 1, width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  fullSample: { width: "100%", height: "80%" },
})
