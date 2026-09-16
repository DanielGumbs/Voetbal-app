-- Run in the test project's SQL Editor after the bootstrap admin has signed in.
-- All test writes are rolled back.
begin;
select set_config('request.jwt.claim.sub',
  (select id::text from public.users where email = 'daniel.r.gumbs@gmail.com'), true);
set local role authenticated;
do $$
declare season_id text; ivv_season text; second_ivv_season text; custom_team text; custom_season text;
  player_id text; game_id text; previous_name text; previous_count integer;
begin
  if not public.is_admin() then raise exception 'Admin profile is not ready'; end if;
  if (select count(*) from public.teams where id in ('vedette', '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26')) <> 2 then
    raise exception 'The two default teams are missing';
  end if;
  select count(*), max(name) into previous_count, previous_name
    from public.seasons where id = 'previous-season';
  ivv_season := public.add_season('IVV integration check', '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26');
  second_ivv_season := public.add_season('IVV second season check', '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26');
  if (select count(*) from public.seasons where id in (ivv_season, second_ivv_season)
    and "teamId" = '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26') <> 2 then
    raise exception 'Multiple seasons within one team failed';
  end if;
  if (select count(*) from public.seasons where id = 'previous-season') <> previous_count then
    raise exception 'IVV created a fake previous season';
  end if;
  if (select count(*) from public.competitions where "seasonId" = ivv_season and "teamId" = '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26') <> 2 then
    raise exception 'IVV competitions have the wrong team';
  end if;
  season_id := public.add_season('Supabase integration check', 'vedette');
  if previous_count > 0 and (select name from public.seasons where id = 'previous-season') <> previous_name then
    raise exception 'Existing previous season was overwritten';
  end if;
  if (select count(*) from public.competitions where "seasonId" = season_id) <> 2 then
    raise exception 'Season competitions were not created atomically';
  end if;
  insert into public.players (name, number, "seasonId", "competitionIds", "teamId")
  values ('Test player', 99, season_id, array[season_id || '_competitie'], 'vedette') returning id into player_id;
  insert into public.games (opponent, date, events, players, league, "seasonId", "competitionId", "teamId")
  values ('Test opponent', '2026-09-15', jsonb_build_array(jsonb_build_object('playerId', player_id, 'type', 'goal')),
    array[player_id], 'competitie', season_id, season_id || '_competitie', 'vedette') returning id into game_id;
  if not exists (select 1 from public.games where id = game_id) then
    raise exception 'Saved game is not readable';
  end if;
  insert into public.teams (name, "logoUrl") values ('Test team', 'data:image/png;base64,aGVsbG8=')
    returning id into custom_team;
  custom_season := public.add_season('Custom team check', custom_team);
  if (select "teamId" from public.seasons where id = custom_season) <> custom_team then
    raise exception 'Custom team season was misassigned';
  end if;
  update public.teams set name = 'Renamed team', "logoUrl" = null where id = custom_team;
  if not exists (select 1 from public.teams where id = custom_team and name = 'Renamed team' and "logoUrl" is null) then
    raise exception 'Team editing or removing a logo failed';
  end if;
  begin
    update public.teams set id = 'forbidden-id' where id = custom_team;
    raise exception 'Changing team identity was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.players (name, number, "seasonId", "competitionIds", "teamId")
      values ('Wrong team', 1, season_id, array[season_id || '_competitie'], '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26');
    raise exception 'Player was added to another team season';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.games (opponent, date, league, "seasonId", "competitionId", "teamId")
      values ('Wrong team', '2026-09-16', 'competitie', ivv_season, ivv_season || '_competitie', 'vedette');
    raise exception 'Game was added to another team season';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.teams (name, "logoUrl") values ('Unsafe logo', 'data:image/svg+xml;base64,aGVsbG8=');
    raise exception 'SVG logo was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.teams (name, "logoUrl") values ('Oversize logo', 'data:image/png;base64,' || repeat('a', 180000));
    raise exception 'Oversize logo was accepted';
  exception when check_violation then null;
  end;
  if has_table_privilege('authenticated', 'public.users', 'UPDATE')
    or has_table_privilege('authenticated', 'public.games', 'DELETE')
    or has_table_privilege('authenticated', 'public.teams', 'DELETE')
    or has_column_privilege('authenticated', 'public.teams', 'id', 'UPDATE')
    or has_table_privilege('anon', 'public.teams', 'SELECT')
    or has_table_privilege('anon', 'public.games', 'SELECT') then
    raise exception 'Unexpected public privileges';
  end if;
end;
$$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$
begin
  if public.is_admin() then raise exception 'Unknown user has admin access'; end if;
  begin
    insert into public.teams (name) values ('Must be rejected');
    raise exception 'Non-admin team creation was accepted';
  exception when insufficient_privilege then null;
  end;
  update public.teams set name = 'Must be rejected' where id = '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26';
  if found then raise exception 'Non-admin team edit was accepted'; end if;
  begin
    perform public.add_season('Must be rejected');
    raise exception 'Non-admin season creation was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Alleen admins kunnen seizoenen toevoegen' then raise; end if;
  end;
end;
$$;
rollback;
