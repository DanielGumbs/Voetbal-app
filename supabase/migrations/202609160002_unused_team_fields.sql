-- Run after the multiple-teams migration and a backup of public.teams.
-- The app uses name and logoUrl; team-specific theme colors are no longer used.
-- Deliberately omit CASCADE: unexpected dependencies must stop the cleanup.
begin;
alter table public.teams drop column if exists "primaryColor";
alter table public.teams drop column if exists "secondaryColor";
notify pgrst, 'reload schema';
commit;
