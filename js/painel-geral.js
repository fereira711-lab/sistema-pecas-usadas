const mensagemPainelGeral = document.getElementById("mensagemPainelGeral");
const cardsPainelGeral = document.getElementById("cardsPainelGeral");
const alertasPainelGeral = document.getElementById("alertasPainelGeral");
const atalhosPainelGeral = document.getElementById("atalhosPainelGeral");
const listaUltimasVendas = document.getElementById("listaUltimasVendas");
const movimentacoesPainelGeral = document.getElementById("movimentacoesPainelGeral");
const mensagemUltimasVendas = document.getElementById("mensagemUltimasVendas");

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || venda.createdAt || venda.created_at || "").slice(0, 10);
}

function obterQuantidadeVendida(venda) {
  return Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
}

function formatarSkuVenda(venda) {
  return String(venda.sku || venda.codigo || venda.codigo_peca || "").trim() || "-";
}

function formatarNomeVenda(venda) {
  return venda.produtoNome || venda.nome || venda.nomePeca || venda.nome_peca || `Peça ${venda.pecaId || ""}`.trim();
}

function calcularQuantidadeDisponivelPeca(peca, entradasDaPeca = []) {
  const totalEntradas = entradasDaPeca.reduce((total, entrada) => total + Number(entrada.quantidadeTotal || 0), 0);
  const total = totalEntradas > 0 ? totalEntradas : Number(peca.quantidade || 0);
  const vendida = Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);

  return Math.max(total - vendida, 0);
}

function criarEntradasPorPeca(entradasEstoque) {
  return entradasEstoque.reduce((mapa, entrada) => {
    const pecaId = Number(entrada.pecaId || 0);

    if (!mapa[pecaId]) {
      mapa[pecaId] = [];
    }

    mapa[pecaId].push(entrada);
    return mapa;
  }, {});
}

function criarCard(titulo, valor, descricao = "", classe = "") {
  const classeCard = classe ? `summary-card ${classe}` : "summary-card";

  return `
    <article class="${classeCard}">
      <span>${escaparHtml(titulo)}</span>
      <strong>${escaparHtml(valor)}</strong>
      <small>${escaparHtml(descricao)}</small>
    </article>
  `;
}

function criarAlertaLinha(titulo, valor, descricao, tipo = "warning", href = "paginas/alertas.html") {
  const classeTipo = {
    danger: "status-badge--empty",
    warning: "status-badge--warning",
    info: "status-badge--info",
    ok: "status-badge--stock"
  }[tipo] || "status-badge--warning";
  const textoTipo = {
    danger: "Crítico",
    warning: "Atenção",
    info: "Origem",
    ok: "OK"
  }[tipo] || "Atenção";

  return `
    <article class="dashboard-alert-item dashboard-alert-item--${tipo}">
      <span class="status-badge ${classeTipo}">${textoTipo}</span>
      <div>
        <strong>${escaparHtml(titulo)}</strong>
        <small>${formatarNumero(valor)} - ${escaparHtml(descricao)}</small>
      </div>
      <a class="table-link" href="${escaparHtml(href)}">Ver</a>
    </article>
  `;
}

async function carregarDadosPainel() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemPainelGeral.textContent = "Configure o Supabase para carregar o painel geral.";
    return null;
  }

  try {
    const [
      origens,
      pecas,
      vendas,
      consumosEstoque,
      entradasEstoque,
      custosPeca,
      custosVenda
    ] = await Promise.all([
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarCustosPeca?.() || [],
      window.supabaseService.listarCustosVenda?.() || []
    ]);

    mensagemPainelGeral.textContent = "";

    return {
      origens: origens || [],
      pecas: pecas || [],
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      entradasEstoque: entradasEstoque || [],
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || []
    };
  } catch (erro) {
    console.error("Erro ao carregar painel geral:", erro);
    mensagemPainelGeral.textContent = "Não foi possível carregar os dados do Supabase.";
    return null;
  }
}

