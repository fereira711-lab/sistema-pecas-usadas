const mensagemAnaliseProduto = document.getElementById("mensagemAnaliseProduto");
const resumoAnaliseProduto = document.getElementById("resumoAnaliseProduto");
const tabelaAnaliseProduto = document.getElementById("tabelaAnaliseProduto");
const buscaAnaliseProduto = document.getElementById("buscaAnaliseProduto");
const mensagemRankingProduto = document.getElementById("mensagemRankingProduto");
const tabelaRankingProduto = document.getElementById("tabelaRankingProduto");

let analisesCarregadas = [];

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function formatarNome(peca) {
  return peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
}

function calcularValorVenda(venda) {
  const quantidadeVendida = Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
  const valorUnitario = Number(venda.valorUnitario || venda.valor_unitario || venda.precoUnitario || 0);

  return quantidadeVendida * valorUnitario;
}

function somar(lista, campo = "valor") {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
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

function formatarValorOuNaoCalculado(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "Custo nao calculado";
  }

  return formatarMoeda(Number(valor || 0));
}

function calcularAnalises(dados) {
  const vendasPorPeca = agruparPorId(dados.vendas, "pecaId");
  const custosPecaPorPeca = agruparPorId(dados.custosPeca, "pecaId");
  const custosVendaPorVenda = agruparPorId(dados.custosVenda, "vendaId");
  const consumosPorVenda = agruparPorId(dados.consumosEstoque, "vendaId");

  return dados.pecas.map(peca => {
    const pecaId = Number(peca.id);
    const vendasDaPeca = vendasPorPeca[pecaId] || [];
    const idsVendas = vendasDaPeca.map(venda => Number(venda.id));
    const receita = vendasDaPeca.reduce((total, venda) => total + calcularValorVenda(venda), 0);
    const vendasSemCusto = idsVendas.filter(vendaId => (consumosPorVenda[vendaId] || []).length === 0).length;
    const custoEstoque = idsVendas.reduce((total, vendaId) => total + somar(consumosPorVenda[vendaId] || [], "custoTotal"), 0);
    const custosPeca = somar(custosPecaPorPeca[pecaId] || []);
    const custosVenda = idsVendas.reduce((total, vendaId) => total + somar(custosVendaPorVenda[vendaId] || []), 0);
    const custosAdicionais = custosPeca + custosVenda;
    const custoCalculado = vendasDaPeca.length === 0 || vendasSemCusto === 0;
    const lucro = custoCalculado ? receita - custoEstoque - custosAdicionais : null;
    const quantidadeVendida = vendasDaPeca.reduce((total, venda) => {
      return total + Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
    }, 0);

    return {
      peca,
      sku: formatarSku(peca),
      nome: formatarNome(peca),
      receita,
      custoEstoque: custoCalculado ? custoEstoque : null,
      custosAdicionais,
      custoTotal: custoCalculado ? custoEstoque + custosAdicionais : null,
      lucro,
      quantidadeVendida,
      custoCalculado,
      vendasSemCusto
    };
  });
}

function filtrarAnalises(analises) {
  const termo = String(buscaAnaliseProduto?.value || "").trim().toLowerCase();

  if (!termo) {
    return analises;
  }

  return analises.filter(analise => {
    return analise.sku.toLowerCase().includes(termo) || analise.nome.toLowerCase().includes(termo);
  });
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemAnaliseProduto.textContent = "Configure o Supabase para carregar a analise por produto.";
    return null;
  }

  try {
    const [pecas, vendas, consumosEstoque, custosPeca, custosVenda] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda()
    ]);

    mensagemAnaliseProduto.textContent = "";

    return {
      pecas: pecas || [],
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || []
    };
  } catch (erro) {
    console.error("Erro ao carregar analise por produto:", erro);
    mensagemAnaliseProduto.textContent = "Nao foi possivel carregar os dados da analise por produto.";
    return null;
  }
}

