import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import Card from "@/components/Card";
import Btn from "@/components/Btn";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";
import type { AppTheme } from "@calm-stories/shared";

// ── Types ────────────────────────────────────────
interface DashboardData {
  week: number[];
  days: string[];
  todayIdx: number;
  streak: number;
  storiesRead: number;
  calmMinutes: number;
  weeklyDelta: number;
  favorite: {
    title: string;
    opened: number;
    finished: number;
    tint: [string, string];
  };
  plan: string;
}

interface Props {
  onBack: () => void;
  onClose: () => void;
  onPaywall: () => void;
  subscribed?: boolean;
  data?: DashboardData;
}

// ── Demo data (replace with real analytics later) ──
const DEMO_DATA: DashboardData = {
  week: [4, 8, 0, 12, 6, 10, 7],
  days: ["M", "T", "W", "T", "F", "S", "S"],
  todayIdx: 6,
  streak: 4,
  storiesRead: 7,
  calmMinutes: 47,
  weeklyDelta: 12,
  favorite: {
    title: "The Happy Morning",
    opened: 8,
    finished: 5,
    tint: ["#FFE8C7", "#FFC98A"],
  },
  plan: "Premium · $2.99/mo",
};

export default function ParentDashboardScreen({
  onBack,
  onClose,
  onPaywall,
  subscribed = false,
  data,
}: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const d = data || DEMO_DATA;

  const maxMins = Math.max(...d.week);
  const stats = [
    {
      label: t("parentDashboard.dayStreak"),
      value: String(d.streak),
      sub: t("parentDashboard.daysInRow"),
    },
    {
      label: t("parentDashboard.storiesRead"),
      value: String(d.storiesRead),
      sub: t("parentDashboard.thisWeek"),
    },
    {
      label: t("parentDashboard.calmTime"),
      value: String(d.calmMinutes),
      sub: t("parentDashboard.minutes"),
    },
  ];

  // ── Locked teaser ───────────────────────────────
  if (!subscribed) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScreenHeader
          title={t("parentDashboard.headerTitle")}
          t={theme}
          onBack={onBack}
          onClose={onClose}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.hello, { color: theme.textDark }]}>
            {t("parentDashboard.hello")}
          </Text>
          <Text style={[styles.lockedDesc, { color: theme.textLight }]}>
            {t("parentDashboard.lockedDesc")}
          </Text>

          {/* Blurred preview */}
          <View style={styles.blurWrapper}>
            <View style={styles.blurredContent} pointerEvents="none">
              <Card t={theme} style={styles.chartCard}>
                <Text style={[styles.sectionLabel, { color: theme.textLight }]}>
                  {t("parentDashboard.thisWeek")}
                </Text>
                <BarChart week={d.week} days={d.days} todayIdx={d.todayIdx} maxMins={maxMins} t={theme} />
              </Card>
              <View style={styles.statsRow}>
                {stats.map((s) => (
                  <StatCard key={s.label} t={theme} {...s} />
                ))}
              </View>
            </View>

            {/* Lock overlay */}
            <View style={[styles.lockOverlay, { backgroundColor: theme.bg + "E0" }]}>
              <View style={[styles.lockIcon, { backgroundColor: theme.surface, shadowColor: theme.textDark }]}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Rect x={4} y={8} width={12} height={9} rx={2} stroke={theme.textDark} strokeWidth={2} />
                  <Path d="M7 8V5a3 3 0 016 0v3" stroke={theme.textDark} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={[styles.lockText, { color: theme.textDark }]}>
                {t("parentDashboard.lockedTitle")}
              </Text>
            </View>
          </View>

          <Btn t={theme} onPress={onPaywall}>
            {t("parentDashboard.seePremium")}
          </Btn>
          <View style={styles.btnGap} />
          <Btn t={theme} variant="ghost" onPress={onBack}>
            {t("parentDashboard.backToSettings")}
          </Btn>

          <View style={styles.spacer} />
          <Text style={[styles.footerNote, { color: theme.textLight }]}>
            {t("parentDashboard.privacyNote")}
          </Text>
        </ScrollView>
      </View>
    );
  }

  // ── Unlocked dashboard ──────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title={t("parentDashboard.headerTitle")}
        t={theme}
        onBack={onBack}
        onClose={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.hello, { color: theme.textDark }]}>
          {t("parentDashboard.hello")}
        </Text>
        <Text style={[styles.subHello, { color: theme.textLight }]}>
          {t("parentDashboard.subHello")}
        </Text>

        {/* Reading time chart */}
        <Card t={theme} style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.sectionLabel, { color: theme.textLight }]}>
                {t("parentDashboard.readingTime")}
              </Text>
              <Text style={styles.chartValue}>
                <Text style={[styles.chartNumber, { color: theme.textDark }]}>
                  {d.calmMinutes}{" "}
                </Text>
                <Text style={[styles.chartUnit, { color: theme.textLight }]}>
                  {t("parentDashboard.minThisWeek")}
                </Text>
              </Text>
            </View>
            {d.weeklyDelta > 0 && (
              <View style={[styles.deltaBadge, { backgroundColor: theme.primarySoft }]}>
                <Svg width={10} height={10} viewBox="0 0 10 10">
                  <Path
                    d="M2 6l3-3 3 3"
                    stroke={theme.primaryDeep}
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={[styles.deltaText, { color: theme.primaryDeep }]}>
                  +{d.weeklyDelta} %
                </Text>
              </View>
            )}
          </View>
          <BarChart week={d.week} days={d.days} todayIdx={d.todayIdx} maxMins={maxMins} t={theme} />
        </Card>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <StatCard key={s.label} t={theme} {...s} />
          ))}
        </View>

        {/* Favorite story */}
        <Text style={[styles.sectionHeader, { color: theme.textLight }]}>
          {t("parentDashboard.favoriteStory")}
        </Text>
        <Card t={theme} style={styles.favoriteCard}>
          <View style={[styles.favThumb, { backgroundColor: d.favorite.tint[0] }]}>
            <View style={[styles.favCircle, { backgroundColor: d.favorite.tint[1] }]} />
          </View>
          <View style={styles.favInfo}>
            <Text style={[styles.favTitle, { color: theme.textDark }]} numberOfLines={1}>
              {d.favorite.title}
            </Text>
            <Text style={[styles.favSub, { color: theme.textLight }]}>
              {t("parentDashboard.opened", { count: d.favorite.opened })} · {t("parentDashboard.finished", { count: d.favorite.finished })}
            </Text>
          </View>
        </Card>

        {/* Account section */}
        <Text style={[styles.sectionHeader, { color: theme.textLight }]}>
          {t("parentDashboard.account")}
        </Text>
        <Card t={theme} style={styles.accountCard}>
          <DashRow
            t={theme}
            label={t("parentDashboard.subscription")}
            detail={d.plan}
          />
          <DashRow
            t={theme}
            label={t("parentDashboard.manageAppStore")}
            external
          />
          <DashRow
            t={theme}
            label={t("parentDashboard.restorePurchases")}
          />
          <DashRow
            t={theme}
            label={t("parentDashboard.contactSupport")}
            last
          />
        </Card>

        <Btn t={theme} variant="secondary" onPress={onBack}>
          {t("parentDashboard.done")}
        </Btn>

        <Text style={[styles.footerNote, { color: theme.textLight }]}>
          {t("parentDashboard.privacyNote")}
        </Text>
      </ScrollView>
    </View>
  );
}

