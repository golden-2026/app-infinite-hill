import circles from "../../api/circles.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";
import { connectCircles } from "../_shared/circles-store.js";

const adapted = adaptVercelHandler(circles);

export const handler = async (event, context) => {
  connectCircles(event);
  return adapted(event, context);
};
