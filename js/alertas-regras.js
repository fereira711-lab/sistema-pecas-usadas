// Regras de "precisa de atenção" do redesenho (seção 8 da especificação), pensadas para desmanche:
// - quantidade 1 não é alerta e peça recém-cadastrada sem venda também não;
// - peça parada há mais de 90 dias (sem venda desde a entrada), com o valor parado;
// - venda sem custo calculado, venda com prejuízo, origem com valor a distribuir e distribuição acima do pago;
// - peça em estoque com preço abaixo do custo (aprovada depois da Fase 3).
// Funções puras: recebem os dados já carregados e não tocam no DOM. Lucro e prejuízo vêm do financeiro-utils.js.
(function () {
  const DIAS_PARA_PECA_PARADA = 90;
  const TOLERANCIA = 0.009;
  const UM_DIA_MS = 24 * 60 * 60 * 1000;

  function obterId(valor) {
    return Number(valor || 0);
  }

  function obterSaldoEntrada(entrada) {
    return Math.max(0, Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0));
  }

  function obterValorEntrada(entrada) {
    return Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0);
  }

  function dataDoDia(valor) {
    const texto = String(valor || "").slice(0, 10);
    const [ano, mes, dia] = texto.split("-").map(Number);
    return ano && mes && dia ? Date.UTC(ano, mes - 1, dia) : null;
  }

  function hojeUtc(hoje) {
    // Checagem pelo metodo (e nao "instanceof Date") para aceitar datas vindas de outro contexto, como nos testes.
    const data = hoje && typeof hoje.getFullYear === "function" ? hoje : new Date();
    return Date.UTC(data.getFullYear(), data.getMonth(), data.getDate());
  }

  function agruparPor(lista, campo) {
    return (lista || []).reduce((mapa, item) => {
      const id = obterId(item?.[campo]);
      (mapa[id] = mapa[id] || []).push(item);
      return mapa;
    }, {});
  }

  function calcularPecasParadas(dados, hoje) {
    const hojeMs = hojeUtc(hoje);
    const vendasPorPeca = agruparPor(dados.vendas, "pecaId");
    const entradasPorPeca = agruparPor(dados.entradasEstoque, "pecaId");

    return (dados.pecas || []).flatMap(peca => {
      const pecaId = obterId(peca.id);
      const datasVenda = (vendasPorPeca[pecaId] || []).map(venda => dataDoDia(venda.dataVenda)).filter(Boolean);
      const ultimaVenda = datasVenda.length ? Math.max(...datasVenda) : null;

      // Entrada parada: ainda tem saldo, entrou há mais de 90 dias e a peça não vendeu desde essa entrada.
      const entradasParadas = (entradasPorPeca[pecaId] || []).filter(entrada => {
        const dataEntrada = dataDoDia(entrada.dataEntrada || entrada.createdAt);
        if (!dataEntrada || obterSaldoEntrada(entrada) <= 0) return false;
        const dias = Math.floor((hojeMs - dataEntrada) / UM_DIA_MS);
        return dias > DIAS_PARA_PECA_PARADA && (ultimaVenda === null || ultimaVenda < dataEntrada);
      });

      if (entradasParadas.length === 0) {
        return [];
      }

      const entradaMaisAntiga = Math.min(...entradasParadas.map(entrada => dataDoDia(entrada.dataEntrada || entrada.createdAt)));

      return [{
        peca,
        dias: Math.floor((hojeMs - entradaMaisAntiga) / UM_DIA_MS),
        quantidade: entradasParadas.reduce((total, entrada) => total + obterSaldoEntrada(entrada), 0),
        valorParado: entradasParadas.reduce((total, entrada) => total + obterSaldoEntrada(entrada) * Number(entrada.custoUnitario || 0), 0)
      }];
    });
  }

  function obterPrecoPeca(peca) {
    return Number(peca.precoVenda || peca.preco_venda || peca.preco_sugerido || 0);
  }

  // Peça com saldo cujo preço cadastrado não cobre o custo da próxima unidade a sair.
  // Peça sem preço não entra aqui (é "Sem preço" em Produtos, não prejuízo).
  function calcularPrecosAbaixoDoCusto(dados, financeiro) {
    const entradasPorPeca = agruparPor(dados.entradasEstoque, "pecaId");

    return (dados.pecas || []).flatMap(peca => {
      const preco = obterPrecoPeca(peca);
      const entradas = entradasPorPeca[obterId(peca.id)] || [];
      const saldo = entradas.reduce((total, entrada) => total + obterSaldoEntrada(entrada), 0);

      if (preco <= 0 || saldo <= 0) {
        return [];
      }

      const custo = financeiro.calcularCustoReferenciaPeca(peca.id, dados.entradasEstoque, dados.consumosEstoque);

      if (!custo.calculado || preco >= custo.valor - TOLERANCIA) {
        return [];
      }

      return [{
        peca,
        preco,
        custo: custo.valor,
        diferenca: custo.valor - preco,
        margem: financeiro.calcularMargemPreco(preco, custo.valor)
      }];
    });
  }

  function calcularResultadosVendas(dados, financeiro) {
    return (dados.vendas || []).map(venda => ({
      venda,
      resultado: financeiro.calcularLucroVenda(venda, dados.consumosEstoque, dados.custosVenda)
    }));
  }

  function calcularDistribuicaoOrigens(dados) {
    const entradasPorOrigem = agruparPor(dados.entradasEstoque, "origemId");

    return (dados.origens || []).map(origem => {
      const valorPago = Number(origem.valorPago || origem.custoTotal || 0);
      const valorDistribuido = (entradasPorOrigem[obterId(origem.id)] || []).reduce((total, entrada) => total + obterValorEntrada(entrada), 0);
      return { origem, valorPago, valorDistribuido, diferenca: valorPago - valorDistribuido };
    });
  }

  // Devolve os grupos de atenção já na ordem de exibição (mais grave primeiro). Cada grupo tem
  // a lista de ocorrências para que as telas montem o texto e o link que precisarem.
  function calcularAtencao(dados, opcoes = {}) {
    const financeiro = opcoes.financeiro || window.financeiroUtils;
    const hoje = opcoes.hoje || new Date();

    if (!financeiro) {
      throw new Error("financeiro-utils.js precisa estar carregado para calcular os alertas.");
    }

    const resultadosVendas = calcularResultadosVendas(dados, financeiro);
    const distribuicao = calcularDistribuicaoOrigens(dados).filter(item => item.valorPago > 0);

    const grupos = [
      {
        tipo: "venda-prejuizo",
        gravidade: "danger",
        itens: resultadosVendas.filter(item => item.resultado.calculado && item.resultado.lucro < -TOLERANCIA)
      },
      {
        tipo: "distribuicao-acima",
        gravidade: "danger",
        itens: distribuicao.filter(item => item.diferenca < -TOLERANCIA)
      },
      {
        tipo: "venda-sem-custo",
        gravidade: "warning",
        itens: resultadosVendas.filter(item => !item.resultado.calculado)
      },
      {
        tipo: "preco-abaixo-custo",
        gravidade: "warning",
        itens: calcularPrecosAbaixoDoCusto(dados, financeiro)
      },
      {
        tipo: "peca-parada",
        gravidade: "warning",
        itens: calcularPecasParadas(dados, hoje)
      },
      {
        tipo: "origem-a-distribuir",
        gravidade: "info",
        itens: distribuicao.filter(item => item.diferenca > TOLERANCIA)
      }
    ];

    return grupos.filter(grupo => grupo.itens.length > 0);
  }

  // Quantos tipos de problema existem agora (é o número do contador da sidebar).
  function contarGruposDeAtencao(dados, opcoes = {}) {
    return calcularAtencao(dados, opcoes).length;
  }

  window.alertasRegras = {
    DIAS_PARA_PECA_PARADA,
    calcularPecasParadas,
    calcularPrecosAbaixoDoCusto,
    calcularAtencao,
    contarGruposDeAtencao
  };
})();
