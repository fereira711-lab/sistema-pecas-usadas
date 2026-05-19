const mensagemAnaliseCustos = document.getElementById("mensagemAnaliseCustos");
const resumoAnaliseCustos = document.getElementById("resumoAnaliseCustos");
const tabelaAnaliseCustos = document.getElementById("tabelaAnaliseCustos");
const buscaAnaliseCustos = document.getElementById("buscaAnaliseCustos");
const analiseCustosShell = document.getElementById("analiseCustosShell");
const botaoAbrirFiltrosAnaliseCustos = document.getElementById("botaoAbrirFiltrosAnaliseCustos");
const botaoFecharFiltrosAnaliseCustos = document.getElementById("botaoFecharFiltrosAnaliseCustos");
const botaoLimparFiltrosAnaliseCustos = document.getElementById("botaoLimparFiltrosAnaliseCustos");
const botaoAplicarFiltrosAnaliseCustos = document.getElementById("botaoAplicarFiltrosAnaliseCustos");
const periodoRapidoAnaliseCustos = document.getElementById("periodoRapidoAnaliseCustos");
const dataInicialAnaliseCustos = document.getElementById("dataInicialAnaliseCustos");
const dataFinalAnaliseCustos = document.getElementById("dataFinalAnaliseCustos");
const filtroTipoAnaliseCustos = document.getElementById("filtroTipoAnaliseCustos");
const filtroCategoriaAnaliseCustos = document.getElementById("filtroCategoriaAnaliseCustos");
const filtroOrigemAnaliseCustos = document.getElementById("filtroOrigemAnaliseCustos");
const quantidadeAnaliseCustos = document.getElementById("quantidadeAnaliseCustos");

let dadosAnaliseCustos = {
  custosPeca: [],
  custosVenda: [],
  pecas: [],
  vendas: []
};
let tipoExpandidoChave = null;

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
  return Number(valor || 0).toLocaleString("pt-BR");
}

function formatarPercentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarNomeTipoCusto(valor) {
  const texto = String(valor || "Sem tipo").trim().replace(/\s+/g, " ");

  if (!texto) {
    return "Sem tipo";
  }

  return texto
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\S/g, letra => letra.toLocaleUpperCase("pt-BR"));
}

function obterChaveTipoCusto(valor) {
  return normalizarTexto(valor || "Sem tipo");
}

function obterDataCusto(custo) {
  return String(custo.dataCusto || custo.data || custo.data_custo || "").slice(0, 10);
}

function formatarSku(peca) {
  return String(peca?.sku || peca?.codigo || peca?.codigo_peca || peca?.cod || "").trim() || "-";
}

function formatarNomePeca(peca) {
  return peca?.nome || peca?.nome_peca || peca?.nomeProduto || peca?.produtoNome || peca?.descricao || `Peça ${peca?.id || ""}`.trim();
}

function somar(lista, campo = "valor") {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function criarCard(titulo, valor) {
  return `
    <article class="summary-card">
      <span>${titulo}</span>
      <strong>${valor}</strong>
    </article>
  `;
}

function definirPeriodoPadrao() {
  if (periodoRapidoAnaliseCustos) {
    periodoRapidoAnaliseCustos.value = "todos";
  }

  dataInicialAnaliseCustos.value = "";
  dataFinalAnaliseCustos.value = "";
}

function aplicarPeriodoRapido() {
  if (!periodoRapidoAnaliseCustos || periodoRapidoAnaliseCustos.value === "personalizado") {
    return;
  }

  if (periodoRapidoAnaliseCustos.value === "todos") {
    dataInicialAnaliseCustos.value = "";
    dataFinalAnaliseCustos.value = "";
    return;
  }

  const hoje = new Date();
  const fim = formatarDataInput(hoje);
  let inicio = "";

  if (periodoRapidoAnaliseCustos.value === "hoje") {
    inicio = fim;
  }

  if (periodoRapidoAnaliseCustos.value === "7") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 6);
    inicio = formatarDataInput(data);
  }

  if (periodoRapidoAnaliseCustos.value === "30") {
    const data = new Date(hoje);
    data.setDate(data.getDate() - 29);
    inicio = formatarDataInput(data);
  }

  if (periodoRapidoAnaliseCustos.value === "mes") {
    inicio = formatarDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  }

  dataInicialAnaliseCustos.value = inicio;
  dataFinalAnaliseCustos.value = fim;
}

function mapearPorId(lista) {
  return (lista || []).reduce((mapa, item) => {
    mapa[Number(item.id)] = item;
    return mapa;
  }, {});
}

