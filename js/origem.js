function salvarOrigem() {
  const descricao = document.getElementById("descricao").value;
  const valor = Number(document.getElementById("valor").value);
  const tipo = document.getElementById("tipo").value;

  const novaOrigem = {
    id: Date.now(),
    descricao,
    valor_pago: valor,
    tipo
  };

  console.log("Origem criada:", novaOrigem);

  alert("Origem cadastrada!");
}
