create table if not exists public.support_email_messages (
  id uuid primary key default gen_random_uuid(),
  mailbox text not null default 'INBOX',
  provider_message_id text not null unique,
  imap_uid bigint,
  message_id text,
  thread_key text,
  from_email text not null,
  from_name text,
  to_email text,
  subject text,
  received_at timestamptz,
  plain_text text,
  html_text text,
  raw_headers jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  classification text not null default 'general_support',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_email_messages_received_idx
  on public.support_email_messages (received_at desc);

create index if not exists support_email_messages_classification_idx
  on public.support_email_messages (classification, received_at desc);

create table if not exists public.support_email_drafts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.support_email_messages(id) on delete cascade,
  to_email text not null,
  draft_subject text not null,
  draft_body text not null,
  status text not null default 'needs_review',
  classification text not null default 'general_support',
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  smtp_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_email_drafts_status_idx
  on public.support_email_drafts (status, created_at desc);

create table if not exists public.support_email_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.support_email_messages(id) on delete cascade,
  draft_id uuid references public.support_email_drafts(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists support_email_messages_set_updated_at on public.support_email_messages;
create trigger support_email_messages_set_updated_at
before update on public.support_email_messages
for each row
execute function public.set_updated_at();

drop trigger if exists support_email_drafts_set_updated_at on public.support_email_drafts;
create trigger support_email_drafts_set_updated_at
before update on public.support_email_drafts
for each row
execute function public.set_updated_at();

grant select, insert, update, delete on public.support_email_messages to service_role;
grant select, insert, update, delete on public.support_email_drafts to service_role;
grant select, insert, update, delete on public.support_email_events to service_role;
