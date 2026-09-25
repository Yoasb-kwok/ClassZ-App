import { useEffect, useMemo, useRef, useState } from "react"
import { StatusBar } from "expo-status-bar"
import { Asset } from "expo-asset"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { jwtDecode } from "jwt-decode"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import Feather from "@expo/vector-icons/Feather"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { SvgXml } from "react-native-svg"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextStyle,
  View,
} from "react-native"
import {
  FIGMA_FLOW_BY_GROUP,
  FIGMA_FLOW_GROUP_LABELS,
  FIGMA_FLOW_GROUPS,
  FIGMA_FLOW_ITEMS,
  findFlowItem,
  type FigmaFlowGroup,
  type FigmaFlowItem,
} from "./src/figma-flow"
import { FIGMA_ASSETS } from "./src/figma-asset-urls"
import { PAYMENT_ICONS } from "./src/payment-svgs"
import { createInitialFlowAppState, FlowApplicationSurface, type FlowAppState } from "./src/flow-application"
import { HOME_BANNER, HOME_PASSPORT_IMAGE, HOME_RECOMMEND_IMAGES, HOME_TRENDING_IMAGES, NAV_ICONS, SEARCH_BANNER_CENTRE, SEARCH_BANNER_PARENT, SEARCH_CATEGORY_COLORS, SEARCH_CATEGORY_IMAGES } from "./src/home-assets"
import { HOME_CATEGORY_SVGS } from "./src/home-category-svgs"
import { HOME_HEADER_SVGS } from "./src/home-header-svgs"
import { ANALYTICS_SVGS } from "./src/analytics-svgs"
import { AcademicRecordScreen, ClassRecordScreen, ProgramRecordScreen, WorkSamplesScreen } from "./src/analytics-record-screens"
import { LearningCompanionScreen } from "./src/learning-companion"
import {
  AuthLandingScreen,
  ForgotPasswordScreen,
  LoginFormScreen,
  RegisterAccountTypeScreen,
  RegisterFormScreen,
  type AuthRole,
} from "./src/auth-screens"
import { LOGIN_SVGS } from "./src/login-svgs"
import { FONT } from "./src/typography"
import { LOCALE_LABELS, nextLocale, tInbox, tMain, tNotification, tSearch, type AppLocale } from "./src/i18n"
import { getNotificationsLatestFirst, type ClassNotification } from "./src/notifications"
import { findInboxThread, getInboxMessages, INBOX_THREADS, type InboxChatMessage, type InboxThread } from "./src/inbox"

type ClasszPortalRole = "platform_admin" | "center_admin" | "coach" | "parent" | "student"

type Session = {
  token: string
  user: {
    email: string
    name: string
    role: ClasszPortalRole
    center_id?: number | null
  }
}

type ScheduleClassDetailRouteParams = {
  title: string
  time: string
  date: string
  lesson: string
  image: string
  color: string
  child: string
}

type RootStackParamList = {
  AuthLanding: undefined
  Login: { role: AuthRole }
  RegisterAccountType: { role?: AuthRole } | undefined
  RegisterForm: { accountType: "parent" | "coach" | "centre" }
  ForgotPassword: { role: AuthRole }
  AppTabs: undefined
  CentreDetailApp: undefined
  ReviewApp: undefined
  MemberProfileApp: { memberId: MemberProfileId }
  ProgramListApp: undefined
  ClassOptionApp: undefined
  ReservationApp: { schedule?: ClassScheduleOption } | undefined
  ReservationConfirmedApp: { schedule: ClassScheduleOption; total: number }
  SelectChildApp: undefined
  PromoteCodeApp: undefined
  PersonalSettingApp: undefined
  ChangePasswordApp: undefined
  LanguageApp: undefined
  EnrollmentTermsApp: undefined
  ContactUsApp: undefined
  ContactThanksApp: undefined
  ChildProfileApp: undefined
  ChildDetailsApp: { childId: string }
  AddChildProfileApp: undefined
  FavouriteApp: undefined
  TransactionsApp: undefined
  TransactionDetailApp: { transactionId: string }
  CompletedClassDetailApp: { transactionId: string }
  ScheduleClassDetailApp: ScheduleClassDetailRouteParams
  VerificationCodeApp: ScheduleClassDetailRouteParams
  AttendanceConfirmedApp: ScheduleClassDetailRouteParams
  AcademicDashboardApp: undefined
  ActivityDashboardApp: undefined
  ActivityLearningPictureApp: undefined
  AcademicRecordApp: undefined
  ProgramRecordApp: { programTitle: string }
  ClassRecordApp: { programTitle: string; lesson: string }
  WorkSamplesApp: undefined
  LearningRecordsApp: undefined
  CompanionApp: undefined
  InboxApp: undefined
  InboxMessageApp: { threadId: string }
  NotificationApp: undefined
  FigmaFlowLibrary: undefined
  FigmaFlowDetail: { itemId: string }
  FlowRunner: { group: FigmaFlowGroup; itemId?: string }
  AllFlowsOverview: undefined
}

type TabsParamList = {
  Home: undefined
  Search: undefined
  Calendar: undefined
  Analytics: undefined
  Profile: undefined
}

const SESSION_KEY = "classz_mobile_session"
const LOCALE_KEY = "classz_mobile_locale"
const PROFILE_FEATURE_ICONS = {
  childProfile: require("./assets/figma/profile/child-profile.png"),
  favourite: require("./assets/figma/profile/favourite.png"),
}
const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabsParamList>()

type SearchFilterState = {
  districts: string[]
  minPrice: string
  maxPrice: string
  ratings: number[]
  services: string[]
}

type MemberProfileId = "jessica" | "athena"

type MemberProfile = {
  name: string
  gender: "female" | "male"
  tenure: string
  centre: string
  role: string
  bio: string
  imageUri: string
  skills: string[]
  accreditation: Array<{
    year: string
    entries: Array<{ subject: string; experience: string; organisation: string }>
  }>
  experience: Array<{
    year: string
    role: string
    duration: string
    organisation: string
  }>
}

const MEMBER_PROFILES: Record<MemberProfileId, MemberProfile> = {
  jessica: {
    name: "Jessica Lam",
    gender: "female",
    tenure: "4 Years on ClassZ",
    centre: "ClassZ Playgroup Bright Kids Drawing Centre",
    role: "Centre Manager",
    bio: "I'm Jessica Lam, an experienced centre manager committed to creating a welcoming environment where every child can learn confidently and enjoy meaningful progress.",
    imageUri: FIGMA_ASSETS.reservation.host,
    skills: ["Leadership", "Child Care", "SEN Support"],
    accreditation: [
      {
        year: "2023",
        entries: [
          { subject: "Child Care", experience: "8 years experience", organisation: "Registered member at Hong Kong Childcare Association" },
          { subject: "SEN Support", experience: "5 years experience", organisation: "Certified SEN Learning Support Practitioner" },
        ],
      },
      {
        year: "2021",
        entries: [
          { subject: "Centre Management", experience: "6 years experience", organisation: "ClassZ Professional Development Centre" },
        ],
      },
    ],
    experience: [
      { year: "2023", role: "Centre Manager", duration: "4 years experience", organisation: "ClassZ Playgroup Bright Kids Drawing Centre" },
      { year: "2019", role: "Program Coordinator", duration: "4 years experience", organisation: "ABC ClassZ International School" },
    ],
  },
  athena: {
    name: "Athena Yeung",
    gender: "female",
    tenure: "2 Years on ClassZ",
    centre: "ClassZ Playgroup Bright Kids Drawing Centre",
    role: "Program Coach",
    bio: "I'm Athena Wang, an experienced music coach with a specialization in piano. For over 15 years, I've had the privilege of helping students of all ages and skill levels develop their musical talents and reach new heights.",
    imageUri: FIGMA_ASSETS.reservation.coach,
    skills: ["Piano", "Violin", "Flute"],
    accreditation: ["2022", "2021", "2020"].map((year) => ({
      year,
      entries: ["Flute", "Flute", "Flute"].map((subject) => ({
        subject,
        experience: "10 years experience",
        organisation: "Registered member at ABC Violin Association",
      })),
    })),
    experience: [
      { year: "2022", role: "Music Teacher", duration: "10 months experience", organisation: "ABC ClassZ International School" },
      { year: "2021", role: "Music Teacher", duration: "2 years experience", organisation: "ABC ClassZ International School" },
      { year: "2019", role: "Music Teacher", duration: "2 years experience", organisation: "ABC ClassZ International School" },
    ],
  },
}

const SEARCH_FILTER_DISTRICTS = [
  {
    region: "Hong Kong Island",
    districts: [
      "Central", "Admiralty", "Sheung Wan", "Sai Ying Pun", "Kennedy Town", "Repulse Bay",
      "Causeway Bay", "North Point", "Mid-Levels", "Wong Chuk Hang", "Quarry Bay", "Tai Koo",
      "Chai Wan", "Aberdeen", "Stanley", "Tin Hau",
    ],
  },
  {
    region: "Kowloon",
    districts: [
      "Tsim Sha Tsui", "Yau Ma Tei", "Mong Kok", "Jordan", "Prince Edward", "Sham Shui Po",
      "Cheung Sha Wan", "Lai Chi Kok", "Mei Foo", "Kowloon Tong", "Olympic", "Ho Man Tin",
      "Hung Hom", "To Kwa Wan", "Wong Tai Sin", "Kai Tak", "Diamond Hill", "San Po Kong",
      "Kwun Tong", "Ngau Tau Kok", "Kowloon Bay", "Lam Tin", "Yau Tong",
    ],
  },
  {
    region: "New Territories",
    districts: [
      "Tsuen Wan", "Kwai Fong", "Kwai Chung", "Tsing Yi", "Tuen Mun", "Yuen Long", "Tin Shui Wai",
      "Sheung Shui", "Fanling", "Tai Po", "Sha Tin", "Fo Tan", "Ma On Shan", "Tai Wai", "Sai Kung",
      "Tseung Kwan O", "Hang Hau", "Po Lam", "LOHAS Park", "Tung Chung", "Mui Wo", "Discovery Bay", "Islands",
    ],
  },
] as const

const SEARCH_FILTER_SERVICES = [
  "SEN-inclusive",
  "Performance Opportunity",
  "Exam / Certificate Pathway",
  "Small Class Size",
] as const

const DEFAULT_SEARCH_FILTERS: SearchFilterState = {
  districts: [
    "Central", "Kennedy Town", "Mid-Levels", "Wong Chuk Hang", "Aberdeen", "Tsim Sha Tsui",
    "Prince Edward", "Mei Foo", "Kowloon Tong", "To Kwa Wan", "Diamond Hill", "Ngau Tau Kok",
    "Tsuen Wan", "Tuen Mun", "Fanling", "Tai Po", "Sai Kung", "Po Lam", "Mui Wo",
  ],
  minPrice: "100",
  maxPrice: "900",
  ratings: [4, 5],
  services: ["SEN-inclusive", "Exam / Certificate Pathway"],
}

const APP_TAB_BAR_STYLE = {
  borderTopWidth: 1,
  borderTopColor: "#E5E7EB",
  height: 78,
  paddingTop: 8,
  paddingBottom: 10,
  paddingHorizontal: 12,
  backgroundColor: "#FFFFFF",
  shadowColor: "#809BCE",
  shadowOpacity: 0.12,
  shadowOffset: { width: 0, height: -2 },
  shadowRadius: 10,
  elevation: 12,
} as const

const API_BASE = (() => {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3003"
  const stripped = raw.replace(/\/$/, "").replace(/\/api\/?$/, "")
  return `${stripped}/api`
})()

function mapJwtRole(payload: { role?: string; is_admin?: number }): ClasszPortalRole {
  if (Number(payload.is_admin) === 1) return "platform_admin"
  const role = String(payload.role || "").toLowerCase()
  if (role === "center_admin") return "center_admin"
  if (role === "coach") return "coach"
  if (role === "parent") return "parent"
  if (role === "student") return "student"
  return "center_admin"
}

async function apiLogin(loginIdentifier: string, password: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginIdentifier: loginIdentifier.trim(), password, rememberMe: true }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean
    msg?: string
    message?: string
    token?: string
    user?: { email?: string; name?: string; username?: string }
  }
  if (!res.ok || !data.success || !data.token) {
    throw new Error(data.msg || data.message || "Login failed")
  }
  const payload = jwtDecode<{ role?: string; is_admin?: number; center_id?: number; email?: string; name?: string }>(data.token)
  return {
    token: data.token,
    user: {
      email: data.user?.email || payload.email || loginIdentifier.trim(),
      name: data.user?.name || data.user?.username || payload.name || loginIdentifier.trim(),
      role: mapJwtRole(payload),
      center_id: payload.center_id ?? null,
    },
  }
}

