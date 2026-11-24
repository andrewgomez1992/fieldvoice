import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled, { css, keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  ListChecks,
  Square,
  Check,
  FileDown,
  Copy,
  Share2,
  Pencil,
  RotateCcw,
  ArrowLeft,
  MicOff,
} from "lucide-react";

import PreviewCard from "./CauseOrigin/PreviewCard";
import { getTemplate, voiceSteps } from "../../templates";
import { runWizard, WizardCancelled } from "../../engine/runWizard";
import { runWalkthrough, FinishRequested } from "../../engine/runWalkthrough";
import { saveReport, updateReport } from "../../engine/formatOutput";
import {
  copyReport,
  shareReport,
  printReport,
  canShare,
} from "../../engine/exportReport";
import {
  startRecognition,
  stopRecognition,
  isSpeechRecognitionSupported,
} from "../chat/stt/stt";
import { stopSpeaking } from "../chat/tts/tts";
import { startRealtimeReport } from "../../engine/realtime/runRealtimeReport";
import { onServiceError, friendlyError } from "../../engine/serviceStatus";
import { useWakeLock } from "../../hooks/useWakeLock";

/* ---------- styles ---------- */

const Page = styled.div`
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 32px;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBtn = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 6px 4px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const Sub = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ModeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  @media (min-width: 560px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ModeCard = styled(motion.button)`
  text-align: left;
  border: 2px solid ${({ $primary, theme }) => ($primary ? theme.colors.primary : "#d9deea")};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.primary : "#fff")};
  color: ${({ $primary }) => ($primary ? "#fff" : "#1f2533")};
  border-radius: 14px;
  padding: 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(20, 30, 60, 0.08);
  font: inherit;
`;

const ModeName = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModeDesc = styled.div`
  font-size: 0.85rem;
  opacity: 0.85;
  line-height: 1.45;
`;

const Badge = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: ${({ theme }) => theme.colors.yellowText};
  color: #1f2533;
  border-radius: 99px;
  padding: 2px 8px;
`;

const Tip = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: #eef1fa;
  border-radius: 10px;
  padding: 10px 12px;
  line-height: 1.45;
`;

const Session = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(20, 30, 60, 0.1);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(var(--orb), 0.45); }
  70% { box-shadow: 0 0 0 26px rgba(var(--orb), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--orb), 0); }
`;

const ORB = {
  speaking: "45, 45, 114",
  connecting: "150, 155, 170",
  hearing: "30, 160, 90",
  muted: "150, 155, 170",
  listening: "30, 160, 90",
  recording: "220, 50, 60",
  thinking: "240, 160, 30",
  idle: "150, 155, 170",
};

const Orb = styled.div`
  --orb: ${({ $status }) => ORB[$status] || ORB.idle};
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgb(var(--orb));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  ${({ $status }) =>
    ($status === "listening" || $status === "recording" || $status === "hearing" || $status === "speaking") &&
    css`
      animation: ${pulse} 1.6s infinite;
    `}
`;

const StatusText = styled.div`
  font-weight: 700;
  font-size: 1.05rem;
  color: #1f2533;
  text-align: center;
`;

const Caption = styled.div`
  font-size: 0.9rem;
  color: #4a5068;
  text-align: center;
  font-style: italic;
  min-height: 1.3em;
`;

const Transcript = styled.div`
  width: 100%;
  max-height: 180px;
  overflow-y: auto;
  background: #f6f7fb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #2d3346;
  p {
    margin: 0 0 6px;
  }
`;

const Buttons = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  flex-wrap: wrap;
`;

const Btn = styled.button`
  flex: 1;
  min-width: 120px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px;
  border-radius: 10px;
  font: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.primary : "#fff")};
  color: ${({ $primary, theme }) => ($primary ? "#fff" : theme.colors.primary)};
  ${({ $danger }) =>
    $danger &&
    css`
      border-color: #c93545;
      color: #c93545;
      background: #fff;
    `}
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  background: #fdecec;
  color: #a12626;
  font-size: 0.9rem;
`;

const Toast = styled(motion.div)`
  position: fixed;
  left: 50%;
  bottom: 24px;
  background: #1f2533;
  color: #fff;
  padding: 10px 18px;
  border-radius: 99px;
  font-size: 0.9rem;
  z-index: 50;
