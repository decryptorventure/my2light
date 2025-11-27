-- Create storage buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy for videos: Anyone can view
create policy "Public Videos"
  on storage.objects for select
  using ( bucket_id = 'videos' );

-- Policy for videos: Authenticated users can upload
create policy "Authenticated Users Upload Videos"
  on storage.objects for insert
  with check ( bucket_id = 'videos' and auth.role() = 'authenticated' );

-- Policy for avatars: Anyone can view
create policy "Public Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy for avatars: Authenticated users can upload
create policy "Authenticated Users Upload Avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
