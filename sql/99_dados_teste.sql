-- Massa de dados realista para testar estoque, FIFO, vendas, custos e analises.
-- ATENCAO: este script apaga os dados operacionais atuais antes de recriar os cenarios.

delete from public.venda_consumos_estoque;
delete from public.custos_venda;
delete from public.vendas;
delete from public.custos_peca;
delete from public.entradas_estoque;
delete from public.pecas;
delete from public.origens;

do $$
declare
  v_origem_farol bigint;
  v_origem_gol bigint;
  v_origem_retrovisor_lote bigint;
  v_origem_retrovisor_reforco bigint;
  v_origem_moldura bigint;
  v_origem_radiador bigint;
  v_origem_volante bigint;

  v_peca_farol bigint;
  v_peca_parachoque bigint;
  v_peca_retrovisor bigint;
  v_peca_moldura bigint;
  v_peca_radiador bigint;
  v_peca_volante bigint;
begin
  insert into public.origens (
    tipo_origem,
    tipo,
    descricao,
    custo_total,
    custo_tipo,
    produto_sku,
    quantidade_total,
    data_entrada,
    valor_pago,
    data_compra,
    observacoes
  )
  values ('Compra avulsa', 'Compra avulsa', 'Compra avulsa - farois Fiat Uno 2012', 450.00, 'compra', 'FAR-UNO-001', 3, '2026-04-01', 450.00, '2026-04-01', 'Cenario de origem com lucro.')
  returning id into v_origem_farol;

  insert into public.origens (
    tipo_origem, tipo, descricao, custo_total, custo_tipo, produto_sku,
    quantidade_total, data_entrada, valor_pago, data_compra, observacoes
  )
  values ('Carro para desmonte', 'Carro para desmonte', 'Gol G5 2011 para desmonte', 900.00, 'compra', 'PAR-GOL-001', 2, '2026-04-03', 900.00, '2026-04-03', 'Cenario de origem com prejuizo.')
  returning id into v_origem_gol;

  insert into public.origens (
    tipo_origem, tipo, descricao, custo_total, custo_tipo, produto_sku,
    quantidade_total, data_entrada, valor_pago, data_compra, observacoes
  )
  values ('Lote', 'Lote', 'Lote inicial de retrovisores Civic 2010', 600.00, 'compra', 'RET-CIV-001', 5, '2026-04-05', 600.00, '2026-04-05', 'Primeira entrada do SKU RET-CIV-001.')
  returning id into v_origem_retrovisor_lote;

  insert into public.origens (
    tipo_origem, tipo, descricao, custo_total, custo_tipo, produto_sku,
    quantidade_total, data_entrada, valor_pago, data_compra, observacoes
  )
  values ('Compra avulsa', 'Compra avulsa', 'Reforco de estoque - retrovisores Civic 2010', 560.00, 'compra', 'RET-CIV-001', 4, '2026-04-18', 560.00, '2026-04-18', 'Segunda entrada do mesmo SKU para testar FIFO.')
  returning id into v_origem_retrovisor_reforco;

  insert into public.origens (
    tipo_origem, tipo, descricao, custo_total, custo_tipo, produto_sku,
    quantidade_total, data_entrada, valor_pago, data_compra, observacoes
  )
  values ('Lote', 'Lote', 'Lote pequeno - molduras Corolla 2014', 180.00, 'compra', 'MIL-COR-001', 3, '2026-04-08', 180.00, '2026-04-08', 'Cenario de estoque baixo apos venda.')
  returning id into v_origem_moldura;

  insert into public.origens (
    tipo_origem, tipo, descricao, custo_total, custo_tipo, produto_sku,
    quantidade_total, data_entrada, valor_pago, data_compra, observacoes
  )
  values ('Compra avulsa', 'Compra avulsa', 'Radiadores Celta 2009', 500.00, 'compra', 'RAD-CEL-001', 2, '2026-04-10', 500.00, '2026-04-10', 'Cenario de produto sem estoque.')
  returning id into v_origem_radiador;

  insert into public.origens (
    tipo_origem, tipo, descricao, custo_total, custo_tipo, produto_sku,
    quantidade_total, data_entrada, valor_pago, data_compra, observacoes
  )
  values ('Lote', 'Lote', 'Volantes Fiesta 2013 sem venda', 320.00, 'compra', 'VOL-FIE-001', 4, '2026-04-12', 320.00, '2026-04-12', 'Cenario de produto sem venda.')
  returning id into v_origem_volante;

  insert into public.pecas (
    origem_id,
    nome_peca,
    sku,
    custo_atribuido,
    tipo_custo_atribuido,
    preco_sugerido,
    status,
    preparada,
    observacoes,
    custo_total,
    custo,
    quantidade,
    quantidade_vendida
  )
  values (v_origem_farol, 'Farol esquerdo Fiat Uno 2012', 'FAR-UNO-001', 450.00, 'real', 350.00, 'em_estoque', true, 'Compra avulsa com boa margem.', 450.00, 450.00, 3, 0)
  returning id into v_peca_farol;

  insert into public.pecas (
    origem_id, nome_peca, sku, custo_atribuido, tipo_custo_atribuido,
    preco_sugerido, status, preparada, observacoes, custo_total, custo,
    quantidade, quantidade_vendida
  )
  values (v_origem_gol, 'Parachoque dianteiro Gol G5 2011', 'PAR-GOL-001', 900.00, 'real', 300.00, 'em_estoque', true, 'Cenario de margem negativa.', 900.00, 900.00, 2, 0)
  returning id into v_peca_parachoque;

  insert into public.pecas (
    origem_id, nome_peca, sku, custo_atribuido, tipo_custo_atribuido,
    preco_sugerido, status, preparada, observacoes, custo_total, custo,
    quantidade, quantidade_vendida
  )
  values (v_origem_retrovisor_lote, 'Retrovisor direito Honda Civic 2010', 'RET-CIV-001', 1160.00, 'real', 220.00, 'em_estoque', true, 'Mesmo SKU com duas entradas diferentes.', 1160.00, 1160.00, 9, 0)
  returning id into v_peca_retrovisor;

  insert into public.pecas (
    origem_id, nome_peca, sku, custo_atribuido, tipo_custo_atribuido,
    preco_sugerido, status, preparada, observacoes, custo_total, custo,
    quantidade, quantidade_vendida
  )
  values (v_origem_moldura, 'Moldura interna Corolla 2014', 'MIL-COR-001', 180.00, 'real', 110.00, 'em_estoque', false, 'Estoque baixo apos venda parcial.', 180.00, 180.00, 3, 0)
  returning id into v_peca_moldura;

  insert into public.pecas (
    origem_id, nome_peca, sku, custo_atribuido, tipo_custo_atribuido,
    preco_sugerido, status, preparada, observacoes, custo_total, custo,
    quantidade, quantidade_vendida
  )
  values (v_origem_radiador, 'Radiador Chevrolet Celta 2009', 'RAD-CEL-001', 500.00, 'real', 380.00, 'em_estoque', true, 'Produto ficara sem estoque apos venda.', 500.00, 500.00, 2, 0)
  returning id into v_peca_radiador;

  insert into public.pecas (
    origem_id, nome_peca, sku, custo_atribuido, tipo_custo_atribuido,
    preco_sugerido, status, preparada, observacoes, custo_total, custo,
    quantidade, quantidade_vendida
  )
  values (v_origem_volante, 'Volante Ford Fiesta 2013', 'VOL-FIE-001', 320.00, 'real', 170.00, 'em_estoque', false, 'Produto sem venda para alertas e giro.', 320.00, 320.00, 4, 0)
  returning id into v_peca_volante;

  insert into public.entradas_estoque (
    peca_id,
    origem_id,
    quantidade_total,
    quantidade_consumida,
    custo_unitario,
    data_entrada
  )
  values
    (v_peca_farol, v_origem_farol, 3, 0, 150.00, '2026-04-01'),
    (v_peca_parachoque, v_origem_gol, 2, 0, 450.00, '2026-04-03'),
    (v_peca_retrovisor, v_origem_retrovisor_lote, 5, 0, 120.00, '2026-04-05'),
    (v_peca_retrovisor, v_origem_retrovisor_reforco, 4, 0, 140.00, '2026-04-18'),
    (v_peca_moldura, v_origem_moldura, 3, 0, 60.00, '2026-04-08'),
    (v_peca_radiador, v_origem_radiador, 2, 0, 250.00, '2026-04-10'),
    (v_peca_volante, v_origem_volante, 4, 0, 80.00, '2026-04-12');

  insert into public.custos_peca (peca_id, tipo_custo, descricao, valor, data_custo)
  values
    (v_peca_farol, 'limpeza', 'Limpeza e polimento do farol', 35.00, '2026-04-02'),
    (v_peca_farol, 'embalagem', 'Embalagem reforcada para armazenagem', 20.00, '2026-04-02'),
    (v_peca_parachoque, 'reparo', 'Solda plastica e pintura parcial', 85.00, '2026-04-04'),
    (v_peca_retrovisor, 'limpeza', 'Limpeza do lote de retrovisores', 60.00, '2026-04-06'),
    (v_peca_moldura, 'preparo', 'Higienizacao e etiqueta', 18.00, '2026-04-09'),
    (v_peca_radiador, 'teste', 'Teste de pressao', 45.00, '2026-04-11'),
    (v_peca_volante, 'limpeza', 'Limpeza simples do lote sem venda', 25.00, '2026-04-13');

  perform public.registrar_venda_fifo(
    v_peca_farol,
    2,
    350.00,
    'Mercado Livre',
    '2026-04-22',
    18.00,
    21.00,
    35.00,
    0
  );

  perform public.registrar_venda_fifo(
    v_peca_parachoque,
    1,
    300.00,
    'Balcao',
    '2026-04-23',
    12.00,
    0,
    0,
    15.00
  );

  perform public.registrar_venda_fifo(
    v_peca_retrovisor,
    6,
    220.00,
    'Shopee',
    '2026-04-24',
    24.00,
    66.00,
    40.00,
    0
  );

  perform public.registrar_venda_fifo(
    v_peca_moldura,
    2,
    110.00,
    'Instagram',
    '2026-04-25',
    8.00,
    11.00,
    0,
    0
  );

  perform public.registrar_venda_fifo(
    v_peca_radiador,
    2,
    380.00,
    'WhatsApp',
    '2026-04-29',
    20.00,
    38.00,
    45.00,
    10.00
  );

  perform public.registrar_venda_fifo(
    v_peca_farol,
    1,
    360.00,
    'Balcao',
    '2026-04-30',
    10.00,
    0,
    0,
    0
  );
end;
$$;
