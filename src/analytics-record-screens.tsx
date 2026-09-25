import { useState } from "react"
import Feather from "@expo/vector-icons/Feather"
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Path, Svg, SvgXml, Text as SvgText } from "react-native-svg"
import { ANALYTICS_NOTE_SVGS } from "./analytics-svgs"
import { FIGMA_ASSETS } from "./figma-asset-urls"
import { FONT } from "./typography"

const GUITAR_IMAGE = { uri: FIGMA_ASSETS.reservation.program }
const CENTRE_IMAGE = { uri: FIGMA_ASSETS.reservation.host }
const COACH_IMAGE = { uri: FIGMA_ASSETS.reservation.coach }
const WORK_SAMPLE_IMAGE = require("../assets/figma/analytics/work-sample.png")

const ACADEMIC_GROUPS = [
  {
    date: "12 May, 26",
    records: [
      { title: "S3 Maths Class", count: 3, badge: "Early observations", badgeColor: "#E8F7F7" },
      { title: "S3 Chinese Class", count: 14, badge: "Consistent pattern", badgeColor: "#FFF7DF" },
    ],
  },
  {
    date: "03 May, 26",
    records: [
      { title: "English Spelling Class", count: 4, badge: "Emerging pattern", badgeColor: "#FFF0ED" },
      { title: "History Class", count: 2, badge: "Early observations", badgeColor: "#E8F7F7" },
    ],
  },
  { date: "02 May, 26", records: [] },
] as const

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

function Host({ coach = false, compact = false }: { coach?: boolean; compact?: boolean }) {
  return (
    <View style={styles.hostRow}>
      <Image source={coach ? COACH_IMAGE : CENTRE_IMAGE} style={compact ? styles.hostAvatarSmall : styles.hostAvatar} resizeMode="cover" />
      <View style={styles.hostCopy}>
        <Text style={styles.hostName} numberOfLines={2}>{coach ? "Athena Yeung" : "ClassZ Playgroup Bright Kids Drawing Centre"}</Text>
        {coach ? <Text style={styles.hostRole}>Program Coach</Text> : null}
      </View>
      {!coach ? (
        <View style={styles.hostRating}>
          <Feather name="star" size={14} color="#222222" />
          <Text style={styles.hostRatingText}>4.91</Text>
        </View>
      ) : null}
    </View>
  )
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.sectionCard, style]}>{children}</View>
}

function NoteBlock({ title, body, last = false }: { title: string; body: string; last?: boolean }) {
  return (
    <View style={[styles.noteBlock, !last ? styles.noteDivider : null]}>
      {title ? <Text style={styles.noteTitle}>{title}</Text> : null}
      <Text style={styles.noteBody}>{body}</Text>
    </View>
  )
}

function ProgressChart() {
  return (
    <View style={styles.chartWrap}>
      <Text style={styles.chartAxis}>Progress</Text>
      <Svg width="100%" height={210} viewBox="0 0 330 210" accessibilityLabel="Progress rises from lesson one to lesson six">
        {[20, 60, 100, 140, 180].map((y) => <Path key={`h${y}`} d={`M32 ${y}H320`} stroke="#E7ECF0" strokeWidth="1" />)}
        {[32, 80, 128, 176, 224, 272, 320].map((x) => <Path key={`v${x}`} d={`M${x} 20V180`} stroke="#E7ECF0" strokeWidth="1" />)}
        <Path d="M32 180 L80 140 L128 140 L176 90 L224 90 L272 140 L320 20 L320 180 Z" fill="#78DDF2" opacity="0.88" />
        {["0", "1", "2", "3", "4", "5", "6"].map((label, index) => <SvgText key={label} x={32 + index * 48} y="199" fill="#667078" fontSize="10" textAnchor="middle">{label}</SvgText>)}
      </Svg>
      <Text style={styles.chartBottomAxis}>Lesson</Text>
    </View>
  )
}

