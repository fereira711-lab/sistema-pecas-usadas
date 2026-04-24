const cardsRelatorios = document.getElementById("cardsRelatorios");
const tabelaResumoEstoque = document.getElementById("tabelaResumoEstoque");
const tabelaAlertasEstoque = document.getElementById("tabelaAlertasEstoque");
const tabelaResumoVendas = document.getElementById("tabelaResumoVendas");
const tabelaProdutosMaisVendidos = document.getElementById("tabelaProdutosMaisVendidos");
const tabelaCustosPorTipo = document.getElementById("tabelaCustosPorTipo");
const mensagemEstoqueRelatorio = document.getElementById("mensagemEstoqueRelatorio");
const mensagemAlertasEstoque = document.getElementById("mensagemAlertasEstoque");
const mensagemResumoVendas = document.getElementById("mensagemResumoVendas");
const mensagemProdutosMaisVendidos = document.getElementById("mensagemProdutosMaisVendidos");
const mensagemCustosPorTipo = document.getElementById("mensagemCustosPorTipo");

function buscarLista(chave) {
  return JSON.parse(localStorage.getItem(chave)) || [];
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function somar(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function somarCustosPorSku(custos, sku) {
  return custos
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

function somarCustosReaisDasPecas(produtos) {
  return produtos
    .filter(produto => produto.tipoCusto === "real")
    .reduce((total, produto) => total + Number(produto.custo || 0), 0);
}

function criarCard(titulo, valor) {
  return `
    <article class="summary-card">
      <span>${titulo}</span>
      <strong>${valor}</strong>
    </article>
  `;
}

function renderizarCardsPrincipais(dados) {
  const totalProdutos = dados.produtos.length;
  const quantidadeEstoque = somar(dados.produtos, "quantidade");
  const totalOrigens = dados.origens.length;
  const valorInvestido = somar(dados.origens, "valorPago");
  const totalCustos = somar(dados.custos, "valor");
  const faturamento = somar(dados.vendas, "valorTotal");
  const custosDasVendas = dados.vendas.reduce((total, venda) => total + calcularTotalCustosVenda(venda), 0);
  const custosReaisTotais = valorInvestido + totalCustos + somarCustosReaisDasPecas(dados.produtos);
  const custoVendas = custosReaisTotais + custosDasVendas;
  const lucroBruto = faturamento - custosReaisTotais - custosDasVendas;

  cardsRelatorios.innerHTML =
    criarCard("Total de produtos cadastrados", totalProdutos) +
    criarCard("Quantidade total em estoque", quantidadeEstoque) +
    criarCard("Total de origens cadastradas", totalOrigens) +
    criarCard("Valor total investido em origens", formatarMoeda(valorInvestido)) +
    criarCard("Total de custos diversos", formatarMoeda(totalCustos)) +
    criarCard("Faturamento total", formatarMoeda(faturamento)) +
    criarCard("Custo total das vendas", formatarMoeda(custoVendas)) +
    criarCard("Lucro bruto total", formatarMoeda(lucroBruto));
}

function renderizarResumoEstoque(produtos, custos, origens) {
  tabelaResumoEstoque.innerHTML = "";

  if (produtos.length === 0) {
    mensagemEstoqueRelatorio.textContent = "Nenhum produto cadastrado.";
    return;
  }

  mensagemEstoqueRelatorio.textContent = "";

  produtos.forEach(produto => {
    const origem = origens.find(item => item.id === Number(produto.origemId || 0));
    const pecasDaOrigem = produtos.filter(item => Number(item.origemId || 0) === Number(produto.origemId || 0));
    const custoBase = calcularCustoPeca(produto, pecasDaOrigem, origem);
    const custosDiversos = somarCustosPorSku(custos, produto.sku);
    const custoTotal = custoBase + custosDiversos;
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Produto">${produto.nome}</td>
      <td data-label="SKU">${produto.sku || "-"}</td>
      <td data-label="Categoria">${produto.categoria || "-"}</td>
      <td data-label="Quantidade">${produto.quantidade || 0}</td>
      <td data-label="Custo base">${formatarMoeda(custoBase)}</td>
      <td data-label="Custos diversos">${formatarMoeda(custosDiversos)}</td>
      <td data-label="Custo total">${formatarMoeda(custoTotal)}</td>
      <td data-label="Preço de venda">${formatarMoeda(produto.precoVenda)}</td>
    `;

    tabelaResumoEstoque.appendChild(linha);
  });
}

function renderizarAlertasEstoque(produtos) {
  const alertas = produtos.filter(produto => Number(produto.quantidade || 0) <= 1);
  tabelaAlertasEstoque.innerHTML = "";

  if (alertas.length === 0) {
    mensagemAlertasEstoque.textContent = "Nenhum alerta de estoque no momento.";
    return;
  }

  mensagemAlertasEstoque.textContent = "";

  alertas.forEach(produto => {
    const quantidade = Number(produto.quantidade || 0);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Produto">${produto.nome}</td>
      <td data-label="SKU">${produto.sku || "-"}</td>
      <td data-label="Quantidade">${quantidade}</td>
      <td data-label="Situação">${quantidade === 0 ? "Sem estoque" : "Estoque baixo"}</td>
    `;

    tabelaAlertasEstoque.appendChild(linha);
  });
}

function abrirDetalhesVenda(venda, index) {
  if (venda.id) {
    return `detalhes-venda.html?id=${encodeURIComponent(venda.id)}`;
  }

  return `detalhes-venda.html?index=${index}`;
}

function renderizarResumoVendas(vendas) {
  tabelaResumoVendas.innerHTML = "";

  if (vendas.length === 0) {
    mensagemResumoVendas.textContent = "Nenhuma venda registrada.";
    return;
  }

  mensagemResumoVendas.textContent = "";

  vendas.slice(-5).reverse().forEach((venda, posicao) => {
    const indexOriginal = vendas.length - 1 - posicao;
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${venda.dataVenda || "-"}</td>
      <td data-label="Produto">${venda.produtoNome || "-"}</td>
      <td data-label="SKU">${venda.sku || "-"}</td>
      <td data-label="Quantidade">${venda.quantidadeVendida || 0}</td>
      <td data-label="Valor total">${formatarMoeda(venda.valorTotal)}</td>
      <td data-label="Lucro bruto">${formatarMoeda(calcularLucroVenda(venda))}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <a class="table-link" href="${abrirDetalhesVenda(venda, indexOriginal)}">Ver detalhes</a>
        </div>
      </td>
    `;

    tabelaResumoVendas.appendChild(linha);
  });
}

function renderizarProdutosMaisVendidos(vendas) {
  tabelaProdutosMaisVendidos.innerHTML = "";

  if (vendas.length === 0) {
    mensagemProdutosMaisVendidos.textContent = "Nenhuma venda registrada.";
    return;
  }

  mensagemProdutosMaisVendidos.textContent = "";

  const agrupado = {};

  vendas.forEach(venda => {
    const chave = venda.sku || venda.produtoNome || "sem-sku";

    if (!agrupado[chave]) {
      agrupado[chave] = {
        produto: venda.produtoNome || "-",
        sku: venda.sku || "-",
        quantidade: 0,
        faturamento: 0,
        lucro: 0
      };
    }

    agrupado[chave].quantidade += Number(venda.quantidadeVendida || 0);
    agrupado[chave].faturamento += Number(venda.valorTotal || 0);
    agrupado[chave].lucro += calcularLucroVenda(venda);
  });

  Object.values(agrupado)
    .sort((a, b) => b.quantidade - a.quantidade)
    .forEach(item => {
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td data-label="Produto">${item.produto}</td>
        <td data-label="SKU">${item.sku}</td>
        <td data-label="Quantidade vendida">${item.quantidade}</td>
        <td data-label="Faturamento">${formatarMoeda(item.faturamento)}</td>
        <td data-label="Lucro bruto">${formatarMoeda(item.lucro)}</td>
      `;

      tabelaProdutosMaisVendidos.appendChild(linha);
    });
}

function renderizarCustosPorTipo(custos) {
  tabelaCustosPorTipo.innerHTML = "";

  if (custos.length === 0) {
    mensagemCustosPorTipo.textContent = "Nenhum custo diverso cadastrado.";
    return;
  }

  mensagemCustosPorTipo.textContent = "";

  const agrupado = {};

  custos.forEach(custo => {
    const tipo = custo.tipo || "Outro";
    agrupado[tipo] = (agrupado[tipo] || 0) + Number(custo.valor || 0);
  });

  Object.entries(agrupado).forEach(([tipo, valor]) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Tipo de custo">${tipo}</td>
      <td data-label="Valor total">${formatarMoeda(valor)}</td>
    `;

    tabelaCustosPorTipo.appendChild(linha);
  });
}

function iniciarRelatorios() {
  const dados = {
    origens: buscarLista("origens"),
    produtos: buscarLista("produtos"),
    custos: buscarLista("custosDiversos"),
    vendas: buscarLista("vendas")
  };

  renderizarCardsPrincipais(dados);
  renderizarResumoEstoque(dados.produtos, dados.custos, dados.origens);
  renderizarAlertasEstoque(dados.produtos);
  renderizarResumoVendas(dados.vendas);
  renderizarProdutosMaisVendidos(dados.vendas);
  renderizarCustosPorTipo(dados.custos);
}

iniciarRelatorios();

window.addEventListener("focus", iniciarRelatorios);
