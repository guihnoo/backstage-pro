-- Bucket público para fotos de horas, recibos e anexos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'backstage',
  'backstage',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública (URLs em photo_url / receipt_url)
drop policy if exists "backstage_public_read" on storage.objects;
create policy "backstage_public_read"
  on storage.objects for select
  using (bucket_id = 'backstage');

-- Upload apenas na pasta do próprio usuário: {user_id}/...
drop policy if exists "backstage_user_insert" on storage.objects;
create policy "backstage_user_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'backstage'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "backstage_user_update" on storage.objects;
create policy "backstage_user_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'backstage'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "backstage_user_delete" on storage.objects;
create policy "backstage_user_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'backstage'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
