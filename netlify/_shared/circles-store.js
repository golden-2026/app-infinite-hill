import { connectLambda, getStore } from "@netlify/blobs";
import { useCirclesStore } from "../../api/circles.js";
import { connectFriends } from "./friends-store.js";

/**
 * Point circles at private Netlify Blobs (and friends too: circles sign people in with the friend identity). A circle is
 * changed with a conditional write (the entry's ETag), retried a few times, so many people joining at once all count.
 * If Blobs isn't available, circles live in memory (tests, local development).
 */
export function connectCircles(event) {
  connectFriends(event);
  try {
    if (event?.blobs) connectLambda(event);
    const blobs = getStore("circles");
    useCirclesStore({
      get: (key) => blobs.get(key, { type: "json" }),
      set: (key, value) => blobs.setJSON(key, value),
      delete: (key) => blobs.delete(key),
      async bump(key, fn) {
        for (let i = 0; i < 6; i++) {
          const cur = await blobs.getWithMetadata(key, { type: "json" });
          const next = fn(cur ? structuredClone(cur.data) : null);
          if (next === null) { if (cur) await blobs.delete(key); return null; }
          const r = cur?.etag ? await blobs.setJSON(key, next, { onlyIfMatch: cur.etag }) : await blobs.setJSON(key, next, { onlyIfNew: true });
          if (r?.modified !== false) return next;
        }
        throw new Error("busy");
      },
    });
  } catch {
    // no Blobs here: keep the in-memory store
  }
}
