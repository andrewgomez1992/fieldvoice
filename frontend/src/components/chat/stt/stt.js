// A single Recognition instance and a transcript queue
let recognition = null;
const transcriptQueue = [];

/**
 * Set up the browser’s SpeechRecognition once and only once.
 *
 * - Creates a single SpeechRecognition instance (singleton) so we don’t
 *   accidentally start multiple recognizers.
 * - Configures it for continuous listening with finalized results only.
 * - Pushes each complete transcript into our in‑memory queue.
 * - Logs any errors that occur during recognition.
 */
function initRecognition() {
  // If we already created it, do nothing
  if (recognition) return;

  // Pick the correct constructor for the current browser
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) throw new Error("SpeechRecognition not supported");

  // Create and configure the recognizer
  recognition = new Rec();
  recognition.continuous = true; // keep listening until we explicitly stop
  recognition.interimResults = false; // only emit final transcripts, not partial ones
  recognition.lang = "en-US"; // listening language

  // Every time the user finishes speaking, push that transcript into our queue
  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1];
    const transcript = lastResult[0].transcript.trim();
    transcriptQueue.push(transcript);
  };

  recognition.onerror = (event) => {
    console.error("SpeechRecognition error:", event.error || event);
  };
}

/**
 * MUST be called from inside a user gesture (e.g. your Start button click).
 * Starts continuous recognition and fills transcriptQueue.
 */
export function startRecognition() {
  initRecognition();
  recognition.start();
}

/**
 * Reads one transcript from the queue. Never calls .start() itself.
 * @param {object} opts  { timeout } in ms
 * @returns {Promise<string>}
 */
export async function listenOnce({ timeout = 20000 } = {}) {
  const deadline = Date.now() + timeout;
  return new Promise((resolve, reject) => {
    (function poll() {
      if (transcriptQueue.length > 0) {
        return resolve(transcriptQueue.shift());
      }
      if (Date.now() > deadline) {
        return reject(new Error("Speech input timeout"));
      }
      setTimeout(poll, 100);
    })();
  });
}
