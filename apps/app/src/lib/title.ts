import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Platform } from "react-native";

/** Web: each screen names itself, so tabs, history and screen readers say where you are.
 *  On focus, not mount: screens under a pushed one stay mounted, and going back must restore the name. */
export function useTitle(title: string) {
  useFocusEffect(useCallback(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") document.title = title ? `${title} · infinite hill` : "infinite hill";
  }, [title]));
}
