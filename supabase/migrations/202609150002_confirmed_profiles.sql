begin;

-- Google confirms the email in an UPDATE after inserting auth.users.
-- Assign the initial role after confirmation, then preserve all existing roles.
create or replace function public.create_user_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null then
    insert into public.users (id, email, "isAdmin")
    values (new.id, coalesce(new.email, ''),
      coalesce(new.email = 'daniel.r.gumbs@gmail.com', false))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
create or replace trigger create_user_profile
after insert or update of email_confirmed_at on auth.users
for each row execute function public.create_user_profile();

-- Repair the single bootstrap profile created during the first live login test.
-- A precise ID avoids altering any other account or later manually assigned role.
update public.users p set "isAdmin" = true
from auth.users u
where p.id = u.id and p.id = 'e544cab7-f158-4578-b8f7-d3914799f7aa'::uuid
  and p.email = 'daniel.r.gumbs@gmail.com'
  and u.email = p.email and u.email_confirmed_at is not null;

commit;
