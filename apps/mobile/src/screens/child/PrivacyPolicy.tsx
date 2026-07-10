import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onContinue: () => void;
  onBack: () => void;
}

// How close to the bottom (px) counts as "read to the end".
const SCROLL_END_THRESHOLD = 24;

export default function PrivacyPolicy({ onContinue, onBack }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const [reachedEnd, setReachedEnd] = useState(false);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);

  // Enable Continue as soon as the whole document fits without scrolling.
  // This runs whenever either measurement arrives, so it doesn't matter which
  // of onLayout / onContentSizeChange fires first (they can race).
  useEffect(() => {
    if (
      viewportH > 0 &&
      contentH > 0 &&
      contentH <= viewportH + SCROLL_END_THRESHOLD
    ) {
      setReachedEnd(true);
    }
  }, [viewportH, contentH]);

  const SECTIONS = [
    { title: t("policy.noTrackingTitle"), body: t("policy.noTrackingBody") },
    { title: t("policy.noAdsTitle"), body: t("policy.noAdsBody") },
    { title: t("policy.parentalTitle"), body: t("policy.parentalBody") },
    { title: t("policy.contactTitle"), body: t("policy.contactBody") },
  ];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - SCROLL_END_THRESHOLD
    ) {
      setReachedEnd(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("policy.headerTitle")} t={theme} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        scrollEventThrottle={64}
        onScroll={handleScroll}
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        onContentSizeChange={(_w, h) => setContentH(h)}
      >
        <Text style={[styles.date, { color: theme.textLight }]}>
          {t("policy.lastUpdated")}
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
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
        {!reachedEnd && (
          <Text style={[styles.hint, { color: theme.textLight }]}>
            {t("consent.scrollHint")}
          </Text>
        )}
        <Btn t={theme} onPress={onContinue} disabled={!reachedEnd}>
          {t("consent.continueBtn")}
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  hint: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
});
