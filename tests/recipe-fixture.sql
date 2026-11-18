create role anon;
create role authenticated;
create schema auth;
create schema membres;
create table auth.users (id uuid primary key, email text not null);
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema membres,auth to anon,authenticated;
create table membres.members (user_id uuid primary key references auth.users, label text);
create table membres.app_state (id integer primary key, data jsonb);
alter table membres.members enable row level security;
alter table membres.app_state enable row level security;
grant select on membres.members to authenticated;
grant select,insert,update on membres.app_state to authenticated;
create policy members_self_select on membres.members for select to authenticated using (user_id=auth.uid());
create policy ledger_member on membres.app_state for all to authenticated
  using (exists(select 1 from membres.members where user_id=auth.uid()));
create view membres.public_catalog as select data from membres.app_state where id=1;
grant select on membres.public_catalog to authenticated,anon;
insert into auth.users values
  ('00000000-0000-0000-0000-000000000001','equipe@lumabonga.app'),
  ('00000000-0000-0000-0000-000000000002','staff@lumabonga.app'),
  ('00000000-0000-0000-0000-000000000003','public@lumabonga.app');
insert into membres.members select id,email from auth.users where email <> 'public@lumabonga.app';
insert into membres.app_state values (1,'{}');
