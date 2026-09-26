import { Platform } from "react-native";

/** Image fade-in. Native only: on web, expo-image leaves already-cached images transparent. */
export const FADE = Platform.OS === "web" ? undefined : 180;
