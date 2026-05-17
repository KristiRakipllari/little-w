import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import ScreenHeader from "@/components/ScreenHeader";
import Card from "@/components/Card";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  onBack: () => void;
  onPass: () => void;
}

function generateProblem() {
  const a = 4 + Math.floor(Math.random() * 6); // 4–9
  const b = 3 + Math.floor(Math.random() * 6); // 3–8
  const correct = a + b;
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = correct + (Math.floor(Math.random() * 7) - 3);
    if (d !== correct && d > 0 && d !== a && d !== b) wrongs.add(d);
  }
  const options = [...wrongs, correct].sort(() => Math.random() - 0.5);
  return { a, b, correct, options };
}

export default function GrownupGateScreen({ onBack, onPass }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  const [problem] = useState(generateProblem);
  const [tapped, setTapped] = useState<number | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleTap = (n: number) => {
    setTapped(n);
    if (n === problem.correct) {
      setTimeout(onPass, 250);
    } else {
      shake();
      setTimeout(() => setTapped(null), 600);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title={t("grownupGate.headerTitle")}
        t={theme}
        onBack={onBack}
      />

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.textLight }]}>
          {t("grownupGate.subtitle")}
        </Text>
        <Text style={[styles.heading, { color: theme.textDark }]}>
          {t("grownupGate.heading")}
        </Text>

        <Card t={theme} style={styles.problemCard}>
          <Animated.Text
            style={[
              styles.problemText,
              { color: theme.textDark, transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {problem.a} + {problem.b}
          </Animated.Text>
        </Card>

        <View style={styles.optionsGrid}>
          {problem.options.map((n) => {
            const isThis = tapped === n;
            const isCorrect = isThis && n === problem.correct;
            const isWrong = isThis && n !== problem.correct;

            let bg = theme.surface;
            let color = theme.textDark;
            if (isCorrect) {
              bg = theme.success;
              color = "#fff";
            } else if (isWrong) {
              bg = theme.accent;
              color = "#fff";
            }

            return (
              <TouchableOpacity
                key={n}
                onPress={() => handleTap(n)}
                disabled={tapped !== null && !isWrong}
                activeOpacity={0.85}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: bg,
                    shadowColor: isCorrect || isWrong ? "transparent" : theme.textDark,
                  },
                ]}
              >
                <Text style={[styles.optionText, { color }]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.spacer} />

        <Text style={[styles.footerNote, { color: theme.textLight }]}>
          {t("grownupGate.footerNote")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 28,
    textAlign: "center",
  },
  problemCard: {
    padding: 28,
    paddingHorizontal: 32,
    marginBottom: 32,
    alignItems: "center",
  },
  problemText: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    width: "100%",
    maxWidth: 280,
  },
  optionBtn: {
    width: "46%",
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  optionText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  spacer: { flex: 1 },
  footerNote: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
});
