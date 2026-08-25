export type ClassNotification = {
  id: string
  category: "class_update" | "account"
  centre: string
  note: string
  date: string
  time: string
  /** ISO for sorting latest → oldest */
  createdAt: string
  unread: boolean
}

/** Class-focused notifications, newest first after sort */
export const CLASS_NOTIFICATIONS: ClassNotification[] = [
  {
    id: "n1",
    category: "class_update",
    centre: "ClassZ Chan Siu Ming Memorial Centre",
    note: "Class is starting in 15mins, please prepare the code for attendance.",
    date: "01 Sept",
    time: "09:15am",
    createdAt: "2025-09-01T09:15:00+08:00",
    unread: true,
  },
  {
    id: "n2",
    category: "class_update",
    centre: "ClassZ Causeway Bay Studio",
    note: "Guitar Program room changed to Studio B. Please arrive 5 minutes early.",
    date: "01 Sept",
    time: "08:40am",
    createdAt: "2025-09-01T08:40:00+08:00",
    unread: true,
  },
  {
    id: "n3",
    category: "account",
    centre: "ClassZ Team",
    note: "Our policy has been updated, please visit our website for more details.",
    date: "01 Sept",
    time: "09:15am",
    createdAt: "2025-09-01T07:30:00+08:00",
    unread: true,
  },
  {
    id: "n4",
    category: "class_update",
    centre: "ClassZ Chan Siu Ming Memorial Centres",
    note: "Your program was refunded and cancelled due to minimum capacity limit. Click for more details.",
    date: "31 Aug",
    time: "06:20pm",
    createdAt: "2025-08-31T18:20:00+08:00",
    unread: false,
  },
  {
    id: "n5",
    category: "class_update",
    centre: "ClassZ STEM Lab",
    note: "Homework reminder: please submit the Junior STEM explorer worksheet before class.",
    date: "30 Aug",
    time: "04:05pm",
    createdAt: "2025-08-30T16:05:00+08:00",
    unread: false,
  },
  {
    id: "n6",
    category: "class_update",
    centre: "ClassZ Art Studio",
    note: "Bring an apron for Creative Art Lab this Saturday. Materials will be prepared in class.",
    date: "29 Aug",
    time: "11:10am",
    createdAt: "2025-08-29T11:10:00+08:00",
    unread: false,
  },
]

export function getNotificationsLatestFirst(items: ClassNotification[] = CLASS_NOTIFICATIONS): ClassNotification[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
