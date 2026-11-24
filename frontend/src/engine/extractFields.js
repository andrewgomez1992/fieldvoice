import { chat } from "../components/chat/api/chatApi";
import { parseJsonReply } from "./applyRefine";
import { voiceSteps } from "../templates";

/**
 * Turn a free-form spoken walkthrough into values for a template's fields.
 * Values stay close to the inspector's own words; per-field AI rewriting
 * (refine) happens afterwards. Fields that weren't mentioned come back "".
 *
 * @param {Object} template
 * @param {string[]} transcript - phrases heard, in order
 * @param {Object} known - values already filled (e.g. address from schedule)
 * @returns {Promise<Object>} { [fieldKey]: string }
 */
export async function extractFields(template, transcript, known = {}) {
  const steps = voiceSteps(template).filter((s) => !known[s.key]);
  if (!steps.length || !transcript.length) return {};

  const fieldList = steps
    .map(
      (s) =>
        `- "${s.key}": ${s.label}${s.hint ? ` (${s.hint})` : ""}. Question it answers: "${s.question.replace("{{today}}", "today's date")}"`
    )
    .join("\n");

  const system = `You read a field inspector's spoken notes from a job site and pull out the facts for each report field.

Rules:
- Use ONLY what the inspector said. Never guess, infer or add anything.
- Keep the inspector's facts and details; clean up filler words ("um", "uh, let's see") and obvious speech-recognition slips.
- For description-type fields, include every relevant detail they gave for that field, in order.
- If a field was not mentioned, use an empty string "".
- Speech recognition can mishear words; if a phrase is clearly a misheard trade term (e.g. "pin hole" -> "pinhole"), fix it.
- Reply with a single JSON object and nothing else.`;

  const user = `Report: ${template.name}

Fields (key: meaning):
${fieldList}

Inspector's spoken notes, in order:
"""
${transcript.join("\n")}
"""

Return JSON with exactly these keys: ${steps.map((s) => `"${s.key}"`).join(", ")}`;

  const reply = await chat([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  const parsed = parseJsonReply(reply);
  const result = {};
  for (const s of steps) {
    const v = parsed[s.key];
    result[s.key] = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
  }
  return result;
}
