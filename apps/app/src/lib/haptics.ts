import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** A light tap on iPhone/Android; nothing on web. */
export function tapHaptic() {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
export function successHaptic() {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
