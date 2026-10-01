import pulse from "../../api/pulse.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";
import { connectPulse } from "../_shared/pulse-store.js";

const adapted = adaptVercelHandler(pulse);

export const handler = async (event, context) => {
  connectPulse(event);
  return adapted(event, context);
};
