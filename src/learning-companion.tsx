import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Feather from "@expo/vector-icons/Feather"
import { useAccountData } from "./account-data"

const TEAL = "#0AABA9"

const ANIMAL_ART: Record<string, number> = {
  rabbit: require("../assets/mobile/learning-companion/rabbit-telescope.png"),
  owl: require("../assets/mobile/learning-companion/owl-books.png"),
  dolphin: require("../assets/mobile/learning-companion/dolphin-wave.png"),
  turtle: require("../assets/mobile/learning-companion/turtle-steady.png"),
  fox: require("../assets/mobile/learning-companion/fox-generated.png"),
  bee: require("../assets/mobile/learning-companion/bee-generated.png"),
}

function narrativeLines(narrative: Record<string, unknown> | null | undefined): string[] {
  if (!narrative) return []
  const lines: string[] = []
  const walk = (value: unknown) => {
    if (typeof value === "string" && value.trim()) lines.push(value.trim())
    else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(walk)
  }
  walk(narrative)
  return lines.slice(0, 16)
}

export function LearningCompanionScreen({ navigation, childName }: { navigation: any; childName: string; animal?: string }) {
  const { learning } = useAccountData()
  const companion = learning?.companion
  const name = companion?.primary_companion?.trim() || ""
  const firstName = childName.split(" ")[0] || "Your child"
  const art = ANIMAL_ART[name.toLowerCase()]
  const lines = narrativeLines(companion?.narrative_json)
  const supporting = companion?.supporting_companions || []

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.back} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#777" />
        </Pressable>
        <Text style={styles.headerTitle}>Learning Companion</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!name ? (
          <Text style={styles.body}>
            {/* TODO(backend): GET /student/passport companion narrative is not on the temporary production host yet. */}
            {firstName}'s learning companion will appear after your centre publishes learning records.
          </Text>
        ) : (
          <>
            <Text style={styles.eyebrow}>Based on recent ClassZ learning records,</Text>
            <Text style={styles.heading}>{firstName}'s Learning Companion is {name}</Text>
            {art ? <Image source={art} resizeMode="contain" style={styles.heroArt} /> : null}
            {supporting.length ? (
              <Text style={styles.body}>Also reflected: {supporting.join(", ")}</Text>
            ) : null}
            {typeof companion?.records_used === "number" ? (
              <Text style={styles.body}>Records used: {companion.records_used}</Text>
            ) : null}
            {lines.length === 0 ? (
              <Text style={styles.body}>Your centre has named this companion. A written learning portrait has not been published yet.</Text>
            ) : lines.map((line) => (
              <Text key={line} style={styles.body}>{line}</Text>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { height: 58, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  back: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F0F0F1", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "500", color: "#222" },
  headerSpacer: { width: 32 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 42 },
  eyebrow: { fontSize: 12, color: "#777", marginTop: 8, marginBottom: 4 },
  heading: { fontSize: 21, lineHeight: 27, fontWeight: "600", color: "#222", marginTop: 8 },
  heroArt: { width: "100%", height: 220, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 21, color: "#54585B", marginBottom: 10, marginTop: 8 },
  action: { minHeight: 44, backgroundColor: TEAL, borderRadius: 4, alignItems: "center", justifyContent: "center", marginTop: 8 },
})
