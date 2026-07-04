-- Resultado esperado: zero em todas as linhas operacionais e tipos_custo > 0.
select 'origens' as item, count(*) as total from public.origens
union all select 'pecas', count(*) from public.pecas
union all select 'entradas_estoque', count(*) from public.entradas_estoque
union all select 'estoque_disponivel', coalesce(sum(quantidade_total - quantidade_consumida), 0) from public.entradas_estoque
union all select 'vendas', count(*) from public.vendas
union all select 'consumos_fifo', count(*) from public.venda_consumos_estoque
union all select 'custos_peca_operacionais', count(*) from public.custos_peca
union all select 'custos_venda_operacionais', count(*) from public.custos_venda
order by item;

-- Catálogo preservado: esperado atualmente = 6.
select 'tipos_custo_preservados' as item, count(*) as total
from public.tipos_custo;

