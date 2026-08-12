import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import OtpInput from "@/components/OtpInput";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";
import * as parent from "@/services/parent";

interface Props {
  onBack: () => void;
}

// Stepped reset flow: email → OTP code → new + confirm password → done.
// The code is verified server-side before the password step opens, so a wrong
// code is caught immediately (modern OTP behaviour).
type Phase = "email" | "code" | "password" | "done";

const CODE_LENGTH = 6;
const MIN_PASSWORD = 8;

export default function ForgotPassword({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState(false);

  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textDark },
  ];

  const passwordsMatch = password.length >= MIN_PASSWORD && password === confirm;

  // ── Actions ───────────────────────────────
  const handleSend = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await parent.forgotPassword(email.trim());
      setCode("");
      setPhase("code");
    } catch {
      setError(t("auth.resetError"));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (value: string) => {
    const c = value ?? code;
    if (c.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      await parent.verifyResetCode(email.trim(), c);
      setPassword("");
      setConfirm("");
      setPhase("password");
    } catch {
      setError(t("auth.resetError"));
      setCode(""); // clear the boxes so they can retype cleanly
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResendNote(false);
    try {
      await parent.forgotPassword(email.trim());
      setCode("");
      setResendNote(true);
    } catch {
      setError(t("auth.resetError"));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!passwordsMatch || busy) return;
    setBusy(true);
    setError(null);
    try {
      await parent.resetPassword({ email: email.trim(), code, password });
      setPhase("done");
    } catch {
      // The code may have expired between verify and submit — send them back.
      setError(t("auth.resetError"));
      setCode("");
      setPhase("code");
    } finally {
      setBusy(false);
    }
  };

  // ── Phase views ───────────────────────────
  const renderEmail = () => (
    <>
      <Text style={[styles.heading, { color: theme.textDark }]}>
        {t("auth.forgotHeading")}
      </Text>
      <Text style={[styles.desc, { color: theme.textLight }]}>
        {t("auth.forgotDesc")}
      </Text>

      <Text style={[styles.label, { color: theme.textDark }]}>
        {t("auth.emailLabel")}
      </Text>
      <TextInput
        style={inputStyle}
        placeholder={t("auth.emailPlaceholder")}
        placeholderTextColor={theme.textLight}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        accessibilityLabel={t("auth.emailLabel")}
      />

      {error && <Text style={[styles.error, { color: theme.textDark }]}>{error}</Text>}

      <View style={styles.spacer} />
      <Btn t={theme} onPress={handleSend} disabled={busy || !email.trim()}>
        {t("auth.forgotSendBtn")}
      </Btn>
    </>
  );

  const renderCode = () => (
    <>
      <Text style={[styles.heading, { color: theme.textDark }]}>
        {t("auth.resetHeading")}
      </Text>
      <Text style={[styles.desc, { color: theme.textLight }]}>
        {t("auth.otpDesc", { email: email.trim() })}
      </Text>

      <OtpInput
        value={code}
        onChange={(v) => {
          setCode(v);
          if (error) setError(null);
          if (resendNote) setResendNote(false);
        }}
        onComplete={handleVerify}
        length={CODE_LENGTH}
        t={theme}
        autoFocus
        error={!!error}
        accessibilityLabel={t("auth.codeLabel")}
      />

      {error && <Text style={[styles.error, { color: theme.textDark }]}>{error}</Text>}
      {resendNote && !error && (
        <Text style={[styles.note, { color: theme.primaryDeep }]}>
          {t("auth.resendConfirm")}
        </Text>
      )}

      <Pressable
        onPress={handleResend}
        disabled={busy}
        accessibilityRole="button"
        hitSlop={12}
        style={styles.resend}
      >
        <Text style={[styles.resendText, { color: theme.primaryDeep }]}>
          {t("auth.resendCode")}
        </Text>
      </Pressable>

      <View style={styles.spacer} />
      <Btn
        t={theme}
        onPress={() => handleVerify(code)}
        disabled={busy || code.length !== CODE_LENGTH}
      >
        {t("auth.verifyBtn")}
      </Btn>
    </>
  );

  const renderPassword = () => (
    <>
      <Text style={[styles.heading, { color: theme.textDark }]}>
        {t("auth.newPasswordHeading")}
      </Text>
      <Text style={[styles.desc, { color: theme.textLight }]}>
        {t("auth.newPasswordDesc")}
      </Text>

      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.textDark }]}>
          {t("auth.newPasswordLabel")}
        </Text>
        <Pressable
          onPress={() => setShowPw((s) => !s)}
          accessibilityRole="button"
          accessibilityLabel={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
          hitSlop={12}
        >
          <Text style={[styles.toggle, { color: theme.primaryDeep }]}>
            {showPw ? t("auth.hidePassword") : t("auth.showPassword")}
          </Text>
        </Pressable>
      </View>
      <TextInput
        style={inputStyle}
        placeholder={t("auth.newPasswordPlaceholder")}
        placeholderTextColor={theme.textLight}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPw}
        autoCapitalize="none"
        accessibilityLabel={t("auth.newPasswordLabel")}
      />

      <Text style={[styles.label, styles.labelSpaced, { color: theme.textDark }]}>
        {t("auth.confirmPasswordLabel")}
      </Text>
      <TextInput
        style={inputStyle}
        placeholder={t("auth.confirmPasswordPlaceholder")}
        placeholderTextColor={theme.textLight}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry={!showPw}
        autoCapitalize="none"
        accessibilityLabel={t("auth.confirmPasswordLabel")}
      />

      {confirm.length > 0 && !passwordsMatch && (
        <Text style={[styles.note, { color: theme.textLight }]}>
          {t("auth.passwordMismatch")}
        </Text>
      )}
      {error && <Text style={[styles.error, { color: theme.textDark }]}>{error}</Text>}

      <View style={styles.spacer} />
      <Btn t={theme} onPress={handleReset} disabled={busy || !passwordsMatch}>
        {t("auth.resetBtn")}
      </Btn>
    </>
  );

  const renderDone = () => (
    <>
      <Text style={[styles.heading, { color: theme.textDark }]}>
        {t("auth.resetSuccessTitle")}
      </Text>
      <Text style={[styles.desc, { color: theme.textLight }]}>
        {t("auth.resetSuccessDesc")}
      </Text>
      <View style={styles.spacer} />
      <Btn t={theme} onPress={onBack}>
        {t("auth.backToLogin")}
      </Btn>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("auth.forgotTitle")} t={theme} onBack={onBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {phase === "email"
            ? renderEmail()
            : phase === "code"
              ? renderCode()
              : phase === "password"
                ? renderPassword()
                : renderDone()}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  labelSpaced: { marginTop: 16 },
  toggle: {
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  note: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 12,
  },
  error: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 14,
  },
  resend: {
    alignSelf: "flex-start",
    marginTop: 18,
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "700",
  },
  spacer: { flex: 1, minHeight: 24 },
});
