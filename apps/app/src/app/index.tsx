import { Redirect } from "expo-router";
import { useStore } from "@/lib/store";

// The front door: returning people land on Today; new people start the welcome.
export default function Index() {
  const { saved } = useStore();
  return <Redirect href={saved.settings.onboarded ? "/today" : "/welcome"} />;
}
