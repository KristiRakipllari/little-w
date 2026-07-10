import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";
import { useAppStore } from "@/store/appStore";
import { useTranslation } from "@/i18n";
import { getThemeById } from "@calm-stories/shared";
import type { AppTheme } from "@calm-stories/shared";

interface Props {
  onFinish: () => void;
}

// Phases: 0=book-lands → 1=cover-opens → 2=title-rises → 3=done
const BOOK_W = 150;
const BOOK_H = 200;

const SPARKLES = [
  { x: -52, y: -68, d: 0, s: 10 },
  { x: 60, y: -58, d: 150, s: 8 },
  { x: -70, y: 10, d: 80, s: 7 },
  { x: 72, y: 20, d: 220, s: 9 },
  { x: -30, y: 70, d: 50, s: 6 },
  { x: 38, y: 72, d: 180, s: 7 },
];

// The night scene revealed under the cover.
function InnerPages({ theme }: { theme: AppTheme }) {
  return (
    <View style={[styles.pages, { shadowColor: theme.shadow }]}>
      <Svg width={BOOK_W} height={BOOK_H} viewBox={`0 0 ${BOOK_W} ${BOOK_H}`}>
        <Rect width="150" height="124" fill={theme.primarySoft} />
        <Rect y="122" width="150" height="78" fill={theme.secondarySoft} />
        {/* Moon */}
        <Circle cx="104" cy="46" r="21" fill={theme.secondary} opacity={0.85} />
        <Circle cx="114" cy="36" r="13" fill={theme.primarySoft} />
        {/* Stars */}
        <Circle cx="28" cy="22" r="2.4" fill={theme.secondary} opacity={0.7} />
        <Circle cx="50" cy="14" r="1.7" fill={theme.secondary} opacity={0.6} />
        <Circle cx="68" cy="28" r="1.9" fill={theme.secondary} opacity={0.5} />
        <Circle cx="16" cy="42" r="1.5" fill={theme.secondary} opacity={0.5} />
        <Circle cx="132" cy="20" r="1.9" fill={theme.secondary} opacity={0.6} />
        {/* House */}
        <Rect x="18" y="112" width="34" height="26" rx="2" fill={theme.primary} opacity={0.7} />
        <Polygon points="18,112 52,112 35,94" fill={theme.primaryDeep} opacity={0.8} />
        <Rect x="31" y="125" width="9" height="13" rx="2" fill="#fff" opacity={0.7} />
        <Rect x="22" y="118" width="8" height="8" rx="1" fill="#fff" opacity={0.5} />
        {/* Trees */}
        <Rect x="82" y="122" width="5" height="18" rx="2" fill={theme.primaryDeep} opacity={0.5} />
        <Circle cx="85" cy="110" r="16" fill={theme.primary} opacity={0.45} />
        <Circle cx="85" cy="102" r="12" fill={theme.primary} opacity={0.55} />
        <Rect x="120" y="130" width="4" height="12" rx="2" fill={theme.primaryDeep} opacity={0.4} />
        <Circle cx="122" cy="120" r="11" fill={theme.primary} opacity={0.38} />
        {/* Flowers */}
        <Circle cx="12" cy="142" r="2.8" fill={theme.secondary} opacity={0.5} />
        <Circle cx="60" cy="146" r="2.4" fill={theme.secondary} opacity={0.45} />
        <Circle cx="140" cy="140" r="2.8" fill={theme.secondary} opacity={0.5} />
        {/* Page lines */}
        <Line x1="24" y1="162" x2="126" y2="162" stroke={theme.primary} strokeWidth="1.2" opacity={0.14} />
        <Line x1="24" y1="174" x2="106" y2="174" stroke={theme.primary} strokeWidth="1.2" opacity={0.1} />
        <Line x1="24" y1="186" x2="114" y2="186" stroke={theme.primary} strokeWidth="1.2" opacity={0.1} />
      </Svg>
      {/* Spine shadow */}
      <LinearGradient
        colors={["rgba(44,62,80,0.28)", "rgba(44,62,80,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.spineShadow}
      />
    </View>
  );
}

// Front artwork of the closed cover.
function CoverArt({ theme, title }: { theme: AppTheme; title: string }) {
  return (
    <LinearGradient
      colors={[theme.primary, theme.primaryDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.coverFace}
    >
      <View style={styles.coverRing} />
      <Svg width={68} height={68} viewBox="0 0 72 72">
        <Circle cx="36" cy="36" r="32" fill="rgba(255,255,255,0.08)" />
        <Path d="M40 14a20 20 0 1 0 18 18A16 16 0 0 1 40 14z" fill="rgba(255,255,255,0.85)" />
        <Circle cx="20" cy="20" r="2.5" fill="rgba(255,255,255,0.75)" />
        <Circle cx="56" cy="18" r="1.8" fill="rgba(255,255,255,0.65)" />
        <Circle cx="58" cy="48" r="2.2" fill="rgba(255,255,255,0.55)" />
        <Circle cx="15" cy="50" r="1.6" fill="rgba(255,255,255,0.45)" />
        <Circle cx="34" cy="60" r="1.4" fill="rgba(255,255,255,0.4)" />
      </Svg>
      <Text style={styles.coverTitle}>{title.toUpperCase()}</Text>
    </LinearGradient>
  );
}

// One star that pops in around the book once the cover starts opening.
function Sparkle({
  x,
  y,
  delay,
  size,
  color,
  pace,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
  color: string;
  pace: number;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay * pace),
      Animated.timing(v, {
        toValue: 1,
        duration: 600 * pace,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [v, delay, pace]);

  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const opacity = v.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1, 0.85],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 120 + x * 1.4 - size,
        top: 120 + y * 1.3 - size,
        opacity,
        transform: [{ scale }, { rotate: "15deg" }],
      }}
    >
      <Svg width={size * 2.2} height={size * 2.2} viewBox="0 0 20 20">
        <Path
          d="M10 0l2.2 7.8H20l-6.4 4.6 2.4 7.6L10 15.2l-6 4.8 2.4-7.6L0 7.8h7.8z"
          fill={color}
          opacity={0.9}
        />
      </Svg>
    </Animated.View>
  );
}

