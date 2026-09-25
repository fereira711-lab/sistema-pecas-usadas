// Entradas de estoque (redesenho): cada entrada é o saldo e o custo de uma peça vindo de uma origem.
// O consumo das entradas acontece nas vendas (regra oficial de custo); aqui só se consulta.
const ITENS_POR_PAGINA = 20;

const resumoEntradas = document.getElementById("resumoEntradas");
const mensagemEntradasEstoque = document.getElementById("mensagemEntradasEstoque");
const kpisEntradas = document.getElementById("kpisEntradas");
const buscaEntradasEstoque = document.getElementById("buscaEntradasEstoque");
const filtroOrigemEntradas = document.getElementById("filtroOrigemEntradas");
const dataInicialEntradas = document.getElementById("dataInicialEntradas");
const dataFinalEntradas = document.getElementById("dataFinalEntradas");
const filtroStatusEntradas = document.getElementById("filtroStatusEntradas");
const tabelaEntradas = document.getElementById("tabelaEntradas");
const paginacaoEntradas = document.getElementById("paginacaoEntradas");
const paginacaoTexto = document.getElementById("paginacaoTexto");
const botaoPaginaAnterior = document.getElementById("paginaAnterior");
const botaoPaginaProxima = document.getElementById("paginaProxima");

let linhasEntradas = [];
let entradasCarregadas = [];
let custosPecaCarregados = [];
let statusSelecionado = "";
let paginaAtual = 1;

const SITUACOES = {
  "com-saldo": { texto: "Com saldo", pilula: "pill--success" },
  parcial: { texto: "Parcial", pilula: "pill--warning" },
  consumida: { texto: "Consumida", pilula: "pill--neutral" }
};

