// Detalhes da origem: situacao e ordem das pecas, filtro e frase do bloco "Retorno da origem".
// Os valores vem do financeiro-utils (calcularRetornoOrigem, testado em financeiro-utils.test.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const HOJE = new Date(2026, 8, 24);
const financeiro = carregarScript("js/financeiro-utils.js").financeiroUtils;
const { alertasRegras } = carregarScript("js/alertas-regras.js");
const tela = carregarScript("js/detalhes-origem.js");

// Origem de R$ 1.000: A vendida; B em estoque ha 5 dias; C parada desde maio; D com preco abaixo do custo.
function montarDados() {
  return {
    origem: { id: 7, valorPago: 1000 },
    pecas: [
      { id: 1, nome: "A", precoVenda: 700 },
      { id: 2, nome: "B", precoVenda: 500 },
      { id: 3, nome: "C", precoVenda: 400 },
      { id: 4, nome: "D", precoVenda: 100 }
    ],
    entradas: [
      { id: 11, origemId: 7, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 1, custoUnitario: 400, dataEntrada: "2026-05-01" },
      { id: 12, origemId: 7, pecaId: 2, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 300, dataEntrada: "2026-09-19" },
      { id: 13, origemId: 7, pecaId: 3, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 150, dataEntrada: "2026-05-01" },
      { id: 14, origemId: 7, pecaId: 4, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 150, dataEntrada: "2026-09-19" }
    ],
    vendas: [{ id: 101, pecaId: 1, valorTotal: 700, dataVenda: "2026-06-10" }],
    consumos: [{ vendaId: 101, entradaEstoqueId: 11, custoTotal: 400 }],
    custosPeca: [],
    custosVenda: [{ vendaId: 101, valor: 50 }]
  };
}

function montarLinhas(dados) {
  const retorno = financeiro.calcularRetornoOrigem(dados.origem, dados);
  return Array.from(tela.montarLinhasPecas(retorno, dados, { financeiro, alertasRegras, hoje: HOJE }));
}

test("montarLinhasPecas: situacao com a mesma prioridade de Produtos e vendidas primeiro", () => {
  const linhas = montarLinhas(montarDados());

  assert.deepEqual(linhas.map(linha => [linha.peca.nome, linha.situacao.chave]), [
    ["A", "vendida"],
    ["B", "estoque"],
    ["C", "parada"],
    ["D", "abaixo-custo"]
  ]);
  assert.equal(linhas[2].situacao.dias, 146);
});

test("linhaCombinaComFiltro: Vendidas e Em estoque separam as pecas; Todas mostra tudo", () => {
  const linhas = montarLinhas(montarDados());
  const nomes = filtro => linhas.filter(linha => tela.linhaCombinaComFiltro(linha, filtro)).map(linha => linha.peca.nome);

  assert.deepEqual(nomes("vendidas"), ["A"]);
  assert.deepEqual(nomes("estoque"), ["B", "C", "D"]);
  assert.deepEqual(nomes("todas"), ["A", "B", "C", "D"]);
});

function texto(html) {
  return html.replace(/<[^>]+>/g, "").replace(/\s/g, " ");
}

test("montarFraseRetorno: falta para se pagar e se o estoque cobre", () => {
  const dados = montarDados();
  const retorno = financeiro.calcularRetornoOrigem(dados.origem, dados);

  // Recuperado 650 (700 - 50): faltam 350; estoque 500 + 400 + 100 = 1.000 cobre.
  assert.equal(
    texto(tela.montarFraseRetorno(retorno)),
    "Faltam R$ 350,00 para esta origem se pagar. As 3 peças em estoque ainda podem render R$ 1.000,00 pelos preços cadastrados, o suficiente para cobrir o que falta."
  );
});

test("montarFraseRetorno: origem que ja se pagou, sem estoque e sem valor pago", () => {
  const dados = montarDados();
  const paga = financeiro.calcularRetornoOrigem({ id: 7, valorPago: 600 }, dados);
  assert.match(texto(tela.montarFraseRetorno(paga)), /^Esta origem já se pagou e deixou R\$ 50,00 de lucro até agora\. As 3 peças em estoque/);

  dados.entradas.forEach(entrada => { entrada.quantidadeConsumida = entrada.quantidadeTotal; });
  const semEstoque = financeiro.calcularRetornoOrigem({ id: 7, valorPago: 600 }, dados);
  assert.match(texto(tela.montarFraseRetorno(semEstoque)), /Não há mais peças em estoque\.$/);

  const semValor = financeiro.calcularRetornoOrigem({ id: 7, valorPago: 0 }, montarDados());
  assert.equal(tela.montarFraseRetorno(semValor), "Origem sem valor pago registrado: não há o que recuperar.");
});

test("montarFraseRetorno: avisa as pecas em estoque sem preco", () => {
  const dados = montarDados();
  dados.pecas[1].precoVenda = 0;
  // Pago 2.000: faltam 1.350 e o estoque com preco (400 + 100) nao cobre.
  const retorno = financeiro.calcularRetornoOrigem({ id: 7, valorPago: 2000 }, dados);

  assert.match(texto(tela.montarFraseRetorno(retorno)), /menos do que falta\. 1 peça em estoque está sem preço e não entra nessa conta\.$/);
});
