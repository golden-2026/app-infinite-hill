# Supabase backend contract

This migration defines a seed-free Supabase/Postgres backend contract for Golden. It needs no cloud project, account credentials, API keys, or production secrets to review or test locally. It does not connect the current app to Supabase or establish that any backend is deployed.

## Run locally

Install the Supabase CLI and Docker Desktop if they are not already available. From the repository root:

```sh
supabase init
supabase start
supabase db reset
supabase test db
```

`supabase init` creates local CLI configuration if the repository does not have it. `supabase db reset` resets only the local Supabase database, then applies migrations in order. The migration creates no user, practice, content, payment, or sample Table seed data. `supabase test db` runs the isolated SQL policy contract in `supabase/tests/rls_contract.test.sql`. Local Supabase prints temporary local service credentials for development; do not copy them into source, `VITE_*` variables, or production settings. No `supabase link` or cloud credentials are needed for these steps.

To inspect the migration without running services, review `supabase/migrations/20260913000100_golden_backend_contract.sql`. The pgTAP suite requires the local Supabase test database and its bundled `pgtap` extension.

## Data and access contract

- `profiles`, `door_progress`, and `practice_completions` are private to the authenticated user. Door choices and practice history are sensitive belief data. The migration grants no `anon` access and defines no public policy for these rows.
- `community_tables` are readable only by members. Membership rows are visible to members of that Table, and a locking database trigger enforces the six-person limit during concurrent invite acceptance. Membership and invite changes use narrow authenticated RPCs: create, accept, or revoke a one-time invite and leave a Table. Invite tokens are random 256-bit values; only SHA-256 digests are stored, and the raw token is returned once.
- `voice_notes` stores metadata only. Audio lives in a private `golden-voice-notes` Storage bucket and is addressed as `<sender-user-id>/<note-uuid>`. The metadata records the allowed audio MIME type. Members can read eligible notes according to the note's table and recipient. Uploads require a matching metadata row. Server cleanup must delete the object and metadata together; do not delete only one side.
- `content_revisions` and `content_approvals` are server-managed. The client has no direct query/write grant. A publishing endpoint must return only content that has passed the exact-revision Keeper, voice-rights, and practice gates. No current draft is made publishable by this schema.
- `entitlements` and `gifts` can be read by their user owner or recipient. Only trusted server code writes them after verifying a provider result or controlled gift claim. This migration does not connect a payment provider or deliver gifts.
- `webhook_events` is service-only. `(provider, event_id)` is unique for idempotency; a webhook handler should insert or claim the event transactionally, apply its effect once, and update status. Persist a payload digest and minimal processing error code, never the raw webhook body.

RLS is enabled on every application table, with explicit grants layered on top. Supabase `service_role` bypasses RLS by design, so it is a server-only secret for trusted Edge Functions or server routes. Never ship it to a browser, mobile bundle, public site, or user-controlled environment. User-facing requests should use the authenticated user JWT so `auth.uid()` enforces row ownership. Keep provider credentials in server-side secrets.

## Integration boundary

The migration is a database contract, not a client adapter. The existing app currently stores progress locally and its established server API uses encrypted snapshots. Before switching storage, implement and review a server/client adapter, account identity and recovery, data migration, deletion/retention behavior, and deployed RLS verification. Do not send Door selections, practice history, Guide questions, or recovery credentials to analytics or logs. Do not query user rows with an anon/public key.

Supabase's local generated project configuration is intentionally separate from this contract. Storage policies assume the standard Supabase `storage` schema and local services. Production project selection, credentials, migration deployment, and backend enablement remain separate operational decisions.

The Table schema does not implement age handling, guardian consent, or a minor-safe family account model. Keep public registration and family/minor use disabled until the privacy release gates are resolved and verified.
