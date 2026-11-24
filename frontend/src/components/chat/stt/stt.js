// One SpeechRecognition instance shared by the whole app, plus a queue of
// finished transcripts that listenOnce() reads from.
let recognition = null;
let active = false; // true between startRecognition() and stopRecognition()
let muted = false; // true while the app itself is talking (ignore its own voice)
const transcriptQueue = [];

export class ListenTimeoutError extends Error {
  constructor() {
    super("Speech input timeout");
    this.name = "ListenTimeoutError";
  }
}

export function isSpeechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function safeStart() {
  try {
    recognition.start();
  } catch (err) {
    // InvalidStateError means it's already running, which is fine.
    if (err?.name !== "InvalidStateError") {
      console.error("SpeechRecognition start failed:", err);
    }
  }
}

function initRecognition() {
  if (recognition) return;

  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    throw new Error(
      "Speech recognition isn't supported in this browser. Please use Chrome."
    );
  }

  recognition = new Rec();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    // Only look at results added by this event, so nothing is dropped
    // when several phrases finish at once.
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result.isFinal || muted) continue;
      const transcript = result[0].transcript.trim();
      if (transcript) transcriptQueue.push(transcript);
    }
  };

  // Browsers end "continuous" recognition on their own after silence or
  // ~60 seconds. Restart it so the rest of the report can still hear us.
  recognition.onend = () => {
    if (active) setTimeout(() => active && safeStart(), 250);
  };

  recognition.onerror = (event) => {
    const code = event.error || "unknown";
    if (code === "no-speech" || code === "aborted") return; // onend restarts
    console.error("SpeechRecognition error:", code);
    if (code === "not-allowed" || code === "service-not-allowed") {
      active = false; // mic blocked: restarting would just loop
    }
  };
}

/**
 * MUST be called from inside a user gesture (e.g. the Start button click).
 */
export function startRecognition() {
  initRecognition();
  transcriptQueue.length = 0;
  active = true;
  safeStart();
}

export function stopRecognition() {
  active = false;
  muted = false;
  transcriptQueue.length = 0;
  if (recognition) {
    try {
      recognition.abort();
    } catch {
      /* already stopped */
    }
  }
}

/**
 * Ignore anything heard while the app is speaking, so the mic doesn't
 * transcribe the question itself as the answer.
 */
export function setMuted(value) {
  muted = value;
  if (value) transcriptQueue.length = 0;
}

/**
 * Wait for the next finished phrase.
 * @param {{ timeout?: number, signal?: AbortSignal, keepQueued?: boolean }} opts
 *   timeout in ms; signal rejects with its reason when aborted;
 *   keepQueued keeps phrases heard since the last call (walkthrough mode).
 * @returns {Promise<string>} rejects with ListenTimeoutError on timeout
 */
export function listenOnce({ timeout = 20000, signal, keepQueued = false } = {}) {
  // Drop anything left over from before this question was asked.
  if (!keepQueued) transcriptQueue.length = 0;
  const deadline = Date.now() + timeout;
  return new Promise((resolve, reject) => {
    (function poll() {
      if (signal?.aborted) return reject(signal.reason);
      if (!active) return reject(new Error("Listening stopped"));
      if (transcriptQueue.length > 0) {
        return resolve(transcriptQueue.shift());
      }
      if (Date.now() > deadline) return reject(new ListenTimeoutError());
      setTimeout(poll, 100);
    })();
  });
}
