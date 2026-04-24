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
    return {
      id: Number(origem.id),
      tipo: origem.tipo,
      descricao: origem.descricao,
      valorPago: Number(origem.valor_pago || 0),
      dataCompra: origem.data_compra,
      observacoes: origem.observacoes || ""
    };
  }

  function mapearOrigemParaBanco(origem) {
    return {
      tipo: origem.tipo,
      descricao: origem.descricao,
      valor_pago: Number(origem.valorPago || 0),
      data_compra: origem.dataCompra,
      observacoes: origem.observacoes || null
    };
  }

  function mapearPecaDoBanco(peca) {
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
      custo: Number(peca.custo || 0),
      tipoCusto: peca.tipo_custo,
      precoVenda: Number(peca.preco_venda || 0),
      observacoes: peca.observacoes || ""
    };
  }

  function mapearPecaParaBanco(peca) {
    return {
      origem_id: Number(peca.origemId),
      nome: peca.nome,
      sku: peca.sku || null,
      categoria: peca.categoria,
      quantidade: Number(peca.quantidade || 0),
      quantidade_vendida: Number(peca.quantidadeVendida || 0),
      status: peca.status,
      custo: Number(peca.custo || 0),
      tipo_custo: peca.tipoCusto,
      preco_venda: Number(peca.precoVenda || 0),
      observacoes: peca.observacoes || null
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

  window.supabaseService = {
    estaConfigurado: supabaseEstaConfigurado,
    listarOrigens,
    buscarOrigemPorId,
    listarPecas,
    listarPecasPorOrigem,
    salvarOrigem,
    salvarPeca
  };
})();
