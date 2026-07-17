import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  AccessibilityRole,
} from "react-native";
import type { AppTheme } from "@calm-stories/shared";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  t: AppTheme;
  style?: ViewStyle;
  fullWidth?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function Btn({
  children,
  onPress,
  variant = "primary",
  t,
  style,
  fullWidth = true,
  disabled = false,
  accessibilityLabel,
}: Props) {
  // Text-bearing fills use the deep variants: onPrimary (white) on the pastel
  // `primary` measures ~2.0–2.5:1, far below WCAG AA 4.5:1; `primaryDeep`
  // passes on all three themes (5.09 / 7.04 / 6.48). The soft `accent` fill
  // keeps dark text for the same reason (5.21:1 vs 2.1:1 with white).
  const variantStyles: Record<Variant, ViewStyle> = {
    primary: { backgroundColor: t.primaryDeep },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: t.border,
    },
    ghost: { backgroundColor: "transparent" },
    danger: { backgroundColor: t.accent },
  };

  const textColor =
    variant === "primary" ? t.onPrimary : t.textDark;

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.85}
      accessibilityRole={"button" as AccessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text style={[styles.label, { color: textColor }]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    paddingHorizontal: 22,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
});
