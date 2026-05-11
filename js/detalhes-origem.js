const params = new URLSearchParams(window.location.search);
const origemId = Number(params.get("origemId") || params.get("id"));

const tituloOrigem = document.getElementById("tituloOrigem");
const subtituloOrigem = document.getElementById("subtituloOrigem");
const mensagemOrigemNaoEncontrada = document.getElementById("mensagemOrigemNaoEncontrada");
const dadosOrigem = document.getElementById("dadosOrigem");
const resumoOrigem = document.getElementById("resumoOrigem");
const mensagemDistribuicaoOrigem = document.getElementById("mensagemDistribuicaoOrigem");
const resumoDistribuicaoOrigem = document.getElementById("resumoDistribuicaoOrigem");
const mensagemEntradasOrigem = document.getElementById("mensagemEntradasOrigem");
const tabelaEntradasOrigem = document.getElementById("tabelaEntradasOrigem");
const mensagemProdutosOrigem = document.getElementById("mensagemProdutosOrigem");
const tabelaProdutosOrigem = document.getElementById("tabelaProdutosOrigem");
const campoBuscaPecasOrigem = document.getElementById("buscaPecasOrigem");
const mensagemVendasOrigem = document.getElementById("mensagemVendasOrigem");
const tabelaVendasOrigem = document.getElementById("tabelaVendasOrigem");
const mensagemCustosOrigem = document.getElementById("mensagemCustosOrigem");
const tabelaCustosOrigem = document.getElementById("tabelaCustosOrigem");

let dadosDetalhesOrigem = {
  origem: null,
  entradas: [],
  pecas: [],
  vendas: [],
  consumosOrigem: [],
  custosPeca: [],
  custosVenda: []
};

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatarPercentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
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

function formatarNomePeca(peca) {
  return peca?.nome || peca?.nome_peca || peca?.nomeProduto || peca?.produtoNome || peca?.descricao || `Peça ${peca?.id || peca?.pecaId || ""}`.trim();
}

function formatarSku(peca) {
  return String(peca?.sku || peca?.codigo || peca?.codigo_peca || peca?.cod || "").trim() || "-";
}

function valorVenda(venda) {
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
  const unitario = Number(venda.valorUnitario || venda.precoUnitario || venda.valor_unitario || 0);
  return Number(venda.valorTotal || venda.valor_total || venda.valorVenda || unitario * quantidade || 0);
}

function valorUnitarioVenda(venda) {
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
  const total = valorVenda(venda);
  const unitario = Number(venda.valorUnitario || venda.precoUnitario || venda.valor_unitario || 0);

  return unitario > 0 ? unitario : quantidade > 0 ? total / quantidade : 0;
}

