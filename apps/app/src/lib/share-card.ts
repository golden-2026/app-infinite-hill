// Share cards: a milestone (30 / 100 / 365 days, or days together with a friend) or the year recap, painted as an
// image and sent the share-lantern way: the phone's share sheet (Web Share with the image file) when there is one,
// otherwise the image downloads and the link is copied. Only public facts go on a card: a number, the path's name,
// the sun, the mascot, "infinite hill" and a link. Never the journal, moods, answers, kept lines or a friend's name.
import { art } from "@ih/brand";
import { data, label } from "@ih/content";
import { Asset } from "expo-asset";
import { Platform, Share } from "react-native";

export const CARD_W = 1080;
export const CARD_H = 1350;
const INK = "#0A0A0A", CREAM = "#F7F7F5", GOLD = "#EEFF6A", MUTE = "#6b6b6b";
const DISPLAY = "Manrope_800ExtraBold, Manrope, system-ui, sans-serif";
const TEXT = "Inter_600SemiBold, Inter, system-ui, sans-serif";
const MARK = "Baloo2_800ExtraBold, 'Baloo 2', system-ui, sans-serif";

export const pathName = (door: string) => (door === "SPIRITUAL" ? "my own path" : `the ${label(door).toLowerCase()} path`);

/** The link on the card and in the share: the app's own address (no personal data in it). */
export function siteLink(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}/`;
  return (process.env.EXPO_PUBLIC_SITE_URL || "https://golden-house-beta.netlify.app").replace(/\/?$/, "/");
}

export type MilestoneCard = { kind: "streak" | "together"; n: number; door: string };
export type YearCard = { kind: "year"; door: string; days: number; hours: string; lessons: number; words: number; longest: number; range: string };
export type CardSpec = MilestoneCard | YearCard;

export const cardText = (c: CardSpec) =>
  c.kind === "year" ? `my year on infinite hill: ${c.days} days, ${c.lessons} lessons, ${c.words} words, ${c.hours} learned.`
  : c.kind === "together" ? `${c.n} days walking together on infinite hill.`
  : `${c.n}-day streak on infinite hill, on ${pathName(c.door)}.`;

const load = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
  const img = new (globalThis as any).Image() as HTMLImageElement;
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});
async function artUri(ref: string): Promise<string | null> {
  const a = art(ref);
  if (!a) return null;
  try { return typeof a.src === "string" ? a.src : Asset.fromModule(a.src).uri || null; } catch { return null; }
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: "left" | "center" = "left") {
  const chars = [...text];
  const w = chars.reduce((n, c) => n + ctx.measureText(c).width + spacing, -spacing);
  let cx = align === "center" ? x - w / 2 : x;
  ctx.textAlign = "left";
  for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + spacing; }
}

/** Paints the card. Web only (a canvas); returns null where there's no canvas. */
export async function paintCard(c: CardSpec): Promise<HTMLCanvasElement | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") return null;
  try { await (document as any).fonts?.ready; } catch {}
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const [sunSrc, guySrc] = await Promise.all([artUri(data.SUN_IMG), artUri(data.GUY.joy || data.GUY.jump)]);
  const [sun, guy] = await Promise.all([sunSrc ? load(sunSrc) : null, guySrc ? load(guySrc) : null]);

  // the page: cream, a soft gold glow behind the sun, and a thin ink frame
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const glow = ctx.createRadialGradient(CARD_W / 2, 330, 40, CARD_W / 2, 330, 520);
  glow.addColorStop(0, "rgba(238,255,106,0.85)");
  glow.addColorStop(1, "rgba(238,255,106,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, 900);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  round(ctx, 36, 36, CARD_W - 72, CARD_H - 72, 56);
  ctx.stroke();

  // the wordmark
  ctx.fillStyle = INK;
  ctx.font = `800 64px ${MARK}`;
  ctx.textAlign = "center";
  ctx.fillText("infinite hill", CARD_W / 2, 140);

  if (c.kind === "year") {
    if (sun) ctx.drawImage(sun, CARD_W / 2 - 150, 160, 300, 300);
    ctx.fillStyle = INK;
    ctx.font = `800 84px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.fillText("my year on the hill", CARD_W / 2, 520);
    ctx.fillStyle = MUTE;
    ctx.font = `600 34px ${TEXT}`;
    spaced(ctx, `${pathName(c.door)} · ${c.range}`.toUpperCase(), CARD_W / 2, 578, 4, "center");
    const stats: [string, string][] = [[String(c.days), c.days === 1 ? "day" : "days"], [String(c.lessons), c.lessons === 1 ? "lesson" : "lessons"], [String(c.words), c.words === 1 ? "word" : "words"], [c.hours.split(" ")[0], c.hours.split(" ").slice(1).join(" ")], [String(c.longest), "longest streak"]];
    const x0 = 110, y0 = 636, bw = 400, bh = 140, gap = 40;
    stats.forEach(([big, small], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = x0 + col * (bw + gap), y = y0 + row * (bh + 22);
      if (i === 4) { // the last one, beside the mascot
        ctx.fillStyle = GOLD;
      } else ctx.fillStyle = "#fff";
      round(ctx, x, y, bw, bh, 32);
      ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = `800 76px ${DISPLAY}`;
      ctx.textAlign = "left";
      ctx.fillText(big, x + 32, y + 82);
      ctx.fillStyle = MUTE;
      ctx.font = `600 26px ${TEXT}`;
      spaced(ctx, small.toUpperCase(), x + 34, y + 120, 3);
    });
    if (guy) { const h = 300, w = (guy.width / guy.height) * h; ctx.drawImage(guy, CARD_W - 120 - w, CARD_H - 150 - h + 40, w, h); }
  } else {
    if (sun) ctx.drawImage(sun, CARD_W / 2 - 160, 160, 320, 320);
    ctx.fillStyle = INK;
    const num = String(c.n);
    ctx.font = `800 ${num.length > 2 ? 300 : 340}px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.fillText(num, CARD_W / 2, 770);
    ctx.font = `800 80px ${DISPLAY}`;
    ctx.fillText(c.kind === "together" ? "days together" : "day streak", CARD_W / 2, 866);
    ctx.fillStyle = MUTE;
    ctx.font = `600 36px ${TEXT}`;
    spaced(ctx, (c.kind === "together" ? "walking with a friend" : `on ${pathName(c.door)}`).toUpperCase(), CARD_W / 2, 930, 5, "center");
    if (guy) { const h = 290, w = (guy.width / guy.height) * h; ctx.drawImage(guy, CARD_W - 100 - w, CARD_H - 76 - h, w, h); }
  }

  // the foot: a gold pill with the link, and the line every card carries
  const link = siteLink().replace(/^https?:\/\//, "").replace(/\/$/, "");
  ctx.font = `600 30px ${TEXT}`;
  const lw = Math.min(620, ctx.measureText(link).width + 64);
  ctx.fillStyle = GOLD;
  round(ctx, 96, CARD_H - 206, lw, 72, 36);
  ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.fillText(link, 128, CARD_H - 160, lw - 64);
  ctx.fillStyle = MUTE;
  ctx.font = `600 24px ${TEXT}`;
  spaced(ctx, "WE SCORE LEARNING, NEVER FAITH.", 98, CARD_H - 96, 3);
  return canvas;
}

const toBlob = (canvas: HTMLCanvasElement) => new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));

/**
 * Shares the card: the image through the share sheet where the phone can share files; otherwise the image
 * downloads and the link is copied. Native (no canvas): the share sheet with the words and the link.
 * Returns what happened, for the toast.
 */
export async function shareCard(c: CardSpec, canvas: HTMLCanvasElement | null): Promise<"shared" | "saved" | "copied" | "closed" | "failed"> {
  const text = cardText(c);
  const url = siteLink();
  if (Platform.OS !== "web") {
    try { const r = await Share.share({ message: `${text}\n${url}` }); return r.action === Share.sharedAction ? "shared" : "closed"; } catch { return "failed"; }
  }
  const nav = (globalThis as any).navigator;
  const blob = canvas ? await toBlob(canvas) : null;
  const name = c.kind === "year" ? "infinite-hill-my-year.png" : `infinite-hill-${c.n}-days.png`;
  const file = blob && typeof File !== "undefined" ? new File([blob], name, { type: "image/png" }) : null;
  if (file && nav?.canShare?.({ files: [file] }) && nav.share) {
    try { await nav.share({ files: [file], text: `${text} ${url}` }); return "shared"; }
    catch (e: any) { if (e?.name === "AbortError") return "closed"; }
  }
  if (!file && nav?.share) {
    try { await nav.share({ title: "infinite hill", text, url }); return "shared"; }
    catch (e: any) { if (e?.name === "AbortError") return "closed"; }
  }
  let saved = false;
  if (blob && typeof document !== "undefined") {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href; a.download = name; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
    saved = true;
  }
  try { await nav?.clipboard?.writeText(`${text} ${url}`); if (!saved) return "copied"; } catch {}
  return saved ? "saved" : "failed";
}
