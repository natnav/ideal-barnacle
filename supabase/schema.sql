-- Run this in the Supabase SQL Editor

create table if not exists boards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  color       text not null default '#4F46E5',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists columns (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references boards(id) on delete cascade,
  title      text not null,
  color      text not null default '#E2E8F0',
  "order"    int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cards (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references columns(id) on delete cascade,
  board_id    uuid not null references boards(id)  on delete cascade,
  title       text not null,
  description text not null default '',
  "order"     int  not null default 0,
  labels      jsonb not null default '[]'::jsonb,
  due_date    date,
  priority    text check (priority in ('low', 'medium', 'high')),
  checklist   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable Row Level Security (open policy — lock down when you add auth)
alter table boards  enable row level security;
alter table columns enable row level security;
alter table cards   enable row level security;

create policy "allow all boards"  on boards  for all using (true) with check (true);
create policy "allow all columns" on columns for all using (true) with check (true);
create policy "allow all cards"   on cards   for all using (true) with check (true);
