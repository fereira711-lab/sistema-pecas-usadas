const mensagemAnaliseProduto = document.getElementById("mensagemAnaliseProduto");
const resumoAnaliseProduto = document.getElementById("resumoAnaliseProduto");
const tabelaAnaliseProduto = document.getElementById("tabelaAnaliseProduto");
const buscaAnaliseProduto = document.getElementById("buscaAnaliseProduto");
const mensagemRankingProduto = document.getElementById("mensagemRankingProduto");
const tabelaRankingProduto = document.getElementById("tabelaRankingProduto");
const analiseProdutoShell = document.getElementById("analiseProdutoShell");
const botaoAbrirFiltrosAnaliseProduto = document.getElementById("botaoAbrirFiltrosAnaliseProduto");
const botaoFecharFiltrosAnaliseProduto = document.getElementById("botaoFecharFiltrosAnaliseProduto");
const botaoLimparFiltrosAnaliseProduto = document.getElementById("botaoLimparFiltrosAnaliseProduto");
const botaoAplicarFiltrosAnaliseProduto = document.getElementById("botaoAplicarFiltrosAnaliseProduto");
const filtroCustoAnaliseProduto = document.getElementById("filtroCustoAnaliseProduto");
const filtroResultadoAnaliseProduto = document.getElementById("filtroResultadoAnaliseProduto");
const ordenacaoAnaliseProduto = document.getElementById("ordenacaoAnaliseProduto");

let dadosAnaliseProduto = {
  pecas: [],
  vendas: [],
  consumosEstoque: [],
  custosPeca: [],
  custosVenda: [],
  entradasEstoque: []
};
let analisesCarregadas = [];
let produtoExpandidoId = null;
let filtrosPorProduto = {};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR");
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

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function formatarNome(peca) {
  return peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peça ${peca.id}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
}

function obterDataCusto(custo) {
  return String(custo.dataCusto || custo.data || custo.data_custo || "").slice(0, 10);
}

function calcularValorVenda(venda) {
  return window.financeiroUtils.calcularReceitaVenda(venda);
}

function obterQuantidadeVendida(venda) {
  return Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
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
    return "Custo não calculado";
  }

  return formatarMoeda(Number(valor || 0));
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

function obterPeriodoPadrao() {
  return {
    periodo: "todos",
    dataInicial: "",
    dataFinal: ""
  };
}

function obterFiltroProduto(pecaId) {
  if (!filtrosPorProduto[pecaId]) {
    filtrosPorProduto[pecaId] = obterPeriodoPadrao();
  }

  return filtrosPorProduto[pecaId];
}

function atualizarDatasDoPeriodo(filtro) {
  const hoje = new Date();
  const fim = formatarDataInput(hoje);
  let inicio = "";

  if (filtro.periodo === "hoje") {
    inicio = fim;
  }

  if (filtro.periodo === "7") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 6);
    inicio = formatarDataInput(data);
  }

  if (filtro.periodo === "30") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 29);
    inicio = formatarDataInput(data);
  }

  if (filtro.periodo === "personalizado") {
    return filtro;
  }

  if (filtro.periodo === "todos") {
    filtro.dataInicial = "";
    filtro.dataFinal = "";
    return filtro;
  }

  filtro.dataInicial = inicio;
  filtro.dataFinal = fim;
  return filtro;
}

function itemDentroDoPeriodo(data, filtro) {
  const dataIso = String(data || "").slice(0, 10);

  if (!dataIso) {
    return filtro.periodo === "todos";
  }

  if (filtro.dataInicial && dataIso < filtro.dataInicial) {
    return false;
  }

  if (filtro.dataFinal && dataIso > filtro.dataFinal) {
    return false;
  }

  return true;
}

function obterQuantidadeTotal(peca, entradasDaPeca) {
  const totalEntradas = somar(entradasDaPeca, "quantidadeTotal");
  return totalEntradas > 0 ? totalEntradas : Number(peca.quantidade || 0);
}

function obterQuantidadeVendidaProduto(peca, entradasDaPeca, vendasDaPeca) {
  const totalConsumidoEntradas = somar(entradasDaPeca, "quantidadeConsumida");

  if (totalConsumidoEntradas > 0) {
    return totalConsumidoEntradas;
  }

  const totalVendas = vendasDaPeca.reduce((total, venda) => total + obterQuantidadeVendida(venda), 0);
  return totalVendas || Number(peca.quantidadeVendida || 0);
}

