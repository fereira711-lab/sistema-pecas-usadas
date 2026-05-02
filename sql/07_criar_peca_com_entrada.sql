-- Cadastro transacional de peca com entrada de estoque.
-- Mantem o fluxo atual do sistema, mas garante atomicidade no banco:
-- 1. insere a peca
-- 2. cria a entrada de estoque
-- 3. atualiza a quantidade final da peca
-- Se qualquer etapa falhar, a chamada inteira e desfeita.

drop function if exists public.criar_peca_com_entrada(
  text,
  text,
  bigint,
  integer,
  numeric,
  text,
  text
);

create or replace function public.criar_peca_com_entrada(
  p_sku text,
  p_nome text,
  p_origem_id bigint,
  p_quantidade integer,
  p_valor_atribuido numeric,
  p_imagem_url text default null,
  p_observacoes text default null
)
returns table (
  peca_id bigint,
  entrada_id bigint
)
language plpgsql
as $$
declare
  v_peca_id bigint;
  v_entrada_id bigint;
  v_custo_unitario numeric(12, 2);
  v_data_entrada date;
begin
  if p_origem_id is null or p_origem_id <= 0 then
    raise exception 'Origem invalida para criar a peca.';
  end if;

  if coalesce(trim(p_nome), '') = '' then
    raise exception 'Nome da peca obrigatorio.';
  end if;

  if coalesce(trim(p_sku), '') = '' then
    raise exception 'SKU da peca obrigatorio.';
  end if;

  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'A quantidade da entrada deve ser maior que zero.';
  end if;

  if p_valor_atribuido is null then
    p_valor_atribuido := 0;
  end if;

  if p_valor_atribuido < 0 then
    raise exception 'O valor atribuido deve ser maior ou igual a zero.';
  end if;

  select data_compra
  into v_data_entrada
  from public.origens
  where id = p_origem_id;

  if not found then
    raise exception 'Origem % nao encontrada.', p_origem_id;
  end if;

  v_custo_unitario := round((p_valor_atribuido / p_quantidade)::numeric, 2);

  insert into public.pecas (
    origem_id,
    nome_peca,
    sku,
    quantidade,
    quantidade_vendida,
    status,
    custo_total,
    custo,
    custo_atribuido,
    tipo_custo_atribuido,
    preco_sugerido,
    imagem_url,
    preparada,
    observacoes
  )
  values (
    p_origem_id,
    trim(p_nome),
    trim(upper(p_sku)),
    0,
    0,
    'em_estoque',
    v_custo_unitario,
    v_custo_unitario,
    v_custo_unitario,
    'rateado',
    0,
    nullif(trim(coalesce(p_imagem_url, '')), ''),
    false,
    nullif(trim(coalesce(p_observacoes, '')), '')
  )
  returning id into v_peca_id;

  insert into public.entradas_estoque (
    peca_id,
    origem_id,
    quantidade_total,
    quantidade_consumida,
    custo_unitario,
    data_entrada
  )
  values (
    v_peca_id,
    p_origem_id,
    p_quantidade,
    0,
    v_custo_unitario,
    coalesce(v_data_entrada, current_date)
  )
  returning id into v_entrada_id;

  update public.pecas
  set
    quantidade = p_quantidade,
    status = case
      when p_quantidade > 0 then 'em_estoque'
      else 'vendida'
    end
  where id = v_peca_id;

  peca_id := v_peca_id;
  entrada_id := v_entrada_id;
  return next;

exception
  when others then
    raise exception 'Erro ao criar peca com entrada: %', sqlerrm;
end;
$$;

notify pgrst, 'reload schema';
