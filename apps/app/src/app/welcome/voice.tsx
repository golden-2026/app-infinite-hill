// "meet your voice" was retired (owner, 2026-10-12): the voice is now met full size on the door card everyone sees.
// Old links and saved places land on the welcome instead.
import { Redirect, useLocalSearchParams } from "expo-router";
import { doorParam } from "@/lib/door-param";

export default function MeetVoice() {
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) || "SPIRITUAL";
  return <Redirect href={{ pathname: "/welcome/ready", params: { door } }} />;
}
