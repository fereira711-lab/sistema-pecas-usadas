const mensagemPainelGeral = document.getElementById("mensagemPainelGeral");
const cardsPainelGeral = document.getElementById("cardsPainelGeral");
const tabelaResultadoOrigens = document.getElementById("tabelaResultadoOrigens");

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function somar(lista, campo = "valor") {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function calcularValorVenda(venda) {
  const quantidadeVendida = Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0);
  const valorUnitario = Number(venda.valorUnitario || venda.precoUnitario || 0);

  if (valorUnitario > 0) {
    return quantidadeVendida * valorUnitario;
  }

  return Number(venda.valorTotal || 0);
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

function obterClasseLucro(lucro) {
  if (lucro > 0) {
    return "profit-value profit-value--positive";
  }

  if (lucro < 0) {
    return "profit-value profit-value--negative";
  }

  return "profit-value profit-value--neutral";
}

function filtrarPorPeca(lista, idsPecas) {
  return lista.filter(item => idsPecas.includes(Number(item.pecaId || 0)));
}

function filtrarCustosVendaPorVendas(custosVenda, vendas) {
  const idsVendas = vendas.map(venda => Number(venda.id));

  return custosVenda.filter(custo => idsVendas.includes(Number(custo.vendaId || 0)));
}

function normalizarSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function calcularResultadoOrigem(origem, origens, pecas, vendas, custosPeca, custosVenda) {
  const skuOrigem = normalizarSku(origem.produtoSku || origem.produto_sku);
  const pecasDaOrigem = skuOrigem
    ? pecas.filter(peca => normalizarSku(peca.sku) === skuOrigem)
    : pecas.filter(peca => Number(peca.origemId || 0) === Number(origem.id));
  const origensDoMesmoSku = skuOrigem
    ? origens.filter(item => normalizarSku(item.produtoSku || item.produto_sku) === skuOrigem)
    : [origem];
  const idsPecas = pecasDaOrigem.map(peca => Number(peca.id));
  const vendasDaOrigem = filtrarPorPeca(vendas, idsPecas);
  const custosPecaDaOrigem = filtrarPorPeca(custosPeca, idsPecas);
  const custosVendaDaOrigem = filtrarCustosVendaPorVendas(custosVenda, vendasDaOrigem);
  const investimento = somar(origensDoMesmoSku, "valorPago");
  const totalVendido = vendasDaOrigem.reduce((total, venda) => total + calcularValorVenda(venda), 0);
  const totalCustosPeca = somar(custosPecaDaOrigem);
  const totalCustosVenda = somar(custosVendaDaOrigem);
  const totalCustos = investimento + totalCustosPeca + totalCustosVenda;
  const lucro = totalVendido - totalCustos;

  return {
    origem,
    investimento,
    totalVendido,
    totalCustos,
    lucro,
    status: lucro > 0 ? "Deu lucro" : "Ainda nao pagou"
  };
}

async function carregarDadosPainel() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemPainelGeral.textContent = "Configure o Supabase para carregar o painel geral do negocio.";
    return null;
  }

  try {
    const [origens, pecas, vendas, custosPeca, custosVenda] = await Promise.all([
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda()
    ]);

    mensagemPainelGeral.textContent = "";

    return { origens, pecas, vendas, custosPeca, custosVenda };
  } catch (erro) {
    console.error("Erro ao carregar painel geral:", erro);
    mensagemPainelGeral.textContent = "Nao foi possivel carregar os dados do Supabase.";
    return null;
  }
}

function renderizarCards(dados, resultadosOrigens) {
  const totalInvestido = somar(dados.origens, "valorPago");
  const totalVendido = dados.vendas.reduce((total, venda) => total + calcularValorVenda(venda), 0);
  const totalCustosPeca = somar(dados.custosPeca);
  const totalCustosVenda = somar(dados.custosVenda);
  const lucroGeral = totalVendido - totalInvestido - totalCustosPeca - totalCustosVenda;
  const pecasEmEstoque = dados.pecas.reduce((total, peca) => {
    return total + Math.max(Number(peca.quantidade || 0) - Number(peca.quantidadeVendida || 0), 0);
  }, 0);
  const pecasVendidas = dados.pecas.reduce((total, peca) => {
    return total + Number(peca.quantidadeVendida || 0);
  }, 0);
  const origensNoLucro = resultadosOrigens.filter(resultado => resultado.lucro > 0).length;
  const origensNoPrejuizo = resultadosOrigens.filter(resultado => resultado.lucro < 0).length;
  const classeLucroCard = lucroGeral >= 0 ? "summary-card--profit" : "summary-card--loss";
  const classeLucroTexto = obterClasseLucro(lucroGeral);

  cardsPainelGeral.innerHTML =
    criarCard("Total investido", formatarMoeda(totalInvestido)) +
    criarCard("Total vendido", formatarMoeda(totalVendido)) +
    criarCard("Lucro geral", `<span class="${classeLucroTexto}">${formatarMoeda(lucroGeral)}</span>`, classeLucroCard) +
    criarCard("Pecas em estoque", pecasEmEstoque) +
    criarCard("Pecas vendidas", pecasVendidas) +
    criarCard("Origens no lucro", origensNoLucro, "summary-card--profit") +
    criarCard("Origens no prejuizo", origensNoPrejuizo, "summary-card--loss");
}

function renderizarTabelaOrigens(resultadosOrigens) {
  tabelaResultadoOrigens.innerHTML = "";

  if (resultadosOrigens.length === 0) {
    tabelaResultadoOrigens.innerHTML = `
      <tr>
        <td colspan="6">Nenhuma origem cadastrada.</td>
      </tr>
    `;
    return;
  }

  resultadosOrigens.forEach(resultado => {
    const linha = document.createElement("tr");
    const classeLucro = obterClasseLucro(resultado.lucro);

    linha.innerHTML = `
      <td data-label="Origem">${resultado.origem.descricao || `Origem ${resultado.origem.id}`}</td>
      <td data-label="Investimento">${formatarMoeda(resultado.investimento)}</td>
      <td data-label="Total vendido">${formatarMoeda(resultado.totalVendido)}</td>
      <td data-label="Custos">${formatarMoeda(resultado.totalCustos)}</td>
      <td data-label="Lucro"><strong class="${classeLucro}">${formatarMoeda(resultado.lucro)}</strong></td>
      <td data-label="Status">${resultado.status}</td>
    `;

    tabelaResultadoOrigens.appendChild(linha);
  });
}

async function iniciarPainelGeral() {
  const dados = await carregarDadosPainel();

  if (!dados) {
    cardsPainelGeral.innerHTML = "";
    tabelaResultadoOrigens.innerHTML = "";
    return;
  }

  const resultadosOrigens = dados.origens.map(origem => {
    return calcularResultadoOrigem(origem, dados.origens, dados.pecas, dados.vendas, dados.custosPeca, dados.custosVenda);
  });

  renderizarCards(dados, resultadosOrigens);
  renderizarTabelaOrigens(resultadosOrigens);
}

document.addEventListener("DOMContentLoaded", iniciarPainelGeral);
