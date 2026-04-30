const mensagemAnaliseCustos = document.getElementById("mensagemAnaliseCustos");
const resumoAnaliseCustos = document.getElementById("resumoAnaliseCustos");
const tabelaAnaliseCustos = document.getElementById("tabelaAnaliseCustos");

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarPercentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function normalizarTipoCusto(custo) {
  return String(custo.tipoCusto || custo.tipo || "Sem tipo").trim() || "Sem tipo";
}

function criarCard(titulo, valor) {
  return `
    <article class="summary-card">
      <span>${titulo}</span>
      <strong>${valor}</strong>
    </article>
  `;
}

function somar(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function adicionarCustoNoGrupo(mapa, custo, origem) {
  const tipo = normalizarTipoCusto(custo);

  if (!mapa[tipo]) {
    mapa[tipo] = {
      tipo,
      totalCustosPeca: 0,
      totalCustosVenda: 0,
      totalGeral: 0,
      percentual: 0
    };
  }

  const valor = Number(custo.valor || 0);

  if (origem === "peca") {
    mapa[tipo].totalCustosPeca += valor;
  }

  if (origem === "venda") {
    mapa[tipo].totalCustosVenda += valor;
  }

  mapa[tipo].totalGeral += valor;
}

function agruparCustosPorTipo(custosPeca, custosVenda) {
  const mapa = {};

  custosPeca.forEach(custo => adicionarCustoNoGrupo(mapa, custo, "peca"));
  custosVenda.forEach(custo => adicionarCustoNoGrupo(mapa, custo, "venda"));

  const totalCustos = Object.values(mapa).reduce((total, grupo) => total + grupo.totalGeral, 0);

  return Object.values(mapa)
    .map(grupo => ({
      ...grupo,
      percentual: totalCustos > 0 ? (grupo.totalGeral / totalCustos) * 100 : 0
    }))
    .sort((a, b) => {
      if (b.totalGeral !== a.totalGeral) {
        return b.totalGeral - a.totalGeral;
      }

      return a.tipo.localeCompare(b.tipo, "pt-BR");
    });
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemAnaliseCustos.textContent = "Configure o Supabase para carregar a analise de custos.";
    return null;
  }

  try {
    const [custosPeca, custosVenda] = await Promise.all([
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda()
    ]);

    mensagemAnaliseCustos.textContent = "";

    return {
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || []
    };
  } catch (erro) {
    console.error("Erro ao carregar analise de custos:", erro);
    mensagemAnaliseCustos.textContent = "Nao foi possivel carregar os dados da analise de custos.";
    return null;
  }
}

function renderizarResumo(dados, grupos) {
  const totalCustosPeca = somar(dados.custosPeca, "valor");
  const totalCustosVenda = somar(dados.custosVenda, "valor");
  const totalGeral = totalCustosPeca + totalCustosVenda;

  resumoAnaliseCustos.innerHTML =
    criarCard("Custos de peca", formatarMoeda(totalCustosPeca)) +
    criarCard("Custos de venda", formatarMoeda(totalCustosVenda)) +
    criarCard("Total geral", formatarMoeda(totalGeral)) +
    criarCard("Tipos de custo", grupos.length);
}

function renderizarTabela(grupos) {
  tabelaAnaliseCustos.innerHTML = "";

  if (grupos.length === 0) {
    mensagemAnaliseCustos.textContent = "Nenhum custo cadastrado para analise.";
    return;
  }

  mensagemAnaliseCustos.textContent = "";

  grupos.forEach(grupo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Tipo do custo"><strong class="product-name">${grupo.tipo}</strong></td>
      <td data-label="Total em custos de peca">${formatarMoeda(grupo.totalCustosPeca)}</td>
      <td data-label="Total em custos de venda">${formatarMoeda(grupo.totalCustosVenda)}</td>
      <td data-label="Total geral"><strong>${formatarMoeda(grupo.totalGeral)}</strong></td>
      <td data-label="% sobre total de custos">${formatarPercentual(grupo.percentual)}</td>
    `;

    tabelaAnaliseCustos.appendChild(linha);
  });
}

async function iniciarAnaliseCustos() {
  const dados = await carregarDados();

  if (!dados) {
    resumoAnaliseCustos.innerHTML = "";
    tabelaAnaliseCustos.innerHTML = "";
    return;
  }

  const grupos = agruparCustosPorTipo(dados.custosPeca, dados.custosVenda);

  renderizarResumo(dados, grupos);
  renderizarTabela(grupos);
}

document.addEventListener("DOMContentLoaded", iniciarAnaliseCustos);
