// Trava os dois bugs de contagem corrigidos em 2026-09-24:
// - fc5320b: card "Vendas recentes" (limite 7) e lista "Ultimas vendas" (limite 8) divergiam no Painel Geral.
//   O redesenho removeu o card; continua travado que a lista usa um limite unico (7).
// - 6a53817: tela Alertas contava a mesma falta de estoque como alerta da peca e alerta da entrada.
//   Com as regras novas (Fase 4) a trava vira: a mesma peca nao aparece duas vezes no mesmo alerta.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");
const dados = require("./fixtures/vendas-simulacao-2026-07.json");

function carregarPainel() {
  const elementos = {
    listaUltimasVendas: { innerHTML: "" }
  };
  const painel = carregarScript("js/painel-geral.js", { elementos });
  painel.financeiroUtils = carregarScript("js/financeiro-utils.js").financeiroUtils;

  return { painel, elementos };
}

test("Painel: obterUltimasVendas com 20 vendas retorna exatamente 7", () => {
  const { painel } = carregarPainel();

  assert.equal(dados.vendas.length, 20);
  assert.equal(painel.obterUltimasVendas(dados.vendas).length, 7);
});

test("Painel: a tabela 'Ultimas vendas' renderiza exatamente 7 linhas com 20 vendas", () => {
  const { painel, elementos } = carregarPainel();

  painel.renderizarUltimasVendas({ vendas: dados.vendas, pecas: [], origens: [], consumosEstoque: dados.consumos, custosVenda: dados.custosVenda });

  const linhas = (elementos.listaUltimasVendas.innerHTML.match(/class="linha-venda"/g) || []).length;

  assert.equal(linhas, 7);
});

// A regra antiga ("Sem estoque" + "Lote esgotado" da mesma peca) saiu no redesenho (Fase 4).
// O que continua travado: a mesma peca nao aparece duas vezes no mesmo tipo de alerta,
// mesmo com varias entradas paradas; as quantidades e o valor parado sao somados.
function carregarRegras() {
  const financeiroUtils = carregarScript("js/financeiro-utils.js").financeiroUtils;
  const { alertasRegras } = carregarScript("js/alertas-regras.js");
  return { alertasRegras, financeiroUtils };
}

test("Alertas: peca com duas entradas paradas aparece uma vez, com saldo e valor somados", () => {
  const { alertasRegras, financeiroUtils } = carregarRegras();
  const hoje = new Date(2026, 8, 24);
  const grupos = alertasRegras.calcularAtencao({
    pecas: [{ id: 1, sku: "PAR01", nome: "Peca parada" }],
    entradasEstoque: [
      { id: 10, pecaId: 1, quantidadeTotal: 2, quantidadeConsumida: 0, custoUnitario: 50, dataEntrada: "2026-05-01" },
      { id: 11, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 80, dataEntrada: "2026-06-01" }
    ],
    vendas: [],
    consumosEstoque: [],
    custosVenda: [],
    origens: []
  }, { financeiro: financeiroUtils, hoje });

  const paradas = grupos.find(grupo => grupo.tipo === "peca-parada");
  assert.equal(paradas.itens.length, 1);
  assert.equal(paradas.itens[0].quantidade, 3);
  assert.equal(paradas.itens[0].valorParado, 180);
  assert.equal(paradas.itens[0].dias, 146);
});
