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
import { useAuthStore } from "@/store/authStore";
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
  const [password, setPassword] = useState("");
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    clearError();
    if (tab === "login") {
      await login({ email: email.trim(), password });
    } else {
      await register({ email: email.trim(), password });
    }
    // If login/register succeeded (no error thrown, user is set)
    const { user } = useAuthStore.getState();
    if (user) {
      onSuccess();
    }
  };

  const switchTab = (newTab: "login" | "register") => {
    setTab(newTab);
    clearError();
  };

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
            disabled={isLoading || !email.trim() || !password.trim()}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={[
              styles.submitBtn,
              { backgroundColor: theme.primary },
              (isLoading || !email.trim() || !password.trim()) && styles.submitDisabled,
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
