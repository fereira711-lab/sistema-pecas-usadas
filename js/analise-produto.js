const mensagemAnaliseProduto = document.getElementById("mensagemAnaliseProduto");
const resumoAnaliseProduto = document.getElementById("resumoAnaliseProduto");
const tabelaAnaliseProduto = document.getElementById("tabelaAnaliseProduto");
const buscaAnaliseProduto = document.getElementById("buscaAnaliseProduto");
const analiseProdutoShell = document.getElementById("analiseProdutoShell");
const botaoAbrirFiltrosAnaliseProduto = document.getElementById("botaoAbrirFiltrosAnaliseProduto");
const botaoFecharFiltrosAnaliseProduto = document.getElementById("botaoFecharFiltrosAnaliseProduto");
const botaoLimparFiltrosAnaliseProduto = document.getElementById("botaoLimparFiltrosAnaliseProduto");
const botaoAplicarFiltrosAnaliseProduto = document.getElementById("botaoAplicarFiltrosAnaliseProduto");
const filtroCustoAnaliseProduto = document.getElementById("filtroCustoAnaliseProduto");
const filtroResultadoAnaliseProduto = document.getElementById("filtroResultadoAnaliseProduto");
const ordenacaoAnaliseProduto = document.getElementById("ordenacaoAnaliseProduto");
const quantidadeAnaliseProduto = document.getElementById("quantidadeAnaliseProduto");
const filtroDataInicialAnaliseProduto = document.getElementById("filtroDataInicialAnaliseProduto");
const filtroDataFinalAnaliseProduto = document.getElementById("filtroDataFinalAnaliseProduto");
const filtroCanalAnaliseProduto = document.getElementById("filtroCanalAnaliseProduto");

let dadosAnaliseProduto = {
  pecas: [],
  vendas: [],
  consumosEstoque: [],
  custosPeca: [],
  custosVenda: [],
  entradasEstoque: []
};
let analisesCarregadas = [];
let analisesFiltradasCarregadas = [];
let produtoExpandidoId = null;

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

