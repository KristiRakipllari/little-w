import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import type { AppTheme } from "@calm-stories/shared";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][]; // [value, label]
  t: AppTheme;
}

export default function Segment({ value, onChange, options, t }: Props) {
  return (
    <View style={[styles.track, { backgroundColor: t.bg }]}>
      {options.map(([v, label]) => {
        const selected = v === value;
        return (
          <TouchableOpacity
            key={v}
            onPress={() => onChange(v)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
              styles.option,
              selected && [
                styles.optionSelected,
                {
                  backgroundColor: t.primary,
                  shadowColor: t.primaryShade,
                },
              ],
            ]}
          >
            <Text
              style={[styles.label, { color: selected ? t.onPrimary : t.textDark }]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  option: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
