const formAnalisePeriodo = document.getElementById("formAnalisePeriodo");
const dataInicial = document.getElementById("dataInicial");
const dataFinal = document.getElementById("dataFinal");
const periodoRapido = document.getElementById("periodoRapido");
const limparPeriodo = document.getElementById("limparPeriodo");
const mensagemAnalisePeriodo = document.getElementById("mensagemAnalisePeriodo");
const resumoAnalisePeriodo = document.getElementById("resumoAnalisePeriodo");
const tabelaAnalisePeriodo = document.getElementById("tabelaAnalisePeriodo");
const buscaAnalisePeriodo = document.getElementById("buscaAnalisePeriodo");
const filtroCanalAnalisePeriodo = document.getElementById("filtroCanalAnalisePeriodo");
const filtroCustoAnalisePeriodo = document.getElementById("filtroCustoAnalisePeriodo");
const quantidadeAnalisePeriodo = document.getElementById("quantidadeAnalisePeriodo");
const analisePeriodoShell = document.getElementById("analisePeriodoShell");
const botaoAbrirFiltrosAnalisePeriodo = document.getElementById("botaoAbrirFiltrosAnalisePeriodo");
const botaoFecharFiltrosAnalisePeriodo = document.getElementById("botaoFecharFiltrosAnalisePeriodo");

let dadosAnalisePeriodo = {
  vendas: [],
  consumosEstoque: [],
  custosVenda: []
};
let vendaExpandidaId = null;

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
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

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
}

function calcularValorVenda(venda) {
  return window.financeiroUtils.calcularReceitaVenda(venda);
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatarMargem(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "-";
  }

  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
}

function obterCanalVenda(venda) {
  return String(venda.canalVenda || venda.canal_venda || venda.canal || "").trim();
}

function formatarSkuVenda(venda) {
  return String(venda.sku || venda.codigo || venda.codigo_peca || "").trim() || "-";
}

function somar(lista, campo = "valor") {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function obterClasseLucro(lucro) {
  if (lucro > 0) {
    return "profit-value profit-value--positive";
  }

  if (lucro < 0) {
    return "profit-value profit-value--negative";
  }

  return "profit-value profit-value--neutral";
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

function definirPeriodoPadrao() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  if (periodoRapido) {
    periodoRapido.value = "mes";
  }

  dataInicial.value = formatarDataInput(primeiroDia);
  dataFinal.value = formatarDataInput(hoje);
}

function aplicarPeriodoRapido() {
  if (!periodoRapido || periodoRapido.value === "personalizado") {
    return;
  }

  const hoje = new Date();
  const fim = formatarDataInput(hoje);
  let inicio = "";

  if (periodoRapido.value === "hoje") {
    inicio = fim;
  }

  if (periodoRapido.value === "7") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 6);
    inicio = formatarDataInput(data);
  }

  if (periodoRapido.value === "30") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 29);
    inicio = formatarDataInput(data);
  }

  if (periodoRapido.value === "mes") {
    inicio = formatarDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  }

  dataInicial.value = inicio;
  dataFinal.value = fim;
}

