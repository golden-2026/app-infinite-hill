-- Pilot decision 2026-09-25 (no accounts): web reminders are keyed by a device id + a device secret
-- only that browser holds (stored hashed). No client can read or write this table; the reminders
-- Edge Function (service role) is the only path. Holds no names, emails or belief data beyond timing.
create table public.push_devices (
  device_id text primary key check (device_id ~ '^dev_[a-f0-9]{32}$'),
  secret_hash bytea not null check (octet_length(secret_hash) = 32),
  endpoint text not null unique check (char_length(endpoint) <= 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth_key text not null check (char_length(auth_key) <= 100),
  tz text not null check (char_length(tz) <= 64),
  reminder_time text not null check (reminder_time ~ '^(sundown|([01]?[0-9]|2[0-3]):[0-5][0-9])$'),
  last_sat_date date,
  last_sent_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger push_devices_updated_at before update on public.push_devices
for each row execute function public.set_updated_at();
alter table public.push_devices enable row level security; -- no policies: service role only
revoke all on public.push_devices from anon, authenticated;
grant all on public.push_devices to service_role;
