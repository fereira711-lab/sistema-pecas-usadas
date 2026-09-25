// Análises · Custos (redesenho): custos lançados nas peças e custos da venda agrupados por tipo, e a lista de lançamentos.
// Sem lucro nem margem nesta aba.
const ITENS_POR_PAGINA = 20;

const mensagemAnaliseCustos = document.getElementById("mensagemAnaliseCustos");
const resumoAnaliseCustos = document.getElementById("resumoAnaliseCustos");
const tabelaAnaliseCustos = document.getElementById("tabelaAnaliseCustos");
const buscaAnaliseCustos = document.getElementById("buscaAnaliseCustos");
const periodoRapidoAnaliseCustos = document.getElementById("periodoRapidoAnaliseCustos");
const dataInicialAnaliseCustos = document.getElementById("dataInicialAnaliseCustos");
const dataFinalAnaliseCustos = document.getElementById("dataFinalAnaliseCustos");
const filtroTipoAnaliseCustos = document.getElementById("filtroTipoAnaliseCustos");
const filtroCategoriaAnaliseCustos = document.getElementById("filtroCategoriaAnaliseCustos");
const secaoLancamentosCustos = document.getElementById("secaoLancamentosCustos");
const contadorLancamentosCustos = document.getElementById("contadorLancamentosCustos");
const tabelaLancamentosCustos = document.getElementById("tabelaLancamentosCustos");
const paginacaoLancamentosCustos = document.getElementById("paginacaoLancamentosCustos");
const paginacaoTextoLancamentosCustos = document.getElementById("paginacaoTextoLancamentosCustos");
const botaoPaginaAnterior = document.getElementById("paginaAnteriorLancamentosCustos");
const botaoPaginaProxima = document.getElementById("paginaProximaLancamentosCustos");

let dadosAnaliseCustos = {
  custosPeca: [],
  custosVenda: [],
  pecas: [],
  vendas: []
};
let categoriaSelecionada = "";
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

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR");
}

function formatarPercentual(valor) {
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 1);
  return `${Number(valor || 0).toFixed(1).replace(".", ",")}%`;
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function formatarDataInput(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarNomeTipoCusto(valor) {
  const texto = String(valor || "Sem tipo").trim().replace(/\s+/g, " ");

  if (!texto) {
    return "Sem tipo";
  }

  // Nome cadastrado aparece como foi digitado. Só os tipos antigos gravados em minúsculas
  // ("frete", "embalagem") ganham a primeira letra maiúscula.
  if (texto !== texto.toLocaleLowerCase("pt-BR")) {
    return texto;
  }

  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

function obterChaveTipoCusto(valor) {
  return normalizarTexto(valor || "Sem tipo");
}

function criarKpi(rotulo, valor, nota = "", classeValor = "") {
  return `
    <article class="kpi">
      <span class="kpi__label">${rotulo}</span>
      <span class="kpi__value ${classeValor}">${valor}</span>
      ${nota ? `<span class="kpi__note">${nota}</span>` : ""}
    </article>
  `;
}

// ---- Período ----

function aplicarPeriodoRapido() {
  const valor = periodoRapidoAnaliseCustos.value;
  if (valor === "personalizado") return;

  if (valor === "todos") {
    dataInicialAnaliseCustos.value = "";
    dataFinalAnaliseCustos.value = "";
    return;
  }

  const hoje = new Date();
  const inicioPor = {
    hoje: hoje,
    7: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6),
    30: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29),
    mes: new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  };
  dataInicialAnaliseCustos.value = formatarDataInput(inicioPor[valor] || hoje);
  dataFinalAnaliseCustos.value = formatarDataInput(hoje);
}

// ---- Dados (mesmas regras da tela anterior) ----

function obterDataCusto(custo) {
  return String(custo.dataCusto || custo.data || custo.data_custo || "").slice(0, 10);
}

function formatarSku(peca) {
  return String(peca?.sku || peca?.codigo || peca?.codigo_peca || peca?.cod || "").trim();
}

function formatarNomePeca(peca) {
  return peca?.nome || peca?.nome_peca || peca?.nomeProduto || peca?.produtoNome || peca?.descricao || `Peça ${peca?.id || ""}`.trim();
}

