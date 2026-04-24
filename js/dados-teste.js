function obterProdutosTeste() {
  return [
    {
      id: 1,
      nome: "Farol esquerdo Fiat Uno",
      sku: "FAR-UNO-001",
      categoria: "Iluminação",
      origemId: 1,
      origem: "Fiat Uno 2012 para desmonte",
      quantidade: 3,
      custo: 120,
      precoVenda: 250,
      observacoes: "Peça usada em bom estado"
    },
    {
      id: 2,
      nome: "Para-choque dianteiro Gol G5",
      sku: "PAR-GOLG5-002",
      categoria: "Lataria",
      origemId: 2,
      origem: "Lote de peças diversas",
      quantidade: 2,
      custo: 180,
      precoVenda: 420,
      observacoes: "Possui pequenos riscos na pintura"
    },
    {
      id: 3,
      nome: "Retrovisor direito Corsa",
      sku: "RET-CORSA-003",
      categoria: "Lataria",
      origemId: 3,
      origem: "Compra avulsa",
      quantidade: 4,
      custo: 65,
      precoVenda: 140,
      observacoes: "Retrovisor manual em bom estado"
    },
    {
      id: 4,
      nome: "Alternador Palio",
      sku: "ALT-PALIO-004",
      categoria: "Motor",
      origemId: 2,
      origem: "Lote de peças diversas",
      quantidade: 1,
      custo: 220,
      precoVenda: 480,
      observacoes: "Testado antes do cadastro"
    },
    {
      id: 5,
      nome: "Lanterna traseira Fox",
      sku: "LAN-FOX-005",
      categoria: "Iluminação",
      origemId: 3,
      origem: "Compra avulsa",
      quantidade: 5,
      custo: 70,
      precoVenda: 160,
      observacoes: "Sem trincas aparentes"
    },
    {
      id: 6,
      nome: "Motor de vidro elétrico Siena",
      sku: "MVE-SIENA-006",
      categoria: "Elétrica",
      origemId: 1,
      origem: "Fiat Uno 2012 para desmonte",
      quantidade: 2,
      custo: 95,
      precoVenda: 210,
      observacoes: "Funcionamento validado em bancada"
    },
    {
      id: 7,
      nome: "Grade dianteira Fiesta",
      sku: "GRA-FIESTA-007",
      categoria: "Lataria",
      origemId: 2,
      origem: "Lote de peças diversas",
      quantidade: 3,
      custo: 90,
      precoVenda: 190,
      observacoes: "Peça com presilhas conservadas"
    },
    {
      id: 8,
      nome: "Tampa traseira Saveiro",
      sku: "TAM-SAV-008",
      categoria: "Lataria",
      origemId: 4,
      origem: "Carro para desmonte",
      quantidade: 1,
      custo: 450,
      precoVenda: 950,
      observacoes: "Necessita polimento"
    }
  ];
}

function obterOrigensTeste() {
  return [
    {
      id: 1,
      tipo: "Carro para desmonte",
      descricao: "Fiat Uno 2012 para desmonte",
      valorPago: 3500,
      dataCompra: "2026-04-23",
      observacoes: "Origem fictícia para teste"
    },
    {
      id: 2,
      tipo: "Lote",
      descricao: "Lote de peças diversas",
      valorPago: 1800,
      dataCompra: "2026-04-23",
      observacoes: "Lote comprado para simulação"
    },
    {
      id: 3,
      tipo: "Compra avulsa",
      descricao: "Compra avulsa de farol usado",
      valorPago: 120,
      dataCompra: "2026-04-24",
      observacoes: "Compra fictícia para teste"
    },
    {
      id: 4,
      tipo: "Carro para desmonte",
      descricao: "Saveiro para desmonte",
      valorPago: 5200,
      dataCompra: "2026-04-24",
      observacoes: "Origem fictícia para teste"
    }
  ];
}

