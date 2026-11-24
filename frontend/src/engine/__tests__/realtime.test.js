import { describe, it, expect, vi } from "vitest";

vi.mock("../../components/chat/api/chatApi", () => ({
  chat: vi.fn(async (msgs) => "POLISHED " + msgs[1].content.match(/"([^"]*)"\s*\.?$/)?.[1]),
  getRealtimeKey: vi.fn(),
}));
vi.mock("../../components/chat/tts/tts", () => ({ playDynamic: vi.fn(), stopSpeaking: vi.fn() }));
vi.mock("../../components/chat/stt/stt", () => ({ listenOnce: vi.fn(), ListenTimeoutError: class extends Error {} }));

import template from "../../templates/fieldvoice.json";
import { startRealtimeReport, estimateCost } from "../realtime/runRealtimeReport";
import { buildSession } from "../realtime/prompt";

function fakeConn() {
  const sent = [];
  let handlers;
  const conn = {
    sent,
    emit: (ev) => handlers.onEvent(ev),
    factory: (h) => {
      handlers = h;
      return {
        connect: async () => {},
        send: (e) => sent.push(e),
        setMicEnabled: vi.fn(),
        close: vi.fn(),
      };
    },
  };
  return conn;
}
const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));
const call = (name, args, id = Math.random().toString()) => ({
  type: "function_call", name, call_id: id, arguments: JSON.stringify(args),
});

describe("realtime report", () => {
  it("configures the session, greets, fills fields from tool calls and finishes", async () => {
    const c = fakeConn();
    const fields = {};
    const statuses = [];
    const ctl = startRealtimeReport(template, {
      initialData: { location: "512 Oak St" },
      setField: (k, v) => (fields[k] = v),
      onStatus: (s) => statuses.push(s),
      connectionFactory: c.factory,
    });
    await tick();
    const upd = c.sent[0];
    expect(upd.type).toBe("session.update");
    expect(upd.session.tools.map((t) => t.name)).toEqual(["set_field", "finish_report"]);
    expect(upd.session.instructions).toContain("Never invent");
    expect(upd.session.instructions).toContain('ALREADY HAVE: "512 Oak St"');
    expect(upd.session.audio.input.turn_detection.type).toBe("semantic_vad");

    c.emit({ type: "session.updated" });
    expect(c.sent.at(-1)).toEqual({ type: "response.create" });

    // Tool-only response -> app asks the model to keep talking.
    c.emit({ type: "response.done", response: { status: "completed", output: [
      call("set_field", { key: "area", value: "master bath vanity" }),
      call("set_field", { key: "cause", value: "pinhole leak on the cold line" }),
    ], usage: { input_token_details: { audio_tokens: 1000, text_tokens: 2000 }, output_token_details: { audio_tokens: 500 } } } });
    const outputs = c.sent.filter((e) => e.type === "conversation.item.create");
    expect(outputs).toHaveLength(2);
    expect(JSON.parse(outputs[0].item.output).still_needed).toContain("Prepared by");
    expect(c.sent.at(-1)).toEqual({ type: "response.create" });
    expect(fields.area).toBe("master bath vanity");

    // Response with speech + tool call -> no extra response.create
    const before = c.sent.length;
    c.emit({ type: "response.done", response: { output: [
      { type: "message" }, call("set_field", { key: "author", value: "Drew" }),
    ] } });
    expect(c.sent.length).toBe(before + 1);

    c.emit({ type: "conversation.item.input_audio_transcription.completed", transcript: "it's been about two weeks" });
    c.emit({ type: "response.output_audio_transcript.done", transcript: "Got it." });
    c.emit({ type: "output_audio_buffer.started" });
    c.emit({ type: "response.done", response: { output: [{ type: "message" }, call("finish_report", {})] } });
    await tick(700);
    c.emit({ type: "output_audio_buffer.stopped" }); // sign-off done
    const res = await ctl.done;
    expect(res.data.location).toBe("512 Oak St");
    expect(res.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.data.cause).toMatch(/^pOLISHED|^polished/); // polished by refine (summarize lowercases)
    expect(res.transcript).toEqual([
      { who: "you", text: "it's been about two weeks" },
      { who: "ai", text: "Got it." },
    ]);
    expect(res.cost).toBeGreaterThan(0);
    expect(statuses).toContain("speaking");
  });

  it("fails with a clear error when the account has no credits", async () => {
    const c = fakeConn();
    const ctl = startRealtimeReport(template, { connectionFactory: c.factory });
    await tick();
    c.emit({ type: "error", error: { type: "insufficient_quota", code: "insufficient_quota", message: "You exceeded your current quota" } });
    await expect(ctl.done).rejects.toMatchObject({ code: "insufficient_quota" });
  });

  it("retries without live transcription if the session rejects it", async () => {
    const c = fakeConn();
    startRealtimeReport(template, { connectionFactory: c.factory });
    await tick();
    c.emit({ type: "error", error: { code: "invalid_value", message: "Invalid transcription model" } });
    const last = c.sent.at(-1);
    expect(last.type).toBe("session.update");
    expect(last.session.audio.input.transcription).toBeUndefined();
  });

  it("Finish button saves immediately; cancel rejects", async () => {
    const c = fakeConn();
    const ctl = startRealtimeReport(template, { connectionFactory: c.factory });
    await tick();
    ctl.finish();
    await expect(ctl.done).resolves.toHaveProperty("data");
    const c2 = fakeConn();
    const ctl2 = startRealtimeReport(template, { connectionFactory: c2.factory });
    ctl2.cancel();
    await expect(ctl2.done).rejects.toMatchObject({ name: "WizardCancelled" });
  });

  it("estimates cost and builds step-by-step instructions", () => {
    expect(estimateCost({ input_token_details: { audio_tokens: 1e6 }, output_token_details: {} })).toBeCloseTo(32);
    const { instructions } = buildSession(template, { mode: "interview", known: {}, today: "2026-11-11" });
    expect(instructions).toContain("STEP BY STEP");
    expect(instructions).toContain("What's the property address?");
  });
});
