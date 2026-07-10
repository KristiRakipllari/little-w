import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import Svg, { Rect, Path } from "react-native-svg";
import Card from "@/components/Card";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/i18n";
import { useStoryStore } from "@/store/storyStore";
import { useFavoritesStore } from "@/store/favoritesStore";
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

// A story row inside the Favourites section gets a marker so it can share the
// list with its difficulty-section twin without colliding on React keys.
type Row = Story & { __fav?: boolean };

export default function StoryList({ onStory, onPaywall }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const motion = useAppStore((s) => s.motion);
  const lastReadStoryId = useAppStore((s) => s.lastReadStoryId);
  const lastReadPage = useAppStore((s) => s.lastReadPage);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const { stories, isLoading, fetchStories } = useStoryStore();
  const { user, isSubscribed } = useAuthStore();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  useEffect(() => {
    fetchStories();
  }, []);

  // Group stories into sections by difficulty level, with a Favourites
  // section pinned on top whenever at least one story is favourited.
  const sections = useMemo(() => {
    const groups: Record<string, Story[]> = {};
    for (const level of DIFFICULTY_LEVELS) {
      groups[level] = [];
    }
    for (const s of stories) {
      if (groups[s.level]) groups[s.level].push(s);
    }
    const result: {
      level: DifficultyLevel | "favorites";
      title: string;
      data: Row[];
    }[] = DIFFICULTY_LEVELS.filter((lvl) => groups[lvl].length > 0).map(
      (lvl) => ({
        level: lvl as DifficultyLevel,
        title: DIFFICULTY_LABELS[lvl],
        data: groups[lvl],
      })
    );
    const favorites = stories
      .filter((s) => favoriteIds.includes(s.id))
      .map((s): Row => ({ ...s, __fav: true }));
    if (favorites.length > 0) {
      result.unshift({
        level: "favorites",
        title: t("storyList.favorites"),
        data: favorites,
      });
    }
    return result;
  }, [stories, favoriteIds, t]);

  const handlePress = (s: Story) => {
    if (!s.is_premium) {
      onStory(s.id);
    } else if (user && isSubscribed) {
      onStory(s.id);
    } else {
      // Not logged in OR logged in but not subscribed → Paywall
      onPaywall(s.id);
    }
  };

  if (isLoading && stories.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Featured/continue card: the most recently opened story, falling back to
  // the first non-premium story when nothing has been read yet.
  const recent = stories.find((s) => s.id === lastReadStoryId);
  const featured = recent ?? stories.find((s) => !s.is_premium);
  const featuredPage =
    featured && featured.id === lastReadStoryId
      ? Math.min(Math.max(lastReadPage, 1), featured.page_count)
      : 1;

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
        keyExtractor={(item: Row) => (item.__fav ? `fav-${item.id}` : item.id)}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          featured ? (
            <FeaturedCard
              story={featured}
              currentPage={featuredPage}
              theme={theme}
              t={t}
              onPress={() => handlePress(featured)}
              isFavorite={favoriteIds.includes(featured.id)}
              onToggleFavorite={() => toggleFavorite(featured.id)}
            />
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
          // The Favourites section fades in gently when it first appears —
          // sudden layout shifts can be startling for autistic children.
          const entering =
            section.level === "favorites" && motion !== "off"
              ? FadeIn.duration(motion === "slow" ? 400 : 200)
              : undefined;
          return (
            <Animated.View entering={entering} style={styles.sectionHeader}>
              <View
                style={[
                  styles.levelDot,
                  {
                    backgroundColor:
                      section.level === "favorites"
                        ? theme.accent
                        : DECOR_COLORS[section.level] || theme.primary,
                  },
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
            </Animated.View>
          );
        }}
        renderItem={({ item }) => (
          <Animated.View
            entering={
              item.__fav && motion !== "off"
                ? FadeIn.duration(motion === "slow" ? 400 : 200)
                : undefined
            }
          >
            <StoryRow
              story={item}
              theme={theme}
              t={t}
              onPress={() => handlePress(item)}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          </Animated.View>
        )}
      />
    </View>
  );
}

// ── Heart / favourite button ─────────────────

function HeartButton({
  active,
  onPress,
  theme,
  t,
}: {
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof getThemeById>;
  t: (key: string, options?: Record<string, any>) => string;
}) {
  const motion = useAppStore((s) => s.motion);
  const scale = useSharedValue(1);
  const beatStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // One soft heartbeat when favouriting only — unfavouriting stays quiet
    // on purpose (positive reinforcement goes in one direction).
    if (!active && motion !== "off") {
      const stiffness = motion === "slow" ? 160 : 420;
      scale.value = withSequence(
        withSpring(1.3, { damping: 16, stiffness }),
        withSpring(1, { damping: 13, stiffness: stiffness * 0.7 })
      );
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        active ? t("storyList.removeFavorite") : t("storyList.addFavorite")
      }
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={styles.heartBtn}
    >
      <Animated.View style={beatStyle}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={active ? theme.accent : "none"}
            stroke={active ? theme.accent : theme.textLight}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Featured / Continue card ─────────────────

function FeaturedCard({
  story,
  currentPage,
  theme,
  t,
  onPress,
  isFavorite,
  onToggleFavorite,
}: {
  story: Story;
  currentPage: number;
  theme: ReturnType<typeof getThemeById>;
  t: (key: string, options?: Record<string, any>) => string;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const tint = TINTS[story.level] || TINTS.beginner;
  const decor = DECOR_COLORS[story.level] || "#FFB347";
  const progress = story.page_count > 0 ? currentPage / story.page_count : 0;

  return (
    <Card t={theme} style={styles.featuredCard} onPress={onPress}>
      <View style={styles.featuredImage}>
        {story.cover_image_url ? (
          <Image
            source={{ uri: story.cover_image_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <>
            <LinearGradient
              colors={tint}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[styles.decorCircle, { backgroundColor: decor, opacity: 0.55 }]}
            />
          </>
        )}
        <View style={styles.continuePill}>
          <Text style={styles.continueText}>
            {t("storyList.continueLabel", { current: currentPage, total: story.page_count })}
          </Text>
        </View>
        <View style={styles.featuredHeart}>
          <HeartButton
            active={isFavorite}
            onPress={onToggleFavorite}
            theme={theme}
            t={t}
          />
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
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary, width: `${Math.round(progress * 100)}%` },
            ]}
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
  isFavorite,
  onToggleFavorite,
}: {
  story: Story;
  theme: ReturnType<typeof getThemeById>;
  t: (key: string, options?: Record<string, any>) => string;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const tint = TINTS[story.level] || TINTS.beginner;
  const decor = DECOR_COLORS[story.level] || "#FFB347";

  return (
    <Card t={theme} style={styles.rowCard} onPress={onPress}>
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {story.cover_image_url ? (
          <Image
            source={{ uri: story.cover_image_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <>
            <LinearGradient
              colors={tint}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[styles.thumbDecor, { backgroundColor: decor, opacity: 0.55 }]}
            />
          </>
        )}
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

      <HeartButton
        active={isFavorite}
        onPress={onToggleFavorite}
        theme={theme}
        t={t}
      />

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
  // Extra bottom padding so the last card clears the floating tab bar.
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },

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
    width: "100%",
    aspectRatio: 16 / 9,
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
  // Heart / favourite button
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  featuredHeart: {
    position: "absolute",
    top: 12,
    right: 12,
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
