import companion from "../../api/companion.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";
import { connectUsage } from "../_shared/usage-store.js";

const adapted = adaptVercelHandler(companion);

export const handler = async (event, context) => {
  connectUsage(event);
  return adapted(event, context);
};
