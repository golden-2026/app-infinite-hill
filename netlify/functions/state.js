import state from "../../api/state.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";
import { connectLambda } from "@netlify/blobs";

const adapted = adaptVercelHandler(state);

export const handler = async (event, context) => {
  connectLambda(event);
  process.env.GOLDEN_STORAGE_BACKEND = "netlify-blobs";
  return adapted(event, context);
};
