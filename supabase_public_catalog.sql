-- Public catalog view — run once in the Supabase SQL editor.
--
-- Anonymous visitors (role `anon`) may browse the product catalog: products,
-- their composition and their SOPs. Nothing else. app_state itself stays
-- protected by RLS (members only); this view runs with its owner's rights
-- (security_invoker = off, the default), so it can read app_state while
-- exposing ONLY the whitelisted, price-stripped fields below.
--
--   products  : id, name, emoji, hue                  (no prices, no stock)
--   recipes   : ingredients (id, materialId, qty, unit) — labor stripped
--   sops      : full (they are meant to be public)
--   materials : id, name, unit, hue, kind             (no price history, no stock)

create or replace view public.public_catalog as
select jsonb_build_object(
  'products', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p->>'id', 'name', p->>'name', 'emoji', p->>'emoji', 'hue', p->'hue')), '[]'::jsonb)
    from jsonb_array_elements(coalesce(data->'products', '[]'::jsonb)) p
  ),
  'recipes', (
    select coalesce(jsonb_object_agg(e.k, jsonb_build_object(
      'ingredients', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', i->>'id', 'materialId', i->>'materialId', 'qty', i->'qty', 'unit', i->'unit')), '[]'::jsonb)
        from jsonb_array_elements(coalesce(e.v->'ingredients', '[]'::jsonb)) i
      ),
      'labor', '[]'::jsonb)), '{}'::jsonb)
    from jsonb_each(coalesce(data->'recipes', '{}'::jsonb)) as e(k, v)
  ),
  'sops', coalesce(data->'sops', '{}'::jsonb),
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
