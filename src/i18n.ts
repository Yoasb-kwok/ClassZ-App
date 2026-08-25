export type AppLocale = "en" | "zh-Hant" | "zh-Hans"

export const APP_LOCALES: AppLocale[] = ["en", "zh-Hant", "zh-Hans"]

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "EN",
  "zh-Hant": "繁",
  "zh-Hans": "简",
}

type MainCopy = {
  hello: (name: string) => string
  recommendYou: string
  trendingWorkshop: string
  getStarted: string
  explorePassport: string
  passportDesc: string
  lesson: string
  music: string
  art: string
  stem: string
  academic: string
}

type SearchCopy = {
  title: string
  placeholder: string
  stem: string
  sports: string
  academic: string
  art: string
  music: string
  others: string
  centreCourses: string
  parentWorkshop: string
}

type NotificationCopy = {
  title: string
  classUpdate: string
  account: string
  empty: string
}

type InboxCopy = {
  title: string
  search: string
  today: string
  responseTime: (hours: string) => string
  typeMessage: string
  empty: string
  pin: string
  unpin: string
  archive: string
  archived: string
  unarchive: string
  delete: string
  pinLimit: string
}

const MAIN: Record<AppLocale, MainCopy> = {
  en: {
    hello: (name) => `Hello ${name}!`,
    recommendYou: "Recommend you",
    trendingWorkshop: "Trending Workshop",
    getStarted: "Get started on ClassZ",
    explorePassport: "Explore ClassZ Growth Passport",
    passportDesc: "From class to growth record — every lesson becomes part of your child's growth journey.",
    lesson: "lesson",
    music: "Music",
    art: "Art",
    stem: "STEM",
    academic: "Academic",
  },
  "zh-Hant": {
    hello: (name) => `你好 ${name}！`,
    recommendYou: "為你推薦",
    trendingWorkshop: "熱門工作坊",
    getStarted: "開始使用 ClassZ",
    explorePassport: "探索 ClassZ 成長護照",
    passportDesc: "從課堂到成長紀錄，每一堂課都會成為孩子成長旅程的一部份",
    lesson: "堂",
    music: "音樂",
    art: "藝術",
    stem: "STEM",
    academic: "學術",
  },
  "zh-Hans": {
    hello: (name) => `你好 ${name}！`,
    recommendYou: "为你推荐",
    trendingWorkshop: "热门工作坊",
    getStarted: "开始使用 ClassZ",
    explorePassport: "探索 ClassZ 成长护照",
    passportDesc: "从课堂到成长记录，每一堂课都会成为孩子成长旅程的一部分",
    lesson: "课",
    music: "音乐",
    art: "艺术",
    stem: "STEM",
    academic: "学术",
  },
}

const SEARCH: Record<AppLocale, SearchCopy> = {
  en: {
    title: "Search",
    placeholder: "What to learn?",
    stem: "STEM",
    sports: "Sports",
    academic: "Academic",
    art: "Art",
    music: "Music",
    others: "Others",
    centreCourses: "High School Courses",
    parentWorkshop: "Parent Workshop",
  },
  "zh-Hant": {
    title: "搜尋",
    placeholder: "想學什麼？",
    stem: "STEM",
    sports: "運動",
    academic: "學術",
    art: "藝術",
    music: "音樂",
    others: "其他",
    centreCourses: "中學課程",
    parentWorkshop: "家長工作坊",
  },
  "zh-Hans": {
    title: "搜索",
    placeholder: "想学什么？",
    stem: "STEM",
    sports: "运动",
    academic: "学术",
    art: "艺术",
    music: "音乐",
    others: "其他",
    centreCourses: "中学课程",
    parentWorkshop: "家长工作坊",
  },
}

const NOTIFICATION: Record<AppLocale, NotificationCopy> = {
  en: {
    title: "Notification",
    classUpdate: "Class update",
    account: "Account",
    empty: "No class notifications yet.",
  },
  "zh-Hant": {
    title: "通知",
    classUpdate: "課堂更新",
    account: "帳戶",
    empty: "暫時未有課堂通知。",
  },
  "zh-Hans": {
    title: "通知",
    classUpdate: "课堂更新",
    account: "账户",
    empty: "暂时没有课堂通知。",
  },
}

const INBOX: Record<AppLocale, InboxCopy> = {
  en: {
    title: "Inbox",
    search: "Search",
    today: "Today",
    responseTime: (hours) => `Response time: ${hours}`,
    typeMessage: "Type message",
    empty: "No messages yet.",
    pin: "Pin",
    unpin: "Unpin",
    archive: "Archive",
    archived: "Archived",
    unarchive: "Unarchive",
    delete: "Delete",
    pinLimit: "You can pin up to 3 chats.",
  },
  "zh-Hant": {
    title: "收件匣",
    search: "搜尋",
    today: "今天",
    responseTime: (hours) => `回覆時間：${hours}`,
    typeMessage: "輸入訊息",
    empty: "暫時未有訊息。",
    pin: "置頂",
    unpin: "取消置頂",
    archive: "封存",
    archived: "已封存",
    unarchive: "取消封存",
    delete: "刪除",
    pinLimit: "最多只能置頂 3 則對話。",
  },
  "zh-Hans": {
    title: "收件箱",
    search: "搜索",
    today: "今天",
    responseTime: (hours) => `回复时间：${hours}`,
    typeMessage: "输入消息",
    empty: "暂时没有消息。",
    pin: "置顶",
    unpin: "取消置顶",
    archive: "封存",
    archived: "已封存",
    unarchive: "取消封存",
    delete: "删除",
    pinLimit: "最多只能置顶 3 则对话。",
  },
}

export function tMain(locale: AppLocale): MainCopy {
  return MAIN[locale] || MAIN.en
}

export function tSearch(locale: AppLocale): SearchCopy {
  return SEARCH[locale] || SEARCH.en
}

export function tNotification(locale: AppLocale): NotificationCopy {
  return NOTIFICATION[locale] || NOTIFICATION.en
}

export function tInbox(locale: AppLocale): InboxCopy {
  return INBOX[locale] || INBOX.en
}

export function nextLocale(current: AppLocale): AppLocale {
  const idx = APP_LOCALES.indexOf(current)
  return APP_LOCALES[(idx + 1) % APP_LOCALES.length]
}
