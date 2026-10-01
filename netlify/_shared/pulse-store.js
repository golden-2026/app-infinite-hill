import { connectLambda, getStore } from "@netlify/blobs";
import { usePulseStore } from "../../api/pulse.js";

/**
 * Point the anonymous return counts at private Netlify Blobs. Counters are changed with a conditional write (the
 * entry's ETag), retried a few times, so two pings landing at once both count. If Blobs isn't available, the counts
 * live in memory (tests, local development).
 */
export function connectPulse(event) {
  try {
    if (event?.blobs) connectLambda(event);
    const blobs = getStore("pulse");
    usePulseStore({
      get: (key) => blobs.get(key, { type: "json" }),
      async bump(key, fn) {
        for (let i = 0; i < 6; i++) {
          const cur = await blobs.getWithMetadata(key, { type: "json" });
          const next = fn(cur ? cur.data : null);
          const r = cur?.etag ? await blobs.setJSON(key, next, { onlyIfMatch: cur.etag }) : await blobs.setJSON(key, next, { onlyIfNew: true });
          if (r?.modified !== false) return;
        }
        throw new Error("busy");
      },
    });
  } catch {
    // no Blobs here: keep the in-memory store
  }
}
