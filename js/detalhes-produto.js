const tituloProduto = document.getElementById("tituloProduto");
const subtituloProduto = document.getElementById("subtituloProduto");
const mensagemProdutoNaoEncontrado = document.getElementById("mensagemProdutoNaoEncontrado");
const dadosProduto = document.getElementById("dadosProduto");
const resumoFinanceiro = document.getElementById("resumoFinanceiro");
const mensagemCustosProduto = document.getElementById("mensagemCustosProduto");
const tabelaCustosProduto = document.getElementById("tabelaCustosProduto");
const mensagemVendasProduto = document.getElementById("mensagemVendasProduto");
const tabelaVendasProduto = document.getElementById("tabelaVendasProduto");

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function buscarCustos() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterPecaIdDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  return Number(parametros.get("pecaId"));
}

function filtrarCustosPorPeca(pecaId) {
  return buscarCustos().filter(custo => Number(custo.pecaId || 0) === Number(pecaId || 0));
}

function filtrarVendasPorPeca(pecaId) {
  return buscarVendas().filter(venda => Number(venda.pecaId || 0) === Number(pecaId || 0));
}

function calcularLucroVenda(venda) {
  if (venda.valorTotal !== undefined) {
    const custoTotal = Number(venda.custoTotal || venda.custoTotalVenda || 0);
    return Number(venda.valorTotal || 0) - custoTotal - calcularTotalCustosVenda(venda);
  }

  return Number(venda.lucroBruto || 0);
}