function HomeScreen({
  navigation,
  flowAppState,
  setFlowAppState,
  locale,
  onToggleLocale,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
  locale: AppLocale
  onToggleLocale: () => void
}) {
  const t = tMain(locale)
  const categories = ["Music", "Art", "STEM", "Academic"] as const
  const categoryLabel = (category: (typeof categories)[number]) => {
    if (category === "Music") return t.music
    if (category === "Art") return t.art
    if (category === "STEM") return t.stem
    return t.academic
  }
  const recommended = flowAppState.programs
  const trending = [
    { id: "t1", title: "Homework at Home Workshop", date: "12 Apr 2026", image: HOME_TRENDING_IMAGES[0] },
    { id: "t2", title: "Homework at Home Workshop", date: "12 Apr 2026", image: HOME_TRENDING_IMAGES[1] },
  ]

  const filteredRecommended = flowAppState.selectedCategory
    ? recommended.filter((p) => p.category.toLowerCase() === flowAppState.selectedCategory?.toLowerCase())
    : recommended

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <View style={styles.topHeaderRow}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.profileAvatarSmall} />
            <View>
              <Text style={styles.helloText}>{t.hello("Emily")}</Text>
            </View>
          </View>
          <View style={styles.topHeaderActions}>
            <Pressable style={styles.localePill} onPress={onToggleLocale}>
              <Text style={styles.localePillText}>{LOCALE_LABELS[locale]}</Text>
            </Pressable>
            <Pressable style={styles.iconBubble} onPress={() => navigation.navigate("NotificationApp")}>
              <SvgXml xml={HOME_HEADER_SVGS.notification} width={14} height={14} />
            </Pressable>
            <Pressable style={styles.iconBubble} onPress={() => navigation.navigate("InboxApp")}>
              <SvgXml xml={HOME_HEADER_SVGS.inbox} width={14} height={14} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.pageTitle}>{t.recommendYou}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalCardsScroll}
          contentContainerStyle={styles.horizontalCardsContent}
        >
          {filteredRecommended.map((p, idx) => (
            <View key={p.id} style={styles.homeWideCardOuter}>
              <View style={styles.homeWideCardShadow}>
                <Pressable
                  style={styles.homeWideCard}
                  onPress={() => {
                    setFlowAppState((prev) => ({ ...prev, selectedProgramId: p.id }))
                    navigation.navigate("ReservationApp")
                  }}
                >
                  <View style={styles.homeWideCardImageWrap}>
                    <Image
                      source={HOME_RECOMMEND_IMAGES[idx % HOME_RECOMMEND_IMAGES.length]}
                      style={styles.homeWideCardImage}
                      resizeMode="cover"
                    />
                    {idx === 0 ? (
                      <View style={styles.senBadgeOnImage}>
                        <Feather name="check-circle" size={12} color="#222" />
                        <Text style={styles.senBadgeText}>SEN</Text>
                      </View>
                    ) : null}
                    <View style={styles.heartOnImage}>
                      <Feather name="heart" size={16} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.homeWideCardBody}>
                    <View style={styles.homeWideCardTopMeta}>
                      <Text style={styles.homeWideCardTitle} numberOfLines={1}>{p.title}</Text>
                      <View style={styles.ratingRow}>
                        <Feather name="star" size={12} color="#111827" />
                        <Text style={styles.homeWideCardRating}>{p.rating.toFixed(2)}</Text>
                      </View>
                    </View>
                    <Text style={styles.homeWideCardMeta}>
                      ${p.price} {t.lesson} · {p.location}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        <Image source={HOME_BANNER} style={styles.homeBannerImage} resizeMode="cover" />

        <View style={styles.categoryContainer}>
          <View style={styles.categoriesRow}>
            {categories.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryIconCard,
                  flowAppState.selectedCategory?.toLowerCase() === category.toLowerCase()
                    ? styles.categoryIconCardActive
                    : null,
                ]}
                onPress={() =>
                  setFlowAppState((prev) => ({
                    ...prev,
                    selectedCategory:
                      prev.selectedCategory?.toLowerCase() === category.toLowerCase() ? null : category,
                  }))
                }
              >
                <SvgXml xml={HOME_CATEGORY_SVGS[category]} width={25} height={25} />
                <Text style={styles.categoryPillText} numberOfLines={1}>{categoryLabel(category)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.pageTitle}>{t.trendingWorkshop}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalCardsScroll}
          contentContainerStyle={styles.horizontalCardsContent}
        >
          {trending.map((item) => (
            <View key={item.id} style={styles.homeWideCardOuter}>
              <View style={styles.homeWideCardShadow}>
                <Pressable style={styles.homeWideCard} onPress={() => navigation.navigate("Search")}>
                  <View style={styles.homeWideCardImageWrap}>
                    <Image source={item.image} style={styles.homeWideCardImage} resizeMode="cover" />
                  </View>
                  <View style={styles.homeWideCardBody}>
                    <Text style={styles.homeWideCardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.homeWideCardMeta}>{item.date}</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.pageTitle}>{t.getStarted}</Text>
        <Pressable style={styles.passportCardShadow} onPress={() => navigation.navigate("Analytics")}>
          <View style={styles.passportCard}>
            <View style={styles.passportHeroWrap}>
              <Image source={HOME_PASSPORT_IMAGE} style={styles.passportHeroImage} resizeMode="cover" />
            </View>
            <View style={styles.passportBody}>
              <Text style={styles.passportTitle}>{t.explorePassport}</Text>
              <Text style={styles.passportDesc}>{t.passportDesc}</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function SearchTabScreen({
  navigation,
  flowAppState,
  setFlowAppState,
  locale,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
  locale: AppLocale
}) {
  const t = tSearch(locale)
  const [favouriteCentreIds, setFavouriteCentreIds] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<SearchFilterState>(DEFAULT_SEARCH_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<SearchFilterState | null>(null)
  const [collapsedFilterRegions, setCollapsedFilterRegions] = useState<string[]>([])
  const categories = ["STEM", "Sports", "Academic", "Art", "Music", "Others"] as const
  const categoryTabs = ["Music", "Art", "STEM", "Academic", "Sports", "Others"] as const
  const categoryIcons = {
    STEM: "vector-polyline",
    Sports: "basketball",
    Academic: "book-open-page-variant",
    Art: "palette",
    Music: "music-note-eighth",
    Others: "dots-horizontal-circle-outline",
  } as const
  const categoryLabel = (category: (typeof categories)[number]) => {
    if (category === "STEM") return t.stem
    if (category === "Sports") return t.sports
    if (category === "Academic") return t.academic
    if (category === "Art") return t.art
    if (category === "Music") return t.music
    return t.others
  }

  const selectedCategory = flowAppState.selectedCategory as (typeof categories)[number] | null
  const normalizedQuery = flowAppState.searchQuery.trim().toLowerCase()
  const filteredCentres = flowAppState.centres.filter((centre) => {
    const matchesCategory = !selectedCategory || centre.categories.includes(selectedCategory)
    const matchesQuery = !normalizedQuery
      || `${centre.name} ${centre.categories.join(" ")} ${centre.location}`.toLowerCase().includes(normalizedQuery)
    const minimumPrice = Number(appliedFilters?.minPrice || 0)
    const maximumPrice = Number(appliedFilters?.maxPrice || Number.POSITIVE_INFINITY)
    const matchesDistrict = !appliedFilters?.districts.length || appliedFilters.districts.includes(centre.location)
    const matchesPrice = !appliedFilters || (centre.priceFrom >= minimumPrice && centre.priceFrom <= maximumPrice)
    const matchesRating = !appliedFilters?.ratings.length
      || appliedFilters.ratings.includes(Math.round(centre.rating))
    return matchesCategory && matchesQuery && matchesDistrict && matchesPrice && matchesRating
  })

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: showFilters ? { display: "none" } : APP_TAB_BAR_STYLE })
    return () => navigation.setOptions({ tabBarStyle: APP_TAB_BAR_STYLE })
  }, [navigation, showFilters])

  const selectCategory = (category: (typeof categories)[number]) => {
    setFlowAppState((prev) => ({ ...prev, selectedCategory: category }))
  }

  const toggleFavourite = (centreId: string) => {
    setFavouriteCentreIds((current) =>
      current.includes(centreId)
        ? current.filter((id) => id !== centreId)
        : [...current, centreId],
    )
  }

  const toggleFilterItem = (field: "districts" | "services", value: string) => {
    setDraftFilters((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }))
  }

  const closeFilters = () => {
    setDraftFilters(appliedFilters ?? DEFAULT_SEARCH_FILTERS)
    setShowFilters(false)
  }

  const toggleFilterRegion = (region: string) => {
    setCollapsedFilterRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region],
    )
  }

  if (showFilters) {
    return (
      <SafeAreaView style={styles.searchFilterScreen} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.searchFilterPageContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable accessibilityLabel="Close filter" style={styles.searchFilterCloseButton} onPress={closeFilters}>
            <Feather name="x" size={18} color="#A3A3A3" />
          </Pressable>
          <Text style={styles.searchFilterPageTitle}>Filter</Text>

          {SEARCH_FILTER_DISTRICTS.map((group) => {
            const collapsed = collapsedFilterRegions.includes(group.region)
            return (
              <View key={group.region} style={styles.searchFilterRegion}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !collapsed }}
                  style={styles.searchFilterSectionHeadingRow}
                  onPress={() => toggleFilterRegion(group.region)}
                >
                  <Text style={styles.searchFilterSectionTitle}>{group.region}</Text>
                  <Feather name={collapsed ? "chevron-down" : "chevron-up"} size={14} color="#777777" />
                </Pressable>
                {!collapsed ? (
                  <View style={styles.searchFilterChips}>
                    {group.districts.map((district) => {
                      const selected = draftFilters.districts.includes(district)
                      return (
                        <Pressable
                          key={district}
                          style={[styles.searchFilterChip, selected ? styles.searchFilterChipSelected : null]}
                          onPress={() => toggleFilterItem("districts", district)}
                        >
                          <Text style={[styles.searchFilterChipText, selected ? styles.searchFilterChipTextSelected : null]}>
                            {district}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                ) : null}
              </View>
            )
          })}

          <View style={styles.searchFilterDivider} />
          <View style={styles.searchFilterSection}>
            <Text style={styles.searchFilterSectionTitle}>Price</Text>
            <View style={styles.searchFilterPriceRow}>
              <View style={styles.searchFilterPriceField}>
                <Text style={styles.searchFilterPriceLabel}>Minimum price</Text>
                <View style={styles.searchFilterPriceInputRow}>
                  <Text style={styles.searchFilterCurrency}>HKD</Text>
                  <TextInput
                    value={draftFilters.minPrice}
                    onChangeText={(minPrice) => setDraftFilters((current) => ({ ...current, minPrice }))}
                    keyboardType="number-pad"
                    style={styles.searchFilterPriceInput}
                  />
                </View>
              </View>
              <View style={styles.searchFilterPriceField}>
                <Text style={styles.searchFilterPriceLabel}>Maximum price</Text>
                <View style={styles.searchFilterPriceInputRow}>
                  <Text style={styles.searchFilterCurrency}>HKD</Text>
                  <TextInput
                    value={draftFilters.maxPrice}
                    onChangeText={(maxPrice) => setDraftFilters((current) => ({ ...current, maxPrice }))}
                    keyboardType="number-pad"
                    style={styles.searchFilterPriceInput}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.searchFilterDivider} />
          <View style={styles.searchFilterSection}>
            <Text style={styles.searchFilterSectionTitle}>Rating</Text>
            <View style={styles.searchFilterChips}>
              {[1, 2, 3, 4, 5].map((rating) => {
                const selected = draftFilters.ratings.includes(rating)
                return (
                  <Pressable
                    key={rating}
                    style={[styles.searchFilterChip, styles.searchFilterRatingChip, selected ? styles.searchFilterChipSelected : null]}
                    onPress={() => setDraftFilters((current) => ({
                      ...current,
                      ratings: current.ratings.includes(rating)
                        ? current.ratings.filter((item) => item !== rating)
                        : [...current.ratings, rating],
                    }))}
                  >
                    <MaterialCommunityIcons
                      name={selected ? "star" : "star-outline"}
                      size={12}
                      color={selected ? "#222222" : "#8A8A8A"}
                    />
                    <Text style={[styles.searchFilterChipText, selected ? styles.searchFilterChipTextSelected : null]}>
                      {rating}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={styles.searchFilterDivider} />
          <View style={styles.searchFilterSection}>
            <Text style={styles.searchFilterSectionTitle}>Service</Text>
            <View style={styles.searchFilterChips}>
              {SEARCH_FILTER_SERVICES.map((service) => {
                const selected = draftFilters.services.includes(service)
                return (
                  <Pressable
                    key={service}
                    style={[styles.searchFilterChip, selected ? styles.searchFilterChipSelected : null]}
                    onPress={() => toggleFilterItem("services", service)}
                  >
                    <Text style={[styles.searchFilterChipText, selected ? styles.searchFilterChipTextSelected : null]}>
                      {service}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Pressable
            style={styles.searchFilterApplyButton}
            onPress={() => {
              setAppliedFilters(draftFilters)
              setShowFilters(false)
            }}
          >
            <Text style={styles.searchFilterApplyButtonText}>Apply filter</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <Text style={styles.searchPageTitle}>{t.title}</Text>
        <View style={styles.searchInputWrap}>
          <Feather name="search" size={16} color="#717171" />
          <TextInput
            style={styles.searchInput}
            placeholder={t.placeholder}
            placeholderTextColor="#717171"
            value={flowAppState.searchQuery}
            onChangeText={(text) => setFlowAppState((prev) => ({ ...prev, searchQuery: text }))}
          />
        </View>

        {selectedCategory ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.searchCategoryTabsScroll}
              contentContainerStyle={styles.searchCategoryTabs}
            >
              {categoryTabs.map((category) => {
                const active = selectedCategory === category
                return (
                  <Pressable
                    key={category}
                    style={[styles.searchCategoryTab, active ? styles.searchCategoryTabActive : null]}
                    onPress={() => selectCategory(category)}
                  >
                    <MaterialCommunityIcons
                      name={categoryIcons[category]}
                      size={23}
                      color={active ? "#222222" : "#B9B9B9"}
                    />
                    <Text style={[styles.searchCategoryTabText, active ? styles.searchCategoryTabTextActive : null]}>
                      {categoryLabel(category)}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>

            <Pressable style={styles.searchFilterButton} onPress={() => setShowFilters(true)}>
              <Text style={styles.searchFilterText}>Filter</Text>
            </Pressable>

            <View style={styles.searchResultsList}>
              {filteredCentres.map((centre) => {
                const favourite = favouriteCentreIds.includes(centre.id)
                return (
                  <Pressable
                    key={centre.id}
                    style={styles.searchResultCard}
                    onPress={() => {
                      setFlowAppState((prev) => ({ ...prev, selectedCentreId: centre.id }))
                      navigation.navigate("CentreDetailApp")
                    }}
                  >
                    <View style={styles.searchResultImageWrap}>
                      <Image
                        source={HOME_RECOMMEND_IMAGES[centre.imageIndex % HOME_RECOMMEND_IMAGES.length]}
                        style={styles.searchResultImage}
                        resizeMode="cover"
                      />
                      {centre.supportsSen ? (
                        <View style={styles.searchResultSenBadge}>
                          <Feather name="check-circle" size={12} color="#222222" />
                          <Text style={styles.searchResultSenText}>SEN</Text>
                        </View>
                      ) : null}
                      <Pressable
                        accessibilityLabel={favourite ? "Remove from favourites" : "Add to favourites"}
                        hitSlop={10}
                        style={styles.searchResultHeart}
                        onPress={(event) => {
                          event.stopPropagation()
                          toggleFavourite(centre.id)
                        }}
                      >
                        <Feather name="heart" size={25} color="#FFFFFF" fill={favourite ? "#E22255" : "transparent"} />
                      </Pressable>
                    </View>
                    <View style={styles.searchResultBody}>
                      <View style={styles.searchResultTitleRow}>
                        <Text style={styles.searchResultTitle} numberOfLines={1}>{centre.name}</Text>
                        <View style={styles.ratingRow}>
                          <MaterialCommunityIcons name="star" size={15} color="#222222" />
                          <Text style={styles.searchResultRating}>{centre.rating.toFixed(2)}</Text>
                        </View>
                      </View>
                      <Text style={styles.searchResultMeta}>${centre.priceFrom} {tMain(locale).lesson} · {centre.location}</Text>
                    </View>
                  </Pressable>
                )
              })}
              {!filteredCentres.length ? (
                <View style={styles.searchEmptyState}>
                  <Feather name="search" size={28} color="#A3A3A3" />
                  <Text style={styles.searchEmptyTitle}>No centres found</Text>
                  <Text style={styles.searchEmptyText}>Try another category, location, or search word.</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <View style={styles.searchCategoryGrid}>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={[styles.searchCategoryCard, { backgroundColor: SEARCH_CATEGORY_COLORS[category] }]}
                  onPress={() => selectCategory(category)}
                >
                  <Image source={SEARCH_CATEGORY_IMAGES[category]} style={styles.searchCategoryImage} resizeMode="cover" />
                  <Text style={styles.searchCategoryText}>{categoryLabel(category)}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.searchBannerBtn}
              onPress={() =>
                setFlowAppState((prev) => ({
                  ...prev,
                  selectedCategory: null,
                  searchQuery: locale === "en" ? "high school" : "中學",
                }))
              }
            >
              <Image source={SEARCH_BANNER_CENTRE} style={styles.searchBannerImage} resizeMode="cover" />
              <View style={styles.searchBannerOverlay} />
              <Text style={styles.searchBannerText}>{t.centreCourses}</Text>
            </Pressable>

            <Pressable
              style={styles.searchBannerBtn}
              onPress={() => navigation.navigate("ReservationApp")}
            >
              <Image source={SEARCH_BANNER_PARENT} style={styles.searchBannerImage} resizeMode="cover" />
              <View style={[styles.searchBannerOverlay, styles.searchBannerOverlayTeal]} />
              <Text style={styles.searchBannerText}>{t.parentWorkshop}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function CentreDetailScreen({
  navigation,
  flowAppState,
  setFlowAppState,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const scrollRef = useRef<ScrollView>(null)
  const [favourite, setFavourite] = useState(false)
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId)
    || flowAppState.centres[0]
  const category = centre.categories[0] as keyof typeof SEARCH_CATEGORY_IMAGES
  const suggestedCentres = flowAppState.centres.filter((item) => item.id !== centre.id).slice(0, 3)
  const relatedProgram = flowAppState.programs.find((program) => centre.categories.includes(program.category))
  const services = [
    { icon: "shield-check-outline", title: "SEN-inclusive", description: "SEN-friendly facilities and teaching for children with different learning needs." },
    { icon: "account-group-outline", title: "Small Class Size", description: "Smaller class groups for more focused attention and interaction." },
    { icon: "medal-outline", title: "Exam / Certificate Pathway", description: "Supports recognised exams, graded levels, or certificate preparation." },
    { icon: "human-male-board", title: "Performance Opportunity", description: "Offers chances to perform, showcase, compete, or present work." },
  ] as const

  return (
    <SafeAreaView style={styles.centreDetailScreen} edges={["top", "bottom"]}>
      <ScrollView
        ref={scrollRef}
        style={styles.page}
        contentContainerStyle={styles.centreDetailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centreDetailHeroWrap}>
          <Image
            source={HOME_RECOMMEND_IMAGES[centre.imageIndex % HOME_RECOMMEND_IMAGES.length]}
            style={styles.centreDetailHero}
            resizeMode="cover"
          />
          <Pressable
            accessibilityLabel="Back"
            style={[styles.centreDetailRoundButton, styles.centreDetailBackButton]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={18} color="#222222" />
          </Pressable>
          <View style={styles.centreDetailHeroActions}>
            <Pressable
              accessibilityLabel="Share centre"
              style={styles.centreDetailRoundButton}
              onPress={() => Share.share({ message: `${centre.detailName || centre.name} - ${centre.address}` })}
            >
              <Feather name="share-2" size={15} color="#222222" />
            </Pressable>
            <Pressable accessibilityLabel="Message centre" style={styles.centreDetailRoundButton} onPress={() => navigation.navigate("InboxApp")}>
              <Feather name="message-circle" size={15} color="#222222" />
            </Pressable>
            <Pressable accessibilityLabel="Favourite centre" style={styles.centreDetailRoundButton} onPress={() => setFavourite((value) => !value)}>
              <MaterialCommunityIcons name={favourite ? "heart" : "heart-outline"} size={18} color={favourite ? "#E22255" : "#222222"} />
            </Pressable>
          </View>
        </View>

        <View style={styles.centreDetailContent}>
          <View style={styles.centreDetailTitleRow}>
            <View style={styles.centreDetailLogoWrap}>
              <Image source={SEARCH_CATEGORY_IMAGES[category]} style={styles.centreDetailLogo} resizeMode="cover" />
            </View>
            <Text style={styles.centreDetailTitle}>{centre.detailName || centre.name}</Text>
          </View>
          <View style={styles.centreDetailRatingRow}>
            <MaterialCommunityIcons name="star" size={15} color="#222222" />
            <Text style={styles.centreDetailRating}>{centre.rating.toFixed(1)}</Text>
            <Text style={styles.centreDetailReviewSeparator}>·</Text>
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate("ReviewApp")}>
              <Text style={styles.centreDetailReviewLink}>{centre.reviewCount} reviews</Text>
            </Pressable>
          </View>
          <View style={styles.centreDetailAddressRow}>
            <Feather name="map-pin" size={14} color="#4B5563" />
            <Text style={styles.centreDetailAddress}>{centre.address}</Text>
          </View>

          <Text style={styles.centreDetailDescription}>
            Welcome to the Enrichment Hub! Our centre is designed to provide a stimulating and supportive environment where learners of all ages can engage in a wide range of captivating classes and pursue their unique interests.
          </Text>

          <View style={styles.centreDetailDivider} />
          <Text style={styles.centreDetailSectionTitle}>Members</Text>
          <View style={styles.centreDetailMembersRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Jessica Lam member profile"
              style={styles.centreDetailMember}
              onPress={() => navigation.navigate("MemberProfileApp", { memberId: "jessica" })}
            >
              <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.centreDetailMemberImage} />
              <Text style={styles.centreDetailMemberName}>Jessica Lam</Text>
              <Text style={styles.centreDetailMemberRole}>Centre Manager</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Athena Yeung member profile"
              style={styles.centreDetailMember}
              onPress={() => navigation.navigate("MemberProfileApp", { memberId: "athena" })}
            >
              <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.centreDetailMemberImage} />
              <Text style={styles.centreDetailMemberName}>Athena Yeung</Text>
              <Text style={styles.centreDetailMemberRole}>Program Coach</Text>
            </Pressable>
          </View>

          <View style={styles.centreDetailDivider} />
          <View style={styles.centreDetailServices}>
            {services.map((service) => (
              <View key={service.title} style={styles.centreDetailServiceRow}>
                <MaterialCommunityIcons name={service.icon} size={24} color="#343434" />
                <View style={styles.centreDetailServiceCopy}>
                  <Text style={styles.centreDetailServiceTitle}>{service.title}</Text>
                  <Text style={styles.centreDetailServiceDescription}>{service.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.centreDetailDivider} />
          <View style={styles.centreDetailMap}>
            <View style={[styles.centreDetailMapRoad, styles.centreDetailMapRoadHorizontal]} />
            <View style={[styles.centreDetailMapRoad, styles.centreDetailMapRoadVertical]} />
            <Text style={[styles.centreDetailMapLabel, { top: 18, left: 16 }]}>Central</Text>
            <Text style={[styles.centreDetailMapLabel, { bottom: 18, right: 18 }]}>{centre.location}</Text>
            <View style={styles.centreDetailMapPin}>
              <MaterialCommunityIcons name="map-marker" size={26} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.centreDetailSectionTitle}>Suggested Centre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.centreDetailSuggestions}>
            {suggestedCentres.map((suggested) => (
              <Pressable
                key={suggested.id}
                style={styles.centreDetailSuggestionCard}
                onPress={() => {
                  setFlowAppState((prev) => ({ ...prev, selectedCentreId: suggested.id }))
                  scrollRef.current?.scrollTo({ y: 0, animated: true })
                }}
              >
                <View style={styles.centreDetailSuggestionImageWrap}>
                  <Image
                    source={HOME_RECOMMEND_IMAGES[suggested.imageIndex % HOME_RECOMMEND_IMAGES.length]}
                    style={styles.centreDetailSuggestionImage}
                    resizeMode="cover"
                  />
                  {suggested.supportsSen ? (
                    <View style={styles.centreDetailSuggestionBadge}>
                      <Feather name="check-circle" size={10} color="#222222" />
                      <Text style={styles.centreDetailSuggestionBadgeText}>SEN</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.centreDetailSuggestionBody}>
                  <View style={styles.centreDetailSuggestionTitleRow}>
                    <Text style={styles.centreDetailSuggestionTitle} numberOfLines={1}>{suggested.name}</Text>
                    <View style={styles.ratingRow}>
                      <MaterialCommunityIcons name="star" size={12} color="#222222" />
                      <Text style={styles.centreDetailSuggestionRating}>{suggested.rating.toFixed(2)}</Text>
                    </View>
                  </View>
                  <Text style={styles.centreDetailSuggestionMeta}>${suggested.priceFrom} course · {suggested.location}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.centreDetailFooter}>
        <View>
          <Text style={styles.centreDetailFooterPrice}>From ${centre.priceFrom} class</Text>
          <Text style={styles.centreDetailFooterAvailability}>12 programs available</Text>
        </View>
        <Pressable
          style={styles.centreDetailProgramsButton}
          disabled={!relatedProgram}
          onPress={() => {
            if (!relatedProgram) return
            navigation.navigate("ProgramListApp")
          }}
        >
          <Text style={styles.centreDetailProgramsButtonText}>Programs</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function ProgramListScreen({
  navigation,
  flowAppState,
  setFlowAppState,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId)
    || flowAppState.centres[0]
  const programs = flowAppState.programs.filter((program) => centre.categories.includes(program.category))
  const scheduleCounts = ["10+ schedules", "8+ schedules", "10+ schedules"]
  const programCards = programs.flatMap((program) => scheduleCounts.map((schedules, index) => ({
    key: `${program.id}-${index}`,
    program,
    schedules,
  })))

  return (
    <SafeAreaView style={styles.programListScreen} edges={["top", "bottom"]}>
      <View style={styles.programListHeader}>
        <Pressable
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.programListBackButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={19} color="#777777" />
        </Pressable>
        <Text style={styles.programListHeaderTitle}>Program</Text>
        <View style={styles.programListHeaderSpacer} />
      </View>

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.programListContent}
        showsVerticalScrollIndicator={false}
      >
        {!programCards.length ? (
          <Text style={styles.programListEmpty}>No programs are available for this centre yet.</Text>
        ) : null}
        {programCards.map(({ key, program, schedules }) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`Open ${program.title}`}
            style={styles.programListCard}
            onPress={() => {
              setFlowAppState((prev) => ({ ...prev, selectedProgramId: program.id }))
              navigation.navigate("ClassOptionApp")
            }}
          >
            <Image
              source={{ uri: FIGMA_ASSETS.reservation.program }}
              style={styles.programListImage}
              resizeMode="cover"
            />
            <View style={styles.programListCardBody}>
              <View style={styles.programListTitleRow}>
                <Text style={styles.programListTitle} numberOfLines={1}>{program.title}</Text>
                <Text style={styles.programListSchedules}>{schedules}</Text>
              </View>
              <Text style={styles.programListMeta}>
                <Text style={styles.programListPrice}>From ${program.price}</Text> lesson · Age 3–6
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

type ClassScheduleOption = {
  id: string
  lessonCount: number
  dateRange: string
  originalPrice: number | null
  price: number
  spotsLeft: number
  goingCount: number
  language: string
  address: string
  coachName: string
  lessonDates: LessonDate[]
}

type LessonDate = {
  lesson: number
  dateLabel: string
  weekday: string
  time: string
}

const LESSON_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const LESSON_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const
const DESIGN_LESSON_DATES = [
  { month: 9, day: 23, time: "4:00PM - 5:00PM" },
  { month: 9, day: 26, time: "4:00PM - 5:00PM" },
  { month: 9, day: 30, time: "4:00PM - 5:00PM" },
  { month: 10, day: 2, time: "4:00PM - 5:00PM" },
  { month: 10, day: 6, time: "4:00PM - 5:00PM" },
  { month: 10, day: 9, time: "4:00PM - 5:00PM" },
  { month: 10, day: 13, time: "4:00PM - 5:00PM" },
  { month: 10, day: 28, time: "2:00PM - 3:00PM" },
] as const

function buildLessonDates(dayOffset: number): LessonDate[] {
  return DESIGN_LESSON_DATES.map((item, index) => {
    const date = new Date(2026, item.month, item.day + dayOffset)
    return {
      lesson: index + 1,
      dateLabel: `${LESSON_MONTHS[date.getMonth()]} ${date.getDate()}`,
      weekday: LESSON_WEEKDAYS[date.getDay()],
      time: item.time,
    }
  })
}

function buildProgramSchedule(
  program: { id: string; price: number },
  dayOffset: number,
  dateRange: string,
  originalPrice: number | null,
  spotsLeft: number,
  goingCount: number,
): ClassScheduleOption {
  return {
    id: `${program.id}-${dateRange}`,
    lessonCount: 8,
    dateRange,
    originalPrice,
    price: program.price,
    spotsLeft,
    goingCount,
    language: "Cantonese",
    address: "Shop 1B, Class Mall, Central, Hong Kong",
    coachName: "Athena Yeung",
    lessonDates: buildLessonDates(dayOffset),
  }
}

function LessonDateRows({ dates }: { dates: LessonDate[] }) {
  return (
    <>
      {dates.map((lessonDate) => (
        <View key={lessonDate.lesson} style={styles.classOptionLessonRow}>
          <Text style={styles.classOptionLessonNumber}>{lessonDate.lesson}</Text>
          <View style={styles.classOptionLessonCopy}>
            <Text style={styles.classOptionLessonDate}>
              {lessonDate.dateLabel}, {lessonDate.weekday}
            </Text>
            <Text style={styles.classOptionLessonTime}>{lessonDate.time}</Text>
          </View>
        </View>
      ))}
    </>
  )
}

function formatAmount(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function ZCareWord({ style }: { style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[styles.zCareWord, style]}>
      <Text style={styles.zCareMark}>z</Text>care
    </Text>
  )
}

function ClassOptionScreen({
  navigation,
  flowAppState,
  setFlowAppState,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const active = flowAppState.programs.find((p) => p.id === flowAppState.selectedProgramId) || flowAppState.programs[0]
  const [expandedOptionIds, setExpandedOptionIds] = useState<string[]>([])
  const optionAvatars = [
    FIGMA_ASSETS.reservation.host,
    FIGMA_ASSETS.reservation.coach,
    FIGMA_ASSETS.reservation.child,
    FIGMA_ASSETS.reservation.host,
  ]
  const options: ClassScheduleOption[] = [
    buildProgramSchedule(active, 0, "Oct 23 - Nov 28", 399, 4, 3),
    buildProgramSchedule(active, 2, "Oct 25 - Nov 30", null, 6, 5),
  ]

  const toggleOptionExpanded = (optionId: string) => {
    setExpandedOptionIds((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId],
    )
  }

  return (
    <SafeAreaView style={styles.classOptionScreen} edges={["top", "bottom"]}>
      <View style={styles.programListHeader}>
        <Pressable
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.programListBackButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={19} color="#777777" />
        </Pressable>
        <Text style={styles.programListHeaderTitle}>Class Option</Text>
        <View style={styles.programListHeaderSpacer} />
      </View>

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.classOptionContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{ uri: FIGMA_ASSETS.reservation.program }}
          style={styles.classOptionHero}
          resizeMode="cover"
        />
        <Text style={styles.classOptionTitle}>{active.title}</Text>
        <Text style={styles.classOptionDescription}>
          This is {active.title}! Our centre is designed to provide a stimulating and supportive
          environment where learners of all ages can engage.
        </Text>
        <View style={styles.classOptionDivider} />

        {options.map((option) => {
          const datesExpanded = expandedOptionIds.includes(option.id)
          return (
          <View key={option.id} style={styles.classOptionCard}>
            <Text style={styles.classOptionScheduleTitle}>
              {option.lessonCount} lessons · {option.dateRange}
            </Text>

            <View style={styles.classOptionAttendeeRow}>
              <View style={styles.classOptionAvatarStack}>
                {optionAvatars.map((avatar, index) => (
                  <Image
                    key={`${option.id}-avatar-${index}`}
                    source={{ uri: avatar }}
                    style={[styles.classOptionAvatar, index === 0 ? null : styles.classOptionAvatarOverlap]}
                    resizeMode="cover"
                  />
                ))}
              </View>
              <Text style={styles.classOptionGoingText}>+{option.goingCount} Going</Text>
              <Text style={styles.classOptionSpotsText}>{option.spotsLeft} spots left</Text>
            </View>

            <View style={styles.classOptionMetaRow}>
              <Feather name="globe" size={14} color="#6B6B6B" />
              <Text style={styles.classOptionMetaText}>{option.language}</Text>
            </View>
            <View style={styles.classOptionMetaRow}>
              <Feather name="map-pin" size={14} color="#6B6B6B" />
              <Text style={styles.classOptionMetaText}>{option.address}</Text>
            </View>

            <Text style={styles.classOptionPriceText}>
              {option.originalPrice ? (
                <Text style={styles.classOptionPriceOriginal}>${option.originalPrice} </Text>
              ) : null}
              <Text style={styles.classOptionPrice}>${option.price}</Text> x {option.lessonCount} lessons
            </Text>

            <View style={styles.classOptionCardDivider} />
            <View style={styles.classOptionFooterRow}>
              <Text style={styles.classOptionTotalText}>
                ${formatAmount(option.price * option.lessonCount)} total
              </Text>
              <View style={styles.classOptionCoachRow}>
                <Image
                  source={{ uri: FIGMA_ASSETS.reservation.coach }}
                  style={styles.classOptionCoachAvatar}
                  resizeMode="cover"
                />
                <Text style={styles.classOptionCoachText}>By {option.coachName}</Text>
              </View>
            </View>

            {datesExpanded ? (
              <>
                <View style={styles.classOptionCardDivider} />
                <View style={styles.classOptionLessonList}>
                  <LessonDateRows dates={option.lessonDates} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Enroll in ${option.lessonCount} lessons starting ${option.dateRange}`}
                  style={styles.classOptionReserveButton}
                  onPress={() => {
                    setFlowAppState((prev) => ({ ...prev, selectedProgramId: active.id }))
                    navigation.navigate("ReservationApp", { schedule: option })
                  }}
                >
                  <Text style={styles.classOptionReserveButtonText}>Enroll</Text>
                </Pressable>
              </>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={datesExpanded ? "Hide full dates" : "View full dates"}
              accessibilityState={{ expanded: datesExpanded }}
              style={styles.classOptionDatesRow}
              onPress={() => toggleOptionExpanded(option.id)}
            >
              <Text style={styles.classOptionDatesText}>
                {datesExpanded ? "Hide full dates" : "View full dates"}
              </Text>
              <Feather
                name={datesExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color="#6B6B6B"
              />
            </Pressable>
          </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

function ReviewScreen({ navigation, flowAppState }: { navigation: any; flowAppState: FlowAppState }) {
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId)
    || flowAppState.centres[0]
  const reviews = [
    { id: "review-1", rating: 5, date: "Mar 04, 2026" },
    { id: "review-2", rating: 4, date: "Mar 04, 2026" },
    { id: "review-3", rating: 3, date: "Mar 04, 2026" },
    { id: "review-4", rating: 4, date: "Mar 04, 2026" },
    { id: "review-5", rating: 3, date: "Mar 04, 2026" },
  ]

  return (
    <SafeAreaView style={styles.reviewScreen} edges={["top", "bottom"]}>
      <View style={styles.reviewHeader}>
        <Pressable
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.reviewBackButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={19} color="#777777" />
        </Pressable>
        <Text style={styles.reviewHeaderTitle}>Review</Text>
        <View style={styles.reviewHeaderSpacer} />
      </View>

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.reviewContent}
        showsVerticalScrollIndicator={false}
      >
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewCardHeader}>
              <View style={styles.reviewAuthorRow}>
                <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.reviewAvatar} resizeMode="cover" />
                <Text style={styles.reviewAuthor}>Jacky Lam</Text>
              </View>
              <View style={styles.reviewScoreRow} accessibilityLabel={`${review.rating} out of 5 stars`}>
                {Array.from({ length: review.rating }).map((_, index) => (
                  <MaterialCommunityIcons key={index} name="star" size={19} color="#222222" />
                ))}
                <Text style={styles.reviewScore}>{review.rating}</Text>
              </View>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
            <Text style={styles.reviewBody}>
              {`This is ${centre.name}! Our centre is designed to provide a stimulating and supportive environment where learners of all ages can engage.`}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function MemberProfileScreen({ navigation, route }: { navigation: any; route: any }) {
  const memberId = route.params?.memberId as MemberProfileId
  const member = MEMBER_PROFILES[memberId] || MEMBER_PROFILES.athena

  return (
    <SafeAreaView style={styles.memberProfileScreen} edges={["top", "bottom"]}>
      <View style={styles.memberProfileHeader}>
        <Pressable
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.memberProfileBackButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={18} color="#777777" />
        </Pressable>
        <Text style={styles.memberProfileHeaderTitle}>Member Profile</Text>
        <View style={styles.memberProfileHeaderSpacer} />
      </View>

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.memberProfileContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.memberProfileSummaryCard}>
          <View style={styles.memberProfileIdentityRow}>
            <Image source={{ uri: member.imageUri }} style={styles.memberProfileAvatar} resizeMode="cover" />
            <View style={styles.memberProfileIdentityCopy}>
              <View style={styles.memberProfileNameRow}>
                <Text style={styles.memberProfileName}>{member.name}</Text>
                <MaterialCommunityIcons
                  name={member.gender === "female" ? "gender-female" : "gender-male"}
                  size={16}
                  color="#0ABAB5"
                />
              </View>
              <Text style={styles.memberProfileTenure}>{member.tenure}</Text>
              <Text style={styles.memberProfileCentre}>{member.centre}</Text>
            </View>
          </View>
          <Text style={styles.memberProfileBio}>{member.bio}</Text>
        </View>

        <View style={styles.memberProfileSection}>
          <Text style={styles.memberProfileSectionTitle}>Skills</Text>
          <View style={styles.memberProfileSkillRow}>
            {member.skills.map((skill) => (
              <View key={skill} style={styles.memberProfileSkillChip}>
                <Text style={styles.memberProfileSkillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.memberProfileSection}>
          <Text style={styles.memberProfileSectionTitle}>Accreditation</Text>
          <View style={styles.memberProfileTimelineCard}>
            {member.accreditation.map((group) => (
              <View key={group.year} style={styles.memberProfileTimelineGroup}>
                <Text style={styles.memberProfileTimelineYear}>{group.year}</Text>
                <View style={styles.memberProfileTimelineRail}>
                  {group.entries.map((entry, index) => (
                    <View key={`${group.year}-${entry.subject}-${index}`} style={styles.memberProfileTimelineEntry}>
                      <View style={styles.memberProfileTimelineDot} />
                      <Text style={styles.memberProfileTimelineRole}>{entry.subject}</Text>
                      <Text style={styles.memberProfileTimelineDetail}>{entry.experience}</Text>
                      <Text style={styles.memberProfileTimelineMeta}>{entry.organisation}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.memberProfileSection}>
          <Text style={styles.memberProfileSectionTitle}>Experience</Text>
          <View style={styles.memberProfileTimelineCard}>
            {member.experience.map((entry) => (
              <View key={`${entry.year}-${entry.role}`} style={styles.memberProfileExperienceGroup}>
                <Text style={styles.memberProfileTimelineYear}>{entry.year}</Text>
                <View style={styles.memberProfileExperienceCopy}>
                  <Text style={styles.memberProfileTimelineRole}>{entry.role}</Text>
                  <Text style={styles.memberProfileTimelineDetail}>{entry.duration}</Text>
                  <Text style={styles.memberProfileTimelineMeta}>{entry.organisation}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.memberProfileDisclaimer}>
          Note: Coach profiles and experience data are self-claimed. ClassZ is not responsible for the accuracy of this information.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

type ScheduleView = "calendar" | "upcoming"

const SCHEDULE_CALENDAR_DAYS = [
  31, 30, 1, 2, 3, 4, 5,
  6, 7, 8, 9, 10, 11, 12,
  13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 1, 2, 3,
] as const

type TransactionRecord = {
  id: string
  title: string
  image: string
  child: string
  childImage: string
  completed: boolean
}

const TRANSACTIONS: TransactionRecord[] = [
  {
    id: "rising-star",
    title: "Rising Star Academic Program",
    image: FIGMA_ASSETS.main.recommend1,
    child: "Shelly Wong",
    childImage: FIGMA_ASSETS.reservation.coach,
    completed: false,
  },
  {
    id: "painting-current",
    title: "ClassZ Painting Program",
    image: FIGMA_ASSETS.main.recommend2,
    child: "Lucas Wong",
    childImage: FIGMA_ASSETS.reservation.child,
    completed: false,
  },
  {
    id: "painting-completed",
    title: "ClassZ Painting Program",
    image: FIGMA_ASSETS.main.recommend2,
    child: "Lucas Wong",
    childImage: FIGMA_ASSETS.reservation.child,
    completed: true,
  },
  {
    id: "guitar-completed-1",
    title: "ClassZ Guitar Program",
    image: FIGMA_ASSETS.reservation.program,
    child: "Charlie Wong",
    childImage: FIGMA_ASSETS.reservation.child,
    completed: true,
  },
  {
    id: "guitar-completed-2",
    title: "ClassZ Guitar Program",
    image: FIGMA_ASSETS.reservation.program,
    child: "Charlie Wong",
    childImage: FIGMA_ASSETS.reservation.child,
    completed: true,
  },
]

function CalendarTabScreen({ navigation, flowAppState }: { navigation: any; flowAppState: FlowAppState }) {
  const [view, setView] = useState<ScheduleView>("calendar")
  const [selectedScheduleChildId, setSelectedScheduleChildId] = useState<string | null>(null)
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false)
  const selectedStudent = flowAppState.students.find((item) => item.id === (selectedScheduleChildId || flowAppState.selectedStudentId)) || flowAppState.students[0]
  const selectedChild = BOOKING_CHILDREN.find((item) => item.id === selectedStudent.id) || BOOKING_CHILDREN[0]
  const showingAllChildren = selectedScheduleChildId === null
  const bookedProgram = flowAppState.bookings[0]
  const scheduleItems = [
    {
      id: "schedule-guitar-1",
      time: "10:00AM-01:00PM",
      date: "Sept 02",
      title: bookedProgram?.title || "ClassZ Guitar Program",
      lesson: "Lesson 1 of 8",
      child: "Charlie Wong",
      image: FIGMA_ASSETS.reservation.program,
      color: "#0ABAB5",
    },
    {
      id: "schedule-academic",
      time: "02:00PM-03:00PM",
      date: "Sept 02",
      title: "Rising Star Academic Program",
      lesson: "Lesson 1 of 8",
      child: "Shelly Wong",
      image: FIGMA_ASSETS.main.recommend1,
      color: "#F4AE00",
    },
    {
      id: "schedule-painting",
      time: "04:00PM-06:00PM",
      date: "Sept 02",
      title: "ClassZ Painting Program",
      lesson: "Lesson 1 of 8",
      child: "Lucas Wong",
      image: FIGMA_ASSETS.main.recommend2,
      color: "#E96E76",
    },
    {
      id: "schedule-painting-2",
      time: "04:00PM-06:00PM",
      date: "Sept 02",
      title: "ClassZ Painting Program",
      lesson: "Lesson 1 of 8",
      child: "Lucas Wong",
      image: FIGMA_ASSETS.main.recommend2,
      color: "#0ABAB5",
    },
  ]
  const childScheduleItems = [
    scheduleItems[0],
    {
      ...scheduleItems[2],
      id: "schedule-child-painting",
      child: selectedStudent.name,
      time: "04:00PM-06:00PM",
    },
  ]
  const upcomingChildItems = [
    { ...scheduleItems[0], id: "upcoming-1", date: "Sept 02", child: selectedStudent.name },
    { ...scheduleItems[0], id: "upcoming-2", date: "Oct 14", child: selectedStudent.name, lesson: "Lesson 1 of 8" },
    { ...scheduleItems[0], id: "upcoming-3", date: "Oct 23", child: selectedStudent.name, lesson: "Lesson 3 of 8" },
  ]
  const visibleItems = !showingAllChildren
    ? (view === "calendar" ? childScheduleItems : upcomingChildItems)
    : (view === "calendar" ? scheduleItems : scheduleItems.slice(0, 3))

  return (
    <SafeAreaView style={styles.scheduleScreen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.scheduleContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.scheduleTitle}>Schedule</Text>

        <View style={styles.scheduleScopeRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select child schedule"
            accessibilityState={{ expanded: scopeMenuOpen }}
            style={styles.scheduleScopeButton}
            onPress={() => setScopeMenuOpen((open) => !open)}
          >
            {showingAllChildren ? (
              <View style={styles.scheduleAllAvatars}>
                {[FIGMA_ASSETS.reservation.child, FIGMA_ASSETS.reservation.coach, FIGMA_ASSETS.reservation.child].map((image, index) => (
                  <Image
                    key={`all-child-${index}`}
                    source={{ uri: image }}
                    style={[styles.scheduleScopeAvatar, index > 0 ? styles.scheduleScopeAvatarOverlap : null]}
                    resizeMode="cover"
                  />
                ))}
          </View>
            ) : (
              <Image source={{ uri: selectedChild.image }} style={styles.scheduleScopeAvatar} resizeMode="cover" />
            )}
            <Text style={styles.scheduleScopeText}>{showingAllChildren ? "All" : selectedStudent.name}</Text>
            <Feather name={scopeMenuOpen ? "chevron-up" : "chevron-down"} size={20} color="#333333" />
          </Pressable>
          {view === "upcoming" ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.navigate("TransactionsApp")}
            >
              <Text style={styles.scheduleTransactions}>Transactions</Text>
            </Pressable>
          ) : null}
        </View>

        {scopeMenuOpen ? (
          <View style={styles.scheduleScopeMenu}>
            <Pressable
              accessibilityRole="menuitem"
              style={styles.scheduleScopeMenuItem}
              onPress={() => {
                setSelectedScheduleChildId(null)
                setScopeMenuOpen(false)
              }}
            >
              <View style={styles.scheduleScopeMenuAllAvatars}>
                {[FIGMA_ASSETS.reservation.child, FIGMA_ASSETS.reservation.coach, FIGMA_ASSETS.reservation.child].map((image, index) => (
                  <Image
                    key={`menu-all-child-${index}`}
                    source={{ uri: image }}
                    style={[styles.scheduleScopeMenuAvatar, index > 0 ? styles.scheduleScopeMenuAvatarOverlap : null]}
                    resizeMode="cover"
                  />
                ))}
              </View>
              <Text style={styles.scheduleScopeMenuName}>All</Text>
              {showingAllChildren ? <Feather name="check" size={18} color="#0ABAB5" /> : null}
            </Pressable>
            {BOOKING_CHILDREN.map((child) => (
              <Pressable
                key={child.id}
                accessibilityRole="menuitem"
                style={styles.scheduleScopeMenuItem}
                onPress={() => {
                  setSelectedScheduleChildId(child.id)
                  setScopeMenuOpen(false)
                }}
              >
                <Image source={{ uri: child.image }} style={styles.scheduleScopeMenuSingleAvatar} resizeMode="cover" />
                <Text style={styles.scheduleScopeMenuName}>{child.name}</Text>
                {selectedScheduleChildId === child.id ? <Feather name="check" size={18} color="#0ABAB5" /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.scheduleSegment}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: view === "calendar" }}
            style={[styles.scheduleSegmentButton, view === "calendar" ? styles.scheduleSegmentButtonActive : null]}
            onPress={() => setView("calendar")}
          >
            <Text style={styles.scheduleSegmentText}>Calendar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: view === "upcoming" }}
            style={[styles.scheduleSegmentButton, view === "upcoming" ? styles.scheduleSegmentButtonActive : null]}
            onPress={() => setView("upcoming")}
          >
            <Text style={styles.scheduleSegmentText}>Upcoming</Text>
          </Pressable>
        </View>

        {view === "calendar" ? (
          <View style={styles.scheduleCalendarCard}>
            <View style={styles.scheduleCalendarHeader}>
              <Pressable accessibilityLabel="Previous month" style={styles.scheduleMonthButton}>
                <Feather name="chevron-left" size={18} color="#777777" />
              </Pressable>
              <View style={styles.scheduleMonthTitleWrap}>
                <Text style={styles.scheduleMonthTitle}>September</Text>
                <Text style={styles.scheduleMonthYear}>2026</Text>
              </View>
              <Pressable accessibilityLabel="Next month" style={styles.scheduleMonthButton}>
                <Feather name="chevron-right" size={18} color="#777777" />
              </Pressable>
            </View>
            <View style={styles.scheduleWeekRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <Text key={day} style={styles.scheduleWeekDay}>{day}</Text>
              ))}
            </View>
            <View style={styles.scheduleCalendarGrid}>
              {SCHEDULE_CALENDAR_DAYS.map((day, index) => {
                const outsideMonth = index < 2 || index > 31
                const selected = day === 2 && index < 10
                const hasEvent = [3, 6, 8, 10, 16, 18, 23, 25, 29, 31].includes(index)
                return (
                  <View key={`${day}-${index}`} style={styles.scheduleDayCell}>
                    <View style={[styles.scheduleDayNumberWrap, selected ? styles.scheduleDaySelected : null]}>
                      <Text style={[
                        styles.scheduleDayNumber,
                        outsideMonth ? styles.scheduleDayOutside : null,
                        selected ? styles.scheduleDayNumberSelected : null,
                      ]}>
                        {day}
            </Text>
          </View>
                    {hasEvent ? <View style={styles.scheduleDayDot} /> : null}
        </View>
                )
              })}
            </View>
          </View>
        ) : (
          <Pressable accessibilityRole="button" style={styles.scheduleViewAll}>
            <Text style={styles.scheduleViewAllText}>View All</Text>
          </Pressable>
        )}

        <View style={styles.scheduleList}>
          {visibleItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.scheduleCard}
              onPress={() => navigation.navigate("ScheduleClassDetailApp", {
                title: item.title,
                time: item.time,
                date: item.date,
                lesson: item.lesson,
                image: item.image,
                color: item.color,
                child: item.child,
              })}
            >
              <View style={styles.scheduleCardTimeRow}>
                <View style={[styles.scheduleCardDot, { backgroundColor: item.color }]} />
                <Text style={styles.scheduleCardTime}>{item.time} · {item.date}</Text>
              </View>
              <View style={styles.scheduleCardMain}>
                <Image source={{ uri: item.image }} style={styles.scheduleCardImage} resizeMode="cover" />
                <View style={styles.scheduleCardCopy}>
                  <Text style={styles.scheduleCardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.scheduleCardLesson}>{item.lesson}</Text>
                  <View style={styles.scheduleCardChildRow}>
                    <Image source={{ uri: item.child === "Charlie Wong" || item.child === selectedStudent.name ? selectedChild.image : FIGMA_ASSETS.reservation.child }} style={styles.scheduleCardChildAvatar} resizeMode="cover" />
                    <Text style={styles.scheduleCardChildName}>{item.child}</Text>
                  </View>
                  <Text style={styles.scheduleCardCentre} numberOfLines={2}>ClassZ Playgroup Bright Kids Drawing Centre</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function TransactionsScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Transactions" />
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.transactionsContent}
        showsVerticalScrollIndicator={false}
      >
        {TRANSACTIONS.map((transaction) => (
          <Pressable
            key={transaction.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${transaction.title} transaction`}
            style={({ pressed }) => [styles.transactionCard, pressed ? styles.transactionCardPressed : null]}
            onPress={() => navigation.navigate(
              transaction.completed ? "CompletedClassDetailApp" : "TransactionDetailApp",
              { transactionId: transaction.id },
            )}
          >
            <View style={styles.transactionTitleRow}>
              <Text style={styles.transactionTitle} numberOfLines={1}>{transaction.title}</Text>
              {transaction.completed ? <Text style={styles.transactionCompleted}>Completed</Text> : null}
            </View>
            <View style={styles.transactionMainRow}>
              <Image source={{ uri: transaction.image }} style={styles.transactionImage} resizeMode="cover" />
              <View style={styles.transactionCopy}>
                <Text style={styles.transactionSchedule}>8 lessons · Oct 23 - Nov 28</Text>
                <View style={styles.transactionChildRow}>
                  <Image source={{ uri: transaction.childImage }} style={styles.transactionChildImage} resizeMode="cover" />
                  <Text style={styles.transactionChildName}>{transaction.child}</Text>
                </View>
                <View style={styles.transactionCentreRow}>
                  <Feather name="map-pin" size={13} color="#8A8A8A" />
                  <Text style={styles.transactionCentre} numberOfLines={2}>ClassZ Playgroup Bright Kids Drawing Centre</Text>
                </View>
                <Text style={styles.transactionTotal}>$2,392 <Text style={styles.transactionTotalLabel}>total</Text></Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function TransactionDetailScreen({
  navigation,
  route,
  flowAppState,
}: {
  navigation: any
  route: { params: { transactionId: string } }
  flowAppState: FlowAppState
}) {
  const transaction = TRANSACTIONS.find((item) => item.id === route.params.transactionId) || TRANSACTIONS[0]
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId) || flowAppState.centres[0]
  const [datesExpanded, setDatesExpanded] = useState(true)
  const lessonDates = buildLessonDates(0)

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Transaction Detail" />
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.transactionDetailContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.transactionDetailProgramCard}>
          <Image source={{ uri: transaction.image }} style={styles.transactionDetailProgramImage} resizeMode="cover" />
          <View style={styles.transactionDetailProgramCopy}>
            <Text style={styles.transactionDetailProgramTitle}>{transaction.title}</Text>
            <View style={styles.confirmedMetaRow}>
              <Feather name="globe" size={14} color="#777777" />
              <Text style={styles.confirmedMetaText}>Cantonese</Text>
            </View>
            <View style={styles.confirmedMetaRow}>
              <Feather name="map-pin" size={14} color="#777777" />
              <Text style={styles.confirmedMetaText}>Shop 1B, Class Mall, Central, Hong Kong</Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionDetailSection}>
          <Text style={styles.transactionDetailSectionTitle}>Hosted by</Text>
          <View style={styles.transactionDetailPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.transactionDetailAvatar} resizeMode="cover" />
            <Text style={styles.transactionDetailPersonNameFill}>{centre.detailName || centre.name}</Text>
            <View style={styles.confirmedRating}>
              <MaterialCommunityIcons name="star" size={16} color="#222222" />
              <Text style={styles.confirmedRatingText}>{centre.rating.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.transactionDetailPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.transactionDetailAvatar} resizeMode="cover" />
            <View style={styles.transactionDetailPersonCopy}>
              <Text style={styles.transactionDetailPersonName}>Athena Yeung</Text>
              <Text style={styles.transactionDetailPersonRole}>Program Coach</Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionDetailDivider} />

        <View style={styles.transactionDetailSection}>
          <Text style={styles.transactionDetailSectionTitle}>Booking for</Text>
          <View style={styles.transactionDetailPersonRow}>
            <Image source={{ uri: transaction.childImage }} style={styles.transactionDetailAvatar} resizeMode="cover" />
            <Text style={styles.transactionDetailPersonNameFill}>{transaction.child}</Text>
          </View>
        </View>

        <View style={styles.transactionDetailDivider} />

        <View style={styles.transactionDetailCard}>
          <View style={styles.transactionDetailDatesHeader}>
            <Text style={styles.transactionDetailScheduleTitle}>8 lessons · Oct 23 - Nov 28</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: datesExpanded }}
              style={styles.transactionDetailDatesToggle}
              onPress={() => setDatesExpanded((expanded) => !expanded)}
            >
              <Text style={styles.transactionDetailDatesToggleText}>{datesExpanded ? "Hide full dates" : "Show full dates"}</Text>
              <Feather name={datesExpanded ? "chevron-up" : "chevron-down"} size={14} color="#777777" />
            </Pressable>
          </View>
          {datesExpanded ? (
            <View style={styles.transactionDetailLessonList}>
              <Text style={styles.transactionDetailLessonHeading}>Lesson dates</Text>
              <LessonDateRows dates={lessonDates} />
          </View>
        ) : null}
          </View>

        <View style={styles.transactionDetailCard}>
          <Text style={styles.transactionDetailSectionTitle}>Payment Breakdown</Text>
          <Text style={styles.transactionProtection}>
            Your booking is protected by <ZCareWord style={styles.transactionProtectionBrand} />
          </Text>
          <View style={styles.transactionPaymentRow}>
            <Text style={styles.transactionPaymentLabel}>299 x 8 lessons</Text>
            <Text style={styles.transactionPaymentValue}>$2,392</Text>
          </View>
          <View style={styles.transactionPaymentRow}>
            <Text style={styles.transactionPaymentLabel}>Limited discount</Text>
            <Text style={styles.transactionPaymentDiscount}>-$800</Text>
          </View>
          <View style={styles.transactionPaymentRow}>
            <Text style={styles.transactionLoyalty}>ⓘ LOYAL2026</Text>
            <Text style={styles.transactionPaymentDiscount}>-$15</Text>
          </View>
          <View style={styles.transactionPaymentRow}>
            <Text style={styles.transactionPaymentLabel}>Platform fee</Text>
            <Text style={styles.transactionPaymentValue}>$5</Text>
          </View>
          <View style={styles.transactionPaymentDivider} />
          <View style={styles.transactionPaymentRow}>
            <Text style={styles.transactionPaymentTotal}>Total (HKD)</Text>
            <Text style={styles.transactionPaymentTotal}>$3,182</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.classDetailBottomNav}>
        {(["Home", "Search", "Calendar", "Analytics"] as const).map((screen) => (
          <Pressable key={screen} style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen })}>
            <Image
              source={NAV_ICONS[screen]}
              style={[styles.realTabIcon, { tintColor: screen === "Analytics" ? "#0ABAB5" : "#8A8A8A" }]}
            />
          </Pressable>
        ))}
        <Pressable style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })}>
          <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.profileTabAvatar} resizeMode="cover" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function CompletedClassDetailScreen({
  navigation,
  route,
  flowAppState,
}: {
  navigation: any
  route: { params: { transactionId: string } }
  flowAppState: FlowAppState
}) {
  const transaction = TRANSACTIONS.find((item) => item.id === route.params.transactionId) || TRANSACTIONS[3]
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId) || flowAppState.centres[0]
  const [rating, setRating] = useState(4)
  const [review, setReview] = useState("")

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Class Detail" />
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.completedClassContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.classDetailProgramCard}>
            <View style={styles.scheduleCardTimeRow}>
              <View style={[styles.scheduleCardDot, { backgroundColor: "#0ABAB5" }]} />
              <Text style={styles.classDetailTime}>10:00AM-01:00PM · Sept 02</Text>
            </View>
            <View style={styles.classDetailProgramRow}>
              <Image source={{ uri: transaction.image }} style={styles.classDetailProgramImage} resizeMode="cover" />
              <View style={styles.classDetailProgramCopy}>
                <Text style={styles.classDetailProgramTitle}>{transaction.title}</Text>
                <Text style={styles.classDetailLesson}>Lesson 1 of 8</Text>
                <View style={styles.confirmedMetaRow}>
                  <Feather name="globe" size={14} color="#777777" />
                  <Text style={styles.confirmedMetaText}>Cantonese</Text>
                </View>
                <View style={styles.confirmedMetaRow}>
                  <Feather name="map-pin" size={14} color="#777777" />
                  <Text style={styles.confirmedMetaText}>Shop 1B, Class Mall, Central, Hong Kong</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.transactionDetailDivider} />

          <View style={styles.completedRatingSection}>
            <Text style={styles.completedRatingTitle}>Rate this program</Text>
            <Text style={styles.completedRatingHint}>Share your feedback to help us improve future lessons</Text>
            <View style={styles.completedStarsRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} star rating`}
                  accessibilityState={{ selected: rating === value }}
                  hitSlop={6}
                  onPress={() => setRating(value)}
                >
                  <MaterialCommunityIcons
                    name={value <= rating ? "star" : "star-outline"}
                    size={38}
                    color="#222222"
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.completedReviewInput}
              placeholder="Review (optional)"
              placeholderTextColor="#B7B7B7"
              value={review}
              onChangeText={setReview}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              accessibilityRole="button"
              style={styles.completedRateButton}
              onPress={() => Alert.alert("Thank you", `Your ${rating}-star review has been submitted.`)}
            >
              <Text style={styles.completedRateButtonText}>Rate</Text>
            </Pressable>
          </View>

          <View style={styles.transactionDetailDivider} />

          <View style={styles.classDetailSection}>
            <Text style={styles.classDetailSectionTitle}>Hosted by</Text>
            <View style={styles.classDetailPersonRow}>
              <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.classDetailAvatar} resizeMode="cover" />
              <Text style={styles.classDetailPersonNameFill}>{centre.detailName || centre.name}</Text>
              <View style={styles.confirmedRating}>
                <MaterialCommunityIcons name="star" size={16} color="#222222" />
                <Text style={styles.confirmedRatingText}>{centre.rating.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.classDetailPersonRow}>
              <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.classDetailAvatar} resizeMode="cover" />
              <View style={styles.classDetailPersonCopy}>
                <Text style={styles.classDetailPersonName}>Athena Yeung</Text>
                <Text style={styles.classDetailPersonRole}>Program Coach</Text>
              </View>
            </View>
          </View>

          <View style={styles.transactionDetailDivider} />

          <View style={styles.classDetailSection}>
            <Text style={styles.classDetailSectionTitle}>Booking for</Text>
            <View style={styles.classDetailPersonRow}>
              <Image source={{ uri: transaction.childImage }} style={styles.classDetailAvatar} resizeMode="cover" />
              <Text style={styles.classDetailPersonNameFill}>{transaction.child}</Text>
            </View>
          </View>

          <View style={styles.transactionDetailDivider} />

          <Text style={styles.classDetailFinePrint}>
            <ZCareWord style={styles.reservationFineBrand} />{" "}helps protect your ClassZ booking by supporting class records, photos, coach feedback, and service-related issues under platform policy.{" "}
            <Text style={styles.reservationLearnMore}>Learn More</Text>
          </Text>

          <View style={styles.transactionDetailDivider} />

          <Text style={styles.classDetailFinePrint}>
            You agreed to our <Text style={styles.reservationLink}>Cancellation Policy</Text>,{" "}
            <Text style={styles.reservationLink}>Refund Policy</Text> and{" "}
            <Text style={styles.reservationLink}>Terms and Conditions</Text>. Confirmed bookings are non-refundable, including sickness or absence. Direct centre arrangements may not be covered by <ZCareWord /> or ClassZ Passport.
          </Text>
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.classDetailBottomNav}>
        {(["Home", "Search", "Calendar", "Analytics"] as const).map((screen) => (
          <Pressable key={screen} style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen })}>
            <Image
              source={NAV_ICONS[screen]}
              style={[styles.realTabIcon, { tintColor: screen === "Analytics" ? "#0ABAB5" : "#8A8A8A" }]}
            />
          </Pressable>
        ))}
        <Pressable style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })}>
          <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.profileTabAvatar} resizeMode="cover" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function ScheduleClassDetailScreen({
  navigation,
  route,
  flowAppState,
}: {
  navigation: any
  route: { params: ScheduleClassDetailRouteParams }
  flowAppState: FlowAppState
}) {
  const { title, time, date, lesson, image, color, child } = route.params
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId) || flowAppState.centres[0]
  const bookingChild = BOOKING_CHILDREN.find((item) => item.name === child) || BOOKING_CHILDREN[0]

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Class Detail" />
      <ScrollView style={styles.page} contentContainerStyle={styles.classDetailContent} showsVerticalScrollIndicator={false}>
        <View style={styles.classDetailProgramCard}>
          <View style={styles.scheduleCardTimeRow}>
            <View style={[styles.scheduleCardDot, { backgroundColor: color }]} />
            <Text style={styles.classDetailTime}>{time} · {date}</Text>
          </View>
          <View style={styles.classDetailProgramRow}>
            <Image source={{ uri: image }} style={styles.classDetailProgramImage} resizeMode="cover" />
            <View style={styles.classDetailProgramCopy}>
              <Text style={styles.classDetailProgramTitle}>{title}</Text>
              <Text style={styles.classDetailLesson}>{lesson}</Text>
              <View style={styles.confirmedMetaRow}>
                <Feather name="globe" size={14} color="#777777" />
                <Text style={styles.confirmedMetaText}>Cantonese</Text>
          </View>
              <View style={styles.confirmedMetaRow}>
                <Feather name="map-pin" size={14} color="#777777" />
                <Text style={styles.confirmedMetaText}>Shop 1B, Class Mall, Central, Hong Kong</Text>
        </View>
            </View>
          </View>
        </View>

        <View style={styles.classDetailVerification}>
          <Text style={styles.classDetailVerificationHint}>Share this code or QR with your child to check in</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.classDetailVerificationButton}
            onPress={() => navigation.navigate("VerificationCodeApp", route.params)}
          >
            <Text style={styles.classDetailVerificationText}>Verification code</Text>
          </Pressable>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.classDetailSection}>
          <Text style={styles.classDetailSectionTitle}>Hosted by</Text>
          <View style={styles.classDetailPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.classDetailAvatar} resizeMode="cover" />
            <Text style={styles.classDetailPersonNameFill}>{centre.detailName || centre.name}</Text>
            <View style={styles.confirmedRating}>
              <MaterialCommunityIcons name="star" size={16} color="#222222" />
              <Text style={styles.confirmedRatingText}>{centre.rating.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.classDetailPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.classDetailAvatar} resizeMode="cover" />
            <View style={styles.classDetailPersonCopy}>
              <Text style={styles.classDetailPersonName}>Athena Yeung</Text>
              <Text style={styles.classDetailPersonRole}>Program Coach</Text>
            </View>
          </View>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.classDetailSection}>
          <Text style={styles.classDetailSectionTitle}>Booking for</Text>
          <View style={styles.classDetailPersonRow}>
            <Image source={{ uri: bookingChild.image }} style={styles.classDetailAvatar} resizeMode="cover" />
            <Text style={styles.classDetailPersonNameFill}>{child}</Text>
          </View>
        </View>

        <View style={styles.reservationDivider} />

        <Text style={styles.classDetailFinePrint}>
          <ZCareWord style={styles.reservationFineBrand} />
          {" "}helps protect your ClassZ booking by supporting class records, photos, coach feedback, and service-related issues under platform policy.{" "}
          <Text style={styles.reservationLearnMore}>Learn More</Text>
        </Text>

        <View style={styles.reservationDivider} />

        <Text style={styles.classDetailFinePrint}>
          You agreed to our <Text style={styles.reservationLink}>Cancellation Policy</Text>,{" "}
          <Text style={styles.reservationLink}>Refund Policy</Text> and{" "}
          <Text style={styles.reservationLink}>Terms and Conditions</Text>. Confirmed bookings are non-refundable, including sickness or absence. Direct centre arrangements may not be covered by <ZCareWord /> or ClassZ Passport.
        </Text>
      </ScrollView>

      <View style={styles.classDetailBottomNav}>
        {([
          ["Home", "Home"],
          ["Search", "Search"],
          ["Calendar", "Calendar"],
          ["Analytics", "Analytics"],
        ] as const).map(([screen, key]) => (
          <Pressable key={screen} style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen })}>
            <Image
              source={NAV_ICONS[key]}
              style={[styles.realTabIcon, { tintColor: screen === "Analytics" ? "#0ABAB5" : "#8A8A8A" }]}
            />
          </Pressable>
        ))}
        <Pressable style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })}>
          <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.profileTabAvatar} resizeMode="cover" />
          </Pressable>
        </View>
    </SafeAreaView>
  )
}

const QR_GRID_SIZE = 21

function qrCellFilled(row: number, column: number): boolean {
  const finderOrigins = [[0, 0], [0, QR_GRID_SIZE - 7], [QR_GRID_SIZE - 7, 0]]
  for (const [originRow, originColumn] of finderOrigins) {
    const localRow = row - originRow
    const localColumn = column - originColumn
    if (localRow >= 0 && localRow < 7 && localColumn >= 0 && localColumn < 7) {
      return localRow === 0 || localRow === 6 || localColumn === 0 || localColumn === 6
        || (localRow >= 2 && localRow <= 4 && localColumn >= 2 && localColumn <= 4)
    }
  }
  return (row * 11 + column * 7 + row * column * 3) % 13 < 6
}

function VerificationQrCode({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Confirm attendance with QR code"
      style={styles.verificationQr}
      onPress={onConfirm}
    >
      {Array.from({ length: QR_GRID_SIZE * QR_GRID_SIZE }).map((_, index) => {
        const row = Math.floor(index / QR_GRID_SIZE)
        const column = index % QR_GRID_SIZE
        return (
          <View
            key={index}
            style={[styles.verificationQrCell, qrCellFilled(row, column) ? styles.verificationQrCellFilled : null]}
          />
        )
      })}
    </Pressable>
  )
}

function VerificationCodeScreen({
  navigation,
  route,
}: {
  navigation: any
  route: { params: ScheduleClassDetailRouteParams }
}) {
  const params = route.params
  const confirmAttendance = () => navigation.replace("AttendanceConfirmedApp", params)

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Verification Code" />
      <ScrollView style={styles.page} contentContainerStyle={styles.verificationContent} showsVerticalScrollIndicator={false}>
        <View style={styles.verificationProgramCard}>
          <View style={styles.scheduleCardTimeRow}>
            <View style={[styles.scheduleCardDot, { backgroundColor: params.color }]} />
            <Text style={styles.classDetailTime}>{params.time} · {params.date}</Text>
          </View>
          <View style={styles.classDetailProgramRow}>
            <Image source={{ uri: params.image }} style={styles.verificationProgramImage} resizeMode="cover" />
            <View style={styles.classDetailProgramCopy}>
              <Text style={styles.classDetailProgramTitle}>{params.title}</Text>
              <Text style={styles.classDetailLesson}>{params.lesson}</Text>
              <View style={styles.confirmedMetaRow}>
                <Feather name="globe" size={13} color="#777777" />
                <Text style={styles.confirmedMetaText}>Cantonese</Text>
              </View>
              <View style={styles.confirmedMetaRow}>
                <Feather name="map-pin" size={13} color="#777777" />
                <Text style={styles.confirmedMetaText}>Shop 1B, Class Mall, Central, Hong Kong</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.verificationReady}>
          <Text style={styles.verificationReadyTitle}>Ready for class?</Text>
          <Text style={styles.verificationReadyText}>Have your code or QR code ready for the coach</Text>
        </View>

        <View style={styles.reservationDivider} />

        <Text style={styles.verificationSectionTitle}>Class code</Text>
        <Pressable accessibilityRole="button" style={styles.verificationCodeRow} onPress={confirmAttendance}>
          {["1", "1", "1", "1"].map((digit, index) => (
            <View key={`${digit}-${index}`} style={styles.verificationCodeBox}>
              <Text style={styles.verificationCodeDigit}>{digit}</Text>
            </View>
          ))}
        </Pressable>

        <View style={styles.reservationDivider} />

        <Text style={styles.verificationSectionTitle}>QR code</Text>
        <VerificationQrCode onConfirm={confirmAttendance} />

        <View style={styles.reservationDivider} />

        <Text style={styles.classDetailFinePrint}>
          <ZCareWord style={styles.reservationFineBrand} />
          {" "}helps protect your ClassZ booking by supporting class records, photos, coach feedback, and service-related issues under platform policy.{" "}
          <Text style={styles.reservationLearnMore}>Learn More</Text>
        </Text>

        <View style={styles.reservationDivider} />

        <Text style={styles.classDetailFinePrint}>
          You agreed to our <Text style={styles.reservationLink}>Cancellation Policy</Text>,{" "}
          <Text style={styles.reservationLink}>Refund Policy</Text> and{" "}
          <Text style={styles.reservationLink}>Terms and Conditions</Text>. Confirmed bookings are non-refundable, including sickness or absence.
        </Text>
      </ScrollView>

      <View style={styles.classDetailBottomNav}>
        {(["Home", "Search", "Calendar", "Analytics"] as const).map((screen) => (
          <Pressable key={screen} style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen })}>
            <Image
              source={NAV_ICONS[screen]}
              style={[styles.realTabIcon, { tintColor: screen === "Analytics" ? "#0ABAB5" : "#8A8A8A" }]}
            />
          </Pressable>
        ))}
        <Pressable style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })}>
          <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.profileTabAvatar} resizeMode="cover" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function AttendanceConfirmedScreen({
  navigation,
  route,
  flowAppState,
}: {
  navigation: any
  route: { params: ScheduleClassDetailRouteParams }
  flowAppState: FlowAppState
}) {
  const params = route.params
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId) || flowAppState.centres[0]
  const bookingChild = BOOKING_CHILDREN.find((item) => item.name === params.child) || BOOKING_CHILDREN[0]

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.attendanceContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        contentInsetAdjustmentBehavior="automatic"
      >
        <Pressable
          accessibilityLabel="Close attendance confirmation"
          hitSlop={10}
          style={styles.confirmedCloseButton}
          onPress={() => navigation.navigate("AppTabs", { screen: "Calendar" })}
        >
          <Feather name="x" size={18} color="#8A8A8A" />
        </Pressable>

        <View style={styles.confirmedDivider} />

        <Text style={styles.attendanceTitle}>Attendance has been confirmed{"\n"}successfully!</Text>

        <View style={styles.verificationProgramCard}>
          <View style={styles.scheduleCardTimeRow}>
            <View style={[styles.scheduleCardDot, { backgroundColor: params.color }]} />
            <Text style={styles.classDetailTime}>{params.time} · {params.date}</Text>
          </View>
          <View style={styles.classDetailProgramRow}>
            <Image source={{ uri: params.image }} style={styles.attendanceProgramImage} resizeMode="cover" />
            <View style={styles.classDetailProgramCopy}>
              <Text style={styles.classDetailProgramTitle}>{params.title}</Text>
              <Text style={styles.classDetailLesson}>{params.lesson}</Text>
              <View style={styles.confirmedMetaRow}>
                <Feather name="globe" size={13} color="#777777" />
                <Text style={styles.confirmedMetaText}>Cantonese</Text>
              </View>
              <View style={styles.confirmedMetaRow}>
                <Feather name="map-pin" size={13} color="#777777" />
                <Text style={styles.confirmedMetaText}>Shop 1B, Class Mall, Central, Hong Kong</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.classDetailSection}>
          <Text style={styles.classDetailSectionTitle}>Hosted by</Text>
          <View style={styles.classDetailPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.classDetailAvatar} resizeMode="cover" />
            <Text style={styles.classDetailPersonNameFill}>{centre.detailName || centre.name}</Text>
            <View style={styles.confirmedRating}>
              <MaterialCommunityIcons name="star" size={16} color="#222222" />
              <Text style={styles.confirmedRatingText}>{centre.rating.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.classDetailPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.classDetailAvatar} resizeMode="cover" />
            <View style={styles.classDetailPersonCopy}>
              <Text style={styles.classDetailPersonName}>Athena Yeung</Text>
              <Text style={styles.classDetailPersonRole}>Program Coach</Text>
            </View>
          </View>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.classDetailSection}>
          <Text style={styles.classDetailSectionTitle}>Booking for</Text>
          <View style={styles.classDetailPersonRow}>
            <Image source={{ uri: bookingChild.image }} style={styles.classDetailAvatar} resizeMode="cover" />
            <Text style={styles.classDetailPersonNameFill}>{params.child}</Text>
          </View>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.attendanceFooter}>
          <Text style={styles.attendanceFeedback}>Feedback arriving within 7 days</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.classDetailVerificationButton}
            onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })}
          >
            <Text style={styles.classDetailVerificationText}>Go to ClassZ Passport</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const PASSPORT_CARD_ART = {
  companion: require("./assets/figma/analytics/passport-companion.png"),
  academic: require("./assets/figma/analytics/passport-academic.png"),
  activity: require("./assets/figma/analytics/passport-activity.png"),
} as const

function AnalyticsChildIdentity({ flowAppState, showLevel }: { flowAppState: FlowAppState; showLevel: boolean }) {
  const selectedStudent = flowAppState.students.find((student) => student.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const child = BOOKING_CHILDREN.find((item) => item.id === selectedStudent.id) || BOOKING_CHILDREN[0]
  return (
    <View style={styles.analyticsChildIdentity}>
      <Image source={{ uri: child.image }} style={styles.analyticsChildAvatar} resizeMode="cover" />
      <View style={styles.analyticsChildCopy}>
        <Text style={styles.analyticsChildName}>{selectedStudent.name}</Text>
        <View style={styles.analyticsChildMetaRow}>
          <MaterialCommunityIcons name="gender-male" size={14} color="#0ABAB5" />
          <Text style={styles.analyticsChildMeta}>Age {child.age}</Text>
          {showLevel ? (
            <View style={styles.analyticsLevelBadge}>
              <Text style={styles.analyticsLevelText}>{child.level}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function AnalyticsBottomNavigation({ navigation }: { navigation: any }) {
  return (
    <View style={styles.analyticsBottomNav}>
      {(["Home", "Search", "Calendar", "Analytics"] as const).map((screen) => (
        <Pressable
          key={screen}
          accessibilityRole="button"
          accessibilityLabel={`Open ${screen}`}
          style={styles.favouriteBottomNavItem}
          onPress={() => navigation.navigate("AppTabs", { screen })}
        >
          <Image
            source={NAV_ICONS[screen]}
            style={[styles.realTabIcon, { tintColor: screen === "Analytics" ? "#0ABAB5" : "#9A9A9A" }]}
          />
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Profile"
        style={styles.favouriteBottomNavItem}
        onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })}
      >
        <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.profileTabAvatar} resizeMode="cover" />
      </Pressable>
    </View>
  )
}

function AnalyticsTabScreen({
  navigation,
  flowAppState,
}: {
  navigation: any
  flowAppState: FlowAppState
}) {
  const selectedStudent = flowAppState.students.find((student) => student.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const selectedChild = BOOKING_CHILDREN.find((child) => child.id === selectedStudent.id) || BOOKING_CHILDREN[0]

  return (
    <SafeAreaView style={styles.analyticsScreen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.analyticsPassportContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.analyticsWordmark}>
          <Text style={styles.analyticsWordmarkZ}>z</Text>passport
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Switch child"
          style={styles.analyticsPassportChild}
          onPress={() => navigation.navigate("SelectChildApp")}
        >
          <Image source={{ uri: selectedChild.image }} style={styles.analyticsPassportAvatar} resizeMode="cover" />
          <View style={styles.analyticsPassportNameRow}>
            <Text style={styles.analyticsPassportName}>{selectedStudent.name}</Text>
            <Feather name="chevron-down" size={16} color="#222222" />
          </View>
          <View style={styles.analyticsPassportMetaRow}>
            <MaterialCommunityIcons name="gender-male" size={14} color="#0ABAB5" />
            <Text style={styles.analyticsPassportMeta}>Age {selectedChild.age}</Text>
            <View style={styles.analyticsLevelBadge}>
              <Text style={styles.analyticsLevelText}>{selectedChild.level}</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.passportMenuPanel}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Learning Companion"
            style={styles.passportCompanionCard}
            onPress={() => navigation.navigate("CompanionApp")}
          >
            <Image source={PASSPORT_CARD_ART.companion} style={styles.passportCompanionArt} resizeMode="contain" />
            <Text style={styles.passportMenuCardTitle}>Learning Companion</Text>
          </Pressable>

          <View style={styles.passportDashboardRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Academic Dashboard"
              style={styles.passportDashboardCard}
              onPress={() => navigation.navigate("AcademicDashboardApp")}
            >
              <Image source={PASSPORT_CARD_ART.academic} style={styles.passportDashboardArt} resizeMode="contain" />
              <Text style={styles.passportMenuCardTitle}>Academic{"\n"}Dashboard</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Activity Dashboard"
              style={styles.passportDashboardCard}
              onPress={() => navigation.navigate("ActivityDashboardApp")}
            >
              <Image source={PASSPORT_CARD_ART.activity} style={styles.passportDashboardArt} resizeMode="contain" />
              <Text style={styles.passportMenuCardTitle}>Activity{"\n"}Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

type AnalyticsDashboardMode = "academic" | "activity"

const DASHBOARD_ART = {
  academic: {
    hero: require("./assets/figma/analytics/academic-apple.png"),
    recordIcon: require("./assets/figma/analytics/academic-folder-icon.png"),
    programIcon: require("./assets/figma/analytics/academic-planner-icon.png"),
    records: require("./assets/figma/analytics/academic-records.png"),
    action: require("./assets/figma/analytics/academic-work-samples.png"),
  },
  activity: {
    hero: require("./assets/figma/analytics/activity-trophy.png"),
    recordIcon: require("./assets/figma/analytics/academic-folder-icon.png"),
    programIcon: require("./assets/figma/analytics/academic-planner-icon.png"),
    records: require("./assets/figma/analytics/activity-records.png"),
    action: require("./assets/figma/analytics/activity-moments.png"),
  },
} as const

const DASHBOARD_COPY = {
  academic: {
    title: "Academic Dashboard",
    badge: "Early observations",
    badgeStyle: "teal" as const,
    summary:
      "Charlie generally approaches activities with good persistence and is increasingly willing to stay with a task when it becomes challenging. He is more confident with familiar activities, while new techniques can still require some guidance",
    unlock: "More details will be unlocked after 5 records",
    recordCount: 8,
    recordLabel: "Total academic record",
    programCount: 32,
    programLabel: "Total academic program",
    recordTitle: "Academic Record",
    rows: [
      { name: "S3 Maths Class", date: "Updated 12 May 2025" },
      { name: "S3 Chinese Class", date: "Updated 11 May 2025" },
      { name: "Advance English Speaking", date: "Updated 09 May 2025" },
    ],
    actionTitle: "Work Samples",
  },
  activity: {
    title: "Activity Dashboard",
    badge: "Consistent pattern",
    badgeStyle: "amber" as const,
    summary:
      "Charlie generally approaches activities with good persistence and is increasingly willing to stay with a task when it becomes challenging. He is more confident with familiar activities, while new techniques can still require some guidance",
    unlock: "More details will be unlocked after 5 records",
    recordCount: 8,
    recordLabel: "Total activity record",
    programCount: 32,
    programLabel: "Total activity program",
    recordTitle: "Activity Record",
    rows: [
      { name: "Guitar Program", date: "Updated 12 May 2025" },
      { name: "Chess Program", date: "Updated 11 May 2025" },
      { name: "Badminton Team", date: "Updated 09 May 2025" },
    ],
    actionTitle: "Moments",
  },
} as const

function AnalyticsDashboardScreen({
  navigation,
  flowAppState,
  mode,
}: {
  navigation: any
  flowAppState: FlowAppState
  mode: AnalyticsDashboardMode
}) {
  const isAcademic = mode === "academic"
  const art = DASHBOARD_ART[mode]
  const copy = DASHBOARD_COPY[mode]
  const selectedStudent = flowAppState.students.find((student) => student.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const firstName = selectedStudent.name.split(" ")[0] || "Your child"
  const summary = copy.summary.replace(/\bCharlie\b/g, firstName)

  return (
    <SafeAreaView style={styles.analyticsScreen} edges={["top", "bottom"]}>
      <View style={styles.analyticsDashboardHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.analyticsDashboardBack} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={22} color="#858585" />
        </Pressable>
        <Text style={styles.analyticsDashboardHeaderTitle}>{copy.title}</Text>
        <View style={styles.analyticsDashboardHeaderSpacer} />
      </View>

      <ScrollView style={styles.page} contentContainerStyle={styles.analyticsDashboardContent} showsVerticalScrollIndicator={false}>
        <AnalyticsChildIdentity flowAppState={flowAppState} showLevel />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Overall Learning Picture"
          disabled={isAcademic}
          style={styles.dashboardPictureCard}
          onPress={() => {
            if (!isAcademic) navigation.navigate("ActivityLearningPictureApp")
          }}
        >
          <View style={styles.dashboardPictureHeader}>
            <View style={styles.dashboardPictureHeaderCopy}>
              <Text style={styles.dashboardPictureTitle}>Overall Learning Picture</Text>
              <View style={[styles.dashboardBadge, copy.badgeStyle === "amber" ? styles.dashboardBadgeAmber : styles.dashboardBadgeTeal]}>
                <Text style={[styles.dashboardBadgeText, copy.badgeStyle === "amber" ? styles.dashboardBadgeTextAmber : styles.dashboardBadgeTextTeal]}>
                  {copy.badge}
                </Text>
              </View>
            </View>
            <Image source={art.hero} style={styles.dashboardPictureHero} resizeMode="contain" />
          </View>
          <Text style={styles.dashboardPictureText}>{summary}</Text>
          <Text style={styles.dashboardPictureUnlock}>{copy.unlock}</Text>
        </Pressable>

        <View style={styles.analyticsMetricRow}>
          <View style={styles.dashboardMetricCard}>
            <View style={styles.dashboardMetricValueRow}>
              <Image source={art.recordIcon} style={styles.dashboardMetricIcon} resizeMode="contain" />
              <Text style={styles.dashboardMetricValue}>{copy.recordCount}</Text>
            </View>
            <Text style={styles.dashboardMetricLabel}>{copy.recordLabel}</Text>
          </View>
          <View style={styles.dashboardMetricCard}>
            <View style={styles.dashboardMetricValueRow}>
              <Image source={art.programIcon} style={styles.dashboardMetricIcon} resizeMode="contain" />
              <Text style={styles.dashboardMetricValue}>{copy.programCount}</Text>
            </View>
            <Text style={styles.dashboardMetricLabel}>{copy.programLabel}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.recordTitle}
          style={styles.dashboardRecordCard}
          onPress={() => navigation.navigate(isAcademic ? "AcademicRecordApp" : "LearningRecordsApp")}
        >
          <View style={styles.dashboardRecordHeader}>
            <Text style={styles.dashboardRecordTitle}>{copy.recordTitle}</Text>
            <Image source={art.records} style={styles.dashboardRecordArt} resizeMode="contain" />
          </View>
          <View style={styles.dashboardRecordRows}>
            {copy.rows.map((row) => (
              <View key={`${row.name}-${row.date}`} style={styles.dashboardRecordRow}>
                <Text style={styles.dashboardRecordName} numberOfLines={1}>{row.name}</Text>
                <Text style={styles.dashboardRecordDate}>{row.date}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.actionTitle}
          style={styles.dashboardActionCard}
          onPress={() => navigation.navigate(isAcademic ? "WorkSamplesApp" : "LearningRecordsApp")}
        >
          <Image source={art.action} style={styles.dashboardActionArt} resizeMode="contain" />
          <Text style={styles.dashboardActionTitle}>{copy.actionTitle}</Text>
        </Pressable>
      </ScrollView>

      <AnalyticsBottomNavigation navigation={navigation} />
    </SafeAreaView>
  )
}

const ACTIVITY_INSIGHTS = [
  {
    title: "Stronger Areas",
    art: require("./assets/figma/analytics/activity-stronger.png") as number,
    items: [
      { title: "Focus & Persistence", body: "Charlie has repeatedly stayed engaged with activities and continued trying when a task became more difficult." },
      { title: "Independent Trying", body: "In familiar situations, Charlie is increasingly willing to begin and work through parts of the activity independently." },
    ],
  },
  {
    title: "Areas Needing More Support",
    art: null,
    items: [
      { title: "Technique & Control", body: "Charlie sometimes needs guidance when learning a new technique or when more precise control is required." },
      { title: "Confidence with New Tasks", body: "When an activity feels unfamiliar, Charlie can benefit from some initial support before trying it independently." },
    ],
  },
  {
    title: "Differences Across Programmes",
    art: require("./assets/figma/analytics/activity-differences.png") as number,
    items: [
      { title: "Guitar", body: "Charlie tends to work patiently through practice activities, although unfamiliar chord changes can require guidance." },
      { title: "Chess", body: "He appears more independent when thinking through familiar problem-solving steps." },
      { title: "Badminton", body: "Charlie engages actively, while consistent technique and control can require more support." },
    ],
  },
  {
    title: "What Seems to Help Across Programmes",
    art: require("./assets/figma/analytics/activity-help.png") as number,
    items: [
      { title: "Short prompts and clear demonstrations", body: "Brief prompts and demonstrations have helped Charlie understand what to do next and continue with the activity." },
    ],
  },
]

function ActivityLearningPictureScreen({ navigation, flowAppState }: { navigation: any; flowAppState: FlowAppState }) {
  const selectedStudent = flowAppState.students.find((student) => student.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const firstName = selectedStudent.name.split(" ")[0] || "Your child"
  const summary = DASHBOARD_COPY.activity.summary.replace(/\bCharlie\b/g, firstName)

  return (
    <SafeAreaView style={styles.analyticsScreen} edges={["top", "bottom"]}>
      <View style={styles.analyticsDashboardHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.analyticsDashboardBack} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={22} color="#858585" />
        </Pressable>
        <Text style={styles.analyticsDashboardHeaderTitle}>Activity Dashboard</Text>
        <View style={styles.analyticsDashboardHeaderSpacer} />
      </View>
      <ScrollView style={styles.page} contentContainerStyle={styles.analyticsDashboardContent} showsVerticalScrollIndicator={false}>
        <AnalyticsChildIdentity flowAppState={flowAppState} showLevel />
        <View style={styles.dashboardPictureCard}>
          <View style={styles.dashboardPictureHeader}>
            <View style={styles.dashboardPictureHeaderCopy}>
              <Text style={styles.dashboardPictureTitle}>Overall Learning Picture</Text>
              <View style={[styles.dashboardBadge, styles.dashboardBadgeAmber]}>
                <Text style={[styles.dashboardBadgeText, styles.dashboardBadgeTextAmber]}>Consistent pattern</Text>
              </View>
            </View>
            <Image source={DASHBOARD_ART.activity.hero} style={styles.dashboardPictureHero} resizeMode="contain" />
          </View>
          <Text style={styles.dashboardPictureText}>{summary}</Text>
        </View>
        {ACTIVITY_INSIGHTS.map((section) => (
          <View key={section.title} style={styles.activityInsightCard}>
            <View style={styles.activityInsightHeader}>
              <Text style={styles.activityInsightTitle}>{section.title}</Text>
              {section.art ? <Image source={section.art} style={styles.activityInsightArt} resizeMode="contain" /> : null}
            </View>
            <View style={styles.activityInsightItems}>
              {section.items.map((item) => (
                <View key={item.title} style={styles.activityInsightItem}>
                  <Text style={styles.activityInsightItemTitle}>{item.title}</Text>
                  <Text style={styles.activityInsightItemBody}>{item.body.replace(/\bCharlie\b/g, firstName)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <AnalyticsBottomNavigation navigation={navigation} />
    </SafeAreaView>
  )
}

function ProfileScreen({
  navigation,
  session,
  onSignOut,
  flowAppState,
}: {
  navigation: any
  session: Session
  onSignOut: () => Promise<void>
  flowAppState: FlowAppState
}) {
  const profileName = "Emily Chan"

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileTitleRow}>
          <Text style={styles.profilePageTitle}>Profile</Text>
          <View style={styles.profileTitleActions}>
            <Pressable accessibilityLabel="Notifications" style={styles.profileRoundAction} onPress={() => navigation.navigate("NotificationApp")}>
              <Feather name="bell" size={17} color="#8A8A8A" />
            </Pressable>
            <Pressable accessibilityLabel="Inbox" style={styles.profileRoundAction} onPress={() => navigation.navigate("InboxApp")}>
              <Feather name="message-square" size={17} color="#8A8A8A" />
            </Pressable>
            </View>
          </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open personal setting"
          style={styles.profileSummaryCard}
          onPress={() => navigation.navigate("PersonalSettingApp")}
        >
          <View style={styles.profileIdentity}>
            <View>
              <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.profileMainAvatar} resizeMode="cover" />
              <View style={styles.profileAvatarEdit}>
                <MaterialCommunityIcons name="lead-pencil" size={15} color="#FFFFFF" />
                <View style={styles.profileAvatarEditLine} />
        </View>
        </View>
            <Text style={styles.profileMainName}>{profileName}</Text>
            <Text style={styles.profileLocation}>Hong Kong</Text>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>2</Text>
              <Text style={styles.profileStatLabel}>Children</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{Math.max(38, flowAppState.bookings.length)}</Text>
              <Text style={styles.profileStatLabel}>Bookings</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>3</Text>
              <Text style={styles.profileStatLabel}>Years on ClassZ</Text>
            </View>
          </View>
          </Pressable>

        <View style={styles.profileFeatureRow}>
          <Pressable style={styles.profileFeatureCard} onPress={() => navigation.navigate("ChildProfileApp")}>
            <View style={styles.profileFeatureIcon}>
              <Image source={PROFILE_FEATURE_ICONS.childProfile} style={styles.profileFeatureImage} resizeMode="contain" />
            </View>
            <Text style={styles.profileFeatureTitle}>Child profile</Text>
          </Pressable>
          <Pressable style={styles.profileFeatureCard} onPress={() => navigation.navigate("FavouriteApp")}>
            <View style={styles.profileFeatureIcon}>
              <Image source={PROFILE_FEATURE_ICONS.favourite} style={styles.profileFeatureImage} resizeMode="contain" />
        </View>
            <Text style={styles.profileFeatureTitle}>Favourite</Text>
        </Pressable>
        </View>

        <Text style={styles.profileSettingsTitle}>Advance Settings</Text>
        <View style={styles.profileSettingsList}>
          <Pressable style={styles.profileSettingRow} onPress={() => navigation.navigate("LanguageApp")}>
            <View style={styles.profileSettingLabelRow}>
              <Feather name="globe" size={17} color="#666666" />
              <Text style={styles.profileSettingLabel}>Language</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#777777" />
          </Pressable>
          <Pressable style={styles.profileSettingRow} onPress={() => navigation.navigate("ChangePasswordApp")}>
            <View style={styles.profileSettingLabelRow}>
              <Feather name="lock" size={17} color="#666666" />
              <Text style={styles.profileSettingLabel}>Change password</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#777777" />
          </Pressable>
          <Pressable style={styles.profileSettingRow} onPress={() => navigation.navigate("EnrollmentTermsApp")}>
            <View style={styles.profileSettingLabelRow}>
              <Feather name="file-text" size={17} color="#666666" />
              <Text style={styles.profileSettingLabel}>Terms &amp; Conditions</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#777777" />
          </Pressable>
          <Pressable style={styles.profileSettingRow} onPress={() => navigation.navigate("ContactUsApp")}>
            <View style={styles.profileSettingLabelRow}>
              <Feather name="help-circle" size={17} color="#666666" />
              <Text style={styles.profileSettingLabel}>Help centre</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#777777" />
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" style={styles.profileDeleteButton}>
          <Text style={styles.profileDeleteText}>Delete account</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.profileLogoutButton} onPress={onSignOut}>
          <Text style={styles.profileLogoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function ProfileFlowHeader({ navigation, title }: { navigation: any; title: string }) {
  return (
    <View style={styles.profileFlowHeader}>
      <Pressable accessibilityLabel="Back" hitSlop={10} style={styles.programListBackButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={19} color="#777777" />
      </Pressable>
      <Text style={styles.profileFlowHeaderTitle}>{title}</Text>
      <View style={styles.programListHeaderSpacer} />
    </View>
  )
}

function PersonalSettingScreen({ navigation, session }: { navigation: any; session: Session }) {
  const [fullName, setFullName] = useState("Emily Chan")
  const [email, setEmail] = useState(session.user.email)
  const [phone, setPhone] = useState("8888 8888")

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Personal Setting" />
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.personalSettingContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.personalAvatarWrap}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.personalAvatar} resizeMode="cover" />
            <View style={styles.profileAvatarEdit}>
              <Feather name="user" size={13} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.personalField}>
            <Text style={styles.personalFieldLabel}>Full name</Text>
            <TextInput
              style={styles.personalFieldInput}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.personalField}>
            <Text style={styles.personalFieldLabel}>Email address</Text>
            <View style={styles.personalVerifiedRow}>
              <TextInput
                style={styles.personalVerifiedInput}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Text style={styles.personalVerifyLink}>Verified</Text>
            </View>
          </View>
          <View style={styles.personalPhoneField}>
            <Pressable style={styles.personalCountryField}>
              <Text style={styles.personalFieldLabel}>Country</Text>
              <View style={styles.personalCountryValueRow}>
                <Text style={styles.personalFieldValue}>+852</Text>
                <Feather name="chevron-down" size={18} color="#222222" />
              </View>
            </Pressable>
            <View style={styles.personalPhoneDivider} />
            <View style={styles.personalPhoneInputWrap}>
              <Text style={styles.personalFieldLabel}>Phone</Text>
              <TextInput style={styles.personalPhoneInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
            <Text style={styles.personalVerifyLink}>Verify</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            style={styles.profileFlowPrimaryButton}
            onPress={() => {
              Alert.alert("Saved", "Your personal settings have been updated.")
              navigation.goBack()
            }}
          >
            <Text style={styles.profileFlowPrimaryText}>Save</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function ChangePasswordScreen({ navigation }: { navigation: any }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const canSubmit = Boolean(currentPassword && newPassword && confirmPassword && newPassword === confirmPassword)

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Change Password" />
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.changePasswordContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={styles.passwordField}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor="#B5B5B5"
            secureTextEntry
          />
          <TextInput
            style={styles.passwordField}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor="#B5B5B5"
            secureTextEntry
          />
          <TextInput
            style={styles.passwordField}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor="#B5B5B5"
            secureTextEntry
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            style={[styles.profileFlowPrimaryButton, !canSubmit ? styles.profileFlowPrimaryButtonDisabled : null]}
            disabled={!canSubmit}
            onPress={() => {
              Alert.alert("Password updated", "Your password has been changed.")
              navigation.goBack()
            }}
          >
            <Text style={styles.profileFlowPrimaryText}>Update password</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const ENROLLMENT_TERMS = [
  {
    title: "1. Definitions",
    body: 'A "Platform" refers to the ClassZ internet class reservation platform provided by the Company. A "User" refers to any individual who uses the Platform to search, book, or cancel interest classes. A "Provider" refers to each freelance coach or registered centre offering interest classes through the Platform.',
  },
  {
    title: "2. Platform Services",
    body: "The Platform provides Users with an online service to search, book, and cancel interest classes at locations of their choice. Users may choose between freelance coaches or registered centres as their preferred Providers.",
  },
  {
    title: "3. User Responsibility",
    body: "Users are responsible for their choice of Class and location. Users must exercise due diligence in selecting a safe and appropriate location. Users must ensure the safety and suitability of the location for themselves or their children.",
  },
  {
    title: "4. Provider Responsibility",
    body: "Providers are responsible for ensuring the safety and suitability of the location for conducting Classes. Providers must comply with all applicable laws, regulations, and guidelines. Providers are responsible for maintaining necessary permits, licences, or approvals required to conduct Classes at a specific location.",
  },
  {
    title: "5. Company’s Role",
    body: "The Company acts solely as an intermediary connecting Users with Providers through the Platform. The Company does not own, operate, or control the locations where Classes are conducted. The Company does not endorse, guarantee, or warrant the accuracy, quality, or effectiveness of the Classes or the performance of the Providers.",
  },
  {
    title: "6. Limitation of Liability",
    body: "To the maximum extent permitted by law, the Company shall not be liable for injury, damage, loss, or inconvenience arising from a Class, a Provider, or the selected location. Users and Providers agree to indemnify and hold the Company harmless from claims arising from their use of the Platform.",
  },
  {
    title: "7. Dispute Resolution",
    body: "Any dispute arising from a Class should first be resolved through negotiation in good faith. If the dispute cannot be resolved, the parties agree to submit it to mediation or arbitration in Hong Kong.",
  },
  {
    title: "8. Modifications to the Agreement",
    body: "The Company reserves the right to modify or amend this Agreement at any time. Updated versions will be posted on the Platform. Continued use of the Platform after any modification constitutes acceptance of the modified terms.",
  },
  {
    title: "9. Governing Law",
    body: "This Agreement shall be governed by and construed in accordance with the laws of Hong Kong. By using the Platform, you acknowledge that you have read, understood, and agree to be bound by this Agreement.",
  },
] as const

function LanguageScreen({
  navigation,
  locale,
  onSelectLocale,
}: {
  navigation: any
  locale: AppLocale
  onSelectLocale: (locale: AppLocale) => Promise<void>
}) {
  const [selectedLocale, setSelectedLocale] = useState<AppLocale>(locale === "en" ? "en" : "zh-Hant")

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Language" />
      <View style={styles.languageContent}>
        <View style={styles.languageChooser}>
          <Text style={styles.languagePrompt}>Choose your{"\n"}preferred language!</Text>
          {([
            { value: "en" as const, flag: "🇬🇧", label: "English" },
            { value: "zh-Hant" as const, flag: "🇭🇰", label: "繁體中文" },
          ]).map((option) => {
            const selected = selectedLocale === option.value
            return (
              <Pressable
                key={option.value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={styles.languageOption}
                onPress={() => setSelectedLocale(option.value)}
              >
                <Text style={styles.languageFlag}>{option.flag}</Text>
                <Text style={styles.languageLabel}>{option.label}</Text>
                <Feather name={selected ? "check-square" : "square"} size={18} color={selected ? "#0ABAB5" : "#B8B8B8"} />
              </Pressable>
            )
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          style={styles.languageSaveButton}
          onPress={async () => {
            await onSelectLocale(selectedLocale)
            navigation.goBack()
          }}
        >
          <Text style={styles.profileFlowPrimaryText}>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function EnrollmentTermsScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="All Enrollment" />
      <ScrollView style={styles.page} contentContainerStyle={styles.enrollmentTermsContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.enrollmentTermsHeading}>TERMS AND CONDITIONS</Text>
        <Text style={styles.enrollmentTermsBody}>
          These Terms and Conditions ("Agreement") govern your use of the ClassZ interest class reservation platform ("Platform") provided by the Company. By accessing or using the Platform, you agree to be bound by this Agreement. If you do not agree with these terms, please refrain from using the Platform.
        </Text>
        {ENROLLMENT_TERMS.map((section) => (
          <View key={section.title} style={styles.enrollmentTermsSection}>
            <Text style={styles.enrollmentTermsSectionTitle}>{section.title}</Text>
            <Text style={styles.enrollmentTermsBody}>{section.body}</Text>
          </View>
        ))}
        <Text style={styles.enrollmentTermsBody}>
          ClassZ{"\n"}[Address]{"\n"}[City, State, ZIP]{"\n"}[Email Address]{"\n"}[Phone Number]{"\n"}[Website]
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function ContactUsScreen({ navigation }: { navigation: any }) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [thoughts, setThoughts] = useState("")

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Contact Us" />
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.contactContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.contactIntro}>We are here to help you!</Text>
          <TextInput
            style={styles.contactInput}
            placeholder="Full name"
            placeholderTextColor="#B5B5B5"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.contactInput}
            placeholder="Email address"
            placeholderTextColor="#B5B5B5"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.contactThoughtsInput}
            placeholder="Tell us your thoughts"
            placeholderTextColor="#B5B5B5"
            value={thoughts}
            onChangeText={setThoughts}
            multiline
            textAlignVertical="top"
          />
          <Pressable
            accessibilityRole="button"
            style={styles.contactSubmitButton}
            onPress={() => navigation.navigate("ContactThanksApp")}
          >
            <Text style={styles.profileFlowPrimaryText}>Submit</Text>
          </Pressable>

          <View style={styles.contactDetails}>
            <View style={styles.contactDetailRow}>
              <View style={styles.contactDetailIcon}><Feather name="mail" size={14} color="#222222" /></View>
              <Text style={styles.contactDetailText}>medialcs.classz@gmail.com</Text>
            </View>
            <View style={styles.contactDetailRow}>
              <View style={styles.contactDetailIcon}><Feather name="phone" size={14} color="#222222" /></View>
              <Text style={styles.contactDetailText}>+852 1234 5678</Text>
            </View>
            <View style={styles.contactDetailRow}>
              <View style={styles.contactDetailIcon}><Feather name="clock" size={14} color="#222222" /></View>
              <Text style={styles.contactDetailText}>Mon–Sun  08:00–19:00</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function ContactThanksScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Contact Us" />
      <View style={styles.contactThanksContent}>
        <Text style={styles.contactThanksAccent}>We hear you!</Text>
        <Text style={styles.contactThanksTitle}>Thanks for reaching out!</Text>
        <Text style={styles.contactThanksText}>Please kindly check our response</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.contactThanksClose}
          onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })}
        >
          <Feather name="chevron-left" size={14} color="#777777" />
          <Text style={styles.contactThanksCloseText}>Close</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function ChildProfileScreen({
  navigation,
  flowAppState,
  setFlowAppState,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Child Profile" />
      <ScrollView style={styles.page} contentContainerStyle={styles.childProfileContent} showsVerticalScrollIndicator={false}>
        {BOOKING_CHILDREN.map((child) => {
          const selected = child.id === flowAppState.selectedStudentId
          return (
            <Pressable
              key={child.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${child.name}'s profile`}
              accessibilityState={{ selected }}
              style={styles.childProfileCard}
              onPress={() => {
                setFlowAppState((prev) => ({ ...prev, selectedStudentId: child.id }))
                navigation.navigate("ChildDetailsApp", { childId: child.id })
              }}
            >
              <View style={styles.childProfileIdentity}>
                <Image source={{ uri: child.image }} style={styles.childProfileAvatar} resizeMode="cover" />
                <Text style={styles.childProfileName}>{child.name}</Text>
              </View>
              <View style={styles.childProfileStats}>
                <View style={[styles.childLevelBadge, child.level === "Beginner" ? styles.childLevelBeginner : styles.childLevelAchiever]}>
                  <Text style={[styles.childLevelText, child.level === "Beginner" ? styles.childLevelBeginnerText : styles.childLevelAchieverText]}>
                    {child.level}
                  </Text>
                </View>
                <Text style={styles.childProfileYearValue}>{child.years}</Text>
                <Text style={styles.childProfileYearLabel}>Years on ClassZ</Text>
                <View style={styles.childCardDivider} />
                <View style={styles.childSchoolRow}>
                  <Text style={styles.childSchoolName}>
                    <Text style={styles.childSchoolMark}>z</Text>
                    school
                  </Text>
                  <Text style={[styles.childSchoolStatus, child.connected ? styles.childSchoolConnected : styles.childSchoolMuted]}>
                    {child.connected ? "connected" : "not connected"}
                  </Text>
                </View>
                <View style={styles.childCardDivider} />
                <View style={styles.childCardMetaRow}>
                  <View style={styles.childCardMeta}>
                    <MaterialCommunityIcons name="gender-male" size={13} color="#0ABAB5" />
                    <Text style={styles.childProfileMetaText}>Age {child.age}</Text>
                  </View>
                  <View style={styles.childCardMeta}>
                    <MaterialCommunityIcons name="check-circle-outline" size={13} color="#8A8A8A" />
                    <Text style={styles.childProfileMetaText}>SEN</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )
        })}

        <Text style={styles.childProfilePrompt}>Got more child’s schedule to handle?</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.profileFlowPrimaryButton}
          onPress={() => navigation.navigate("AddChildProfileApp")}
        >
          <Text style={styles.profileFlowPrimaryText}>Add child profile</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function ChildDetailsScreen({
  navigation,
  route,
}: {
  navigation: any
  route: { params: { childId: string } }
}) {
  const child = BOOKING_CHILDREN.find((item) => item.id === route.params.childId) || BOOKING_CHILDREN[0]
  const [fullName, setFullName] = useState<string>(child.name)
  const [senRequired, setSenRequired] = useState(true)
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false)

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Child Details" />
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.childDetailsContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.childDetailsAvatarWrap}>
            <Image source={{ uri: child.image }} style={styles.childDetailsAvatar} resizeMode="cover" />
            <View style={styles.profileAvatarEdit}>
              <Feather name="user-plus" size={13} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.personalField}>
            <Text style={styles.personalFieldLabel}>Full name</Text>
            <TextInput style={styles.personalFieldInput} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          </View>

          <View style={styles.childDetailsSchoolTitleRow}>
            <Text style={styles.childDetailsSchoolTitle}>
              <Text style={styles.childSchoolMark}>z.</Text>
              school
            </Text>
            <Text style={styles.childDetailsConnected}>connected</Text>
          </View>
          <View style={styles.childDetailsSchoolRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.childDetailsSchoolLogo} resizeMode="cover" />
            <Text style={styles.childDetailsSchoolName}>ClassZ Chan Siu Ming{"\n"}Memorial Primary School</Text>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <Text style={styles.childDetailsEdit}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.childDetailsDivider} />

          <Text style={styles.childDetailsSectionTitle}>Special Education Need (SEN)</Text>
          <View style={styles.childDetailsToggleRow}>
            <Text style={styles.childDetailsToggleLabel}>Required SEN assistance</Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: senRequired }}
              style={[styles.childDetailsToggle, senRequired ? styles.childDetailsToggleOn : null]}
              onPress={() => setSenRequired((value) => !value)}
            >
              <View style={[styles.childDetailsToggleThumb, senRequired ? styles.childDetailsToggleThumbOn : null]}>
                {senRequired ? <Feather name="check" size={12} color="#0ABAB5" /> : null}
              </View>
            </Pressable>
          </View>

          <View style={styles.childDetailsFooter}>
            <Pressable
              accessibilityRole="button"
              style={styles.childDetailsDeleteButton}
              onPress={() => setDeleteWarningOpen(true)}
            >
              <Text style={styles.childDetailsDelete}>Delete profile</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.profileFlowPrimaryButton}
              onPress={() => {
                Alert.alert("Saved", `${fullName}'s profile has been updated.`)
                navigation.goBack()
              }}
            >
              <Text style={styles.profileFlowPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={deleteWarningOpen} transparent animationType="fade" onRequestClose={() => setDeleteWarningOpen(false)}>
        <View style={styles.childWarningRoot}>
          <Pressable style={styles.childWarningBackdrop} onPress={() => setDeleteWarningOpen(false)} />
          <View style={styles.childWarningCard}>
            <Image source={{ uri: child.image }} style={styles.childWarningAvatar} resizeMode="cover" />
            <Text style={styles.childWarningName}>{child.name}</Text>
            <Text style={styles.childWarningText}>
              <Text style={styles.childWarningTextBold}>Warning: </Text>
              Deleting this profile also deletes all associated feedback records.
            </Text>
            <View style={styles.childWarningActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setDeleteWarningOpen(false)
                  navigation.goBack()
                }}
              >
                <Text style={styles.childWarningDelete}>Delete</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.childWarningBack} onPress={() => setDeleteWarningOpen(false)}>
                <Text style={styles.childWarningBackText}>Go Back</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function AddChildProfileScreen({ navigation }: { navigation: any }) {
  const [fullName, setFullName] = useState("")
  const [idCard, setIdCard] = useState("")
  const [birthday, setBirthday] = useState("")
  const [phone, setPhone] = useState("")
  const [senRequired, setSenRequired] = useState(false)

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Add Child" />
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.addChildContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.addChildAvatar}>
            <Feather name="user" size={34} color="#B5B5B5" />
          </View>
          <TextInput style={styles.addChildField} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor="#B5B5B5" />
          <TextInput style={styles.addChildField} value={idCard} onChangeText={setIdCard} placeholder="ID card number" placeholderTextColor="#B5B5B5" autoCapitalize="characters" />
          <TextInput style={styles.addChildField} value={birthday} onChangeText={setBirthday} placeholder={"Birthday\n(dd/mm/yyyy)"} placeholderTextColor="#B5B5B5" />
          <View style={styles.personalPhoneField}>
            <Pressable style={styles.personalCountryField}>
              <Text style={styles.personalFieldLabel}>Country</Text>
              <View style={styles.personalCountryValueRow}>
                <Text style={styles.personalFieldValue}>+852</Text>
                <Feather name="chevron-down" size={18} color="#222222" />
              </View>
            </Pressable>
            <View style={styles.personalPhoneDivider} />
            <TextInput style={styles.addChildPhoneInput} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#B5B5B5" keyboardType="phone-pad" />
          </View>

          <Text style={styles.childDetailsSchoolTitle}>
            <Text style={styles.childSchoolMark}>z</Text>
            school
          </Text>
          <View style={styles.addChildSchoolRow}>
            <View style={styles.addChildSchoolLogo} />
            <Text style={styles.addChildSchoolText}>Connect a school</Text>
            <Feather name="chevron-right" size={19} color="#777777" />
          </View>

          <Text style={styles.childDetailsSectionTitle}>Special Education Need (SEN)</Text>
          <View style={styles.childDetailsToggleRow}>
            <Text style={styles.childDetailsToggleLabel}>Required SEN assistance</Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: senRequired }}
              style={[styles.childDetailsToggle, senRequired ? styles.childDetailsToggleOn : null]}
              onPress={() => setSenRequired((value) => !value)}
            >
              <View style={[styles.childDetailsToggleThumb, senRequired ? styles.childDetailsToggleThumbOn : null]}>
                {senRequired ? <Feather name="check" size={12} color="#0ABAB5" /> : null}
              </View>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !fullName.trim() }}
            style={[styles.profileFlowPrimaryButton, !fullName.trim() ? styles.profileFlowPrimaryButtonDisabled : null]}
            disabled={!fullName.trim()}
            onPress={() => {
              Alert.alert("Child added", `${fullName.trim()}'s profile has been created.`)
              navigation.goBack()
            }}
          >
            <Text style={styles.profileFlowPrimaryText}>Save</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function FavouriteScreen({ navigation }: { navigation: any }) {
  const [favourites, setFavourites] = useState(["favourite-1", "favourite-2"])

  return (
    <SafeAreaView style={styles.profileScreen} edges={["top", "bottom"]}>
      <ProfileFlowHeader navigation={navigation} title="Favourite" />
      <ScrollView style={styles.page} contentContainerStyle={styles.favouriteContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.favouriteFilter}>Filter</Text>
        {["favourite-1", "favourite-2"].map((id) => {
          const liked = favourites.includes(id)
          return (
            <Pressable key={id} style={styles.favouriteCard} onPress={() => navigation.navigate("CentreDetailApp")}>
              <View style={styles.favouriteImageWrap}>
                <Image source={{ uri: FIGMA_ASSETS.main.recommend2 }} style={styles.favouriteImage} resizeMode="cover" />
                <View style={styles.favouriteSenBadge}>
                  <Feather name="check-circle" size={12} color="#222222" />
                  <Text style={styles.favouriteSenText}>SEN</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={liked ? "Remove favourite" : "Add favourite"}
                  hitSlop={8}
                  style={styles.favouriteHeart}
                  onPress={(event) => {
                    event.stopPropagation()
                    setFavourites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
                  }}
                >
                  <MaterialCommunityIcons name={liked ? "heart" : "heart-outline"} size={24} color="#FFFFFF" />
                </Pressable>
              </View>
              <View style={styles.favouriteCardBody}>
                <View style={styles.favouriteCardTitleRow}>
                  <Text style={styles.favouriteCardTitle}>ClassZ Playgroup Centre</Text>
                  <View style={styles.favouriteRating}>
                    <MaterialCommunityIcons name="star" size={15} color="#222222" />
                    <Text style={styles.favouriteRatingText}>4.91</Text>
                  </View>
                </View>
                <Text style={styles.favouriteMeta}>
                  <Text style={styles.favouritePrice}>$299</Text> lesson · Causeway Bay
                </Text>
              </View>
            </Pressable>
          )
        })}
      </ScrollView>
      <View style={styles.favouriteBottomNav}>
        {([
          ["Home", "home"],
          ["Search", "search"],
          ["Calendar", "calendar"],
          ["Analytics", "analytics"],
        ] as const).map(([screen, key]) => (
          <Pressable key={screen} style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen })}>
            <Image
              source={NAV_ICONS[screen]}
              style={[styles.realTabIcon, { tintColor: key === "search" ? "#0ABAB5" : "#8A8A8A" }]}
            />
          </Pressable>
        ))}
        <Pressable style={styles.favouriteBottomNavItem} onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })}>
          <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.profileTabAvatar} resizeMode="cover" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function ReservationAppScreen({
  navigation,
  route,
  flowAppState,
  setFlowAppState,
}: {
  navigation: any
  route: { params?: { schedule?: ClassScheduleOption } }
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const active = flowAppState.programs.find((p) => p.id === flowAppState.selectedProgramId) || flowAppState.programs[0]
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId) || flowAppState.centres[0]
  const student = flowAppState.students.find((item) => item.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const selectedBookingChild = BOOKING_CHILDREN.find((item) => item.id === student.id) || BOOKING_CHILDREN[0]
  const schedule = route.params?.schedule ?? buildProgramSchedule(
    active,
    0,
    "Oct 23 - Nov 28",
    active.price === 299 ? 399 : null,
    4,
    3,
  )
  const [datesExpanded, setDatesExpanded] = useState(false)
  const lessonCount = schedule.lessonCount
  const lessonTotal = schedule.price * lessonCount
  const limitedDiscount = schedule.originalPrice ? (schedule.originalPrice - schedule.price) * lessonCount : 0
  const platformFee = 5
  const promoteDiscount = flowAppState.couponCode.trim() ? 60 : 0
  const total = (schedule.originalPrice ?? schedule.price) * lessonCount + platformFee - promoteDiscount
  const attendeeAvatars = [
    FIGMA_ASSETS.reservation.host,
    FIGMA_ASSETS.reservation.coach,
    selectedBookingChild.image,
  ]

  const appliedPromoteCode = flowAppState.couponCode.trim()

  return (
    <SafeAreaView style={styles.classOptionScreen} edges={["top", "bottom"]}>
      <View style={styles.programListHeader}>
        <Pressable
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.programListBackButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={19} color="#777777" />
        </Pressable>
        <Text style={styles.programListHeaderTitle}>Reservation</Text>
        <View style={styles.programListHeaderSpacer} />
          </View>

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.reservationContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.reservationCard}>
          <View style={styles.reservationProgramRow}>
            <Image
              source={{ uri: FIGMA_ASSETS.reservation.program }}
              style={styles.reservationProgramImage}
              resizeMode="cover"
            />
            <View style={styles.reservationProgramCopy}>
              <Text style={styles.reservationProgramTitle}>{active.title}</Text>
              <View style={styles.reservationMetaRow}>
                <Feather name="globe" size={14} color="#8A8A8A" />
                <Text style={styles.reservationMetaText}>{schedule.language}</Text>
        </View>
              <View style={styles.reservationMetaRow}>
                <Feather name="map-pin" size={14} color="#8A8A8A" />
                <Text style={styles.reservationMetaText}>{schedule.address}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.reservationCard}>
          <Text style={styles.reservationDateTitle}>
            {lessonCount} lessons · {schedule.dateRange}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={datesExpanded ? "Hide full dates" : "Show full dates"}
            accessibilityState={{ expanded: datesExpanded }}
            style={styles.reservationDatesToggle}
            onPress={() => setDatesExpanded((open) => !open)}
          >
            <Text style={styles.reservationDatesToggleText}>Hide full dates</Text>
            <Feather name={datesExpanded ? "chevron-up" : "chevron-down"} size={16} color="#8A8A8A" />
          </Pressable>
          {datesExpanded ? (
            <View style={styles.classOptionLessonList}>
              <Text style={styles.reservationLessonHeading}>Lesson dates</Text>
              <LessonDateRows dates={schedule.lessonDates} />
            </View>
          ) : null}
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.reservationSection}>
          <Text style={styles.reservationSectionTitle}>Hosted by</Text>
          <View style={styles.reservationPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.reservationPersonImage} resizeMode="cover" />
            <View style={styles.reservationHostCopy}>
              <Text style={styles.reservationPersonName}>{centre.detailName || centre.name}</Text>
            </View>
            <View style={styles.reservationRating}>
              <MaterialCommunityIcons name="star" size={16} color="#222222" />
              <Text style={styles.reservationRatingText}>{centre.rating.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.reservationPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.reservationPersonImage} resizeMode="cover" />
            <View style={styles.reservationHostCopy}>
              <Text style={styles.reservationPersonName}>{schedule.coachName}</Text>
              <Text style={styles.reservationPersonMeta}>Program Coach</Text>
            </View>
          </View>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.reservationSection}>
          <Text style={styles.reservationSectionTitle}>Booking for</Text>
          <View style={styles.reservationPersonRow}>
            <Image source={{ uri: selectedBookingChild.image }} style={styles.reservationPersonImage} resizeMode="cover" />
            <Text style={styles.reservationBookingName}>{student.name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Switch child" hitSlop={8} onPress={() => navigation.navigate("SelectChildApp")}>
              <Text style={styles.reservationSwitch}>Switch</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.reservationSection}>
          <View style={styles.reservationPayHeader}>
            <Text style={styles.reservationSectionTitle}>Pay with</Text>
            <Text style={styles.reservationStripe}>
              Powered by <Text style={styles.reservationStripeWord}>stripe</Text>
            </Text>
          </View>
          <Text style={styles.reservationPayMethodLabel}>Payment method</Text>
          <View style={styles.reservationPaymentRow}>
            <View style={styles.reservationPaymentIcons}>
              {PAYMENT_ICONS.map((icon) => (
                <SvgXml key={icon.id} xml={icon.xml} width={icon.width} height={icon.height} />
              ))}
            </View>
            <Text style={styles.reservationSwitch}>Add</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Promote code" hitSlop={8} onPress={() => navigation.navigate("PromoteCodeApp")}>
            <Text style={styles.reservationPromote}>{appliedPromoteCode || "Promote code"}</Text>
          </Pressable>
        </View>

        <View style={styles.reservationDivider} />

        <View style={styles.reservationSummaryCard}>
          <Text style={styles.reservationPriceLine}>
            {schedule.originalPrice ? (
              <Text style={styles.reservationPriceOriginal}>${schedule.originalPrice} </Text>
            ) : null}
            <Text style={styles.reservationPriceNow}>${schedule.price}</Text>
            <Text style={styles.reservationPriceUnit}> lesson</Text>
          </Text>
          <Text style={styles.reservationScheduleMeta}>
            {lessonCount} lessons · {schedule.dateRange}
          </Text>
          <View style={styles.reservationAttendeeRow}>
            <View style={styles.classOptionAvatarStack}>
              {attendeeAvatars.map((avatar, index) => (
                <Image
                  key={`reservation-avatar-${index}`}
                  source={{ uri: avatar }}
                  style={[styles.reservationAttendeeAvatar, index === 0 ? null : styles.classOptionAvatarOverlap]}
                  resizeMode="cover"
                />
            ))}
          </View>
            <Text style={styles.reservationGoingText}>+{schedule.goingCount} Going</Text>
            <Text style={styles.reservationSpotsText}>{schedule.spotsLeft} spots left</Text>
        </View>
          <Text style={styles.reservationProtectText}>
            Your booking is protected by <ZCareWord style={styles.reservationProtectName} />
          </Text>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reserve ${lessonCount} lessons from ${schedule.dateRange}`}
            style={styles.reservationReserveButton}
          onPress={() => {
            const booking = {
              id: `b${Date.now()}`,
              programId: active.id,
              title: active.title,
              lessonCount,
                dateRange: schedule.dateRange,
              total,
            }
            setFlowAppState((prev) => ({ ...prev, bookings: [booking, ...prev.bookings] }))
              navigation.navigate("ReservationConfirmedApp", { schedule, total })
          }}
        >
            <Text style={styles.reservationReserveButtonText}>Reserve</Text>
        </Pressable>
          <View style={styles.reservationBreakdown}>
            <View style={styles.reservationBreakdownRow}>
              <Text style={styles.reservationBreakdownLabel}>{schedule.price} x {lessonCount} lessons</Text>
              <Text style={styles.reservationBreakdownValue}>${formatAmount(lessonTotal)}</Text>
            </View>
            {limitedDiscount ? (
              <View style={styles.reservationBreakdownRow}>
                <Text style={styles.reservationBreakdownLabel}>Limited discount</Text>
                <Text style={styles.reservationDiscountValue}>-${formatAmount(limitedDiscount)}</Text>
              </View>
            ) : null}
            {promoteDiscount ? (
              <View style={styles.reservationBreakdownRow}>
                <View style={styles.reservationCouponRow}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color="#0ABAB5" />
                  <Text style={styles.reservationCouponCode}>{appliedPromoteCode}</Text>
                </View>
                <Text style={styles.reservationDiscountValue}>-${promoteDiscount}</Text>
              </View>
            ) : null}
            <View style={styles.reservationBreakdownRow}>
              <Text style={styles.reservationBreakdownLabel}>Platform fee</Text>
              <Text style={styles.reservationBreakdownValue}>${platformFee}</Text>
            </View>
            <View style={styles.reservationTotalRow}>
              <Text style={styles.reservationTotalLabel}>Total (HKD)</Text>
              <Text style={styles.reservationTotalValue}>${formatAmount(total)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.reservationFinePrint}>
          <ZCareWord style={styles.reservationFineBrand} />
          {" "}helps protect your ClassZ booking by supporting class records, photos, coach feedback, and service-related issues under platform policy.{" "}
          <Text style={styles.reservationLearnMore}>Learn More</Text>
        </Text>
        <Text style={styles.reservationFinePrint}>
          By paying, you agree to our <Text style={styles.reservationLink}>Cancellation Policy</Text>,{" "}
          <Text style={styles.reservationLink}>Refund Policy</Text>, and{" "}
          <Text style={styles.reservationLink}>Terms and Conditions</Text>. Confirmed bookings are non-refundable, including sickness or absence. Direct centre arrangements may not be covered by <ZCareWord /> or ClassZ Passport.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function ReservationConfirmedScreen({
  navigation,
  route,
  flowAppState,
}: {
  navigation: any
  route: { params: { schedule: ClassScheduleOption; total: number } }
  flowAppState: FlowAppState
}) {
  const active = flowAppState.programs.find((item) => item.id === flowAppState.selectedProgramId) || flowAppState.programs[0]
  const centre = flowAppState.centres.find((item) => item.id === flowAppState.selectedCentreId) || flowAppState.centres[0]
  const student = flowAppState.students.find((item) => item.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const selectedBookingChild = BOOKING_CHILDREN.find((item) => item.id === student.id) || BOOKING_CHILDREN[0]
  const { schedule, total } = route.params

  const openTimetable = () => navigation.navigate("AppTabs", { screen: "Calendar" })

  return (
    <SafeAreaView style={styles.confirmedScreen} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.confirmedContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close confirmation"
          hitSlop={10}
          style={styles.confirmedCloseButton}
          onPress={openTimetable}
        >
          <Feather name="x" size={18} color="#8A8A8A" />
        </Pressable>

        <View style={styles.confirmedDivider} />

        <Text style={styles.confirmedTitle}>
          Your reservation has been{"\n"}confirmed successfully!
        </Text>

        <View style={styles.confirmedProgramCard}>
          <Image
            source={{ uri: FIGMA_ASSETS.reservation.program }}
            style={styles.confirmedProgramImage}
            resizeMode="cover"
          />
          <View style={styles.confirmedProgramCopy}>
            <Text style={styles.confirmedProgramTitle}>{active.title}</Text>
            <View style={styles.confirmedMetaRow}>
              <Feather name="globe" size={14} color="#777777" />
              <Text style={styles.confirmedMetaText}>{schedule.language}</Text>
            </View>
            <View style={styles.confirmedMetaRow}>
              <Feather name="map-pin" size={14} color="#777777" />
              <Text style={styles.confirmedMetaText}>{schedule.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.confirmedDivider} />

        <View style={styles.confirmedSection}>
          <Text style={styles.confirmedSectionTitle}>Hosted by</Text>
          <View style={styles.confirmedPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.confirmedAvatar} resizeMode="cover" />
            <Text style={styles.confirmedPersonNameFill}>{centre.detailName || centre.name}</Text>
            <View style={styles.confirmedRating}>
              <MaterialCommunityIcons name="star" size={16} color="#222222" />
              <Text style={styles.confirmedRatingText}>{centre.rating.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.confirmedPersonRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.confirmedAvatar} resizeMode="cover" />
            <View style={styles.confirmedPersonCopy}>
              <Text style={styles.confirmedPersonName}>{schedule.coachName}</Text>
              <Text style={styles.confirmedPersonRole}>Program Coach</Text>
            </View>
          </View>
        </View>

        <View style={styles.confirmedDivider} />

        <View style={styles.confirmedSection}>
          <Text style={styles.confirmedSectionTitle}>Booking for</Text>
          <View style={styles.confirmedPersonRow}>
            <Image source={{ uri: selectedBookingChild.image }} style={styles.confirmedAvatar} resizeMode="cover" />
            <Text style={styles.confirmedPersonNameFill}>{student.name}</Text>
          </View>
        </View>

        <View style={styles.confirmedDivider} />

        <View style={styles.confirmedPaymentRow}>
          <Text style={styles.confirmedPaymentLabel}>Payment amount</Text>
          <Text style={styles.confirmedPaymentValue}>${formatAmount(total)}</Text>
        </View>

        <View style={styles.confirmedDivider} />

        <View style={styles.confirmedFooter}>
          <Text style={styles.confirmedPrompt}>Want to check your schedule?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to timetable"
            style={styles.confirmedTimetableButton}
            onPress={openTimetable}
          >
            <Text style={styles.confirmedTimetableButtonText}>Go to Timetable</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const BOOKING_CHILDREN = [
  {
    id: "s1",
    name: "Charlie Wong",
    level: "Beginner",
    years: 2,
    connected: true,
    age: 6,
    sen: true,
    image: FIGMA_ASSETS.reservation.child,
    imageScale: 1,
    imageOffsetY: 0,
  },
  {
    id: "s4",
    name: "Joseph Wong",
    level: "Achiever",
    years: 2,
    connected: false,
    age: 6,
    sen: true,
    image: Asset.fromModule(require("./assets/mobile/profile/joseph-avatar.png")).uri,
    imageScale: 1,
    imageOffsetY: 0,
  },
] as const

const PROMOTE_VOUCHERS = ["voucher-1", "voucher-2", "voucher-3", "voucher-4"] as const

const PROMOTE_TERMS = [
  "The voucher can be applied to enrollment of $220 or more.",
  "ClassZ reserves the right to adjust, suspend, or cancel any vouchers, discounts, and promotion at its discretion without prior notice.",
  "Certain vouchers will be distributed at random, and the discount amount will be based on the amount shown on the voucher. ClassZ reserves the right to adjust, suspend, or cancel any vouchers, discounts, or promotions at its sole discretion without prior notice.",
  "This voucher can only be used at the designated centres specified in the promotions.",
  "Not applicable to orders with fixed price items.",
]

function SelectChildScreen({
  navigation,
  flowAppState,
  setFlowAppState,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  return (
    <SafeAreaView style={styles.classOptionScreen} edges={["top", "bottom"]}>
      <View style={styles.programListHeader}>
        <Pressable accessibilityLabel="Back" hitSlop={10} style={styles.programListBackButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={19} color="#777777" />
        </Pressable>
        <Text style={styles.programListHeaderTitle}>Select Child</Text>
        <View style={styles.programListHeaderSpacer} />
      </View>
      <ScrollView style={styles.page} contentContainerStyle={styles.childSelectContent} showsVerticalScrollIndicator={false}>
        {BOOKING_CHILDREN.map((child) => {
          const selected = child.id === flowAppState.selectedStudentId
          return (
            <Pressable
              key={child.id}
              accessibilityRole="button"
              accessibilityLabel={`Select ${child.name}`}
              accessibilityState={{ selected }}
              style={[styles.childCard, selected ? styles.childCardSelected : null]}
              onPress={() => {
                setFlowAppState((prev) => ({ ...prev, selectedStudentId: child.id }))
                navigation.goBack()
              }}
            >
              <View style={styles.childCardRow}>
                <View style={styles.childCardIdentity}>
                  <View style={styles.childCardAvatar}>
                    <Image
                      source={{ uri: child.image }}
                      style={[
                        styles.childCardAvatarImage,
                        { transform: [{ scale: child.imageScale }, { translateY: child.imageOffsetY }] },
                      ]}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.childCardName}>{child.name}</Text>
                </View>
                <View style={styles.childCardStats}>
                  <View style={[styles.childLevelBadge, child.level === "Beginner" ? styles.childLevelBeginner : styles.childLevelAchiever]}>
                    <Text style={[styles.childLevelText, child.level === "Beginner" ? styles.childLevelBeginnerText : styles.childLevelAchieverText]}>
                      {child.level}
                    </Text>
                  </View>
                  <Text style={styles.childCardYearValue}>{child.years}</Text>
                  <Text style={styles.childCardYearLabel}>Years on ClassZ</Text>
                  <View style={styles.childCardDivider} />
                  <View style={styles.childSchoolRow}>
                    <Text style={styles.childSchoolName}>
                      <Text style={styles.childSchoolMark}>z</Text>
                      .school
                    </Text>
                    <Text style={[styles.childSchoolStatus, child.connected ? styles.childSchoolConnected : styles.childSchoolMuted]}>
                      {child.connected ? "connected" : "not connected"}
                    </Text>
                  </View>
                  <View style={styles.childCardDivider} />
                  <View style={styles.childCardMetaRow}>
                    <View style={styles.childCardMeta}>
                      <MaterialCommunityIcons name="gender-male" size={14} color="#0ABAB5" />
                      <Text style={styles.childCardMetaText}>Age {child.age}</Text>
                    </View>
                    {child.sen ? (
                      <View style={styles.childCardMeta}>
                        <MaterialCommunityIcons name="check-circle-outline" size={14} color="#777777" />
                        <Text style={styles.childCardMetaText}>SEN</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </Pressable>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

function PromoteCodeScreen({
  navigation,
  setFlowAppState,
}: {
  navigation: any
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const [code, setCode] = useState("")
  const [termsOpen, setTermsOpen] = useState(false)

  const applyVoucher = (nextCode: string) => {
    setFlowAppState((prev) => ({ ...prev, couponCode: nextCode.trim().toUpperCase() }))
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.classOptionScreen} edges={["top", "bottom"]}>
      <View style={styles.programListHeader}>
        <Pressable accessibilityLabel="Back" hitSlop={10} style={styles.programListBackButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={19} color="#777777" />
        </Pressable>
        <Text style={styles.programListHeaderTitle}>Promote Code</Text>
        <View style={styles.programListHeaderSpacer} />
      </View>
      <ScrollView style={styles.page} contentContainerStyle={styles.promoteContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.promoteInput}>
          <TextInput
            style={styles.promoteInputField}
            placeholder="Promote code"
            placeholderTextColor="#B0B0B0"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Redeem promote code" hitSlop={8} onPress={() => code.trim() && applyVoucher(code.trim())}>
            <Text style={styles.promoteRedeem}>Redeem</Text>
          </Pressable>
        </View>
        {PROMOTE_VOUCHERS.map((voucherId) => (
          <View key={voucherId} style={styles.promoteCard}>
            <View style={styles.promoteCardHeader}>
              <View style={styles.promoteOfferRow}>
                <View style={styles.promoteTicketIcon}>
                  <MaterialCommunityIcons name="percent" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.promoteOffer}>$60 OFF</Text>
              </View>
              <Text style={styles.promoteExpiry}>Until Mar 04, 2026</Text>
            </View>
            <View style={styles.promoteCardBody}>
              <View style={styles.promoteCardCopy}>
                <Text style={styles.promoteSpend}>Min. spend $300</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Selected centres only" style={styles.promoteCentresRow} onPress={() => setTermsOpen(true)}>
                  <Text style={styles.promoteCentres}>Selected centres only</Text>
                  <Feather name="chevron-down" size={14} color="#8A8A8A" />
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Use $60 off voucher" style={styles.promoteUseButton} onPress={() => applyVoucher("LOYAL2026")}>
                <Text style={styles.promoteUseText}>Use</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <Modal visible={termsOpen} transparent animationType="slide" onRequestClose={() => setTermsOpen(false)}>
        <View style={styles.promoteSheetRoot}>
          <Pressable accessibilityLabel="Close terms" style={styles.promoteSheetBackdrop} onPress={() => setTermsOpen(false)} />
          <View style={styles.promoteSheet}>
            <Pressable accessibilityLabel="Close" hitSlop={8} style={styles.promoteSheetClose} onPress={() => setTermsOpen(false)}>
              <Feather name="x" size={16} color="#777777" />
            </Pressable>
            <Text style={styles.promoteSheetTitle}>Terms of use</Text>
            <View style={styles.promoteOfferRow}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={18} color="#0ABAB5" />
              <Text style={styles.promoteOffer}>$60 OFF</Text>
            </View>
            <Text style={styles.promoteSheetMeta}>Min. spend $300</Text>
            <Text style={styles.promoteSheetMeta}>Selected centres only</Text>
            <Text style={styles.promoteSheetMeta}>Expires on Mar 04, 2026</Text>
            <View style={styles.promoteTerms}>
              {PROMOTE_TERMS.map((term) => (
                <View key={term} style={styles.promoteTermRow}>
                  <Text style={styles.promoteTermBullet}>•</Text>
                  <Text style={styles.promoteTermText}>{term}</Text>
                </View>
              ))}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Got it" style={styles.reservationReserveButton} onPress={() => setTermsOpen(false)}>
              <Text style={styles.reservationReserveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function LearningRecordsAppScreen({
  navigation,
  flowAppState,
  setFlowAppState,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const selected = flowAppState.students.find((s) => s.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const count = flowAppState.learningRecords[selected.id] || 0
  const canGenerate = count >= 3
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <Text style={styles.pageTitle}>Learning Records</Text>
        {flowAppState.students.map((s) => {
        const c = flowAppState.learningRecords[s.id] || 0
        return (
          <Pressable
            key={s.id}
            style={[styles.card, styles.elevatedCard, s.id === selected.id ? styles.cardActive : null]}
            onPress={() => setFlowAppState((prev) => ({ ...prev, selectedStudentId: s.id }))}
          >
            <View style={styles.profileHeader}>
              <Image source={{ uri: FIGMA_ASSETS.reservation.child }} style={styles.profileAvatarSmall} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{s.name}</Text>
                <Text style={styles.cardMeta}>{s.parent} · {s.phone}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>{c}/3 records</Text>
          </Pressable>
        )
        })}
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            setFlowAppState((prev) => ({
              ...prev,
              learningRecords: {
                ...prev.learningRecords,
                [selected.id]: (prev.learningRecords[selected.id] || 0) + 1,
              },
            }))
          }
        >
          <Text style={styles.primaryButtonText}>Add Learning Record</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, !canGenerate ? styles.primaryDisabledMain : null]}
          disabled={!canGenerate}
          onPress={() => {
            const animals: Array<"Rabbit" | "Owl" | "Dolphin" | "Turtle" | "Fox" | "Bee"> = ["Rabbit", "Owl", "Dolphin", "Turtle", "Fox", "Bee"]
            const pick = animals[(flowAppState.learningRecords[selected.id] || 0) % animals.length]
            setFlowAppState((prev) => ({
              ...prev,
              generatedCompanions: { ...prev.generatedCompanions, [selected.id]: pick },
            }))
            navigation.navigate("CompanionApp")
          }}
        >
          <Text style={styles.primaryButtonText}>{canGenerate ? "Generate Learning Companion" : `Need ${3 - count} more records`}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const INBOX_PIN_LIMIT = 3

function InboxAppScreen({
  navigation,
  locale,
}: {
  navigation: any
  locale: AppLocale
}) {
  const t = tInbox(locale)
  const [query, setQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [threads, setThreads] = useState<InboxThread[]>(() => INBOX_THREADS.map((thread) => ({ ...thread })))
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({})

  const archivedThreads = threads.filter((thread) => thread.archived)
  const activeThreads = threads
    .filter((thread) => !thread.archived)
    .filter((thread) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return thread.centre.toLowerCase().includes(q) || thread.preview.toLowerCase().includes(q)
    })
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))

  const visibleThreads = showArchived
    ? archivedThreads.filter((thread) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return thread.centre.toLowerCase().includes(q) || thread.preview.toLowerCase().includes(q)
      })
    : activeThreads

  useEffect(() => {
    navigation.setOptions({
      title: showArchived ? t.archived : t.title,
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (showArchived) {
              setShowArchived(false)
              return
            }
            navigation.goBack()
          }}
          style={styles.headerBackIconBtn}
          hitSlop={10}
        >
          <Feather name="chevron-left" size={22} color="#111827" />
        </Pressable>
      ),
    })
  }, [navigation, showArchived, t.archived, t.title])

  useEffect(() => {
    if (showArchived && archivedThreads.length === 0) {
      setShowArchived(false)
    }
  }, [showArchived, archivedThreads.length])

  function closeAllSwipeables(exceptId?: string) {
    Object.entries(swipeableRefs.current).forEach(([id, ref]) => {
      if (id !== exceptId) ref?.close()
    })
  }

  function togglePin(threadId: string) {
    setThreads((prev) => {
      const target = prev.find((item) => item.id === threadId)
      if (!target) return prev
      if (target.pinned) {
        return prev.map((item) => (item.id === threadId ? { ...item, pinned: false } : item))
      }
      const pinnedCount = prev.filter((item) => item.pinned && !item.archived).length
      if (pinnedCount >= INBOX_PIN_LIMIT) {
        Alert.alert(t.pin, t.pinLimit)
        return prev
      }
      return prev.map((item) => (item.id === threadId ? { ...item, pinned: true } : item))
    })
    swipeableRefs.current[threadId]?.close()
  }

  function archiveThread(threadId: string) {
    setThreads((prev) =>
      prev.map((item) => (item.id === threadId ? { ...item, archived: true, pinned: false } : item)),
    )
    swipeableRefs.current[threadId]?.close()
  }

  function unarchiveThread(threadId: string) {
    setThreads((prev) =>
      prev.map((item) => (item.id === threadId ? { ...item, archived: false } : item)),
    )
    swipeableRefs.current[threadId]?.close()
  }

  function deleteThread(threadId: string) {
    setThreads((prev) => prev.filter((item) => item.id !== threadId))
  }

  function renderRightActions(thread: InboxThread) {
    if (showArchived) {
      return (
        <View style={styles.inboxSwipeActions}>
          <Pressable
            style={[styles.inboxSwipeBtn, styles.inboxSwipeArchive]}
            onPress={() => unarchiveThread(thread.id)}
          >
            <Feather name="archive" size={18} color="#fff" />
            <Text style={styles.inboxSwipeBtnText}>{t.unarchive}</Text>
          </Pressable>
          <Pressable
            style={[styles.inboxSwipeBtn, styles.inboxSwipeDelete]}
            onPress={() => deleteThread(thread.id)}
          >
            <Feather name="trash-2" size={18} color="#fff" />
            <Text style={styles.inboxSwipeBtnText}>{t.delete}</Text>
          </Pressable>
        </View>
      )
    }

    return (
      <View style={styles.inboxSwipeActions}>
        <Pressable
          style={[styles.inboxSwipeBtn, styles.inboxSwipePin]}
          onPress={() => togglePin(thread.id)}
        >
          <MaterialCommunityIcons name={thread.pinned ? "pin-off" : "pin"} size={18} color="#fff" />
          <Text style={styles.inboxSwipeBtnText} numberOfLines={2}>
            {thread.pinned ? t.unpin : t.pin}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.inboxSwipeBtn, styles.inboxSwipeArchive]}
          onPress={() => archiveThread(thread.id)}
        >
          <Feather name="archive" size={18} color="#fff" />
          <Text style={styles.inboxSwipeBtnText}>{t.archive}</Text>
        </Pressable>
        <Pressable
          style={[styles.inboxSwipeBtn, styles.inboxSwipeDelete]}
          onPress={() => deleteThread(thread.id)}
        >
          <Feather name="trash-2" size={18} color="#fff" />
          <Text style={styles.inboxSwipeBtnText}>{t.delete}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.inboxPageContent}>
        {!showArchived && archivedThreads.length > 0 ? (
          <Pressable style={styles.inboxArchivedRow} onPress={() => setShowArchived(true)}>
            <View style={styles.inboxArchivedIconWrap}>
              <Feather name="archive" size={18} color="#5E5E5E" />
            </View>
            <Text style={styles.inboxArchivedText}>{t.archived}</Text>
            <Text style={styles.inboxArchivedCount}>{archivedThreads.length}</Text>
            <Feather name="chevron-right" size={16} color="#B0B0B0" />
          </Pressable>
        ) : null}

        <View style={styles.inboxSearchPad}>
          <View style={styles.searchInputWrap}>
            <Feather name="search" size={16} color="#717171" />
            <TextInput
              style={styles.searchInput}
              placeholder={t.search}
              placeholderTextColor="#717171"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        {visibleThreads.length === 0 ? (
          <Text style={[styles.cardMeta, styles.inboxSearchPad]}>{t.empty}</Text>
        ) : (
          visibleThreads.map((thread, idx) => (
            <Swipeable
              key={thread.id}
              ref={(ref) => {
                swipeableRefs.current[thread.id] = ref
              }}
              overshootRight={false}
              friction={2}
              rightThreshold={40}
              renderRightActions={() => renderRightActions(thread)}
              onSwipeableWillOpen={() => closeAllSwipeables(thread.id)}
            >
              <Pressable
                style={styles.inboxThreadRow}
                onPress={() => {
                  closeAllSwipeables()
                  setThreads((prev) =>
                    prev.map((item) => (item.id === thread.id ? { ...item, unread: false } : item)),
                  )
                  navigation.navigate("InboxMessageApp", { threadId: thread.id })
                }}
              >
                <View style={styles.inboxThreadAvatar}>
                  <Text style={styles.inboxThreadAvatarText}>Z</Text>
                </View>
                <View style={styles.inboxThreadBody}>
                  <View style={styles.inboxThreadTitleRow}>
                    <Text
                      style={[styles.inboxThreadCentre, thread.unread ? styles.inboxUnreadText : null]}
                      numberOfLines={1}
                    >
                      {thread.centre}
                    </Text>
                    {thread.pinned && !showArchived ? (
                      <MaterialCommunityIcons name="pin" size={14} color="#0ABAB5" />
                    ) : null}
                  </View>
                  <Text
                    style={[styles.inboxThreadPreview, thread.unread ? styles.inboxUnreadText : null]}
                    numberOfLines={1}
                  >
                    {thread.preview}
                  </Text>
                  <View style={styles.inboxThreadMetaRow}>
                    <Text style={styles.inboxThreadMeta}>{thread.date}</Text>
                    <Text style={styles.inboxThreadMeta}>{thread.time}</Text>
                  </View>
                </View>
                {idx < visibleThreads.length - 1 ? <View style={styles.inboxDivider} /> : null}
              </Pressable>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function InboxMessageAppScreen({
  navigation,
  route,
  locale,
}: {
  navigation: any
  route: { params: { threadId: string } }
  locale: AppLocale
}) {
  const t = tInbox(locale)
  const thread = findInboxThread(route.params.threadId)
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<InboxChatMessage[]>(() => getInboxMessages(route.params.threadId))
  const chatListRef = useRef<ScrollView>(null)

  function sendMessage() {
    const text = draft.trim()
    if (!text) return
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, "0")
    const mm = String(now.getMinutes()).padStart(2, "0")
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, from: "me", text, time: `${hh}:${mm}` },
    ])
    setDraft("")
    requestAnimationFrame(() => chatListRef.current?.scrollToEnd({ animated: true }))
  }

  if (!thread) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.pageContent}>
          <Text style={styles.cardMeta}>{t.empty}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.inboxMessageHeader}>
        <Pressable
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.programListBackButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={19} color="#777777" />
        </Pressable>
        <View style={styles.inboxMessageHeaderCopy}>
          <Text style={styles.inboxMessageHeaderTitle} numberOfLines={2}>
            {thread.centre}
          </Text>
          <Text style={styles.inboxResponseTime}>{t.responseTime(thread.responseTime)}</Text>
        </View>
        <View style={styles.inboxMessageHeaderSpacer} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={chatListRef}
          style={styles.page}
          contentContainerStyle={styles.inboxChatContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.inboxTodayBadge}>
            <Text style={styles.inboxTodayBadgeText}>{t.today}</Text>
          </View>
          {messages.map((msg) => {
            const mine = msg.from === "me"
            return (
              <View key={msg.id} style={[styles.inboxBubbleRow, mine ? styles.inboxBubbleRowMine : null]}>
                {!mine ? (
                  <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.inboxChatAvatarImage} resizeMode="cover" />
                ) : null}
                <View style={[styles.inboxBubbleCol, mine ? styles.inboxBubbleColMine : null]}>
                  <View style={[styles.inboxBubble, mine ? styles.inboxBubbleMine : styles.inboxBubbleCentre]}>
                    <Text style={[styles.inboxBubbleText, mine ? styles.inboxBubbleTextMine : null]}>{msg.text}</Text>
                  </View>
                  <Text style={[styles.inboxBubbleTime, mine ? styles.inboxBubbleTimeMine : null]}>{msg.time}</Text>
                </View>
                {mine ? (
                  <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.inboxChatAvatarImage} resizeMode="cover" />
                ) : null}
              </View>
            )
          })}
        </ScrollView>
        <View style={styles.inboxComposerWrap}>
          <View style={styles.inboxComposerInputWrap}>
            <TextInput
              style={styles.inboxComposerInput}
              placeholder={t.typeMessage}
              placeholderTextColor="#B0B0B0"
              value={draft}
              onChangeText={setDraft}
              multiline
              textAlignVertical="center"
              onFocus={() => requestAnimationFrame(() => chatListRef.current?.scrollToEnd({ animated: true }))}
            />
            <Feather name="camera" size={18} color="#B0B0B0" />
          </View>
          <Pressable style={styles.inboxSendBtn} onPress={sendMessage}>
            <Feather name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function NotificationAppScreen({ locale }: { locale: AppLocale }) {
  const t = tNotification(locale)
  const [items, setItems] = useState(() => getNotificationsLatestFirst())

  function categoryLabel(item: ClassNotification) {
    return item.category === "account" ? t.account : t.classUpdate
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.notificationPageContent}>
        {items.length === 0 ? (
          <Text style={styles.cardMeta}>{t.empty}</Text>
        ) : (
          items.map((item, idx) => (
            <Pressable key={item.id} onPress={() => markRead(item.id)} style={styles.notificationItem}>
              <Text style={[styles.notificationCategory, item.unread ? styles.notificationTextUnread : null]}>
                {categoryLabel(item)}
              </Text>
              <View style={styles.notificationSenderRow}>
                <View style={styles.notificationAvatar}>
                  <Text style={styles.notificationAvatarText}>Z</Text>
                </View>
                <Text
                  style={[styles.notificationCentre, item.unread ? styles.notificationTextUnread : null]}
                  numberOfLines={1}
                >
                  {item.centre}
                </Text>
              </View>
              <Text style={[styles.notificationNote, item.unread ? styles.notificationTextUnread : null]}>
                {item.note}
              </Text>
              <View style={styles.notificationMetaRow}>
                <Text style={styles.notificationMeta}>{item.date}</Text>
                <Text style={styles.notificationMeta}>{item.time}</Text>
              </View>
              {idx < items.length - 1 ? <View style={styles.notificationDivider} /> : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function FigmaFlowLibraryScreen({ navigation }: { navigation: any }) {
  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<FigmaFlowGroup | "all">("all")
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const base = group === "all" ? FIGMA_FLOW_ITEMS : FIGMA_FLOW_BY_GROUP[group]
    if (!needle) return base
    return base.filter((item) => item.name.toLowerCase().includes(needle) || item.id.includes(needle))
  }, [search, group])

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pageContent}>
        <Text style={styles.pageTitle}>Figma Mobile Flow</Text>
        <TextInput value={search} onChangeText={setSearch} style={styles.input} placeholder="Search screen name / node id" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <Pressable style={[styles.filterPill, group === "all" ? styles.filterPillActive : null]} onPress={() => setGroup("all")}>
              <Text style={styles.filterPillText}>All</Text>
            </Pressable>
            {FIGMA_FLOW_GROUPS.map((g) => (
              <Pressable key={g} style={[styles.filterPill, group === g ? styles.filterPillActive : null]} onPress={() => setGroup(g)}>
                <Text style={styles.filterPillText}>{FIGMA_FLOW_GROUP_LABELS[g]}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.id}-${item.name}`}
          renderItem={({ item }) => (
            <Pressable style={styles.flowItem} onPress={() => navigation.navigate("FigmaFlowDetail", { itemId: item.id })}>
              <Text style={styles.flowTitle}>{item.name}</Text>
              <Text style={styles.flowMeta}>
                {item.id} • {item.group}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  )
}

