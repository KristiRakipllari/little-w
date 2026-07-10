import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import Btn from "@/components/Btn";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";

interface Props {
  storyTitle: string;
  onReadAgain: () => void;
  onBackToStories: () => void;
}

interface ConfettiSpec {
  id: number;
  left: number; // % of screen width
  delay: number; // ms
  dur: number; // ms
  size: number;
  color: string;
  round: boolean;
  drift: number; // px of horizontal drift over the fall
}

// One falling confetti piece, looping gently from top to bottom.
function ConfettiPiece({
  spec,
  fallHeight,
}: {
  spec: ConfettiSpec;
  fallHeight: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: spec.dur,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, spec.delay, spec.dur]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, fallHeight + 20],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spec.drift],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 0.9, 0.9],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: `${spec.left}%`,
        width: spec.size,
        height: spec.round ? spec.size : spec.size * 0.5,
        backgroundColor: spec.color,
        borderRadius: spec.round ? spec.size / 2 : 2,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

export default function StoryComplete({
  storyTitle,
  onReadAgain,
  onBackToStories,
}: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const motion = useAppStore((s) => s.motion);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();
  const { height } = useWindowDimensions();

  // Respects the Animations setting: "off" renders everything static,
  // "slow" keeps the celebration but eases the pace right down.
  const animate = motion !== "off";
  const pace = motion === "slow" ? 1.6 : 1;

  // Gentle, soft confetti pieces (deterministic spread — no randomness needed)
  const pieces = useMemo<ConfettiSpec[]>(() => {
    const colors = [
      theme.primary,
      theme.secondary,
      theme.accent,
      theme.primaryDeep,
      theme.secondaryShade,
    ];
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: (i * 37) % 100,
      delay: (i % 10) * 220 * pace,
      dur: (3200 + (i % 5) * 500) * pace,
      size: 8 + (i % 4) * 3,
      color: colors[i % colors.length],
      round: i % 3 === 0,
      drift: ((i % 5) - 2) * 14,
    }));
  }, [theme, pace]);

  // Star badge: pop in once, then a soft pulse.
  const pop = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.spring(pop, {
      toValue: 1,
      damping: 12,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1200 * pace,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200 * pace,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const timer = setTimeout(() => pulseLoop.start(), 500 * pace);
    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, [animate, pace, pop, pulse]);

  const popScale = pop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Confetti layer */}
      {animate && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {pieces.map((p) => (
            <ConfettiPiece key={p.id} spec={p} fallHeight={height} />
          ))}
        </View>
      )}

      <View style={styles.center}>
        {/* Star badge */}
        <Animated.View
          style={[
            styles.badgeOuter,
            {
              backgroundColor: theme.secondarySoft,
              shadowColor: theme.shadow,
              opacity: pop,
              transform: [{ scale: popScale }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.badgeInner,
              {
                backgroundColor: theme.secondary,
                transform: [{ scale: pulse }],
              },
            ]}
          >
            <Svg width={52} height={52} viewBox="0 0 52 52">
              <Path
                d="M26 4l6.6 13.4L47 19.5l-10.5 10.2L39 44 26 37.2 13 44l2.5-14.3L5 19.5l14.4-2.1z"
                fill="#fff"
              />
            </Svg>
          </Animated.View>
        </Animated.View>

        <Text style={[styles.title, { color: theme.textDark }]}>
          {t("storyComplete.title")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textLight }]}>
          {t("storyComplete.subtitle", { story: storyTitle })}
        </Text>
      </View>

      <View style={styles.footer}>
        <Btn t={theme} onPress={onReadAgain}>
          {t("storyComplete.readAgain")}
        </Btn>
        <Btn
          t={theme}
          variant="secondary"
          onPress={onBackToStories}
          style={styles.backBtn}
        >
          {t("storyComplete.backToStories")}
        </Btn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  badgeOuter: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  badgeInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 28,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 26,
  },
  backBtn: {
    marginTop: 10,
  },
});
