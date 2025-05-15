import { speak } from "../tts/speech";

export async function listenOnce({ timeout = 20000, attempts = 3 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Rec) throw new Error("SpeechRecognition not supported");
      const r = new Rec();
      r.lang = "en-US";
      r.interimResults = false;
      r.maxAlternatives = 1;

      const transcript = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          r.onerror = null;
          r.onresult = null;
          r.stop();
          reject("timeout");
        }, timeout);

        r.onresult = (e) => {
          clearTimeout(timer);
          r.onerror = null;
          r.onresult = null;
          r.stop(); // ◀ stop the recognizer on success
          resolve(e.results[0][0].transcript.trim());
        };
        r.onerror = (e) => {
          clearTimeout(timer);
          r.onerror = null;
          r.onresult = null;
          r.stop();
          reject(e.error || "recognition error");
        };

        r.start();
      });

      return transcript;
    } catch (err) {
      if (i < attempts - 1) {
        await speak("I didn't catch that. Please repeat.");
      } else {
        throw new Error(`Speech input failed: ${err}`);
      }
    }
  }
}
