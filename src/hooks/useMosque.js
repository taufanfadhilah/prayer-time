import { useState, useEffect } from "react";
import { loadMosqueById } from "../mosqueStore";
import { readSelectedMosqueId } from "../utils/storageUtils";

export function useMosque() {
  const [selectedMosqueId, setSelectedMosqueId] = useState(() =>
    readSelectedMosqueId()
  );
  const [selectedMosque, setSelectedMosque] = useState(null);

  useEffect(() => {
    // Fetch the selected masjid record from Supabase whenever UUID changes.
    let cancelled = false;
    const run = async () => {
      if (!selectedMosqueId) {
        setSelectedMosque(null);
        return;
      }
      const res = await loadMosqueById(selectedMosqueId);
      if (cancelled) return;
      if (res?.error) {
        setSelectedMosque(null);
      } else {
        setSelectedMosque(res.mosque || null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedMosqueId]);

  return {
    selectedMosqueId,
    setSelectedMosqueId,
    selectedMosque,
    setSelectedMosque,
  };
}

