import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect, Path } from "react-native-svg";
import Card from "@/components/Card";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { useStoryStore } from "@/store/storyStore";
import {
  getThemeById,
  DIFFICULTY_LABELS,
  DIFFICULTY_LEVELS,
} from "@calm-stories/shared";
import type { Story, DifficultyLevel } from "@calm-stories/shared";

// Gradient tints per difficulty level
const TINTS: Record<string, [string, string]> = {
  beginner: ["#FFE8C7", "#FFC98A"],
  medium: ["#D8EFFF", "#A8C5E8"],
  advanced: ["#EADDFF", "#C9B8F0"],
};

const DECOR_COLORS: Record<string, string> = {
  beginner: "#FFB347",
  medium: "#7FA8D8",
  advanced: "#9982D4",
};

interface Props {
  onStory: (storyId: string) => void;
  onPaywall: (storyId: string) => void;
}

export default function StoryList({ onStory, onPaywall }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const { stories, isLoading, fetchStories } = useStoryStore();

  useEffect(() => {
    fetchStories();
  }, []);

  // Group stories into sections by difficulty level
  const sections = useMemo(() => {
    const groups: Record<string, Story[]> = {};
    for (const level of DIFFICULTY_LEVELS) {
      groups[level] = [];
    }
    for (const s of stories) {
      if (groups[s.level]) groups[s.level].push(s);
    }
    return DIFFICULTY_LEVELS.filter((lvl) => groups[lvl].length > 0).map(
      (lvl) => ({
        level: lvl as DifficultyLevel,
        title: DIFFICULTY_LABELS[lvl],
        data: groups[lvl],
      })
    );
  }, [stories]);

  const handlePress = (s: Story) => {
    if (s.is_premium) {
      onPaywall(s.id);
    } else {
      onStory(s.id);
    }
  };

  if (isLoading && stories.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Pick the first non-premium story as the featured/continue card
  const featured = stories.find((s) => !s.is_premium);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: theme.textLight }]}>
          {t("storyList.todayLabel")}
        </Text>
        <Text style={[styles.headerTitle, { color: theme.textDark }]}>
          {t("storyList.heading")}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          featured ? (
            <FeaturedCard story={featured} theme={theme} t={t} onPress={() => onStory(featured.id)} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textLight }]}>
              {t("storyList.emptyText")}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const count = section.data.length;
          return (
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.levelDot,
                  { backgroundColor: DECOR_COLORS[section.level] || theme.primary },
                ]}
              />
              <Text style={[styles.sectionTitle, { color: theme.textLight }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionCount, { color: theme.textLight }]}>
                {count === 1
                  ? t("storyList.storyCount", { count })
                  : t("storyList.storyCountPlural", { count })}
              </Text>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <StoryRow story={item} theme={theme} t={t} onPress={() => handlePress(item)} />
        )}
      />
    </View>
  );
}

// ── Featured / Continue card ─────────────────

function FeaturedCard({
  story,
  theme,
  t,
  onPress,
}: {
  story: Story;
  theme: ReturnType<typeof getThemeById>;
  t: (key: string, options?: Record<string, any>) => string;
  onPress: () => void;
}) {
  const tint = TINTS[story.level] || TINTS.beginner;
  const decor = DECOR_COLORS[story.level] || "#FFB347";

  return (
    <Card t={theme} style={styles.featuredCard} onPress={onPress}>
      <View style={styles.featuredImage}>
        <LinearGradient
          colors={tint}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[styles.decorCircle, { backgroundColor: decor, opacity: 0.55 }]}
        />
        <View style={styles.continuePill}>
          <Text style={styles.continueText}>
            {t("storyList.continueLabel", { current: 2, total: story.page_count })}
          </Text>
        </View>
      </View>
      <View style={styles.featuredBody}>
        <Text style={[styles.featuredTitle, { color: theme.textDark }]}>
          {story.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: theme.textLight }]}>
            {DIFFICULTY_LABELS[story.level]}
          </Text>
          <Text style={[styles.metaDot, { color: theme.textLight }]}>·</Text>
          <Text style={[styles.metaText, { color: theme.textLight }]}>
            {t("storyList.minRead", { min: Math.max(2, Math.ceil(story.page_count * 0.8)) })}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.primarySoft }]}>
          <View
            style={[styles.progressFill, { backgroundColor: theme.primary, width: "40%" }]}
          />
        </View>
      </View>
    </Card>
  );
}

