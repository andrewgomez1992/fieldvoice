import React from "react";
import styled from "styled-components";

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
  border-radius: 8px;
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

// Highlighted variants
const HighlightedTitleRight = styled(TitleRight)`
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.div`
  font-weight: bold;
  font-size: 1rem;
  margin-top: 16px;
  margin-bottom: 12px;
`;

const HighlightedLabel = styled(Label)`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  padding-left: 8px;
`;

const Paragraph = styled.p`
  margin: 0 0 16px;
  line-height: 1.4;
`;

const HighlightedParagraph = styled(Paragraph)`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  padding-left: 8px;
`;

const PreviewCard = ({ data, highlightKey }) => {
  const { author, date, location, area, desc, cause, duration, moisture } =
    data || {};

  return (
    <Wrapper>
      {author && <AuthorHeader>Prepared by: {author}</AuthorHeader>}
      <Card>
        <HeaderBar>
          <TitleLeft>Cause & Origin Report</TitleLeft>
          <TitleCenter>City Water Conservation</TitleCenter>
          {highlightKey === "date" ? (
            <HighlightedTitleRight>
              {date || "YYYY-MM-DD"}
            </HighlightedTitleRight>
          ) : (
            <TitleRight>{date || "YYYY-MM-DD"}</TitleRight>
          )}
        </HeaderBar>
        <Body>
          {/* Location */}
          {highlightKey === "location" ? (
            <HighlightedLabel>
              Location: {location || "[Location]"}
            </HighlightedLabel>
          ) : (
            <Label>Location: {location || "[Location]"}</Label>
          )}
          <Paragraph>
            The insured granted me access upon arrival and I obtained verbal
            authorization to perform my inspection. They stated there was water
            damage to the {area || "[Area]"}. I found water damage to the areas
            pictured and found moisture and thermal readings present.
          </Paragraph>

          {/* Area of Concern */}
          {highlightKey === "area" ? (
            <HighlightedLabel>
              Area of Concern ({area || "[Area]"})
            </HighlightedLabel>
          ) : (
            <Label>Area of Concern ({area || "[Area]"})</Label>
          )}
          {highlightKey === "desc" ? (
            <HighlightedParagraph>
              {desc || "[Description]"}
            </HighlightedParagraph>
          ) : (
            <Paragraph>{desc || "[Description]"}</Paragraph>
          )}

          {/* Cause */}
          {highlightKey === "cause" ? (
            <HighlightedLabel>Area of Concern Cause</HighlightedLabel>
          ) : (
            <Label>Area of Concern Cause</Label>
          )}
          {highlightKey === "cause" ? (
            <HighlightedParagraph>
              The cause of the leak appears to be {cause || "[Cause]"}.
            </HighlightedParagraph>
          ) : (
            <Paragraph>
              The cause of the leak appears to be {cause || "[Cause]"}.
            </Paragraph>
          )}

          {/* Duration */}
          {highlightKey === "duration" ? (
            <HighlightedLabel>Area of Concern Duration</HighlightedLabel>
          ) : (
            <Label>Area of Concern Duration</Label>
          )}
          {highlightKey === "duration" ? (
            <HighlightedParagraph>
              The duration of the leak appears to be {duration || "[Duration]"}{" "}
              based on the extent of the damage to the affected building
              materials.
            </HighlightedParagraph>
          ) : (
            <Paragraph>
              The duration of the leak appears to be {duration || "[Duration]"}{" "}
              based on the extent of the damage to the affected building
              materials.
            </Paragraph>
          )}

          {/* Moisture */}
          {highlightKey === "moisture" ? (
            <HighlightedParagraph>
              After testing I used the moisture meter and found{" "}
              {moisture || "[Moisture]"}.
            </HighlightedParagraph>
          ) : (
            <Paragraph>
              After testing I used the moisture meter and found{" "}
              {moisture || "[Moisture]"}.
            </Paragraph>
          )}
        </Body>
      </Card>
    </Wrapper>
  );
};

export default PreviewCard;