function mapearPorId(lista) {
  return (lista || []).reduce((mapa, item) => {
    mapa[Number(item.id)] = item;
    return mapa;
  }, {});
}

function obterReferenciaCusto(custo, categoria, pecasPorId, vendasPorId) {
  if (categoria === "peca") {
    const peca = pecasPorId[Number(custo.pecaId || custo.peca_id || 0)] || {};

    return {
      nome: formatarNomePeca(peca),
      detalhe: formatarSku(peca),
      busca: `${formatarSku(peca)} ${formatarNomePeca(peca)}`,
      link: Number(peca.id) ? `detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}` : ""
    };
  }

  const venda = vendasPorId[Number(custo.vendaId || custo.venda_id || 0)] || {};
  const peca = pecasPorId[Number(venda.pecaId || venda.peca_id || 0)] || null;
  const sku = formatarSku(peca) || String(venda.sku || "").trim();
  const nome = peca ? formatarNomePeca(peca) : venda.produtoNome || venda.nome || `Venda ${custo.vendaId || "—"}`;

  return {
    nome,
    detalhe: [`Venda nº ${custo.vendaId || "—"}`, sku].filter(Boolean).join(" · "),
    busca: `${sku} ${nome} ${custo.vendaId || ""}`,
    link: Number(custo.vendaId || 0) ? `detalhes-venda.html?vendaId=${encodeURIComponent(custo.vendaId)}` : ""
  };
}

function montarCustosDetalhados(dados) {
  const pecasPorId = mapearPorId(dados.pecas);
  const vendasPorId = mapearPorId(dados.vendas);
  const montar = categoria => custo => {
    const tipo = formatarNomeTipoCusto(custo.tipoCusto || custo.tipo);
    return {
      ...custo,
      categoria,
      tipo,
      tipoChave: obterChaveTipoCusto(tipo),
      data: obterDataCusto(custo),
      referencia: obterReferenciaCusto(custo, categoria, pecasPorId, vendasPorId),
      observacao: custo.observacoes || custo.observacao || custo.descricao || ""
    };
  };

  return [
    ...(dados.custosPeca || []).map(montar("peca")),
    ...(dados.custosVenda || []).map(montar("venda"))
  ].sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")) || Number(b.id || 0) - Number(a.id || 0));
}

function preencherTipos(custos) {
  const atual = filtroTipoAnaliseCustos.value;
  const tipos = Array.from(new Map(custos.map(custo => [custo.tipoChave, custo.tipo])).entries())
    .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));

  filtroTipoAnaliseCustos.innerHTML = '<option value="">Todos os tipos</option>' +
    tipos.map(([chave, nome]) => `<option value="${escaparHtml(chave)}">${escaparHtml(nome)}</option>`).join("");
  filtroTipoAnaliseCustos.value = tipos.some(([chave]) => chave === atual) ? atual : "";
}

// Busca, período e tipo; a categoria (Na peça / Na venda) é aplicada depois, para as contagens.
function custoDentroDosFiltros(custo) {
  const palavras = normalizarTexto(buscaAnaliseCustos.value).split(/\s+/).filter(Boolean);
  const inicio = dataInicialAnaliseCustos.value;
  const fim = dataFinalAnaliseCustos.value;
  const tipo = filtroTipoAnaliseCustos.value;
  const texto = normalizarTexto(`${custo.tipo} ${custo.referencia.busca} ${custo.observacao}`);

  return (!inicio || !custo.data || custo.data >= inicio) &&
    (!fim || !custo.data || custo.data <= fim) &&
    (!tipo || custo.tipoChave === tipo) &&
    palavras.every(palavra => texto.includes(palavra));
}

