import { RealtimeConnection } from "./connection";
import { buildSession } from "./prompt";
import { fillField } from "../fillField";
import { WizardCancelled } from "../voiceIO";
import { voiceSteps } from "../../templates";
import { formatDateISO } from "../../components/chat/helpers/formatDateISO";

const MAX_MINUTES = 25; // safety cap on one session's length (and cost)

// USD per 1M tokens for gpt-realtime-2.x (estimate shown to the user).
const PRICE = { audioIn: 32, textIn: 4, cachedIn: 0.4, audioOut: 64, textOut: 24 };

export function estimateCost(u) {
  const inD = u.input_token_details || {};
  const outD = u.output_token_details || {};
  const cachedAudio = inD.cached_tokens_details?.audio_tokens || 0;
  const cachedText = inD.cached_tokens_details?.text_tokens || 0;
  const cached = inD.cached_tokens || cachedAudio + cachedText;
  return (
    (Math.max(0, (inD.audio_tokens || 0) - cachedAudio) * PRICE.audioIn +
      Math.max(0, (inD.text_tokens || 0) - cachedText) * PRICE.textIn +
      cached * PRICE.cachedIn +
      (outD.audio_tokens || 0) * PRICE.audioOut +
      (outD.text_tokens || 0) * PRICE.textOut) /
    1e6
  );
}

const FATAL = /insufficient_quota|credit|billing|invalid_api_key|api key|model_not_found|unauthorized/i;

/**
 * Run a report as a live conversation with OpenAI's speech-to-speech model.
 *
 * @returns controller {
 *   done: Promise<{ data, transcript, cost }>,
 *   finish(), cancel(), setMicEnabled(bool)
 * }
 */
