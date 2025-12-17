import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_FOOTER_TEXT, savePageConfig } from "./pageConfig";
import { LOCATIONS, findLocationNameById } from "./locations";
import { logoutAdmin } from "./adminAuth";
import {
  createMosque,
  deleteMosque,
  getActiveMosqueId,
  loadMosques,
  setActiveMosqueId,
  updateMosque,
} from "./mosqueStore";

function AdminConfigPage() {
  const navigate = useNavigate();

  const [mosques, setMosques] = useState([]);
  const [activeMosqueId, setActive] = useState(() => getActiveMosqueId());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState(15); // default matches App.jsx default
  const [fajrTime, setFajrTime] = useState("");
  const [footerText, setFooterText] = useState("");

  const [error, setError] = useState("");

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

  const locationOptions = useMemo(() => {
    return LOCATIONS.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const refreshMosques = async () => {
    setLoading(true);
    setError("");
    const res = await loadMosques();
    if (res?.error) {
      setError(res.error);
      setMosques([]);
    } else {
      setMosques(res.mosques || []);
    }
    setLoading(false);
    setActive(getActiveMosqueId());
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setLocationId(15);
    setFajrTime("");
    setFooterText("");
    setError("");
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setName(m.name || "");
    setLocationId(m.locationId || 15);
    setFajrTime(m.fajrTime || "");
    setFooterText(m.footerText || "");
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    const draft = {
      name,
      locationId,
      fajrTime,
      footerText,
    };

    setBusy(true);
    const res = editingId ? await updateMosque(editingId, draft) : await createMosque(draft);
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    resetForm();
    await refreshMosques();
    setBusy(false);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this mosque?");
    if (!ok) return;
    setBusy(true);
    const res = await deleteMosque(id);
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    if (editingId === id) resetForm();
    await refreshMosques();
    setBusy(false);
  };

  const handleUse = (m) => {
    try {
      localStorage.setItem("locId", String(m.locationId));
    } catch {
      // ignore
    }

    const nextFooterText =
      (m.footerText || "").trim().length > 0 ? m.footerText.trim() : DEFAULT_FOOTER_TEXT;
    const nextFajrTime = (m.fajrTime || "").trim().length > 0 ? m.fajrTime.trim() : null;

    savePageConfig({
      footerText: nextFooterText,
      fajrTime: nextFajrTime,
    });

    setActiveMosqueId(m.id);
    setActive(m.id);
    window.alert("Active mosque applied. Returning to home.");
    navigate("/");
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-100">
      <div className="mx-auto w-full max-w-5xl rounded-lg border border-gray-300 bg-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Configuration
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              CRUD mosques (name, location id, optional Fajr time + footer text).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-semibold hover:bg-gray-50"
              onClick={() => {
                logoutAdmin();
                window.alert("Logged out.");
                navigate("/");
              }}
            >
              Logout
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-semibold hover:bg-gray-50"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 text-xs sm:text-sm font-semibold hover:bg-gray-50"
              onClick={() => navigate("/config")}
            >
              Old Config
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="rounded-lg border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {editingId ? "Edit Mosque" : "Add Mosque"}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="flex flex-col">
                <label className="block text-xs sm:text-sm mb-1 text-gray-700">
                  Mosque Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-prayer-green"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. "Džemat Mahala"'
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-xs sm:text-sm mb-1 text-gray-700">
                  Location
                </label>
                <select
                  className="w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-prayer-green"
                  value={String(locationId)}
                  onChange={(e) => setLocationId(Number(e.target.value))}
                >
                  {locationOptions.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.name} (id: {l.id})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  Stored as numeric <span className="font-mono">locationId</span>.
                </p>
              </div>

              <div className="flex flex-col">
                <label className="block text-xs sm:text-sm mb-1 text-gray-700">
                  Fajr Time (optional, HH:MM)
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

              <div className="flex flex-col">
                <label className="block text-xs sm:text-sm mb-1 text-gray-700">
                  Footer Text (optional)
                </label>
                <textarea
                  className="w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-prayer-green"
                  rows={3}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                />
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  Leave empty to use the default footer.
                </p>
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-prayer-green text-white text-xs sm:text-sm font-semibold hover:bg-prayer-green/90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prayer-green focus:ring-offset-dark-background"
                >
                  {busy ? "Saving…" : editingId ? "Save Changes" : "Create Mosque"}
                </button>
              </div>
            </form>
          </div>

          {/* List */}
          <div className="rounded-lg border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Mosques ({loading ? "…" : mosques.length})
              </h2>
              <button
                type="button"
                className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900"
                disabled={loading || busy}
                onClick={refreshMosques}
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>

            {loading ? (
              <p className="text-xs sm:text-sm text-gray-600">Loading mosques…</p>
            ) : mosques.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-600">
                No mosques yet. Create your first one on the left.
              </p>
            ) : (
              <div className="space-y-3">
                {mosques.map((m) => {
                  const isActive = activeMosqueId && m.id === activeMosqueId;
                  const locationName = findLocationNameById(m.locationId) || "Unknown";
                  return (
                    <div
                      key={m.id}
                      className="rounded-md border border-gray-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                              {m.name}
                            </div>
                            {isActive ? (
                              <span className="inline-flex items-center rounded-full bg-prayer-green/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-prayer-green">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-[10px] sm:text-xs text-gray-600 space-y-0.5">
                            <div>
                              <span className="font-semibold">id</span>:{" "}
                              <span className="font-mono">{m.id}</span>
                            </div>
                            <div>
                              <span className="font-semibold">location</span>:{" "}
                              {locationName}{" "}
                              <span className="text-gray-500">(id: {m.locationId})</span>
                            </div>
                            <div>
                              <span className="font-semibold">fajr</span>:{" "}
                              {m.fajrTime || <span className="text-gray-500">API</span>}
                            </div>
                            <div className="truncate">
                              <span className="font-semibold">footer</span>:{" "}
                              {m.footerText ? (
                                m.footerText
                              ) : (
                                <span className="text-gray-500">Default</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-prayer-green text-white text-xs font-semibold hover:bg-prayer-green/90"
                            onClick={() => handleUse(m)}
                            disabled={busy}
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
                            onClick={() => startEdit(m)}
                            disabled={busy}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-red-300 bg-white text-red-700 text-xs font-semibold hover:bg-red-50"
                            onClick={() => handleDelete(m.id)}
                            disabled={busy}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminConfigPage;


