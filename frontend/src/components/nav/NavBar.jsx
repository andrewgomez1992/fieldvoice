import React from "react";
import styled from "styled-components";

const Nav = styled.nav`
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
`;

const NavBar = () => (
  <Nav>
    <Title>City Water Conservation</Title>
  </Nav>
);

export default NavBar;
