// Análises · Giro de estoque (redesenho): quais peças vendem rápido e quais estão paradas.
// Faixas de alertas-regras.js: Girando até 30 dias, Lento de 31 a 90, Parado acima de 90 (decisão de 2026-09-25).
const ITENS_POR_PAGINA = 20;

const mensagemGiroEstoque = document.getElementById("mensagemGiroEstoque");
const resumoGiroEstoque = document.getElementById("resumoGiroEstoque");
const tabelaGiroEstoque = document.getElementById("tabelaGiroEstoque");
const buscaGiroEstoque = document.getElementById("buscaGiroEstoque");
const periodoRapidoGiroEstoque = document.getElementById("periodoRapidoGiroEstoque");
const dataInicialGiroEstoque = document.getElementById("dataInicialGiroEstoque");
const dataFinalGiroEstoque = document.getElementById("dataFinalGiroEstoque");
const filtroStatusGiroEstoque = document.getElementById("filtroStatusGiroEstoque");
const filtroOrigemGiroEstoque = document.getElementById("filtroOrigemGiroEstoque");
const ordenacaoGiroEstoque = document.getElementById("ordenacaoGiroEstoque");
const paginacaoGiroEstoque = document.getElementById("paginacaoGiroEstoque");
const paginacaoTextoGiroEstoque = document.getElementById("paginacaoTextoGiroEstoque");
const botaoPaginaAnterior = document.getElementById("paginaAnteriorGiroEstoque");
const botaoPaginaProxima = document.getElementById("paginaProximaGiroEstoque");

let dadosGiroEstoque = {
  pecas: [],
  vendas: [],
  entradasEstoque: [],
  origens: []
};
let statusSelecionado = "";
let paginaAtual = 1;

// ---- Formatação ----

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function formatarDataInput(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function criarKpi(rotulo, valor, nota = "", classeNota = "") {
  return `
    <article class="kpi">
      <span class="kpi__label">${rotulo}</span>
      <span class="kpi__value">${valor}</span>
      ${nota ? `<span class="kpi__note ${classeNota}">${nota}</span>` : ""}
    </article>
  `;
}

// ---- Período ----

function aplicarPeriodoRapido() {
  const valor = periodoRapidoGiroEstoque.value;
  if (valor === "personalizado") return;

  if (valor === "todos") {
    dataInicialGiroEstoque.value = "";
    dataFinalGiroEstoque.value = "";
    return;
  }

  const hoje = new Date();
  const dias = { hoje: 0, 7: 6, 30: 29, 90: 89 }[valor] || 0;
  dataInicialGiroEstoque.value = formatarDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dias));
  dataFinalGiroEstoque.value = formatarDataInput(hoje);
}

// ---- Dados ----

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();
}

function formatarNome(peca) {
  return peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peça ${peca.id}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
}

function itemDentroDoPeriodo(data) {
  const inicio = dataInicialGiroEstoque.value;
  const fim = dataFinalGiroEstoque.value;
  const dataIso = String(data || "").slice(0, 10);
  if (!inicio && !fim) return true;
  return Boolean(dataIso) && (!inicio || dataIso >= inicio) && (!fim || dataIso <= fim);
}

// Situação pela regra de alertas-regras.classificarGiroPecas (as mesmas faixas de Produtos e Alertas);
// o período só muda a coluna "Vendidas".
function calcularGiro(dados) {
  const origensPorId = new Map(dados.origens.map(origem => [Number(origem.id), origem]));
  const vendasNoPeriodo = dados.vendas.filter(venda => itemDentroDoPeriodo(obterDataVenda(venda)));

  return window.alertasRegras.classificarGiroPecas(dados).map(item => {
    const peca = item.peca;
    const pecaId = Number(peca.id);

    return {
      pecaId,
      sku: formatarSku(peca),
      nome: formatarNome(peca),
      origem: origensPorId.get(Number(peca.origemId))?.descricao || "",
      estoqueDisponivel: item.saldo,
      quantidadeVendida: vendasNoPeriodo
        .filter(venda => Number(venda.pecaId) === pecaId)
        .reduce((total, venda) => total + Number(venda.quantidadeVendida || 0), 0),
      ultimaVenda: item.ultimaVenda,
      diasSemVenda: item.dias,
      situacao: item.chave
    };
  });
}

