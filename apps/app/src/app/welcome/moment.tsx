import { Redirect } from "expo-router";

// Retired 2026-09-27: onboarding no longer picks a door for people from a mood. Everyone chooses their own door;
// "my own path" asks how they're feeling as part of getting to know them. Old links land on the door picker.
export default function Moment() {
  return <Redirect href="/welcome/door" />;
}
