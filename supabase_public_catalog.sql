-- Public catalog view — run once in the Supabase SQL editor.
--
-- Anonymous visitors (role `anon`) may browse the product catalog: products,
-- their composition and their SOPs — but ONLY for products marked "Ready"
-- (status is admin/staff-only, set from the product card). A product with no
-- status yet (legacy data, before this field existed) counts as Ready too;
-- newly-created products default to "test" and need an explicit promotion.
-- app_state itself stays protected by RLS (members only); this view runs
-- with its owner's rights (security_invoker = off, the default), so it can
-- read app_state while exposing ONLY the whitelisted, price-stripped,
-- status-filtered fields below.
--
--   products  : id, name, emoji, hue                  (no prices, no stock, ready only)
--   recipes   : ingredients (id, materialId, qty, unit) — labor stripped, ready products only
--   sops      : ready products only
--   materials : id, name, unit, hue, kind             (no price history, no stock)

create or replace view public.public_catalog as
with ready_products as (
  select p
  from public.app_state, jsonb_array_elements(coalesce(data->'products', '[]'::jsonb)) p
  where id = 1 and coalesce(p->>'status', 'ready') = 'ready'
),
ready_ids as (
  select array_agg(p->>'id') as ids from ready_products
)
select jsonb_build_object(
  'products', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p->>'id', 'name', p->>'name', 'emoji', p->>'emoji', 'hue', p->'hue')), '[]'::jsonb)
    from ready_products
  ),
  'recipes', (
    select coalesce(jsonb_object_agg(e.k, jsonb_build_object(
      'ingredients', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', i->>'id', 'materialId', i->>'materialId', 'qty', i->'qty', 'unit', i->'unit')), '[]'::jsonb)
        from jsonb_array_elements(coalesce(e.v->'ingredients', '[]'::jsonb)) i
      ),
      'labor', '[]'::jsonb)), '{}'::jsonb)
    from jsonb_each(coalesce(data->'recipes', '{}'::jsonb)) as e(k, v), ready_ids
    where id = 1 and e.k = any(ready_ids.ids)
  ),
  'sops', (
    select coalesce(jsonb_object_agg(e.k, e.v), '{}'::jsonb)
    from jsonb_each(coalesce(data->'sops', '{}'::jsonb)) as e(k, v), ready_ids
    where id = 1 and e.k = any(ready_ids.ids)
  ),
  'materials', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', m->>'id', 'name', m->>'name', 'unit', m->>'unit', 'hue', m->'hue', 'kind', m->>'kind')), '[]'::jsonb)
    from jsonb_array_elements(coalesce(data->'materials', '[]'::jsonb)) m
  )
) as data
from public.app_state
where id = 1;

-- Let anonymous visitors (and logged-in users) read the catalog.
grant select on public.public_catalog to anon, authenticated;
