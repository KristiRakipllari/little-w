import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { TamaguiProvider } from "tamagui";
import config from "@/theme/config";
import Navigator from "@/navigation/Navigator";
import { useAppStore } from "@/store/appStore";
import { useReadingStatsStore } from "@/store/readingStatsStore";
import { useMoodStore } from "@/store/moodStore";
import { getThemeById } from "@calm-stories/shared";

function AppContent() {
  const { hydrated, hydrate, themeId } = useAppStore();
  const hydrateStats = useReadingStatsStore((s) => s.hydrate);
  const hydrateMoods = useMoodStore((s) => s.hydrate);
  const theme = getThemeById(themeId);

  useEffect(() => {
    hydrate();
    hydrateStats();
    hydrateMoods();
  }, []);

  if (!hydrated) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Navigator />
    </>
  );
}

export default function App() {
  return (
    <TamaguiProvider config={config}>
      <AppContent />
    </TamaguiProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
