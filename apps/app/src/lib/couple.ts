// The two-faith couple, read from the app's settings (the pure rules live in content/couple.ts).
import { isCouple, partnerDoorOf } from "@/content/couple";
import type { Settings } from "./store";

/** "partner" or "wedding" when that's what brought them (docs/PERSONAS.md), else null. */
export function coupleWhy(st: Pick<Settings, "profile">): "partner" | "wedding" | null {
  const why = st.profile?.answers?.why;
  return isCouple(why) ? (why as "partner" | "wedding") : null;
}

/** The door their partner's family keeps, if we know it (content/couple.ts partnerDoorOf). */
export function couplePartnerDoor(st: Pick<Settings, "profile" | "partnerDoor" | "homeWing" | "visitWing">): string | null {
  const learning = st.profile?.answers?.learning;
  return partnerDoorOf({ why: st.profile?.answers?.why, chosen: st.partnerDoor ?? null, learning: typeof learning === "string" ? learning : null, home: st.homeWing, visit: st.visitWing });
}
