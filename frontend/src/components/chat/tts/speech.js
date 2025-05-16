import { audioCtx, playDynamic } from "./tts";

/**
 * Speak any prompt via WebAudio + your /api/tts (Polly) endpoint.
 * This uses the same voice as your MP3s, but never fires a blocked audio.play().
 */
export async function speak(step) {
  // Ensure context is running (won’t throw once unlocked up front)
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  // Directly call dynamic TTS
  await playDynamic(step.label);
}
