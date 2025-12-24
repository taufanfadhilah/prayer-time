import { useState } from "react";
import { loadPageConfig } from "../pageConfig";

export function usePageConfig() {
  const [config, setConfig] = useState(() => loadPageConfig());
  return { config, setConfig };
}