function agruparCustosPorTipo(custos) {
  const mapa = new Map();
  const totalCustos = custos.reduce((total, custo) => total + Number(custo.valor || 0), 0);

  custos.forEach(custo => {
    if (!mapa.has(custo.tipoChave)) {
      mapa.set(custo.tipoChave, { tipoChave: custo.tipoChave, tipo: custo.tipo, totalCustosPeca: 0, totalCustosVenda: 0, totalGeral: 0, quantidade: 0 });
    }

    const grupo = mapa.get(custo.tipoChave);
    const valor = Number(custo.valor || 0);
    if (custo.categoria === "peca") grupo.totalCustosPeca += valor;
    if (custo.categoria === "venda") grupo.totalCustosVenda += valor;
    grupo.totalGeral += valor;
    grupo.quantidade += 1;
  });

  return Array.from(mapa.values())
    .map(grupo => ({ ...grupo, percentual: totalCustos > 0 ? (grupo.totalGeral / totalCustos) * 100 : 0 }))
    .sort((a, b) => b.totalGeral - a.totalGeral || a.tipo.localeCompare(b.tipo, "pt-BR"));
}

// ---- Renderização ----

function renderizarResumo(custos, grupos) {
  const totalPeca = custos.filter(custo => custo.categoria === "peca").reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const totalVenda = custos.filter(custo => custo.categoria === "venda").reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const maior = grupos[0];
  const quantidadePeca = custos.filter(custo => custo.categoria === "peca").length;
  const quantidadeVenda = custos.length - quantidadePeca;

  resumoAnaliseCustos.innerHTML =
    criarKpi("Total de custos", formatarMoeda(totalPeca + totalVenda), `${formatarNumero(custos.length)} ${custos.length === 1 ? "lançamento" : "lançamentos"}`) +
    criarKpi("Custos lançados", formatarMoeda(totalPeca), `${formatarNumero(quantidadePeca)} · limpeza, pintura, conserto`) +
    criarKpi("Custos da venda", formatarMoeda(totalVenda), `${formatarNumero(quantidadeVenda)} · frete, embalagem, tarifas`) +
    criarKpi("Maior tipo", maior ? escaparHtml(maior.tipo) : "—", maior ? `${formatarMoeda(maior.totalGeral)} · ${formatarPercentual(maior.percentual)} do total` : "", maior ? "kpi__value--tight" : "kpi__value--muted");
}

function renderizarGrupos(grupos) {
  if (!grupos.length) {
    tabelaAnaliseCustos.innerHTML = '<tr class="data-table__empty"><td colspan="7">Nenhum custo encontrado para os filtros selecionados.</td></tr>';
    return;
  }

  tabelaAnaliseCustos.innerHTML = grupos.map(grupo => `
    <tr>
      <td class="cell-strong" data-label="Tipo">${escaparHtml(grupo.tipo)}</td>
      <td class="num" data-label="Lançamentos">${formatarNumero(grupo.quantidade)}</td>
      <td class="num" data-label="Na peça">${grupo.totalCustosPeca ? formatarMoeda(grupo.totalCustosPeca) : "—"}</td>
      <td class="num" data-label="Na venda">${grupo.totalCustosVenda ? formatarMoeda(grupo.totalCustosVenda) : "—"}</td>
      <td class="num cell-strong" data-label="Total">${formatarMoeda(grupo.totalGeral)}</td>
      <td class="num" data-label="% do total">${formatarPercentual(grupo.percentual)}</td>
      <td class="cell-acoes"><button type="button" class="btn btn--secondary btn--compact" data-tipo-chave="${escaparHtml(grupo.tipoChave)}">Ver lançamentos</button></td>
    </tr>
  `).join("");
}

function renderizarLancamento(custo) {
  const referencia = custo.referencia;
  const nome = referencia.link
    ? `<a class="item-cell__name" href="${referencia.link}">${escaparHtml(referencia.nome)}</a>`
    : `<span class="item-cell__name">${escaparHtml(referencia.nome)}</span>`;

  return `
    <tr>
      <td class="cell-nowrap" data-label="Data">${formatarData(custo.data)}</td>
      <td data-label="Tipo">${escaparHtml(custo.tipo)}</td>
      <td data-label="Lançado em">
        <div class="item-cell__text">
          ${nome}
          <span class="item-cell__meta">${custo.categoria === "peca" ? "Peça" : "Venda"}${referencia.detalhe ? ` · ${escaparHtml(referencia.detalhe)}` : ""}</span>
        </div>
      </td>
      <td class="cell-muted" data-label="Observação">${escaparHtml(custo.observacao || "—")}</td>
      <td class="num cell-strong" data-label="Valor">${formatarMoeda(custo.valor)}</td>
    </tr>
  `;
}