function obterVendasTeste() {
  return [
    {
      id: "VENDA-TESTE-001",
      produtoNome: "Farol esquerdo Fiat Uno",
      sku: "FAR-UNO-001",
      quantidadeVendida: 1,
      precoUnitario: 250,
      valorTotal: 250,
      custoUnitario: 140,
      custoTotal: 140,
      lucroBruto: 110,
      dataVenda: "2026-04-23",
      cliente: "Cliente teste 1",
      observacoes: "Venda fictícia para teste"
    },
    {
      id: "VENDA-TESTE-002",
      produtoNome: "Retrovisor direito Corsa",
      sku: "RET-CORSA-003",
      quantidadeVendida: 1,
      precoUnitario: 140,
      valorTotal: 140,
      custoUnitario: 80,
      custoTotal: 80,
      lucroBruto: 60,
      dataVenda: "2026-04-23",
      cliente: "Cliente teste 2",
      observacoes: "Retirada no balcão"
    },
    {
      id: "VENDA-TESTE-003",
      produtoNome: "Lanterna traseira Fox",
      sku: "LAN-FOX-005",
      quantidadeVendida: 2,
      precoUnitario: 160,
      valorTotal: 320,
      custoUnitario: 70,
      custoTotal: 140,
      lucroBruto: 180,
      dataVenda: "2026-04-24",
      cliente: "Cliente teste 3",
      observacoes: "Venda fictícia para teste"
    },
    {
      id: "VENDA-TESTE-004",
      produtoNome: "Grade dianteira Fiesta",
      sku: "GRA-FIESTA-007",
      quantidadeVendida: 1,
      precoUnitario: 190,
      valorTotal: 190,
      custoUnitario: 90,
      custoTotal: 90,
      lucroBruto: 100,
      dataVenda: "2026-04-24",
      cliente: "Cliente teste 4",
      observacoes: "Pagamento em dinheiro"
    },
    {
      id: "VENDA-TESTE-005",
      produtoNome: "Motor de vidro elétrico Siena",
      sku: "MVE-SIENA-006",
      quantidadeVendida: 1,
      precoUnitario: 210,
      valorTotal: 210,
      custoUnitario: 95,
      custoTotal: 95,
      lucroBruto: 115,
      dataVenda: "2026-04-24",
      cliente: "Cliente teste 5",
      observacoes: "Venda registrada pelo front-end"
    }
  ];
}

function obterCustosTeste() {
  return [
    {
      produtoNome: "Farol esquerdo Fiat Uno",
      sku: "FAR-UNO-001",
      tipo: "Limpeza",
      descricao: "Limpeza da lente e carcaça",
      valor: 20,
      data: "2026-04-23",
      observacoes: "Custo fictício para teste"
    },
    {
      produtoNome: "Para-choque dianteiro Gol G5",
      sku: "PAR-GOLG5-002",
      tipo: "Pintura",
      descricao: "Retoque de pintura",
      valor: 80,
      data: "2026-04-23",
      observacoes: "Custo fictício para teste"
    },
    {
      produtoNome: "Retrovisor direito Corsa",
      sku: "RET-CORSA-003",
      tipo: "Embalagem",
      descricao: "Embalagem reforçada para envio",
      valor: 15,
      data: "2026-04-24",
      observacoes: "Custo fictício para teste"
    },
    {
      produtoNome: "Alternador Palio",
      sku: "ALT-PALIO-004",
      tipo: "Conserto",
      descricao: "Revisão e teste em bancada",
      valor: 60,
      data: "2026-04-24",
      observacoes: "Custo fictício para teste"
    }
  ];
}

function gerarProdutosTeste() {
  localStorage.setItem("produtos", JSON.stringify(obterProdutosTeste()));
}

function gerarOrigensTeste() {
  localStorage.setItem("origens", JSON.stringify(obterOrigensTeste()));
}

function gerarVendasTeste() {
  localStorage.setItem("vendas", JSON.stringify(obterVendasTeste()));
}

function gerarCustosTeste() {
  localStorage.setItem("custosDiversos", JSON.stringify(obterCustosTeste()));
}

function limparDadosTeste() {
  const confirmou = confirm("Deseja limpar os dados de teste?");

  if (!confirmou) {
    return;
  }

  localStorage.removeItem("produtos");
  localStorage.removeItem("vendas");
  localStorage.removeItem("origens");
  localStorage.removeItem("custosDiversos");

  alert("Dados apagados com sucesso.");
}

function gerarTudoTeste() {
  gerarOrigensTeste();
  gerarProdutosTeste();
  gerarVendasTeste();
  gerarCustosTeste();
  alert("Dados de teste gerados com sucesso.");
}
