import friends from "../../api/friends.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";
import { connectFriends } from "../_shared/friends-store.js";

const adapted = adaptVercelHandler(friends);

export const handler = async (event, context) => {
  connectFriends(event);
  return adapted(event, context);
};
