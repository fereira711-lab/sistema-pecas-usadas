const tabelaEstoque = document.getElementById("tabelaEstoque");
const mensagemEstoque = document.getElementById("mensagemEstoque");

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function buscarCustos() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarProdutos(produtos) {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
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

function calcularQuantidadeDisponivel(produto) {
  return Math.max(Number(produto.quantidade || 1) - Number(produto.quantidadeVendida || 0), 0);
}

function obterStatusProduto(produto) {
  return Number(produto.quantidadeVendida || 0) >= Number(produto.quantidade || 1)
    ? "vendida"
    : "em_estoque";
}

function renderizarEstoque() {
  const produtos = buscarProdutos();
  const origens = buscarOrigens();
  tabelaEstoque.innerHTML = "";

  if (produtos.length === 0) {
    mensagemEstoque.textContent = "Nenhuma peça cadastrada no estoque.";
    return;
  }

  mensagemEstoque.textContent = "";

  produtos.forEach((produto, indice) => {
    const origem = origens.find(item => item.id === Number(produto.origemId || 0));
    const pecasDaOrigem = produtos.filter(item => Number(item.origemId || 0) === Number(produto.origemId || 0));
    const custoBase = calcularCustoPeca(produto, pecasDaOrigem, origem);
    const custosDiversos = somarCustosPorSku(produto.sku);
    const custoTotal = custoBase + custosDiversos;
    const quantidade = Number(produto.quantidade || 1);
    const quantidadeVendida = Number(produto.quantidadeVendida || 0);
    const quantidadeDisponivel = calcularQuantidadeDisponivel(produto);
    const status = obterStatusProduto(produto);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Nome da peça">${produto.nome}</td>
      <td data-label="SKU">${produto.sku || "-"}</td>
      <td data-label="Categoria">${produto.categoria}</td>
      <td data-label="Origem">${produto.origem}</td>
      <td data-label="Qtd. total">${quantidade}</td>
      <td data-label="Qtd. vendida">${quantidadeVendida}</td>
      <td data-label="Qtd. disponível">${quantidadeDisponivel}</td>
      <td data-label="Status">${status}</td>
      <td data-label="Custo base">${formatarMoeda(custoBase)}</td>
      <td data-label="Custos diversos">${formatarMoeda(custosDiversos)}</td>
      <td data-label="Custo total">${formatarMoeda(custoTotal)}</td>
      <td data-label="Preço de venda">${formatarMoeda(produto.precoVenda)}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <button type="button" data-acao="detalhes" data-sku="${produto.sku}">Ver detalhes</button>
          <button type="button" data-acao="editar" data-indice="${indice}">Editar</button>
          <button type="button" data-acao="remover" data-indice="${indice}">Remover</button>
        </div>
      </td>
    `;

    tabelaEstoque.appendChild(linha);
  });
}

function abrirDetalhesProduto(sku) {
  window.location.href = `detalhes-produto.html?sku=${encodeURIComponent(sku)}`;
}

function removerProduto(indice) {
  const produtos = buscarProdutos();
  const confirmarRemocao = confirm(`Deseja remover "${produtos[indice].nome}" do estoque?`);

  if (!confirmarRemocao) {
    return;
  }

  produtos.splice(indice, 1);
  salvarProdutos(produtos);
  renderizarEstoque();
}

tabelaEstoque.addEventListener("click", function (evento) {
  const botao = evento.target.closest("button");

  if (!botao) {
    return;
  }

  const acao = botao.dataset.acao;

  if (acao === "detalhes") {
    abrirDetalhesProduto(botao.dataset.sku);
  }

  if (acao === "editar") {
    alert("A função de editar será criada depois.");
  }

  if (acao === "remover") {
    const indice = Number(botao.dataset.indice);
    removerProduto(indice);
  }
});

renderizarEstoque();

window.addEventListener("focus", renderizarEstoque);