function preencherCanais(vendas) {
  if (!filtroCanalAnalisePeriodo) {
    return;
  }

  const valorAtual = filtroCanalAnalisePeriodo.value;
  const canais = Array.from(new Set((vendas || []).map(obterCanalVenda).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  filtroCanalAnalisePeriodo.innerHTML = '<option value="">Todos</option>';
  canais.forEach(canal => {
    const opcao = document.createElement("option");
    opcao.value = canal;
    opcao.textContent = canal;
    filtroCanalAnalisePeriodo.appendChild(opcao);
  });

  filtroCanalAnalisePeriodo.value = canais.includes(valorAtual) ? valorAtual : "";
}

function filtrarVendasPorPeriodo(vendas) {
  const inicio = dataInicial.value;
  const fim = dataFinal.value;
  const termo = String(buscaAnalisePeriodo?.value || "").trim().toLowerCase();
  const canal = filtroCanalAnalisePeriodo?.value || "";

  if (!inicio || !fim) {
    return [];
  }

  return vendas
    .filter(venda => {
      const dataVenda = obterDataVenda(venda);
      return dataVenda && dataVenda >= inicio && dataVenda <= fim;
    })
    .filter(venda => {
      if (!canal) {
        return true;
      }

      return obterCanalVenda(venda) === canal;
    })
    .filter(venda => {
      if (!termo) {
        return true;
      }

      const sku = formatarSkuVenda(venda).toLowerCase();
      const nome = formatarNomeVenda(venda).toLowerCase();
      const canalVenda = obterCanalVenda(venda).toLowerCase();
      return sku.includes(termo) || nome.includes(termo) || canalVenda.includes(termo);
    });
}

function formatarValorOuNaoCalculado(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "Custo não calculado";
  }

  return formatarMoeda(Number(valor || 0));
}

function calcularLinhas(vendasFiltradas) {
  return vendasFiltradas.map(venda => {
    const vendaId = Number(venda.id);
    const resultadoVenda = window.financeiroUtils.calcularLucroVenda(
      venda,
      dadosAnalisePeriodo.consumosEstoque,
      dadosAnalisePeriodo.custosVenda
    );
    const custoConsumido = window.financeiroUtils.calcularCustoConsumidoVenda(
      vendaId,
      dadosAnalisePeriodo.consumosEstoque
    );
    const custosDaVenda = window.financeiroUtils.calcularCustosVenda(
      vendaId,
      dadosAnalisePeriodo.custosVenda
    );

    return {
      venda,
      data: obterDataVenda(venda),
      totalVendido: resultadoVenda.receita,
      custoProdutos: custoConsumido.calculado ? custoConsumido.valor : null,
      custosVenda: custosDaVenda.valor,
      lucro: resultadoVenda.calculado ? resultadoVenda.lucro : null,
      margem: resultadoVenda.calculado ? resultadoVenda.margem : null,
      quantidade: Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0),
      custoCalculado: resultadoVenda.calculado
    };
  });
}

function filtrarLinhas(linhas, limitarQuantidade = true) {
  const filtroCusto = filtroCustoAnalisePeriodo?.value || "";
  const quantidade = quantidadeAnalisePeriodo?.value || "12";
  const filtradas = linhas
    .filter(linha => {
      if (filtroCusto === "calculado") {
        return linha.custoCalculado;
      }

      if (filtroCusto === "pendente") {
        return !linha.custoCalculado;
      }

      return true;
    })
    .sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));

  if (!limitarQuantidade || quantidade === "todos") {
    return filtradas;
  }

  return filtradas.slice(0, Number(quantidade || 12));
}

function calcularResumo(linhas) {
  const totalVendido = somar(linhas, "totalVendido");
  const vendasSemCusto = linhas.filter(linha => !linha.custoCalculado).length;
  const custoProdutosVendidos = vendasSemCusto > 0 ? null : somar(linhas, "custoProdutos");
  const custosVenda = somar(linhas, "custosVenda");
  const lucro = vendasSemCusto > 0 ? null : totalVendido - custoProdutosVendidos - custosVenda;
  const margem = lucro === null || totalVendido <= 0 ? null : (lucro / totalVendido) * 100;
  const quantidadeVendida = somar(linhas, "quantidade");

  return {
    totalVendido,
    custoProdutosVendidos,
    custosVenda,
    lucro,
    margem,
    quantidadeVendida,
    numeroVendas: linhas.length,
    vendasSemCusto
  };
}

function renderizarResumo(resumo) {
  const classeLucro = resumo.lucro !== null && resumo.lucro >= 0 ? "summary-card--profit" : "summary-card--loss";

  resumoAnalisePeriodo.innerHTML =
    criarCard("Receita total", formatarMoeda(resumo.totalVendido)) +
    criarCard("Custo das peças", formatarValorOuNaoCalculado(resumo.custoProdutosVendidos)) +
    criarCard("Custos da venda", formatarMoeda(resumo.custosVenda)) +
    criarCard("Lucro total", resumo.lucro === null ? "Custo não calculado" : `<span class="${obterClasseLucro(resumo.lucro)}">${formatarMoeda(resumo.lucro)}</span>`, classeLucro) +
    criarCard("Margem média", resumo.margem === null ? "Custo não calculado" : formatarMargem(resumo.margem)) +
    criarCard("Quantidade vendida", formatarNumero(resumo.quantidadeVendida));
}

function formatarNomeVenda(venda) {
  const nome = venda.produtoNome || venda.nome || venda.nomePeca || venda.nome_peca || `Peça ${venda.pecaId || ""}`.trim();
  const sku = formatarSkuVenda(venda);

  return sku && sku !== "-" ? `${sku} - ${nome}` : nome;
}

function obterNomePecaVenda(venda) {
  return venda.produtoNome || venda.nome || venda.nomePeca || venda.nome_peca || `Peça ${venda.pecaId || ""}`.trim();
}

