// Regra de lucro unificada (decisão de Rafael, 2026-09-25): custos lançados na peça fazem parte do custo
// da peça, rateados por unidade. Ao vender entram no lucro da venda; o que não vendeu fica em estoque.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const financeiro = carregarScript("js/financeiro-utils.js").financeiroUtils;

// Porta DM-ONX-04 da demonstração: vendida por 850, entrada de 450, pintura de 60, sem custo de venda.
const porta = {
  peca: { id: 1 },
  entradas: [{ id: 10, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 1, custoUnitario: 450, dataEntrada: "2026-04-01" }],
  vendas: [{ id: 100, pecaId: 1, quantidadeVendida: 1, valorTotal: 850 }],
  consumos: [{ id: 1000, vendaId: 100, pecaId: 1, entradaEstoqueId: 10, quantidadeConsumida: 1, custoUnitario: 450, custoTotal: 450 }],
  custosPeca: [{ id: 1, pecaId: 1, valor: 60 }],
  custosVenda: []
};

test("rateio: porta 850 − 450 − 60 = 340 na venda e na peça", () => {
  const venda = financeiro.calcularLucroVenda(porta.vendas[0], porta.consumos, porta.custosVenda, { custosPeca: porta.custosPeca, entradas: porta.entradas });
  const peca = financeiro.calcularLucroPeca(porta.peca, porta.vendas, porta.consumos, porta.custosPeca, porta.custosVenda, porta.entradas);

  assert.equal(venda.custosPeca, 60);
  assert.equal(venda.lucro, 340);
  assert.equal(peca.lucro, 340);
  assert.equal(peca.custosPeca, 60);
  assert.equal(peca.custosPecaEmEstoque, 0);
});

test("rateio: peça com 2 unidades e R$ 40 de custos vendeu 1 → 20 na venda e 20 em estoque", () => {
  const entradas = [{ id: 20, pecaId: 2, quantidadeTotal: 2, quantidadeConsumida: 1, custoUnitario: 100, dataEntrada: "2026-04-01" }];
  const vendas = [{ id: 200, pecaId: 2, quantidadeVendida: 1, valorTotal: 300 }];
  const consumos = [{ id: 2000, vendaId: 200, pecaId: 2, entradaEstoqueId: 20, quantidadeConsumida: 1, custoUnitario: 100, custoTotal: 100 }];
  const custosPeca = [{ pecaId: 2, valor: 25 }, { pecaId: 2, valor: 15 }];
  const custosVenda = [{ vendaId: 200, valor: 30 }];

  const venda = financeiro.calcularLucroVenda(vendas[0], consumos, custosVenda, { custosPeca, entradas });
  const peca = financeiro.calcularLucroPeca({ id: 2 }, vendas, consumos, custosPeca, custosVenda, entradas);

  assert.equal(venda.custosPeca, 20);
  assert.equal(venda.lucro, 300 - 100 - 20 - 30);
  assert.equal(peca.custosPeca, 20);
  assert.equal(peca.custosPecaEmEstoque, 20);
  assert.equal(financeiro.calcularCustosPecaEmEstoque(2, custosPeca, entradas), 20);
});

test("rateio: peça ainda não vendida não leva custo para o lucro; fica como custo em estoque", () => {
  const entradas = [{ id: 30, pecaId: 3, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 200 }];
  const peca = financeiro.calcularLucroPeca({ id: 3 }, [], [], [{ pecaId: 3, valor: 30 }], [], entradas);

  assert.equal(peca.lucro, 0);
  assert.equal(peca.custosPeca, 0);
  assert.equal(peca.custosPecaEmEstoque, 30);
});

test("rateio: custo de referência e prévia da venda incluem os custos da peça por unidade", () => {
  const entradas = [{ id: 40, pecaId: 4, quantidadeTotal: 2, quantidadeConsumida: 0, custoUnitario: 100, dataEntrada: "2026-04-01" }];
  const custosPeca = [{ pecaId: 4, valor: 40 }];
  const referencia = financeiro.calcularCustoReferenciaPeca(4, entradas, [], custosPeca);
  const semCustos = financeiro.calcularCustoReferenciaPeca(4, entradas, []);
  const previa = financeiro.estimarCustoVendaPeca(4, 2, entradas, custosPeca);

  assert.equal(referencia.valor, 120);
  assert.equal(referencia.custoEntrada, 100);
  assert.equal(referencia.custosPecaUnidade, 20);
  assert.equal(semCustos.valor, 100);
  assert.equal(previa.valor, 200);
  assert.equal(previa.custosPeca, 40);
});

test("rateio: soma por peça (Por produto) = soma por venda (Por período) para as mesmas vendas", () => {
  const entradas = [
    ...porta.entradas,
    { id: 20, pecaId: 2, quantidadeTotal: 2, quantidadeConsumida: 2, custoUnitario: 100, dataEntrada: "2026-04-01" },
    { id: 30, pecaId: 3, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 200 }
  ];
  const vendas = [
    ...porta.vendas,
    { id: 200, pecaId: 2, quantidadeVendida: 1, valorTotal: 300 },
    { id: 201, pecaId: 2, quantidadeVendida: 1, valorTotal: 280 }
  ];
  const consumos = [
    ...porta.consumos,
    { vendaId: 200, entradaEstoqueId: 20, custoTotal: 100 },
    { vendaId: 201, entradaEstoqueId: 20, custoTotal: 100 }
  ];
  const custosPeca = [...porta.custosPeca, { pecaId: 2, valor: 40 }, { pecaId: 3, valor: 30 }];
  const custosVenda = [{ vendaId: 200, valor: 30 }];
  const rateio = { custosPeca, entradas };

  const porVenda = vendas.reduce((total, venda) => total + financeiro.calcularLucroVenda(venda, consumos, custosVenda, rateio).lucro, 0);
  const porPeca = [1, 2, 3].reduce((total, id) => total + financeiro.calcularLucroPeca({ id }, vendas, consumos, custosPeca, custosVenda, entradas).lucro, 0);

  assert.equal(porVenda, 340 + (300 - 100 - 20 - 30) + (280 - 100 - 20));
  assert.equal(porPeca, porVenda);
});
