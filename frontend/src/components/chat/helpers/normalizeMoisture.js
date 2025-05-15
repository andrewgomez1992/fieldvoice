/**
 * Ensure moisture readings end with “readings”.
 * @param {string} text
 * @returns {string}
 */
export const normalizeMoisture = (text) => {
  let t = text.trim().replace(/\.$/, "");
  return /reading(s)?$/i.test(t) ? t : `${t} readings`;
};
