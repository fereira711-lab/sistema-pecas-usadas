const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");
const dados = require("./fixtures/vendas-simulacao-2026-07.json");

const financeiro = carregarScript("js/financeiro-utils.js").financeiroUtils;

function arredondar(valor, casas = 2) {
  return Math.round(valor * 10 ** casas) / 10 ** casas;
}

test("calcularReceitaVenda: usa valorTotal quando positivo, senao quantidade x unitario", () => {
  assert.equal(financeiro.calcularReceitaVenda({ valorTotal: 2180, quantidadeVendida: 4, valorUnitario: 545 }), 2180);
  assert.equal(financeiro.calcularReceitaVenda({ valorTotal: 0, quantidadeVendida: 4, valorUnitario: 545 }), 2180);
});

test("calcularLucroVenda: lucro = receita - custo consumido - custos da venda", () => {
  const venda = { id: 1, valorTotal: 1000 };
  const resultado = financeiro.calcularLucroVenda(
    venda,
    [{ vendaId: 1, custoTotal: 600 }],
    [{ vendaId: 1, valor: 100 }]
  );

  assert.equal(resultado.calculado, true);
  assert.equal(resultado.custoConsumido, 600);
  assert.equal(resultado.custosVenda, 100);
  assert.equal(resultado.lucro, 300);
  assert.equal(resultado.margem, 30);
});

test("calcularLucroVenda: sem consumo registrado, nao inventa lucro nem margem", () => {
  const resultado = financeiro.calcularLucroVenda({ id: 9, valorTotal: 1000 }, [], [{ vendaId: 9, valor: 50 }]);

  assert.equal(resultado.calculado, false);
  assert.equal(resultado.motivo, "custo nao calculado");
  assert.equal(resultado.custoConsumido, null);
  assert.equal(resultado.lucro, null);
  assert.equal(resultado.margem, null);
  assert.equal(resultado.receita, 1000);
});

test("calcularLucroVenda: venda com prejuizo (caixa de cambio 900A1, venda 4 da simulacao)", () => {
  const venda = dados.vendas.find(item => item.id === 4);
  const resultado = financeiro.calcularLucroVenda(venda, dados.consumos, dados.custosVenda);

  assert.equal(arredondar(resultado.lucro), -1725.3);
  assert.equal(arredondar(resultado.margem, 1), -109.2);
});

test("calcularLucroPeca: pendencia de custo bloqueia lucro da peca", () => {
  const resultado = financeiro.calcularLucroPeca(
    { id: 1 },
    [{ id: 1, pecaId: 1, valorTotal: 500 }, { id: 2, pecaId: 1, valorTotal: 500 }],
    [{ vendaId: 1, custoTotal: 200 }],
    [],
    []
  );

  assert.equal(resultado.calculado, false);
  assert.equal(resultado.vendasSemCusto, 1);
  assert.equal(resultado.lucro, null);
});

test("calcularResultadoOrigem: recuperado = receita das vendas da origem - custos dessas vendas", () => {
  const origem = { id: 1 };
  const entradas = [
    { id: 10, origemId: 1, pecaId: 100 },
    { id: 11, origemId: 1, pecaId: 101 },
    { id: 20, origemId: 2, pecaId: 200 }
  ];
  const vendas = [
    { id: 1, pecaId: 100, valorTotal: 800 },
    { id: 2, pecaId: 101, valorTotal: 450 },
    { id: 3, pecaId: 200, valorTotal: 999 }
  ];
  const consumos = [
    { vendaId: 1, entradaEstoqueId: 10, custoTotal: 300 },
    { vendaId: 2, entradaEstoqueId: 11, custoTotal: 400 },
    { vendaId: 3, entradaEstoqueId: 20, custoTotal: 500 }
  ];
  const custosVenda = [
    { vendaId: 2, valor: 80 },
    { vendaId: 3, valor: 50 }
  ];

  const resultado = financeiro.calcularResultadoOrigem(origem, entradas, vendas, consumos, [], custosVenda);

  assert.equal(resultado.receita, 1250);
  assert.equal(resultado.custosVenda, 80, "so os custos das vendas desta origem");
  assert.equal(resultado.recuperado, 1170);
  assert.equal(resultado.lucro, 1250 - 700 - 80, "lucro da origem continua o mesmo");
});

