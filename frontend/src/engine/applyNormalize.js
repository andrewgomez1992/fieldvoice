/**
 * Apply a normalize transform to raw input based on the step config.
 *
 * @param {string} raw - The raw user input
 * @param {{ type: string, value: string }} config - Normalize config from the template step
 * @returns {string} The normalized value
 */
export function applyNormalize(raw, config) {
  if (!config) return raw;

  let text = raw.trim().replace(/\.$/, "");

  switch (config.type) {
    case "suffix": {
      const pattern = new RegExp(`${config.value}$`, "i");
      return pattern.test(text) ? text : `${text} ${config.value}`;
    }
    case "prefix": {
      const pattern = new RegExp(`^${config.value}`, "i");
      return pattern.test(text) ? text : `${config.value} ${text}`;
    }
    default:
      return text;
  }
}