function calcularAnaliseProduto(peca, agrupamentos) {
  const pecaId = Number(peca.id);
  const vendasDaPeca = agrupamentos.vendasPorPeca[pecaId] || [];
  const entradasDaPeca = agrupamentos.entradasPorPeca[pecaId] || [];
  const resultado = window.financeiroUtils.calcularLucroPeca(
    peca,
    agrupamentos.vendas,
    agrupamentos.consumos,
    agrupamentos.custosPeca,
    agrupamentos.custosVenda
  );
  const quantidadeTotal = obterQuantidadeTotal(peca, entradasDaPeca);
  const quantidadeVendida = obterQuantidadeVendidaProduto(peca, entradasDaPeca, vendasDaPeca);
  const estoqueAtual = Math.max(quantidadeTotal - quantidadeVendida, 0);

  return {
    peca,
    pecaId,
    sku: formatarSku(peca),
    nome: formatarNome(peca),
    receita: resultado.receita,
    custoEstoque: resultado.calculado ? resultado.custoConsumido : null,
    custosPeca: resultado.custosPeca,
    custosVenda: resultado.custosVenda,
    custoTotal: resultado.calculado ? resultado.custoConsumido + resultado.custosPeca + resultado.custosVenda : null,
    lucro: resultado.lucro,
    margem: resultado.margem,
    quantidadeTotal,
    quantidadeVendida,
    estoqueAtual,
    custoCalculado: resultado.calculado,
    vendasSemCusto: resultado.vendasSemCusto
  };
}

function calcularAnalises(dados) {
  const agrupamentos = {
    vendas: dados.vendas,
    consumos: dados.consumosEstoque,
    custosPeca: dados.custosPeca,
    custosVenda: dados.custosVenda,
    vendasPorPeca: agruparPorId(dados.vendas, "pecaId"),
    custosPecaPorPeca: agruparPorId(dados.custosPeca, "pecaId"),
    custosVendaPorVenda: agruparPorId(dados.custosVenda, "vendaId"),
    consumosPorVenda: agruparPorId(dados.consumosEstoque, "vendaId"),
    entradasPorPeca: agruparPorId(dados.entradasEstoque, "pecaId")
  };

  return dados.pecas.map(peca => calcularAnaliseProduto(peca, agrupamentos));
}

function filtrarAnalises(analises) {
  const termo = String(buscaAnaliseProduto?.value || "").trim().toLowerCase();
  const filtroCusto = filtroCustoAnaliseProduto?.value || "";
  const filtroResultado = filtroResultadoAnaliseProduto?.value || "";
  const ordenacao = ordenacaoAnaliseProduto?.value || "receita";

  return [...analises]
    .filter(analise => {
      if (!termo) {
        return true;
      }

      return analise.sku.toLowerCase().includes(termo) || analise.nome.toLowerCase().includes(termo);
    })
    .filter(analise => {
      if (filtroCusto === "calculado") {
        return analise.custoCalculado;
      }

      if (filtroCusto === "pendente") {
        return !analise.custoCalculado;
      }

      return true;
    })
    .filter(analise => {
      if (filtroResultado === "lucro") {
        return analise.lucro !== null && Number(analise.lucro) > 0;
      }

      if (filtroResultado === "prejuizo") {
        return analise.lucro !== null && Number(analise.lucro) < 0;
      }

      if (filtroResultado === "zero") {
        return analise.lucro !== null && Number(analise.lucro) === 0;
      }

      return true;
    })
    .sort((a, b) => {
      if (ordenacao === "nome") {
        return a.nome.localeCompare(b.nome, "pt-BR");
      }

      if (ordenacao === "lucro") {
        return Number(b.lucro ?? Number.NEGATIVE_INFINITY) - Number(a.lucro ?? Number.NEGATIVE_INFINITY);
      }

      if (ordenacao === "margem") {
        return Number(b.margem ?? Number.NEGATIVE_INFINITY) - Number(a.margem ?? Number.NEGATIVE_INFINITY);
      }

      if (ordenacao === "quantidade") {
        return Number(b.quantidadeVendida || 0) - Number(a.quantidadeVendida || 0);
      }

      return Number(b.receita || 0) - Number(a.receita || 0);
    });
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemAnaliseProduto.textContent = "Configure o Supabase para carregar a análise por produto.";
    return null;
  }

  try {
    const [pecas, vendas, consumosEstoque, custosPeca, custosVenda, entradasEstoque] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    mensagemAnaliseProduto.textContent = "";

    return {
      pecas: pecas || [],
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || [],
      entradasEstoque: entradasEstoque || []
    };
  } catch (erro) {
    console.error("Erro ao carregar análise por produto:", erro);
    mensagemAnaliseProduto.textContent = "Não foi possível carregar os dados da análise por produto.";
    return null;
  }
}

