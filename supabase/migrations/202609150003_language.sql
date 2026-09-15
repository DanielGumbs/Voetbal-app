-- Additive; run in development Supabase only. Existing profiles/roles remain unchanged.
begin;
alter table public.users add column language text check (language in ('nl', 'en'));
create function public.set_language(preferred_language text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or preferred_language is null or preferred_language not in ('nl', 'en') then
    raise exception 'Invalid language preference' using errcode = '22023';
  end if;
  update public.users set language = preferred_language where id = auth.uid();
  if not found then raise exception 'Profile not ready' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.set_language(text) from public;
grant execute on function public.set_language(text) to authenticated;
commit;
