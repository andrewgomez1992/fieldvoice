import { STEPS } from "./steps";
import { chat } from "./chatApi";
import { speak as speakStep } from "./speech";
import { playDynamic } from "./tts";
import { listenOnce } from "./stt";
import { saveReport, formatReport } from "./reportGenerator";

/** Format date as YYYY-MM-DD */
function formatDateISO(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Summarize cause or duration via ChatGPT
async function refine(text, type) {
  const prompt =
    type === "cause"
      ? `Summarize this as a brief cause phrase: "${text}".`
      : `Summarize this as a concise duration phrase: "${text}".`;
  const summary = await chat([
    { role: "system", content: "You are a concise summarizer." },
    { role: "user", content: prompt },
  ]);
  let s = summary.trim().replace(/\.$/, "");
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// Normalize moisture readings wording
function normalizeMoisture(text) {
  let t = text.trim().replace(/\.$/, "");
  if (!/reading(s)?$/i.test(t)) {
    t = `${t} readings`;
  }
  return t;
}

// Refine description into a three-sentence template
async function refineDesc(rawDesc, area) {
  const prompt = `
You are a technical writer. Convert the user's description into exactly:
I began by flow testing the nearby ${area} and found them to be free of any leaks.
Upon close inspection of the damage I found most of the damage {damage_location}.
I then flow tested the ${area} and found a {leak_description}.
User description: "${rawDesc}"
Please fill in {damage_location} and {leak_description}.
`.trim();

  const output = await chat([
    { role: "system", content: "You are a precision writer." },
    { role: "user", content: prompt },
  ]);
  return output.trim();
}

/**
 * Main report‐wizard flow.
 *
 * @param {function} setValue    from react-hook-form
 * @param {object}   callbacks   { onStep(key), onListening(isListening) }
 */
export async function runReportWizard(setValue, { onStep, onListening }) {
  const data = {};

  // 1) Author
  onStep("author");
  await speakStep(STEPS.find((s) => s.key === "author"));
  onListening(true);
  data.author = await listenOnce();
  onListening(false);
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
    await speakStep(step); // <<— correct invocation
    onListening(true);
    const raw = await listenOnce();
    onListening(false);

    if (step.key === "desc") {
      data.desc = await refineDesc(raw, data.area);
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
}
