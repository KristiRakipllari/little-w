import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import ScreenHeader from "@/components/ScreenHeader";
import Btn from "@/components/Btn";
import { useAppStore, AgeChoice } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onContinue: () => void;
}

export default function AgeGateScreen({ onContinue }: Props) {
  const { themeId, ageChoice, setAgeChoice } = useAppStore();
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const OPTIONS: { id: AgeChoice; title: string; sub: string; size: number }[] = [
    {
      id: "child",
      title: t("ageGate.childTitle"),
      sub: t("ageGate.childSub"),
      size: 18,
    },
    {
      id: "adult",
      title: t("ageGate.adultTitle"),
      sub: t("ageGate.adultSub"),
      size: 28,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={t("ageGate.headerTitle")} t={theme} />

      <View style={styles.body}>
        <Text style={[styles.heading, { color: theme.textDark }]}>
          {t("ageGate.heading")}
        </Text>
        <Text style={[styles.desc, { color: theme.textLight }]}>
          {t("ageGate.desc")}
        </Text>

        <View style={styles.options}>
          {OPTIONS.map((opt) => {
            const selected = ageChoice === opt.id;
            return (
              <TouchableOpacity
                key={opt.id!}
                onPress={() => setAgeChoice(opt.id)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? theme.primarySoft : theme.surface,
                    borderWidth: selected ? 2 : 0,
                    borderColor: selected ? theme.primary : "transparent",
                    shadowColor: selected ? "transparent" : theme.textDark,
                  },
                ]}
              >
                {/* Avatar circle */}
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: selected ? theme.primary : theme.primarySoft,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: opt.size,
                      height: opt.size,
                      borderRadius: opt.size / 2,
                      backgroundColor: selected ? theme.surface : theme.primary,
                    }}
                  />
                </View>

                {/* Text */}
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: theme.textDark }]}>
                    {opt.title}
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.textLight }]}>
                    {opt.sub}
                  </Text>
                </View>

                {/* Radio dot */}
                <View
                  style={[
                    styles.radio,
                    {
                      backgroundColor: selected ? theme.primary : "transparent",
                      borderWidth: selected ? 0 : 2,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {selected && (
                    <Svg width={12} height={12} viewBox="0 0 12 12">
                      <Path
                        d="M2 6l3 3 5-6"
                        stroke="#fff"
                        strokeWidth={2.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.spacer} />

        <Btn t={theme} disabled={!ageChoice} onPress={onContinue}>
          {t("common.continue")}
        </Btn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 30,
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3,
  },
  optionSub: {
    fontSize: 13,
    fontWeight: "500",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    flex: 1,
  },
});
