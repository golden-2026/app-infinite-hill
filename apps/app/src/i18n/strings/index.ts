// Every area's strings, merged. Each area owns its own file (and key prefix), so they never collide.
import type { Dict } from "../core";
import * as common from "./common";
import * as onboarding from "./onboarding";
import * as home from "./home";
import * as session from "./session";
import * as companion from "./companion";
import * as groups from "./groups";
import * as kids from "./kids";
import * as waitlist from "./waitlist";
import * as wellbeing from "./wellbeing";
import * as couple from "./couple";

export const EN = { ...common.en, ...onboarding.en, ...home.en, ...session.en, ...companion.en, ...kids.en, ...groups.en, ...waitlist.en, ...wellbeing.en, ...couple.en };
export const ES: Dict<typeof EN> = { ...common.es, ...onboarding.es, ...home.es, ...session.es, ...companion.es, ...kids.es, ...groups.es, ...waitlist.es, ...wellbeing.es, ...couple.es };
export const AREAS = { common, onboarding, home, session, companion, kids, groups, waitlist, wellbeing, couple };
