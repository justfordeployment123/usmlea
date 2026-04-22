-- Run in Supabase SQL editor
-- Creates role-aware profile table used by backend auth middleware

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('student', 'admin')),
  medical_school text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    if new.id <> old.id then
      raise exception 'Updating profile id is not allowed';
    end if;

    if new.email <> old.email then
      raise exception 'Updating profile email is not allowed';
    end if;

    if new.role <> old.role then
      raise exception 'Updating profile role is not allowed';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists trg_profiles_guard_immutable_fields on public.profiles;
create trigger trg_profiles_guard_immutable_fields
before update on public.profiles
for each row
execute function public.prevent_profile_privilege_escalation();

alter table public.profiles enable row level security;

-- Students can read/update their own profile
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Admin/service operations should run through backend with service-role key.
-- Keep inserts restricted from client by not creating authenticated insert policy.
