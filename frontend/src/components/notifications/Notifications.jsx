import React, { useState } from "react";
import styled from "styled-components";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const BellWrapper = styled.div`
  position: relative;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Badge = styled.div`
  position: absolute;
  top: 2px;
  right: 4px;
  width: 10px;
  height: 10px;
  background: orange;
  border-radius: 50%;
`;

const Panel = styled(motion.div)`
  position: absolute;
  top: 36px;
  right: 0;
  width: 280px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 20;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 14px;
  transition: background 0.1s;
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundCard};
  }
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  background: ${({ theme }) => theme.colors.secondary};
  border-radius: 50%;
  margin-right: 10px;
`;

const Message = styled.div`
  flex: 1;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Time = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: 8px;
`;

export default function Notifications({ notifications = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <BellWrapper>
      <IconButton onClick={() => setOpen((v) => !v)}>
        <Bell size={24} />
        {notifications.length > 0 && <Badge />}
      </IconButton>

      <AnimatePresence>
        {open && (
          <Panel
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {notifications.length === 0 ? (
              <Item>
                <Message>No new notifications.</Message>
              </Item>
            ) : (
              notifications.map((n) => (
                <Item key={n.id}>
                  <Dot />
                  <Message>{n.message}</Message>
                  <Time>{n.time}</Time>
                </Item>
              ))
            )}
          </Panel>
        )}
      </AnimatePresence>
    </BellWrapper>
  );
}
