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

// Retorno da origem (Detalhes da origem): origem de R$ 1.000 com 4 peças.
// A vendida (custo 400, vendeu 700, frete 50, limpeza 30); B em estoque (custo 300, preço 500);
// C com 2 unidades, 1 vendida (custo 150 cada, vendeu 250, preço 260); D em estoque sem preço.
function montarOrigemRetorno() {
  return {
    origem: { id: 7, valorPago: 1000 },
    dados: {
      pecas: [
        { id: 1, precoVenda: 700 },
        { id: 2, precoVenda: 500 },
        { id: 3, precoVenda: 260 },
        { id: 4, precoVenda: 0 }
      ],
      entradas: [
        { id: 11, origemId: 7, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 1, custoUnitario: 400 },
        { id: 12, origemId: 7, pecaId: 2, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 300 },
        { id: 13, origemId: 7, pecaId: 3, quantidadeTotal: 2, quantidadeConsumida: 1, custoUnitario: 150 },
        { id: 14, origemId: 7, pecaId: 4, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 0 },
        // Entrada de outra origem: não entra na conta.
        { id: 99, origemId: 8, pecaId: 9, quantidadeTotal: 1, quantidadeConsumida: 1, custoUnitario: 999 }
      ],
      vendas: [
        { id: 101, pecaId: 1, valorTotal: 700 },
        { id: 102, pecaId: 3, valorTotal: 250 },
        { id: 199, pecaId: 9, valorTotal: 5000 }
      ],
      consumos: [
        { vendaId: 101, entradaEstoqueId: 11, custoTotal: 400 },
        { vendaId: 102, entradaEstoqueId: 13, custoTotal: 150 },
        { vendaId: 199, entradaEstoqueId: 99, custoTotal: 999 }
      ],
      custosPeca: [{ pecaId: 1, valor: 30 }],
      custosVenda: [{ vendaId: 101, valor: 50 }, { vendaId: 199, valor: 100 }]
    }
  };
}

test("calcularRetornoOrigem: recuperado, resultado contra o valor pago e estoque a preço de venda", () => {
  const { origem, dados } = montarOrigemRetorno();
  const retorno = financeiro.calcularRetornoOrigem(origem, dados);

  assert.equal(retorno.valorPago, 1000);
  assert.equal(retorno.recuperado, 900);
  assert.equal(retorno.resultado, -100);
  assert.equal(retorno.percentualRecuperado, 90);
  assert.equal(retorno.jaSePagou, false);
  assert.equal(retorno.faltaParaSePagar, 100);
  assert.equal(retorno.valorDistribuido, 1000);
  assert.deepEqual({ ...retorno.estoque }, { unidades: 3, pecas: 3, valorPrecoVenda: 760, pecasSemPreco: 1 });
  assert.equal(retorno.pecasVendidas, 1);
});

test("calcularRetornoOrigem: conta de cada peça (custo atribuído, vendido, lucro)", () => {
  const { origem, dados } = montarOrigemRetorno();
  const porPeca = new Map(financeiro.calcularRetornoOrigem(origem, dados).pecas.map(item => [item.peca.id, item]));

  // A: 700 − 400 de custo − 50 de frete − 30 de limpeza.
  assert.equal(porPeca.get(1).vendida, true);
  assert.equal(porPeca.get(1).custoAtribuido, 400);
  assert.equal(porPeca.get(1).receita, 700);
  assert.deepEqual({ ...porPeca.get(1).lucro }, { calculado: true, valor: 220 });
  // B: em estoque, sem lucro ainda.
  assert.equal(porPeca.get(2).vendida, false);
  assert.equal(porPeca.get(2).lucro, null);
  assert.equal(porPeca.get(2).valorEstoque, 500);
  // C: parcial, continua em estoque e já tem o lucro da unidade vendida.
  assert.equal(porPeca.get(3).vendida, false);
  assert.equal(porPeca.get(3).saldo, 1);
  assert.equal(porPeca.get(3).custoAtribuido, 300);
  assert.deepEqual({ ...porPeca.get(3).lucro }, { calculado: true, valor: 100 });
  assert.equal(porPeca.has(9), false);
});

test("calcularRetornoOrigem: origem que já se pagou e origem sem valor pago", () => {
  const { dados } = montarOrigemRetorno();
  const paga = financeiro.calcularRetornoOrigem({ id: 7, valorPago: 600 }, dados);
  const semValor = financeiro.calcularRetornoOrigem({ id: 7, valorPago: 0 }, dados);

  assert.equal(paga.jaSePagou, true);
  assert.equal(paga.resultado, 300);
  assert.equal(paga.faltaParaSePagar, 0);
  assert.equal(arredondar(paga.percentualRecuperado), 150);
  assert.equal(semValor.percentualRecuperado, null);
  assert.equal(semValor.jaSePagou, false);
});
