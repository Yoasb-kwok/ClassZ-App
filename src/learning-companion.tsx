import { useRef, useState } from "react"
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Feather from "@expo/vector-icons/Feather"

const TEAL = "#0AABA9"
const telescope = require("../assets/mobile/learning-companion/rabbit-telescope.png")
const reading = require("../assets/mobile/learning-companion/rabbit-reading.png")

type Section = { title: string; paragraphs?: string[]; bullets?: string[]; art?: "telescope" | "reading" }

function CompanionArt({ pose, large = false }: { pose: "telescope" | "reading"; large?: boolean }) {
  return <Image source={pose === "telescope" ? telescope : reading} resizeMode="contain" style={large ? styles.heroArt : styles.smallArt} />
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.art ? <CompanionArt pose={section.art} /> : null}
      {section.paragraphs?.map((paragraph, index) => <Text key={index} style={styles.body}>{paragraph}</Text>)}
      {section.bullets?.map((bullet, index) => <Text key={index} style={styles.bullet}>{"•  "}{bullet}</Text>)}
    </View>
  )
}

export function LearningCompanionScreen({ navigation, childName }: { navigation: any; childName: string }) {
  const [page, setPage] = useState(0)
  const scroll = useRef<ScrollView>(null)
  const firstName = childName.split(" ")[0] || "Your child"
  const next = (index: number) => {
    setPage(index)
    scroll.current?.scrollTo({ y: 0, animated: false })
  }
  const back = () => page ? next(page - 1) : navigation.goBack()

  const pages: Array<{ eyebrow?: string; heading: string; hero: "telescope" | "reading"; sections: Section[]; action: string }> = [
    {
      eyebrow: "Based on recent ClassZ learning records,",
      heading: `${firstName}'s Learning Companion is...`, hero: "telescope",
      sections: [
        { title: "Rabbit", paragraphs: ["Active Explorer", `Across recent ClassZ records, ${firstName} has often shown willing curiosity, active learning and flexible thinking.`] },
        { title: "What this means", paragraphs: [`Your child may learn best through trying, exploring, asking, and actively taking part. They may enjoy hands-on activities, new challenges, and opportunities to test ideas.`, "They may also progress when they are given chances to participate, make attempts, and learn through experience."] },
        { title: "Often observed as", bullets: ["Participating actively", "Trying independently", "Showing initiative", "Asking questions"], art: "reading" },
        { title: "What may help them learn?", bullets: ["Give them chances to try before over-explaining.", "Encourage questions and curiosity.", "Offer small challenges that invite exploration.", "Help them reflect after trying, not only focus on the outcome."], paragraphs: ["This is grounded in the idea that children learn actively through interaction, exploration, and guided experience."] },
        { title: "Parent reminder", paragraphs: ["Learning Companion is not a diagnosis or personality label. It is a ClassZ learning style snapshot based on recent records. As your child learns, this may change and become more flexible."] },
      ], action: `See ${firstName}'s Learning Insights`,
    },
    {
      heading: `Understanding ${firstName}'s Learning`, hero: "reading",
      sections: [
        { title: `${firstName}'s Current Learning Portrait`, paragraphs: [`${firstName} currently appears most engaged when able to participate directly, ask questions and explore how an activity works. This active Rabbit pattern is the clearest theme across the recent records.`, `At the same time, ${firstName} does not approach every situation in exactly the same way. When an activity is unfamiliar or less clearly structured, a gentle pause before joining may appear. Real ClassZ learning moments help us understand what is repeated, what is occasional, and where more support may help.`] },
        { title: "How Alex Approaches Something New?", art: "telescope", paragraphs: ["Alex often approaches new activities with curiosity and a desire to understand what can be tried. Asking questions alongside trying can help Alex build confidence and become fully involved.", "In less familiar situations, Alex may initially pause or look for reassurance. A short explanation or demonstration may help Alex move from careful observation to more active participation and expression."] },
        { title: "How Alex Responds to Challenge?", paragraphs: ["When Alex understands the purpose of the activity, recent records suggest a willingness to attempt different approaches rather than immediately giving up.", "However, unfamiliar or complicated tasks may sometimes require encouragement at the beginning. Breaking the first step down clearly may help Alex feel secure enough to begin."] },
      ], action: `How ${firstName} Learns Best`,
    },
    {
      heading: `How ${firstName} Learns Best`, hero: "telescope",
      sections: [
        { title: "How Alex Learns with Other People", paragraphs: ["Recent records suggest that Alex can contribute ideas and engage actively when there is a clear opportunity to participate.", "There is currently less repeated evidence about how Alex responds during sustained group collaboration. ClassZ will continue observing whether Alex prefers exchanging ideas with others, working independently first, or moving between both as the task changes."] },
        { title: "How Alex Responds to Guidance and Feedback", art: "reading", paragraphs: ["Alex appears to benefit most from guidance that gives direction without removing the opportunity to explore.", "Rather than providing the full solution immediately, adults may encourage better engagement by clarifying the goal, offering one starting point, and then allowing Alex to test an idea. When correction is needed, asking Alex what could be changed may support both reflection and independence."] },
        { title: "Conditions That Bring Out Alex's Best", paragraphs: ["Alex's strongest engagement may be most likely when:"], bullets: ["The activity has a clear goal", "There is something practical to try", "Questions are welcomed", "Alex has some choice in how to approach the task", "Guidance is available without becoming overly controlling", "There is time to slow down and organise ideas when necessary"] },
      ], action: "Supporting Alex Beyond the Classroom",
    },
    {
      heading: `Supporting ${firstName} Beyond the Classroom`, hero: "reading",
      sections: [
        { title: "What Parents May Notice at Home", paragraphs: ["At home, Alex may be more interested in activities that involve making, testing, constructing, experimenting or discovering how something works.", "Alex may ask several questions before or during an activity. In some situations, Alex may begin immediately; in others, especially unfamiliar tasks, Alex may want confirmation before starting." , "Parents may also notice that Alex's approach changes with confidence level and interest. An invitation to try followed by gentle independence may be especially supportive."] },
        { title: "Personalised Strategies", art: "telescope", bullets: ["Give Alex a clear starting point, but avoid explaining every step in advance.", "Invite Alex to predict what they hope to find.", "When Alex hesitates, reduce the first step rather than completing the task for them.", "Ask, ‘What else could you try?’ after the first method does not work.", "Encourage Alex to explain what was learned after experimenting.", "Allow time for checking and organising ideas before moving on.", "Praise the process of trying, questioning and adjusting, not only the correct result."] },
      ], action: "Looking Ahead",
    },
    {
      heading: "Looking Ahead", hero: "telescope",
      sections: [
        { title: "What ClassZ Will Continue Observing?", paragraphs: ["Alex's strongest engagement may be most likely when:"], bullets: ["The activity has a clear goal", "There is something practical to try", "Questions are welcomed", "Alex has some choice in how to approach the task", "Guidance is available without becoming overly controlling", "There is time to slow down and organise ideas when necessary"] },
        { title: "Evidence and Confidence", paragraphs: ["This interpretation is based on recent ClassZ learning records.", "The Rabbit Active Explorer pattern received the strongest overall support and is therefore shown as Alex's primary Learning Companion.", "Turtle Steady Builder and Fox Creative Planner show some related supporting patterns because recent observations suggest moments of thoughtful attention and careful planning. These patterns may become more visible as more records are added.", "This remains a learning support view rather than a fixed conclusion. Future records can strengthen, refine or change a learning companion interpretation."] },
      ], action: "Back to ZPassport",
    },
    {
      eyebrow: "Based on recent ClassZ learning records,",
      heading: `${firstName}'s Learning Companion is...`, hero: "telescope",
      sections: [
        { title: "Rabbit", paragraphs: ["Active Explorer", "The Active Explorer expresses a learning approach connected with active participation, initiative and willingness to try things independently. It also reflects curiosity shown through asking questions and taking an active role in learning."] },
        { title: "Also reflected in their learning...", paragraphs: ["Learning Companions are not fixed personalities or single learning styles. They are a little part of a wider, growing picture."] },
        { title: "Turtle — Steady Builder", paragraphs: ["Represents a steady, careful approach that may benefit from time for encouragement when starting."] },
        { title: "Owl — Thoughtful Learner", paragraphs: ["Represents a careful, reflective approach to feedback, questions and checking work."] },
        { title: "Parent reminder", paragraphs: ["How a child approaches learning may vary depending on the task, how familiar it feels and the environment. These insights reflect patterns ClassZ has observed rather than a fixed description of who the child is."] },
      ], action: "More Analytical Insight",
    },
    {
      heading: "Understanding Your Child's Learning", hero: "reading",
      sections: [
        { title: "Your Child at a Glance", paragraphs: ["Often shows a natural balance of active participation and careful focus in school activities. In one sense, the many focused on tasks that wait for a little while can be a strong foundation, and can help when a familiar activity becomes challenging." ] },
        { title: "How Alex Approaches Something New?", art: "reading", paragraphs: ["Often approaches learning with a blend of independent effort and careful attention to detail. Alex may take familiar tasks on quickly and show a strong focus, and be more careful in situations that need support."] },
        { title: "How They Respond Along the Way", art: "telescope", paragraphs: ["When tasks become more challenging or unfamiliar, often sometimes needs extra reassurance or multiple rounds of prompting to keep going. However, the curiosity they need to stay engaged appears in quiet moments, demonstrating the first step helped them immediately adjust and continue."] },
      ], action: "Supporting Their Learning",
    },
    {
      heading: "Supporting Their Learning", hero: "telescope",
      sections: [
        { title: "How You Can Support Them", paragraphs: ["To help them build confidence when facing new challenges, you can support by breaking down familiar steps into smaller parts. Giving enough room to try while providing clear support when needed can help improve learning interest."], bullets: ["Demonstrate the first step when introducing a new activity.", "Give them some quiet thinking time before stepping in.", "Start with familiar parts first to build momentum before moving to newer steps."] },
        { title: "Why This Companion Fits", art: "telescope", paragraphs: ["The Rabbit Active Explorer companion fits them because the repeated observations reflect trying, exploration and ideas in tasks independently. It also shows a strong desire to explore tasks on their own, especially when the first familiar step feels clear."] },
        { title: "Also Reflected in Their Learning", paragraphs: ["Their activity can also reflect an interest in planning and building confidence through time. As more records become available, this insight will keep learning how to support them best."] },
        { title: "Turtle — Steady Builder", paragraphs: ["Represents a steady, careful approach that may benefit from time for encouragement when starting."] },
        { title: "Owl — Thoughtful Learner", paragraphs: ["Represents a careful, reflective approach to feedback, questions and checking work."] },
      ], action: "Back to home",
    },
  ]

  const current = pages[page]
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.back} onPress={back}>
          <Feather name="arrow-left" size={20} color="#777" />
        </Pressable>
        <Text style={styles.headerTitle}>Learning Companion</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {current.eyebrow ? <Text style={styles.eyebrow}>{current.eyebrow}</Text> : null}
        <Text style={styles.heading}>{current.heading}</Text>
        <CompanionArt pose={current.hero} large />
        {current.sections.map((section, index) => (
          <SectionBlock
            key={`${page}-${index}`}
            section={{
              ...section,
              title: section.title.replace(/\bAlex\b/g, firstName),
              paragraphs: section.paragraphs?.map((text) => text.replace(/\bAlex\b/g, firstName)),
              bullets: section.bullets?.map((text) => text.replace(/\bAlex\b/g, firstName)),
            }}
          />
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel={current.action} style={styles.action} onPress={() => page === 4 || page === 7 ? navigation.navigate("AppTabs", { screen: "Analytics" }) : next(page + 1)}>
          <Text style={styles.actionText}>{current.action}  →</Text>
        </Pressable>
        {page !== 4 && page !== 7 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Learn how it works" style={styles.secondary} onPress={() => next(5)}>
            <Text style={styles.secondaryText}>Learn how it works →</Text>
          </Pressable>
        ) : null}
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
  heroArt: { width: "100%", height: 240, alignSelf: "center", marginVertical: 8 },
  smallArt: { width: 130, height: 120, alignSelf: "center", marginVertical: 12 },
  section: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#E5E5E5", paddingTop: 16, paddingBottom: 14 },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: "600", color: "#252525", marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 21, color: "#54585B", marginBottom: 10 },
  bullet: { fontSize: 14, lineHeight: 21, color: "#54585B", marginBottom: 4 },
  action: { minHeight: 44, backgroundColor: TEAL, borderRadius: 4, alignItems: "center", justifyContent: "center", marginTop: 8 },
  actionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  secondary: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 13, color: TEAL, textDecorationLine: "underline" },
})
