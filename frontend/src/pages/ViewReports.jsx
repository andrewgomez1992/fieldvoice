import React, { useState } from "react";
import styled from "styled-components";
import { ChevronDown, FileDown, Copy, Share2, Trash2 } from "lucide-react";
import PreviewCard from "../components/reports/CauseOrigin/PreviewCard";
import { getTemplate } from "../templates";
import { listReports, deleteReport } from "../engine/formatOutput";
import { printReport, copyReport, shareReport, canShare } from "../engine/exportReport";

const Wrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 8px 0 32px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const Empty = styled.div`
  background: #fff;
  border-radius: 14px;
  padding: 28px 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Item = styled.div`
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(20, 30, 60, 0.07);
  overflow: hidden;
`;

const Header = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  font: inherit;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
`;

const Name = styled.div`
  font-weight: 700;
  color: #1f2533;
  font-size: 0.95rem;
`;

const Meta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const Toggle = styled(ChevronDown)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.primary};
  transition: transform 0.2s;
  transform: rotate(${({ $open }) => ($open ? "-180deg" : "0")});
`;

const Body = styled.div`
  padding: 0 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Action = styled.button`
  flex: 1;
  min-width: 90px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid ${({ $danger, theme }) => ($danger ? "#c93545" : theme.colors.primary)};
  color: ${({ $danger, theme }) => ($danger ? "#c93545" : theme.colors.primary)};
  background: #fff;
`;

export default function ViewReports() {
  const [reports, setReports] = useState(listReports);
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [note, setNote] = useState(null);

  const act = async (fn, msg) => {
    try {
      await fn();
      if (msg) {
        setNote(msg);
        setTimeout(() => setNote(null), 2000);
      }
    } catch (err) {
      if (err?.name !== "AbortError") setNote(err.message);
    }
  };

  const remove = (id) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    deleteReport(id);
    setReports(listReports());
    setConfirmId(null);
  };

  return (
    <Wrapper>
      <Title>Reports</Title>
      {note && <Meta style={{ marginBottom: 12 }}>{note}</Meta>}

      {reports.length === 0 ? (
        <Empty>No reports yet. Start one from the dashboard.</Empty>
      ) : (
        <List>
          {reports.map(({ id, timestamp, data, templateId }) => {
            const open = openId === id;
            const tmpl = getTemplate(templateId);
            return (
              <Item key={id}>
                <Header onClick={() => setOpenId(open ? null : id)}>
                  <div>
                    <Name>{data?.location || data?.area || tmpl?.name || "Report"}</Name>
                    <Meta>
                      {tmpl?.name || "Unknown template"} ·{" "}
                      {new Date(timestamp).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Meta>
                  </div>
                  <Toggle $open={open} size={20} />
                </Header>

                {open && tmpl && (
                  <Body>
                    <Actions>
                      <Action onClick={() => act(() => printReport(tmpl, data))}>
                        <FileDown size={16} /> PDF
                      </Action>
                      {canShare() && (
                        <Action onClick={() => act(() => shareReport(tmpl, data))}>
                          <Share2 size={16} /> Share
                        </Action>
                      )}
                      <Action onClick={() => act(() => copyReport(tmpl, data), "Copied")}>
                        <Copy size={16} /> Copy
                      </Action>
                      <Action $danger onClick={() => remove(id)}>
                        <Trash2 size={16} />
                        {confirmId === id ? "Tap to confirm" : "Delete"}
                      </Action>
                    </Actions>
                    <PreviewCard data={data} template={tmpl} />
                  </Body>
                )}
                {open && !tmpl && (
                  <Body>
                    <Meta>This report's template was deleted from this device.</Meta>
                  </Body>
                )}
              </Item>
            );
          })}
        </List>
      )}
    </Wrapper>
  );
}
