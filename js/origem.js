const mensagemFormulario = document.getElementById("mensagemFormulario");

function buscarOrigensLocais() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigemLocal(origem) {
  const origens = buscarOrigensLocais();
  origens.push(origem);
  localStorage.setItem("origens", JSON.stringify(origens));
}

function salvarOrigemNoCache(origem) {
  const origens = buscarOrigensLocais().filter(item => Number(item.id) !== Number(origem.id));
  origens.push(origem);
  localStorage.setItem("origens", JSON.stringify(origens));
}

function mostrarMensagem(texto, tipo) {
  mensagemFormulario.textContent = texto;
  mensagemFormulario.className = `form-message form-message--${tipo}`;
}

function lerOrigemDoFormulario() {
  const custoTotalDigitado = document.getElementById("custoTotal").value;
  const tipoOrigem = document.getElementById("tipoOrigem").value;

  return {
    id: Date.now(),
    tipoOrigem,
    tipo: tipoOrigem,
    descricao: document.getElementById("descricao").value.trim(),
    custoTotal: Number(custoTotalDigitado),
    valorPago: Number(custoTotalDigitado),
    custoTipo: document.getElementById("custoTipo").value,
    observacoes: document.getElementById("observacoes").value.trim()
  };
}

function validarOrigem(origem) {
  if (!origem.tipoOrigem || !origem.descricao || !origem.custoTotal || !origem.custoTipo) {
    return "Preencha tipo da origem, descricao, custo total e tipo de custo.";
  }

  if (origem.custoTotal <= 0) {
    return "O custo total deve ser maior que zero.";
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
      : null;

    if (origemSalva) {
      salvarOrigemNoCache(origemSalva);
      mostrarMensagem("Origem cadastrada no Supabase com sucesso.", "success");
    } else {
      salvarOrigemLocal(origem);
      mostrarMensagem("Origem cadastrada no armazenamento temporario. Configure o Supabase para salvar no banco.", "success");
    }

    setTimeout(() => {
      window.location.href = "listar-origens.html";
    }, 800);
  } catch (erro) {
    console.error("Erro ao cadastrar origem:", erro);
    mostrarMensagem("Nao foi possivel salvar a origem no Supabase. Verifique a configuracao e a tabela origens.", "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
}
