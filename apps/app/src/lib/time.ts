import { localDate } from "@ih/domain";

export const timeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/** The one source of "now" and "today" for the app. Tests move time with the browser clock. */
export const now = () => new Date();
export const today = () => localDate(now(), timeZone());
