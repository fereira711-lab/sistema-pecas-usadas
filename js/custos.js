// Custo de peça (redesenho): lança, edita e exclui custos ligados a uma peça (limpeza, pintura, conserto...).
// Os custos entram no lucro das vendas e no resultado da origem pelo financeiro-utils; esta tela não calcula resultado.
const ITENS_POR_PAGINA = 20;
const MAXIMO_SUGESTOES = 8;
const TIPO_LEGADO = "legado";

const formCusto = document.getElementById("formCusto");
const mensagemCusto = document.getElementById("mensagemCusto");
const linkVoltarCusto = document.getElementById("linkVoltarCusto");
const textoVoltarCusto = document.getElementById("textoVoltarCusto");
const campoBuscaPeca = document.getElementById("campoBuscaPecaCusto");
const buscaPecaCusto = document.getElementById("buscaPecaCusto");
const sugestoesPecaCusto = document.getElementById("sugestoesPecaCusto");
const cartaoPecaCusto = document.getElementById("cartaoPecaCusto");
const selectTipoCusto = document.getElementById("tipoCusto");
const campoValorCusto = document.getElementById("valorCusto");
const campoDataCusto = document.getElementById("dataCusto");
const campoDescricaoCusto = document.getElementById("descricaoCusto");
const campoObservacoesCusto = document.getElementById("observacoesCusto");
const botaoSalvarCusto = document.getElementById("botaoSalvarCusto");
const botaoCancelarCusto = document.getElementById("botaoCancelarCusto");
const resumoPecaCusto = document.getElementById("resumoPecaCusto");
const rotuloJaLancados = document.getElementById("rotuloJaLancados");
const resumoJaLancados = document.getElementById("resumoJaLancados");
const rotuloEsteCusto = document.getElementById("rotuloEsteCusto");
const resumoEsteCusto = document.getElementById("resumoEsteCusto");
const resumoTotalCustos = document.getElementById("resumoTotalCustos");
const contadorCustos = document.getElementById("contadorCustos");
const buscaCustosLista = document.getElementById("buscaCustosLista");
const filtroTipoCustoLista = document.getElementById("filtroTipoCustoLista");
const dataInicialCustos = document.getElementById("dataInicialCustos");
const dataFinalCustos = document.getElementById("dataFinalCustos");
const tabelaCustos = document.getElementById("tabelaCustos");
const paginacaoCustos = document.getElementById("paginacaoCustos");
const paginacaoTextoCustos = document.getElementById("paginacaoTextoCustos");
const botaoPaginaAnterior = document.getElementById("paginaAnteriorCustos");
const botaoPaginaProxima = document.getElementById("paginaProximaCustos");

let pecasCusto = [];
let origensCusto = [];
let entradasCusto = [];
let custosCusto = [];
let tiposCusto = [];
let pecaSelecionada = null;
let custoEmEdicao = null;
let sugestoesAtuais = [];
let indiceSugestao = -1;
let paginaAtual = 1;

// ---- Formatação ----

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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function lerMoeda(texto) {
  const valor = String(texto || "").trim();
  if (!valor) return null;
  const numero = window.moedaUtils?.parseMoedaBR ? window.moedaUtils.parseMoedaBR(valor) : Number(valor.replace(",", "."));
  return Number.isFinite(numero) ? numero : NaN;
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function obterDataLocalHoje() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

function mostrarMensagem(html, sucesso = false) {
  mensagemCusto.innerHTML = html;
  mensagemCusto.classList.toggle("page-message--success", sucesso);
}

// ---- Dados da peça ----

function calcularSaldo(pecaId) {
  return entradasCusto
    .filter(entrada => Number(entrada.pecaId) === Number(pecaId))
    .reduce((total, entrada) => total + Math.max(0, Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0)), 0);
}

function obterOrigem(peca) {
  return origensCusto.find(origem => Number(origem.id) === Number(peca?.origemId)) || null;
}

function obterPeca(pecaId) {
  return pecasCusto.find(peca => Number(peca.id) === Number(pecaId)) || null;
}

function custosDaPeca(pecaId) {
  return custosCusto.filter(custo => Number(custo.pecaId) === Number(pecaId));
}

// ---- Busca e cartão da peça ----

function textoBuscaPeca(peca) {
  return normalizarTexto([peca.sku, peca.nome, peca.compatibilidade, obterOrigem(peca)?.descricao].join(" "));
}

