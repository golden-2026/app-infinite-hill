// The owner's waitlist desk: counts by door, releasing invites in batches, codes for Keepers and voices.
// The admin key is read from this terminal's environment (WAITLIST_ADMIN_KEY, the same value set in Netlify) and is
// never printed. Nothing is sent by email: no email provider is configured, so `release` prints the invited people with
// their codes and links for you to send yourself (see deliverInvites in api/waitlist.js for where a provider plugs in).
//
//   node atlas/waitlist-admin.mjs <siteUrl> stats
//   node atlas/waitlist-admin.mjs <siteUrl> release <n> [DOOR] [--csv file.csv]   next n in line (one door, or all)
//   node atlas/waitlist-admin.mjs <siteUrl> codes <n> [uses] [label]              codes not tied to the waitlist
//   node atlas/waitlist-admin.mjs <siteUrl> grant <memberId> <n>                  n more invites for a member
//   node atlas/waitlist-admin.mjs <siteUrl> remove <email>                        someone asked to be deleted
//
// PowerShell:  $env:WAITLIST_ADMIN_KEY = "<the key>"; node atlas/waitlist-admin.mjs https://golden-house-beta.netlify.app stats
// A --csv file holds email addresses: keep it out of the repository and delete it once the invites are sent.
import { writeFileSync } from "node:fs";

const [site, cmd, ...rest] = process.argv.slice(2);
const key = process.env.WAITLIST_ADMIN_KEY;
const usage = () => { console.error("usage: node atlas/waitlist-admin.mjs <siteUrl> stats | release <n> [DOOR] [--csv file] | codes <n> [uses] [label] | grant <memberId> <n> | remove <email>"); process.exit(1); };
if (!site || !cmd) usage();
if (!key || key.length < 16) { console.error("Set WAITLIST_ADMIN_KEY in this terminal first (the same value as in Netlify, at least 16 characters)."); process.exit(1); }

async function api(kind, body) {
  const res = await fetch(`${site.replace(/\/+$/, "")}/api/waitlist?kind=${kind}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${key}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await res.json().catch(() => null);
  if (res.status === 404 && !json?.error?.startsWith?.("No such")) { console.error("404: the waitlist function isn't deployed there, or the key doesn't match the one set in Netlify."); process.exit(1); }
  if (!res.ok) { console.error(`${res.status}: ${json?.error || "no answer"}`); process.exit(1); }
  return json;
}

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

if (cmd === "stats") {
  const s = await api("admin-stats");
  console.log(`launch switch (INVITE_ONLY): ${s.inviteOnly ? "ON" : "off"}`);
  console.log(`members: ${s.members} of a founding class of ${s.foundingCap}${s.betaClaims ? ` (${s.betaClaims} from the private beta)` : ""}`);
  console.log(`ever joined the list: ${s.joinedTotal}`);
  console.log("\ndoor           waiting  invited (not yet in)");
  for (const d of Object.keys(s.waiting)) console.log(`${d.padEnd(14)} ${String(s.waiting[d]).padStart(7)}  ${String(s.invited[d]).padStart(7)}`);
} else if (cmd === "release") {
  const n = Number(rest[0]);
  if (!Number.isInteger(n) || n < 1) usage();
  const door = rest[1] && !rest[1].startsWith("--") ? rest[1].toUpperCase() : undefined;
  const ci = rest.indexOf("--csv");
  const r = await api("admin-release", { n, ...(door ? { door } : {}) });
  console.log(`released ${r.released}${r.capped ? " (fewer than asked: the line ran out or the founding cap was reached)" : ""}`);
  console.log(`email: ${r.delivery.provider ? `${r.delivery.sent} sent by ${r.delivery.provider}` : "NOT SENT. No email provider is configured; send these yourself."}\n`);
  for (const x of r.invited) console.log(`${x.email}\t${x.name || ""}\t${x.door}\t${x.code}\t${x.link}`);
  console.log("\nEach person can also see their code by opening the waitlist again on the phone or page they joined from.");
  if (ci >= 0 && rest[ci + 1]) {
    writeFileSync(rest[ci + 1], ["email,first name,door,code,link,language", ...r.invited.map((x) => [x.email, x.name, x.door, x.code, x.link, x.lang].map(csvCell).join(","))].join("\n") + "\n");
    console.log(`wrote ${rest[ci + 1]} (it holds email addresses: keep it out of the repository, delete it when done)`);
  }
} else if (cmd === "codes") {
  const n = Number(rest[0]);
  const uses = rest[1] ? Number(rest[1]) : 1;
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(uses)) usage();
  const r = await api("admin-codes", { n, uses, ...(rest[2] ? { label: rest.slice(2).join(" ") } : {}) });
  for (const c of r.codes) console.log(`${c.code}\tuses ${c.uses}\t${c.label || ""}\t${c.link}`);
} else if (cmd === "grant") {
  const [memberId, n] = [rest[0], Number(rest[1])];
  if (!memberId || !Number.isInteger(n)) usage();
  const r = await api("admin-grant", { memberId, n });
  console.log(`granted ${r.granted} invites: ${r.codes.join(" ")}`);
} else if (cmd === "remove") {
  if (!rest[0]) usage();
  const r = await api("admin-remove", { email: rest[0] });
  console.log(r.removed ? "removed from the waitlist" : "that email wasn't on the waitlist");
} else usage();
