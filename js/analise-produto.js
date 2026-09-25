// Análises · Por produto (redesenho): resultado financeiro agrupado por peça.
// O cálculo por peça vem do financeiro-utils (calcularLucroPeca); a tela só filtra, soma e mostra.
const ITENS_POR_PAGINA = 20;

const mensagemAnaliseProduto = document.getElementById("mensagemAnaliseProduto");
const resumoAnaliseProduto = document.getElementById("resumoAnaliseProduto");
const tabelaAnaliseProduto = document.getElementById("tabelaAnaliseProduto");
const buscaAnaliseProduto = document.getElementById("buscaAnaliseProduto");
const filtroDataInicialAnaliseProduto = document.getElementById("filtroDataInicialAnaliseProduto");
const filtroDataFinalAnaliseProduto = document.getElementById("filtroDataFinalAnaliseProduto");
const filtroCanalAnaliseProduto = document.getElementById("filtroCanalAnaliseProduto");
const ordenacaoAnaliseProduto = document.getElementById("ordenacaoAnaliseProduto");
const filtroResultadoAnaliseProduto = document.getElementById("filtroResultadoAnaliseProduto");
const paginacaoAnaliseProduto = document.getElementById("paginacaoAnaliseProduto");
const paginacaoTextoAnaliseProduto = document.getElementById("paginacaoTextoAnaliseProduto");
const botaoPaginaAnterior = document.getElementById("paginaAnteriorAnaliseProduto");
const botaoPaginaProxima = document.getElementById("paginaProximaAnaliseProduto");

let dadosAnaliseProduto = {
  pecas: [],
  vendas: [],
  consumosEstoque: [],
  custosPeca: [],
  custosVenda: [],
  entradasEstoque: []
};
let resultadoSelecionado = "com-venda";
let paginaAtual = 1;

// ---- Formatação ----

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarMargem(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "—";
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 1);
  return `${Number(valor).toFixed(1).replace(".", ",")}%`;
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR");
}

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

function classeResultado(valor) {
  if (valor > 0) return "text-success";
  if (valor < 0) return "text-danger";
  return "";
}

function criarKpi(rotulo, valor, nota = "", classeValor = "", classeNota = "") {
  return `
    <article class="kpi">
      <span class="kpi__label">${rotulo}</span>
      <span class="kpi__value ${classeValor}">${valor}</span>
      ${nota ? `<span class="kpi__note ${classeNota}">${nota}</span>` : ""}
    </article>
  `;
}

// ---- Dados (mesmas regras da tela anterior) ----

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();
}

function formatarNome(peca) {
  return peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peça ${peca.id}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
}

function obterCanalVenda(venda) {
  return String(venda.canalVenda || venda.canal_venda || venda.canal || "").trim();
}

function obterDataCusto(custo) {
  return String(custo.dataCusto || custo.data || custo.data_custo || "").slice(0, 10);
}

function obterQuantidadeVendida(venda) {
  return Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
}