function renderizarLancamentos(custos) {
  contadorLancamentosCustos.textContent = `${formatarNumero(custos.length)} ${custos.length === 1 ? "lançamento" : "lançamentos"}`;

  const totalPaginas = Math.max(1, Math.ceil(custos.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = custos.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (!custos.length) {
    tabelaLancamentosCustos.innerHTML = '<tr class="data-table__empty"><td colspan="5">Nenhum lançamento encontrado.</td></tr>';
    paginacaoLancamentosCustos.hidden = true;
    return;
  }

  tabelaLancamentosCustos.innerHTML = pagina.map(renderizarLancamento).join("");
  paginacaoLancamentosCustos.hidden = custos.length <= ITENS_POR_PAGINA;
  paginacaoTextoLancamentosCustos.textContent = `Mostrando ${inicio + 1}–${inicio + pagina.length} de ${custos.length}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

function renderizarAnaliseCustos() {
  const semCategoria = montarCustosDetalhados(dadosAnaliseCustos).filter(custoDentroDosFiltros);
  const custos = semCategoria.filter(custo => !categoriaSelecionada || custo.categoria === categoriaSelecionada);

  filtroCategoriaAnaliseCustos.querySelectorAll("[data-contagem]").forEach(contador => {
    const chave = contador.dataset.contagem;
    contador.textContent = formatarNumero(semCategoria.filter(custo => !chave || custo.categoria === chave).length);
  });

  const grupos = agruparCustosPorTipo(custos);
  renderizarResumo(custos, grupos);
  renderizarGrupos(grupos);
  renderizarLancamentos(custos);
}

// ---- Início ----

async function iniciarAnaliseCustos() {
  if (!window.supabaseService?.estaConfigurado()) {
    mensagemAnaliseCustos.textContent = "Configure o Supabase para carregar a análise de custos.";
    return;
  }

  try {
    const [custosPeca, custosVenda, pecas, vendas] = await Promise.all([
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas()
    ]);

    dadosAnaliseCustos = {
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || [],
      pecas: pecas || [],
      vendas: vendas || []
    };
    preencherTipos(montarCustosDetalhados(dadosAnaliseCustos));
    renderizarAnaliseCustos();
  } catch (erro) {
    console.error("Erro ao carregar análise de custos:", erro);
    mensagemAnaliseCustos.textContent = "Não foi possível carregar os dados da análise de custos.";
  }
}

function atualizarDoInicio() {
  paginaAtual = 1;
  renderizarAnaliseCustos();
}

if (tabelaAnaliseCustos) {
  periodoRapidoAnaliseCustos.addEventListener("change", () => {
    aplicarPeriodoRapido();
    atualizarDoInicio();
  });

  [dataInicialAnaliseCustos, dataFinalAnaliseCustos].forEach(campo => {
    campo.addEventListener("change", () => {
      periodoRapidoAnaliseCustos.value = "personalizado";
      atualizarDoInicio();
    });
  });

  [buscaAnaliseCustos, filtroTipoAnaliseCustos].forEach(campo => campo.addEventListener("input", atualizarDoInicio));

  filtroCategoriaAnaliseCustos.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-categoria]");
    if (!botao) return;
    categoriaSelecionada = botao.dataset.categoria;
    filtroCategoriaAnaliseCustos.querySelectorAll("[data-categoria]").forEach(item => {
      item.setAttribute("aria-pressed", String(item.dataset.categoria === categoriaSelecionada));
    });
    atualizarDoInicio();
  });

  // "Ver lançamentos" filtra a lista de baixo pelo tipo e leva até ela.
  tabelaAnaliseCustos.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-tipo-chave]");
    if (!botao) return;
    filtroTipoAnaliseCustos.value = botao.dataset.tipoChave;
    atualizarDoInicio();
    secaoLancamentosCustos.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  botaoPaginaAnterior.addEventListener("click", () => {
    paginaAtual -= 1;
    renderizarAnaliseCustos();
  });

  botaoPaginaProxima.addEventListener("click", () => {
    paginaAtual += 1;
    renderizarAnaliseCustos();
  });

  iniciarAnaliseCustos();
}
