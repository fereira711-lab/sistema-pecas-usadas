const formTipoCusto = document.getElementById("formTipoCusto");
const tipoCustoId = document.getElementById("tipoCustoId");
const nomeTipoCusto = document.getElementById("nomeTipoCusto");
const categoriaTipoCusto = document.getElementById("categoriaTipoCusto");
const ativoTipoCusto = document.getElementById("ativoTipoCusto");
const cancelarEdicaoTipoCusto = document.getElementById("cancelarEdicaoTipoCusto");
const mensagemTipoCusto = document.getElementById("mensagemTipoCusto");
const mensagemListaTiposCusto = document.getElementById("mensagemListaTiposCusto");
const tabelaTiposCusto = document.getElementById("tabelaTiposCusto");

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

function categoriaLegivel(categoria) {
  const nomes = {
    peca: "Peca",
    venda: "Venda",
    ambos: "Ambos"
  };

  return nomes[categoria] || categoria || "-";
}

function limparFormularioTipo() {
  tipoCustoId.value = "";
  nomeTipoCusto.value = "";
  categoriaTipoCusto.value = "peca";
  ativoTipoCusto.checked = true;
  cancelarEdicaoTipoCusto.hidden = true;
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
    mensagemListaTiposCusto.textContent = "Nao foi possivel carregar os tipos de custo.";
  }
}

function renderizarTiposCusto() {
  tabelaTiposCusto.innerHTML = "";

  if (tiposCusto.length === 0) {
    mensagemListaTiposCusto.textContent = "Nenhum tipo de custo cadastrado.";
    return;
  }

  mensagemListaTiposCusto.textContent = "";

  tiposCusto.forEach(tipo => {
    const uso = usosTiposCusto[tipo.id] || { total: 0, peca: 0, venda: 0 };
    const linha = document.createElement("tr");
    const podeExcluir = uso.total === 0;

    linha.innerHTML = `
      <td data-label="Nome"><strong class="product-name">${escaparHtml(tipo.nome)}</strong></td>
      <td data-label="Categoria">${categoriaLegivel(tipo.categoria)}</td>
      <td data-label="Status">${tipo.ativo ? "Ativo" : "Inativo"}</td>
      <td data-label="Uso">${uso.total} uso(s) (${uso.peca} peca, ${uso.venda} venda)</td>
      <td data-label="Acoes">
        <div class="table-actions">
          <button type="button" data-acao="editar" data-id="${tipo.id}">Editar</button>
          <button type="button" data-acao="alternar" data-id="${tipo.id}">${tipo.ativo ? "Desativar" : "Ativar"}</button>
          <button type="button" data-acao="excluir" data-id="${tipo.id}"${podeExcluir ? "" : " disabled"}>Excluir</button>
        </div>
      </td>
    `;

    tabelaTiposCusto.appendChild(linha);
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
  ativoTipoCusto.checked = tipo.ativo;
  cancelarEdicaoTipoCusto.hidden = false;
  nomeTipoCusto.focus();
}

async function salvarTipoCusto(evento) {
  evento.preventDefault();

  const id = Number(tipoCustoId.value || 0);
  const nome = nomeTipoCusto.value.trim();
  const categoria = categoriaTipoCusto.value;
  const ativo = ativoTipoCusto.checked;

  if (!nome) {
    mostrarMensagemTipo("Informe o nome do tipo de custo.", "warning");
    return;
  }

  try {
    if (id) {
      await window.supabaseService.atualizarTipoCusto({ id, nome, categoria, ativo });
      mostrarMensagemTipo("Tipo de custo atualizado.", "success");
    } else {
      await window.supabaseService.criarTipoCusto(nome, categoria);
      mostrarMensagemTipo("Tipo de custo cadastrado.", "success");
    }

    limparFormularioTipo();
    await carregarTiposCusto();
  } catch (erro) {
    console.error("Erro ao salvar tipo de custo:", erro);
    mostrarMensagemTipo(erro.message || "Nao foi possivel salvar o tipo de custo.", "warning");
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
    mostrarMensagemTipo("Nao foi possivel alterar o status.", "warning");
  }
}

async function excluirTipoCusto(id) {
  const confirmou = confirm("Excluir este tipo de custo? Isso so funciona se ele nunca foi usado.");

  if (!confirmou) {
    return;
  }

  try {
    await window.supabaseService.excluirTipoCusto(id);
    mostrarMensagemTipo("Tipo de custo excluido.", "success");
    await carregarTiposCusto();
  } catch (erro) {
    console.error("Erro ao excluir tipo:", erro);
    mostrarMensagemTipo(erro.message || "Nao foi possivel excluir. Desative o tipo se ele ja foi usado.", "warning");
  }
}

formTipoCusto.addEventListener("submit", salvarTipoCusto);
cancelarEdicaoTipoCusto.addEventListener("click", () => {
  limparFormularioTipo();
  mostrarMensagemTipo("", "success");
});

tabelaTiposCusto.addEventListener("click", evento => {
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

  if (botao.dataset.acao === "excluir") {
    excluirTipoCusto(id);
  }
});

carregarTiposCusto();
