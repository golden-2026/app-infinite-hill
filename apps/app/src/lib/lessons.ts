// Where the full lesson scripts live, and the device store that keeps a few weeks of them (docs/curriculum/LESSON_LOADER.md).
// The loader itself is `lessonScript` in @ih/content/lesson-script; the pure parts are in @/session/script-load.
import { Platform } from "react-native";
import Constants from "expo-constants";
import { readJSON, remove, writeJSON } from "@/lib/storage";
import { makeLessonStore } from "@/session/script-load";

// web: the same origin (the export ships public/lessons); native: the deployed site (from app config if set)
export const LESSONS_BASE =
  Platform.OS === "web" ? "/lessons" : `${(Constants.expoConfig?.extra as any)?.siteUrl ?? "https://golden-house-beta.netlify.app"}/lessons`;

function keys(): string[] {
  const out: string[] = [];
  try {
    const ls = globalThis.localStorage;
    for (let i = 0; i < (ls?.length ?? 0); i++) { const k = ls!.key(i); if (k) out.push(k); }
  } catch {}
  return out;
}

export const lessonStore = makeLessonStore({ read: (k) => readJSON<any>(k, null), write: writeJSON, remove, keys });
