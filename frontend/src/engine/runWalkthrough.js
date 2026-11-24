import { listenOnce, ListenTimeoutError } from "../components/chat/stt/stt";
import { formatDateISO } from "../components/chat/helpers/formatDateISO";
import { createVoice, isDone, SKIP, BACK } from "./voiceIO";
import { extractFields } from "./extractFields";
import { fillField } from "./fillField";
import { reviewLoop } from "./review";
import { voiceSteps } from "../templates";

export class FinishRequested extends Error {
  constructor() {
    super("Finish requested");
    this.name = "FinishRequested";
  }
}

/**
 * Walkthrough mode: the inspector just talks while working. Everything is
 * transcribed; the report fills in live as the AI picks out facts. When
 * they say "I'm done" (or tap Finish) the app asks only for what's missing,
 * then runs the review.
 *
 * @param {Object} template
 * @param {Object} opts
 *   setField(key, value), initialData, onStep, onStatus, onSay, signal,
 *   finishSignal  - AbortSignal; aborting it ends the talking phase
 *   onTranscript(phrases[])
 * @returns {Promise<{ data: Object, transcript: string[] }>}
 */
export async function runWalkthrough(
  template,
  {
    setField,
    initialData = {},
    onStep = () => {},
    onStatus,
    onSay,
    onTranscript = () => {},
    signal,
    finishSignal,
  } = {}
) {
  const voice = createVoice({ signal, onStatus, onSay });
  const steps = voiceSteps(template);
  const data = { ...initialData };
  const transcript = [];
  const set = async (key, value) => {
    data[key] = value;
    await setField(key, value);
  };

  // Default the date to today; they can correct it in review.
  for (const s of steps) {
    if (s.type === "date" && !data[s.key]) await set(s.key, formatDateISO());
  }

  // --- Live extraction while they talk (never blocks listening) ---
  let running = null;
  let dirty = false;
  let stopped = false; // set once the final pass starts
  const live = {}; // raw extracted values shown during talking
  const extractNow = () => {
    if (stopped) return running;
    if (running) {
      dirty = true;
      return running;
    }
    running = extractFields(template, transcript, initialData)
      .then(async (found) => {
        for (const [key, value] of Object.entries(found)) {
          if (!stopped && value && value !== live[key]) {
            live[key] = value;
            await setField(key, value);
          }
        }
      })
      .catch((err) => console.warn("Live extraction failed:", err))
      .finally(() => {
        running = null;
        if (dirty) {
          dirty = false;
          extractNow();
        }
      });
    return running;
  };

  try {
    await voice.say(
      "I'm listening. Just talk me through the job as you work. Say I'm done when you're finished."
    );

    // --- Talking phase ---
    voice.idle();
    onStatus?.("recording");
    while (true) {
      let phrase;
      try {
        phrase = await listenOnce({
          timeout: 60000,
          signal: finishSignal,
          keepQueued: true,
        });
      } catch (err) {
        voice.checkCancelled();
        if (err instanceof FinishRequested || finishSignal?.aborted) break;
        if (err instanceof ListenTimeoutError) continue; // quiet is fine
        throw err;
      }
      voice.checkCancelled();
      if (isDone(phrase)) break;
      transcript.push(phrase);
      onTranscript([...transcript]);
      extractNow();
    }

    // --- Build the report from everything that was said ---
    await voice.say("Got it. Putting your report together.");
    voice.think();
    stopped = true;
    while (running) await running;
    let extracted = {};
    if (transcript.length) {
      try {
        extracted = await extractFields(template, transcript, initialData);
      } catch (err) {
        console.error("Extraction failed:", err);
        extracted = { ...live };
      }
    }
    for (const step of steps) {
      if (initialData[step.key]) continue;
      const raw = extracted[step.key];
      if (raw) {
        onStep(step.key);
        await set(step.key, await fillField(step, raw, data));
      }
    }
    onStep(null);

    // --- Ask only for required things that weren't mentioned ---
    const missing = steps.filter((s) => s.required && !data[s.key]);
    if (missing.length) {
      await voice.say(
        missing.length === 1
          ? "Just one thing I didn't catch."
          : `I need ${missing.length} more things from you.`
      );
      for (const step of missing) {
        onStep(step.key);
        const raw = await voice.ask(step.question.replace("{{today}}", "today"), {
          timeout: step.listenTimeout || 20000,
        });
        if (raw && raw !== SKIP && raw !== BACK) {
          voice.think();
          await set(step.key, await fillField(step, raw, data));
        }
      }
      onStep(null);
    }

    await reviewLoop({ voice, template, data, setField: set, onStep });
    await voice.say("All set! Your report is ready to review.");
    return { data, transcript };
  } finally {
    onStep(null);
    voice.idle();
  }
}
