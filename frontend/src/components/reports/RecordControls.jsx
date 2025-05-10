import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: ${(props) =>
    props.primary ? props.theme.colors.primary : "#e2e8f0"};
  color: ${(props) => (props.primary ? "white" : "black")};
  cursor: pointer;
`;

export const RecordControls = ({ onStop, onContinue, onRestart }) => (
  <Wrapper>
    <Button onClick={onStop}>Stop</Button>
    <Button onClick={onContinue}>Continue</Button>
    <Button onClick={onRestart}>Restart</Button>
  </Wrapper>
);
