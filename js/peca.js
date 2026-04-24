function salvarPeca() {
  const nome = document.getElementById("nome").value;
  const preco = Number(document.getElementById("preco").value);
  const quantidade = Number(document.getElementById("quantidade").value) || 1;
  const custo = Number(document.getElementById("custo").value);
  const tipoCusto = document.getElementById("tipoCusto").value;
  const origemId = Number(document.getElementById("origemId").value);

  const novaPeca = {
    id: Date.now(),
    nome,
    precoVenda: preco,
    quantidade,
    quantidadeVendida: 0,
    custo,
    tipoCusto,
    origemId,
    status: "em_estoque"
  };

  console.log("Peça criada:", novaPeca);

  alert("Peça cadastrada!");
}
