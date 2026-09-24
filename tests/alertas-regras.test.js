// Regras de atencao do redesenho (secao 8 da especificacao + "preco abaixo do custo"),
// em js/alertas-regras.js, e a montagem da tela Alertas (js/alertas.js) em cima delas.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const HOJE = new Date(2026, 8, 24);
const financeiroUtils = carregarScript("js/financeiro-utils.js").financeiroUtils;
const { alertasRegras } = carregarScript("js/alertas-regras.js");

function calcular(dados) {
  return alertasRegras.calcularAtencao({
    pecas: [], entradasEstoque: [], vendas: [], consumosEstoque: [], custosVenda: [], origens: [], ...dados
  }, { financeiro: financeiroUtils, hoje: HOJE });
}

// Arrays criados dentro do contexto isolado (vm) nao sao "reference-equal" aos do teste;
// Array.from traz para o contexto do teste antes de comparar.
function tipos(grupos) {
  return Array.from(grupos, grupo => grupo.tipo);
}

test("Alertas: quantidade 1 e peca recem-cadastrada sem venda nao sao alerta", () => {
  const grupos = calcular({
    pecas: [{ id: 1, nome: "Farol", precoVenda: 300 }],
    entradasEstoque: [{ id: 10, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 100, dataEntrada: "2026-09-20" }]
  });

  assert.deepEqual(tipos(grupos), []);
});

test("Alertas: peca parada so conta depois de 90 dias e sem venda desde a entrada", () => {
  const entrada = dataEntrada => ({ id: 10, pecaId: 1, quantidadeTotal: 3, quantidadeConsumida: 1, custoUnitario: 40, dataEntrada });
  const pecas = [{ id: 1, nome: "Macaneta", precoVenda: 60 }];

  // 90 dias exatos ainda nao e parada; 91 dias e.
  assert.deepEqual(tipos(calcular({ pecas, entradasEstoque: [entrada("2026-06-26")] })), []);
  const parada = calcular({ pecas, entradasEstoque: [entrada("2026-06-25")] }).find(grupo => grupo.tipo === "peca-parada");
  assert.equal(parada.itens[0].dias, 91);
  assert.equal(parada.itens[0].quantidade, 2);
  assert.equal(parada.itens[0].valorParado, 80);

  // Vendeu uma unidade depois da entrada: a peca esta girando, nao e parada.
  const comVenda = calcular({
    pecas,
    entradasEstoque: [entrada("2026-01-10")],
    vendas: [{ id: 5, pecaId: 1, quantidadeVendida: 1, valorTotal: 60, dataVenda: "2026-08-01" }],
    consumosEstoque: [{ vendaId: 5, entradaEstoqueId: 10, quantidadeConsumida: 1, custoUnitario: 40, custoTotal: 40 }]
  });
  assert.ok(!tipos(comVenda).includes("peca-parada"));
});

test("Alertas: venda com prejuizo e venda sem custo calculado", () => {
  const grupos = calcular({
    pecas: [{ id: 1, nome: "Bomba" }, { id: 2, nome: "Radiador" }],
    vendas: [
      { id: 5, pecaId: 1, quantidadeVendida: 1, valorTotal: 190, dataVenda: "2026-09-14" },
      { id: 6, pecaId: 2, quantidadeVendida: 1, valorTotal: 200, dataVenda: "2026-09-14" }
    ],
    consumosEstoque: [{ vendaId: 5, entradaEstoqueId: 10, quantidadeConsumida: 1, custoUnitario: 180, custoTotal: 180 }],
    custosVenda: [{ vendaId: 5, valor: 30 }]
  });

  const prejuizo = grupos.find(grupo => grupo.tipo === "venda-prejuizo");
  assert.equal(prejuizo.gravidade, "danger");
  assert.equal(prejuizo.itens.length, 1);
  assert.equal(prejuizo.itens[0].resultado.lucro, -20);

  const semCusto = grupos.find(grupo => grupo.tipo === "venda-sem-custo");
  assert.deepEqual(Array.from(semCusto.itens, item => item.venda.id), [6]);
});

test("Alertas: origem com valor a distribuir e distribuicao acima do pago", () => {
  const grupos = calcular({
    origens: [
      { id: 1, descricao: "Lote", valorPago: 1800 },
      { id: 2, descricao: "Gol", valorPago: 1000 },
      { id: 3, descricao: "Onix", valorPago: 500 },
      { id: 4, descricao: "Sem valor pago", valorPago: 0 }
    ],
    entradasEstoque: [
      { id: 10, pecaId: 1, origemId: 1, quantidadeTotal: 2, quantidadeConsumida: 0, custoUnitario: 550, dataEntrada: "2026-09-21" },
      { id: 11, pecaId: 2, origemId: 2, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 1200, dataEntrada: "2026-09-21" },
      { id: 12, pecaId: 3, origemId: 3, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 500, dataEntrada: "2026-09-21" }
    ]
  });

  const aDistribuir = grupos.find(grupo => grupo.tipo === "origem-a-distribuir");
  assert.deepEqual(Array.from(aDistribuir.itens, item => [item.origem.id, item.diferenca]), [[1, 700]]);

  const acima = grupos.find(grupo => grupo.tipo === "distribuicao-acima");
  assert.deepEqual(Array.from(acima.itens, item => [item.origem.id, item.diferenca]), [[2, -200]]);
});

