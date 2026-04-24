const formularioVenda = document.getElementById("formVenda");
const selectProduto = document.getElementById("produtoVenda");
const campoQuantidade = document.getElementById("quantidadeVendida");
const campoPrecoUnitario = document.getElementById("precoUnitario");
const campoValorTotal = document.getElementById("valorTotal");
const campoCustoUnitario = document.getElementById("custoUnitarioAtualizado");
const campoCustoTotalVenda = document.getElementById("custoTotalVenda");
const campoLucroBruto = document.getElementById("lucroBruto");
const campoDataVenda = document.getElementById("dataVenda");
const campoCliente = document.getElementById("clienteVenda");
const campoCustosVenda = document.getElementById("custosVenda");
const campoObservacoes = document.getElementById("observacoesVenda");
const mensagemVenda = document.getElementById("mensagemVenda");

const TIPOS_CUSTO_PECA = ["real", "rateado", "simbolico"];
const TIPO_CUSTO_PADRAO = "real";

function normalizarTipoCusto(tipoCusto) {
  return TIPOS_CUSTO_PECA.includes(tipoCusto) ? tipoCusto : TIPO_CUSTO_PADRAO;
}

function normalizarProduto(produto) {
  return {
    ...produto,
    origemId: Number(produto.origemId || 0),
    tipoCusto: normalizarTipoCusto(produto.tipoCusto)
  };
}

