const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playStaticPrompt(index) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`/questions/${index}.mp3`);
    audio.playsInline = true;
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}

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
