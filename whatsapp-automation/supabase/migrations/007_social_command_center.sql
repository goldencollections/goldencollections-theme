create table if not exists public.social_platform_connections (
  platform text primary key,
  display_name text not null,
  connection_status text not null default 'needs_auth',
  publishing_status text not null default 'dry_run_only',
  can_publish_now boolean not null default false,
  issue_owner text not null default 'owner',
  blocker text,
  next_action text,
  last_checked_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_post_packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null default 'manual',
  source_ref text,
  source_url text,
  destination_url text,
  status text not null default 'idea',
  priority_score numeric(5,2) not null default 0,
  why_now text,
  approval_notes text,
  created_by text not null default 'hermes',
  approved_by text,
  approved_at timestamptz,
  held_reason text,
  publish_after timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_post_packages_status_idx
  on public.social_post_packages (status, priority_score desc, created_at desc);

create table if not exists public.social_post_variants (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.social_post_packages(id) on delete cascade,
  platform text not null,
  status text not null default 'draft_ready',
  caption text not null default '',
  hashtags text[] not null default '{}'::text[],
  destination_url text,
  asset_url text,
  asset_type text,
  manual_pack text,
  publish_result_url text,
  last_error text,
  owner_approved_at timestamptz,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_post_variants_package_idx
  on public.social_post_variants (package_id, platform);

create unique index if not exists social_post_variants_package_platform_unique
  on public.social_post_variants (package_id, platform);

create index if not exists social_post_variants_status_idx
  on public.social_post_variants (status, platform, created_at desc);

create table if not exists public.social_post_events (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.social_post_packages(id) on delete cascade,
  variant_id uuid references public.social_post_variants(id) on delete set null,
  event_type text not null,
  actor text not null default 'system',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists social_post_events_package_idx
  on public.social_post_events (package_id, created_at desc);

drop trigger if exists social_platform_connections_set_updated_at on public.social_platform_connections;
create trigger social_platform_connections_set_updated_at
before update on public.social_platform_connections
for each row
execute function public.set_updated_at();

drop trigger if exists social_post_packages_set_updated_at on public.social_post_packages;
create trigger social_post_packages_set_updated_at
before update on public.social_post_packages
for each row
execute function public.set_updated_at();

drop trigger if exists social_post_variants_set_updated_at on public.social_post_variants;
create trigger social_post_variants_set_updated_at
before update on public.social_post_variants
for each row
execute function public.set_updated_at();

grant select, insert, update, delete on public.social_platform_connections to service_role;
grant select, insert, update, delete on public.social_post_packages to service_role;
grant select, insert, update, delete on public.social_post_variants to service_role;
grant select, insert, update, delete on public.social_post_events to service_role;