test("Alertas: preco abaixo do custo usa o custo da proxima unidade a sair", () => {
  const grupos = calcular({
    pecas: [
      { id: 1, nome: "Radiador", precoVenda: 120 },
      { id: 2, nome: "Compressor sem preco", precoVenda: 0 },
      { id: 3, nome: "Vendida abaixo do custo", precoVenda: 50 },
      { id: 4, nome: "Preco igual ao custo", precoVenda: 80 }
    ],
    entradasEstoque: [
      { id: 10, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 150, dataEntrada: "2026-08-10" },
      { id: 20, pecaId: 2, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 350, dataEntrada: "2026-09-21" },
      { id: 30, pecaId: 3, quantidadeTotal: 1, quantidadeConsumida: 1, custoUnitario: 90, dataEntrada: "2026-09-01" },
      { id: 40, pecaId: 4, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 80, dataEntrada: "2026-09-01" }
    ]
  });

  const abaixo = grupos.find(grupo => grupo.tipo === "preco-abaixo-custo");
  assert.equal(abaixo.gravidade, "warning");
  assert.equal(abaixo.itens.length, 1);
  assert.equal(abaixo.itens[0].peca.id, 1);
  assert.equal(abaixo.itens[0].custo, 150);
  assert.equal(abaixo.itens[0].diferenca, 30);
  assert.equal(abaixo.itens[0].margem, -25);
});

test("Alertas: grupos na ordem de gravidade e contador = numero de tipos", () => {
  const dados = {
    pecas: [{ id: 1, nome: "Radiador", precoVenda: 120 }, { id: 2, nome: "Bomba" }],
    entradasEstoque: [
      { id: 10, pecaId: 1, origemId: 1, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 150, dataEntrada: "2026-01-10" },
      { id: 20, pecaId: 2, origemId: 1, quantidadeTotal: 1, quantidadeConsumida: 1, custoUnitario: 180, dataEntrada: "2026-09-01" }
    ],
    vendas: [{ id: 5, pecaId: 2, quantidadeVendida: 1, valorTotal: 190, dataVenda: "2026-09-14" }],
    consumosEstoque: [{ vendaId: 5, entradaEstoqueId: 20, quantidadeConsumida: 1, custoUnitario: 180, custoTotal: 180 }],
    custosVenda: [{ vendaId: 5, valor: 30 }],
    origens: [{ id: 1, descricao: "Gol", valorPago: 600 }]
  };

  assert.deepEqual(tipos(calcular(dados)), ["venda-prejuizo", "preco-abaixo-custo", "peca-parada", "origem-a-distribuir"]);
  assert.equal(alertasRegras.contarGruposDeAtencao(dados, { financeiro: financeiroUtils, hoje: HOJE }), 4);
});

test("Tela Alertas: um grupo por tipo, uma linha por ocorrencia, com acao e busca", () => {
  const tela = carregarScript("js/alertas.js");
  tela.alertasRegras = alertasRegras;
  tela.financeiroUtils = financeiroUtils;

  const grupos = tela.montarGruposAlertas({
    pecas: [{ id: 1, sku: "DM-GOL-04", nome: "Radiador", precoVenda: 120 }, { id: 2, sku: "DM-GOL-06", nome: "Bomba de combustível" }],
    entradasEstoque: [
      { id: 10, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 150, dataEntrada: "2026-08-10" },
      { id: 20, pecaId: 2, quantidadeTotal: 1, quantidadeConsumida: 1, custoUnitario: 180, dataEntrada: "2026-08-10" }
    ],
    vendas: [{ id: 5, pecaId: 2, quantidadeVendida: 1, valorTotal: 190, dataVenda: "2026-09-14", canalVenda: "WhatsApp" }],
    consumosEstoque: [{ vendaId: 5, entradaEstoqueId: 20, quantidadeConsumida: 1, custoUnitario: 180, custoTotal: 180 }],
    custosVenda: [{ vendaId: 5, valor: 30 }],
    origens: []
  }, { financeiro: financeiroUtils, hoje: HOJE });

  assert.deepEqual(Array.from(grupos, grupo => grupo.titulo), ["1 venda com prejuízo", "1 peça com preço abaixo do custo"]);
  assert.equal(grupos[0].linhas[0].acao.href, "detalhes-venda.html?vendaId=5");
  assert.equal(grupos[1].linhas[0].acao.href, "detalhes-produto.html?pecaId=1&editar=1&campo=preco");

  // A busca aceita palavras sem acento e em qualquer ordem.
  assert.equal(tela.filtrarGrupos(grupos, "combustivel whatsapp", "todas").length, 1);
  assert.equal(tela.filtrarGrupos(grupos, "radiador", "danger").length, 0);
});
