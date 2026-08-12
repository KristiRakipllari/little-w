import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import { useParentStore } from "@/store/parentStore";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export default function Login({ onBack, onSuccess, onForgotPassword }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [password, setPassword] = useState("");
  // Shown after registering, in place of the form.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sent" | "error">("idle");
  const {
    login,
    register,
    resendVerification,
    isLoading,
    error,
    clearError,
  } = useParentStore();
  const themeId = useAppStore((s) => s.themeId);
  const consentData = useAppStore((s) => s.consentData);
  const theme = getThemeById(themeId);
  const { t, locale } = useTranslation();

  // The device's onboarding consent, sent so the server holds an
  // account-linked record. Read here rather than inside parentStore to keep
  // the stores independent of each other.
  const consentPayload = consentData
    ? {
        version: consentData.version,
        accepted_at: consentData.acceptedAt,
        guardian_confirmed: consentData.guardianConfirmed,
      }
    : undefined;

  // Registering only: the second address must match. This is the typo guard
  // that works with no email infrastructure at all — a wrong address here is
  // what later locks a paying parent out of their own account.
  const emailsMatch =
    email.trim().toLowerCase() === confirmEmail.trim().toLowerCase();
  const showMismatch =
    tab === "register" && confirmTouched && confirmEmail.length > 0 && !emailsMatch;
  const canSubmit =
    !!email.trim() &&
    !!password.trim() &&
    (tab === "login" || (!!confirmEmail.trim() && emailsMatch));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    clearError();
    if (tab === "login") {
      await login({ email: email.trim(), password, consent: consentPayload });
      if (useParentStore.getState().user) onSuccess();
    } else {
      await register({
        email: email.trim(),
        password,
        locale,
        consent: consentPayload,
      });
      // Don't leave immediately — show the address back so a typo that made it
      // past the confirm field still has one last chance to be noticed.
      if (useParentStore.getState().user) setRegisteredEmail(email.trim());
    }
  };

  const handleResend = async () => {
    setResendState("idle");
    try {
      await resendVerification(locale);
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  const switchTab = (newTab: "login" | "register") => {
    setTab(newTab);
    setConfirmEmail("");
    setConfirmTouched(false);
    clearError();
  };

  // ── Check your email (after registering) ──
  // Continue is never blocked: the account exists and works, verification
  // only gates starting a subscription.
  if (registeredEmail) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScreenHeader title={t("auth.headerTitle")} t={theme} onBack={onBack} />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 6h16v12H4z"
                stroke={theme.primaryDeep}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <Path
                d="M4 7l8 6 8-6"
                stroke={theme.primaryDeep}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          <Text style={[styles.heading, { color: theme.textDark }]}>
            {t("auth.verifyTitle")}
          </Text>
          <Text style={[styles.subheading, { color: theme.textLight }]}>
            {t("auth.verifyDesc", { email: registeredEmail })}
          </Text>

          <TouchableOpacity
            onPress={handleResend}
            style={styles.forgotBtn}
            accessibilityRole="button"
          >
            <Text style={[styles.forgotText, { color: theme.primaryDeep }]}>
              {resendState === "sent"
                ? t("auth.verifyResendSent")
                : resendState === "error"
                ? t("auth.verifyResendError")
                : t("auth.verifyResend")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSuccess}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={[styles.submitBtn, { backgroundColor: theme.primary, marginTop: 20 }]}
          >
            <Text style={[styles.submitText, { color: theme.onPrimary }]}>
              {t("auth.verifyContinue")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title={t("auth.headerTitle")}
        t={theme}
        onBack={onBack}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                stroke={theme.primaryDeep}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Path
                d="M12 11a4 4 0 100-8 4 4 0 000 8z"
                stroke={theme.primaryDeep}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </View>

          <Text style={[styles.heading, { color: theme.textDark }]}>
            {t("auth.heading")}
          </Text>
          <Text style={[styles.subheading, { color: theme.textLight }]}>
            {t("auth.subheading")}
          </Text>

          {/* Tab toggle */}
          <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => switchTab("login")}
              style={[
                styles.tabBtn,
                tab === "login" && { backgroundColor: theme.primarySoft },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "login" }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === "login" ? theme.primaryDeep : theme.textLight },
                ]}
              >
                {t("auth.tabLogin")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => switchTab("register")}
              style={[
                styles.tabBtn,
                tab === "register" && { backgroundColor: theme.primarySoft },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "register" }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === "register" ? theme.primaryDeep : theme.textLight },
                ]}
              >
                {t("auth.tabRegister")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.secondarySoft }]}>
              <Text style={[styles.errorText, { color: theme.textDark }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Fields */}
          <View style={styles.fields}>
            <Text style={[styles.label, { color: theme.textDark }]}>
              {t("auth.emailLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.textDark,
                },
              ]}
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor={theme.textLight}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError();
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            {tab === "register" && (
              <>
                <Text style={[styles.label, { color: theme.textDark }]}>
                  {t("auth.confirmEmailLabel")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: showMismatch ? theme.accent : theme.border,
                      color: theme.textDark,
                    },
                  ]}
                  placeholder={t("auth.emailPlaceholder")}
                  placeholderTextColor={theme.textLight}
                  value={confirmEmail}
                  onChangeText={(text) => {
                    setConfirmEmail(text);
                    clearError();
                  }}
                  // Only judge the match once they've moved on — flagging a
                  // mismatch mid-typing accuses the user of an error they are
                  // still in the middle of not making.
                  onBlur={() => setConfirmTouched(true)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  // Deliberately no autoComplete: autofill would defeat the
                  // whole point of typing it a second time.
                />
                {showMismatch && (
                  <Text style={[styles.mismatchText, { color: theme.textLight }]}>
                    {t("auth.confirmEmailMismatch")}
                  </Text>
                )}
              </>
            )}

            <Text style={[styles.label, { color: theme.textDark }]}>
              {t("auth.passwordLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.textDark,
                },
              ]}
              placeholder={t("auth.passwordPlaceholder")}
              placeholderTextColor={theme.textLight}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
              }}
              secureTextEntry
              autoComplete="password"
            />

            {tab === "login" && (
              <TouchableOpacity
                onPress={onForgotPassword}
                style={styles.forgotBtn}
                accessibilityRole="button"
              >
                <Text style={[styles.forgotText, { color: theme.primaryDeep }]}>
                  {t("auth.forgotPassword")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading || !canSubmit}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={[
              styles.submitBtn,
              { backgroundColor: theme.primary },
              (isLoading || !canSubmit) && styles.submitDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={[styles.submitText, { color: theme.onPrimary }]}>
                {tab === "login" ? t("auth.loginBtn") : t("auth.registerBtn")}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.footerNote, { color: theme.textLight }]}>
            {t("auth.footerNote")}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
    alignSelf: "stretch",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "700",
  },
  errorBox: {
    alignSelf: "stretch",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  fields: {
    alignSelf: "stretch",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  mismatchText: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 6,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    alignSelf: "stretch",
    minHeight: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 17,
    fontWeight: "700",
  },
  footerNote: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
