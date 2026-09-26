import { Redirect, Stack, useGlobalSearchParams } from "expo-router";
import { color } from "@/ui";

// The after-lesson screens need the finished lesson's facts from the URL. A reload of a bare /done/*
// link (or an old bookmark) has none, so it goes to Today instead of showing "undefined".
export default function DoneLayout() {
  const p = useGlobalSearchParams<{ door?: string; day?: string }>();
  if (!p.door || !(Number(p.day) > 0)) return <Redirect href="/today" />;
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, contentStyle: { backgroundColor: color.cream } }} />;
}
