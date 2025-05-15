import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import CauseOriginWizard from "./components/reports/CauseOrigin/CauseOriginWizard";
import ViewReports from "./pages/ViewReports";
import ScrollToTop from "./utils/ScrollToTop";
import MainLayout from "./components/layout/MainLayout";
import { useViewportHeight } from "./hooks/useViewportHeight";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: Arial, sans-serif;
    background-color: #f0f4f8;
    margin: 0;
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
  useViewportHeight();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Landing />} />

          {/* All protected routes share the same layout */}
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/cause-and-origin" element={<CauseOriginWizard />} />
            <Route path="/view-reports" element={<ViewReports />} />
          </Route>

          {/* Redirect any unknown path back to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
