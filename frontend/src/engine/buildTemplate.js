import { chat } from "../components/chat/api/chatApi";
import { parseJsonReply } from "./applyRefine";

const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

const toKey = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "field";

const SYSTEM = `You turn one finished field report from a company into a reusable voice-report template.

The sample is a real report. Most of its wording is the company's standard boilerplate that appears in every report: keep that wording EXACTLY, word for word, including headings and line breaks.

Find the job-specific details (names, dates, addresses, rooms or areas, findings, causes, durations, measurements, readings, recommendations specific to this job) and replace each one with a {{key}} placeholder.

Rules:
- One field per placeholder. Keys are short snake_case. A key may appear in several places in the report if it's the same fact.
- Always include "author" (who prepared the report) and "date" if the report has a date, and "location" for the property address if it has one.
- Aim for 5 to 12 fields. Where a whole passage describes this job's findings in free-form words, make it ONE "textarea" field rather than many tiny ones.
- Each field needs: key, label (2-4 words), question (what a friendly assistant would ask out loud, short and conversational), type ("text", "textarea" or "date"), required (true/false), hint (one short phrase describing what goes there).
- If a placeholder completes a sentence (e.g. "The cause appears to be {{cause}}."), add "refine": {"type": "summarize", "prompt": "Rewrite as a short phrase that completes the sentence '<that sentence with ___ for the blank>'. Inspector said: \\"{{raw}}\\""}.
- For textarea fields add "refine": {"type": "template", "prompt": "Rewrite the inspector's notes as professional report text in first person, matching this company's style. Inspector said: \\"{{raw}}\\""}.
- Never include photo or signature fields.
- Separate paragraphs in outputTemplate with a blank line (\\n\\n).

Reply with JSON only, in this shape:
{"name": "...", "steps": [ ... ], "outputTemplate": "..."}`;

/**
 * Build a template from a company's sample report.
 * @returns {Promise<Object>} a template object ready for saveTemplate()
 */
export async function buildTemplate({ sample, companyName, reportName }) {
  const reply = await chat([
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: `Company: ${companyName}\nReport name: ${reportName || "(pick a short name)"}\n\nSample report:\n"""\n${sample.trim()}\n"""`,
    },
  ]);
  return normalizeTemplate(parseJsonReply(reply), { companyName, reportName });
}

/** Make an AI-built template safe to use: valid keys, every placeholder has a field. */
export function normalizeTemplate(raw, { companyName, reportName } = {}) {
  const used = new Set();
  const steps = [];
  for (const s of Array.isArray(raw.steps) ? raw.steps : []) {
    let key = toKey(s.key || s.label);
    if (used.has(key) || ["name", "today"].includes(key)) continue;
    if (s.type === "photo" || s.type === "signature") continue;
    used.add(key);
    const type = ["text", "textarea", "date"].includes(s.type) ? s.type : "text";
    const step = {
      key,
      label: String(s.label || key).slice(0, 40),
      question: String(s.question || `What's the ${s.label || key}?`),
      type,
      required: s.required !== false,
      hint: s.hint ? String(s.hint) : undefined,
    };
    if (type === "date") {
      step.autoConfirm = true;
      step.question = "I have the date as {{today}}. Is that correct?";
    }
    if (type === "textarea") step.listenTimeout = 30000;
    if (s.refine?.prompt && /\{\{raw\}\}/.test(s.refine.prompt)) {
      step.refine = {
        type: s.refine.type === "summarize" ? "summarize" : "template",
        prompt: String(s.refine.prompt),
      };
    }
    steps.push(step);
  }

  let outputTemplate = String(raw.outputTemplate || "");
  // Normalize placeholder keys and add fields for any the AI forgot.
  outputTemplate = outputTemplate.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, k) => {
    if (k === "company.name" || k === "name") return `{{${k}}}`;
    const key = toKey(k);
    if (!used.has(key)) {
      used.add(key);
      steps.push({
        key,
        label: key.replace(/_/g, " "),
        question: `What's the ${key.replace(/_/g, " ")}?`,
        type: "text",
        required: true,
      });
    }
    return `{{${key}}}`;
  });

  if (!outputTemplate.trim()) throw new Error("The AI didn't return any report wording. Try again.");
  if (!steps.length) throw new Error("The AI didn't find any fields. Try a longer sample report.");

  const name = String(reportName || raw.name || "Field Report").trim();
  return {
    id: `${slug(companyName)}-${slug(name)}-${Date.now().toString(36)}`,
    name,
    company: { name: String(companyName || "").trim(), logo: "" },
    steps,
    outputTemplate,
  };
}
