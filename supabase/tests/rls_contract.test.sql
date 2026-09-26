begin;
select plan(7);

-- Isolated fixture identities; these rows are created by the local test runner,
-- never shipped as seed data.
insert into auth.users (id, aud, role, email) values
  ('10000000-0000-4000-8000-000000000001','authenticated','authenticated','golden-a@example.test'),
  ('10000000-0000-4000-8000-000000000002','authenticated','authenticated','golden-b@example.test');
insert into public.profiles (user_id, home_door, visiting_door) values
  ('10000000-0000-4000-8000-000000000001','HINDUISM','BUDDHISM'),
  ('10000000-0000-4000-8000-000000000002','CHRISTIANITY',null);
insert into public.door_progress (user_id, door, current_lesson, highest_completed_lesson) values
  ('10000000-0000-4000-8000-000000000001','HINDUISM',4,3),
  ('10000000-0000-4000-8000-000000000002','CHRISTIANITY',2,1);
insert into public.community_tables (id, created_by, name) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','A private Table');
insert into public.content_revisions (door, lesson_key, revision, status, created_by)
values ('HINDUISM','HIN-Y1-C1-D001',1,'draft','test-fixture');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);

select is((select count(*)::integer from public.profiles), 1, 'a user can read only their own profile and Door choices');
select is((select count(*)::integer from public.door_progress), 1, 'a user can read only their own religious progress');
select is((select count(*)::integer from public.community_tables), 1, 'a Table is visible to its owner member');
select throws_ok(
  $$insert into public.profiles(user_id, home_door) values ('10000000-0000-4000-8000-000000000002','ISLAM')$$,
  '42501', null, 'a user cannot write another profile or Door selection'
);
select throws_ok(
  $$select * from public.content_revisions$$,
  '42501', null, 'unpublished lesson content is not directly queryable by an app user'
);
select throws_ok(
  $$select * from public.table_invites$$,
  '42501', null, 'invite token hashes are not directly queryable by an app user'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.profiles$$,
  '42501', null, 'anonymous/public requests cannot query profile Door selections'
);

reset role;
select * from finish();
rollback;
