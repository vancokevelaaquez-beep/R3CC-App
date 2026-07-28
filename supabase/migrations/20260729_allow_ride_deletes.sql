-- Run this once in the Supabase SQL editor for existing databases.
-- `schema.sql` is only used when creating a new database; it does not update
-- an already deployed project.
drop policy if exists "rides delete own or admin" on public.rides;
create policy "rides delete own or admin"
  on public.rides for delete
  using (user_id = auth.uid() or public.is_admin());

create or replace function public.delete_ride(target_ride_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to delete a ride';
  end if;

  delete from public.rides
  where id = target_ride_id
    and (user_id = auth.uid() or public.is_admin());

  return found;
end;
$$;

grant execute on function public.delete_ride(uuid) to authenticated;

-- Storage for optional ride photos.
insert into storage.buckets (id, name, public)
values ('ride-photos', 'ride-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "ride photos public read" on storage.objects;
create policy "ride photos public read" on storage.objects for select using (bucket_id = 'ride-photos');
drop policy if exists "ride photos member upload" on storage.objects;
create policy "ride photos member upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'ride-photos' and (storage.foldername(name))[1] = auth.uid()::text);