// ---- Formatação ----

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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function plural(quantidade, singular, pluralTexto) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`;
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

// ---- Regras da lista ----

function obterStatusEntrada(total, consumida, saldo) {
  if (saldo <= 0) return "consumida";
  if (consumida > 0 && consumida < total) return "parcial";
  return "com-saldo";
}

function montarLinhasEntradas(entradas) {
  return entradas.map(entrada => {
    const total = Number(entrada.quantidadeTotal || 0);
    const consumida = Number(entrada.quantidadeConsumida || 0);
    const saldo = Math.max(total - consumida, 0);
    const custoUnitario = Number(entrada.custoUnitario || 0);

    return {
      entrada,
      codigo: `ENT-${String(entrada.id || 0).padStart(6, "0")}`,
      data: String(entrada.dataEntrada || entrada.createdAt || "").slice(0, 10),
      nome: String(entrada.nomePeca || "").trim() || "Peça sem nome",
      sku: entrada.sku || "",
      origem: String(entrada.origemDescricao || "").trim() || (entrada.origemId ? `Origem ${entrada.origemId}` : ""),
      total,
      consumida,
      saldo,
      custoUnitario,
      valorAtribuido: total * custoUnitario,
      custoEmEstoque: saldo * custoUnitario,
      status: obterStatusEntrada(total, consumida, saldo)
    };
  }).sort((a, b) => b.data.localeCompare(a.data) || Number(b.entrada.id) - Number(a.entrada.id));
}

// Cada palavra digitada precisa aparecer no código da entrada, no SKU, na peça ou na origem.
function linhaCombinaComBusca(linha, termo) {
  if (!termo) return true;
  const texto = normalizarTexto(`${linha.codigo} ${linha.sku} ${linha.nome} ${linha.origem}`);
  return termo.split(/\s+/).every(palavra => texto.includes(palavra));
}

function filtrarLinhas(linhas, filtros) {
  return linhas.filter(linha => (
    linhaCombinaComBusca(linha, filtros.termo) &&
    (!filtros.origemId || Number(linha.entrada.origemId) === filtros.origemId) &&
    (!filtros.dataInicial || (linha.data && linha.data >= filtros.dataInicial)) &&
    (!filtros.dataFinal || (linha.data && linha.data <= filtros.dataFinal))
  ));
}

// ---- Renderização ----

function criarKpi({ rotulo, valor, nota = "" }) {
  return `
    <article class="kpi">
      <span class="kpi__label">${escaparHtml(rotulo)}</span>
      <span class="kpi__value kpi__value--tight">${escaparHtml(valor)}</span>
      <span class="kpi__note">${escaparHtml(nota)}</span>
    </article>
  `;
}

// Custos lançados nas peças (limpeza, pintura...) que ainda estão em estoque: parte do custo da peça
// que só entra no lucro quando ela vender (financeiro-utils.calcularCustosPecaEmEstoque).
function calcularCustosPecaEmEstoque() {
  const financeiro = window.financeiroUtils;
  if (!financeiro?.calcularCustosPecaEmEstoque) return 0;
  const idsPecas = [...new Set(entradasCarregadas.map(entrada => Number(entrada.pecaId)))];
  return idsPecas.reduce((total, pecaId) => total + financeiro.calcularCustosPecaEmEstoque(pecaId, custosPecaCarregados, entradasCarregadas), 0);
}

function renderizarResumo() {
  const comSaldo = linhasEntradas.filter(linha => linha.saldo > 0);
  const unidadesEmEstoque = comSaldo.reduce((soma, linha) => soma + linha.saldo, 0);
  const unidadesConsumidas = linhasEntradas.reduce((soma, linha) => soma + linha.consumida, 0);
  const custosPecaEmEstoque = calcularCustosPecaEmEstoque();
  const custoEmEstoque = comSaldo.reduce((soma, linha) => soma + linha.custoEmEstoque, 0) + custosPecaEmEstoque;

  resumoEntradas.textContent = linhasEntradas.length
    ? `${plural(linhasEntradas.length, "entrada registrada", "entradas registradas")} · ${plural(unidadesEmEstoque, "unidade em estoque", "unidades em estoque")}`
    : "Nenhuma entrada registrada";

  kpisEntradas.innerHTML = [
    criarKpi({
      rotulo: "Entradas",
      valor: formatarNumero(linhasEntradas.length),
      nota: `${formatarNumero(linhasEntradas.filter(linha => linha.status === "com-saldo").length)} com saldo · ${plural(linhasEntradas.filter(linha => linha.status === "parcial").length, "parcial", "parciais")}`
    }),
    criarKpi({ rotulo: "Em estoque", valor: plural(unidadesEmEstoque, "unidade", "unidades"), nota: "Saldo das entradas" }),
    criarKpi({ rotulo: "Consumidas", valor: plural(unidadesConsumidas, "unidade", "unidades"), nota: "Baixadas pelas vendas" }),
    criarKpi({
      rotulo: "Custo em estoque",
      valor: formatarMoeda(custoEmEstoque),
      nota: custosPecaEmEstoque ? `Saldo × custo unitário + ${formatarMoeda(custosPecaEmEstoque)} lançados nas peças` : "Saldo × custo unitário"
    })
  ].join("");
}

function renderizarFiltroOrigens() {
  const origens = new Map();
  linhasEntradas.forEach(linha => {
    const id = Number(linha.entrada.origemId || 0);
    if (id && !origens.has(id)) origens.set(id, linha.origem);
  });
  const atual = filtroOrigemEntradas.value;
  filtroOrigemEntradas.innerHTML = '<option value="">Todas as origens</option>' + [...origens.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
    .map(([id, descricao]) => `<option value="${id}">${escaparHtml(descricao)}</option>`)
    .join("");
  filtroOrigemEntradas.value = origens.has(Number(atual)) ? atual : "";
}

function renderizarLinha(linha) {
  const pecaId = Number(linha.entrada.pecaId || 0);
  const origemId = Number(linha.entrada.origemId || 0);
  const situacao = SITUACOES[linha.status];
  const meta = [
    linha.sku ? `<span class="mono">${escaparHtml(linha.sku)}</span>` : "",
    `<span class="mono">${escaparHtml(linha.codigo)}</span>`
  ].filter(Boolean).join(" · ");

  return `
    <tr>
      <td class="cell-nowrap" data-label="Data">${formatarData(linha.data)}</td>
      <td data-label="Peça">
        <div class="item-cell__text">
          ${pecaId ? `<a class="item-cell__name" href="detalhes-produto.html?pecaId=${encodeURIComponent(pecaId)}">${escaparHtml(linha.nome)}</a>` : `<span class="cell-strong">${escaparHtml(linha.nome)}</span>`}
          <span class="item-cell__meta">${meta}</span>
        </div>
      </td>
      <td data-label="Origem">${origemId ? `<a href="detalhes-origem.html?origemId=${encodeURIComponent(origemId)}">${escaparHtml(linha.origem)}</a>` : "—"}</td>
      <td class="num" data-label="Qtd.">${formatarNumero(linha.total)}</td>
      <td class="num cell-muted" data-label="Consumida">${formatarNumero(linha.consumida)}</td>
      <td class="num cell-strong" data-label="Saldo">${formatarNumero(linha.saldo)}</td>
      <td class="num" data-label="Custo unitário">${formatarMoeda(linha.custoUnitario)}</td>
      <td class="num" data-label="Valor atribuído">${formatarMoeda(linha.valorAtribuido)}</td>
      <td data-label="Situação"><span class="pill ${situacao.pilula}">${situacao.texto}</span></td>
    </tr>
  `;
}

function renderizarLista() {
  const filtros = {
    termo: normalizarTexto(buscaEntradasEstoque.value),
    origemId: Number(filtroOrigemEntradas.value || 0),
    dataInicial: dataInicialEntradas.value,
    dataFinal: dataFinalEntradas.value
  };
  const semStatus = filtrarLinhas(linhasEntradas, filtros);
  const filtradas = semStatus.filter(linha => !statusSelecionado || linha.status === statusSelecionado);

  filtroStatusEntradas.querySelectorAll("[data-contagem]").forEach(contador => {
    const chave = contador.dataset.contagem;
    contador.textContent = formatarNumero(semStatus.filter(linha => !chave || linha.status === chave).length);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (filtradas.length === 0) {
    const vazio = linhasEntradas.length ? "Nenhuma entrada encontrada para esta busca ou filtro." : "Nenhuma entrada registrada ainda.";
    tabelaEntradas.innerHTML = `<tr class="data-table__empty"><td colspan="9">${vazio}</td></tr>`;
    paginacaoEntradas.hidden = true;
    return;
  }

  tabelaEntradas.innerHTML = pagina.map(renderizarLinha).join("");
  paginacaoEntradas.hidden = filtradas.length <= ITENS_POR_PAGINA;
  paginacaoTexto.textContent = `Mostrando ${formatarNumero(inicio + 1)}–${formatarNumero(inicio + pagina.length)} de ${formatarNumero(filtradas.length)}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

