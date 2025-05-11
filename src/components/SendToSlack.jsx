import React from "react";
import styled from "styled-components";

const Button = styled.button`
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

export const SendToSlackButton = ({ onClick, children = "Send to Slack" }) => (
  <Button onClick={onClick}>{children}</Button>
);

export default SendToSlackButton;
