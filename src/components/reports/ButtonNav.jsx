import React from "react";
import styled from "styled-components";

const NavWrapper = styled.div`
  display: flex;
  justify-content: space-between;
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

export const ButtonNav = ({ step, total, onPrev, onNext, onFinish }) => (
  <NavWrapper>
    {step > 0 && <Button onClick={onPrev}>Back</Button>}
    {step < total - 1 ? (
      <Button primary onClick={onNext}>
        Next
      </Button>
    ) : (
      <Button primary onClick={onFinish}>
        Finish
      </Button>
    )}
  </NavWrapper>
);
