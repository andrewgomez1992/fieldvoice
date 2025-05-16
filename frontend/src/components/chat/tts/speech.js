import { audioCtx, playDynamic } from "./tts";

/**
 * Speak a prompt via the Web Audio API and TTS service.
 *
 * @param {{ label: string }} step
 *   An object containing the text to speak in its `label` property.
 * @returns {Promise<void>}
 *   Resolves when playback has finished.
 */
export async function speak(step) {
  // Resume the shared AudioContext if it’s suspended
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  // Send the text to the TTS endpoint and play it via Web Audio
  await playDynamic(step.label);
}
