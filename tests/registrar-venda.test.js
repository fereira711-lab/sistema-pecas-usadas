// Registrar venda (Fase 6): previa do resultado antes de registrar, com o custo da peca
// estimado na mesma ordem de consumo do banco (data da entrada e depois id).
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const financeiroUtils = carregarScript("js/financeiro-utils.js").financeiroUtils;

const entradas = [
  { id: 20, pecaId: 1, quantidadeTotal: 2, quantidadeConsumida: 0, custoUnitario: 90, dataEntrada: "2026-08-01" },
  { id: 10, pecaId: 1, quantidadeTotal: 3, quantidadeConsumida: 2, custoUnitario: 80, dataEntrada: "2026-07-01" },
  { id: 30, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 70, dataEntrada: "2026-08-01" },
  { id: 40, pecaId: 2, quantidadeTotal: 5, quantidadeConsumida: 0, custoUnitario: 999, dataEntrada: "2026-01-01" }
];

test("estimarCustoVendaPeca: com 1 unidade e o mesmo custo de calcularCustoReferenciaPeca", () => {
  const referencia = financeiroUtils.calcularCustoReferenciaPeca(1, entradas, []);
  const estimativa = financeiroUtils.estimarCustoVendaPeca(1, 1, entradas);

  assert.equal(referencia.valor, 80);
  assert.equal(estimativa.valor, referencia.valor);
  assert.equal(estimativa.calculado, true);
});

test("estimarCustoVendaPeca: varias unidades seguem a ordem de consumo (data, depois id)", () => {
  // Saldo: entrada 10 (1 un. a 80), depois 20 (2 un. a 90, mesma data que a 30 mas id menor), depois 30 (1 un. a 70).
  const tres = financeiroUtils.estimarCustoVendaPeca(1, 3, entradas);
  assert.equal(tres.valor, 80 + 90 + 90);
  assert.deepEqual(Array.from(tres.partes, parte => [parte.entradaId, parte.quantidade]), [[10, 1], [20, 2]]);

  const quatro = financeiroUtils.estimarCustoVendaPeca(1, 4, entradas);
  assert.equal(quatro.valor, 80 + 90 + 90 + 70);
});

test("estimarCustoVendaPeca: sem estoque suficiente nao calcula (nao inventa custo)", () => {
  const cinco = financeiroUtils.estimarCustoVendaPeca(1, 5, entradas);
  assert.equal(cinco.calculado, false);
  assert.equal(cinco.valor, null);
  assert.equal(cinco.quantidadeSemEstoque, 1);
});

test("Registrar venda: previa com receita, custo da peca, custos da venda, lucro e margem", () => {
  const tela = carregarScript("js/venda.js");
  tela.financeiroUtils = financeiroUtils;

  const previa = tela.calcularPreviaVenda({
    pecaId: 1, quantidade: 1, valorUnitario: 200, custosVenda: [{ valor: 25 }, { valor: 10 }], entradas
  });
  assert.equal(previa.receita, 200);
  assert.equal(previa.custoPeca, 80);
  assert.equal(previa.custosVenda, 35);
  assert.equal(previa.lucro, 85);
  assert.equal(previa.margem, 42.5);

  // Prejuizo aparece negativo; sem estoque, lucro e margem ficam em branco.
  assert.equal(tela.calcularPreviaVenda({ pecaId: 1, quantidade: 1, valorUnitario: 60, custosVenda: [], entradas }).lucro, -20);
  const semEstoque = tela.calcularPreviaVenda({ pecaId: 1, quantidade: 9, valorUnitario: 100, custosVenda: [], entradas });
  assert.equal(semEstoque.custoPeca, null);
  assert.equal(semEstoque.lucro, null);
  assert.equal(semEstoque.quantidadeSemEstoque, 5);
});