function buscarProdutos() {
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  const produtosNormalizados = produtos.map(normalizarProduto);

  salvarProdutos(produtosNormalizados);
  return produtosNormalizados;
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function buscarCustos() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function salvarProdutos(produtos) {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function salvarVendas(vendas) {
  localStorage.setItem("vendas", JSON.stringify(vendas));
}

function normalizarCustosVenda(custosVenda) {
  if (!Array.isArray(custosVenda)) {
    return [];
  }

  return custosVenda
    .map(custo => ({
      tipo: String(custo.tipo || "").trim(),
      descricao: String(custo.descricao || "").trim(),
      valor: Number(custo.valor || 0)
    }))
    .filter(custo => custo.tipo && custo.valor > 0);
}

function somarCustosVenda(custosVenda) {
  return normalizarCustosVenda(custosVenda)
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function buscarVendas() {
  const vendas = JSON.parse(localStorage.getItem("vendas")) || [];

  return vendas.map(venda => ({
    ...venda,
    custosVenda: normalizarCustosVenda(venda.custosVenda),
    totalCustosVenda: venda.totalCustosVenda !== undefined
      ? Number(venda.totalCustosVenda || 0)
      : somarCustosVenda(venda.custosVenda)
  }));
}

function lerCustosVendaDoFormulario() {
  const texto = campoCustosVenda.value.trim();

  if (!texto) {
    return [];
  }

  return texto.split("\n").map((linha, indice) => {
    const partes = linha.split(";").map(parte => parte.trim());
    const valor = Number((partes[2] || "").replace(",", "."));

    if (partes.length < 3 || !partes[0] || Number.isNaN(valor) || valor <= 0) {
      throw new Error(`Custo da venda inválido na linha ${indice + 1}. Use tipo;descrição;valor.`);
    }

    return {
      tipo: partes[0],
      descricao: partes[1],
      valor
    };
  });
}

function somarCustosPorSku(sku) {
  return buscarCustos()
    .filter(custo => custo.sku === sku)
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function calcularCustoPeca(peca, pecasDaOrigem, origem) {
  if (peca.tipoCusto !== "rateado") {
    return Number(peca.custo || 0);
  }

  if (!origem || pecasDaOrigem.length === 0) {
    return Number(peca.custo || 0);
  }

  return Number(origem.valorPago || 0) / pecasDaOrigem.length;
}

function obterContextoOrigem(produto) {
  const produtos = buscarProdutos();
  const origem = buscarOrigens().find(item => item.id === produto.origemId);
  const pecasDaOrigem = produtos.filter(item => item.origemId === produto.origemId);

  return { origem, pecasDaOrigem };
}

function obterProdutoSelecionado() {
  if (selectProduto.value === "") {
    return null;
  }

  return buscarProdutos()[Number(selectProduto.value)];
}

function calcularCustoUnitarioAtualizado(produto) {
  if (!produto) {
    return 0;
  }

  const { origem, pecasDaOrigem } = obterContextoOrigem(produto);
  const custoBase = calcularCustoPeca(produto, pecasDaOrigem, origem);

  return custoBase + somarCustosPorSku(produto.sku);
}

function carregarProdutosNoSelect() {
  const produtos = buscarProdutos();

  produtos.forEach((produto, indice) => {
    const opcao = document.createElement("option");
    opcao.value = indice;
    opcao.textContent = `${produto.nome} - estoque: ${produto.quantidade}`;
    selectProduto.appendChild(opcao);
  });

  if (produtos.length === 0) {
    mensagemVenda.textContent = "Nenhum produto cadastrado. Cadastre uma peça antes de registrar venda.";
    mensagemVenda.className = "form-message form-message--warning";
  }
}

function calcularValoresVenda() {
  const produto = obterProdutoSelecionado();
  const quantidade = Number(campoQuantidade.value);
  const precoUnitario = Number(campoPrecoUnitario.value);
  const valorTotal = quantidade * precoUnitario;
  const custoUnitarioAtualizado = calcularCustoUnitarioAtualizado(produto);
  const custoTotalVenda = quantidade * custoUnitarioAtualizado;
  let totalCustosVenda = 0;

  try {
    totalCustosVenda = somarCustosVenda(lerCustosVendaDoFormulario());
  } catch (erro) {
    totalCustosVenda = 0;
  }

  const lucroBruto = valorTotal - custoTotalVenda - totalCustosVenda;

  campoValorTotal.value = valorTotal > 0 ? valorTotal.toFixed(2) : "";
  campoCustoUnitario.value = custoUnitarioAtualizado > 0 ? custoUnitarioAtualizado.toFixed(2) : "";
  campoCustoTotalVenda.value = custoTotalVenda > 0 ? custoTotalVenda.toFixed(2) : "";
  campoLucroBruto.value = valorTotal > 0 ? lucroBruto.toFixed(2) : "";
}

function selecionarProduto() {
  const produto = obterProdutoSelecionado();

  if (!produto) {
    campoPrecoUnitario.value = "";
    calcularValoresVenda();
    return;
  }

  campoPrecoUnitario.value = Number(produto.precoVenda || 0).toFixed(2);
  calcularValoresVenda();
}

function mostrarAviso(mensagem) {
  mensagemVenda.textContent = mensagem;
  mensagemVenda.className = "form-message form-message--warning";
}

function mostrarSucesso(mensagem) {
  mensagemVenda.textContent = mensagem;
  mensagemVenda.className = "form-message form-message--success";
}

formularioVenda.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const produtos = buscarProdutos();
  const indiceProduto = selectProduto.value;
  const quantidadeVendida = Number(campoQuantidade.value);
  const precoUnitario = Number(campoPrecoUnitario.value);
  const dataVenda = campoDataVenda.value;

  if (indiceProduto === "" || !campoQuantidade.value || !campoPrecoUnitario.value || !dataVenda) {
    mostrarAviso("Preencha produto, quantidade, preço unitário e data da venda.");
    return;
  }

  if (quantidadeVendida <= 0) {
    mostrarAviso("A quantidade vendida deve ser maior que zero.");
    return;
  }

  const produto = produtos[Number(indiceProduto)];

  if (quantidadeVendida > produto.quantidade) {
    alert("Quantidade vendida maior que o estoque disponível.");
    return;
  }

  const custoUnitarioAtualizado = calcularCustoUnitarioAtualizado(produto);
  const valorTotal = quantidadeVendida * precoUnitario;
  const custoTotalVenda = quantidadeVendida * custoUnitarioAtualizado;
  let custosVenda;

  try {
    custosVenda = lerCustosVendaDoFormulario();
  } catch (erro) {
    mostrarAviso(erro.message);
    return;
  }

  const totalCustosVenda = somarCustosVenda(custosVenda);
  const lucroBruto = valorTotal - custoTotalVenda - totalCustosVenda;

  const venda = {
    id: "VENDA-" + Date.now(),
    produtoNome: produto.nome,
    sku: produto.sku,
    quantidadeVendida: quantidadeVendida,
    precoUnitario: precoUnitario,
    valorTotal: valorTotal,
    custoUnitario: custoUnitarioAtualizado,
    custoTotal: custoTotalVenda,
    custoUnitarioAtualizado: custoUnitarioAtualizado,
    custoTotalVenda: custoTotalVenda,
    custosVenda: custosVenda,
    totalCustosVenda: totalCustosVenda,
    lucroBruto: lucroBruto,
    dataVenda: dataVenda,
    cliente: campoCliente.value.trim(),
    observacoes: campoObservacoes.value.trim()
  };

  const vendas = buscarVendas();
  vendas.push(venda);
  salvarVendas(vendas);

  produto.quantidade = produto.quantidade - quantidadeVendida;
  salvarProdutos(produtos);

  console.log("Venda registrada:", venda);

  alert("Venda registrada com sucesso.");
  mostrarSucesso("Venda registrada e estoque atualizado.");
  formularioVenda.reset();
  campoValorTotal.value = "";
  campoCustoUnitario.value = "";
  campoCustoTotalVenda.value = "";
  campoLucroBruto.value = "";
  selectProduto.innerHTML = '<option value="">Selecione um produto</option>';
  carregarProdutosNoSelect();
});

selectProduto.addEventListener("change", selecionarProduto);
campoQuantidade.addEventListener("input", calcularValoresVenda);
campoPrecoUnitario.addEventListener("input", calcularValoresVenda);
campoCustosVenda.addEventListener("input", calcularValoresVenda);

carregarProdutosNoSelect();
