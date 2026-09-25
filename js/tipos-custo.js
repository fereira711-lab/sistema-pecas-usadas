// Tipos de custo (redesenho): cadastro, edição e ativar/inativar dos tipos usados em custos da peça e da venda.
// Sem exclusão pela interface: tipo antigo é inativado. O nome fica como digitado (supabase-service padroniza só os espaços).
const CATEGORIAS = { peca: "Peça", venda: "Venda", ambos: "Ambos" };

const resumoTiposCusto = document.getElementById("resumoTiposCusto");
const mensagemTiposCusto = document.getElementById("mensagemTiposCusto");
const botaoNovoTipoCusto = document.getElementById("botaoNovoTipoCusto");
const formTipoCusto = document.getElementById("formTipoCusto");
const tituloFormTipoCusto = document.getElementById("tituloFormTipoCusto");
const tipoCustoId = document.getElementById("tipoCustoId");
const nomeTipoCusto = document.getElementById("nomeTipoCusto");
const categoriaTipoCusto = document.getElementById("categoriaTipoCusto");
const mensagemFormTipoCusto = document.getElementById("mensagemFormTipoCusto");
const cancelarTipoCusto = document.getElementById("cancelarTipoCusto");
const buscaTipoCusto = document.getElementById("buscaTipoCusto");
const filtroStatusTiposCusto = document.getElementById("filtroStatusTiposCusto");
const filtroCategoriaTiposCusto = document.getElementById("filtroCategoriaTiposCusto");
const tabelaTiposCusto = document.getElementById("tabelaTiposCusto");

let tiposCusto = [];
let usosTiposCusto = {};
let categoriaFiltro = "";
let categoriaFormulario = "peca";

// ---- Formatação ----

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Mesma chave de comparação do supabase-service: sem acento, sem espaços extras e sem diferenciar maiúsculas.
function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function plural(quantidade, singular, pluralTexto) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}

function descreverUsos(uso) {
  const partes = [];
  if (uso.peca) partes.push(plural(uso.peca, "em peça", "em peças"));
  if (uso.venda) partes.push(plural(uso.venda, "em venda", "em vendas"));
  return partes.length ? partes.join(" · ") : "Sem uso";
}

// ---- Regras da lista ----

function existeTipoDuplicado(nome, idAtual = 0) {
  const chave = normalizarTexto(nome);
  return tiposCusto.some(tipo => Number(tipo.id) !== Number(idAtual) && normalizarTexto(tipo.nome) === chave);
}

function filtrarTipos() {
  const termo = normalizarTexto(buscaTipoCusto.value);
  const status = filtroStatusTiposCusto.value;

  return tiposCusto.filter(tipo => (
    (!termo || termo.split(" ").every(palavra => normalizarTexto(tipo.nome).includes(palavra))) &&
    (!status || (status === "ativo" ? tipo.ativo : !tipo.ativo))
  ));
}

// ---- Renderização ----

function renderizarLinha(tipo) {
  const uso = usosTiposCusto[tipo.id] || { total: 0, peca: 0, venda: 0 };

  return `
    <tr>
      <td class="cell-strong" data-label="Tipo">${escaparHtml(tipo.nome)}</td>
      <td data-label="Vale para">${CATEGORIAS[tipo.categoria] || escaparHtml(tipo.categoria || "—")}</td>
      <td class="cell-muted" data-label="Usos">${descreverUsos(uso)}</td>
      <td data-label="Status"><span class="pill ${tipo.ativo ? "pill--success" : "pill--neutral"}">${tipo.ativo ? "Ativo" : "Inativo"}</span></td>
      <td class="cell-acoes">
        <div class="row-actions">
          <button type="button" class="btn btn--secondary btn--compact" data-acao="editar" data-id="${tipo.id}">Editar</button>
          <button type="button" class="btn btn--quiet btn--compact" data-acao="alternar" data-id="${tipo.id}">${tipo.ativo ? "Inativar" : "Ativar"}</button>
        </div>
      </td>
    </tr>
  `;
}

function renderizarLista() {
  const semCategoria = filtrarTipos();
  const filtrados = semCategoria.filter(tipo => !categoriaFiltro || tipo.categoria === categoriaFiltro);

  filtroCategoriaTiposCusto.querySelectorAll("[data-contagem]").forEach(contador => {
    const chave = contador.dataset.contagem;
    contador.textContent = String(semCategoria.filter(tipo => !chave || tipo.categoria === chave).length);
  });

  if (filtrados.length === 0) {
    const vazio = tiposCusto.length ? "Nenhum tipo encontrado para esta busca ou filtro." : "Nenhum tipo de custo cadastrado.";
    tabelaTiposCusto.innerHTML = `<tr class="data-table__empty"><td colspan="5">${vazio}</td></tr>`;
    return;
  }

  tabelaTiposCusto.innerHTML = filtrados.map(renderizarLinha).join("");
}

function atualizarResumo() {
  const ativos = tiposCusto.filter(tipo => tipo.ativo).length;
  resumoTiposCusto.textContent = tiposCusto.length
    ? `${plural(tiposCusto.length, "tipo cadastrado", "tipos cadastrados")} · ${plural(ativos, "ativo", "ativos")}`
    : "Nenhum tipo cadastrado";
}

// ---- Formulário ----