function obterReferenciaCusto(custo, categoria, pecasPorId, vendasPorId) {
  if (categoria === "peca") {
    const peca = pecasPorId[Number(custo.pecaId || custo.peca_id || 0)] || {};

    return {
      texto: `${formatarSku(peca)} - ${formatarNomePeca(peca)}`,
      busca: `${formatarSku(peca)} ${formatarNomePeca(peca)}`,
      link: Number(peca.id) ? `detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}` : ""
    };
  }

  const venda = vendasPorId[Number(custo.vendaId || custo.venda_id || 0)] || {};
  const peca = pecasPorId[Number(venda.pecaId || venda.peca_id || 0)] || {};
  const sku = formatarSku(peca) !== "-" ? formatarSku(peca) : String(venda.sku || "").trim() || "-";
  const nome = formatarNomePeca(peca) !== "Peça" ? formatarNomePeca(peca) : venda.produtoNome || venda.nome || `Venda ${custo.vendaId || "-"}`;

  return {
    texto: `Venda ${custo.vendaId || "-"} - ${sku} - ${nome}`,
    busca: `${sku} ${nome} ${custo.vendaId || ""}`,
    link: Number(custo.vendaId || 0) ? `detalhes-venda.html?vendaId=${encodeURIComponent(custo.vendaId)}` : ""
  };
}