export function startRealtimeReport(
  template,
  {
    mode = "walkthrough",
    initialData = {},
    inspectorName,
    setField = () => {},
    onStatus = () => {},
    onLine = () => {},
    onStep = () => {},
    onCost = () => {},
    connectionFactory = (handlers) => new RealtimeConnection(handlers),
  } = {}
) {
  const steps = voiceSteps(template);
  const today = formatDateISO();
  const data = { ...initialData };
  for (const s of steps) if (s.type === "date" && !data[s.key]) data[s.key] = today;
  Object.entries(data).forEach(([k, v]) => setField(k, v));

  const transcript = [];
  const refines = new Set();
  let cost = 0;
  let greeted = false;
  let triedWithoutTranscription = false;
  let finishing = false;
  let aiSpeaking = false;
  let settled = false;
  let resolveDone;
  let rejectDone;
  const done = new Promise((res, rej) => {
    resolveDone = res;
    rejectDone = rej;
  });

  const { instructions, tools } = buildSession(template, {
    mode,
    known: data,
    inspectorName,
    today,
  });

  const sessionUpdate = (withTranscription) => ({
    type: "session.update",
    session: {
      type: "realtime",
      instructions,
      tools,
      tool_choice: "auto",
      audio: {
        input: {
          noise_reduction: { type: "near_field" },
          turn_detection: { type: "semantic_vad", eagerness: "low" },
          ...(withTranscription ? { transcription: { model: "gpt-4o-mini-transcribe" } } : {}),
        },
      },
    },
  });

  const line = (who, text) => {
    if (!text?.trim()) return;
    transcript.push({ who, text: text.trim() });
    onLine([...transcript]);
  };

  const missingRequired = () =>
    steps.filter((s) => s.required && !data[s.key]).map((s) => s.label);

  const saveField = (key, value) => {
    const step = steps.find((s) => s.key === key);
    if (!step || typeof value !== "string") return { error: `Unknown field ${key}` };
    const raw = value.trim();
    data[key] = raw;
    setField(key, raw);
    onStep(key);
    if (raw && (step.refine || step.normalize)) {
      const p = fillField(step, raw, data)
        .then((polished) => {
          // Only apply if nothing newer was said for this field meanwhile.
          if (data[key] === raw && polished) {
            data[key] = polished;
            setField(key, polished);
          }
        })
        .catch((err) => console.warn("Polish failed, keeping raw:", err))
        .finally(() => refines.delete(p));
      refines.add(p);
    }
    return { saved: step.label, still_needed: missingRequired() };
  };

  const settle = async (ok, err) => {
    if (settled) return;
    settled = true;
    clearTimeout(capTimer);
    conn.close();
    onStatus("thinking");
    if (!ok) {
      onStatus("idle");
      return rejectDone(err);
    }
    // Let in-flight polishing finish (max 15s).
    await Promise.race([
      Promise.allSettled([...refines]),
      new Promise((r) => setTimeout(r, 15000)),
    ]);
    onStep(null);
    onStatus("idle");
    resolveDone({ data: { ...data }, transcript, cost });
  };

  const finishSoon = () => {
    finishing = true;
    // Let the sign-off finish playing, then wrap up.
    const wait = () => (aiSpeaking ? setTimeout(wait, 250) : settle(true));
    setTimeout(wait, 600);
  };

  const handleEvent = (ev) => {
    switch (ev.type) {
      case "session.updated":
        if (!greeted) {
          greeted = true;
          onStatus("listening");
          conn.send({ type: "response.create" });
        }
        break;
      case "input_audio_buffer.speech_started":
        onStatus("hearing");
        break;
      case "input_audio_buffer.speech_stopped":
        onStatus("thinking");
        break;
      case "output_audio_buffer.started":
        aiSpeaking = true;
        onStatus("speaking");
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        aiSpeaking = false;
        if (!finishing) onStatus("listening");
        break;
      case "conversation.item.input_audio_transcription.completed":
        line("you", ev.transcript);
        break;
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done":
        line("ai", ev.transcript);
        break;
      case "response.done": {
        const r = ev.response || {};
        if (r.usage) {
          cost += estimateCost(r.usage);
          onCost(cost);
        }
        const failure = r.status_details?.error;
        if (r.status === "failed" && failure) {
          handleError(failure);
          break;
        }
        const output = r.output || [];
        const calls = output.filter((o) => o.type === "function_call");
        if (!calls.length) break;
        const spoke = output.some((o) => o.type === "message");
        let finishCalled = false;
        for (const call of calls) {
          let args = {};
          try {
            args = JSON.parse(call.arguments || "{}");
          } catch {
            /* bad args */
          }
          let result;
          if (call.name === "set_field") result = saveField(args.key, args.value);
          else if (call.name === "finish_report") {
            finishCalled = true;
            result = { ok: true };
          } else result = { error: "unknown tool" };
          conn.send({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) },
          });
        }
        if (finishCalled) finishSoon();
        // If it only called tools without talking, let it respond.
        else if (!spoke) conn.send({ type: "response.create" });
        break;
      }
      case "error":
        handleError(ev.error || {});
        break;
      default:
        break;
    }
  };

  const handleError = (e) => {
    const text = `${e.code || ""} ${e.type || ""} ${e.message || ""}`;
    // Some accounts/models reject the live-transcript option: retry without it.
    if (!greeted && /transcri/i.test(text) && !triedWithoutTranscription) {
      triedWithoutTranscription = true;
      conn.send(sessionUpdate(false));
      return;
    }
    if (!greeted || FATAL.test(text)) {
      settle(false, Object.assign(new Error(e.message || "Voice service error"), { code: e.code || e.type }));
      return;
    }
    console.warn("Realtime warning:", e);
  };

  const conn = connectionFactory({
    onEvent: handleEvent,
    onClose: (reason) => {
      if (!settled && reason) {
        // Connection dropped mid-report: keep what we have.
        settle(true);
      }
    },
  });

  const capTimer = setTimeout(() => settle(true), MAX_MINUTES * 60 * 1000);

  onStatus("connecting");
  conn
    .connect()
    .then(() => conn.send(sessionUpdate(true)))
    .catch((err) => settle(false, err));

  return {
    done,
    finish: () => settle(true),
    cancel: () => settle(false, new WizardCancelled()),
    setMicEnabled: (on) => conn.setMicEnabled(on),
  };
}
