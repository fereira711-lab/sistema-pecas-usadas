const mensagemAlertas = document.getElementById("mensagemAlertas");
const resumoAlertas = document.getElementById("resumoAlertas");
const tabelaAlertas = document.getElementById("tabelaAlertas");
const buscaAlertas = document.getElementById("buscaAlertas");
const alertasShell = document.getElementById("alertasShell");
const botaoAbrirFiltrosAlertas = document.getElementById("botaoAbrirFiltrosAlertas");
const botaoFecharFiltrosAlertas = document.getElementById("botaoFecharFiltrosAlertas");
const botaoLimparFiltrosAlertas = document.getElementById("botaoLimparFiltrosAlertas");
const botaoAplicarFiltrosAlertas = document.getElementById("botaoAplicarFiltrosAlertas");
const filtroTipoAlertas = document.getElementById("filtroTipoAlertas");
const filtroGravidadeAlertas = document.getElementById("filtroGravidadeAlertas");
const filtroStatusAlertas = document.getElementById("filtroStatusAlertas");

let alertasCarregados = [];

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatarSku(peca) {
  return String(peca?.sku || peca?.codigo || peca?.codigo_peca || peca?.cod || "").trim() || "-";
}

function formatarNomePeca(peca) {
  return peca?.nome || peca?.nome_peca || peca?.produtoNome || peca?.descricao || `Peça ${peca?.id || peca?.pecaId || ""}`.trim();
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
  return Math.max(0, Math.floor((inicioHoje - data) / 86400000));
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

function criarAlerta({ tipo, descricao, entidade, gravidade, acaoTexto, acaoHref, busca }) {
  return {
    tipo,
    descricao,
    entidade,
    gravidade,
    status: "aberto",
    acaoTexto,
    acaoHref,
    busca: normalizarTexto(`${tipo} ${descricao} ${entidade} ${busca || ""}`)
  };
}

function calcularAlertasPecas(dados) {
  const vendasPorPeca = agruparPorId(dados.vendas, "pecaId");
  const entradasPorPeca = agruparPorId(dados.entradasEstoque, "pecaId");

  return dados.pecas.flatMap(peca => {
    const pecaId = Number(peca.id);
    const vendasDaPeca = vendasPorPeca[pecaId] || [];
    const entradasDaPeca = entradasPorPeca[pecaId] || [];
    const quantidadeVendidaPorVendas = somarQuantidadeVendida(vendasDaPeca);
    const quantidadeVendida = quantidadeVendidaPorVendas || Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
    const quantidadeTotalEntradas = somar(entradasDaPeca, "quantidadeTotal");
    const quantidadeTotal = quantidadeTotalEntradas > 0 ? quantidadeTotalEntradas : Number(peca.quantidade || 0);
    const estoqueDisponivel = Math.max(0, quantidadeTotal - quantidadeVendida);
    const ultimaVenda = obterUltimaVenda(vendasDaPeca);
    const dataBaseSemVenda = ultimaVenda || obterDataEntradaOuCadastro(peca, entradasDaPeca);
    const diasSemVenda = calcularDiasDesde(dataBaseSemVenda);
    const entidade = `${formatarSku(peca)} - ${formatarNomePeca(peca)}`;
    const link = `detalhes-produto.html?pecaId=${encodeURIComponent(pecaId)}`;
    const alertas = [];

    if (estoqueDisponivel <= 0) {
      alertas.push(criarAlerta({
        tipo: "Sem estoque",
        descricao: "Produto sem quantidade disponível.",
        entidade,
        gravidade: "critico",
        acaoTexto: "Ver produto",
        acaoHref: link,
        busca: entidade
      }));
    } else if (estoqueDisponivel <= 2) {
      alertas.push(criarAlerta({
        tipo: "Estoque baixo",
        descricao: `Restam ${formatarNumero(estoqueDisponivel)} unidades disponíveis.`,
        entidade,
        gravidade: "atencao",
        acaoTexto: "Ver produto",
        acaoHref: link,
        busca: entidade
      }));
    }

    if (entradasDaPeca.length === 0) {
      alertas.push(criarAlerta({
        tipo: "Sem entrada",
        descricao: "Produto sem entrada de estoque vinculada.",
        entidade,
        gravidade: "info",
        acaoTexto: "Ver produto",
        acaoHref: link,
        busca: entidade
      }));
    }

    if (quantidadeVendidaPorVendas <= 0) {
      alertas.push(criarAlerta({
        tipo: "Sem venda",
        descricao: "Produto sem venda registrada.",
        entidade,
        gravidade: "atencao",
        acaoTexto: "Ver produto",
        acaoHref: link,
        busca: entidade
      }));
    } else if (diasSemVenda !== null && diasSemVenda > 30) {
      alertas.push(criarAlerta({
        tipo: "Produto parado",
        descricao: `${formatarNumero(diasSemVenda)} dias desde a última venda.`,
        entidade,
        gravidade: "atencao",
        acaoTexto: "Ver produto",
        acaoHref: link,
        busca: entidade
      }));
    }

    return alertas;
  });
}

function calcularAlertasLotes(entradasEstoque) {
  return entradasEstoque.flatMap(entrada => {
    const quantidadeTotal = Number(entrada.quantidadeTotal || 0);
    const quantidadeConsumida = Number(entrada.quantidadeConsumida || 0);
    const saldo = Math.max(0, quantidadeTotal - quantidadeConsumida);
    const entidade = `${entrada.sku ? `${entrada.sku} - ` : ""}${entrada.nomePeca || entrada.pecaNome || "Entrada de estoque"}`;
    const alertas = [];

    if (saldo <= 0) {
      alertas.push(criarAlerta({
        tipo: "Lote esgotado",
        descricao: "Entrada de estoque sem saldo disponível.",
        entidade,
        gravidade: "critico",
        acaoTexto: "Ver produto",
        acaoHref: entrada.pecaId ? `detalhes-produto.html?pecaId=${encodeURIComponent(entrada.pecaId)}` : "",
        busca: `${entidade} ${entrada.origemDescricao || ""}`
      }));
    } else if (saldo <= 2) {
      alertas.push(criarAlerta({
        tipo: "Saldo baixo",
        descricao: `Lote com ${formatarNumero(saldo)} unidades restantes.`,
        entidade,
        gravidade: "atencao",
        acaoTexto: "Ver produto",
        acaoHref: entrada.pecaId ? `detalhes-produto.html?pecaId=${encodeURIComponent(entrada.pecaId)}` : "",
        busca: `${entidade} ${entrada.origemDescricao || ""}`
      }));
    }

    return alertas;
  });
}

function calcularAlertasVendas(dados) {
  const consumosPorVenda = agruparPorId(dados.consumosEstoque, "vendaId");

  return dados.vendas.flatMap(venda => {
    const vendaId = Number(venda.id);
    const consumosDaVenda = consumosPorVenda[vendaId] || [];

    if (consumosDaVenda.length > 0) {
      return [];
    }

    const entidade = venda.sku
      ? `${venda.sku} - ${venda.produtoNome || venda.nome || `Venda ${vendaId}`}`
      : venda.produtoNome || venda.nome || `Venda ${vendaId}`;

    return [criarAlerta({
      tipo: "Venda sem custo calculado",
      descricao: "Venda sem consumo FIFO registrado.",
      entidade,
      gravidade: "atencao",
      acaoTexto: "Ver venda",
      acaoHref: `detalhes-venda.html?vendaId=${encodeURIComponent(vendaId)}`,
      busca: entidade
    })];
  });
}

function calcularAlertasOrigens(dados) {
  return (dados.origens || []).flatMap(origem => {
    const entradasDaOrigem = (dados.entradasEstoque || []).filter(entrada => Number(entrada.origemId || 0) === Number(origem.id));
    const valorTotal = Number(origem.valorPago || origem.valor_total || origem.custoTotal || 0);
    const valorAtribuido = entradasDaOrigem.reduce((total, entrada) => (
      total + (Number(entrada.valorAtribuidoEntrada || entrada.valor_atribuido_entrada || 0) || Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0))
    ), 0);
    const saldo = valorTotal - valorAtribuido;
    const codigo = origem.codigoOrigem || origem.codigo_origem || `ORI-${String(origem.id || "").padStart(6, "0")}`;
    const entidade = `${codigo} - ${origem.descricao || `Origem ${origem.id}`}`;

    if (saldo > 0.009) {
      return [criarAlerta({
        tipo: "Distribuição pendente",
        descricao: "Origem com valor ainda não distribuído nas entradas.",
        entidade,
        gravidade: "atencao",
        acaoTexto: "Ver origem",
        acaoHref: `detalhes-origem.html?origemId=${encodeURIComponent(origem.id)}`,
        busca: entidade
      })];
    }

    if (saldo < -0.009) {
      return [criarAlerta({
        tipo: "Distribuição acima do valor",
        descricao: "Origem com valor distribuído acima do valor total.",
        entidade,
        gravidade: "critico",
        acaoTexto: "Ver origem",
        acaoHref: `detalhes-origem.html?origemId=${encodeURIComponent(origem.id)}`,
        busca: entidade
      })];
    }

    return [];
  });
}

