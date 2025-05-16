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
 * @param {function} setValue    from react-hook-form
 * @param {object}   callbacks   { onStep(key), onListening(isListening) }
 */
export async function runReportWizard(
  steps,
  setValue,
  { onStep, onListening }
) {
  const data = {};

  // 1) Author
  onStep("author");
  await speakStep(steps.find((s) => s.key === "author"));
  onListening(true);
  data.author = await listenOnce();
  onListening(false);
  data.author = data.author.replace(/\bBoland\b/gi, "Bolin");
  setValue("author", data.author);

  // 2) Date confirmation (not in STEPS)
  onStep("dateConfirm");
  const today = formatDateISO();
  const firstName = data.author.split(" ")[0];
  await playDynamic(
    `Hey ${firstName}, I have the date as ${today}. Is that correct?`
  );
  onListening(true);
  let ans = await listenOnce();
  onListening(false);
  if (ans.toLowerCase().includes("yes")) {
    data.date = today;
  } else {
    await playDynamic("Okay, what's the correct date?");
    onListening(true);
    data.date = await listenOnce();
    onListening(false);
  }
  setValue("date", data.date);

  // 3…n) Loop through the rest (location → moisture)
  for (const step of steps.filter((s) => s.key !== "author")) {
    onStep(step.key);
    await speakStep(step);
    onListening(true);
    const raw = await listenOnce();
    onListening(false);

    switch (step.key) {
      case "desc":
        data.desc = await refineDescription(raw, data.area);
        break;
      case "cause":
        data.cause = await refine(raw, "cause");
        break;
      case "duration":
        data.duration = await refine(raw, "duration");
        break;
      case "moisture":
        data.moisture = normalizeMoisture(raw);
        break;
      default:
        data[step.key] = raw;
    }

    setValue(step.key, data[step.key]);
  }

  // Finalize
  await playDynamic("All set! Your report is complete.");
  const reportText = formatReport(data);
  saveReport(Date.now(), new Date().toISOString(), data);
  return reportText;
}
