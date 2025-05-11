import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 6px;

  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
`;

const WidgetCard = styled.div`
  background: ${({ theme, disabled }) =>
    disabled
      ? theme.colors.backgroundCardDisabled
      : theme.colors.backgroundCard};
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
`;

const IconPlaceholder = styled.div`
  width: 48px;
  height: 48px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  margin-bottom: 12px;
`;

const Label = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
  padding: 0 8px;
`;

const Home = () => {
  const navigate = useNavigate();
  return (
    <Grid>
      <WidgetCard onClick={() => navigate("/report")}>
        <IconPlaceholder />
        <Label>Cause & Origin Report</Label>
      </WidgetCard>
      <WidgetCard disabled>
        <IconPlaceholder />
        <Label>Coming Soon</Label>
      </WidgetCard>
      <WidgetCard disabled>
        <IconPlaceholder />
        <Label>Coming Soon</Label>
      </WidgetCard>
    </Grid>
  );
};

export default Home;
