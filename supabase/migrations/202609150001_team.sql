-- Run once in the Supabase TEST project, never against the Firebase production data.
begin;
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  "isAdmin" boolean not null default false
);
create table public.seasons (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(trim(name)) between 1 and 80)
);
create table public.competitions (
  id text primary key,
  "seasonId" text not null references public.seasons(id),
  type text not null check (type in ('competitie', 'beker')),
  check (id = "seasonId" || '_' || type)
);
create table public.players (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(trim(name)) > 0),
  number integer not null check (number >= 0),
  "seasonId" text references public.seasons(id),
  "competitionIds" text[]
);
create table public.games (
  id text primary key default gen_random_uuid()::text,
  opponent text not null check (length(trim(opponent)) > 0),
  date text not null,
  "scoreTeam" integer check ("scoreTeam" >= 0),
  "scoreOpponent" integer check ("scoreOpponent" >= 0),
  events jsonb not null default '[]' check (jsonb_typeof(events) = 'array'),
  players text[] not null default '{}',
  league text not null check (league in ('competitie', 'beker', 'friendly')),
  "seasonId" text references public.seasons(id),
  "competitionId" text references public.competitions(id)
);

create function public.create_user_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, "isAdmin")
  values (new.id, coalesce(new.email, ''),
    coalesce(new.email = 'daniel.r.gumbs@gmail.com' and new.email_confirmed_at is not null, false))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_user_profile() from public;
create trigger create_user_profile after insert on auth.users
for each row execute function public.create_user_profile();
insert into public.users (id, email, "isAdmin")
select id, coalesce(email, ''), coalesce(email = 'daniel.r.gumbs@gmail.com'
  and email_confirmed_at is not null, false) from auth.users
on conflict (id) do nothing;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p."isAdmin" and u.email_confirmed_at is not null);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.users enable row level security;
alter table public.seasons enable row level security;
alter table public.competitions enable row level security;
alter table public.players enable row level security;
alter table public.games enable row level security;
revoke all on public.users, public.seasons, public.competitions, public.players, public.games from anon, authenticated;
grant select on public.users, public.seasons, public.competitions, public.players, public.games to authenticated;
grant insert on public.players, public.games to authenticated;

create policy own_profile on public.users for select to authenticated using (id = (select auth.uid()));
create policy read_seasons on public.seasons for select to authenticated using (true);
create policy read_competitions on public.competitions for select to authenticated using (true);
create policy read_players on public.players for select to authenticated using (true);
create policy read_games on public.games for select to authenticated using (true);
create policy add_players on public.players for insert to authenticated with check (
  (select public.is_admin()) and "seasonId" is not null and "seasonId" <> 'previous-season'
  and cardinality("competitionIds") > 0
  and "competitionIds" <@ array["seasonId" || '_competitie', "seasonId" || '_beker']
);
create policy add_games on public.games for insert to authenticated with check (
  (select public.is_admin()) and "seasonId" is not null and "seasonId" <> 'previous-season'
  and league in ('competitie', 'beker') and "competitionId" = "seasonId" || '_' || league
);

-- One transaction creates the season and all its competitions, matching the Firebase batch.
create function public.add_season(season_name text) returns text
language plpgsql security definer set search_path = '' as $$
declare new_id text := gen_random_uuid()::text;
begin
  if not public.is_admin() then raise exception 'Alleen admins kunnen seizoenen toevoegen'; end if;
  insert into public.seasons (id, name) values (new_id, trim(season_name));
  insert into public.seasons (id, name) values ('previous-season', 'Vorig seizoen')
    on conflict (id) do nothing;
  insert into public.competitions (id, "seasonId", type)
    select s || '_' || t, s, t
    from unnest(array[new_id, 'previous-season']) s
    cross join unnest(array['competitie', 'beker']) t
    on conflict (id) do nothing;
  return new_id;
end;
$$;
revoke all on function public.add_season(text) from public;
grant execute on function public.add_season(text) to authenticated;

alter publication supabase_realtime add table public.users, public.seasons, public.competitions, public.players, public.games;
commit;
