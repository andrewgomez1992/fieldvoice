import { STEPS } from "./steps";
import { speak as speakStep } from "../../chat/tts/speech";
import { playDynamic } from "../../chat/tts/tts";
import { listenOnce } from "../../chat/stt/stt";
import { saveReport, formatReport } from "./reportGenerator";
import {
  formatDateISO,
  refine,
  normalizeMoisture,
  refineDescription,
} from "../../chat/helpers";

/**
 * Main report‑wizard flow.
 *
 * @param {Array}   steps    — pass in your STEPS array here
 * @param {Function} setValue  from react-hook-form
 * @param {Object}   callbacks { onStep(key), onListening(isListening) }
 */
export async function runReportWizard(
  steps,
  setValue,
  { onStep, onListening }
) {
  const data = {};

  // 1) Author
  const authorStep = steps.find((s) => s.key === "author");
  onStep(authorStep.key);
  await speakStep(authorStep);
  onListening(true);
  data.author = await listenOnce();
  onListening(false);
  data.author = data.author.replace(/\bBoland\b/gi, "Bolin");
  setValue("author", data.author);

  // Grab first name for later
  const firstName = data.author.split(" ")[0];

  // 2) Date confirmation (not in STEPS)
  onStep("date");
  const today = formatDateISO();
  await playDynamic(
    `Hey ${firstName}, I have the date as ${today}. Is that correct?`
  );
  onListening(true);
  let ans = await listenOnce();
  onListening(false);
  data.date = ans.toLowerCase().includes("yes")
    ? today
    : await (async () => {
        await playDynamic("Okay, what's the correct date?");
        onListening(true);
        const res = await listenOnce();
        onListening(false);
        return res;
      })();
  setValue("date", data.date);

  // 3→n) The rest: location → moisture
  for (const key of [
    "location",
    "area",
    "desc",
    "cause",
    "duration",
    "moisture",
  ]) {
    const step = steps.find((s) => s.key === key);
    onStep(key);
    await speakStep(step);
    onListening(true);

    // longer timeout for description
    const raw =
      key === "desc"
        ? await listenOnce({ timeout: 20000, attempts: 3 })
        : await listenOnce();
    onListening(false);

    // transform raw → data[key]
    if (key === "desc") {
      data.desc = await refineDescription(raw, data.area);
    } else if (key === "cause") {
      data.cause = await refine(raw, "cause");
    } else if (key === "duration") {
      data.duration = await refine(raw, "duration");
    } else if (key === "moisture") {
      data.moisture = normalizeMoisture(raw);
    } else {
      data[key] = raw;
    }

    setValue(key, data[key]);
  }

  // 9) Corrections loop
  while (true) {
    await playDynamic(
      "Would you like to correct any field? Say the field name or 'no'."
    );
    const field = (await listenOnce()).toLowerCase();
    if (field.includes("no")) break;

    const keyMap = {
      author: "author",
      date: "date",
      location: "location",
      area: "area",
      cause: "cause",
      duration: "duration",
      moisture: "moisture",
    };
    const key = keyMap[field];
    if (!key) {
      await playDynamic("I didn't understand that field name.");
      continue;
    }

    // Re‑prompt with the same STEPS label
    const correctionStep = steps.find((s) => s.key === key);
    await speakStep(correctionStep);
    onListening(true);
    const raw = await listenOnce();
    onListening(false);

    const val =
      key === "cause" || key === "duration" ? await refine(raw, key) : raw;
    data[key] = val;
    setValue(key, val);

    await playDynamic(`${correctionStep.label} updated.`);
  }

  // 10) Done
  await playDynamic("All set! Your report is complete.");
  const finalText = formatReport(data);
  saveReport(Date.now(), new Date().toISOString(), data);
  return finalText;
}
