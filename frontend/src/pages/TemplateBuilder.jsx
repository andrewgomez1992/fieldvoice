import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Wand2, Save, Trash2, ArrowLeft, Mic } from "lucide-react";
import PreviewCard from "../components/reports/CauseOrigin/PreviewCard";
import { buildTemplate } from "../engine/buildTemplate";
import { saveTemplate, listTemplates, deleteTemplate } from "../templates";

const EXAMPLE = `Mold Assessment Report
Harbor Restoration Co.
Date: March 4, 2026
Inspector: Dana Ruiz
Property: 418 Willow Lane, Sacramento, CA

Upon arrival I met with the homeowner, who reported a musty odor in the hall closet. I performed a visual inspection and moisture survey of the affected and surrounding areas.

Findings
Visible mold growth was observed on the lower 18 inches of drywall on the back wall of the hall closet, approximately 12 square feet. Moisture readings on the affected drywall were 42% compared to 9% on unaffected walls.

Probable Source
The probable source of moisture is a slow leak at the water heater supply line behind the closet wall.

Recommendations
Remove and discard affected drywall under containment, repair the supply line, dry the cavity to dry standard, and apply antimicrobial before rebuild.

This assessment is limited to the areas accessible at the time of inspection.`;

const Page = styled.div`
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 32px;
`;

const Back = styled.button`
  align-self: flex-start;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.primary};
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font: inherit;
  cursor: pointer;
  padding: 4px 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const Sub = styled.p`
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.45;
`;

const Panel = styled.div`
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(20, 30, 60, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  min-width: 0;
  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    line-height: 1.45;
    font: inherit;
    font-weight: 400;
    font-size: 0.92rem;
    border: 1px solid #d3d8e6;
    border-radius: 8px;
    padding: 10px;
  }
  textarea {
    resize: vertical;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 14px;
  border-radius: 10px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.primary : "#fff")};
  color: ${({ $primary, theme }) => ($primary ? "#fff" : theme.colors.primary)};
  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }
`;

const LinkBtn = styled.button`
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.secondary};
  text-decoration: underline;
  cursor: pointer;
  align-self: flex-start;
`;

const ErrorBox = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  background: #fdecec;
  color: #a12626;
  font-size: 0.9rem;
`;

const StepRow = styled.div`
  border: 1px solid #e3e7f0;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  input {
    font: inherit;
    font-size: 0.88rem;
    border: 1px solid #d3d8e6;
    border-radius: 6px;
    padding: 6px 8px;
  }
`;

const Small = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SavedItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  button {
    border: none;
    background: none;
    color: #c93545;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font: inherit;
    font-size: 0.82rem;
  }
`;

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [reportName, setReportName] = useState("");
  const [sample, setSample] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [custom, setCustom] = useState(() => listTemplates().filter((t) => t.custom));
  const [confirmId, setConfirmId] = useState(null);

  const build = async () => {
    setError(null);
    if (!companyName.trim() || sample.trim().length < 80) {
      setError("Add the company name and paste a full finished report (a few paragraphs at least).");
      return;
    }
    setBusy(true);
    try {
      setDraft(await buildTemplate({ sample, companyName, reportName }));
    } catch (err) {
      console.error(err);
      setError(`Couldn't build the template: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const updateStep = (i, patch) =>
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));

  const save = () => {
    const id = saveTemplate(draft);
    navigate(`/report/${id}`);
  };

  const remove = (id) => {
    if (confirmId !== id) return setConfirmId(id);
    deleteTemplate(id);
    setCustom(listTemplates().filter((t) => t.custom));
    setConfirmId(null);
  };

  return (
    <Page>
      <Back onClick={() => navigate("/home")}>
        <ArrowLeft size={18} /> Dashboard
      </Back>
      <div>
        <Title>Set up a company report</Title>
        <Sub>
          Paste in one finished report exactly as the company sends it. FieldVoice
          keeps their standard wording word for word, works out which parts change
          from job to job, and turns those into questions.
        </Sub>
      </div>

      {error && <ErrorBox role="alert">{error}</ErrorBox>}

      {!draft && (
        <Panel>
          <Row>
            <Field>
              Company name
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Harbor Restoration"
              />
            </Field>
            <Field>
              Report name
              <input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g. Mold Assessment"
              />
            </Field>
          </Row>
          <Field>
            A finished report
            <textarea
              rows={12}
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              placeholder="Paste a complete report here…"
            />
          </Field>
          <LinkBtn
            onClick={() => {
              setCompanyName("Harbor Restoration Co.");
              setReportName("Mold Assessment");
              setSample(EXAMPLE);
            }}
          >
            Use an example report
          </LinkBtn>
          <Btn $primary onClick={build} disabled={busy}>
            <Wand2 size={18} /> {busy ? "Reading the report…" : "Build template"}
          </Btn>
        </Panel>
      )}

      {draft && (
        <>
          <Panel>
            <strong>Questions FieldVoice will ask</strong>
            <Small>Tweak the wording if you like. These are spoken out loud.</Small>
            {draft.steps.map((s, i) => (
              <StepRow key={s.key}>
                <input
                  aria-label="Field name"
                  value={s.label}
                  onChange={(e) => updateStep(i, { label: e.target.value })}
                />
                <input
                  aria-label="Question"
                  value={s.question}
                  disabled={s.type === "date"}
                  onChange={(e) => updateStep(i, { question: e.target.value })}
                />
                <Small>
                  {s.type === "textarea" ? "Longer answer" : s.type === "date" ? "Date (auto-filled)" : "Short answer"}
                  {s.required ? " · required" : " · optional"}
                </Small>
              </StepRow>
            ))}
          </Panel>

          <Small>Report preview — the grey tags fill in from what the inspector says.</Small>
          <PreviewCard data={{}} template={draft} />

          <Row>
            <Btn onClick={() => setDraft(null)}>Start over</Btn>
            <Btn $primary onClick={save}>
              <Save size={18} /> Save &amp; try it
            </Btn>
          </Row>
        </>
      )}

      {custom.length > 0 && !draft && (
        <Panel>
          <strong>Company templates on this device</strong>
          {custom.map((t) => (
            <SavedItem key={t.id}>
              <span>
                {t.company?.name} — {t.name}
              </span>
              <span style={{ display: "flex", gap: 12 }}>
                <button style={{ color: "#2d2d72" }} onClick={() => navigate(`/report/${t.id}`)}>
                  <Mic size={14} /> Use
                </button>
                <button onClick={() => remove(t.id)}>
                  <Trash2 size={14} /> {confirmId === t.id ? "Tap to confirm" : "Delete"}
                </button>
              </span>
            </SavedItem>
          ))}
        </Panel>
      )}
    </Page>
  );
}
