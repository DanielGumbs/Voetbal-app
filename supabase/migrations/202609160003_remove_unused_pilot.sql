-- Supabase TEST only. The old pilot has no references in the current app/scripts.
-- Audited backup: backups/supabase-pilot-before-cleanup-2026-09-16.csv.
-- Helper/dependency backup: backups/supabase-pilot-functions-before-cleanup-2026-09-16.csv.
-- All eight pilot tables were empty. Abort if data or unexpected dependents appear.
-- Every DROP uses RESTRICT (the default); never remove unrelated objects implicitly.
begin;
set local lock_timeout = '5s';

create temporary table pilot_cleanup_tables (name text primary key) on commit drop;
insert into pilot_cleanup_tables values
  ('pilot_events'), ('pilot_appearances'), ('pilot_matches'), ('pilot_players'),
  ('pilot_competitions'), ('pilot_seasons'), ('pilot_members'), ('pilot_teams');
create temporary table pilot_cleanup_functions (
  schema_name text, name text, argument_types text,
  primary key (schema_name, name, argument_types)
) on commit drop;
insert into pilot_cleanup_functions values
  ('public', 'pilot_create_team', 'text, text, text, integer'),
  ('public', 'pilot_add_player', 'uuid, uuid, text, integer'),
  ('public', 'pilot_create_match', 'uuid, uuid, uuid, text, date, integer, integer, uuid[], jsonb'),
  ('public', 'pilot_import_team', 'jsonb'),
  ('pilot_private', 'is_member', 'uuid'),
  ('pilot_private', 'can_manage', 'uuid'),
  ('pilot_private', 'write_match', 'uuid, uuid, uuid, text, date, integer, integer, uuid[], jsonb, text'),
  ('pilot_private', 'verified_uid', '');

do $$
declare candidate record; has_rows boolean; unexpected text;
begin
  for candidate in
    select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
    join pilot_cleanup_tables target on target.name = c.relname where n.nspname = 'public'
    order by c.relname
  loop
    if candidate.relkind <> 'r' then
      raise exception 'Unexpected object type for public.%', candidate.relname;
    end if;
    execute format('lock table public.%I in access exclusive mode', candidate.relname);
    execute format('select exists(select 1 from public.%I)', candidate.relname) into has_rows;
    if has_rows then raise exception 'public.% now contains data; cleanup cancelled', candidate.relname; end if;
  end loop;

  select string_agg(fk.conrelid::regclass::text || '.' || fk.conname, ', ') into unexpected
  from pg_constraint fk
  join pg_class target on target.oid = fk.confrelid
  join pg_namespace target_ns on target_ns.oid = target.relnamespace
  join pilot_cleanup_tables planned on planned.name = target.relname
  where fk.contype = 'f' and target_ns.nspname = 'public'
    and not exists (
      select 1 from pg_class child join pg_namespace child_ns on child_ns.oid = child.relnamespace
      join pilot_cleanup_tables own on own.name = child.relname
      where child.oid = fk.conrelid and child_ns.nspname = 'public'
    );
  if unexpected is not null then
    raise exception 'Unexpected foreign keys depend on pilot data: %', unexpected;
  end if;

  -- String-body SQL/PLpgSQL references may not be recorded in pg_depend.
  select string_agg(n.nspname || '.' || p.proname, ', ') into unexpected
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where (n.nspname = 'pilot_private' or position('pilot_' in p.prosrc) > 0
    or left(p.proname, 6) = 'pilot_')
    and not exists (
      select 1 from pilot_cleanup_functions own
      where own.schema_name = n.nspname and own.name = p.proname
        and own.argument_types = oidvectortypes(p.proargtypes)
    );
  if unexpected is not null then
    raise exception 'Unexpected functions refer to the pilot: %', unexpected;
  end if;

  select string_agg(n.nspname || '.' || c.relname || '.' || t.tgname, ', ') into unexpected
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_proc p on p.oid = t.tgfoid
  join pg_namespace pn on pn.oid = p.pronamespace
  where not t.tgisinternal
    and (pn.nspname = 'pilot_private' or position('pilot_' in p.prosrc) > 0)
    and not (n.nspname = 'public' and c.relname in (select name from pilot_cleanup_tables));
  if unexpected is not null then
    raise exception 'Unexpected triggers refer to the pilot: %', unexpected;
  end if;

  -- The audited private schema contains only the four helper functions above.
  -- Reject newly added relations, types, or any other schema-owned objects.
  select string_agg(pg_describe_object(d.classid, d.objid, d.objsubid), ', ') into unexpected
  from pg_depend d join pg_namespace n on n.oid = d.refobjid
  where d.refclassid = 'pg_namespace'::regclass and n.nspname = 'pilot_private'
    and not (
      d.classid = 'pg_proc'::regclass and exists (
        select 1 from pg_proc p join pilot_cleanup_functions own
          on own.schema_name = 'pilot_private' and own.name = p.proname
          and own.argument_types = oidvectortypes(p.proargtypes)
        where p.oid = d.objid and p.pronamespace = n.oid
      )
    );
  if unexpected is not null then
    raise exception 'Unexpected objects in pilot_private: %', unexpected;
  end if;
end;
$$;

-- Freeze and compare the complete contents of the six tables used by the app.
lock table public.users, public.teams, public.seasons, public.competitions,
  public.players, public.games in share mode;
create temporary table pilot_cleanup_runtime (name text primary key, row_data jsonb) on commit drop;
do $$
declare table_name text; contents jsonb;
begin
  foreach table_name in array array['users', 'teams', 'seasons', 'competitions', 'players', 'games'] loop
    execute format('select coalesce(jsonb_agg(to_jsonb(r) order by id), ''[]''::jsonb) from public.%I r', table_name)
      into contents;
    insert into pilot_cleanup_runtime values (table_name, contents);
  end loop;
end;
$$;

drop view if exists public.pilot_personal_stats;
drop function if exists public.pilot_import_team(jsonb);
drop function if exists public.pilot_create_match(uuid, uuid, uuid, text, date, integer, integer, uuid[], jsonb);
drop function if exists public.pilot_add_player(uuid, uuid, text, integer);
drop function if exists public.pilot_create_team(text, text, text, integer);
-- Child tables first, following the foreign keys captured in the backup.
drop table if exists public.pilot_events;
drop table if exists public.pilot_appearances;
drop table if exists public.pilot_matches;
drop table if exists public.pilot_players;
drop table if exists public.pilot_competitions;
drop table if exists public.pilot_seasons;
drop table if exists public.pilot_members;
drop table if exists public.pilot_teams;
drop function if exists pilot_private.write_match(uuid, uuid, uuid, text, date, integer, integer, uuid[], jsonb, text);
drop function if exists pilot_private.can_manage(uuid);
drop function if exists pilot_private.is_member(uuid);
drop function if exists pilot_private.verified_uid();
drop schema if exists pilot_private restrict;

do $$
declare original record; contents jsonb;
begin
  for original in select * from pilot_cleanup_runtime loop
    execute format('select coalesce(jsonb_agg(to_jsonb(r) order by id), ''[]''::jsonb) from public.%I r', original.name)
      into contents;
    if contents is distinct from original.row_data then
      raise exception 'Runtime data in public.% changed; rolling back cleanup', original.name;
    end if;
  end loop;
end;
$$;
notify pgrst, 'reload schema';
commit;
