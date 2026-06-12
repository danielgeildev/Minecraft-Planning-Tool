-- Phase 3: Social layer for friend codes, requests, and friend profile stats

create or replace function public.generate_friend_code()
returns text
language plpgsql
as $$
declare
  charset constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(charset, 1 + floor(random() * length(charset))::int, 1);
    end loop;

    exit when not exists (
      select 1
      from public.profiles
      where friend_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

alter table public.profiles
  add column if not exists friend_code text,
  add column if not exists avatar_url text;

update public.profiles
set friend_code = public.generate_friend_code()
where friend_code is null;

update public.profiles p
set avatar_url = u.raw_user_meta_data->>'avatar_url'
from auth.users u
where u.id = p.id
  and p.avatar_url is null
  and (u.raw_user_meta_data->>'avatar_url') is not null;

alter table public.profiles
  alter column friend_code set default public.generate_friend_code(),
  alter column friend_code set not null;

create unique index if not exists idx_profiles_friend_code
  on public.profiles (friend_code);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_no_self check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create index if not exists idx_friendships_requester on public.friendships(requester_id);
create index if not exists idx_friendships_addressee on public.friendships(addressee_id);
create index if not exists idx_friendships_status on public.friendships(status);

alter table public.friendships enable row level security;

create policy "Users can view own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can create outgoing friendships"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

create policy "Users can update own friendships"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, player_name, friend_code, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'player_name', 'Alina'),
    public.generate_friend_code(),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.lookup_friend_code(friend_code_input text)
