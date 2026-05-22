-- Add role to profiles
alter table public.profiles
  add column role text not null default 'user'
  check (role in ('user', 'admin'));

-- Admin bypass policy — admins can read all profiles
-- Role is set server-side only; the mobile client cannot write this column.
create policy "Admins read all profiles"
  on public.profiles for select
  using (auth.jwt() ->> 'role' = 'admin');

-- Prevent mobile clients from elevating their own role
create policy "Users cannot change role"
  on public.profiles for update
  using (auth.uid() = id)
  with check (role = 'user');
