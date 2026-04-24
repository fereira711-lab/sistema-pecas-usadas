const formularioOrigem = document.getElementById("formOrigem");
const mensagemFormulario = document.getElementById("mensagemFormulario");

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigemLocal(origem) {
  const origens = buscarOrigens();
  origens.push(origem);
  localStorage.setItem("origens", JSON.stringify(origens));
}

function salvarOrigemNoCache(origem) {
  const origens = buscarOrigens().filter(item => Number(item.id) !== Number(origem.id));
  origens.push(origem);
  localStorage.setItem("origens", JSON.stringify(origens));
}

function mostrarMensagem(mensagem, tipo) {
  mensagemFormulario.textContent = mensagem;
  mensagemFormulario.className = `form-message form-message--${tipo}`;
}

formularioOrigem.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const valorPagoDigitado = document.getElementById("valorPago").value;

  const origem = {
    id: Date.now(),
    tipo: document.getElementById("tipoOrigem").value,
    descricao: document.getElementById("descricaoOrigem").value.trim(),
    valorPago: Number(valorPagoDigitado),
    dataCompra: document.getElementById("dataCompra").value,
    observacoes: document.getElementById("observacoes").value.trim()
  };

  if (!origem.tipo || !origem.descricao || !valorPagoDigitado || !origem.dataCompra) {
    mostrarMensagem("Preencha tipo, descricao, valor pago e data da compra.", "warning");
    return;
  }

  const botaoSalvar = formularioOrigem.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;

  try {
    const origemSalva = window.supabaseService && window.supabaseService.estaConfigurado()
      ? await window.supabaseService.salvarOrigem(origem)
      : null;

    if (origemSalva) {
      salvarOrigemNoCache(origemSalva);
      console.log("Origem cadastrada no Supabase:", origemSalva);
      mostrarMensagem("Origem cadastrada no Supabase.", "success");
    } else {
      salvarOrigemLocal(origem);
      console.log("Origem cadastrada no armazenamento temporario:", origem);
      mostrarMensagem("Origem cadastrada no armazenamento temporario. Configure o Supabase para salvar no banco.", "success");
    }

    alert("Origem cadastrada com sucesso.");
    formularioOrigem.reset();
  } catch (erro) {
    console.error("Erro ao cadastrar origem:", erro);
    mostrarMensagem("Nao foi possivel salvar a origem no Supabase. Verifique a configuracao e as tabelas.", "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
});
