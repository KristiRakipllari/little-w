import React, { useState, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { TouchableOpacity, Text } from "react-native";

import { useAppStore, hasValidConsent } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";
import ErrorBoundary from "@/components/ErrorBoundary";

// Screens
import SplashScreen from "@/screens/child/SplashScreen";
import LanguageScreen from "@/screens/child/LanguageScreen";
import AgeGateScreen from "@/screens/child/AgeGateScreen";
import PrivacyPolicy from "@/screens/child/PrivacyPolicy";
import TermsAndConditions from "@/screens/child/TermsAndConditions";
import ConsentGate from "@/screens/child/ConsentGate";
import PolicyScreen from "@/screens/child/PolicyScreen";
import TermsScreen from "@/screens/child/TermsScreen";
import StoryList from "@/screens/child/StoryList";
import MoodCheckIn from "@/screens/child/MoodCheckIn";
import StoryPlayer from "@/screens/child/StoryPlayer";
import PaywallScreen from "@/screens/child/PaywallScreen";
import SettingsScreen from "@/screens/child/SettingsScreen";
import GrownupGateScreen from "@/screens/child/GrownupGateScreen";
import ParentDashboardScreen from "@/screens/child/ParentDashboardScreen";

// Auth screens
import Login from "@/screens/auth/Login";
import ForgotPassword from "@/screens/auth/ForgotPassword";

// Admin screens
import Dashboard from "@/screens/admin/Dashboard";
import StoryForm from "@/screens/admin/StoryForm";
import PageEditor from "@/screens/admin/PageEditor";

// ── Types ────────────────────────────────────
export type RootStackParamList = {
  // Onboarding
  Onboarding: undefined;
  // Main child flow
  ChildMain: undefined;
  MoodCheckIn: { storyId: string };
  StoryPlayer: { storyId: string };
  Paywall: { storyId: string };
  // The gate protects more than one destination; `next` says where a pass
  // leads (default: ParentDashboard). "Login" = admin login.
  GrownupGate: { next?: "ParentDashboard" | "Login" } | undefined;
  ParentDashboard: undefined;
  Policy: undefined;
  Terms: undefined;
  // Auth
  LoginRegister: { storyId?: string };
  ForgotPassword: undefined;
  // Admin
  Login: undefined;
  AdminTabs: undefined;
  StoryForm: { storyId?: string };
  PageEditor: { storyId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type Screen<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// ── Custom Tab Bar ───────────────────────────
function TabBar({
  active,
  onNavigate,
}: {
  active: "home" | "settings";
  onNavigate: (tab: "home" | "settings") => void;
}) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const tab = (
    id: "home" | "settings",
    label: string,
    icon: (color: string) => React.ReactNode
  ) => {
    const isActive = active === id;
    const color = isActive ? theme.primaryDeep : theme.textLight;
    return (
      <TouchableOpacity
        key={id}
        onPress={() => onNavigate(id)}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={label}
        style={styles.tab}
      >
        <View
          style={[
            styles.tabIndicator,
            { backgroundColor: isActive ? theme.primarySoft : "transparent" },
          ]}
        >
          {icon(color)}
        </View>
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const tabs = (
    <>
      {tab("home", t("tabs.stories"), (c) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 5a2 2 0 012-2h5v18H6a2 2 0 01-2-2V5zM13 3h5a2 2 0 012 2v14a2 2 0 01-2 2h-5V3z"
            stroke={c}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      ))}
      {tab("settings", t("tabs.settings"), (c) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={2} />
          <Path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008.91 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.91a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
            stroke={c}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      ))}
    </>
  );

  // iOS 17+ style: a floating translucent pill detached from the screen edge,
  // with content scrolling underneath. Blur is iOS-only; Android/web get a
  // near-opaque surface instead.
  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarWrap, { bottom: Math.max(insets.bottom, 12) + 8 }]}
    >
      <View style={[styles.tabBarShadow, { shadowColor: theme.textDark }]}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={60}
            tint="light"
            style={[
              styles.tabBar,
              { backgroundColor: `${theme.surface}B3`, borderColor: theme.border },
            ]}
          >
            {tabs}
          </BlurView>
        ) : (
          <View
            style={[
              styles.tabBar,
              { backgroundColor: `${theme.surface}F5`, borderColor: theme.border },
            ]}
          >
            {tabs}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Child Main (tabs) ────────────────────────
function ChildMainScreen({ navigation }: Screen<"ChildMain">) {
  const [activeTab, setActiveTab] = useState<"home" | "settings">("home");
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const insets = useSafeAreaInsets();

  const handleStory = useCallback(
    (storyId: string) => {
      // Every story open passes through the emotion check-in first.
      navigation.navigate("MoodCheckIn", { storyId });
    },
    [navigation]
  );

  const handlePaywall = useCallback(
    (storyId: string) => {
      navigation.navigate("Paywall", { storyId });
    },
    [navigation]
  );

  const handleSettingsLogin = useCallback(() => {
    navigation.navigate("LoginRegister", {});
  }, [navigation]);

  const handlePolicy = useCallback(() => {
    navigation.navigate("Policy");
  }, [navigation]);

  const handleTerms = useCallback(() => {
    navigation.navigate("Terms");
  }, [navigation]);

  const handleAdmin = useCallback(() => {
    // Staff login is adult-only content: it must sit behind the grownup
    // gate, same as the parent area (accessibility-autism: no ungated
    // exits from child mode).
    navigation.navigate("GrownupGate", { next: "Login" });
  }, [navigation]);

  const handleParentArea = useCallback(() => {
    navigation.navigate("GrownupGate");
  }, [navigation]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.flex}>
        {activeTab === "home" ? (
          <StoryList onStory={handleStory} onPaywall={handlePaywall} />
        ) : (
          <SettingsScreen
            onPolicy={handlePolicy}
            onTerms={handleTerms}
            onAdmin={handleAdmin}
            onParentArea={handleParentArea}
            onLogin={handleSettingsLogin}
          />
        )}
      </View>
      <TabBar active={activeTab} onNavigate={setActiveTab} />
    </View>
  );
}

