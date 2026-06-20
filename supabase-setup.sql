-- Run this in your Supabase SQL editor to set up the post vault table

create table if not exists post_vault (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  url text,
  category text,
  topic text,
  author text,
  has_image boolean default false,
  created_at timestamptz default now()
);

-- Run this to migrate existing databases:
-- alter table post_vault add column if not exists author text;

-- Optional: enable Row Level Security (RLS) if you add auth later
-- alter table post_vault enable row level security;

-- Run this to set up the content planner table
create table if not exists planner_state (
  id uuid primary key default gen_random_uuid(),
  focus_context text not null,
  schedule jsonb not null,
  updated_at timestamptz default now()
);
