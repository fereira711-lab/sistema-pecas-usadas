// Análises · Por período (redesenho): resultado das vendas num intervalo de datas.
// Cada venda é calculada pelo financeiro-utils (calcularLucroVenda); o extrato completo fica em Detalhes da venda.
const ITENS_POR_PAGINA = 20;

const dataInicial = document.getElementById("dataInicial");
const dataFinal = document.getElementById("dataFinal");
const periodoRapido = document.getElementById("periodoRapido");
const mensagemAnalisePeriodo = document.getElementById("mensagemAnalisePeriodo");
const resumoAnalisePeriodo = document.getElementById("resumoAnalisePeriodo");
const tabelaAnalisePeriodo = document.getElementById("tabelaAnalisePeriodo");
const buscaAnalisePeriodo = document.getElementById("buscaAnalisePeriodo");
const filtroCanalAnalisePeriodo = document.getElementById("filtroCanalAnalisePeriodo");
const filtroCustoAnalisePeriodo = document.getElementById("filtroCustoAnalisePeriodo");
const paginacaoAnalisePeriodo = document.getElementById("paginacaoAnalisePeriodo");
const paginacaoTextoAnalisePeriodo = document.getElementById("paginacaoTextoAnalisePeriodo");
const botaoPaginaAnterior = document.getElementById("paginaAnteriorAnalisePeriodo");
const botaoPaginaProxima = document.getElementById("paginaProximaAnalisePeriodo");

let dadosAnalisePeriodo = {
  vendas: [],
  consumosEstoque: [],
  custosVenda: [],
  pecas: [],
  custosPeca: [],
  entradas: []
};
let custoSelecionado = "";
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
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function formatarDataInput(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
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

function somar(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

// ---- Período ----

function aplicarPeriodoRapido() {
  const hoje = new Date();
  const fim = formatarDataInput(hoje);
  const inicioPor = {
    hoje: () => fim,
    7: () => formatarDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6)),
    30: () => formatarDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29)),
    mes: () => formatarDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  };

  if (!inicioPor[periodoRapido.value]) return;
  dataInicial.value = inicioPor[periodoRapido.value]();
  dataFinal.value = fim;
}

// ---- Dados ----

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
}

function obterCanalVenda(venda) {
  return String(venda.canalVenda || venda.canal_venda || venda.canal || "").trim();
}

