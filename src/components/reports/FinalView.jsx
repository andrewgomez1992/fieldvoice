import React from "react";
import styled from "styled-components";
import PreviewCard from "./PreviewCard";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
`;

export const FinalView = ({ report, grammarChecked }) => (
  <Wrapper>
    <PreviewCard data={{ report }} />
    {grammarChecked ? (
      <p>Grammar and spelling checked.</p>
    ) : (
      <p>Checking grammar and spelling...</p>
    )}
  </Wrapper>
);
