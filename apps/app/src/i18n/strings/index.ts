// Every area's strings, merged. Each area owns its own file (and key prefix), so they never collide.
import type { Dict } from "../core";
import * as common from "./common";
import * as onboarding from "./onboarding";
import * as home from "./home";
import * as session from "./session";
import * as companion from "./companion";

export const EN = { ...common.en, ...onboarding.en, ...home.en, ...session.en, ...companion.en };
export const ES: Dict<typeof EN> = { ...common.es, ...onboarding.es, ...home.es, ...session.es, ...companion.es };
export const AREAS = { common, onboarding, home, session, companion };
