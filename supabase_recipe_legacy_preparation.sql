create view membres.recipe_legacy_preparation with (security_barrier = true) as
select l.source_key, l.name, l.status, true as per_unit, 2 as margin,
  coalesce((
    select jsonb_agg(jsonb_build_object('en', m.value->>'name', 'quantity', i.value->'qty', 'unit', m.value->>'unit')
      order by i.ordinality)
    from jsonb_array_elements(coalesce(a.data->'recipes'->l.product_id->'ingredients','[]')) with ordinality i
    left join lateral (
      select value from jsonb_array_elements(coalesce(a.data->'materials','[]'))
      where value->>'id'=i.value->>'materialId' limit 1
    ) m on true
  ),'[]') as ingredients,
  coalesce((
    select jsonb_agg(jsonb_build_object('en', s.value->>'text', 'id', s.value->>'textId',
      'safetyEn', s.value->>'safetyEn', 'safetyId', s.value->>'safetyId') order by s.ordinality)
    from jsonb_array_elements(coalesce(a.data->'sops'->l.product_id->'steps','[]')) with ordinality s
  ),'[]') as steps
from membres.recipe_legacy_index l
join membres.app_state a on a.id=1
where l.status='validated' and (select membres.recipe_access_role())='preparer';

revoke all on membres.recipe_legacy_preparation from public, anon, authenticated;
grant select on membres.recipe_legacy_preparation to authenticated;
