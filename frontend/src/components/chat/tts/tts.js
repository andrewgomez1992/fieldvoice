// Unlock and resume AudioContext for dynamic playback
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Play a pre‑generated static MP3 prompt by its index.
 * Resolves when the audio finishes, or rejects on error.
 *
 * @param {number} index  Index of the MP3 file in /questions (e.g. 0 plays /questions/0.mp3)
 * @returns {Promise<void>}
 */
export function playStaticPrompt(index) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`/questions/${index}.mp3`);
    audio.playsInline = true;
    audio.onended = resolve; // resolve when playback completes
    audio.onerror = reject; // reject if there's a loading/playback error
    audio.play().catch(reject); // start playback, catch any immediate errors
  });
}

/**
 * Generate speech dynamically via TTS endpoint and play it.
 * Uses Axios to fetch the raw MP3 binary (arraybuffer), then decodes
 * it into an AudioBuffer for playback via Web Audio API.
 *
 * Note: responseType: "arraybuffer" tells Axios to treat the response
 * as binary data rather than JSON, which is essential for audio playback.
 *
 * @param {string} text  The text to synthesize
 * @returns {Promise<void>}
 */
export async function playDynamic(text) {
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
  const resp = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) throw new Error("TTS request failed");
  const arrayBuffer = await resp.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const src = audioCtx.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(audioCtx.destination);
  src.start();
  await new Promise((r) => (src.onended = r));
}
