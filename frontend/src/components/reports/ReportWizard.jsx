import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import PreviewCard from "./PreviewCard";
import SendToSlackButton from "../slack/SendToSlack";
import { steps } from "./steps";
import { runReportWizard } from "../chat/ChatModel";

const WizardContainer = styled.div`
  position: relative;
  max-width: 800px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  background: ${({ primary, theme }) =>
    primary ? theme.colors.primary : "transparent"};
  color: ${({ primary, theme }) => (primary ? "#fff" : theme.colors.primary)};
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const ReportWizard = () => {
  const { watch, setValue } = useForm();
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const navigate = useNavigate();
  const data = watch();

  // Which fields must be filled?
  const requiredFields = [
    "author",
    "date",
    "location",
    "area",
    "desc",
    "cause",
    "duration",
    "moisture",
  ];
  const hasMissing = requiredFields.some(
    (k) => !data[k] || String(data[k]).trim() === ""
  );

  // Compute borderColor only—PreviewCard handles the actual drawing
  let borderColor = "transparent";
  if (started && !completed) borderColor = "orange";
  else if (completed && hasMissing) borderColor = "red";
  else if (completed && !hasMissing) borderColor = "green";

  const handleStart = async () => {
    setStarted(true);
    setIsLoading(true);
    try {
      await runReportWizard(steps, setValue, {
        onStep: (key) => setCurrentField(key),
        onListening: () => {},
      });

      // slight pause so they notice the color flip
      await new Promise((r) => setTimeout(r, 200));
      setCompleted(true);
    } catch (err) {
      console.error("ReportWizard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WizardContainer>
      <Header>Cause & Origin Report</Header>
      <FormContainer>
        {!completed ? (
          <>
            <ControlButton primary onClick={handleStart} disabled={isLoading}>
              {isLoading ? "Working…" : "Start Report"}
            </ControlButton>

            <AnimatePresence>
              <motion.div
                key="preview-running"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.4 }}
              >
                <PreviewCard
                  data={data}
                  highlightKey={currentField}
                  $borderColor={borderColor}
                />
              </motion.div>
            </AnimatePresence>

            <BackButton onClick={() => navigate(-1)}>Back</BackButton>
          </>
        ) : (
          <>
            <AnimatePresence>
              <motion.div
                key="preview-final"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.4 }}
              >
                <PreviewCard
                  data={data}
                  highlightKey={null}
                  $borderColor={borderColor}
                />
              </motion.div>
            </AnimatePresence>

            <SendToSlackButton onClick={() => navigate("/")}>
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
