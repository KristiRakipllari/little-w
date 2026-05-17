import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => Math.min(100, p + 4));
    }, 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(onFinish, 200);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Concentric circles mark */}
      <View style={[styles.outerCircle, { backgroundColor: theme.primarySoft }]}>
        <View style={[styles.middleCircle, { backgroundColor: theme.primary }]}>
          <View style={[styles.innerCircle, { backgroundColor: theme.surface }]} />
        </View>
      </View>

      <Text style={[styles.title, { color: theme.textDark }]}>{t("splash.title")}</Text>
      <Text style={[styles.subtitle, { color: theme.textLight }]}>
        {t("splash.subtitle")}
      </Text>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.primarySoft }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.primary, width: `${progress}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  outerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  middleCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 6,
  },
  progressTrack: {
    width: 200,
    height: 6,
    borderRadius: 3,
    marginTop: 48,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
