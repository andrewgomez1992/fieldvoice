import { speak } from "../components/chat/tts/speech";
import { playDynamic } from "../components/chat/tts/tts";
import { listenOnce } from "../components/chat/stt/stt";
import { formatDateISO } from "../components/chat/helpers/formatDateISO";
import { applyRefine } from "./applyRefine";
import { applyNormalize } from "./applyNormalize";
import { formatOutput, saveReport } from "./formatOutput";

/**
 * Run a voice-driven report wizard from a template definition.
 *
 * @param {Object} template - The template object (from JSON)
 * @param {Function} setValue - react-hook-form setValue
 * @param {Object} callbacks - { onStep(key), onListening(bool) }
 * @returns {Promise<string>} The formatted report text
 */
export async function runWizard(template, setValue, { onStep, onListening }) {
  const data = {};
  const voiceSteps = template.steps.filter(
    (s) => s.type !== "photo" && s.type !== "signature"
  );

  for (const step of voiceSteps) {
    console.log(`[wizard] step: ${step.key} (${step.type})`);
    onStep(step.key);

    // --- Date with auto-confirm ---
    if (step.type === "date" && step.autoConfirm) {
      const today = formatDateISO();
      const question = step.question.replace("{{today}}", today);
      await playDynamic(question);
      onListening(true);
      const ans = await listenOnce();
      onListening(false);

      if (ans.toLowerCase().includes("yes")) {
        data[step.key] = today;
      } else {
        await playDynamic("Okay, what's the correct date?");
        onListening(true);
        data[step.key] = await listenOnce();
        onListening(false);
      }
      setValue(step.key, data[step.key]);
      console.log(`[wizard] ${step.key} = "${data[step.key]}"`);
      continue;
    }

    // --- Text / textarea / number / select ---
    await speak({ label: step.question });
    onListening(true);
    const timeout = step.listenTimeout || 20000;
    const raw = await listenOnce({ timeout });
    onListening(false);
    console.log(`[wizard] ${step.key} raw = "${raw}"`);

    // Apply AI refinement if configured
    let value = raw;
    if (step.refine) {
      console.log(`[wizard] refining ${step.key}...`);
      value = await applyRefine(raw, step.refine, data);
      console.log(`[wizard] ${step.key} refined = "${value}"`);
    }

    // Apply normalization if configured
    if (step.normalize) {
      value = applyNormalize(value, step.normalize);
    }

    data[step.key] = value;
    setValue(step.key, value);
    console.log(`[wizard] ${step.key} done`);
  }

  // --- Corrections loop ---
  const keyMap = {};
  for (const step of voiceSteps) {
    keyMap[step.key.toLowerCase()] = step.key;
    // Also map the label so users can say "duration" or "moisture reading"
    keyMap[step.label.toLowerCase()] = step.key;
  }

  while (true) {
    await playDynamic(
      "Would you like to correct any field? Say the field name or 'no'."
    );
    const field = (await listenOnce()).toLowerCase();
    if (field.includes("no")) break;

    // Try to match what the user said to a field key or label
    const matchedKey =
      keyMap[field] || Object.keys(keyMap).find((k) => field.includes(k));
    const key = matchedKey ? keyMap[matchedKey] || matchedKey : null;

    if (!key) {
      await playDynamic("I didn't understand that field name.");
      continue;
    }

    const correctionStep = voiceSteps.find((s) => s.key === key);
    if (!correctionStep) {
      await playDynamic("I didn't understand that field name.");
      continue;
    }

    await speak({ label: correctionStep.question });
    onListening(true);
    const raw = await listenOnce();
    onListening(false);

    let val = raw;
    if (correctionStep.refine) {
      val = await applyRefine(raw, correctionStep.refine, data);
    }
    if (correctionStep.normalize) {
      val = applyNormalize(val, correctionStep.normalize);
    }

    data[key] = val;
    setValue(key, val);
    await playDynamic(`${correctionStep.label} updated.`);
  }

  // --- Done ---
  await playDynamic("All set! Your report is complete.");
  const finalText = formatOutput(template, data);
  saveReport(Date.now(), new Date().toISOString(), data, template.id);
  return finalText;
}
