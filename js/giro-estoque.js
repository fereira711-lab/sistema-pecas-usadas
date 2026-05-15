const mensagemGiroEstoque = document.getElementById("mensagemGiroEstoque");
const resumoGiroEstoque = document.getElementById("resumoGiroEstoque");
const tabelaGiroEstoque = document.getElementById("tabelaGiroEstoque");
const buscaGiroEstoque = document.getElementById("buscaGiroEstoque");
const giroEstoqueShell = document.getElementById("giroEstoqueShell");
const botaoAbrirFiltrosGiroEstoque = document.getElementById("botaoAbrirFiltrosGiroEstoque");
const botaoFecharFiltrosGiroEstoque = document.getElementById("botaoFecharFiltrosGiroEstoque");
const botaoLimparFiltrosGiroEstoque = document.getElementById("botaoLimparFiltrosGiroEstoque");
const botaoAplicarFiltrosGiroEstoque = document.getElementById("botaoAplicarFiltrosGiroEstoque");
const periodoRapidoGiroEstoque = document.getElementById("periodoRapidoGiroEstoque");
const dataInicialGiroEstoque = document.getElementById("dataInicialGiroEstoque");
const dataFinalGiroEstoque = document.getElementById("dataFinalGiroEstoque");
const filtroStatusGiroEstoque = document.getElementById("filtroStatusGiroEstoque");
const filtroOrigemGiroEstoque = document.getElementById("filtroOrigemGiroEstoque");
const ordenacaoGiroEstoque = document.getElementById("ordenacaoGiroEstoque");

let dadosGiroEstoque = {
  pecas: [],
  vendas: [],
  entradasEstoque: []
};
let linhasGiroEstoque = [];

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

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function formatarNome(peca) {
  return peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peça ${peca.id}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || venda.createdAt || venda.created_at || "").slice(0, 10);
}

function agruparPorId(lista, campo) {
  return lista.reduce((mapa, item) => {
    const id = Number(item[campo] || 0);

    if (!mapa[id]) {
      mapa[id] = [];
    }

    mapa[id].push(item);
    return mapa;
  }, {});
}

function somarQuantidadeVendida(vendas) {
  return vendas.reduce((total, venda) => {
    return total + Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
  }, 0);
}

function somarCampo(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function obterUltimaVenda(vendas) {
  return vendas.reduce((ultimaData, venda) => {
    const dataVenda = obterDataVenda(venda);

    if (!dataVenda) {
      return ultimaData;
    }

    return !ultimaData || dataVenda > ultimaData ? dataVenda : ultimaData;
  }, "");
}

function obterDataEntradaOuCadastro(peca, entradasDaPeca) {
  const datasEntrada = entradasDaPeca
    .map(entrada => String(entrada.dataEntrada || entrada.createdAt || "").slice(0, 10))
    .filter(Boolean)
    .sort();

  return String(peca.createdAt || peca.created_at || datasEntrada[0] || "").slice(0, 10);
}

function calcularDiasDesde(dataIso) {
  if (!dataIso) {
    return null;
  }

  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const partes = String(dataIso).slice(0, 10).split("-").map(Number);

  if (partes.length !== 3 || partes.some(Number.isNaN)) {
    return null;
  }

  const data = new Date(partes[0], partes[1] - 1, partes[2]);
  const milissegundosPorDia = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((inicioHoje - data) / milissegundosPorDia));
}

function definirPeriodoPadrao() {
  if (periodoRapidoGiroEstoque) {
    periodoRapidoGiroEstoque.value = "todos";
  }

  dataInicialGiroEstoque.value = "";
  dataFinalGiroEstoque.value = "";
}

function aplicarPeriodoRapido() {
  if (!periodoRapidoGiroEstoque || periodoRapidoGiroEstoque.value === "personalizado") {
    return;
  }

  if (periodoRapidoGiroEstoque.value === "todos") {
    dataInicialGiroEstoque.value = "";
    dataFinalGiroEstoque.value = "";
    return;
  }

  const hoje = new Date();
  const fim = formatarDataInput(hoje);
  let inicio = fim;

  if (periodoRapidoGiroEstoque.value === "7") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 6);
    inicio = formatarDataInput(data);
  }

  if (periodoRapidoGiroEstoque.value === "30") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 29);
    inicio = formatarDataInput(data);
  }

  if (periodoRapidoGiroEstoque.value === "90") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 89);
    inicio = formatarDataInput(data);
  }

  dataInicialGiroEstoque.value = inicio;
  dataFinalGiroEstoque.value = fim;
}