// ---- Situação e filtros ----

const SITUACOES = {
  girando: { texto: "Girando", pill: "pill--success" },
  lento: { texto: "Lento", pill: "pill--info" },
  parado: { texto: "Parado", pill: "pill--warning" },
  "sem-estoque": { texto: "Sem estoque", pill: "pill--neutral" }
};

function combinaComStatus(linha, status) {
  return !status || linha.situacao === status;
}

function preencherOrigens(linhas) {
  const atual = filtroOrigemGiroEstoque.value;
  const origens = [...new Set(linhas.map(linha => linha.origem).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  filtroOrigemGiroEstoque.innerHTML = '<option value="">Todas as origens</option>' +
    origens.map(origem => `<option value="${escaparHtml(origem)}">${escaparHtml(origem)}</option>`).join("");
  filtroOrigemGiroEstoque.value = origens.includes(atual) ? atual : "";
}

function filtrarPorBuscaEOrigem(linhas) {
  const palavras = normalizarTexto(buscaGiroEstoque.value).split(/\s+/).filter(Boolean);
  const origem = filtroOrigemGiroEstoque.value;

  return linhas.filter(linha => {
    const texto = normalizarTexto(`${linha.sku} ${linha.nome}`);
    return (!origem || linha.origem === origem) && palavras.every(palavra => texto.includes(palavra));
  });
}

function ordenarLinhas(linhas) {
  const ordenacao = ordenacaoGiroEstoque.value || "giro";

  return [...linhas].sort((a, b) => {
    if (ordenacao === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
    if (ordenacao === "estoque") return a.estoqueDisponivel - b.estoqueDisponivel;
    if (ordenacao === "ultima-venda") return String(b.ultimaVenda || "").localeCompare(String(a.ultimaVenda || ""));
    if (ordenacao === "parado") return Number(b.diasSemVenda || 0) - Number(a.diasSemVenda || 0);
    return Number(b.quantidadeVendida || 0) - Number(a.quantidadeVendida || 0);
  });
}

// ---- Renderização ----

function renderizarResumo(linhas) {
  const contar = status => linhas.filter(linha => combinaComStatus(linha, status)).length;
  const vendidas = linhas.reduce((total, linha) => total + Number(linha.quantidadeVendida || 0), 0);
  const comVenda = linhas.filter(linha => linha.quantidadeVendida > 0).length;
  const paradas = contar("parado");

  resumoGiroEstoque.innerHTML =
    criarKpi("Girando", formatarNumero(contar("girando")), "venda ou entrada nos últimos 30 dias") +
    criarKpi("Lentas", formatarNumero(contar("lento")), "de 31 a 90 dias sem venda") +
    criarKpi("Paradas", formatarNumero(paradas), "mais de 90 dias sem venda", paradas ? "kpi__note--warning" : "") +
    criarKpi("Unidades vendidas", formatarNumero(vendidas), `${formatarNumero(comVenda)} ${comVenda === 1 ? "peça" : "peças"} no período`);
}

function renderizarLinha(linha) {
  const situacao = SITUACOES[linha.situacao] || SITUACOES["sem-estoque"];
  const href = `detalhes-produto.html?pecaId=${encodeURIComponent(linha.pecaId)}`;
  const detalhe = [
    linha.sku ? `<span class="mono">${escaparHtml(linha.sku)}</span>` : "",
    linha.origem ? escaparHtml(linha.origem) : ""
  ].filter(Boolean).join(" · ");

  return `
    <tr>
      <td data-label="Peça">
        <div class="item-cell__text">
          <a class="item-cell__name" href="${href}">${escaparHtml(linha.nome)}</a>
          ${detalhe ? `<span class="item-cell__meta">${detalhe}</span>` : ""}
        </div>
      </td>
      <td class="num" data-label="Estoque">${formatarNumero(linha.estoqueDisponivel)}</td>
      <td class="num" data-label="Vendidas">${formatarNumero(linha.quantidadeVendida)}</td>
      <td class="cell-nowrap" data-label="Última venda">${formatarData(linha.ultimaVenda)}</td>
      <td class="num" data-label="Sem venda há">${linha.diasSemVenda === null ? "—" : `${formatarNumero(linha.diasSemVenda)} ${linha.diasSemVenda === 1 ? "dia" : "dias"}`}</td>
      <td data-label="Situação"><span class="pill ${situacao.pill}">${escaparHtml(situacao.texto)}</span></td>
    </tr>
  `;
}

function renderizarGiroEstoque() {
  const todas = calcularGiro(dadosGiroEstoque);
  preencherOrigens(todas);
  const linhas = filtrarPorBuscaEOrigem(todas);
  const filtradas = ordenarLinhas(linhas.filter(linha => combinaComStatus(linha, statusSelecionado)));

  renderizarResumo(linhas);
  filtroStatusGiroEstoque.querySelectorAll("[data-contagem]").forEach(contador => {
    contador.textContent = formatarNumero(linhas.filter(linha => combinaComStatus(linha, contador.dataset.contagem)).length);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (!filtradas.length) {
    tabelaGiroEstoque.innerHTML = '<tr class="data-table__empty"><td colspan="6">Nenhuma peça encontrada para os filtros selecionados.</td></tr>';
    paginacaoGiroEstoque.hidden = true;
    return;
  }

  tabelaGiroEstoque.innerHTML = pagina.map(renderizarLinha).join("");
  paginacaoGiroEstoque.hidden = filtradas.length <= ITENS_POR_PAGINA;
  paginacaoTextoGiroEstoque.textContent = `Mostrando ${inicio + 1}–${inicio + pagina.length} de ${filtradas.length}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

// ---- Início ----

async function iniciarGiroEstoque() {
  if (!window.supabaseService?.estaConfigurado()) {
    mensagemGiroEstoque.textContent = "Configure o Supabase para carregar o giro de estoque.";
    return;
  }

  try {
    const [pecas, vendas, entradasEstoque, origens] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarOrigens()
    ]);

    dadosGiroEstoque = {
      pecas: pecas || [],
      vendas: vendas || [],
      entradasEstoque: entradasEstoque || [],
      origens: origens || []
    };
    renderizarGiroEstoque();
  } catch (erro) {
    console.error("Erro ao carregar giro de estoque:", erro);
    mensagemGiroEstoque.textContent = "Não foi possível carregar os dados do giro de estoque.";
  }
}

function atualizarDoInicio() {
  paginaAtual = 1;
  renderizarGiroEstoque();
}

if (tabelaGiroEstoque) {
  periodoRapidoGiroEstoque.addEventListener("change", () => {
    aplicarPeriodoRapido();
    atualizarDoInicio();
  });

  [dataInicialGiroEstoque, dataFinalGiroEstoque].forEach(campo => {
    campo.addEventListener("change", () => {
      periodoRapidoGiroEstoque.value = "personalizado";
      atualizarDoInicio();
    });
  });

  [buscaGiroEstoque, filtroOrigemGiroEstoque, ordenacaoGiroEstoque].forEach(campo => campo.addEventListener("input", atualizarDoInicio));

  filtroStatusGiroEstoque.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-status]");
    if (!botao) return;
    statusSelecionado = botao.dataset.status;
    filtroStatusGiroEstoque.querySelectorAll("[data-status]").forEach(item => {
      item.setAttribute("aria-pressed", String(item.dataset.status === statusSelecionado));
    });
    atualizarDoInicio();
  });

  botaoPaginaAnterior.addEventListener("click", () => {
    paginaAtual -= 1;
    renderizarGiroEstoque();
  });

  botaoPaginaProxima.addEventListener("click", () => {
    paginaAtual += 1;
    renderizarGiroEstoque();
  });

  iniciarGiroEstoque();
}
