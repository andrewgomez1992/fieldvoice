import { chat } from "../chatApi";

/**
 * Convert a raw description into the three‑sentence template.
 * @param {string} rawDesc
 * @param {string} area
 * @returns {Promise<string>}
 */
export const refineDescription = async (rawDesc, area) => {
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
};
