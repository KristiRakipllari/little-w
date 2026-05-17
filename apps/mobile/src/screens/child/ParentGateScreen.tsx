import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import Card from "@/components/Card";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onBack: () => void;
}

export default function ParentGateScreen({ onBack }: Props) {
  const { themeId, parentEmail, setParentEmail } = useAppStore();
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail);

  const handleSend = () => {
    if (valid) setSent(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("parentGate.headerTitle")} t={theme} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.heading, { color: theme.textDark }]}>
          {t("parentGate.heading")}
        </Text>
        <Text style={[styles.desc, { color: theme.textLight }]}>
          {t("parentGate.desc")}
        </Text>

        <Text style={[styles.label, { color: theme.textDark }]}>{t("parentGate.label")}</Text>
        <TextInput
          value={parentEmail}
          onChangeText={setParentEmail}
          placeholder={t("parentGate.placeholder")}
          placeholderTextColor={theme.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t("parentGate.label")}
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: valid ? theme.primary : theme.border,
              color: theme.textDark,
            },
          ]}
        />
        <Text style={[styles.hint, { color: theme.textLight }]}>
          {t("parentGate.hint")}
        </Text>

        {sent && (
          <Card
            t={theme}
            style={{ ...styles.successCard, backgroundColor: theme.successSoft }}
          >
            <View style={styles.successRow}>
              <Svg width={18} height={18} viewBox="0 0 18 18">
                <Circle cx={9} cy={9} r={8} fill={theme.success} />
                <Path
                  d="M5 9l3 3 5-6"
                  stroke="#fff"
                  strokeWidth={2.4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.successText, { color: theme.textDark }]}>
                {t("parentGate.successText")}
              </Text>
            </View>
          </Card>
        )}

        <View style={styles.spacer} />

        <Btn t={theme} disabled={!valid} onPress={handleSend}>
          {t("parentGate.sendBtn")}
        </Btn>
        <View style={styles.gap} />
        <Btn t={theme} variant="ghost" onPress={onBack}>
          {t("common.cancel")}
        </Btn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 29,
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 2,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  successCard: {
    marginTop: 16,
    padding: 14,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  successText: {
    fontSize: 14,
    fontWeight: "700",
  },
  spacer: { flex: 1, minHeight: 24 },
  gap: { height: 8 },
});
