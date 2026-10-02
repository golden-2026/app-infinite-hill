import wellbeing from "../../api/wellbeing.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";
import { connectWellbeing } from "../_shared/wellbeing-store.js";

const adapted = adaptVercelHandler(wellbeing);

export const handler = async (event, context) => {
  connectWellbeing(event);
  return adapted(event, context);
};
