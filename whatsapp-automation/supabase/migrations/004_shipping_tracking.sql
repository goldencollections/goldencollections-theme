alter table public.checkout_automations
  add column if not exists shopify_order_id text,
  add column if not exists order_name text,
  add column if not exists shipment_tracking_number text,
  add column if not exists shipment_carrier text,
  add column if not exists shipment_tracking_url text,
  add column if not exists shipment_status text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

create index if not exists checkout_automations_order_id_idx
  on public.checkout_automations (shopify_order_id);

create index if not exists checkout_automations_tracking_idx
  on public.checkout_automations (shipment_tracking_number);

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text,
  shopify_fulfillment_id text,
  tracking_number text not null unique,
  carrier text not null default 'unknown',
  tracking_url text,
  shopify_tracking_url text,
  status text not null default 'fulfilled',
  status_updated_at timestamptz not null default now(),
  delivered_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipment_events_order_idx
  on public.shipment_events (shopify_order_id);

create index if not exists shipment_events_status_idx
  on public.shipment_events (status, status_updated_at desc);

drop trigger if exists shipment_events_set_updated_at on public.shipment_events;
create trigger shipment_events_set_updated_at
before update on public.shipment_events
for each row
execute function public.set_updated_at();

grant select, insert, update, delete on public.shipment_events to service_role;
