import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import PreviewCard from "./PreviewCard";
import SendToSlackButton from "../SendToSlack";
import { steps } from "./steps";

const WizardContainer = styled.div`
  max-width: 800px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.primaryDark};
  text-align: center;
`;

const FormContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BackButton = styled.button`
  align-self: flex-start;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.secondary};
  color: white;
  cursor: pointer;
  margin-top: 16px;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const StartButton = styled.button`
  width: 100%;
  padding: 12px 0;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
  }
`;

export const ReportWizard = () => {
  const { watch, setValue } = useForm();
  const [finalReport, setFinalReport] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const recognitionRef = useRef(null);
  const data = watch();
  const navigate = useNavigate();

  const speak = (text) =>
    new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 1;
      utter.onend = resolve;
      window.speechSynthesis.speak(utter);
    });

  const listen = (key) =>
    new Promise((resolve) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert("Speech recognition not supported in this browser.");
        return resolve("");
      }
      const recog = new SR();
      recog.lang = "en-US";
      recog.interimResults = false;
      recog.maxAlternatives = 1;
      recog.onresult = (e) => {
        const t = e.results[0][0].transcript;
        setValue(key, t);
        resolve(t);
      };
      recog.onerror = () => resolve("");
      recog.start();
      recognitionRef.current = recog;
    });

  const stopRecording = () => recognitionRef.current?.stop();
  const continueRecording = () => recognitionRef.current?.start();

  const generateReport = ({
    author,
    date,
    location,
    area,
    desc,
    cause,
    duration,
    moisture,
  }) =>
    `Cause & Origin Report    City Water Conservation    ${date}\n\n` +
    `Prepared by: ${author}\n\n` +
    `Location: ${location}\n\n` +
    `The insured granted me access upon arrival and I obtained verbal authorization to perform my inspection. They stated there was water damage to the master bedroom and bathroom. I found water damage to the areas pictured. I found moisture and thermal readings present in the areas pictured and labeled.\n\n` +
    `Area of Concern (${area})\n\n${desc}\n\n` +
    `Area of Concern Cause\n\n${cause}\n\n` +
    `Area of Concern Duration\n\n${duration}\n\n` +
    `All estimated times of duration are based on hands on experience. There may be hidden damages at the time of inspection associated to the leak that could impact the estimated duration/cause of the damage once uncovered.\n\n` +
    `After testing I used the moisture meter and found ${moisture}.`;

  const startConversation = async () => {
    await speak("Hey, filling out a cause and origin report?");
    const ans = await listen();
    if (!ans.toLowerCase().includes("yes")) {
      await speak("Okay, bye");
      return;
    }
    for (let i = 0; i < steps.length; i++) {
      await speak(steps[i].label);
      await listen(steps[i].key);
      await new Promise((r) => setTimeout(r, 300));
    }
    const rpt = generateReport(data);
    setFinalReport(rpt);
  };

  const handleToggle = () => {
    if (!hasStarted) {
      startConversation();
      setHasStarted(true);
    } else if (!isPaused) {
      stopRecording();
      setIsPaused(true);
    } else {
      continueRecording();
      setIsPaused(false);
    }
  };

  const handleSend = () => {
    // TODO: integrate Slack API here
    navigate("/");
  };

  const buttonLabel = !hasStarted
    ? "Start Report"
    : isPaused
    ? "Resume"
    : "Pause";

  return (
    <WizardContainer>
      <Header>Cause & Origin Report</Header>
      <FormContainer>
        {!finalReport ? (
          <>
            <StartButton onClick={handleToggle}>{buttonLabel}</StartButton>
            <PreviewCard data={data} />
            <BackButton onClick={() => navigate(-1)}>Back</BackButton>
          </>
        ) : (
          <>
            <PreviewCard data={{ report: finalReport }} />
            <SendToSlackButton onClick={handleSend} />
            <BackButton onClick={() => navigate(-1)}>Back</BackButton>
          </>
        )}
      </FormContainer>
    </WizardContainer>
  );
};

export default ReportWizard;