function buscarPecas(termo) {
  const palavras = normalizarTexto(termo).split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];

  return pecasCusto
    .filter(peca => palavras.every(palavra => textoBuscaPeca(peca).includes(palavra)))
    .sort((a, b) => Number(calcularSaldo(b.id) > 0) - Number(calcularSaldo(a.id) > 0))
    .slice(0, MAXIMO_SUGESTOES);
}

function fecharSugestoes() {
  sugestoesPecaCusto.hidden = true;
  sugestoesPecaCusto.innerHTML = "";
  buscaPecaCusto.setAttribute("aria-expanded", "false");
  buscaPecaCusto.removeAttribute("aria-activedescendant");
  sugestoesAtuais = [];
  indiceSugestao = -1;
}

// Custo de peça só entra em peça com estoque (regra da tela antiga, mantida).
function renderizarSugestoes() {
  sugestoesAtuais = buscarPecas(buscaPecaCusto.value);

  if (!String(buscaPecaCusto.value || "").trim()) {
    fecharSugestoes();
    return;
  }

  indiceSugestao = sugestoesAtuais.findIndex(peca => calcularSaldo(peca.id) > 0);
  sugestoesPecaCusto.innerHTML = sugestoesAtuais.length
    ? sugestoesAtuais.map((peca, indice) => {
      const saldo = calcularSaldo(peca.id);
      const origem = obterOrigem(peca);
      return `
        <button type="button" role="option" id="sugestao-custo-${peca.id}" class="custo-busca__opcao${indice === indiceSugestao ? " is-active" : ""}"
          data-indice="${indice}" aria-selected="${indice === indiceSugestao}" ${saldo > 0 ? "" : "disabled"}>
          <span class="custo-busca__nome">${escaparHtml(peca.nome)} <span class="mono">${escaparHtml(peca.sku || "")}</span></span>
          <span class="custo-busca__meta">${escaparHtml(origem?.descricao || "")}${origem ? " · " : ""}${saldo > 0 ? `${saldo} un.` : "Sem estoque"}</span>
        </button>`;
    }).join("")
    : '<p class="custo-busca__vazio">Nenhuma peça encontrada.</p>';

  sugestoesPecaCusto.hidden = false;
  buscaPecaCusto.setAttribute("aria-expanded", "true");
  atualizarDestaqueSugestao();
}

function atualizarDestaqueSugestao() {
  sugestoesPecaCusto.querySelectorAll(".custo-busca__opcao").forEach(opcao => {
    const ativa = Number(opcao.dataset.indice) === indiceSugestao;
    opcao.classList.toggle("is-active", ativa);
    opcao.setAttribute("aria-selected", String(ativa));
    if (ativa) buscaPecaCusto.setAttribute("aria-activedescendant", opcao.id);
  });
}

function moverDestaque(direcao) {
  const disponiveis = sugestoesAtuais.map((peca, indice) => (calcularSaldo(peca.id) > 0 ? indice : -1)).filter(indice => indice >= 0);
  if (!disponiveis.length) return;
  const posicao = disponiveis.indexOf(indiceSugestao);
  indiceSugestao = disponiveis[posicao < 0 ? 0 : (posicao + direcao + disponiveis.length) % disponiveis.length];
  atualizarDestaqueSugestao();
}

function renderizarCartaoPeca() {
  if (!pecaSelecionada) {
    cartaoPecaCusto.hidden = true;
    cartaoPecaCusto.innerHTML = "";
    campoBuscaPeca.hidden = false;
    return;
  }

  const peca = pecaSelecionada;
  const saldo = calcularSaldo(peca.id);
  const origem = obterOrigem(peca);
  const imagem = String(peca.imagemUrl || "").trim();

  cartaoPecaCusto.innerHTML = `
    <span class="thumb custo-peca__foto">${imagem ? `<img src="${escaparHtml(imagem)}" alt="">` : '<i class="ri-image-line" aria-hidden="true"></i>'}</span>
    <div class="custo-peca__texto">
      <a class="custo-peca__nome" href="detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}">${escaparHtml(peca.nome)}</a>
      <span class="custo-peca__meta"><span class="mono">${escaparHtml(peca.sku || "")}</span>${origem ? ` · ${escaparHtml(origem.descricao || origem.codigoOrigem)}` : ""} · ${saldo} un. em estoque</span>
    </div>
    ${custoEmEdicao ? "" : '<button type="button" class="btn btn--quiet btn--compact" id="botaoTrocarPecaCusto">Trocar peça</button>'}
  `;
  cartaoPecaCusto.hidden = false;
  campoBuscaPeca.hidden = true;
}

