import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { useStoryStore } from "@/store/storyStore";
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

interface Props {
  storyId: string;
  onBack: () => void;
}

export default function StoryPlayer({ storyId, onBack }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const locale = useAppStore((s) => s.locale);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const getPageText = (page: StoryPage) => {
    const key = `text_${locale}` as keyof StoryPage;
    return (page[key] as string) || page.text_en || page.text_sq;
  };
  const { currentStory, isLoading, fetchStory, clearCurrentStory } =
    useStoryStore();
  const [pageIdx, setPageIdx] = useState(0);

  useEffect(() => {
    fetchStory(storyId);
    return () => clearCurrentStory();
  }, [storyId]);

  if (isLoading || !currentStory) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
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
              resizeMode="cover"
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
        <Text style={[styles.storyText, { color: theme.textDark }]}>
          {page ? getPageText(page) : ""}
        </Text>

        <View style={styles.spacer} />

        {/* Audio + dots row */}
        <View style={styles.audioRow}>
          <TouchableOpacity
            style={[
              styles.playBtn,
              { backgroundColor: theme.primary, shadowColor: theme.primaryShade },
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
            disabled={isLast}
            onPress={() => setPageIdx((p) => p + 1)}
            fullWidth={false}
            style={styles.navBtn}
          >
            <View style={styles.navBtnContent}>
              <Text style={[styles.navBtnText, { color: theme.onPrimary }]}>
                {t("storyPlayer.next")}
              </Text>
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
  imageWrap: { position: "relative" },
  image: {
    height: 300,
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

  // Text
  storyText: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 32,
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
