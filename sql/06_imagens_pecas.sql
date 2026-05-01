alter table public.pecas
add column if not exists imagem_url text;

insert into storage.buckets (id, name, public)
values ('pecas', 'pecas', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Leitura publica das imagens das pecas" on storage.objects;
create policy "Leitura publica das imagens das pecas"
on storage.objects
for select
using (bucket_id = 'pecas');

drop policy if exists "Upload publico das imagens das pecas" on storage.objects;
create policy "Upload publico das imagens das pecas"
on storage.objects
for insert
with check (bucket_id = 'pecas');