function selecionarPeca(peca, { focar = true } = {}) {
  pecaSelecionada = peca;
  fecharSugestoes();
  buscaPecaCusto.value = "";
  renderizarCartaoPeca();
  atualizarResumo();
  paginaAtual = 1;
  renderizarLista();
  if (focar) selectTipoCusto.focus();
}

function trocarPeca() {
  pecaSelecionada = null;
  renderizarCartaoPeca();
  atualizarResumo();
  paginaAtual = 1;
  renderizarLista();
  buscaPecaCusto.focus();
}

// ---- Tipos de custo (Peça ou Ambos, ativos; um tipo antigo só aparece ao editar um custo que o usa) ----

function renderizarTipos(custo = null) {
  const opcoes = ['<option value="">Selecione o tipo</option>'];
  tiposCusto
    .slice()
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"))
    .forEach(tipo => opcoes.push(`<option value="${tipo.id}">${escaparHtml(tipo.nome)}</option>`));

  let valor = "";
  if (custo) {
    const ativo = tiposCusto.some(tipo => Number(tipo.id) === Number(custo.tipoCustoId));
    if (custo.tipoCustoId && ativo) {
      valor = String(custo.tipoCustoId);
    } else if (custo.tipoCustoId) {
      opcoes.push(`<option value="${custo.tipoCustoId}">${escaparHtml(custo.tipoCusto || "Tipo")} (inativo)</option>`);
      valor = String(custo.tipoCustoId);
    } else if (custo.tipoCusto) {
      opcoes.push(`<option value="${TIPO_LEGADO}">${escaparHtml(custo.tipoCusto)}</option>`);
      valor = TIPO_LEGADO;
    }
  }

  selectTipoCusto.innerHTML = opcoes.join("");
  selectTipoCusto.value = valor;
}

function obterTipoEscolhido() {
  const valor = selectTipoCusto.value;
  if (!valor) return null;
  if (valor === TIPO_LEGADO) return { id: null, nome: custoEmEdicao?.tipoCusto || "" };
  const opcao = selectTipoCusto.selectedOptions[0];
  const tipo = tiposCusto.find(item => Number(item.id) === Number(valor));
  return { id: Number(valor), nome: tipo ? tipo.nome : String(custoEmEdicao?.tipoCusto || opcao?.textContent || "") };
}

// ---- Resumo lateral ----

function atualizarResumo() {
  const valorDigitado = lerMoeda(campoValorCusto.value);
  const valor = Number.isFinite(valorDigitado) && valorDigitado > 0 ? valorDigitado : 0;

  if (!pecaSelecionada) {
    resumoPecaCusto.textContent = "—";
    rotuloJaLancados.textContent = "Já lançados";
    resumoJaLancados.textContent = "—";
    resumoEsteCusto.textContent = valor ? formatarMoeda(valor) : "—";
    resumoTotalCustos.textContent = "—";
    return;
  }

  // Na edição, o custo editado sai de "já lançados" e entra como "este custo" com o valor novo.
  const outros = custosDaPeca(pecaSelecionada.id).filter(custo => !custoEmEdicao || Number(custo.id) !== Number(custoEmEdicao.id));
  const totalOutros = outros.reduce((total, custo) => total + Number(custo.valor || 0), 0);

  resumoPecaCusto.textContent = pecaSelecionada.nome;
  rotuloJaLancados.textContent = outros.length ? `Já lançados (${outros.length})` : "Já lançados";
  resumoJaLancados.textContent = formatarMoeda(totalOutros);
  rotuloEsteCusto.textContent = custoEmEdicao ? "Este custo (editando)" : "Este custo";
  resumoEsteCusto.textContent = formatarMoeda(valor);
  resumoTotalCustos.textContent = formatarMoeda(totalOutros + valor);
}

// ---- Formulário ----

function limparCamposCusto() {
  renderizarTipos();
  campoValorCusto.value = "";
  campoDescricaoCusto.value = "";
  campoObservacoesCusto.value = "";
  campoDataCusto.value = obterDataLocalHoje();
}

function sairDaEdicao() {
  custoEmEdicao = null;
  botaoSalvarCusto.textContent = "Salvar custo";
  botaoCancelarCusto.textContent = "Cancelar";
  limparCamposCusto();
  renderizarCartaoPeca();
  atualizarResumo();
  renderizarLista();
}

