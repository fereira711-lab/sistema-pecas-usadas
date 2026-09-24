-- Conjunto fixo de dados de demonstração (desmanche de carros populares).
-- Usado nas conferências visuais do redesenho. Apagar com sql/91_demo_apagar.sql
-- (ou scripts\demo-apagar.bat), que remove só estes registros.
--
-- Marcação dos registros:
--   - origens: observacoes começa com '[DEMO]';
--   - peças: SKU começa com 'DM-' e a peça pertence a uma origem [DEMO];
--   - entradas, vendas, consumos e custos: ligados a essas peças.
--
-- As datas são relativas ao dia da carga (current_date), para que "parada há mais de 90 dias"
-- e "recém-comprada" continuem valendo em qualquer dia.
-- As vendas passam pela função oficial registrar_venda_fifo com os custos em p_custos (sql/16),
-- o mesmo caminho da tela: venda, baixa FIFO e custos na mesma transação.
-- Custos de peça (limpeza, pintura) entram direto em custos_peca com os mesmos campos que a tela
-- Custo de peça grava (tipo, id do tipo, descrição, valor e data).
-- Tipos de custo usados (precisam existir e estar ativos): Frete, Embalagem e Tarifa Mercado Livre
-- (categoria venda ou ambos) e Limpeza e Pintura (categoria peça ou ambos).
--
-- Resultado esperado (conferido à mão):
--   Onix  (R$ 3.200, já se pagou): receita R$ 5.120, custos da venda R$ 569, recuperado R$ 4.551;
--         custos nas peças R$ 90 (limpeza do painel, pintura da porta); resultado R$ 4.551 − 3.200 − 90 = R$ 1.261.
--   Gol   (R$ 2.600, pela metade): receita R$ 1.225, custos da venda R$ 178, recuperado R$ 1.047;
--         custo na peça R$ 40 (limpeza do cabeçote); faltam R$ 2.600 + 40 − 1.047 = R$ 1.593.
--   Lote  (R$ 1.800, recém-comprado): R$ 1.100 distribuídos, R$ 700 a distribuir; 1 venda.
--   Tarifa Mercado Livre (~11%) nas 5 vendas de Mercado Livre: R$ 403 no total.
--   Paradas +90 dias: 6 peças. Venda com prejuízo: bomba de combustível (−R$ 20).
--   Preço abaixo do custo: radiador (preço R$ 120, custo R$ 150).

begin;

do $$
declare
  v_hoje date := current_date;
  v_onix bigint;
  v_gol bigint;
  v_lote bigint;
  v_frete_id bigint;
  v_embalagem_id bigint;
  v_tarifa_ml_id bigint;
  v_limpeza_id bigint;
  v_pintura_id bigint;
  v_venda record;
  v_venda_id bigint;
