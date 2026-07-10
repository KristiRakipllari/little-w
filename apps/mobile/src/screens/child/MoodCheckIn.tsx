import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import ScreenHeader from "@/components/ScreenHeader";
import { MoodFace, MOOD_ORDER, MOOD_STYLES } from "@/components/MoodFace";
import { useAppStore } from "@/store/appStore";
import { useStoryStore } from "@/store/storyStore";
import { useMoodStore, MoodId } from "@/store/moodStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  storyId: string;
  onBack: () => void;
  onStart: () => void;
}

const MOODS = MOOD_ORDER.map((id) => ({
  id,
  labelKey: `mood.${id}`,
  ...MOOD_STYLES[id],
}));

export default function MoodCheckIn({ storyId, onBack, onStart }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const stories = useStoryStore((s) => s.stories);
  const recordMood = useMoodStore((s) => s.recordMood);

  // Guard against a double-tap firing two navigations.
  const chosen = useRef(false);

  const story = stories.find((s) => s.id === storyId);
  const title = story?.title || t("mood.headerFallback");

  const choose = (moodId: MoodId) => {
    if (chosen.current) return;
    chosen.current = true;
    // Persist locally so parents / therapists can see patterns later,
    // then open the story straight away.
    recordMood(storyId, moodId);
    onStart();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={title} t={theme} onBack={onBack} />

      <View style={styles.body}>
        <Text style={[styles.prompt, { color: theme.textDark }]}>
          {t("mood.prompt")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textLight }]}>
          {t("mood.subtitle")}
        </Text>

        <View style={styles.grid}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => choose(m.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t(m.labelKey)}
              style={[
                styles.moodBtn,
                { backgroundColor: theme.surface, shadowColor: theme.textDark },
              ]}
            >
              <MoodFace id={m.id} color={m.face} ring={m.ring} />
              <Text style={[styles.moodLabel, { color: theme.textDark }]}>
                {t(m.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },
  prompt: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 32,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  moodBtn: {
    width: "48%",
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  moodLabel: {
    fontSize: 17,
    fontWeight: "800",
  },
});
