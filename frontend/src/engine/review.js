import { NO, SKIP, BACK } from "./voiceIO";
import { fillField } from "./fillField";
import { extractFields } from "./extractFields";
import { NOT_STATED } from "./applyRefine";
import { voiceSteps } from "../templates";

/**
 * End-of-report review: point out gaps, then let the inspector change
 * anything, either by naming a field ("cause") or just saying the fix
 * ("the cause was actually a corroded fitting").
 */
export async function reviewLoop({ voice, template, data, setField, onStep }) {
  const steps = voiceSteps(template);
  const names = [];
  for (const s of steps) {
    names.push([s.key.toLowerCase(), s]);
    names.push([s.label.toLowerCase(), s]);
  }
  // Longest names first so "moisture reading" wins over "moisture".
  names.sort((a, b) => b[0].length - a[0].length);

  const gaps = steps.filter(
    (s) => s.required && (!data[s.key] || String(data[s.key]).includes(NOT_STATED))
  );
  if (gaps.length) {
    await voice.say(
      `Heads up, these still need info: ${gaps.map((s) => s.label).join(", ")}.`
    );
  }

  let question = "Anything you'd like to change? Name a section or just tell me the fix. Or say no.";
  for (let rounds = 0; rounds < 12; rounds++) {
    const answer = await voice.ask(question, { timeout: 15000 });
    question = "Anything else to change?";
    if (answer === SKIP || answer === BACK || !answer) break;
    const said = answer.toLowerCase();
    const words = said.split(/\s+/).length;
    const match = names.find(([n]) => said.includes(n));
    if (!match && words <= 6 && NO.test(said)) break;

    // Short answer naming a field: ask that question again.
    if (match && words <= 5) {
      const step = match[1];
      onStep(step.key);
      const raw = await voice.ask(step.question.replace("{{today}}", "today"), {
        timeout: step.listenTimeout || 20000,
      });
      onStep(null);
      if (typeof raw === "string" && raw) {
        voice.think();
        await setField(step.key, await fillField(step, raw, data));
        await voice.say(`${step.label} updated.`);
      }
      continue;
    }

    // Otherwise treat it as a spoken fix and let the AI place it.
    voice.think();
    let updates = {};
    try {
      updates = await extractFields(template, [answer]);
    } catch (err) {
      console.error("Correction extraction failed:", err);
    }
    const changed = [];
    for (const step of steps) {
      const raw = updates[step.key];
      if (!raw) continue;
      await setField(step.key, await fillField(step, raw, data));
      changed.push(step.label);
    }
    await voice.say(
      changed.length
        ? `Updated ${changed.join(" and ")}.`
        : "I couldn't tell which part to change. Try naming the section, like cause or duration."
    );
  }
}