function renderizarResumo(analises) {
  const totalReceita = somar(analises, "receita");
  const produtosComCustoPendente = analises.filter(analise => !analise.custoCalculado).length;
  const totalCustoFifo = produtosComCustoPendente > 0 ? null : somar(analises, "custoEstoque");
  const totalCustosPeca = somar(analises, "custosPeca");
  const totalCustosVenda = somar(analises, "custosVenda");
  const totalLucro = produtosComCustoPendente > 0 ? null : somar(analises, "lucro");
  const totalVendido = somar(analises, "quantidadeVendida");
  const classeLucro = totalLucro !== null && totalLucro >= 0 ? "summary-card--profit" : "summary-card--loss";

  resumoAnaliseProduto.innerHTML =
    criarCard("Receita total", formatarMoeda(totalReceita)) +
    criarCard("Custo consumido FIFO", formatarValorOuNaoCalculado(totalCustoFifo)) +
    criarCard("Custos da peça", formatarMoeda(totalCustosPeca)) +
    criarCard("Custos da venda", formatarMoeda(totalCustosVenda)) +
    criarCard("Lucro total", totalLucro === null ? "Custo não calculado" : `<span class="${obterClasseLucro(totalLucro)}">${formatarMoeda(totalLucro)}</span>`, classeLucro) +
    criarCard("Peças vendidas", formatarNumero(totalVendido)) +
    criarCard("Produtos com custo pendente", produtosComCustoPendente);
}

function obterDadosProduto(pecaId, filtro) {
  const analise = analisesCarregadas.find(item => Number(item.pecaId) === Number(pecaId));
  const vendasProduto = dadosAnaliseProduto.vendas
    .filter(venda => Number(venda.pecaId) === Number(pecaId))
    .filter(venda => itemDentroDoPeriodo(obterDataVenda(venda), filtro))
    .sort((a, b) => obterDataVenda(b).localeCompare(obterDataVenda(a)));
  const idsVendas = new Set(vendasProduto.map(venda => Number(venda.id)));
  const custosPeca = dadosAnaliseProduto.custosPeca
    .filter(custo => Number(custo.pecaId) === Number(pecaId))
    .filter(custo => itemDentroDoPeriodo(obterDataCusto(custo), filtro));
  const custosVenda = dadosAnaliseProduto.custosVenda.filter(custo => idsVendas.has(Number(custo.vendaId)));
  const consumosEstoque = dadosAnaliseProduto.consumosEstoque.filter(consumo => idsVendas.has(Number(consumo.vendaId)));
  const entradasPorId = dadosAnaliseProduto.entradasEstoque.reduce((mapa, entrada) => {
    mapa[Number(entrada.id)] = entrada;
    return mapa;
  }, {});

  return {
    analise,
    vendasProduto,
    custosPeca,
    custosVenda,
    consumosEstoque,
    entradasPorId
  };
}

function calcularResumoDetalhado(dados) {
  const consumosPorVenda = agruparPorId(dados.consumosEstoque, "vendaId");
  const custosVendaPorVenda = agruparPorId(dados.custosVenda, "vendaId");
  const resultadosVenda = dados.vendasProduto.map(venda => window.financeiroUtils.calcularLucroVenda(
    venda,
    dados.consumosEstoque,
    dados.custosVenda
  ));
  const receitaTotal = resultadosVenda.reduce((total, resultado) => total + Number(resultado.receita || 0), 0);
  const custoConsumidoFifo = resultadosVenda.reduce((total, resultado) => total + Number(resultado.custoConsumido || 0), 0);
  const custosDaPeca = window.financeiroUtils.calcularCustosPeca(dados.analise.pecaId, dados.custosPeca).valor;
  const custosDaVenda = somar(dados.custosVenda, "valor");
  const vendasSemCusto = resultadosVenda.filter(resultado => !resultado.calculado).length;
  const custoCalculado = dados.vendasProduto.length === 0 || vendasSemCusto === 0;
  const lucro = custoCalculado ? receitaTotal - custoConsumidoFifo - custosDaPeca - custosDaVenda : null;
  const margem = lucro === null || receitaTotal <= 0 ? null : (lucro / receitaTotal) * 100;

  return {
    receitaTotal,
    custoConsumidoFifo: custoCalculado ? custoConsumidoFifo : null,
    custosDaPeca,
    custosDaVenda,
    lucro,
    margem,
    vendasSemCusto,
    custoCalculado,
    consumosPorVenda,
    custosVendaPorVenda
  };
}

