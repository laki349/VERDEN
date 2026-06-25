create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_name text not null,
  scene text,
  step_index integer,
  path text,
  referrer text,
  user_agent text,
  device jsonb default '{}'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_session_id_idx on events(session_id);
create index if not exists events_event_name_idx on events(event_name);
create index if not exists events_created_at_idx on events(created_at desc);

alter table events enable row level security;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  submission_id text not null unique,
  session_id text not null,
  status text not null default 'intent_submitted',
  source text not null default 'verden-funnel',

  address jsonb not null,
  smoothie_purpose jsonb not null,
  nutrition_profile jsonb default '{}'::jsonb,
  nutrition_result jsonb default '{}'::jsonb,
  checkout jsonb not null,
  payment jsonb default '{}'::jsonb,

  product_name text,
  product_price integer,
  add_ons jsonb default '[]'::jsonb,
  subtotal integer,
  delivery_fee integer,
  total integer,

  delivery_time text,
  contact_phone text,
  safe_number boolean default true,
  payment_method text,

  user_agent text,
  referrer text,
  path text,
  ip_address text,

  created_at timestamptz not null default now()
);

create index if not exists orders_session_id_idx on orders(session_id);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_total_idx on orders(total);

alter table orders enable row level security;
