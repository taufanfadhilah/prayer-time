import { useState, useEffect } from "react";
import { loadGlobalConfig } from "../globalConfigStore";

export function useGlobalConfig() {
  const [hijriDayOffset, setHijriDayOffset] = useState(0);

  useEffect(() => {
    loadGlobalConfig().then(({ hijriDayOffset: offset }) => {
      setHijriDayOffset(offset);
    });
  }, []);

  return { hijriDayOffset };
}
