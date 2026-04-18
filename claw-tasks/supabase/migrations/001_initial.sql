-- API keys for agent polling auth
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  key text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now()
);
alter table api_keys enable row level security;
create policy "Users own their api key" on api_keys
  for all using (auth.uid() = user_id);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'queued'
    check (status in ('queued', 'in_progress', 'done')),
  output text,
  position integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "Users own their tasks" on tasks
  for all using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger tasks_updated_at before update on tasks
  for each row execute procedure update_updated_at();

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free'
    check (plan in ('free', 'solo', 'team')),
  updated_at timestamptz default now()
);
alter table subscriptions enable row level security;
create policy "Users read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Auto-create subscription + api key on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into subscriptions (user_id) values (new.id);
  insert into api_keys (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