returns table (
  user_id uuid,
  player_name text,
  avatar_url text,
  friend_code text,
  relation_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
  relation_row public.friendships%rowtype;
begin
  select *
  into target_profile
  from public.profiles
  where friend_code = upper(trim(friend_code_input));

  if not found then
    return;
  end if;

  if target_profile.id = auth.uid() then
    return query
    select target_profile.id, target_profile.player_name, target_profile.avatar_url, target_profile.friend_code, 'self'::text;
    return;
  end if;

  select *
  into relation_row
  from public.friendships
  where (requester_id = auth.uid() and addressee_id = target_profile.id)
     or (requester_id = target_profile.id and addressee_id = auth.uid())
  order by created_at desc
  limit 1;

  if found then
    if relation_row.status = 'accepted' then
      return query
      select target_profile.id, target_profile.player_name, target_profile.avatar_url, target_profile.friend_code, 'accepted'::text;
    elsif relation_row.status = 'pending' then
      if relation_row.requester_id = auth.uid() then
        return query
        select target_profile.id, target_profile.player_name, target_profile.avatar_url, target_profile.friend_code, 'outgoing_pending'::text;
      else
        return query
        select target_profile.id, target_profile.player_name, target_profile.avatar_url, target_profile.friend_code, 'incoming_pending'::text;
      end if;
    else
      return query
      select target_profile.id, target_profile.player_name, target_profile.avatar_url, target_profile.friend_code, 'none'::text;
    end if;
  else
    return query
    select target_profile.id, target_profile.player_name, target_profile.avatar_url, target_profile.friend_code, 'none'::text;
  end if;
end;
$$;

create or replace function public.send_friend_request(friend_code_input text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  existing_row public.friendships%rowtype;
begin
  select id
  into target_id
  from public.profiles
  where friend_code = upper(trim(friend_code_input));

  if target_id is null then
    raise exception 'friend_code_not_found';
  end if;

  if target_id = auth.uid() then
    raise exception 'friend_code_is_self';
  end if;

  select *
  into existing_row
  from public.friendships
  where (requester_id = auth.uid() and addressee_id = target_id)
     or (requester_id = target_id and addressee_id = auth.uid())
  order by created_at desc
  limit 1;

  if not found then
    insert into public.friendships (requester_id, addressee_id, status)
    values (auth.uid(), target_id, 'pending');
    return 'pending';
  end if;

  if existing_row.status = 'accepted' then
    return 'accepted';
  end if;

  if existing_row.status = 'pending' and existing_row.requester_id = auth.uid() then
    return 'outgoing_pending';
  end if;

  if existing_row.status = 'pending' and existing_row.addressee_id = auth.uid() then
    update public.friendships
    set status = 'accepted',
        responded_at = now(),
        updated_at = now()
    where id = existing_row.id;
    return 'accepted';
  end if;

  update public.friendships
  set requester_id = auth.uid(),
      addressee_id = target_id,
      status = 'pending',
      responded_at = null,
      updated_at = now()
  where id = existing_row.id;

  return 'pending';
end;
$$;

create or replace function public.respond_to_friend_request(friend_user_id uuid, accept_request boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_row public.friendships%rowtype;
  next_status text;
begin
  select *
  into target_row
  from public.friendships
  where requester_id = friend_user_id
    and addressee_id = auth.uid()
    and status = 'pending'
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'friend_request_not_found';
  end if;

  next_status := case when accept_request then 'accepted' else 'rejected' end;

  update public.friendships
  set status = next_status,
      responded_at = now(),
      updated_at = now()
  where id = target_row.id;

  return next_status;
end;
$$;

create or replace function public.get_friend_requests()
returns table (
  friend_id uuid,
  player_name text,
  avatar_url text,
  friend_code text,
  direction text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with requests as (
    select
      case
        when f.requester_id = auth.uid() then f.addressee_id
        else f.requester_id
      end as friend_id,
      case
        when f.requester_id = auth.uid() then 'outgoing'
        else 'incoming'
      end as direction,
      f.created_at
    from public.friendships f
    where f.status = 'pending'
      and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  )
  select
    r.friend_id,
    p.player_name,
    p.avatar_url,
    p.friend_code,
    r.direction,
    r.created_at
  from requests r
  join public.profiles p on p.id = r.friend_id
  order by r.created_at desc;
$$;

create or replace function public.get_my_friends()
returns table (
  friend_id uuid,
  player_name text,
  avatar_url text,
  friend_code text,
  friends_since timestamptz,
  total_xp integer,
  active_quests integer,
  completed_quests integer,
  active_buildings integer,
  completed_buildings integer,
  total_goals integer
)
language sql
security definer
set search_path = public
as $$
  with friend_rows as (
    select
      case
        when f.requester_id = auth.uid() then f.addressee_id
        else f.requester_id
      end as friend_id,
      coalesce(f.responded_at, f.updated_at, f.created_at) as friends_since
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  )
  select
    fr.friend_id,
    p.player_name,
    p.avatar_url,
    p.friend_code,
    fr.friends_since,
    coalesce(pr.total_xp, 0)::int as total_xp,
    (select count(*)::int from public.quests q where q.user_id = fr.friend_id and q.status = 'in-progress') as active_quests,
    (select count(*)::int from public.quests q where q.user_id = fr.friend_id and q.status = 'done') as completed_quests,
    (select count(*)::int from public.buildings b where b.user_id = fr.friend_id and b.status = 'in-progress') as active_buildings,
    (select count(*)::int from public.buildings b where b.user_id = fr.friend_id and b.status = 'done') as completed_buildings,
    (select count(*)::int from public.goals g where g.user_id = fr.friend_id) as total_goals
  from friend_rows fr
  join public.profiles p on p.id = fr.friend_id
  left join public.progress pr on pr.user_id = fr.friend_id
  order by lower(p.player_name);
$$;

create or replace function public.get_friend_profile(friend_user_id uuid)
returns table (
  friend_id uuid,
  player_name text,
  avatar_url text,
  friend_code text,
  friends_since timestamptz,
  total_xp integer,
  total_quests integer,
  open_quests integer,
  active_quests integer,
  completed_quests integer,
  total_buildings integer,
  planned_buildings integer,
  active_buildings integer,
  completed_buildings integer,
  total_goals integer,
  total_notes integer
)
language sql
security definer
set search_path = public
as $$
  with friendship as (
    select
      case
        when f.requester_id = auth.uid() then f.addressee_id
        else f.requester_id
      end as friend_id,
      coalesce(f.responded_at, f.updated_at, f.created_at) as friends_since
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  )
  select
    fr.friend_id,
    p.player_name,
    p.avatar_url,
    p.friend_code,
    fr.friends_since,
    coalesce(pr.total_xp, 0)::int as total_xp,
    (select count(*)::int from public.quests q where q.user_id = fr.friend_id) as total_quests,
    (select count(*)::int from public.quests q where q.user_id = fr.friend_id and q.status = 'open') as open_quests,
    (select count(*)::int from public.quests q where q.user_id = fr.friend_id and q.status = 'in-progress') as active_quests,
    (select count(*)::int from public.quests q where q.user_id = fr.friend_id and q.status = 'done') as completed_quests,
    (select count(*)::int from public.buildings b where b.user_id = fr.friend_id) as total_buildings,
    (select count(*)::int from public.buildings b where b.user_id = fr.friend_id and b.status = 'planned') as planned_buildings,
    (select count(*)::int from public.buildings b where b.user_id = fr.friend_id and b.status = 'in-progress') as active_buildings,
    (select count(*)::int from public.buildings b where b.user_id = fr.friend_id and b.status = 'done') as completed_buildings,
    (select count(*)::int from public.goals g where g.user_id = fr.friend_id) as total_goals,
    (select count(*)::int from public.notes n where n.user_id = fr.friend_id) as total_notes
  from friendship fr
  join public.profiles p on p.id = fr.friend_id
  left join public.progress pr on pr.user_id = fr.friend_id
  where fr.friend_id = friend_user_id
  limit 1;
$$;

grant execute on function public.lookup_friend_code(text) to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;
grant execute on function public.get_friend_requests() to authenticated;
grant execute on function public.get_my_friends() to authenticated;
grant execute on function public.get_friend_profile(uuid) to authenticated;