function montarCustosDetalhados(dados) {
  const pecasPorId = mapearPorId(dados.pecas);
  const vendasPorId = mapearPorId(dados.vendas);
  const custosPeca = (dados.custosPeca || []).map(custo => {
    const referencia = obterReferenciaCusto(custo, "peca", pecasPorId, vendasPorId);
    const tipo = formatarNomeTipoCusto(custo.tipoCusto || custo.tipo);

    return {
      ...custo,
      categoria: "peca",
      categoriaTexto: "Peça",
      tipo,
      tipoChave: obterChaveTipoCusto(tipo),
      data: obterDataCusto(custo),
      referencia,
      observacao: custo.observacoes || custo.observacao || custo.descricao || "-"
    };
  });
  const custosVenda = (dados.custosVenda || []).map(custo => {
    const referencia = obterReferenciaCusto(custo, "venda", pecasPorId, vendasPorId);
    const tipo = formatarNomeTipoCusto(custo.tipoCusto || custo.tipo);

    return {
      ...custo,
      categoria: "venda",
      categoriaTexto: "Venda",
      tipo,
      tipoChave: obterChaveTipoCusto(tipo),
      data: obterDataCusto(custo),
      referencia,
      observacao: custo.observacoes || custo.observacao || custo.descricao || "-"
    };
  });

  return [...custosPeca, ...custosVenda].sort((a, b) => {
    if (a.data !== b.data) {
      return String(b.data || "").localeCompare(String(a.data || ""));
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function preencherTipos(custos) {
  if (!filtroTipoAnaliseCustos) {
    return;
  }

  const valorAtual = filtroTipoAnaliseCustos.value;
  const tipos = Array.from(new Map(custos.map(custo => [custo.tipoChave, custo.tipo])).values())
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  filtroTipoAnaliseCustos.innerHTML = '<option value="">Todos</option>';
  tipos.forEach(tipo => {
    const opcao = document.createElement("option");
    opcao.value = obterChaveTipoCusto(tipo);
    opcao.textContent = tipo;
    filtroTipoAnaliseCustos.appendChild(opcao);
  });

  filtroTipoAnaliseCustos.value = tipos.some(tipo => obterChaveTipoCusto(tipo) === valorAtual) ? valorAtual : "";
}

function custoDentroDosFiltros(custo) {
  const termo = normalizarTexto(buscaAnaliseCustos?.value || "");
  const inicio = dataInicialAnaliseCustos?.value || "";
  const fim = dataFinalAnaliseCustos?.value || "";
  const tipo = filtroTipoAnaliseCustos?.value || "";
  const categoria = filtroCategoriaAnaliseCustos?.value || "";
  const origem = filtroOrigemAnaliseCustos?.value || "";

  if (inicio && custo.data && custo.data < inicio) {
    return false;
  }

  if (fim && custo.data && custo.data > fim) {
    return false;
  }

  if (tipo && custo.tipoChave !== tipo) {
    return false;
  }

  if (categoria && custo.categoria !== categoria) {
    return false;
  }

  if (origem && custo.categoria !== origem) {
    return false;
  }

  if (!termo) {
    return true;
  }

  return normalizarTexto(`${custo.tipo} ${custo.categoriaTexto} ${custo.referencia.busca} ${custo.observacao}`).includes(termo);
}

function agruparCustosPorTipo(custos) {
  const mapa = new Map();
  const totalCustos = custos.reduce((total, custo) => total + Number(custo.valor || 0), 0);

  custos.forEach(custo => {
    if (!mapa.has(custo.tipoChave)) {
      mapa.set(custo.tipoChave, {
        tipoChave: custo.tipoChave,
        tipo: custo.tipo,
        totalCustosPeca: 0,
        totalCustosVenda: 0,
        totalGeral: 0,
        percentual: 0,
        quantidade: 0,
        custos: []
      });
    }

    const grupo = mapa.get(custo.tipoChave);
    const valor = Number(custo.valor || 0);

    if (custo.categoria === "peca") {
      grupo.totalCustosPeca += valor;
    }

    if (custo.categoria === "venda") {
      grupo.totalCustosVenda += valor;
    }

    grupo.totalGeral += valor;
    grupo.quantidade += 1;
    grupo.custos.push(custo);
  });

  return Array.from(mapa.values())
    .map(grupo => ({
      ...grupo,
      percentual: totalCustos > 0 ? (grupo.totalGeral / totalCustos) * 100 : 0,
      categoriaPrincipal: grupo.totalCustosPeca >= grupo.totalCustosVenda ? "Peça" : "Venda",
      origemPrincipal: grupo.totalCustosPeca >= grupo.totalCustosVenda ? "Custos da peça" : "Custos da venda"
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
    mensagemAnaliseCustos.textContent = "Configure o Supabase para carregar a análise de custos.";
    return null;
  }

  try {
    const [custosPeca, custosVenda, pecas, vendas] = await Promise.all([
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas()
    ]);

    mensagemAnaliseCustos.textContent = "";

    return {
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || [],
      pecas: pecas || [],
      vendas: vendas || []
    };
  } catch (erro) {
    console.error("Erro ao carregar análise de custos:", erro);
    mensagemAnaliseCustos.textContent = "Não foi possível carregar os dados da análise de custos.";
    return null;
  }
}

function renderizarResumo(custos, grupos) {
  const totalCustosPeca = custos.filter(custo => custo.categoria === "peca").reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const totalCustosVenda = custos.filter(custo => custo.categoria === "venda").reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const totalGeral = totalCustosPeca + totalCustosVenda;
  const maiorTipo = grupos[0]?.tipo || "-";

  resumoAnaliseCustos.innerHTML =
    criarCard("Total de custos", formatarMoeda(totalGeral)) +
    criarCard("Custos da peça", formatarMoeda(totalCustosPeca)) +
    criarCard("Custos da venda", formatarMoeda(totalCustosVenda)) +
    criarCard("Maior tipo", escaparHtml(maiorTipo)) +
    criarCard("Lançamentos", formatarNumero(custos.length));
}

function obterGruposVisiveis(grupos) {
  const quantidade = quantidadeAnaliseCustos?.value || "12";

  if (quantidade === "todos") {
    return grupos;
  }

  return grupos.slice(0, Number(quantidade || 12));
}

function listarReferenciasUnicas(custos, categoria) {
  const valores = custos
    .filter(custo => !categoria || custo.categoria === categoria)
    .map(custo => custo.referencia.texto)
    .filter(Boolean);

  return [...new Set(valores)].slice(0, 4);
}

function criarDetalhesGrupoHtml(grupo) {
  const ultimosLancamentos = grupo.custos.slice(0, 4)
    .map(custo => `${formatarData(custo.data)} - ${custo.referencia.texto} - ${formatarMoeda(custo.valor)}`)
    .join("; ") || "Nenhum lançamento encontrado.";
  const pecasRelacionadas = listarReferenciasUnicas(grupo.custos, "peca").join("; ") || "Nenhuma peça relacionada.";
  const vendasRelacionadas = listarReferenciasUnicas(grupo.custos, "venda").join("; ") || "Nenhuma venda relacionada.";
  const observacoes = grupo.custos
    .map(custo => custo.observacao)
    .filter(observacao => observacao && observacao !== "-")
    .slice(0, 3)
    .join("; ") || "Sem observações relevantes.";

  return `
    <section class="cost-analysis-detail-panel" aria-label="Detalhes do tipo ${escaparHtml(grupo.tipo)}">
      <div>
        <span class="piece-form-eyebrow">Últimos lançamentos</span>
        <p>${escaparHtml(ultimosLancamentos)}</p>
      </div>
      <div>
        <span class="piece-form-eyebrow">Peças relacionadas</span>
        <p>${escaparHtml(pecasRelacionadas)}</p>
      </div>
      <div>
        <span class="piece-form-eyebrow">Vendas relacionadas</span>
        <p>${escaparHtml(vendasRelacionadas)}</p>
      </div>
      <div>
        <span class="piece-form-eyebrow">Observações</span>
        <p>${escaparHtml(observacoes)}</p>
      </div>
    </section>
  `;
}

function renderizarTabelaGrupos(grupos) {
  tabelaAnaliseCustos.innerHTML = "";

  if (grupos.length === 0) {
    mensagemAnaliseCustos.textContent = "Nenhum custo encontrado para os filtros selecionados.";
    return;
  }

  mensagemAnaliseCustos.textContent = "";

  obterGruposVisiveis(grupos).forEach(grupo => {
    const expandido = tipoExpandidoChave === grupo.tipoChave;

    tabelaAnaliseCustos.insertAdjacentHTML("beforeend", `
      <article class="cost-analysis-row${expandido ? " cost-analysis-row--expanded" : ""}">
        <strong class="product-name" data-label="Tipo de custo">${escaparHtml(grupo.tipo)}</strong>
        <span data-label="Categoria"><span class="status-badge status-badge--stock">${escaparHtml(grupo.categoriaPrincipal)}</span></span>
        <span data-label="Qtd.">${formatarNumero(grupo.quantidade)}</span>
        <span data-label="Total"><strong>${formatarMoeda(grupo.totalGeral)}</strong></span>
        <span data-label="% do total">${formatarPercentual(grupo.percentual)}</span>
        <span data-label="Origem principal">${escaparHtml(grupo.origemPrincipal)}</span>
        <button type="button" class="button-secondary button-compact" data-acao="alternar-detalhes" data-tipo-chave="${escaparHtml(grupo.tipoChave)}">
          ${expandido ? "Ocultar" : "Detalhes"}
        </button>
      </article>
    `);

    if (expandido) {
      tabelaAnaliseCustos.insertAdjacentHTML("beforeend", criarDetalhesGrupoHtml(grupo));
    }
  });
}

function renderizarAnaliseCustos() {
  const custos = montarCustosDetalhados(dadosAnaliseCustos).filter(custoDentroDosFiltros);
  const grupos = agruparCustosPorTipo(custos);

  if (tipoExpandidoChave && !grupos.some(grupo => grupo.tipoChave === tipoExpandidoChave)) {
    tipoExpandidoChave = null;
  }

  renderizarResumo(custos, grupos);
  renderizarTabelaGrupos(grupos);
}

function definirPainelFiltrosAberto(aberto) {
  analiseCustosShell?.classList.toggle("cost-analysis-shell--filters-open", aberto);
  botaoAbrirFiltrosAnaliseCustos?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

async function iniciarAnaliseCustos() {
  definirPeriodoPadrao();
  const dados = await carregarDados();

  if (!dados) {
    resumoAnaliseCustos.innerHTML = "";
    tabelaAnaliseCustos.innerHTML = "";
    return;
  }

  dadosAnaliseCustos = dados;
  preencherTipos(montarCustosDetalhados(dadosAnaliseCustos));
  renderizarAnaliseCustos();
}

buscaAnaliseCustos?.addEventListener("input", renderizarAnaliseCustos);

botaoAbrirFiltrosAnaliseCustos?.addEventListener("click", () => {
  definirPainelFiltrosAberto(!analiseCustosShell?.classList.contains("cost-analysis-shell--filters-open"));
});

botaoFecharFiltrosAnaliseCustos?.addEventListener("click", () => {
  definirPainelFiltrosAberto(false);
});

botaoAplicarFiltrosAnaliseCustos?.addEventListener("click", () => {
  aplicarPeriodoRapido();
  renderizarAnaliseCustos();
  definirPainelFiltrosAberto(false);
});

botaoLimparFiltrosAnaliseCustos?.addEventListener("click", () => {
  definirPeriodoPadrao();
  if (buscaAnaliseCustos) {
    buscaAnaliseCustos.value = "";
  }
  if (filtroTipoAnaliseCustos) {
    filtroTipoAnaliseCustos.value = "";
  }
  if (filtroCategoriaAnaliseCustos) {
    filtroCategoriaAnaliseCustos.value = "";
  }
  if (filtroOrigemAnaliseCustos) {
    filtroOrigemAnaliseCustos.value = "";
  }
  renderizarAnaliseCustos();
});

periodoRapidoAnaliseCustos?.addEventListener("change", () => {
  aplicarPeriodoRapido();
  renderizarAnaliseCustos();
});

[dataInicialAnaliseCustos, dataFinalAnaliseCustos].forEach(campo => {
  campo?.addEventListener("change", () => {
    if (periodoRapidoAnaliseCustos) {
      periodoRapidoAnaliseCustos.value = "personalizado";
    }
    renderizarAnaliseCustos();
  });
});

[filtroTipoAnaliseCustos, filtroCategoriaAnaliseCustos, filtroOrigemAnaliseCustos, quantidadeAnaliseCustos].forEach(campo => {
  campo?.addEventListener("change", renderizarAnaliseCustos);
});

tabelaAnaliseCustos?.addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-acao='alternar-detalhes']");

  if (!botao) {
    return;
  }

  const tipoChave = botao.dataset.tipoChave || "";
  tipoExpandidoChave = tipoExpandidoChave === tipoChave ? null : tipoChave;
  renderizarAnaliseCustos();
});

document.addEventListener("DOMContentLoaded", iniciarAnaliseCustos);
