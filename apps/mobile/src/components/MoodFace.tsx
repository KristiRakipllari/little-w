import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import type { MoodId } from "@/store/moodStore";

// Display order + colours for the four moods, shared by the check-in screen and
// the parent dashboard. Colours are semantic to the emotion (theme-independent).
export const MOOD_ORDER: MoodId[] = ["happy", "okay", "worried", "angry"];

export const MOOD_STYLES: Record<MoodId, { face: string; ring: string }> = {
  happy: { face: "#F4C95D", ring: "#E0A93B" },
  okay: { face: "#8FC79A", ring: "#5FA078" },
  worried: { face: "#8FB3DC", ring: "#5C88BD" },
  angry: { face: "#E89C8C", ring: "#C97363" },
};

// Simple, friendly line faces per mood (functional UI, not illustration).
export function MoodFace({
  id,
  color,
  ring,
  size = 72,
}: {
  id: MoodId;
  color: string;
  ring: string;
  size?: number;
}) {
  const stroke = ring;
  const sw = 3.4;
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Circle cx={36} cy={36} r={33} fill={color} />

      {/* Eyes / brows */}
      {id === "angry" ? (
        <>
          <Path d="M20 27l9 4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M52 27l-9 4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </>
      ) : id === "worried" ? (
        <>
          <Path d="M22 28q4-4 8 0" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
          <Path d="M42 28q4-4 8 0" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={26} cy={30} r={3.4} fill={stroke} />
          <Circle cx={46} cy={30} r={3.4} fill={stroke} />
        </>
      )}

      {/* Mouths */}
      {id === "happy" && (
        <Path d="M24 44q12 12 24 0" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      )}
      {id === "okay" && (
        <Path d="M26 47h20" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      )}
      {id === "worried" && (
        <Path d="M26 50q10-8 20 0" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      )}
      {id === "angry" && (
        <Path d="M26 51q10-7 20 0" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      )}
    </Svg>
  );
}
