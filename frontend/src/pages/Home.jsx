/* eslint-disable no-irregular-whitespace */
import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Bot, Lock } from "lucide-react";
import TodaySchedule from "../schedule/TodaySchedule";

const Greeting = styled(motion.h2)`
  font-size: 1.5rem;
  margin-bottom: 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const StatsBar = styled(motion.div)`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
`;

const StatCard = styled(motion.div)`
  flex: 1;
  background: ${({ theme }) => theme.colors.backgroundCard};
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
  cursor: pointer;
`;

const StatValue = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const StatLabel = styled.div`
  font-size: 0.675rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`;

const Grid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
`;

const WidgetCard = styled(motion.div)`
  width: 100%;
  background: ${({ theme, disabled }) =>
    disabled
      ? theme.colors.backgroundCardDisabled
      : theme.colors.backgroundCard};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  height: 160px;
  padding: 16px;

  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center; /* horizontal center */
  justify-content: center; /* vertical center */

  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    ${({ disabled }) =>
      !disabled &&
      `
        transform: translateY(-6px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.12);
      `}
  }
`;

const IconCircle = styled.div`
  width: 48px;
  height: 48px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Label = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme, disabled }) =>
    disabled ? theme.colors.textSecondary : theme.colors.textPrimary};
  text-align: center;
  line-height: 1.3;
`;

export default function Home() {
  const navigate = useNavigate();

  const stats = [
    {
      value: JSON.parse(localStorage.getItem("reports") || "[]").length,
      label: "Reports",
      onClick: () => navigate("/view-reports"),
    },
    { value: "3 weeks", label: "Avg. Duration" },
    { value: "Pipe Leak", label: "Top Cause" },
  ];

  const cards = [
    {
      label: "Cause & Origin Report",
      icon: FileText,
      onClick: () => navigate("/cause-and-origin"),
    },
    {
      label: "Another Report",
      icon: FileText,
      onClick: () => navigate("/clock"),
    },
    {
      label: "Incident Report",
      icon: FileText,
      // disabled: true,
    },
    {
      label: "WaterBot AI",
      icon: Bot,
      // disabled: true,
    },
    {
      label: "Call The Office",
      icon: Lock,
      // disabled: true,
    },
    {
      label: "Coming Soon",
      icon: Lock,
      // disabled: true,
    },
  ];

  const todayJobs = [
    { id: 1, time: "9:00 AM", address: "2234 Burton Way, Lodi, CA" },
    { id: 2, time: "11:00 AM", address: "512 Oak St, Modesto, CA" },
    { id: 3, time: "1:30 PM", address: "78 Pine Rd, Stockton, CA" },
  ];

  return (
    <>
      <Greeting
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Welcome back, Drew 👋
      </Greeting>
      <StatsBar
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            onClick={s.onClick}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <StatValue>{s.value}</StatValue>
            <StatLabel>{s.label}</StatLabel>
          </StatCard>
        ))}
      </StatsBar>

      <Grid>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <WidgetCard
              key={c.label}
              disabled={c.disabled}
              onClick={() => !c.disabled && c.onClick()}
              whileHover={c.disabled ? {} : { scale: 1.02 }}
              whileTap={c.disabled ? {} : { scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <IconCircle>
                <Icon size={24} color="#fff" />
              </IconCircle>
              <Label disabled={c.disabled}>{c.label}</Label>
            </WidgetCard>
          );
        })}
      </Grid>
      <TodaySchedule jobs={todayJobs} />
    </>
  );
}
