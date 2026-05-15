const mensagemPainelGeral = document.getElementById("mensagemPainelGeral");
const cardsPainelGeral = document.getElementById("cardsPainelGeral");
const alertasPainelGeral = document.getElementById("alertasPainelGeral");
const atalhosPainelGeral = document.getElementById("atalhosPainelGeral");
const tabelaUltimasVendas = document.getElementById("tabelaUltimasVendas");
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

function calcularSaldoEntrada(entrada) {
  return Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
}

function criarCard(titulo, valor, classe = "") {
  const classeCard = classe ? `summary-card ${classe}` : "summary-card";

  return `
    <article class="${classeCard}">
      <span>${titulo}</span>
      <strong>${valor}</strong>
    </article>
  `;
}

function criarAlerta(titulo, valor, descricao, tipo = "warning", href = "paginas/alertas.html") {
  return `
    <article class="alert-card alert-card--${tipo}">
      <span>${escaparHtml(titulo)}</span>
      <strong>${formatarNumero(valor)}</strong>
      <small>${escaparHtml(descricao)}</small>
      <a class="table-link" href="${escaparHtml(href)}">Abrir</a>
    </article>
  `;
}

async function carregarDadosPainel() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemPainelGeral.textContent = "Configure o Supabase para carregar o painel geral.";
    return null;
  }

  try {
    const [origens, pecas, vendas, consumosEstoque, entradasEstoque] = await Promise.all([
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    mensagemPainelGeral.textContent = "";

    return {
      origens: origens || [],
      pecas: pecas || [],
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      entradasEstoque: entradasEstoque || []
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
  const entradasPorPeca = dados.entradasEstoque.reduce((mapa, entrada) => {
    const pecaId = Number(entrada.pecaId || 0);

    if (!mapa[pecaId]) {
      mapa[pecaId] = [];
    }

    mapa[pecaId].push(entrada);
    return mapa;
  }, {});
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
  const entradasPorPeca = dados.entradasEstoque.reduce((mapa, entrada) => {
    const pecaId = Number(entrada.pecaId || 0);

    if (!mapa[pecaId]) {
      mapa[pecaId] = [];
    }

    mapa[pecaId].push(entrada);
    return mapa;
  }, {});
  const produtosCadastrados = dados.pecas.length;
  const estoqueBaixo = dados.pecas.filter(peca => {
    const disponivel = calcularQuantidadeDisponivelPeca(peca, entradasPorPeca[Number(peca.id)] || []);
    return disponivel > 0 && disponivel <= 2;
  }).length;
  const vendasRecentes = obterUltimasVendas(dados.vendas, 7).length;
  const alertas = calcularAlertasPainel(dados);
  const totalAlertas = alertas.produtosSemEstoque + alertas.produtosComEstoqueBaixo + alertas.vendasSemCusto + alertas.origensPendentes + alertas.origensAcima;

  cardsPainelGeral.innerHTML =
    criarCard("Produtos cadastrados", formatarNumero(produtosCadastrados)) +
    criarCard("Estoque baixo", formatarNumero(estoqueBaixo), estoqueBaixo > 0 ? "summary-card--loss" : "") +
    criarCard("Vendas recentes", formatarNumero(vendasRecentes)) +
    criarCard("Origens pendentes", formatarNumero(alertas.origensPendentes), alertas.origensPendentes > 0 ? "summary-card--loss" : "") +
    criarCard("Alertas importantes", formatarNumero(totalAlertas), totalAlertas > 0 ? "summary-card--loss" : "summary-card--profit");
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
    ["Análises", "paginas/relatorios.html"]
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
      <div class="alert-panel dashboard-alert-panel">
        <div class="alert-panel__header">
          <h3>Status</h3>
          <span class="alert-pill alert-pill--ok">OK</span>
        </div>
        <p>Nenhum alerta operacional importante no momento.</p>
      </div>
    `;
    return;
  }

  alertasPainelGeral.innerHTML = `
    <div class="alert-panel dashboard-alert-panel">
      <div class="alert-grid">
        ${criarAlerta("Sem estoque", alertas.produtosSemEstoque, "Produtos sem quantidade disponível.", "danger", "paginas/alertas.html")}
        ${criarAlerta("Estoque baixo", alertas.produtosComEstoqueBaixo, "Produtos com saldo entre 1 e 2.", "warning", "paginas/alertas.html")}
        ${criarAlerta("Custo não calculado", alertas.vendasSemCusto, "Vendas sem consumo FIFO registrado.", "warning", "paginas/alertas.html")}
        ${criarAlerta("Distribuição pendente", alertas.origensPendentes, "Origens com valor ainda não distribuído.", "warning", "paginas/alertas.html")}
        ${criarAlerta("Distribuição acima", alertas.origensAcima, "Origens distribuídas acima do valor.", "danger", "paginas/alertas.html")}
      </div>
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
  if (!tabelaUltimasVendas) {
    return;
  }

  const ultimasVendas = obterUltimasVendas(vendas);
  tabelaUltimasVendas.innerHTML = "";

  if (ultimasVendas.length === 0) {
    if (mensagemUltimasVendas) {
      mensagemUltimasVendas.textContent = "Nenhuma venda registrada.";
    }
    return;
  }

  if (mensagemUltimasVendas) {
    mensagemUltimasVendas.textContent = "";
  }

  ultimasVendas.forEach(venda => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
      <td data-label="SKU">${escaparHtml(formatarSkuVenda(venda))}</td>
      <td data-label="Peça"><strong class="product-name">${escaparHtml(formatarNomeVenda(venda))}</strong></td>
      <td data-label="Quantidade">${formatarNumero(obterQuantidadeVendida(venda))}</td>
      <td data-label="Canal">${escaparHtml(venda.canalVenda || "-")}</td>
      <td data-label="Ação">
        <div class="table-actions table-actions--single">
          <a class="table-link" href="paginas/detalhes-venda.html?vendaId=${encodeURIComponent(venda.id)}">Ver detalhes</a>
        </div>
      </td>
    `;

    tabelaUltimasVendas.appendChild(linha);
  });
}

async function iniciarPainelGeral() {
  const dados = await carregarDadosPainel();

  if (!dados) {
    cardsPainelGeral.innerHTML = "";
    if (alertasPainelGeral) {
      alertasPainelGeral.innerHTML = "";
    }
    if (tabelaUltimasVendas) {
      tabelaUltimasVendas.innerHTML = "";
    }
    return;
  }

  renderizarCards(dados);
  renderizarAtalhos();
  renderizarAlertasPainel(dados);
  renderizarUltimasVendas(dados.vendas);
}

document.addEventListener("DOMContentLoaded", iniciarPainelGeral);