function calcularDistribuicaoOrigem(origem, entradas) {
  const entradasDaOrigem = entradas.filter(entrada => Number(entrada.origemId || 0) === Number(origem.id));
  const valorTotal = Number(origem.valorPago || origem.valor_total || origem.custoTotal || 0);
  const valorDistribuido = entradasDaOrigem.reduce((total, entrada) => {
    const valorAtribuido = Number(entrada.valorAtribuidoEntrada || entrada.valor_atribuido_entrada || 0);

    if (valorAtribuido > 0) {
      return total + valorAtribuido;
    }

    return total + (Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0));
  }, 0);

  return valorTotal - valorDistribuido;
}

function calcularAlertasPainel(dados) {
  const entradasPorPeca = criarEntradasPorPeca(dados.entradasEstoque);
  const idsVendasComConsumo = new Set(dados.consumosEstoque.map(consumo => Number(consumo.vendaId || 0)));
  const produtosSemEstoque = dados.pecas.filter(peca => calcularQuantidadeDisponivelPeca(peca, entradasPorPeca[Number(peca.id)] || []) <= 0).length;
  const produtosComEstoqueBaixo = dados.pecas.filter(peca => {
    const disponivel = calcularQuantidadeDisponivelPeca(peca, entradasPorPeca[Number(peca.id)] || []);
    return disponivel > 0 && disponivel <= 2;
  }).length;
  const vendasSemCusto = dados.vendas.filter(venda => !idsVendasComConsumo.has(Number(venda.id))).length;
  const origensPendentes = dados.origens.filter(origem => calcularDistribuicaoOrigem(origem, dados.entradasEstoque) > 0.009).length;
  const origensAcima = dados.origens.filter(origem => calcularDistribuicaoOrigem(origem, dados.entradasEstoque) < -0.009).length;

  return {
    produtosSemEstoque,
    produtosComEstoqueBaixo,
    vendasSemCusto,
    origensPendentes,
    origensAcima
  };
}

function renderizarCards(dados) {
  const entradasPorPeca = criarEntradasPorPeca(dados.entradasEstoque);
  const produtosCadastrados = dados.pecas.length;
  const estoqueBaixo = dados.pecas.filter(peca => {
    const disponivel = calcularQuantidadeDisponivelPeca(peca, entradasPorPeca[Number(peca.id)] || []);
    return disponivel > 0 && disponivel <= 2;
  }).length;
  const vendasRecentes = obterUltimasVendas(dados.vendas, 7).length;
  const alertas = calcularAlertasPainel(dados);
  const totalAlertas = alertas.produtosSemEstoque + alertas.produtosComEstoqueBaixo + alertas.vendasSemCusto + alertas.origensPendentes + alertas.origensAcima;

  cardsPainelGeral.innerHTML =
    criarCard("Produtos cadastrados", formatarNumero(produtosCadastrados), "Total de peças no estoque") +
    criarCard("Estoque baixo", formatarNumero(estoqueBaixo), `${formatarNumero(alertas.produtosSemEstoque)} sem estoque`, estoqueBaixo > 0 ? "summary-card--loss" : "") +
    criarCard("Vendas recentes", formatarNumero(vendasRecentes), "Últimos registros") +
    criarCard("Origens pendentes", formatarNumero(alertas.origensPendentes), "Distribuição para revisar", alertas.origensPendentes > 0 ? "summary-card--loss" : "") +
    criarCard("Alertas importantes", formatarNumero(totalAlertas), "Requerem atenção operacional", totalAlertas > 0 ? "summary-card--loss" : "summary-card--profit");
}