function preencherTipos(alertas) {
  if (!filtroTipoAlertas) {
    return;
  }

  const valorAtual = filtroTipoAlertas.value;
  const tipos = Array.from(new Set(alertas.map(alerta => alerta.tipo))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  filtroTipoAlertas.innerHTML = '<option value="">Todos</option>';
  tipos.forEach(tipo => {
    const opcao = document.createElement("option");
    opcao.value = tipo;
    opcao.textContent = tipo;
    filtroTipoAlertas.appendChild(opcao);
  });

  filtroTipoAlertas.value = tipos.includes(valorAtual) ? valorAtual : "";
}

function alertaDentroDosFiltros(alerta) {
  const termo = normalizarTexto(buscaAlertas?.value || "");
  const tipo = filtroTipoAlertas?.value || "";
  const gravidade = filtroGravidadeAlertas?.value || "";
  const status = filtroStatusAlertas?.value || "";

  if (termo && !alerta.busca.includes(termo)) {
    return false;
  }

  if (tipo && alerta.tipo !== tipo) {
    return false;
  }

  if (gravidade && alerta.gravidade !== gravidade) {
    return false;
  }

  if (status && alerta.status !== status) {
    return false;
  }

  return true;
}

function obterClasseGravidade(gravidade) {
  const classes = {
    critico: "status-badge status-badge--empty",
    atencao: "status-badge status-badge--warning",
    info: "status-badge status-badge--stock",
    ok: "status-badge status-badge--sold"
  };

  return classes[gravidade] || "status-badge";
}

function formatarGravidade(gravidade) {
  const nomes = {
    critico: "Crítico",
    atencao: "Atenção",
    info: "Informação",
    ok: "OK"
  };

  return nomes[gravidade] || gravidade;
}

function renderizarResumo(alertas) {
  const criticos = alertas.filter(alerta => alerta.gravidade === "critico").length;
  const atencao = alertas.filter(alerta => alerta.gravidade === "atencao").length;
  const info = alertas.filter(alerta => alerta.gravidade === "info").length;
  const semEstoque = alertas.filter(alerta => alerta.tipo === "Sem estoque").length;
  const vendasSemCusto = alertas.filter(alerta => alerta.tipo === "Venda sem custo calculado").length;

  resumoAlertas.innerHTML =
    criarCard("Alertas críticos", formatarNumero(criticos), criticos > 0 ? "summary-card--loss" : "") +
    criarCard("Atenção", formatarNumero(atencao)) +
    criarCard("Informação", formatarNumero(info)) +
    criarCard("Sem estoque", formatarNumero(semEstoque), semEstoque > 0 ? "summary-card--loss" : "") +
    criarCard("Vendas sem custo", formatarNumero(vendasSemCusto)) +
    criarCard("Total", formatarNumero(alertas.length), alertas.length > 0 ? "" : "summary-card--profit");

  mensagemAlertas.textContent = alertasCarregados.length > 0 ? "" : "Nenhum ponto de atenção encontrado no momento.";
}

function renderizarTabela(alertas) {
  tabelaAlertas.innerHTML = "";

  if (alertas.length === 0) {
    mensagemAlertas.textContent = "Nenhum alerta encontrado para os filtros selecionados.";
    return;
  }

  mensagemAlertas.textContent = "";

  alertas.forEach(alerta => {
    const linha = document.createElement("tr");
    const acao = alerta.acaoHref
      ? `<a class="table-link" href="${escaparHtml(alerta.acaoHref)}">${escaparHtml(alerta.acaoTexto)}</a>`
      : "-";

    linha.innerHTML = `
      <td data-label="Tipo">${escaparHtml(alerta.tipo)}</td>
      <td data-label="Descrição">${escaparHtml(alerta.descricao)}</td>
      <td data-label="Entidade relacionada"><strong class="product-name">${escaparHtml(alerta.entidade)}</strong></td>
      <td data-label="Gravidade"><span class="${obterClasseGravidade(alerta.gravidade)}">${escaparHtml(formatarGravidade(alerta.gravidade))}</span></td>
      <td data-label="Ação">
        <div class="table-actions table-actions--single">${acao}</div>
      </td>
    `;

    tabelaAlertas.appendChild(linha);
  });
}

function renderizarAlertas() {
  preencherTipos(alertasCarregados);
  const filtrados = alertasCarregados.filter(alertaDentroDosFiltros);
  const prioridade = { critico: 1, atencao: 2, info: 3, ok: 4 };

  filtrados.sort((a, b) => prioridade[a.gravidade] - prioridade[b.gravidade] || a.tipo.localeCompare(b.tipo, "pt-BR"));
  renderizarResumo(filtrados);
  renderizarTabela(filtrados);
}

function definirPainelFiltrosAberto(aberto) {
  alertasShell?.classList.toggle("alerts-shell--filters-open", aberto);
  botaoAbrirFiltrosAlertas?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemAlertas.textContent = "Configure o Supabase para carregar os alertas.";
    return null;
  }

  try {
    const [pecas, vendas, entradasEstoque, consumosEstoque, origens] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarOrigens()
    ]);

    return {
      pecas: pecas || [],
      vendas: vendas || [],
      entradasEstoque: entradasEstoque || [],
      consumosEstoque: consumosEstoque || [],
      origens: origens || []
    };
  } catch (erro) {
    console.error("Erro ao carregar alertas:", erro);
    mensagemAlertas.textContent = "Não foi possível carregar os alertas do Supabase.";
    return null;
  }
}

