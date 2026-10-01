import { connectLambda, getStore } from "@netlify/blobs";
import { useWaitlistStore } from "../../api/waitlist.js";

/**
 * Point the waitlist at private Netlify Blobs (store "waitlist"). The line and each invite are changed with a
 * conditional write (the entry's ETag), retried a few times, so many people joining at once all count and a
 * single-use code can't be used twice. If Blobs isn't available, the waitlist lives in memory (tests, local development).
 */
export function connectWaitlist(event) {
  try {
    if (event?.blobs) connectLambda(event);
    const blobs = getStore("waitlist");
    useWaitlistStore({
      get: (key) => blobs.get(key, { type: "json" }),
      set: (key, value) => blobs.setJSON(key, value),
      delete: (key) => blobs.delete(key),
      async bump(key, fn) {
        for (let i = 0; i < 10; i++) {
          const cur = await blobs.getWithMetadata(key, { type: "json" });
          const next = fn(cur ? structuredClone(cur.data) : null);
          if (next === null) { if (cur) await blobs.delete(key); return null; }
          const r = cur?.etag ? await blobs.setJSON(key, next, { onlyIfMatch: cur.etag }) : await blobs.setJSON(key, next, { onlyIfNew: true });
          if (r?.modified !== false) return next;
          await new Promise((ok) => setTimeout(ok, 20 + Math.random() * 80 * (i + 1)));
        }
        throw new Error("busy");
      },
    });
  } catch {
    // no Blobs here: keep the in-memory store
  }
}
