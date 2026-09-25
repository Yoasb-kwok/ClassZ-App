import { useRef, useState } from "react"
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Feather from "@expo/vector-icons/Feather"

const TEAL = "#0AABA9"
type Pose = "telescope" | "telescopeSmall" | "map" | "mapSmall" | "magnifier" | "star" | "clipboard" | "pointing" | "pointingSmall" | "turtle" | "owl" | "owlBooks" | "owlClipboard" | "owlIdea" | "owlMap" | "owlPointing" | "owlRunningBooks" | "owlMapSmall" | "owlPointingSmall" | "owlBooksSmall" | "dolphinWave" | "dolphinWaveSmall" | "dolphinBook" | "dolphinWorkSmall" | "dolphinTalk" | "dolphinTalkSmall" | "dolphinPuzzle" | "dolphinPointing" | "dolphinPointingSmall" | "foxGenerated" | "beeGenerated"
const ART: Record<Pose, number> = {
  telescope: require("../assets/mobile/learning-companion/rabbit-telescope.png"),
  telescopeSmall: require("../assets/mobile/learning-companion/rabbit-telescope-small.png"),
  map: require("../assets/mobile/learning-companion/rabbit-map.png"),
  mapSmall: require("../assets/mobile/learning-companion/rabbit-map-small.png"),
  magnifier: require("../assets/mobile/learning-companion/rabbit-magnifier.png"),
  star: require("../assets/mobile/learning-companion/rabbit-star.png"),
  clipboard: require("../assets/mobile/learning-companion/rabbit-clipboard.png"),
  pointing: require("../assets/mobile/learning-companion/rabbit-pointing.png"),
  pointingSmall: require("../assets/mobile/learning-companion/rabbit-pointing-small.png"),
  turtle: require("../assets/mobile/learning-companion/turtle-steady.png"),
  owl: require("../assets/mobile/learning-companion/owl-thoughtful.png"),
  owlBooks: require("../assets/mobile/learning-companion/owl-books.png"),
  owlClipboard: require("../assets/mobile/learning-companion/owl-clipboard.png"),
  owlIdea: require("../assets/mobile/learning-companion/owl-idea.png"),
  owlMap: require("../assets/mobile/learning-companion/owl-map.png"),
  owlPointing: require("../assets/mobile/learning-companion/owl-pointing.png"),
  owlRunningBooks: require("../assets/mobile/learning-companion/owl-running-books.png"),
  owlMapSmall: require("../assets/mobile/learning-companion/owl-map-small.png"),
  owlPointingSmall: require("../assets/mobile/learning-companion/owl-pointing-small.png"),
  owlBooksSmall: require("../assets/mobile/learning-companion/owl-books-small.png"),
  dolphinWave: require("../assets/mobile/learning-companion/dolphin-wave.png"),
  dolphinWaveSmall: require("../assets/mobile/learning-companion/dolphin-wave-small.png"),
  dolphinBook: require("../assets/mobile/learning-companion/dolphin-book.png"),
  dolphinWorkSmall: require("../assets/mobile/learning-companion/dolphin-work-small.png"),
  dolphinTalk: require("../assets/mobile/learning-companion/dolphin-talk.png"),
  dolphinTalkSmall: require("../assets/mobile/learning-companion/dolphin-talk-small.png"),
  dolphinPuzzle: require("../assets/mobile/learning-companion/dolphin-puzzle.png"),
  dolphinPointing: require("../assets/mobile/learning-companion/dolphin-pointing.png"),
  dolphinPointingSmall: require("../assets/mobile/learning-companion/dolphin-pointing-small.png"),
  foxGenerated: require("../assets/mobile/learning-companion/fox-generated.png"),
  beeGenerated: require("../assets/mobile/learning-companion/bee-generated.png"),
}

type Section = { title: string; subtitle?: string; paragraphs?: string[]; bullets?: string[]; art?: Pose; artAfter?: boolean; paragraphsAfterBullets?: boolean }

function CompanionArt({ pose, large = false }: { pose: Pose; large?: boolean }) {
  return <Image source={ART[pose]} resizeMode="contain" style={large ? styles.heroArt : styles.smallArt} />
}

