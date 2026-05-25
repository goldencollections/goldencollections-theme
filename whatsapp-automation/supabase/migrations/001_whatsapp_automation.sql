create extension if not exists pgcrypto;

create table if not exists public.whatsapp_opt_outs (
  phone text primary key,
  opted_out_at timestamptz not null default now(),
  source text,
  raw_text text
);

create table if not exists public.checkout_automations (
  id uuid primary key default gen_random_uuid(),
  shopify_checkout_id text unique,
  checkout_token text,
  phone text not null,
  email text,
  customer_name text,
  checkout_url text,
  cart jsonb not null default '{}'::jsonb,
  cart_classification text not null default 'general',
  template_name text not null,
  status text not null default 'pending',
  abandon_detected_at timestamptz not null default now(),
  due_at timestamptz not null,
  sent_at timestamptz,
  ordered_at timestamptz,
  replied_at timestamptz,
  opt_out_at timestamptz,
  cancelled_at timestamptz,
  message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checkout_automations_due_idx
  on public.checkout_automations (status, due_at);

create index if not exists checkout_automations_phone_idx
  on public.checkout_automations (phone);

create index if not exists checkout_automations_token_idx
  on public.checkout_automations (checkout_token);

create table if not exists public.whatsapp_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  phone text,
  wa_message_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_events_phone_idx
  on public.whatsapp_events (phone, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists checkout_automations_set_updated_at on public.checkout_automations;
create trigger checkout_automations_set_updated_at
before update on public.checkout_automations
for each row
execute function public.set_updated_at();
