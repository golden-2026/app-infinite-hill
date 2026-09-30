import { connectLambda, getStore } from "@netlify/blobs";
import { useFriendsStore } from "../../api/friends.js";

/** Point friends at private Netlify Blobs. If Blobs isn't available, friends live in memory (tests, local development). */
export function connectFriends(event) {
  try {
    if (event?.blobs) connectLambda(event);
    const blobs = getStore("friends");
    useFriendsStore({ get: (key) => blobs.get(key, { type: "json" }), set: (key, value) => blobs.setJSON(key, value), delete: (key) => blobs.delete(key) });
  } catch {
    // no Blobs here: keep the in-memory store
  }
}