function FigmaFlowDetailScreen({ route, navigation }: { route: { params: { itemId: string } }; navigation: any }) {
  const item = findFlowItem(route.params.itemId)
  if (!item) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.pageContent}>
          <Text style={styles.pageTitle}>Flow not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const flow = FIGMA_FLOW_BY_GROUP[item.group]
  const index = flow.findIndex((it) => it.id === item.id)
  const prev = index > 0 ? flow[index - 1] : null
  const next = index < flow.length - 1 ? flow[index + 1] : null

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pageContent}>
        <Text style={styles.pageTitle}>{item.name}</Text>
        <View style={styles.card}>
          <Text style={styles.cardMeta}>Node ID: {item.id}</Text>
          <Text style={styles.cardMeta}>Flow Group: {FIGMA_FLOW_GROUP_LABELS[item.group]}</Text>
          <Text style={styles.cardMeta}>Step: {index + 1} / {flow.length}</Text>
          <Text style={styles.cardMeta}>Design source: Figma file `GmdFYzfDwKyURdqdeUnGx2`</Text>
        </View>
        <View style={styles.row}>
          <Pressable style={[styles.secondaryButton, styles.flex1]} disabled={!prev} onPress={() => prev && navigation.replace("FigmaFlowDetail", { itemId: prev.id })}>
            <Text style={styles.secondaryButtonText}>{prev ? `Prev: ${prev.name}` : "No previous"}</Text>
          </Pressable>
          <Pressable style={[styles.primaryButton, styles.flex1]} disabled={!next} onPress={() => next && navigation.replace("FigmaFlowDetail", { itemId: next.id })}>
            <Text style={styles.primaryButtonText}>{next ? `Next: ${next.name}` : "End"}</Text>
          </Pressable>
        </View>
        <FlowPreviewCard item={item} />
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("FlowRunner", { group: item.group, itemId: item.id })}>
          <Text style={styles.secondaryButtonText}>Open flow runner for this group</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function FlowRunnerScreen({
  route,
  navigation,
  flowAppState,
  setFlowAppState,
}: {
  route: { params: { group: FigmaFlowGroup; itemId?: string } }
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const { group, itemId } = route.params
  const flow = FIGMA_FLOW_BY_GROUP[group]
  const initialIndex = itemId ? Math.max(flow.findIndex((it) => it.id === itemId), 0) : 0
  const [index, setIndex] = useState(initialIndex)
  const active = flow[index] || null

  useEffect(() => {
    navigation.setOptions({ title: FIGMA_FLOW_GROUP_LABELS[group] })
  }, [group, navigation])

  if (!active) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.pageContent}>
          <Text style={styles.pageTitle}>No items in this flow</Text>
        </View>
      </SafeAreaView>
    )
  }

  function goToFlowName(targetName: string) {
    const idx = flow.findIndex((it) => it.name.toLowerCase().includes(targetName.toLowerCase()))
    if (idx >= 0) setIndex(idx)
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pageContent}>
        <Text style={styles.pageTitle}>{FIGMA_FLOW_GROUP_LABELS[group]}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{active.name}</Text>
          <Text style={styles.cardMeta}>Node: {active.id}</Text>
          <Text style={styles.cardMeta}>Step {index + 1} / {flow.length}</Text>
        </View>
        <View style={styles.row}>
          <Pressable style={[styles.secondaryButton, styles.flex1]} disabled={index === 0} onPress={() => setIndex((x) => Math.max(0, x - 1))}>
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </Pressable>
          <Pressable style={[styles.primaryButton, styles.flex1]} disabled={index === flow.length - 1} onPress={() => setIndex((x) => Math.min(flow.length - 1, x + 1))}>
            <Text style={styles.primaryButtonText}>Next</Text>
          </Pressable>
        </View>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("FigmaFlowDetail", { itemId: active.id })}>
          <Text style={styles.secondaryButtonText}>Open detailed screen card</Text>
        </Pressable>
        <FlowPreviewCard item={active} compact />
        <FlowApplicationSurface item={active} state={flowAppState} setState={setFlowAppState} onGoToFlowName={goToFlowName} />
        <Text style={styles.helperText}>Jump to any step:</Text>
        {flow.map((item, idx) => (
          <Pressable key={item.id} style={[styles.flowItem, idx === index ? styles.flowItemActive : null]} onPress={() => setIndex(idx)}>
            <Text style={styles.flowTitle}>{idx + 1}. {item.name}</Text>
            <Text style={styles.flowMeta}>{item.id}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function FlowPreviewCard({ item, compact = false }: { item: FigmaFlowItem; compact?: boolean }) {
  return (
    <View style={styles.previewShell}>
      <Text style={styles.previewTitle}>UI Preview</Text>
      <View style={styles.previewPhone}>
        <FlowPreview item={item} compact={compact} />
      </View>
    </View>
  )
}

function FlowPreview({ item, compact = false }: { item: FigmaFlowItem; compact?: boolean }) {
  const name = item.name.toLowerCase()
  if (name.includes("login") || name.includes("account type") || name.includes("register")) {
    return <LoginPreview compact={compact} />
  }
  if (name.includes("main")) return <MainPreview compact={compact} />
  if (name.includes("search")) return <SearchPreview compact={compact} />
  if (name.includes("reservation") || name.includes("booking")) return <ReservationPreview compact={compact} />
  if (name.includes("schedule") || name.includes("calendar") || name.includes("attendance")) return <SchedulePreview compact={compact} />
  if (name.includes("learning companion") || name.includes("rabbit") || name.includes("owl") || name.includes("fox") || name.includes("bee") || name.includes("dolphin") || name.includes("turtle")) {
    return <CompanionPreview compact={compact} />
  }
  if (name.includes("learning record") || name.includes("academic") || name.includes("activity")) {
    return <LearningRecordPreview compact={compact} />
  }
  if (name.includes("profile")) return <ProfilePreview compact={compact} />
  if (name.includes("inbox") || name.includes("message") || name.includes("notification")) return <InboxPreview compact={compact} />
  return <GenericPreview item={item} compact={compact} />
}

function LoginPreview({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.previewPage}>
      <View style={styles.previewLogoWrap}>
        <SvgXml
          xml={LOGIN_SVGS.logoMark}
          width={compact ? 66 : 78}
          height={compact ? 78 : 92}
        />
        <SvgXml xml={LOGIN_SVGS.logoWord} width={105} height={28} />
      </View>
      <View style={styles.loginRoleRow}>
        <Text style={styles.loginRoleTabActive}>User</Text>
        <Text style={styles.loginRoleTab}>Coach</Text>
        <Text style={styles.loginRoleTab}>Centre</Text>
      </View>
      <View style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Login</Text>
      </View>
      <View style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Register</Text>
      </View>
    </View>
  )
}

function MainPreview({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>Recommend you</Text>
      <View style={styles.previewHeroCard}>
        <Image source={{ uri: FIGMA_ASSETS.main.recommend1 }} style={styles.previewHeroImage} />
        <Text style={styles.previewHeroTitle}>Bright Kidz Playgroup Centre</Text>
        <Text style={styles.previewMeta}>$299 lesson • Causeway Bay • ★4.91</Text>
      </View>
      <View style={styles.previewPillsRow}>
        {["Music", "Art", "STEM", "Academic"].map((c) => (
          <View key={c} style={styles.previewPill}>
            <Text style={styles.previewPillText}>{c}</Text>
          </View>
        ))}
      </View>
      {!compact ? (
        <>
          <Image source={{ uri: FIGMA_ASSETS.main.banner }} style={styles.previewBannerImage} />
          <Text style={styles.previewHeading}>Trending Workshop</Text>
          <View style={styles.previewHeroCard}>
            <Image source={{ uri: FIGMA_ASSETS.main.trending1 }} style={styles.previewHeroImage} />
            <Text style={styles.previewHeroTitle}>Homework at Home Workshop</Text>
            <Text style={styles.previewMeta}>12 Apr 2026</Text>
          </View>
        </>
      ) : null}
      {!compact ? <PreviewBottomNav active="home" /> : null}
    </View>
  )
}

function SearchPreview({ compact }: { compact?: boolean }) {
  const cards = [
    { key: "STEM", src: FIGMA_ASSETS.search.stem },
    { key: "Sports", src: FIGMA_ASSETS.search.sports },
    { key: "Academic", src: FIGMA_ASSETS.search.academic },
    { key: "Art", src: FIGMA_ASSETS.search.art },
    { key: "Music", src: FIGMA_ASSETS.search.music },
    { key: "Others", src: FIGMA_ASSETS.search.others },
  ]
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>Search</Text>
      <View style={styles.previewSearchInput}>
        <Text style={styles.previewSearchText}>What to learn?</Text>
      </View>
      <View style={styles.previewGrid}>
        {cards.slice(0, compact ? 4 : 6).map((c, idx) => (
          <View key={c.key} style={[styles.previewGridCard, { backgroundColor: previewPalette[idx % previewPalette.length] }]}>
            <Image source={{ uri: c.src }} style={styles.previewGridImage} />
            <View style={styles.previewGridOverlay} />
            <Text style={styles.previewGridText}>{c.key}</Text>
          </View>
        ))}
      </View>
      {!compact ? <PreviewBottomNav active="search" /> : null}
    </View>
  )
}

function ReservationPreview({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>Reservation</Text>
      <View style={styles.previewHeroCard}>
        <Image source={{ uri: FIGMA_ASSETS.reservation.program }} style={styles.previewHeroImageTall} />
        <Text style={styles.previewHeroTitle}>ClassZ Guitar Program</Text>
        <Text style={styles.previewMeta}>8 lessons • Oct 23 - Nov 28</Text>
      </View>
      <View style={styles.previewHeroCard}>
        <View style={styles.previewAvatarRow}>
          <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.previewAvatar} />
          <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.previewAvatar} />
          <Image source={{ uri: FIGMA_ASSETS.reservation.child }} style={styles.previewAvatar} />
        </View>
        <Text style={styles.previewHeroTitle}>Hosted by ClassZ Playgroup</Text>
        <Text style={styles.previewMeta}>Athena Yeung • Program Coach</Text>
      </View>
      {!compact ? (
        <View style={styles.previewPriceBlock}>
          <Text style={styles.previewSubHeading}>Pay with</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_ICONS.map((icon) => (
              <SvgXml key={icon.id} xml={icon.xml} width={icon.width} height={icon.height} />
            ))}
          </View>
          <Text style={styles.previewLinkText}>Promote code · Add</Text>
          <Text style={styles.previewPriceNow}>$299 lesson</Text>
          <Text style={styles.previewMeta}>Total (HKD) $3,197</Text>
          <View style={[styles.primaryButton, { marginTop: 8 }]}>
            <Text style={styles.primaryButtonText}>Reserve</Text>
          </View>
        </View>
      ) : null}
      {!compact ? <PreviewBottomNav active="calendar" /> : null}
    </View>
  )
}

