-- ============================================================================
-- LumaBonga — Niveau 1 "public" (catalogue lecture seule : Produits + SOP)
-- À coller dans SQL Editor du projet ivooxizmcqkwzplimvtg → Run
-- Compte : public@lumabonga.app  ·  mot de passe (code) : Bonga
--
-- Contrairement à staff/admin, ce compte n'est PAS ajouté à public.members :
-- il reste authentifié (auth.uid() existe) mais bloqué par la RLS sur
-- app_state (policy is_member()). Il ne peut lire QUE la vue
-- public.public_catalog (déjà grantée à `authenticated` — voir
-- supabase_public_catalog.sql), qui expose un sous-ensemble filtré et
-- dépourvu de prix/stock/finances.
-- ============================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_uid uuid;
  v_email text := 'public@lumabonga.app';
  v_pass  text := 'Bonga';
begin
  select id into v_uid from auth.users where email = v_email;

  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, crypt(v_pass, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email),
      'email', v_uid::text, now(), now(), now()
    );
  else
    -- Account already exists (e.g. re-run after a password change) — sync the password.
    update auth.users set encrypted_password = crypt(v_pass, gen_salt('bf')), updated_at = now()
    where id = v_uid;
  end if;

  -- Deliberately NOT inserted into public.members — see header note.
end $$;

-- Vérif : select email from auth.users where email = 'public@lumabonga.app';
--         select user_id from public.members where user_id =
--           (select id from auth.users where email = 'public@lumabonga.app');  -- doit être vide
