-- ============================================================================
-- LumaBonga — setup Supabase (registre partagé + accès par code partagé)
-- À coller dans : Dashboard du projet → SQL Editor → New query → Run
-- Projet cible : ivooxizmcqkwzplimvtg
--
-- AVANT DE LANCER : remplace 'CHANGE_MOI_LE_CODE' (2 endroits plus bas) par le
-- code/mot de passe partagé que tu donneras à ton équipe. Min 8 caractères.
-- L'email du compte partagé est fixe : equipe@lumabonga.app (caché dans l'app).
-- ============================================================================

create extension if not exists pgcrypto;

-- ── 1. Tables ───────────────────────────────────────────────────────────────
-- app_state : UNE seule ligne (id=1) contenant tout l'état de l'app en JSON.
create table if not exists public.app_state (
  id          int primary key default 1,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  constraint app_state_singleton check (id = 1)
);

-- members : liste blanche des comptes autorisés. Un compte non listé = bloqué,
-- même s'il réussit à créer un compte Supabase.
create table if not exists public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  label   text
);

-- Ligne unique d'état (vide au départ : l'app la remplira avec les seeds).
insert into public.app_state (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ── 2. RLS ──────────────────────────────────────────────────────────────────
alter table public.app_state enable row level security;
alter table public.members   enable row level security;

-- Helper : l'utilisateur courant est-il dans members ?
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.user_id = auth.uid());
$$;

drop policy if exists app_state_member_select on public.app_state;
drop policy if exists app_state_member_write  on public.app_state;
drop policy if exists app_state_member_update on public.app_state;
drop policy if exists members_self_select      on public.members;

-- Seuls les membres lisent/écrivent l'état.
create policy app_state_member_select on public.app_state
  for select using (public.is_member());
create policy app_state_member_update on public.app_state
  for update using (public.is_member()) with check (public.is_member());
create policy app_state_member_write on public.app_state
  for insert with check (public.is_member());

-- Un membre peut lire sa propre ligne members (utile au debug).
create policy members_self_select on public.members
  for select using (user_id = auth.uid());

-- ── 3. Compte partagé (le "code" = son mot de passe) ─────────────────────────
-- Crée l'utilisateur s'il n'existe pas, puis l'ajoute à members.
do $$
declare
  v_uid uuid;
  v_email text := 'equipe@lumabonga.app';
  v_pass  text := 'CHANGE_MOI_LE_CODE';   -- <<< REMPLACE par ton code partagé
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

  insert into public.members (user_id, label)
  values (v_uid, 'Compte partagé LumaBonga')
  on conflict (user_id) do nothing;
end $$;

-- ── 4. Realtime (synchro entre appareils) ────────────────────────────────────
alter publication supabase_realtime add table public.app_state;

-- ── 5. Vérif ────────────────────────────────────────────────────────────────
-- select id, jsonb_typeof(data), updated_at from public.app_state;
-- select user_id, label from public.members;