function somarCampo(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function filtrarPecasPorBusca(pecas) {
  const termo = String(campoBuscaPecasOrigem?.value || "").trim().toLowerCase();

  if (!termo) {
    return pecas;
  }

  return pecas.filter(peca => {
    const nome = formatarNomePeca(peca).toLowerCase();
    const sku = formatarSku(peca).toLowerCase();

    return nome.includes(termo) || sku.includes(termo);
  });
}

function obterStatusEntrada(entrada) {
  const total = Number(entrada.quantidadeTotal || 0);
  const consumida = Number(entrada.quantidadeConsumida || 0);
  const saldo = Math.max(total - consumida, 0);

  if (saldo <= 0 && total > 0) {
    return "esgotada";
  }

  if (consumida > 0) {
    return "parcial";
  }

  return "disponível";
}

function obterStatusPeca(peca, entradasDaPeca) {
  if (peca.status) {
    return peca.status;
  }

  const saldo = entradasDaPeca.reduce((total, entrada) => {
    return total + Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
  }, 0);

  return saldo > 0 ? "em_estoque" : "vendida";
}

function obterVendaPorId(vendaId) {
  return dadosDetalhesOrigem.vendas.find(venda => Number(venda.id) === Number(vendaId));
}

function obterPecaPorId(pecaId) {
  return dadosDetalhesOrigem.pecas.find(peca => Number(peca.id) === Number(pecaId));
}

function obterEntradaPorId(entradaId) {
  return dadosDetalhesOrigem.entradas.find(entrada => Number(entrada.id) === Number(entradaId));
}

function agruparConsumosPorVenda(consumos) {
  return consumos.reduce((mapa, consumo) => {
    const vendaId = Number(consumo.vendaId || 0);

    if (!mapa[vendaId]) {
      mapa[vendaId] = [];
    }

    mapa[vendaId].push(consumo);
    return mapa;
  }, {});
}

function agruparCustosVendaPorVenda(custosVenda) {
  return custosVenda.reduce((mapa, custo) => {
    const vendaId = Number(custo.vendaId || 0);

    if (!mapa[vendaId]) {
      mapa[vendaId] = [];
    }

    mapa[vendaId].push(custo);
    return mapa;
  }, {});
}

function calcularResumoOrigem() {
  const origem = dadosDetalhesOrigem.origem || {};
  const consumosPorVenda = agruparConsumosPorVenda(dadosDetalhesOrigem.consumosOrigem);
  const custosVendaPorVenda = agruparCustosVendaPorVenda(dadosDetalhesOrigem.custosVenda);
  const vendaIds = Object.keys(consumosPorVenda).map(Number);
  const receitaTotal = vendaIds.reduce((total, vendaId) => {
    const venda = obterVendaPorId(vendaId);
    const valorUnitario = valorUnitarioVenda(venda || {});
    const quantidadeConsumida = somarCampo(consumosPorVenda[vendaId] || [], "quantidadeConsumida");

    return total + (quantidadeConsumida * valorUnitario);
  }, 0);
  const custoConsumidoDaOrigem = somarCampo(dadosDetalhesOrigem.consumosOrigem, "custoTotal");
  const custosDaPeca = somarCampo(dadosDetalhesOrigem.custosPeca, "valor");
  const custosDaVenda = somarCampo(dadosDetalhesOrigem.custosVenda, "valor");
  const resultadoOrigem = receitaTotal - custoConsumidoDaOrigem - custosDaPeca - custosDaVenda;
  const valorInvestido = Number(origem.valorPago || origem.valor_total || origem.custoTotal || 0);
  const valorAtribuidoNasEntradas = dadosDetalhesOrigem.entradas.reduce((total, entrada) => {
    return total + (Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0));
  }, 0);
  const saldoParaDistribuir = valorInvestido - valorAtribuidoNasEntradas;
  const percentualDistribuido = valorInvestido > 0
    ? (valorAtribuidoNasEntradas / valorInvestido) * 100
    : 0;
  const saldoAindaEmEstoque = dadosDetalhesOrigem.entradas.reduce((total, entrada) => {
    const saldo = Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
    return total + (saldo * Number(entrada.custoUnitario || 0));
  }, 0);
  const status = resultadoOrigem > 0
    ? "lucro"
    : receitaTotal < valorInvestido
      ? "ainda recuperando investimento"
      : "prejuízo";

  return {
    receitaTotal,
    custoConsumidoDaOrigem,
    custosDaPeca,
    custosDaVenda,
    resultadoOrigem,
    valorInvestido,
    valorAtribuidoNasEntradas,
    saldoParaDistribuir,
    percentualDistribuido,
    saldoAindaEmEstoque,
    status,
    custosVendaPorVenda
  };
}

function renderizarDadosOrigem(origem) {
  const codigoOrigem = origem.codigoOrigem || `ORI-${String(origem.id || "").padStart(6, "0")}`;

  tituloOrigem.textContent = origem.descricao || `Origem ${origem.id}`;
  subtituloOrigem.textContent = `${codigoOrigem} - ${origem.tipoOrigem || origem.tipo || "Origem"} - ${formatarData(origem.dataCompra)}`;

  dadosOrigem.innerHTML = `
    <article class="detail-card">
      <span>Codigo</span>
      <strong>${escaparHtml(codigoOrigem)}</strong>
    </article>
    <article class="detail-card">
      <span>ID</span>
      <strong>${escaparHtml(origem.id || "-")}</strong>
    </article>
    <article class="detail-card">
      <span>Tipo da origem</span>
      <strong>${escaparHtml(origem.tipoOrigem || origem.tipo || "-")}</strong>
    </article>
    <article class="detail-card">
      <span>Descrição</span>
      <strong>${escaparHtml(origem.descricao || "-")}</strong>
    </article>
    <article class="detail-card">
      <span>Valor total</span>
      <strong>${formatarMoeda(origem.valorPago || origem.valor_total || origem.custoTotal)}</strong>
    </article>
    <article class="detail-card">
      <span>Data da origem</span>
      <strong>${formatarData(origem.dataCompra || origem.data_origem)}</strong>
    </article>
    <article class="detail-card">
      <span>Observações</span>
      <strong>${escaparHtml(origem.observacoes || "-")}</strong>
    </article>
  `;
}

