-- Supabase TEST only. Supports the original repo schema and the already-created
-- teams table in the test project. Preserve existing team IDs and historical data.
begin;

create temporary table team_migration_counts on commit drop as
select 'seasons' as table_name, count(*) as row_count from public.seasons
union all select 'competitions', count(*) from public.competitions
union all select 'players', count(*) from public.players
union all select 'games', count(*) from public.games;
create temporary table team_migration_seasons on commit drop as
select id, name, to_jsonb(season)->>'teamId' as team_id from public.seasons season;

create table if not exists public.teams (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(trim(name)) between 1 and 80),
  "logoUrl" text
);
do $$
begin
  if exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teams' and column_name = 'logo') then
    if exists (select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'teams' and column_name = 'logoUrl') then
      raise exception 'Both logo and logoUrl exist; inspect logo values before migrating';
    end if;
    alter table public.teams rename column logo to "logoUrl";
  end if;
end;
$$;
alter table public.teams alter column "logoUrl" drop not null;
alter table public.teams alter column "logoUrl" drop default;
alter table public.teams drop constraint if exists teams_logo_check;
update public.teams set "logoUrl" = null where "logoUrl" = '';
alter table public.teams add constraint teams_logo_url_check check (
  "logoUrl" is null or (
    length("logoUrl") <= 180000 and (
      "logoUrl" = '/logo/vedette-logo.jpg'
      or "logoUrl" ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$'
    )
  )
);
insert into public.teams (id, name, "logoUrl") values
  ('vedette', 'Vedette De Remise', '/logo/vedette-logo.jpg'),
  ('3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26', 'IVV', null)
on conflict (id) do update set name = excluded.name;

-- Existing seasons may already identify their team. Child rows inherit that team;
-- records from before seasons were introduced belong to the original Vedette team.
alter table public.seasons add column if not exists "teamId" text;
update public.seasons set "teamId" = 'vedette' where "teamId" is null;
alter table public.seasons alter column "teamId" set default 'vedette';
alter table public.seasons alter column "teamId" set not null;
alter table public.competitions add column if not exists "teamId" text;
update public.competitions child set "teamId" = coalesce(
  (select season."teamId" from public.seasons season where season.id = child."seasonId"), 'vedette'
) where child."teamId" is null;
alter table public.competitions alter column "teamId" set default 'vedette';
alter table public.competitions alter column "teamId" set not null;
alter table public.players add column if not exists "teamId" text;
update public.players child set "teamId" = coalesce(
  (select season."teamId" from public.seasons season where season.id = child."seasonId"), 'vedette'
) where child."teamId" is null;
alter table public.players alter column "teamId" set default 'vedette';
alter table public.players alter column "teamId" set not null;
alter table public.games add column if not exists "teamId" text;
update public.games child set "teamId" = coalesce(
  (select season."teamId" from public.seasons season where season.id = child."seasonId"), 'vedette'
) where child."teamId" is null;
alter table public.games alter column "teamId" set default 'vedette';
alter table public.games alter column "teamId" set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.seasons'::regclass
    and conname = 'seasons_teamId_fkey') then
    alter table public.seasons add constraint "seasons_teamId_fkey"
      foreign key ("teamId") references public.teams(id);
  end if;
end;
$$;
alter table public.competitions add constraint competitions_team_fk
  foreign key ("teamId") references public.teams(id);
alter table public.players add constraint players_team_fk
  foreign key ("teamId") references public.teams(id);
alter table public.games add constraint games_team_fk
  foreign key ("teamId") references public.teams(id);
alter table public.seasons add constraint seasons_id_team_unique unique (id, "teamId");
alter table public.seasons add constraint previous_season_team check (
  id <> 'previous-season' or "teamId" = 'vedette'
);
alter table public.competitions
  add constraint competitions_season_team_fk foreign key ("seasonId", "teamId")
    references public.seasons(id, "teamId"),
  add constraint competitions_id_season_team_unique unique (id, "seasonId", "teamId");
alter table public.players
  add constraint players_season_team_fk foreign key ("seasonId", "teamId")
    references public.seasons(id, "teamId");
