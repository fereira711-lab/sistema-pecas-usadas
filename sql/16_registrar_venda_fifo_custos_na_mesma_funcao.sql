-- registrar_venda_fifo com os custos da venda (e a observação) na mesma função
-- (aprovado por Rafael em 2026-09-24). Parâmetros novos, todos OPCIONAIS:
--   p_custos      jsonb -> lista de custos da venda: [{"tipo_custo_id": 5, "valor": 25.00}, ...];
--   p_observacoes text  -> observação da venda (antes era gravada num segundo passo, pela tela).
-- Sem eles, o comportamento é idêntico ao anterior (inclusive os parâmetros antigos p_custo_embalagem,
-- p_custo_comissao, p_custo_frete e p_custo_outros, mantidos para nenhuma chamada existente quebrar).
--
-- Venda, baixa FIFO, custos e observação na mesma transação: ou grava tudo, ou nada.
-- Cada custo da lista é validado ANTES de gravar a venda:
--   - valor numérico e maior ou igual a zero (valor 0 é ignorado, como na tela);
--   - tipo de custo existente, ativo e da categoria "venda" ou "ambos".
-- O custo é gravado com o nome do tipo (tipo_custo e descricao), o tipo_custo_id e a data da venda.
--
-- Por que drop + create: acrescentar parâmetros muda a assinatura. Só com "create or replace" o banco
-- ficaria com duas versões e a chamada antiga ficaria ambígua ("function is not unique").
-- O drop e o create rodam na mesma transação, então não existe momento sem a função.
-- Continua SECURITY INVOKER (padrão): quem chama passa pelas políticas RLS das tabelas (sql/12).
-- A função antiga public.registrar_venda (sem FIFO, sem uso na interface) não é alterada.

begin;

drop function if exists public.registrar_venda_fifo(
  bigint,
  integer,
  numeric,
  text,
  date,
  numeric,
  numeric,
  numeric,
  numeric
);

create function public.registrar_venda_fifo(
  p_peca_id bigint,
  p_quantidade integer,
  p_valor_unitario numeric,
  p_canal_venda text default null,
  p_data_venda date default current_date,
  p_custo_embalagem numeric default 0,
  p_custo_comissao numeric default 0,
  p_custo_frete numeric default 0,
  p_custo_outros numeric default 0,
  p_custos jsonb default null,
  p_observacoes text default null
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
  v_custo jsonb;
  v_tipo record;
  v_tipo_id bigint;
  v_valor numeric;
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

  -- Custos da venda: valida a lista inteira antes de gravar qualquer coisa.
  if p_custos is not null then
    if jsonb_typeof(p_custos) <> 'array' then
      raise exception 'Os custos da venda devem ser uma lista.';
    end if;

    for v_custo in select value from jsonb_array_elements(p_custos)
    loop
      begin
        v_tipo_id := (v_custo ->> 'tipo_custo_id')::bigint;
        v_valor := (v_custo ->> 'valor')::numeric;
      exception
        when others then
          raise exception 'Custo da venda invalido: %.', v_custo;
      end;

      if v_valor is null or v_valor < 0 then
        raise exception 'O valor do custo da venda deve ser maior ou igual a zero.';
      end if;

      select id, nome, ativo, categoria
      into v_tipo
      from public.tipos_custo
      where id = v_tipo_id;

      if not found then
        raise exception 'Tipo de custo % nao encontrado.', v_tipo_id;
      end if;

      if not v_tipo.ativo then
        raise exception 'O tipo de custo "%" esta inativo.', v_tipo.nome;
      end if;

      if v_tipo.categoria not in ('venda', 'ambos') then
        raise exception 'O tipo de custo "%" nao e da categoria de venda.', v_tipo.nome;
      end if;
    end loop;
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
    data_venda,
    observacoes
  )
  values (
    p_peca_id,
    p_quantidade,
    p_valor_unitario,
    p_quantidade * p_valor_unitario,
    nullif(trim(coalesce(p_canal_venda, '')), ''),
    coalesce(p_data_venda, current_date),
    nullif(trim(coalesce(p_observacoes, '')), '')
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

  -- Custos da lista (já validados acima), com o nome e o id do tipo, na data da venda.
  if p_custos is not null then
    insert into public.custos_venda (venda_id, tipo_custo, tipo_custo_id, descricao, valor, data_custo)
    select
      v_venda_id,
      t.nome,
      t.id,
      t.nome,
      (c.value ->> 'valor')::numeric,
      coalesce(p_data_venda, current_date)
    from jsonb_array_elements(p_custos) with ordinality as c(value, ordem)
    join public.tipos_custo t on t.id = (c.value ->> 'tipo_custo_id')::bigint
    where (c.value ->> 'valor')::numeric > 0
    order by c.ordem;
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

commit;

notify pgrst, 'reload schema';