function criarFiltroHtml(pecaId, filtro) {
  const desabilitarDatas = filtro.periodo !== "personalizado" ? " disabled" : "";

  return `
    <form class="analysis-filter" data-acao="filtrar-historico" data-peca-id="${pecaId}">
      <div class="form-row">
        <div class="form-group">
          <label for="periodo-${pecaId}">Período</label>
          <select id="periodo-${pecaId}" data-campo="periodo">
            <option value="todos"${filtro.periodo === "todos" ? " selected" : ""}>Todo período</option>
            <option value="hoje"${filtro.periodo === "hoje" ? " selected" : ""}>Hoje</option>
            <option value="7"${filtro.periodo === "7" ? " selected" : ""}>Últimos 7 dias</option>
            <option value="30"${filtro.periodo === "30" ? " selected" : ""}>Últimos 30 dias</option>
            <option value="personalizado"${filtro.periodo === "personalizado" ? " selected" : ""}>Personalizado</option>
          </select>
        </div>
        <div class="form-group">
          <label for="inicio-${pecaId}">Data inicial</label>
          <input id="inicio-${pecaId}" data-campo="dataInicial" type="date" value="${escaparHtml(filtro.dataInicial)}"${desabilitarDatas}>
        </div>
        <div class="form-group">
          <label for="fim-${pecaId}">Data final</label>
          <input id="fim-${pecaId}" data-campo="dataFinal" type="date" value="${escaparHtml(filtro.dataFinal)}"${desabilitarDatas}>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="button-primary">Aplicar</button>
      </div>
    </form>
  `;
}

function criarResumoDetalhadoHtml(resumo) {
  const classeLucro = resumo.lucro !== null && resumo.lucro >= 0 ? "summary-card--profit" : "summary-card--loss";

  return `
    <section class="summary-grid summary-grid--compact">
      ${criarCard("Receita total", formatarMoeda(resumo.receitaTotal))}
      ${criarCard("Custo consumido FIFO", formatarValorOuNaoCalculado(resumo.custoConsumidoFifo))}
      ${criarCard("Custos da peça", formatarMoeda(resumo.custosDaPeca))}
      ${criarCard("Custos da venda", formatarMoeda(resumo.custosDaVenda))}
      ${criarCard("Lucro", resumo.lucro === null ? "Custo não calculado" : `<span class="${obterClasseLucro(resumo.lucro)}">${formatarMoeda(resumo.lucro)}</span>`, classeLucro)}
      ${criarCard("Margem", formatarMargem(resumo.margem))}
    </section>
  `;
}

