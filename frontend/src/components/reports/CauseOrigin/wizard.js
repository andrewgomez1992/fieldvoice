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
export const runReportWizard = async (setValue, { onStep, onListening }) => {
  const data = {};

  // 1) Author
  onStep("author");
  await speakStep(STEPS.find((s) => s.key === "author"));
  onListening(true);
  data.author = await listenOnce();
  onListening(false);
  // Owners last name is Bolin, AI seems to input Boland. Force to Bolin.
  data.author = data.author.replace(/\bBoland\b/gi, "Bolin");
  setValue("author", data.author);

  // 2) Date confirmation
  const today = formatDateISO();
  const firstName = data.author.split(" ")[0];
  onStep("dateConfirm");
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

  // 3…n) The remaining STEPS (location → moisture)
  for (const step of STEPS.filter((s) => s.key !== "author")) {
    onStep(step.key);
    await speakStep(step);
    onListening(true);
    const raw = await listenOnce();
    onListening(false);

    if (step.key === "desc") {
      data.desc = await refineDescription(raw, data.area);
    } else if (step.key === "cause") {
      data.cause = await refine(raw, "cause");
    } else if (step.key === "duration") {
      data.duration = await refine(raw, "duration");
    } else if (step.key === "moisture") {
      data.moisture = normalizeMoisture(raw);
    } else {
      data[step.key] = raw;
    }
    setValue(step.key, data[step.key]);
  }

  // Finalize
  await playDynamic("All set! Your report is complete.");
  const reportText = formatReport(data);
  saveReport(Date.now(), new Date().toISOString(), data);
  return reportText;
};
