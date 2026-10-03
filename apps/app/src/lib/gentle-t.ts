// t() for the "gentle." strings (i18n/strings/gentle.ts). They're merged into the app's dictionaries in i18n/index.ts,
// beside the areas, so their keys are typed here rather than in `Key` (which other files use to index the areas).
import { t, type Key } from "@/i18n";
import type { en } from "@/i18n/strings/gentle";

export type GentleKey = keyof typeof en;
export const tg = (key: GentleKey, vars?: Parameters<typeof t>[1]) => t(key as unknown as Key, vars);