begin
  -- Trava: não carregar duas vezes nem misturar com SKUs que já usam o prefixo.
  if exists (select 1 from public.origens where observacoes like '[DEMO]%')
     or exists (select 1 from public.pecas where sku like 'DM-%') then
    raise exception 'Já existem dados de demonstração. Rode sql/91_demo_apagar.sql antes de carregar de novo.';
  end if;

  select id into v_frete_id from public.tipos_custo where lower(nome) = 'frete' and ativo;
  select id into v_embalagem_id from public.tipos_custo where lower(nome) = 'embalagem' and ativo;
  select id into v_tarifa_ml_id from public.tipos_custo where lower(nome) = 'tarifa mercado livre' and ativo;
  if v_frete_id is null or v_embalagem_id is null or v_tarifa_ml_id is null then
    raise exception 'Os tipos de custo ativos "Frete", "Embalagem" e "Tarifa Mercado Livre" são necessários para a demonstração.';
  end if;

  select id into v_limpeza_id from public.tipos_custo where lower(nome) = 'limpeza' and ativo and categoria in ('peca', 'ambos');
  select id into v_pintura_id from public.tipos_custo where lower(nome) = 'pintura' and ativo and categoria in ('peca', 'ambos');
  if v_limpeza_id is null or v_pintura_id is null then
    raise exception 'Os tipos de custo ativos "Limpeza" e "Pintura" (categoria peça) são necessários para a demonstração.';
  end if;

  -- ---- Origens ----
  insert into public.origens (tipo_origem, tipo, descricao, custo_total, valor_pago, custo_tipo, data_compra, data_entrada, quantidade_total, observacoes)
  values ('Carro para desmonte', 'Carro para desmonte', 'Onix 1.4 LT 2015 prata', 3200, 3200, 'compra', v_hoje - 150, v_hoje - 150, 10,
          '[DEMO] Carro comprado de seguradora, motor batido.')
  returning id into v_onix;

  insert into public.origens (tipo_origem, tipo, descricao, custo_total, valor_pago, custo_tipo, data_compra, data_entrada, quantidade_total, observacoes)
  values ('Carro para desmonte', 'Carro para desmonte', 'Gol G5 1.0 2011 branco', 2600, 2600, 'compra', v_hoje - 120, v_hoje - 120, 10,
          '[DEMO] Desmontado em duas etapas.')
  returning id into v_gol;

  insert into public.origens (tipo_origem, tipo, descricao, custo_total, valor_pago, custo_tipo, data_compra, data_entrada, quantidade_total, observacoes)
  values ('Lote', 'Lote', 'Lote leilão – peças HB20, Palio e Uno', 1800, 1800, 'compra', v_hoje - 5, v_hoje - 5, 0,
          '[DEMO] Lote de leilão, ainda separando as peças.')
  returning id into v_lote;

  -- ---- Peças + entradas de estoque ----
  -- (origem, sku, nome, quantidade, custo unitário, preço, compatibilidade, dias atrás da entrada)
  create temporary table demo_pecas (
    origem_id bigint, sku text, nome text, quantidade integer, custo numeric(12, 2),
    preco numeric(12, 2), compatibilidade text, dias_entrada integer
  ) on commit drop;

  insert into demo_pecas values
    (v_onix, 'DM-ONX-01', 'Farol dianteiro esquerdo',          1, 280, 550,  'Onix 2013–2016; Prisma 2013–2016', 148),
    (v_onix, 'DM-ONX-02', 'Motor de partida',                  1, 320, 650,  'Onix 1.0/1.4 2012–2019; Prisma 1.4 2013–2019; Cobalt 1.4', 148),
    (v_onix, 'DM-ONX-03', 'Alternador 90A',                    1, 300, 600,  'Onix 1.0/1.4 2012–2019; Prisma 2013–2019; Spin 1.8', 148),
    (v_onix, 'DM-ONX-04', 'Porta dianteira direita completa',  1, 450, 900,  'Onix hatch 2013–2019', 148),
    (v_onix, 'DM-ONX-05', 'Câmbio manual 5 marchas',           1, 900, 1800, 'Onix 1.4 2012–2019; Prisma 1.4 2013–2019; Cobalt 1.4', 148),
    (v_onix, 'DM-ONX-06', 'Painel de instrumentos',            1, 180, 350,  'Onix LT 2013–2016', 148),
    (v_onix, 'DM-ONX-07', 'Roda de liga aro 15',               4, 80,  180,  'Onix, Prisma, Cobalt, Spin (4x100)', 148),
    (v_onix, 'DM-ONX-08', 'Módulo de injeção',                 1, 250, 500,  'Onix 1.4 SPE/4 2013–2016', 148),
    (v_onix, 'DM-ONX-09', 'Para-choque traseiro',              1, 100, 250,  'Onix hatch 2013–2016', 148),
    (v_onix, 'DM-ONX-10', 'Banco traseiro bipartido',          1, 100, 200,  'Onix hatch 2013–2019', 148),

    (v_gol,  'DM-GOL-01', 'Cabeçote 1.0 VHT',                  1, 400, 800,  'Gol, Voyage, Fox 1.0 VHT 2008–2013', 118),
    (v_gol,  'DM-GOL-02', 'Tampa traseira',                    1, 250, 450,  'Gol G5 2009–2012', 118),
    (v_gol,  'DM-GOL-03', 'Farol dianteiro direito',           1, 120, 260,  'Gol G5 2009–2012; Voyage G5', 45),
    (v_gol,  'DM-GOL-04', 'Radiador',                          1, 150, 120,  'Gol, Voyage, Saveiro G5 1.0/1.6 sem ar', 45),
    (v_gol,  'DM-GOL-05', 'Caixa de direção mecânica',         1, 300, 550,  'Gol G4/G5, Voyage, Saveiro 2006–2013', 118),
    (v_gol,  'DM-GOL-06', 'Bomba de combustível',              1, 180, 250,  'Gol, Voyage, Fox, Saveiro 1.0/1.6 Flex', 118),
    (v_gol,  'DM-GOL-07', 'Vidro da porta dianteira esquerda', 1, 80,  150,  'Gol G5 4 portas 2009–2012', 45),
    (v_gol,  'DM-GOL-08', 'Maçaneta externa',                  4, 25,  45,   'Gol G3/G4/G5, Parati, Saveiro', 118),
    (v_gol,  'DM-GOL-09', 'Motor do limpador',                 1, 120, 220,  'Gol G5, Voyage, Fox 2009–2014', 118),
    (v_gol,  'DM-GOL-10', 'Frente completa (painel frontal)',  1, 900, 1900, 'Gol G5 2009–2012', 45),

    (v_lote, 'DM-LOT-01', 'Retrovisor elétrico direito',       1, 150, 320,  'HB20 2012–2019', 3),
    (v_lote, 'DM-LOT-02', 'Par de faróis de milha',            1, 120, 240,  'Palio Attractive 2012–2017; Siena 2012–2017', 3),
    (v_lote, 'DM-LOT-03', 'Lanterna traseira esquerda',        1, 180, 380,  'HB20 hatch 2012–2019', 3),
    (v_lote, 'DM-LOT-04', 'Módulo de vidro elétrico',          1, 90,  190,  'Uno Vivace/Way 2011–2016', 3),
    (v_lote, 'DM-LOT-05', 'Kit sensor de estacionamento',      1, 60,  0,    'Universal (4 sensores)', 3),
    (v_lote, 'DM-LOT-06', 'Coxim do motor',                    3, 50,  90,   'Palio, Uno, Siena 1.0/1.4 Fire', 3),
    (v_lote, 'DM-LOT-07', 'Compressor do ar-condicionado',     1, 350, 0,    'HB20 1.0/1.6 2012–2019', 3);

  -- Mesmos campos que criar_peca_com_entrada preenche (custo rateado = custo unitário da entrada).
  insert into public.pecas (
    origem_id, nome_peca, sku, quantidade, quantidade_vendida, status,
    custo_total, custo, custo_atribuido, tipo_custo_atribuido, preco_sugerido, preparada, compatibilidade
  )
  select origem_id, nome, sku, quantidade, 0, 'em_estoque',
         custo, custo, custo, 'rateado', preco, false, compatibilidade
  from demo_pecas;

  insert into public.entradas_estoque (peca_id, origem_id, quantidade_total, quantidade_consumida, custo_unitario, data_entrada)
  select p.id, d.origem_id, d.quantidade, 0, d.custo, v_hoje - d.dias_entrada
  from demo_pecas d
  join public.pecas p on p.sku = d.sku;

  -- ---- Vendas (pela função oficial, na ordem das datas) ----
  -- (sku, quantidade, valor unitário, canal, dias atrás, frete, embalagem, tarifa Mercado Livre)
  for v_venda in
    select * from (values
      ('DM-ONX-01', 1, 520::numeric,  'Mercado Livre', 120, 35::numeric,  12::numeric, 57::numeric),
      ('DM-ONX-02', 1, 600,           'Balcão',        110, 0,            0,           0),
      ('DM-ONX-03', 1, 580,           'WhatsApp',      95,  25,           0,           0),
      ('DM-ONX-04', 1, 850,           'Balcão',        80,  0,            0,           0),
      ('DM-GOL-01', 1, 750,           'Mercado Livre', 70,  45,           20,          83),
      ('DM-ONX-05', 1, 1750,          'Mercado Livre', 60,  120,          30,          193),
      ('DM-ONX-07', 2, 170,           'Mercado Livre', 40,  40,           0,           37),
      ('DM-GOL-08', 1, 45,            'Balcão',        35,  0,            0,           0),
      ('DM-ONX-08', 1, 480,           'WhatsApp',      30,  20,           0,           0),
      ('DM-GOL-03', 1, 240,           'Outro',         15,  0,            0,           0),
      ('DM-GOL-06', 1, 190,           'WhatsApp',      10,  30,           0,           0),
      ('DM-LOT-01', 1, 300,           'Mercado Livre', 1,   25,           10,          33)
    ) as v(sku, quantidade, valor_unitario, canal, dias, frete, embalagem, tarifa)
    order by dias desc
  loop
    -- Mesmo formato que a tela manda: [{tipo_custo_id, valor}]; valor 0 é ignorado pela função.
    select public.registrar_venda_fifo(
      p_peca_id => (select id from public.pecas where sku = v_venda.sku),
      p_quantidade => v_venda.quantidade,
      p_valor_unitario => v_venda.valor_unitario,
      p_canal_venda => v_venda.canal,
      p_data_venda => v_hoje - v_venda.dias,
      p_custos => jsonb_build_array(
        jsonb_build_object('tipo_custo_id', v_frete_id, 'valor', v_venda.frete),
        jsonb_build_object('tipo_custo_id', v_embalagem_id, 'valor', v_venda.embalagem),
        jsonb_build_object('tipo_custo_id', v_tarifa_ml_id, 'valor', v_venda.tarifa)
      )
    ) into v_venda_id;
  end loop;

  -- ---- Custos de peça (mesmos campos que a tela Custo de peça grava) ----
  -- (sku, tipo, descrição, valor, dias atrás)
  insert into public.custos_peca (peca_id, tipo_custo, tipo_custo_id, descricao, valor, data_custo)
  select p.id, t.nome, t.id, c.descricao, c.valor, v_hoje - c.dias
  from (values
    ('DM-ONX-06', v_limpeza_id, 'Limpeza e teste do painel', 30::numeric, 140),
    ('DM-ONX-04', v_pintura_id, 'Retoque de pintura na borda', 60, 85),
    ('DM-GOL-01', v_limpeza_id, 'Limpeza do cabeçote', 40, 75)
  ) as c(sku, tipo_id, descricao, valor, dias)
  join public.pecas p on p.sku = c.sku
  join public.tipos_custo t on t.id = c.tipo_id;
end $$;

-- Conferência rápida do que foi carregado.
select
  (select count(*) from public.origens where observacoes like '[DEMO]%') as origens,
  (select count(*) from public.pecas where sku like 'DM-%') as pecas,
  (select count(*) from public.entradas_estoque e join public.pecas p on p.id = e.peca_id where p.sku like 'DM-%') as entradas,
  (select count(*) from public.vendas v join public.pecas p on p.id = v.peca_id where p.sku like 'DM-%') as vendas,
  (select count(*) from public.custos_venda c join public.vendas v on v.id = c.venda_id join public.pecas p on p.id = v.peca_id where p.sku like 'DM-%') as custos_venda,
  (select sum(c.valor) from public.custos_venda c join public.vendas v on v.id = c.venda_id join public.pecas p on p.id = v.peca_id where p.sku like 'DM-%') as total_custos_venda,
  (select count(*) from public.custos_peca c join public.pecas p on p.id = c.peca_id where p.sku like 'DM-%') as custos_peca,
  (select sum(c.valor) from public.custos_peca c join public.pecas p on p.id = c.peca_id where p.sku like 'DM-%') as total_custos_peca;

commit;
