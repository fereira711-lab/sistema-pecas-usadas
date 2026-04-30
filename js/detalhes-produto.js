const tituloProduto = document.getElementById("tituloProduto");
const subtituloProduto = document.getElementById("subtituloProduto");
const mensagemProdutoNaoEncontrado = document.getElementById("mensagemProdutoNaoEncontrado");
const dadosProduto = document.getElementById("dadosProduto");
const resumoFinanceiro = document.getElementById("resumoFinanceiro");
const mensagemEntradasProduto = document.getElementById("mensagemEntradasProduto");
const tabelaEntradasProduto = document.getElementById("tabelaEntradasProduto");
const mensagemCustosProduto = document.getElementById("mensagemCustosProduto");
const tabelaCustosProduto = document.getElementById("tabelaCustosProduto");
const mensagemVendasProduto = document.getElementById("mensagemVendasProduto");
const tabelaVendasProduto = document.getElementById("tabelaVendasProduto");

let contextoProduto = {
  produto: null,
  entradas: [],
  custosPeca: [],
  vendas: [],
  custosVenda: [],
  consumosEstoque: [],
  origemPrincipal: ""
};

function buscarProdutosLocais() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function buscarOrigensLocais() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function buscarCustosLocais() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function buscarVendasLocais() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  const dataIso = String(data).slice(0, 10);
  const partes = dataIso.split("-");

  if (partes.length !== 3) {
    return dataIso;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.produtoNome || peca.descricao || `Peça ${peca.id || peca.pecaId}`;
  const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function obterPecaIdDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  return Number(parametros.get("pecaId") || parametros.get("id"));
}

function valorVenda(venda) {
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
  const unitario = Number(venda.valorUnitario || venda.precoUnitario || venda.valor_unitario || 0);
  return Number(venda.valorTotal || venda.valor_total || venda.valorVenda || unitario * quantidade || 0);
}

function quantidadeVendida(venda) {
  return Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
}

function obterStatusEntrada(entrada) {
  const total = Number(entrada.quantidadeTotal || 0);
  const consumida = Number(entrada.quantidadeConsumida || 0);
  const saldo = Math.max(total - consumida, 0);

  if (saldo <= 0 && total > 0) {
    return "esgotada";
  }

  if (consumida > 0) {
    return "parcial";
  }

  return "disponível";
}

