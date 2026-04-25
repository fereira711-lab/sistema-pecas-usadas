(function () {
  let clienteSupabase = null;

  function supabaseEstaConfigurado() {
    const config = window.SUPABASE_CONFIG || {};

    return Boolean(config.url && config.anonKey);
  }

  function obterCliente() {
    if (!supabaseEstaConfigurado()) {
      return null;
    }

    if (!window.supabase) {
      throw new Error("Biblioteca do Supabase nao foi carregada.");
    }

    if (!clienteSupabase) {
      clienteSupabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      );
    }

    return clienteSupabase;
  }

  function mapearOrigemDoBanco(origem) {
    const tipoOrigem = origem.tipo_origem || origem.tipo;
    const custoTotal = origem.custo_total !== null && origem.custo_total !== undefined
      ? origem.custo_total
      : origem.valor_pago;

    return {
      id: Number(origem.id),
      tipo: tipoOrigem,
      tipoOrigem,
      descricao: origem.descricao,
      valorPago: Number(custoTotal || 0),
      custoTotal: Number(custoTotal || 0),
      custoTipo: origem.custo_tipo || "",
      dataCompra: origem.data_compra,
      observacoes: origem.observacoes || ""
    };
  }

  function mapearOrigemParaBanco(origem) {
    const tipoOrigem = origem.tipoOrigem || origem.tipo;
    const custoTotal = origem.custoTotal !== undefined
      ? origem.custoTotal
      : origem.valorPago;

    return {
      tipo_origem: tipoOrigem,
      tipo: tipoOrigem,
      descricao: origem.descricao,
      custo_total: Number(custoTotal || 0),
      custo_tipo: origem.custoTipo || null,
      valor_pago: Number(custoTotal || 0),
      data_compra: origem.dataCompra || new Date().toISOString().slice(0, 10),
      observacoes: origem.observacoes || null
    };
  }

  function mapearPecaDoBanco(peca) {
    const custoTotal = peca.custo_total !== null && peca.custo_total !== undefined
      ? peca.custo_total
      : peca.custo_atribuido !== null && peca.custo_atribuido !== undefined
        ? peca.custo_atribuido
        : peca.custo;
    const nome = peca.nome || peca.nome_peca || peca.nome_produto || peca.produto_nome || peca.descricao || peca.titulo || peca.produto || `Peca ${peca.id}`;
    const sku = peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "";
    const status = peca.status || "em_estoque";
    const quantidade = peca.quantidade !== undefined ? Number(peca.quantidade || 0) : 1;
    const quantidadeVendida = peca.quantidade_vendida !== undefined
      ? Number(peca.quantidade_vendida || 0)
      : status === "vendida" ? 1 : 0;

    return {
      id: Number(peca.id),
      nome,
      sku,
      categoria: peca.categoria || peca.tipo || "Sem categoria",
      origemId: Number(peca.origem_id || peca.origemId || 0),
      origem: peca.origens ? peca.origens.descricao : "",
      quantidade,
      quantidadeVendida,
      status,
      custo: Number(custoTotal || 0),
      custoTotal: Number(custoTotal || 0),
      tipoCusto: peca.tipo_custo || peca.tipo_custo_atribuido || "real",
      precoVenda: Number(peca.preco_venda || peca.preco_sugerido || 0),
      observacoes: peca.observacoes || ""
    };
  }

  function mapearPecaParaBanco(peca) {
    const custoTotal = peca.custoTotal !== undefined
      ? peca.custoTotal
      : peca.custo;

    return {
      origem_id: Number(peca.origemId),
      nome_peca: peca.nome,
      status: peca.status || "em_estoque",
      preparada: false,
      custo_atribuido: Number(custoTotal || 0),
      tipo_custo_atribuido: peca.tipoCusto || "real",
      preco_sugerido: Number(peca.precoVenda || 0),
      custo_total: Number(custoTotal || 0),
      custo: Number(custoTotal || 0),
      observacoes: peca.observacoes || null
    };
  }

  function mapearCustoPecaDoBanco(custo) {
    return {
      id: Number(custo.id),
      pecaId: Number(custo.peca_id),
      tipo: custo.tipo_custo,
      tipoCusto: custo.tipo_custo,
      descricao: custo.descricao || "",
      valor: Number(custo.valor || 0),
      data: custo.data_custo,
      dataCusto: custo.data_custo
    };
  }

  function mapearCustoPecaParaBanco(custo) {
    return {
      peca_id: Number(custo.pecaId),
      tipo_custo: custo.tipoCusto || custo.tipo,
      descricao: custo.descricao || null,
      valor: Number(custo.valor || 0),
      data_custo: custo.dataCusto || custo.data || new Date().toISOString().slice(0, 10)
    };
  }

  function mapearVendaDoBanco(venda) {
    const itemVenda = Array.isArray(venda.itens_venda) ? venda.itens_venda[0] : null;
    const quantidadeVendida = Number(venda.quantidade_vendida || venda.quantidadeVendida || 1);
    const valorTotal = Number(venda.valor_total || venda.valorTotal || itemVenda?.subtotal || 0);
    const valorUnitario = Number(venda.valor_unitario || venda.valorUnitario || itemVenda?.preco_unitario || valorTotal);

    return {
      id: Number(venda.id),
      pecaId: Number(venda.peca_id || itemVenda?.peca_id || 0),
      quantidadeVendida,
      quantidadeVendidaNaVenda: quantidadeVendida,
      valorUnitario,
      valorVendaUnitario: valorUnitario,
      valorTotal,
      valorVenda: valorTotal,
      canalVenda: venda.canal_venda || "",
      dataVenda: venda.data_venda
    };
  }

  function mapearVendaParaBanco(venda) {
    return {
      cliente_id: Number(venda.clienteId || 1),
      data_venda: venda.dataVenda || new Date().toISOString().slice(0, 10),
      valor_total: Number(venda.valorTotal || venda.valorVenda || 0),
      canal_venda: venda.canalVenda || null,
      observacoes: venda.observacoes || null
    };
  }

  function mapearItemVendaParaBanco(vendaId, venda) {
    const valorTotal = Number(venda.valorTotal || venda.valorVenda || 0);

    return {
      venda_id: Number(vendaId),
      peca_id: Number(venda.pecaId),
      preco_unitario: Number(venda.valorUnitario || venda.valorVendaUnitario || valorTotal || 0),
      subtotal: valorTotal
    };
  }

  function mapearCustoVendaDoBanco(custo) {
    return {
      id: Number(custo.id),
      vendaId: Number(custo.venda_id),
      tipo: custo.tipo_custo,
      tipoCusto: custo.tipo_custo,
      descricao: custo.descricao || "",
      valor: Number(custo.valor || 0),
      data: custo.data_custo,
      dataCusto: custo.data_custo
    };
  }

  function mapearCustoVendaParaBanco(vendaId, custo) {
    return {
      venda_id: Number(vendaId),
      tipo_custo: custo.tipoCusto || custo.tipo,
      descricao: custo.descricao || null,
      valor: Number(custo.valor || 0),
      data_custo: custo.dataCusto || custo.data || new Date().toISOString().slice(0, 10)
    };
  }

  async function listarOrigens() {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("origens")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearOrigemDoBanco);
  }

  async function buscarOrigemPorId(origemId) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("origens")
      .select("*")
      .eq("id", origemId)
      .single();

    if (error) {
      throw error;
    }

    return mapearOrigemDoBanco(data);
  }

  async function listarPecas() {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("pecas")
      .select("*, origens(descricao)")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearPecaDoBanco);
  }

  async function listarPecasPorOrigem(origemId) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("pecas")
      .select("*, origens(descricao)")
      .eq("origem_id", origemId)
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearPecaDoBanco);
  }

  async function buscarPecaPorId(pecaId) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("pecas")
      .select("*, origens(descricao)")
      .eq("id", pecaId)
      .single();

    if (error) {
      throw error;
    }

    return mapearPecaDoBanco(data);
  }

  async function salvarOrigem(origem) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("origens")
      .insert(mapearOrigemParaBanco(origem))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapearOrigemDoBanco(data);
  }

  async function salvarPeca(peca) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("pecas")
      .insert(mapearPecaParaBanco(peca))
      .select("*, origens(descricao)")
      .single();

    if (error) {
      throw error;
    }

    return mapearPecaDoBanco(data);
  }

  async function salvarCustoPeca(custo) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const custoParaBanco = mapearCustoPecaParaBanco(custo);

    const { data, error } = await cliente
      .from("custos_peca")
      .insert({
        peca_id: custoParaBanco.peca_id,
        tipo_custo: custoParaBanco.tipo_custo,
        descricao: custoParaBanco.descricao,
        valor: custoParaBanco.valor,
        data_custo: custoParaBanco.data_custo
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapearCustoPecaDoBanco(data);
  }

  async function salvarCustosVenda(vendaId, custosVenda) {
    const cliente = obterCliente();
    const custosValidos = Array.isArray(custosVenda)
      ? custosVenda.filter(custo => Number(custo.valor || 0) > 0)
      : [];

    if (!cliente || custosValidos.length === 0) {
      return [];
    }

    console.warn("Tabela custos_venda nao existe no Supabase atual. Custos da venda ignorados.", {
      vendaId,
      custosVenda: custosValidos
    });
    return [];
  }

  async function salvarVenda(venda) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const peca = await buscarPecaPorId(venda.pecaId);
    const quantidadeVendidaNaVenda = Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 1);
    const novaQuantidadeVendida = Number(peca.quantidadeVendida || 0) + quantidadeVendidaNaVenda;
    const novoStatus = novaQuantidadeVendida >= Number(peca.quantidade || 1) ? "vendida" : "em_estoque";

    const { data, error } = await cliente
      .from("vendas")
      .insert(mapearVendaParaBanco(venda))
      .select()
      .single();

    if (error) {
      throw error;
    }

    const { data: itemVenda, error: erroItemVenda } = await cliente
      .from("itens_venda")
      .insert(mapearItemVendaParaBanco(data.id, venda))
      .select()
      .single();

    if (erroItemVenda) {
      throw erroItemVenda;
    }

    const custosVenda = await salvarCustosVenda(data.id, venda.custosVenda);

    const { error: erroAtualizacao } = await cliente
      .from("pecas")
      .update({
        status: novoStatus
      })
      .eq("id", venda.pecaId);

    if (erroAtualizacao) {
      throw erroAtualizacao;
    }

    return {
      venda: {
        ...mapearVendaDoBanco({
          ...data,
          itens_venda: [itemVenda],
          quantidadeVendida: quantidadeVendidaNaVenda
        }),
        custosVenda,
        totalCustosVenda: custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0)
      },
      peca: {
        ...peca,
        quantidadeVendida: novaQuantidadeVendida,
        status: novoStatus
      }
    };
  }

  window.supabaseService = {
    estaConfigurado: supabaseEstaConfigurado,
    listarOrigens,
    buscarOrigemPorId,
    listarPecas,
    listarPecasPorOrigem,
    buscarPecaPorId,
    salvarOrigem,
    salvarPeca,
    salvarCustoPeca,
    salvarCustosVenda,
    salvarVenda
  };
})();
