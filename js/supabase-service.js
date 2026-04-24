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
      : peca.custo;

    return {
      id: Number(peca.id),
      nome: peca.nome,
      sku: peca.sku || "",
      categoria: peca.categoria,
      origemId: Number(peca.origem_id),
      origem: peca.origens ? peca.origens.descricao : "",
      quantidade: Number(peca.quantidade || 0),
      quantidadeVendida: Number(peca.quantidade_vendida || 0),
      status: peca.status,
      custo: Number(custoTotal || 0),
      custoTotal: Number(custoTotal || 0),
      tipoCusto: peca.tipo_custo,
      precoVenda: Number(peca.preco_venda || 0),
      observacoes: peca.observacoes || ""
    };
  }

  function mapearPecaParaBanco(peca) {
    const custoTotal = peca.custoTotal !== undefined
      ? peca.custoTotal
      : peca.custo;

    return {
      origem_id: Number(peca.origemId),
      nome: peca.nome,
      sku: peca.sku || null,
      categoria: peca.categoria || "Sem categoria",
      quantidade: Number(peca.quantidade || 1),
      quantidade_vendida: Number(peca.quantidadeVendida || 0),
      status: peca.status || "em_estoque",
      custo_total: Number(custoTotal || 0),
      custo: Number(custoTotal || 0),
      tipo_custo: peca.tipoCusto,
      preco_venda: Number(peca.precoVenda || 0),
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
    const quantidadeVendida = Number(venda.quantidade_vendida || 0);
    const valorUnitario = Number(venda.valor_unitario || 0);

    return {
      id: Number(venda.id),
      pecaId: Number(venda.peca_id),
      quantidadeVendida,
      quantidadeVendidaNaVenda: quantidadeVendida,
      valorUnitario,
      valorVendaUnitario: valorUnitario,
      valorTotal: quantidadeVendida * valorUnitario,
      valorVenda: quantidadeVendida * valorUnitario,
      canalVenda: venda.canal_venda || "",
      dataVenda: venda.data_venda
    };
  }

  function mapearVendaParaBanco(venda) {
    return {
      peca_id: Number(venda.pecaId),
      quantidade_vendida: Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0),
      valor_unitario: Number(venda.valorUnitario || venda.valorVendaUnitario || 0),
      canal_venda: venda.canalVenda || null
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

    const { data, error } = await cliente
      .from("custos_peca")
      .insert(mapearCustoPecaParaBanco(custo))
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

    const { data, error } = await cliente
      .from("custos_venda")
      .insert(custosValidos.map(custo => mapearCustoVendaParaBanco(vendaId, custo)))
      .select();

    if (error) {
      throw error;
    }

    return data.map(mapearCustoVendaDoBanco);
  }

  async function salvarVenda(venda) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const peca = await buscarPecaPorId(venda.pecaId);
    const quantidadeVendidaNaVenda = Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0);
    const novaQuantidadeVendida = Number(peca.quantidadeVendida || 0) + quantidadeVendidaNaVenda;
    const novoStatus = novaQuantidadeVendida >= Number(peca.quantidade || 1)
      ? "vendida"
      : "em_estoque";

    const { data, error } = await cliente
      .from("vendas")
      .insert(mapearVendaParaBanco(venda))
      .select()
      .single();

    if (error) {
      throw error;
    }

    const custosVenda = await salvarCustosVenda(data.id, venda.custosVenda);

    const { error: erroAtualizacao } = await cliente
      .from("pecas")
      .update({
        quantidade_vendida: novaQuantidadeVendida,
        status: novoStatus
      })
      .eq("id", venda.pecaId);

    if (erroAtualizacao) {
      throw erroAtualizacao;
    }

    return {
      venda: {
        ...mapearVendaDoBanco(data),
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
