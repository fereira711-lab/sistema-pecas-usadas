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
const analisePeriodoShell = document.getElementById("analisePeriodoShell");
const botaoAbrirFiltrosAnalisePeriodo = document.getElementById("botaoAbrirFiltrosAnalisePeriodo");
const botaoFecharFiltrosAnalisePeriodo = document.getElementById("botaoFecharFiltrosAnalisePeriodo");

let dadosAnalisePeriodo = {
  vendas: [],
  consumosEstoque: [],
  custosVenda: []
};

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
      return sku.includes(termo) || nome.includes(termo);
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
      lucro: resultadoVenda.lucro,
      margem: resultadoVenda.margem,
      quantidade: Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0),
      custoCalculado: resultadoVenda.calculado
    };
  });
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
    criarCard("Total vendido", formatarMoeda(resumo.totalVendido)) +
    criarCard("Custo consumido FIFO", formatarValorOuNaoCalculado(resumo.custoProdutosVendidos)) +
    criarCard("Custos da venda", formatarMoeda(resumo.custosVenda)) +
    criarCard("Lucro do período", resumo.lucro === null ? "Custo não calculado" : `<span class="${obterClasseLucro(resumo.lucro)}">${formatarMoeda(resumo.lucro)}</span>`, classeLucro) +
    criarCard("Margem", formatarMargem(resumo.margem)) +
    criarCard("Quantidade vendida", formatarNumero(resumo.quantidadeVendida)) +
    criarCard("Número de vendas", formatarNumero(resumo.numeroVendas)) +
    criarCard("Vendas sem custo real", resumo.vendasSemCusto);
}

function formatarNomeVenda(venda) {
  const nome = venda.produtoNome || venda.nome || venda.nomePeca || venda.nome_peca || `Peça ${venda.pecaId || ""}`.trim();
  const sku = formatarSkuVenda(venda);

  return sku && sku !== "-" ? `${sku} - ${nome}` : nome;
}

function obterNomePecaVenda(venda) {
  return venda.produtoNome || venda.nome || venda.nomePeca || venda.nome_peca || `Peça ${venda.pecaId || ""}`.trim();
}

function renderizarTabela(linhas) {
  tabelaAnalisePeriodo.innerHTML = "";

  if (linhas.length === 0) {
    mensagemAnalisePeriodo.textContent = "Nenhuma venda encontrada para o período selecionado.";
    return;
  }

  mensagemAnalisePeriodo.textContent = "";

  linhas.forEach(linha => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td data-label="Data">${formatarData(linha.data)}</td>
      <td data-label="SKU">${escaparHtml(formatarSkuVenda(linha.venda))}</td>
      <td data-label="Peça"><strong class="product-name">${escaparHtml(obterNomePecaVenda(linha.venda))}</strong></td>
      <td data-label="Quantidade">${formatarNumero(linha.quantidade)}</td>
      <td data-label="Valor vendido">${formatarMoeda(linha.totalVendido)}</td>
      <td data-label="Custo consumido">${formatarValorOuNaoCalculado(linha.custoProdutos)}</td>
      <td data-label="Custos da venda">${formatarMoeda(linha.custosVenda)}</td>
      <td data-label="Lucro">${linha.lucro === null ? "<strong>Custo não calculado</strong>" : `<strong class="${obterClasseLucro(linha.lucro)}">${formatarMoeda(linha.lucro)}</strong>`}</td>
      <td data-label="Ações">
        <div class="table-actions table-actions--single">
          <a class="table-link" href="detalhes-venda.html?vendaId=${encodeURIComponent(linha.venda.id || "")}">Ver detalhes da venda</a>
        </div>
      </td>
    `;

    tabelaAnalisePeriodo.appendChild(tr);
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
  const linhas = calcularLinhas(vendasFiltradas);
  const resumo = calcularResumo(linhas);

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
buscaAnalisePeriodo?.addEventListener("input", renderizarAnalise);

botaoAbrirFiltrosAnalisePeriodo?.addEventListener("click", function () {
  definirPainelFiltrosAberto(!analisePeriodoShell?.classList.contains("period-analysis-shell--filters-open"));
});

botaoFecharFiltrosAnalisePeriodo?.addEventListener("click", function () {
  definirPainelFiltrosAberto(false);
});

document.addEventListener("DOMContentLoaded", iniciarAnalisePeriodo);
