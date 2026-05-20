const mensagemEntradasEstoque = document.getElementById("mensagemEntradasEstoque");
const resumoEntradasEstoque = document.getElementById("resumoEntradasEstoque");
const listaEntradasEstoque = document.getElementById("listaEntradasEstoque");
const buscaEntradasEstoque = document.getElementById("buscaEntradasEstoque");
const quantidadePorPaginaEntradas = document.getElementById("quantidadePorPaginaEntradas");
const entradasEstoqueShell = document.getElementById("entradasEstoqueShell");
const botaoAbrirFiltrosEntradas = document.getElementById("botaoAbrirFiltrosEntradas");
const botaoFecharFiltrosEntradas = document.getElementById("botaoFecharFiltrosEntradas");
const botaoLimparFiltrosEntradas = document.getElementById("botaoLimparFiltrosEntradas");
const botaoAplicarFiltrosEntradas = document.getElementById("botaoAplicarFiltrosEntradas");
const filtroOrigemEntradas = document.getElementById("filtroOrigemEntradas");
const filtroProdutoEntradas = document.getElementById("filtroProdutoEntradas");
const filtroStatusEntradas = document.getElementById("filtroStatusEntradas");
const dataInicialEntradas = document.getElementById("dataInicialEntradas");
const dataFinalEntradas = document.getElementById("dataFinalEntradas");

let entradasCarregadas = [];

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function obterCodigoEntrada(entrada) {
  return `ENT-${String(entrada.id || 0).padStart(6, "0")}`;
}

function obterSaldoDisponivel(entrada) {
  return Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
}

function obterValorAtribuido(entrada) {
  return Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0);
}

function obterStatusEntrada(entrada) {
  const saldo = obterSaldoDisponivel(entrada);
  const consumida = Number(entrada.quantidadeConsumida || 0);
  const total = Number(entrada.quantidadeTotal || 0);

  if (saldo <= 0) {
    return "consumida";
  }

  if (consumida > 0 && consumida < total) {
    return "parcial";
  }

  return "com-saldo";
}

function obterTextoStatusEntrada(status) {
  const textos = {
    "com-saldo": "Com saldo",
    parcial: "Parcial",
    consumida: "Consumida"
  };

  return textos[status] || "Com saldo";
}

function obterClasseStatusEntrada(status) {
  const classes = {
    "com-saldo": "status-badge status-badge--stock",
    parcial: "status-badge status-badge--warning",
    consumida: "status-badge status-badge--empty"
  };

  return classes[status] || "status-badge";
}

function obterTextoProduto(entrada) {
  return String(entrada.nomePeca || entrada.pecaNome || entrada.nome || "").trim() || "Peça sem nome";
}

function obterTextoOrigem(entrada) {
  return String(entrada.origemDescricao || entrada.origem || "").trim() || (entrada.origemId ? `Origem ${entrada.origemId}` : "-");
}

function criarCardResumo(titulo, valor) {
  return `
    <article class="summary-card">
      <span>${titulo}</span>
      <strong>${valor}</strong>
    </article>
  `;
}

function renderizarResumoEntradas(entradas) {
  const entradasComSaldo = entradas.filter(entrada => obterSaldoDisponivel(entrada) > 0).length;
  const quantidadeDisponivel = entradas.reduce((total, entrada) => total + obterSaldoDisponivel(entrada), 0);
  const quantidadeConsumida = entradas.reduce((total, entrada) => total + Number(entrada.quantidadeConsumida || 0), 0);

  resumoEntradasEstoque.innerHTML =
    criarCardResumo("Total de entradas", formatarNumero(entradas.length)) +
    criarCardResumo("Entradas com saldo", formatarNumero(entradasComSaldo)) +
    criarCardResumo("Quantidade disponível", formatarNumero(quantidadeDisponivel)) +
    criarCardResumo("Quantidade consumida", formatarNumero(quantidadeConsumida));
}

function preencherSelect(select, valores, rotuloInicial) {
  if (!select) {
    return;
  }

  const valorAtual = select.value;
  select.innerHTML = `<option value="">${rotuloInicial}</option>`;

  valores.forEach(valor => {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = valor;
    select.appendChild(opcao);
  });

  select.value = valores.includes(valorAtual) ? valorAtual : "";
}

