// Nova peca (Fase 5): SKU automatico so quando em branco e previa do resumo lateral.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const { supabaseService } = carregarScript("js/supabase-service.js");
const financeiroUtils = carregarScript("js/financeiro-utils.js").financeiroUtils;

function carregarTela() {
  const tela = carregarScript("js/peca.js");
  tela.financeiroUtils = financeiroUtils;
  return tela;
}

test("SKU automatico: proximo P-numero depois do maior ja usado, ignorando SKUs livres", () => {
  assert.equal(supabaseService.calcularProximoSkuAutomatico([]), "P-000001");
  assert.equal(supabaseService.calcularProximoSkuAutomatico(["FAR-0232", "p-000007", "P-000003", "P-12X", "DM-ONX-01"]), "P-000008");
});

test("Nova peca: distribuicao da origem soma quantidade x custo das entradas dela", () => {
  const tela = carregarTela();
  const distribuicao = tela.calcularDistribuicaoOrigem({ id: 17, valorPago: 1800 }, [
    { origemId: 17, quantidadeTotal: 3, custoUnitario: 50 },
    { origemId: 17, quantidadeTotal: 1, custoUnitario: 950 },
    { origemId: 16, quantidadeTotal: 1, custoUnitario: 900 }
  ]);

  assert.equal(distribuicao.valorDistribuido, 1100);
  assert.equal(distribuicao.restante, 700);
});

test("Nova peca: previa com margem, lucro previsto e quanto a origem fica a distribuir", () => {
  const tela = carregarTela();
  const distribuicao = { valorPago: 1800, valorDistribuido: 1100, restante: 700 };

  const umaUnidade = tela.calcularPreviaPeca({ quantidade: 1, custoUnitario: 190, preco: 489.9, distribuicao });
  assert.equal(umaUnidade.valorAtribuido, 190);
  assert.equal(Math.round(umaUnidade.margem), 61);
  assert.equal(Number(umaUnidade.lucro.toFixed(2)), 299.9);
  assert.equal(umaUnidade.restanteDepois, 510);

  // Tres unidades: lucro previsto multiplica; passar do valor da origem fica negativo.
  const tres = tela.calcularPreviaPeca({ quantidade: 3, custoUnitario: 300, preco: 250, distribuicao });
  assert.equal(tres.lucro, -150);
  assert.ok(tres.margem < 0);
  assert.equal(tres.restanteDepois, -200);

  // Sem preco: sem margem nem lucro (nao inventa).
  const semPreco = tela.calcularPreviaPeca({ quantidade: 1, custoUnitario: 100, preco: null, distribuicao });
  assert.equal(semPreco.margem, null);
  assert.equal(semPreco.lucro, null);
});
