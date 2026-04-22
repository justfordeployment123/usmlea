-- Billing/entitlement foundation matching current frontend plan model

create table if not exists public.billing_settings (
  id smallint primary key default 1,
  demo_duration_days int not null default 7 check (demo_duration_days between 1 and 30),
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.billing_settings (id, demo_duration_days)
values (1, 7)
on conflict (id) do nothing;

create table if not exists public.plan_catalog (
  plan text primary key check (plan in ('demo', 'basic', 'standard', 'premium')),
  display_name text not null,
  monthly_price_cents int not null,
  currency text not null default 'USD',
  is_most_popular boolean not null default false,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.plan_catalog (plan, display_name, monthly_price_cents, is_most_popular)
values
  ('demo', 'Demo Trial', 0, false),
  ('basic', 'Basic', 1500, false),
  ('standard', 'Standard', 3000, true),
  ('premium', 'Premium', 6000, false)
on conflict (plan) do nothing;

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('demo', 'basic', 'standard', 'premium')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_user_active_subscription
on public.user_subscriptions(user_id)
where status in ('trialing', 'active', 'past_due');

create table if not exists public.trial_usage_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mock_exams_used int not null default 0,
  updated_at timestamptz not null default now()
);
