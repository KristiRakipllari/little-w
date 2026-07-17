import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import type { AppTheme } from "@calm-stories/shared";

interface Props {
  on: boolean;
  onChange: (value: boolean) => void;
  t: AppTheme;
  // Explicit label for screen readers — implicit sibling-text reading is
  // not guaranteed across platforms.
  accessibilityLabel?: string;
}

export default function Toggle({ on, onChange, t, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onChange(!on)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: on }}
      style={[
        styles.track,
        { backgroundColor: on ? t.primary : t.border },
      ]}
    >
      <View
        style={[
          styles.thumb,
          { left: on ? 23 : 3 },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
  },
  thumb: {
    position: "absolute",
    top: 3,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
