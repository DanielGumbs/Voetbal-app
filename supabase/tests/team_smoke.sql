-- Run in the test project's SQL Editor after the bootstrap admin has signed in.
-- All test writes are rolled back.
begin;
select set_config('request.jwt.claim.sub',
  (select id::text from public.users where email = 'daniel.r.gumbs@gmail.com'), true);
set local role authenticated;
do $$
declare season_id text; player_id text; game_id text;
begin
  if not public.is_admin() then raise exception 'Admin profile is not ready'; end if;
  season_id := public.add_season('Supabase integration check');
  if (select count(*) from public.competitions where "seasonId" = season_id) <> 2 then
    raise exception 'Season competitions were not created atomically';
  end if;
  insert into public.players (name, number, "seasonId", "competitionIds")
  values ('Test player', 99, season_id, array[season_id || '_competitie']) returning id into player_id;
  insert into public.games (opponent, date, events, players, league, "seasonId", "competitionId")
  values ('Test opponent', '2026-09-15', jsonb_build_array(jsonb_build_object('playerId', player_id, 'type', 'goal')),
    array[player_id], 'competitie', season_id, season_id || '_competitie') returning id into game_id;
  if not exists (select 1 from public.games where id = game_id) then
    raise exception 'Saved game is not readable';
  end if;
  if has_table_privilege('authenticated', 'public.users', 'UPDATE')
    or has_table_privilege('authenticated', 'public.games', 'DELETE')
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
    perform public.add_season('Must be rejected');
    raise exception 'Non-admin season creation was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Alleen admins kunnen seizoenen toevoegen' then raise; end if;
  end;
end;
$$;
rollback;
