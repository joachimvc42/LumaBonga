begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$
declare
  recipe uuid := gen_random_uuid();
  second uuid := gen_random_uuid();
  family uuid := gen_random_uuid();
  ingredients jsonb := '[{"id":"Bahan","en":"Ingredient","unit":"g","quantity":45}]';
  steps jsonb := '[{"id":"Langkah","en":"Step","safetyId":"Aman","safetyEn":"Safety"}]';
begin
  assert membres.recipe_access_role()='admin';
  assert (select count(*) from membres.app_state)=1;
  insert into membres.recipe_versions(id,family_id,name,unit_weight,reference_weight,ingredients,steps)
    values (recipe,family,'Test',45,45,ingredients,steps);
  begin
    update membres.recipe_versions set status='validated' where id=recipe;
    raise exception 'Draft was validated directly';
  exception when raise_exception then
    if sqlerrm <> 'Invalid recipe status transition' then raise; end if;
  end;
  begin
    update membres.recipe_versions set status='testing' where id=recipe;
    raise exception 'Unreviewed draft was published';
  exception when raise_exception then
    if sqlerrm not like 'Complete and review%' then raise; end if;
  end;
  update membres.recipe_versions set status='testing', translations_reviewed=true where id=recipe;
  insert into membres.recipe_observations(recipe_id,note) values (recipe,'Private');
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
  assert membres.recipe_access_role()='preparer';
  assert (select count(*) from membres.app_state)=0;
  assert (select count(*) from membres.public_catalog)=0;
  assert (select count(*) from membres.recipe_observations)=0;
  assert (select count(*) from membres.recipe_versions)=1;
  update membres.recipe_versions set name='Forbidden' where id=recipe;
  assert not found;
  delete from membres.recipe_versions where id=recipe;
  assert not found;
  begin
    insert into membres.recipe_versions(name,unit_weight,reference_weight) values ('Forbidden',1,1);
    raise exception 'Preparer wrote a recipe';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
  update membres.recipe_versions set status='validated' where id=recipe;
  begin
    update membres.recipe_versions set unit_weight=46 where id=recipe;
    raise exception 'Published recipe was edited';
  exception when raise_exception then
    if sqlerrm <> 'Create a draft to change a validated version' then raise; end if;
  end;
  insert into membres.recipe_versions(id,family_id,version,name,unit_weight,reference_weight,ingredients,steps)
    values (second,family,2,'Test',45,45,ingredients,steps);
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
  assert (select count(*) from membres.recipe_versions where id=second)=0;
  assert (select status from membres.recipe_versions where id=recipe)='validated';
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
  update membres.recipe_versions set status='testing',translations_reviewed=true where id=second;
  update membres.recipe_versions set status='validated' where id=second;
  assert (select status from membres.recipe_versions where id=recipe)='archived';
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
  assert (select count(*) from membres.recipe_versions where id=recipe)=0;
  assert (select status from membres.recipe_versions where id=second)='validated';
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
  assert (select count(*) from membres.recipe_versions)=0;
  assert (select count(*) from membres.public_catalog)=1;
end;
$$;
rollback;
