import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import PreviewCard from "./PreviewCard";
import SendToSlackButton from "../SendToSlack";
import { steps } from "./steps";
import { chat } from "../chat/ChatModel";

const WizardContainer = styled.div`
  max-width: 800px;
  margin: 32px auto;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 12px;
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

const ControlButton = styled.button`
  width: 100%;
  padding: 12px 0;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  border-radius: 6px;
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const data = watch();

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

  const handleStart = async () => {
    setIsLoading(true);
    const history = [
      {
        role: "system",
        content: "You are an assistant collecting a cause & origin report.",
      },
      {
        role: "assistant",
        content: "Hey, filling out a cause and origin report?",
      },
    ];

    // initial reply
    const initialReply = await chat(history);
    history.push({ role: "user", content: initialReply });
    if (!initialReply.toLowerCase().includes("yes")) {
      await chat([...history, { role: "assistant", content: "Okay, bye" }]);
      setIsLoading(false);
      return;
    }

    // loop through steps
    for (const step of steps) {
      history.push({ role: "assistant", content: step.label });
      const answer = await chat(history);
      history.push({ role: "user", content: answer });
      setValue(step.key, answer);
    }

    // generate report
    const report = generateReport(data);
    setFinalReport(report);
    setIsLoading(false);
  };

  return (
    <WizardContainer>
      <Header>Cause & Origin Report</Header>
      <FormContainer>
        {!finalReport ? (
          <>
            <ControlButton onClick={handleStart} disabled={isLoading}>
              {isLoading ? "Working..." : "Start Report"}
            </ControlButton>
            <PreviewCard data={data} />
            <BackButton onClick={() => navigate(-1)}>Back</BackButton>
          </>
        ) : (
          <>
            <PreviewCard data={{ report: finalReport }} />
            <SendToSlackButton
              onClick={() => {
                /* TODO: Slack */ navigate("/");
              }}
            >
              Send to Slack
            </SendToSlackButton>
            <BackButton onClick={() => navigate(-1)}>Back</BackButton>
          </>
        )}
      </FormContainer>
    </WizardContainer>
  );
};

export default ReportWizard;