// ── BarChart ─────────────────────────────────────
function BarChart({
  week,
  days,
  todayIdx,
  maxMins,
  t,
}: {
  week: number[];
  days: string[];
  todayIdx: number;
  maxMins: number;
  t: AppTheme;
}) {
  return (
    <View style={styles.barRow}>
      {week.map((m, i) => {
        const h = maxMins > 0 ? Math.max(6, (m / maxMins) * 80) : 6;
        const isToday = i === todayIdx;
        const hasData = m > 0;

        let barBg = t.border;
        if (isToday) barBg = t.primary;
        else if (hasData) barBg = t.primarySoft;

        return (
          <View key={i} style={styles.barCol}>
            {hasData && (
              <Text style={[styles.barLabel, { color: t.textLight }]}>{m}m</Text>
            )}
            <View
              style={[
                styles.bar,
                {
                  height: h,
                  backgroundColor: barBg,
                  shadowColor: isToday ? t.primaryShade : "transparent",
                  shadowOffset: { width: 0, height: isToday ? 2 : 0 },
                  shadowOpacity: isToday ? 0.4 : 0,
                  shadowRadius: 0,
                  elevation: isToday ? 2 : 0,
                },
              ]}
            />
            <Text
              style={[
                styles.dayLabel,
                { color: isToday ? t.textDark : t.textLight },
              ]}
            >
              {days[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── StatCard ─────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  t,
}: {
  label: string;
  value: string;
  sub: string;
  t: AppTheme;
}) {
  return (
    <Card t={t} style={styles.statCard}>
      <Text style={[styles.statLabel, { color: t.textLight }]}>{label}</Text>
      <Text style={[styles.statValue, { color: t.textDark }]}>{value}</Text>
      <Text style={[styles.statSub, { color: t.textLight }]}>{sub}</Text>
    </Card>
  );
}

// ── DashRow ──────────────────────────────────────
function DashRow({
  label,
  detail,
  external,
  last,
  t,
}: {
  label: string;
  detail?: string;
  external?: boolean;
  last?: boolean;
  t: AppTheme;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.dashRow,
        !last && { borderBottomWidth: 1, borderBottomColor: t.border },
      ]}
    >
      <Text style={[styles.dashRowLabel, { color: t.textDark }]}>{label}</Text>
      <View style={styles.dashRowRight}>
        {detail ? (
          <Text style={[styles.dashRowDetail, { color: t.textLight }]}>
            {detail}
          </Text>
        ) : null}
        {external ? (
          <Svg width={12} height={12} viewBox="0 0 12 12">
            <Path
              d="M3 9l6-6M5 3h4v4"
              stroke={t.textLight}
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <Svg width={12} height={12} viewBox="0 0 14 14">
            <Path
              d="M5 2l5 5-5 5"
              stroke={t.textLight}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  hello: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subHello: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 20,
  },
  lockedDesc: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    marginBottom: 20,
  },

  // Chart card
  chartCard: {
    padding: 18,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  chartValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  chartNumber: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  chartUnit: {
    fontSize: 14,
    fontWeight: "600",
  },
  deltaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Bar chart
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
    height: 100,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  // Section headers
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 10,
  },

  // Favorite story
  favoriteCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 14,
    marginBottom: 16,
  },
  favThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: "hidden",
  },
  favCircle: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.6,
  },
  favInfo: {
    flex: 1,
  },
  favTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  favSub: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },

  // Account
  accountCard: {
    paddingVertical: 4,
    marginBottom: 16,
  },
  dashRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 10,
  },
  dashRowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  dashRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dashRowDetail: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Locked overlay
  blurWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  blurredContent: {
    opacity: 0.35,
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  lockText: {
    fontSize: 16,
    fontWeight: "800",
  },

  // Common
  btnGap: { height: 8 },
  spacer: { height: 24 },
  footerNote: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 20,
  },
});