function editarCusto(custo) {
  const peca = obterPeca(custo.pecaId);
  custoEmEdicao = custo;
  pecaSelecionada = peca || { id: custo.pecaId, nome: `Peça ${custo.pecaId}`, sku: "" };
  renderizarTipos(custo);
  campoValorCusto.value = formatarMoeda(custo.valor);
  campoDataCusto.value = String(custo.dataCusto || custo.data || "").slice(0, 10);
  campoDescricaoCusto.value = custo.descricao || "";
  campoObservacoesCusto.value = custo.observacoes || "";
  botaoSalvarCusto.textContent = "Salvar alterações";
  botaoCancelarCusto.textContent = "Cancelar edição";
  mostrarMensagem("");
  renderizarCartaoPeca();
  atualizarResumo();
  renderizarLista();
  formCusto.scrollIntoView({ behavior: "smooth", block: "start" });
  selectTipoCusto.focus({ preventScroll: true });
}

function cancelar() {
  if (custoEmEdicao) {
    sairDaEdicao();
    return;
  }
  window.location.href = linkVoltarCusto.href;
}

function validarFormulario() {
  if (!pecaSelecionada) return "Escolha a peça.";
  if (!obterTipoEscolhido()) return "Escolha o tipo de custo.";
  const valor = lerMoeda(campoValorCusto.value);
  if (valor === null || !Number.isFinite(valor) || valor <= 0) return "Informe um valor maior que zero.";
  if (!campoDataCusto.value) return "Informe a data do custo.";
  if (!campoDescricaoCusto.value.trim()) return "Informe a descrição do custo.";
  return "";
}

async function salvarCusto(evento) {
  evento.preventDefault();

  const erro = validarFormulario();
  if (erro) {
    mostrarMensagem(escaparHtml(erro));
    return;
  }

  const tipo = obterTipoEscolhido();
  const valor = lerMoeda(campoValorCusto.value);
  const custo = {
    id: custoEmEdicao?.id,
    pecaId: Number(pecaSelecionada.id),
    tipo: tipo.nome,
    tipoCusto: tipo.nome,
    tipoCustoId: tipo.id,
    descricao: campoDescricaoCusto.value.trim(),
    observacoes: campoObservacoesCusto.value.trim(),
    valor,
    data: campoDataCusto.value,
    dataCusto: campoDataCusto.value
  };
  const editando = Boolean(custoEmEdicao);

  botaoSalvarCusto.disabled = true;
  try {
    if (editando) {
      await window.supabaseService.atualizarCustoPeca(custo);
    } else {
      await window.supabaseService.salvarCustoPeca(custo);
    }

    custosCusto = (await window.supabaseService.listarCustosPeca()) || [];
    const linkPeca = `<a href="detalhes-produto.html?pecaId=${encodeURIComponent(custo.pecaId)}">Ver peça</a>`;
    const texto = `Custo de ${formatarMoeda(valor)} ${editando ? "atualizado" : "lançado"} em ${escaparHtml(pecaSelecionada.nome)} · ${linkPeca}`;
    if (editando) {
      sairDaEdicao();
    } else {
      limparCamposCusto();
      atualizarResumo();
    }
    renderizarFiltroTipos();
    renderizarLista();
    mostrarMensagem(texto, true);
  } catch (erroSalvar) {
    console.error("Erro ao salvar custo da peça:", erroSalvar);
    mostrarMensagem("Não foi possível salvar o custo da peça.");
  } finally {
    botaoSalvarCusto.disabled = false;
  }
}

async function excluirCusto(custo) {
  const peca = obterPeca(custo.pecaId);
  const confirmar = window.confirm(`Excluir o custo de ${formatarMoeda(custo.valor)} (${custo.tipoCusto || "sem tipo"}) de ${peca?.nome || "esta peça"}?`);
  if (!confirmar) return;

  try {
    await window.supabaseService.excluirCustoPeca(custo.id);
    custosCusto = custosCusto.filter(item => Number(item.id) !== Number(custo.id));
    if (custoEmEdicao && Number(custoEmEdicao.id) === Number(custo.id)) sairDaEdicao();
    renderizarFiltroTipos();
    atualizarResumo();
    renderizarLista();
    mostrarMensagem("Custo excluído.", true);
  } catch (erroExcluir) {
    console.error("Erro ao excluir custo da peça:", erroExcluir);
    mostrarMensagem("Não foi possível excluir o custo da peça.");
  }
}