function renderizarResumo(analises) {
  const totalReceita = somar(analises, "receita");
  const produtosComCustoPendente = analises.filter(analise => !analise.custoCalculado).length;
  const totalCusto = produtosComCustoPendente > 0 ? null : somar(analises, "custoTotal");
  const totalLucro = produtosComCustoPendente > 0 ? null : somar(analises, "lucro");
  const totalVendido = somar(analises, "quantidadeVendida");
  const classeLucro = totalLucro !== null && totalLucro >= 0 ? "summary-card--profit" : "summary-card--loss";

  resumoAnaliseProduto.innerHTML =
    criarCard("Receita total", formatarMoeda(totalReceita)) +
    criarCard("Custo total", formatarValorOuNaoCalculado(totalCusto)) +
    criarCard("Lucro total", totalLucro === null ? "Custo nao calculado" : `<span class="${obterClasseLucro(totalLucro)}">${formatarMoeda(totalLucro)}</span>`, classeLucro) +
    criarCard("Pecas vendidas", totalVendido) +
    criarCard("Produtos com custo pendente", produtosComCustoPendente);
}

function renderizarTabela(analises) {
  tabelaAnaliseProduto.innerHTML = "";

  if (analises.length === 0) {
    mensagemAnaliseProduto.textContent = buscaAnaliseProduto?.value
      ? "Nenhuma peca encontrada para a busca."
      : "Nenhuma peca cadastrada para analise.";
    return;
  }

  mensagemAnaliseProduto.textContent = "";

  analises.forEach(analise => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="SKU">${analise.sku}</td>
      <td data-label="Nome"><strong class="product-name">${analise.nome}</strong></td>
      <td data-label="Receita">${formatarMoeda(analise.receita)}</td>
      <td data-label="Custo">${formatarValorOuNaoCalculado(analise.custoEstoque)}</td>
      <td data-label="Custos adicionais">${formatarMoeda(analise.custosAdicionais)}</td>
      <td data-label="Lucro">${analise.lucro === null ? "<strong>Custo nao calculado</strong>" : `<strong class="${obterClasseLucro(analise.lucro)}">${formatarMoeda(analise.lucro)}</strong>`}</td>
      <td data-label="Qtd. vendida">${analise.quantidadeVendida}</td>
    `;

    tabelaAnaliseProduto.appendChild(linha);
  });
}

function obterRankingMaisVendidos(analises, limite = 10) {
  return [...analises]
    .filter(analise => Number(analise.quantidadeVendida || 0) > 0)
    .sort((a, b) => {
      if (b.quantidadeVendida !== a.quantidadeVendida) {
        return b.quantidadeVendida - a.quantidadeVendida;
      }

      return b.receita - a.receita;
    })
    .slice(0, limite);
}

function renderizarRanking(analises) {
  if (!tabelaRankingProduto) {
    return;
  }

  const ranking = obterRankingMaisVendidos(analises);
  tabelaRankingProduto.innerHTML = "";

  if (ranking.length === 0) {
    if (mensagemRankingProduto) {
      mensagemRankingProduto.textContent = "Nenhuma venda encontrada para montar o ranking.";
    }
    return;
  }

  if (mensagemRankingProduto) {
    mensagemRankingProduto.textContent = "";
  }

  ranking.forEach((analise, indice) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Posicao">${indice + 1}</td>
      <td data-label="SKU">${analise.sku}</td>
      <td data-label="Nome"><strong class="product-name">${analise.nome}</strong></td>
      <td data-label="Qtd. vendida">${analise.quantidadeVendida}</td>
      <td data-label="Receita total">${formatarMoeda(analise.receita)}</td>
      <td data-label="Lucro">${analise.lucro === null ? "<strong>Custo nao calculado</strong>" : `<strong class="${obterClasseLucro(analise.lucro)}">${formatarMoeda(analise.lucro)}</strong>`}</td>
    `;

    tabelaRankingProduto.appendChild(linha);
  });
}

function renderizarAnalises() {
  const analisesFiltradas = filtrarAnalises(analisesCarregadas);

  renderizarResumo(analisesFiltradas);
  renderizarRanking(analisesCarregadas);
  renderizarTabela(analisesFiltradas);
}

async function iniciarAnaliseProduto() {
  const dados = await carregarDados();

  if (!dados) {
    resumoAnaliseProduto.innerHTML = "";
    if (tabelaRankingProduto) {
      tabelaRankingProduto.innerHTML = "";
    }
    tabelaAnaliseProduto.innerHTML = "";
    return;
  }

  analisesCarregadas = calcularAnalises(dados);
  renderizarAnalises();
}

buscaAnaliseProduto?.addEventListener("input", renderizarAnalises);

document.addEventListener("DOMContentLoaded", iniciarAnaliseProduto);
