import React, { useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import type { AppTheme } from "@calm-stories/shared";

interface Props {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  t: AppTheme;
  autoFocus?: boolean;
  error?: boolean;
  onComplete?: (value: string) => void;
  accessibilityLabel?: string;
}

// Modern segmented OTP entry. Under the visible boxes sits one full-width,
// transparent TextInput that holds the actual value — this gives free paste
// support, iOS/Android one-time-code autofill, and correct backspace/caret
// behaviour, without the fragility of six separate inputs. The boxes are
// pointer-transparent decoration that mirror each character.
export default function OtpInput({
  value,
  onChange,
  length = 6,
  t,
  autoFocus,
  error,
  onComplete,
  accessibilityLabel,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length }).map((_, i) => {
          const char = value[i] ?? "";
          const filled = char !== "";
          // Highlight the box the next digit will land in.
          const isCursor = focused && i === value.length && value.length < length;
          const borderColor = error
            ? t.accent
            : isCursor || (filled && focused)
              ? t.primaryDeep
              : t.border;
          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  borderColor,
                  borderWidth: isCursor ? 2 : 1.5,
                  backgroundColor: filled ? t.primarySoft : t.surface,
                },
              ]}
            >
              <Text style={[styles.digit, { color: t.textDark }]}>{char}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        caretHidden
        style={styles.overlay}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxWidth: 56,
    minHeight: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  digit: {
    fontSize: 26,
    fontWeight: "800",
  },
  // Invisible input covering the boxes — captures taps, typing, and paste.
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: "transparent",
    fontSize: 1,
  },
});
