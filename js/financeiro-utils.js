(function () {
  function obterId(valor) {
    return Number(valor || 0);
  }

  function obterQuantidadeVenda(venda) {
    return Number(venda?.quantidadeVendida || venda?.quantidadeVendidaNaVenda || venda?.quantidade_vendida || 0);
  }

  function somar(lista, campo = "valor") {
    return (lista || []).reduce((total, item) => total + Number(item?.[campo] || 0), 0);
  }

  function filtrarPorId(lista, campo, id) {
    const idNormalizado = obterId(id);
    return (lista || []).filter(item => obterId(item?.[campo]) === idNormalizado);
  }

  function calcularReceitaVenda(venda) {
    const valorTotal = Number(venda?.valorTotal || venda?.valorVenda || venda?.valor_total || 0);

    if (Number.isFinite(valorTotal) && valorTotal > 0) {
      return valorTotal;
    }

    const quantidade = obterQuantidadeVenda(venda);
    const valorUnitario = Number(venda?.valorUnitario || venda?.valorVendaUnitario || venda?.valor_unitario || venda?.precoUnitario || 0);
    return quantidade * valorUnitario;
  }

  function calcularCustoConsumidoVenda(vendaId, consumos) {
    const consumosDaVenda = filtrarPorId(consumos, "vendaId", vendaId);

    return {
      calculado: consumosDaVenda.length > 0,
      valor: consumosDaVenda.length > 0 ? somar(consumosDaVenda, "custoTotal") : null,
      consumos: consumosDaVenda
    };
  }

  function calcularCustosVenda(vendaId, custosVenda) {
    const custosDaVenda = filtrarPorId(custosVenda, "vendaId", vendaId);

    return {
      valor: somar(custosDaVenda, "valor"),
      custos: custosDaVenda
    };
  }

  function calcularCustosPeca(pecaId, custosPeca) {
    const custosDaPeca = filtrarPorId(custosPeca, "pecaId", pecaId);

    return {
      valor: somar(custosDaPeca, "valor"),
      custos: custosDaPeca
    };
  }

  function obterQuantidadeOrigensDaPeca(pecaId, entradas) {
    const origens = new Set(
      (entradas || [])
        .filter(entrada => obterId(entrada?.pecaId) === obterId(pecaId))
        .map(entrada => obterId(entrada?.origemId))
        .filter(origemId => origemId > 0)
    );

    return origens.size;
  }

  function calcularLucroVenda(venda, consumos, custosVenda) {
    const receita = calcularReceitaVenda(venda);
    const custoConsumido = calcularCustoConsumidoVenda(venda?.id, consumos);
    const custosDaVenda = calcularCustosVenda(venda?.id, custosVenda);

    if (!custoConsumido.calculado) {
      return {
        calculado: false,
        motivo: "custo nao calculado",
        receita,
        custoConsumido: null,
        custosVenda: custosDaVenda.valor,
        lucro: null,
        margem: null
      };
    }

    const lucro = receita - custoConsumido.valor - custosDaVenda.valor;

    return {
      calculado: true,
      receita,
      custoConsumido: custoConsumido.valor,
      custosVenda: custosDaVenda.valor,
      lucro,
      margem: receita > 0 ? (lucro / receita) * 100 : null
    };
  }

  function calcularLucroPeca(peca, vendas, consumos, custosPeca, custosVenda) {
    const pecaId = obterId(peca?.id);
    const vendasDaPeca = filtrarPorId(vendas, "pecaId", pecaId);
    const custosDaPeca = calcularCustosPeca(pecaId, custosPeca);
    const receitas = vendasDaPeca.reduce((total, venda) => total + calcularReceitaVenda(venda), 0);
    const resultadosVenda = vendasDaPeca.map(venda => calcularLucroVenda(venda, consumos, custosVenda));
    const vendasSemCusto = resultadosVenda.filter(resultado => !resultado.calculado).length;

    if (vendasSemCusto > 0) {
      return {
        calculado: false,
        motivo: "custo nao calculado",
        receita: receitas,
        custoConsumido: null,
        custosPeca: custosDaPeca.valor,
        custosVenda: resultadosVenda.reduce((total, resultado) => total + Number(resultado.custosVenda || 0), 0),
        lucro: null,
        margem: null,
        vendasSemCusto,
        vendas: vendasDaPeca
      };
    }

    const custoConsumido = resultadosVenda.reduce((total, resultado) => total + Number(resultado.custoConsumido || 0), 0);
    const custosDasVendas = resultadosVenda.reduce((total, resultado) => total + Number(resultado.custosVenda || 0), 0);
    const lucro = receitas - custoConsumido - custosDaPeca.valor - custosDasVendas;

    return {
      calculado: true,
      receita: receitas,
      custoConsumido,
      custosPeca: custosDaPeca.valor,
      custosVenda: custosDasVendas,
      lucro,
      margem: receitas > 0 ? (lucro / receitas) * 100 : null,
      vendasSemCusto: 0,
      vendas: vendasDaPeca
    };
  }

  function calcularResultadoOrigem(origem, entradas, vendas, consumos, custosPeca, custosVenda) {
    const origemId = obterId(origem?.id);
    const entradasDaOrigem = filtrarPorId(entradas, "origemId", origemId);
    const idsEntradas = new Set(entradasDaOrigem.map(entrada => obterId(entrada.id)));
    const consumosDaOrigem = (consumos || []).filter(consumo => idsEntradas.has(obterId(consumo.entradaEstoqueId)));
    const idsVendas = new Set(consumosDaOrigem.map(consumo => obterId(consumo.vendaId)));
    const vendasDaOrigem = (vendas || []).filter(venda => idsVendas.has(obterId(venda.id)));
    const idsPecas = new Set(entradasDaOrigem.map(entrada => obterId(entrada.pecaId)));
    const custosPecaDaOrigem = (custosPeca || []).filter(custo => (
      idsPecas.has(obterId(custo.pecaId)) &&
      obterQuantidadeOrigensDaPeca(custo.pecaId, entradas) <= 1
    ));
    const custosPecaNaoAtribuidos = (custosPeca || []).filter(custo => (
      idsPecas.has(obterId(custo.pecaId)) &&
      obterQuantidadeOrigensDaPeca(custo.pecaId, entradas) > 1
    ));
    const custosVendaDaOrigem = (custosVenda || []).filter(custo => idsVendas.has(obterId(custo.vendaId)));
    const receita = vendasDaOrigem.reduce((total, venda) => total + calcularReceitaVenda(venda), 0);
    const custoConsumido = somar(consumosDaOrigem, "custoTotal");
    const totalCustosPeca = somar(custosPecaDaOrigem, "valor");
    const totalCustosPecaNaoAtribuidos = somar(custosPecaNaoAtribuidos, "valor");
    const totalCustosVenda = somar(custosVendaDaOrigem, "valor");
    const lucro = receita - custoConsumido - totalCustosPeca - totalCustosVenda;
    // Quanto a origem já devolveu em dinheiro: receita das vendas das peças dela menos os custos dessas vendas.
    const recuperado = receita - totalCustosVenda;

    return {
      calculado: true,
      receita,
      recuperado,
      custoConsumido,
      custosPeca: totalCustosPeca,
      custosPecaNaoAtribuidos: totalCustosPecaNaoAtribuidos,
      custosVenda: totalCustosVenda,
      lucro,
      margem: receita > 0 ? (lucro / receita) * 100 : null,
      vendas: vendasDaOrigem,
      consumos: consumosDaOrigem,
      possuiCustosPecaNaoAtribuidos: totalCustosPecaNaoAtribuidos > 0
    };
  }

  // Retorno da origem (Detalhes da origem): quanto já voltou em dinheiro, o resultado contra o valor pago,
  // o que ainda está em estoque (a preço de venda) e a conta de cada peça. Usa calcularResultadoOrigem e
  // calcularLucroVenda; não cria regra de custo nova (custo vem das entradas e dos consumos registrados).
  // resultado = recuperado − valor pago (mesma conta do "Retorno por origem" do Painel).
  function calcularRetornoOrigem(origem, dados = {}) {
    const origemId = obterId(origem?.id);
    const entradas = dados.entradas || [];
    const consumos = dados.consumos || [];
    const custosPeca = dados.custosPeca || [];
    const custosVenda = dados.custosVenda || [];
    const resultadoOrigem = calcularResultadoOrigem(origem, entradas, dados.vendas, consumos, custosPeca, custosVenda);
    const valorPago = Number(origem?.valorPago || origem?.custoTotal || 0);
    const recuperado = resultadoOrigem.recuperado;
    const entradasDaOrigem = filtrarPorId(entradas, "origemId", origemId);
    const idsPecas = [...new Set(entradasDaOrigem.map(entrada => obterId(entrada.pecaId)))];
    const pecasPorId = new Map((dados.pecas || []).map(peca => [obterId(peca.id), peca]));

    const pecas = idsPecas.map(pecaId => {
      const peca = pecasPorId.get(pecaId) || { id: pecaId };
      const entradasDaPeca = entradasDaOrigem.filter(entrada => obterId(entrada.pecaId) === pecaId);
      const quantidade = somar(entradasDaPeca, "quantidadeTotal");
      const saldo = entradasDaPeca.reduce((total, entrada) => (
        total + Math.max(0, Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0))
      ), 0);
      const custoAtribuido = entradasDaPeca.reduce((total, entrada) => (
        total + Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0)
      ), 0);
      const vendas = resultadoOrigem.vendas.filter(venda => obterId(venda.pecaId) === pecaId);
      const resultadosVenda = vendas.map(venda => calcularLucroVenda(venda, consumos, custosVenda));
      const receita = resultadosVenda.reduce((total, resultado) => total + resultado.receita, 0);
      // Custo lançado na peça só entra quando a peça tem uma origem só (mesma regra do resultado da origem).
      const custosDaPeca = obterQuantidadeOrigensDaPeca(pecaId, entradas) <= 1 ? calcularCustosPeca(pecaId, custosPeca).valor : 0;
      const lucroCalculado = vendas.length > 0 && resultadosVenda.every(resultado => resultado.calculado);
      const precoVenda = Number(peca.precoVenda || peca.preco_venda || 0);

      return {
        peca,
        quantidade,
        saldo,
        vendida: saldo <= 0 && vendas.length > 0,
        custoAtribuido,
        receita,
        vendas,
        precoVenda,
        valorEstoque: precoVenda > 0 ? saldo * precoVenda : 0,
        lucro: vendas.length === 0
          ? null
          : {
              calculado: lucroCalculado,
              valor: lucroCalculado
                ? resultadosVenda.reduce((total, resultado) => total + resultado.lucro, 0) - custosDaPeca
                : null
            }
      };
    });

    const pecasEmEstoque = pecas.filter(item => item.saldo > 0);

    return {
      valorPago,
      recuperado,
      resultado: recuperado - valorPago,
      percentualRecuperado: valorPago > 0 ? (recuperado / valorPago) * 100 : null,
      jaSePagou: valorPago > 0 && recuperado >= valorPago,
      faltaParaSePagar: Math.max(0, valorPago - recuperado),
      valorDistribuido: entradasDaOrigem.reduce((total, entrada) => (
        total + Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0)
      ), 0),
      estoque: {
        unidades: pecasEmEstoque.reduce((total, item) => total + item.saldo, 0),
        pecas: pecasEmEstoque.length,
        valorPrecoVenda: pecasEmEstoque.reduce((total, item) => total + item.valorEstoque, 0),
        pecasSemPreco: pecasEmEstoque.filter(item => item.precoVenda <= 0).length
      },
      pecasVendidas: pecas.filter(item => item.vendida).length,
      pecas,
      resultadoOrigem
    };
  }

  // Ordem de consumo do estoque (regra oficial): data de entrada e depois id.
  function compararOrdemConsumo(a, b) {
    const dataA = String(a?.dataEntrada || a?.data_entrada || "");
    const dataB = String(b?.dataEntrada || b?.data_entrada || "");

    if (dataA !== dataB) {
      return dataA.localeCompare(dataB);
    }

    return obterId(a?.id) - obterId(b?.id);
  }

  // Custo de referência de uma peça, sem custo médio:
  // - com saldo: custo unitário da entrada mais antiga com saldo (a próxima unidade a ser consumida);
  // - sem saldo: custo unitário da última unidade consumida;
  // - sem entrada: não calculado.
  function calcularCustoReferenciaPeca(pecaId, entradas, consumos) {
    const entradasDaPeca = filtrarPorId(entradas, "pecaId", pecaId);
    const proximaEntrada = entradasDaPeca
      .filter(entrada => Number(entrada?.quantidadeTotal || 0) - Number(entrada?.quantidadeConsumida || 0) > 0)
      .sort(compararOrdemConsumo)[0];

    if (proximaEntrada) {
      return { calculado: true, valor: Number(proximaEntrada.custoUnitario || 0), fonte: "proxima-entrada", entrada: proximaEntrada };
    }

    const ultimoConsumo = filtrarPorId(consumos, "pecaId", pecaId).sort((a, b) => obterId(b?.id) - obterId(a?.id))[0];

    if (ultimoConsumo) {
      const quantidade = Number(ultimoConsumo.quantidadeConsumida || 0);
      const custoUnitario = Number(ultimoConsumo.custoUnitario || 0) || (quantidade > 0 ? Number(ultimoConsumo.custoTotal || 0) / quantidade : 0);
      return { calculado: true, valor: custoUnitario, fonte: "ultima-venda", consumo: ultimoConsumo };
    }

    return { calculado: false, valor: null, fonte: null };
  }

  // Prévia do custo de uma venda antes de registrar: percorre as entradas com saldo na mesma ordem
  // de consumo (compararOrdemConsumo) e soma o custo das N próximas unidades. Com quantidade 1 é o
  // mesmo valor de calcularCustoReferenciaPeca. O custo oficial continua vindo do banco ao registrar.
  function estimarCustoVendaPeca(pecaId, quantidade, entradas) {
    let restante = Math.max(0, Math.floor(Number(quantidade || 0)));
    const pedida = restante;
    let valor = 0;
    const partes = [];

    filtrarPorId(entradas, "pecaId", pecaId)
      .map(entrada => ({ entrada, saldo: Number(entrada?.quantidadeTotal || 0) - Number(entrada?.quantidadeConsumida || 0) }))
      .filter(item => item.saldo > 0)
      .sort((a, b) => compararOrdemConsumo(a.entrada, b.entrada))
      .forEach(({ entrada, saldo }) => {
        if (restante <= 0) return;
        const usar = Math.min(saldo, restante);
        const custoUnitario = Number(entrada.custoUnitario || 0);
        valor += usar * custoUnitario;
        partes.push({ entradaId: obterId(entrada.id), quantidade: usar, custoUnitario });
        restante -= usar;
      });

    return {
      calculado: pedida > 0 && restante === 0,
      valor: pedida > 0 && restante === 0 ? valor : null,
      quantidadeSemEstoque: restante,
      partes
    };
  }

  // Margem prevista sobre o preço de venda cadastrado: (preço − custo) / preço.
  function calcularMargemPreco(preco, custo) {
    const precoNumero = Number(preco || 0);

    if (!(precoNumero > 0) || custo === null || custo === undefined) {
      return null;
    }

    return ((precoNumero - Number(custo)) / precoNumero) * 100;
  }

  window.financeiroUtils = {
    calcularCustoReferenciaPeca,
    estimarCustoVendaPeca,
    calcularMargemPreco,
    calcularReceitaVenda,
    calcularCustoConsumidoVenda,
    calcularCustosVenda,
    calcularCustosPeca,
    calcularLucroVenda,
    calcularLucroPeca,
    calcularResultadoOrigem,
    calcularRetornoOrigem
  };
})();