function selecionarStatus(status) {
  statusSelecionado = status;
  filtroStatusEntradas.querySelectorAll("[data-status]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.status === status));
  });
  paginaAtual = 1;
  renderizarLista();
}

// ---- Início ----

async function iniciarEntradasEstoque() {
  if (!window.supabaseService?.estaConfigurado()) {
    resumoEntradas.textContent = "";
    mensagemEntradasEstoque.textContent = "Configure o Supabase para ver as entradas de estoque.";
    return;
  }

  try {
    const [entradas, custosPeca] = await Promise.all([
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarCustosPeca()
    ]);
    entradasCarregadas = entradas || [];
    custosPecaCarregados = custosPeca || [];
    linhasEntradas = montarLinhasEntradas(entradasCarregadas);
    mensagemEntradasEstoque.textContent = "";
    renderizarFiltroOrigens();
    renderizarResumo();
    renderizarLista();
  } catch (erro) {
    console.error("Erro ao carregar entradas de estoque:", erro);
    resumoEntradas.textContent = "";
    mensagemEntradasEstoque.textContent = "Não foi possível carregar as entradas de estoque.";
  }
}

if (tabelaEntradas) {
  [buscaEntradasEstoque, filtroOrigemEntradas, dataInicialEntradas, dataFinalEntradas].forEach(campo => {
    campo.addEventListener("input", () => {
      paginaAtual = 1;
      renderizarLista();
    });
  });

  filtroStatusEntradas.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-status]");
    if (botao) selecionarStatus(botao.dataset.status);
  });

  botaoPaginaAnterior.addEventListener("click", () => {
    paginaAtual -= 1;
    renderizarLista();
  });

  botaoPaginaProxima.addEventListener("click", () => {
    paginaAtual += 1;
    renderizarLista();
  });

  iniciarEntradasEstoque();
}
