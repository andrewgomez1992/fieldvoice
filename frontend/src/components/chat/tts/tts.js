import { setMuted } from "../stt/stt";

// Shared AudioContext. It starts suspended until a user gesture resumes it.
export const audioCtx = new (window.AudioContext ||
  window.webkitAudioContext)();

let currentSource = null;
let pollyAvailable = true; // flips to false after a failed /api/tts call

/** Stop whatever is currently being spoken. */
export function stopSpeaking() {
  try {
    currentSource?.stop();
  } catch {
    /* not playing */
  }
  currentSource = null;
  window.speechSynthesis?.cancel();
}

async function playPolly(text) {
  const resp = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) {
    throw new Error(`TTS request failed: ${resp.status} ${resp.statusText}`);
  }
  const arrayBuffer = await resp.arrayBuffer();

  // Callback-based decode for older mobile Safari.
  const audioBuffer = await new Promise((resolve, reject) => {
    audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
  });

  const src = audioCtx.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(audioCtx.destination);
  currentSource = src;
  await new Promise((resolve) => {
    src.onended = resolve;
    src.start();
  });
  currentSource = null;
}

/** Built-in browser voice, used if the Polly endpoint is down. */
function playBrowserVoice(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Speak text out loud. Uses AWS Polly through /api/tts, and falls back to
 * the browser's own voice if that fails, so one bad request never kills
 * the whole report. The mic ignores input while this is playing.
 *
 * @param {string} text
 * @returns {Promise<void>} resolves when speech has finished
 */
export async function playDynamic(text) {
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  setMuted(true);
  try {
    if (pollyAvailable) {
      try {
        await playPolly(text);
        return;
      } catch (err) {
        console.warn("Polly TTS failed, using browser voice instead:", err);
        pollyAvailable = false;
      }
    }
    await playBrowserVoice(text);
  } finally {
    // Short pause so the tail of our own audio isn't picked up by the mic.
    await new Promise((r) => setTimeout(r, 300));
    setMuted(false);
  }
}
