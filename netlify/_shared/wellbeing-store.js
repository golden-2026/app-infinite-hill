import { connectLambda, getStore } from "@netlify/blobs";
import { useWellbeingStore } from "../../api/wellbeing.js";

/**
 * Point the wellbeing aggregate at the same private Netlify Blobs store as the return counts ("pulse"; its keys are
 * prefixed "wellbeing/"). Counters change with a conditional write (the entry's ETag), retried a few times, so two
 * answers landing at once both count. Without Blobs (tests, local development) the counts live in memory.
 */
export function connectWellbeing(event) {
  try {
    if (event?.blobs) connectLambda(event);
    const blobs = getStore("pulse");
    useWellbeingStore({
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
