const formTipoCusto = document.getElementById("formTipoCusto");
const tipoCustoId = document.getElementById("tipoCustoId");
const nomeTipoCusto = document.getElementById("nomeTipoCusto");
const categoriaTipoCusto = document.getElementById("categoriaTipoCusto");
const statusTipoCusto = document.getElementById("statusTipoCusto");
const cancelarEdicaoTipoCusto = document.getElementById("cancelarEdicaoTipoCusto");
const mensagemTipoCusto = document.getElementById("mensagemTipoCusto");
const mensagemListaTiposCusto = document.getElementById("mensagemListaTiposCusto");
const listaTiposCusto = document.getElementById("listaTiposCusto");
const contadorTiposCusto = document.getElementById("contadorTiposCusto");
const buscaTipoCusto = document.getElementById("buscaTipoCusto");
const quantidadeTiposCusto = document.getElementById("quantidadeTiposCusto");
const filtroCategoriaTiposCusto = document.getElementById("filtroCategoriaTiposCusto");
const filtroStatusTiposCusto = document.getElementById("filtroStatusTiposCusto");
const costTypesShell = document.getElementById("costTypesShell");
const abrirFiltrosTiposCusto = document.getElementById("abrirFiltrosTiposCusto");
const fecharFiltrosTiposCusto = document.getElementById("fecharFiltrosTiposCusto");
const limparFiltrosTiposCusto = document.getElementById("limparFiltrosTiposCusto");
const aplicarFiltrosTiposCusto = document.getElementById("aplicarFiltrosTiposCusto");

let tiposCusto = [];
let usosTiposCusto = {};

