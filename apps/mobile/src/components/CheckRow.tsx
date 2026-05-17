import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { AppTheme } from "@calm-stories/shared";

interface Props {
  children: string;
  t: AppTheme;
}

export default function CheckRow({ children, t }: Props) {
  return (
    <View style={styles.row}>
      <View
        style={[styles.circle, { backgroundColor: t.successSoft }]}
      >
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path
            d="M2 7l3 3 7-7"
            stroke={t.success}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
      <Text style={[styles.label, { color: t.textDark }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
});
