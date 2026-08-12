import { setAudioModeAsync } from "expo-audio";

// Called once at startup, before any narration can play.
//
// playsInSilentMode: a child tapping "read aloud" and getting silence because
// the phone's ringer switch is off reads as a broken app, not a muted one —
// the tap is an explicit request for sound.
//
// shouldPlayInBackground: false — narration belongs to the page on screen.
// Nothing should keep talking after the app is backgrounded.
export async function configureAudio(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      // Story narration is the focus while it plays; ducking other audio
      // rather than mixing keeps the reading calm and intelligible.
      interruptionMode: "duckOthers",
    });
  } catch {
    // A failed audio-session config must never block app startup — playback
    // still works with the platform defaults.
  }
}
