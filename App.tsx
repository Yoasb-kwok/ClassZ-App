import { useEffect, useMemo, useRef, useState } from "react"
import { StatusBar } from "expo-status-bar"
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
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useHeaderHeight } from "@react-navigation/elements"
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
import { createInitialFlowAppState, FlowApplicationSurface, type FlowAppState } from "./src/flow-application"
import { HOME_BANNER, HOME_PASSPORT_IMAGE, HOME_RECOMMEND_IMAGES, HOME_TRENDING_IMAGES, NAV_ICONS, SEARCH_BANNER_CENTRE, SEARCH_BANNER_PARENT, SEARCH_CATEGORY_COLORS, SEARCH_CATEGORY_IMAGES } from "./src/home-assets"
import { HOME_CATEGORY_SVGS } from "./src/home-category-svgs"
import { HOME_HEADER_SVGS } from "./src/home-header-svgs"
import {
  AuthLandingScreen,
  ForgotPasswordScreen,
  LoginFormScreen,
  RegisterAccountTypeScreen,
  RegisterFormScreen,
  type AuthRole,
} from "./src/auth-screens"
import { LOGIN_SVGS } from "./src/login-svgs"
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

type RootStackParamList = {
  AuthLanding: undefined
  Login: { role: AuthRole }
  RegisterAccountType: { role?: AuthRole } | undefined
  RegisterForm: { accountType: "parent" | "coach" | "centre" }
  ForgotPassword: { role: AuthRole }
  AppTabs: undefined
  CentreDetailApp: undefined
  ReservationApp: undefined
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
const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabsParamList>()

type SearchFilterState = {
  districts: string[]
  minPrice: string
  maxPrice: string
  ratings: number[]
  services: string[]
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
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.profileAvatarSmall} />
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
            <Text style={styles.centreDetailReviewLink}>· {centre.reviewCount} reviews</Text>
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
            <View style={styles.centreDetailMember}>
              <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.centreDetailMemberImage} />
              <Text style={styles.centreDetailMemberName}>Jessica Lam</Text>
              <Text style={styles.centreDetailMemberRole}>Centre Manager</Text>
            </View>
            <View style={styles.centreDetailMember}>
              <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.centreDetailMemberImage} />
              <Text style={styles.centreDetailMemberName}>Athena Yeung</Text>
              <Text style={styles.centreDetailMemberRole}>Program Coach</Text>
            </View>
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
            setFlowAppState((prev) => ({ ...prev, selectedProgramId: relatedProgram.id }))
            navigation.navigate("ReservationApp")
          }}
        >
          <Text style={styles.centreDetailProgramsButtonText}>Programs</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function CalendarTabScreen({ flowAppState }: { flowAppState: FlowAppState }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <Text style={styles.pageTitle}>Calendar</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{flowAppState.bookings.length}</Text>
            <Text style={styles.kpiLabel}>Booked programs</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>
              ${flowAppState.bookings.reduce((sum, b) => sum + b.total, 0)}
            </Text>
            <Text style={styles.kpiLabel}>Total paid</Text>
          </View>
        </View>
        {!flowAppState.bookings.length ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No bookings yet</Text>
            <Text style={styles.cardMeta}>Book from Home/Search to see schedule here.</Text>
          </View>
        ) : null}
        {flowAppState.bookings.map((b) => (
          <View key={b.id} style={styles.card}>
            <Image source={{ uri: programImageFor(flowAppState.programs.find((p) => p.id === b.programId)?.category || "others") }} style={styles.appCardImage} />
            <Text style={styles.cardTitle}>{b.title}</Text>
            <Text style={styles.cardMeta}>{b.lessonCount} lessons · {b.dateRange}</Text>
            <Text style={styles.cardMeta}>Total paid: ${b.total}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function AnalyticsTabScreen({ navigation, flowAppState }: { navigation: any; flowAppState: FlowAppState }) {
  const selectedStudent = flowAppState.students.find((s) => s.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const count = flowAppState.learningRecords[selectedStudent.id] || 0
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <Text style={styles.pageTitle}>Analytics</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{count}</Text>
            <Text style={styles.kpiLabel}>Records for selected child</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{Object.keys(flowAppState.generatedCompanions).length}</Text>
            <Text style={styles.kpiLabel}>Companion reports</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Image source={{ uri: FIGMA_ASSETS.main.recommend1 }} style={styles.appCardImage} />
          <Text style={styles.cardTitle}>Learning Record</Text>
          <Text style={styles.cardMeta}>{selectedStudent.name}: {count}/3 records</Text>
          <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={() => navigation.navigate("LearningRecordsApp")}>
            <Text style={styles.secondaryButtonText}>Open Learning Records</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={() => navigation.navigate("CompanionApp")}>
            <Text style={styles.secondaryButtonText}>Open Learning Companion</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.profileAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{session.user.name}</Text>
              <Text style={styles.cardMeta}>{session.user.email}</Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>Role: {session.user.role}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current child</Text>
          <Text style={styles.cardMeta}>{flowAppState.students.find((s) => s.id === flowAppState.selectedStudentId)?.name || "N/A"}</Text>
          <Text style={styles.cardMeta}>Bookings: {flowAppState.bookings.length}</Text>
        </View>
        <View style={styles.card}>
          <Pressable style={styles.settingRow}>
            <Text style={styles.settingLabel}>Language</Text>
            <Feather name="chevron-right" size={16} color="#9CA3AF" />
          </Pressable>
          <Pressable style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Feather name="chevron-right" size={16} color="#9CA3AF" />
          </Pressable>
        </View>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("InboxApp")}>
          <Text style={styles.secondaryButtonText}>Open Inbox</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onSignOut}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function ReservationAppScreen({
  navigation,
  flowAppState,
  setFlowAppState,
}: {
  navigation: any
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const active = flowAppState.programs.find((p) => p.id === flowAppState.selectedProgramId) || flowAppState.programs[0]
  const lessonCount = 8
  const discount = flowAppState.couponCode.trim().toUpperCase() === "SAVE800" ? 800 : 0
  const total = active.price * lessonCount - discount + 5

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <Text style={styles.pageTitle}>Reservation</Text>
        <View style={styles.card}>
          <Image source={{ uri: FIGMA_ASSETS.reservation.program }} style={styles.appCardImageTall} />
          <Text style={styles.cardTitle}>{active.title}</Text>
          <Text style={styles.cardMeta}>8 lessons · Oct 23 - Nov 28 · {active.location}</Text>
          <View style={styles.inlineAvatarRow}>
            <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.inlineAvatar} />
            <Image source={{ uri: FIGMA_ASSETS.reservation.coach }} style={styles.inlineAvatar} />
            <Image source={{ uri: FIGMA_ASSETS.reservation.child }} style={styles.inlineAvatar} />
          </View>
        </View>
        <Text style={styles.sectionTitle}>Promote code</Text>
        <TextInput
          style={styles.input}
          placeholder="Coupon code (try SAVE800)"
          value={flowAppState.couponCode}
          onChangeText={(t) => setFlowAppState((prev) => ({ ...prev, couponCode: t }))}
        />
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pay with</Text>
          <View style={styles.paymentRow}>
            {[FIGMA_ASSETS.reservation.paymentVisa, FIGMA_ASSETS.reservation.paymentAmex, FIGMA_ASSETS.reservation.paymentPayPal, FIGMA_ASSETS.reservation.paymentApplePay, FIGMA_ASSETS.reservation.paymentMastercard].map((icon, idx) => (
              <Image key={`${icon}-${idx}`} source={{ uri: icon }} style={styles.paymentIcon} />
            ))}
          </View>
          <Text style={styles.cardMeta}>Lesson fee: ${active.price * lessonCount}</Text>
          <Text style={styles.cardMeta}>Discount: -${discount}</Text>
          <Text style={styles.cardMeta}>Platform fee: $5</Text>
          <Text style={styles.cardTitle}>Total (HKD): ${total}</Text>
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            const booking = {
              id: `b${Date.now()}`,
              programId: active.id,
              title: active.title,
              lessonCount,
              dateRange: "Oct 23 - Nov 28",
              total,
            }
            setFlowAppState((prev) => ({ ...prev, bookings: [booking, ...prev.bookings] }))
            navigation.navigate("AppTabs", { screen: "Calendar" })
          }}
        >
          <Text style={styles.primaryButtonText}>Reserve & Open Calendar</Text>
        </Pressable>
        <Text style={styles.microText}>
          By paying, you agree to ClassZ terms and cancellation policy.
        </Text>
      </ScrollView>
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

function CompanionAppScreen({
  flowAppState,
  setFlowAppState,
}: {
  flowAppState: FlowAppState
  setFlowAppState: React.Dispatch<React.SetStateAction<FlowAppState>>
}) {
  const selected = flowAppState.students.find((s) => s.id === flowAppState.selectedStudentId) || flowAppState.students[0]
  const current = flowAppState.generatedCompanions[selected.id] || "Rabbit"
  const animals: Array<{ name: "Rabbit" | "Owl" | "Dolphin" | "Turtle" | "Fox" | "Bee"; key: CompanionAnimalKey }> = [
    { name: "Rabbit", key: "rabbit" },
    { name: "Owl", key: "owl" },
    { name: "Dolphin", key: "dolphin" },
    { name: "Turtle", key: "turtle" },
    { name: "Fox", key: "fox" },
    { name: "Bee", key: "bee" },
  ]
  const activeKey = animals.find((a) => a.name === current)?.key || "rabbit"
  const poses = companionPosesFor(activeKey)
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <Text style={styles.pageTitle}>Learning Companion</Text>
        <View style={styles.card}>
          <Image source={{ uri: companionZSirImage() }} style={styles.appCardImage} />
          <Text style={styles.cardTitle}>{selected.name}</Text>
          <Text style={styles.cardMeta}>Current companion: {current}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {animals.map((a) => (
              <Pressable
                key={a.name}
                style={[styles.filterPill, current === a.name ? styles.filterPillActive : null]}
                onPress={() =>
                  setFlowAppState((prev) => ({
                    ...prev,
                    generatedCompanions: { ...prev.generatedCompanions, [selected.id]: a.name },
                  }))
                }
              >
                <Text style={styles.filterPillText}>{a.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        {["What may help", "Why we think this", "Supporting companion", "Strategies and next step"].map((title, idx) => (
          <View key={title} style={styles.card}>
            <Image source={{ uri: poses[idx] }} style={styles.sectionArtImage} />
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
        ))}
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
  route,
  locale,
}: {
  route: { params: { threadId: string } }
  locale: AppLocale
}) {
  const t = tInbox(locale)
  const thread = findInboxThread(route.params.threadId)
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<InboxChatMessage[]>(() => getInboxMessages(route.params.threadId))
  const chatListRef = useRef<ScrollView>(null)
  const headerHeight = useHeaderHeight()

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
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={styles.inboxChatHeaderMeta}>
          <Text style={styles.inboxResponseTime}>{t.responseTime(thread.responseTime)}</Text>
        </View>
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
                  <View style={styles.inboxChatAvatar}>
                    <Text style={styles.inboxThreadAvatarText}>Z</Text>
                  </View>
                ) : null}
                <View style={[styles.inboxBubbleCol, mine ? styles.inboxBubbleColMine : null]}>
                  <View style={[styles.inboxBubble, mine ? styles.inboxBubbleMine : styles.inboxBubbleCentre]}>
                    <Text style={[styles.inboxBubbleText, mine ? styles.inboxBubbleTextMine : null]}>{msg.text}</Text>
                  </View>
                  <Text style={[styles.inboxBubbleTime, mine ? styles.inboxBubbleTimeMine : null]}>{msg.time}</Text>
                </View>
                {mine ? (
                  <Image source={{ uri: FIGMA_ASSETS.reservation.host }} style={styles.inboxChatAvatarImage} />
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
  const paymentIcons = [
    FIGMA_ASSETS.reservation.paymentVisa,
    FIGMA_ASSETS.reservation.paymentAmex,
    FIGMA_ASSETS.reservation.paymentPayPal,
    FIGMA_ASSETS.reservation.paymentApplePay,
    FIGMA_ASSETS.reservation.paymentMastercard,
    FIGMA_ASSETS.reservation.paymentAlipay,
    FIGMA_ASSETS.reservation.paymentWechat,
    FIGMA_ASSETS.reservation.paymentUnionPay,
    FIGMA_ASSETS.reservation.paymentJcb,
  ]
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
            {paymentIcons.map((icon, idx) => (
              <Image key={`${icon}-${idx}`} source={{ uri: icon }} style={styles.paymentIcon} />
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
        tabBarIcon: ({ color }) => {
          const routeName = route.name as keyof TabsParamList
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
            <Stack.Screen name="ReservationApp" options={{ title: "Reservation" }}>
              {(props) => <ReservationAppScreen {...props} flowAppState={flowAppState} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="LearningRecordsApp" options={{ title: "Learning Records" }}>
              {(props) => <LearningRecordsAppScreen {...props} flowAppState={flowAppState} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="CompanionApp" options={{ title: "Learning Companion" }}>
              {(props) => <CompanionAppScreen {...props} flowAppState={flowAppState} setFlowAppState={setFlowAppState} />}
            </Stack.Screen>
            <Stack.Screen name="InboxApp" options={{ title: tInbox(locale).title }}>
              {(props) => <InboxAppScreen {...props} locale={locale} />}
            </Stack.Screen>
            <Stack.Screen
              name="InboxMessageApp"
              options={({ route }) => ({
                title: findInboxThread(route.params.threadId)?.centre || tInbox(locale).title,
              })}
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
  brand: { fontSize: 34, color: "#0ABAB5", fontWeight: "700", textAlign: "center", marginBottom: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: "#1F2937", textAlign: "center", marginBottom: 8 },
  portalCard: { borderWidth: 2, borderColor: "#C4EFE9", borderRadius: 18, padding: 20, minHeight: 140, justifyContent: "center", backgroundColor: "#F8FFFE" },
  portalCardActive: { borderColor: "#0ABAB5" },
  portalTitle: { fontSize: 19, fontWeight: "700", color: "#1F2937", textAlign: "center" },
  portalSubtitle: { marginTop: 8, color: "#4B5563", fontSize: 14, textAlign: "center", lineHeight: 20 },
  headerBackIconBtn: { paddingVertical: 2, paddingRight: 8 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: "#fff" },
  error: { color: "#DC2626", fontSize: 13, textAlign: "center" },
  primaryButton: { backgroundColor: "#0ABAB5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryButton: { borderWidth: 1, borderColor: "#D7F4F3", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { color: "#0ABAB5", fontWeight: "600", fontSize: 15 },
  flex1: { flex: 1 },
  page: { flex: 1, backgroundColor: "#fff" },
  pageContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 24, gap: 16 },
  notificationPageContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 0 },
  notificationItem: { paddingVertical: 14, gap: 4 },
  notificationCategory: {
    fontSize: 12,
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
  notificationCentre: { flex: 1, fontSize: 12, fontWeight: "400", color: "#222222" },
  notificationNote: { fontSize: 14, fontWeight: "400", color: "#222222", lineHeight: 20 },
  notificationMetaRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  notificationMeta: { fontSize: 10, fontWeight: "400", color: "#5E5E5E" },
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
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
  },
  inboxArchivedCount: {
    fontSize: 13,
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
  inboxThreadCentre: { flex: 1, fontSize: 12, fontWeight: "400", color: "#222222" },
  inboxThreadPreview: { fontSize: 14, fontWeight: "400", color: "#222222" },
  inboxThreadMetaRow: { flexDirection: "row", gap: 10 },
  inboxThreadMeta: { fontSize: 10, color: "#5E5E5E" },
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
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  inboxChatHeaderMeta: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  inboxResponseTime: { fontSize: 12, color: "#7A7A7A", textAlign: "center" },
  inboxChatContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 14 },
  inboxTodayBadge: {
    alignSelf: "center",
    backgroundColor: "#D7F4F3",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inboxTodayBadgeText: { fontSize: 12, fontWeight: "700", color: "#222222" },
  inboxBubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  inboxBubbleRowMine: { justifyContent: "flex-end" },
  inboxChatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4AE00",
    alignItems: "center",
    justifyContent: "center",
  },
  inboxChatAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  inboxBubbleCol: { maxWidth: "72%", gap: 4 },
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
  inboxBubbleText: { fontSize: 14, color: "#292929", lineHeight: 20 },
  inboxBubbleTextMine: { color: "#FFFFFF" },
  inboxBubbleTime: { fontSize: 12, color: "#7A7A7A" },
  inboxBubbleTimeMine: { textAlign: "right" },
  inboxComposerWrap: {
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
    fontSize: 14,
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
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  searchPageTitle: { fontSize: 28, fontWeight: "700", color: "#111827" },
  helloText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  microText: { fontSize: 12, color: "#6B7280" },
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
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937", marginBottom: 6 },
  cardMeta: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 6 },
  appHeroImage: { width: "100%", height: 108, borderRadius: 12 },
  appCardImage: { width: "100%", height: 96, borderRadius: 10, marginBottom: 10 },
  appCardImageTall: { width: "100%", height: 128, borderRadius: 10, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10 },
  smallCard: { flex: 1, borderRadius: 14, backgroundColor: "#0ABAB5", padding: 16, minHeight: 84, justifyContent: "center" },
  secondaryCard: { backgroundColor: "#14B8A6" },
  smallCardText: { fontSize: 15, color: "#ffffff", fontWeight: "700" },
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
  homeWideCardRating: { fontSize: 12, color: "#111827", fontWeight: "500" },
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
  senBadgeText: { fontSize: 12, color: "#222222", fontWeight: "600" },
  homeWideCardTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: "#222222" },
  homeWideCardMeta: { fontSize: 13, color: "#5E5E5E" },
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
  categoryPillText: { fontSize: 10, fontWeight: "600", color: "#222222", textAlign: "center" },
  localePill: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  localePillText: { fontSize: 11, fontWeight: "700", color: "#222222" },
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
  passportTitle: { fontSize: 14, fontWeight: "700", color: "#222222" },
  passportDesc: { fontSize: 13, fontWeight: "400", color: "#5E5E5E", lineHeight: 18 },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tagCard: { width: "48%", minHeight: 82, borderRadius: 12, backgroundColor: "#EEF7FF", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  tagCardActive: { backgroundColor: "#E0FBF9", borderWidth: 1, borderColor: "#0ABAB5" },
  tagCardImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  tagCardOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.15)" },
  tagText: { fontSize: 17, color: "#0F172A", fontWeight: "600" },
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
  searchCategoryText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", zIndex: 2 },
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
  searchCategoryTabText: { fontSize: 10, fontWeight: "500", color: "#B9B9B9" },
  searchCategoryTabTextActive: { color: "#222222" },
  searchFilterButton: { alignSelf: "flex-start", paddingVertical: 1 },
  searchFilterText: { fontSize: 14, color: "#343434", textDecorationLine: "underline" },
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
  searchFilterPageTitle: { fontSize: 20, fontWeight: "700", color: "#111111", marginBottom: 16 },
  searchFilterRegion: { borderTopWidth: 1, borderTopColor: "#E9E9E9", paddingTop: 15, paddingBottom: 8, gap: 10 },
  searchFilterSection: { paddingVertical: 14, gap: 12 },
  searchFilterSectionHeadingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  searchFilterSectionTitle: { fontSize: 14, fontWeight: "700", color: "#222222" },
  searchFilterChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  searchFilterChip: {
    minHeight: 24,
    borderRadius: 3,
    backgroundColor: "#EFEFEF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  searchFilterChipSelected: { backgroundColor: "#C8F1EF" },
  searchFilterChipText: { fontSize: 11, fontWeight: "500", color: "#5E5E5E" },
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
  searchFilterPriceLabel: { fontSize: 10, color: "#8A8A8A" },
  searchFilterPriceInputRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  searchFilterCurrency: { fontSize: 13, fontWeight: "600", color: "#343434" },
  searchFilterPriceInput: { flex: 1, padding: 0, fontSize: 13, fontWeight: "600", color: "#343434" },
  searchFilterRatingChip: { flexDirection: "row", minWidth: 40, gap: 4 },
  searchFilterApplyButton: {
    minHeight: 46,
    borderRadius: 7,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  searchFilterApplyButtonText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
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
  searchResultSenText: { fontSize: 12, fontWeight: "600", color: "#222222" },
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
  searchResultTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: "#222222" },
  searchResultRating: { fontSize: 13, color: "#343434" },
  searchResultMeta: { fontSize: 13, color: "#5E5E5E" },
  searchEmptyState: { alignItems: "center", paddingVertical: 42, gap: 7 },
  searchEmptyTitle: { fontSize: 16, fontWeight: "700", color: "#343434" },
  searchEmptyText: { fontSize: 13, color: "#777777", textAlign: "center" },
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
  searchBannerText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", zIndex: 2 },
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
  searchInput: { flex: 1, fontSize: 16, color: "#111827" },
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
  centreDetailTitle: { flex: 1, fontSize: 18, lineHeight: 22, fontWeight: "700", color: "#222222" },
  centreDetailRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  centreDetailRating: { fontSize: 12, fontWeight: "600", color: "#222222" },
  centreDetailReviewLink: { fontSize: 12, color: "#343434", textDecorationLine: "underline" },
  centreDetailAddressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  centreDetailAddress: { flex: 1, fontSize: 11, color: "#4B5563" },
  centreDetailDescription: { fontSize: 11, lineHeight: 16, color: "#6B7280", marginTop: 10 },
  centreDetailDivider: { height: 1, backgroundColor: "#E9E9E9", marginVertical: 4 },
  centreDetailSectionTitle: { fontSize: 14, fontWeight: "700", color: "#222222" },
  centreDetailMembersRow: { flexDirection: "row", gap: 12 },
  centreDetailMember: { flex: 1, gap: 4 },
  centreDetailMemberImage: { width: "100%", height: 138, borderRadius: 8, backgroundColor: "#E5E7EB" },
  centreDetailMemberName: { fontSize: 12, fontWeight: "600", color: "#222222" },
  centreDetailMemberRole: { fontSize: 10, color: "#777777" },
  centreDetailServices: { gap: 14 },
  centreDetailServiceRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  centreDetailServiceCopy: { flex: 1, gap: 2 },
  centreDetailServiceTitle: { fontSize: 12, fontWeight: "700", color: "#222222" },
  centreDetailServiceDescription: { fontSize: 10, lineHeight: 14, color: "#6B7280" },
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
  centreDetailMapLabel: { position: "absolute", fontSize: 10, fontWeight: "600", color: "#64748B" },
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
  centreDetailSuggestionBadgeText: { fontSize: 9, fontWeight: "600", color: "#222222" },
  centreDetailSuggestionBody: { padding: 10, gap: 6 },
  centreDetailSuggestionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  centreDetailSuggestionTitle: { flex: 1, fontSize: 11, fontWeight: "700", color: "#222222" },
  centreDetailSuggestionRating: { fontSize: 10, color: "#222222" },
  centreDetailSuggestionMeta: { fontSize: 10, color: "#6B7280" },
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
  centreDetailFooterPrice: { fontSize: 12, color: "#343434" },
  centreDetailFooterAvailability: { marginTop: 4, fontSize: 10, color: "#777777" },
  centreDetailProgramsButton: {
    flex: 1,
    maxWidth: 190,
    minHeight: 42,
    borderRadius: 6,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },
  centreDetailProgramsButtonText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  kpiRow: { flexDirection: "row", gap: 10 },
  kpiCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", padding: 12 },
  kpiValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  kpiLabel: { marginTop: 4, fontSize: 12, color: "#6B7280" },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingLabel: { fontSize: 14, color: "#111827", fontWeight: "500" },
  flowItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", marginBottom: 8 },
  flowItemActive: { borderColor: "#0ABAB5", backgroundColor: "#EFFFFE" },
  flowTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  flowMeta: { marginTop: 4, fontSize: 12, color: "#6B7280" },
  helperText: { color: "#4B5563", lineHeight: 20 },
  lineItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 10,
  },
  lineItemText: { fontSize: 15, color: "#111827", fontWeight: "600" },
  filterRow: { flexDirection: "row", gap: 8, paddingVertical: 4, marginBottom: 6 },
  filterPill: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" },
  filterPillActive: { borderColor: "#0ABAB5", backgroundColor: "#EFFFFE" },
  filterPillText: { fontSize: 12, color: "#1F2937", fontWeight: "600" },
  loginHintBox: {
    borderWidth: 1,
    borderColor: "#CFF4F1",
    backgroundColor: "#F3FFFE",
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  loginHintTitle: { fontSize: 13, fontWeight: "700", color: "#0B8A84", marginBottom: 2 },
  loginHintLine: { fontSize: 12, color: "#1F2937" },
  loginHintSub: { fontSize: 12, color: "#6B7280" },
  loginHintPwd: { marginTop: 6, fontSize: 12, color: "#0F766E", fontWeight: "700" },
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
  previewTitle: { fontSize: 12, color: "#6B7280", fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  previewPhone: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    minHeight: 260,
  },
  previewPage: { padding: 12, gap: 8 },
  previewHeading: { fontSize: 20, color: "#111827", fontWeight: "700" },
  previewHeroCard: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", padding: 10, backgroundColor: "#fff" },
  previewHeroImage: { width: "100%", height: 86, borderRadius: 8, marginBottom: 8 },
  previewHeroImageTall: { width: "100%", height: 110, borderRadius: 8, marginBottom: 8 },
  previewBannerImage: { width: "100%", height: 72, borderRadius: 10, marginBottom: 2 },
  previewHeroTitle: { fontSize: 14, color: "#1F2937", fontWeight: "700" },
  previewMeta: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  previewPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  previewPill: { borderRadius: 999, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#fff" },
  previewPillText: { fontSize: 11, color: "#1F2937", fontWeight: "600" },
  previewSearchInput: { borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#fff" },
  previewSearchText: { color: "#9CA3AF", fontSize: 14 },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  previewGridCard: { width: "48%", borderRadius: 10, padding: 10, minHeight: 58, justifyContent: "flex-end", overflow: "hidden" },
  previewGridImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  previewGridOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.15)" },
  previewGridText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  previewPriceBlock: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", padding: 10, backgroundColor: "#fff" },
  previewPriceNow: { fontSize: 20, color: "#111827", fontWeight: "700" },
  previewSubHeading: { fontSize: 13, color: "#111827", fontWeight: "700", marginBottom: 6 },
  previewLinkText: { fontSize: 12, color: "#374151", textDecorationLine: "underline", marginBottom: 6 },
  previewCalendarBlock: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", padding: 10, backgroundColor: "#fff" },
  previewListRow: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", padding: 10 },
  previewStatsRow: { flexDirection: "row", gap: 8 },
  previewStatCard: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", paddingVertical: 10, alignItems: "center", backgroundColor: "#fff" },
  previewStatValue: { fontSize: 18, color: "#111827", fontWeight: "700" },
  previewStatLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  previewCompanionHero: { borderRadius: 10, padding: 12, backgroundColor: "#EFFFFE", borderWidth: 1, borderColor: "#B7F2EE" },
  previewCompanionName: { fontSize: 18, color: "#0B8A84", fontWeight: "700" },
  companionTabsRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  companionTab: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  companionTabActive: { borderColor: "#0ABAB5", backgroundColor: "#EFFFFE" },
  companionTabText: { fontSize: 12, color: "#1F2937", fontWeight: "600" },
  companionBadge: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  companionBadgeText: { fontSize: 15, color: "#1F2937", fontWeight: "700" },
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
  primaryDisabledMain: { opacity: 0.45 },
})