function ordenarVendasPorData(vendas) {
  return [...vendas].sort((a, b) => {
    const dataA = obterDataVenda(a);
    const dataB = obterDataVenda(b);

    if (dataA !== dataB) {
      return dataB.localeCompare(dataA);
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function calcularDiasSemVenda(ultimaVenda) {
  if (!ultimaVenda) {
    return "-";
  }

  const hoje = new Date();
  const data = new Date(`${ultimaVenda}T00:00:00`);
  const hojeLocal = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dataLocal = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diferenca = hojeLocal.getTime() - dataLocal.getTime();

  return Math.max(Math.floor(diferenca / 86400000), 0);
}

function calcularResultado() {
  const receitaTotal = contextoProduto.vendas.reduce((total, venda) => total + valorVenda(venda), 0);
  const custoEntradasConsumidas = contextoProduto.consumosEstoque.reduce((total, consumo) => total + Number(consumo.custoTotal || 0), 0);
  const custosDaPeca = contextoProduto.custosPeca.reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const custosDaVenda = contextoProduto.custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const quantidadeTotalVendida = contextoProduto.vendas.reduce((total, venda) => total + quantidadeVendida(venda), 0);
  const vendasOrdenadas = ordenarVendasPorData(contextoProduto.vendas);
  const ultimaVenda = vendasOrdenadas.length > 0 ? obterDataVenda(vendasOrdenadas[0]) : "";

  return {
    receitaTotal,
    custoEntradasConsumidas,
    custosDaPeca,
    custosDaVenda,
    lucroPeca: receitaTotal - custoEntradasConsumidas - custosDaPeca - custosDaVenda,
    quantidadeTotalVendida,
    ultimaVenda,
    diasSemVenda: calcularDiasSemVenda(ultimaVenda)
  };
}

function obterQuantidadeTotal(produto) {
  const totalEntradas = contextoProduto.entradas.reduce((total, entrada) => total + Number(entrada.quantidadeTotal || 0), 0);
  return totalEntradas > 0 ? totalEntradas : Number(produto.quantidade || 0);
}

function obterQuantidadeVendida(produto) {
  const consumidaEntradas = contextoProduto.entradas.reduce((total, entrada) => total + Number(entrada.quantidadeConsumida || 0), 0);

  if (consumidaEntradas > 0) {
    return consumidaEntradas;
  }

  return Number(produto.quantidadeVendida || 0);
}

function obterQuantidadeDisponivel(produto) {
  const quantidadeTotal = obterQuantidadeTotal(produto);
  const quantidadeVendidaTotal = obterQuantidadeVendida(produto);
  return Math.max(quantidadeTotal - quantidadeVendidaTotal, 0);
}

function obterStatusProduto(produto) {
  if (produto.status) {
    return produto.status;
  }

  return obterQuantidadeDisponivel(produto) > 0 ? "em_estoque" : "vendida";
}

function obterOrigemPrincipal(produto) {
  if (contextoProduto.origemPrincipal) {
    return contextoProduto.origemPrincipal;
  }

  if (produto.origem) {
    return produto.origem;
  }

  const primeiraEntrada = contextoProduto.entradas.find(entrada => entrada.origemDescricao);
  return primeiraEntrada?.origemDescricao || "-";
}

function renderizarDadosProduto(produto) {
  const nomePeca = formatarNomePeca(produto);
  const quantidadeTotal = obterQuantidadeTotal(produto);
  const quantidadeVendidaTotal = obterQuantidadeVendida(produto);
  const quantidadeDisponivel = obterQuantidadeDisponivel(produto);

  tituloProduto.textContent = nomePeca;
  subtituloProduto.textContent = `ID ${produto.id} - ${produto.categoria || "Sem categoria"}`;

  dadosProduto.innerHTML = `
    <article class="detail-card">
      <span>SKU</span>
      <strong>${escaparHtml(formatarSku(produto))}</strong>
    </article>
    <article class="detail-card">
      <span>Nome da peça</span>
      <strong>${escaparHtml(produto.nome || produto.nome_peca || produto.nomeProduto || "-")}</strong>
    </article>
    <article class="detail-card">
      <span>ID da peça</span>
      <strong>${escaparHtml(produto.id || "-")}</strong>
    </article>
    <article class="detail-card">
      <span>Origem principal</span>
      <strong>${escaparHtml(obterOrigemPrincipal(produto))}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade total</span>
      <strong>${formatarNumero(quantidadeTotal)}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade vendida</span>
      <strong>${formatarNumero(quantidadeVendidaTotal)}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade disponível</span>
      <strong>${formatarNumero(quantidadeDisponivel)}</strong>
    </article>
    <article class="detail-card">
      <span>Status</span>
      <strong>${escaparHtml(obterStatusProduto(produto))}</strong>
    </article>
    <article class="detail-card">
      <span>Preço sugerido</span>
      <strong>${formatarMoeda(produto.precoVenda)}</strong>
    </article>
    <article class="detail-card">
      <span>Observações</span>
      <strong>${escaparHtml(produto.observacoes || "-")}</strong>
    </article>
  `;
}

function renderizarResumo() {
  const resultado = calcularResultado();

  resumoFinanceiro.innerHTML = `
    <article class="summary-card">
      <span>Receita total</span>
      <strong>${formatarMoeda(resultado.receitaTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo das entradas consumidas</span>
      <strong>${formatarMoeda(resultado.custoEntradasConsumidas)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos da peça</span>
      <strong>${formatarMoeda(resultado.custosDaPeca)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos da venda</span>
      <strong>${formatarMoeda(resultado.custosDaVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Lucro da peça</span>
      <strong>${formatarMoeda(resultado.lucroPeca)}</strong>
    </article>
    <article class="summary-card">
      <span>Última venda</span>
      <strong>${formatarData(resultado.ultimaVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Dias sem venda</span>
      <strong>${escaparHtml(resultado.diasSemVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Quantidade vendida</span>
      <strong>${formatarNumero(resultado.quantidadeTotalVendida)}</strong>
    </article>
  `;
}

function renderizarEntradas() {
  tabelaEntradasProduto.innerHTML = "";

  if (contextoProduto.entradas.length === 0) {
    mensagemEntradasProduto.textContent = "Nenhuma entrada de estoque encontrada para esta peça.";
    return;
  }

  mensagemEntradasProduto.textContent = "";

  contextoProduto.entradas.forEach(entrada => {
    const saldo = Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Origem">${escaparHtml(entrada.origemDescricao || entrada.origemId || "-")}</td>
      <td data-label="Data entrada">${formatarData(entrada.dataEntrada)}</td>
      <td data-label="Quantidade total">${formatarNumero(entrada.quantidadeTotal)}</td>
      <td data-label="Quantidade consumida">${formatarNumero(entrada.quantidadeConsumida)}</td>
      <td data-label="Saldo disponível">${formatarNumero(saldo)}</td>
      <td data-label="Custo unitário">${formatarMoeda(entrada.custoUnitario)}</td>
      <td data-label="Status">${escaparHtml(obterStatusEntrada(entrada))}</td>
    `;

    tabelaEntradasProduto.appendChild(linha);
  });
}

function renderizarCustos() {
  tabelaCustosProduto.innerHTML = "";

  if (contextoProduto.custosPeca.length === 0) {
    mensagemCustosProduto.textContent = "Nenhum custo cadastrado para esta peça.";
    return;
  }

  mensagemCustosProduto.textContent = "";

  contextoProduto.custosPeca.forEach(custo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(custo.dataCusto || custo.data)}</td>
      <td data-label="Tipo">${escaparHtml(custo.tipoCusto || custo.tipo || "-")}</td>
      <td data-label="Descrição">${escaparHtml(custo.descricao || "-")}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Observações">${escaparHtml(custo.observacoes || custo.observacao || "-")}</td>
    `;

    tabelaCustosProduto.appendChild(linha);
  });
}

function obterCustosVendaDaVenda(vendaId) {
  return contextoProduto.custosVenda.filter(custo => Number(custo.vendaId) === Number(vendaId));
}

function obterConsumosDaVenda(vendaId) {
  return contextoProduto.consumosEstoque.filter(consumo => Number(consumo.vendaId) === Number(vendaId));
}

function renderizarVendas() {
  tabelaVendasProduto.innerHTML = "";

  if (contextoProduto.vendas.length === 0) {
    mensagemVendasProduto.textContent = "Nenhuma venda registrada para esta peça.";
    return;
  }

  mensagemVendasProduto.textContent = "";

  ordenarVendasPorData(contextoProduto.vendas).forEach(venda => {
    const custosVenda = obterCustosVendaDaVenda(venda.id);
    const consumosVenda = obterConsumosDaVenda(venda.id);
    const totalCustosVenda = custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
    const totalCustoEntradas = consumosVenda.reduce((total, consumo) => total + Number(consumo.custoTotal || 0), 0);
    const lucroVenda = valorVenda(venda) - totalCustoEntradas - totalCustosVenda;
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
      <td data-label="Quantidade">${formatarNumero(quantidadeVendida(venda))}</td>
      <td data-label="Valor unitário">${formatarMoeda(venda.valorUnitario || venda.precoUnitario)}</td>
      <td data-label="Valor total">${formatarMoeda(valorVenda(venda))}</td>
      <td data-label="Canal">${escaparHtml(venda.canalVenda || "-")}</td>
      <td data-label="Custo entradas">${formatarMoeda(totalCustoEntradas)}</td>
      <td data-label="Custos venda">${formatarMoeda(totalCustosVenda)}</td>
      <td data-label="Lucro venda">${formatarMoeda(lucroVenda)}</td>
    `;

    tabelaVendasProduto.appendChild(linha);
  });
}

async function carregarContextoSupabase(pecaId) {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    return null;
  }

  const [
    produto,
    entradas,
    custosPeca,
    vendas,
    custosVenda,
    consumosEstoque
  ] = await Promise.all([
    window.supabaseService.buscarPecaPorId(pecaId),
    window.supabaseService.listarEntradasEstoque(),
    window.supabaseService.listarCustosPeca(),
    window.supabaseService.listarVendas(),
    window.supabaseService.listarCustosVenda(),
    window.supabaseService.listarConsumosEstoque()
  ]);

  if (!produto) {
    return { produto: null };
  }

  const entradasProduto = (entradas || []).filter(entrada => Number(entrada.pecaId) === Number(pecaId));
  const custosPecaProduto = (custosPeca || []).filter(custo => Number(custo.pecaId) === Number(pecaId));
  const vendasProduto = (vendas || []).filter(venda => Number(venda.pecaId) === Number(pecaId));
  const vendaIds = new Set(vendasProduto.map(venda => Number(venda.id)));
  const custosVendaProduto = (custosVenda || []).filter(custo => vendaIds.has(Number(custo.vendaId)));
  const consumosProduto = (consumosEstoque || []).filter(consumo => vendaIds.has(Number(consumo.vendaId)));

  return {
    produto,
    entradas: entradasProduto,
    custosPeca: custosPecaProduto,
    vendas: vendasProduto,
    custosVenda: custosVendaProduto,
    consumosEstoque: consumosProduto,
    origemPrincipal: produto.origem || entradasProduto.find(entrada => entrada.origemDescricao)?.origemDescricao || ""
  };
}

function carregarContextoLocal(pecaId) {
  const produto = buscarProdutosLocais().find(item => Number(item.id) === Number(pecaId));

  if (!produto) {
    return { produto: null };
  }

  const vendas = buscarVendasLocais().filter(venda => Number(venda.pecaId || 0) === Number(pecaId));
  const vendaIds = new Set(vendas.map(venda => Number(venda.id)));
  const custosPeca = buscarCustosLocais().filter(custo => Number(custo.pecaId || 0) === Number(pecaId));
  const origens = buscarOrigensLocais();
  const origemPrincipal = origens.find(origem => Number(origem.id) === Number(produto.origemId || produto.origem_id))?.descricao || produto.origem || "";

  return {
    produto,
    entradas: [],
    custosPeca,
    vendas,
    custosVenda: vendas.flatMap(venda => {
      if (!Array.isArray(venda.custosVenda)) {
        return [];
      }

      return venda.custosVenda.map(custo => ({
        ...custo,
        vendaId: venda.id
      }));
    }).filter(custo => !custo.vendaId || vendaIds.has(Number(custo.vendaId))),
    consumosEstoque: [],
    origemPrincipal
  };
}

function renderizarTela() {
  const produto = contextoProduto.produto;

  mensagemProdutoNaoEncontrado.textContent = "";
  renderizarDadosProduto(produto);
  renderizarResumo();
  renderizarEntradas();
  renderizarCustos();
  renderizarVendas();
}

function renderizarNaoEncontrado(mensagem) {
  mensagemProdutoNaoEncontrado.textContent = mensagem;
  dadosProduto.innerHTML = "";
  resumoFinanceiro.innerHTML = "";
  tabelaEntradasProduto.innerHTML = "";
  tabelaCustosProduto.innerHTML = "";
  tabelaVendasProduto.innerHTML = "";
}

async function iniciarDetalhes() {
  const pecaId = obterPecaIdDaUrl();

  if (!pecaId) {
    renderizarNaoEncontrado("Produto não encontrado.");
    return;
  }

  try {
    const contextoSupabase = await carregarContextoSupabase(pecaId);
    contextoProduto = contextoSupabase || carregarContextoLocal(pecaId);

    if (!contextoProduto.produto) {
      renderizarNaoEncontrado("Produto não encontrado.");
      return;
    }

    renderizarTela();
  } catch (erro) {
    console.error(erro);
    renderizarNaoEncontrado("Não foi possível carregar os detalhes da peça pelo Supabase.");
  }
}

iniciarDetalhes();
