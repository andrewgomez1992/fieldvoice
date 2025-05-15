import React from "react";
import { Outlet } from "react-router-dom";
import styled from "styled-components";
import NavBar from "../nav/NavBar";

const Container = styled.div`
  width: 100%;
  padding: 16px;
  @media (min-width: 1200px) {
    max-width: 1000px;
    margin: 0 auto;
  }
`;

const MainLayout = () => (
  <>
    <NavBar />
    <Container>
      {/* This is where nested routes go: Home, CauseOrigin, ViewReports, etc */}
      <Outlet />
    </Container>
  </>
);

export default MainLayout;
