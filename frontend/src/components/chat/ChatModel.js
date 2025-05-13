import axios from "axios";

// push test

// low‑level ChatGPT call
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
});
export async function chat(history) {
  // MAKE SURE /api is here or in url in env
  const { data } = await api.post("/chat", { history });
  return data.reply;
}

// ─── TTS ──────────────────────────────────────────────────────────
async function speakReal(text) {
  const resp = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) throw new Error("TTS request failed");
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  await new Promise((resolve) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.play();
  });
}

// ─── STT with timeout & retries ───────────────────────────────────
async function listenOnce({ timeout = 20000, attempts = 3 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Rec) throw new Error("SpeechRecognition not supported");
      const r = new Rec();
      r.lang = "en-US";
      r.interimResults = false;
      r.maxAlternatives = 1;

      const transcript = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          r.onerror = null;
          r.onresult = null;
          r.stop();
          reject("timeout");
        }, timeout);

        r.onresult = (e) => {
          clearTimeout(timer);
          resolve(e.results[0][0].transcript.trim());
        };
        r.onerror = (e) => {
          clearTimeout(timer);
          reject(e.error || "recognition error");
        };

        r.start();
      });

      return transcript;
    } catch (err) {
      if (i < attempts - 1) {
        await speakReal("I didn't catch that. Please repeat.");
      } else {
        throw new Error(`Speech input failed: ${err}`);
      }
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────
function formatDateISO(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function saveReport(id, timestamp, data) {
  const stored = JSON.parse(localStorage.getItem("reports") || "[]");
  stored.unshift({ id, timestamp, data });
  localStorage.setItem("reports", JSON.stringify(stored));
}

async function refine(text, type) {
  const prompt =
    type === "cause"
      ? `Summarize this as a brief cause phrase: "${text}".`
      : `Summarize this as a concise duration phrase: "${text}".`;

  const summary = await chat([
    { role: "system", content: "You are a concise summarizer." },
    { role: "user", content: prompt },
  ]);
  // Force lowercase first letter and strip trailing period
  let s = summary.trim().replace(/\.$/, "");
  s = s.charAt(0).toLowerCase() + s.slice(1);
  return s;
}

function normalizeMoisture(text) {
  let t = text.trim().replace(/\.$/, "");
  // if they didn’t say “reading(s)”, tack it on
  if (!/reading(s)?$/i.test(t)) {
    t = `${t} readings`;
  }
  return t;
}

// ─── desc formatter (unchanged) ───────────────────────────────────
async function refineDesc(rawDesc, area) {
  const prompt = `
You are a professional technical writer. Convert the user's description into this exact three‑sentence template.  
Template:  
I began by flow testing the nearby ${area} and found them to be free of any leaks.  
Upon close inspection of the damage I found most of the damage {damage_location}.  
I then flow tested the ${area} and found a {leak_description}.  
User description: "${rawDesc}"  
Please fill in {damage_location} and {leak_description} from the user description.
  `.trim();

  const output = await chat([
    { role: "system", content: "You are a precision writer." },
    { role: "user", content: prompt },
  ]);
  return output.trim();
}

// ─── Report template ───────────────────────────────────────────────
function generateReport({
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

// ─── Wizard Flow ─────────────────────────────────────────────────
export async function runReportWizard(
  steps,
  setValue,
  { onStep, onListening }
) {
  const data = {};

  // 1) Name
  onStep("author");
  await speakReal("Hey! Who's filling out this report today?");
  onListening(true);
  data.author = await listenOnce();
  onListening(false);

  // fix common STT mis‑hearings:
  // if it captured “Boland” (or any case variation), force it to “Bolin”
  data.author = data.author.replace(/\bBoland\b/gi, "Bolin");

  setValue("author", data.author);
  const firstName = data.author.split(" ")[0];

  // 2) Date
  onStep("date");
  const today = formatDateISO();
  await speakReal(
    `Hey ${firstName}, I have the date as ${today}. Is that correct?`
  );
  onListening(true);
  let ans = await listenOnce();
  onListening(false);
  data.date = ans.toLowerCase().includes("yes")
    ? today
    : await (async () => {
        await speakReal("Okay, what's the correct date?");
        onListening(true);
        const res = await listenOnce();
        onListening(false);
        return res;
      })();
  setValue("date", data.date);

  // 3) Location
  onStep("location");
  await speakReal("Cool, what's the location?");
  onListening(true);
  data.location = await listenOnce();
  onListening(false);
  setValue("location", data.location);

  // 4) Area
  onStep("area");
  await speakReal("What is the area of concern?");
  onListening(true);
  data.area = await listenOnce();
  onListening(false);
  setValue("area", data.area);

  // 5) Description
  onStep("desc");
  await speakReal(
    `Please describe your testing and findings in the ${data.area}.`
  );
  onListening(true);
  const rawDesc = await listenOnce({ timeout: 20000, attempts: 3 });
  onListening(false);
  data.desc = await refineDesc(rawDesc, data.area);
  setValue("desc", data.desc);

  // 6) Cause
  onStep("cause");
  await speakReal("What appears to be the cause of the leak?");
  onListening(true);
  const rawCause = await listenOnce();
  onListening(false);
  data.cause = await refine(rawCause, "cause");
  setValue("cause", data.cause);

  // 7) Duration
  onStep("duration");
  await speakReal("How long do you estimate the leak has been present?");
  onListening(true);
  data.duration = await listenOnce();
  onListening(false);
  setValue("duration", data.duration);

  // 8) Moisture
  onStep("moisture");
  await speakReal("What moisture meter reading did you record?");
  onListening(true);
  const rawMoisture = await listenOnce();
  onListening(false);

  // normalize “elevated” → “elevated readings”
  data.moisture = normalizeMoisture(rawMoisture);
  setValue("moisture", data.moisture);

  // 9) Corrections
  while (true) {
    await speakReal(
      "Would you like to correct any field? Say the field name or 'no'."
    );
    const field = (await listenOnce()).toLowerCase();
    if (field.includes("no")) break;
    const keyMap = {
      author: "author",
      date: "date",
      location: "location",
      area: "area",
      cause: "cause",
      duration: "duration",
      moisture: "moisture",
    };
    const key = keyMap[field];
    if (!key) {
      await speakReal("I didn't understand that field name.");
      continue;
    }
    await speakReal(
      steps.find((s) => s.key === key)?.label || `Please provide ${key}`
    );
    const raw = await listenOnce();
    const val = ["cause", "duration"].includes(key)
      ? await refine(raw, key)
      : raw;
    data[key] = val;
    setValue(key, val);
    await speakReal(`${key} updated.`);
  }

  // 10) Done
  await speakReal("All set! Your report is complete.");
  const final = generateReport(data);
  saveReport(Date.now(), new Date().toISOString(), data);
  return final;
}