function obterConsumosDaVenda(vendaId) {
  return dadosAnalisePeriodo.consumosEstoque.filter(consumo => Number(consumo.vendaId) === Number(vendaId));
}

function obterCustosDaVenda(vendaId) {
  return dadosAnalisePeriodo.custosVenda.filter(custo => Number(custo.vendaId) === Number(vendaId));
}

function criarDetalhesVendaHtml(linha) {
  const vendaId = Number(linha.venda.id);
  const consumos = obterConsumosDaVenda(vendaId);
  const custos = obterCustosDaVenda(vendaId);
  const entradaTexto = consumos.length === 0
    ? "Custo não calculado"
    : consumos.map(consumo => {
      const entrada = consumo.entradaEstoqueId || consumo.entrada_estoque_id || "-";
      const quantidade = consumo.quantidadeConsumida || consumo.quantidade_consumida || 0;
      const custoUnitario = consumo.custoUnitario || consumo.custo_unitario || 0;
      return `Entrada ${entrada}, ${formatarNumero(quantidade)} un., custo unitário ${formatarMoeda(custoUnitario)}`;
    }).join("; ");
  const custosTexto = custos.length === 0
    ? "Nenhum custo da venda registrado."
    : custos.map(custo => {
      const tipo = custo.tipoCusto || custo.tipo || "Custo";
      return `${tipo}: ${formatarMoeda(custo.valor)}`;
    }).join("; ");
  const resumoTexto = linha.custoCalculado
    ? `Receita de ${formatarMoeda(linha.totalVendido)} menos ${formatarValorOuNaoCalculado(linha.custoProdutos)} de custo da peça e ${formatarMoeda(linha.custosVenda)} de custos da venda.`
    : "Custo não calculado para esta venda.";

  return `
    <section class="period-analysis-detail-panel" aria-label="Detalhes da venda">
      <div>
        <span class="piece-form-eyebrow">Entrada consumida</span>
        <p>${escaparHtml(entradaTexto)}</p>
      </div>
      <div>
        <span class="piece-form-eyebrow">Custos da venda</span>
        <p>${escaparHtml(custosTexto)}</p>
      </div>
      <div>
        <span class="piece-form-eyebrow">Resumo simples</span>
        <p>${escaparHtml(resumoTexto)}</p>
      </div>
    </section>
  `;
}

function renderizarTabela(linhas) {
  tabelaAnalisePeriodo.innerHTML = "";

  if (linhas.length === 0) {
    mensagemAnalisePeriodo.textContent = "Nenhuma venda encontrada para o período selecionado.";
    return;
  }

  mensagemAnalisePeriodo.textContent = "";

  linhas.forEach(linha => {
    const expandida = String(vendaExpandidaId || "") === String(linha.venda.id || "");
    const lucroHtml = linha.lucro === null
      ? `<strong class="profit-value profit-value--neutral">-</strong>`
      : `<strong class="${obterClasseLucro(linha.lucro)}">${formatarMoeda(linha.lucro)}</strong>`;
    const margemHtml = linha.margem === null
      ? `<span class="badge badge-attention">Pendente</span>`
      : `<span class="badge badge-ok">${formatarMargem(linha.margem)}</span>`;

    tabelaAnalisePeriodo.insertAdjacentHTML("beforeend", `
      <article class="period-analysis-row${expandida ? " period-analysis-row--expanded" : ""}">
        <span data-label="Data">${formatarData(linha.data)}</span>
        <span class="sku" data-label="SKU">${escaparHtml(formatarSkuVenda(linha.venda))}</span>
        <strong class="product-name" data-label="Peça">${escaparHtml(obterNomePecaVenda(linha.venda))}</strong>
        <span data-label="Qtd.">${formatarNumero(linha.quantidade)}</span>
        <span data-label="Canal">${escaparHtml(obterCanalVenda(linha.venda) || "-")}</span>
        <span data-label="Receita">${formatarMoeda(linha.totalVendido)}</span>
        <span data-label="Custo da peça">${formatarValorOuNaoCalculado(linha.custoProdutos)}</span>
        <span data-label="Custos da venda">${formatarMoeda(linha.custosVenda)}</span>
        <span data-label="Lucro">${lucroHtml}</span>
        <span data-label="Margem">${margemHtml}</span>
        <button type="button" class="button-secondary button-compact" data-acao="alternar-detalhes" data-venda-id="${escaparHtml(linha.venda.id || "")}">
          ${expandida ? "Ocultar" : "Detalhes"}
        </button>
      </article>
    `);

    if (expandida) {
      tabelaAnalisePeriodo.insertAdjacentHTML("beforeend", criarDetalhesVendaHtml(linha));
    }
  });
}

