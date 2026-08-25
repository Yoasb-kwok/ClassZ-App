import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import Feather from "@expo/vector-icons/Feather"
import { SvgXml } from "react-native-svg"
import { LOGIN_SVGS } from "./login-svgs"
import { REGISTER_SVGS } from "./register-svgs"

const REGISTER_HEADER_BG = require("../assets/figma/register/header-bg.png")

function AuthBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={styles.backCircle}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Feather name="chevron-left" size={22} color="#292929" />
    </Pressable>
  )
}

export type AuthRole = "user" | "coach" | "centre"
export type RegisterAccountType = "parent" | "coach" | "centre"

export const AUTH_ROLES: AuthRole[] = ["user", "coach", "centre"]

export const AUTH_ROLE_LABELS: Record<AuthRole, string> = {
  user: "User",
  coach: "Coach",
  centre: "Centre",
}

const REGISTER_OPTIONS: {
  id: RegisterAccountType
  title: string
  desc: string
  bg: string
  border: string
}[] = [
  {
    id: "parent",
    title: "Parent",
    desc: "For individuals seeking coaching in interest-based classes",
    bg: "#FEE0FF",
    border: "#FDB8FF",
  },
  {
    id: "coach",
    title: "Coach",
    desc: "For individuals aiming to provide flexible student coaching",
    bg: "#ECF9EC",
    border: "#CDEFCD",
  },
  {
    id: "centre",
    title: "Centre",
    desc: "For centre owners seeking expansion opportunities",
    bg: "#F3F3C7",
    border: "#ECECA7",
  },
]