function preencherCanais(vendas) {
  const canais = [...new Set(vendas.map(obterCanalVenda).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  filtroCanalAnalisePeriodo.innerHTML = '<option value="">Todos os canais</option>' +
    canais.map(canal => `<option value="${escaparHtml(canal)}">${escaparHtml(canal)}</option>`).join("");
}

function calcularLinhas(vendas) {
  const pecasPorId = new Map(dadosAnalisePeriodo.pecas.map(peca => [Number(peca.id), peca]));

  return vendas.map(venda => {
    const resultado = window.financeiroUtils.calcularLucroVenda(venda, dadosAnalisePeriodo.consumosEstoque, dadosAnalisePeriodo.custosVenda, {
      custosPeca: dadosAnalisePeriodo.custosPeca,
      entradas: dadosAnalisePeriodo.entradas
    });
    const peca = pecasPorId.get(Number(venda.pecaId)) || null;

    return {
      venda,
      data: obterDataVenda(venda),
      nome: peca?.nome || venda.produtoNome || `Peça ${venda.pecaId || ""}`.trim(),
      sku: peca?.sku || venda.sku || "",
      canal: obterCanalVenda(venda),
      quantidade: Number(venda.quantidadeVendida || venda.quantidade_vendida || 0),
      receita: resultado.receita,
      // Custo das peças = custo de entrada consumido + custos lançados na peça rateados (mesma conta de Por produto).
      custoPeca: resultado.calculado ? resultado.custoConsumido + resultado.custosPeca : null,
      custoEntrada: resultado.calculado ? resultado.custoConsumido : null,
      custosPecaLancados: resultado.custosPeca,
      custosVenda: resultado.custosVenda,
      lucro: resultado.calculado ? resultado.lucro : null,
      margem: resultado.calculado ? resultado.margem : null,
      custoCalculado: resultado.calculado
    };
  }).sort((a, b) => b.data.localeCompare(a.data) || Number(b.venda.id) - Number(a.venda.id));
}

function filtrarVendas() {
  const inicio = dataInicial.value;
  const fim = dataFinal.value;
  const canal = filtroCanalAnalisePeriodo.value;
  const palavras = normalizarTexto(buscaAnalisePeriodo.value).split(/\s+/).filter(Boolean);

  return calcularLinhas(dadosAnalisePeriodo.vendas.filter(venda => {
    const data = obterDataVenda(venda);
    return (!inicio || (data && data >= inicio)) && (!fim || (data && data <= fim)) && (!canal || obterCanalVenda(venda) === canal);
  })).filter(linha => {
    const texto = normalizarTexto(`${linha.sku} ${linha.nome} ${linha.canal}`);
    return palavras.every(palavra => texto.includes(palavra));
  });
}

function combinaComCusto(linha, custo) {
  if (custo === "calculado") return linha.custoCalculado;
  if (custo === "pendente") return !linha.custoCalculado;
  return true;
}

// ---- Renderização ----

function renderizarResumo(linhas) {
  const pendentes = linhas.filter(linha => !linha.custoCalculado).length;
  const receita = somar(linhas, "receita");
  const custoPecas = pendentes ? null : somar(linhas, "custoPeca");
  const custosVenda = somar(linhas, "custosVenda");
  const lucro = pendentes ? null : receita - custoPecas - custosVenda;
  const margem = lucro === null || receita <= 0 ? null : (lucro / receita) * 100;
  const unidades = somar(linhas, "quantidade");

  resumoAnalisePeriodo.innerHTML =
    criarKpi("Receita", formatarMoeda(receita), `${formatarNumero(linhas.length)} ${linhas.length === 1 ? "venda" : "vendas"} · ${formatarNumero(unidades)} un.`) +
    criarKpi(
      "Custo das peças",
      custoPecas === null ? "Custo não calculado" : formatarMoeda(custoPecas),
      pendentes
        ? `${formatarNumero(pendentes)} ${pendentes === 1 ? "venda sem custo calculado" : "vendas sem custo calculado"}`
        : somar(linhas, "custosPecaLancados") ? `inclui ${formatarMoeda(somar(linhas, "custosPecaLancados"))} lançados nas peças` : "",
      custoPecas === null ? "kpi__value--muted" : "",
      pendentes ? "kpi__note--warning" : ""
    ) +
    criarKpi("Custos da venda", formatarMoeda(custosVenda), "Frete, embalagem, tarifas") +
    criarKpi(
      "Lucro",
      lucro === null ? "Custo não calculado" : formatarMoeda(lucro),
      margem === null ? "" : `Margem de ${formatarMargem(margem)}`,
      lucro === null ? "kpi__value--muted" : classeResultado(lucro)
    );
}

function renderizarLinha(linha) {
  const href = `detalhes-venda.html?vendaId=${encodeURIComponent(linha.venda.id)}`;

  return `
    <tr>
      <td class="cell-nowrap" data-label="Data">${formatarData(linha.data)}</td>
      <td data-label="Peça">
        <div class="item-cell__text">
          <a class="item-cell__name" href="${href}">${escaparHtml(linha.nome)}</a>
          ${linha.sku ? `<span class="item-cell__meta"><span class="mono">${escaparHtml(linha.sku)}</span></span>` : ""}
        </div>
      </td>
      <td class="cell-muted cell-nowrap" data-label="Canal">${escaparHtml(linha.canal || "—")}</td>
      <td class="num" data-label="Qtd.">${formatarNumero(linha.quantidade)}</td>
      <td class="num" data-label="Receita">${formatarMoeda(linha.receita)}</td>
      <td class="num" data-label="Custo de entrada">${linha.custoEntrada === null ? '<span class="text-warning">Não calculado</span>' : formatarMoeda(linha.custoEntrada)}</td>
      <td class="num" data-label="Custos lançados">${linha.custosPecaLancados ? formatarMoeda(linha.custosPecaLancados) : "—"}</td>
      <td class="num" data-label="Custos da venda">${formatarMoeda(linha.custosVenda)}</td>
      <td class="num cell-strong" data-label="Lucro">${linha.lucro === null ? '<span class="text-warning">Custo não calculado</span>' : `<span class="${classeResultado(linha.lucro)}">${formatarMoeda(linha.lucro)}</span>`}</td>
      <td class="num" data-label="Margem">${formatarMargem(linha.margem)}</td>
      <td class="cell-acoes"><a class="btn btn--secondary btn--compact" href="${href}">Ver venda</a></td>
    </tr>
  `;
}

function renderizarAnalise() {
  if (dataInicial.value && dataFinal.value && dataInicial.value > dataFinal.value) {
    mensagemAnalisePeriodo.textContent = "A data inicial não pode ser maior que a data final.";
    resumoAnalisePeriodo.innerHTML = "";
    tabelaAnalisePeriodo.innerHTML = "";
    paginacaoAnalisePeriodo.hidden = true;
    return;
  }

  mensagemAnalisePeriodo.textContent = "";
  const linhas = filtrarVendas();
  const filtradas = linhas.filter(linha => combinaComCusto(linha, custoSelecionado));

  renderizarResumo(linhas);
  filtroCustoAnalisePeriodo.querySelectorAll("[data-contagem]").forEach(contador => {
    contador.textContent = formatarNumero(linhas.filter(linha => combinaComCusto(linha, contador.dataset.contagem)).length);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (!filtradas.length) {
    tabelaAnalisePeriodo.innerHTML = '<tr class="data-table__empty"><td colspan="11">Nenhuma venda encontrada no período selecionado.</td></tr>';
    paginacaoAnalisePeriodo.hidden = true;
    return;
  }

  tabelaAnalisePeriodo.innerHTML = pagina.map(renderizarLinha).join("");
  paginacaoAnalisePeriodo.hidden = filtradas.length <= ITENS_POR_PAGINA;
  paginacaoTextoAnalisePeriodo.textContent = `Mostrando ${inicio + 1}–${inicio + pagina.length} de ${filtradas.length}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

// ---- Início ----

async function iniciarAnalisePeriodo() {
  periodoRapido.value = "mes";
  aplicarPeriodoRapido();

  if (!window.supabaseService?.estaConfigurado()) {
    mensagemAnalisePeriodo.textContent = "Configure o Supabase para carregar a análise por período.";
    return;
  }

  try {
    const [vendas, consumosEstoque, custosVenda, pecas, custosPeca, entradas] = await Promise.all([
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarCustosVenda(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    dadosAnalisePeriodo = {
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      custosVenda: custosVenda || [],
      pecas: pecas || [],
      custosPeca: custosPeca || [],
      entradas: entradas || []
    };
    preencherCanais(dadosAnalisePeriodo.vendas);
    renderizarAnalise();
  } catch (erro) {
    console.error("Erro ao carregar análise por período:", erro);
    mensagemAnalisePeriodo.textContent = "Não foi possível carregar os dados da análise por período.";
  }
}

function atualizarDoInicio() {
  paginaAtual = 1;
  renderizarAnalise();
}

if (tabelaAnalisePeriodo) {
  periodoRapido.addEventListener("change", () => {
    aplicarPeriodoRapido();
    atualizarDoInicio();
  });

  [dataInicial, dataFinal].forEach(campo => {
    campo.addEventListener("change", () => {
      periodoRapido.value = "personalizado";
      atualizarDoInicio();
    });
  });

  [buscaAnalisePeriodo, filtroCanalAnalisePeriodo].forEach(campo => campo.addEventListener("input", atualizarDoInicio));

  filtroCustoAnalisePeriodo.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-custo]");
    if (!botao) return;
    custoSelecionado = botao.dataset.custo;
    filtroCustoAnalisePeriodo.querySelectorAll("[data-custo]").forEach(item => {
      item.setAttribute("aria-pressed", String(item.dataset.custo === custoSelecionado));
    });
    atualizarDoInicio();
  });

  botaoPaginaAnterior.addEventListener("click", () => {
    paginaAtual -= 1;
    renderizarAnalise();
  });

  botaoPaginaProxima.addEventListener("click", () => {
    paginaAtual += 1;
    renderizarAnalise();
  });

  iniciarAnalisePeriodo();
}
