import { Redirect } from "expo-router";

// Retired 2026-09-27: no more "try <another religion> tonight". People pick their own door (see moment.tsx).
export default function Tonight() {
  return <Redirect href="/welcome/door" />;
}
