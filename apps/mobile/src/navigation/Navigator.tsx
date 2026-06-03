import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { TouchableOpacity, Text } from "react-native";

import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

// Screens
import SplashScreen from "@/screens/child/SplashScreen";
import LanguageScreen from "@/screens/child/LanguageScreen";
import AgeGateScreen from "@/screens/child/AgeGateScreen";
import PrivacyScreen from "@/screens/child/PrivacyScreen";
import PolicyScreen from "@/screens/child/PolicyScreen";
import StoryList from "@/screens/child/StoryList";
import StoryPlayer from "@/screens/child/StoryPlayer";
import PaywallScreen from "@/screens/child/PaywallScreen";
import ParentGateScreen from "@/screens/child/ParentGateScreen";
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
  StoryPlayer: { storyId: string };
  Paywall: { storyId: string };
  ParentGate: undefined;
  GrownupGate: undefined;
  ParentDashboard: undefined;
  Policy: undefined;
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

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
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
    </View>
  );
}

// ── Child Main (tabs) ────────────────────────
function ChildMainScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<"home" | "settings">("home");
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const insets = useSafeAreaInsets();

  const handleStory = useCallback(
    (storyId: string) => {
      navigation.navigate("StoryPlayer", { storyId });
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

  const handleAdmin = useCallback(() => {
    navigation.navigate("Login");
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
function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState<"splash" | "language" | "age" | "privacy">("splash");
  const { setAgreed } = useAppStore();

  const goPolicy = useCallback(() => {
    navigation.navigate("Policy");
  }, [navigation]);

  switch (step) {
    case "splash":
      return <SplashScreen onFinish={() => setStep("language")} />;
    case "language":
      return <LanguageScreen onContinue={() => setStep("age")} />;
    case "age":
      return <AgeGateScreen onContinue={() => setStep("privacy")} />;
    case "privacy":
      return (
        <PrivacyScreen
          onBack={() => setStep("age")}
          onPolicy={goPolicy}
          onAgree={() => {
            setAgreed(true);
          }}
        />
      );
  }
}

// ── Root Navigator ───────────────────────────
export default function Navigator() {
  const agreed = useAppStore((s) => s.agreed);
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
          ) : !agreed ? (
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
                name="ParentGate"
                component={ParentGateWrapper}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="Policy"
                component={PolicyWrapper}
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

function StoryPlayerWrapper({ route, navigation }: any) {
  return (
    <StoryPlayer
      storyId={route.params.storyId}
      onBack={() => navigation.goBack()}
    />
  );
}

function PaywallWrapper({ route, navigation }: any) {
  const storyId = route.params?.storyId;
  return (
    <PaywallScreen
      onStartTrial={() => navigation.navigate("ParentGate")}
      onLogin={() => navigation.navigate("LoginRegister", { storyId })}
      onClose={() => navigation.goBack()}
    />
  );
}

function ParentGateWrapper({ navigation }: any) {
  return <ParentGateScreen onBack={() => navigation.goBack()} />;
}

function PolicyWrapper({ navigation }: any) {
  return <PolicyScreen onBack={() => navigation.goBack()} />;
}

function GrownupGateWrapper({ navigation }: any) {
  return (
    <GrownupGateScreen
      onBack={() => navigation.goBack()}
      onPass={() => {
        navigation.replace("ParentDashboard");
      }}
    />
  );
}

function ParentDashboardWrapper({ navigation }: any) {
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

function LoginRegisterWrapper({ route, navigation }: any) {
  const storyId = route.params?.storyId;

  return (
    <Login
      onBack={() => navigation.goBack()}
      onSuccess={() => {
        if (storyId) {
          // Coming from a premium story tap
          const { isSubscribed } = useAuthStore.getState();
          if (isSubscribed) {
            navigation.replace("StoryPlayer", { storyId });
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

function ForgotPasswordWrapper({ navigation }: any) {
  return <ForgotPassword onBack={() => navigation.goBack()} />;
}

function AdminLoginWrapper({ navigation }: any) {
  const { setMode } = useAuthStore();
  return (
    <Login
      onBack={() => navigation.goBack()}
      onSuccess={() => {
        setMode("admin");
      }}
      onForgotPassword={() => navigation.navigate("ForgotPassword")}
    />
  );
}

// ── Styles ───────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabBar: {
    height: 76,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  tab: {
    flex: 1,
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
