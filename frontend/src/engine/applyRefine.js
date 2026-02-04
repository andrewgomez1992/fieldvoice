import { chat } from "../components/chat/api/chatApi";

/**
 * Interpolate {{placeholder}} tokens in a string using a data object.
 * Supports nested keys like {{company.name}} via dot notation.
 *
 * @param {string} str - The string containing {{key}} placeholders
 * @param {Object} data - Key-value pairs to substitute
 * @returns {string}
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
 * @param {string} raw - The raw user input
 * @param {{ type: string, prompt: string, systemPrompt?: string }} config - Refine config from template
 * @param {Object} data - All collected data so far (for interpolating field references)
 * @returns {Promise<string>} The refined value
 */
export async function applyRefine(raw, config, data) {
  if (!config) return raw;

  try {
    const context = { ...data, raw };
    const prompt = interpolate(config.prompt, context);
    const systemPrompt =
      config.systemPrompt || "You are a concise summarizer.";

    const result = await chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);

    switch (config.type) {
      case "summarize": {
        const s = result.trim().replace(/\.$/, "");
        return s.charAt(0).toLowerCase() + s.slice(1);
      }
      case "template":
        return result.trim();
      default:
        return result.trim();
    }
  } catch (err) {
    console.error("applyRefine failed, using raw input:", err);
    return raw;
  }
}
