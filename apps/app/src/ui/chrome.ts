import { useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";
import { Platform } from "react-native";
import { color } from "@ih/brand";

/** The phone's status bar and the browser's bar match the screen: light text on dark screens (lessons,
 *  light-your-day), dark text on cream. Set on focus so going back restores it. */
export function useChrome(dark: boolean) {
  useFocusEffect(useCallback(() => {
    // loud brand (2026-11-06): every page is black now, so the bars are always light-on-black
    setStatusBarStyle("light");
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute("content", dark ? color.black : color.cream);
    }
  }, [dark]));
}
