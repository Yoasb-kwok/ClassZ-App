export type FigmaFlowItem = {
  id: string
  name: string
  group: FigmaFlowGroup
}

export type FigmaFlowGroup = "guest" | "family" | "coach" | "owner" | "center" | "learning" | "shared"

export const FIGMA_FLOW_GROUPS: FigmaFlowGroup[] = ["guest", "family", "coach", "owner", "center", "learning", "shared"]

export const FIGMA_FLOW_GROUP_LABELS: Record<FigmaFlowGroup, string> = {
  guest: "Guest Onboarding",
  family: "Parent/Student Core",
  coach: "Coach Core",
  owner: "Centre / Boss Core",
  center: "Centre Operation",
  learning: "Learning Record & Companion",
  shared: "Shared Utilities",
}

export const FIGMA_FLOW_ITEMS: FigmaFlowItem[] = [
  { id: "2:13097", name: "Login", group: "guest" },
  { id: "2:13830", name: "Account type", group: "guest" },
  { id: "2:13884", name: "Registration: Account&Password", group: "guest" },
  { id: "2:13990", name: "Forgot password", group: "guest" },
  { id: "2:14031", name: "Reset password (coach)", group: "guest" },
  { id: "1:3361", name: "Main (guest)", group: "guest" },
  { id: "2:28821", name: "Main", group: "family" },
  { id: "2:11070", name: "Search", group: "family" },
  { id: "2:12469", name: "Search (category)", group: "family" },
  { id: "2:29167", name: "Program", group: "family" },
  { id: "2:29244", name: "Class option", group: "family" },
  { id: "2:29543", name: "Class option expand", group: "family" },
  { id: "2:29788", name: "Reservation", group: "family" },
  { id: "2:30045", name: "Reservation coupon selected", group: "family" },
  { id: "2:30253", name: "Reservation confirmed", group: "family" },
  { id: "2:30350", name: "Reservation expand", group: "family" },
  { id: "2:8852", name: "Schedule all", group: "family" },
  { id: "2:8962", name: "Schedule selected child", group: "family" },
  { id: "2:9068", name: "Schedule calendar all", group: "family" },
  { id: "2:9281", name: "Schedule calendar selected child", group: "family" },
  { id: "2:9430", name: "Schedule program detail", group: "family" },
  { id: "2:31679", name: "Schedule class detail", group: "family" },
  { id: "2:31790", name: "Schedule class detail (after attendance)", group: "family" },
  { id: "2:32015", name: "Attendance confirmed", group: "family" },
  { id: "2:11137", name: "Profile", group: "family" },
  { id: "2:11252", name: "Child profile", group: "family" },
  { id: "2:11434", name: "Child profile next", group: "family" },
  { id: "2:11510", name: "Add child", group: "family" },
  { id: "2:11618", name: "Personal setting", group: "family" },
  { id: "2:11697", name: "Change password", group: "family" },
  { id: "2:12142", name: "Inbox", group: "family" },
  { id: "2:12224", name: "Notification", group: "family" },
  { id: "2:12295", name: "Inbox message", group: "family" },
  { id: "2:32122", name: "Reviews", group: "family" },
  { id: "2:32238", name: "Promote code", group: "family" },
  { id: "2:32362", name: "Promote code detail", group: "family" },
  { id: "2:32505", name: "Filter", group: "family" },
  { id: "2:14136", name: "Coach profile setup", group: "coach" },
  { id: "2:14259", name: "Coach profile edit", group: "coach" },
  { id: "2:14325", name: "Coach skills", group: "coach" },
  { id: "2:14376", name: "Coach accreditation", group: "coach" },
  { id: "2:14426", name: "Coach experience", group: "coach" },
  { id: "2:14477", name: "Connect centre", group: "coach" },
  { id: "2:15186", name: "My profiles (coach + center manager)", group: "coach" },
  { id: "2:15242", name: "Coach account setting", group: "coach" },
  { id: "1113:19078", name: "Coach schedule", group: "coach" },
  { id: "1090:16470", name: "Profile settings (coach)", group: "coach" },
  { id: "2:17141", name: "Login (boss)", group: "owner" },
  { id: "2:17356", name: "Forgot password (centre)", group: "owner" },
  { id: "2:17560", name: "Business overview (boss blank)", group: "owner" },
  { id: "2:18885", name: "Centre details (boss)", group: "owner" },
  { id: "2:18949", name: "Manager (boss)", group: "owner" },
  { id: "2:19342", name: "Coach (boss)", group: "owner" },
  { id: "2:19735", name: "Centre business", group: "owner" },
  { id: "2:19783", name: "Centre payout", group: "owner" },
  { id: "2:20423", name: "Business overview (boss)", group: "owner" },
  { id: "2:20537", name: "Boss account setting", group: "owner" },
  { id: "2:20798", name: "My account (boss)", group: "owner" },
  { id: "2:20913", name: "Centre setting", group: "owner" },
  { id: "2:15432", name: "Centre profile", group: "center" },
  { id: "2:17877", name: "Centre profile setup 33", group: "center" },
  { id: "2:18783", name: "Centre profile from centre branch", group: "center" },
  { id: "490:16856", name: "Centre profile from centre branch settings", group: "center" },
  { id: "2:21044", name: "Centre message", group: "center" },
  { id: "2:21227", name: "Transaction", group: "center" },
  { id: "2:23217", name: "Timeslot edit centre done", group: "center" },
  { id: "2:23980", name: "Add class centre", group: "center" },
  { id: "2:16765", name: "Saved class centre", group: "center" },
  { id: "1:28725", name: "Academic dashboard", group: "learning" },
  { id: "1:28820", name: "Activity dashboard", group: "learning" },
  { id: "1:28915", name: "Academic learning record", group: "learning" },
  { id: "1:29102", name: "Activity learning record", group: "learning" },
  { id: "1:29289", name: "Academic learning record (program)", group: "learning" },
  { id: "1:29547", name: "Activity learning record (program)", group: "learning" },
  { id: "1:29805", name: "Academic learning record (lesson)", group: "learning" },
  { id: "1:29921", name: "Activity learning record (lesson)", group: "learning" },
  { id: "1:30711", name: "Activity learning record (input)", group: "learning" },
  { id: "1:30840", name: "Academic learning record (input)", group: "learning" },
  { id: "2:17003", name: "Pending review", group: "learning" },
  { id: "2:16556", name: "Student list", group: "learning" },
  { id: "1104:18865", name: "Pending review (select class)", group: "learning" },
  { id: "235:14673", name: "Learning Companion", group: "learning" },
  { id: "1:30270", name: "Fox", group: "learning" },
  { id: "1:30195", name: "Owl", group: "learning" },
  { id: "1:30549", name: "Dolphin", group: "learning" },
  { id: "1:30624", name: "Turtle", group: "learning" },
  { id: "1:30474", name: "Rabbit", group: "learning" },
  { id: "1:30399", name: "Bee", group: "learning" },
  { id: "1:30345", name: "Learn how it works", group: "learning" },
  { id: "2:26614", name: "Art detail page", group: "shared" },
  { id: "2:28959", name: "Rate (pop-up)", group: "shared" },
  { id: "2:13437", name: "Terms", group: "shared" },
  { id: "150:14020", name: "Contact us", group: "shared" },
  { id: "236:15127", name: "Language", group: "shared" },
]

export const FIGMA_FLOW_BY_GROUP: Record<FigmaFlowGroup, FigmaFlowItem[]> = FIGMA_FLOW_GROUPS.reduce(
  (acc, group) => {
    acc[group] = FIGMA_FLOW_ITEMS.filter((item) => item.group === group)
    return acc
  },
  {} as Record<FigmaFlowGroup, FigmaFlowItem[]>,
)

export function findFlowItem(id: string): FigmaFlowItem | null {
  return FIGMA_FLOW_ITEMS.find((item) => item.id === id) || null
}
