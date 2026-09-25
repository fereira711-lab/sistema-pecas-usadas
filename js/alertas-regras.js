// Regras de "precisa de atenção" do redesenho (seção 8 da especificação), pensadas para desmanche:
// - quantidade 1 não é alerta e peça recém-cadastrada sem venda também não;
// - peça parada há mais de 90 dias sem venda (a mesma regra do Giro de estoque), com o valor parado;
// - venda sem custo calculado, venda com prejuízo, origem com valor a distribuir e distribuição acima do pago;
// - peça em estoque com preço abaixo do custo (aprovada depois da Fase 3).
// Funções puras: recebem os dados já carregados e não tocam no DOM. Lucro e prejuízo vêm do financeiro-utils.js.
(function () {
  const DIAS_PARA_PECA_PARADA = 90;
  const DIAS_PARA_GIRO_LENTO = 30;
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

  // Peça parada = "Parado" do Giro de estoque (classificarGiroPecas): tem saldo e está há mais de 90 dias
  // sem venda (contando da última venda ou, sem venda desde a entrada, da entrada mais antiga com saldo).
  // Uma regra só para Produtos, Painel, Alertas, Detalhes da origem e Giro (decisão de Rafael, 2026-09-25).
  // Com "financeiro", o valor parado inclui os custos lançados na peça que ainda estão em estoque.
  function calcularPecasParadas(dados, hoje, financeiro = null) {
    const entradasPorPeca = agruparPor(dados.entradasEstoque, "pecaId");
    const custosEmEstoque = pecaId => (financeiro?.calcularCustosPecaEmEstoque && dados.custosPeca
      ? financeiro.calcularCustosPecaEmEstoque(pecaId, dados.custosPeca, dados.entradasEstoque)
      : 0);

    return classificarGiroPecas(dados, hoje)
      .filter(item => item.chave === "parado")
      .map(item => {
        const entradasComSaldo = (entradasPorPeca[obterId(item.peca.id)] || []).filter(entrada => obterSaldoEntrada(entrada) > 0);
        return {
          peca: item.peca,
          dias: item.dias,
          quantidade: item.saldo,
          valorParado: entradasComSaldo.reduce((total, entrada) => total + obterSaldoEntrada(entrada) * Number(entrada.custoUnitario || 0), 0) +
            custosEmEstoque(item.peca.id)
        };
      });
  }

  // Giro de estoque (Análises), nas mesmas faixas do resto do sistema (decisão de 2026-09-25):
  // Girando até 30 dias, Lento de 31 a 90, Parado acima de 90 (o mesmo limite da peça parada).
  // Os dias contam desde a última venda ou, sem venda desde que a peça entrou, desde a entrada
  // mais antiga que ainda tem saldo. Peça sem saldo fica "Sem estoque".
  function classificarGiroPecas(dados, hoje) {
    const hojeMs = hojeUtc(hoje);
    const vendasPorPeca = agruparPor(dados.vendas, "pecaId");
    const entradasPorPeca = agruparPor(dados.entradasEstoque, "pecaId");

    return (dados.pecas || []).map(peca => {
      const pecaId = obterId(peca.id);
      const entradas = entradasPorPeca[pecaId] || [];
      const datasVenda = (vendasPorPeca[pecaId] || []).map(venda => dataDoDia(venda.dataVenda)).filter(Boolean);
      const ultimaVenda = datasVenda.length ? Math.max(...datasVenda) : null;
      const saldo = entradas.reduce((total, entrada) => total + obterSaldoEntrada(entrada), 0);
      const datasEntradaComSaldo = entradas
        .filter(entrada => obterSaldoEntrada(entrada) > 0)
        .map(entrada => dataDoDia(entrada.dataEntrada || entrada.createdAt))
        .filter(Boolean);
      const entradaComSaldo = datasEntradaComSaldo.length ? Math.min(...datasEntradaComSaldo) : null;
      const base = Math.max(ultimaVenda || 0, entradaComSaldo || 0) || null;
      const dias = base === null ? null : Math.max(0, Math.floor((hojeMs - base) / UM_DIA_MS));

      let chave = "sem-estoque";
      if (saldo > 0) {
        chave = dias === null || dias <= DIAS_PARA_GIRO_LENTO ? "girando" : dias <= DIAS_PARA_PECA_PARADA ? "lento" : "parado";
      }

      return { peca, chave, dias, saldo, ultimaVenda: ultimaVenda === null ? "" : new Date(ultimaVenda).toISOString().slice(0, 10) };
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

      const custo = financeiro.calcularCustoReferenciaPeca(peca.id, dados.entradasEstoque, dados.consumosEstoque, dados.custosPeca || []);

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
      resultado: financeiro.calcularLucroVenda(venda, dados.consumosEstoque, dados.custosVenda, { custosPeca: dados.custosPeca || [], entradas: dados.entradasEstoque })
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
        itens: calcularPecasParadas(dados, hoje, financeiro)
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
    DIAS_PARA_GIRO_LENTO,
    calcularPecasParadas,
    classificarGiroPecas,
    calcularPrecosAbaixoDoCusto,
    calcularAtencao,
    contarGruposDeAtencao
  };
})();
