import waitlist from "../../api/waitlist.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";
import { connectWaitlist } from "../_shared/waitlist-store.js";

const adapted = adaptVercelHandler(waitlist);

export const handler = async (event, context) => {
  connectWaitlist(event);
  return adapted(event, context);
};
