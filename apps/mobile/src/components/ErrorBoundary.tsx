import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Btn from "@/components/Btn";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

// Calm, theme-styled fallback: a render crash must never become a sudden
// white screen for a child mid-story. Copy stays soft and translated.
function CalmFallback({ onRetry }: { onRetry: () => void }) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.textDark }]}>
        {t("common.errorTitle")}
      </Text>
      <Text style={[styles.body, { color: theme.textDark }]}>
        {t("common.errorBody")}
      </Text>
      <Btn t={theme} onPress={onRetry} fullWidth={false} style={styles.btn}>
        {t("common.errorRetry")}
      </Btn>
    </View>
  );
}

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <CalmFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 12,
  },
  btn: {
    paddingHorizontal: 32,
  },
});
