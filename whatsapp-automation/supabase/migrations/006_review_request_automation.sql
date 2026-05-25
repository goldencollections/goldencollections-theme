create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null unique,
  order_name text,
  phone text not null,
  customer_name text,
  review_url text not null,
  template_name text not null default 'gc_post_purchase_review_neutral_v1',
  status text not null default 'awaiting_delivery',
  delivered_at timestamptz,
  due_at timestamptz,
  sent_at timestamptz,
  opt_out_at timestamptz,
  cancelled_at timestamptz,
  message_id text,
  last_error text,
  source text not null default 'shopify',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_requests_due_idx
  on public.review_requests (status, due_at);

create index if not exists review_requests_phone_idx
  on public.review_requests (phone);

drop trigger if exists review_requests_set_updated_at on public.review_requests;
create trigger review_requests_set_updated_at
before update on public.review_requests
for each row
execute function public.set_updated_at();

grant select, insert, update, delete on public.review_requests to service_role;
