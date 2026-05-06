const mensagemPainelGeral = document.getElementById("mensagemPainelGeral");
const cardsPainelGeral = document.getElementById("cardsPainelGeral");
const alertasPainelGeral = document.getElementById("alertasPainelGeral");
const tabelaResultadoOrigens = document.getElementById("tabelaResultadoOrigens");
const tabelaUltimasVendas = document.getElementById("tabelaUltimasVendas");
const mensagemUltimasVendas = document.getElementById("mensagemUltimasVendas");

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

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
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

function agruparConsumosPorVenda(consumosEstoque) {
  return consumosEstoque.reduce((mapa, consumo) => {
    const vendaId = Number(consumo.vendaId || 0);

    if (!mapa[vendaId]) {
      mapa[vendaId] = [];
    }

    mapa[vendaId].push(consumo);
    return mapa;
  }, {});
}

function calcularResultadoOrigem(origem, dados) {
  const resultado = window.financeiroUtils.calcularResultadoOrigem(
    origem,
    dados.entradasEstoque,
    dados.vendas,
    dados.consumosEstoque,
    dados.custosPeca,
    dados.custosVenda
  );
  const investimento = Number(origem.valorPago || origem.valor_pago || origem.custoTotal || origem.custo_total || 0);
  const totalCustos = resultado.custoConsumido + resultado.custosPeca + resultado.custosVenda;
  const status = resultado.lucro > 0
    ? "lucro"
    : resultado.receita < investimento
      ? "ainda recuperando investimento"
      : "prejuizo";

  return {
    origem,
    investimento,
    totalVendido: resultado.receita,
    totalCustos,
    custoVendido: resultado.custoConsumido,
    lucro: resultado.lucro,
    status
  };
}