function selecionarCategoriaFormulario(categoria) {
  categoriaFormulario = CATEGORIAS[categoria] ? categoria : "ambos";
  categoriaTipoCusto.querySelectorAll("[data-categoria]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.categoria === categoriaFormulario));
  });
}

function mostrarMensagemFormulario(texto) {
  mensagemFormTipoCusto.textContent = texto;
}

function abrirFormulario(tipo = null) {
  tipoCustoId.value = tipo ? tipo.id : "";
  nomeTipoCusto.value = tipo ? tipo.nome : "";
  selecionarCategoriaFormulario(tipo ? tipo.categoria : "peca");
  tituloFormTipoCusto.textContent = tipo ? `Editar tipo: ${tipo.nome}` : "Novo tipo de custo";
  mostrarMensagemFormulario("");
  formTipoCusto.hidden = false;
  nomeTipoCusto.focus();
}

function fecharFormulario() {
  formTipoCusto.hidden = true;
  formTipoCusto.reset();
  tipoCustoId.value = "";
  mostrarMensagemFormulario("");
}

function mostrarMensagemPagina(texto, sucesso = false) {
  mensagemTiposCusto.textContent = texto;
  mensagemTiposCusto.classList.toggle("page-message--success", sucesso);
}

async function salvarTipoCusto(evento) {
  evento.preventDefault();

  const id = Number(tipoCustoId.value || 0);
  const nome = nomeTipoCusto.value.trim();
  const tipoAtual = tiposCusto.find(tipo => Number(tipo.id) === id);

  if (!nome) {
    mostrarMensagemFormulario("Informe o nome do tipo de custo.");
    return;
  }

  if (existeTipoDuplicado(nome, id)) {
    mostrarMensagemFormulario("Esse tipo já existe (maiúsculas, acentos e espaços não diferenciam).");
    return;
  }

  try {
    if (id) {
      await window.supabaseService.atualizarTipoCusto({ id, nome, categoria: categoriaFormulario, ativo: tipoAtual ? tipoAtual.ativo : true });
    } else {
      await window.supabaseService.criarTipoCusto(nome, categoriaFormulario);
    }

    fecharFormulario();
    mostrarMensagemPagina(id ? "Tipo de custo atualizado." : "Tipo de custo cadastrado.", true);
    await carregarTiposCusto();
  } catch (erro) {
    console.error("Erro ao salvar tipo de custo:", erro);
    mostrarMensagemFormulario(normalizarTexto(erro.message).includes("existe")
      ? "Esse tipo já existe (maiúsculas, acentos e espaços não diferenciam)."
      : "Não foi possível salvar o tipo de custo.");
  }
}

async function alternarTipoCusto(id) {
  const tipo = tiposCusto.find(item => Number(item.id) === Number(id));
  if (!tipo) return;

  try {
    await window.supabaseService.atualizarTipoCusto({ ...tipo, ativo: !tipo.ativo });
    mostrarMensagemPagina(`${tipo.nome} ${tipo.ativo ? "inativado" : "ativado"}.`, true);
    await carregarTiposCusto();
  } catch (erro) {
    console.error("Erro ao alterar status do tipo:", erro);
    mostrarMensagemPagina("Não foi possível alterar o status do tipo.");
  }
}

// ---- Início ----

async function carregarTiposCusto() {
  if (!window.supabaseService?.estaConfigurado()) {
    resumoTiposCusto.textContent = "";
    mostrarMensagemPagina("Configure o Supabase para gerenciar os tipos de custo.");
    return;
  }

  try {
    tiposCusto = (await window.supabaseService.listarTodosTiposCusto()) || [];
    const pares = await Promise.all(tiposCusto.map(async tipo => [tipo.id, await window.supabaseService.contarUsoTipoCusto(tipo.id)]));
    usosTiposCusto = Object.fromEntries(pares);
    tiposCusto.sort((a, b) => Number(b.ativo) - Number(a.ativo) || String(a.nome).localeCompare(String(b.nome), "pt-BR"));
    atualizarResumo();
    renderizarLista();
  } catch (erro) {
    console.error("Erro ao carregar tipos de custo:", erro);
    resumoTiposCusto.textContent = "";
    mostrarMensagemPagina("Não foi possível carregar os tipos de custo.");
  }
}

if (tabelaTiposCusto) {
  botaoNovoTipoCusto.addEventListener("click", () => abrirFormulario());
  cancelarTipoCusto.addEventListener("click", fecharFormulario);
  formTipoCusto.addEventListener("submit", salvarTipoCusto);

  categoriaTipoCusto.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-categoria]");
    if (botao) selecionarCategoriaFormulario(botao.dataset.categoria);
  });

  filtroCategoriaTiposCusto.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-categoria]");
    if (!botao) return;
    categoriaFiltro = botao.dataset.categoria;
    filtroCategoriaTiposCusto.querySelectorAll("[data-categoria]").forEach(item => {
      item.setAttribute("aria-pressed", String(item.dataset.categoria === categoriaFiltro));
    });
    renderizarLista();
  });

  buscaTipoCusto.addEventListener("input", renderizarLista);
  filtroStatusTiposCusto.addEventListener("change", renderizarLista);

  tabelaTiposCusto.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;
    const tipo = tiposCusto.find(item => Number(item.id) === Number(botao.dataset.id));
    if (botao.dataset.acao === "editar" && tipo) abrirFormulario(tipo);
    if (botao.dataset.acao === "alternar") alternarTipoCusto(botao.dataset.id);
  });

  carregarTiposCusto();
}
