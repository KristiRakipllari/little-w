import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from "react-native";
import Svg, { Path } from "react-native-svg";
import Card from "@/components/Card";
import Toggle from "@/components/Toggle";
import Segment from "@/components/Segment";
import { useAppStore, Locale } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/i18n";
import { THEMES, getThemeById } from "@calm-stories/shared";
import type { AppTheme } from "@calm-stories/shared";

const LANGUAGES: { id: Locale; label: string; flag: string }[] = [
  { id: "sq", label: "Shqip", flag: "\uD83C\uDDE6\uD83C\uDDF1" },
  { id: "en", label: "English", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
];

function LanguageDropdown({
  locale,
  setLocale,
  theme,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: AppTheme;
}) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.id === locale) || LANGUAGES[0];

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        style={styles.dropdownTrigger}
      >
        <Text style={styles.dropdownFlag}>{current.flag}</Text>
        <Text style={[styles.dropdownLabel, { color: theme.textDark }]}>
          {current.label}
        </Text>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path
            d="M3 5l4 4 4-4"
            stroke={theme.textLight}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={[styles.dropdownMenu, { backgroundColor: theme.surface }]}>
            {LANGUAGES.map((lang, i) => {
              const selected = locale === lang.id;
              return (
                <TouchableOpacity
                  key={lang.id}
                  onPress={() => {
                    setLocale(lang.id);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.dropdownItem,
                    i < LANGUAGES.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <Text style={styles.dropdownFlag}>{lang.flag}</Text>
                  <Text style={[styles.dropdownLabel, { color: theme.textDark }]}>
                    {lang.label}
                  </Text>
                  {selected && (
                    <Svg width={16} height={16} viewBox="0 0 16 16">
                      <Path
                        d="M3 8l4 4 6-7"
                        stroke={theme.primary}
                        strokeWidth={2.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

interface Props {
  onPolicy: () => void;
  onTerms: () => void;
  onAdmin: () => void;
  onParentArea: () => void;
  onLogin: () => void;
}

export default function SettingsScreen({ onPolicy, onTerms, onAdmin, onParentArea, onLogin }: Props) {
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
  const { user, logout } = useAuthStore();
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
        {/* Language dropdown */}
        {section(
          t("settings.language"),
          <LanguageDropdown locale={locale} setLocale={setLocale} theme={theme} />
        )}

        {/* Parent area */}
        {section(
          t("settings.parentArea"),
          settingsLink(t("settings.parentArea"), onParentArea, true)
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
            <Toggle
              on={audio}
              onChange={setAudio}
              t={theme}
              accessibilityLabel={t("settings.audioNarration")}
            />
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

        {/* About */}
        {section(
          t("settings.about"),
          <>
            {settingsLink(t("settings.privacyPolicy"), onPolicy)}
            {settingsLink(t("settings.termsOfService"), onTerms, true)}
          </>
        )}

        {/* Account */}
        {section(
          t("settings.account"),
          user ? (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingLabel}>
                  <Text style={[styles.settingTitle, { color: theme.textDark }]}>
                    {t("settings.loggedInAs")}
                  </Text>
                  <Text style={[styles.settingSub, { color: theme.textLight }]}>
                    {user.email}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={logout}
                activeOpacity={0.7}
                accessibilityRole="button"
                style={[
                  styles.linkRow,
                  { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                {/* textDark: accent-on-white is 2.11:1 and accent is the
                    error color — Log Out is a neutral action. */}
                <Text style={[styles.linkText, { color: theme.textDark }]}>
                  {t("settings.logOut")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            settingsLink(t("settings.logIn"), onLogin, true)
          )
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
    // Clears the floating tab bar.
    paddingBottom: 120,
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

  // Language dropdown
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownFlag: { fontSize: 22 },
  dropdownLabel: { fontSize: 16, fontWeight: "700", flex: 1 },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  dropdownMenu: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },

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
