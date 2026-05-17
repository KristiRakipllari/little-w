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
  const variantStyles: Record<Variant, ViewStyle> = {
    primary: { backgroundColor: t.primary },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: t.border,
    },
    ghost: { backgroundColor: "transparent" },
    danger: { backgroundColor: t.accent },
  };

  const textColor =
    variant === "secondary" || variant === "ghost" ? t.textDark : t.onPrimary;

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
