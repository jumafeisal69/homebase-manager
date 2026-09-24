-- Roles here describe which dashboard a user sees; every data policy is
-- scoped by owner_id / manages_property / my_tenant_id, so no policy grants
-- extra access based on the role value itself.
drop policy if exists "claim own role" on public.user_roles;
create policy "claim own role" on public.user_roles for insert to authenticated
  with check (user_id = auth.uid());