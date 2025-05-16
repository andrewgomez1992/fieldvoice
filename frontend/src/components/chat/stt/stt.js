// A single Recognition instance and a transcript queue
let recognition = null;
const transcriptQueue = [];

/**
 * Initialize the singleton recognizer.
 */
function initRecognition() {
  if (recognition) return;
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) throw new Error("SpeechRecognition not supported");
  recognition = new Rec();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  recognition.onresult = (e) => {
    const txt = e.results[e.results.length - 1][0].transcript.trim();
    transcriptQueue.push(txt);
  };
  recognition.onerror = (e) => {
    console.error("SpeechRecognition error:", e.error || e);
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
