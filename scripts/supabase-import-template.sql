begin;
create temp table source_payload(raw text, data jsonb) on commit drop;
insert into source_payload(raw) values ($import$__PAYLOAD__$import$);
do $$ begin
  if (select md5(raw) from source_payload) <> '__MD5__' then
    raise exception 'Source checksum mismatch';
  end if;
end $$;
update source_payload set data = raw::jsonb;
-- This importer handles the original Vedette export. Copy column defaults so the
-- new NOT NULL teamId field receives 'vedette', matching the live destination row.
create temp table import_seasons (like public.seasons including defaults) on commit drop;
create temp table import_competitions (like public.competitions including defaults) on commit drop;
create temp table import_players (like public.players including defaults) on commit drop;
create temp table import_games (like public.games including defaults) on commit drop;
insert into import_seasons(id,name)
select r->>0,r->>1 from source_payload, jsonb_array_elements(data->'s') r;
insert into import_competitions(id,"seasonId",type)
select r->>0,r->>1,r->>2 from source_payload, jsonb_array_elements(data->'c') r;
insert into import_players(id,name,number,"seasonId","competitionIds")
select r->>0,r->>1,(r->>2)::integer,r->>3,
  case when jsonb_typeof(r->4)='array' then array(select jsonb_array_elements_text(r->4)) end
from source_payload, jsonb_array_elements(data->'p') r;
insert into import_games(id,opponent,date,"scoreTeam","scoreOpponent",league,players,events)
select r->>0,r->>1,r->>2,(r->>3)::integer,(r->>4)::integer,r->>5,
  array(select data->'p'->(n.value::text::integer)->>0 from jsonb_array_elements(r->6) with ordinality n(value,ord) order by n.ord),
  coalesce((select jsonb_agg(jsonb_build_object('playerId',data->'p'->((e.value->>0)::integer)->>0,
    'type',case when e.value->>1='0' then 'goal' else 'assist' end) order by e.ord)
    from jsonb_array_elements(r->7) with ordinality e(value,ord)), '[]'::jsonb)
from source_payload, jsonb_array_elements(data->'g') r;
insert into public.seasons select * from import_seasons on conflict(id) do nothing;
insert into public.competitions select * from import_competitions on conflict(id) do nothing;
insert into public.players select * from import_players on conflict(id) do nothing;
insert into public.games select * from import_games on conflict(id) do nothing;
do $$
declare t text; differs boolean;
begin
  foreach t in array array['seasons','competitions','players','games'] loop
    execute format('select exists(select 1 from import_%I i left join public.%I p on p.id=i.id where to_jsonb(i) is distinct from to_jsonb(p))',t,t) into differs;
    if differs then raise exception 'Import mismatch in %. Transaction cancelled; existing rows were not overwritten.', t; end if;
  end loop;
end $$;
commit;
