-- Web push reminders: secrets live only in Supabase Vault; the reminders Edge Function reads/creates
-- them with the service role. pg_cron calls the function every 15 minutes with a vault-held secret.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.ih_get_secret(p_name text)
returns text language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_name limit 1;
$$;
create or replace function public.ih_set_secret(p_name text, p_value text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from vault.secrets where name = p_name) then return; end if; -- never overwrite
  perform vault.create_secret(p_value, p_name);
end;
$$;
revoke all on function public.ih_get_secret(text), public.ih_set_secret(text, text) from public, anon, authenticated;
grant execute on function public.ih_get_secret(text), public.ih_set_secret(text, text) to service_role;

-- the cron → function shared secret, generated in the database
select public.ih_set_secret('ih_cron_secret', encode(extensions.gen_random_bytes(32), 'hex'));

select cron.schedule('ih-reminders', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://udhwdfjpoifccndfafoz.supabase.co/functions/v1/reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', public.ih_get_secret('ih_cron_secret')),
    body := '{}'::jsonb
  );
$$);
