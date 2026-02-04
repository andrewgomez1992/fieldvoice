import React, { useState } from "react";
import styled from "styled-components";
import Notifications from "../notifications/Notifications";
import MenuButton from "./Menu";
import templates from "../../templates";

const Nav = styled.nav`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
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

const LeftSlot = styled.div`
  position: absolute;
  left: 16px;
`;

const RightSlot = styled.div`
  position: absolute;
  right: 16px;
`;

export default function NavBar() {
  // just some sample items
  const [notifications] = useState([
    { id: 1, message: "New high‑priority job assigned", time: "2m ago" },
    { id: 2, message: "Report “Burton Way” completed", time: "1h ago" },
  ]);

  return (
    <Nav>
      <LeftSlot>
        <MenuButton />
      </LeftSlot>

      <Title>{templates[0]?.company?.name || "Swift-li"}</Title>

      <RightSlot>
        <Notifications notifications={notifications} />
      </RightSlot>
    </Nav>
  );
}
