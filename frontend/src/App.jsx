import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import styled, { createGlobalStyle, ThemeProvider } from "styled-components";
import NavBar from "./components/nav/NavBar";
import Home from "./pages/Home";
import ReportWizard from "./components/reports/ReportWizard";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: Arial, sans-serif;
    background-color: #f0f4f8;
    margin: 0;
  }
`;

const Container = styled.div`
  width: 100%;
  padding: 16px;
  @media (min-width: 1200px) {
    max-width: 1000px;
    margin: 0 auto;
  }
`;

const theme = {
  colors: {
    primary: "#2B6CB0",
    secondary: "#38A169",
    backgroundAlt: "#ffffff",
    primaryDark: "#1A4362",
    textPrimary: "#2D3748",
    backgroundCard: "#F7FAFC",
  },
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        <NavBar />
        <Container>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<ReportWizard />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