function obterCanalVenda(venda) {
  return String(venda.canalVenda || venda.canal_venda || venda.canal || "").trim();
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

function itemDentroDoIntervalo(data, dataInicial, dataFinal) {
  const dataIso = String(data || "").slice(0, 10);

  if (!dataIso) {
    return !dataInicial && !dataFinal;
  }

  if (dataInicial && dataIso < dataInicial) {
    return false;
  }

  if (dataFinal && dataIso > dataFinal) {
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
    lucro: resultado.calculado ? resultado.lucro : null,
    margem: resultado.calculado ? resultado.margem : null,
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

function obterDadosFiltradosGlobais() {
  const dataInicial = filtroDataInicialAnaliseProduto?.value || "";
  const dataFinal = filtroDataFinalAnaliseProduto?.value || "";
  const canal = filtroCanalAnaliseProduto?.value || "";
  const vendasFiltradas = dadosAnaliseProduto.vendas.filter(venda => {
    const canalVenda = obterCanalVenda(venda);

    if (!itemDentroDoIntervalo(obterDataVenda(venda), dataInicial, dataFinal)) {
      return false;
    }

    if (canal && canalVenda !== canal) {
      return false;
    }

    return true;
  });
  const idsVendas = new Set(vendasFiltradas.map(venda => Number(venda.id)));
  const custosPecaFiltrados = dadosAnaliseProduto.custosPeca.filter(custo =>
    itemDentroDoIntervalo(obterDataCusto(custo), dataInicial, dataFinal)
  );

  return {
    ...dadosAnaliseProduto,
    vendas: vendasFiltradas,
    consumosEstoque: dadosAnaliseProduto.consumosEstoque.filter(consumo => idsVendas.has(Number(consumo.vendaId))),
    custosVenda: dadosAnaliseProduto.custosVenda.filter(custo => idsVendas.has(Number(custo.vendaId))),
    custosPeca: custosPecaFiltrados
  };
}

function atualizarOpcoesCanal(vendas) {
  if (!filtroCanalAnaliseProduto) {
    return;
  }

  const canalAtual = filtroCanalAnaliseProduto.value;
  const canais = [...new Set(vendas.map(obterCanalVenda).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  filtroCanalAnaliseProduto.innerHTML = `<option value="">Todos</option>` + canais
    .map(canal => `<option value="${escaparHtml(canal)}">${escaparHtml(canal)}</option>`)
    .join("");

  if (canais.includes(canalAtual)) {
    filtroCanalAnaliseProduto.value = canalAtual;
  }
}

function filtrarAnalises(analises, limitarQuantidade = true) {
  const termo = String(buscaAnaliseProduto?.value || "").trim().toLowerCase();
  const filtroCusto = filtroCustoAnaliseProduto?.value || "";
  const filtroResultado = filtroResultadoAnaliseProduto?.value || "";
  const ordenacao = ordenacaoAnaliseProduto?.value || "receita";

  const quantidade = quantidadeAnaliseProduto?.value || "12";
  const filtradas = [...analises]
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

  if (!limitarQuantidade || quantidade === "todos") {
    return filtradas;
  }

  return filtradas.slice(0, Number(quantidade || 12));
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
  const totalCustoPecasVendidas = produtosComCustoPendente > 0 ? null : somar(analises, "custoEstoque");
  const totalCustosVenda = somar(analises, "custosVenda");
  const totalLucro = produtosComCustoPendente > 0 ? null : somar(analises, "lucro");
  const margemMedia = totalLucro === null || totalReceita <= 0 ? null : (totalLucro / totalReceita) * 100;
  const classeLucro = totalLucro !== null && totalLucro >= 0 ? "summary-card--profit" : "summary-card--loss";

  resumoAnaliseProduto.innerHTML =
    criarCard("Receita total", formatarMoeda(totalReceita)) +
    criarCard("Custo das peças vendidas", formatarValorOuNaoCalculado(totalCustoPecasVendidas)) +
    criarCard("Custos da venda", formatarMoeda(totalCustosVenda)) +
    criarCard("Lucro total", totalLucro === null ? "Custo não calculado" : `<span class="${obterClasseLucro(totalLucro)}">${formatarMoeda(totalLucro)}</span>`, classeLucro) +
    criarCard("Margem média", margemMedia === null ? "Custo não calculado" : formatarMargem(margemMedia));
}

function obterDadosProduto(pecaId) {
  const dadosBase = obterDadosFiltradosGlobais();
  const analise = analisesFiltradasCarregadas.find(item => Number(item.pecaId) === Number(pecaId))
    || analisesCarregadas.find(item => Number(item.pecaId) === Number(pecaId));
  const vendasProduto = dadosBase.vendas
    .filter(venda => Number(venda.pecaId) === Number(pecaId))
    .sort((a, b) => obterDataVenda(b).localeCompare(obterDataVenda(a)));
  const idsVendas = new Set(vendasProduto.map(venda => Number(venda.id)));
  const custosPeca = dadosBase.custosPeca
    .filter(custo => Number(custo.pecaId) === Number(pecaId));
  const custosVenda = dadosBase.custosVenda.filter(custo => idsVendas.has(Number(custo.vendaId)));
  const consumosEstoque = dadosBase.consumosEstoque.filter(consumo => idsVendas.has(Number(consumo.vendaId)));
  const entradasPorId = dadosBase.entradasEstoque.reduce((mapa, entrada) => {
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

function criarResumoDetalhadoHtml(resumo) {
  const classeLucro = resumo.lucro !== null && resumo.lucro >= 0 ? "summary-card--profit" : "summary-card--loss";

  return `
    <section class="summary-grid summary-grid--compact">
      ${criarCard("Receita total", formatarMoeda(resumo.receitaTotal))}
      ${criarCard("Custo da peça", formatarValorOuNaoCalculado(resumo.custoConsumidoFifo))}
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
        <td data-label="Canal">${escaparHtml(obterCanalVenda(venda) || "-")}</td>
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

function criarTabelaCustosVendaHtml(custosVenda) {
  if (custosVenda.length === 0) {
    return `<p class="empty-message">Nenhum custo de venda encontrado neste período.</p>`;
  }

  const linhas = custosVenda.map(custo => `
    <tr>
      <td data-label="Tipo">${escaparHtml(custo.tipoCusto || custo.tipo || "-")}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Observação">${escaparHtml(custo.observacoes || custo.observacao || custo.descricao || "-")}</td>
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
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function criarTabelaConsumoFifoHtml(dados) {
  if (dados.consumosEstoque.length === 0) {
    return `<p class="empty-message">Nenhuma entrada consumida encontrada neste período.</p>`;
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
  const dados = obterDadosProduto(analise.pecaId);
  const resumo = calcularResumoDetalhado(dados);

  return `
    <section class="analysis-detail-panel" aria-label="Detalhes de ${escaparHtml(analise.nome)}">
      <div class="stock-header">
        <div>
          <h3>Detalhes de ${escaparHtml(analise.nome)}</h3>
          <p>Vendas, entradas consumidas e custos vinculados ao produto.</p>
        </div>
      </div>
      ${criarResumoDetalhadoHtml(resumo)}

      <div class="analysis-detail-grid">
        <section>
          <h4>Vendas relacionadas</h4>
          ${criarTabelaVendasHtml(dados, resumo)}
        </section>
        <section>
          <h4>Entradas consumidas</h4>
          ${criarTabelaConsumoFifoHtml(dados)}
        </section>
        <section>
          <h4>Custos vinculados</h4>
          <div class="analysis-linked-costs">
            ${criarTabelaCustosPecaHtml(dados.custosPeca)}
            ${criarTabelaCustosVendaHtml(dados.custosVenda)}
          </div>
        </section>
        <section>
          <h4>Resumo simples</h4>
          <p class="empty-message">
            ${resumo.custoCalculado
              ? `Receita de ${formatarMoeda(resumo.receitaTotal)} menos ${formatarMoeda(resumo.custoConsumidoFifo)} de custo da peça e ${formatarMoeda(resumo.custosDaVenda)} de custos da venda.`
              : "Custo não calculado para uma ou mais vendas relacionadas."}
          </p>
        </section>
      </div>
    </section>
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
    const expandido = Number(produtoExpandidoId) === Number(analise.pecaId);
    const lucroHtml = analise.lucro === null
      ? `<strong class="profit-value profit-value--neutral">-</strong>`
      : `<strong class="${obterClasseLucro(analise.lucro)}">${formatarMoeda(analise.lucro)}</strong>`;
    const margemHtml = analise.margem === null
      ? `<span class="badge badge-attention">Pendente</span>`
      : `<span class="badge badge-ok">${formatarMargem(analise.margem)}</span>`;

    tabelaAnaliseProduto.insertAdjacentHTML("beforeend", `
      <article class="product-analysis-row${expandido ? " product-analysis-row--expanded" : ""}">
        <span class="sku" data-label="SKU">${escaparHtml(analise.sku)}</span>
        <strong class="product-name" data-label="Peça">${escaparHtml(analise.nome)}</strong>
        <span data-label="Qtd.">${formatarNumero(analise.quantidadeVendida)}</span>
        <span data-label="Receita">${formatarMoeda(analise.receita)}</span>
        <span data-label="Custo da peça">${formatarValorOuNaoCalculado(analise.custoEstoque)}</span>
        <span data-label="Custos da venda">${formatarMoeda(analise.custosVenda)}</span>
        <span data-label="Lucro">${lucroHtml}</span>
        <span data-label="Margem">${margemHtml}</span>
        <button type="button" class="button-secondary button-compact" data-acao="alternar-historico" data-peca-id="${analise.pecaId}">
          ${expandido ? "Ocultar" : "Detalhes"}
        </button>
      </article>
    `);

    if (expandido) {
      tabelaAnaliseProduto.insertAdjacentHTML("beforeend", criarPainelHistorico(analise));
    }
  });
}

function renderizarAnalises() {
  const dadosFiltrados = obterDadosFiltradosGlobais();
  analisesFiltradasCarregadas = calcularAnalises(dadosFiltrados);
  const analisesResumo = filtrarAnalises(analisesFiltradasCarregadas, false);
  const analisesFiltradas = filtrarAnalises(analisesFiltradasCarregadas);

  if (produtoExpandidoId && !analisesFiltradas.some(analise => Number(analise.pecaId) === Number(produtoExpandidoId))) {
    produtoExpandidoId = null;
  }

  renderizarResumo(analisesResumo);
  renderizarTabela(analisesFiltradas);
}

async function iniciarAnaliseProduto() {
  const dados = await carregarDados();

  if (!dados) {
    resumoAnaliseProduto.innerHTML = "";
    tabelaAnaliseProduto.innerHTML = "";
    return;
  }

  dadosAnaliseProduto = dados;
  analisesCarregadas = calcularAnalises(dados);
  analisesFiltradasCarregadas = analisesCarregadas;
  atualizarOpcoesCanal(dados.vendas);
  renderizarAnalises();
}

buscaAnaliseProduto?.addEventListener("input", renderizarAnalises);
quantidadeAnaliseProduto?.addEventListener("change", renderizarAnalises);

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

  if (filtroDataInicialAnaliseProduto) {
    filtroDataInicialAnaliseProduto.value = "";
  }

  if (filtroDataFinalAnaliseProduto) {
    filtroDataFinalAnaliseProduto.value = "";
  }

  if (filtroCanalAnaliseProduto) {
    filtroCanalAnaliseProduto.value = "";
  }

  renderizarAnalises();
});

[filtroCustoAnaliseProduto, filtroResultadoAnaliseProduto, ordenacaoAnaliseProduto, filtroDataInicialAnaliseProduto, filtroDataFinalAnaliseProduto, filtroCanalAnaliseProduto].forEach(campo => {
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

document.addEventListener("DOMContentLoaded", iniciarAnaliseProduto);
