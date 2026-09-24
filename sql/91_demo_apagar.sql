-- Apaga SOMENTE o conjunto de demonstração carregado por sql/90_demo_carregar.sql.
-- Não mexe em tipos_custo, Auth, Storage, funções, views nem nas sequências dos IDs.
--
-- Trava de segurança (se qualquer item falhar, nada é apagado):
--   1. Devem existir exatamente 3 origens marcadas com '[DEMO]'.
--   2. Toda peça dessas origens precisa ter SKU 'DM-' (se alguém cadastrou uma peça real
--      numa origem de demonstração, o script para).
--   3. Toda peça com SKU 'DM-' precisa estar numa origem de demonstração.
--   4. Toda entrada ligada a uma origem de demonstração precisa ser de uma peça de demonstração.
--   5. Todo consumo de uma entrada de demonstração precisa ser de uma venda de demonstração.
--   6. No fim, nada marcado pode sobrar.
-- Vendas e custos que forem lançados pela tela em peças de demonstração (durante uma conferência)
-- também são apagados, porque pertencem a essas peças.

begin;

do $$
declare
  v_origens bigint[];
  v_pecas bigint[];
  v_entradas bigint[];
  v_vendas bigint[];
begin
  select coalesce(array_agg(id), '{}') into v_origens from public.origens where observacoes like '[DEMO]%';

  if cardinality(v_origens) = 0 then
    raise notice 'Nenhum dado de demonstração encontrado. Nada foi apagado.';
    return;
  end if;

  if cardinality(v_origens) <> 3 then
    raise exception 'Trava: esperadas 3 origens de demonstração, encontradas %. Nada foi apagado.', cardinality(v_origens);
  end if;

  if exists (select 1 from public.pecas where origem_id = any (v_origens) and coalesce(sku, '') not like 'DM-%') then
    raise exception 'Trava: há peça sem SKU de demonstração ligada a uma origem de demonstração. Nada foi apagado.';
  end if;

  if exists (select 1 from public.pecas where sku like 'DM-%' and not (origem_id = any (v_origens))) then
    raise exception 'Trava: há peça com SKU de demonstração fora das origens de demonstração. Nada foi apagado.';
  end if;

  select coalesce(array_agg(id), '{}') into v_pecas from public.pecas where origem_id = any (v_origens);
  select coalesce(array_agg(id), '{}') into v_entradas from public.entradas_estoque where peca_id = any (v_pecas);
  select coalesce(array_agg(id), '{}') into v_vendas from public.vendas where peca_id = any (v_pecas);

  if exists (select 1 from public.entradas_estoque where origem_id = any (v_origens) and not (peca_id = any (v_pecas))) then
    raise exception 'Trava: há entrada de outra peça ligada a uma origem de demonstração. Nada foi apagado.';
  end if;

  if exists (select 1 from public.venda_consumos_estoque where entrada_estoque_id = any (v_entradas) and not (venda_id = any (v_vendas))) then
    raise exception 'Trava: há venda de fora consumindo estoque de demonstração. Nada foi apagado.';
  end if;

  -- Filhos antes dos pais, conforme as FKs.
  delete from public.venda_consumos_estoque where venda_id = any (v_vendas);
  delete from public.custos_venda where venda_id = any (v_vendas);
  delete from public.vendas where id = any (v_vendas);
  delete from public.custos_peca where peca_id = any (v_pecas);
  delete from public.entradas_estoque where id = any (v_entradas);
  delete from public.pecas where id = any (v_pecas);
  delete from public.origens where id = any (v_origens);

  if exists (select 1 from public.origens where observacoes like '[DEMO]%')
     or exists (select 1 from public.pecas where sku like 'DM-%') then
    raise exception 'Trava: sobraram registros de demonstração; tudo será desfeito.';
  end if;

  raise notice 'Demonstração apagada: % origens, % peças, % entradas, % vendas.',
    cardinality(v_origens), cardinality(v_pecas), cardinality(v_entradas), cardinality(v_vendas);
end $$;

-- O que sobrou no banco (dados reais, se houver) e os tipos de custo preservados.
select
  (select count(*) from public.origens) as origens,
  (select count(*) from public.pecas) as pecas,
  (select count(*) from public.entradas_estoque) as entradas,
  (select count(*) from public.vendas) as vendas,
  (select count(*) from public.tipos_custo) as tipos_custo,
  (select count(*) from public.tipos_custo where ativo) as tipos_custo_ativos;

commit;