function preencherFiltrosEntradas(entradas) {
  const origens = Array.from(new Set(entradas.map(obterTextoOrigem).filter(valor => valor && valor !== "-"))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const produtos = Array.from(new Set(entradas.map(obterTextoProduto).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  preencherSelect(filtroOrigemEntradas, origens, "Todas");
  preencherSelect(filtroProdutoEntradas, produtos, "Todos");
}

function entradaDentroDoPeriodo(entrada) {
  const inicio = dataInicialEntradas?.value || "";
  const fim = dataFinalEntradas?.value || "";
  const data = String(entrada.dataEntrada || entrada.createdAt || "").slice(0, 10);

  if (!inicio && !fim) {
    return true;
  }

  if (!data) {
    return false;
  }

  if (inicio && data < inicio) {
    return false;
  }

  if (fim && data > fim) {
    return false;
  }

  return true;
}

function entradaDentroDosFiltros(entrada) {
  const termo = normalizarTexto(buscaEntradasEstoque?.value || "");
  const origem = filtroOrigemEntradas?.value || "";
  const produto = filtroProdutoEntradas?.value || "";
  const status = filtroStatusEntradas?.value || "";
  const textoBusca = normalizarTexto([
    obterCodigoEntrada(entrada),
    entrada.sku,
    obterTextoProduto(entrada),
    obterTextoOrigem(entrada)
  ].join(" "));

  if (termo && !textoBusca.includes(termo)) {
    return false;
  }

  if (origem && obterTextoOrigem(entrada) !== origem) {
    return false;
  }

  if (produto && obterTextoProduto(entrada) !== produto) {
    return false;
  }

  if (status && obterStatusEntrada(entrada) !== status) {
    return false;
  }

  return entradaDentroDoPeriodo(entrada);
}

function limitarEntradas(entradas) {
  const limite = quantidadePorPaginaEntradas?.value || "12";

  if (limite === "todos") {
    return entradas;
  }

  return entradas.slice(0, Number(limite || 12));
}

function criarLinhaCabecalho() {
  return `
    <div class="stock-entry-row stock-entry-row--head">
      <span>Código</span>
      <span>Data</span>
      <span>SKU / Peça</span>
      <span>Origem</span>
      <span>Qtd. total</span>
      <span>Entrada consumida</span>
      <span>Saldo disponível</span>
      <span>Custo unitário</span>
      <span>Valor atribuído</span>
      <span>Status</span>
      <span>Ações</span>
    </div>
  `;
}

function criarLinhaEntrada(entrada) {
  const status = obterStatusEntrada(entrada);
  const pecaId = Number(entrada.pecaId || 0);
  const origemId = Number(entrada.origemId || 0);
  const linkProduto = pecaId ? `detalhes-produto.html?pecaId=${encodeURIComponent(pecaId)}` : "produtos.html";
  const linkOrigem = origemId ? `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}` : "listar-origens.html";

  return `
    <article class="stock-entry-row">
      <strong data-label="Código">${escaparHtml(obterCodigoEntrada(entrada))}</strong>
      <span data-label="Data">${formatarData(entrada.dataEntrada || entrada.createdAt)}</span>
      <span data-label="SKU / Peça">
        <b>${escaparHtml(entrada.sku || "-")}</b>
        <small>${escaparHtml(obterTextoProduto(entrada))}</small>
      </span>
      <span data-label="Origem">${escaparHtml(obterTextoOrigem(entrada))}</span>
      <span data-label="Qtd. total">${formatarNumero(entrada.quantidadeTotal)}</span>
      <span data-label="Entrada consumida">${formatarNumero(entrada.quantidadeConsumida)}</span>
      <span data-label="Saldo disponível">${formatarNumero(obterSaldoDisponivel(entrada))}</span>
      <span data-label="Custo unitário">${formatarMoeda(entrada.custoUnitario)}</span>
      <span data-label="Valor atribuído">${formatarMoeda(obterValorAtribuido(entrada))}</span>
      <span data-label="Status"><mark class="${obterClasseStatusEntrada(status)}">${obterTextoStatusEntrada(status)}</mark></span>
      <span data-label="Ações" class="stock-entry-actions">
        <a class="table-link" href="${linkProduto}">Ver produto</a>
        <a class="table-link" href="${linkOrigem}">Ver origem</a>
      </span>
    </article>
  `;
}

function renderizarEntradas() {
  const filtradas = entradasCarregadas.filter(entradaDentroDosFiltros);
  const visiveis = limitarEntradas(filtradas);

  renderizarResumoEntradas(filtradas);

  if (filtradas.length === 0) {
    mensagemEntradasEstoque.textContent = "Nenhuma entrada encontrada para os filtros selecionados.";
    listaEntradasEstoque.innerHTML = "";
    return;
  }

  mensagemEntradasEstoque.textContent = "";
  listaEntradasEstoque.innerHTML = criarLinhaCabecalho() + visiveis.map(criarLinhaEntrada).join("");
}

function definirPainelFiltrosAberto(aberto) {
  entradasEstoqueShell?.classList.toggle("stock-entries-shell--filters-open", aberto);
  botaoAbrirFiltrosEntradas?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

async function carregarEntradasEstoque() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemEntradasEstoque.textContent = "Configure o Supabase para carregar as entradas de estoque.";
    return [];
  }

  try {
    const entradas = await window.supabaseService.listarEntradasEstoque();
    mensagemEntradasEstoque.textContent = "";
    return entradas || [];
  } catch (erro) {
    console.error("Erro ao carregar entradas de estoque:", erro);
    mensagemEntradasEstoque.textContent = "Não foi possível carregar as entradas de estoque.";
    return [];
  }
}

async function iniciarEntradasEstoque() {
  entradasCarregadas = await carregarEntradasEstoque();
  preencherFiltrosEntradas(entradasCarregadas);
  renderizarEntradas();
}

buscaEntradasEstoque?.addEventListener("input", renderizarEntradas);
quantidadePorPaginaEntradas?.addEventListener("change", renderizarEntradas);

[filtroOrigemEntradas, filtroProdutoEntradas, filtroStatusEntradas, dataInicialEntradas, dataFinalEntradas].forEach(campo => {
  campo?.addEventListener("change", renderizarEntradas);
});

botaoAbrirFiltrosEntradas?.addEventListener("click", () => {
  definirPainelFiltrosAberto(!entradasEstoqueShell?.classList.contains("stock-entries-shell--filters-open"));
});

botaoFecharFiltrosEntradas?.addEventListener("click", () => {
  definirPainelFiltrosAberto(false);
});

botaoAplicarFiltrosEntradas?.addEventListener("click", () => {
  renderizarEntradas();
  definirPainelFiltrosAberto(false);
});

botaoLimparFiltrosEntradas?.addEventListener("click", () => {
  if (buscaEntradasEstoque) {
    buscaEntradasEstoque.value = "";
  }

  [filtroOrigemEntradas, filtroProdutoEntradas, filtroStatusEntradas, dataInicialEntradas, dataFinalEntradas].forEach(campo => {
    if (campo) {
      campo.value = "";
    }
  });

  renderizarEntradas();
});

document.addEventListener("DOMContentLoaded", iniciarEntradasEstoque);
