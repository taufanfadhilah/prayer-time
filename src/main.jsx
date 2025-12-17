import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import ConfigPage from "./ConfigPage.jsx";
import AdminConfigPage from "./AdminConfigPage.jsx";
import AdminAuthGate from "./AdminAuthGate.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route
          path="/admin/config"
          element={
            <AdminAuthGate>
              <AdminConfigPage />
            </AdminAuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

