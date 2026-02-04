import cwc from "./city-water-conservation.json";

const templates = [cwc];

export default templates;

export const getTemplate = (id) => templates.find((t) => t.id === id);
