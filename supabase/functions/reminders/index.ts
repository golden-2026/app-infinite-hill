// reminders: web push for infinite hill (Android, desktop, iPhone home-screen installs).
//   GET                         → { publicKey }  (VAPID; created once, the private half never leaves Vault)
//   POST {op:"subscribe", …}    → a browser registers: device id + device secret (hashed here), push keys, tz, time
//   POST {op:"sat", …}          → "sat today" (so today's reminder is skipped)
//   POST {op:"unsubscribe", …}  → removes the device
//   POST (x-cron-secret)        → send due reminders (pg_cron every 15 min)
// Rules: one a day at the person's local time, never after they sat that day, dead endpoints removed.
// Pilot has no accounts (2026-09-25): devices are anonymous; nothing about the person is stored.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SUBJECT = "https://infinite-hill-app.netlify.app";
const WINDOW_MIN = 15;
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Content-Type": "application/json" };
const json = (v: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(v), { status, headers: { ...cors, ...extra } });

const DEV_RE = /^dev_[a-f0-9]{32}$/;
const SECRET_RE = /^[a-f0-9]{64}$/;
const TIME_RE = /^(sundown|([01]?[0-9]|2[0-3]):[0-5][0-9])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function secret(name: string) {
  const { data } = await db.rpc("ih_get_secret", { p_name: name });
  return (data as string | null) ?? null;
}

async function vapid() {
  let pub = await secret("ih_vapid_public");
  let priv = await secret("ih_vapid_private");
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys();
    await db.rpc("ih_set_secret", { p_name: "ih_vapid_public", p_value: k.publicKey });
    await db.rpc("ih_set_secret", { p_name: "ih_vapid_private", p_value: k.privateKey });
    pub = await secret("ih_vapid_public");
    priv = await secret("ih_vapid_private");
  }
  return { pub: pub!, priv: priv! };
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (s: string) => "\\x" + hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
const validTz = (tz: unknown) => { try { return typeof tz === "string" && tz.length <= 64 && !!new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch { return false; } };

async function owns(deviceId: string, devSecret: string) {
  const { data } = await db.from("push_devices").select("secret_hash").eq("device_id", deviceId).maybeSingle();
  return !data ? "none" : data.secret_hash === (await sha256(devSecret)) ? "yes" : "no";
}

function localParts(tz: string, now: Date) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
const target = (t: string) => { const [h, m] = (t === "sundown" ? "19:00" : t).split(":").map(Number); return h * 60 + m; };
const NOTES = [
  "it's golden hour. a few minutes for you.",
  "the sun went down. your stone's still lit till midnight.",
  "one breath, whenever you're ready. the hill's right where you left it.",
];

async function deviceOp(body: any) {
  const { op, device_id, device_secret } = body ?? {};
  if (!DEV_RE.test(device_id) || !SECRET_RE.test(device_secret)) return json({ error: "bad_device" }, 400);
  const own = await owns(device_id, device_secret);
  if (own === "no") return json({ error: "not_yours" }, 403);
  if (op === "subscribe") {
    const s = body.subscription;
    const endpoint = s?.endpoint, p256dh = s?.keys?.p256dh, auth = s?.keys?.auth;
    if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 1000 || typeof p256dh !== "string" || p256dh.length > 200 || typeof auth !== "string" || auth.length > 100) return json({ error: "bad_subscription" }, 400);
    if (!validTz(body.tz) || !TIME_RE.test(body.reminder_time)) return json({ error: "bad_time" }, 400);
    await db.from("push_devices").delete().eq("endpoint", endpoint).neq("device_id", device_id); // an endpoint belongs to one device
    const { error } = await db.from("push_devices").upsert({ device_id, secret_hash: await sha256(device_secret), endpoint, p256dh, auth_key: auth, tz: body.tz, reminder_time: body.reminder_time, ...(DATE_RE.test(body.last_sat_date) ? { last_sat_date: body.last_sat_date } : {}) }, { onConflict: "device_id" });
    return error ? json({ error: "save_failed" }, 500) : json({ ok: true });
  }
  if (own === "none") return json({ ok: true }); // nothing registered: sat/unsubscribe are no-ops
  if (op === "sat") {
    if (!DATE_RE.test(body.date)) return json({ error: "bad_date" }, 400);
    await db.from("push_devices").update({ last_sat_date: body.date }).eq("device_id", device_id);
    return json({ ok: true });
  }
  if (op === "unsubscribe") {
    await db.from("push_devices").delete().eq("device_id", device_id);
    return json({ ok: true });
  }
  return json({ error: "bad_op" }, 400);
}

async function sendDue() {
  const { pub, priv } = await vapid();
  webpush.setVapidDetails(SUBJECT, pub, priv);
  const now = new Date();
  const { data: devs, error } = await db.from("push_devices").select("device_id,endpoint,p256dh,auth_key,tz,reminder_time,last_sat_date,last_sent_date");
  if (error) return json({ error: "read_failed" }, 500);
  let sent = 0, skipped = 0, removed = 0;
  for (const d of devs ?? []) {
    const { date, minutes } = localParts(d.tz, now);
    const t = target(d.reminder_time);
    if (d.last_sent_date === date || d.last_sat_date === date || minutes < t || minutes >= t + WINDOW_MIN) { skipped++; continue; }
    const body = NOTES[new Date(date).getUTCDate() % NOTES.length];
    try {
      await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth_key } }, JSON.stringify({ title: "infinite hill", body, url: "/today" }), { TTL: 3600, urgency: "normal" });
      await db.from("push_devices").update({ last_sent_date: date }).eq("device_id", d.device_id);
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await db.from("push_devices").delete().eq("device_id", d.device_id); removed++; }
    }
  }
  return json({ sent, skipped, removed });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method === "GET") return json({ publicKey: (await vapid()).pub }, 200, { "Cache-Control": "public, max-age=3600" });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (req.headers.get("x-cron-secret")) {
    const expected = await secret("ih_cron_secret");
    return expected && req.headers.get("x-cron-secret") === expected ? sendDue() : json({ error: "unauthorized" }, 401);
  }
  const raw = await req.text();
  if (raw.length > 4096) return json({ error: "too_large" }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ error: "bad_json" }, 400); }
  return deviceOp(body);
});
