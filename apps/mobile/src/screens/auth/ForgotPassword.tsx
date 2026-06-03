import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const handleSend = () => {
    if (email.trim()) {
      setSent(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("auth.forgotTitle")} t={theme} onBack={onBack} />

      <View style={styles.content}>
        {sent ? (
          <>
            <Text style={[styles.heading, { color: theme.textDark }]}>
              {t("auth.forgotSentTitle")}
            </Text>
            <Text style={[styles.desc, { color: theme.textLight }]}>
              {t("auth.forgotSentDesc")}
            </Text>
            <View style={styles.spacer} />
            <Btn t={theme} variant="secondary" onPress={onBack}>
              {t("auth.backToLogin")}
            </Btn>
          </>
        ) : (
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
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <View style={styles.spacer} />
            <Btn t={theme} onPress={handleSend} disabled={!email.trim()}>
              {t("auth.forgotSendBtn")}
            </Btn>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  spacer: { flex: 1, minHeight: 24 },
});
