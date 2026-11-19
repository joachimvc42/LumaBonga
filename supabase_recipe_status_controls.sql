begin;

alter table membres.recipe_versions
  alter column unit_weight drop not null,
  alter column reference_weight drop not null;

create or replace function membres.guard_recipe_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.status<>'draft' then raise exception 'A new version must start as a draft'; end if;
    return new;
  end if;
  if (new.id,new.family_id,new.version) is distinct from (old.id,old.family_id,old.version) then
    raise exception 'Version identifiers cannot be changed';
  end if;
  if old.status in ('validated','archived') and
      (old.status<>'validated' or new.status not in ('archived','testing','draft') or
       (to_jsonb(new)-'status'-'updated_at') is distinct from (to_jsonb(old)-'status'-'updated_at')) then
    raise exception 'Create a draft to change a validated version';
  end if;
  if new.status<>old.status and (old.status,new.status) not in
      (('draft','testing'),('testing','draft'),('testing','validated'),
       ('validated','archived'),('validated','testing'),('validated','draft')) then
    raise exception 'Invalid recipe status transition';
  end if;
  if new.status in ('testing','validated') and (
      new.unit_weight is null or new.reference_weight is null or
      not new.translations_reviewed or jsonb_array_length(new.ingredients)=0 or jsonb_array_length(new.steps)=0
      or exists (select 1 from jsonb_array_elements(new.ingredients) i where
        coalesce(btrim(i->>'id'),'')='' or coalesce(btrim(i->>'en'),'')=''
        or coalesce(btrim(i->>'unit'),'')='' or
        case when jsonb_typeof(i->'quantity')='number' then (i->>'quantity')::numeric<=0 else true end)
      or exists (select 1 from jsonb_array_elements(new.steps) s where
        coalesce(btrim(s->>'id'),'')='' or coalesce(btrim(s->>'en'),'')=''
        or (coalesce(btrim(s->>'safetyId'),'')='') <> (coalesce(btrim(s->>'safetyEn'),'')=''))
    ) then
    raise exception 'Complete the weights, ingredients and reviewed translations before making this recipe available';
  end if;
  if old.status='testing' and new.status='validated' then
    update membres.recipe_versions set status='archived' where family_id=new.family_id and status='validated';
  end if;
  new.updated_at:=clock_timestamp();
  return new;
end;
$$;

create or replace view membres.recipe_legacy_index with (security_barrier = true) as
with caller as (
  select membres.recipe_access_role() as access_role
), products as (
  select a.data, product->>'id' as product_id, product->>'name' as name,
    case coalesce(product->>'status','ready')
      when 'ready' then 'validated'
      when 'test' then 'testing'
      when 'correction' then 'testing'
      when 'draft' then 'draft'
    end as status
  from membres.app_state a
  cross join lateral jsonb_array_elements(coalesce(a.data->'products','[]')) product
  where a.id=1
)
select product_id || ':base' as source_key, product_id, name, status, false as working_copy
from products cross join caller
where status is not null and data->'recipes' ? product_id
  and (access_role='admin' or (access_role='preparer' and status='validated'))
  and not exists (select 1 from membres.recipe_versions v where v.legacy_source_key=product_id || ':base')
union all
select product_id || ':draft', product_id, name, 'draft', true
from products cross join caller
where access_role='admin' and (data->'recipeDrafts' ? product_id or data->'sopDrafts' ? product_id)
  and not exists (select 1 from membres.recipe_versions v where v.legacy_source_key=product_id || ':draft');


create function membres.create_recipe_for_testing(payload jsonb)
returns membres.recipe_versions
language plpgsql security invoker set search_path='' as $$
declare recipe membres.recipe_versions;
begin
  insert into membres.recipe_versions
    (name, unit_weight, reference_weight, margin, ingredients, steps, translations_reviewed, legacy_source_key)
  values (payload->>'name', (payload->>'unit_weight')::numeric, (payload->>'reference_weight')::numeric,
    (payload->>'margin')::numeric, payload->'ingredients', payload->'steps',
    (payload->>'translations_reviewed')::boolean, payload->>'legacy_source_key')
  returning * into recipe;
  update membres.recipe_versions set status='testing' where id=recipe.id returning * into recipe;
  return recipe;
end;
$$;
revoke all on function membres.create_recipe_for_testing(jsonb) from public, anon;
grant execute on function membres.create_recipe_for_testing(jsonb) to authenticated;

commit;
