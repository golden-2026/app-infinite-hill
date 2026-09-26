# Privacy architecture review

**Status: private preview only; not a legal opinion or release approval.** This review describes the repository as inspected on 2026-09-12. It is an engineering assessment of the current app and APIs. Legal counsel must review the product, audience, vendors, notices, and applicable jurisdictions before production.

## Executive finding

Golden records a person's selected religious or spiritual path and practice history. That information is sensitive even when it is only a door choice, lesson position, or completion date. The current client keeps most product state in browser `localStorage`; the platform layer can send an encrypted snapshot to a libSQL/Turso-backed endpoint, but the app shell does not currently wire that sync into its progress lifecycle. The account is an anonymous device profile, not verified identity or a recoverable account. The Guide sends a door label, lesson/day context, earned words, and recent conversation messages to Anthropic when configured. There is no implemented end-user export/delete surface, retention policy, age gate, or validated account deletion operation in the reviewed code.

**Do not enable public registration, family/minor use, or production Guide processing until the P0 items below are resolved.** The marketing prototype promises export/delete, no sale or sharing of faith data, parent visibility, and limited event/location behavior; these are product copy, not implemented controls or a published, counsel-reviewed privacy policy.

## Data inventory and observed flows

| Data | Observed fields / source | Current location and movement | Sensitivity / notes |
|---|---|---|---|
| Anonymous profile | Random `anon_` ID, creation time, nullable display name/email, 256-bit recovery credential | `golden:platform:account:v1` in browser local storage; the sync API stores the user ID and SHA-256 credential hash after first upload | The ID is a locator, not identity. The recovery credential is a bearer secret. No verified email or login exists. |
| Practice and app state | Home door, visiting door, per-door lesson/path state, completion count/date, plan preview, chime and voice preferences, onboarding state | `golden:v150:state` in browser local storage; `createLocalSnapshot()` can include it. Current `src/Golden.jsx` writes this state directly. | Door selections and progress can reveal or strongly imply religion/belief and practice habits. The app includes eight religious/spiritual doors. |
| Guide conversation | User's free-text question; last eight prior user/assistant turns; client-composed system prompt containing door, day, and earned words | In-memory React component state for the current mounted Guide view; a request goes to `POST /api/guide`, then Anthropic Messages API when configured. No conversation persistence is visible in the inspected code. | Free text may disclose belief, family conflict, grief, health, or other sensitive details. The prompt carries religious-path and engagement context even when the user question does not. Vendor retention/training terms are not verified here. |
| Local beta preferences and gift draft | Reminder-interest marker; gift recipient name/SKU and save timestamp | Additional `localStorage` keys in `src/Golden.jsx` | Recipient identity can be personal data. No actual gift is sent or purchased in this preview. |
| Service credentials | `TURSO_DATABASE_URL`, optional `TURSO_AUTH_TOKEN`, `ANTHROPIC_API_KEY` | Server environment for deployed handlers; local `.env*` ignored by Git; local SQLite at `.data/golden.db` | Never bundle into `VITE_*`, client JS, source maps, or logs. Verify deployment secret access and rotation. |
| Browser/network metadata | IP address, user agent, request path, timestamps and provider operational telemetry | Hosting, database, and AI provider layers may process these as part of normal service operation | Exact logs, retention, region, support access, and deletion behavior are not established by this repo. |

The Guide route forwards the user question and up to eight preceding turns, plus the client-provided system prompt. It does not send the anonymous account ID in its explicit JSON body. Provider and hosting network metadata may still identify a request. The client constructs that system prompt with the selected door, current day, and earned curriculum words. Guide UI messages are held only in component state in the inspected implementation, but transient state can still appear in browser memory, crash reports, extensions, or screen capture.

No analytics SDK, location lookup, microphone capture, contacts sync, notification scheduler, payment provider, or social messaging backend was found in the reviewed application/API paths. Current UI copy describes some of these future product concepts. Re-check before adding any such provider.

## Storage and encryption boundary

### Device-local storage

- App progress and preferences are written as ordinary JSON in `localStorage`. Browser storage is available to same-origin JavaScript and is not encrypted by this app. Other people using the same unlocked browser profile may see the account/progress. Clearing site data or losing a device loses the local-only copy.
- The recovery credential is also kept as plaintext JSON in `localStorage`. It is a random 32-byte value represented as hex. Anyone who can execute script on the origin or read the browser profile can copy it and authenticate to remote sync.
- The preview UI has device-local reminder interest and gift draft values. No app-level export, delete, or clear-all control was observed in the profile flow.
- The service worker caches the shell and same-origin GET resources, excluding `/api/`; it does not intentionally cache API responses. Cached static assets are not user state, but old installed clients can continue to run stale code until updated.

### Optional encrypted sync foundation

`src/platform/index.js` implements snapshot encryption using Web Crypto AES-256-GCM with a fresh 12-byte IV. It derives the AES key through HKDF-SHA-256 from the same recovery credential, a fixed application salt, and fixed context. The recovery credential is sent in an HTTPS `Authorization: Bearer` header. `api/state.js` checks the credential against the SHA-256 hash stored in `anonymous_accounts`; `api/_db.js` stores the encrypted envelope (schema version, algorithm, IV, ciphertext) and timestamps. The server does not need to decrypt the snapshot. The implementation is therefore designed for client-side, end-to-end encrypted state at rest in the database, subject to the client and deployment trust boundaries below.

