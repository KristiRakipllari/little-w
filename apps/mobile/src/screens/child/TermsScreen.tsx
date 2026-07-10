import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onBack: () => void;
}

export default function TermsScreen({ onBack }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const SECTIONS = [
    { title: t("terms.agreementTitle"), body: t("terms.agreementBody") },
    { title: t("terms.licenseTitle"), body: t("terms.licenseBody") },
    { title: t("terms.subscriptionTitle"), body: t("terms.subscriptionBody") },
    { title: t("terms.contentTitle"), body: t("terms.contentBody") },
    { title: t("terms.safeTitle"), body: t("terms.safeBody") },
    { title: t("terms.changesTitle"), body: t("terms.changesBody") },
    { title: t("terms.contactTitle"), body: t("terms.contactBody") },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("terms.headerTitle")} t={theme} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.date, { color: theme.textLight }]}>
          {t("terms.lastUpdated")}
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>
              {s.title}
            </Text>
            <Text style={[styles.sectionBody, { color: theme.textDark }]}>
              {s.body}
            </Text>
          </View>
        ))}

        <Btn t={theme} onPress={onBack}>
          {t("terms.understandBtn")}
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
  },
  date: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 23,
    opacity: 0.85,
  },
});
