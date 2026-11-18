begin;
alter table membres.members add column recipe_role text check (recipe_role in ('admin','preparer','public'));
update membres.members m set recipe_role = case u.email when 'equipe@lumabonga.app' then 'admin' when 'staff@lumabonga.app' then 'preparer' end
from auth.users u where u.id=m.user_id;
insert into membres.members(user_id,label,recipe_role)
select id,'Public catalog','public' from auth.users where email='public@lumabonga.app'
on conflict (user_id) do update set recipe_role=excluded.recipe_role;

create function membres.recipe_access_role() returns text language sql stable security invoker set search_path=''
as $$ select recipe_role from membres.members where user_id=(select auth.uid()) $$;
revoke all on function membres.recipe_access_role() from public,anon;
grant execute on function membres.recipe_access_role() to authenticated;
create policy ledger_admin_only on membres.app_state as restrictive for all to authenticated
using ((select membres.recipe_access_role())='admin') with check ((select membres.recipe_access_role())='admin');
revoke insert,update,delete,truncate,references,trigger on membres.members from authenticated;
revoke all on membres.members,membres.app_state,membres.public_catalog from anon;

do $$
declare definition text := pg_get_viewdef('membres.public_catalog'::regclass,false);
begin
  execute 'create or replace view membres.public_catalog as select catalog.data from ('
    || rtrim(rtrim(definition), ';') || ') catalog where (select membres.recipe_access_role()) in (''admin'',''public'')';
end;
$$;

create table membres.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default gen_random_uuid(),
  version integer not null default 1 check (version>0),
  status text not null default 'draft' check (status in ('draft','testing','validated','archived')),
  name text not null check (btrim(name)<>''),
  unit_weight numeric not null check (unit_weight>0 and unit_weight<1000000),
  reference_weight numeric not null check (reference_weight>0 and reference_weight<1000000),
  margin numeric not null default 2 check (margin between 0 and 100),
  ingredients jsonb not null default '[]' check (jsonb_typeof(ingredients)='array'),
  steps jsonb not null default '[]' check (jsonb_typeof(steps)='array'),
  translations_reviewed boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  unique (family_id,version)
);
create unique index recipe_one_pending on membres.recipe_versions(family_id) where status in ('draft','testing');
create unique index recipe_one_validated on membres.recipe_versions(family_id) where status='validated';
create table membres.recipe_observations (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references membres.recipe_versions(id) on delete cascade,
  note text not null check (btrim(note)<>''),
  created_at timestamptz not null default now()
);
create index recipe_observations_recipe_id on membres.recipe_observations(recipe_id);
alter table membres.recipe_versions enable row level security;
alter table membres.recipe_observations enable row level security;
revoke all on membres.recipe_versions,membres.recipe_observations from public,anon,authenticated;
grant select,insert,update,delete on membres.recipe_versions,membres.recipe_observations to authenticated;
create policy recipe_admin on membres.recipe_versions for all to authenticated
using ((select membres.recipe_access_role())='admin') with check ((select membres.recipe_access_role())='admin');
create policy recipe_preparer_read on membres.recipe_versions for select to authenticated
using ((select membres.recipe_access_role())='preparer' and status in ('testing','validated'));
create policy recipe_observations_admin on membres.recipe_observations for all to authenticated
using ((select membres.recipe_access_role())='admin') with check ((select membres.recipe_access_role())='admin');

create function membres.guard_recipe_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.status<>'draft' then raise exception 'A new version must start as a draft'; end if;
    return new;
  end if;
  if (new.id,new.family_id,new.version) is distinct from (old.id,old.family_id,old.version) then
    raise exception 'Version identifiers cannot be changed';
  end if;
  if old.status in ('validated','archived') and
      (old.status<>'validated' or new.status<>'archived' or
       (to_jsonb(new)-'status'-'updated_at') is distinct from (to_jsonb(old)-'status'-'updated_at')) then
    raise exception 'Create a draft to change a validated version';
  end if;
  if new.status<>old.status and (old.status,new.status) not in
      (('draft','testing'),('testing','validated'),('validated','archived')) then
    raise exception 'Invalid recipe status transition';
  end if;
  if new.status in ('testing','validated') and (
      not new.translations_reviewed or jsonb_array_length(new.ingredients)=0 or jsonb_array_length(new.steps)=0
      or exists (select 1 from jsonb_array_elements(new.ingredients) i where
        coalesce(btrim(i->>'id'),'')='' or coalesce(btrim(i->>'en'),'')=''
        or coalesce(btrim(i->>'unit'),'')='' or
        case when jsonb_typeof(i->'quantity')='number' then (i->>'quantity')::numeric<=0 else true end)
      or exists (select 1 from jsonb_array_elements(new.steps) s where
        coalesce(btrim(s->>'id'),'')='' or coalesce(btrim(s->>'en'),'')=''
        or (coalesce(btrim(s->>'safetyId'),'')='') <> (coalesce(btrim(s->>'safetyEn'),'')=''))
    ) then
    raise exception 'Complete and review both translations before making this recipe available';
  end if;
  if old.status='testing' and new.status='validated' then
    update membres.recipe_versions set status='archived' where family_id=new.family_id and status='validated';
  end if;
  new.updated_at:=clock_timestamp();
  return new;
end;
$$;
create trigger recipe_version_guard before insert or update on membres.recipe_versions
for each row execute function membres.guard_recipe_version();
commit;
