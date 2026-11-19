begin;

-- Reclassify existing tests once. Later explicit submissions still enter testing.
update membres.recipe_versions set status='draft' where status='testing';

create or replace view membres.recipe_legacy_index with (security_barrier = true) as
with caller as (
  select membres.recipe_access_role() as access_role
), products as (
  select a.data, product->>'id' as product_id, product->>'name' as name,
    case coalesce(product->>'status','ready')
      when 'ready' then 'validated'
      when 'test' then 'draft'
      when 'correction' then 'draft'
      when 'draft' then 'draft'
    end as status
  from membres.app_state a
  cross join lateral jsonb_array_elements(coalesce(a.data->'products','[]')) product
  where a.id=1
)
select product_id || ':base' as source_key, product_id, name, status, false as working_copy
from products cross join caller
where status is not null and data->'recipes' ? product_id
  and (status<>'draft' or not (coalesce(data->'recipeDrafts','{}') ? product_id
    or coalesce(data->'sopDrafts','{}') ? product_id))
  and (access_role='admin' or (access_role='preparer' and status='validated'))
  and not exists (select 1 from membres.recipe_versions v where v.legacy_source_key=product_id || ':base')
union all
select product_id || ':draft', product_id, name, 'draft', true
from products cross join caller
where access_role='admin' and (data->'recipeDrafts' ? product_id or data->'sopDrafts' ? product_id)
  and not exists (select 1 from membres.recipe_versions v where v.legacy_source_key=product_id || ':draft');

commit;
