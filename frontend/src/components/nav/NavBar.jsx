import React, { useState } from "react";
import styled from "styled-components";
import Notifications from "../notifications/Notifications";

const Nav = styled.nav`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  z-index: 10;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.2rem;
  color: white;
  flex: 1;
  text-align: center;
`;

const BellContainer = styled.div`
  position: absolute;
  right: 16px;
`;

export default function NavBar() {
  // sample notifications
  const [notifications] = useState([
    { id: 1, message: "New high‑priority job assigned", time: "2m ago" },
    { id: 2, message: "Report “Burton Way” completed", time: "1h ago" },
  ]);

  return (
    <Nav>
      <Title>City Water Conservation</Title>
      <BellContainer>
        <Notifications notifications={notifications} />
      </BellContainer>
    </Nav>
  );
}