// ── Story row card ───────────────────────────

function StoryRow({
  story,
  theme,
  t,
  onPress,
}: {
  story: Story;
  theme: ReturnType<typeof getThemeById>;
  t: (key: string, options?: Record<string, any>) => string;
  onPress: () => void;
}) {
  const tint = TINTS[story.level] || TINTS.beginner;
  const decor = DECOR_COLORS[story.level] || "#FFB347";

  return (
    <Card t={theme} style={styles.rowCard} onPress={onPress}>
      {/* Thumbnail */}
      <View style={styles.thumb}>
        <LinearGradient
          colors={tint}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[styles.thumbDecor, { backgroundColor: decor, opacity: 0.55 }]}
        />
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleRow}>
          {story.is_premium && (
            <Svg width={14} height={14} viewBox="0 0 14 14" style={styles.lockIcon}>
              <Rect
                x={3} y={6} width={8} height={6} rx={1}
                stroke={theme.textLight} strokeWidth={1.5} fill="none"
              />
              <Path
                d="M5 6V4a2 2 0 014 0v2"
                stroke={theme.textLight} strokeWidth={1.5} fill="none" strokeLinecap="round"
              />
            </Svg>
          )}
          <Text style={[styles.rowTitle, { color: theme.textDark }]} numberOfLines={1}>
            {story.title}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: theme.textLight }]}>
            {DIFFICULTY_LABELS[story.level]}
          </Text>
          <Text style={[styles.metaDot, { color: theme.textLight }]}>·</Text>
          <Text style={[styles.metaText, { color: theme.textLight }]}>
            {t("storyList.pages", { count: story.page_count })}
          </Text>
          <Text style={[styles.metaDot, { color: theme.textLight }]}>·</Text>
          <Text style={[styles.metaText, { color: theme.textLight }]}>
            {t("storyList.minRead", { min: Math.max(2, Math.ceil(story.page_count * 0.8)) })}
          </Text>
        </View>
        {story.is_premium && (
          <View style={[styles.premiumBadge, { backgroundColor: theme.secondarySoft }]}>
            <Text style={[styles.premiumText, { color: theme.secondaryDeep }]}>
              {t("storyList.premium")}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Svg width={10} height={16} viewBox="0 0 10 16">
        <Path
          d="M2 2l6 6-6 6"
          stroke={theme.textLight} strokeWidth={2} fill="none"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </Svg>
    </Card>
  );
}

// ── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 2,
  },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 12,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Featured card
  featuredCard: { marginBottom: 8, overflow: "hidden" },
  featuredImage: {
    height: 160,
    position: "relative",
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    top: 22,
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  continuePill: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  continueText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7A4F1A",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  featuredBody: { padding: 14, paddingHorizontal: 16, paddingBottom: 16 },
  featuredTitle: { fontSize: 19, fontWeight: "800", letterSpacing: -0.2 },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 4, alignItems: "center" },
  metaText: { fontSize: 13, fontWeight: "600" },
  metaDot: { fontSize: 13, fontWeight: "600" },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  // Row card
  rowCard: {
    marginBottom: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  thumbDecor: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  lockIcon: { flexShrink: 0 },
  rowTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.2, flexShrink: 1 },
  premiumBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // Empty
  empty: { paddingVertical: 48, alignItems: "center" },
  emptyText: { fontSize: 15, fontWeight: "500" },
});
