import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import StoryComplete from "@/screens/child/StoryComplete";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { useStoryStore } from "@/store/storyStore";
import { useReadingStatsStore } from "@/store/readingStatsStore";
import { getThemeById } from "@calm-stories/shared";
import type { StoryPage } from "@calm-stories/shared";

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

// The reading text obeys the accessibility textSize setting (s/m/l).
const TEXT_SIZES: Record<"s" | "m" | "l", { fontSize: number; lineHeight: number }> = {
  s: { fontSize: 18, lineHeight: 27 },
  m: { fontSize: 22, lineHeight: 32 },
  l: { fontSize: 26, lineHeight: 38 },
};

interface Props {
  storyId: string;
  onBack: () => void;
}

export default function StoryPlayer({ storyId, onBack }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const locale = useAppStore((s) => s.locale);
  const audio = useAppStore((s) => s.audio);
  const textSize = useAppStore((s) => s.textSize);
  const motion = useAppStore((s) => s.motion);
  const lastReadStoryId = useAppStore((s) => s.lastReadStoryId);
  const lastReadPage = useAppStore((s) => s.lastReadPage);
  const setLastRead = useAppStore((s) => s.setLastRead);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const getPageText = (page: StoryPage) => {
    const key = `text_${locale}` as keyof StoryPage;
    return (page[key] as string) || page.text_en || page.text_sq;
  };
  const { currentStory, isLoading, fetchStory, clearCurrentStory } =
    useStoryStore();
  // Resume where the reader left off if this is the story they last opened.
  const [pageIdx, setPageIdx] = useState(() =>
    lastReadStoryId === storyId ? Math.max(0, lastReadPage - 1) : 0
  );
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    fetchStory(storyId);
    return () => clearCurrentStory();
  }, [storyId]);

  // ── Reading stats (on-device, shown in the parent dashboard) ──
  const recordOpen = useReadingStatsStore((s) => s.recordOpen);
  const recordFinish = useReadingStatsStore((s) => s.recordFinish);
  const addReadingTime = useReadingStatsStore((s) => s.addReadingTime);
  const openRecorded = useRef(false);
  const finishRecorded = useRef(false);

  // One "open" per visit, once the story has actually loaded
  useEffect(() => {
    if (currentStory && !openRecorded.current) {
      openRecorded.current = true;
      recordOpen(storyId, currentStory.title);
    }
  }, [currentStory, storyId]);

  // Time spent on this screen counts as calm reading time
  useEffect(() => {
    const startedAt = Date.now();
    return () => {
      addReadingTime(storyId, (Date.now() - startedAt) / 1000);
    };
  }, [storyId]);

  // Reaching the last page counts as finishing the story (once per visit)
  useEffect(() => {
    if (
      currentStory &&
      currentStory.pages.length > 0 &&
      pageIdx === currentStory.pages.length - 1 &&
      !finishRecorded.current
    ) {
      finishRecorded.current = true;
      recordFinish(storyId);
    }
  }, [pageIdx, currentStory, storyId]);

  // Clamp the resumed page in case the story now has fewer pages than saved.
  useEffect(() => {
    if (currentStory && pageIdx > currentStory.pages.length - 1) {
      setPageIdx(Math.max(0, currentStory.pages.length - 1));
    }
  }, [currentStory]);

  // Record the most recently opened story and page so the home screen can resume it.
  useEffect(() => {
    if (currentStory) {
      setLastRead(storyId, pageIdx + 1);
    }
  }, [storyId, pageIdx, currentStory]);

  if (isLoading || !currentStory) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (showComplete) {
    return (
      <StoryComplete
        storyTitle={currentStory.title}
        onReadAgain={() => {
          setPageIdx(0);
          setShowComplete(false);
        }}
        onBackToStories={onBack}
      />
    );
  }

  const pages = currentStory.pages;
  const page = pages[pageIdx];
  const tint = TINTS[currentStory.level] || TINTS.beginner;
  const decor = DECOR_COLORS[currentStory.level] || "#FFB347";
  const isFirst = pageIdx === 0;
  const isLast = pageIdx === pages.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title={currentStory.title}
        t={theme}
        onBack={onBack}
        onClose={onBack}
      />

      <View style={styles.body}>
        {/* Image area */}
        <View style={styles.imageWrap}>
          {page?.image_url ? (
            <Image
              source={{ uri: page.image_url }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="disk"
              transition={motion === "off" ? 0 : 200}
            />
          ) : (
            <LinearGradient
              colors={tint}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.image}
            >
              {/* Decorative shape */}
              <View
                style={[
                  styles.decorCircle,
                  { backgroundColor: decor, opacity: 0.55 },
                ]}
              />
            </LinearGradient>
          )}
          {/* Page pill */}
          <View style={styles.pagePill}>
            <Text style={[styles.pagePillText, { color: theme.textDark }]}>
              {t("storyPlayer.pagePill", { current: pageIdx + 1, total: pages.length })}
            </Text>
          </View>
        </View>

        {/* Story text */}
        <Text style={[styles.storyText, TEXT_SIZES[textSize], { color: theme.textDark }]}>
          {page ? getPageText(page) : ""}
        </Text>

        <View style={styles.spacer} />

        {/* Audio + dots row (dots centered on their own when audio is off) */}
        <View style={[styles.audioRow, !audio && styles.audioRowCentered]}>
          {audio && (
            <>
              <TouchableOpacity
                style={[
                  styles.playBtn,
                  // primaryDeep: the white icon needs ≥3:1 on its fill
                  { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryShade },
                ]}
                activeOpacity={0.85}
                accessibilityLabel={t("storyPlayer.readAloud")}
              >
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Path d="M5 3v14l12-7L5 3z" fill={theme.onPrimary} />
                </Svg>
              </TouchableOpacity>
              <Text style={[styles.audioLabel, { color: theme.textDark }]}>
                {t("storyPlayer.readAloud")}
              </Text>
            </>
          )}

          {/* Dots */}
          <View style={styles.dots}>
            {pages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: i === pageIdx ? 22 : 6,
                    backgroundColor: i === pageIdx ? theme.primary : theme.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Nav buttons */}
        <View style={styles.navRow}>
          <Btn
            t={theme}
            variant="secondary"
            disabled={isFirst}
            onPress={() => setPageIdx((p) => p - 1)}
            fullWidth={false}
            style={styles.navBtn}
            accessibilityLabel={t("storyPlayer.previous")}
          >
            <View style={styles.navBtnContent}>
              <Svg width={16} height={16} viewBox="0 0 16 16">
                <Path
                  d="M10 3l-5 5 5 5"
                  stroke={theme.textDark}
                  strokeWidth={2.4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.navBtnText, { color: theme.textDark }]}>
                {t("storyPlayer.previous")}
              </Text>
            </View>
          </Btn>

          <Btn
            t={theme}
            onPress={() =>
              isLast ? setShowComplete(true) : setPageIdx((p) => p + 1)
            }
            fullWidth={false}
            style={styles.navBtn}
            accessibilityLabel={
              isLast ? t("storyPlayer.finish") : t("storyPlayer.next")
            }
          >
            <View style={styles.navBtnContent}>
              <Text style={[styles.navBtnText, { color: theme.onPrimary }]}>
                {isLast ? t("storyPlayer.finish") : t("storyPlayer.next")}
              </Text>
              {isLast ? (
                <Svg width={16} height={16} viewBox="0 0 16 16">
                  <Path
                    d="M3 8.5l3.5 3.5L13 4.5"
                    stroke={theme.onPrimary}
                    strokeWidth={2.4}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : (
                <Svg width={16} height={16} viewBox="0 0 16 16">
                  <Path
                    d="M6 3l5 5-5 5"
                    stroke={theme.onPrimary}
                    strokeWidth={2.4}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </View>
          </Btn>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // Image
  imageWrap: { position: "relative", marginTop: 50 },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 24,
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
  pagePill: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  pagePillText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // Text — fontSize/lineHeight come from TEXT_SIZES (textSize setting)
  storyText: {
    fontWeight: "600",
    letterSpacing: -0.2,
    paddingTop: 24,
    paddingHorizontal: 4,
  },

  spacer: { flex: 1 },

  // Audio row
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  audioRowCentered: {
    justifyContent: "center",
    minHeight: 56, // keep the row's height stable so the layout doesn't shift
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 3,
  },
  audioLabel: { fontSize: 14, fontWeight: "700", flex: 1 },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 6, borderRadius: 3 },

  // Nav
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  navBtn: { flex: 1 },
  navBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navBtnText: {
    fontSize: 17,
    fontWeight: "700",
  },
});
