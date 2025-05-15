import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import styled, { createGlobalStyle, ThemeProvider } from "styled-components";
import NavBar from "./components/nav/NavBar";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import ReportWizard from "./components/reports/CauseOrigin/CauseOriginWizard";
import ViewReports from "./pages/ViewReports";
import ScrollToTop from "./utils/ScrollToTop";

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
    primary: "#2d2d72",
    primaryDark: "#1A4362",
    secondary: "#657cbd",
    textPrimary: "#2D3748",
    textSecondary: "#718096",
    backgroundAlt: "#ffffff",
    backgroundCard: "#F7FAFC",
    backgroundCardDisabled: "#E2E8F0",
    border: "#CBD5E0",
    yellowText: "#fccc28",
  },
};

const App = () => {
  useEffect(() => {
    const setVh = () => {
      // 1vh = 1% of the viewport height
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };

    // set at startup…
    setVh();
    // …and update on resize/orientation change
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />

      <Router>
        <ScrollToTop />
        <Routes>
          {/* Landing at root */}
          <Route path="/" element={<Landing />} />

          {/* All protected routes live under /home */}
          <Route
            path="/home"
            element={
              <>
                <NavBar />
                <Container>
                  <Home />
                </Container>
              </>
            }
          />

          <Route
            path="/cause-and-origin"
            element={
              <>
                <NavBar />
                <Container>
                  <ReportWizard />
                </Container>
              </>
            }
          />

          <Route
            path="/view-reports"
            element={
              <>
                <NavBar />
                <Container>
                  <ViewReports />
                </Container>
              </>
            }
          />

          {/* Catch-all redirect back to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
