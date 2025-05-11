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
  border-radius: 4px;
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

const Paragraph = styled.p`
  margin: 0 0 16px;
  line-height: 1.4;
`;

const PreviewCard = ({ data }) => {
  const { author, date, location, area, desc, cause, duration, moisture } =
    data || {};

  return (
    <Wrapper>
      {author && <AuthorHeader>Prepared by: {author}</AuthorHeader>}
      <Card>
        <HeaderBar>
          <TitleLeft>Cause & Origin Report</TitleLeft>
          <TitleCenter>City Water Conservation</TitleCenter>
          <TitleRight>{date || "YYYY-MM-DD"}</TitleRight>
        </HeaderBar>
        <Body>
          <Label>Location: {location || "[Location]"}</Label>
          <Paragraph>
            The insured granted me access upon arrival and I obtained verbal
            authorization to perform my inspection. They stated there was water
            damage to the master bedroom and bathroom. I found water damage to
            the areas pictured. I found moisture and thermal readings present in
            the areas pictured and labeled.
          </Paragraph>
          <Label>Area of Concern ({area || "[Area]"})</Label>
          <Paragraph>{desc || "[Description]"}</Paragraph>
          <Label>Area of Concern Cause</Label>
          <Paragraph>{cause || "[Cause]"}</Paragraph>
          <Label>Area of Concern Duration</Label>
          <Paragraph>{duration || "[Duration]"}</Paragraph>
          <Paragraph>
            All estimated times of duration are based on hands on experience.
            There may be hidden damages at the time of inspection associated to
            the leak that could impact the estimated duration/cause of the
            damage once uncovered.
          </Paragraph>
          <Paragraph>
            After testing I used the moisture meter and found{" "}
            {moisture || "[Moisture]"}.
          </Paragraph>
        </Body>
      </Card>
    </Wrapper>
  );
};

export default PreviewCard;
