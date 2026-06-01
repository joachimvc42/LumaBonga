-- ============================================================================
-- LumaBonga — 2ème accès "staff" (vue restreinte : Sales / Stock / Products)
-- À coller dans SQL Editor du projet ivooxizmcqkwzplimvtg → Run
-- Compte : staff@lumabonga.app  ·  mot de passe (code) : Letsgo!
-- Le code app reconnaît cet email et masque Profit + Achats.
-- ============================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_uid uuid;
  v_email text := 'staff@lumabonga.app';
  v_pass  text := 'Letsgo!';
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
  end if;

  -- même registre partagé que l'admin (RLS members)
  insert into public.members (user_id, label)
  values (v_uid, 'Staff (vue restreinte)')
  on conflict (user_id) do nothing;
end $$;

-- Vérif : select user_id, label from public.members;
