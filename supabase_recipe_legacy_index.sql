begin;
alter table membres.recipe_versions add column legacy_source_key text;
create unique index recipe_legacy_version on membres.recipe_versions(legacy_source_key, version)
  where legacy_source_key is not null;

-- Only names and historical statuses cross the preparation boundary. The ledger,
-- formula quantities, procedures and observations remain covered by their own policies.
create view membres.recipe_legacy_index with (security_barrier = true) as
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
union all
select product_id || ':draft', product_id, name, 'draft', true
from products cross join caller
where access_role='admin' and (data->'recipeDrafts' ? product_id or data->'sopDrafts' ? product_id);

revoke all on membres.recipe_legacy_index from public, anon, authenticated;
grant select on membres.recipe_legacy_index to authenticated;
commit;
