const formAnalisePeriodo = document.getElementById("formAnalisePeriodo");
const dataInicial = document.getElementById("dataInicial");
const dataFinal = document.getElementById("dataFinal");
const limparPeriodo = document.getElementById("limparPeriodo");
const mensagemAnalisePeriodo = document.getElementById("mensagemAnalisePeriodo");
const resumoAnalisePeriodo = document.getElementById("resumoAnalisePeriodo");
const tabelaAnalisePeriodo = document.getElementById("tabelaAnalisePeriodo");

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
  const quantidade = Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
  const valorUnitario = Number(venda.valorUnitario || venda.valor_unitario || venda.precoUnitario || 0);

  return quantidade * valorUnitario;
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

  dataInicial.value = formatarDataInput(primeiroDia);
  dataFinal.value = formatarDataInput(hoje);
}

function filtrarVendasPorPeriodo(vendas) {
  const inicio = dataInicial.value;
  const fim = dataFinal.value;

  if (!inicio || !fim) {
    return [];
  }

  return vendas.filter(venda => {
    const dataVenda = obterDataVenda(venda);
    return dataVenda && dataVenda >= inicio && dataVenda <= fim;
  });
}

function formatarValorOuNaoCalculado(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "Custo nao calculado";
  }

  return formatarMoeda(Number(valor || 0));
}

function calcularLinhas(vendasFiltradas) {
  const consumosPorVenda = agruparPorId(dadosAnalisePeriodo.consumosEstoque, "vendaId");
  const custosVendaPorVenda = agruparPorId(dadosAnalisePeriodo.custosVenda, "vendaId");

  return vendasFiltradas.map(venda => {
    const vendaId = Number(venda.id);
    const totalVendido = calcularValorVenda(venda);
    const consumosDaVenda = consumosPorVenda[vendaId] || [];
    const custoCalculado = consumosDaVenda.length > 0;
    const custoProdutos = custoCalculado ? somar(consumosDaVenda, "custoTotal") : null;
    const custosVenda = somar(custosVendaPorVenda[vendaId] || [], "valor");
    const lucro = custoCalculado ? totalVendido - custoProdutos - custosVenda : null;

    return {
      venda,
      data: obterDataVenda(venda),
      totalVendido,
      custoProdutos,
      custosVenda,
      lucro,
      quantidade: Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0),
      custoCalculado
    };
  });
}

function calcularResumo(linhas) {
  const totalVendido = somar(linhas, "totalVendido");
  const vendasSemCusto = linhas.filter(linha => !linha.custoCalculado).length;
  const custoProdutosVendidos = vendasSemCusto > 0 ? null : somar(linhas, "custoProdutos");
  const custosVenda = somar(linhas, "custosVenda");
  const lucro = vendasSemCusto > 0 ? null : totalVendido - custoProdutosVendidos - custosVenda;
  const quantidadeVendida = somar(linhas, "quantidade");

  return {
    totalVendido,
    custoProdutosVendidos,
    custosVenda,
    lucro,
    quantidadeVendida,
    numeroVendas: linhas.length,
    vendasSemCusto
  };
}

function renderizarResumo(resumo) {
  const classeLucro = resumo.lucro !== null && resumo.lucro >= 0 ? "summary-card--profit" : "summary-card--loss";

  resumoAnalisePeriodo.innerHTML =
    criarCard("Total vendido", formatarMoeda(resumo.totalVendido)) +
    criarCard("Custo dos produtos vendidos", formatarValorOuNaoCalculado(resumo.custoProdutosVendidos)) +
    criarCard("Custos de venda", formatarMoeda(resumo.custosVenda)) +
    criarCard("Lucro do periodo", resumo.lucro === null ? "Custo nao calculado" : `<span class="${obterClasseLucro(resumo.lucro)}">${formatarMoeda(resumo.lucro)}</span>`, classeLucro) +
    criarCard("Quantidade vendida", resumo.quantidadeVendida) +
    criarCard("Numero de vendas", resumo.numeroVendas) +
    criarCard("Vendas sem custo real", resumo.vendasSemCusto);
}

function formatarNomeVenda(venda) {
  const nome = venda.produtoNome || venda.nome || `Peca ${venda.pecaId || ""}`.trim();
  const sku = String(venda.sku || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function renderizarTabela(linhas) {
  tabelaAnalisePeriodo.innerHTML = "";

  if (linhas.length === 0) {
    mensagemAnalisePeriodo.textContent = "Nenhuma venda encontrada para o periodo selecionado.";
    return;
  }

  mensagemAnalisePeriodo.textContent = "";

  linhas.forEach(linha => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td data-label="Data">${formatarData(linha.data)}</td>
      <td data-label="Produto"><strong class="product-name">${formatarNomeVenda(linha.venda)}</strong></td>
      <td data-label="ID da peca">${linha.venda.pecaId || "-"}</td>
      <td data-label="Quantidade">${linha.quantidade}</td>
      <td data-label="Valor total">${formatarMoeda(linha.totalVendido)}</td>
      <td data-label="Custo estoque">${formatarValorOuNaoCalculado(linha.custoProdutos)}</td>
      <td data-label="Custos venda">${formatarMoeda(linha.custosVenda)}</td>
      <td data-label="Lucro">${linha.lucro === null ? "<strong>Custo nao calculado</strong>" : `<strong class="${obterClasseLucro(linha.lucro)}">${formatarMoeda(linha.lucro)}</strong>`}</td>
    `;

    tabelaAnalisePeriodo.appendChild(tr);
  });
}

function renderizarAnalise() {
  if (dataInicial.value && dataFinal.value && dataInicial.value > dataFinal.value) {
    mensagemAnalisePeriodo.textContent = "A data inicial nao pode ser maior que a data final.";
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

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemAnalisePeriodo.textContent = "Configure o Supabase para carregar a analise por periodo.";
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

    return true;
  } catch (erro) {
    console.error("Erro ao carregar analise por periodo:", erro);
    mensagemAnalisePeriodo.textContent = "Nao foi possivel carregar os dados da analise por periodo.";
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
  renderizarAnalise();
});

limparPeriodo?.addEventListener("click", function () {
  definirPeriodoPadrao();
  renderizarAnalise();
});

document.addEventListener("DOMContentLoaded", iniciarAnalisePeriodo);
