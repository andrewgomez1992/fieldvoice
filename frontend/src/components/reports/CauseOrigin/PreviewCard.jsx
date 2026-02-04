import React from "react";
import styled, { css } from "styled-components";

const Wrapper = styled.div`
  flex: 1;
`;

const AuthorHeader = styled.div`
  font-size: 0.675rem;
  font-weight: bold;
  margin-bottom: 8px;
`;

const Card = styled.div`
  background: white;
  padding: 16px;
  border-radius: 4px;
  border: 2px solid ${({ $borderColor }) => $borderColor || "transparent"};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 0.775rem;
  line-height: 1.4;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.55rem;
  color: #555;
  margin-bottom: 16px;
`;

const TitleLeft = styled.div`
  font-weight: bold;
`;
const TitleCenter = styled.div`
  font-style: italic;
`;
const TitleRight = styled.div`
  text-align: right;
`;

// Highlighted date
const HighlightedTitleRight = styled(TitleRight)`
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
`;

// shared highlight style for labels/paragraphs
const highlightStyle = css`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  padding-left: 8px;
`;

const Label = styled.div`
  font-weight: bold;
  font-size: 1rem;
  margin-top: 16px;
  margin-bottom: 12px;
  ${({ $highlight }) => $highlight && highlightStyle}
`;

const Paragraph = styled.p`
  margin: 0 0 16px;
  line-height: 1.4;
  ${({ $highlight }) => $highlight && highlightStyle}
`;

const PreviewCard = ({ data, template, highlightKey, $borderColor }) => {
  const { author, date, location, area, desc, cause, duration, moisture } =
    data || {};

  return (
    <Wrapper>
      {author && <AuthorHeader>Prepared by: {author}</AuthorHeader>}
      <Card $borderColor={$borderColor}>
        <HeaderBar>
          <TitleLeft>{template?.name || "Report"}</TitleLeft>
          <TitleCenter>{template?.company?.name || ""}</TitleCenter>
          {highlightKey === "date" ? (
            <HighlightedTitleRight>
              {date || "YYYY-MM-DD"}
            </HighlightedTitleRight>
          ) : (
            <TitleRight>{date || "YYYY-MM-DD"}</TitleRight>
          )}
        </HeaderBar>

        <Label $highlight={highlightKey === "location"}>
          Location: {location || "[Location]"}
        </Label>
        <Paragraph>
          The insured granted me access upon arrival and I obtained verbal
          authorization to perform my inspection. They stated there was water
          damage to the {area || "[Area]"}. I found water damage to the areas
          pictured and found moisture and thermal readings present.
        </Paragraph>

        <Label $highlight={highlightKey === "area"}>
          Area of Concern ({area || "[Area]"})
        </Label>
        <Paragraph $highlight={highlightKey === "desc"}>
          {desc || "[Description]"}
        </Paragraph>

        <Label $highlight={highlightKey === "cause"}>
          Area of Concern Cause
        </Label>
        <Paragraph $highlight={highlightKey === "cause"}>
          The cause of the leak appears to be {cause || "[Cause]"}.
        </Paragraph>

        <Label $highlight={highlightKey === "duration"}>
          Area of Concern Duration
        </Label>
        <Paragraph $highlight={highlightKey === "duration"}>
          The duration of the leak appears to be {duration || "[Duration]"}{" "}
          based on the extent of the damage to the affected building materials.
        </Paragraph>

        <Paragraph $highlight={highlightKey === "moisture"}>
          After testing I used the moisture meter and found{" "}
          {moisture || "[Moisture]"}.
        </Paragraph>
      </Card>
    </Wrapper>
  );
};

export default React.memo(PreviewCard);
