import { formatDateISO } from "../components/chat/helpers/formatDateISO";
import { createVoice, SKIP, BACK, YES } from "./voiceIO";
import { fillField } from "./fillField";
import { reviewLoop } from "./review";
import { voiceSteps } from "../templates";

export { WizardCancelled } from "./voiceIO";

/**
 * Interview mode: ask each question in order. Supports "skip", "go back"
 * and "repeat" voice commands, then a review at the end.
 *
 * @param {Object} template
 * @param {Object} opts
 *   setField(key, value) - store a value (also updates the UI)
 *   initialData          - values already known (e.g. address from schedule)
 *   onStep(key|null), onStatus(status), onSay(text), signal
 * @returns {Promise<Object>} the collected data
 */
export async function runWizard(
  template,
  { setField, initialData = {}, onStep = () => {}, onStatus, onSay, signal } = {}
) {
  const voice = createVoice({ signal, onStatus, onSay });
  const data = { ...initialData };
  const set = async (key, value) => {
    data[key] = value;
    await setField(key, value);
  };
  const steps = voiceSteps(template).filter((s) => !initialData[s.key]);

  try {
    await voice.say(
      `Starting your ${template.name}. You can say skip, go back, or repeat at any time.`
    );

    for (let i = 0; i < steps.length; ) {
      const step = steps[i];
      onStep(step.key);

      if (step.type === "date" && step.autoConfirm) {
        const today = formatDateISO();
        const ans = await voice.ask(step.question.replace("{{today}}", today));
        if (ans === BACK) {
          i = Math.max(0, i - 1);
          continue;
        }
        if (ans === SKIP || !ans || YES.test(ans)) {
          await set(step.key, today);
        } else {
          const fix = await voice.ask("Okay, what's the correct date?", { commands: false });
          await set(step.key, fix || today);
        }
        i++;
        continue;
      }

      const raw = await voice.ask(step.question, {
        timeout: step.listenTimeout || 20000,
      });
      if (raw === BACK) {
        i = Math.max(0, i - 1);
        continue;
      }
      if (raw !== SKIP && raw) {
        voice.think();
        await set(step.key, await fillField(step, raw, data));
      }
      i++;
    }

    onStep(null);
    await reviewLoop({ voice, template, data, setField: set, onStep });
    await voice.say("All set! Your report is ready to review.");
    return data;
  } finally {
    onStep(null);
    voice.idle();
  }
}
