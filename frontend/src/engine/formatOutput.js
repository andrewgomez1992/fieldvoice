/**
 * Generate the final report text by filling a template's outputTemplate
 * with the collected data values.
 *
 * Replaces {{key}} placeholders with values from data, and also supports
 * {{name}} and {{company.name}} from the template metadata.
 *
 * @param {Object} template - The full template object
 * @param {Object} data - The filled field values keyed by step key
 * @returns {string} The formatted report text
 */
export function formatOutput(template, data) {
  const context = {
    ...data,
    name: template.name,
    "company.name": template.company?.name || "",
  };

  return template.outputTemplate.replace(
    /\{\{(\w+(?:\.\w+)*)\}\}/g,
    (_, key) => {
      // Check flat key first (handles "company.name" as a single key)
      if (context[key] !== undefined) return context[key];
      // Then try dot-notation traversal
      const value = key.split(".").reduce((obj, k) => obj?.[k], context);
      return value ?? "";
    }
  );
}

/**
 * Save a completed report to localStorage.
 *
 * @param {number} id - Unique report ID (typically Date.now())
 * @param {string} timestamp - ISO timestamp string
 * @param {Object} data - The filled report data
 * @param {string} templateId - The template ID this report was filled from
 */
export function saveReport(id, timestamp, data, templateId) {
  const stored = JSON.parse(localStorage.getItem("reports") || "[]");
  stored.unshift({ id, timestamp, data, templateId });
  localStorage.setItem("reports", JSON.stringify(stored));
}
