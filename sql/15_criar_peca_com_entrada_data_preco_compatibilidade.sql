-- criar_peca_com_entrada com 3 parâmetros novos, todos OPCIONAIS (aprovado por Rafael em 2026-09-24):
--   p_data_entrada     date    -> data da entrada de estoque; sem ele, data da compra da origem (como antes);
--   p_preco_venda      numeric -> preço de venda da peça (pecas.preco_sugerido); sem ele, 0 (como antes);
--   p_compatibilidade  text    -> pecas.compatibilidade (sql/14); sem ele, nulo (como antes).
-- Chamadas antigas, com os 7 parâmetros de sempre, continuam funcionando igual.
-- Peça, entrada, preço e compatibilidade são gravados na mesma função: ou salva tudo, ou nada.
--
-- Por que drop + create: acrescentar parâmetros muda a assinatura. Só com "create or replace" o banco
-- ficaria com duas versões e a chamada antiga ficaria ambígua ("function is not unique").
-- O drop e o create rodam na mesma transação, então não existe momento sem a função.
-- Continua SECURITY INVOKER (padrão): quem chama passa pelas políticas RLS das tabelas (sql/12).

begin;

drop function if exists public.criar_peca_com_entrada(
  text,
  text,
  bigint,
  integer,
  numeric,
  text,
  text
);

create function public.criar_peca_com_entrada(
  p_sku text,
  p_nome text,
  p_origem_id bigint,
  p_quantidade integer,
  p_valor_atribuido numeric,
  p_imagem_url text default null,
  p_observacoes text default null,
  p_data_entrada date default null,
  p_preco_venda numeric default null,
  p_compatibilidade text default null
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
  v_data_compra date;
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

  if p_preco_venda is not null and p_preco_venda < 0 then
    raise exception 'O preco de venda deve ser maior ou igual a zero.';
  end if;

  select data_compra
  into v_data_compra
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
    compatibilidade,
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
    coalesce(p_preco_venda, 0),
    nullif(trim(coalesce(p_compatibilidade, '')), ''),
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
    coalesce(p_data_entrada, v_data_compra, current_date)
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

commit;

notify pgrst, 'reload schema';
