// Save report metadata + data to localStorage
export function saveReport(id, timestamp, data) {
  const stored = JSON.parse(localStorage.getItem("reports") || "[]");
  stored.unshift({ id, timestamp, data });
  localStorage.setItem("reports", JSON.stringify(stored));
}

// Render the final report text
export function formatReport({
  author,
  date,
  location,
  area,
  desc,
  cause,
  duration,
  moisture,
}) {
  return `
Cause & Origin Report    City Water Conservation    ${date}

Prepared by: ${author}

Location: ${location}

The insured granted me access upon arrival and I obtained verbal authorization to perform my inspection. They stated there was water damage to the ${area}. I found water damage to the areas pictured. I found moisture and thermal readings present in the areas pictured and labeled.

Area of Concern (${area})

${desc}

Area of Concern Cause

The cause of the leak appears to be ${cause}.

Area of Concern Duration

The duration of the leak appears to be ${duration} based on the extent of the damage to the affected building materials.

All estimated times of duration are based on hands on experience. There may be hidden damages at the time of inspection associated to the leak that could impact the estimated duration/cause of the damage once uncovered.

After testing I used the moisture meter and found ${moisture}.
`.trim();
}