export default function SplashScreen({ onFinish }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const motion = useAppStore((s) => s.motion);
  const theme = getThemeById(themeId);
  const { t } = useTranslation();

  // Animations=Off shows the finished scene (open book + title) with no motion.
  const animate = motion !== "off";
  const pace = motion === "slow" ? 1.6 : 1;

  const [phase, setPhase] = useState(animate ? 0 : 2);

  const land = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const cover = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const title = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const subtitle = useRef(new Animated.Value(animate ? 0 : 1)).current;

  // Phase timeline: 0=book-lands → 1=cover-opens → 2=title-rises → 3=done
  useEffect(() => {
    if (!animate) {
      const t1 = setTimeout(onFinish, 1400);
      return () => clearTimeout(t1);
    }
    const t1 = setTimeout(() => setPhase(1), 600 * pace);
    const t2 = setTimeout(() => setPhase(2), 2000 * pace);
    const t3 = setTimeout(() => setPhase(3), 3200 * pace);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [animate, pace]);

  useEffect(() => {
    if (phase === 3) onFinish();
  }, [phase]);

  // Book lands with a soft bounce.
  useEffect(() => {
    if (!animate) return;
    Animated.spring(land, {
      toValue: 1,
      damping: 13,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [animate, land]);

  // Cover swings open once the book has landed.
  useEffect(() => {
    if (!animate || phase < 1) return;
    Animated.timing(cover, {
      toValue: 1,
      duration: 1200 * pace,
      delay: 200 * pace,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }).start();
  }, [animate, phase, pace, cover]);

  // Title, then subtitle, rise into place.
  useEffect(() => {
    if (!animate || phase < 2) return;
    Animated.stagger(150 * pace, [
      Animated.timing(title, {
        toValue: 1,
        duration: 500 * pace,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
      Animated.timing(subtitle, {
        toValue: 1,
        duration: 500 * pace,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animate, phase, pace, title, subtitle]);

  const landY = land.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const landScale = land.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  // The open cover extends left of the spine, so as it opens, nudge the book
  // right and zoom out slightly to keep the whole spread visually centered.
  const bookShift = cover.interpolate({ inputRange: [0, 1], outputRange: [0, 36] });
  const bookZoom = cover.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] });
  const rotateY = cover.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-158deg"],
  });
  // Swap faces at the halfway point (90° of the 158° swing) — no native
  // backface-visibility needed.
  const frontOpacity = cover.interpolate({
    inputRange: [0, 0.56, 0.57, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = cover.interpolate({
    inputRange: [0, 0.56, 0.57, 1],
    outputRange: [0, 0, 1, 1],
  });
  const titleY = title.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const subtitleY = subtitle.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* ── Book + sparkles ── */}
      <View style={styles.stage}>
        {phase >= 1 &&
          animate &&
          SPARKLES.map((sp, i) => (
            <Sparkle
              key={i}
              x={sp.x}
              y={sp.y}
              delay={sp.d}
              size={sp.s}
              color={theme.secondary}
              pace={pace}
            />
          ))}

        <Animated.View
          style={[
            styles.book,
            {
              opacity: land,
              transform: [
                { translateY: landY },
                { translateX: bookShift },
                { scale: Animated.multiply(landScale, bookZoom) },
              ],
            },
          ]}
        >
          <InnerPages theme={theme} />

          {/* Cover, hinged on the spine */}
          <Animated.View
            style={[
              styles.cover,
              {
                transform: [{ perspective: 600 }, { rotateY }],
              },
            ]}
          >
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: frontOpacity }]}>
              <CoverArt theme={theme} title={t("splash.title")} />
            </Animated.View>
            {/* Back of the cover (visible once past 90°) */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.coverBack,
                { backgroundColor: theme.primaryDeep, opacity: backOpacity },
              ]}
            />
          </Animated.View>
        </Animated.View>
      </View>

      {/* ── Title block — always below the book ── */}
      <View style={styles.titleBlock}>
        <Animated.Text
          style={[
            styles.title,
            { color: theme.textDark, opacity: title, transform: [{ translateY: titleY }] },
          ]}
        >
          {t("splash.title")}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.subtitle,
            {
              color: theme.textLight,
              opacity: subtitle,
              transform: [{ translateY: subtitleY }],
            },
          ]}
        >
          {t("splash.subtitle")}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  stage: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  book: {
    width: BOOK_W,
    height: BOOK_H,
  },
  pages: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "#FFFDF6",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  spineShadow: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    transformOrigin: "left",
    zIndex: 2,
  },
  coverFace: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "hidden",
  },
  coverRing: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 26,
    borderColor: "rgba(255,255,255,0.06)",
    top: -58,
    right: -58,
  },
  coverTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    opacity: 0.92,
  },
  coverBack: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  titleBlock: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 6,
  },
});