function renderizarResumoOrigem() {
  const resumo = calcularResumoOrigem();
  const resultadoPositivo = resumo.resultadoOrigem > 0;
  const classeResultado = resultadoPositivo ? "profit-value profit-value--positive" : "profit-value profit-value--negative";
  const classeCardResultado = resultadoPositivo ? "summary-card summary-card--profit" : "summary-card summary-card--loss";

  resumoOrigem.innerHTML = `
    <article class="summary-card">
      <span>Valor investido</span>
      <strong>${formatarMoeda(resumo.valorInvestido)}</strong>
    </article>
    <article class="summary-card">
      <span>Valor atribuido nas entradas</span>
      <strong>${formatarMoeda(resumo.valorAtribuidoNasEntradas)}</strong>
    </article>
    <article class="summary-card">
      <span>Saldo para distribuir</span>
      <strong>${formatarMoeda(resumo.saldoParaDistribuir)}</strong>
    </article>
    <article class="summary-card">
      <span>Valor recuperado em vendas</span>
      <strong>${formatarMoeda(resumo.receitaTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo consumido da origem</span>
      <strong>${formatarMoeda(resumo.custoConsumidoDaOrigem)}</strong>
    </article>
    <article class="summary-card">
      <span>Saldo ainda em estoque</span>
      <strong>${formatarMoeda(resumo.saldoAindaEmEstoque)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos das peças</span>
      <strong>${formatarMoeda(resumo.custosDaPeca)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos das vendas</span>
      <strong>${formatarMoeda(resumo.custosDaVenda)}</strong>
    </article>
    <article class="${classeCardResultado}">
      <span>Resultado atual</span>
      <strong class="${classeResultado}">${formatarMoeda(resumo.resultadoOrigem)}</strong>
    </article>
    <article class="${classeCardResultado}">
      <span>Status</span>
      <strong class="${classeResultado}">${escaparHtml(resumo.status)}</strong>
    </article>
  `;
}

function renderizarDistribuicaoOrigem() {
  const resumo = calcularResumoOrigem();
  const diferenca = resumo.saldoParaDistribuir;
  const aindaFaltaDistribuir = diferenca > 0.009;
  const distribuidoMaiorQueOrigem = diferenca < -0.009;
  const statusDistribuicao = aindaFaltaDistribuir
    ? "Ainda falta distribuir"
    : distribuidoMaiorQueOrigem
      ? "Valor distribuido maior que a origem"
      : "Origem totalmente distribuida";
  const detalheDistribuicao = aindaFaltaDistribuir
    ? "Parte do investimento da origem ainda nao foi atribuida nas entradas."
    : distribuidoMaiorQueOrigem
      ? "Revise os valores atribuidos nas entradas desta origem."
      : "Todo o valor da origem ja foi distribuido nas pecas/entradas.";
  const classeStatus = aindaFaltaDistribuir
    ? "summary-card summary-card--warning"
    : distribuidoMaiorQueOrigem
      ? "summary-card summary-card--loss"
      : "summary-card summary-card--profit";

  mensagemDistribuicaoOrigem.textContent = `${statusDistribuicao}. ${detalheDistribuicao}`;
  resumoDistribuicaoOrigem.innerHTML = `
    <article class="summary-card">
      <span>Valor total da origem</span>
      <strong>${formatarMoeda(resumo.valorInvestido)}</strong>
    </article>
    <article class="summary-card">
      <span>Valor distribuido nas pecas/entradas</span>
      <strong>${formatarMoeda(resumo.valorAtribuidoNasEntradas)}</strong>
    </article>
    <article class="summary-card">
      <span>Valor ainda nao distribuido</span>
      <strong>${formatarMoeda(resumo.saldoParaDistribuir)}</strong>
    </article>
    <article class="summary-card">
      <span>Percentual distribuido</span>
      <strong>${formatarPercentual(resumo.percentualDistribuido)}</strong>
    </article>
    <article class="${classeStatus}">
      <span>Status da distribuicao</span>
      <strong>${escaparHtml(statusDistribuicao)}</strong>
    </article>
    <article class="summary-card">
      <span>Entradas vinculadas</span>
      <strong>${formatarNumero(dadosDetalhesOrigem.entradas.length)}</strong>
    </article>
  `;
}