function calcularTotalCustosVenda(venda) {
  if (venda.totalCustosVenda !== undefined) {
    return Number(venda.totalCustosVenda || 0);
  }

  if (!Array.isArray(venda.custosVenda)) {
    return 0;
  }

  return venda.custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
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

function calcularQuantidadeDisponivel(produto) {
  return Math.max(Number(produto.quantidade || 1) - Number(produto.quantidadeVendida || 0), 0);
}

function obterStatusProduto(produto) {
  return Number(produto.quantidadeVendida || 0) >= Number(produto.quantidade || 1)
    ? "vendida"
    : "em_estoque";
}

function renderizarDadosProduto(produto, custoBase) {
  tituloProduto.textContent = produto.nome;
  subtituloProduto.textContent = `ID ${produto.id} - ${produto.categoria || "Sem categoria"}`;
  const quantidade = Number(produto.quantidade || 1);
  const quantidadeVendida = Number(produto.quantidadeVendida || 0);
  const quantidadeDisponivel = calcularQuantidadeDisponivel(produto);
  const status = obterStatusProduto(produto);

  dadosProduto.innerHTML = `
    <article class="detail-card">
      <span>Nome da peça</span>
      <strong>${produto.nome}</strong>
    </article>
    <article class="detail-card">
      <span>ID da peca</span>
      <strong>${produto.id}</strong>
    </article>
    <article class="detail-card">
      <span>Categoria</span>
      <strong>${produto.categoria || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Origem</span>
      <strong>${produto.origem || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade total</span>
      <strong>${quantidade}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade vendida</span>
      <strong>${quantidadeVendida}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade disponível</span>
      <strong>${quantidadeDisponivel}</strong>
    </article>
    <article class="detail-card">
      <span>Status</span>
      <strong>${status}</strong>
    </article>
    <article class="detail-card">
      <span>Custo base</span>
      <strong>${formatarMoeda(custoBase)}</strong>
    </article>
    <article class="detail-card">
      <span>Preço de venda</span>
      <strong>${formatarMoeda(produto.precoVenda)}</strong>
    </article>
    <article class="detail-card">
      <span>Observações</span>
      <strong>${produto.observacoes || "-"}</strong>
    </article>
  `;
}

function renderizarResumo(produto, custos, vendas, custoBase) {
  const totalCustosDiversos = custos.reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const custoTotalAtualizado = custoBase + totalCustosDiversos;
  const quantidadeVendida = vendas.reduce((total, venda) => {
    return total + Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
  }, 0);
  const faturamentoTotal = vendas.reduce((total, venda) => total + Number(venda.valorTotal || 0), 0);
  const lucroBruto = vendas.reduce((total, venda) => total + calcularLucroVenda(venda), 0);

  resumoFinanceiro.innerHTML = `
    <article class="summary-card">
      <span>Custo base</span>
      <strong>${formatarMoeda(custoBase)}</strong>
    </article>
    <article class="summary-card">
      <span>Total de custos diversos</span>
      <strong>${formatarMoeda(totalCustosDiversos)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo total atualizado</span>
      <strong>${formatarMoeda(custoTotalAtualizado)}</strong>
    </article>
    <article class="summary-card">
      <span>Preço de venda</span>
      <strong>${formatarMoeda(produto.precoVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Quantidade vendida</span>
      <strong>${quantidadeVendida}</strong>
    </article>
    <article class="summary-card">
      <span>Faturamento total da peça</span>
      <strong>${formatarMoeda(faturamentoTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Lucro bruto da peça</span>
      <strong>${formatarMoeda(lucroBruto)}</strong>
    </article>
  `;
}

function renderizarCustos(custos) {
  tabelaCustosProduto.innerHTML = "";

  if (custos.length === 0) {
    mensagemCustosProduto.textContent = "Nenhum custo diverso cadastrado para esta peça.";
    return;
  }

  mensagemCustosProduto.textContent = "";

  custos.forEach(custo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${custo.data}</td>
      <td data-label="Tipo">${custo.tipo}</td>
      <td data-label="Descrição">${custo.descricao}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Observações">${custo.observacoes || "-"}</td>
    `;

    tabelaCustosProduto.appendChild(linha);
  });
}

function renderizarVendas(vendas) {
  tabelaVendasProduto.innerHTML = "";

  if (vendas.length === 0) {
    mensagemVendasProduto.textContent = "Nenhuma venda registrada para esta peça.";
    return;
  }

  mensagemVendasProduto.textContent = "";

  vendas.forEach(venda => {
    const custoTotal = Number(venda.custoTotalVenda || venda.custoTotal || 0) + calcularTotalCustosVenda(venda);
    const lucroBruto = calcularLucroVenda(venda);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${venda.dataVenda}</td>
      <td data-label="Quantidade">${venda.quantidadeVendidaNaVenda || venda.quantidadeVendida}</td>
      <td data-label="Preço unitário">${formatarMoeda(venda.precoUnitario)}</td>
      <td data-label="Valor total">${formatarMoeda(venda.valorTotal)}</td>
      <td data-label="Custo total">${formatarMoeda(custoTotal)}</td>
      <td data-label="Lucro bruto">${formatarMoeda(lucroBruto)}</td>
      <td data-label="Cliente">${venda.cliente || "-"}</td>
    `;

    tabelaVendasProduto.appendChild(linha);
  });
}

function iniciarDetalhes() {
  const pecaId = obterPecaIdDaUrl();
  const produtos = buscarProdutos();
  const produto = produtos.find(item => Number(item.id) === Number(pecaId));

  if (!pecaId || !produto) {
    mensagemProdutoNaoEncontrado.textContent = "Produto não encontrado.";
    dadosProduto.innerHTML = "";
    resumoFinanceiro.innerHTML = "";
    return;
  }

  const custos = filtrarCustosPorPeca(pecaId);
  const vendas = filtrarVendasPorPeca(pecaId);
  const origem = buscarOrigens().find(item => item.id === Number(produto.origemId || 0));
  const pecasDaOrigem = produtos.filter(item => Number(item.origemId || 0) === Number(produto.origemId || 0));
  const custoBase = calcularCustoPeca(produto, pecasDaOrigem, origem);

  mensagemProdutoNaoEncontrado.textContent = "";
  renderizarDadosProduto(produto, custoBase);
  renderizarResumo(produto, custos, vendas, custoBase);
  renderizarCustos(custos);
  renderizarVendas(vendas);
}

iniciarDetalhes();
