-- Funcao de venda com consumo FIFO.
-- Mantem a funcao antiga registrar_venda sem alteracao.
-- No PostgreSQL, a funcao roda dentro da transacao da chamada.
-- Se qualquer erro acontecer, venda, consumos e atualizacoes sao desfeitos juntos.

drop function if exists public.registrar_venda_fifo(
  bigint,
  integer,
  numeric,
  text,
  numeric,
  numeric,
  numeric,
  numeric
);

create or replace function public.registrar_venda_fifo(
  p_peca_id bigint,
  p_quantidade integer,
  p_valor_unitario numeric,
  p_canal_venda text default null,
  p_data_venda date default current_date,
  p_custo_embalagem numeric default 0,
  p_custo_comissao numeric default 0,
  p_custo_frete numeric default 0,
  p_custo_outros numeric default 0
)
returns bigint
language plpgsql
as $$
declare
  v_peca record;
  v_venda_id bigint;
  v_quantidade_restante integer;
  v_quantidade_consumir integer;
  v_quantidade_disponivel integer;
  v_quantidade_atualizada integer;
  v_custo_total_fifo numeric(12, 2) := 0;
  v_entrada record;
begin
  if p_peca_id is null or p_peca_id <= 0 then
    raise exception 'Peca invalida para venda FIFO.';
  end if;

  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'A quantidade vendida deve ser maior que zero.';
  end if;

  if p_valor_unitario is null or p_valor_unitario < 0 then
    raise exception 'O valor unitario deve ser maior ou igual a zero.';
  end if;

  select id, quantidade, quantidade_vendida
  into v_peca
  from public.pecas
  where id = p_peca_id
  for update;

  if not found then
    raise exception 'Peca % nao encontrada.', p_peca_id;
  end if;

  if (v_peca.quantidade - v_peca.quantidade_vendida) < p_quantidade then
    raise exception 'Quantidade vendida maior que o estoque disponivel da peca.';
  end if;

  if (
    select coalesce(sum(quantidade_total - quantidade_consumida), 0)
    from public.entradas_estoque
    where peca_id = p_peca_id
      and quantidade_consumida < quantidade_total
  ) < p_quantidade then
    raise exception 'Estoque FIFO insuficiente para a peca %. Verifique as entradas de estoque.', p_peca_id;
  end if;

  insert into public.vendas (
    peca_id,
    quantidade_vendida,
    valor_unitario,
    valor_total,
    canal_venda,
    data_venda
  )
  values (
    p_peca_id,
    p_quantidade,
    p_valor_unitario,
    p_quantidade * p_valor_unitario,
    nullif(trim(coalesce(p_canal_venda, '')), ''),
    coalesce(p_data_venda, current_date)
  )
  returning id into v_venda_id;

  v_quantidade_restante := p_quantidade;

  for v_entrada in
    select
      id,
      quantidade_total,
      quantidade_consumida,
      custo_unitario
    from public.entradas_estoque
    where peca_id = p_peca_id
      and quantidade_consumida < quantidade_total
    order by data_entrada, id
    for update
  loop
    exit when v_quantidade_restante <= 0;

    v_quantidade_disponivel := v_entrada.quantidade_total - v_entrada.quantidade_consumida;
    v_quantidade_consumir := least(v_quantidade_restante, v_quantidade_disponivel);

    update public.entradas_estoque
    set quantidade_consumida = quantidade_consumida + v_quantidade_consumir
    where id = v_entrada.id;

    insert into public.venda_consumos_estoque (
      venda_id,
      entrada_estoque_id,
      quantidade_consumida,
      custo_unitario,
      custo_total
    )
    values (
      v_venda_id,
      v_entrada.id,
      v_quantidade_consumir,
      v_entrada.custo_unitario,
      v_quantidade_consumir * v_entrada.custo_unitario
    );

    v_custo_total_fifo := v_custo_total_fifo + (v_quantidade_consumir * v_entrada.custo_unitario);
    v_quantidade_restante := v_quantidade_restante - v_quantidade_consumir;
  end loop;

  if v_quantidade_restante > 0 then
    raise exception 'Estoque FIFO insuficiente durante o consumo da venda.';
  end if;

  if coalesce(p_custo_embalagem, 0) > 0 then
    insert into public.custos_venda (venda_id, tipo_custo, descricao, valor)
    values (v_venda_id, 'embalagem', 'Custo de embalagem', p_custo_embalagem);
  end if;

  if coalesce(p_custo_comissao, 0) > 0 then
    insert into public.custos_venda (venda_id, tipo_custo, descricao, valor)
    values (v_venda_id, 'comissao', 'Custo de comissao', p_custo_comissao);
  end if;

  if coalesce(p_custo_frete, 0) > 0 then
    insert into public.custos_venda (venda_id, tipo_custo, descricao, valor)
    values (v_venda_id, 'frete', 'Custo de frete', p_custo_frete);
  end if;

  if coalesce(p_custo_outros, 0) > 0 then
    insert into public.custos_venda (venda_id, tipo_custo, descricao, valor)
    values (v_venda_id, 'outros', 'Outros custos da venda', p_custo_outros);
  end if;

  v_quantidade_atualizada := v_peca.quantidade_vendida + p_quantidade;

  update public.pecas
  set
    quantidade_vendida = v_quantidade_atualizada,
    status = case
      when v_quantidade_atualizada >= quantidade then 'vendida'
      else 'em_estoque'
    end
  where id = p_peca_id;

  return v_venda_id;
end;
$$;
