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

// TODO(backend): no parent inbox/message route exists yet (checked /student/inbox,
// /student/messages, /messages, /inbox on the temporary production host). Keep the
// thread list empty instead of showing sample centre chats.

export const INBOX_THREADS: InboxThread[] = []

export function findInboxThread(id: string): InboxThread | null {
  return INBOX_THREADS.find((t) => t.id === id) || null
}

export function getInboxMessages(_threadId: string): InboxChatMessage[] {
  return []
}