export function AcademicRecordScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <RecordHeader navigation={navigation} title="Academic Record" />
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {ACADEMIC_GROUPS.map((group) => (
          <View key={group.date} style={styles.dateGroup}>
            <Text style={styles.dateHeading}>{group.date}</Text>
            {group.records.map((record) => (
              <Pressable
                key={record.title}
                accessibilityRole="button"
                style={styles.recordListCard}
                onPress={() => navigation.navigate("ProgramRecordApp", { programTitle: record.title })}
              >
                <Image source={GUITAR_IMAGE} style={styles.recordListImage} resizeMode="cover" />
                <View style={styles.recordListCopy}>
                  <Text style={styles.recordListTitle} numberOfLines={1}>{record.title}</Text>
                  <View style={styles.recordListMetaLine}>
                    <Meta icon="file-text">{record.count} Records</Meta>
                    <Text style={[styles.patternBadge, { backgroundColor: record.badgeColor }]}>{record.badge}</Text>
                  </View>
                  <Meta icon="map-pin">Bright Kids Playgroup Centre</Meta>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export function ProgramRecordScreen({ navigation, route }: { navigation: any; route: { params: { programTitle: string } } }) {
  const title = route.params.programTitle
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <RecordHeader navigation={navigation} title="Program Record" />
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <Image source={GUITAR_IMAGE} style={styles.heroImage} resizeMode="cover" />
        <Text style={styles.heroTitle}>{title}</Text>
        <View style={styles.programMeta}>
          <Meta icon="file-text">2 Records</Meta>
          <Text style={[styles.patternBadge, styles.warmBadge]}>Consistent pattern</Text>
        </View>
        <Meta icon="map-pin">Bright Kids Playgroup Centre</Meta>
        <Text style={styles.hostLabel}>Hosted by</Text>
        <Host />
        <ProgressChart />

        <SectionCard>
          <View style={styles.noteCardHeading}><Text style={styles.sectionTitle}>Current Progress</Text><SvgXml xml={ANALYTICS_NOTE_SVGS.progress} width={42} height={42} /></View>
          <NoteBlock title="" body="Charlie is becoming more confident with basic rhythm patterns and can complete familiar exercises with increasing independence. He still benefits from guidance when moving into more difficult chord transitions." />
          <NoteBlock title="Repeated Strength" body="Persistence\nCharlie has repeatedly continued practising after finding a section difficult and is increasingly willing to try again before giving up." />
          <NoteBlock title="Repeated Support Need" body="Rhythm during chord changes\nAcross recent lessons, Charlie has needed guidance to keep a steady rhythm when moving between less familiar chords." last />
        </SectionCard>

        <SectionCard>
          <View style={styles.noteCardHeading}><Text style={styles.sectionTitle}>What Seems to Help</Text><SvgXml xml={ANALYTICS_NOTE_SVGS.help} width={42} height={42} /></View>
          <NoteBlock title="Short verbal prompts" body="Brief verbal prompts have helped Charlie refocus on the rhythm and continue practising without needing the whole exercise demonstrated again." />
          <NoteBlock title="Current Focus" body="Maintaining rhythm through chord transitions\nThe current focus is helping Charlie change between chords smoothly while keeping a steady beat." last />
        </SectionCard>

        <Text style={styles.sectionHeading}>Recent Records</Text>
        {["8th lesson", "7th lesson", "6th lesson"].map((lesson) => (
          <Pressable key={lesson} accessibilityRole="button" style={styles.recentCard} onPress={() => navigation.navigate("ClassRecordApp", { programTitle: title, lesson })}>
            <Text style={styles.recentTitle}>Guitar Program</Text>
            <View style={styles.recentMeta}>
              <Meta icon="calendar">{lesson}</Meta>
              <Meta icon="calendar">12 May (Fri)</Meta>
              <Meta icon="clock">4:00PM–5:00PM</Meta>
              <Meta icon="map-pin">Bright Kids Playgroup Centre</Meta>
            </View>
            <View style={styles.recentCoach}><Image source={COACH_IMAGE} style={styles.recentCoachAvatar} /><Text style={styles.recentCoachName}>by Athena Yeung</Text></View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export function ClassRecordScreen({ navigation, route }: { navigation: any; route: { params: { programTitle: string; lesson: string } } }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <RecordHeader navigation={navigation} title="Class Record" />
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <Image source={GUITAR_IMAGE} style={styles.heroImage} resizeMode="cover" />
        <Text style={styles.heroTitle}>{route.params.programTitle}</Text>
        <Meta icon="calendar">{route.params.lesson}</Meta>
        <View style={styles.classMetaRow}><Meta icon="calendar">12 May (Fri)</Meta><Meta icon="clock">4:00PM–5:00PM</Meta></View>
        <Meta icon="map-pin">Bright Kids Playgroup Centre</Meta>

        <Text style={styles.sectionHeading}>Feedback by</Text>
        <Host compact />
        <Host coach compact />

        <SectionCard style={styles.focusCard}>
          <View style={styles.focusTop}><Text style={styles.sectionTitle}>Today’s Focus</Text><Text style={[styles.patternBadge, styles.warmBadge]}>Developing</Text></View>
          <Text style={styles.focusBody}>Rhythm practice and chord transitions</Text>
        </SectionCard>

        <SectionCard>
          <View style={styles.noteCardHeading}><Text style={styles.sectionTitle}>What We Observed</Text><SvgXml xml={ANALYTICS_NOTE_SVGS.observed} width={42} height={42} /></View>
          <NoteBlock title="" body="During rhythm practice, Charlie paused when changing between chords and needed some guidance to keep the beat. After one verbal prompt, he was able to continue the exercise." />
          <NoteBlock title="Support Need Today" body="Charlie needed some guidance to maintain the rhythm while moving between unfamiliar chord changes." />
          <NoteBlock title="What Helped" body="A short verbal prompt helped Charlie continue the exercise." />
          <NoteBlock title="Next Step" body="Continue practising the chord changes slowly before increasing the tempo." last />
        </SectionCard>

        <SectionCard>
          <View style={styles.noteCardHeading}><Text style={styles.sectionTitle}>Coach’s Note</Text><SvgXml xml={ANALYTICS_NOTE_SVGS.coachNote} width={42} height={42} /></View>
          <Text style={styles.noteBody}>Keep it up! Charlie is doing exceptional. Great work! Would suggest Charlie to read more Chinese books in leisure time.</Text>
        </SectionCard>

        <Text style={styles.sectionHeading}>Work Sample</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Work Samples" onPress={() => navigation.navigate("WorkSamplesApp")}>
          <Image source={WORK_SAMPLE_IMAGE} style={styles.samplePreview} resizeMode="cover" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

export function WorkSamplesScreen({ navigation }: { navigation: any }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <RecordHeader navigation={navigation} title="Work Samples" />
      <ScrollView contentContainerStyle={styles.samplesContent} showsVerticalScrollIndicator={false}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Pressable key={index} accessibilityRole="button" accessibilityLabel={`View S3 Chinese Class work sample ${index + 1}`} style={styles.sampleItem} onPress={() => setPreviewOpen(true)}>
            <Image source={WORK_SAMPLE_IMAGE} style={styles.sampleImage} resizeMode="cover" />
            <Text style={styles.sampleTitle}>S3 Chinese Class</Text>
            <View style={styles.sampleMeta}><Text style={styles.sampleDate}>12 Apr 2026</Text><Image source={CENTRE_IMAGE} style={styles.sampleCentreLogo} /><Text style={styles.sampleCentreName} numberOfLines={1}>ClassZ Playgroup Bright Kids Drawing Centre</Text></View>
          </Pressable>
        ))}
      </ScrollView>
      <Modal visible={previewOpen} animationType="fade" transparent onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.previewOverlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close work sample" style={styles.previewClose} onPress={() => setPreviewOpen(false)}><Feather name="x" size={22} color="#222222" /></Pressable>
          <Image source={WORK_SAMPLE_IMAGE} style={styles.fullSample} resizeMode="contain" />
        </View>
      </Modal>
    </SafeAreaView>
  )
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
  heroImage: { width: "100%", aspectRatio: 1.64, borderRadius: 9 },
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