function SchedulePreview({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>Schedule</Text>
      <View style={styles.previewCalendarBlock}>
        <Text style={styles.previewMeta}>Mon Tue Wed Thu Fri Sat Sun</Text>
        <Text style={styles.previewHeroTitle}>Oct 23 - Nov 28</Text>
      </View>
      {["ClassZ STEM (10:00)", "Art Workshop (14:00)", "Guitar Program (16:00)"].slice(0, compact ? 2 : 3).map((x) => (
        <View key={x} style={styles.previewListRow}>
          <Text style={styles.previewHeroTitle}>{x}</Text>
          <Text style={styles.previewMeta}>Booked</Text>
        </View>
      ))}
    </View>
  )
}

function LearningRecordPreview({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>Learning Record</Text>
      <View style={styles.previewStatsRow}>
        <View style={styles.previewStatCard}>
          <Text style={styles.previewStatValue}>31</Text>
          <Text style={styles.previewStatLabel}>Students</Text>
        </View>
        <View style={styles.previewStatCard}>
          <Text style={styles.previewStatValue}>19</Text>
          <Text style={styles.previewStatLabel}>Pending</Text>
        </View>
        <View style={styles.previewStatCard}>
          <Text style={styles.previewStatValue}>12</Text>
          <Text style={styles.previewStatLabel}>Completed</Text>
        </View>
      </View>
      {["Charlie Wong", "Sophie Chan", "Leo Ng"].slice(0, compact ? 2 : 3).map((x) => (
        <View key={x} style={styles.previewListRow}>
          <Text style={styles.previewHeroTitle}>{x}</Text>
          <Text style={styles.previewMeta}>2/3 records</Text>
        </View>
      ))}
    </View>
  )
}

