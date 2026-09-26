-- Golden private-beta data contract for Supabase/Postgres.
-- User choice and practice data is sensitive belief data: no public/anon read path.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Profiles deliberately store the selected Doors only in an owner-private row.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  home_door text check (home_door is null or home_door in ('CHRISTIANITY','CATHOLIC','HINDUISM','ISLAM','JUDAISM','BUDDHISM','SIKHISM','SPIRITUAL')),
  visiting_door text check (visiting_door is null or visiting_door in ('CHRISTIANITY','CATHOLIC','HINDUISM','ISLAM','JUDAISM','BUDDHISM','SIKHISM','SPIRITUAL')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_door is null or visiting_door is null or home_door <> visiting_door)
);
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create table public.door_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  door text not null check (door in ('CHRISTIANITY','CATHOLIC','HINDUISM','ISLAM','JUDAISM','BUDDHISM','SIKHISM','SPIRITUAL')),
  current_lesson integer not null default 1 check (current_lesson > 0),
  highest_completed_lesson integer not null default 0 check (highest_completed_lesson >= 0),
  camp integer not null default 1 check (camp between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, door),
  check (current_lesson >= highest_completed_lesson)
);
create trigger door_progress_updated_at before update on public.door_progress
for each row execute function public.set_updated_at();

-- Multiple lesson completions can occur on one day and across Doors. Daily
-- showed-up streaks should count distinct practice_date values per user.
create table public.practice_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  door text not null check (door in ('CHRISTIANITY','CATHOLIC','HINDUISM','ISLAM','JUDAISM','BUDDHISM','SIKHISM','SPIRITUAL')),
  lesson integer not null check (lesson > 0),
  practice_date date not null,
  completed_at timestamptz not null default now(),
  earned_word text check (earned_word is null or char_length(earned_word) <= 120),
  carry_line text check (carry_line is null or char_length(carry_line) <= 500),
  created_at timestamptz not null default now(),
  unique (user_id, door, lesson, practice_date)
);
create index practice_completions_user_date_idx on public.practice_completions(user_id, practice_date desc);

create table public.community_tables (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger community_tables_updated_at before update on public.community_tables
for each row execute function public.set_updated_at();

create table public.table_members (
  table_id uuid not null references public.community_tables(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (table_id, user_id)
);
create index table_members_user_idx on public.table_members(user_id, table_id);

-- Serialize membership changes per Table so the six-seat product limit cannot
-- be bypassed by concurrent invite acceptances.
create or replace function public.enforce_table_member_limit()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  perform 1 from public.community_tables where id = new.table_id for update;
  if (select count(*) from public.table_members where table_id = new.table_id) >= 6 then
    raise exception using errcode = '23514', message = 'a Golden Table has at most six members';
  end if;
  return new;
end;
$$;
create trigger table_members_limit before insert on public.table_members
for each row execute function public.enforce_table_member_limit();

create table public.table_invites (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.community_tables(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check ((accepted_by is null) = (accepted_at is null))
);
create index table_invites_table_idx on public.table_invites(table_id, created_at desc);

create table public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.community_tables(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  object_key text not null unique,
  content_type text not null check (content_type in ('audio/webm','audio/mp4','audio/mpeg')),
  duration_seconds integer not null check (duration_seconds between 1 and 900),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  deleted_at timestamptz,
  check (object_key = sender_id::text || '/' || id::text)
);
create index voice_notes_table_created_idx on public.voice_notes(table_id, created_at desc) where deleted_at is null;

-- Content is not client-editable. A reviewed publishing service owns all writes.
create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  door text not null check (door in ('CHRISTIANITY','CATHOLIC','HINDUISM','ISLAM','JUDAISM','BUDDHISM','SIKHISM','SPIRITUAL')),
  lesson_key text not null check (char_length(lesson_key) between 1 and 80),
  revision integer not null check (revision > 0),
  status text not null default 'draft' check (status in ('draft','keeper_review','approved','published','retired')),
  manuscript jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  voice_asset_ref text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (door, lesson_key, revision)
);
create trigger content_revisions_updated_at before update on public.content_revisions
for each row execute function public.set_updated_at();

create table public.content_approvals (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.content_revisions(id) on delete restrict,
  approval_type text not null check (approval_type in ('keeper','voice_rights','practice_revision')),
  decision text not null check (decision in ('approved','rejected','changes_requested')),
  reviewer_ref text not null,
  evidence_ref text not null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check ((decision = 'approved') = (approved_at is not null)),
  unique (revision_id, approval_type, reviewer_ref)
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null check (char_length(product_key) between 1 and 80),
  status text not null check (status in ('active','grace','expired','revoked')),
  source text not null check (source in ('purchase','gift','admin')),
  external_ref text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  unique (source, external_ref)
);
create index entitlements_user_status_idx on public.entitlements(user_id, status, ends_at);
create trigger entitlements_updated_at before update on public.entitlements
for each row execute function public.set_updated_at();

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  purchaser_id uuid not null references auth.users(id) on delete restrict,
  recipient_user_id uuid references auth.users(id) on delete set null,
  product_key text not null check (char_length(product_key) between 1 and 80),
  status text not null check (status in ('pending','claimed','expired','refunded','revoked')),
  claim_token_hash bytea unique,
  external_ref text unique,
  purchased_at timestamptz,
  claimed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'claimed' or claimed_at is not null)
);

