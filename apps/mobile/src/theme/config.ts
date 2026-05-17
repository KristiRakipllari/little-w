import { createTamagui, createTokens } from "tamagui";
import { createAnimations } from "@tamagui/animations-react-native";
import { createInterFont } from "@tamagui/font-inter";
import { shorthands } from "@tamagui/shorthands";
import { tokens as defaultTokens } from "@tamagui/config/v3";
import { THEMES } from "@calm-stories/shared";

const interFont = createInterFont();

// Build color tokens from all 4 themes so Tamagui knows about them.
const themeColors: Record<string, string> = {};
for (const t of THEMES) {
  for (const [key, val] of Object.entries(t)) {
    if (typeof val === "string" && key !== "id" && key !== "label" && key !== "tag") {
      themeColors[`${t.id}_${key}`] = val;
    }
  }
}

const tokens = createTokens({
  ...defaultTokens,
  color: {
    ...defaultTokens.color,
    ...themeColors,
  },
});

// Build a Tamagui theme object per palette.
function buildTamaguiTheme(t: (typeof THEMES)[number]) {
  return {
    background: t.bg,
    backgroundHover: t.primarySoft,
    backgroundPress: t.primarySoft,
    backgroundFocus: t.primarySoft,
    color: t.textDark,
    colorHover: t.textDark,
    colorPress: t.textDark,
    colorFocus: t.textDark,
    borderColor: t.border,
    borderColorHover: t.primary,
    borderColorPress: t.primary,
    borderColorFocus: t.primary,
    shadowColor: t.shadow,
    shadowColorHover: t.shadowSoft,
    shadowColorPress: t.shadowSoft,
    shadowColorFocus: t.shadowSoft,
    placeholderColor: t.textLight,
  };
}

const themes: Record<string, ReturnType<typeof buildTamaguiTheme>> = {};
for (const t of THEMES) {
  themes[t.id] = buildTamaguiTheme(t);
}

const config = createTamagui({
  defaultFont: "body",
  animations: createAnimations({
    fast: { type: "spring", damping: 20, stiffness: 250 },
    medium: { type: "spring", damping: 15, stiffness: 150 },
    slow: { type: "spring", damping: 20, stiffness: 60 },
  }),
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: interFont,
    body: interFont,
  },
  tokens,
  themes,
});

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
