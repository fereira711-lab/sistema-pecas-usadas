// Produtos (redesenho, seção 7 da especificação): lista operacional com busca, filtro por origem,
// situação (em estoque, vendidas, paradas), preço, custo e margem prevista.
// Custo e margem vêm do financeiro-utils.js (sem custo médio); "parada" vem do alertas-regras.js.
const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagemProdutos = document.getElementById("mensagemProdutos");
const resumoProdutos = document.getElementById("resumoProdutos");
const campoBuscaProdutos = document.getElementById("buscaProdutos");
const filtroOrigemProdutos = document.getElementById("filtroOrigemProdutos");
const filtroSituacaoProdutos = document.getElementById("filtroSituacaoProdutos");
const paginacaoProdutos = document.getElementById("paginacaoProdutos");
const paginacaoTexto = document.getElementById("paginacaoTexto");
const botaoPaginaAnterior = document.getElementById("paginaAnterior");
const botaoPaginaProxima = document.getElementById("paginaProxima");
const campoImagemProdutoExistente = document.getElementById("imagemProdutoExistente");

const ITENS_POR_PAGINA = 20;

let dadosProdutos = { pecas: [], origens: [], entradas: [], vendas: [], consumos: [], custosPeca: [] };
let linhasProdutos = [];
let situacaoSelecionada = "todas";
let paginaAtual = 1;
let pecaSelecionadaParaImagem = null;

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
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarPercentualInteiro(valor) {
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 0);
  return `${Math.round(Number(valor || 0))}%`;
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function plural(quantidade, singular, pluralTexto) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`;
}

function normalizarPeca(peca) {
  return {
    ...peca,
    id: Number(peca.id),
    nome: peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peça ${peca.id}`,
    sku: peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "",
    origemId: Number(peca.origemId || peca.origem_id || 0),
    imagemUrl: peca.imagemUrl || peca.imagem_url || "",
    precoVenda: Number(peca.precoVenda || peca.preco_venda || peca.valorVenda || peca.valor_venda || peca.preco_sugerido || 0),
    compatibilidade: peca.compatibilidade || ""
  };
}

// ---- Carga ----

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemProdutos.textContent = "Configure o Supabase para carregar a lista de peças.";
    return null;
  }

  try {
    const [pecas, origens, entradas, vendas, consumos, custosPeca] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarCustosPeca()
    ]);

    mensagemProdutos.textContent = "";

    return {
      pecas: (pecas || []).map(normalizarPeca),
      origens: origens || [],
      entradas: entradas || [],
      vendas: vendas || [],
      consumos: consumos || [],
      custosPeca: custosPeca || []
    };
  } catch (erro) {
    console.error("Erro ao carregar produtos do Supabase:", erro);
    mensagemProdutos.textContent = "Não foi possível carregar os dados do Supabase.";
    return null;
  }
}

// ---- Montagem das linhas ----

function calcularSaldoPeca(pecaId) {
  return dadosProdutos.entradas
    .filter(entrada => Number(entrada.pecaId) === Number(pecaId))
    .reduce((total, entrada) => total + Math.max(0, Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0)), 0);
}

function obterUltimaVendaDaPeca(pecaId) {
  return dadosProdutos.vendas
    .filter(venda => Number(venda.pecaId) === Number(pecaId))
    .sort((a, b) => String(b.dataVenda || "").localeCompare(String(a.dataVenda || "")) || Number(b.id) - Number(a.id))[0] || null;
}

function obterDataMaisRecente(pecaId) {
  const datas = [
    ...dadosProdutos.entradas.filter(entrada => Number(entrada.pecaId) === Number(pecaId)).map(entrada => entrada.dataEntrada || entrada.createdAt),
    ...dadosProdutos.vendas.filter(venda => Number(venda.pecaId) === Number(pecaId)).map(venda => venda.dataVenda)
  ].map(data => String(data || "").slice(0, 10)).filter(Boolean);

  return datas.sort().pop() || "";
}