async function carregarDadosPainel() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemPainelGeral.textContent = "Configure o Supabase para carregar o painel geral do negocio.";
    return null;
  }

  try {
    const [origens, pecas, vendas, custosPeca, custosVenda, consumosEstoque, entradasEstoque] = await Promise.all([
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    mensagemPainelGeral.textContent = "";

    return {
      origens: origens || [],
      pecas: pecas || [],
      vendas: vendas || [],
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || [],
      consumosEstoque: consumosEstoque || [],
      entradasEstoque: entradasEstoque || []
    };
  } catch (erro) {
    console.error("Erro ao carregar painel geral:", erro);
    mensagemPainelGeral.textContent = "Nao foi possivel carregar os dados do Supabase.";
    return null;
  }
}

function calcularQuantidadeDisponivelPeca(peca) {
  return Math.max(Number(peca.quantidade || 0) - Number(peca.quantidadeVendida || peca.quantidade_vendida || 0), 0);
}

function calcularSaldoEntrada(entrada) {
  return Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
}

function calcularAlertasPainel(dados) {
  const idsPecasComEntrada = new Set(dados.entradasEstoque.map(entrada => Number(entrada.pecaId || 0)));
  const consumosPorVenda = agruparConsumosPorVenda(dados.consumosEstoque);

  return {
    produtosSemEstoque: dados.pecas.filter(peca => calcularQuantidadeDisponivelPeca(peca) <= 0).length,
    produtosComEstoqueBaixo: dados.pecas.filter(peca => {
      const disponivel = calcularQuantidadeDisponivelPeca(peca);
      return disponivel > 0 && disponivel <= 2;
    }).length,
    produtosSemEntradaFifo: dados.pecas.filter(peca => !idsPecasComEntrada.has(Number(peca.id))).length,
    lotesEsgotados: dados.entradasEstoque.filter(entrada => Number(entrada.quantidadeConsumida || 0) >= Number(entrada.quantidadeTotal || 0)).length,
    lotesComEstoqueBaixo: dados.entradasEstoque.filter(entrada => {
      const saldo = calcularSaldoEntrada(entrada);
      return saldo > 0 && saldo <= 2;
    }).length,
    vendasSemConsumoFifo: dados.vendas.filter(venda => !(consumosPorVenda[Number(venda.id)] || []).length).length
  };
}

function criarItemAlerta(tipo, titulo, valor, descricao) {
  return `
    <article class="alert-card alert-card--${tipo}">
      <span>${titulo}</span>
      <strong>${valor}</strong>
      <small>${descricao}</small>
    </article>
  `;
}

function renderizarAlertasPainel(dados) {
  if (!alertasPainelGeral) {
    return;
  }

  const alertas = calcularAlertasPainel(dados);
  const totalAlertas =
    alertas.produtosSemEstoque +
    alertas.produtosComEstoqueBaixo +
    alertas.produtosSemEntradaFifo +
    alertas.lotesEsgotados +
    alertas.lotesComEstoqueBaixo +
    alertas.vendasSemConsumoFifo;

  if (totalAlertas === 0) {
    alertasPainelGeral.innerHTML = `
      <div class="alert-panel">
        <div class="alert-panel__header">
          <h3>Alertas inteligentes</h3>
          <span class="alert-pill alert-pill--ok">Tudo certo</span>
        </div>
        <p>Nenhum problema importante encontrado no estoque.</p>
      </div>
    `;
    return;
  }

  alertasPainelGeral.innerHTML = `
    <div class="alert-panel">
      <div class="alert-panel__header">
        <h3>Alertas inteligentes</h3>
        <span class="alert-pill alert-pill--warning">${totalAlertas} alerta(s)</span>
      </div>
      <div class="alert-grid">
        ${criarItemAlerta("danger", "Produtos sem estoque", alertas.produtosSemEstoque, "Quantidade disponivel igual a zero.")}
        ${criarItemAlerta("warning", "Estoque baixo", alertas.produtosComEstoqueBaixo, "Produtos com saldo entre 1 e 2.")}
        ${criarItemAlerta("info", "Produtos sem entrada", alertas.produtosSemEntradaFifo, "Pecas sem entrada de estoque cadastrada.")}
        ${criarItemAlerta("danger", "Lotes esgotados", alertas.lotesEsgotados, "Entradas totalmente consumidas.")}
        ${criarItemAlerta("warning", "Lotes baixos", alertas.lotesComEstoqueBaixo, "Lotes com saldo entre 1 e 2.")}
        ${criarItemAlerta("warning", "Vendas sem custo calculado", alertas.vendasSemConsumoFifo, "Vendas sem custo de estoque registrado.")}
      </div>
    </div>
  `;
}

function renderizarCards(dados) {
  const pecasEmEstoque = dados.pecas.reduce((total, peca) => {
    return total + Math.max(Number(peca.quantidade || 0) - Number(peca.quantidadeVendida || 0), 0);
  }, 0);
  const pecasVendidas = dados.pecas.reduce((total, peca) => {
    return total + Number(peca.quantidadeVendida || 0);
  }, 0);
  const vendasRegistradas = dados.vendas.length;
  const lotesAtivos = dados.entradasEstoque.filter(entrada => calcularSaldoEntrada(entrada) > 0).length;

  cardsPainelGeral.innerHTML =
    criarCard("Origens cadastradas", dados.origens.length) +
    criarCard("Pecas em estoque", pecasEmEstoque) +
    criarCard("Pecas vendidas", pecasVendidas) +
    criarCard("Vendas registradas", vendasRegistradas) +
    criarCard("Lotes ativos", lotesAtivos);
}

function obterUltimasVendas(vendas, limite = 20) {
  return [...vendas]
    .sort((a, b) => {
      const dataA = new Date(obterDataVenda(a) || 0).getTime();
      const dataB = new Date(obterDataVenda(b) || 0).getTime();

      if (dataA !== dataB) {
        return dataB - dataA;
      }

      return Number(b.id || 0) - Number(a.id || 0);
    })
    .slice(0, limite);
}

function renderizarUltimasVendas(vendas) {
  if (!tabelaUltimasVendas) {
    return;
  }

  const ultimasVendas = obterUltimasVendas(vendas);
  tabelaUltimasVendas.innerHTML = "";

  if (ultimasVendas.length === 0) {
    if (mensagemUltimasVendas) {
      mensagemUltimasVendas.textContent = "Nenhuma venda registrada.";
    }
    return;
  }

  if (mensagemUltimasVendas) {
    mensagemUltimasVendas.textContent = "";
  }

  ultimasVendas.forEach(venda => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
      <td data-label="SKU">${venda.sku || "-"}</td>
      <td data-label="Nome da peca"><strong class="product-name">${venda.produtoNome || `Peca ${venda.pecaId || ""}`.trim()}</strong></td>
      <td data-label="Quantidade">${venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0}</td>
    `;

    tabelaUltimasVendas.appendChild(linha);
  });
}

function renderizarTabelaOrigens(resultadosOrigens) {
  if (!tabelaResultadoOrigens) {
    return;
  }

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
      <td data-label="Resultado"><strong class="${classeLucro}">${formatarMoeda(resultado.lucro)}</strong></td>
      <td data-label="Status">${resultado.status}</td>
    `;

    tabelaResultadoOrigens.appendChild(linha);
  });
}

async function iniciarPainelGeral() {
  const dados = await carregarDadosPainel();

  if (!dados) {
    cardsPainelGeral.innerHTML = "";
    if (alertasPainelGeral) {
      alertasPainelGeral.innerHTML = "";
    }
    if (tabelaUltimasVendas) {
      tabelaUltimasVendas.innerHTML = "";
    }
    if (tabelaResultadoOrigens) {
      tabelaResultadoOrigens.innerHTML = "";
    }
    return;
  }

  renderizarCards(dados);
  renderizarAlertasPainel(dados);
  renderizarUltimasVendas(dados.vendas);
}

document.addEventListener("DOMContentLoaded", iniciarPainelGeral);