function somar(lista, campo = "valor") {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function agruparPorId(lista, campo) {
  return lista.reduce((mapa, item) => {
    const id = Number(item[campo] || 0);
    if (!mapa[id]) mapa[id] = [];
    mapa[id].push(item);
    return mapa;
  }, {});
}

function itemDentroDoIntervalo(data, dataInicial, dataFinal) {
  const dataIso = String(data || "").slice(0, 10);
  if (!dataIso) return !dataInicial && !dataFinal;
  if (dataInicial && dataIso < dataInicial) return false;
  if (dataFinal && dataIso > dataFinal) return false;
  return true;
}

function calcularAnaliseProduto(peca, agrupamentos) {
  const pecaId = Number(peca.id);
  const vendasDaPeca = agrupamentos.vendasPorPeca[pecaId] || [];
  const resultado = window.financeiroUtils.calcularLucroPeca(
    peca,
    agrupamentos.vendas,
    agrupamentos.consumos,
    agrupamentos.custosPeca,
    agrupamentos.custosVenda
  );

  return {
    peca,
    pecaId,
    sku: formatarSku(peca),
    nome: formatarNome(peca),
    receita: resultado.receita,
    custoEstoque: resultado.calculado ? resultado.custoConsumido : null,
    custosPeca: resultado.custosPeca,
    custosVenda: resultado.custosVenda,
    lucro: resultado.calculado ? resultado.lucro : null,
    margem: resultado.calculado ? resultado.margem : null,
    quantidadeVendida: vendasDaPeca.reduce((total, venda) => total + obterQuantidadeVendida(venda), 0),
    numeroVendas: vendasDaPeca.length,
    custoCalculado: resultado.calculado
  };
}

function calcularAnalises(dados) {
  const agrupamentos = {
    vendas: dados.vendas,
    consumos: dados.consumosEstoque,
    custosPeca: dados.custosPeca,
    custosVenda: dados.custosVenda,
    vendasPorPeca: agruparPorId(dados.vendas, "pecaId")
  };

  return dados.pecas.map(peca => calcularAnaliseProduto(peca, agrupamentos));
}

// Período e canal filtram as vendas (e seus consumos e custos); custos da peça seguem a data do custo.
function obterDadosFiltradosGlobais() {
  const dataInicial = filtroDataInicialAnaliseProduto.value || "";
  const dataFinal = filtroDataFinalAnaliseProduto.value || "";
  const canal = filtroCanalAnaliseProduto.value || "";
  const vendasFiltradas = dadosAnaliseProduto.vendas.filter(venda => (
    itemDentroDoIntervalo(obterDataVenda(venda), dataInicial, dataFinal) &&
    (!canal || obterCanalVenda(venda) === canal)
  ));
  const idsVendas = new Set(vendasFiltradas.map(venda => Number(venda.id)));

  return {
    ...dadosAnaliseProduto,
    vendas: vendasFiltradas,
    consumosEstoque: dadosAnaliseProduto.consumosEstoque.filter(consumo => idsVendas.has(Number(consumo.vendaId))),
    custosVenda: dadosAnaliseProduto.custosVenda.filter(custo => idsVendas.has(Number(custo.vendaId))),
    custosPeca: dadosAnaliseProduto.custosPeca.filter(custo => itemDentroDoIntervalo(obterDataCusto(custo), dataInicial, dataFinal))
  };
}

function atualizarOpcoesCanal(vendas) {
  const canais = [...new Set(vendas.map(obterCanalVenda).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  filtroCanalAnaliseProduto.innerHTML = '<option value="">Todos os canais</option>' +
    canais.map(canal => `<option value="${escaparHtml(canal)}">${escaparHtml(canal)}</option>`).join("");
}

// ---- Filtros da lista ----

function combinaComResultado(analise, resultado) {
  if (resultado === "com-venda") return analise.numeroVendas > 0;
  if (resultado === "prejuizo") return analise.numeroVendas > 0 && analise.lucro !== null && analise.lucro < 0;
  if (resultado === "pendente") return !analise.custoCalculado;
  return true;
}

function filtrarPorBusca(analises) {
  const palavras = normalizarTexto(buscaAnaliseProduto.value).split(/\s+/).filter(Boolean);
  if (!palavras.length) return analises;
  return analises.filter(analise => {
    const texto = normalizarTexto(`${analise.sku} ${analise.nome}`);
    return palavras.every(palavra => texto.includes(palavra));
  });
}

function ordenar(analises) {
  const ordenacao = ordenacaoAnaliseProduto.value || "receita";
  const semValor = Number.NEGATIVE_INFINITY;

  return [...analises].sort((a, b) => {
    if (ordenacao === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
    if (ordenacao === "lucro") return Number(b.lucro ?? semValor) - Number(a.lucro ?? semValor);
    if (ordenacao === "margem") return Number(b.margem ?? semValor) - Number(a.margem ?? semValor);
    if (ordenacao === "quantidade") return b.quantidadeVendida - a.quantidadeVendida;
    return b.receita - a.receita || a.nome.localeCompare(b.nome, "pt-BR");
  });
}

// ---- Renderização ----

// Os KPIs somam todas as peças da busca, período e canal (sem o filtro de resultado), como antes.
function renderizarResumo(analises) {
  const comVenda = analises.filter(analise => analise.numeroVendas > 0);
  const pendentes = analises.filter(analise => !analise.custoCalculado).length;
  const receita = somar(analises, "receita");
  const custoPecas = pendentes ? null : somar(analises, "custoEstoque");
  const custosPeca = somar(analises, "custosPeca");
  const custosVenda = somar(analises, "custosVenda");
  const lucro = pendentes ? null : somar(analises, "lucro");
  const margem = lucro === null || receita <= 0 ? null : (lucro / receita) * 100;

  resumoAnaliseProduto.innerHTML =
    criarKpi("Receita", formatarMoeda(receita), `${formatarNumero(comVenda.length)} ${comVenda.length === 1 ? "peça com venda" : "peças com venda"}`) +
    criarKpi(
      "Custo das peças vendidas",
      custoPecas === null ? "Custo não calculado" : formatarMoeda(custoPecas),
      pendentes ? `${formatarNumero(pendentes)} ${pendentes === 1 ? "peça" : "peças"} com venda sem custo` : "",
      custoPecas === null ? "kpi__value--muted" : "",
      pendentes ? "kpi__note--warning" : ""
    ) +
    criarKpi("Outros custos", formatarMoeda(custosPeca + custosVenda), `${formatarMoeda(custosPeca)} na peça · ${formatarMoeda(custosVenda)} na venda`) +
    criarKpi(
      "Lucro",
      lucro === null ? "Custo não calculado" : formatarMoeda(lucro),
      margem === null ? "" : `Margem de ${formatarMargem(margem)}`,
      lucro === null ? "kpi__value--muted" : classeResultado(lucro)
    );
}

function renderizarLinha(analise) {
  const href = `detalhes-produto.html?pecaId=${encodeURIComponent(analise.pecaId)}`;
  const semVenda = analise.numeroVendas === 0;
  const lucro = analise.lucro === null
    ? '<span class="text-warning">Custo não calculado</span>'
    : semVenda && analise.lucro === 0 ? "—" : `<span class="${classeResultado(analise.lucro)}">${formatarMoeda(analise.lucro)}</span>`;

  return `
    <tr>
      <td data-label="Peça">
        <div class="item-cell__text">
          <a class="item-cell__name" href="${href}">${escaparHtml(analise.nome)}</a>
          ${analise.sku ? `<span class="item-cell__meta"><span class="mono">${escaparHtml(analise.sku)}</span></span>` : ""}
        </div>
      </td>
      <td class="num" data-label="Vendidas">${formatarNumero(analise.quantidadeVendida)}</td>
      <td class="num" data-label="Receita">${semVenda ? "—" : formatarMoeda(analise.receita)}</td>
      <td class="num" data-label="Custo da peça">${analise.custoEstoque === null ? '<span class="text-warning">Não calculado</span>' : semVenda ? "—" : formatarMoeda(analise.custoEstoque)}</td>
      <td class="num" data-label="Outros custos">${analise.custosPeca + analise.custosVenda ? formatarMoeda(analise.custosPeca + analise.custosVenda) : "—"}</td>
      <td class="num cell-strong" data-label="Lucro">${lucro}</td>
      <td class="num" data-label="Margem">${formatarMargem(analise.margem)}</td>
    </tr>
  `;
}

function renderizarAnalises() {
  const analises = filtrarPorBusca(calcularAnalises(obterDadosFiltradosGlobais()));
  const filtradas = ordenar(analises.filter(analise => combinaComResultado(analise, resultadoSelecionado)));

  renderizarResumo(analises);
  filtroResultadoAnaliseProduto.querySelectorAll("[data-contagem]").forEach(contador => {
    contador.textContent = formatarNumero(analises.filter(analise => combinaComResultado(analise, contador.dataset.contagem)).length);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (!filtradas.length) {
    tabelaAnaliseProduto.innerHTML = '<tr class="data-table__empty"><td colspan="7">Nenhuma peça encontrada para esta busca ou filtro.</td></tr>';
    paginacaoAnaliseProduto.hidden = true;
    return;
  }

  tabelaAnaliseProduto.innerHTML = pagina.map(renderizarLinha).join("");
  paginacaoAnaliseProduto.hidden = filtradas.length <= ITENS_POR_PAGINA;
  paginacaoTextoAnaliseProduto.textContent = `Mostrando ${inicio + 1}–${inicio + pagina.length} de ${filtradas.length}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

// ---- Início ----

async function iniciarAnaliseProduto() {
  if (!window.supabaseService?.estaConfigurado()) {
    mensagemAnaliseProduto.textContent = "Configure o Supabase para carregar a análise por produto.";
    return;
  }

  try {
    const [pecas, vendas, consumosEstoque, custosPeca, custosVenda, entradasEstoque] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    dadosAnaliseProduto = {
      pecas: pecas || [],
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || [],
      entradasEstoque: entradasEstoque || []
    };
    atualizarOpcoesCanal(dadosAnaliseProduto.vendas);
    renderizarAnalises();
  } catch (erro) {
    console.error("Erro ao carregar análise por produto:", erro);
    mensagemAnaliseProduto.textContent = "Não foi possível carregar os dados da análise por produto.";
  }
}

if (tabelaAnaliseProduto) {
  [buscaAnaliseProduto, filtroDataInicialAnaliseProduto, filtroDataFinalAnaliseProduto, filtroCanalAnaliseProduto, ordenacaoAnaliseProduto].forEach(campo => {
    campo.addEventListener("input", () => {
      paginaAtual = 1;
      renderizarAnalises();
    });
  });

  filtroResultadoAnaliseProduto.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-resultado]");
    if (!botao) return;
    resultadoSelecionado = botao.dataset.resultado;
    filtroResultadoAnaliseProduto.querySelectorAll("[data-resultado]").forEach(item => {
      item.setAttribute("aria-pressed", String(item.dataset.resultado === resultadoSelecionado));
    });
    paginaAtual = 1;
    renderizarAnalises();
  });

  botaoPaginaAnterior.addEventListener("click", () => {
    paginaAtual -= 1;
    renderizarAnalises();
  });

  botaoPaginaProxima.addEventListener("click", () => {
    paginaAtual += 1;
    renderizarAnalises();
  });

  iniciarAnaliseProduto();
}
