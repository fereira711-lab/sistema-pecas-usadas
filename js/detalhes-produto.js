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

function obterSkuDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  return parametros.get("sku");
}

function filtrarCustosPorSku(sku) {
  return buscarCustos().filter(custo => custo.sku === sku);
}

function filtrarVendasPorSku(sku) {
  return buscarVendas().filter(venda => venda.sku === sku);
}

function calcularLucroVenda(venda) {
  if (venda.lucroBruto !== undefined) {
    return Number(venda.lucroBruto || 0);
  }

  return Number(venda.valorTotal || 0) - Number(venda.custoTotal || venda.custoTotalVenda || 0);
}

function renderizarDadosProduto(produto) {
  tituloProduto.textContent = produto.nome;
  subtituloProduto.textContent = `SKU ${produto.sku || "-"} • ${produto.categoria || "Sem categoria"}`;

  dadosProduto.innerHTML = `
    <article class="detail-card">
      <span>Nome da peça</span>
      <strong>${produto.nome}</strong>
    </article>
    <article class="detail-card">
      <span>SKU</span>
      <strong>${produto.sku || "-"}</strong>
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
      <span>Quantidade em estoque</span>
      <strong>${produto.quantidade}</strong>
    </article>
    <article class="detail-card">
      <span>Custo base</span>
      <strong>${formatarMoeda(produto.custo)}</strong>
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

function renderizarResumo(produto, custos, vendas) {
  const custoBase = Number(produto.custo || 0);
  const totalCustosDiversos = custos.reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const custoTotalAtualizado = custoBase + totalCustosDiversos;
  const quantidadeVendida = vendas.reduce((total, venda) => total + Number(venda.quantidadeVendida || 0), 0);
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
    const custoTotal = Number(venda.custoTotalVenda || venda.custoTotal || 0);
    const lucroBruto = calcularLucroVenda(venda);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${venda.dataVenda}</td>
      <td data-label="Quantidade">${venda.quantidadeVendida}</td>
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
  const sku = obterSkuDaUrl();
  const produto = buscarProdutos().find(item => item.sku === sku);

  if (!sku || !produto) {
    mensagemProdutoNaoEncontrado.textContent = "Produto não encontrado.";
    dadosProduto.innerHTML = "";
    resumoFinanceiro.innerHTML = "";
    return;
  }

  const custos = filtrarCustosPorSku(sku);
  const vendas = filtrarVendasPorSku(sku);

  mensagemProdutoNaoEncontrado.textContent = "";
  renderizarDadosProduto(produto);
  renderizarResumo(produto, custos, vendas);
  renderizarCustos(custos);
  renderizarVendas(vendas);
}

iniciarDetalhes();
