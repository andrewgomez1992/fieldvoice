/**
 * Generate the final report text by filling a template's outputTemplate
 * with the collected data values. Supports {{name}} and {{company.name}}
 * from the template metadata.
 *
 * @param {Object} template
 * @param {Object} data - filled field values keyed by step key
 * @param {{ placeholder?: (key: string) => string }} opts
 *   placeholder - what to show for empty fields (default: empty)
 */
export function formatOutput(template, data, { placeholder } = {}) {
  const context = {
    ...data,
    name: template.name,
    "company.name": template.company?.name || "",
  };

  return template.outputTemplate.replace(
    /\{\{(\w+(?:\.\w+)*)\}\}/g,
    (_, key) => {
      const value =
        context[key] !== undefined && context[key] !== ""
          ? context[key]
          : key.split(".").reduce((obj, k) => obj?.[k], context);
      if (value !== undefined && value !== null && value !== "") return value;
      return placeholder ? placeholder(key) : "";
    }
  );
}

// --- Saved reports (on this device for now) ---

const KEY = "reports";

export function listReports() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const write = (list) => localStorage.setItem(KEY, JSON.stringify(list));

/**
 * Save a completed report. Returns its id.
 * @param {Object} report { data, templateId, transcript? }
 */
export function saveReport({ data, templateId, transcript }) {
  const id = Date.now();
  const list = listReports();
  list.unshift({
    id,
    timestamp: new Date().toISOString(),
    data,
    templateId,
    transcript: transcript || [],
  });
  write(list);
  return id;
}

export function updateReport(id, data) {
  write(
    listReports().map((r) =>
      r.id === id ? { ...r, data, updatedAt: new Date().toISOString() } : r
    )
  );
}

export function deleteReport(id) {
  write(listReports().filter((r) => r.id !== id));
}
