import { playStaticPrompt, playDynamic, audioCtx } from "./tts";

/**
 * Speak a given step’s prompt.
 * 1. Always unlock/resume the shared AudioContext for potential WebAudio fallback.
 * 2. Try the static MP3 (Audio.play()); catch and fallback if blocked.
 * 3. Otherwise, play via dynamic Polly + WebAudio.
 *
 * @param {{ audioIndex?: number, label: string }} step
 */
export async function speak(step) {
  // 1) ensure WebAudio can play
  if (audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
    } catch (err) {
      console.warn("AudioContext.resume() failed:", err);
    }
  }

  // 2) static MP3 first
  if (step.audioIndex != null) {
    try {
      await playStaticPrompt(step.audioIndex);
      return;
    } catch (err) {
      console.warn(
        `Static prompt #${step.audioIndex} blocked or failed; falling back:`,
        err
      );
    }
  }

  // 3) fallback to WebAudio dynamic TTS
  await playDynamic(step.label);
}