async function iniciarAlertas() {
  const dados = await carregarDados();

  if (!dados) {
    resumoAlertas.innerHTML = "";
    tabelaAlertas.innerHTML = "";
    return;
  }

  alertasCarregados = [
    ...calcularAlertasPecas(dados),
    ...calcularAlertasLotes(dados.entradasEstoque),
    ...calcularAlertasVendas(dados),
    ...calcularAlertasOrigens(dados)
  ];
  renderizarAlertas();
}

buscaAlertas?.addEventListener("input", renderizarAlertas);

[filtroTipoAlertas, filtroGravidadeAlertas, filtroStatusAlertas].forEach(campo => {
  campo?.addEventListener("change", renderizarAlertas);
});

botaoAbrirFiltrosAlertas?.addEventListener("click", () => {
  definirPainelFiltrosAberto(!alertasShell?.classList.contains("alerts-shell--filters-open"));
});

botaoFecharFiltrosAlertas?.addEventListener("click", () => {
  definirPainelFiltrosAberto(false);
});

botaoAplicarFiltrosAlertas?.addEventListener("click", () => {
  renderizarAlertas();
  definirPainelFiltrosAberto(false);
});

botaoLimparFiltrosAlertas?.addEventListener("click", () => {
  if (buscaAlertas) {
    buscaAlertas.value = "";
  }
  if (filtroTipoAlertas) {
    filtroTipoAlertas.value = "";
  }
  if (filtroGravidadeAlertas) {
    filtroGravidadeAlertas.value = "";
  }
  if (filtroStatusAlertas) {
    filtroStatusAlertas.value = "";
  }
  renderizarAlertas();
});

document.addEventListener("DOMContentLoaded", iniciarAlertas);
