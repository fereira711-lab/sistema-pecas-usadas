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

function salvarLista(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.produtoNome || peca.descricao || `Peca ${peca.id || peca.pecaId}`;
  const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function somar(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function somarCustosPorPeca(custos, pecaId) {
  return custos
    .filter(custo => Number(custo.pecaId || 0) === Number(pecaId || 0))
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
  const custoTotal = Number(venda.custoTotal || venda.custoTotalVenda || 0);

  return Number(venda.valorTotal || 0) - custoTotal - calcularTotalCustosVenda(venda);
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

function calcularQuantidadeDisponivel(produto) {
  return Math.max(Number(produto.quantidade || 1) - Number(produto.quantidadeVendida || 0), 0);
}

function obterStatusProduto(produto) {
  return Number(produto.quantidadeVendida || 0) >= Number(produto.quantidade || 1)
    ? "vendida"
    : "em_estoque";
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
  const totalProdutos = dados.pecas.length;
  const quantidadeEstoque = dados.pecas.reduce((total, peca) => total + calcularQuantidadeDisponivel(peca), 0);
  const totalOrigens = dados.origens.length;
  const valorInvestido = somar(dados.origens, "valorPago");
  const totalCustos = somar(dados.custosPeca, "valor");
  const faturamento = somar(dados.vendas, "valorTotal");
  const custosDasVendas = dados.vendas.reduce((total, venda) => total + calcularTotalCustosVenda(venda), 0);
  const custosReaisTotais = valorInvestido + totalCustos + somarCustosReaisDasPecas(dados.pecas);
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
    const custosDiversos = somarCustosPorPeca(custos, produto.id);
    const custoTotal = custoBase + custosDiversos;
    const quantidade = Number(produto.quantidade || 1);
    const quantidadeVendida = Number(produto.quantidadeVendida || 0);
    const quantidadeDisponivel = calcularQuantidadeDisponivel(produto);
    const status = obterStatusProduto(produto);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Produto">${formatarNomePeca(produto)}</td>
      <td data-label="ID">${produto.id}</td>
      <td data-label="Categoria">${produto.categoria || "-"}</td>
      <td data-label="Qtd. total">${quantidade}</td>
      <td data-label="Qtd. vendida">${quantidadeVendida}</td>
      <td data-label="Qtd. disponível">${quantidadeDisponivel}</td>
      <td data-label="Status">${status}</td>
      <td data-label="Custo base">${formatarMoeda(custoBase)}</td>
      <td data-label="Custos diversos">${formatarMoeda(custosDiversos)}</td>
      <td data-label="Custo total">${formatarMoeda(custoTotal)}</td>
      <td data-label="Preço de venda">${formatarMoeda(produto.precoVenda)}</td>
    `;

    tabelaResumoEstoque.appendChild(linha);
  });
}

function renderizarAlertasEstoque(produtos) {
  const alertas = produtos.filter(produto => calcularQuantidadeDisponivel(produto) <= 1);
  tabelaAlertasEstoque.innerHTML = "";

  if (alertas.length === 0) {
    mensagemAlertasEstoque.textContent = "Nenhum alerta de estoque no momento.";
    return;
  }

  mensagemAlertasEstoque.textContent = "";

  alertas.forEach(produto => {
    const quantidade = calcularQuantidadeDisponivel(produto);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Produto">${formatarNomePeca(produto)}</td>
      <td data-label="ID">${produto.id}</td>
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

  vendas.slice(0, 5).forEach((venda, posicao) => {
    const indexOriginal = posicao;
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${venda.dataVenda || "-"}</td>
      <td data-label="Produto">${formatarNomePeca({ id: venda.pecaId, nome: venda.produtoNome, sku: venda.sku }) || "-"}</td>
      <td data-label="ID da peca">${venda.pecaId || "-"}</td>
      <td data-label="Quantidade">${venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0}</td>
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
    const chave = venda.pecaId || venda.produtoNome || "sem-peca";

    if (!agrupado[chave]) {
      agrupado[chave] = {
        produto: formatarNomePeca({ id: venda.pecaId, nome: venda.produtoNome, sku: venda.sku }) || "-",
        pecaId: venda.pecaId || "-",
        quantidade: 0,
        faturamento: 0,
        lucro: 0
      };
    }

    agrupado[chave].quantidade += Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
    agrupado[chave].faturamento += Number(venda.valorTotal || 0);
    agrupado[chave].lucro += calcularLucroVenda(venda);
  });

  Object.values(agrupado)
    .sort((a, b) => b.quantidade - a.quantidade)
    .forEach(item => {
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td data-label="Produto">${item.produto}</td>
        <td data-label="ID da peca">${item.pecaId}</td>
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

function agruparCustosVendaPorVenda(custosVenda) {
  return custosVenda.reduce((mapa, custo) => {
    const vendaId = Number(custo.vendaId || 0);

    if (!mapa[vendaId]) {
      mapa[vendaId] = [];
    }

    mapa[vendaId].push(custo);
    return mapa;
  }, {});
}

function prepararVendas(vendas, pecas, custosVenda) {
  const custosPorVenda = agruparCustosVendaPorVenda(custosVenda);

  return vendas.map(venda => {
    const peca = pecas.find(item => Number(item.id) === Number(venda.pecaId));
    const quantidade = Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0);
    const custoUnitario = Number(peca?.custoTotal || peca?.custo || 0);
    const custosDaVenda = custosPorVenda[Number(venda.id)] || venda.custosVenda || [];

    return {
      ...venda,
      produtoNome: venda.produtoNome || peca?.nome || "-",
      sku: venda.sku || peca?.sku || "",
      pecaId: venda.pecaId || peca?.id || "",
      custoTotalVenda: custoUnitario * quantidade,
      custosVenda: custosDaVenda,
      totalCustosVenda: custosDaVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0)
    };
  }).sort((a, b) => {
    const dataA = new Date(a.dataVenda || 0).getTime();
    const dataB = new Date(b.dataVenda || 0).getTime();

    if (dataA !== dataB) {
      return dataB - dataA;
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

async function carregarDadosRelatorios() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const [origens, pecas, custosPeca, vendas, custosVenda] = await Promise.all([
        window.supabaseService.listarOrigens(),
        window.supabaseService.listarPecas(),
        window.supabaseService.listarCustosPeca(),
        window.supabaseService.listarVendas(),
        window.supabaseService.listarCustosVenda()
      ]);

      const vendasPreparadas = prepararVendas(vendas, pecas, custosVenda);

      salvarLista("origens", origens);
      salvarLista("produtos", pecas);
      salvarLista("custosDiversos", custosPeca);
      salvarLista("vendas", vendasPreparadas);

      return {
        origens,
        pecas,
        custosPeca,
        vendas: vendasPreparadas
      };
    } catch (erro) {
      console.error("Erro ao carregar relatorios do Supabase:", erro);
      mensagemEstoqueRelatorio.textContent = "Nao foi possivel carregar do Supabase. Exibindo dados temporarios do navegador.";
    }
  }

  const pecas = buscarLista("produtos");
  const custosPeca = buscarLista("custosDiversos");
  const vendas = prepararVendas(buscarLista("vendas"), pecas, buscarLista("custosVenda"));

  return {
    origens: buscarLista("origens"),
    pecas,
    custosPeca,
    vendas
  };
}

async function iniciarRelatorios() {
  const dados = await carregarDadosRelatorios();

  renderizarCardsPrincipais(dados);
  renderizarResumoEstoque(dados.pecas, dados.custosPeca, dados.origens);
  renderizarAlertasEstoque(dados.pecas);
  renderizarResumoVendas(dados.vendas);
  renderizarProdutosMaisVendidos(dados.vendas);
  renderizarCustosPorTipo(dados.custosPeca);
}

iniciarRelatorios();

window.addEventListener("focus", iniciarRelatorios);
