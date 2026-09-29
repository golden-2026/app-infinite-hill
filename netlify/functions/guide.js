import guide from "../../api/guide.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";
import { connectUsage } from "../_shared/usage-store.js";

const adapted = adaptVercelHandler(guide);

export const handler = async (event, context) => {
  connectUsage(event);
  return adapted(event, context);
};
