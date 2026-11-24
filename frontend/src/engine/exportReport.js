import { formatOutput } from "./formatOutput";

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const reportTitle = (template, data) =>
  [template.name, data.location || data.address, data.date]
    .filter(Boolean)
    .join(" · ");

export const reportText = (template, data) => formatOutput(template, data);

export async function copyReport(template, data) {
  await navigator.clipboard.writeText(reportText(template, data));
}

export const canShare = () => typeof navigator.share === "function";

export async function shareReport(template, data) {
  await navigator.share({
    title: reportTitle(template, data),
    text: reportText(template, data),
  });
}

/** True for short lines without sentence punctuation, e.g. section titles. */
export const looksLikeHeading = (p) =>
  p.length < 70 && !/[.!?]$/.test(p.trim()) && !p.includes(":") && !p.includes("\n");

/**
 * Open a clean, printable version of the report. On phones and desktops the
 * print dialog has "Save as PDF".
 */
export function printReport(template, data) {
  const paragraphs = reportText(template, data).split(/\n{2,}/);
  const [first, ...rest] = paragraphs;
  const body = rest
    .map((p) =>
      looksLikeHeading(p)
        ? `<h2>${escapeHtml(p)}</h2>`
        : `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
    )
    .join("\n");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${escapeHtml(reportTitle(template, data))}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { margin: 0.8in; }
  body { font: 11.5pt/1.55 Georgia, "Times New Roman", serif; color: #1a1a1a; max-width: 7in; margin: 24px auto; padding: 0 16px; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #2d2d72; padding-bottom: 8px; margin-bottom: 20px; font-family: Arial, sans-serif; }
  header .name { font-size: 15pt; font-weight: bold; color: #2d2d72; }
  header .meta { font-size: 9.5pt; color: #555; text-align: right; }
  h2 { font: bold 11.5pt Arial, sans-serif; color: #2d2d72; margin: 22px 0 6px; }
  p { margin: 0 0 12px; }
  footer { margin-top: 32px; font: 8.5pt Arial, sans-serif; color: #999; }
</style></head><body>
<header><div class="name">${escapeHtml(template.company?.name || template.name)}</div>
<div class="meta">${escapeHtml(template.name)}<br>${escapeHtml(data.date || "")}</div></header>
${looksLikeHeading(first) ? "" : `<p>${escapeHtml(first)}</p>`}
${body}
<footer>Prepared with FieldVoice</footer>
<script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) throw new Error("Allow pop-ups to export the PDF.");
  win.document.write(html);
  win.document.close();
}
