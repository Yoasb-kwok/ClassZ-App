export type InboxThread = {
  id: string
  centre: string
  preview: string
  date: string
  time: string
  unread: boolean
  responseTime: string
  pinned?: boolean
  archived?: boolean
}

export type InboxChatMessage = {
  id: string
  from: "centre" | "me"
  text: string
  time: string
}

export const INBOX_THREADS: InboxThread[] = [
  {
    id: "t1",
    centre: "ClassZ Chan Siu Ming Memorial Centre",
    preview: "Hello, how can I help you?",
    date: "01 Sept",
    time: "09:12am",
    unread: true,
    responseTime: "2 hours",
  },
  {
    id: "t2",
    centre: "ClassZ Playgroup Bright Kids Drawing Centre",
    preview: "Yes, the following timeslot is available this Saturday.",
    date: "01 Sept",
    time: "09:12am",
    unread: true,
    responseTime: "2 hours",
  },
  {
    id: "t3",
    centre: "ClassZ STEM Lab",
    preview: "ok, thx~",
    date: "01 Sept",
    time: "09:12am",
    unread: false,
    responseTime: "4 hours",
  },
  {
    id: "t4",
    centre: "ClassZ Art Studio",
    preview: "ok, thx~",
    date: "31 Aug",
    time: "05:40pm",
    unread: false,
    responseTime: "1 day",
  },
]

export const INBOX_MESSAGES: Record<string, InboxChatMessage[]> = {
  t1: [
    { id: "m1", from: "centre", text: "Hello, how can I help you?", time: "12:35" },
    { id: "m2", from: "me", text: "Hi, I would like to ask about the Guitar Program schedule.", time: "12:40" },
    { id: "m3", from: "centre", text: "Sure. The next available class is this Saturday at 10:00am.", time: "12:42" },
    { id: "m4", from: "me", text: "Perfect, thanks!", time: "12:45" },
  ],
  t2: [
    { id: "m1", from: "centre", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", time: "12:35" },
    { id: "m2", from: "me", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", time: "12:40" },
    { id: "m3", from: "centre", text: "Yes, the following timeslot is available this Saturday.", time: "12:42" },
    { id: "m4", from: "me", text: "Great, please hold that timeslot for us.", time: "12:45" },
  ],
  t3: [
    { id: "m1", from: "centre", text: "Your STEM trial class is confirmed.", time: "11:10" },
    { id: "m2", from: "me", text: "ok, thx~", time: "11:12" },
  ],
  t4: [
    { id: "m1", from: "centre", text: "Please bring an apron for Art Lab.", time: "17:30" },
    { id: "m2", from: "me", text: "ok, thx~", time: "17:40" },
  ],
}

export function findInboxThread(id: string): InboxThread | null {
  return INBOX_THREADS.find((t) => t.id === id) || null
}

export function getInboxMessages(threadId: string): InboxChatMessage[] {
  return INBOX_MESSAGES[threadId] || []
}