test("calcularResultadoOrigem: origem sem vendas recupera zero", () => {
  const resultado = financeiro.calcularResultadoOrigem({ id: 9 }, [{ id: 1, origemId: 9, pecaId: 1 }], [], [], [], []);

  assert.equal(resultado.receita, 0);
  assert.equal(resultado.recuperado, 0);
});

test("calcularCustoReferenciaPeca: com saldo usa a entrada mais antiga com saldo (ordem de consumo)", () => {
  const entradas = [
    { id: 3, pecaId: 7, dataEntrada: "2026-08-01", quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 250 },
    { id: 1, pecaId: 7, dataEntrada: "2026-07-01", quantidadeTotal: 2, quantidadeConsumida: 2, custoUnitario: 100 },
    { id: 2, pecaId: 7, dataEntrada: "2026-07-15", quantidadeTotal: 2, quantidadeConsumida: 1, custoUnitario: 180 },
    { id: 4, pecaId: 8, dataEntrada: "2026-01-01", quantidadeTotal: 5, quantidadeConsumida: 0, custoUnitario: 1 }
  ];

  const resultado = financeiro.calcularCustoReferenciaPeca(7, entradas, []);

  assert.equal(resultado.calculado, true);
  assert.equal(resultado.fonte, "proxima-entrada");
  assert.equal(resultado.valor, 180, "a de 07/07 esgotou; a proxima com saldo e a de 15/07");
});

test("calcularCustoReferenciaPeca: mesma data desempata pelo id", () => {
  const entradas = [
    { id: 9, pecaId: 1, dataEntrada: "2026-07-01", quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 90 },
    { id: 5, pecaId: 1, dataEntrada: "2026-07-01", quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 50 }
  ];

  assert.equal(financeiro.calcularCustoReferenciaPeca(1, entradas, []).valor, 50);
});

test("calcularCustoReferenciaPeca: sem saldo usa a ultima unidade consumida; sem entrada nao calcula", () => {
  const entradas = [{ id: 1, pecaId: 7, dataEntrada: "2026-07-01", quantidadeTotal: 2, quantidadeConsumida: 2, custoUnitario: 100 }];
  const consumos = [
    { id: 10, pecaId: 7, vendaId: 1, quantidadeConsumida: 1, custoUnitario: 100, custoTotal: 100 },
    { id: 11, pecaId: 7, vendaId: 2, quantidadeConsumida: 1, custoUnitario: 120, custoTotal: 120 }
  ];

  const vendida = financeiro.calcularCustoReferenciaPeca(7, entradas, consumos);
  assert.equal(vendida.fonte, "ultima-venda");
  assert.equal(vendida.valor, 120);

  const semEntrada = financeiro.calcularCustoReferenciaPeca(99, entradas, consumos);
  assert.equal(semEntrada.calculado, false);
  assert.equal(semEntrada.valor, null);
});

test("calcularMargemPreco: (preco - custo) / preco; sem preco ou sem custo nao calcula", () => {
  assert.equal(financeiro.calcularMargemPreco(800, 300), 62.5);
  assert.equal(financeiro.calcularMargemPreco(450, 480), (450 - 480) / 450 * 100);
  assert.equal(financeiro.calcularMargemPreco(0, 300), null);
  assert.equal(financeiro.calcularMargemPreco(500, null), null);
});

// Numeros conferidos na tela Analise por produto e no banco Autopp em 2026-09-24
// (dados da simulacao de teste): receita R$ 31.848,20, custo R$ 22.822,40,
// custos da venda R$ 1.617,00, lucro R$ 7.408,80, margem 23,3%.
test("agregado das 20 vendas da simulacao bate com a Analise por produto", () => {
  const resultados = dados.vendas.map(venda => financeiro.calcularLucroVenda(venda, dados.consumos, dados.custosVenda));
  const somar = campo => resultados.reduce((total, resultado) => total + resultado[campo], 0);
  const receita = somar("receita");
  const custoConsumido = somar("custoConsumido");
  const custosVenda = somar("custosVenda");
  const lucro = somar("lucro");

  assert.ok(resultados.every(resultado => resultado.calculado), "todas as vendas tem custo calculado");
  assert.equal(arredondar(receita), 31848.2);
  assert.equal(arredondar(custoConsumido), 22822.4);
  assert.equal(arredondar(custosVenda), 1617);
  assert.equal(arredondar(lucro), 7408.8);
  assert.equal(arredondar((lucro / receita) * 100, 1), 23.3);
});
