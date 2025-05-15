import { chat } from "../api/chatApi";

/**
 * Summarize a free‑form answer into a concise phrase.
 * @param {string} text
 * @param {"cause"|"duration"} type
 * @returns {Promise<string>}
 */
export const refine = async (text, type) => {
  const prompt =
    type === "cause"
      ? `Summarize this as a brief cause phrase: "${text}".`
      : `Summarize this as a concise duration phrase: "${text}".`;

  const summary = await chat([
    { role: "system", content: "You are a concise summarizer." },
    { role: "user", content: prompt },
  ]);

  const s = summary.trim().replace(/\.$/, "");
  return s.charAt(0).toLowerCase() + s.slice(1);
};