This is not a complete account system or a reviewed cryptographic protocol. In particular:

- The encryption key and sync authorization secret are the same credential. Credential compromise gives both read/write access and decryption capability.
- That credential is stored unencrypted in the browser and is included in an export only when the caller explicitly opts in. Such an export is equivalent to a password and exposes all snapshot data.
- There is no credential rotation, revocation, reset, or server-side identity proof. Loss of the credential makes an uploaded snapshot unrecoverable; possession is sufficient to impersonate the anonymous account.
- No version/conflict merge protocol, rollback protection, device revocation, or account deletion route exists. Last write wins for the single account-state row.
- The encrypted snapshot does not appear to authenticate account ID/schema metadata as AES-GCM additional authenticated data. Review the envelope format before treating metadata binding as guaranteed.
- Database ciphertext protects against a database-only read, not compromise of the browser, application origin, build/deploy pipeline, bearer credential, hosting runtime, or a malicious client update.
- HTTPS, database encryption at rest, backup encryption/retention, data region, and vendor operator controls depend on deployment configuration and were not verified by this local source review.

`saveRemoteSnapshot` and `fetchRemoteSnapshot` return meaningful statuses from observed API responses, but the current app progress writer in `src/Golden.jsx` is a direct local-storage write. Do not describe cross-device sync as active unless the real app invokes the sync functions and a live deployment test confirms it.

## Threat boundaries

| Threat actor / failure | What is protected today | Remaining exposure |
|---|---|---|
| Database reader without client credential | Remote state ciphertext; credential is stored as SHA-256 hash | User IDs, timestamps, row existence/size/update cadence, and access patterns remain visible. Hash is unsalted, though the input is a high-entropy random credential rather than a human password. |
| Database writer or malicious storage change | AES-GCM authentication detects ciphertext/IV tampering during decryption | Deletion, replay/rollback, row replacement, denial of service, metadata substitution, or availability loss remain possible. |
| Same-origin XSS, compromised dependency, malicious deployment | No meaningful protection | Script can read local state and recovery credential, alter content, intercept Guide text, and upload fabricated snapshots. CSP and dependency/security review are not established. |
| Lost/shared/unlocked device or browser profile | No app-level local encryption or lock | Religious choices, progress, preferences, gift draft, and sync secret are readable. Browser/device controls are the only barrier. |
| Network observer | HTTPS should protect in transit when correctly deployed | HTTPS enforcement/HSTS and production routing are not verified. User ID appears in a GET query string and can enter access logs. |
| Abusive unauthenticated Guide caller | Server-held AI key is not sent to the browser | No rate limit, quota, abuse control, or authentication is visible. A public caller may consume the API key budget; request text is sent to the configured vendor. The server accepts a client-provided `system` prompt. |
| Hosting/vendor operator or subpoena | No server-side Guide history/database plaintext is intentionally stored by app code | Vendor/provider logs, AI processing, database backups, and hosting telemetry policies are unknown and outside this code's cryptographic guarantee. |
| Minor using the service | No age or guardian control observed in app code | Marketing content explicitly anticipates kids and parent tables, but the account model has no family membership or parental consent controls. Do not open this preview to children as a production service. |

## Deletion, export, and recovery gaps

- `exportLocalSnapshot()` and `importLocalSnapshot()` are library functions. No user-facing export/import flow or verified download flow was found in the account/profile screens.
- Local deletion is not implemented as a user action. Clearing browser storage is not a substitute: it does not remove remote account rows, database backups, provider logs, or local copies on another device.
- There is no `DELETE /api/state` route or administrative deletion workflow. The current API only supports GET and PUT. Deleting a row without a verified identity/recovery policy could also strand or destroy another user's data.
- There is no support workflow to prove a requester's control of the anonymous account, revoke credentials, remove current and backup copies, or document completion.
- Recovery is by exporting and retaining the raw recovery credential. There is no reset or verified-identity recovery. Users must not be told that an account is recoverable in the ordinary sense.
- Export currently serializes profile and app state, and may optionally include the recovery credential. Before exposing this to users, define a stable readable format, warning, destination/download behavior, import validation, credential rotation, and backup exclusions.

## Logging, telemetry, and operations

In the inspected application routes, there are no explicit `console` writes or request-body logging statements. This does not prove that Netlify, database, CDN, or Anthropic provider logs are disabled or short-lived. The Guide request body contains free text and sensitive context; API gateway/body tracing, exception reporters, session replay, and AI observability must be configured to redact or exclude it. Never log `Authorization`, recovery credentials, API keys, full request bodies, prompts, or decrypted snapshots. For operational metrics, prefer aggregate status/error counts and coarse latency without user ID, door, question, or message content.

