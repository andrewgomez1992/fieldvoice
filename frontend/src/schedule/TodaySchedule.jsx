import React from "react";
import styled from "styled-components";
import { ArrowRightCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ScheduleWidget = styled(motion.div)`
  position: relative;
  margin-top: 20px;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 12px 16px;
  font-weight: 600;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
`;

const List = styled(motion.div)`
  max-height: 240px;
  overflow-y: auto;
`;

const JobItem = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.backgroundAlt};
  &:last-child {
    border-bottom: none;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const Time = styled.span`
  font-size: 0.875rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primaryDark};
`;
const Address = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { when: "beforeChildren", staggerChildren: 0.1 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function TodaySchedule({ jobs }) {
  const navigate = useNavigate();

  return (
    <ScheduleWidget
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <Header>Today’s Schedule</Header>

      <List variants={containerVariants}>
        {jobs.map((job) => (
          <JobItem
            key={job.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Info>
              <Time>{job.time}</Time>
              <Address>{job.address}</Address>
            </Info>
            <ArrowRightCircle
              size={24}
              color="#fff"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/report", { state: { preset: job } })}
            />
          </JobItem>
        ))}
      </List>
    </ScheduleWidget>
  );
}
