import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

/**
 * Send a chat message to the model and get its reply.
 * @param {Array<{role: string, content: string}>} history - list of prior messages
 * @returns {Promise<string>} - model's reply text
 */
export async function chat(history) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: history,
    temperature: 0.7,
  });
  return response.choices[0].message.content.trim();
}