function SectionBlock({ section }: { section: Section }) {
  const sideIcon = section.art === "turtle" || section.art === "owl"
  if (sideIcon && section.art) {
    return (
      <View style={styles.companionRow}>
        <Image source={ART[section.art]} resizeMode="contain" style={styles.companionArt} />
        <View style={styles.companionCopy}>
          <Text style={styles.companionName}>{section.title}</Text>
          {section.subtitle ? <Text style={styles.companionRole}>{section.subtitle}</Text> : null}
          {section.paragraphs?.map((paragraph, index) => <Text key={index} style={styles.companionBody}>{paragraph}</Text>)}
        </View>
      </View>
    )
  }
  if (["Rabbit", "Owl", "Dolphin", "Fox", "Turtle", "Bee"].includes(section.title)) {
    return (
      <View style={styles.rabbitProfile}>
        <Text style={styles.rabbitName}>{section.title}</Text>
        <Text style={styles.rabbitRole}>{section.paragraphs?.[0]}</Text>
        {section.paragraphs?.slice(1).map((paragraph, index) => <Text key={index} style={styles.body}>{paragraph}</Text>)}
      </View>
    )
  }
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.art && !section.artAfter ? <CompanionArt pose={section.art} /> : null}
      {!section.paragraphsAfterBullets ? section.paragraphs?.map((paragraph, index) => <Text key={index} style={styles.body}>{paragraph}</Text>) : null}
      {section.bullets?.map((bullet, index) => <Text key={index} style={styles.bullet}>{"•  "}{bullet}</Text>)}
      {section.paragraphsAfterBullets ? section.paragraphs?.map((paragraph, index) => <Text key={index} style={styles.body}>{paragraph}</Text>) : null}
      {section.art && section.artAfter ? <CompanionArt pose={section.art} /> : null}
    </View>
  )
}

