// Runtime polyfills for old TV browsers (Samsung Tizen, older Android TV WebViews).
//
// build.target in vite.config.js lowers modern *syntax*, but esbuild does not add
// missing runtime *APIs* — those have to be provided here. Imported first in
// main.jsx so this runs before any dependency code.
//
// Every gap below comes from @sentry/react, which assumes a modern engine.
// Baseline we support: Chromium M56 (Samsung Tizen 4.0, 2018 TVs).

// globalThis — Chromium M71. Sentry reads it unguarded at module scope
// (`const Z = globalThis`), so without this the bundle throws before React mounts.
if (typeof globalThis === "undefined" && typeof window !== "undefined") {
  window.globalThis = window;
}

// Object.fromEntries — Chromium M73.
if (!Object.fromEntries) {
  Object.fromEntries = function fromEntries(entries) {
    const out = {};
    for (const [key, value] of entries) out[key] = value;
    return out;
  };
}

// Promise.allSettled — Chromium M76.
if (!Promise.allSettled) {
  Promise.allSettled = function allSettled(promises) {
    return Promise.all(
      Array.from(promises, (p) =>
        Promise.resolve(p).then(
          (value) => ({ status: "fulfilled", value }),
          (reason) => ({ status: "rejected", reason })
        )
      )
    );
  };
}

// Array.prototype.at — Chromium M92. Used by Sentry's web-vitals instrumentation.
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, "at", {
    value: function at(index) {
      const len = this.length;
      let i = Math.trunc(index) || 0;
      if (i < 0) i += len;
      return i < 0 || i >= len ? undefined : this[i];
    },
    writable: true,
    configurable: true,
  });
}
