import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const source = await readFile(new URL("../../src/components/AccountScreen.jsx", import.meta.url), "utf8");
const vite = await createServer({ configFile: new URL("../../vite.config.js", import.meta.url).pathname, server: { middlewareMode: true }, appType: "custom" });
const { default: AccountScreen } = await vite.ssrLoadModule("/src/components/AccountScreen.jsx");
const markup = renderToStaticMarkup(React.createElement(AccountScreen));
await vite.close();

test("account screen describes device-local anonymous storage without implying sign-in", () => {
  assert.match(markup, /Saved on this device/);
  assert.match(markup, /There is no sign-in or verified identity/);
  assert.match(markup, /Your place, kept safe\./);
});

test("backup download excludes the sync credential by default and warns when opted in", () => {
  assert.match(markup, /Download backup file/);
  assert.match(markup, /Include private sync credential/);
  assert.match(markup, /Anyone with the downloaded file could access this anonymous account’s encrypted server backup/);
  assert.match(source, /createLocalSnapshot\(\{ includeRecoveryCredential \}\)/);
  assert.match(source, /useState\(false\).*includeRecoveryCredential/s);
  assert.match(source, /includeRecoveryCredential\s*\?\s*"Backup file downloaded with its private sync credential/);
  assert.match(source, /Backup file downloaded without the private sync credential/);
});

test("backup upload and remote restore are opt-in, user-triggered and status-aware", () => {
  assert.match(markup, /I want encrypted backup on this browser/);
  assert.match(markup, /Upload encrypted backup/);
  assert.match(markup, /Check for backup/);
  assert.match(source, /if \(!backupEnabled \|\| busy\) return;/);
  assert.match(source, /result\.delivered/);
  assert.match(source, /setSyncStatus\("delivered"\)/);
  assert.match(source, /Restore this backup to this device\?/);
  assert.match(source, /Restoring replaces the saved account details and progress on this device\./);
  assert.match(source, /onClick=\{confirmRemoteRestore\}/);
});

test("backup import validates type and size before parsing and asks before replacing data", () => {
  assert.match(markup, /Choose a Golden JSON backup file/);
  assert.match(markup, /application\/json,\.json/);
  assert.match(source, /file\.size > MAX_IMPORT_BYTES/);
  assert.match(source, /file\.type === "application\/json"/);
  assert.ok(source.indexOf("file.size > MAX_IMPORT_BYTES") < source.indexOf("await file.text()"));
  assert.match(source, /Replace this device’s saved account data\?/);
  assert.match(source, /This will update the local account and saved progress\./);
  assert.match(source, /onClick=\{confirmImport\}/);
});

test("changing status is announced and actionable controls have native semantics", () => {
  assert.match(markup, /<main/);
  assert.match(markup, /<button type="button"/);
  assert.match(markup, /<input type="checkbox"/);
  assert.match(markup, /aria-live="polite"/);
  assert.match(markup, /Backup status: not confirmed/);
  assert.match(source, /notice\.type === "error" \? "alert" : "status"/);
  assert.doesNotMatch(markup, /[a-f0-9]{64}/i);
});
