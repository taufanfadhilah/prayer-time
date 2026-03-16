import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App.jsx";
import ConfigPage from "./ConfigPage.jsx";
import AdminConfigPage from "./AdminConfigPage.jsx";
import AdminAuthGate from "./AdminAuthGate.jsx";
import "./index.css";

// Global error handlers — always active, visible in Android logcat via adb logcat
window.addEventListener("unhandledrejection", (e) => {
  console.error("[App] Unhandled promise rejection:", e.reason);
});
window.onerror = (msg, src, line, col, err) => {
  console.error("[App] Uncaught error:", msg, src, line, col, err);
};

// Sentry — only initialised when DSN env var is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Keep last 50 breadcrumbs before each error
    maxBreadcrumbs: 50,
    integrations: [
      // Catch uncaught JS errors + unhandled promise rejections
      Sentry.globalHandlersIntegration({
        onerror: true,
        onunhandledrejection: true,
      }),
      // Capture console.warn/error as breadcrumbs + DOM click events
      Sentry.breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        xhr: true,
      }),
      // Track route changes (e.g. / → /config) as breadcrumbs
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
      }),
    ],
  });

  // Breadcrumb for network online/offline — captured at SDK level
  // so it's always recorded even before React mounts
  window.addEventListener("online", () =>
    Sentry.addBreadcrumb({ category: "network", message: "Network came back online", level: "info" })
  );
  window.addEventListener("offline", () =>
    Sentry.addBreadcrumb({ category: "network", message: "Network went offline", level: "warning" })
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={null}>
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
          <Route path="/admin/config/:mosqueId" element={<AdminConfigPage />} />
        </Routes>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
