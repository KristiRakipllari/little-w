import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import Card from "@/components/Card";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";
import type { AppTheme } from "@calm-stories/shared";

interface Props {
  onConfirm: () => void;
  onBack: () => void;
}

// Square checkbox row — checked state fills with the primary colour.
function CheckBox({
  checked,
  onToggle,
  label,
  theme,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  theme: AppTheme;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkRow}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.primary : theme.border,
            backgroundColor: checked ? theme.primary : "transparent",
          },
        ]}
      >
        {checked && (
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Path
              d="M2 7l3 3 7-7"
              stroke={theme.onPrimary}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        )}
      </View>
      <Text style={[styles.checkLabel, { color: theme.textDark }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ConsentGate({ onConfirm, onBack }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const acceptConsent = useAppStore((s) => s.acceptConsent);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const [agreedDocs, setAgreedDocs] = useState(false);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const canContinue = agreedDocs && guardianConfirmed;

  const handleConfirm = () => {
    if (!canContinue) return;
    acceptConsent(guardianConfirmed);
    onConfirm();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("consent.headerTitle")} t={theme} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: theme.textDark }]}>
          {t("consent.heading")}
        </Text>
        <Text style={[styles.desc, { color: theme.textLight }]}>
          {t("consent.desc")}
        </Text>

        <Card t={theme} style={styles.card}>
          <CheckBox
            checked={agreedDocs}
            onToggle={() => setAgreedDocs((v) => !v)}
            label={t("consent.agreeDocs")}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <CheckBox
            checked={guardianConfirmed}
            onToggle={() => setGuardianConfirmed((v) => !v)}
            label={t("consent.confirmGuardian")}
            theme={theme}
          />
        </Card>

        {/* Advisory panel — informational, not a checkbox */}
        <View style={[styles.advisory, { backgroundColor: theme.secondarySoft }]}>
          <View style={styles.advisoryHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 3L2 20h20L12 3z"
                stroke={theme.secondaryDeep}
                strokeWidth={2}
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M12 10v4"
                stroke={theme.secondaryDeep}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Path
                d="M12 17.5v.01"
                stroke={theme.secondaryDeep}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.advisoryTitle, { color: theme.secondaryDeep }]}>
              {t("consent.recommendationTitle")}
            </Text>
          </View>
          <Text style={[styles.advisoryBody, { color: theme.textDark }]}>
            {t("consent.recommendationBody")}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
        <Btn t={theme} onPress={handleConfirm} disabled={!canContinue}>
          {t("consent.confirmBtn")}
        </Btn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  card: {
    padding: 6,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 14,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginHorizontal: -14,
  },
  advisory: {
    borderRadius: 14,
    padding: 16,
  },
  advisoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  advisoryTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  advisoryBody: {
    fontSize: 14,
    lineHeight: 21,
  },
});
