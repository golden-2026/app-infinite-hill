-- infinite hill pilot backend (Supabase project infinite-hill, 2026-09-26).
-- Scope: what the Expo app syncs. The sit log is the source of truth; every number the app shows is
-- derived from it on the device (@ih/domain), so the server stores events, never counts.
-- Belief data is sensitive: owner-only rows, no anon access, delete-my-account removes everything.
-- The broader 9/13 contract (tables, voice notes, gifts) stays in supabase/migrations/ for later.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- One row per finished sit. client_id is the device's id for the sit, so re-sending is a no-op.
create table public.practice_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null check (client_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  door text not null check (door in ('CHRISTIANITY','CATHOLIC','HINDUISM','ISLAM','JUDAISM','BUDDHISM','SIKHISM','SPIRITUAL')),
  lesson integer not null check (lesson between 1 and 2000),
  practice_date date not null,
  tz text check (tz is null or char_length(tz) <= 64),
  kid_id text check (kid_id is null or char_length(kid_id) <= 64),
  device_id text check (device_id is null or char_length(device_id) <= 64),
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index practice_completions_user_date_idx on public.practice_completions(user_id, practice_date desc);

-- The person's choices (goal, doors, reminder time, kids, book...). Highest version wins.
create table public.app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null check (version >= 0),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 65536),
  updated_at timestamptz not null default now()
);
create trigger app_settings_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

-- Web push reminders (Android, desktop, iPhone home-screen installs). iOS app reminders are local.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) <= 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth_key text not null check (char_length(auth_key) <= 100),
  tz text not null check (char_length(tz) <= 64),
  reminder_time text not null check (reminder_time ~ '^(sundown|([01]?[0-9]|2[0-3]):[0-5][0-9])$'),
  last_sent_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);
create trigger push_subscriptions_updated_at before update on public.push_subscriptions
for each row execute function public.set_updated_at();

alter table public.practice_completions enable row level security;
alter table public.app_settings enable row level security;
alter table public.push_subscriptions enable row level security;

create policy sits_read_own on public.practice_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy sits_insert_own on public.practice_completions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy settings_read_own on public.app_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy settings_insert_own on public.app_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy settings_update_own on public.app_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy push_own_all on public.push_subscriptions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.practice_completions, public.app_settings, public.push_subscriptions from anon, authenticated;
grant select, insert on public.practice_completions to authenticated;
grant select, insert, update on public.app_settings to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.practice_completions, public.app_settings, public.push_subscriptions to service_role;

-- Settings: a newer version replaces an older one; an older write is ignored. Returns the stored version.
create or replace function public.save_settings(p_version integer, p_data jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare v integer;
begin
  if auth.uid() is null then raise exception using errcode = '42501', message = 'authentication required'; end if;
  insert into public.app_settings(user_id, version, data) values (auth.uid(), p_version, p_data)
  on conflict (user_id) do update set version = excluded.version, data = excluded.data
    where public.app_settings.version < excluded.version;
  select version into v from public.app_settings where user_id = auth.uid();
  return v;
end;
$$;

-- Delete my account: the auth user and, by cascade, every row above. Irreversible by design.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception using errcode = '42501', message = 'authentication required'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.save_settings(integer, jsonb) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.save_settings(integer, jsonb), public.delete_my_account() to authenticated;
