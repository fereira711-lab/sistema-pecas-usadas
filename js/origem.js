const mensagemFormulario = document.getElementById("mensagemFormulario");
const campoCodigoOrigem = document.getElementById("codigoOrigem");
const campoDataCompra = document.getElementById("dataCompra");
const camposResumoOrigem = {
  tipo: document.getElementById("resumoTipoOrigem"),
  descricao: document.getElementById("resumoDescricaoOrigem"),
  valor: document.getElementById("resumoValorOrigem"),
  data: document.getElementById("resumoDataOrigem"),
  status: document.getElementById("resumoStatusOrigem"),
  badgeStatus: document.getElementById("badgeStatusDistribuicao")
};

function buscarOrigensLocais() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigensLocais(origens) {
  localStorage.setItem("origens", JSON.stringify(origens));
}

function salvarOrigemNoCache(origem) {
  const origens = buscarOrigensLocais().filter(item => Number(item.id) !== Number(origem.id));
  origens.push(origem);
  salvarOrigensLocais(origens);
}

function mostrarMensagem(texto, tipo) {
  mensagemFormulario.textContent = texto;
  mensagemFormulario.className = `form-message form-message--${tipo}`;
}

function obterDataHoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarCodigoOrigem(valor) {
  return `ORI-${String(valor || Date.now()).padStart(6, "0")}`;
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) {
    return window.moedaUtils.formatarMoedaBR(valor);
  }

  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataVisual(data) {
  if (!data) {
    return "Hoje";
  }

  const [ano, mes, dia] = String(data).split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function atualizarCodigoOrigemProvisorio() {
  if (campoCodigoOrigem) {
    campoCodigoOrigem.value = "Gerado ao salvar";
  }
}

function preencherDataPadrao() {
  if (campoDataCompra && !campoDataCompra.value) {
    campoDataCompra.value = obterDataHoje();
  }
}

function lerOrigemDoFormulario() {
  const valorDigitado = document.getElementById("custoTotal").value;
  const tipoOrigem = document.getElementById("tipoOrigem").value;
  const quantidadeTotal = document.getElementById("quantidadeTotal")?.value;
  const valorPago = window.moedaUtils?.parseMoedaBR
    ? window.moedaUtils.parseMoedaBR(valorDigitado)
    : Number(valorDigitado || 0);

  return {
    id: Date.now(),
    codigoOrigem: formatarCodigoOrigem(Date.now()),
    tipoOrigem,
    tipo: tipoOrigem,
    descricao: document.getElementById("descricao").value.trim(),
    custoTotal: valorPago,
    valorPago,
    custoTipo: "",
    dataCompra: document.getElementById("dataCompra").value || obterDataHoje(),
    quantidadeTotal: Number(quantidadeTotal || 0),
    produtoSku: "",
    observacoes: document.getElementById("observacoes").value.trim()
  };
}

function validarOrigem(origem) {
  if (!origem.tipoOrigem || !origem.descricao || !origem.dataCompra) {
    return "Preencha tipo da origem, descrição e data.";
  }

  if (!Number.isFinite(origem.valorPago) || origem.valorPago < 0) {
    return "Informe um valor válido para a origem.";
  }

  if (!Number.isFinite(origem.quantidadeTotal) || origem.quantidadeTotal < 0) {
    return "Informe uma quantidade prevista válida.";
  }

  return "";
}

function obterStatusInicialOrigem(origem) {
  if (Number(origem.valorPago || 0) <= 0) {
    return "Sem valor pago";
  }

  if (Number(origem.quantidadeTotal || 0) > 0) {
    return "Pronta para vincular peças";
  }

  return "Aguardando distribuição";
}

function atualizarResumoOrigem() {
  if (!camposResumoOrigem.tipo) {
    return;
  }

  const origem = lerOrigemDoFormulario();
  const status = obterStatusInicialOrigem(origem);

  camposResumoOrigem.tipo.textContent = origem.tipoOrigem || "Não informado";
  camposResumoOrigem.descricao.textContent = origem.descricao || "Não informada";
  camposResumoOrigem.valor.textContent = formatarMoeda(origem.valorPago);
  camposResumoOrigem.data.textContent = formatarDataVisual(origem.dataCompra);
  camposResumoOrigem.status.textContent = status;

  if (camposResumoOrigem.badgeStatus) {
    camposResumoOrigem.badgeStatus.textContent = status;
    camposResumoOrigem.badgeStatus.className = status === "Sem valor pago"
      ? "status-badge status-badge--muted"
      : status === "Pronta para vincular peças"
        ? "status-badge status-badge--ok"
        : "status-badge status-badge--warning";
  }
}

function definirBotoesSalvando(salvando) {
  const botoes = [
    document.getElementById("btnSalvarOrigem"),
    document.getElementById("btnSalvarPecaVinculada")
  ];

  botoes.forEach(botao => {
    if (botao) {
      botao.disabled = salvando;
    }
  });
}

function limparFormularioOrigem() {
  document.getElementById("tipoOrigem").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("custoTotal").value = "";
  document.getElementById("quantidadeTotal").value = "";
  document.getElementById("observacoes").value = "";
  campoDataCompra.value = obterDataHoje();
  mensagemFormulario.textContent = "";
  mensagemFormulario.className = "form-message";
  preencherDataPadrao();
  atualizarCodigoOrigemProvisorio();
  atualizarResumoOrigem();
}

async function salvarOrigem(redirecionarParaPeca = false) {
  const origem = lerOrigemDoFormulario();
  const erroValidacao = validarOrigem(origem);

  if (erroValidacao) {
    mostrarMensagem(erroValidacao, "warning");
    return;
  }

  definirBotoesSalvando(true);

  try {
    const origemSalva = window.supabaseService && window.supabaseService.estaConfigurado()
      ? await window.supabaseService.salvarOrigem(origem)
      : origem;

    salvarOrigemNoCache(origemSalva);
    if (campoCodigoOrigem) {
      campoCodigoOrigem.value = origemSalva.codigoOrigem || formatarCodigoOrigem(origemSalva.id);
    }

    mostrarMensagem("Origem salva com sucesso.", "success");

    if (redirecionarParaPeca) {
      setTimeout(() => {
        window.location.href = `cadastro-peca.html?origemId=${encodeURIComponent(origemSalva.id)}`;
      }, 500);
    }
  } catch (erro) {
    console.error("Erro ao cadastrar origem:", erro);
    mostrarMensagem("Não foi possível salvar a origem no Supabase.", "warning");
  } finally {
    definirBotoesSalvando(false);
  }
}

preencherDataPadrao();
atualizarCodigoOrigemProvisorio();
atualizarResumoOrigem();
window.moedaUtils?.registrarCampoMoeda?.(document.getElementById("custoTotal"));

["tipoOrigem", "descricao", "custoTotal", "quantidadeTotal", "dataCompra"].forEach(id => {
  const campo = document.getElementById(id);

  if (campo) {
    campo.addEventListener("input", atualizarResumoOrigem);
    campo.addEventListener("change", atualizarResumoOrigem);
  }
});
