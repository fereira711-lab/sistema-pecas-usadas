const formularioOrigem = document.getElementById("formOrigem");
const mensagemFormulario = document.getElementById("mensagemFormulario");

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigem(origem) {
  const origens = buscarOrigens();
  origens.push(origem);
  localStorage.setItem("origens", JSON.stringify(origens));
}

formularioOrigem.addEventListener("submit", function (evento) {
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
    mensagemFormulario.textContent = "Preencha tipo, descrição, valor pago e data da compra.";
    mensagemFormulario.className = "form-message form-message--warning";
    return;
  }

  salvarOrigem(origem);
  console.log("Origem cadastrada:", origem);

  mensagemFormulario.textContent = "Origem cadastrada no armazenamento temporário.";
  mensagemFormulario.className = "form-message form-message--success";

  alert("Origem cadastrada com sucesso.");
  formularioOrigem.reset();
});
