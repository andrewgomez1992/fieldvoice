import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ChevronDown } from "lucide-react";
import PreviewCard from "../components/reports/CauseOrigin/PreviewCard";
import { getTemplate } from "../templates";

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
  border-radius: 4px;
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

const ToggleIcon = styled(ChevronDown)`
  color: ${({ theme }) => theme.colors.primary};
  transition: transform 0.2s;
  ${({ open }) => open && `transform: rotate(-180deg);`}
`;

// Collapsible body container: always mounted, instantly toggles height
const ItemBody = styled.div`
  max-height: ${({ open }) => (open ? "2000px" : "0")};
  overflow: hidden;
  transition: max-height 0ms;
`;

export default function ViewReports() {
  const [reports, setReports] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setReports(JSON.parse(localStorage.getItem("reports") || "[]"));
  }, []);

  return (
    <Wrapper>
      <Title>Your Saved Reports</Title>

      {reports.length === 0 ? (
        <p>No reports yet. Start a report from the dashboard to create one.</p>
      ) : (
        <List>
          {reports.map(({ id, timestamp, data, templateId }) => {
            const isOpen = openId === id;
            const tmpl = getTemplate(templateId);
            return (
              <ItemCard key={id}>
                <ItemHeader onClick={() => setOpenId(isOpen ? null : id)}>
                  <ItemDate>{new Date(timestamp).toLocaleString()}</ItemDate>
                  <ToggleIcon open={isOpen} size={20} />
                </ItemHeader>

                <ItemBody open={isOpen}>
                  <PreviewCard
                    data={data}
                    template={tmpl}
                    highlightKey={null}
                    $borderColor="transparent"
                  />
                </ItemBody>
              </ItemCard>
            );
          })}
        </List>
      )}
    </Wrapper>
  );
}
