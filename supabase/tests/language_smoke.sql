-- Run in the development SQL Editor after migration 202609150003.
-- Requires one existing profile. All writes are rolled back.
begin;
select set_config('request.jwt.claim.sub', (select id::text from public.users limit 1), true);
create temporary table language_before as select id, email, "isAdmin" from public.users;
grant select on language_before to authenticated;
set local role authenticated;
do $$
begin
  if auth.uid() is null then raise exception 'An existing test profile is required'; end if;
  perform public.set_language('en');
  if (select language from public.users where id = auth.uid()) <> 'en' then
    raise exception 'Own language was not saved';
  end if;
  perform public.set_language('nl');
  begin
    perform public.set_language('fr');
    raise exception 'Unsupported language accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.set_language(null);
    raise exception 'Null language accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    update public.users set "isAdmin" = not "isAdmin" where id = auth.uid();
    raise exception 'Direct role update accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.users set language = 'en' where id <> auth.uid();
    raise exception 'Direct update to other profiles accepted';
  exception when insufficient_privilege then null;
  end;
  if has_function_privilege('anon', 'public.set_language(text)', 'EXECUTE') then
    raise exception 'Anonymous language update is exposed';
  end if;
end;
$$;
reset role;
do $$
begin
  if exists (
    select id, email, "isAdmin" from public.users
    except select id, email, "isAdmin" from language_before
  ) then raise exception 'Existing profile identity or role changed'; end if;
end;
$$;
rollback;
