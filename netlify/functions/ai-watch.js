// Runs by itself every 10 minutes on the live site (production only) and alerts the owner when the AI or site breaks.
// A modern Netlify function, so its schedule lives here and it reaches Blobs without connectLambda.
import { watch } from "../../api/ai-watch.js";
import { connectUsage } from "../_shared/usage-store.js";

export default async () => {
  connectUsage();
  try {
    await watch();
  } catch {
    // a failed check is simply retried in 10 minutes; nothing personal is ever involved here
  }
  return new Response(null, { status: 204 });
};

export const config = { schedule: "*/10 * * * *" };