// ── Onboarding Flow ──────────────────────────
function OnboardingScreen() {
  const ageChoice = useAppStore((s) => s.ageChoice);
  const [step, setStep] = useState<
    "splash" | "language" | "age" | "privacy" | "terms" | "grownup" | "consent"
  >("splash");

  // COPPA: when the user said "I am a child" at the age gate, the guardian
  // consent step must be reached through the grownup challenge — a child
  // ticking "I confirm I am the parent/guardian" alone is not consent.
  const needsGrownupCheck = ageChoice === "child";

  switch (step) {
    case "splash":
      return <SplashScreen onFinish={() => setStep("language")} />;
    case "language":
      return <LanguageScreen onContinue={() => setStep("age")} />;
    case "age":
      return <AgeGateScreen onContinue={() => setStep("privacy")} />;
    case "privacy":
      return (
        <PrivacyPolicy
          onBack={() => setStep("age")}
          onContinue={() => setStep("terms")}
        />
      );
    case "terms":
      return (
        <TermsAndConditions
          onBack={() => setStep("privacy")}
          onContinue={() => setStep(needsGrownupCheck ? "grownup" : "consent")}
        />
      );
    case "grownup":
      return (
        <GrownupGateScreen
          onBack={() => setStep("terms")}
          onPass={() => setStep("consent")}
        />
      );
    case "consent":
      return (
        <ConsentGate
          onBack={() => setStep(needsGrownupCheck ? "grownup" : "terms")}
          // acceptConsent (called inside ConsentGate) flips the launch gate,
          // which swaps this whole stack over to the main app.
          onConfirm={() => {}}
        />
      );
  }
}

