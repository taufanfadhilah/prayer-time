import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadMosqueById, loadMosques } from "./mosqueStore";
import { trackMosqueSelected, trackMosqueCleared } from "./utils/analytics";

const LOCAL_STORAGE_DAY_KEY = "localStorageDay";
const SELECTED_MOSQUE_ID_KEY = "selectedMosqueId";

function getTodayKey(tz) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // YYYY-MM-DD in given tz
}

function expireLocalStorageDaily(tz) {
  const todayKey = getTodayKey(tz);
  try {
    const last = localStorage.getItem(LOCAL_STORAGE_DAY_KEY);
    if (last === todayKey) return;

    const keep = new Set([LOCAL_STORAGE_DAY_KEY, SELECTED_MOSQUE_ID_KEY]);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keep.has(k)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(LOCAL_STORAGE_DAY_KEY, todayKey);
  } catch {
    // ignore
  }
}

function readSelectedMosqueId() {
  try {
    return localStorage.getItem(SELECTED_MOSQUE_ID_KEY) || "";
  } catch {
    return "";
  }
}

function writeSelectedMosqueId(id) {
  try {
    if (!id) {
      localStorage.removeItem(SELECTED_MOSQUE_ID_KEY);
      return;
    }
    localStorage.setItem(SELECTED_MOSQUE_ID_KEY, String(id));
  } catch {
    // ignore
  }
}

function clearCachesForImmediateRefresh() {
  // These are safe to clear to force fresh fetches.
  try {
    localStorage.removeItem("vaktijaCache");
    localStorage.removeItem("pageConfig");
    localStorage.removeItem("locId");
    localStorage.removeItem("activeMosqueId");
  } catch {
    // ignore
  }
}

function ConfigPage() {
  const navigate = useNavigate();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  expireLocalStorageDaily(tz);

  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [currentMosque, setCurrentMosque] = useState(null);
  const [selectedId, setSelectedId] = useState(() => readSelectedMosqueId());

  const sortedMosques = useMemo(() => {
    return mosques.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [mosques]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      const res = await loadMosques();
      if (cancelled) return;
      if (res?.error) {
        setError(res.error);
        setMosques([]);
      } else {
        setMosques(res.mosques || []);
      }
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedId) {
        setCurrentMosque(null);
        return;
      }
      const res = await loadMosqueById(selectedId);
      if (cancelled) return;
      if (res?.error) {
        setCurrentMosque(null);
      } else {
        setCurrentMosque(res.mosque || null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleSave = async () => {
    setError("");
    setBusy(true);
    writeSelectedMosqueId(selectedId);
    clearCachesForImmediateRefresh();
    const mosque = mosques.find((m) => m.id === selectedId);
    trackMosqueSelected(mosque?.name || selectedId);
    setBusy(false);
    window.alert("Masjid selection saved.");
    navigate("/");
  };

  const handleClear = async () => {
    setBusy(true);
    writeSelectedMosqueId("");
    setSelectedId("");
    setCurrentMosque(null);
    clearCachesForImmediateRefresh();
    trackMosqueCleared();
    setBusy(false);
    window.alert("Masjid selection cleared.");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <div className="w-full max-w-xl rounded-lg border border-gray-300 bg-white p-6 sm:p-8 shadow-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
          Device Configuration
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mb-6 text-center">
          Choose the masjid for this device. Only the masjid UUID is kept in{" "}
          <span className="font-mono">localStorage</span>; other cached data refreshes daily.
        </p>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="flex flex-col">
            <label className="block text-xs sm:text-sm mb-1 text-gray-700">
              Masjid
            </label>
            <select
              className="w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-prayer-green"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loading || busy}
            >
              <option value="">
                {loading
                  ? "Loading…"
                  : mosques.length === 0
                    ? "No masjid found"
                    : "Choose…"}
              </option>
              {sortedMosques.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (loc: {m.locationId})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
              This selection will make the home screen load{" "}
              <span className="font-mono">location_id</span>,{" "}
              <span className="font-mono">fajr_time</span>, and{" "}
              <span className="font-mono">footer_text</span> from Supabase.
            </p>
          </div>

          {currentMosque ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs sm:text-sm text-gray-700">
              <div className="font-semibold text-gray-900">{currentMosque.name}</div>
              <div className="mt-1">
                <span className="font-semibold">UUID</span>:{" "}
                <span className="font-mono">{currentMosque.id}</span>
              </div>
              <div>
                <span className="font-semibold">location_id</span>:{" "}
                <span className="font-mono">{currentMosque.locationId}</span>
              </div>
              <div>
                <span className="font-semibold">fajr_time</span>:{" "}
                {currentMosque.fajrTime ? (
                  <span className="font-mono">{currentMosque.fajrTime}</span>
                ) : (
                  <span className="text-gray-500">API</span>
                )}
              </div>
              <div className="truncate">
                <span className="font-semibold">footer_text</span>:{" "}
                {currentMosque.footerText ? (
                  currentMosque.footerText
                ) : (
                  <span className="text-gray-500">Default</span>
                )}
              </div>
            </div>
          ) : null}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-semibold hover:bg-gray-50"
              onClick={() => navigate("/")}
              disabled={busy}
              data-umami-event="config-back"
            >
              Back
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleClear}
              disabled={busy || !selectedId}
              data-umami-event="config-clear"
            >
              Clear
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-md bg-prayer-green text-white text-xs sm:text-sm font-semibold hover:bg-prayer-green/90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prayer-green focus:ring-offset-dark-background"
              disabled={busy || !selectedId}
              data-umami-event="config-save"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConfigPage;


