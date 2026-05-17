// Theme tokens ported 1:1 from the HTML prototype (app.jsx THEMES).
// Shared across mobile (Tamagui) and admin (shadcn/Tailwind).

export interface AppTheme {
  id: string;
  label: string;
  tag: string;

  primary: string;
  primaryDeep: string;
  primarySoft: string;
  primaryShade: string;
  onPrimary: string;

  secondary: string;
  secondaryDeep: string;
  secondarySoft: string;
  secondaryShade: string;

  bg: string;
  surface: string;

  textDark: string;
  textLight: string;

  accent: string;
  accentShade: string;

  success: string;
  successSoft: string;

  border: string;
  shadow: string;
  shadowSoft: string;
  placeholderBg: string;
}

export const THEMES: AppTheme[] = [
  {
    id: "calm-green",
    label: "Calm Green",
    tag: "Nature-inspired (default)",
    primary: "#82C098",
    primaryDeep: "#3F7A55",
    primarySoft: "#E0F0E5",
    primaryShade: "#5FA078",
    onPrimary: "#FFFFFF",
    secondary: "#F4B860",
    secondaryDeep: "#8A5A1A",
    secondarySoft: "#FBE7C4",
    secondaryShade: "#D89940",
    bg: "#FAFAF8",
    surface: "#FFFFFF",
    textDark: "#2C3E50",
    textLight: "#7F8C8D",
    accent: "#E8A0A0",
    accentShade: "#C97878",
    success: "#82C098",
    successSoft: "#E0F0E5",
    border: "rgba(44,62,80,0.10)",
    shadow: "rgba(44,62,80,0.06)",
    shadowSoft: "rgba(44,62,80,0.04)",
    placeholderBg: "#EFEBE3",
  },
  {
    id: "soft-blue",
    label: "Soft Blue",
    tag: "Soothing, low-stim",
    primary: "#7FA8D8",
    primaryDeep: "#3A5A85",
    primarySoft: "#E2EDF8",
    primaryShade: "#5C88BD",
    onPrimary: "#FFFFFF",
    secondary: "#F4B860",
    secondaryDeep: "#8A5A1A",
    secondarySoft: "#FBE7C4",
    secondaryShade: "#D89940",
    bg: "#F5F8FA",
    surface: "#FFFFFF",
    textDark: "#2C3E50",
    textLight: "#7F8C8D",
    accent: "#E8A0A0",
    accentShade: "#C97878",
    success: "#7FA8D8",
    successSoft: "#E2EDF8",
    border: "rgba(44,62,80,0.10)",
    shadow: "rgba(44,62,80,0.06)",
    shadowSoft: "rgba(44,62,80,0.04)",
    placeholderBg: "#E5ECF2",
  },
  {
    id: "warm-peach",
    label: "Warm Peach",
    tag: "Cozy, comforting",
    primary: "#E8A888",
    primaryDeep: "#8A4F30",
    primarySoft: "#F8E4D6",
    primaryShade: "#C58866",
    onPrimary: "#FFFFFF",
    secondary: "#F4B860",
    secondaryDeep: "#8A5A1A",
    secondarySoft: "#FBE7C4",
    secondaryShade: "#D89940",
    bg: "#FFFAF5",
    surface: "#FFFFFF",
    textDark: "#2C3E50",
    textLight: "#7F8C8D",
    accent: "#E8A0A0",
    accentShade: "#C97878",
    success: "#A8D5BA",
    successSoft: "#E0F0E5",
    border: "rgba(44,62,80,0.10)",
    shadow: "rgba(44,62,80,0.06)",
    shadowSoft: "rgba(44,62,80,0.04)",
    placeholderBg: "#F2E5D8",
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    tag: "Visual sensitivity",
    primary: "#1A1A1A",
    primaryDeep: "#000000",
    primarySoft: "#F0F0F0",
    primaryShade: "#000000",
    onPrimary: "#FFFFFF",
    secondary: "#FFD700",
    secondaryDeep: "#705A00",
    secondarySoft: "#FFF6CC",
    secondaryShade: "#C9A800",
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    textDark: "#000000",
    textLight: "#444444",
    accent: "#FF6B6B",
    accentShade: "#C94545",
    success: "#00AA00",
    successSoft: "#E0F5E0",
    border: "rgba(0,0,0,0.20)",
    shadow: "rgba(0,0,0,0.12)",
    shadowSoft: "rgba(0,0,0,0.06)",
    placeholderBg: "#EAEAEA",
  },
];

export const DEFAULT_THEME_ID = "calm-green";

export function getThemeById(id: string): AppTheme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