function renderizarAnalise() {
  if (dataInicial.value && dataFinal.value && dataInicial.value > dataFinal.value) {
    mensagemAnalisePeriodo.textContent = "A data inicial não pode ser maior que a data final.";
    resumoAnalisePeriodo.innerHTML = "";
    tabelaAnalisePeriodo.innerHTML = "";
    return;
  }

  const vendasFiltradas = filtrarVendasPorPeriodo(dadosAnalisePeriodo.vendas);
  const todasLinhas = filtrarLinhas(calcularLinhas(vendasFiltradas), false);
  const linhas = filtrarLinhas(todasLinhas);
  const resumo = calcularResumo(todasLinhas);

  if (vendaExpandidaId && !linhas.some(linha => String(linha.venda.id || "") === String(vendaExpandidaId))) {
    vendaExpandidaId = null;
  }

  renderizarResumo(resumo);
  renderizarTabela(linhas);
}

function definirPainelFiltrosAberto(aberto) {
  analisePeriodoShell?.classList.toggle("period-analysis-shell--filters-open", aberto);
  botaoAbrirFiltrosAnalisePeriodo?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemAnalisePeriodo.textContent = "Configure o Supabase para carregar a análise por período.";
    return false;
  }

  try {
    const [vendas, consumosEstoque, custosVenda] = await Promise.all([
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarCustosVenda()
    ]);

    dadosAnalisePeriodo = {
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      custosVenda: custosVenda || []
    };
    preencherCanais(dadosAnalisePeriodo.vendas);

    return true;
  } catch (erro) {
    console.error("Erro ao carregar análise por período:", erro);
    mensagemAnalisePeriodo.textContent = "Não foi possível carregar os dados da análise por período.";
    return false;
  }
}

async function iniciarAnalisePeriodo() {
  definirPeriodoPadrao();

  const carregou = await carregarDados();

  if (!carregou) {
    resumoAnalisePeriodo.innerHTML = "";
    tabelaAnalisePeriodo.innerHTML = "";
    return;
  }

  renderizarAnalise();
}

formAnalisePeriodo?.addEventListener("submit", function (evento) {
  evento.preventDefault();
  aplicarPeriodoRapido();
  renderizarAnalise();
  definirPainelFiltrosAberto(false);
});

limparPeriodo?.addEventListener("click", function () {
  definirPeriodoPadrao();
  if (filtroCanalAnalisePeriodo) {
    filtroCanalAnalisePeriodo.value = "";
  }
  if (filtroCustoAnalisePeriodo) {
    filtroCustoAnalisePeriodo.value = "";
  }
  if (buscaAnalisePeriodo) {
    buscaAnalisePeriodo.value = "";
  }
  renderizarAnalise();
});

periodoRapido?.addEventListener("change", function () {
  aplicarPeriodoRapido();
  renderizarAnalise();
});

[dataInicial, dataFinal].forEach(campo => {
  campo?.addEventListener("change", function () {
    if (periodoRapido) {
      periodoRapido.value = "personalizado";
    }
    renderizarAnalise();
  });
});

filtroCanalAnalisePeriodo?.addEventListener("change", renderizarAnalise);
filtroCustoAnalisePeriodo?.addEventListener("change", renderizarAnalise);
quantidadeAnalisePeriodo?.addEventListener("change", renderizarAnalise);
buscaAnalisePeriodo?.addEventListener("input", renderizarAnalise);

tabelaAnalisePeriodo?.addEventListener("click", function (evento) {
  const botao = evento.target.closest("button[data-acao='alternar-detalhes']");

  if (!botao) {
    return;
  }

  const vendaId = String(botao.dataset.vendaId || "");
  vendaExpandidaId = String(vendaExpandidaId || "") === vendaId ? null : vendaId;
  renderizarAnalise();
});

botaoAbrirFiltrosAnalisePeriodo?.addEventListener("click", function () {
  definirPainelFiltrosAberto(!analisePeriodoShell?.classList.contains("period-analysis-shell--filters-open"));
});

botaoFecharFiltrosAnalisePeriodo?.addEventListener("click", function () {
  definirPainelFiltrosAberto(false);
});

document.addEventListener("DOMContentLoaded", iniciarAnalisePeriodo);