function itemDentroDoPeriodo(data) {
  const inicio = dataInicialGiroEstoque?.value || "";
  const fim = dataFinalGiroEstoque?.value || "";
  const dataIso = String(data || "").slice(0, 10);

  if (!inicio && !fim) {
    return true;
  }

  if (!dataIso) {
    return false;
  }

  if (inicio && dataIso < inicio) {
    return false;
  }

  if (fim && dataIso > fim) {
    return false;
  }

  return true;
}

function classificarGiro(quantidadeVendida, diasSemVenda) {
  if (quantidadeVendida <= 0) {
    return "sem venda";
  }

  if (diasSemVenda <= 15) {
    return "rapido";
  }

  if (diasSemVenda <= 30) {
    return "atencao";
  }

  return "parado";
}

function obterStatusEstoque(estoqueDisponivel) {
  if (estoqueDisponivel <= 0) {
    return "sem-estoque";
  }

  if (estoqueDisponivel <= 1) {
    return "estoque-baixo";
  }

  return "em-estoque";
}

function obterClasseClassificacao(status) {
  const classes = {
    rapido: "status-badge status-badge--fast",
    atencao: "status-badge status-badge--attention",
    parado: "status-badge status-badge--stopped",
    "sem venda": "status-badge status-badge--no-sale",
    "sem-estoque": "status-badge status-badge--empty",
    "estoque-baixo": "status-badge status-badge--warning",
    "em-estoque": "status-badge status-badge--stock"
  };

  return classes[status] || "status-badge";
}

