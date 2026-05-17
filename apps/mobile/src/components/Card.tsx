import React from "react";
import { TouchableOpacity, View, StyleSheet, ViewStyle } from "react-native";
import type { AppTheme } from "@calm-stories/shared";

interface Props {
  children: React.ReactNode;
  t: AppTheme;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function Card({ children, t, style, onPress }: Props) {
  const inner = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.surface,
          shadowColor: t.textDark,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
});
