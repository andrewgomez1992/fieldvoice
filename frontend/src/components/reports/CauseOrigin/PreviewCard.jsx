import React from "react";
import styled, { css } from "styled-components";
import { NOT_STATED } from "../../../engine/applyRefine";

/**
 * Live preview of any template's report. Placeholders fill in as answers
 * arrive; empty ones show the field name, and the field being worked on
 * is highlighted.
 */

const Card = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  border: 2px solid ${({ $borderColor }) => $borderColor || "transparent"};
  box-shadow: 0 2px 10px rgba(20, 30, 60, 0.08);
  font-size: 0.85rem;
  line-height: 1.55;
  color: #1f2533;
  transition: border-color 0.3s;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
`;

const Company = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const Meta = styled.div`
  font-size: 0.72rem;
  color: #667;
  text-align: right;
`;

const highlight = css`
  background: rgba(45, 45, 114, 0.06);
  box-shadow: -4px 0 0 ${({ theme }) => theme.colors.primary};
`;

const Heading = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  margin: 18px 0 6px;
  padding: 2px 6px;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.primaryDark};
  ${({ $active }) => $active && highlight}
`;

const Paragraph = styled.p`
  margin: 0 0 12px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.3s;
  ${({ $active }) => $active && highlight}
`;

const Value = styled.span`
  ${({ $fresh }) =>
    $fresh &&
    css`
      background: #fff6c9;
      border-radius: 3px;
    `}
`;

const Missing = styled.span`
  display: inline-block;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 0.78rem;
  line-height: 1.5;
  background: ${({ $warn }) => ($warn ? "#fff1e0" : "#eef0f6")};
  color: ${({ $warn }) => ($warn ? "#b25e00" : "#7a8199")};
  border: 1px dashed ${({ $warn }) => ($warn ? "#f0a24a" : "#c3c8d8")};
`;

const TOKEN = /\{\{(\w+(?:\.\w+)*)\}\}/g;
const META_KEYS = new Set(["name", "company.name", "date"]);

function tokenize(text) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ key: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

const isHeading = (raw) =>
  raw.length < 70 && !/[.!?]\s*$/.test(raw) && !raw.includes(":") && !raw.includes("\n");

const PreviewCard = ({ data = {}, template, highlightKey, $borderColor }) => {
  if (!template) return null;
  const labels = Object.fromEntries(
    (template.steps || []).map((s) => [s.key, s.label])
  );
  const meta = { name: template.name, "company.name": template.company?.name };

  const paragraphs = template.outputTemplate.split(/\n{2,}/);
  // A first line made only of name/company/date becomes the header bar.
  const firstKeys = [...paragraphs[0].matchAll(TOKEN)].map((m) => m[1]);
  const hasHeaderLine =
    firstKeys.length > 0 &&
    firstKeys.every((k) => META_KEYS.has(k)) &&
    paragraphs[0].replace(TOKEN, "").trim() === "";
  const body = hasHeaderLine ? paragraphs.slice(1) : paragraphs;

  const renderPart = (part, i) => {
    if (part.text !== undefined) return <React.Fragment key={i}>{part.text}</React.Fragment>;
    const value = meta[part.key] ?? data[part.key];
    if (value === undefined || value === null || value === "") {
      return <Missing key={i}>{labels[part.key] || part.key}</Missing>;
    }
    const str = String(value);
    if (str.includes(NOT_STATED)) {
      return str.split(NOT_STATED).map((chunk, j, arr) => (
        <React.Fragment key={`${i}-${j}`}>
          {chunk}
          {j < arr.length - 1 && <Missing $warn>not stated</Missing>}
        </React.Fragment>
      ));
    }
    return (
      <Value key={i} $fresh={part.key === highlightKey}>
        {str.split("\n").map((line, j, arr) => (
          <React.Fragment key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </Value>
    );
  };

  return (
    <Card $borderColor={$borderColor}>
      <HeaderBar>
        <Company>{template.company?.name || template.name}</Company>
        <Meta>
          {template.name}
          <br />
          {data.date || "Date"}
        </Meta>
      </HeaderBar>

      {body.map((raw, idx) => {
        const parts = tokenize(raw);
        const active = !!highlightKey && parts.some((p) => p.key === highlightKey);
        const filledText = raw.replace(TOKEN, (_, k) => meta[k] ?? data[k] ?? k);
        if (isHeading(filledText)) {
          return (
            <Heading key={idx} $active={active}>
              {parts.map(renderPart)}
            </Heading>
          );
        }
        return (
          <Paragraph key={idx} $active={active}>
            {parts.map((part, i) =>
              part.text !== undefined
                ? part.text.split("\n").map((line, j, arr) => (
                    <React.Fragment key={`${i}-${j}`}>
                      {line}
                      {j < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))
                : renderPart(part, i)
            )}
          </Paragraph>
        );
      })}
    </Card>
  );
};

export default React.memo(PreviewCard);
