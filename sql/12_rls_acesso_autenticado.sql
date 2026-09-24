-- Migration aplicada no Supabase (projeto Autopp) em 2026-09-24:
-- version 20260924165649, name "ativar_rls_acesso_autenticado".
-- Copiada de supabase_migrations.schema_migrations para ficar versionada no repositorio.

-- Ativa RLS nas 8 tabelas publicas sem protecao, com politica simples:
-- so usuario autenticado (logado) pode ler/escrever. Acesso anonimo bloqueado.
-- Adequado para uso de um unico usuario hoje; sera revisado se o sistema
-- virar multi-cliente (cada politica precisaria filtrar por loja/tenant).

do $$
declare
  t text;
begin
  foreach t in array array[
    'entradas_estoque', 'custos_peca', 'vendas', 'pecas',
    'origens', 'venda_consumos_estoque', 'custos_venda', 'tipos_custo'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "acesso_autenticado_total" on public.%I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
