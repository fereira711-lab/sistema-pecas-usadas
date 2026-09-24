// Nova origem (redesenho): carro, lote, compra avulsa ou estoque inicial, cadastrada antes das peças.
// O valor pago é distribuído depois, no custo de cada peça cadastrada (entrada de estoque).
const formNovaOrigem = document.getElementById("formNovaOrigem");
const mensagemFormulario = document.getElementById("mensagemFormulario");
const tiposOrigem = document.getElementById("tiposOrigem");
const campoDescricao = document.getElementById("descricao");
const campoDataCompra = document.getElementById("dataCompra");
const campoValorPago = document.getElementById("custoTotal");
const campoQuantidade = document.getElementById("quantidadeTotal");
const campoObservacoes = document.getElementById("observacoes");
const botaoSalvarOrigem = document.getElementById("btnSalvarOrigem");
const botaoSalvarPecaVinculada = document.getElementById("btnSalvarPecaVinculada");
const resumo = {
  tipo: document.getElementById("resumoTipoOrigem"),
  descricao: document.getElementById("resumoDescricaoOrigem"),
  data: document.getElementById("resumoDataOrigem"),
  quantidade: document.getElementById("resumoQuantidadeOrigem"),
  valor: document.getElementById("resumoValorOrigem"),
  status: document.getElementById("resumoStatusOrigem")
};

let tipoSelecionado = "";

function obterDataHoje() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(valor);
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function mostrarMensagem(texto, tipo = "") {
  mensagemFormulario.textContent = texto;
  mensagemFormulario.className = `page-message${tipo === "success" ? " page-message--success" : ""}`;
}

function lerValorPago() {
  const digitado = campoValorPago.value;
  if (!String(digitado || "").trim()) return 0;
  return window.moedaUtils?.parseMoedaBR ? window.moedaUtils.parseMoedaBR(digitado) : Number(digitado);
}

function lerOrigemDoFormulario() {
  const valorPago = lerValorPago();

  return {
    tipoOrigem: tipoSelecionado,
    tipo: tipoSelecionado,
    descricao: campoDescricao.value.trim(),
    custoTotal: valorPago,
    valorPago,
    custoTipo: "",
    dataCompra: campoDataCompra.value,
    quantidadeTotal: Number(campoQuantidade.value || 0),
    produtoSku: "",
    observacoes: campoObservacoes.value.trim()
  };
}

// Devolve o primeiro problema com o campo para focar, ou null.
function validarOrigem(origem) {
  if (!origem.tipoOrigem) return { campo: tiposOrigem.querySelector("[data-tipo]"), mensagem: "Escolha o tipo da origem." };
  if (!origem.descricao) return { campo: campoDescricao, mensagem: "Informe a descrição da origem." };
  if (!origem.dataCompra) return { campo: campoDataCompra, mensagem: "Informe a data da compra." };
  if (!Number.isFinite(origem.valorPago) || origem.valorPago < 0) return { campo: campoValorPago, mensagem: "Informe um valor pago válido." };
  if (!Number.isInteger(origem.quantidadeTotal) || origem.quantidadeTotal < 0) return { campo: campoQuantidade, mensagem: "Informe uma quantidade prevista válida." };
  return null;
}

// Situação logo depois de salvar: sem valor pago, ou valor esperando ser distribuído nas peças.
function obterStatusInicial(origem) {
  if (!(Number(origem.valorPago) > 0)) return { texto: "Sem valor pago", pilula: "pill--neutral" };
  return { texto: "Falta distribuir nas peças", pilula: "pill--warning" };
}

function atualizarResumo() {
  const origem = lerOrigemDoFormulario();
  const status = obterStatusInicial(origem);

  resumo.tipo.textContent = origem.tipoOrigem === "Estoque Inicial" ? "Estoque inicial" : origem.tipoOrigem || "—";
  resumo.descricao.textContent = origem.descricao || "—";
  resumo.data.textContent = formatarData(origem.dataCompra);
  resumo.quantidade.textContent = origem.quantidadeTotal > 0 ? `${origem.quantidadeTotal}` : "—";
  resumo.valor.textContent = formatarMoeda(Number.isFinite(origem.valorPago) ? origem.valorPago : 0);
  resumo.status.textContent = status.texto;
  resumo.status.className = `pill ${status.pilula}`;
}

function selecionarTipo(tipo) {
  tipoSelecionado = tipo;
  tiposOrigem.querySelectorAll("[data-tipo]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.tipo === tipo));
  });
  atualizarResumo();
}

function definirSalvando(salvando) {
  botaoSalvarOrigem.disabled = salvando;
  botaoSalvarPecaVinculada.disabled = salvando;
}

// "Salvar origem" abre o detalhe da origem salva; "Salvar e cadastrar peça" abre a Nova peça com ela escolhida.
async function salvarOrigem(cadastrarPeca) {
  const origem = lerOrigemDoFormulario();
  const problema = validarOrigem(origem);

  if (problema) {
    mostrarMensagem(problema.mensagem);
    problema.campo?.focus();
    return;
  }

  if (!window.supabaseService?.estaConfigurado()) {
    mostrarMensagem("Configure o Supabase para salvar a origem.");
    return;
  }

  definirSalvando(true);
  mostrarMensagem("Salvando origem…");

  try {
    const origemSalva = await window.supabaseService.salvarOrigem(origem);
    window.location.href = cadastrarPeca
      ? `cadastro-peca.html?origemId=${encodeURIComponent(origemSalva.id)}`
      : `detalhes-origem.html?origemId=${encodeURIComponent(origemSalva.id)}`;
  } catch (erro) {
    console.error("Erro ao cadastrar origem:", erro);
    mostrarMensagem(erro?.message || "Não foi possível salvar a origem.");
    definirSalvando(false);
  }
}

if (formNovaOrigem) {
  campoDataCompra.value = obterDataHoje();
  window.moedaUtils?.registrarCampoMoeda?.(campoValorPago);

  tiposOrigem.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-tipo]");
    if (botao) selecionarTipo(botao.dataset.tipo);
  });

  [campoDescricao, campoDataCompra, campoValorPago, campoQuantidade].forEach(campo => {
    campo.addEventListener("input", atualizarResumo);
    campo.addEventListener("change", atualizarResumo);
  });

  formNovaOrigem.addEventListener("submit", evento => {
    evento.preventDefault();
    salvarOrigem(false);
  });

  botaoSalvarPecaVinculada.addEventListener("click", () => salvarOrigem(true));

  atualizarResumo();
}
