-- PERIGO: apaga todos os dados operacionais do ERP.
-- NÃO EXECUTAR sem confirmação explícita e backup validado.
-- Preserva public.tipos_custo, funções/RPCs, FIFO, views e estrutura.

begin;

-- Filhos antes dos pais, conforme as FKs reais.
delete from public.venda_consumos_estoque;
delete from public.custos_venda;
delete from public.vendas;
delete from public.custos_peca;
delete from public.entradas_estoque;
delete from public.pecas;
delete from public.origens;

-- Reinicia somente os identificadores das tabelas operacionais.
select setval(pg_get_serial_sequence('public.venda_consumos_estoque', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.custos_venda', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.vendas', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.custos_peca', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.entradas_estoque', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.pecas', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.origens', 'id'), 1, false);

-- Falha e desfaz a transação se algum dado operacional permanecer.
do $$
begin
  if exists (
    select 1 from public.origens
    union all select 1 from public.pecas
    union all select 1 from public.entradas_estoque
    union all select 1 from public.vendas
    union all select 1 from public.venda_consumos_estoque
    union all select 1 from public.custos_peca
    union all select 1 from public.custos_venda
  ) then
    raise exception 'Limpeza incompleta; transação será desfeita.';
  end if;
end $$;

commit;

