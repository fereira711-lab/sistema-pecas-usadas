// Trava os dois bugs de contagem corrigidos em 2026-09-24:
// - fc5320b: card "Vendas recentes" (limite 7) e lista "Ultimas vendas" (limite 8) divergiam no Painel Geral.
// - 6a53817: tela Alertas contava a mesma falta de estoque como alerta da peca e alerta da entrada.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");
const dados = require("./fixtures/vendas-simulacao-2026-07.json");

function carregarPainel() {
  const elementos = {
    cardsPainelGeral: { innerHTML: "" },
    listaUltimasVendas: { innerHTML: "" },
    mensagemUltimasVendas: { textContent: "" }
  };
  const painel = carregarScript("js/painel-geral.js", { elementos });

  return { painel, elementos };
}

function lerValorDoCard(html, titulo) {
  const card = html.split("</article>").find(trecho => trecho.includes(`<span>${titulo}</span>`));
  return Number(card.match(/<strong>([^<]*)<\/strong>/)[1]);
}

test("Painel: obterUltimasVendas com 20 vendas retorna exatamente 7", () => {
  const { painel } = carregarPainel();

  assert.equal(dados.vendas.length, 20);
  assert.equal(painel.obterUltimasVendas(dados.vendas).length, 7);
});

test("Painel: card 'Vendas recentes' e lista 'Ultimas vendas' mostram o mesmo numero", () => {
  const { painel, elementos } = carregarPainel();

  painel.renderizarCards({ pecas: [], vendas: dados.vendas, entradasEstoque: [], consumosEstoque: [], origens: [] });
  painel.renderizarUltimasVendas(dados.vendas);

  const valorCard = lerValorDoCard(elementos.cardsPainelGeral.innerHTML, "Vendas recentes");
  const linhasLista = (elementos.listaUltimasVendas.innerHTML.match(/class="general-dashboard-row"/g) || []).length;

  assert.equal(valorCard, 7);
  assert.equal(linhasLista, 7);
});

function criarCenarioAlertas() {
  const hoje = new Date().toISOString().slice(0, 10);

  return {
    pecas: [
      { id: 1, sku: "SEM01", nome: "Peca sem estoque" },
      { id: 2, sku: "BAIXO01", nome: "Peca com estoque baixo" },
      { id: 3, sku: "OK01", nome: "Peca com estoque normal" }
    ],
    entradasEstoque: [
      { id: 10, pecaId: 1, sku: "SEM01", quantidadeTotal: 1, quantidadeConsumida: 1 },
      { id: 20, pecaId: 2, sku: "BAIXO01", quantidadeTotal: 1, quantidadeConsumida: 0 },
      { id: 30, pecaId: 3, sku: "OK01", quantidadeTotal: 1, quantidadeConsumida: 1 },
      { id: 31, pecaId: 3, sku: "OK01", quantidadeTotal: 5, quantidadeConsumida: 0 }
    ],
    vendas: [
      { id: 100, pecaId: 1, quantidadeVendida: 1, valorTotal: 100, dataVenda: hoje },
      { id: 300, pecaId: 3, quantidadeVendida: 1, valorTotal: 100, dataVenda: hoje }
    ],
    consumosEstoque: [
      { vendaId: 100, entradaEstoqueId: 10, custoTotal: 50 },
      { vendaId: 300, entradaEstoqueId: 30, custoTotal: 50 }
    ],
    origens: []
  };
}

function alertasDaPeca(alertas, sku) {
  return alertas.filter(alerta => alerta.entidade.startsWith(`${sku} - `)).map(alerta => alerta.tipo);
}

test("Alertas: peca sem estoque gera 'Sem estoque' e NAO gera 'Lote esgotado' separado", () => {
  const alertas = carregarScript("js/alertas.js").calcularTodosAlertas(criarCenarioAlertas());
  const tipos = alertasDaPeca(alertas, "SEM01");

  assert.ok(tipos.includes("Sem estoque"));
  assert.ok(!tipos.includes("Lote esgotado"));

  const semEstoque = alertas.find(alerta => alerta.tipo === "Sem estoque" && alerta.entidade.startsWith("SEM01"));
  assert.match(semEstoque.descricao, /1 entrada esgotada\./);
});

test("Alertas: peca com estoque baixo gera 'Estoque baixo' e NAO gera 'Saldo baixo' separado", () => {
  const alertas = carregarScript("js/alertas.js").calcularTodosAlertas(criarCenarioAlertas());
  const tipos = alertasDaPeca(alertas, "BAIXO01");

  assert.ok(tipos.includes("Estoque baixo"));
  assert.ok(!tipos.includes("Saldo baixo"));
});

test("Alertas: entrada esgotada de peca com estoque normal continua gerando 'Lote esgotado'", () => {
  const alertas = carregarScript("js/alertas.js").calcularTodosAlertas(criarCenarioAlertas());
  const tipos = alertasDaPeca(alertas, "OK01");

  assert.ok(!tipos.includes("Sem estoque"));
  assert.ok(!tipos.includes("Estoque baixo"));
  assert.equal(tipos.filter(tipo => tipo === "Lote esgotado").length, 1);
});
