const mensagemAlertas = document.getElementById("mensagemAlertas");
const resumoAlertas = document.getElementById("resumoAlertas");
const tabelaAlertasPecas = document.getElementById("tabelaAlertasPecas");
const tabelaAlertasLotes = document.getElementById("tabelaAlertasLotes");
const tabelaAlertasVendas = document.getElementById("tabelaAlertasVendas");
const mensagemAlertasPecas = document.getElementById("mensagemAlertasPecas");
const mensagemAlertasLotes = document.getElementById("mensagemAlertasLotes");
const mensagemAlertasVendas = document.getElementById("mensagemAlertasVendas");

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

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function formatarNomePeca(peca) {
  return peca?.nome || peca?.nome_peca || peca?.produtoNome || peca?.descricao || `Peca ${peca?.id || peca?.pecaId || ""}`.trim();
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || venda.createdAt || venda.created_at || "").slice(0, 10);
}

function calcularValorVenda(venda) {
  const quantidade = Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
  const valorUnitario = Number(venda.valorUnitario || venda.valor_unitario || venda.precoUnitario || 0);

  if (valorUnitario > 0) {
    return quantidade * valorUnitario;
  }

  return Number(venda.valorTotal || venda.valorVenda || 0);
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

function somarQuantidadeVendida(vendas) {
  return vendas.reduce((total, venda) => {
    return total + Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
  }, 0);
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

function criarCard(titulo, valor, classe = "") {
  const classeCard = classe ? `summary-card ${classe}` : "summary-card";

  return `
    <article class="${classeCard}">
      <span>${titulo}</span>
      <strong>${valor}</strong>
    </article>
  `;
}

function criarPill(texto, tipo = "warning") {
  return `<span class="alert-pill alert-pill--${tipo}">${texto}</span>`;
}

function renderizarListaPills(alertas) {
  return `<div class="alert-list">${alertas.map(alerta => criarPill(alerta.texto, alerta.tipo)).join("")}</div>`;
}

function calcularAlertasPecas(dados) {
  const vendasPorPeca = agruparPorId(dados.vendas, "pecaId");
  const entradasPorPeca = agruparPorId(dados.entradasEstoque, "pecaId");

  return dados.pecas.map(peca => {
    const pecaId = Number(peca.id);
    const vendasDaPeca = vendasPorPeca[pecaId] || [];
    const entradasDaPeca = entradasPorPeca[pecaId] || [];
    const quantidadeVendidaPorVendas = somarQuantidadeVendida(vendasDaPeca);
    const quantidadeVendida = quantidadeVendidaPorVendas || Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
    const estoqueDisponivel = Math.max(0, Number(peca.quantidade || 0) - quantidadeVendida);
    const ultimaVenda = obterUltimaVenda(vendasDaPeca);
    const dataBaseSemVenda = ultimaVenda || obterDataEntradaOuCadastro(peca, entradasDaPeca);
    const diasSemVenda = calcularDiasDesde(dataBaseSemVenda);
    const alertas = [];

    if (estoqueDisponivel <= 0) {
      alertas.push({ texto: "Sem estoque", tipo: "danger" });
    } else if (estoqueDisponivel <= 2) {
      alertas.push({ texto: "Estoque baixo", tipo: "warning" });
    }

    if (entradasDaPeca.length === 0) {
      alertas.push({ texto: "Sem entrada", tipo: "info" });
    }

    if (quantidadeVendidaPorVendas <= 0) {
      alertas.push({ texto: "Sem venda", tipo: "warning" });
    } else if (diasSemVenda !== null && diasSemVenda > 30) {
      alertas.push({ texto: "Parada", tipo: "warning" });
    }

    return {
      peca,
      sku: formatarSku(peca),
      nome: formatarNomePeca(peca),
      estoqueDisponivel,
      quantidadeVendida,
      ultimaVenda,
      diasSemVenda,
      alertas
    };
  }).filter(item => item.alertas.length > 0);
}

function calcularAlertasLotes(entradasEstoque) {
  return entradasEstoque.map(entrada => {
    const quantidadeTotal = Number(entrada.quantidadeTotal || 0);
    const quantidadeConsumida = Number(entrada.quantidadeConsumida || 0);
    const saldo = Math.max(0, quantidadeTotal - quantidadeConsumida);
    const alertas = [];

    if (saldo <= 0) {
      alertas.push({ texto: "Esgotado", tipo: "danger" });
    } else if (saldo <= 2) {
      alertas.push({ texto: "Saldo baixo", tipo: "warning" });
    }

    return {
      entrada,
      quantidadeTotal,
      quantidadeConsumida,
      saldo,
      alertas
    };
  }).filter(item => item.alertas.length > 0);
}

function calcularAlertasVendas(dados) {
  const consumosPorVenda = agruparPorId(dados.consumosEstoque, "vendaId");
  const custosVendaPorVenda = agruparPorId(dados.custosVenda, "vendaId");

  return dados.vendas.map(venda => {
    const vendaId = Number(venda.id);
    const consumosDaVenda = consumosPorVenda[vendaId] || [];
    const custosDaVenda = custosVendaPorVenda[vendaId] || [];
    const totalVendido = calcularValorVenda(venda);
    const custoEstoque = somar(consumosDaVenda, "custoTotal");
    const custosVenda = somar(custosDaVenda, "valor");
    const lucro = totalVendido - custoEstoque - custosVenda;
    const alertas = [];

    if (consumosDaVenda.length === 0) {
      alertas.push({ texto: "Sem custo calculado", tipo: "warning" });
    }

    if (consumosDaVenda.length > 0 && lucro < 0) {
      alertas.push({ texto: "Lucro negativo", tipo: "danger" });
    }

    return {
      venda,
      totalVendido,
      custoEstoque,
      custosVenda,
      lucro,
      alertas
    };
  }).filter(item => item.alertas.length > 0);
}

function renderizarResumo(alertasPecas, alertasLotes, alertasVendas) {
  const pecasSemEstoque = alertasPecas.filter(item => item.alertas.some(alerta => alerta.texto === "Sem estoque")).length;
  const pecasEstoqueBaixo = alertasPecas.filter(item => item.alertas.some(alerta => alerta.texto === "Estoque baixo")).length;
  const pecasSemEntrada = alertasPecas.filter(item => item.alertas.some(alerta => alerta.texto === "Sem entrada")).length;
  const pecasParadasOuSemVenda = alertasPecas.filter(item => {
    return item.alertas.some(alerta => alerta.texto === "Parada" || alerta.texto === "Sem venda");
  }).length;
  const lotesEsgotados = alertasLotes.filter(item => item.alertas.some(alerta => alerta.texto === "Esgotado")).length;
  const lotesBaixos = alertasLotes.filter(item => item.alertas.some(alerta => alerta.texto === "Saldo baixo")).length;
  const vendasSemCusto = alertasVendas.filter(item => item.alertas.some(alerta => alerta.texto === "Sem custo calculado")).length;
  const vendasLucroNegativo = alertasVendas.filter(item => item.alertas.some(alerta => alerta.texto === "Lucro negativo")).length;
  const totalAlertas = pecasSemEstoque + pecasEstoqueBaixo + pecasSemEntrada + pecasParadasOuSemVenda + lotesEsgotados + lotesBaixos + vendasSemCusto + vendasLucroNegativo;

  resumoAlertas.innerHTML =
    criarCard("Total de alertas", totalAlertas, totalAlertas > 0 ? "summary-card--loss" : "summary-card--profit") +
    criarCard("Pecas sem estoque", pecasSemEstoque, pecasSemEstoque > 0 ? "summary-card--loss" : "") +
    criarCard("Estoque baixo", pecasEstoqueBaixo) +
    criarCard("Pecas sem entrada", pecasSemEntrada) +
    criarCard("Paradas ou sem venda", pecasParadasOuSemVenda) +
    criarCard("Lotes esgotados", lotesEsgotados, lotesEsgotados > 0 ? "summary-card--loss" : "") +
    criarCard("Lotes baixos", lotesBaixos) +
    criarCard("Vendas com alerta", vendasSemCusto + vendasLucroNegativo);

  mensagemAlertas.textContent = totalAlertas > 0
    ? ""
    : "Nenhum ponto de atencao encontrado no momento.";
}

function renderizarAlertasPecas(alertasPecas) {
  tabelaAlertasPecas.innerHTML = "";

  if (alertasPecas.length === 0) {
    mensagemAlertasPecas.textContent = "Nenhuma peca com alerta.";
    return;
  }

  mensagemAlertasPecas.textContent = "";

  alertasPecas.forEach(item => {
    const linha = document.createElement("tr");
    const diasSemVenda = item.diasSemVenda === null ? "-" : item.diasSemVenda;

    linha.innerHTML = `
      <td data-label="SKU">${item.sku}</td>
      <td data-label="Peca"><strong class="product-name">${item.nome}</strong></td>
      <td data-label="Estoque">${item.estoqueDisponivel}</td>
      <td data-label="Vendida">${item.quantidadeVendida}</td>
      <td data-label="Ultima venda">${formatarData(item.ultimaVenda)}</td>
      <td data-label="Dias sem venda">${diasSemVenda}</td>
      <td data-label="Alertas">${renderizarListaPills(item.alertas)}</td>
    `;

    tabelaAlertasPecas.appendChild(linha);
  });
}

function renderizarAlertasLotes(alertasLotes) {
  tabelaAlertasLotes.innerHTML = "";

  if (alertasLotes.length === 0) {
    mensagemAlertasLotes.textContent = "Nenhuma entrada ou lote com alerta.";
    return;
  }

  mensagemAlertasLotes.textContent = "";

  alertasLotes.forEach(item => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Peca">${item.entrada.sku ? `${item.entrada.sku} - ` : ""}${item.entrada.nomePeca || "-"}</td>
      <td data-label="Origem">${item.entrada.origemDescricao || "-"}</td>
      <td data-label="Qtd. total">${item.quantidadeTotal}</td>
      <td data-label="Consumida">${item.quantidadeConsumida}</td>
      <td data-label="Saldo">${item.saldo}</td>
      <td data-label="Alerta">${renderizarListaPills(item.alertas)}</td>
    `;

    tabelaAlertasLotes.appendChild(linha);
  });
}

function renderizarAlertasVendas(alertasVendas) {
  tabelaAlertasVendas.innerHTML = "";

  if (alertasVendas.length === 0) {
    mensagemAlertasVendas.textContent = "Nenhuma venda com alerta.";
    return;
  }

  mensagemAlertasVendas.textContent = "";

  alertasVendas.forEach(item => {
    const linha = document.createElement("tr");
    const venda = item.venda;
    const produto = venda.sku ? `${venda.sku} - ${venda.produtoNome || "-"}` : venda.produtoNome || "-";

    linha.innerHTML = `
      <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
      <td data-label="Produto">${produto}</td>
      <td data-label="ID da peca">${venda.pecaId || "-"}</td>
      <td data-label="Valor vendido">${formatarMoeda(item.totalVendido)}</td>
      <td data-label="Custo estoque">${formatarMoeda(item.custoEstoque)}</td>
      <td data-label="Custos venda">${formatarMoeda(item.custosVenda)}</td>
      <td data-label="Lucro">${formatarMoeda(item.lucro)}</td>
      <td data-label="Alertas">${renderizarListaPills(item.alertas)}</td>
    `;

    tabelaAlertasVendas.appendChild(linha);
  });
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemAlertas.textContent = "Configure o Supabase para carregar os alertas.";
    return null;
  }

  try {
    const [pecas, vendas, entradasEstoque, consumosEstoque, custosVenda] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarCustosVenda()
    ]);

    return {
      pecas: pecas || [],
      vendas: vendas || [],
      entradasEstoque: entradasEstoque || [],
      consumosEstoque: consumosEstoque || [],
      custosVenda: custosVenda || []
    };
  } catch (erro) {
    console.error("Erro ao carregar alertas:", erro);
    mensagemAlertas.textContent = "Nao foi possivel carregar os alertas do Supabase.";
    return null;
  }
}

async function iniciarAlertas() {
  const dados = await carregarDados();

  if (!dados) {
    resumoAlertas.innerHTML = "";
    tabelaAlertasPecas.innerHTML = "";
    tabelaAlertasLotes.innerHTML = "";
    tabelaAlertasVendas.innerHTML = "";
    return;
  }

  const alertasPecas = calcularAlertasPecas(dados);
  const alertasLotes = calcularAlertasLotes(dados.entradasEstoque);
  const alertasVendas = calcularAlertasVendas(dados);

  renderizarResumo(alertasPecas, alertasLotes, alertasVendas);
  renderizarAlertasPecas(alertasPecas);
  renderizarAlertasLotes(alertasLotes);
  renderizarAlertasVendas(alertasVendas);
}

document.addEventListener("DOMContentLoaded", iniciarAlertas);
