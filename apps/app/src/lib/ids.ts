import * as Crypto from "expo-crypto";

/** 32 hex chars, e.g. for sit ids and the device id. */
export function randomId(prefix = ""): string {
  return prefix + Crypto.randomUUID().replace(/-/g, "");
}