function montarLinhas() {
  const financeiro = window.financeiroUtils;
  const origemPorId = new Map(dadosProdutos.origens.map(origem => [Number(origem.id), origem]));
  const paradas = new Map(
    (window.alertasRegras?.calcularPecasParadas({
      pecas: dadosProdutos.pecas,
      vendas: dadosProdutos.vendas,
      entradasEstoque: dadosProdutos.entradas
    }) || []).map(item => [Number(item.peca.id), item])
  );

  return dadosProdutos.pecas.map(peca => {
    const saldo = calcularSaldoPeca(peca.id);
    const temEntrada = dadosProdutos.entradas.some(entrada => Number(entrada.pecaId) === peca.id);
    const custo = financeiro ? financeiro.calcularCustoReferenciaPeca(peca.id, dadosProdutos.entradas, dadosProdutos.consumos, dadosProdutos.custosPeca) : { calculado: false, valor: null };
    const margem = financeiro && custo.calculado ? financeiro.calcularMargemPreco(peca.precoVenda, custo.valor) : null;
    const parada = paradas.get(peca.id) || null;
    const origem = origemPorId.get(peca.origemId) || null;

    let situacao;
    if (!temEntrada) situacao = "sem-entrada";
    else if (saldo <= 0) situacao = "vendida";
    else if (margem !== null && margem < 0) situacao = "abaixo-custo";
    else if (parada) situacao = "parada";
    else situacao = "estoque";

    return {
      peca, saldo, custo, margem, parada, origem, situacao,
      ultimaVenda: situacao === "vendida" ? obterUltimaVendaDaPeca(peca.id) : null,
      dataMaisRecente: obterDataMaisRecente(peca.id)
    };
  });
}

// ---- Filtros ----

// Cada palavra digitada precisa aparecer em algum campo (SKU, peça, veículo/origem ou compatibilidade),
// em qualquer ordem e sem diferenciar acentos: "modulo injecao" encontra "Módulo de injeção".
function linhaCombinaComBusca(linha, termo) {
  if (!termo) return true;

  const texto = [linha.peca.sku, linha.peca.nome, linha.origem?.descricao, linha.origem?.codigoOrigem, linha.peca.compatibilidade]
    .map(normalizarTexto)
    .join(" ");

  return termo.split(/\s+/).every(palavra => texto.includes(palavra));
}

function linhaCombinaComSituacao(linha, situacao) {
  if (situacao === "estoque") return linha.saldo > 0;
  if (situacao === "vendidas") return linha.situacao === "vendida";
  // Uma peça parada com preço abaixo do custo mostra a pílula de preço, mas continua no filtro de paradas.
  if (situacao === "paradas") return Boolean(linha.parada);
  return true;
}

function obterLinhasFiltradas() {
  const termo = normalizarTexto(campoBuscaProdutos.value);
  const origemId = Number(filtroOrigemProdutos.value || 0);
  const antesDaSituacao = linhasProdutos.filter(linha =>
    linhaCombinaComBusca(linha, termo) && (!origemId || linha.peca.origemId === origemId));

  atualizarContagens(antesDaSituacao);

  return antesDaSituacao
    .filter(linha => linhaCombinaComSituacao(linha, situacaoSelecionada))
    // Mais recente primeiro: a última entrada ou a última venda da peça, o que for mais novo.
    .sort((a, b) => b.dataMaisRecente.localeCompare(a.dataMaisRecente) || b.peca.id - a.peca.id);
}

function atualizarContagens(linhas) {
  const contagens = {
    todas: linhas.length,
    estoque: linhas.filter(linha => linhaCombinaComSituacao(linha, "estoque")).length,
    vendidas: linhas.filter(linha => linhaCombinaComSituacao(linha, "vendidas")).length,
    paradas: linhas.filter(linha => linhaCombinaComSituacao(linha, "paradas")).length
  };

  filtroSituacaoProdutos.querySelectorAll("[data-contagem]").forEach(elemento => {
    elemento.textContent = formatarNumero(contagens[elemento.dataset.contagem]);
  });
}