function renderizarEntradas() {
  tabelaEntradasOrigem.innerHTML = "";

  if (dadosDetalhesOrigem.entradas.length === 0) {
    mensagemEntradasOrigem.textContent = "Nenhuma entrada de estoque encontrada para esta origem.";
    return;
  }

  mensagemEntradasOrigem.textContent = "";

  dadosDetalhesOrigem.entradas.forEach(entrada => {
    const saldo = Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
    const peca = obterPecaPorId(entrada.pecaId) || entrada;
    const valorAtribuidoEntrada = Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="ID peça">${escaparHtml(entrada.pecaId || "-")}</td>
      <td data-label="SKU">${escaparHtml(formatarSku(peca))}</td>
      <td data-label="Peça">${escaparHtml(formatarNomePeca(peca))}</td>
      <td data-label="Qtd. total">${formatarNumero(entrada.quantidadeTotal)}</td>
      <td data-label="Qtd. consumida">${formatarNumero(entrada.quantidadeConsumida)}</td>
      <td data-label="Saldo disponível">${formatarNumero(saldo)}</td>
      <td data-label="Custo unitário">${formatarMoeda(entrada.custoUnitario)}</td>
      <td data-label="Valor atribuido total">${formatarMoeda(valorAtribuidoEntrada)}</td>
      <td data-label="Data entrada">${formatarData(entrada.dataEntrada)}</td>
      <td data-label="Status">${escaparHtml(obterStatusEntrada(entrada))}</td>
    `;

    tabelaEntradasOrigem.appendChild(linha);
  });
}

function renderizarPecas() {
  tabelaProdutosOrigem.innerHTML = "";
  const pecasFiltradas = filtrarPecasPorBusca(dadosDetalhesOrigem.pecas);

  if (pecasFiltradas.length === 0) {
    mensagemProdutosOrigem.textContent = campoBuscaPecasOrigem?.value
      ? "Nenhuma peça encontrada para a busca."
      : "Nenhuma peça vinculada a esta origem.";
    return;
  }

  mensagemProdutosOrigem.textContent = "";

  pecasFiltradas.forEach(peca => {
    const entradasDaPeca = dadosDetalhesOrigem.entradas.filter(entrada => Number(entrada.pecaId) === Number(peca.id));
    const quantidadeTotal = somarCampo(entradasDaPeca, "quantidadeTotal") || Number(peca.quantidade || 0);
    const quantidadeVendida = somarCampo(entradasDaPeca, "quantidadeConsumida") || Number(peca.quantidadeVendida || 0);
    const quantidadeDisponivel = Math.max(quantidadeTotal - quantidadeVendida, 0);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="SKU">${escaparHtml(formatarSku(peca))}</td>
      <td data-label="Peça">${escaparHtml(formatarNomePeca(peca))}</td>
      <td data-label="Qtd. total">${formatarNumero(quantidadeTotal)}</td>
      <td data-label="Qtd. vendida">${formatarNumero(quantidadeVendida)}</td>
      <td data-label="Qtd. disponível">${formatarNumero(quantidadeDisponivel)}</td>
      <td data-label="Status">${escaparHtml(obterStatusPeca(peca, entradasDaPeca))}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <a class="table-link" href="detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}">Ver peça</a>
        </div>
      </td>
    `;

    tabelaProdutosOrigem.appendChild(linha);
  });
}

