import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ChevronDown, ChevronUp } from "lucide-react";
import PreviewCard from "../reports/PreviewCard";

const Wrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ItemCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.backgroundAlt};
`;

const ItemDate = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const ToggleIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
`;

export default function ReportsView() {
  const [reports, setReports] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setReports(JSON.parse(localStorage.getItem("reports") || "[]"));
  }, []);

  return (
    <Wrapper>
      <Title>Your Saved Reports</Title>
      {reports.length === 0 ? (
        <p>No reports yet. Click “Cause & Origin Report” to create one.</p>
      ) : (
        <List>
          {reports.map(({ id, timestamp, data }) => {
            const isOpen = openId === id;
            return (
              <ItemCard key={id}>
                <ItemHeader onClick={() => setOpenId(isOpen ? null : id)}>
                  <ItemDate>{new Date(timestamp).toLocaleString()}</ItemDate>
                  <ToggleIcon>
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </ToggleIcon>
                </ItemHeader>

                {isOpen && (
                  <PreviewCard
                    data={data}
                    highlightKey={null}
                    $borderColor="transparent"
                  />
                )}
              </ItemCard>
            );
          })}
        </List>
      )}
    </Wrapper>
  );
}
