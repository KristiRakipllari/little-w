import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import Card from "@/components/Card";
import CheckRow from "@/components/CheckRow";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onAgree: () => void;
  onBack: () => void;
  onPolicy: () => void;
}

export default function PrivacyScreen({ onAgree, onBack, onPolicy }: Props) {
  const { themeId, setAgreed } = useAppStore();
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const handleAgree = () => {
    setAgreed(true);
    onAgree();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("privacy.headerTitle")} t={theme} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: theme.textDark }]}>
          {t("privacy.heading")}
        </Text>
        <Text style={[styles.desc, { color: theme.textLight }]}>
          {t("privacy.desc")}
        </Text>

        <Card t={theme} style={styles.card}>
          <CheckRow t={theme}>{t("privacy.noAds")}</CheckRow>
          <CheckRow t={theme}>{t("privacy.noTracking")}</CheckRow>
          <CheckRow t={theme}>{t("privacy.noDataSharing")}</CheckRow>
          <CheckRow t={theme}>{t("privacy.noExternalLinks")}</CheckRow>
          <CheckRow t={theme}>{t("privacy.cachedOnDevice")}</CheckRow>
        </Card>

        <TouchableOpacity
          onPress={onPolicy}
          style={[styles.linkRow, { backgroundColor: theme.surface, shadowColor: theme.textDark }]}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.linkText, { color: theme.textDark }]}>
            {t("privacy.readPolicy")}
          </Text>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Path
              d="M5 2l5 5-5 5"
              stroke={theme.textLight}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.linkRow, { backgroundColor: theme.surface, shadowColor: theme.textDark }]}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.linkText, { color: theme.textDark }]}>
            {t("privacy.readTerms")}
          </Text>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Path
              d="M5 2l5 5-5 5"
              stroke={theme.textLight}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <Btn t={theme} onPress={handleAgree}>
          {t("privacy.agreeBtn")}
        </Btn>
      </ScrollView>
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
    flexGrow: 1,
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
    padding: 14,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 52,
    borderRadius: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
