import React from "react";
import styled from "styled-components";

const Nav = styled.nav`
  width: 100%;
  height: 56px;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  color: white;
  font-weight: 600;
`;

const NavBar = () => (
  <Nav>
    <Title>City Water Conservation</Title>
  </Nav>
);

export default NavBar;