// ---- Lista de custos lançados ----

function montarLinhas() {
  return custosCusto
    .map(custo => {
      const peca = obterPeca(custo.pecaId);
      return {
        custo,
        data: String(custo.dataCusto || custo.data || "").slice(0, 10),
        nome: peca?.nome || `Peça ${custo.pecaId}`,
        sku: peca?.sku || "",
        tipo: custo.tipoCusto || custo.tipo || ""
      };
    })
    .sort((a, b) => b.data.localeCompare(a.data) || Number(b.custo.id) - Number(a.custo.id));
}

function filtrarLinhas(linhas) {
  const palavras = normalizarTexto(buscaCustosLista.value).split(/\s+/).filter(Boolean);
  const tipo = filtroTipoCustoLista.value;
  const inicio = dataInicialCustos.value;
  const fim = dataFinalCustos.value;

  return linhas.filter(linha => {
    const texto = normalizarTexto(`${linha.sku} ${linha.nome} ${linha.tipo} ${linha.custo.descricao} ${linha.custo.observacoes}`);
    return (!pecaSelecionada || Number(linha.custo.pecaId) === Number(pecaSelecionada.id)) &&
      palavras.every(palavra => texto.includes(palavra)) &&
      (!tipo || linha.tipo === tipo) &&
      (!inicio || (linha.data && linha.data >= inicio)) &&
      (!fim || (linha.data && linha.data <= fim));
  });
}

