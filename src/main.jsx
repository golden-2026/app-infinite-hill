import React from "react";
import { createRoot } from "react-dom/client";
import { installIH } from "./platform/ih.js";
// infinite hill app v175: design/infinitehill_v175.jsx verbatim, plus platform hooks applied by
// scripts/apply-platform-patch.mjs before every dev/build run (src/InfiniteHill.jsx is generated).
import App from "./InfiniteHill.jsx";
import { parseGoldenLink } from "./features/navigation.js";

const BUILD = "v175-p0";

// The platform must exist before the first render: the app reads saved progress on mount.
const IH = installIH();

// Crash visibility with no content: kind, a clipped message, file and line only.
function report(kind, message, file, line) {
  try {
    const body = JSON.stringify({ kind, message: String(message || "").slice(0, 200), file: String(file || "").slice(0, 120), line: Number.isInteger(line) ? line : undefined, build: BUILD });
    if (!navigator.sendBeacon?.("/api/log", new Blob([body], { type: "application/json" }))) {
      fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // never let reporting break the app
  }
}
window.addEventListener("error", (e) => report("error", e.message, e.filename, e.lineno));
window.addEventListener("unhandledrejection", (e) => report("unhandledrejection", e.reason?.message || e.reason, "", undefined));

// The build calls Anthropic directly, which only works inside claude.ai. BUILD_BRIEF: "Until retrieval
// exists, the Guide is off in the pilot", so by default the build's own offline answer (the lesson text)
// is used. With ?flags=guide-live the call goes to the same-origin Guide function (server key + prompt).
const ANTHROPIC_MESSAGES = "https://api.anthropic.com/v1/messages";
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input?.url;
  if (url !== ANTHROPIC_MESSAGES) return nativeFetch(input, init);
  if (!IH.flag("guide-live")) return new Response(null, { status: 503 });
  try {
    const body = JSON.parse(init?.body || "{}");
    const res = await nativeFetch("/api/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: body.system, messages: body.messages }),
    });
    if (!res.ok) return new Response(null, { status: res.status });
    const { text } = await res.json();
    if (typeof text !== "string" || !text.trim()) return new Response(null, { status: 502 });
    return new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(null, { status: 503 });
  }
};

// Keep old links working: ?door=HINDUISM preselects a door; embed opens the app inside the site.
const target = parseGoldenLink(window.location, { screenIds: [] });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App startDoor={target.door} embed={target.embed} />
  </React.StrictMode>,
);