alter table public.games
  add constraint games_season_team_fk foreign key ("seasonId", "teamId")
    references public.seasons(id, "teamId"),
  add constraint games_competition_season_team_fk
    foreign key ("competitionId", "seasonId", "teamId")
    references public.competitions(id, "seasonId", "teamId");
create index if not exists seasons_team_idx on public.seasons ("teamId");
create index if not exists competitions_team_idx on public.competitions ("teamId");
create index if not exists players_team_season_idx on public.players ("teamId", "seasonId");
create index if not exists games_team_season_idx on public.games ("teamId", "seasonId");

-- Array elements cannot have a foreign key, so validate selected competitions on
-- new writes while keeping pre-season historical records readable.
create function public.check_player_competitions() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from unnest(new."competitionIds") selected(id)
    where not exists (
      select 1 from public.competitions competition
      where competition.id = selected.id and competition."seasonId" = new."seasonId"
        and competition."teamId" = new."teamId"
    )
  ) then
    raise exception 'Competities moeten bij hetzelfde team en seizoen horen' using errcode = '23503';
  end if;
  return new;
end;
$$;
revoke all on function public.check_player_competitions() from public;
create trigger check_player_competitions before insert or update on public.players
  for each row execute function public.check_player_competitions();

alter table public.teams enable row level security;
revoke all on public.teams from anon, authenticated;
revoke update (id) on public.teams from anon, authenticated;
grant select, insert on public.teams to authenticated;
grant update (name, "logoUrl") on public.teams to authenticated;
drop policy if exists read_teams on public.teams;
drop policy if exists add_teams on public.teams;
drop policy if exists update_teams on public.teams;
drop policy if exists edit_teams on public.teams;
create policy read_teams on public.teams for select to authenticated using (true);
create policy add_teams on public.teams for insert to authenticated
  with check ((select public.is_admin()));
create policy edit_teams on public.teams for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Both signatures exist in the current test project. Keep one unambiguous RPC;
-- its default retains SQL compatibility for callers that omit the team argument.
drop function if exists public.add_season(text);
drop function if exists public.add_season(text, text);
create function public.add_season(season_name text, team_id text default 'vedette')
returns text language plpgsql security definer set search_path = '' as $$
declare new_id text := gen_random_uuid()::text;
begin
  if not public.is_admin() then
    raise exception 'Alleen admins kunnen seizoenen toevoegen';
  end if;
  if not exists (select 1 from public.teams where id = team_id) then
    raise exception 'Dit team bestaat niet' using errcode = '23503';
  end if;
  insert into public.seasons (id, name, "teamId") values (new_id, trim(season_name), team_id);
  insert into public.competitions (id, "seasonId", type, "teamId")
    select new_id || '_' || type, new_id, type, team_id
    from unnest(array['competitie', 'beker']) type;
  if team_id = 'vedette' then
    insert into public.seasons (id, name, "teamId")
      values ('previous-season', 'Vorig seizoen', team_id) on conflict (id) do nothing;
    insert into public.competitions (id, "seasonId", type, "teamId")
      select 'previous-season_' || type, 'previous-season', type, team_id
      from unnest(array['competitie', 'beker']) type on conflict (id) do nothing;
  end if;
  return new_id;
end;
$$;
revoke all on function public.add_season(text, text) from public;
grant execute on function public.add_season(text, text) to authenticated;
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams') then
    alter publication supabase_realtime add table public.teams;
  end if;
  if exists (
    select 1 from team_migration_counts old
    join (
      select 'seasons' as table_name, count(*) as row_count from public.seasons
      union all select 'competitions', count(*) from public.competitions
      union all select 'players', count(*) from public.players
      union all select 'games', count(*) from public.games
    ) current using (table_name) where old.row_count <> current.row_count
  ) or exists (
    select 1 from team_migration_seasons old left join public.seasons current using (id)
    where current.id is null or old.name is distinct from current.name
      or coalesce(old.team_id, 'vedette') is distinct from current."teamId"
  ) then
    raise exception 'Migration changed existing history; rolling back';
  end if;
end;
$$;
notify pgrst, 'reload schema';
commit;