function renderizarFiltroTipos() {
  const atual = filtroTipoCustoLista.value;
  const tipos = [...new Set(custosCusto.map(custo => custo.tipoCusto || custo.tipo).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  filtroTipoCustoLista.innerHTML = '<option value="">Todos os tipos</option>' +
    tipos.map(tipo => `<option value="${escaparHtml(tipo)}">${escaparHtml(tipo)}</option>`).join("");
  filtroTipoCustoLista.value = tipos.includes(atual) ? atual : "";
}

function renderizarLinha(linha) {
  const { custo } = linha;
  const emEdicao = custoEmEdicao && Number(custoEmEdicao.id) === Number(custo.id);
  const href = `detalhes-produto.html?pecaId=${encodeURIComponent(custo.pecaId)}`;

  return `
    <tr${emEdicao ? ' aria-current="true"' : ""}>
      <td class="cell-nowrap" data-label="Data">${formatarData(linha.data)}</td>
      <td data-label="Peça">
        <div class="item-cell__text">
          <a class="item-cell__name" href="${href}">${escaparHtml(linha.nome)}</a>
          ${linha.sku ? `<span class="item-cell__meta"><span class="mono">${escaparHtml(linha.sku)}</span></span>` : ""}
        </div>
      </td>
      <td data-label="Tipo">${escaparHtml(linha.tipo || "—")}</td>
      <td data-label="Descrição">
        <div class="item-cell__text">
          <span>${escaparHtml(custo.descricao || "—")}</span>
          ${custo.observacoes ? `<span class="item-cell__meta">${escaparHtml(custo.observacoes)}</span>` : ""}
        </div>
      </td>
      <td class="num cell-strong" data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td class="cell-acoes">
        <div class="row-actions">
          <button type="button" class="btn btn--secondary btn--compact" data-acao="editar" data-id="${custo.id}"${emEdicao ? " disabled" : ""}>${emEdicao ? "Editando" : "Editar"}</button>
          <button type="button" class="btn btn--quiet btn--compact" data-acao="excluir" data-id="${custo.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `;
}

function renderizarLista() {
  const todas = montarLinhas();
  const filtradas = filtrarLinhas(todas);
  const doEscopo = pecaSelecionada ? todas.filter(linha => Number(linha.custo.pecaId) === Number(pecaSelecionada.id)) : todas;

  contadorCustos.textContent = pecaSelecionada
    ? `${doEscopo.length} ${doEscopo.length === 1 ? "custo" : "custos"} desta peça`
    : `${todas.length} ${todas.length === 1 ? "custo" : "custos"} em todas as peças`;

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (filtradas.length === 0) {
    const vazio = doEscopo.length
      ? "Nenhum custo encontrado para esta busca ou filtro."
      : pecaSelecionada ? "Nenhum custo lançado nesta peça ainda." : "Nenhum custo de peça lançado ainda.";
    tabelaCustos.innerHTML = `<tr class="data-table__empty"><td colspan="6">${vazio}</td></tr>`;
    paginacaoCustos.hidden = true;
    return;
  }

  tabelaCustos.innerHTML = pagina.map(renderizarLinha).join("");
  paginacaoCustos.hidden = filtradas.length <= ITENS_POR_PAGINA;
  paginacaoTextoCustos.textContent = `Mostrando ${inicio + 1}–${inicio + pagina.length} de ${filtradas.length}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

// ---- Início ----

function aplicarPecaDaUrl() {
  const pecaId = Number(new URLSearchParams(window.location.search).get("pecaId"));
  if (!pecaId) return;

  const peca = obterPeca(pecaId);
  if (!peca) {
    mostrarMensagem("Peça não encontrada. Busque a peça abaixo.");
    return;
  }

  linkVoltarCusto.href = `detalhes-produto.html?pecaId=${encodeURIComponent(pecaId)}`;
  textoVoltarCusto.textContent = peca.nome;

  if (calcularSaldo(pecaId) <= 0) {
    mostrarMensagem(`${escaparHtml(peca.nome)} está sem estoque: custo de peça só é lançado em peça com estoque.`);
    return;
  }

  selecionarPeca(peca, { focar: false });
  selectTipoCusto.focus();
}

async function iniciarCustos() {
  campoDataCusto.value = obterDataLocalHoje();

  if (!window.supabaseService?.estaConfigurado()) {
    mostrarMensagem("Configure o Supabase para lançar custos de peça.");
    return;
  }

  try {
    const [pecas, origens, entradas, custos, tipos] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarTiposCusto("peca")
    ]);

    pecasCusto = pecas || [];
    origensCusto = origens || [];
    entradasCusto = entradas || [];
    custosCusto = custos || [];
    tiposCusto = tipos || [];

    renderizarTipos();
    renderizarFiltroTipos();
    aplicarPecaDaUrl();
    atualizarResumo();
    renderizarLista();

    if (!tiposCusto.length) {
      mostrarMensagem('Nenhum tipo de custo ativo para peças. <a href="tipos-custo.html">Cadastrar tipo</a>');
    }
  } catch (erro) {
    console.error("Erro ao carregar a tela de custos:", erro);
    mostrarMensagem("Não foi possível carregar peças e custos.");
  }
}

if (formCusto) {
  formCusto.addEventListener("submit", salvarCusto);
  botaoCancelarCusto.addEventListener("click", cancelar);

  buscaPecaCusto.addEventListener("input", renderizarSugestoes);
  buscaPecaCusto.addEventListener("keydown", evento => {
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      moverDestaque(evento.key === "ArrowDown" ? 1 : -1);
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      const peca = sugestoesAtuais[indiceSugestao];
      if (peca && calcularSaldo(peca.id) > 0) selecionarPeca(peca);
    } else if (evento.key === "Escape") {
      fecharSugestoes();
    }
  });

  sugestoesPecaCusto.addEventListener("click", evento => {
    const opcao = evento.target.closest(".custo-busca__opcao");
    if (opcao && !opcao.disabled) selecionarPeca(sugestoesAtuais[Number(opcao.dataset.indice)]);
  });

  document.addEventListener("click", evento => {
    if (!campoBuscaPeca.contains(evento.target)) fecharSugestoes();
  });

  cartaoPecaCusto.addEventListener("click", evento => {
    if (evento.target.closest("#botaoTrocarPecaCusto")) trocarPeca();
  });

  campoValorCusto.addEventListener("input", atualizarResumo);
  campoValorCusto.addEventListener("blur", () => {
    const valor = lerMoeda(campoValorCusto.value);
    if (Number.isFinite(valor) && valor > 0) campoValorCusto.value = formatarMoeda(valor);
  });

  [buscaCustosLista, filtroTipoCustoLista, dataInicialCustos, dataFinalCustos].forEach(campo => {
    campo.addEventListener("input", () => {
      paginaAtual = 1;
      renderizarLista();
    });
  });

  tabelaCustos.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;
    const custo = custosCusto.find(item => Number(item.id) === Number(botao.dataset.id));
    if (!custo) return;
    if (botao.dataset.acao === "editar") editarCusto(custo);
    if (botao.dataset.acao === "excluir") excluirCusto(custo);
  });

  botaoPaginaAnterior.addEventListener("click", () => {
    paginaAtual -= 1;
    renderizarLista();
  });

  botaoPaginaProxima.addEventListener("click", () => {
    paginaAtual += 1;
    renderizarLista();
  });

  iniciarCustos();
}
