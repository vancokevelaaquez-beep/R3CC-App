alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists birthday date;
alter table public.profiles add column if not exists location text;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

drop policy if exists "profile images public read" on storage.objects;
create policy "profile images public read" on storage.objects for select using (bucket_id = 'profile-images');
drop policy if exists "profile images owner upload" on storage.objects;
create policy "profile images owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
