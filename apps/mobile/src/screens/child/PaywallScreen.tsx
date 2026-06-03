import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import Card from "@/components/Card";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/i18n";
import { getThemeById, SUBSCRIPTION_PRICE } from "@calm-stories/shared";

interface Props {
  onStartTrial: () => void;
  onLogin: () => void;
  onClose: () => void;
}

export default function PaywallScreen({ onStartTrial, onLogin, onClose }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const BENEFITS = [
    { icon: "\uD83D\uDCDA", label: t("paywall.benefitStoriesLabel"), desc: t("paywall.benefitStoriesDesc") },
    { icon: "\uD83D\uDD0A", label: t("paywall.benefitAudioLabel"), desc: t("paywall.benefitAudioDesc") },
    { icon: "\uD83C\uDFA8", label: t("paywall.benefitThemesLabel"), desc: t("paywall.benefitThemesDesc") },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("paywall.headerTitle")} t={theme} onClose={onClose} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <View style={[styles.hero, { backgroundColor: theme.secondarySoft }]}>
          <View
            style={[styles.heroIcon, { backgroundColor: theme.surface, shadowColor: theme.textDark }]}
          >
            <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <Rect x={5} y={9} width={12} height={9} rx={2} stroke={theme.textDark} strokeWidth={2} />
              <Path
                d="M8 9V6a3 3 0 016 0v3"
                stroke={theme.textDark}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text style={[styles.heroTitle, { color: theme.textDark }]}>
            {t("paywall.heroTitle")}
          </Text>
          <Text style={[styles.heroSub, { color: theme.textDark }]}>
            {t("paywall.heroSub")}
          </Text>
        </View>

        {/* Benefits */}
        <Card t={theme} style={styles.benefitsCard}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <View style={styles.benefitText}>
                <Text style={[styles.benefitLabel, { color: theme.textDark }]}>
                  {b.label}
                </Text>
                <Text style={[styles.benefitDesc, { color: theme.textLight }]}>
                  {b.desc}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Pricing */}
        <View style={styles.pricing}>
          <Text style={[styles.pricingLabel, { color: theme.textLight }]}>
            {t("paywall.pricingThen")}
          </Text>
          <Text style={[styles.pricingAmount, { color: theme.textDark }]}>
            {t("paywall.pricingAmount", { price: SUBSCRIPTION_PRICE.toFixed(2) })}
          </Text>
          <Text style={[styles.pricingNote, { color: theme.textLight }]}>
            {t("paywall.pricingNote")}
          </Text>
        </View>

        <View style={styles.spacer} />

        {user ? (
          <Btn t={theme} onPress={onStartTrial}>
            {t("paywall.startTrial")}
          </Btn>
        ) : (
          <Btn t={theme} onPress={onLogin}>
            {t("paywall.loginToContinue")}
          </Btn>
        )}
        <View style={styles.gap} />
        <Btn t={theme} variant="ghost" onPress={onClose}>
          {t("paywall.maybeLater")}
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
  hero: {
    borderRadius: 20,
    padding: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  heroSub: { fontSize: 14, opacity: 0.7, fontWeight: "500", marginTop: 6 },
  benefitsCard: { padding: 16, marginBottom: 16 },
  benefitRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  benefitIcon: { fontSize: 22, lineHeight: 28, marginTop: 2 },
  benefitText: { flex: 1 },
  benefitLabel: { fontSize: 15, fontWeight: "800" },
  benefitDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  pricing: { alignItems: "center", marginBottom: 16 },
  pricingLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  pricingAmount: { fontSize: 32, fontWeight: "800", letterSpacing: -0.6, marginTop: 4 },
  pricingNote: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  spacer: { flex: 1, minHeight: 16 },
  gap: { height: 8 },
});