function formatarStatus(linha) {
  if (linha.statusEstoque === "sem-estoque") {
    return "Sem estoque";
  }

  if (linha.statusEstoque === "estoque-baixo") {
    return "Estoque baixo";
  }

  const nomes = {
    rapido: "Maior giro",
    atencao: "Atenção",
    parado: "Parado",
    "sem venda": "Sem venda"
  };

  return nomes[linha.classificacao] || linha.classificacao;
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

function obterOrigemTexto(entradasDaPeca) {
  const entrada = entradasDaPeca.find(item => item.origemDescricao || item.origemId);
  return String(entrada?.origemDescricao || entrada?.origemId || "").trim();
}

function calcularGiro(dados) {
  const vendasPorPeca = agruparPorId(dados.vendas, "pecaId");
  const entradasPorPeca = agruparPorId(dados.entradasEstoque, "pecaId");

  return dados.pecas.map(peca => {
    const pecaId = Number(peca.id);
    const vendasDaPeca = vendasPorPeca[pecaId] || [];
    const entradasDaPeca = entradasPorPeca[pecaId] || [];
    const vendasNoPeriodo = vendasDaPeca.filter(venda => itemDentroDoPeriodo(obterDataVenda(venda)));
    const quantidadeVendidaNoPeriodo = somarQuantidadeVendida(vendasNoPeriodo);
    const quantidadeVendidaTotal = somarQuantidadeVendida(vendasDaPeca) || Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
    const totalEntradas = somarCampo(entradasDaPeca, "quantidadeTotal");
    const quantidadeTotal = totalEntradas > 0 ? totalEntradas : Number(peca.quantidade || 0);
    const estoqueDisponivel = Math.max(0, quantidadeTotal - quantidadeVendidaTotal);
    const ultimaVenda = obterUltimaVenda(vendasDaPeca);
    const ultimaVendaNoPeriodo = obterUltimaVenda(vendasNoPeriodo);
    const dataBaseSemVenda = ultimaVenda || obterDataEntradaOuCadastro(peca, entradasDaPeca);
    const diasSemVenda = calcularDiasDesde(dataBaseSemVenda);
    const classificacao = classificarGiro(quantidadeVendidaNoPeriodo, diasSemVenda);
    const statusEstoque = obterStatusEstoque(estoqueDisponivel);

    return {
      pecaId,
      sku: formatarSku(peca),
      nome: formatarNome(peca),
      origem: obterOrigemTexto(entradasDaPeca),
      estoqueDisponivel,
      quantidadeVendida: quantidadeVendidaNoPeriodo,
      quantidadeVendidaTotal,
      ultimaVenda,
      ultimaVendaNoPeriodo,
      diasSemVenda,
      classificacao,
      statusEstoque
    };
  });
}

function preencherOrigens(linhas) {
  if (!filtroOrigemGiroEstoque) {
    return;
  }

  const valorAtual = filtroOrigemGiroEstoque.value;
  const origens = Array.from(new Set(linhas.map(linha => linha.origem).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  filtroOrigemGiroEstoque.innerHTML = '<option value="">Todas</option>';
  origens.forEach(origem => {
    const opcao = document.createElement("option");
    opcao.value = origem;
    opcao.textContent = origem;
    filtroOrigemGiroEstoque.appendChild(opcao);
  });

  filtroOrigemGiroEstoque.value = origens.includes(valorAtual) ? valorAtual : "";
}

function linhaDentroDosFiltros(linha) {
  const termo = normalizarTexto(buscaGiroEstoque?.value || "");
  const status = filtroStatusGiroEstoque?.value || "";
  const origem = filtroOrigemGiroEstoque?.value || "";

  if (termo && !normalizarTexto(`${linha.sku} ${linha.nome}`).includes(termo)) {
    return false;
  }

  if (origem && linha.origem !== origem) {
    return false;
  }

  if (status === "sem-estoque" || status === "estoque-baixo") {
    return linha.statusEstoque === status;
  }

  if (status === "sem-venda") {
    return linha.classificacao === "sem venda";
  }

  if (status && linha.classificacao !== status) {
    return false;
  }

  return true;
}

function ordenarLinhas(linhas) {
  const ordenacao = ordenacaoGiroEstoque?.value || "giro";
  const ordenadas = [...linhas];

  return ordenadas.sort((a, b) => {
    if (ordenacao === "nome") {
      return a.nome.localeCompare(b.nome, "pt-BR");
    }

    if (ordenacao === "estoque") {
      return a.estoqueDisponivel - b.estoqueDisponivel;
    }

    if (ordenacao === "ultima-venda") {
      return String(b.ultimaVenda || "").localeCompare(String(a.ultimaVenda || ""));
    }

    if (ordenacao === "parado") {
      return Number(b.diasSemVenda || 0) - Number(a.diasSemVenda || 0);
    }

    return Number(b.quantidadeVendida || 0) - Number(a.quantidadeVendida || 0);
  });
}

function renderizarResumo(linhas) {
  const maiorGiro = linhas.filter(linha => linha.classificacao === "rapido").length;
  const parados = linhas.filter(linha => linha.classificacao === "parado").length;
  const estoqueBaixo = linhas.filter(linha => linha.statusEstoque === "estoque-baixo").length;
  const semEstoque = linhas.filter(linha => linha.statusEstoque === "sem-estoque").length;
  const quantidadeVendida = linhas.reduce((total, linha) => total + Number(linha.quantidadeVendida || 0), 0);

  resumoGiroEstoque.innerHTML =
    criarCard("Produtos com maior giro", formatarNumero(maiorGiro), "summary-card--profit") +
    criarCard("Produtos parados", formatarNumero(parados), "summary-card--loss") +
    criarCard("Estoque baixo", formatarNumero(estoqueBaixo)) +
    criarCard("Sem estoque", formatarNumero(semEstoque), "summary-card--loss") +
    criarCard("Quantidade vendida", formatarNumero(quantidadeVendida));
}

function renderizarTabela(linhas) {
  tabelaGiroEstoque.innerHTML = "";

  if (linhas.length === 0) {
    mensagemGiroEstoque.textContent = "Nenhuma peça encontrada para os filtros selecionados.";
    return;
  }

  mensagemGiroEstoque.textContent = "";

  linhas.forEach(linha => {
    const tr = document.createElement("tr");
    const diasSemVenda = linha.diasSemVenda === null ? "-" : `${formatarNumero(linha.diasSemVenda)} dias`;
    const statusClasse = linha.statusEstoque === "em-estoque"
      ? obterClasseClassificacao(linha.classificacao)
      : obterClasseClassificacao(linha.statusEstoque);

    tr.innerHTML = `
      <td data-label="SKU">${escaparHtml(linha.sku)}</td>
      <td data-label="Peça"><strong class="product-name">${escaparHtml(linha.nome)}</strong></td>
      <td data-label="Estoque disponível">${formatarNumero(linha.estoqueDisponivel)}</td>
      <td data-label="Qtd. vendida">${formatarNumero(linha.quantidadeVendida)}</td>
      <td data-label="Última venda">${formatarData(linha.ultimaVenda)}</td>
      <td data-label="Tempo parado">${diasSemVenda}</td>
      <td data-label="Status">
        <span class="${statusClasse}">${escaparHtml(formatarStatus(linha))}</span>
      </td>
      <td data-label="Ações">
        <div class="table-actions table-actions--single">
          <a class="table-link" href="detalhes-produto.html?pecaId=${encodeURIComponent(linha.pecaId)}">Ver detalhes da peça</a>
        </div>
      </td>
    `;

    tabelaGiroEstoque.appendChild(tr);
  });
}

function renderizarGiroEstoque() {
  linhasGiroEstoque = calcularGiro(dadosGiroEstoque);
  preencherOrigens(linhasGiroEstoque);
  const filtradas = ordenarLinhas(linhasGiroEstoque.filter(linhaDentroDosFiltros));

  renderizarResumo(filtradas);
  renderizarTabela(filtradas);
}

function definirPainelFiltrosAberto(aberto) {
  giroEstoqueShell?.classList.toggle("inventory-turnover-shell--filters-open", aberto);
  botaoAbrirFiltrosGiroEstoque?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemGiroEstoque.textContent = "Configure o Supabase para carregar o giro de estoque.";
    return null;
  }

  try {
    const [pecas, vendas, entradasEstoque] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    return {
      pecas: pecas || [],
      vendas: vendas || [],
      entradasEstoque: entradasEstoque || []
    };
  } catch (erro) {
    console.error("Erro ao carregar giro de estoque:", erro);
    mensagemGiroEstoque.textContent = "Não foi possível carregar os dados do giro de estoque.";
    return null;
  }
}

async function iniciarGiroEstoque() {
  definirPeriodoPadrao();
  const dados = await carregarDados();

  if (!dados) {
    resumoGiroEstoque.innerHTML = "";
    tabelaGiroEstoque.innerHTML = "";
    return;
  }

  dadosGiroEstoque = dados;
  renderizarGiroEstoque();
}

buscaGiroEstoque?.addEventListener("input", renderizarGiroEstoque);

periodoRapidoGiroEstoque?.addEventListener("change", () => {
  aplicarPeriodoRapido();
  renderizarGiroEstoque();
});

[dataInicialGiroEstoque, dataFinalGiroEstoque].forEach(campo => {
  campo?.addEventListener("change", () => {
    if (periodoRapidoGiroEstoque) {
      periodoRapidoGiroEstoque.value = "personalizado";
    }
    renderizarGiroEstoque();
  });
});

[filtroStatusGiroEstoque, filtroOrigemGiroEstoque, ordenacaoGiroEstoque].forEach(campo => {
  campo?.addEventListener("change", renderizarGiroEstoque);
});

botaoAbrirFiltrosGiroEstoque?.addEventListener("click", () => {
  definirPainelFiltrosAberto(!giroEstoqueShell?.classList.contains("inventory-turnover-shell--filters-open"));
});

botaoFecharFiltrosGiroEstoque?.addEventListener("click", () => {
  definirPainelFiltrosAberto(false);
});

botaoAplicarFiltrosGiroEstoque?.addEventListener("click", () => {
  aplicarPeriodoRapido();
  renderizarGiroEstoque();
  definirPainelFiltrosAberto(false);
});

botaoLimparFiltrosGiroEstoque?.addEventListener("click", () => {
  definirPeriodoPadrao();
  if (buscaGiroEstoque) {
    buscaGiroEstoque.value = "";
  }
  if (filtroStatusGiroEstoque) {
    filtroStatusGiroEstoque.value = "";
  }
  if (filtroOrigemGiroEstoque) {
    filtroOrigemGiroEstoque.value = "";
  }
  if (ordenacaoGiroEstoque) {
    ordenacaoGiroEstoque.value = "giro";
  }
  renderizarGiroEstoque();
});

document.addEventListener("DOMContentLoaded", iniciarGiroEstoque);
