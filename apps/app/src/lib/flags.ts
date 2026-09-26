// Feature flags. Web: ?flags=a,b and ?demo=1 (kept for the tab session). Native: dev builds only.
import { Platform } from "react-native";

function webParams(): URLSearchParams | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search);
}

let cache: Set<string> | null = null;
function flagSet(): Set<string> {
  if (cache) return cache;
  const set = new Set<string>();
  const p = webParams();
  try {
    for (const f of (sessionStorage.getItem("ih:flags") || "").split(",")) if (f) set.add(f);
  } catch {}
  if (p) {
    for (const f of (p.get("flags") || "").split(",")) if (f.trim()) set.add(f.trim());
    if (p.has("demo")) set.add("demo");
    try {
      sessionStorage.setItem("ih:flags", [...set].join(","));
    } catch {}
  }
  if (Platform.OS !== "web" && __DEV__) set.add("demo");
  return (cache = set);
}

export const flag = (name: string) => flagSet().has(name);
export const isDemo = () => flag("demo");
