import React from "react";
import styled from "styled-components";
import { Controller } from "react-hook-form";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { steps } from "./steps";

const FieldWrapper = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 40px 8px 8px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
`;

const MicButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
`;

export const StepField = ({ step, control, listen }) => {
  // guard against invalid step index
  if (step < 0 || step >= steps.length) return null;
  const { key, label, multiline } = steps[step];
  return (
    <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FieldWrapper>
        <Controller
          name={key}
          control={control}
          render={({ field }) =>
            multiline ? (
              <TextArea {...field} rows={4} placeholder={label} />
            ) : (
              <Input {...field} placeholder={label} />
            )
          }
        />
        <MicButton type="button" onClick={() => listen(key)}>
          🎙️
        </MicButton>
      </FieldWrapper>
    </motion.div>
  );
};
({ step, control, listen }) => {
  const { key, label, multiline } = steps[step];
  return (
    <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FieldWrapper>
        <Controller
          name={key}
          control={control}
          render={({ field }) =>
            multiline ? (
              <TextArea {...field} rows={4} placeholder={label} />
            ) : (
              <Input {...field} placeholder={label} />
            )
          }
        />
        <MicButton type="button" onClick={() => listen(key)}>
          🎙️
        </MicButton>
      </FieldWrapper>
    </motion.div>
  );
};
