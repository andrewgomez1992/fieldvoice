import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Fakes for the browser voice + AI layers ---
const said = [];
let heard = [];
let chatCalls = [];
let chatImpl = async () => "";

vi.mock("../../components/chat/tts/tts", () => ({
  playDynamic: vi.fn(async (t) => said.push(t)),
  stopSpeaking: vi.fn(),
  audioCtx: {},
}));

vi.mock("../../components/chat/stt/stt", () => {
  class ListenTimeoutError extends Error {}
  return {
    ListenTimeoutError,
    listenOnce: vi.fn(async ({ signal } = {}) => {
      await new Promise((r) => setTimeout(r, 2)); // real listening takes time
      if (signal?.aborted) throw signal.reason;
      if (!heard.length) throw new ListenTimeoutError("timeout");
      const next = heard.shift();
      if (next instanceof Error) throw next;
      return next;
    }),
  };
});

vi.mock("../../components/chat/api/chatApi", () => ({
  chat: vi.fn(async (msgs) => {
    chatCalls.push(msgs);
    return chatImpl(msgs);
  }),
}));

import template from "../../templates/fieldvoice.json";
import { runWalkthrough } from "../runWalkthrough";
import { runWizard } from "../runWizard";
import { formatOutput } from "../formatOutput";
import { normalizeTemplate } from "../buildTemplate";
import { isDone, isSkip, isBack } from "../voiceIO";

beforeEach(() => {
  said.length = 0;
  heard = [];
  chatCalls = [];
});

const isExtract = (m) => m[0].content.includes("pull out the facts");

describe("walkthrough mode", () => {
  it("fills the report from free talk and only asks for what's missing", async () => {
    heard = [
      "this is Drew at 512 Oak Street in Modesto",
      "master bath vanity, water staining on the cabinet floor",
      "pinhole leak on the cold supply line",
      "moisture meter is reading 38 percent on the subfloor",
      "I'm done",
      // asked for missing "cause"? no: cause is extracted. Missing: duration
      "about two weeks",
      // review: anything to change?
      "no",
    ];
    chatImpl = async (m) => {
      if (isExtract(m)) {
        return JSON.stringify({
          author: "Drew",
          location: "512 Oak Street, Modesto",
          area: "master bath vanity",
          desc: "water staining on the cabinet floor; pinhole leak on the cold supply line",
          cause: "pinhole leak on the cold supply line",
          duration: "",
          moisture: "38 percent on the subfloor",
        });
      }
      return "REFINED: " + m[1].content.match(/"([^"]*)"\s*\.?$/)?.[1];
    };
    const fields = {};
    const { data, transcript } = await runWalkthrough(template, {
      setField: async (k, v) => (fields[k] = v),
    });
    expect(transcript).toHaveLength(4);
    expect(data.author).toBe("Drew");
    expect(data.location).toBe("512 Oak Street, Modesto");
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.moisture).toBe("38 percent on the subfloor readings");
    expect(data.duration).toContain("about two weeks");
    expect(data.cause.startsWith("rEFINED") || data.cause.startsWith("refined")).toBe(true);
    // It asked about duration only, not every question.
    expect(said.some((s) => s.includes("How long has the leak"))).toBe(true);
    expect(said.some((s) => s.includes("What's the property address"))).toBe(false);
    // Every AI rewrite carries the no-invented-facts rules.
    const refineCalls = chatCalls.filter((m) => !isExtract(m));
    expect(refineCalls.length).toBeGreaterThan(0);
    for (const m of refineCalls) expect(m[0].content).toContain("Never invent");
    expect(fields.area).toBe("master bath vanity");
  });

  it("Finish button ends the talking phase", async () => {
    const finisher = new AbortController();
    heard = ["kitchen sink, leak at the p-trap"];
    chatImpl = async (m) => (isExtract(m) ? JSON.stringify({ area: "kitchen sink" }) : "x");
    const p = runWalkthrough(template, {
      setField: async () => {},
      finishSignal: finisher.signal,
      initialData: { location: "1 Main St" },
    });
    // after the first phrase, listenOnce times out (no more speech) -> keep waiting;
    // simulate Finish tap
    setTimeout(() => finisher.abort(new Error("finish")), 30);
    // let it run: remaining questions get no answers -> left blank
    const { data } = await p;
    expect(data.area).toBe("kitchen sink"); // area has no AI rewrite
    expect(data.location).toBe("1 Main St");
  });
});

describe("interview mode", () => {
  it("supports skip and go back", async () => {
    heard = [
      "Drew",          // author
      "yes",           // date
      "skip",          // location -> skipped
      "go back",       // area -> back to location
      "512 Oak St",    // location
      "kitchen",       // area
      "found a leak under the sink", // desc
      "corroded fitting", // cause
      "a month",       // duration
      "40 percent",    // moisture
      "no",            // review
    ];
    chatImpl = async () => "ok";
    const data = await runWizard(template, { setField: async () => {} });
    expect(data.author).toBe("Drew");
    expect(data.location).toBe("512 Oak St");
    expect(data.area).toBe("kitchen");
    expect(data.moisture).toBe("40 percent readings");
  });
});

describe("voice commands", () => {
  it("only treat short phrases as commands", () => {
    expect(isDone("I'm done.")).toBe(true);
    expect(isDone("I'm done with the bathroom, moving to the kitchen now")).toBe(false);
    expect(isSkip("skip")).toBe(true);
    expect(isSkip("skip the vanity, the leak is at the tub spout")).toBe(false);
    expect(isBack("go back")).toBe(true);
  });
});

describe("templates", () => {
  it("formats output and normalizes AI-built templates", () => {
    const text = formatOutput(template, { area: "kitchen" });
    expect(text).toContain("water damage to the kitchen");
    const t = normalizeTemplate(
      {
        steps: [{ key: "Inspector Name", label: "Inspector", question: "Who?", type: "text" }],
        outputTemplate: "Inspector: {{inspector_name}}\n\nArea: {{ Room }}",
      },
      { companyName: "Acme", reportName: "Mold" }
    );
    expect(t.steps.map((s) => s.key)).toEqual(["inspector_name", "room"]);
    expect(t.outputTemplate).toContain("{{room}}");
    expect(t.company.name).toBe("Acme");
  });
});
