import { chat } from "../components/chat/api/chatApi";

export const NOT_STATED = "[not stated]";

// Added to every rewrite. These reports go to insurance companies, so the
// AI may polish wording but must never add facts the inspector didn't say.
export const FACT_RULES = `Rules you must follow:
- Use ONLY facts the inspector actually said. Never invent or assume locations, measurements, readings, test results, materials, causes or timeframes.
- You may fix grammar and use professional wording, but do not change the meaning.
- If something the output needs was not said, write ${NOT_STATED} in its place instead of guessing.
- Output only the requested text: no quotes, labels or commentary.`;

/**
 * Interpolate {{placeholder}} tokens in a string using a data object.
 * Supports nested keys like {{company.name}} via dot notation.
 */
function interpolate(str, data) {
  return str.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => {
    const value = key.split(".").reduce((obj, k) => obj?.[k], data);
    return value ?? "";
  });
}

/**
 * Apply AI refinement to raw input based on the step's refine config.
 *
 * @param {string} raw - What the inspector said
 * @param {{ type: string, prompt: string, systemPrompt?: string }} config
 * @param {Object} data - All collected data so far (for {{field}} references)
 * @returns {Promise<string>} The refined value (raw input if the AI fails)
 */
export async function applyRefine(raw, config, data) {
  if (!config || !raw) return raw;

  try {
    const prompt = interpolate(config.prompt, { ...data, raw });
    const systemPrompt = `${
      config.systemPrompt || "You are a concise technical writer for field inspection reports."
    }\n\n${FACT_RULES}`;

    const result = (
      await chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ])
    )
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!result) return raw;

    if (config.type === "summarize") {
      const s = result.replace(/\.$/, "");
      return s.charAt(0).toLowerCase() + s.slice(1);
    }
    return result;
  } catch (err) {
    console.error("applyRefine failed, using raw input:", err);
    return raw;
  }
}

/** Pull the first JSON object out of a model reply. */
export function parseJsonReply(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON in AI reply");
  return JSON.parse(text.slice(start, end + 1));
}