Keep `ANTHROPIC_API_KEY` and any Turso credentials in server-only deployment secrets; scope them to the minimum service and rotate them after suspected exposure. Restrict production database and deployment-console access, require MFA, audit access, document backup/restore and deletion behavior, and run dependency/build artifact scans. The repository ignores `.env*` and `.data/`, but that alone does not validate deployment secret handling or prevent accidental inclusion in build artifacts.

Before live use, confirm the deployed route paths are actually mapped by Netlify and that methods, headers, body-size limits, HTTPS, no-store response headers, logs, and environment variables match the source. Confirm whether the serverless runtime and Turso deployment tolerate the client's request patterns and share one durable database; local SQLite is only a development default and should not be treated as durable serverless production storage.

## Release blockers and ordered changes

### P0 — required before public launch or sensitive real-user collection

1. **Choose a real account and consent model.** Define identity, account ownership, recovery, credential rotation/revocation, device list, and how anonymous preview data is converted. Do not label the current anonymous record a sign-in account.
2. **Ship user-controlled export and complete deletion.** Provide in-product export, local clear, remote deletion, credential revocation, and a documented backup/provider-log retention window. Test both local-only and synced accounts end to end, including failed deletion and retries. Make deletion identity verification safe for anonymous accounts.
3. **Resolve the audience before collecting data.** The product copy says younger kids may participate through a parent's table, but there is no parent/child account, guardian consent, age handling, or family access implementation. Keep minors out of production until counsel and product define and implement the required model and safeguards.
4. **Replace prototype privacy claims with implemented, reviewed notices.** Reconcile promises about no selling/sharing, ads, Guide processing, family visibility, location, export/deletion, and retention with actual data flows and vendor contracts. Obtain qualified privacy counsel review for target jurisdictions and sensitive religious/belief data; this document is not sign-off.
5. **Gate and disclose Guide processing.** Before sending free text and door/progress context to Anthropic, show a clear, just-in-time notice and choice; minimize/remove door/day/earned-word context unless needed; disclose provider, purpose, retention/training terms, and regions; offer a useful non-AI fallback. Verify contractual data-use and retention controls for the selected plan.
6. **Protect the unauthenticated Guide endpoint.** Add rate limits, spend caps, origin/method/content-type checks, abuse monitoring that avoids body collection, timeouts, and a server-owned system prompt/policy. Prevent callers from using the route as an unrestricted proxy against the service API key.
7. **Publish operational controls.** Confirm HTTPS/HSTS, Netlify request logging and retention, Turso region/backups/encryption/access, Anthropic processing/retention, secret scope/rotation, incident response, and a tested restore/deletion procedure. No database or provider assurance is established by this source review.

### P1 — complete before calling the sync foundation production-ready

1. Move the recovery secret out of ordinary local storage where feasible (for example, platform-protected credential storage or a user-held recovery secret); separate authentication from encryption key material with a reviewed derivation and rotation scheme. Add CSP, dependency controls, and strong XSS defenses because browser compromise defeats client-side encryption.
2. Review the crypto protocol with a specialist: bind user ID/schema/version as authenticated data, define nonce and key lifecycle, prevent rollback where required, and document what a server/database attacker can infer. Consider a memory-hard, user-held recovery phrase/key with explicit loss tradeoffs if user experience supports it.
3. Implement versioned sync conflict behavior, device revocation, recovery, export/import UX, account deletion API, and idempotent cleanup across primary rows, backups, and support systems. Add retention limits for abandoned anonymous accounts.
4. Avoid putting identifiers in URLs. Use a route/body identifier or opaque endpoint and ensure hosting access logs do not retain account IDs. Keep `Cache-Control: no-store` and verify on the deployed platform.
5. Add schema minimization and separate storage for account identity, practice/progress, and family/member data. Use least-privilege database credentials and restricted administrative access.
6. Define telemetry before enabling it. Keep analytics off by default for religious-path and practice events; prohibit ad targeting or audience export based on door, lesson, streak, Guide questions, or inferred belief. If aggregate measurement is needed, document explicit purpose, minimization, retention, and opt-out.
7. Add security and privacy tests for invalid/oversized payloads, wrong credentials, replay/rollback policy, credential disclosure, deletion/export, Guide redaction, rate limits, and build-secret leakage. Run these against isolated fixtures and a reviewed staging deployment.

## Evidence consulted

- `src/platform/schema.js` and `src/platform/index.js`: local profile, snapshot/export helpers, client-side AES-GCM/HKDF, bearer credential, sync calls.
- `api/state.js` and `api/_db.js`: encrypted envelope validation, credential checks, SQLite/libSQL persistence, GET/PUT-only state API.
- `src/Golden.jsx`: direct progress local-storage persistence, door/progress state, Guide request construction and in-memory chat log, local gift/reminder values, prototype privacy language.
- `api/guide.js`: server-held Anthropic key, accepted request fields, body/message limits, upstream forwarding, no visible persistence or explicit body logging.
- `public/sw.js`: shell/static GET caching and `/api/` exclusion.
- `README.md`, `docs/PRODUCT_SPEC.md`, and `docs/WAYFINDER.md`: declared preview status, intended capabilities, and unresolved launch requirements.

This evidence is from the local source tree only. It does not establish the deployed Netlify configuration, live database, vendor contract settings, or any legal compliance conclusion.