function criarTabelaVendasHtml(dados, resumo) {
  if (dados.vendasProduto.length === 0) {
    return `<p class="empty-message">Nenhuma venda encontrada neste período.</p>`;
  }

  const linhas = dados.vendasProduto.map(venda => {
    const resultadoVenda = window.financeiroUtils.calcularLucroVenda(venda, dados.consumosEstoque, dados.custosVenda);
    const valor = resultadoVenda.receita;

    return `
      <tr>
        <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
        <td data-label="Quantidade">${formatarNumero(obterQuantidadeVendida(venda))}</td>
        <td data-label="Valor">${formatarMoeda(valor)}</td>
        <td data-label="Canal">${escaparHtml(venda.canalVenda || "-")}</td>
        <td data-label="Lucro">${!resultadoVenda.calculado ? "<strong>Custo não calculado</strong>" : `<strong class="${obterClasseLucro(resultadoVenda.lucro)}">${formatarMoeda(resultadoVenda.lucro)}</strong>`}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="table-wrapper">
      <table class="stock-table stock-table--nested">
        <thead>
          <tr>
            <th>Data</th>
            <th>Quantidade</th>
            <th>Valor</th>
            <th>Canal</th>
            <th>Lucro da venda</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function criarTabelaCustosPecaHtml(custosPeca) {
  if (custosPeca.length === 0) {
    return `<p class="empty-message">Nenhum custo de peça encontrado neste período.</p>`;
  }

  const linhas = custosPeca.map(custo => `
    <tr>
      <td data-label="Tipo">${escaparHtml(custo.tipoCusto || custo.tipo || "-")}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Observação">${escaparHtml(custo.observacoes || custo.observacao || custo.descricao || "-")}</td>
      <td data-label="Data">${formatarData(obterDataCusto(custo))}</td>
    </tr>
  `).join("");

  return `
    <div class="table-wrapper">
      <table class="stock-table stock-table--nested">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Observação</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function criarTabelaConsumoFifoHtml(dados) {
  if (dados.consumosEstoque.length === 0) {
    return `<p class="empty-message">Nenhum consumo FIFO encontrado neste período.</p>`;
  }

  const linhas = dados.consumosEstoque.map(consumo => {
    const entrada = dados.entradasPorId[Number(consumo.entradaEstoqueId)] || {};
    const entradaTexto = [
      `Entrada ${consumo.entradaEstoqueId || "-"}`,
      entrada.dataEntrada ? formatarData(entrada.dataEntrada) : "",
      entrada.origemDescricao || ""
    ].filter(Boolean).join(" - ");

    return `
      <tr>
        <td data-label="Entrada">${escaparHtml(entradaTexto)}</td>
        <td data-label="Quantidade">${formatarNumero(consumo.quantidadeConsumida)}</td>
        <td data-label="Custo unitário">${formatarMoeda(consumo.custoUnitario)}</td>
        <td data-label="Custo total">${formatarMoeda(consumo.custoTotal)}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="table-wrapper">
      <table class="stock-table stock-table--nested">
        <thead>
          <tr>
            <th>Entrada</th>
            <th>Quantidade consumida</th>
            <th>Custo unitário</th>
            <th>Custo total</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function criarPainelHistorico(analise) {
  const filtro = atualizarDatasDoPeriodo({ ...obterFiltroProduto(analise.pecaId) });
  filtrosPorProduto[analise.pecaId] = filtro;
  const dados = obterDadosProduto(analise.pecaId, filtro);
  const resumo = calcularResumoDetalhado(dados);

  return `
    <tr class="analysis-detail-row">
      <td colspan="8">
        <div class="analysis-detail-panel">
          <div class="stock-header">
            <div>
              <h3>Histórico de ${escaparHtml(analise.nome)}</h3>
              <p>Custos de estoque calculados somente pelo consumo FIFO real.</p>
            </div>
          </div>
          ${criarFiltroHtml(analise.pecaId, filtro)}
          ${criarResumoDetalhadoHtml(resumo)}

          <div class="analysis-detail-grid">
            <section>
              <h4>Histórico de vendas</h4>
              ${criarTabelaVendasHtml(dados, resumo)}
            </section>
            <section>
              <h4>Custos da peça</h4>
              ${criarTabelaCustosPecaHtml(dados.custosPeca)}
            </section>
            <section>
              <h4>Consumo FIFO</h4>
              ${criarTabelaConsumoFifoHtml(dados)}
            </section>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderizarTabela(analises) {
  tabelaAnaliseProduto.innerHTML = "";

  if (analises.length === 0) {
    mensagemAnaliseProduto.textContent = buscaAnaliseProduto?.value
      ? "Nenhuma peça encontrada para a busca."
      : "Nenhuma peça cadastrada para análise.";
    return;
  }

  mensagemAnaliseProduto.textContent = "";

  analises.forEach(analise => {
    const linha = document.createElement("tr");
    const expandido = Number(produtoExpandidoId) === Number(analise.pecaId);

    linha.innerHTML = `
      <td data-label="SKU">${escaparHtml(analise.sku)}</td>
      <td data-label="Nome"><strong class="product-name">${escaparHtml(analise.nome)}</strong></td>
      <td data-label="Receita">${formatarMoeda(analise.receita)}</td>
      <td data-label="Custo FIFO">${formatarValorOuNaoCalculado(analise.custoEstoque)}</td>
      <td data-label="Lucro">${analise.lucro === null ? "<strong>Custo não calculado</strong>" : `<strong class="${obterClasseLucro(analise.lucro)}">${formatarMoeda(analise.lucro)}</strong>`}</td>
      <td data-label="Margem">${formatarMargem(analise.margem)}</td>
      <td data-label="Qtd. vendida">${formatarNumero(analise.quantidadeVendida)}</td>
      <td data-label="Ações">
        <button type="button" class="button-secondary button-compact" data-acao="alternar-historico" data-peca-id="${analise.pecaId}">
          ${expandido ? "Ocultar" : "Ver histórico"}
        </button>
      </td>
    `;

    tabelaAnaliseProduto.appendChild(linha);

    if (expandido) {
      tabelaAnaliseProduto.insertAdjacentHTML("beforeend", criarPainelHistorico(analise));
    }
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
      <td data-label="Posição">${indice + 1}</td>
      <td data-label="SKU">${escaparHtml(analise.sku)}</td>
      <td data-label="Nome"><strong class="product-name">${escaparHtml(analise.nome)}</strong></td>
      <td data-label="Qtd. vendida">${formatarNumero(analise.quantidadeVendida)}</td>
      <td data-label="Receita total">${formatarMoeda(analise.receita)}</td>
      <td data-label="Lucro">${analise.lucro === null ? "<strong>Custo não calculado</strong>" : `<strong class="${obterClasseLucro(analise.lucro)}">${formatarMoeda(analise.lucro)}</strong>`}</td>
    `;

    tabelaRankingProduto.appendChild(linha);
  });
}

function renderizarAnalises() {
  const analisesFiltradas = filtrarAnalises(analisesCarregadas);

  if (produtoExpandidoId && !analisesFiltradas.some(analise => Number(analise.pecaId) === Number(produtoExpandidoId))) {
    produtoExpandidoId = null;
  }

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

  dadosAnaliseProduto = dados;
  analisesCarregadas = calcularAnalises(dados);
  renderizarAnalises();
}

buscaAnaliseProduto?.addEventListener("input", renderizarAnalises);

function definirPainelFiltrosAberto(aberto) {
  analiseProdutoShell?.classList.toggle("product-analysis-shell--filters-open", aberto);
  botaoAbrirFiltrosAnaliseProduto?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

botaoAbrirFiltrosAnaliseProduto?.addEventListener("click", () => {
  definirPainelFiltrosAberto(!analiseProdutoShell?.classList.contains("product-analysis-shell--filters-open"));
});

botaoFecharFiltrosAnaliseProduto?.addEventListener("click", () => {
  definirPainelFiltrosAberto(false);
});

botaoAplicarFiltrosAnaliseProduto?.addEventListener("click", () => {
  renderizarAnalises();
  definirPainelFiltrosAberto(false);
});

botaoLimparFiltrosAnaliseProduto?.addEventListener("click", () => {
  if (filtroCustoAnaliseProduto) {
    filtroCustoAnaliseProduto.value = "";
  }

  if (filtroResultadoAnaliseProduto) {
    filtroResultadoAnaliseProduto.value = "";
  }

  if (ordenacaoAnaliseProduto) {
    ordenacaoAnaliseProduto.value = "receita";
  }

  renderizarAnalises();
});

[filtroCustoAnaliseProduto, filtroResultadoAnaliseProduto, ordenacaoAnaliseProduto].forEach(campo => {
  campo?.addEventListener("change", renderizarAnalises);
});

tabelaAnaliseProduto?.addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-acao='alternar-historico']");

  if (!botao) {
    return;
  }

  const pecaId = Number(botao.dataset.pecaId);
  produtoExpandidoId = Number(produtoExpandidoId) === pecaId ? null : pecaId;
  renderizarAnalises();
});

tabelaAnaliseProduto?.addEventListener("submit", evento => {
  const form = evento.target.closest("form[data-acao='filtrar-historico']");

  if (!form) {
    return;
  }

  evento.preventDefault();

  const pecaId = Number(form.dataset.pecaId);
  const periodo = form.querySelector("[data-campo='periodo']")?.value || "todos";
  const filtro = {
    periodo,
    dataInicial: form.querySelector("[data-campo='dataInicial']")?.value || "",
    dataFinal: form.querySelector("[data-campo='dataFinal']")?.value || ""
  };

  filtrosPorProduto[pecaId] = atualizarDatasDoPeriodo(filtro);
  renderizarAnalises();
});

tabelaAnaliseProduto?.addEventListener("change", evento => {
  const select = evento.target.closest("select[data-campo='periodo']");

  if (!select) {
    return;
  }

  const form = select.closest("form[data-acao='filtrar-historico']");
  const pecaId = Number(form.dataset.pecaId);
  const filtro = atualizarDatasDoPeriodo({
    periodo: select.value,
    dataInicial: form.querySelector("[data-campo='dataInicial']")?.value || "",
    dataFinal: form.querySelector("[data-campo='dataFinal']")?.value || ""
  });

  filtrosPorProduto[pecaId] = filtro;
  renderizarAnalises();
});

document.addEventListener("DOMContentLoaded", iniciarAnaliseProduto);