function montarLinhasVendasOrigem() {
  const consumosPorVenda = agruparConsumosPorVenda(dadosDetalhesOrigem.consumosOrigem);
  const custosVendaPorVenda = agruparCustosVendaPorVenda(dadosDetalhesOrigem.custosVenda);

  return Object.keys(consumosPorVenda).map(vendaIdTexto => {
    const vendaId = Number(vendaIdTexto);
    const venda = obterVendaPorId(vendaId);
    const consumos = consumosPorVenda[vendaId] || [];
    const primeiroConsumo = consumos[0] || {};
    const entrada = obterEntradaPorId(primeiroConsumo.entradaEstoqueId);
    const peca = obterPecaPorId(entrada?.pecaId || venda?.pecaId);
    const quantidadeConsumida = somarCampo(consumos, "quantidadeConsumida");
    const custoConsumido = somarCampo(consumos, "custoTotal");
    const valorUnitario = valorUnitarioVenda(venda || {});
    const valorAtribuido = quantidadeConsumida * valorUnitario;
    const custosVenda = somarCampo(custosVendaPorVenda[vendaId] || [], "valor");

    return {
      venda,
      peca,
      quantidadeConsumida,
      custoConsumido,
      valorUnitario,
      valorAtribuido,
      custosVenda,
      lucroVenda: valorAtribuido - custoConsumido - custosVenda
    };
  }).sort((a, b) => {
    const dataA = obterDataVenda(a.venda || {});
    const dataB = obterDataVenda(b.venda || {});

    if (dataA !== dataB) {
      return dataB.localeCompare(dataA);
    }

    return Number(b.venda?.id || 0) - Number(a.venda?.id || 0);
  });
}

function renderizarVendas() {
  tabelaVendasOrigem.innerHTML = "";
  const linhas = montarLinhasVendasOrigem();

  if (linhas.length === 0) {
    mensagemVendasOrigem.textContent = "Nenhuma venda relacionada ao consumo das entradas desta origem.";
    return;
  }

  mensagemVendasOrigem.textContent = "";

  linhas.forEach(item => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data venda">${formatarData(obterDataVenda(item.venda || {}))}</td>
      <td data-label="SKU">${escaparHtml(formatarSku(item.peca || item.venda))}</td>
      <td data-label="Peça">${escaparHtml(formatarNomePeca(item.peca || item.venda))}</td>
      <td data-label="Qtd. consumida">${formatarNumero(item.quantidadeConsumida)}</td>
      <td data-label="Valor unitário">${formatarMoeda(item.valorUnitario)}</td>
      <td data-label="Valor atribuído">${formatarMoeda(item.valorAtribuido)}</td>
      <td data-label="Custo consumido">${formatarMoeda(item.custoConsumido)}</td>
      <td data-label="Custos venda">${formatarMoeda(item.custosVenda)}</td>
      <td data-label="Lucro venda">${formatarMoeda(item.lucroVenda)}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <a class="table-link" href="detalhes-venda.html?vendaId=${encodeURIComponent(item.venda?.id || "")}">Ver detalhes</a>
        </div>
      </td>
    `;

    tabelaVendasOrigem.appendChild(linha);
  });
}

function renderizarCustos() {
  tabelaCustosOrigem.innerHTML = "";
  const custosPeca = dadosDetalhesOrigem.custosPeca.map(custo => {
    const peca = obterPecaPorId(custo.pecaId);

    return {
      origem: "Custo da peça",
      data: custo.dataCusto || custo.data,
      tipo: custo.tipoCusto || custo.tipo,
      descricao: custo.descricao,
      valor: custo.valor,
      referencia: `${formatarSku(peca)} - ${formatarNomePeca(peca)}`
    };
  });
  const custosVenda = dadosDetalhesOrigem.custosVenda.map(custo => {
    const venda = obterVendaPorId(custo.vendaId);
    const peca = obterPecaPorId(venda?.pecaId);

    return {
      origem: "Custo da venda",
      data: custo.dataCusto || custo.data,
      tipo: custo.tipoCusto || custo.tipo,
      descricao: custo.descricao,
      valor: custo.valor,
      referencia: `Venda ${custo.vendaId || "-"} - ${formatarSku(peca)}`
    };
  });
  const custos = [...custosPeca, ...custosVenda];

  if (custos.length === 0) {
    mensagemCustosOrigem.textContent = "Nenhum custo de peça ou venda encontrado para esta origem.";
    return;
  }

  mensagemCustosOrigem.textContent = "";

  custos.forEach(custo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Origem do custo">${escaparHtml(custo.origem)}</td>
      <td data-label="Data">${formatarData(custo.data)}</td>
      <td data-label="Tipo">${escaparHtml(custo.tipo || "-")}</td>
      <td data-label="Descrição">${escaparHtml(custo.descricao || "-")}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Referência">${escaparHtml(custo.referencia || "-")}</td>
    `;

    tabelaCustosOrigem.appendChild(linha);
  });
}

