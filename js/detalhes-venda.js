const tituloVenda = document.getElementById("tituloVenda");
const subtituloVenda = document.getElementById("subtituloVenda");
const mensagemVendaNaoEncontrada = document.getElementById("mensagemVendaNaoEncontrada");
const dadosVenda = document.getElementById("dadosVenda");
const resumoFinanceiroVenda = document.getElementById("resumoFinanceiroVenda");
const mensagemProdutoVenda = document.getElementById("mensagemProdutoVenda");
const dadosProdutoVenda = document.getElementById("dadosProdutoVenda");
const acaoDetalhesProduto = document.getElementById("acaoDetalhesProduto");
const mensagemCustosVenda = document.getElementById("mensagemCustosVenda");
const tabelaCustosVenda = document.getElementById("tabelaCustosVenda");

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function buscarCustos() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarPorcentagem(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function encontrarVenda() {
  const vendas = buscarVendas();
  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get("id");
  const index = parametros.get("index");

  if (id) {
    const vendaPorId = vendas.find(venda => venda.id === id);

    if (vendaPorId) {
      return vendaPorId;
    }
  }

  if (index !== null) {
    return vendas[Number(index)];
  }

  return null;
}

function calcularCustoUnitario(venda) {
  if (venda.custoUnitario !== undefined) {
    return Number(venda.custoUnitario || 0);
  }

  if (venda.custoUnitarioAtualizado !== undefined) {
    return Number(venda.custoUnitarioAtualizado || 0);
  }

  const custoTotal = calcularCustoTotal(venda);
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
  return quantidade > 0 ? custoTotal / quantidade : 0;
}

function calcularCustoTotal(venda) {
  if (venda.custoTotal !== undefined) {
    return Number(venda.custoTotal || 0);
  }

  if (venda.custoTotalVenda !== undefined) {
    return Number(venda.custoTotalVenda || 0);
  }

  return 0;
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

function calcularTotalCustosVenda(venda) {
  if (venda.totalCustosVenda !== undefined) {
    return Number(venda.totalCustosVenda || 0);
  }

  return normalizarCustosVenda(venda.custosVenda)
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function calcularLucroBruto(venda) {
  if (venda.valorTotal !== undefined) {
    return Number(venda.valorTotal || 0) - calcularCustoTotal(venda) - calcularTotalCustosVenda(venda);
  }

  return Number(venda.lucroBruto || 0);
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

function renderizarDadosVenda(venda) {
  tituloVenda.textContent = venda.id || "Venda sem ID";
  subtituloVenda.textContent = `${venda.produtoNome} • ${venda.dataVenda}`;

  dadosVenda.innerHTML = `
    <article class="detail-card">
      <span>ID da venda</span>
      <strong>${venda.id || "Venda antiga sem ID"}</strong>
    </article>
    <article class="detail-card">
      <span>Data da venda</span>
      <strong>${venda.dataVenda || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Produto</span>
      <strong>${venda.produtoNome}</strong>
    </article>
    <article class="detail-card">
      <span>SKU</span>
      <strong>${venda.sku || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade vendida</span>
      <strong>${venda.quantidadeVendidaNaVenda || venda.quantidadeVendida}</strong>
    </article>
    <article class="detail-card">
      <span>Preço unitário</span>
      <strong>${formatarMoeda(venda.precoUnitario)}</strong>
    </article>
    <article class="detail-card">
      <span>Valor total</span>
      <strong>${formatarMoeda(venda.valorTotal)}</strong>
    </article>
    <article class="detail-card">
      <span>Cliente</span>
      <strong>${venda.cliente || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Observações</span>
      <strong>${venda.observacoes || "-"}</strong>
    </article>
  `;
}

function renderizarResumoFinanceiro(venda) {
  const valorTotal = Number(venda.valorTotal || 0);
  const custoUnitario = calcularCustoUnitario(venda);
  const custoTotal = calcularCustoTotal(venda);
  const totalCustosVenda = calcularTotalCustosVenda(venda);
  const lucroBruto = calcularLucroBruto(venda);
  const margem = valorTotal > 0 ? (lucroBruto / valorTotal) * 100 : 0;

  resumoFinanceiroVenda.innerHTML = `
    <article class="summary-card">
      <span>Valor total da venda</span>
      <strong>${formatarMoeda(valorTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo unitário</span>
      <strong>${formatarMoeda(custoUnitario)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo total</span>
      <strong>${formatarMoeda(custoTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos da venda</span>
      <strong>${formatarMoeda(totalCustosVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Lucro bruto</span>
      <strong>${formatarMoeda(lucroBruto)}</strong>
    </article>
    <article class="summary-card">
      <span>Margem de lucro</span>
      <strong>${formatarPorcentagem(margem)}</strong>
    </article>
  `;
}

function renderizarProduto(venda) {
  const produtos = buscarProdutos();
  const produto = produtos.find(item => item.sku === venda.sku);

  if (!produto) {
    mensagemProdutoVenda.textContent = "Produto não encontrado no estoque atual.";
    dadosProdutoVenda.innerHTML = "";
    acaoDetalhesProduto.innerHTML = "";
    return;
  }

  mensagemProdutoVenda.textContent = "";
  const origem = buscarOrigens().find(item => item.id === Number(produto.origemId || 0));
  const pecasDaOrigem = produtos.filter(item => Number(item.origemId || 0) === Number(produto.origemId || 0));
  const custoBase = calcularCustoPeca(produto, pecasDaOrigem, origem);
  const quantidade = Number(produto.quantidade || 1);
  const quantidadeVendida = Number(produto.quantidadeVendida || 0);
  const quantidadeDisponivel = calcularQuantidadeDisponivel(produto);
  const status = obterStatusProduto(produto);

  acaoDetalhesProduto.innerHTML = `
    <a class="button-primary" href="detalhes-produto.html?sku=${encodeURIComponent(produto.sku)}">Ver detalhes da peça</a>
  `;

  dadosProdutoVenda.innerHTML = `
    <article class="detail-card">
      <span>Nome atual do produto</span>
      <strong>${produto.nome}</strong>
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
      <span>Custo base atual</span>
      <strong>${formatarMoeda(custoBase)}</strong>
    </article>
    <article class="detail-card">
      <span>Preço de venda atual</span>
      <strong>${formatarMoeda(produto.precoVenda)}</strong>
    </article>
  `;
}

function renderizarCustos(venda) {
  const custos = buscarCustos().filter(custo => custo.sku === venda.sku);
  const custosVenda = normalizarCustosVenda(venda.custosVenda);
  tabelaCustosVenda.innerHTML = "";

  if (custos.length === 0 && custosVenda.length === 0) {
    mensagemCustosVenda.textContent = "Nenhum custo diverso vinculado a este produto.";
    return;
  }

  mensagemCustosVenda.textContent = "";

  custos.forEach(custo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${custo.data}</td>
      <td data-label="Tipo">${custo.tipo}</td>
      <td data-label="Descrição">${custo.descricao}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
    `;

    tabelaCustosVenda.appendChild(linha);
  });

  custosVenda.forEach(custo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${venda.dataVenda || "-"}</td>
      <td data-label="Tipo">Venda - ${custo.tipo}</td>
      <td data-label="Descrição">${custo.descricao || "-"}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
    `;

    tabelaCustosVenda.appendChild(linha);
  });
}

function iniciarDetalhesVenda() {
  const venda = encontrarVenda();

  if (!venda) {
    mensagemVendaNaoEncontrada.textContent = "Venda não encontrada.";
    dadosVenda.innerHTML = "";
    resumoFinanceiroVenda.innerHTML = "";
    return;
  }

  mensagemVendaNaoEncontrada.textContent = "";
  renderizarDadosVenda(venda);
  renderizarResumoFinanceiro(venda);
  renderizarProduto(venda);
  renderizarCustos(venda);
}

iniciarDetalhesVenda();
