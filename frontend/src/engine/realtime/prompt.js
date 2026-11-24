import { voiceSteps } from "../../templates";

/**
 * Build the realtime model's instructions and tools from a report template,
 * so any company's template gets its own conversational assistant.
 */
export function buildSession(template, { mode = "walkthrough", known = {}, inspectorName, today }) {
  const steps = voiceSteps(template);
  const company = template.company?.name ? ` for ${template.company.name}` : "";

  const fieldLines = steps
    .map((s) => {
      const have = known[s.key] ? ` [ALREADY HAVE: "${known[s.key]}"]` : "";
      return `- ${s.key} — ${s.label}${s.required ? " (required)" : ""}: ${s.hint || s.question}${have}`;
    })
    .join("\n");

  const askOrder = steps
    .filter((s) => !known[s.key] && s.type !== "date")
    .map((s, i) => `${i + 1}. ${s.key}: "${s.question}"`)
    .join("\n");

  const flow =
    mode === "interview"
      ? `MODE: STEP BY STEP
1. Greet them in one short, friendly line and ask the first question.
2. Ask these one at a time, in order, in your own natural words (don't read them robotically):
${askOrder}
3. After each answer, call set_field, give a tiny acknowledgment ("Got it."), and move on.
4. If they say "skip", move on. If they say "go back", return to the previous question.
5. When done, give a one or two sentence recap of the key findings and ask if anything needs changing.
6. When they confirm, say a short sign-off ("Perfect, your report's ready.") and call finish_report.`
      : `MODE: WALKTHROUGH (hands-free)
1. Open with ONE short, friendly line, like "Hey${inspectorName ? ` ${inspectorName}` : ""}! Go ahead and walk me through it whenever you're ready."
2. Then mostly listen. They're working with their hands busy and the phone in their pocket. As they mention facts, call set_field immediately. Reply with tiny acknowledgments ("Mm-hm.", "Got it.", "Okay, cold line, noted.") or a quick clarifying question only when something is genuinely unclear.
3. When they say they're done (or it's clear they've covered the job), ask ONLY for required fields that are still missing, one at a time, naturally ("How long do you think it's been leaking?").
4. Give a one or two sentence recap of the key findings and ask if anything needs changing.
5. When they confirm, say a short sign-off ("Perfect, your report's ready.") and call finish_report.`;

  const instructions = `You are FieldVoice, a sharp, friendly assistant who helps a field inspector${
    inspectorName ? ` named ${inspectorName}` : ""
  } write a ${template.name}${company}, entirely by voice.

PERSONALITY & VOICE
- Sound like a laid-back, competent coworker on the job site: warm, natural, relaxed pace, American English. Use contractions. A little warmth or humor is fine; never be cheesy.
- Keep it SHORT. Most replies are 1–8 words. Never read long text back, never lecture, never list fields out loud.
- Don't say "as an AI". Don't mention fields, keys, tools or JSON.

${flow}

RULES (important — these reports go to insurance companies)
- Only record facts the inspector actually said. Never invent, assume or embellish details, measurements, test results, causes or timeframes.
- Put each fact in the right field. Send the inspector's own words, lightly cleaned up (drop "um", fix obvious mis-hearings of trade terms). The app polishes the wording later.
- If they add to or correct something, call set_field again with the full updated value for that field.
- If speech clearly isn't meant for you (talking to the homeowner, on the phone, thinking out loud), stay quiet or just say "Mm-hm."
- Today's date is ${today}. Don't ask about the date unless they bring it up.
- If they ask something unrelated, answer in a sentence and steer back to the report.

REPORT FIELDS (key — label: what goes there)
${fieldLines}`;

  const tools = [
    {
      type: "function",
      name: "set_field",
      description:
        "Save information for one report field as soon as the inspector says it. Call again to update.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", enum: steps.map((s) => s.key) },
          value: {
            type: "string",
            description: "What the inspector said for this field, in their words, lightly cleaned up. Facts only.",
          },
        },
        required: ["key", "value"],
      },
    },
    {
      type: "function",
      name: "finish_report",
      description:
        "Call only after the inspector confirms the report is good and you've said your short sign-off.",
      parameters: { type: "object", properties: {} },
    },
  ];

  return { instructions, tools };
}
