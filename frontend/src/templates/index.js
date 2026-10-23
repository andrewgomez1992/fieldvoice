import fieldvoice from "./fieldvoice.json";

const templates = [fieldvoice];

export default templates;

export const getTemplate = (id) => templates.find((t) => t.id === id);