function renderizarFiltroOrigens() {
  const valorAtual = filtroOrigemProdutos.value;
  filtroOrigemProdutos.innerHTML = '<option value="">Todas as origens</option>' + dadosProdutos.origens
    .slice()
    .sort((a, b) => String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR"))
    .map(origem => `<option value="${origem.id}">${escaparHtml(origem.descricao || origem.codigoOrigem || `Origem ${origem.id}`)}</option>`)
    .join("");
  filtroOrigemProdutos.value = valorAtual;
}

// ---- Renderização ----

function renderizarMiniatura(peca) {
  const imagemUrl = String(peca.imagemUrl || "").trim();

  return imagemUrl
    ? `<span class="thumb"><img src="${escaparHtml(imagemUrl)}" alt="" loading="lazy"></span>`
    : `<span class="thumb" aria-hidden="true"><i class="ri-image-line"></i></span>`;
}

function renderizarSituacao(linha) {
  if (linha.situacao === "vendida") return '<span class="pill pill--neutral">Vendida</span>';
  if (linha.situacao === "parada") return `<span class="pill pill--warning">Parada há ${formatarNumero(linha.parada.dias)} dias</span>`;
  if (linha.situacao === "sem-entrada") return '<span class="pill pill--neutral">Sem entrada</span>';
  if (linha.situacao === "abaixo-custo") return '<span class="pill pill--warning">Preço abaixo do custo</span>';
  return '<span class="pill pill--success">Em estoque</span>';
}

function renderizarAcoes(linha) {
  const { peca } = linha;
  const principal = linha.saldo > 0
    ? `<a class="btn btn--secondary btn--compact produtos-acao-principal" href="cadastro-venda.html?pecaId=${encodeURIComponent(peca.id)}">Vender</a>`
    : linha.ultimaVenda
      ? `<a class="btn btn--secondary btn--compact produtos-acao-principal" href="detalhes-venda.html?vendaId=${encodeURIComponent(linha.ultimaVenda.id)}">Ver venda</a>`
      : "";

  return `
    <div class="row-actions">
      ${principal}
      <details class="action-menu">
        <summary class="btn btn--icon btn--compact" aria-label="Mais ações para ${escaparHtml(peca.nome)}">
          <i class="ri-more-2-fill" aria-hidden="true"></i>
        </summary>
        <div class="action-menu__list">
          ${peca.precoVenda > 0 ? "" : `<a class="action-menu__item" href="detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}&editar=1&campo=preco">Definir preço</a>`}
          <a class="action-menu__item" href="detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}">Ver detalhes</a>
          <a class="action-menu__item" href="cadastro-custo.html?pecaId=${encodeURIComponent(peca.id)}">Lançar custo</a>
          ${peca.origemId ? `<a class="action-menu__item" href="detalhes-origem.html?origemId=${encodeURIComponent(peca.origemId)}">Ver origem</a>` : ""}
          <button type="button" class="action-menu__item" data-acao="imagem" data-peca-id="${peca.id}">Trocar imagem</button>
          <div class="action-menu__divider"></div>
          <a class="action-menu__item action-menu__item--danger" href="detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}#excluir">Excluir peça</a>
        </div>
      </details>
    </div>
  `;
}

function renderizarLinha(linha) {
  const { peca, custo, margem, saldo } = linha;
  const preco = peca.precoVenda > 0 ? formatarMoeda(peca.precoVenda) : "Sem preço";
  const textoCusto = custo.calculado ? formatarMoeda(custo.valor) : "—";
  const textoMargem = margem === null ? "—" : formatarPercentualInteiro(margem);
  const classeMargem = margem !== null && margem < 0 ? " text-danger" : "";

  return `
    <tr>
      <td data-label="Peça">
        <div class="item-cell">
          ${renderizarMiniatura(peca)}
          <div class="item-cell__text">
            <a class="item-cell__name" href="detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}">${escaparHtml(peca.nome)}</a>
            ${peca.sku ? `<span class="mono">${escaparHtml(peca.sku)}</span>` : ""}
          </div>
        </div>
      </td>
      <td class="cell-origem" data-label="Origem">${escaparHtml(linha.origem?.descricao || "—")}</td>
      <td class="num${peca.precoVenda > 0 ? " cell-preco" : " text-warning"}" data-label="Preço">${escaparHtml(preco)}</td>
      <td class="num cell-muted" data-label="Custo">${escaparHtml(textoCusto)}</td>
      <td class="num${classeMargem}" data-label="Margem">${escaparHtml(textoMargem)}</td>
      <td class="cell-estoque" data-label="Estoque">${saldo > 0 ? `${formatarNumero(saldo)} un.` : "—"}</td>
      <td data-label="Situação">${renderizarSituacao(linha)}</td>
      <td class="cell-acoes">${renderizarAcoes(linha)}</td>
    </tr>
  `;
}

function renderizarResumo() {
  const total = linhasProdutos.length;
  const emEstoque = linhasProdutos.filter(linha => linha.saldo > 0).length;
  resumoProdutos.textContent = total
    ? `${plural(total, "peça cadastrada", "peças cadastradas")} · ${formatarNumero(emEstoque)} em estoque`
    : "Nenhuma peça cadastrada";
}

function renderizarProdutos() {
  const linhas = obterLinhasFiltradas();
  const totalPaginas = Math.max(1, Math.ceil(linhas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = linhas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (linhas.length === 0) {
    const vazio = linhasProdutos.length === 0
      ? "Nenhuma peça cadastrada ainda."
      : "Nenhuma peça encontrada para esta busca ou filtro.";
    tabelaProdutos.innerHTML = `<tr class="data-table__empty"><td colspan="8">${vazio}</td></tr>`;
    paginacaoProdutos.hidden = true;
    return;
  }

  tabelaProdutos.innerHTML = pagina.map(renderizarLinha).join("");
  paginacaoProdutos.hidden = false;
  paginacaoTexto.textContent = `Mostrando ${formatarNumero(inicio + 1)}–${formatarNumero(inicio + pagina.length)} de ${formatarNumero(linhas.length)}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

function selecionarSituacao(situacao) {
  situacaoSelecionada = situacao;
  filtroSituacaoProdutos.querySelectorAll("[data-situacao]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.situacao === situacao));
  });
  paginaAtual = 1;
  renderizarProdutos();
}

// ---- Trocar imagem (mesmo fluxo de antes: envia ao Storage e grava a url na peça) ----

function pedirImagemProduto(pecaId) {
  const peca = dadosProdutos.pecas.find(item => item.id === Number(pecaId));

  if (!peca) {
    mensagemProdutos.textContent = "Não foi possível encontrar a peça selecionada.";
    return;
  }

  pecaSelecionadaParaImagem = peca;
  campoImagemProdutoExistente.value = "";
  campoImagemProdutoExistente.click();
}

async function salvarImagemProdutoExistente(arquivo) {
  if (!arquivo.type.startsWith("image/")) {
    mensagemProdutos.textContent = "Selecione um arquivo de imagem válido.";
    return;
  }

  if (!pecaSelecionadaParaImagem) {
    return;
  }

  mensagemProdutos.textContent = "Enviando imagem da peça…";

  try {
    const imagemUrl = await window.supabaseService.uploadImagemPeca(arquivo, pecaSelecionadaParaImagem);
    const pecaAtualizada = await window.supabaseService.atualizarPeca({ ...pecaSelecionadaParaImagem, imagemUrl });

    dadosProdutos.pecas = dadosProdutos.pecas.map(peca => (peca.id === Number(pecaAtualizada.id) ? normalizarPeca(pecaAtualizada) : peca));
    linhasProdutos = montarLinhas();
    renderizarProdutos();
    mensagemProdutos.textContent = "";
  } catch (erro) {
    console.error("Erro ao atualizar imagem da peça:", erro);
    mensagemProdutos.textContent = "Não foi possível atualizar a imagem da peça.";
  } finally {
    pecaSelecionadaParaImagem = null;
    campoImagemProdutoExistente.value = "";
  }
}

function fecharMenus(exceto = null) {
  document.querySelectorAll(".action-menu[open]").forEach(menu => {
    if (menu !== exceto) menu.removeAttribute("open");
  });
}

// ---- Início ----

async function inicializarProdutos() {
  const dados = await carregarDados();

  if (!dados) {
    resumoProdutos.textContent = "";
    return;
  }

  dadosProdutos = dados;
  linhasProdutos = montarLinhas();
  renderizarFiltroOrigens();
  aplicarFiltrosDaUrl();
  renderizarResumo();
  renderizarProdutos();
}

// Links de outras telas podem abrir a lista já filtrada: ?origemId=21&situacao=estoque (ex.: "Ver todas" em Detalhes da origem).
function aplicarFiltrosDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  const origemId = parametros.get("origemId");
  const situacao = parametros.get("situacao");

  if (origemId && filtroOrigemProdutos.querySelector(`option[value="${CSS.escape(origemId)}"]`)) {
    filtroOrigemProdutos.value = origemId;
  }

  if (situacao && filtroSituacaoProdutos.querySelector(`[data-situacao="${CSS.escape(situacao)}"]`)) {
    situacaoSelecionada = situacao;
    filtroSituacaoProdutos.querySelectorAll("[data-situacao]").forEach(botao => {
      botao.setAttribute("aria-pressed", String(botao.dataset.situacao === situacao));
    });
  }
}

campoBuscaProdutos?.addEventListener("input", () => {
  paginaAtual = 1;
  renderizarProdutos();
});

filtroOrigemProdutos?.addEventListener("change", () => {
  paginaAtual = 1;
  renderizarProdutos();
});

filtroSituacaoProdutos?.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-situacao]");
  if (botao) selecionarSituacao(botao.dataset.situacao);
});

botaoPaginaAnterior?.addEventListener("click", () => {
  paginaAtual -= 1;
  renderizarProdutos();
});

botaoPaginaProxima?.addEventListener("click", () => {
  paginaAtual += 1;
  renderizarProdutos();
});

tabelaProdutos?.addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-acao='imagem']");
  if (botao) {
    fecharMenus();
    pedirImagemProduto(botao.dataset.pecaId);
  }
});

// Só um menu "⋯" aberto por vez; clicar fora ou apertar Esc fecha.
document.addEventListener("toggle", evento => {
  if (evento.target.matches?.(".action-menu") && evento.target.open) fecharMenus(evento.target);
}, true);

document.addEventListener("click", evento => {
  if (!evento.target.closest(".action-menu")) fecharMenus();
});

document.addEventListener("keydown", evento => {
  if (evento.key === "Escape") fecharMenus();
});

campoImagemProdutoExistente?.addEventListener("change", evento => {
  const arquivo = evento.target.files?.[0];
  if (arquivo) salvarImagemProdutoExistente(arquivo);
});

document.addEventListener("DOMContentLoaded", inicializarProdutos);