function RoleToggle({
  value,
  onChange,
}: {
  value: AuthRole
  onChange: (role: AuthRole) => void
}) {
  return (
    <View style={styles.roleToggle}>
      {AUTH_ROLES.map((role) => {
        const active = value === role
        return (
          <Pressable
            key={role}
            style={[styles.roleToggleItem, active ? styles.roleToggleItemActive : null]}
            onPress={() => onChange(role)}
          >
            <Text style={[styles.roleToggleText, active ? styles.roleToggleTextActive : null]}>
              {AUTH_ROLE_LABELS[role]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleSecure,
  showSecureToggle,
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  secureTextEntry?: boolean
  onToggleSecure?: () => void
  showSecureToggle?: boolean
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}
        <Text style={styles.fieldRequired}>*</Text>
      </Text>
      <View style={styles.fieldInputWrap}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A3A3A3"
          autoCapitalize="none"
          secureTextEntry={secureTextEntry}
          underlineColorAndroid="transparent"
        />
        {showSecureToggle ? (
          <Pressable onPress={onToggleSecure} hitSlop={8} style={styles.fieldEyeBtn}>
            <Feather name={secureTextEntry ? "eye-off" : "eye"} size={18} color="#A3A3A3" />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

export function AuthLandingScreen({
  navigation,
}: {
  navigation: any
}) {
  const [role, setRole] = useState<AuthRole>("user")

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.landingBody}>
        <View style={styles.logoBlock}>
          <SvgXml xml={LOGIN_SVGS.logoMark} width={92} height={110} />
          <SvgXml xml={LOGIN_SVGS.logoWord} width={105} height={28} />
        </View>
      </View>
      <View style={styles.landingFooter}>
        <RoleToggle value={role} onChange={setRole} />
        <View style={styles.landingButtons}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Login", { role })}
          >
            <Text style={styles.primaryBtnText}>Login</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("RegisterAccountType", { role })}
          >
            <Text style={styles.secondaryBtnText}>Register</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

export function LoginFormScreen({
  route,
  navigation,
  onSignIn,
  apiLogin,
}: {
  route: { params: { role: AuthRole } }
  navigation: any
  onSignIn: (session: any) => Promise<void>
  apiLogin: (id: string, pw: string) => Promise<any>
}) {
  const role = route.params.role
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [hidePassword, setHidePassword] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const title =
    role === "user" ? "User Login" : role === "coach" ? "Coach Login" : "Centre Login"

  async function submit() {
    setError("")
    setBusy(true)
    try {
      const session = await apiLogin(email.trim(), password)
      const userRole = session.user.role as string
      if (role === "user" && ["platform_admin", "center_admin", "coach"].includes(userRole)) {
        throw new Error("This account belongs to coach/centre portal.")
      }
      if (role === "coach" && userRole !== "coach") {
        throw new Error("This account is not a coach account.")
      }
      if (role === "centre" && !["platform_admin", "center_admin"].includes(userRole)) {
        throw new Error("This account is not a centre account.")
      }
      await onSignIn(session)
    } catch (e) {
      setError((e as Error).message || "Unable to sign in")
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.loginTopBar}>
        <AuthBackButton onPress={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.loginLogoWrap}>
          <SvgXml xml={LOGIN_SVGS.logoMark} width={92} height={110} />
        </View>
        <View style={styles.loginFormBlock}>
          <Text style={styles.loginTitle}>{title}</Text>
          <AuthField label="Email" value={email} onChangeText={setEmail} placeholder="Email Address" />
          <View style={{ gap: 12, width: "100%" }}>
            <AuthField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={hidePassword}
              showSecureToggle
              onToggleSecure={() => setHidePassword((v) => !v)}
            />
            <Pressable style={styles.forgotRow} onPress={() => navigation.navigate("ForgotPassword", { role })}>
              <Text style={styles.forgotText}>Forgot password</Text>
            </Pressable>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            style={[styles.primaryBtn, busy ? styles.btnDisabled : null]}
            disabled={busy}
            onPress={submit}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Login</Text>
            )}
          </Pressable>
          <Text style={styles.switchAuthText}>
            Didn’t have an account?{" "}
            <Text
              style={styles.switchAuthLink}
              onPress={() => navigation.navigate("RegisterAccountType", { role })}
            >
              Register
            </Text>
          </Text>
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Test login</Text>
            {role === "centre" ? (
              <Text style={styles.hintLine}>centre@classzcentre.demo</Text>
            ) : role === "coach" ? (
              <Text style={styles.hintLine}>teacher1@classzcentre.demo</Text>
            ) : (
              <Text style={styles.hintLine}>parent+91234567@classzcentre.local</Text>
            )}
            <Text style={styles.hintPwd}>Password: 111111</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export function RegisterAccountTypeScreen({
  route,
  navigation,
}: {
  route: { params?: { role?: AuthRole } }
  navigation: any
}) {
  const initial =
    route.params?.role === "coach" ? "coach" : route.params?.role === "centre" ? "centre" : "parent"
  const [selected, setSelected] = useState<RegisterAccountType>(initial)
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.registerTypeScreen, { paddingTop: insets.top }]}>
      <View style={styles.registerTypeTop}>
        <View style={styles.registerFormWave} pointerEvents="none">
          <SvgXml xml={REGISTER_SVGS.headerWave} width={612} height={324} />
        </View>
        <AuthBackButton onPress={() => navigation.goBack()} />
      </View>
      <View style={styles.registerTypeSheet}>
        <View style={styles.registerTypeHeader}>
          <Text style={styles.registerWelcome}>Welcome!</Text>
          <Text style={styles.registerWelcomeSub}>Choose the account type that best fits your role!</Text>
        </View>
        <View style={styles.registerTypeList}>
          {REGISTER_OPTIONS.map((option) => {
            const active = selected === option.id
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.registerTypeCard,
                  { backgroundColor: option.bg, borderColor: option.border },
                  active ? styles.registerTypeCardActive : null,
                ]}
                onPress={() => setSelected(option.id)}
              >
                <View style={styles.registerTypeCopy}>
                  <Text style={styles.registerTypeTitle}>{option.title}</Text>
                  <Text style={styles.registerTypeDesc}>{option.desc}</Text>
                </View>
                <View
                  style={[
                    styles.registerCheckBox,
                    { borderColor: option.border },
                    active ? styles.registerCheckBoxActive : null,
                  ]}
                >
                  {active ? <Feather name="check" size={16} color="#0ABAB5" /> : null}
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>
      <View style={[styles.registerTypeFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("RegisterForm", { accountType: selected })}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  )
}

export function RegisterFormScreen({
  route,
  navigation,
}: {
  route: { params: { accountType: RegisterAccountType } }
  navigation: any
}) {
  const accountType = route.params.accountType
  const roleLabel =
    accountType === "parent" ? "Parent" : accountType === "coach" ? "Coach" : "Centre"
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [hidePassword, setHidePassword] = useState(true)
  const [hideConfirm, setHideConfirm] = useState(true)
  const [agreed, setAgreed] = useState(false)

  const checks = useMemo(() => {
    const hasLen = password.length >= 8
    const hasNumber = /\d/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const match = password.length > 0 && password === confirm
    return { hasLen, hasNumber, hasUpper, match }
  }, [password, confirm])

  const canNext =
    email.trim().length > 0 &&
    checks.hasLen &&
    checks.hasNumber &&
    checks.hasUpper &&
    checks.match &&
    agreed

  const unmetRules = [
    !checks.hasNumber ? "Your password must contain at least 1 number" : null,
    !checks.hasUpper ? "Your password must contain at least 1 uppercase letter." : null,
  ].filter(Boolean) as string[]

  return (
    // Figma 2:13884 Registration: Account&Password
    <View style={styles.registerFormRoot}>
      <View style={[styles.registerFormTealStage, { paddingTop: insets.top }]}>
        <Image
          source={REGISTER_HEADER_BG}
          style={styles.registerFormHeaderBg}
          resizeMode="cover"
          pointerEvents="none"
        />
        <View style={styles.registerFormNav}>
          <AuthBackButton onPress={() => navigation.goBack()} />
          <View style={styles.registerFormTitleWrap}>
            <Text style={styles.registerFormTitle}>Registration</Text>
            <Text style={styles.registerFormRole}>{roleLabel}</Text>
          </View>
          <View style={styles.registerFormNavSpacer} />
        </View>

        <View style={styles.registerFormSheet} collapsable={false}>
          <ScrollView
            style={styles.registerFormScroll}
            contentContainerStyle={styles.registerFormContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.registerFormFields}>
              <AuthField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address"
              />
              <AuthField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={hidePassword}
                showSecureToggle
                onToggleSecure={() => setHidePassword((v) => !v)}
              />
              <AuthField
                label="Confirm Password"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm your password"
                secureTextEntry={hideConfirm}
                showSecureToggle
                onToggleSecure={() => setHideConfirm((v) => !v)}
              />
            </View>

            <View style={styles.registerFormRules}>
              <View style={[styles.ruleOkBox, !checks.hasLen ? styles.ruleOkBoxIdle : null]}>
                <View style={[styles.ruleDot, checks.hasLen ? styles.ruleDotOk : styles.ruleDotIdle]}>
                  {checks.hasLen ? <Feather name="check" size={10} color="#0ABAB5" /> : null}
                </View>
                <Text
                  style={[styles.ruleOkText, !checks.hasLen ? styles.ruleMuted : null]}
                  numberOfLines={1}
                >
                  Your password must be at least 8 characters long
                </Text>
              </View>

              {unmetRules.length > 0 ? (
                <View style={styles.ruleErrorBox}>
                  {unmetRules.map((line) => (
                    <View key={line} style={styles.ruleErrorRow}>
                      <View style={styles.ruleDotError}>
                        <Feather name="check" size={8} color="#E16E65" />
                      </View>
                      <Text style={styles.ruleErrorText} numberOfLines={1}>
                        {line}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {confirm.length > 0 && !checks.match ? (
              <Text style={styles.errorText}>Passwords do not match.</Text>
            ) : null}

            <Pressable style={styles.termsRow} onPress={() => setAgreed((v) => !v)}>
              <View style={[styles.termsCheck, agreed ? styles.termsCheckActive : null]}>
                {agreed ? <Feather name="check" size={12} color="#fff" /> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the Terms and Conditions of ClassZ, as detailed on the{" "}
                <Text style={styles.termsLink}>Terms and Conditions</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      <View style={[styles.registerFormFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Pressable
          style={[styles.nextBtn, canNext ? styles.primaryBtn : styles.nextBtnDisabled]}
          disabled={!canNext}
          onPress={() =>
            navigation.navigate("Login", { role: accountType === "parent" ? "user" : accountType })
          }
        >
          <Text style={[styles.nextBtnText, canNext ? styles.primaryBtnText : styles.nextBtnTextDisabled]}>
            Next
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export function ForgotPasswordScreen({
  route,
  navigation,
}: {
  route: { params: { role: AuthRole } }
  navigation: any
}) {
  const [email, setEmail] = useState("")
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.loginTopBar}>
        <AuthBackButton onPress={() => navigation.goBack()} />
      </View>
      <View style={styles.forgotWrap}>
        <Text style={styles.loginTitle}>Forgot password</Text>
        <Text style={styles.registerWelcomeSub}>
          Enter your email and we’ll send reset instructions.
        </Text>
        <AuthField label="Email" value={email} onChangeText={setEmail} placeholder="Email Address" />
        <Pressable style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Send reset link</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  landingBody: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoBlock: { alignItems: "center", gap: 12, width: 105 },
  landingFooter: { padding: 24, gap: 16 },
  roleToggle: {
    flexDirection: "row",
    backgroundColor: "#0ABAB5",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  roleToggleItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#0ABAB5",
  },
  roleToggleItemActive: { backgroundColor: "#FFFFFF" },
  roleToggleText: { fontSize: 12, fontWeight: "500", color: "#FFFFFF" },
  roleToggleTextActive: { color: "#0ABAB5" },
  landingButtons: { gap: 12 },
  primaryBtn: {
    backgroundColor: "#0ABAB5",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "500" },
  secondaryBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#D7F4F3",
  },
  secondaryBtnText: { color: "#0ABAB5", fontSize: 16, fontWeight: "500" },
  btnDisabled: { opacity: 0.55 },
  loginTopBar: { paddingHorizontal: 24, paddingTop: 8 },
  loginScroll: { flexGrow: 1, paddingBottom: 24 },
  loginLogoWrap: { flex: 1, minHeight: 140, alignItems: "center", justifyContent: "center" },
  loginFormBlock: { paddingHorizontal: 24, gap: 24, alignItems: "center" },
  loginTitle: { fontSize: 16, fontWeight: "500", color: "#525252", textAlign: "center" },
  fieldWrap: { width: "100%", gap: 4 },
  fieldLabel: { fontSize: 14, color: "#292929" },
  fieldRequired: { color: "#E16E65" },
  fieldInputWrap: {
    width: "100%",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: "#292929",
    paddingVertical: 16,
    paddingHorizontal: 0,
    margin: 0,
    backgroundColor: "transparent",
  },
  fieldEyeBtn: { paddingLeft: 12, justifyContent: "center" },
  forgotRow: { width: "100%", alignItems: "flex-end", paddingHorizontal: 4 },
  forgotText: { fontSize: 12, color: "#A3A3A3" },
  errorText: { color: "#E16E65", fontSize: 13, alignSelf: "stretch" },
  switchAuthText: { fontSize: 12, color: "#A3A3A3", textAlign: "center" },
  switchAuthLink: { color: "#0ABAB5", fontWeight: "600" },
  hintBox: {
    alignSelf: "stretch",
    backgroundColor: "#F8FFFE",
    borderWidth: 1,
    borderColor: "#D7F4F3",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  hintTitle: { fontSize: 12, fontWeight: "700", color: "#0ABAB5" },
  hintLine: { fontSize: 12, color: "#525252" },
  hintPwd: { fontSize: 12, color: "#7A7A7A", marginTop: 2 },
  registerTypeScreen: { flex: 1, backgroundColor: "#D7F4F3" },
  registerTypeTop: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 2,
    overflow: "hidden",
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  backCircleSpacer: { width: 44, height: 44 },
  registerTypeSheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 24,
    zIndex: 1,
    overflow: "hidden",
  },
  registerTypeHeader: { gap: 2 },
  registerWelcome: { fontSize: 16, fontWeight: "500", color: "#292929" },
  registerWelcomeSub: { fontSize: 12, color: "#A3A3A3" },
  registerTypeList: { gap: 12 },
  registerTypeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  registerTypeCardActive: { borderWidth: 2 },
  registerTypeCopy: { flex: 1, gap: 4 },
  registerTypeTitle: { fontSize: 14, fontWeight: "500", color: "#292929" },
  registerTypeDesc: { fontSize: 12, color: "#7A7A7A", lineHeight: 18 },
  registerCheckBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  registerCheckBoxActive: { borderColor: "#0ABAB5" },
  registerTypeFooter: { backgroundColor: "#FFFFFF", padding: 24 },
  registerFormRoot: { flex: 1, backgroundColor: "#FFFFFF" },
  registerFormTealStage: {
    flex: 1,
    backgroundColor: "#D7F4F3",
    overflow: "hidden",
  },
  registerFormHeaderBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    width: "100%",
  },
  registerFormWave: {
    position: "absolute",
    left: -180,
    top: -20,
    width: 612,
    height: 324,
    transform: [{ rotate: "180deg" }, { scaleY: -1 }],
  },
  registerFormNav: {
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  registerFormNavSpacer: { width: 40, height: 40 },
  registerFormTitleWrap: { alignItems: "center", justifyContent: "center", gap: 4 },
  registerFormTitle: { fontSize: 18, fontWeight: "600", color: "#292929", lineHeight: 22 },
  registerFormRole: { fontSize: 12, color: "#A3A3A3", lineHeight: 18, textAlign: "center" },
  registerFormSheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  registerFormScroll: { flex: 1, backgroundColor: "#FFFFFF" },
  registerFormContent: {
    padding: 24,
    gap: 24,
    flexGrow: 1,
  },
  registerFormFields: { width: "100%", gap: 20 },
  registerFormRules: { width: "100%", gap: 12 },
  ruleOkBox: {
    backgroundColor: "#D7F4F3",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  ruleOkBoxIdle: { backgroundColor: "#F5F5F5" },
  ruleOkText: { flex: 1, fontSize: 12, color: "#0ABAB5", lineHeight: 18 },
  ruleMuted: { color: "#7A7A7A" },
  ruleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleDotOk: {},
  ruleDotIdle: { borderWidth: 1, borderColor: "#CCCCCC" },
  ruleErrorBox: {
    backgroundColor: "#F9E2E0",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  ruleErrorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleDotError: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E16E65",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleErrorText: { flex: 1, fontSize: 12, color: "#E16E65", lineHeight: 18 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  termsCheck: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    marginTop: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  termsCheckActive: { backgroundColor: "#0ABAB5", borderColor: "#0ABAB5" },
  termsText: { flex: 1, fontSize: 10, color: "#7A7A7A", lineHeight: 15 },
  termsLink: { color: "#0ABAB5" },
  registerFormFooter: { padding: 24, backgroundColor: "#FFFFFF" },
  nextBtn: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  nextBtnDisabled: { backgroundColor: "#D7F4F3" },
  nextBtnText: { fontSize: 16, fontWeight: "500" },
  nextBtnTextDisabled: { color: "#0ABAB5" },
  forgotWrap: { flex: 1, padding: 24, gap: 16, justifyContent: "center" },
})
