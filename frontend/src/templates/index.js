import fieldvoice from "./fieldvoice.json";

/**
 * Report templates: the built-in ones shipped with the app, plus company
 * templates created in the template builder (stored on this device).
 */
const BUILT_IN = [fieldvoice];
const STORAGE_KEY = "customTemplates";

function readCustom() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function listTemplates() {
  return [...BUILT_IN, ...readCustom().map((t) => ({ ...t, custom: true }))];
}

export const getTemplate = (id) => listTemplates().find((t) => t.id === id);

export function saveTemplate(template) {
  const list = readCustom().filter((t) => t.id !== template.id);
  // eslint-disable-next-line no-unused-vars
  const { custom, ...clean } = template;
  list.push(clean);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return template.id;
}

export function deleteTemplate(id) {
  const list = readCustom().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Steps the app collects by voice (photos and signatures are separate). */
export const voiceSteps = (template) =>
  (template?.steps || []).filter(
    (s) => s.type !== "photo" && s.type !== "signature"
  );

export default BUILT_IN;
