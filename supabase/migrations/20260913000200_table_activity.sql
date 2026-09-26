-- Minimal Table activity is an explicit self-reported "showed up" marker.
-- It must not contain a Door, lesson, reflection, question, or voice payload.
create table public.table_activity (
  table_id uuid not null references public.community_tables(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  signal text not null default 'showed-up' check (signal = 'showed-up'),
  created_at timestamptz not null default now(),
  primary key (table_id, member_id, activity_date)
);
create index table_activity_table_date_idx on public.table_activity(table_id, activity_date desc);

alter table public.table_activity enable row level security;
revoke all on public.table_activity from public, anon, authenticated;
grant all on public.table_activity to service_role;

-- These RPCs are callable only by trusted server code using service_role.
-- Every operation still checks the authenticated actor id supplied only after
-- the API verified their Supabase access token with /auth/v1/user.
create or replace function public.create_table_invite_for_user(
  p_table_id uuid,
  p_actor_id uuid,
  p_expires_in_seconds integer default 604800
)
returns table(invite_id uuid, invite_token text, expires_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_token text;
  v_id uuid := gen_random_uuid();
  v_expiry timestamptz;
  v_member_count integer;
  v_invite_count integer;
begin
  if p_actor_id is null then
    raise exception using errcode = '42501', message = 'table administrator required';
  end if;
  perform 1 from public.community_tables t where t.id = p_table_id for update;
  if not found or not exists (
    select 1 from public.table_members m
    where m.table_id = p_table_id and m.user_id = p_actor_id and m.role in ('owner','admin')
  ) then
    raise exception using errcode = '42501', message = 'table administrator required';
  end if;
  if p_expires_in_seconds is null or p_expires_in_seconds < 1 or p_expires_in_seconds > 2592000 then
    raise exception using errcode = '22023', message = 'invite expiry is invalid';
  end if;
  select count(*) into v_member_count from public.table_members m where m.table_id = p_table_id;
  select count(*) into v_invite_count from public.table_invites i
    where i.table_id = p_table_id and i.accepted_at is null and i.revoked_at is null and i.expires_at > now();
  if v_member_count + v_invite_count >= 6 then
    raise exception using errcode = '23514', message = 'table member limit reached';
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expiry := now() + make_interval(secs => p_expires_in_seconds);
  insert into public.table_invites(id, table_id, created_by, token_hash, expires_at)
  values (v_id, p_table_id, p_actor_id, extensions.digest(v_token, 'sha256'), v_expiry);
  return query select v_id, v_token, v_expiry;
end;
$$;

create or replace function public.accept_table_invite_for_user(p_token text, p_actor_id uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_invite public.table_invites%rowtype;
  v_member_count integer;
begin
  if p_actor_id is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_token is null or length(p_token) <> 64 or p_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invite unavailable';
  end if;
  select * into v_invite from public.table_invites i
    where i.token_hash = extensions.digest(p_token, 'sha256') for update;
  if not found or v_invite.revoked_at is not null or v_invite.accepted_at is not null or v_invite.expires_at <= now() then
    raise exception using errcode = '22023', message = 'invite unavailable';
  end if;
  perform 1 from public.community_tables t where t.id = v_invite.table_id for update;
  if exists (select 1 from public.table_members m where m.table_id = v_invite.table_id and m.user_id = p_actor_id) then
    raise exception using errcode = '22023', message = 'invite unavailable';
  end if;
  select count(*) into v_member_count from public.table_members m where m.table_id = v_invite.table_id;
  if v_member_count >= 6 then
    raise exception using errcode = '23514', message = 'table member limit reached';
  end if;
  insert into public.table_members(table_id, user_id, role)
  values (v_invite.table_id, p_actor_id, 'member');
  update public.table_invites set accepted_by = p_actor_id, accepted_at = now() where id = v_invite.id;
  return v_invite.table_id;
end;
$$;

create or replace function public.revoke_table_invite_for_user(p_invite_id uuid, p_actor_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.table_invites i set revoked_at = now()
    where i.id = p_invite_id and i.revoked_at is null and i.accepted_at is null
      and exists (
        select 1 from public.table_members m
        where m.table_id = i.table_id and m.user_id = p_actor_id and m.role in ('owner','admin')
      );
  if not found then
    raise exception using errcode = '42501', message = 'invite unavailable or administrator required';
  end if;
end;
$$;

create or replace function public.leave_table_for_user(p_table_id uuid, p_actor_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform 1 from public.community_tables t where t.id = p_table_id for update;
  delete from public.table_members m
    where m.table_id = p_table_id and m.user_id = p_actor_id and m.role <> 'owner';
  if not found then
    raise exception using errcode = '42501', message = 'member unavailable; owner transfer requires support';
  end if;
end;
$$;

create or replace function public.record_table_showed_up(p_table_id uuid, p_actor_id uuid, p_activity_date date)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  if p_actor_id is null or p_activity_date is null then
    raise exception using errcode = '22023', message = 'activity is invalid';
  end if;
  perform 1 from public.community_tables t where t.id = p_table_id for update;
  if not found or not exists (
    select 1 from public.table_members m where m.table_id = p_table_id and m.user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'table member required';
  end if;
  insert into public.table_activity(table_id, member_id, activity_date, signal)
  values (p_table_id, p_actor_id, p_activity_date, 'showed-up')
  on conflict (table_id, member_id, activity_date) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end;
$$;

revoke all on function public.create_table_invite_for_user(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.accept_table_invite_for_user(text, uuid) from public, anon, authenticated;
revoke all on function public.revoke_table_invite_for_user(uuid, uuid) from public, anon, authenticated;
revoke all on function public.leave_table_for_user(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_table_showed_up(uuid, uuid, date) from public, anon, authenticated;
grant execute on function public.create_table_invite_for_user(uuid, uuid, integer),
  public.accept_table_invite_for_user(text, uuid), public.revoke_table_invite_for_user(uuid, uuid),
  public.leave_table_for_user(uuid, uuid), public.record_table_showed_up(uuid, uuid, date) to service_role;