`;

const EditPanel = styled.div`
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(20, 30, 60, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  label {
    font-size: 0.8rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primaryDark};
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    line-height: 1.45;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 400;
    border: 1px solid #d3d8e6;
    border-radius: 8px;
    padding: 8px 10px;
    resize: vertical;
  }
`;

const Chat = styled.div`
  width: 100%;
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 2px;
`;

const Bubble = styled.div`
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 14px;
  font-size: 0.88rem;
  line-height: 1.4;
  align-self: ${({ $me }) => ($me ? "flex-end" : "flex-start")};
  background: ${({ $me, theme }) => ($me ? theme.colors.primary : "#eef0f6")};
  color: ${({ $me }) => ($me ? "#fff" : "#1f2533")};
  border-bottom-${({ $me }) => ($me ? "right" : "left")}-radius: 4px;
`;

const Fallback = styled.button`
  border: none;
  background: none;
  font: inherit;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.secondary};
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  align-self: flex-start;
`;

const STATUS_TEXT = {
  connecting: "Connecting…",
  speaking: "Talking…",
  listening: "Listening — go ahead",
  hearing: "Hearing you…",
  recording: "Recording — just talk while you work",
  thinking: "Thinking…",
  muted: "Mic paused",
  idle: "Getting ready…",
};

/* ---------- component ---------- */

export default function ReportWizard() {
  const { templateId } = useParams();
  const template = getTemplate(templateId);
  const navigate = useNavigate();
  const location = useLocation();
  const preset = location.state?.preset;

  const initial = preset?.address ? { location: preset.address } : {};
  const [data, setData] = useState(initial);
  const [phase, setPhase] = useState("pick"); // pick | running | done
  const [mode, setMode] = useState(null);
  const [status, setStatus] = useState("idle");
  const [caption, setCaption] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [currentField, setCurrentField] = useState(null);
  const [error, setError] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [engine, setEngine] = useState("realtime"); // realtime | basic
  const [lines, setLines] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [cost, setCost] = useState(0);
  const [offerBasic, setOfferBasic] = useState(false);

  const abortRef = useRef(null);
  const finishRef = useRef(null);
  const realtimeRef = useRef(null);
  const transcriptEnd = useRef(null);
  const chatEnd = useRef(null);

  useWakeLock(phase === "running");

  useEffect(() => {
    const off = onServiceError((msg) => setError(msg));
    return () => {
      off();
      abortRef.current?.abort();
      realtimeRef.current?.cancel();
      stopRecognition();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: "nearest" });
  }, [transcript]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!template) {
    return (
      <Page>
        <ErrorBox>That report template wasn't found.</ErrorBox>
        <Btn onClick={() => navigate("/home")}>Back to dashboard</Btn>
      </Page>
    );
  }

  const setField = async (key, value) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const finishWith = (finalData, spoken) => {
    const id = saveReport({ data: finalData, templateId: template.id, transcript: spoken });
    setReportId(id);
    setData(finalData);
    setPhase("done");
  };

  const startRealtime = async (which) => {
    setError(null);
    setOfferBasic(false);
    setEngine("realtime");
    setMode(which);
    setPhase("running");
    setLines([]);
    setCost(0);
    setMicOn(true);

    const ctl = startRealtimeReport(template, {
      mode: which,
      initialData: data,
      inspectorName: (localStorage.getItem("userName") || "").split(/\s+/)[0] || undefined,
      setField,
      onStatus: setStatus,
      onLine: setLines,
      onStep: setCurrentField,
      onCost: setCost,
    });
    realtimeRef.current = ctl;
    try {
      const res = await ctl.done;
      finishWith(
        res.data,
        res.transcript.map((l) => `${l.who === "you" ? "Inspector" : "FieldVoice"}: ${l.text}`)
      );
      if (res.cost > 0) setToast(`Report saved · voice cost ≈ $${res.cost.toFixed(2)}`);
    } catch (err) {
      setPhase("pick");
      if (err instanceof WizardCancelled) {
        setToast("Stopped — your answers are kept");
      } else {
        console.error("Realtime error:", err);
        setError(friendlyError(err));
        setOfferBasic(true);
      }
    } finally {
      realtimeRef.current = null;
      setCurrentField(null);
      setStatus("idle");
    }
  };

  const toggleMic = () => {
    const next = !micOn;
    realtimeRef.current?.setMicEnabled(next);
    setMicOn(next);
    setStatus(next ? "listening" : "muted");
  };

  const start = async (which) => {
    setError(null);
    setOfferBasic(false);
    setEngine("basic");
    if (!isSpeechRecognitionSupported()) {
      setError("This browser can't do speech recognition. Open FieldVoice in Chrome.");
      return;
    }
    try {
      startRecognition(); // must run inside the tap
    } catch (err) {
      setError(err.message);
      return;
    }

    const controller = new AbortController();
    const finisher = new AbortController();
    abortRef.current = controller;
    finishRef.current = finisher;
    setMode(which);
    setPhase("running");
    setTranscript([]);
    setCaption("");

    const common = {
      setField,
      initialData: data,
      onStep: setCurrentField,
      onStatus: setStatus,
      onSay: setCaption,
      signal: controller.signal,
    };

    try {
      let finalData;
      let spoken = [];
      if (which === "walkthrough") {
        const res = await runWalkthrough(template, {
          ...common,
          finishSignal: finisher.signal,
          onTranscript: setTranscript,
        });
        finalData = res.data;
        spoken = res.transcript;
      } else {
        finalData = await runWizard(template, common);
      }
      finishWith(finalData, spoken);
    } catch (err) {
      if (err instanceof WizardCancelled) {
        setPhase("pick");
        setToast("Stopped — your answers are kept");
      } else {
        console.error("Report error:", err);
        setError(`Something went wrong: ${err.message}. Your answers so far are kept.`);
        setPhase("pick");
      }
    } finally {
      stopRecognition();
      setCurrentField(null);
      setStatus("idle");
      abortRef.current = null;
      finishRef.current = null;
    }
  };

  const stop = () => {
    realtimeRef.current?.cancel();
    abortRef.current?.abort();
    stopRecognition();
    stopSpeaking();
  };

  const finish = () =>
    realtimeRef.current
      ? realtimeRef.current.finish()
      : finishRef.current?.abort(new FinishRequested());

  const run = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) setToast(okMsg);
    } catch (err) {
      if (err?.name !== "AbortError") setError(err.message);
    }
  };

  const saveEdits = () => {
    if (reportId) updateReport(reportId, data);
    setEditing(false);
    setToast("Changes saved");
  };

  const hasAnswers = Object.keys(data).some((k) => data[k] && !(k in initial));
  const steps = voiceSteps(template);
  const filled = steps.filter((s) => data[s.key]).length;

  let borderColor = "transparent";
  if (phase === "running") borderColor = "#f0a24a";
  else if (phase === "done") {
    const missing = steps.some((s) => s.required && !data[s.key]);
    borderColor = missing ? "#e05a5a" : "#3bb273";
  }

  return (
    <Page>
      <TopRow>
        <IconBtn onClick={() => (phase === "running" ? stop() : navigate("/home"))}>
          <ArrowLeft size={18} /> {phase === "running" ? "Stop" : "Dashboard"}
        </IconBtn>
      </TopRow>

      <div>
        <Title>{template.name}</Title>
        <Sub>
          {template.company?.name}
          {preset?.address ? ` · ${preset.address}` : ""}
        </Sub>
      </div>

      {error && <ErrorBox role="alert">{error}</ErrorBox>}
      {offerBasic && phase === "pick" && (
        <Fallback onClick={() => start("walkthrough")}>
          Use basic voice instead (robot voice, works without the AI voice)
        </Fallback>
      )}

      {phase === "pick" && (
        <>
          <ModeGrid>
            <ModeCard
              $primary
              whileTap={{ scale: 0.98 }}
              onClick={() => startRealtime("walkthrough")}
            >
              <ModeName>
                <Mic size={22} /> Walkthrough <Badge>Hands-free</Badge>
              </ModeName>
              <ModeDesc>
                Just talk while you work, like you would to a coworker. I'll fill in
                the report as you go and only ask about what you missed.
              </ModeDesc>
            </ModeCard>
            <ModeCard whileTap={{ scale: 0.98 }} onClick={() => startRealtime("interview")}>
              <ModeName>
                <ListChecks size={22} /> Step by step
              </ModeName>
              <ModeDesc>
                I'll walk you through each question in order. Interrupt me,
                skip, or go back anytime.
              </ModeDesc>
            </ModeCard>
          </ModeGrid>
          <Tip>
            Tip: pop in Bluetooth earbuds and put the phone in your pocket — the
            screen stays on while a report is running so the mic keeps listening.
          </Tip>
          {hasAnswers && (
            <Btn onClick={() => setData(initial)}>
              <RotateCcw size={18} /> Clear answers and start fresh
            </Btn>
          )}
        </>
      )}

      {phase === "running" && (
        <Session>
          <Orb $status={status}>
            {status === "thinking" ? <Pencil size={36} /> : <Mic size={40} />}
          </Orb>
          <StatusText aria-live="polite">{STATUS_TEXT[status]}</StatusText>
          {engine === "basic" && <Caption>{caption ? `“${caption}”` : ""}</Caption>}
          {engine === "realtime" && lines.length > 0 && (
            <Chat>
              {lines.map((l, i) => (
                <Bubble key={i} $me={l.who === "you"}>
                  {l.text}
                </Bubble>
              ))}
              <div ref={chatEnd} />
            </Chat>
          )}
          {engine === "basic" && mode === "walkthrough" && transcript.length > 0 && (
            <Transcript>
              {transcript.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
              <div ref={transcriptEnd} />
            </Transcript>
          )}
          <Sub>
            {filled} of {steps.length} sections filled
          </Sub>
          {engine === "realtime" && cost > 0 && <Sub>Voice cost so far ≈ ${cost.toFixed(2)}</Sub>}
          <Buttons>
            {engine === "realtime" && status !== "connecting" && (
              <Btn onClick={toggleMic}>
                {micOn ? <MicOff size={18} /> : <Mic size={18} />}
                {micOn ? "Pause mic" : "Resume mic"}
              </Btn>
            )}
            {((engine === "realtime" && status !== "connecting") ||
              (mode === "walkthrough" && status === "recording")) && (
              <Btn $primary onClick={finish}>
                <Check size={18} /> {engine === "realtime" ? "Finish & save" : "I'm done"}
              </Btn>
            )}
            <Btn $danger onClick={stop}>
              <Square size={16} /> Stop
            </Btn>
          </Buttons>
        </Session>
      )}

      {phase === "done" && (
        <>
          <Buttons>
            <Btn $primary onClick={() => run(() => printReport(template, data))}>
              <FileDown size={18} /> PDF
            </Btn>
            {canShare() && (
              <Btn onClick={() => run(() => shareReport(template, data))}>
                <Share2 size={18} /> Share
              </Btn>
            )}
            <Btn onClick={() => run(() => copyReport(template, data), "Report copied")}>
              <Copy size={18} /> Copy
            </Btn>
            <Btn onClick={() => (editing ? saveEdits() : setEditing(true))}>
              {editing ? <Check size={18} /> : <Pencil size={18} />}
              {editing ? "Save edits" : "Edit"}
            </Btn>
          </Buttons>

          {editing && (
            <EditPanel>
              {steps.map((s) => (
                <label key={s.key}>
                  {s.label}
                  <textarea
                    rows={s.type === "textarea" ? 5 : 2}
                    value={data[s.key] || ""}
                    onChange={(e) => setField(s.key, e.target.value)}
                  />
                </label>
              ))}
            </EditPanel>
          )}
        </>
      )}

      <AnimatePresence>
        <motion.div
          key="preview"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <PreviewCard
            data={data}
            template={template}
            highlightKey={currentField}
            $borderColor={borderColor}
          />
        </motion.div>
      </AnimatePresence>

      {phase === "done" && (
        <Buttons>
          <Btn
            onClick={() => {
              setData(initial);
              setReportId(null);
              setEditing(false);
              setPhase("pick");
            }}
          >
            <RotateCcw size={18} /> New report
          </Btn>
          <Btn onClick={() => navigate("/view-reports")}>All reports</Btn>
        </Buttons>
      )}

      <AnimatePresence>
        {toast && (
          <Toast
            initial={{ opacity: 0, y: 12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 12, x: "-50%" }}
          >
            {toast}
          </Toast>
        )}
      </AnimatePresence>
    </Page>
  );
}
