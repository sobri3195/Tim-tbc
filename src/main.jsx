import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import LandingPage from "./components/LandingPage.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<Navigate to="/app/planner" replace />} />
        <Route path="/app/:viewId" element={<App />} />
        <Route path="*" element={<Navigate to="/app/planner" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
