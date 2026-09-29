// The outage watcher: runs every 10 minutes on Netlify (netlify/functions/ai-watch.js) and sends the owner a phone
// alert when the AI or the site stops working, and again when it's back. It also warns once a day if the site-wide
// AI limit is reached. It only alerts when something changes, so a long outage is one message, not one every 10 minutes.
// Alerts go to ALERT_URL (set in Netlify, never in code): an ntfy.sh topic link (free phone app), a Slack incoming
// webhook, or a Discord webhook. Without ALERT_URL it still checks and remembers, it just can't tell anyone.
// Alerts carry only what broke and when; never anything a person wrote.
import { currentStore, snapshot } from "./_usage.js";

const MODELS_URL = "https://api.anthropic.com/v1/models?limit=1";
const TIMEOUT_MS = 6_000;
const STATE_KEY = "watch/state";

async function timed(fetchImpl, url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** What's wrong right now, as plain sentences (empty when everything works). */
export async function findProblems({ env = process.env, fetchImpl = fetch, now = new Date() } = {}) {
  const problems = [];
  const siteUrl = env.URL;
  if (siteUrl) {
    try {
      // The site sits behind the team login, so a 401 still means "up and answering". Only no answer or a 5xx is down.
      const res = await timed(fetchImpl, siteUrl, { method: "GET", redirect: "manual" });
      if (res.status >= 500) problems.push(`the site is answering with an error (${res.status})`);
    } catch {
      problems.push("the site isn't answering");
    }
  }
  const key = env.ANTHROPIC_API_KEY;
  if (!key) {
    problems.push("the AI key is missing in Netlify, so the Guide and companion are using lesson text only");
  } else {
    try {
      // Listing models costs nothing and proves the key works and Anthropic is reachable.
      const res = await timed(fetchImpl, MODELS_URL, { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } });
      if (res.status === 401 || res.status === 403) problems.push("Anthropic is rejecting the AI key (it may have been deleted or changed)");
      else if (!res.ok) problems.push(`Anthropic isn't answering normally (${res.status})`);
    } catch {
      problems.push("Anthropic isn't answering");
    }
  }
  const usage = await snapshot(now).catch(() => null);
  if (usage) {
    const { ok, failed } = usage.lastHours;
    if (failed >= 5 && failed >= ok) problems.push(`most AI answers are failing (${failed} failed, ${ok} worked in the last two hours); it may be the monthly spending limit`);
  }
  return { problems, usage };
}

function alertRequest(alertUrl, title, message) {
  if (/hooks\.slack\.com\//.test(alertUrl)) return { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `*${title}*\n${message}` }) };
  if (/discord(app)?\.com\/api\/webhooks\//.test(alertUrl)) return { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `**${title}**\n${message}` }) };
  // ntfy.sh and anything else that takes plain text
  return { headers: { "Content-Type": "text/plain; charset=utf-8", Title: title, Tags: "infinite-hill" }, body: message };
}

export async function sendAlert(title, message, { env = process.env, fetchImpl = fetch } = {}) {
  const alertUrl = env.ALERT_URL;
  if (!alertUrl || !/^https:\/\//.test(alertUrl)) return false;
  try {
    const res = await timed(fetchImpl, alertUrl, { method: "POST", ...alertRequest(alertUrl, title, message) });
    return res.ok;
  } catch {
    return false;
  }
}

/** One check: compare with last time, alert on change, remember the result. Returns what it decided (for tests and logs). */
export async function watch({ env = process.env, fetchImpl = fetch, now = new Date() } = {}) {
  const store = currentStore();
  const before = (await store.get(STATE_KEY).catch(() => null)) || { down: false, since: null, reasons: [], limitDay: null };
  const { problems, usage } = await findProblems({ env, fetchImpl, now });
  const down = problems.length > 0;
  const stamp = now.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const sent = [];

  if (down && (!before.down || problems.join("|") !== before.reasons.join("|"))) {
    if (await sendAlert("infinite hill: something's down", `${problems.map((p) => `• ${p}`).join("\n")}\n\nchecked ${stamp}. the app keeps working on lesson text meanwhile.`, { env, fetchImpl })) sent.push("down");
  } else if (!down && before.down) {
    if (await sendAlert("infinite hill: back to normal", `everything's working again (${stamp}).`, { env, fetchImpl })) sent.push("up");
  }
  let limitDay = before.limitDay;
  if (usage && usage.used >= usage.siteLimit && limitDay !== usage.day) {
    limitDay = usage.day;
    if (await sendAlert("infinite hill: daily AI limit reached", `the site used all ${usage.siteLimit} AI answers today. people get lesson text until midnight UTC. raise AI_DAILY_SITE in Netlify if this is real growth.`, { env, fetchImpl })) sent.push("limit");
  }

  const after = { down, since: down ? (before.down ? before.since : stamp) : null, reasons: problems, limitDay, checked: stamp };
  await store.set(STATE_KEY, after).catch(() => {});
  return { ...after, sent, usage };
}

/** The last check, for the owner's health view. */
export async function lastCheck() {
  return (await currentStore().get(STATE_KEY).catch(() => null)) || null;
}
