-- Phase 1: Profiles table + auto-creation trigger
-- Full data tables are created in Phase 2

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  player_name  text not null default 'Alina',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, player_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'player_name', 'Alina'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