function renderizarAtalhos() {
  if (!atalhosPainelGeral) {
    return;
  }

  const atalhos = [
    ["Produtos", "paginas/produtos.html"],
    ["Cadastro de peça", "paginas/cadastro-peca.html"],
    ["Cadastro de venda", "paginas/cadastro-venda.html"],
    ["Custo de peça", "paginas/cadastro-custo.html"],
    ["Histórico de vendas", "paginas/historico-vendas.html"],
    ["Origens cadastradas", "paginas/listar-origens.html"],
    ["Análises", "paginas/analise-produto.html"]
  ];

  atalhosPainelGeral.innerHTML = atalhos.map(([texto, href]) => (
    `<a class="button-secondary dashboard-shortcut" href="${href}">${texto}</a>`
  )).join("");
}

function renderizarAlertasPainel(dados) {
  if (!alertasPainelGeral) {
    return;
  }

  const alertas = calcularAlertasPainel(dados);
  const totalAlertas = alertas.produtosSemEstoque + alertas.produtosComEstoqueBaixo + alertas.vendasSemCusto + alertas.origensPendentes + alertas.origensAcima;

  if (totalAlertas === 0) {
    alertasPainelGeral.innerHTML = `
      <div class="dashboard-alert-list">
        ${criarAlertaLinha("Operação sem alertas críticos", 0, "Nenhum ponto importante no momento.", "ok", "paginas/alertas.html")}
      </div>
    `;
    return;
  }

  alertasPainelGeral.innerHTML = `
    <div class="dashboard-alert-list">
      ${criarAlertaLinha("Produtos sem estoque", alertas.produtosSemEstoque, "Peças sem saldo disponível.", "danger", "paginas/alertas.html")}
      ${criarAlertaLinha("Estoque baixo", alertas.produtosComEstoqueBaixo, "Peças abaixo do limite operacional.", "warning", "paginas/alertas.html")}
      ${criarAlertaLinha("Custo não calculado", alertas.vendasSemCusto, "Vendas aguardando conferência de custo.", "warning", "paginas/alertas.html")}
      ${criarAlertaLinha("Distribuição pendente", alertas.origensPendentes, "Origens com valor para distribuir.", "info", "paginas/listar-origens.html")}
      ${criarAlertaLinha("Distribuição acima do previsto", alertas.origensAcima, "Origens acima do valor planejado.", "danger", "paginas/listar-origens.html")}
    </div>
  `;
}

