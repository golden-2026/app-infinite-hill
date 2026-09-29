import { connectLambda, getStore } from "@netlify/blobs";
import { useStore } from "../../api/_usage.js";

/** Point the AI usage counts at private Netlify Blobs. If Blobs isn't available, the counts stay in memory. */
export function connectUsage(event) {
  try {
    if (event?.blobs) connectLambda(event);
    const blobs = getStore("ai-usage");
    useStore({ get: (key) => blobs.get(key, { type: "json" }), set: (key, value) => blobs.setJSON(key, value) });
  } catch {
    // no Blobs here (tests, local development): keep counting in memory
  }
}