function mostrarMensagemTipo(texto, tipo) {
  mensagemTipoCusto.textContent = texto;
  mensagemTipoCusto.className = `form-message form-message--${tipo}`;
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function categoriaLegivel(categoria) {
  const nomes = {
    peca: "Peça",
    venda: "Venda",
    ambos: "Ambos"
  };

  return nomes[categoria] || categoria || "-";
}

function classeCategoria(categoria) {
  const classes = {
    peca: "status-badge--info",
    venda: "status-badge--warning",
    ambos: "status-badge--fast"
  };

  return classes[categoria] || "status-badge--info";
}

function atualizarContador(total, visiveis) {
  if (!contadorTiposCusto) {
    return;
  }

  contadorTiposCusto.textContent = total === visiveis
    ? `${total} tipo${total === 1 ? "" : "s"}`
    : `${visiveis} de ${total}`;
}

function limparFormularioTipo() {
  tipoCustoId.value = "";
  nomeTipoCusto.value = "";
  categoriaTipoCusto.value = "peca";
  statusTipoCusto.value = "ativo";
  cancelarEdicaoTipoCusto.hidden = true;
}

function existeTipoDuplicado(nome, idAtual = 0) {
  const nomeNormalizado = normalizarTexto(nome);

  return tiposCusto.some(tipo => (
    Number(tipo.id) !== Number(idAtual) &&
    normalizarTexto(tipo.nome) === nomeNormalizado
  ));
}

async function carregarUsosTipos() {
  const pares = await Promise.all(
    tiposCusto.map(async tipo => [
      tipo.id,
      await window.supabaseService.contarUsoTipoCusto(tipo.id)
    ])
  );

  usosTiposCusto = Object.fromEntries(pares);
}

async function carregarTiposCusto() {
  if (!window.supabaseService?.estaConfigurado()) {
    mensagemListaTiposCusto.textContent = "Configure o Supabase para gerenciar os tipos de custo.";
    return;
  }

  try {
    tiposCusto = await window.supabaseService.listarTodosTiposCusto() || [];
    await carregarUsosTipos();
    renderizarTiposCusto();
  } catch (erro) {
    console.error("Erro ao carregar tipos de custo:", erro);
    mensagemListaTiposCusto.textContent = "Não foi possível carregar os tipos de custo.";
  }
}

function filtrarTiposCusto() {
  const termo = normalizarTexto(buscaTipoCusto.value);
  const categoria = filtroCategoriaTiposCusto.value;
  const status = filtroStatusTiposCusto.value;

  return tiposCusto.filter(tipo => {
    const uso = usosTiposCusto[tipo.id] || { total: 0, peca: 0, venda: 0 };
    const busca = normalizarTexto(`${tipo.nome} ${categoriaLegivel(tipo.categoria)} ${uso.total}`);
    const bateBusca = !termo || busca.includes(termo);
    const bateCategoria = !categoria || tipo.categoria === categoria;
    const bateStatus = !status || (status === "ativo" ? tipo.ativo : !tipo.ativo);

    return bateBusca && bateCategoria && bateStatus;
  });
}

function limitarTiposCusto(tipos) {
  const limite = quantidadeTiposCusto.value;

  if (limite === "todos") {
    return tipos;
  }

  return tipos.slice(0, Number(limite || 12));
}

function renderizarTiposCusto() {
  listaTiposCusto.innerHTML = "";

  if (tiposCusto.length === 0) {
    mensagemListaTiposCusto.textContent = "Nenhum tipo de custo cadastrado.";
    atualizarContador(0, 0);
    return;
  }

  const filtrados = filtrarTiposCusto();
  const visiveis = limitarTiposCusto(filtrados);
  atualizarContador(filtrados.length, visiveis.length);

  if (filtrados.length === 0) {
    mensagemListaTiposCusto.textContent = "Nenhum tipo encontrado com os filtros atuais.";
    return;
  }

  mensagemListaTiposCusto.textContent = "";

  visiveis.forEach(tipo => {
    const uso = usosTiposCusto[tipo.id] || { total: 0, peca: 0, venda: 0 };
    const linha = document.createElement("div");
    linha.className = "cost-types-row";
    linha.setAttribute("role", "row");

    linha.innerHTML = `
      <div class="cost-types-name">
        <strong class="product-name">${escaparHtml(tipo.nome)}</strong>
        <small>Padrão canônico: ${escaparHtml(normalizarTexto(tipo.nome))}</small>
      </div>
      <span data-label="Categoria" class="status-badge ${classeCategoria(tipo.categoria)}">${categoriaLegivel(tipo.categoria)}</span>
      <span data-label="Status" class="status-badge ${tipo.ativo ? "status-badge--stock" : "status-badge--empty"}">${tipo.ativo ? "Ativo" : "Inativo"}</span>
      <strong data-label="Usos">${uso.total} uso${uso.total === 1 ? "" : "s"}</strong>
      <div class="table-actions cost-types-actions">
        <button type="button" class="button-compact" data-acao="editar" data-id="${tipo.id}">Editar</button>
        <button type="button" class="button-compact" data-acao="alternar" data-id="${tipo.id}">${tipo.ativo ? "Inativar" : "Ativar"}</button>
      </div>
    `;

    listaTiposCusto.appendChild(linha);
  });
}

function editarTipoCusto(id) {
  const tipo = tiposCusto.find(item => Number(item.id) === Number(id));

  if (!tipo) {
    return;
  }

  tipoCustoId.value = tipo.id;
  nomeTipoCusto.value = tipo.nome;
  categoriaTipoCusto.value = tipo.categoria;
  statusTipoCusto.value = tipo.ativo ? "ativo" : "inativo";
  cancelarEdicaoTipoCusto.hidden = false;
  nomeTipoCusto.focus();
}

async function salvarTipoCusto(evento) {
  evento.preventDefault();

  const id = Number(tipoCustoId.value || 0);
  const nome = nomeTipoCusto.value.trim();
  const categoria = categoriaTipoCusto.value;
  const ativo = statusTipoCusto.value === "ativo";

  if (!nome) {
    mostrarMensagemTipo("Informe o nome do tipo de custo.", "warning");
    return;
  }

  if (existeTipoDuplicado(nome, id)) {
    mostrarMensagemTipo("Esse tipo já existe ou é muito parecido.", "warning");
    return;
  }

  try {
    if (id) {
      await window.supabaseService.atualizarTipoCusto({ id, nome, categoria, ativo });
      mostrarMensagemTipo("Tipo de custo atualizado.", "success");
    } else {
      const novoTipo = await window.supabaseService.criarTipoCusto(nome, categoria);

      if (novoTipo && ativo === false) {
        await window.supabaseService.atualizarTipoCusto({ ...novoTipo, ativo: false });
      }

      mostrarMensagemTipo("Tipo de custo cadastrado.", "success");
    }

    limparFormularioTipo();
    await carregarTiposCusto();
  } catch (erro) {
    console.error("Erro ao salvar tipo de custo:", erro);
    const mensagem = normalizarTexto(erro.message).includes("existe")
      ? "Esse tipo já existe ou é muito parecido."
      : erro.message || "Não foi possível salvar o tipo de custo.";

    mostrarMensagemTipo(mensagem, "warning");
  }
}

async function alternarTipoCusto(id) {
  const tipo = tiposCusto.find(item => Number(item.id) === Number(id));

  if (!tipo) {
    return;
  }

  try {
    await window.supabaseService.atualizarTipoCusto({
      ...tipo,
      ativo: !tipo.ativo
    });
    await carregarTiposCusto();
  } catch (erro) {
    console.error("Erro ao alterar status do tipo:", erro);
    mostrarMensagemTipo("Não foi possível alterar o status.", "warning");
  }
}

function alternarPainelFiltros(aberto) {
  costTypesShell.classList.toggle("cost-types-shell--filters-open", aberto);
}

formTipoCusto.addEventListener("submit", salvarTipoCusto);

cancelarEdicaoTipoCusto.addEventListener("click", () => {
  limparFormularioTipo();
  mostrarMensagemTipo("", "success");
});

listaTiposCusto.addEventListener("click", evento => {
  const botao = evento.target.closest("button");

  if (!botao) {
    return;
  }

  const id = Number(botao.dataset.id);

  if (botao.dataset.acao === "editar") {
    editarTipoCusto(id);
  }

  if (botao.dataset.acao === "alternar") {
    alternarTipoCusto(id);
  }
});

buscaTipoCusto.addEventListener("input", renderizarTiposCusto);
quantidadeTiposCusto.addEventListener("change", renderizarTiposCusto);
filtroCategoriaTiposCusto.addEventListener("change", renderizarTiposCusto);
filtroStatusTiposCusto.addEventListener("change", renderizarTiposCusto);

abrirFiltrosTiposCusto.addEventListener("click", () => alternarPainelFiltros(true));
fecharFiltrosTiposCusto.addEventListener("click", () => alternarPainelFiltros(false));
aplicarFiltrosTiposCusto.addEventListener("click", () => alternarPainelFiltros(false));

limparFiltrosTiposCusto.addEventListener("click", () => {
  filtroCategoriaTiposCusto.value = "";
  filtroStatusTiposCusto.value = "";
  renderizarTiposCusto();
});

carregarTiposCusto();