// ── Root Navigator ───────────────────────────
export default function Navigator() {
  const consentData = useAppStore((s) => s.consentData);
  const { user, mode } = useAuthStore();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {mode === "admin" && user ? (
            <>
              <Stack.Screen name="AdminTabs" component={Dashboard} />
              <Stack.Screen
                name="StoryForm"
                component={StoryForm}
                options={{ headerShown: true, title: "Story" }}
              />
              <Stack.Screen
                name="PageEditor"
                component={PageEditor}
                options={{ headerShown: true, title: "Edit Pages" }}
              />
            </>
          ) : !hasValidConsent(consentData) ? (
            <>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen
                name="Policy"
                component={PolicyWrapper}
                options={{ presentation: "modal" }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="ChildMain" component={ChildMainScreen} />
              <Stack.Screen
                name="MoodCheckIn"
                component={MoodCheckInWrapper}
                options={{ presentation: "card" }}
              />
              <Stack.Screen
                name="StoryPlayer"
                component={StoryPlayerWrapper}
                options={{ presentation: "card" }}
              />
              <Stack.Screen
                name="Paywall"
                component={PaywallWrapper}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="Policy"
                component={PolicyWrapper}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="Terms"
                component={TermsWrapper}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="GrownupGate"
                component={GrownupGateWrapper}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="ParentDashboard"
                component={ParentDashboardWrapper}
                options={{ presentation: "card" }}
              />
              <Stack.Screen
                name="LoginRegister"
                component={LoginRegisterWrapper}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordWrapper}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="Login"
                component={AdminLoginWrapper}
                options={{ headerShown: true, title: "Admin Login" }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ── Wrapper components ──────────────────────

function MoodCheckInWrapper({ route, navigation }: Screen<"MoodCheckIn">) {
  const storyId = route.params.storyId;
  return (
    <MoodCheckIn
      storyId={storyId}
      onBack={() => navigation.goBack()}
      // Replace so Back from the player returns home, not to the check-in.
      onStart={() => navigation.replace("StoryPlayer", { storyId })}
    />
  );
}

function StoryPlayerWrapper({ route, navigation }: Screen<"StoryPlayer">) {
  return (
    // A bad story page must fall back calmly, not white-screen the reader.
    <ErrorBoundary>
      <StoryPlayer
        storyId={route.params.storyId}
        onBack={() => navigation.goBack()}
      />
    </ErrorBoundary>
  );
}

function PaywallWrapper({ route, navigation }: Screen<"Paywall">) {
  const storyId = route.params?.storyId;
  return (
    <PaywallScreen
      onPurchased={() => {
        // Premium is active — open the story they tapped, or return.
        if (storyId) {
          navigation.replace("MoodCheckIn", { storyId });
        } else {
          navigation.goBack();
        }
      }}
      onLogin={() => navigation.navigate("LoginRegister", { storyId })}
      onClose={() => navigation.goBack()}
    />
  );
}

function PolicyWrapper({ navigation }: Screen<"Policy">) {
  return <PolicyScreen onBack={() => navigation.goBack()} />;
}

function TermsWrapper({ navigation }: Screen<"Terms">) {
  return <TermsScreen onBack={() => navigation.goBack()} />;
}

function GrownupGateWrapper({ route, navigation }: Screen<"GrownupGate">) {
  const next = route.params?.next ?? "ParentDashboard";
  return (
    <GrownupGateScreen
      onBack={() => navigation.goBack()}
      onPass={() => {
        navigation.replace(next);
      }}
    />
  );
}

function ParentDashboardWrapper({ navigation }: Screen<"ParentDashboard">) {
  const { isSubscribed } = useAuthStore();
  return (
    <ParentDashboardScreen
      subscribed={isSubscribed}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate("ChildMain")}
      onPaywall={() => navigation.navigate("Paywall", { storyId: "" })}
    />
  );
}

function LoginRegisterWrapper({ route, navigation }: Screen<"LoginRegister">) {
  const storyId = route.params?.storyId;

  return (
    <Login
      onBack={() => navigation.goBack()}
      onSuccess={() => {
        if (storyId) {
          // Coming from a premium story tap
          const { isSubscribed } = useAuthStore.getState();
          if (isSubscribed) {
            navigation.replace("MoodCheckIn", { storyId });
          } else {
            navigation.replace("Paywall", { storyId });
          }
        } else {
          // Coming from Settings login — go back to Settings
          navigation.goBack();
        }
      }}
      onForgotPassword={() => navigation.navigate("ForgotPassword")}
    />
  );
}

function ForgotPasswordWrapper({ navigation }: Screen<"ForgotPassword">) {
  return <ForgotPassword onBack={() => navigation.goBack()} />;
}

function AdminLoginWrapper({ navigation }: Screen<"Login">) {
  const { setMode } = useAuthStore();
  return (
    <Login
      onBack={() => navigation.goBack()}
      onSuccess={() => {
        // Only staff accounts may enter admin mode; a parent logging in
        // here just ends up signed in and returns to the child app.
        const { user } = useAuthStore.getState();
        if (user && (user.role === "admin" || user.role === "editor")) {
          setMode("admin");
        } else {
          navigation.goBack();
        }
      }}
      onForgotPassword={() => navigation.navigate("ForgotPassword")}
    />
  );
}

// ── Styles ───────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabBarWrap: {
    position: "absolute",
    left: 24,
    right: 24,
  },
  tabBarShadow: {
    borderRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBar: {
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 24,
    overflow: "hidden",
  },
  tab: {
    width: 108,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabIndicator: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