-- Store only a digest and processing state, never raw payment webhook bodies.
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (char_length(provider) between 1 and 40),
  event_id text not null check (char_length(event_id) between 1 and 200),
  payload_sha256 bytea not null check (octet_length(payload_sha256) = 32),
  status text not null default 'received' check (status in ('received','processing','processed','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error_code text,
  unique (provider, event_id)
);

-- RLS helper functions avoid recursive table_members policies. Table UUIDs are
-- unguessable; helpers expose only the caller's own membership/admin boolean.
create or replace function public.is_table_member(p_table_id uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.table_members m
    where m.table_id = p_table_id and m.user_id = (select auth.uid())
  );
$$;
create or replace function public.is_table_admin(p_table_id uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.table_members m
    where m.table_id = p_table_id and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  );
$$;

-- Creating a Table atomically creates its sole owner membership.
create or replace function public.add_table_owner()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.table_members(table_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;
create trigger community_tables_add_owner after insert on public.community_tables
for each row execute function public.add_table_owner();

create or replace function public.create_table_invite(p_table_id uuid, p_expires_in interval default interval '7 days')
returns table(invite_id uuid, invite_token text, expires_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_token text;
  v_id uuid := gen_random_uuid();
  v_expiry timestamptz;
begin
  if auth.uid() is null or not public.is_table_admin(p_table_id) then
    raise exception using errcode = '42501', message = 'table administrator required';
  end if;
  if p_expires_in <= interval '0 seconds' or p_expires_in > interval '30 days' then
    raise exception using errcode = '22023', message = 'invite expiry must be between 1 second and 30 days';
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expiry := now() + p_expires_in;
  insert into public.table_invites(id, table_id, created_by, token_hash, expires_at)
  values (v_id, p_table_id, auth.uid(), extensions.digest(v_token, 'sha256'), v_expiry);
  return query select v_id, v_token, v_expiry;
end;
$$;

create or replace function public.accept_table_invite(p_token text)
returns uuid language plpgsql security definer
set search_path = ''
as $$
declare
  v_invite public.table_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_token is null or length(p_token) <> 64 or p_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid invite token';
  end if;
  select * into v_invite from public.table_invites i
  where i.token_hash = extensions.digest(p_token, 'sha256')
  for update;
  if not found or v_invite.revoked_at is not null or v_invite.accepted_at is not null or v_invite.expires_at <= now() then
    raise exception using errcode = '22023', message = 'invite is unavailable';
  end if;
  insert into public.table_members(table_id, user_id, role)
  values (v_invite.table_id, auth.uid(), 'member')
  on conflict (table_id, user_id) do nothing;
  update public.table_invites set accepted_by = auth.uid(), accepted_at = now() where id = v_invite.id;
  return v_invite.table_id;
end;
$$;

create or replace function public.revoke_table_invite(p_invite_id uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  update public.table_invites i set revoked_at = now()
  where i.id = p_invite_id and i.revoked_at is null and i.accepted_at is null
    and public.is_table_admin(i.table_id);
  if not found then
    raise exception using errcode = '42501', message = 'invite unavailable or table administrator required';
  end if;
end;
$$;

create or replace function public.leave_table(p_table_id uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  delete from public.table_members m
  where m.table_id = p_table_id and m.user_id = auth.uid() and m.role <> 'owner';
  if not found then
    raise exception using errcode = '42501', message = 'member unavailable; owner transfer requires support';
  end if;
end;
$$;

-- Enable RLS everywhere, including server-managed ledgers. service_role bypasses
-- RLS by design and is a server-only credential; never expose it to browser code.
alter table public.profiles enable row level security;
alter table public.door_progress enable row level security;
alter table public.practice_completions enable row level security;
alter table public.community_tables enable row level security;
alter table public.table_members enable row level security;
alter table public.table_invites enable row level security;
alter table public.voice_notes enable row level security;
alter table public.content_revisions enable row level security;
alter table public.content_approvals enable row level security;
alter table public.entitlements enable row level security;
alter table public.gifts enable row level security;
alter table public.webhook_events enable row level security;

create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy door_progress_owner_all on public.door_progress for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy practice_completions_read_own on public.practice_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy practice_completions_insert_own on public.practice_completions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy practice_completions_delete_own on public.practice_completions for delete to authenticated using ((select auth.uid()) = user_id);

create policy community_tables_read_members on public.community_tables for select to authenticated using (public.is_table_member(id));
create policy community_tables_create_own on public.community_tables for insert to authenticated with check ((select auth.uid()) = created_by);
create policy community_tables_update_admin on public.community_tables for update to authenticated using (public.is_table_admin(id)) with check (public.is_table_admin(id));
create policy table_members_read_members on public.table_members for select to authenticated using (public.is_table_member(table_id));
-- Invite rows and their hashes are never directly queryable by clients.
create policy voice_notes_read_participants on public.voice_notes for select to authenticated
using (
  deleted_at is null and public.is_table_member(table_id)
  and (recipient_id is null or recipient_id = (select auth.uid()) or sender_id = (select auth.uid()))
);
create policy voice_notes_insert_sender on public.voice_notes for insert to authenticated
with check (
  sender_id = (select auth.uid()) and public.is_table_member(table_id)
  and (recipient_id is null or exists (
    select 1 from public.table_members m where m.table_id = voice_notes.table_id and m.user_id = voice_notes.recipient_id
  ))
  and object_key = (select auth.uid())::text || '/' || id::text
);
-- Deletion/expiry is server-mediated so the object and metadata can be removed together.

create policy entitlements_read_own on public.entitlements for select to authenticated using ((select auth.uid()) = user_id);
create policy gifts_read_buyer_or_recipient on public.gifts for select to authenticated
using ((select auth.uid()) = purchaser_id or (select auth.uid()) = recipient_user_id);
-- content_revisions, content_approvals, table_invites, webhook_events have no
-- client policies. Their trusted server paths use service_role only.

-- An explicit least-privilege grant list complements RLS. Do not grant anon.
revoke all on public.profiles, public.door_progress, public.practice_completions,
  public.community_tables, public.table_members, public.table_invites, public.voice_notes,
  public.content_revisions, public.content_approvals, public.entitlements, public.gifts,
  public.webhook_events from anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant update (display_name, home_door, visiting_door) on public.profiles to authenticated;
grant select, insert, update, delete on public.door_progress to authenticated;
grant select, insert, delete on public.practice_completions to authenticated;
grant select, insert on public.community_tables to authenticated;
grant update (name) on public.community_tables to authenticated;
grant select on public.table_members to authenticated;
grant select, insert on public.voice_notes to authenticated;
grant select (id, user_id, product_key, status, source, starts_at, ends_at, created_at, updated_at) on public.entitlements to authenticated;
grant select (id, purchaser_id, recipient_user_id, product_key, status, purchased_at, claimed_at, expires_at, created_at) on public.gifts to authenticated;
grant all on public.profiles, public.door_progress, public.practice_completions,
  public.community_tables, public.table_members, public.table_invites, public.voice_notes,
  public.content_revisions, public.content_approvals, public.entitlements, public.gifts,
  public.webhook_events to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.is_table_member(uuid) from public, anon;
revoke all on function public.is_table_admin(uuid) from public, anon;
grant execute on function public.is_table_member(uuid), public.is_table_admin(uuid) to authenticated;
revoke all on function public.add_table_owner() from public, anon, authenticated;
revoke all on function public.enforce_table_member_limit() from public, anon, authenticated;
revoke all on function public.create_table_invite(uuid, interval) from public, anon;
revoke all on function public.accept_table_invite(text) from public, anon;
revoke all on function public.revoke_table_invite(uuid) from public, anon;
revoke all on function public.leave_table(uuid) from public, anon;
grant execute on function public.create_table_invite(uuid, interval), public.accept_table_invite(text),
  public.revoke_table_invite(uuid), public.leave_table(uuid) to authenticated;

-- Optional private object bucket. Audio bytes stay out of Postgres; note metadata
-- controls who can reach an object. Bucket/object access is private by default.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('golden-voice-notes', 'golden-voice-notes', false, 20971520, array['audio/webm','audio/mp4','audio/mpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy voice_objects_insert_owned on storage.objects for insert to authenticated
with check (
  bucket_id = 'golden-voice-notes'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.voice_notes n where n.object_key = name and n.sender_id = (select auth.uid()))
);
create policy voice_objects_read_authorized on storage.objects for select to authenticated
using (
  bucket_id = 'golden-voice-notes'
  and exists (select 1 from public.voice_notes n where n.object_key = name)
);
create policy voice_objects_delete_sender on storage.objects for delete to authenticated
using (
  bucket_id = 'golden-voice-notes'
  and exists (select 1 from public.voice_notes n where n.object_key = name and n.sender_id = (select auth.uid()))
);
