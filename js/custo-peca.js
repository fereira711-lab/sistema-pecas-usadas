function salvarCusto() {
  const pecaId = Number(document.getElementById("pecaId").value);
  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value;
  const valor = Number(document.getElementById("valor").value);

  const novoCusto = {
    id: Date.now(),
    pecaId,
    tipo,
    descricao,
    valor,
    data: new Date().toISOString().slice(0, 10)
  };

  console.log("Custo criado:", novoCusto);

  alert("Custo cadastrado!");
}
