import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAppStore, Locale } from "@/store/appStore";
import { getThemeById } from "@calm-stories/shared";

const LANGUAGES: { id: Locale; label: string; flag: string }[] = [
  { id: "sq", label: "Shqip", flag: "\uD83C\uDDE6\uD83C\uDDF1" },
  { id: "en", label: "English", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
];

interface Props {
  onContinue: () => void;
}

export default function LanguageScreen({ onContinue }: Props) {
  const { locale, setLocale, themeId } = useAppStore();
  const theme = getThemeById(themeId);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.textDark }]}>
          Choose your language
        </Text>
        <Text style={[styles.subheading, { color: theme.textLight }]}>
          Zgjidh gjuh{"\u00eb"}n t{"\u00eb"}nde
        </Text>

        <View style={styles.options}>
          {LANGUAGES.map((lang) => {
            const selected = locale === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                onPress={() => setLocale(lang.id)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.langCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, { color: theme.textDark }]}>
                  {lang.label}
                </Text>
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
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.85}
          accessibilityRole="button"
          style={[styles.continueBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.continueText, { color: theme.onPrimary }]}>
            {locale === "sq" ? "Vazhdo" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subheading: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 32,
  },
  options: { gap: 12 },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  flag: { fontSize: 28 },
  langLabel: { fontSize: 18, fontWeight: "700", flex: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  continueBtn: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontSize: 17,
    fontWeight: "700",
  },
});