async function carregarContextoSupabase(idOrigem) {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    throw new Error("Configure o Supabase para carregar os detalhes da origem.");
  }

  const [
    origem,
    entradas,
    pecas,
    vendas,
    consumosEstoque,
    custosPeca,
    custosVenda
  ] = await Promise.all([
    window.supabaseService.buscarOrigemPorId(idOrigem),
    window.supabaseService.listarEntradasEstoque(),
    window.supabaseService.listarPecas(),
    window.supabaseService.listarVendas(),
    window.supabaseService.listarConsumosEstoque(),
    window.supabaseService.listarCustosPeca(),
    window.supabaseService.listarCustosVenda()
  ]);

  const entradasOrigem = (entradas || []).filter(entrada => Number(entrada.origemId || 0) === Number(idOrigem));
  const idsPecasOrigem = new Set(entradasOrigem.map(entrada => Number(entrada.pecaId)));
  const skuOrigem = String(origem?.produtoSku || "").trim().toUpperCase();
  const pecasOrigem = (pecas || []).filter(peca => {
    const skuPeca = String(peca.sku || "").trim().toUpperCase();

    return idsPecasOrigem.has(Number(peca.id)) ||
      Number(peca.origemId || 0) === Number(idOrigem) ||
      Boolean(skuOrigem && skuPeca === skuOrigem);
  });
  pecasOrigem.forEach(peca => idsPecasOrigem.add(Number(peca.id)));

  const idsEntradasOrigem = new Set(entradasOrigem.map(entrada => Number(entrada.id)));
  const consumosOrigem = (consumosEstoque || []).filter(consumo => idsEntradasOrigem.has(Number(consumo.entradaEstoqueId)));
  const idsVendasOrigem = new Set(consumosOrigem.map(consumo => Number(consumo.vendaId)));
  const vendasOrigem = (vendas || []).filter(venda => idsVendasOrigem.has(Number(venda.id)));
  const custosPecaOrigem = (custosPeca || []).filter(custo => idsPecasOrigem.has(Number(custo.pecaId)));
  const custosVendaOrigem = (custosVenda || []).filter(custo => idsVendasOrigem.has(Number(custo.vendaId)));

  return {
    origem,
    entradas: entradasOrigem,
    pecas: pecasOrigem,
    vendas: vendasOrigem,
    consumosOrigem,
    custosPeca: custosPecaOrigem,
    custosVenda: custosVendaOrigem
  };
}

function renderizarTela() {
  renderizarDadosOrigem(dadosDetalhesOrigem.origem);
  renderizarResumoOrigem();
  renderizarDistribuicaoOrigem();
  renderizarEntradas();
  renderizarPecas();
  renderizarVendas();
  renderizarCustos();
}

function limparTela(mensagem) {
  mensagemOrigemNaoEncontrada.textContent = mensagem;
  dadosOrigem.innerHTML = "";
  resumoOrigem.innerHTML = "";
  resumoDistribuicaoOrigem.innerHTML = "";
  tabelaEntradasOrigem.innerHTML = "";
  tabelaProdutosOrigem.innerHTML = "";
  tabelaVendasOrigem.innerHTML = "";
  tabelaCustosOrigem.innerHTML = "";
}

async function iniciarDetalhesOrigem() {
  if (!origemId) {
    limparTela("Selecione uma origem pela listagem para abrir os detalhes.");
    return;
  }

  try {
    dadosDetalhesOrigem = await carregarContextoSupabase(origemId);

    if (!dadosDetalhesOrigem.origem) {
      limparTela("Origem não encontrada.");
      return;
    }

    mensagemOrigemNaoEncontrada.textContent = "";
    renderizarTela();
  } catch (erro) {
    console.error(erro);
    limparTela(erro.message || "Não foi possível carregar os detalhes da origem pelo Supabase.");
  }
}

campoBuscaPecasOrigem?.addEventListener("input", () => {
  renderizarPecas();
});

iniciarDetalhesOrigem();
