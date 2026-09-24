-- Migration aplicada no Supabase (projeto Autopp) em 2026-09-24:
-- version 20260924170101, name "restringir_upload_bucket_pecas_autenticado".
-- Copiada de supabase_migrations.schema_migrations para ficar versionada no repositorio.

-- Leitura publica das imagens continua liberada (necessario para exibir
-- fotos de peca no site para visitantes/compradores nao logados).
-- Upload passa a exigir autenticacao - hoje qualquer pessoa sem login
-- podia enviar arquivo arbitrario para o bucket "pecas".

drop policy "Upload publico das imagens das pecas" on storage.objects;

create policy "Upload autenticado das imagens das pecas"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'pecas');
