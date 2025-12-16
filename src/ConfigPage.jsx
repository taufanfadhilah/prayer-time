import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_FOOTER_TEXT,
  loadPageConfig,
  savePageConfig,
} from "./pageConfig";

function ConfigPage() {
  const navigate = useNavigate();
  const initial = loadPageConfig();
  const [footerText, setFooterText] = useState(initial.footerText);
  const [fajrTime, setFajrTime] = useState(initial.fajrTime || "");

  const handleSave = () => {
    const nextFooterText =
      footerText.trim().length > 0 ? footerText.trim() : DEFAULT_FOOTER_TEXT;
    const nextFajrTime = fajrTime.trim().length > 0 ? fajrTime.trim() : null;

    savePageConfig({
      footerText: nextFooterText,
      fajrTime: nextFajrTime,
    });

    // Simple success notification and redirect
    window.alert("Configuration saved successfully.");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <div className="w-full max-w-xl rounded-lg border border-gray-300 bg-white p-6 sm:p-8 shadow-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
          Page Configuration
        </h1>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="flex flex-col">
            <label className="block text-xs sm:text-sm mb-1 text-gray-700">
              Footer Text
            </label>
            <textarea
              className="w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-prayer-green"
              rows={3}
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs sm:text-sm mb-1 text-gray-700">
              Fajr Time (HH:MM)
            </label>
            <input
              type="text"
              className="w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-prayer-green"
              value={fajrTime}
              onChange={(e) => setFajrTime(e.target.value)}
              placeholder="e.g. 05:30"
            />
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
              Leave empty to use the time from the daily API response.
            </p>
          </div>
          <div className="pt-2 text-right">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-md bg-prayer-green text-white text-xs sm:text-sm font-semibold hover:bg-prayer-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prayer-green focus:ring-offset-dark-background"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConfigPage;


