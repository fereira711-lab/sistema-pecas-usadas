function salvarVenda() {
  const pecaId = Number(document.getElementById("pecaId").value);
  const valorVenda = Number(document.getElementById("valorVenda").value);
  const canalVenda = document.getElementById("canalVenda").value;
  const custoEmbalagem = Number(document.getElementById("custoEmbalagem").value);
  const custoComissao = Number(document.getElementById("custoComissao").value);
  const custoFrete = Number(document.getElementById("custoFrete").value);

  const novaVenda = {
    id: Date.now(),
    pecaId,
    valorVenda,
    canalVenda,
    custosVenda: [
      { tipo: "embalagem", valor: custoEmbalagem },
      { tipo: "comissao", valor: custoComissao },
      { tipo: "frete", valor: custoFrete }
    ]
  };

  console.log("Venda criada:", novaVenda);

  alert("Venda cadastrada!");
}
