const mensagemFormulario = document.getElementById("mensagemFormulario");
const campoCodigoOrigem = document.getElementById("codigoOrigem");
const campoDataCompra = document.getElementById("dataCompra");

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

  return {
    id: Date.now(),
    codigoOrigem: formatarCodigoOrigem(Date.now()),
    tipoOrigem,
    tipo: tipoOrigem,
    descricao: document.getElementById("descricao").value.trim(),
    custoTotal: Number(valorDigitado || 0),
    valorPago: Number(valorDigitado || 0),
    custoTipo: document.getElementById("custoTipo").value,
    dataCompra: document.getElementById("dataCompra").value || obterDataHoje(),
    quantidadeTotal: 0,
    produtoSku: "",
    observacoes: document.getElementById("observacoes").value.trim()
  };
}

function validarOrigem(origem) {
  if (!origem.tipoOrigem || !origem.descricao || !origem.custoTipo || !origem.dataCompra) {
    return "Preencha tipo da origem, descricao, valor, tipo de custo e data.";
  }

  if (!Number.isFinite(origem.valorPago) || origem.valorPago < 0) {
    return "Informe um valor valido para a origem.";
  }

  return "";
}

async function salvarOrigem() {
  const origem = lerOrigemDoFormulario();
  const erroValidacao = validarOrigem(origem);
  const botaoSalvar = document.querySelector("button[onclick='salvarOrigem()']");

  if (erroValidacao) {
    mostrarMensagem(erroValidacao, "warning");
    return;
  }

  botaoSalvar.disabled = true;

  try {
    const origemSalva = window.supabaseService && window.supabaseService.estaConfigurado()
      ? await window.supabaseService.salvarOrigem(origem)
      : origem;

    salvarOrigemNoCache(origemSalva);
    mostrarMensagem("Origem salva com sucesso. Agora voce pode cadastrar a peca vinculada.", "success");

    setTimeout(() => {
      window.location.href = `cadastro-peca.html?origemId=${encodeURIComponent(origemSalva.id)}`;
    }, 700);
  } catch (erro) {
    console.error("Erro ao cadastrar origem:", erro);
    mostrarMensagem("Nao foi possivel salvar a origem no Supabase.", "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
}

preencherDataPadrao();
atualizarCodigoOrigemProvisorio();
