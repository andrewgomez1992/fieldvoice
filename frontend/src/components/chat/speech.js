import { playStaticPrompt, playDynamic } from "./tts";

/**
 * Speak a given step’s prompt.
 * If the step includes an audioIndex, play its pre‑generated MP3;
 * otherwise, fall back to dynamic TTS of the step’s label.
 *
 *
 * @param {{ audioIndex?: number, label: string }} step
 * @returns {Promise<void>}
 */
export async function speak(step) {
  // If we have a matching static MP3, play that first
  if (step.audioIndex != null) {
    return playStaticPrompt(step.audioIndex);
  }
  // Otherwise, synthesize and play the label via TTS
  return playDynamic(step.label);
}