export function LearningCompanionScreen({ navigation, childName, animal = "Rabbit" }: { navigation: any; childName: string; animal?: string }) {
  const [page, setPage] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const [explainerOpen, setExplainerOpen] = useState(false)
  const scroll = useRef<ScrollView>(null)
  const firstName = childName.split(" ")[0] || "Your child"
  const isRabbit = animal === "Rabbit"
  const next = (index: number) => {
    setHistory((previous) => [...previous, page])
    setPage(index)
    scroll.current?.scrollTo({ y: 0, animated: false })
  }
  const back = () => {
    if (!history.length) return navigation.goBack()
    setPage(history[history.length - 1])
    setHistory((previous) => previous.slice(0, -1))
    scroll.current?.scrollTo({ y: 0, animated: false })
  }

  const rabbitPages: Array<{ eyebrow?: string; heading: string; hero: Pose; sections: Section[]; action: string }> = [
    {
      eyebrow: "Based on recent ClassZ learning records,",
      heading: `${firstName}'s Learning Companion is...`, hero: "telescope",
      sections: [
        { title: "Rabbit", paragraphs: ["Active Explorer", `Across recent ClassZ records, ${firstName} has often shown willing curiosity, active learning and flexible thinking.`] },
        { title: "What this means", paragraphs: [`Your child may learn best through trying, exploring, asking, and actively taking part. They may enjoy hands-on activities, new challenges, and opportunities to test ideas.`, "They may also progress when they are given chances to participate, make attempts, and learn through experience."] },
        { title: "Often observed as", bullets: ["Participating actively", "Trying independently", "Showing initiative", "Asking questions"], art: "magnifier", artAfter: true },
        { title: "What may help them learn?", bullets: ["Give them chances to try before over-explaining.", "Encourage questions and curiosity.", "Offer small challenges that invite exploration.", "Help them reflect after trying, not only focus on the outcome."], paragraphs: ["This is grounded in the idea that children learn actively through interaction, exploration, and guided experience."], paragraphsAfterBullets: true },
        { title: "Parent reminder", paragraphs: ["Learning Companion is not a diagnosis or personality label. It is a ClassZ learning style snapshot based on recent records. As your child learns, this may change and become more flexible."] },
      ], action: `See ${firstName}'s Learning Insights`,
    },
    {
      heading: `Understanding ${firstName}'s Learning`, hero: "clipboard",
      sections: [
        { title: `${firstName}'s Current Learning Portrait`, paragraphs: [`${firstName} currently appears most engaged when able to participate directly, ask questions and explore how an activity works. This active Rabbit pattern is the clearest theme across the recent records.`, `At the same time, ${firstName} does not approach every situation in exactly the same way. When an activity is unfamiliar or less clearly structured, a gentle pause before joining may appear. Real ClassZ learning moments help us understand what is repeated, what is occasional, and where more support may help.`] },
        { title: "How Alex Approaches Something New?", art: "telescopeSmall", paragraphs: ["Alex often approaches new activities with curiosity and a desire to understand what can be tried. Asking questions alongside trying can help Alex build confidence and become fully involved.", "In less familiar situations, Alex may initially pause or look for reassurance. A short explanation or demonstration may help Alex move from careful observation to more active participation and expression."] },
        { title: "How Alex Responds to Challenge?", paragraphs: ["When Alex understands the purpose of the activity, recent records suggest a willingness to attempt different approaches rather than immediately giving up.", "However, unfamiliar or complicated tasks may sometimes require encouragement at the beginning. Breaking the first step down clearly may help Alex feel secure enough to begin."] },
      ], action: `How ${firstName} Learns Best`,
    },
    {
      heading: `How ${firstName} Learns Best`, hero: "star",
      sections: [
        { title: "How Alex Learns with Other People", paragraphs: ["Recent records suggest that Alex can contribute ideas and engage actively when there is a clear opportunity to participate.", "There is currently less repeated evidence about how Alex responds during sustained group collaboration. ClassZ will continue observing whether Alex prefers exchanging ideas with others, working independently first, or moving between both as the task changes."] },
        { title: "How Alex Responds to Guidance and Feedback", art: "pointingSmall", paragraphs: ["Alex appears to benefit most from guidance that gives direction without removing the opportunity to explore.", "Rather than providing the full solution immediately, adults may encourage better engagement by clarifying the goal, offering one starting point, and then allowing Alex to test an idea. When correction is needed, asking Alex what could be changed may support both reflection and independence."] },
        { title: "Conditions That Bring Out Alex's Best", paragraphs: ["Alex's strongest engagement may be most likely when:"], bullets: ["The activity has a clear goal", "There is something practical to try", "Questions are welcomed", "Alex has some choice in how to approach the task", "Guidance is available without becoming overly controlling", "There is time to slow down and organise ideas when necessary"] },
      ], action: "Supporting Alex Beyond the Classroom",
    },
    {
      heading: `Supporting ${firstName} Beyond the Classroom`, hero: "map",
      sections: [
        { title: "What Parents May Notice at Home", paragraphs: ["At home, Alex may be more interested in activities that involve making, testing, constructing, experimenting or discovering how something works.", "Alex may ask several questions before or during an activity. In some situations, Alex may begin immediately; in others, especially unfamiliar tasks, Alex may want confirmation before starting." , "Parents may also notice that Alex's approach changes with confidence level and interest. An invitation to try followed by gentle independence may be especially supportive."] },
        { title: "Personalised Strategies", art: "telescopeSmall", bullets: ["Give Alex a clear starting point, but avoid explaining every step in advance.", "Invite Alex to predict what they hope to find.", "When Alex hesitates, reduce the first step rather than completing the task for them.", "Ask, ‘What else could you try?’ after the first method does not work.", "Encourage Alex to explain what was learned after experimenting.", "Allow time for checking and organising ideas before moving on.", "Praise the process of trying, questioning and adjusting, not only the correct result."] },
      ], action: "Looking Ahead",
    },
    {
      heading: "Looking Ahead", hero: "pointing",
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
        { title: "Turtle", subtitle: "Steady Builder", art: "turtle", paragraphs: ["Represents a steady, careful approach that may benefit from time or encouragement when starting."] },
        { title: "Owl", subtitle: "Thoughtful Learner", art: "owl", paragraphs: ["Represents a careful, reflective approach to feedback, questions and checking work."] },
        { title: "Parent reminder", paragraphs: ["How a child approaches learning may vary depending on the task, how familiar it feels and the environment. These insights reflect patterns ClassZ has observed rather than a fixed description of who the child is."] },
      ], action: "More Analytical Insight",
    },
    {
      heading: "Understanding Your Child's Learning", hero: "clipboard",
      sections: [
        { title: "Your Child at a Glance", paragraphs: ["Often shows a natural balance of active participation and careful focus in school activities. In one sense, the many focused on tasks that wait for a little while can be a strong foundation, and can help when a familiar activity becomes challenging." ] },
        { title: "How Alex Approaches Something New?", art: "mapSmall", paragraphs: ["Often approaches learning with a blend of independent effort and careful attention to detail. Alex may take familiar tasks on quickly and show a strong focus, and be more careful in situations that need support."] },
        { title: "How They Respond Along the Way", art: "magnifier", paragraphs: ["When tasks become more challenging or unfamiliar, often sometimes needs extra reassurance or multiple rounds of prompting to keep going. However, the curiosity they need to stay engaged appears in quiet moments, demonstrating the first step helped them immediately adjust and continue."] },
      ], action: "Supporting Their Learning",
    },
    {
      heading: "Supporting Their Learning", hero: "star",
      sections: [
        { title: "How You Can Support Them", paragraphs: ["To help them build confidence when facing new challenges, you can support by breaking down familiar steps into smaller parts. Giving enough room to try while providing clear support when needed can help improve learning interest."], bullets: ["Demonstrate the first step when introducing a new activity.", "Give them some quiet thinking time before stepping in.", "Start with familiar parts first to build momentum before moving to newer steps."] },
        { title: "Why This Companion Fits", art: "pointingSmall", paragraphs: ["The Rabbit Active Explorer companion fits them because the repeated observations reflect trying, exploration and ideas in tasks independently. It also shows a strong desire to explore tasks on their own, especially when the first familiar step feels clear."] },
        { title: "Also Reflected in Their Learning", paragraphs: ["Their activity can also reflect an interest in planning and building confidence through time. As more records become available, this insight will keep learning how to support them best."] },
        { title: "Turtle", subtitle: "Steady Builder", art: "turtle", paragraphs: ["Represents a steady, careful approach that may benefit from time or encouragement when starting."] },
        { title: "Owl", subtitle: "Thoughtful Learner", art: "owl", paragraphs: ["Represents a careful, reflective approach to feedback, questions and checking work."] },
      ], action: "Back to home",
    },
  ]

  const owlPages: typeof rabbitPages = [
    {
      eyebrow: "Based on recent ClassZ learning records,",
      heading: `${firstName}'s Learning Companion is...`, hero: "owlBooks",
      sections: [
        { title: "Owl", paragraphs: ["Thoughtful Learner", `Across recent ClassZ records, ${firstName} has often worked carefully, asked questions, checked mistakes, and responded well to feedback.`] },
        { title: "What this means", paragraphs: ["Your child may learn best when they have time to think, review their work, and receive clear feedback. They may show progress through careful practice, reflection, and gradual improvement rather than rushing into tasks.", "They may benefit from understanding the reason behind a task and may improve their work with feedback in specific and constructive ways."] },
        { title: "Often observed as", bullets: ["Working carefully", "Responding well to feedback", "Asking questions", "Checking mistakes carefully"], art: "owlRunningBooks", artAfter: true },
        { title: "What may help them learn?", bullets: ["Give clear instructions and examples.", "Allow time to process and review.", "Encourage them to ask questions.", "Praise effort, strategy, and improvement, not only results.", "Help them notice what improved from last time."], paragraphs: ["This is grounded in the idea that children learn well when feedback and support match their current level of development. Vygotsky's Zone of Proximal Development describes the space between what a learner can do independently and what they can do with guidance, which supports the idea of allowing ‘what helps next’ rather than only judging performance."], paragraphsAfterBullets: true },
        { title: "Parent reminder", paragraphs: ["Learning Companion is not a diagnosis or personality label. It is a ClassZ learning style snapshot based on recent records. As your child learns, this may change and become more flexible."] },
      ], action: `See ${firstName}'s Learning Insights`,
    },
    {
      heading: `Understanding ${firstName}'s Learning`, hero: "owlClipboard",
      sections: [
        { title: `${firstName}'s Current Learning Portrait`, paragraphs: [`${firstName} currently appears most engaged when able to ask questions, review their work and use feedback to improve. This thoughtful Owl pattern is the clearest theme across the recent records.`, `At the same time, ${firstName} does not approach every situation in exactly the same way. When an activity is unfamiliar or less clearly structured, a gentle pause before joining may appear. Real ClassZ learning moments help us understand what is repeated, what is occasional, and where more support may help.`] },
        { title: `How ${firstName} Approaches Something New?`, art: "owlMapSmall", paragraphs: [`${firstName} often approaches new activities with curiosity and a desire to understand what can be tried. Asking questions alongside trying can help ${firstName} make sense of the task before becoming fully involved.`, `In less familiar situations, ${firstName} may initially pause or look for reassurance. A short explanation or demonstration may help ${firstName} move from careful observation to more active participation.`] },
        { title: `How ${firstName} Responds to Challenge?`, paragraphs: [`When ${firstName} understands the purpose of the activity, recent records suggest a willingness to attempt different approaches rather than immediately giving up.`, "However, unfamiliar or complicated tasks may sometimes require encouragement at the beginning. Breaking the first step down clearly may help them feel secure enough to begin." ] },
      ], action: `How ${firstName} Learns Best`,
    },
    {
      heading: `How ${firstName} Learns Best`, hero: "owlIdea",
      sections: [
        { title: `How ${firstName} Learns with Other People`, paragraphs: [`Recent records suggest that ${firstName} can contribute ideas and engage actively when there is a clear opportunity to participate.`, `There is currently less repeated evidence about how ${firstName} responds during sustained group collaboration. ClassZ will continue observing whether they prefer exchanging ideas with others, working independently first, or moving between both as the task changes.`] },
        { title: `How ${firstName} Responds to Guidance and Feedback`, art: "owlPointingSmall", paragraphs: [`${firstName} appears to benefit most from guidance that gives direction without removing the opportunity to explore.`, `Rather than providing the full solution immediately, adults may achieve better engagement by clarifying the goal, offering one starting point, and then allowing ${firstName} to test an idea. When correction is needed, asking what could be changed may support both reflection and independence.`] },
        { title: `Conditions That Bring Out ${firstName}'s Best`, paragraphs: [`${firstName}'s strongest engagement may be more likely when:`], bullets: ["The activity has a clear goal", "There is something practical to try", "Questions are welcomed", "They have some choice in how to approach the task", "Guidance is available without becoming overly controlling", "There is time to slow down and organise ideas when necessary"] },
      ], action: `Supporting ${firstName} Beyond the Classroom`,
    },
    {
      heading: `Supporting ${firstName} Beyond the Classroom`, hero: "owlMap",
      sections: [
        { title: "What Parents May Notice at Home", paragraphs: [`At home, ${firstName} may be more interested in activities that involve making, testing, constructing, experimenting or discovering how something works.`, `${firstName} may ask several questions before or during an activity. In some situations, they may begin immediately; in others, especially unfamiliar tasks, they may want confirmation before starting.`, `Parents may also notice that ${firstName}'s approach changes with confidence level and interest. An invitation to try followed by gentle independence may be especially supportive.`] },
        { title: "Personalised Strategies", art: "owlBooksSmall", bullets: [`Give ${firstName} a clear starting point, but avoid explaining every step in advance.`, `Invite ${firstName} to predict what may happen before trying.`, "When they hesitate, reduce the first step rather than completing the task for them.", "Ask, ‘What else could you try?’ after the first method does not work.", "Encourage them to explain what was learned after experimenting.", "Allow time for checking and organising ideas before moving on.", "Praise the process of trying, questioning and adjusting, not only the correct result."] },
      ], action: "Looking Ahead",
    },
    {
      heading: "Looking Ahead", hero: "owlPointing",
      sections: [
        { title: "What ClassZ Will Continue Observing?", paragraphs: [`${firstName}'s strongest engagement may be more likely when:`], bullets: ["The activity has a clear goal", "There is something practical to try", "Questions are welcomed", "They have some choice in how to approach the task", "Guidance is available without becoming overly controlling", "There is time to slow down and organise ideas when necessary"] },
        { title: "Evidence and Confidence", paragraphs: ["This interpretation is based on recent ClassZ learning records.", `The Owl Thoughtful Learner pattern received the strongest overall support and is therefore shown as ${firstName}'s primary Learning Companion.`, "Turtle Steady Builder and Fox Creative Problem Solver are shown as supporting patterns because related behaviours appeared repeatedly in the recent records. They do not replace the primary Owl result, but they help explain how this approach may change according to the activity, level of familiarity and type of support provided.", "This remains a learning snapshot rather than a fixed conclusion. Future records may strengthen, reduce or change the supporting patterns."] },
      ], action: "Back to ZPassport",
    },
  ]

  const companionVariants: Record<string, { role: string; poses: [Pose, Pose, Pose, Pose, Pose]; small: [Pose, Pose, Pose]; summary: string; meaning: string[]; observed: string[]; help: string[]; portrait: string; evidence: string }> = {
    Dolphin: {
      role: "Social Collaborator",
      poses: ["dolphinWave", "dolphinBook", "dolphinPuzzle", "dolphinTalk", "dolphinPointing"],
      small: ["dolphinWaveSmall", "dolphinWorkSmall", "dolphinTalkSmall"],
      summary: `Across recent ClassZ records, ${firstName} has often shown a collaborative spirit, participated actively, and engaged well with feedback.`,
      meaning: ["Your child may learn best through interaction, shared practice, encouragement, and group-based learning. They may become more engaged when learning feels social, supportive, and connected with others.", "They may show progress when they can discuss, cooperate, receive feedback in an encouraging environment, and learn alongside peers."],
      observed: ["Collaborating well", "Participating actively", "Responding well to feedback", "Engaging with others during learning"],
      help: ["Encourage group practice or partner activities.", "Give opportunities to explain ideas to others.", "Use specific, friendly feedback that builds confidence.", "Praise cooperation, listening, and contribution."],
      portrait: `${firstName} currently appears most engaged when able to participate directly, ask questions and explore how an activity works. This social Dolphin pattern is the clearest theme across the recent records.`,
      evidence: "The Dolphin Social Collaborator pattern received the strongest overall support and is therefore shown as the primary Learning Companion.",
    },
    Fox: {
      role: "Creative Problem Solver",
      poses: ["foxGenerated", "foxGenerated", "foxGenerated", "foxGenerated", "foxGenerated"],
      small: ["foxGenerated", "foxGenerated", "foxGenerated"],
      summary: `Across recent ClassZ records, ${firstName} has often shown curiosity, creative thinking, and a willingness to explore different ways to solve problems.`,
      meaning: ["Your child may learn best when they can explore different ways to solve a problem. They may enjoy open-ended tasks, creative challenges, and opportunities to test ideas.", "They may show progress when they are encouraged to explain their thinking, try strategies, and review what works with others."],
      observed: ["Showing initiative", "Trying independently", "Asking questions", "Showing persistence"],
      help: ["Give open-ended challenges.", "Ask, ‘What else could you try?’", "Encourage them to explain their thinking.", "Balance creativity with clear next steps."],
      portrait: `${firstName} currently appears most engaged when able to investigate ideas and create a plan. This creative Fox pattern is the clearest theme across recent records.`,
      evidence: "The Fox Creative Problem Solver pattern received the strongest overall support and is therefore shown as the primary Learning Companion.",
    },
    Turtle: {
      role: "Steady Builder",
      poses: ["turtle", "turtle", "turtle", "turtle", "turtle"],
      small: ["turtle", "turtle", "turtle"],
      summary: `Across recent ClassZ records, your child was often observed as showing persistence, staying focused, working carefully, and sometimes needing encouragement to start.`,
      meaning: ["Your child may learn best when they can take steady steps, and tasks feel clear and possible. They may make progress with small routines, gentle encouragement, careful practice, and space to build confidence.", "They may benefit from a predictable learning environment where tasks are broken down into manageable steps."],
      observed: ["Showing persistence", "Staying focused", "Working carefully", "Needing encouragement to start"],
      help: ["Give warm encouragement before starting.", "Break tasks into smaller steps.", "Allow time to build confidence.", "Notice effort and persistence.", "Avoid rushing them too early into performance or comparison."],
      portrait: `${firstName} currently appears most engaged when able to take steady steps, build confidence and stay focused. This steady Turtle pattern is the clearest theme across recent records.`,
      evidence: "The Turtle Steady Builder pattern received the strongest overall support and is therefore shown as the primary Learning Companion.",
    },
    Bee: {
      role: "Focused Worker",
      poses: ["beeGenerated", "beeGenerated", "beeGenerated", "beeGenerated", "beeGenerated"],
      small: ["beeGenerated", "beeGenerated", "beeGenerated"],
      summary: `Across recent ClassZ records, your child was often observed as staying focused, working carefully, checking mistakes carefully, and responding well to feedback.`,
      meaning: ["Your child may learn best with clear goals, steady routines, and tasks that allow them to concentrate. They may show progress through consistency, careful practice, and repeated effort.", "They may benefit from knowing what is expected, having clear instructions, and seeing small improvements over time."],
      observed: ["Staying focused", "Working carefully", "Following instructions carefully", "Showing persistence"],
      help: ["Set clear goals for each practice.", "Keep instructions simple and structured.", "Encourage careful checking.", "Celebrate small improvements.", "Add variety when learning becomes too repetitive."],
      portrait: `${firstName} currently appears most engaged when tasks are clear and they can concentrate on doing careful work. This focused Bee pattern is the clearest theme across recent records.`,
      evidence: "The Bee Focused Worker pattern received the strongest overall support and is therefore shown as the primary Learning Companion.",
    },
  }
  const variant = companionVariants[animal]
  const variantPages: typeof rabbitPages = variant ? [
    {
      eyebrow: "Based on recent ClassZ learning records,",
      heading: `${firstName}'s Learning Companion is...`, hero: variant.poses[0],
      sections: [
        { title: animal, paragraphs: [variant.role, variant.summary] },
        { title: "What this means", paragraphs: variant.meaning },
        { title: "Often observed as", bullets: variant.observed, art: variant.small[0], artAfter: true },
        { title: "What may help them learn?", bullets: variant.help, paragraphs: ["This is grounded in the idea that children learn actively through interaction, exploration, and guided experience. These insights reflect recent records and may change as new observations are added."], paragraphsAfterBullets: true },
        { title: "Parent reminder", paragraphs: ["Learning Companion is not a diagnosis or personality label. It is a ClassZ learning style snapshot based on recent records. As your child learns, this may change and become more flexible."] },
      ], action: `See ${firstName}'s Learning Insights`,
    },
    {
      heading: `Understanding ${firstName}'s Learning`, hero: variant.poses[1],
      sections: [
        { title: `${firstName}'s Current Learning Portrait`, paragraphs: [variant.portrait, `At the same time, ${firstName} does not approach every situation in exactly the same way. Real ClassZ learning moments help us understand what is repeated, what is occasional, and where more support may help.`] },
        { title: `How ${firstName} Approaches Something New?`, art: variant.small[1], paragraphs: [`${firstName} often approaches new activities with curiosity and a desire to understand what can be tried. Asking questions alongside trying can help them make sense of the task.`, `In less familiar situations, ${firstName} may initially pause or look for reassurance. A short explanation or demonstration may help them become more involved.`] },
        { title: `How ${firstName} Responds to Challenge?`, paragraphs: [`When ${firstName} understands the purpose of the activity, recent records suggest a willingness to attempt different approaches rather than immediately giving up.`, "Unfamiliar or complicated tasks may sometimes require encouragement at the beginning. Breaking the first step down clearly may help them feel secure enough to begin."] },
      ], action: `How ${firstName} Learns Best`,
    },
    {
      heading: `How ${firstName} Learns Best`, hero: variant.poses[2],
      sections: [
        { title: `How ${firstName} Learns with Other People`, paragraphs: [`Recent records suggest that ${firstName} can contribute ideas and engage actively when there is a clear opportunity to participate.`, `ClassZ will continue observing whether ${firstName} prefers exchanging ideas with others, working independently first, or moving between both as the task changes.`] },
        { title: `How ${firstName} Responds to Guidance and Feedback`, art: variant.small[2], paragraphs: [`${firstName} appears to benefit most from guidance that gives direction without removing the opportunity to explore.`, `Rather than providing the full solution immediately, adults may clarify the goal, offer one starting point, and then allow ${firstName} to test an idea.`] },
        { title: `Conditions That Bring Out ${firstName}'s Best`, paragraphs: [`${firstName}'s strongest engagement may be more likely when:`], bullets: ["The activity has a clear goal", "There is something practical to try", "Questions are welcomed", "They have some choice in how to approach the task", "Guidance is available without becoming overly controlling", "There is time to slow down and organise ideas when necessary"] },
      ], action: `Supporting ${firstName} Beyond the Classroom`,
    },
    {
      heading: `Supporting ${firstName} Beyond the Classroom`, hero: variant.poses[3],
      sections: [
        { title: "What Parents May Notice at Home", paragraphs: [`At home, ${firstName} may be more interested in activities that involve making, testing, constructing, experimenting or discovering how something works.`, `${firstName} may ask several questions before or during an activity. In some situations they may begin immediately; in others they may want confirmation before starting.`, `Parents may also notice that ${firstName}'s approach changes with confidence level and interest. An invitation to try followed by gentle independence may be especially supportive.`] },
        { title: "Personalised Strategies", art: variant.small[1], bullets: [`Give ${firstName} a clear starting point, but avoid explaining every step in advance.`, `Invite ${firstName} to predict what may happen before trying.`, "When they hesitate, reduce the first step rather than completing the task for them.", "Ask, ‘What else could you try?’ after the first method does not work.", "Encourage them to explain what was learned after experimenting.", "Allow time for checking and organising ideas before moving on.", "Praise the process of trying, questioning and adjusting, not only the correct result."] },
      ], action: "Looking Ahead",
    },
    {
      heading: "Looking Ahead", hero: variant.poses[4],
      sections: [
        { title: "What ClassZ Will Continue Observing?", paragraphs: [`${firstName}'s strongest engagement may be more likely when:`], bullets: ["The activity has a clear goal", "There is something practical to try", "Questions are welcomed", "They have some choice in how to approach the task", "Guidance is available without becoming overly controlling", "There is time to slow down and organise ideas when necessary"] },
        { title: "Evidence and Confidence", paragraphs: ["This interpretation is based on recent ClassZ learning records.", variant.evidence, "Supporting patterns may also appear in recent observations. They do not replace the primary companion, but help explain how learning can change with the activity and support provided.", "This remains a learning snapshot rather than a fixed conclusion. Future records may strengthen, reduce or change the interpretation."] },
      ], action: "Back to ZPassport",
    },
  ] : []

  const pages = variant ? variantPages : animal === "Owl" ? owlPages : rabbitPages
  const current = pages[page]
  const actionLabel = current.action.replace(/\bAlex\b/g, firstName)
  const introPage = page === 0 || (isRabbit && page === 5)
  const renderSection = (section: Section, index: number) => (
    <SectionBlock
      key={`${page}-${index}`}
      section={{
        ...section,
        title: section.title.replace(/\bAlex\b/g, firstName),
        paragraphs: section.paragraphs?.map((text) => text.replace(/\bAlex\b/g, firstName)),
        bullets: section.bullets?.map((text) => text.replace(/\bAlex\b/g, firstName)),
      }}
    />
  )
  const renderActions = () => (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        style={styles.action}
        onPress={() => {
          if (page === 4) navigation.navigate("AppTabs", { screen: "Analytics" })
          else if (isRabbit && page === 7) navigation.navigate("AppTabs", { screen: "Home" })
          else next(page + 1)
        }}
      >
        <Text style={styles.actionText}>{actionLabel}  →</Text>
      </Pressable>
      {!isRabbit || page < 6 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Learn how it works" style={styles.secondary} onPress={() => isRabbit ? next(page === 5 ? 6 : 5) : setExplainerOpen(true)}>
          <Text style={styles.secondaryText}>Learn how it works →</Text>
        </Pressable>
      ) : null}
    </>
  )
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
        {introPage ? renderSection(current.sections[0], 0) : null}
        {introPage ? <Text style={styles.insightNote}>Learning insights evolve with every new record added</Text> : null}
        {introPage ? renderActions() : null}
        {(introPage ? current.sections.slice(1) : current.sections).map((section, index) => renderSection(section, introPage ? index + 1 : index))}
        {!introPage ? renderActions() : null}
      </ScrollView>
      <Modal visible={explainerOpen} transparent animationType="fade" onRequestClose={() => setExplainerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>How Learning Companion works</Text>
            <Text style={styles.body}>This is a snapshot of patterns observed in recent ClassZ learning records. It is not a fixed label or diagnosis. As more records are added, the companion and supporting insights may change.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.action} onPress={() => setExplainerOpen(false)}>
              <Text style={styles.actionText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  smallArt: { width: 120, height: 110, alignSelf: "center", marginTop: 4, marginBottom: 10 },
  rabbitProfile: { alignItems: "center", paddingTop: 4, paddingBottom: 10 },
  rabbitName: { fontSize: 18, fontWeight: "700", color: "#252525" },
  rabbitRole: { fontSize: 13, fontStyle: "italic", color: "#666666", marginBottom: 10 },
  insightNote: { fontSize: 12, color: TEAL, marginTop: 2, marginBottom: 4 },
  companionRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 12 },
  companionArt: { width: 72, height: 72 },
  companionCopy: { flex: 1 },
  companionName: { fontSize: 17, lineHeight: 22, fontWeight: "700", color: "#222222" },
  companionRole: { fontSize: 14, lineHeight: 20, fontStyle: "italic", color: "#333333", marginBottom: 4 },
  companionBody: { fontSize: 14, lineHeight: 20, color: "#54585B" },
  section: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#E5E5E5", paddingTop: 16, paddingBottom: 14 },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: "600", color: "#252525", marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 21, color: "#54585B", marginBottom: 10 },
  bullet: { fontSize: 14, lineHeight: 21, color: "#54585B", marginBottom: 4 },
  action: { minHeight: 44, backgroundColor: TEAL, borderRadius: 4, alignItems: "center", justifyContent: "center", marginTop: 8 },
  actionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  secondary: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 13, color: TEAL, textDecorationLine: "underline" },
  modalBackdrop: { flex: 1, backgroundColor: "#00000066", justifyContent: "center", padding: 24 },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 20 },
})
