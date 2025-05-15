import { playStaticPrompt, playDynamic } from "./tts";

export async function speak(step) {
  if (step.audioIndex != null) {
    return playStaticPrompt(step.audioIndex);
  }
  // (fallback only if you ever speak free‑form text)
  return playDynamic(step.label);
}
