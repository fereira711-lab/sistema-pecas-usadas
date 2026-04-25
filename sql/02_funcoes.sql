-- Registra uma venda de forma transacional.
-- Tudo que esta dentro da funcao roda em uma unica transacao no PostgreSQL.

create or replace function public.registrar_venda(
  p_peca_id bigint,
  p_quantidade_vendida integer,
  p_valor_unitario numeric,
  p_canal_venda text,
  p_custo_embalagem numeric,
  p_custo_comissao numeric,
  p_custo_frete numeric
)
returns bigint
language plpgsql
as $$
declare
  v_peca record;
  v_venda_id bigint;
  v_quantidade_atualizada integer;
begin
  if p_peca_id is null or p_peca_id <= 0 then
    raise exception 'Peca invalida para venda.';
  end if;

  if p_quantidade_vendida is null or p_quantidade_vendida <= 0 then
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

  if (v_peca.quantidade - v_peca.quantidade_vendida) < p_quantidade_vendida then
    raise exception 'Quantidade vendida maior que o estoque disponivel.';
  end if;

  insert into public.vendas (
    peca_id,
    quantidade_vendida,
    valor_unitario,
    canal_venda
  )
  values (
    p_peca_id,
    p_quantidade_vendida,
    p_valor_unitario,
    nullif(trim(p_canal_venda), '')
  )
  returning id into v_venda_id;

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

  v_quantidade_atualizada = v_peca.quantidade_vendida + p_quantidade_vendida;

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
