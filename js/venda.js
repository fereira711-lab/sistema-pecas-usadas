const TIPOS_CUSTO_PECA = ["real", "rateado", "simbolico"];
const TIPO_CUSTO_PADRAO = "real";

function normalizarTipoCusto(tipoCusto) {
  return TIPOS_CUSTO_PECA.includes(tipoCusto) ? tipoCusto : TIPO_CUSTO_PADRAO;
}

function buscarPecas() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarPecas(pecas) {
  localStorage.setItem("produtos", JSON.stringify(pecas));
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function buscarCustosPeca() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function salvarVendas(vendas) {
  localStorage.setItem("vendas", JSON.stringify(vendas));
}

function normalizarPeca(peca) {
  const quantidade = Number(peca.quantidade || 1);
  const quantidadeVendida = Number(peca.quantidadeVendida || 0);
  const quantidadeDisponivel = Math.max(quantidade - quantidadeVendida, 0);

  return {
    ...peca,
    quantidade,
    quantidadeVendida,
    origemId: Number(peca.origemId || 0),
    tipoCusto: normalizarTipoCusto(peca.tipoCusto),
    status: quantidadeDisponivel <= 0 ? "vendida" : "em_estoque"
  };
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 1) - Number(peca.quantidadeVendida || 0), 0);
}

function calcularCustoPeca(peca, pecasDaOrigem, origem) {
  if (peca.tipoCusto !== "rateado") {
    return Number(peca.custo || 0);
  }

  if (!origem || pecasDaOrigem.length === 0) {
    return Number(peca.custo || 0);
  }

  return Number(origem.valorPago || origem.valor_pago || 0) / pecasDaOrigem.length;
}

function somarCustosPorSku(peca) {
  if (!peca.sku) {
    return 0;
  }

  return buscarCustosPeca()
    .filter(custo => custo.sku === peca.sku)
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function calcularCustoUnitarioPeca(peca, pecas) {
  const origens = buscarOrigens();
  const origem = origens.find(item => Number(item.id) === Number(peca.origemId));
  const pecasDaOrigem = pecas.filter(item => Number(item.origemId || 0) === Number(peca.origemId || 0));

  return calcularCustoPeca(peca, pecasDaOrigem, origem) + somarCustosPorSku(peca);
}

function criarCustosVenda(custoEmbalagem, custoComissao, custoFrete) {
  return [
    { tipo: "embalagem", valor: custoEmbalagem },
    { tipo: "comissao", valor: custoComissao },
    { tipo: "frete", valor: custoFrete }
  ];
}

function somarCustosVenda(custosVenda) {
  return custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function salvarVenda() {
  const pecaId = Number(document.getElementById("pecaId").value);
  const valorVendaUnitario = Number(document.getElementById("valorVenda").value);
  const quantidadeVendidaNaVenda = Number(document.getElementById("quantidadeVendidaNaVenda").value);
  const canalVenda = document.getElementById("canalVenda").value;
  const custoEmbalagem = Number(document.getElementById("custoEmbalagem").value);
  const custoComissao = Number(document.getElementById("custoComissao").value);
  const custoFrete = Number(document.getElementById("custoFrete").value);

  if (!pecaId || quantidadeVendidaNaVenda <= 0) {
    alert("Informe a peça e uma quantidade vendida maior que zero.");
    return;
  }

  const pecas = buscarPecas().map(normalizarPeca);
  const peca = pecas.find(item => Number(item.id) === pecaId);

  if (!peca) {
    alert("Peça não encontrada.");
    return;
  }

  const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);

  if (quantidadeVendidaNaVenda > quantidadeDisponivel) {
    alert("Quantidade vendida maior que o estoque disponível.");
    return;
  }

  const custosVenda = criarCustosVenda(custoEmbalagem, custoComissao, custoFrete);
  const custoVendaUnitario = somarCustosVenda(custosVenda);
  const custoUnitarioCalculado = calcularCustoUnitarioPeca(peca, pecas);
  const valorVenda = valorVendaUnitario * quantidadeVendidaNaVenda;
  const lucroVenda = (
    valorVendaUnitario -
    custoUnitarioCalculado -
    custoVendaUnitario
  ) * quantidadeVendidaNaVenda;

  const novaVenda = {
    id: Date.now(),
    pecaId,
    valorVenda,
    valorVendaUnitario,
    canalVenda,
    quantidadeVendidaNaVenda,
    custosVenda,
    custoVendaUnitario,
    custoUnitarioCalculado,
    lucroVenda
  };

  peca.quantidadeVendida = Number(peca.quantidadeVendida || 0) + quantidadeVendidaNaVenda;
  peca.status = peca.quantidadeVendida >= Number(peca.quantidade || 1) ? "vendida" : "em_estoque";

  salvarPecas(pecas);

  const vendas = buscarVendas();
  vendas.push(novaVenda);
  salvarVendas(vendas);

  console.log("Venda criada:", novaVenda);

  alert("Venda cadastrada!");
}