function obterUltimasVendas(vendas, limite = 8) {
  return [...vendas]
    .sort((a, b) => {
      const dataA = obterDataVenda(a);
      const dataB = obterDataVenda(b);

      if (dataA !== dataB) {
        return dataB.localeCompare(dataA);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    })
    .slice(0, limite);
}

function renderizarUltimasVendas(vendas) {
  if (!listaUltimasVendas) {
    return;
  }

  const ultimasVendas = obterUltimasVendas(vendas);
  listaUltimasVendas.innerHTML = "";

  if (ultimasVendas.length === 0) {
    if (mensagemUltimasVendas) {
      mensagemUltimasVendas.textContent = "Nenhuma venda registrada.";
    }
    return;
  }

  if (mensagemUltimasVendas) {
    mensagemUltimasVendas.textContent = "";
  }

  listaUltimasVendas.innerHTML = ultimasVendas.map(venda => `
    <div class="general-dashboard-row" role="row">
      <span data-label="Data">${formatarData(obterDataVenda(venda))}</span>
      <strong data-label="SKU">${escaparHtml(formatarSkuVenda(venda))}</strong>
      <span data-label="Peça" class="product-name">${escaparHtml(formatarNomeVenda(venda))}</span>
      <span data-label="Qtd.">${formatarNumero(obterQuantidadeVendida(venda))}</span>
      <span data-label="Canal">${escaparHtml(venda.canalVenda || "-")}</span>
      <a class="table-link" href="paginas/detalhes-venda.html?vendaId=${encodeURIComponent(venda.id)}">Ver detalhes</a>
    </div>
  `).join("");
}

function obterNomePecaPorId(pecas, pecaId) {
  const peca = pecas.find(item => Number(item.id) === Number(pecaId));
  return peca?.nome || peca?.nomePeca || peca?.nome_peca || peca?.sku || `Peça ${pecaId}`;
}

function criarMovimento(tipo, titulo, descricao, data, href = "#") {
  return {
    tipo,
    titulo,
    descricao,
    data: String(data || "").slice(0, 10),
    href
  };
}

function obterMovimentacoesRecentes(dados) {
  const movimentos = [];

  dados.entradasEstoque.slice(0, 6).forEach(entrada => {
    movimentos.push(criarMovimento(
      "entrada",
      "Entrada registrada",
      `${formatarNumero(entrada.quantidadeTotal)} un. de ${entrada.nomePeca || obterNomePecaPorId(dados.pecas, entrada.pecaId)}`,
      entrada.dataEntrada || entrada.createdAt,
      entrada.pecaId ? `paginas/detalhes-produto.html?pecaId=${encodeURIComponent(entrada.pecaId)}` : "paginas/entradas-estoque.html"
    ));
  });

  [...dados.custosPeca, ...dados.custosVenda].slice(0, 6).forEach(custo => {
    movimentos.push(criarMovimento(
      "custo",
      "Custo lançado",
      `${custo.tipoCusto || custo.tipo || "Custo"} registrado no sistema`,
      custo.dataCusto || custo.data,
      custo.pecaId ? `paginas/detalhes-produto.html?pecaId=${encodeURIComponent(custo.pecaId)}` : "paginas/analise-custos.html"
    ));
  });

  dados.pecas.slice(0, 6).forEach(peca => {
    movimentos.push(criarMovimento(
      "peca",
      "Peça cadastrada",
      `${peca.sku || "Sem SKU"} - ${peca.nome || peca.nomePeca || peca.nome_peca || "Peça"}`,
      peca.createdAt || peca.created_at,
      `paginas/detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}`
    ));
  });

  const alertas = calcularAlertasPainel(dados);
  if (alertas.produtosComEstoqueBaixo > 0 || alertas.produtosSemEstoque > 0) {
    movimentos.push(criarMovimento(
      "alerta",
      "Alerta gerado",
      "Existem peças com estoque baixo ou sem estoque.",
      new Date().toISOString(),
      "paginas/alertas.html"
    ));
  }

  return movimentos
    .filter(movimento => movimento.data)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 6);
}

function renderizarMovimentacoes(dados) {
  if (!movimentacoesPainelGeral) {
    return;
  }

  const movimentos = obterMovimentacoesRecentes(dados);

  if (movimentos.length === 0) {
    movimentacoesPainelGeral.innerHTML = `<p class="empty-message">Nenhuma movimentação recente.</p>`;
    return;
  }

  movimentacoesPainelGeral.innerHTML = movimentos.map(movimento => `
    <a class="dashboard-movement-item" href="${escaparHtml(movimento.href)}">
      <span class="dashboard-dot dashboard-dot--${escaparHtml(movimento.tipo)}"></span>
      <div>
        <strong>${escaparHtml(movimento.titulo)}</strong>
        <small>${escaparHtml(movimento.descricao)}</small>
      </div>
    </a>
  `).join("");
}

async function iniciarPainelGeral() {
  const dados = await carregarDadosPainel();

  if (!dados) {
    cardsPainelGeral.innerHTML = "";
    if (alertasPainelGeral) {
      alertasPainelGeral.innerHTML = "";
    }
    if (listaUltimasVendas) {
      listaUltimasVendas.innerHTML = "";
    }
    if (movimentacoesPainelGeral) {
      movimentacoesPainelGeral.innerHTML = "";
    }
    return;
  }

  renderizarCards(dados);
  renderizarAtalhos();
  renderizarAlertasPainel(dados);
  renderizarUltimasVendas(dados.vendas);
  renderizarMovimentacoes(dados);
}

document.addEventListener("DOMContentLoaded", iniciarPainelGeral);