function CompanionPreview({ compact }: { compact?: boolean }) {
  const [activeAnimal, setActiveAnimal] = useState<CompanionAnimalKey>("rabbit")
  const animals = [
    { key: "rabbit", name: "Rabbit", color: "#FDDCEC", initial: "R" },
    { key: "owl", name: "Owl", color: "#E6D9FF", initial: "O" },
    { key: "dolphin", name: "Dolphin", color: "#D5EEFF", initial: "D" },
    { key: "turtle", name: "Turtle", color: "#D8F5D0", initial: "T" },
    { key: "fox", name: "Fox", color: "#FFE4CC", initial: "F" },
    { key: "bee", name: "Bee", color: "#FFF4BA", initial: "B" },
  ] as const
  const active = animals.find((x) => x.key === activeAnimal) || animals[0]
  const poses = companionPosesFor(active.key)
  const sectionTitles = ["What may help", "Why we think this", "Supporting companion", "Strategies and next step"]
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>Learning Companion</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.companionTabsRow}>
          {animals.map((a) => (
            <Pressable key={a.name} style={[styles.companionTab, a.key === activeAnimal ? styles.companionTabActive : null]} onPress={() => setActiveAnimal(a.key)}>
              <Text style={styles.companionTabText}>{a.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.previewCompanionHero}>
        <View style={[styles.companionBadge, { backgroundColor: active.color }]}>
          <Text style={styles.companionBadgeText}>{active.initial}</Text>
        </View>
        <Text style={styles.previewCompanionName}>{active.name}</Text>
        <Text style={styles.previewMeta}>Creative • Curious • Warm</Text>
      </View>
      {sectionTitles.slice(0, compact ? 3 : 4).map((x, idx) => (
        <View key={x} style={styles.previewListRow}>
          <Image source={{ uri: poses[idx] }} style={styles.sectionArtImage} />
          <Text style={styles.previewHeroTitle}>{x}</Text>
          <Text style={styles.previewMeta}>Pose slot</Text>
        </View>
      ))}
      {!compact ? <PreviewBottomNav active="chart" /> : null}
    </View>
  )
}

function ProfilePreview({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>Profile</Text>
      <View style={styles.previewHeroCard}>
        <Text style={styles.previewHeroTitle}>Emily Wong</Text>
        <Text style={styles.previewMeta}>Parent account</Text>
      </View>
      {["Child profile", "Settings", "Language", "Change password"].slice(0, compact ? 3 : 4).map((x) => (
        <View key={x} style={styles.previewListRow}>
          <Text style={styles.previewHeroTitle}>{x}</Text>
          <Text style={styles.previewMeta}>Open</Text>
        </View>
      ))}
    </View>
  )
}

function InboxPreview({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>Inbox / Notification</Text>
      {["Class reminder message", "Payment notice", "Center announcement"].slice(0, compact ? 2 : 3).map((x) => (
        <View key={x} style={styles.previewListRow}>
          <Text style={styles.previewHeroTitle}>{x}</Text>
          <Text style={styles.previewMeta}>Just now</Text>
        </View>
      ))}
    </View>
  )
}

function GenericPreview({ item, compact }: { item: FigmaFlowItem; compact?: boolean }) {
  return (
    <View style={styles.previewPage}>
      <Text style={styles.previewHeading}>{item.name}</Text>
      <View style={styles.previewHeroCard}>
        <Text style={styles.previewHeroTitle}>{FIGMA_FLOW_GROUP_LABELS[item.group]}</Text>
        <Text style={styles.previewMeta}>Node {item.id}</Text>
      </View>
      <View style={styles.previewListRow}>
        <Text style={styles.previewHeroTitle}>This screen is connected</Text>
        <Text style={styles.previewMeta}>{compact ? "Runner" : "Detail"}</Text>
      </View>
    </View>
  )
}

function PreviewBottomNav({ active }: { active: "home" | "search" | "calendar" | "chart" | "profile" }) {
  const icons: Array<{ key: "home" | "search" | "calendar" | "chart" | "profile"; src: string }> = [
    { key: "home", src: FIGMA_ASSETS.nav.home },
    { key: "search", src: FIGMA_ASSETS.nav.search },
    { key: "calendar", src: FIGMA_ASSETS.nav.calendar },
    { key: "chart", src: FIGMA_ASSETS.nav.chart },
    { key: "profile", src: FIGMA_ASSETS.nav.profile },
  ]
  return (
    <View style={styles.bottomNavWrap}>
      {icons.map((it) => (
        <View key={it.key} style={[styles.bottomNavIconWrap, active === it.key ? styles.bottomNavIconActive : null]}>
          <Image source={{ uri: it.src }} style={styles.bottomNavIcon} />
        </View>
      ))}
    </View>
  )
}

const previewPalette = ["#0ABAB5", "#F4AE00", "#80AA5B", "#A155FE", "#E22255", "#419AFF"]

type CompanionAnimalKey = "rabbit" | "owl" | "dolphin" | "turtle" | "fox" | "bee"

function assetHostFromEnv(): string {
  const explicit = process.env.EXPO_PUBLIC_WEB_ASSET_BASE_URL
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit.replace(/\/$/, "")
  const api = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3003"
  try {
    const u = new URL(api)
    const port = u.port === "3003" ? "3000" : u.port || "3000"
    return `${u.protocol}//${u.hostname}:${port}`
  } catch {
    return "http://localhost:3000"
  }
}

function companionPosesFor(animal: CompanionAnimalKey): string[] {
  const base = `${assetHostFromEnv()}/assets/learning-companion/${animal}`
  const map: Record<CompanionAnimalKey, number[]> = {
    rabbit: [1, 2, 3, 4, 5, 6],
    owl: [7, 8, 9, 10, 11, 12],
    dolphin: [13, 14, 15, 16, 17, 18],
    turtle: [19, 20, 21, 22, 23, 24],
    fox: [25, 26, 27, 28, 29, 30],
    bee: [31, 32, 33, 34, 35, 36],
  }
  return map[animal].map((n) => `${base}/pose-${String(n).padStart(2, "0")}.png`)
}

function programImageFor(category: string): string {
  const c = category.toLowerCase()
  if (c.includes("stem")) return FIGMA_ASSETS.search.stem
  if (c.includes("sport")) return FIGMA_ASSETS.search.sports
  if (c.includes("academic")) return FIGMA_ASSETS.search.academic
  if (c.includes("art")) return FIGMA_ASSETS.search.art
  if (c.includes("music")) return FIGMA_ASSETS.search.music
  return FIGMA_ASSETS.search.others
}

function homeCategoryIcon(category: string): string {
  const c = category.toLowerCase()
  if (c.includes("music")) return FIGMA_ASSETS.search.music
  if (c.includes("art")) return FIGMA_ASSETS.search.art
  if (c.includes("stem")) return FIGMA_ASSETS.search.stem
  return FIGMA_ASSETS.search.academic
}

function companionZSirImage(): string {
  return `${assetHostFromEnv()}/assets/learning-companion/z-sir.png`
}

function AllFlowsOverviewScreen({ navigation }: { navigation: any }) {
  const total = FIGMA_FLOW_ITEMS.length
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pageContent}>
        <Text style={styles.pageTitle}>Flow Coverage</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{total} mapped screens</Text>
          <Text style={styles.cardMeta}>All Figma groups are wired with route access and runner navigation.</Text>
        </View>
        {FIGMA_FLOW_GROUPS.map((group) => {
          const items = FIGMA_FLOW_BY_GROUP[group]
          return (
            <View key={group} style={styles.card}>
              <Text style={styles.cardTitle}>{FIGMA_FLOW_GROUP_LABELS[group]}</Text>
              <Text style={styles.cardMeta}>{items.length} screens</Text>
              <View style={styles.row}>
                <Pressable style={[styles.secondaryButton, styles.flex1]} onPress={() => navigation.navigate("FlowRunner", { group })}>
                  <Text style={styles.secondaryButtonText}>Run group</Text>
                </Pressable>
                <Pressable style={[styles.primaryButton, styles.flex1]} onPress={() => navigation.navigate("FigmaFlowDetail", { itemId: items[0]?.id })} disabled={!items[0]}>
                  <Text style={styles.primaryButtonText}>Open first</Text>
                </Pressable>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

function AppTabs({
  session,
  onSignOut,
  flowAppState,
  setFlowAppState,
  locale,
  onToggleLocale,
}: {
  session: Session
  onSignOut: () => Promise<void>
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
  locale: AppLocale
  onToggleLocale: () => void
}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#0ABAB5",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: APP_TAB_BAR_STYLE,
        tabBarItemStyle: {
          height: 60,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarIconStyle: {
          width: 34,
          height: 30,
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarIcon: ({ color, focused }) => {
          const routeName = route.name as keyof TabsParamList
          if (routeName === "Profile") {
            return (
              <View style={styles.realTabIconWrap}>
                <Image
                  source={{ uri: FIGMA_ASSETS.reservation.coach }}
                  style={[styles.profileTabAvatar, focused ? styles.profileTabAvatarActive : null]}
                  resizeMode="cover"
                />
              </View>
            )
          }
          return (
            <View style={styles.realTabIconWrap}>
              <Image
                source={NAV_ICONS[routeName]}
                style={[styles.realTabIcon, { tintColor: color }]}
              />
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => (
          <HomeScreen
            {...props}
            flowAppState={flowAppState}
            setFlowAppState={setFlowAppState}
            locale={locale}
            onToggleLocale={onToggleLocale}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Search"
        listeners={{
          tabPress: () => {
            setFlowAppState((prev) => ({ ...prev, selectedCategory: null, searchQuery: "" }))
          },
        }}
      >
        {(props) => (
          <SearchTabScreen
            {...props}
            flowAppState={flowAppState}
            setFlowAppState={setFlowAppState}
            locale={locale}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Calendar">
        {(props) => <CalendarTabScreen {...props} flowAppState={flowAppState} />}
      </Tab.Screen>
      <Tab.Screen name="Analytics">
        {(props) => <AnalyticsTabScreen {...props} flowAppState={flowAppState} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} session={session} onSignOut={onSignOut} flowAppState={flowAppState} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export default function App() {
  const [booting, setBooting] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [flowAppState, setFlowAppState] = useState<FlowAppState>(() => createInitialFlowAppState())
  const [locale, setLocale] = useState<AppLocale>("en")

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY)
        const savedLocale = await AsyncStorage.getItem(LOCALE_KEY)
        if (raw) {
          setSession(JSON.parse(raw) as Session)
        }
        if (savedLocale === "en" || savedLocale === "zh-Hant" || savedLocale === "zh-Hans") {
          setLocale(savedLocale)
        }
      } finally {
        setBooting(false)
      }
    })()
  }, [])

  async function toggleLocale() {
    const next = nextLocale(locale)
    setLocale(next)
    await AsyncStorage.setItem(LOCALE_KEY, next)
  }

  async function selectLocale(next: AppLocale) {
    setLocale(next)
    await AsyncStorage.setItem(LOCALE_KEY, next)
  }

  async function signIn(next: Session) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next))
    setSession(next)
  }

  async function signOut() {
    await AsyncStorage.removeItem(SESSION_KEY)
    setSession(null)
  }

  if (booting) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.flex1}>
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        {!session ? (
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="AuthLanding" component={AuthLandingScreen} />
            <Stack.Screen name="Login">
              {(props) => <LoginFormScreen {...props} onSignIn={signIn} apiLogin={apiLogin} />}
            </Stack.Screen>
            <Stack.Screen name="RegisterAccountType">
              {(props) => <RegisterAccountTypeScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="RegisterForm"
              options={{ contentStyle: { backgroundColor: "#D7F4F3" } }}
            >
              {(props) => <RegisterFormScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="ForgotPassword">
              {(props) => <ForgotPasswordScreen {...props} />}
            </Stack.Screen>
          </Stack.Navigator>
        ) : (
          <Stack.Navigator
            screenOptions={({ navigation, route }) => ({
              headerBackVisible: false,
              headerLeft:
                route.name === "AppTabs"
                  ? undefined
                  : () => (
                      <Pressable onPress={() => navigation.goBack()} style={styles.headerBackIconBtn} hitSlop={10}>
                        <Feather name="chevron-left" size={22} color="#111827" />
                      </Pressable>
                    ),
            })}
          >
            <Stack.Screen name="AppTabs" options={{ headerShown: false }}>
              {() => (
                <AppTabs
                  session={session}
                  onSignOut={signOut}
                  flowAppState={flowAppState}
                  setFlowAppState={setFlowAppState}
                  locale={locale}
                  onToggleLocale={toggleLocale}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="CentreDetailApp" options={{ headerShown: false }}>
              {(props) => (
                <CentreDetailScreen
                  {...props}
                  flowAppState={flowAppState}
                  setFlowAppState={setFlowAppState}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ReviewApp" options={{ headerShown: false }}>
              {(props) => <ReviewScreen {...props} flowAppState={flowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="MemberProfileApp" options={{ headerShown: false }}>
              {(props) => <MemberProfileScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="ProgramListApp" options={{ headerShown: false }}>
              {(props) => (
                <ProgramListScreen
                  {...props}
                  flowAppState={flowAppState}
                  setFlowAppState={setFlowAppState}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ClassOptionApp" options={{ headerShown: false }}>
              {(props) => (
                <ClassOptionScreen
                  {...props}
                  flowAppState={flowAppState}
                  setFlowAppState={setFlowAppState}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ReservationApp" options={{ headerShown: false }}>
              {(props) => <ReservationAppScreen {...props} flowAppState={flowAppState} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="ReservationConfirmedApp" options={{ headerShown: false }}>
              {(props) => <ReservationConfirmedScreen {...props} flowAppState={flowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="SelectChildApp" options={{ headerShown: false }}>
              {(props) => <SelectChildScreen {...props} flowAppState={flowAppState} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="PromoteCodeApp" options={{ headerShown: false }}>
              {(props) => <PromoteCodeScreen {...props} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="PersonalSettingApp" options={{ headerShown: false }}>
              {(props) => <PersonalSettingScreen {...props} session={session} />}
            </Stack.Screen>
            <Stack.Screen name="ChangePasswordApp" options={{ headerShown: false }}>
              {(props) => <ChangePasswordScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="LanguageApp" options={{ headerShown: false }}>
              {(props) => <LanguageScreen {...props} locale={locale} onSelectLocale={selectLocale} />}
            </Stack.Screen>
            <Stack.Screen name="EnrollmentTermsApp" options={{ headerShown: false }}>
              {(props) => <EnrollmentTermsScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="ContactUsApp" options={{ headerShown: false }}>
              {(props) => <ContactUsScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="ContactThanksApp" options={{ headerShown: false }}>
              {(props) => <ContactThanksScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="ChildProfileApp" options={{ headerShown: false }}>
              {(props) => <ChildProfileScreen {...props} flowAppState={flowAppState} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="ChildDetailsApp" options={{ headerShown: false }}>
              {(props) => <ChildDetailsScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="AddChildProfileApp" options={{ headerShown: false }}>
              {(props) => <AddChildProfileScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="FavouriteApp" options={{ headerShown: false }}>
              {(props) => <FavouriteScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="TransactionsApp" options={{ headerShown: false }}>
              {(props) => <TransactionsScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="TransactionDetailApp" options={{ headerShown: false }}>
              {(props) => <TransactionDetailScreen {...props} flowAppState={flowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="CompletedClassDetailApp" options={{ headerShown: false }}>
              {(props) => <CompletedClassDetailScreen {...props} flowAppState={flowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="ScheduleClassDetailApp" options={{ headerShown: false }}>
              {(props) => <ScheduleClassDetailScreen {...props} flowAppState={flowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="VerificationCodeApp" options={{ headerShown: false }}>
              {(props) => <VerificationCodeScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="AttendanceConfirmedApp" options={{ headerShown: false }}>
              {(props) => <AttendanceConfirmedScreen {...props} flowAppState={flowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="AcademicDashboardApp" options={{ headerShown: false }}>
              {(props) => <AnalyticsDashboardScreen {...props} flowAppState={flowAppState} mode="academic" />}
            </Stack.Screen>
            <Stack.Screen name="ActivityDashboardApp" options={{ headerShown: false }}>
              {(props) => <AnalyticsDashboardScreen {...props} flowAppState={flowAppState} mode="activity" />}
            </Stack.Screen>
            <Stack.Screen name="ActivityLearningPictureApp" options={{ headerShown: false }}>
              {(props) => <ActivityLearningPictureScreen {...props} flowAppState={flowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="AcademicRecordApp" component={AcademicRecordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProgramRecordApp" component={ProgramRecordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ClassRecordApp" component={ClassRecordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="WorkSamplesApp" component={WorkSamplesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LearningRecordsApp" options={{ title: "Learning Records" }}>
              {(props) => <LearningRecordsAppScreen {...props} flowAppState={flowAppState} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="CompanionApp" options={{ headerShown: false }}>
              {(props) => <LearningCompanionScreen {...props} childName={(flowAppState.students.find((student) => student.id === flowAppState.selectedStudentId) || flowAppState.students[0]).name} />}
            </Stack.Screen>
            <Stack.Screen name="InboxApp" options={{ title: tInbox(locale).title }}>
              {(props) => <InboxAppScreen {...props} locale={locale} />}
            </Stack.Screen>
            <Stack.Screen
              name="InboxMessageApp"
              options={{ headerShown: false }}
            >
              {(props) => <InboxMessageAppScreen {...props} locale={locale} />}
            </Stack.Screen>
            <Stack.Screen
              name="NotificationApp"
              options={{ title: tNotification(locale).title }}
            >
              {() => <NotificationAppScreen locale={locale} />}
            </Stack.Screen>
            <Stack.Screen name="FigmaFlowLibrary" component={FigmaFlowLibraryScreen} options={{ title: "Figma Flow Library" }} />
            <Stack.Screen name="FigmaFlowDetail" component={FigmaFlowDetailScreen} options={{ title: "Flow Detail" }} />
            <Stack.Screen name="FlowRunner">
              {(props) => <FlowRunnerScreen {...props} flowAppState={flowAppState} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="AllFlowsOverview" component={AllFlowsOverviewScreen} options={{ title: "All Flows Overview" }} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  center: { alignItems: "center", justifyContent: "center" },
  authWrap: { flex: 1, paddingHorizontal: 28, paddingVertical: 24, gap: 16, justifyContent: "center" },
  brand: { fontSize: FONT.brand, color: "#0ABAB5", fontWeight: "700", textAlign: "center", marginBottom: 16 },
  heading: { fontSize: FONT.title, fontWeight: "700", color: "#1F2937", textAlign: "center", marginBottom: 8 },
  portalCard: { borderWidth: 2, borderColor: "#C4EFE9", borderRadius: 18, padding: 20, minHeight: 140, justifyContent: "center", backgroundColor: "#F8FFFE" },
  portalCardActive: { borderColor: "#0ABAB5" },
  portalTitle: { fontSize: FONT.heading, fontWeight: "700", color: "#1F2937", textAlign: "center" },
  portalSubtitle: { marginTop: 8, color: "#4B5563", fontSize: FONT.body, textAlign: "center", lineHeight: 20 },
  headerBackIconBtn: { paddingVertical: 2, paddingRight: 8 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: FONT.headline, backgroundColor: "#fff" },
  error: { color: "#DC2626", fontSize: FONT.secondary, textAlign: "center" },
  primaryButton: { backgroundColor: "#0ABAB5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: FONT.headline },
  secondaryButton: { borderWidth: 1, borderColor: "#D7F4F3", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { color: "#0ABAB5", fontWeight: "600", fontSize: FONT.bodyLg },
  flex1: { flex: 1 },
  page: { flex: 1, backgroundColor: "#fff" },
  pageContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 24, gap: 16 },
  notificationPageContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 0 },
  notificationItem: { paddingVertical: 14, gap: 4 },
  notificationCategory: {
    fontSize: FONT.caption,
    fontWeight: "400",
    color: "#222222",
    letterSpacing: 0.75,
  },
  notificationSenderRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  notificationAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F4AE00",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationAvatarText: { fontSize: 9, fontWeight: "800", color: "#5C3A00" },
  notificationCentre: { flex: 1, fontSize: FONT.caption, fontWeight: "400", color: "#222222" },
  notificationNote: { fontSize: FONT.body, fontWeight: "400", color: "#222222", lineHeight: 20 },
  notificationMetaRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  notificationMeta: { fontSize: FONT.micro, fontWeight: "400", color: "#5E5E5E" },
  notificationTextUnread: { fontWeight: "700" },
  notificationDivider: {
    marginTop: 14,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginLeft: 8,
  },
  inboxPageContent: { paddingTop: 8, paddingBottom: 24 },
  inboxSearchPad: { paddingHorizontal: 24, marginBottom: 8 },
  inboxArchivedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 4,
  },
  inboxArchivedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  inboxArchivedText: {
    flex: 1,
    fontSize: FONT.bodyLg,
    fontWeight: "600",
    color: "#222222",
  },
  inboxArchivedCount: {
    fontSize: FONT.secondary,
    color: "#7A7A7A",
    fontWeight: "500",
  },
  inboxThreadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    position: "relative",
    backgroundColor: "#fff",
  },
  inboxThreadAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F4AE00",
    alignItems: "center",
    justifyContent: "center",
  },
  inboxThreadAvatarText: { fontSize: 18, fontWeight: "800", color: "#5C3A00" },
  inboxThreadBody: { flex: 1, gap: 4 },
  inboxThreadTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inboxThreadCentre: { flex: 1, fontSize: FONT.caption, fontWeight: "400", color: "#222222" },
  inboxThreadPreview: { fontSize: FONT.body, fontWeight: "400", color: "#222222" },
  inboxThreadMetaRow: { flexDirection: "row", gap: 10 },
  inboxThreadMeta: { fontSize: FONT.micro, color: "#5E5E5E" },
  inboxUnreadText: { fontWeight: "700" },
  inboxDivider: {
    position: "absolute",
    left: 100,
    right: 24,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
  },
  inboxSwipeActions: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  inboxSwipeBtn: {
    width: 76,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  inboxSwipePin: { backgroundColor: "#8E8E93" },
  inboxSwipeArchive: { backgroundColor: "#0ABAB5" },
  inboxSwipeDelete: { backgroundColor: "#FF3B30" },
  inboxSwipeBtnText: {
    color: "#fff",
    fontSize: FONT.caption,
    fontWeight: "600",
    textAlign: "center",
  },
  inboxMessageHeader: {
    minHeight: 76,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 7,
    zIndex: 2,
  },
  inboxMessageHeaderCopy: { flex: 1, alignItems: "flex-start", justifyContent: "center" },
  inboxMessageHeaderTitle: { fontSize: FONT.body, lineHeight: 17, fontWeight: "500", color: "#222222" },
  inboxMessageHeaderSpacer: { width: 40, height: 40 },
  inboxResponseTime: { marginTop: 4, fontSize: FONT.micro, color: "#8A8A8A" },
  inboxChatContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 14,
  },
  inboxTodayBadge: {
    alignSelf: "center",
    backgroundColor: "#D7F4F3",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inboxTodayBadgeText: { fontSize: FONT.micro, fontWeight: "600", color: "#555555" },
  inboxBubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  inboxBubbleRowMine: { justifyContent: "flex-end" },
  inboxChatAvatarImage: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E5E7EB" },
  inboxBubbleCol: { maxWidth: "74%", gap: 4 },
  inboxBubbleColMine: { alignItems: "flex-end" },
  inboxBubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inboxBubbleCentre: {
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 4,
  },
  inboxBubbleMine: {
    backgroundColor: "#222222",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 4,
  },
  inboxBubbleText: { fontSize: FONT.body, color: "#292929", lineHeight: 20 },
  inboxBubbleTextMine: { color: "#FFFFFF" },
  inboxBubbleTime: { fontSize: FONT.caption, color: "#7A7A7A" },
  inboxBubbleTimeMine: { textAlign: "right" },
  inboxComposerWrap: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 10,
    zIndex: 2,
  },
  inboxComposerInputWrap: {
    flex: 1,
    minHeight: 42,
    maxHeight: 96,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
  },
  inboxComposerInput: {
    flex: 1,
    fontSize: FONT.body,
    color: "#222222",
    lineHeight: 20,
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  inboxSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0ABAB5",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { fontSize: FONT.title, fontWeight: "700", color: "#111827" },
  searchPageTitle: { fontSize: FONT.display, fontWeight: "700", color: "#111827" },
  helloText: { fontSize: FONT.headline, fontWeight: "600", color: "#111827" },
  microText: { fontSize: FONT.caption, color: "#6B7280" },
  topHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topHeaderActions: { flexDirection: "row", gap: 6, alignItems: "center" },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 100,
    backgroundColor: "#EBEBEB",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  card: { borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", padding: 14, backgroundColor: "#fff" },
  elevatedCard: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
  },
  cardActive: { borderColor: "#0ABAB5", backgroundColor: "#ECFEFF" },
  cardTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#1F2937", marginBottom: 6 },
  cardMeta: { fontSize: FONT.body, color: "#4B5563", lineHeight: 20 },
  sectionTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#111827", marginBottom: 6 },
  appHeroImage: { width: "100%", height: 108, borderRadius: 12 },
  appCardImage: { width: "100%", height: 96, borderRadius: 10, marginBottom: 10 },
  appCardImageTall: { width: "100%", height: 128, borderRadius: 10, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10 },
  smallCard: { flex: 1, borderRadius: 14, backgroundColor: "#0ABAB5", padding: 16, minHeight: 84, justifyContent: "center" },
  secondaryCard: { backgroundColor: "#14B8A6" },
  smallCardText: { fontSize: FONT.bodyLg, color: "#ffffff", fontWeight: "700" },
  horizontalCardsScroll: { overflow: "visible" },
  horizontalCardsContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 16,
    paddingRight: 8,
  },
  homeWideCardOuter: {
    marginRight: 14,
    paddingHorizontal: 2,
  },
  homeWideCardShadow: {
    width: 270,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  homeWideCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  homeWideCardImage: { width: "100%", height: 152 },
  homeWideCardImageWrap: { width: "100%", height: 152, position: "relative", backgroundColor: "#F3F4F6" },
  homeWideCardBody: { padding: 12, gap: 6, backgroundColor: "#fff" },
  homeWideCardTopMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2, gap: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  homeWideCardRating: { fontSize: FONT.caption, color: "#111827", fontWeight: "500" },
  senBadge: { borderRadius: 4, borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#fff", paddingHorizontal: 6, paddingVertical: 2 },
  senBadgeOnImage: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heartOnImage: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  senBadgeText: { fontSize: FONT.caption, color: "#222222", fontWeight: "600" },
  homeWideCardTitle: { flex: 1, fontSize: FONT.body, fontWeight: "700", color: "#222222" },
  homeWideCardMeta: { fontSize: FONT.secondary, color: "#5E5E5E" },
  homeBannerImage: { width: "100%", height: 150, borderRadius: 12 },
  categoryContainer: { paddingVertical: 6, paddingHorizontal: 0 },
  categoriesRow: { flexDirection: "row", gap: 10, justifyContent: "space-between" },
  categoryIconCard: {
    width: 68,
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  categoryIconCardActive: { borderColor: "#0ABAB5", backgroundColor: "#EFFFFE" },
  categoryIconImage: { width: 25, height: 25 },
  categoryPillText: { fontSize: FONT.micro, fontWeight: "600", color: "#222222", textAlign: "center" },
  localePill: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  localePillText: { fontSize: FONT.caption, fontWeight: "700", color: "#222222" },
  passportCardShadow: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
  },
  passportCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    overflow: "hidden",
    padding: 0,
  },
  passportHeroWrap: {
    width: "100%",
    height: 152,
    position: "relative",
    backgroundColor: "#0ABAB5",
    alignItems: "center",
    justifyContent: "center",
  },
  passportHeroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  passportHeroZWrap: {
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  passportHeroZ: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  passportBody: {
    padding: 12,
    gap: 6,
    backgroundColor: "#fff",
  },
  passportTitle: { fontSize: FONT.body, fontWeight: "700", color: "#222222" },
  passportDesc: { fontSize: FONT.secondary, fontWeight: "400", color: "#5E5E5E", lineHeight: 18 },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tagCard: { width: "48%", minHeight: 82, borderRadius: 12, backgroundColor: "#EEF7FF", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  tagCardActive: { backgroundColor: "#E0FBF9", borderWidth: 1, borderColor: "#0ABAB5" },
  tagCardImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  tagCardOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.15)" },
  tagText: { fontSize: FONT.headerTitle, color: "#0F172A", fontWeight: "600" },
  searchCategoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  searchCategoryCard: {
    width: "47.5%",
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 14,
  },
  searchCategoryCardActive: { borderWidth: 2, borderColor: "#111827" },
  searchCategoryImage: {
    position: "absolute",
    right: -8,
    top: -10,
    width: 100,
    height: 100,
    opacity: 0.95,
  },
  searchCategoryText: { fontSize: FONT.headline, fontWeight: "600", color: "#FFFFFF", zIndex: 2 },
  searchCategoryTabsScroll: { marginHorizontal: -24, borderBottomWidth: 1, borderBottomColor: "#ECECEC" },
  searchCategoryTabs: { paddingHorizontal: 14, alignItems: "stretch" },
  searchCategoryTab: {
    width: 64,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  searchCategoryTabActive: { borderBottomColor: "#222222" },
  searchCategoryTabText: { fontSize: FONT.micro, fontWeight: "500", color: "#B9B9B9" },
  searchCategoryTabTextActive: { color: "#222222" },
  searchFilterButton: { alignSelf: "flex-start", paddingVertical: 1 },
  searchFilterText: { fontSize: FONT.body, color: "#343434", textDecorationLine: "underline" },
  searchFilterScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  searchFilterPageContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 20 },
  searchFilterCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  searchFilterPageTitle: { fontSize: FONT.title, fontWeight: "700", color: "#111111", marginBottom: 16 },
  searchFilterRegion: { borderTopWidth: 1, borderTopColor: "#E9E9E9", paddingTop: 15, paddingBottom: 8, gap: 10 },
  searchFilterSection: { paddingVertical: 14, gap: 12 },
  searchFilterSectionHeadingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  searchFilterSectionTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  searchFilterChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  searchFilterChip: {
    minHeight: 28,
    borderRadius: 3,
    backgroundColor: "#EFEFEF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  searchFilterChipSelected: { backgroundColor: "#C8F1EF" },
  searchFilterChipText: { fontSize: FONT.caption, fontWeight: "500", color: "#5E5E5E" },
  searchFilterChipTextSelected: { fontWeight: "700", color: "#222222" },
  searchFilterDivider: { height: 1, backgroundColor: "#E9E9E9" },
  searchFilterPriceRow: { flexDirection: "row", gap: 12 },
  searchFilterPriceField: {
    flex: 1,
    minHeight: 66,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: "center",
    gap: 4,
  },
  searchFilterPriceLabel: { fontSize: FONT.caption, color: "#777777" },
  searchFilterPriceInputRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  searchFilterCurrency: { fontSize: FONT.body, fontWeight: "600", color: "#343434" },
  searchFilterPriceInput: { flex: 1, padding: 0, fontSize: FONT.body, fontWeight: "600", color: "#343434" },
  searchFilterRatingChip: { flexDirection: "row", minWidth: 40, gap: 4 },
  searchFilterApplyButton: {
    minHeight: 46,
    borderRadius: 7,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  searchFilterApplyButtonText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  searchResultsList: { gap: 18 },
  searchResultCard: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  searchResultImageWrap: { width: "100%", height: 150, position: "relative", backgroundColor: "#F3F4F6" },
  searchResultImage: { width: "100%", height: "100%" },
  searchResultSenBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  searchResultSenText: { fontSize: FONT.caption, fontWeight: "600", color: "#222222" },
  searchResultHeart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultBody: { paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  searchResultTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  searchResultTitle: { flex: 1, fontSize: FONT.body, fontWeight: "700", color: "#222222" },
  searchResultRating: { fontSize: FONT.secondary, color: "#343434" },
  searchResultMeta: { fontSize: FONT.secondary, color: "#5E5E5E" },
  searchEmptyState: { alignItems: "center", paddingVertical: 42, gap: 7 },
  searchEmptyTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#343434" },
  searchEmptyText: { fontSize: FONT.secondary, color: "#777777", textAlign: "center" },
  searchBannerBtn: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBannerImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  searchBannerOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.18)" },
  searchBannerOverlayTeal: { backgroundColor: "rgba(10,186,181,0.35)" },
  searchBannerText: { fontSize: FONT.headline, fontWeight: "600", color: "#FFFFFF", zIndex: 2 },
  searchInputWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: FONT.headline, color: "#111827" },
  centreDetailScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  centreDetailScrollContent: { paddingBottom: 18 },
  centreDetailHeroWrap: { width: "100%", height: 230, position: "relative", backgroundColor: "#E5E7EB" },
  centreDetailHero: { width: "100%", height: "100%" },
  centreDetailRoundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  centreDetailBackButton: { position: "absolute", top: 14, left: 14 },
  centreDetailHeroActions: { position: "absolute", top: 14, right: 14, flexDirection: "row", gap: 8 },
  centreDetailContent: { paddingHorizontal: 18, paddingTop: 16, gap: 10 },
  centreDetailTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  centreDetailLogoWrap: { width: 36, height: 36, borderRadius: 18, overflow: "hidden", backgroundColor: "#F4AE00" },
  centreDetailLogo: { width: "100%", height: "100%" },
  centreDetailTitle: { flex: 1, fontSize: FONT.heading, lineHeight: 24, fontWeight: "700", color: "#222222" },
  centreDetailRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  centreDetailRating: { fontSize: FONT.secondary, fontWeight: "600", color: "#222222" },
  centreDetailReviewSeparator: { fontSize: FONT.secondary, color: "#343434" },
  centreDetailReviewLink: { fontSize: FONT.secondary, color: "#343434", textDecorationLine: "underline" },
  centreDetailAddressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  centreDetailAddress: { flex: 1, fontSize: FONT.caption, lineHeight: 17, color: "#4B5563" },
  centreDetailDescription: { fontSize: FONT.secondary, lineHeight: 19, color: "#5E6775", marginTop: 10 },
  centreDetailDivider: { height: 1, backgroundColor: "#E9E9E9", marginVertical: 4 },
  centreDetailSectionTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  centreDetailMembersRow: { flexDirection: "row", gap: 12 },
  centreDetailMember: { flex: 1, gap: 4 },
  centreDetailMemberImage: { width: "100%", height: 138, borderRadius: 8, backgroundColor: "#E5E7EB" },
  centreDetailMemberName: { fontSize: FONT.body, fontWeight: "600", color: "#222222" },
  centreDetailMemberRole: { fontSize: FONT.caption, color: "#6B6B6B" },
  programListScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  programListHeader: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  programListBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  programListHeaderTitle: { fontSize: FONT.headerTitle, fontWeight: "600", color: "#222222" },
  programListHeaderSpacer: { width: 40, height: 40 },
  programListContent: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 20 },
  programListCard: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 11,
    elevation: 4,
  },
  programListImage: { width: "100%", height: 190, backgroundColor: "#E5E7EB" },
  programListCardBody: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  programListTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  programListTitle: { flex: 1, fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  programListSchedules: { fontSize: FONT.body, color: "#343434", textDecorationLine: "underline" },
  programListMeta: { fontSize: FONT.body, color: "#6B6B6B" },
  programListPrice: { fontWeight: "700", color: "#222222" },
  programListEmpty: { paddingVertical: 40, textAlign: "center", fontSize: FONT.body, lineHeight: 20, color: "#6B6B6B" },
  classOptionScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  classOptionContent: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 16 },
  classOptionHero: { width: "100%", height: 212, borderRadius: 12, backgroundColor: "#E5E7EB" },
  classOptionTitle: { marginTop: 14, fontSize: FONT.title, fontWeight: "700", color: "#222222", textAlign: "center" },
  classOptionDescription: { marginTop: 8, fontSize: FONT.secondary, lineHeight: 19, color: "#6B6B6B", textAlign: "center" },
  classOptionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E5E5", marginTop: 6 },
  classOptionCard: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 11,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
    elevation: 4,
  },
  classOptionScheduleTitle: { fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222" },
  classOptionAttendeeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  classOptionAvatarStack: { flexDirection: "row" },
  classOptionAvatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "#E5E7EB" },
  classOptionAvatarOverlap: { marginLeft: -8 },
  classOptionGoingText: { fontSize: FONT.caption, color: "#6B6B6B" },
  classOptionSpotsText: { marginLeft: "auto", fontSize: FONT.caption, color: "#0ABAB5", fontWeight: "600" },
  classOptionMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  classOptionMetaText: { flex: 1, fontSize: FONT.secondary, lineHeight: 18, color: "#6B6B6B" },
  classOptionPriceText: { fontSize: FONT.secondary, color: "#6B6B6B" },
  classOptionPriceOriginal: { color: "#9CA3AF", textDecorationLine: "line-through" },
  classOptionPrice: { fontWeight: "700", color: "#222222" },
  classOptionCardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E5E5" },
  classOptionFooterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  classOptionTotalText: { fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222" },
  classOptionCoachRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  classOptionCoachAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#E5E7EB" },
  classOptionCoachText: { fontSize: FONT.caption, color: "#6B6B6B" },
  classOptionDatesRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  classOptionDatesText: { fontSize: FONT.caption, color: "#6B6B6B" },
  classOptionLessonList: { width: "100%", gap: 2 },
  classOptionLessonRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 7 },
  classOptionLessonNumber: { width: 16, fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222", lineHeight: 18 },
  classOptionLessonCopy: { flex: 1, gap: 2 },
  classOptionLessonDate: { fontSize: FONT.secondary, color: "#5E5E5E", lineHeight: 18 },
  classOptionLessonTime: { fontSize: FONT.secondary, color: "#8A8A8A", lineHeight: 18 },
  reservationContent: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 16 },
  reservationCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
  },
  reservationProgramRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  reservationProgramImage: { width: 78, height: 78, borderRadius: 10, backgroundColor: "#E5E7EB" },
  reservationProgramCopy: { flex: 1, gap: 5 },
  reservationProgramTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  reservationMetaRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  reservationMetaText: { flex: 1, fontSize: FONT.secondary, lineHeight: 18, color: "#8A8A8A" },
  reservationDateTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  reservationDatesToggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 8 },
  reservationDatesToggleText: { fontSize: FONT.secondary, color: "#8A8A8A" },
  reservationLessonHeading: { marginTop: 8, marginBottom: 4, fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222" },
  reservationDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E4E4E4" },
  reservationSection: { gap: 14, paddingVertical: 4 },
  reservationSectionTitle: { fontSize: FONT.heading, fontWeight: "700", color: "#222222" },
  reservationPersonRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  reservationPersonImage: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E5E7EB" },
  reservationHostCopy: { flex: 1, gap: 2 },
  reservationPersonName: { fontSize: FONT.headline, fontWeight: "600", color: "#222222", lineHeight: 21 },
  reservationBookingName: { flex: 1, fontSize: FONT.headline, fontWeight: "600", color: "#222222" },
  reservationPersonMeta: { fontSize: FONT.body, color: "#8A8A8A" },
  reservationRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  reservationRatingText: { fontSize: FONT.bodyLg, fontWeight: "600", color: "#222222" },
  reservationSwitch: { fontSize: FONT.bodyLg, color: "#222222", textDecorationLine: "underline" },
  reservationPayHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reservationStripe: { fontSize: FONT.bodyLg, color: "#8A8A8A" },
  reservationStripeWord: { color: "#635BFF", fontWeight: "700", fontSize: FONT.headline },
  reservationPayMethodLabel: { fontSize: FONT.bodyLg, color: "#333333" },
  reservationPaymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  reservationPaymentIcons: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  reservationPaymentIcon: { width: 32, height: 20, resizeMode: "contain" },
  reservationPromote: { fontSize: FONT.bodyLg, color: "#222222", textDecorationLine: "underline" },
  reservationSummaryCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
  },
  reservationPriceLine: { fontSize: FONT.title, color: "#222222" },
  reservationPriceOriginal: { fontSize: FONT.title, color: "#B5B5B5", textDecorationLine: "line-through" },
  reservationPriceNow: { fontSize: FONT.title, fontWeight: "700", color: "#222222" },
  reservationPriceUnit: { fontSize: FONT.title, fontWeight: "400", color: "#222222" },
  reservationScheduleMeta: { fontSize: FONT.bodyLg, color: "#222222" },
  reservationAttendeeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reservationAttendeeAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "#E5E7EB" },
  reservationGoingText: { fontSize: FONT.secondary, color: "#8A8A8A" },
  reservationSpotsText: { fontSize: FONT.secondary, color: "#0ABAB5", fontWeight: "600" },
  reservationProtectText: { marginTop: 4, fontSize: FONT.body, color: "#666666", textAlign: "center" },
  reservationProtectName: { fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222" },
  reservationReserveButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  reservationReserveButtonText: { fontSize: FONT.headline, fontWeight: "600", color: "#FFFFFF" },
  reservationBreakdown: { gap: 14, marginTop: 6 },
  reservationBreakdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  reservationBreakdownLabel: { fontSize: FONT.bodyLg, color: "#222222", textDecorationLine: "underline" },
  reservationBreakdownValue: { fontSize: FONT.bodyLg, color: "#222222" },
  reservationDiscountValue: { fontSize: FONT.bodyLg, fontWeight: "600", color: "#1FA971" },
  reservationCouponRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reservationCouponCode: { fontSize: FONT.bodyLg, fontWeight: "600", color: "#0ABAB5" },
  reservationTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E4E4E4",
    paddingTop: 14,
  },
  reservationTotalLabel: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  reservationTotalValue: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  reservationFinePrint: { fontSize: FONT.secondary, lineHeight: 19, color: "#6B6B6B" },
  reservationFineBrand: { fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222" },
  zCareWord: { fontWeight: "700", color: "#222222" },
  zCareMark: { color: "#0ABAB5" },
  reservationLearnMore: { fontSize: FONT.secondary, color: "#222222", textDecorationLine: "underline" },
  reservationLink: { color: "#2F6BFF", textDecorationLine: "underline" },
  scheduleScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  scheduleContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
    gap: 14,
  },
  scheduleTitle: { fontSize: FONT.title, fontWeight: "700", color: "#111111" },
  scheduleScopeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scheduleScopeButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  scheduleScopeAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#E5E7EB" },
  scheduleAllAvatars: { width: 64, flexDirection: "row", alignItems: "center" },
  scheduleScopeAvatarOverlap: { marginLeft: -18, borderWidth: 1.5, borderColor: "#FFFFFF" },
  scheduleScopeText: { fontSize: FONT.bodyLg, fontWeight: "600", color: "#333333" },
  scheduleTransactions: { fontSize: FONT.caption, color: "#222222", textDecorationLine: "underline" },
  scheduleScopeMenu: {
    borderRadius: 14,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 14,
    elevation: 5,
  },
  scheduleScopeMenuItem: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scheduleScopeMenuAllAvatars: { width: 52, flexDirection: "row", alignItems: "center" },
  scheduleScopeMenuAvatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "#E5E7EB" },
  scheduleScopeMenuAvatarOverlap: { marginLeft: -18 },
  scheduleScopeMenuSingleAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E5E7EB" },
  scheduleScopeMenuName: { flex: 1, fontSize: FONT.bodyLg, fontWeight: "600", color: "#333333" },
  scheduleSegment: {
    borderRadius: 18,
    padding: 3,
    flexDirection: "row",
    backgroundColor: "#EEEEEE",
  },
  scheduleSegmentButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleSegmentButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  scheduleSegmentText: { fontSize: FONT.caption, fontWeight: "600", color: "#333333" },
  scheduleCalendarCard: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  scheduleCalendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  scheduleMonthButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleMonthTitleWrap: { alignItems: "center", gap: 1 },
  scheduleMonthTitle: { fontSize: FONT.headline, fontWeight: "600", color: "#4B5563" },
  scheduleMonthYear: { fontSize: FONT.micro, color: "#9A9A9A" },
  scheduleWeekRow: { flexDirection: "row", marginBottom: 5 },
  scheduleWeekDay: { width: "14.285%", fontSize: FONT.micro, color: "#9A9A9A", textAlign: "center" },
  scheduleCalendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  scheduleDayCell: { width: "14.285%", height: 38, alignItems: "center", justifyContent: "center" },
  scheduleDayNumberWrap: { width: 25, height: 25, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  scheduleDaySelected: { backgroundColor: "#0ABAB5" },
  scheduleDayNumber: { fontSize: FONT.caption, color: "#3F4650" },
  scheduleDayOutside: { color: "#B8B8B8" },
  scheduleDayNumberSelected: { color: "#FFFFFF", fontWeight: "700" },
  scheduleDayDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#0ABAB5", marginTop: 1 },
  scheduleViewAll: { alignSelf: "flex-end" },
  scheduleViewAllText: { fontSize: FONT.caption, color: "#222222", textDecorationLine: "underline" },
  scheduleList: { gap: 14 },
  scheduleCard: {
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 11,
    elevation: 3,
  },
  scheduleCardTimeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  scheduleCardDot: { width: 7, height: 7, borderRadius: 4 },
  scheduleCardTime: { fontSize: FONT.micro, color: "#6B6B6B" },
  scheduleCardMain: { flexDirection: "row", gap: 12 },
  scheduleCardImage: { width: 96, height: 92, borderRadius: 9, backgroundColor: "#E5E7EB" },
  scheduleCardCopy: { flex: 1, gap: 4 },
  scheduleCardTitle: { fontSize: FONT.body, fontWeight: "700", color: "#222222" },
  scheduleCardLesson: { fontSize: FONT.caption, fontWeight: "600", color: "#333333" },
  scheduleCardChildRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  scheduleCardChildAvatar: { width: 21, height: 21, borderRadius: 11, backgroundColor: "#E5E7EB" },
  scheduleCardChildName: { fontSize: FONT.micro, color: "#444444" },
  scheduleCardCentre: { fontSize: FONT.micro, lineHeight: 13, color: "#8A8A8A" },
  transactionsContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 16,
  },
  transactionCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    gap: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
    elevation: 4,
  },
  transactionCardPressed: { opacity: 0.72 },
  transactionTitleRow: { minHeight: 20, flexDirection: "row", alignItems: "center", gap: 10 },
  transactionTitle: { flex: 1, fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222" },
  transactionCompleted: { fontSize: FONT.caption, fontWeight: "600", color: "#0ABAB5" },
  transactionMainRow: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  transactionImage: { width: 98, minHeight: 112, borderRadius: 10, backgroundColor: "#E5E7EB" },
  transactionCopy: { flex: 1, justifyContent: "space-between", gap: 5 },
  transactionSchedule: { fontSize: FONT.caption, fontWeight: "600", color: "#333333" },
  transactionChildRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  transactionChildImage: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#E5E7EB" },
  transactionChildName: { fontSize: FONT.micro, color: "#333333" },
  transactionCentreRow: { flexDirection: "row", alignItems: "flex-start", gap: 5 },
  transactionCentre: { flex: 1, fontSize: FONT.micro, lineHeight: 13, color: "#7A7A7A" },
  transactionTotal: { fontSize: FONT.bodyLg, fontWeight: "700", color: "#333333" },
  transactionTotalLabel: { fontSize: FONT.body, fontWeight: "400", color: "#555555" },
  transactionDetailContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingBottom: 34,
    gap: 18,
  },
  transactionDetailProgramCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 13,
    elevation: 4,
  },
  transactionDetailProgramImage: { width: 104, height: 104, borderRadius: 10, backgroundColor: "#E5E7EB" },
  transactionDetailProgramCopy: { flex: 1, gap: 9 },
  transactionDetailProgramTitle: { fontSize: FONT.bodyLg, fontWeight: "500", color: "#222222" },
  transactionDetailSection: { gap: 16 },
  transactionDetailSectionTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  transactionDetailPersonRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  transactionDetailAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E5E7EB" },
  transactionDetailPersonCopy: { flex: 1, gap: 3 },
  transactionDetailPersonName: { fontSize: FONT.bodyLg, fontWeight: "600", color: "#222222" },
  transactionDetailPersonNameFill: { flex: 1, fontSize: FONT.bodyLg, lineHeight: 19, fontWeight: "600", color: "#222222" },
  transactionDetailPersonRole: { fontSize: FONT.body, color: "#777777" },
  transactionDetailDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E2E2E2" },
  transactionDetailCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 13,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  transactionDetailDatesHeader: { gap: 9 },
  transactionDetailScheduleTitle: { fontSize: FONT.bodyLg, fontWeight: "500", color: "#222222" },
  transactionDetailDatesToggle: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 5 },
  transactionDetailDatesToggleText: { fontSize: FONT.micro, color: "#777777" },
  transactionDetailLessonList: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E2E2E2", paddingTop: 12, gap: 9 },
  transactionDetailLessonHeading: { fontSize: FONT.body, fontWeight: "600", color: "#555555" },
  transactionProtection: { fontSize: FONT.body, color: "#777777" },
  transactionProtectionBrand: { fontSize: FONT.heading, fontWeight: "700", color: "#222222" },
  transactionPaymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  transactionPaymentLabel: { fontSize: FONT.body, color: "#333333", textDecorationLine: "underline" },
  transactionPaymentValue: { fontSize: FONT.body, color: "#333333" },
  transactionPaymentDiscount: { fontSize: FONT.body, color: "#009B2A" },
  transactionLoyalty: { fontSize: FONT.caption, fontWeight: "600", color: "#0ABAB5" },
  transactionPaymentDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#D5D5D5", marginVertical: 2 },
  transactionPaymentTotal: { fontSize: FONT.bodyLg, fontWeight: "700", color: "#333333" },
  completedClassContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: 18,
  },
  completedRatingSection: { alignItems: "center", gap: 10, paddingHorizontal: 8 },
  completedRatingTitle: { fontSize: FONT.body, fontWeight: "700", color: "#333333" },
  completedRatingHint: { fontSize: FONT.caption, color: "#555555", textAlign: "center" },
  completedStarsRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 4 },
  completedReviewInput: {
    width: "100%",
    minHeight: 108,
    borderWidth: 1,
    borderColor: "#BEBEBE",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: FONT.body,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },
  completedRateButton: {
    width: "100%",
    minHeight: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
  },
  completedRateButtonText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  classDetailContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 18,
  },
  classDetailProgramCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 13,
    elevation: 3,
  },
  classDetailTime: { fontSize: FONT.caption, color: "#555555" },
  classDetailProgramRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  classDetailProgramImage: { width: 104, height: 104, borderRadius: 10, backgroundColor: "#E5E7EB" },
  classDetailProgramCopy: { flex: 1, gap: 6 },
  classDetailProgramTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  classDetailLesson: { fontSize: FONT.body, fontWeight: "600", color: "#333333" },
  classDetailVerification: { gap: 12, paddingHorizontal: 16 },
  classDetailVerificationHint: { fontSize: FONT.caption, fontWeight: "600", color: "#555555", textAlign: "center" },
  classDetailVerificationButton: {
    minHeight: 46,
    borderRadius: 9,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  classDetailVerificationText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  classDetailSection: { gap: 15 },
  classDetailSectionTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  classDetailPersonRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  classDetailAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E5E7EB" },
  classDetailPersonCopy: { flex: 1, gap: 3 },
  classDetailPersonName: { fontSize: FONT.bodyLg, lineHeight: 19, fontWeight: "600", color: "#222222" },
  classDetailPersonNameFill: { flex: 1, fontSize: FONT.bodyLg, lineHeight: 19, fontWeight: "600", color: "#222222" },
  classDetailPersonRole: { fontSize: FONT.body, color: "#7A7A7A" },
  classDetailFinePrint: { fontSize: FONT.caption, lineHeight: 18, color: "#6B6B6B" },
  classDetailBottomNav: {
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DADADA",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  verificationContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 18,
  },
  verificationProgramCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 9,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 13,
    elevation: 3,
  },
  verificationProgramImage: { width: 92, height: 92, borderRadius: 9, backgroundColor: "#E5E7EB" },
  verificationReady: { alignItems: "center", gap: 6, paddingVertical: 2 },
  verificationReadyTitle: { fontSize: FONT.body, color: "#444444" },
  verificationReadyText: { fontSize: FONT.caption, color: "#666666", textAlign: "center" },
  verificationSectionTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  verificationCodeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", gap: 12 },
  verificationCodeBox: {
    flex: 1,
    maxWidth: 64,
    height: 42,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  verificationCodeDigit: { fontSize: FONT.body, color: "#333333" },
  verificationQr: {
    width: 161,
    height: 161,
    padding: 7,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
  },
  verificationQrCell: { width: 7, height: 7, backgroundColor: "#FFFFFF" },
  verificationQrCellFilled: { backgroundColor: "#000000" },
  attendanceContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 52,
    gap: 16,
  },
  attendanceTitle: { fontSize: FONT.heading, lineHeight: 25, fontWeight: "700", color: "#111111" },
  attendanceProgramImage: { width: 92, height: 92, borderRadius: 9, backgroundColor: "#E5E7EB" },
  attendanceFooter: { gap: 10, marginTop: 48 },
  attendanceFeedback: { fontSize: FONT.caption, color: "#777777", textAlign: "center" },
  profileScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  profileContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    gap: 20,
  },
  profileTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profilePageTitle: { fontSize: FONT.title, fontWeight: "700", color: "#111111" },
  profileTitleActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileRoundAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  profileSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
  },
  profileIdentity: { width: 126, alignItems: "center" },
  profileMainAvatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: "#E5E7EB" },
  profileAvatarEdit: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0ABAB5",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarEditLine: {
    width: 13,
    height: 1.5,
    marginTop: -2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
  profileMainName: { marginTop: 8, fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  profileLocation: { marginTop: 3, fontSize: FONT.caption, color: "#8A8A8A" },
  profileStats: { flex: 1 },
  profileStat: { paddingVertical: 4, gap: 1 },
  profileStatValue: { fontSize: FONT.heading, fontWeight: "700", color: "#222222" },
  profileStatLabel: { fontSize: FONT.caption, fontWeight: "600", color: "#555555" },
  profileStatDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E4E4E4" },
  profileFeatureRow: { flexDirection: "row", gap: 16 },
  profileFeatureCard: {
    flex: 1,
    minHeight: 168,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
  },
  profileFeatureIcon: { flex: 1, alignItems: "center", justifyContent: "center" },
  profileFeatureImage: { width: 112, height: 112 },
  profileFeatureTitle: { fontSize: FONT.headline, fontWeight: "600", color: "#333333" },
  profileSettingsTitle: { marginTop: 4, fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  profileSettingsList: { marginTop: -6 },
  profileSettingRow: {
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E4E4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileSettingLabelRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileSettingLabel: { fontSize: FONT.bodyLg, color: "#555555" },
  profileDeleteButton: { alignSelf: "center", marginTop: -4 },
  profileDeleteText: { fontSize: FONT.caption, color: "#8A8A8A", textDecorationLine: "underline" },
  profileLogoutButton: {
    width: "58%",
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: "#2A2A2A",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  profileLogoutText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  profileFlowHeader: {
    height: 66,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileFlowHeaderTitle: { fontSize: FONT.headerTitle, fontWeight: "500", color: "#111111" },
  personalSettingContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  personalAvatarWrap: { alignSelf: "center", marginTop: 4, marginBottom: 16 },
  personalAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#E5E7EB" },
  personalField: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: "#BEBEBE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  personalFieldLabel: { fontSize: FONT.caption, color: "#8A8A8A" },
  personalFieldInput: { flex: 1, paddingVertical: 4, fontSize: FONT.headline, color: "#333333" },
  personalVerifiedRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  personalVerifiedInput: { flex: 1, paddingVertical: 4, fontSize: FONT.headline, color: "#333333" },
  personalVerifyLink: { fontSize: FONT.body, color: "#222222", textDecorationLine: "underline" },
  personalPhoneField: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: "#BEBEBE",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "stretch",
    paddingRight: 14,
  },
  personalCountryField: { width: 106, paddingHorizontal: 14, paddingVertical: 10, justifyContent: "center", gap: 5 },
  personalCountryValueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  personalFieldValue: { fontSize: FONT.headline, color: "#333333" },
  personalPhoneDivider: { width: StyleSheet.hairlineWidth, backgroundColor: "#BEBEBE" },
  personalPhoneInputWrap: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, justifyContent: "center" },
  personalPhoneInput: { paddingVertical: 3, fontSize: FONT.headline, color: "#333333" },
  profileFlowPrimaryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  profileFlowPrimaryButtonDisabled: { opacity: 0.72 },
  profileFlowPrimaryText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  changePasswordContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 18,
  },
  passwordField: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#BEBEBE",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: FONT.headline,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },
  languageContent: {
    width: "100%",
    maxWidth: 520,
    flex: 1,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 118,
  },
  languageChooser: { gap: 12 },
  languagePrompt: { marginBottom: 10, fontSize: FONT.headline, lineHeight: 21, fontWeight: "500", color: "#222222", textAlign: "center" },
  languageOption: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 7,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  languageFlag: { fontSize: FONT.heading },
  languageLabel: { flex: 1, fontSize: FONT.body, color: "#333333" },
  languageSaveButton: {
    minHeight: 48,
    marginTop: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
  },
  enrollmentTermsContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  enrollmentTermsHeading: { fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222" },
  enrollmentTermsSection: { gap: 5 },
  enrollmentTermsSectionTitle: { fontSize: FONT.body, fontWeight: "700", color: "#222222" },
  enrollmentTermsBody: { fontSize: FONT.caption, lineHeight: 17, color: "#444444" },
  contactContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: 14,
  },
  contactIntro: { marginBottom: 4, fontSize: FONT.bodyLg, fontWeight: "500", color: "#222222" },
  contactInput: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#BEBEBE",
    borderRadius: 7,
    paddingHorizontal: 13,
    fontSize: FONT.body,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },
  contactThoughtsInput: {
    minHeight: 126,
    borderWidth: 1,
    borderColor: "#BEBEBE",
    borderRadius: 7,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: FONT.body,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },
  contactSubmitButton: {
    minHeight: 48,
    marginTop: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
  },
  contactDetails: { marginTop: 22, gap: 10 },
  contactDetailRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  contactDetailIcon: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: "#777777",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactDetailText: { fontSize: FONT.caption, color: "#555555" },
  contactThanksContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingBottom: 80 },
  contactThanksAccent: { fontSize: FONT.headline, fontWeight: "700", color: "#0ABAB5" },
  contactThanksTitle: { marginTop: 10, fontSize: FONT.heading, fontWeight: "700", color: "#222222", textAlign: "center" },
  contactThanksText: { marginTop: 7, fontSize: FONT.caption, color: "#A0A0A0", textAlign: "center" },
  contactThanksClose: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 2 },
  contactThanksCloseText: { fontSize: FONT.caption, color: "#777777", textDecorationLine: "underline" },
  childProfileContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  childProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
  },
  childProfileIdentity: { width: 124, alignItems: "center" },
  childProfileAvatar: { width: 94, height: 94, borderRadius: 47, backgroundColor: "#E5E7EB" },
  childProfileName: { marginTop: 10, fontSize: FONT.headline, fontWeight: "700", color: "#111111", textAlign: "center" },
  childProfileStats: { flex: 1, gap: 5 },
  childProfileYearValue: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  childProfileYearLabel: { fontSize: FONT.caption, fontWeight: "500", color: "#333333" },
  childProfileMetaText: { fontSize: FONT.caption, color: "#777777" },
  childProfilePrompt: { marginTop: 18, fontSize: FONT.body, color: "#777777", textAlign: "center" },
  childDetailsContent: {
    width: "100%",
    maxWidth: 520,
    flexGrow: 1,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 24,
    gap: 18,
  },
  childDetailsAvatarWrap: { alignSelf: "center", marginBottom: 22 },
  childDetailsAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#E5E7EB" },
  childDetailsSchoolTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  childDetailsSchoolTitle: { fontSize: FONT.heading, fontWeight: "700", color: "#222222" },
  childDetailsConnected: { fontSize: FONT.body, fontWeight: "600", color: "#0ABAB5" },
  childDetailsSchoolRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14 },
  childDetailsSchoolLogo: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#E5E7EB" },
  childDetailsSchoolName: { flex: 1, fontSize: FONT.body, lineHeight: 18, fontWeight: "600", color: "#333333" },
  childDetailsEdit: { fontSize: FONT.body, color: "#222222", textDecorationLine: "underline" },
  childDetailsDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 10, backgroundColor: "#E4E4E4" },
  childDetailsSectionTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  childDetailsToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  childDetailsToggleLabel: { fontSize: FONT.body, color: "#333333" },
  childDetailsToggle: {
    width: 42,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 3,
    justifyContent: "center",
    backgroundColor: "#D7D7D7",
  },
  childDetailsToggleOn: { backgroundColor: "#0ABAB5" },
  childDetailsToggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" },
  childDetailsToggleThumbOn: { alignSelf: "flex-end", alignItems: "center", justifyContent: "center" },
  childDetailsFooter: { marginTop: "auto", paddingTop: 44, gap: 8 },
  childDetailsDeleteButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  childDetailsDelete: { fontSize: FONT.caption, color: "#777777", textAlign: "center", textDecorationLine: "underline" },
  childWarningRoot: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  childWarningBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.43)" },
  childWarningCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  childWarningAvatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#E5E7EB" },
  childWarningName: { fontSize: FONT.headline, fontWeight: "600", color: "#222222" },
  childWarningText: { fontSize: FONT.caption, lineHeight: 17, color: "#333333", textAlign: "center" },
  childWarningTextBold: { fontWeight: "700" },
  childWarningActions: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  childWarningDelete: { fontSize: FONT.caption, color: "#777777", textDecorationLine: "underline" },
  childWarningBack: {
    width: "70%",
    minHeight: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
  },
  childWarningBackText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  addChildContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 16,
  },
  addChildAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E5E5",
    marginBottom: 8,
  },
  addChildField: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#BEBEBE",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: FONT.bodyLg,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },
  addChildPhoneInput: { flex: 1, paddingHorizontal: 14, fontSize: FONT.bodyLg, color: "#222222" },
  addChildSchoolRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  addChildSchoolLogo: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#E5E5E5" },
  addChildSchoolText: { flex: 1, fontSize: FONT.body, color: "#777777" },
  favouriteContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  favouriteFilter: { fontSize: FONT.body, color: "#222222", textDecorationLine: "underline" },
  favouriteCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  favouriteImageWrap: { height: 160, position: "relative" },
  favouriteImage: { width: "100%", height: "100%", backgroundColor: "#E5E7EB" },
  favouriteSenBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  favouriteSenText: { fontSize: FONT.caption, color: "#222222" },
  favouriteHeart: { position: "absolute", top: 10, right: 10, padding: 3 },
  favouriteCardBody: { paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  favouriteCardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  favouriteCardTitle: { flex: 1, fontSize: FONT.body, fontWeight: "600", color: "#222222" },
  favouriteRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  favouriteRatingText: { fontSize: FONT.body, color: "#222222" },
  favouriteMeta: { fontSize: FONT.body, color: "#777777" },
  favouritePrice: { fontWeight: "700", color: "#222222" },
  favouriteBottomNav: {
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DADADA",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  favouriteBottomNavItem: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
  confirmedScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  confirmedContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    gap: 18,
  },
  confirmedCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E4E4E4" },
  confirmedTitle: { fontSize: FONT.heading, lineHeight: 25, fontWeight: "700", color: "#111111" },
  confirmedProgramCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 13,
    elevation: 4,
  },
  confirmedProgramImage: { width: 86, height: 86, borderRadius: 10, backgroundColor: "#E5E7EB" },
  confirmedProgramCopy: { flex: 1, gap: 7 },
  confirmedProgramTitle: { fontSize: FONT.headline, fontWeight: "500", color: "#222222" },
  confirmedMetaRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  confirmedMetaText: { flex: 1, fontSize: FONT.caption, lineHeight: 17, color: "#777777" },
  confirmedSection: { gap: 16 },
  confirmedSectionTitle: { fontSize: FONT.headline, fontWeight: "700", color: "#222222" },
  confirmedPersonRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  confirmedAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E5E7EB" },
  confirmedPersonCopy: { flex: 1, gap: 3 },
  confirmedPersonName: { fontSize: FONT.bodyLg, lineHeight: 19, fontWeight: "600", color: "#222222" },
  confirmedPersonNameFill: { flex: 1, fontSize: FONT.bodyLg, lineHeight: 19, fontWeight: "600", color: "#222222" },
  confirmedPersonRole: { fontSize: FONT.body, color: "#7A7A7A" },
  confirmedRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  confirmedRatingText: { fontSize: FONT.body, color: "#222222" },
  confirmedPaymentRow: { flexDirection: "row", alignItems: "center", gap: 24 },
  confirmedPaymentLabel: { fontSize: FONT.headline, fontWeight: "600", color: "#333333" },
  confirmedPaymentValue: { fontSize: FONT.headline, color: "#333333" },
  confirmedFooter: { gap: 12, marginTop: 2 },
  confirmedPrompt: { fontSize: FONT.caption, color: "#777777", textAlign: "center" },
  confirmedTimetableButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedTimetableButtonText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  childSelectContent: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 16 },
  childCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
  },
  childCardSelected: { borderColor: "#7EDCD8" },
  childCardRow: { flexDirection: "row", alignItems: "stretch", gap: 16 },
  childCardIdentity: { width: 128, alignItems: "center", justifyContent: "space-between" },
  childCardAvatar: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", backgroundColor: "#E5E7EB" },
  childCardAvatarImage: { width: "100%", height: "100%" },
  childCardName: { marginTop: 12, fontSize: FONT.heading, lineHeight: 24, fontWeight: "700", color: "#111111", textAlign: "center" },
  childCardStats: { flex: 1, gap: 6 },
  childCardYearValue: { fontSize: FONT.title, fontWeight: "700", color: "#222222", lineHeight: 26 },
  childCardYearLabel: { fontSize: FONT.body, fontWeight: "600", color: "#333333" },
  childCardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E4E4E4", marginVertical: 4 },
  childLevelBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  childLevelBeginner: { backgroundColor: "#E5F7F6" },
  childLevelAchiever: { backgroundColor: "#E5F7F6" },
  childLevelText: { fontSize: FONT.caption, fontWeight: "600" },
  childLevelBeginnerText: { color: "#555555" },
  childLevelAchieverText: { color: "#555555" },
  childSchoolRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  childSchoolName: { fontSize: FONT.bodyLg, fontWeight: "700", color: "#222222" },
  childSchoolMark: { color: "#0ABAB5", fontWeight: "700" },
  childSchoolStatus: { fontSize: FONT.body, fontWeight: "400" },
  childSchoolConnected: { color: "#0ABAB5", fontWeight: "600" },
  childSchoolMuted: { color: "#A3A3A3" },
  childCardMetaRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  childCardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  childCardMetaText: { fontSize: FONT.body, fontWeight: "400", color: "#5E5E5E" },
  promoteContent: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 16 },
  promoteInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  promoteInputField: { flex: 1, fontSize: FONT.bodyLg, color: "#222222", paddingVertical: 12 },
  promoteRedeem: { fontSize: FONT.bodyLg, color: "#222222", textDecorationLine: "underline" },
  promoteCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
  },
  promoteCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  promoteOfferRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  promoteTicketIcon: { width: 28, height: 18, borderRadius: 4, backgroundColor: "#0ABAB5", alignItems: "center", justifyContent: "center" },
  promoteOffer: { fontSize: FONT.heading, fontWeight: "700", color: "#222222" },
  promoteExpiry: { fontSize: FONT.secondary, color: "#8A8A8A" },
  promoteCardBody: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  promoteCardCopy: { flex: 1, gap: 6 },
  promoteSpend: { fontSize: FONT.body, color: "#222222" },
  promoteCentresRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  promoteCentres: { fontSize: FONT.secondary, color: "#8A8A8A" },
  promoteUseButton: {
    minWidth: 72,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  promoteUseText: { fontSize: FONT.bodyLg, fontWeight: "600", color: "#FFFFFF" },
  promoteSheetRoot: { flex: 1, justifyContent: "flex-end" },
  promoteSheetBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.45)" },
  promoteSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 10,
  },
  promoteSheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  promoteSheetTitle: { marginTop: 6, fontSize: FONT.heading, fontWeight: "700", color: "#222222" },
  promoteSheetMeta: { fontSize: FONT.body, color: "#666666" },
  promoteTerms: { gap: 10, marginTop: 8, marginBottom: 8 },
  promoteTermRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  promoteTermBullet: { fontSize: FONT.body, lineHeight: 20, color: "#444444" },
  promoteTermText: { flex: 1, fontSize: FONT.body, lineHeight: 20, color: "#444444" },
  classOptionReserveButton: {
    width: "65%",
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 14,
  },
  classOptionReserveButtonText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  reviewScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  reviewHeader: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewHeaderTitle: { fontSize: FONT.headerTitle, fontWeight: "600", color: "#222222" },
  reviewHeaderSpacer: { width: 40, height: 40 },
  reviewContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, gap: 20 },
  reviewCard: {
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 13,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
    elevation: 4,
  },
  reviewCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  reviewAuthorRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E5E7EB" },
  reviewAuthor: { fontSize: FONT.body, fontWeight: "600", color: "#5E5E5E" },
  reviewScoreRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  reviewScore: { marginLeft: 1, fontSize: FONT.body, color: "#343434" },
  reviewDate: { fontSize: FONT.caption, color: "#6B6B6B" },
  reviewBody: { fontSize: FONT.body, lineHeight: 20, color: "#5E5E5E" },
  memberProfileScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  memberProfileHeader: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberProfileBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  memberProfileHeaderTitle: { fontSize: FONT.headerTitle, fontWeight: "600", color: "#222222" },
  memberProfileHeaderSpacer: { width: 34, height: 34 },
  memberProfileContent: { paddingHorizontal: 16, paddingBottom: 44, gap: 18 },
  memberProfileSummaryCard: {
    borderRadius: 8,
    padding: 16,
    gap: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 9,
    elevation: 3,
  },
  memberProfileIdentityRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  memberProfileAvatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: "#E5E7EB" },
  memberProfileIdentityCopy: { flex: 1, gap: 5 },
  memberProfileNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  memberProfileName: { fontSize: FONT.headerTitle, fontWeight: "700", color: "#222222" },
  memberProfileTenure: { fontSize: FONT.caption, fontWeight: "600", color: "#444444" },
  memberProfileCentre: { fontSize: FONT.caption, lineHeight: 15, color: "#6B6B6B" },
  memberProfileBio: { fontSize: FONT.secondary, lineHeight: 18, color: "#5E5E5E" },
  memberProfileSection: { gap: 11 },
  memberProfileSectionTitle: {
    fontSize: FONT.headline,
    fontWeight: "700",
    color: "#222222",
    paddingBottom: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
  },
  memberProfileSkillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14 },
  memberProfileSkillChip: { minWidth: 60, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 4, backgroundColor: "#CFF3F1", alignItems: "center" },
  memberProfileSkillText: { fontSize: FONT.caption, fontWeight: "600", color: "#3F5756" },
  memberProfileTimelineCard: {
    borderRadius: 8,
    padding: 16,
    gap: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 9,
    elevation: 3,
  },
  memberProfileTimelineGroup: { gap: 7 },
  memberProfileTimelineYear: { fontSize: FONT.body, fontWeight: "700", color: "#222222" },
  memberProfileTimelineRail: { marginLeft: 12, paddingLeft: 18, borderLeftWidth: 1, borderLeftColor: "#A6A6A6", gap: 12 },
  memberProfileTimelineEntry: { position: "relative", gap: 3 },
  memberProfileTimelineDot: { position: "absolute", left: -21, top: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: "#777777" },
  memberProfileTimelineRole: { fontSize: FONT.secondary, fontWeight: "700", color: "#222222" },
  memberProfileTimelineDetail: { fontSize: FONT.caption, color: "#444444" },
  memberProfileTimelineMeta: { fontSize: FONT.caption, lineHeight: 15, color: "#6B6B6B" },
  memberProfileExperienceGroup: { gap: 5 },
  memberProfileExperienceCopy: { marginLeft: 28, gap: 3 },
  memberProfileDisclaimer: { marginHorizontal: 16, fontSize: FONT.caption, lineHeight: 16, color: "#5E5E5E" },
  centreDetailServices: { gap: 14 },
  centreDetailServiceRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  centreDetailServiceCopy: { flex: 1, gap: 2 },
  centreDetailServiceTitle: { fontSize: FONT.body, fontWeight: "700", color: "#222222" },
  centreDetailServiceDescription: { fontSize: FONT.caption, lineHeight: 17, color: "#5E6775" },
  centreDetailMap: {
    width: "100%",
    height: 190,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E5F4EA",
    borderWidth: 1,
    borderColor: "#D6E8DF",
  },
  centreDetailMapRoad: { position: "absolute", backgroundColor: "#FFFFFF", borderColor: "#D8DEE3", borderWidth: 1 },
  centreDetailMapRoadHorizontal: { left: -20, right: -20, top: 86, height: 24, transform: [{ rotate: "-8deg" }] },
  centreDetailMapRoadVertical: { top: -20, bottom: -20, left: "48%", width: 22, transform: [{ rotate: "12deg" }] },
  centreDetailMapLabel: { position: "absolute", fontSize: FONT.caption, fontWeight: "600", color: "#64748B" },
  centreDetailMapPin: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 38,
    height: 38,
    marginLeft: -19,
    marginTop: -19,
    borderRadius: 19,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  centreDetailSuggestions: { gap: 12, paddingBottom: 6, paddingRight: 18 },
  centreDetailSuggestionCard: {
    width: 235,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
    elevation: 4,
  },
  centreDetailSuggestionImageWrap: { height: 112, position: "relative", backgroundColor: "#E5E7EB" },
  centreDetailSuggestionImage: { width: "100%", height: "100%" },
  centreDetailSuggestionBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  centreDetailSuggestionBadgeText: { fontSize: FONT.caption, fontWeight: "600", color: "#222222" },
  centreDetailSuggestionBody: { padding: 10, gap: 6 },
  centreDetailSuggestionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  centreDetailSuggestionTitle: { flex: 1, fontSize: FONT.secondary, fontWeight: "700", color: "#222222" },
  centreDetailSuggestionRating: { fontSize: FONT.caption, color: "#222222" },
  centreDetailSuggestionMeta: { fontSize: FONT.caption, color: "#5E6775" },
  centreDetailFooter: {
    minHeight: 72,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  centreDetailFooterPrice: { fontSize: FONT.body, color: "#343434" },
  centreDetailFooterAvailability: { marginTop: 4, fontSize: FONT.caption, color: "#6B6B6B" },
  centreDetailProgramsButton: {
    flex: 1,
    maxWidth: 190,
    minHeight: 42,
    borderRadius: 6,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },
  centreDetailProgramsButtonText: { fontSize: FONT.body, fontWeight: "600", color: "#FFFFFF" },
  analyticsScreen: { flex: 1, backgroundColor: "#FFFFFF", overflow: "hidden" },
  analyticsPassportContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 0,
    gap: 18,
  },
  analyticsWordmark: { marginHorizontal: 16, fontSize: 26, fontWeight: "700", color: "#1A1A1A" },
  analyticsWordmarkZ: { color: "#0ABAB5" },
  analyticsWatermarkWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 760,
  },
  analyticsPassportChild: { alignItems: "center", alignSelf: "center", gap: 14, paddingHorizontal: 16 },
  analyticsPassportAvatar: { width: 168, height: 168, borderRadius: 84, backgroundColor: "#E5E7EB" },
  analyticsPassportNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  analyticsPassportName: { fontSize: FONT.headerTitle, fontWeight: "700", color: "#1A1A1A" },
  analyticsPassportMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  analyticsPassportMeta: { fontSize: FONT.secondary, color: "#777777" },
  analyticsLevelBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#DFF5F3" },
  analyticsLevelText: { fontSize: FONT.caption, fontWeight: "600", color: "#5B6666" },
  analyticsPassportCards: { gap: 20, marginTop: 12 },
  analyticsPassportCard: {
    minHeight: 100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  analyticsPassportCardLast: { minHeight: 128 },
  analyticsPassportCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  analyticsPassportCardTitle: { flexShrink: 1, fontSize: FONT.headline, fontWeight: "500", color: "#222222" },
  analyticsPassportCardDivider: { height: StyleSheet.hairlineWidth, marginTop: 7, marginLeft: 31, backgroundColor: "#777777" },
  analyticsPassportCardFooter: { minHeight: 32, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  analyticsPassportCardFooterLast: { flex: 1, alignItems: "flex-start", paddingTop: 10 },
  analyticsPassportLastArrow: { alignSelf: "flex-end" },
  analyticsPassportCardDescription: { flex: 1, fontSize: FONT.caption, lineHeight: 16, color: "#777777" },
  passportMenuPanel: {
    flexGrow: 1,
    minHeight: 420,
    marginTop: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
    backgroundColor: "#F7F7F7",
  },
  passportCompanionCard: {
    minHeight: 174,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  passportCompanionArt: { width: 96, height: 88 },
  passportDashboardRow: { flexDirection: "row", gap: 16 },
  passportDashboardCard: {
    flex: 1,
    minHeight: 194,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  passportDashboardArt: { width: 108, height: 108 },
  passportMenuCardTitle: { fontSize: FONT.headerTitle, lineHeight: 21, fontWeight: "600", color: "#2A2A2A", textAlign: "center" },
  analyticsDashboardHeader: {
    width: "100%",
    maxWidth: 520,
    minHeight: 62,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  analyticsDashboardHeaderTitle: { flex: 1, fontSize: FONT.headerTitle, fontWeight: "500", color: "#222222", textAlign: "center" },
  analyticsDashboardBack: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F0F0" },
  analyticsDashboardHeaderSpacer: { width: 38 },
  analyticsDashboardContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 20,
  },
  analyticsChildIdentity: { minHeight: 88, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 24, paddingHorizontal: 10, paddingVertical: 2 },
  analyticsChildAvatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#E5E7EB" },
  analyticsChildCopy: { flex: 1, gap: 8 },
  analyticsChildName: { fontSize: FONT.heading, fontWeight: "600", color: "#222222" },
  analyticsChildMetaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  analyticsChildMeta: { fontSize: FONT.secondary, color: "#777777" },
  analyticsMetricRow: { flexDirection: "row", gap: 14 },
  dashboardPictureCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  dashboardPictureHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  dashboardPictureHeaderCopy: { flex: 1, gap: 10 },
  dashboardPictureTitle: { fontSize: FONT.headline, fontWeight: "600", color: "#222222" },
  dashboardPictureHero: { width: 74, height: 74 },
  dashboardBadge: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 9, paddingVertical: 4 },
  dashboardBadgeTeal: { backgroundColor: "#DFF5F3" },
  dashboardBadgeAmber: { backgroundColor: "#F3E6C4" },
  dashboardBadgeText: { fontSize: FONT.caption, fontWeight: "600" },
  dashboardBadgeTextTeal: { color: "#3A6F6B" },
  dashboardBadgeTextAmber: { color: "#7A6240" },
  dashboardPictureText: { marginTop: 14, fontSize: FONT.caption, lineHeight: 16, color: "#333333" },
  dashboardPictureUnlock: { marginTop: 10, fontSize: FONT.caption, fontWeight: "600", color: "#222222", textDecorationLine: "underline" },
  dashboardMetricCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  dashboardMetricValueRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
  dashboardMetricIcon: { width: 26, height: 26 },
  dashboardMetricValue: { fontSize: 28, lineHeight: 32, fontWeight: "700", color: "#1A1A1A" },
  dashboardMetricLabel: { fontSize: FONT.caption, lineHeight: 16, color: "#4A4A4A", textAlign: "center" },
  dashboardRecordCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  dashboardRecordHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  dashboardRecordTitle: { flex: 1, fontSize: FONT.headline, fontWeight: "600", color: "#222222" },
  dashboardRecordArt: { width: 78, height: 70 },
  dashboardRecordRows: { marginTop: 8, gap: 6 },
  dashboardRecordRow: {
    minHeight: 24,
    borderRadius: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#E9F7F6",
  },
  dashboardRecordName: { flex: 1, fontSize: FONT.micro, color: "#222222" },
  dashboardRecordDate: { fontSize: FONT.micro, color: "#222222" },
  dashboardActionCard: {
    minHeight: 146,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  dashboardActionArt: { width: 82, height: 80 },
  dashboardActionTitle: { fontSize: FONT.headline, fontWeight: "600", color: "#222222" },
  activityInsightCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  activityInsightHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  activityInsightTitle: { flex: 1, fontSize: FONT.headerTitle, lineHeight: 22, fontWeight: "700", color: "#1A1A1A" },
  activityInsightArt: { width: 72, height: 64 },
  activityInsightItems: { marginTop: 14, gap: 16 },
  activityInsightItem: { gap: 4 },
  activityInsightItemTitle: { fontSize: FONT.bodyLg, lineHeight: 20, fontWeight: "700", color: "#1A1A1A" },
  activityInsightItemBody: { fontSize: FONT.secondary, lineHeight: 18, color: "#6A6A6A" },
  analyticsBottomNav: {
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DADADA",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  kpiRow: { flexDirection: "row", gap: 10 },
  kpiCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", padding: 12 },
  kpiValue: { fontSize: FONT.heading, fontWeight: "700", color: "#111827" },
  kpiLabel: { marginTop: 4, fontSize: FONT.caption, color: "#6B7280" },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingLabel: { fontSize: FONT.body, color: "#111827", fontWeight: "500" },
  flowItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", marginBottom: 8 },
  flowItemActive: { borderColor: "#0ABAB5", backgroundColor: "#EFFFFE" },
  flowTitle: { fontSize: FONT.bodyLg, fontWeight: "600", color: "#111827" },
  flowMeta: { marginTop: 4, fontSize: FONT.caption, color: "#6B7280" },
  helperText: { color: "#4B5563", lineHeight: 20 },
  lineItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 10,
  },
  lineItemText: { fontSize: FONT.bodyLg, color: "#111827", fontWeight: "600" },
  filterRow: { flexDirection: "row", gap: 8, paddingVertical: 4, marginBottom: 6 },
  filterPill: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" },
  filterPillActive: { borderColor: "#0ABAB5", backgroundColor: "#EFFFFE" },
  filterPillText: { fontSize: FONT.caption, color: "#1F2937", fontWeight: "600" },
  loginHintBox: {
    borderWidth: 1,
    borderColor: "#CFF4F1",
    backgroundColor: "#F3FFFE",
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  loginHintTitle: { fontSize: FONT.secondary, fontWeight: "700", color: "#0B8A84", marginBottom: 2 },
  loginHintLine: { fontSize: FONT.caption, color: "#1F2937" },
  loginHintSub: { fontSize: FONT.caption, color: "#6B7280" },
  loginHintPwd: { marginTop: 6, fontSize: FONT.caption, color: "#0F766E", fontWeight: "700" },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  profileAvatar: { width: 48, height: 48, borderRadius: 24 },
  profileAvatarSmall: { width: 36, height: 36, borderRadius: 18 },
  inlineAvatarRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  inlineAvatar: { width: 32, height: 32, borderRadius: 16 },
  inboxIcon: { width: 18, height: 18, resizeMode: "contain", tintColor: "#6B7280" },
  previewShell: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    padding: 10,
    gap: 8,
  },
  previewTitle: { fontSize: FONT.caption, color: "#6B7280", fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  previewPhone: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    minHeight: 260,
  },
  previewPage: { padding: 12, gap: 8 },
  previewHeading: { fontSize: FONT.heading, color: "#111827", fontWeight: "700" },
  previewHeroCard: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", padding: 10, backgroundColor: "#fff" },
  previewHeroImage: { width: "100%", height: 86, borderRadius: 8, marginBottom: 8 },
  previewHeroImageTall: { width: "100%", height: 110, borderRadius: 8, marginBottom: 8 },
  previewBannerImage: { width: "100%", height: 72, borderRadius: 10, marginBottom: 2 },
  previewHeroTitle: { fontSize: FONT.body, color: "#1F2937", fontWeight: "700" },
  previewMeta: { fontSize: FONT.caption, color: "#6B7280", marginTop: 3 },
  previewPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  previewPill: { borderRadius: 999, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#fff" },
  previewPillText: { fontSize: FONT.caption, color: "#1F2937", fontWeight: "600" },
  previewSearchInput: { borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#fff" },
  previewSearchText: { color: "#9CA3AF", fontSize: FONT.body },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  previewGridCard: { width: "48%", borderRadius: 10, padding: 10, minHeight: 58, justifyContent: "flex-end", overflow: "hidden" },
  previewGridImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  previewGridOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.15)" },
  previewGridText: { color: "#fff", fontSize: FONT.body, fontWeight: "700" },
  previewPriceBlock: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", padding: 10, backgroundColor: "#fff" },
  previewPriceNow: { fontSize: FONT.heading, color: "#111827", fontWeight: "700" },
  previewSubHeading: { fontSize: FONT.secondary, color: "#111827", fontWeight: "700", marginBottom: 6 },
  previewLinkText: { fontSize: FONT.caption, color: "#374151", textDecorationLine: "underline", marginBottom: 6 },
  previewCalendarBlock: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", padding: 10, backgroundColor: "#fff" },
  previewListRow: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", padding: 10 },
  previewStatsRow: { flexDirection: "row", gap: 8 },
  previewStatCard: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", paddingVertical: 10, alignItems: "center", backgroundColor: "#fff" },
  previewStatValue: { fontSize: 18, color: "#111827", fontWeight: "700" },
  previewStatLabel: { fontSize: FONT.caption, color: "#6B7280", marginTop: 2 },
  previewCompanionHero: { borderRadius: 10, padding: 12, backgroundColor: "#EFFFFE", borderWidth: 1, borderColor: "#B7F2EE" },
  previewCompanionName: { fontSize: 18, color: "#0B8A84", fontWeight: "700" },
  companionTabsRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  companionTab: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  companionTabActive: { borderColor: "#0ABAB5", backgroundColor: "#EFFFFE" },
  companionTabText: { fontSize: FONT.caption, color: "#1F2937", fontWeight: "600" },
  companionBadge: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  companionBadgeText: { fontSize: FONT.bodyLg, color: "#1F2937", fontWeight: "700" },
  sectionArtImage: { width: "100%", height: 90, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: "#DBEAFE", backgroundColor: "#F4FAFF" },
  previewAvatarRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  previewAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: "#E5E7EB" },
  previewLogoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 8, gap: 6 },
  previewLogoMark: { width: 78, height: 92, resizeMode: "contain" },
  previewLogoMarkCompact: { width: 66, height: 78 },
  previewLogoWord: { width: 105, height: 28, resizeMode: "contain" },
  loginRoleRow: { flexDirection: "row", borderRadius: 12, backgroundColor: "#0ABAB5", padding: 4, marginBottom: 8 },
  loginRoleTabActive: { flex: 1, textAlign: "center", color: "#0ABAB5", backgroundColor: "#fff", paddingVertical: 8, borderRadius: 8, fontWeight: "700" },
  loginRoleTab: { flex: 1, textAlign: "center", color: "#fff", paddingVertical: 8, fontWeight: "600" },
  paymentRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  paymentIcon: { width: 23, height: 16, resizeMode: "contain" },
  bottomNavWrap: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  bottomNavIconWrap: {
    width: 36,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  bottomNavIconActive: { backgroundColor: "#EFFFFE" },
  bottomNavIcon: { width: 20, height: 20, resizeMode: "contain" },
  realTabIconWrap: {
    width: 34,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    transform: [{ translateY: 0 }],
  },
  realTabIconWrapActive: { backgroundColor: "transparent" },
  realTabIcon: { width: 21, height: 21, resizeMode: "contain" },
  profileTabAvatar: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, borderColor: "#D8D8D8" },
  profileTabAvatarActive: { borderWidth: 2, borderColor: "#0ABAB5" },
  primaryDisabledMain: { opacity: 0.45 },
})
