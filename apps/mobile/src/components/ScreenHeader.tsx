import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import type { AppTheme } from "@calm-stories/shared";

interface Props {
  title: string;
  t: AppTheme;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
}

export default function ScreenHeader({
  title,
  t,
  subtitle,
  onBack,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const iconButton = (
    content: React.ReactNode,
    onPress: () => void,
    label: string
  ) => (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={[styles.iconBtn, { backgroundColor: t.surface, shadowColor: t.textDark }]}
    >
      {content}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {onBack
          ? iconButton(
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Path
                  d="M12 4l-6 6 6 6"
                  stroke={t.textDark}
                  strokeWidth={2.4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>,
              onBack,
              "Back"
            )
          : <View style={styles.spacer} />}

        <Text style={[styles.title, { color: t.textDark }]}>{title}</Text>

        {onClose
          ? iconButton(
              <Svg width={18} height={18} viewBox="0 0 18 18">
                <Path
                  d="M4 4l10 10M14 4L4 14"
                  stroke={t.textDark}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              </Svg>,
              onClose,
              "Close"
            )
          : <View style={styles.spacer} />}
      </View>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: t.textLight }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  spacer: {
    width: 48,
  },
});
