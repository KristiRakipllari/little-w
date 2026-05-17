import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Card from "@/components/Card";
import Toggle from "@/components/Toggle";
import Segment from "@/components/Segment";
import { useAppStore, Locale } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { THEMES, getThemeById } from "@calm-stories/shared";

const LANGUAGES: { id: Locale; label: string; flag: string }[] = [
  { id: "sq", label: "Shqip", flag: "\uD83C\uDDE6\uD83C\uDDF1" },
  { id: "en", label: "English", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
];

interface Props {
  onPolicy: () => void;
  onAdmin: () => void;
  onParentArea: () => void;
}

export default function SettingsScreen({ onPolicy, onAdmin, onParentArea }: Props) {
  const {
    locale,
    setLocale,
    themeId,
    setThemeId,
    audio,
    setAudio,
    textSize,
    setTextSize,
    motion,
    setMotion,
  } = useAppStore();
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const section = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textLight }]}>{title}</Text>
      <Card t={theme} style={styles.sectionCard}>
        {children}
      </Card>
    </View>
  );

  const settingsLink = (label: string, onPress: () => void, last = false) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      style={[
        styles.linkRow,
        !last && { borderBottomWidth: 1, borderBottomColor: theme.border },
      ]}
    >
      <Text style={[styles.linkText, { color: theme.textDark }]}>{label}</Text>
      <Svg width={14} height={14} viewBox="0 0 14 14">
        <Path
          d="M5 2l5 5-5 5"
          stroke={theme.textLight}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: theme.textDark }]}>
          {t("settings.heading")}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language picker */}
        {section(
          t("settings.language"),
          LANGUAGES.map((lang, i) => {
            const selected = locale === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                onPress={() => setLocale(lang.id)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.langRow,
                  i < LANGUAGES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, { color: theme.textDark }]}>
                  {lang.label}
                </Text>

                {/* Radio */}
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
          })
        )}

        {/* Theme picker */}
        {section(
          t("settings.theme"),
          THEMES.map((th, i) => {
            const selected = themeId === th.id;
            return (
              <TouchableOpacity
                key={th.id}
                onPress={() => setThemeId(th.id)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.themeRow,
                  i < THEMES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                {/* Color swatch */}
                <View style={styles.swatch}>
                  <View
                    style={[
                      styles.swatchLeft,
                      { backgroundColor: th.bg, borderTopLeftRadius: 11, borderBottomLeftRadius: 11 },
                    ]}
                  />
                  <View style={[styles.swatchMid, { backgroundColor: th.primary }]} />
                  <View
                    style={[
                      styles.swatchRight,
                      { backgroundColor: th.secondary, borderTopRightRadius: 11, borderBottomRightRadius: 11 },
                    ]}
                  />
                </View>

                <View style={styles.themeText}>
                  <Text style={[styles.themeLabel, { color: theme.textDark }]}>
                    {th.label}
                  </Text>
                  <Text style={[styles.themeTag, { color: theme.textLight }]}>
                    {th.tag}
                  </Text>
                </View>

                {/* Radio */}
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
          })
        )}

        {/* Sound */}
        {section(
          t("settings.sound"),
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={[styles.settingTitle, { color: theme.textDark }]}>
                {t("settings.audioNarration")}
              </Text>
              <Text style={[styles.settingSub, { color: theme.textLight }]}>
                {t("settings.audioNarrationSub")}
              </Text>
            </View>
            <Toggle on={audio} onChange={setAudio} t={theme} />
          </View>
        )}

        {/* Reading */}
        {section(
          t("settings.reading"),
          <>
            <View
              style={[
                styles.settingRow,
                { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.settingTitle, { color: theme.textDark }]}>
                {t("settings.textSize")}
              </Text>
              <Segment
                value={textSize}
                onChange={(v) => setTextSize(v as "s" | "m" | "l")}
                options={[
                  ["s", t("textSizeOptions.s")],
                  ["m", t("textSizeOptions.m")],
                  ["l", t("textSizeOptions.l")],
                ]}
                t={theme}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingTitle, { color: theme.textDark }]}>
                {t("settings.animations")}
              </Text>
              <Segment
                value={motion}
                onChange={(v) => setMotion(v as "slow" | "normal" | "off")}
                options={[
                  ["slow", t("animationOptions.slow")],
                  ["normal", t("animationOptions.normal")],
                  ["off", t("animationOptions.off")],
                ]}
                t={theme}
              />
            </View>
          </>
        )}

        {/* Parent area */}
        {section(
          t("settings.parentArea"),
          settingsLink(t("settings.parentArea"), onParentArea, true)
        )}

        {/* About */}
        {section(
          t("settings.about"),
          <>
            {settingsLink(t("settings.privacyPolicy"), onPolicy)}
            {settingsLink(t("settings.termsOfService"), () => {})}
            {settingsLink(t("settings.contactSupport"), () => {}, true)}
          </>
        )}

        <Text style={[styles.version, { color: theme.textLight }]}>
          {t("settings.version")}
        </Text>

        <TouchableOpacity
          onPress={onAdmin}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("settings.adminPanel")}
          style={styles.adminLink}
        >
          <Text style={[styles.adminText, { color: theme.textLight }]}>
            {t("settings.adminPanel")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  sectionCard: { paddingVertical: 4 },

  // Language picker
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  langFlag: { fontSize: 22 },
  langLabel: { fontSize: 16, fontWeight: "700", flex: 1 },

  // Theme picker
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  swatch: { flexDirection: "row", height: 32 },
  swatchLeft: { width: 22 },
  swatchMid: { width: 22 },
  swatchRight: { width: 22 },
  themeText: { flex: 1 },
  themeLabel: { fontSize: 16, fontWeight: "700" },
  themeTag: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 12,
  },
  settingLabel: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: "700" },
  settingSub: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  linkText: { fontSize: 16, fontWeight: "700" },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 8,
  },
  adminLink: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  adminText: {
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
