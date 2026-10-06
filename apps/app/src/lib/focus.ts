// The tester build (owner, 2026-10-06): one clean path for the first testers. Built with EXPO_PUBLIC_FOCUS_DOOR set
// (e.g. HINDUISM), the app shows only that door in the picker and tucks away what the test isn't about: the Together
// tab, friends and circles, the kids' table, gifts, plans and prices, and the "taste another door" card. Nothing is
// deleted; every screen still exists. Unset (the default), the app is exactly as before.
const raw = (process.env.EXPO_PUBLIC_FOCUS_DOOR || "").trim().toUpperCase();
const DOORS = ["HINDUISM", "BUDDHISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "SIKHISM", "SPIRITUAL"];

/** The one door this build focuses on, or null for the full app. */
export const FOCUS_DOOR: string | null = DOORS.includes(raw) ? raw : null;
/** True in the tester build: hide the extras. */
export const focused = FOCUS_DOOR !== null;
