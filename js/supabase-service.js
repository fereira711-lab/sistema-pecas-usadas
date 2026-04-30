(function () {
  let clienteSupabase = null;

  function supabaseEstaConfigurado() {
    const config = window.SUPABASE_CONFIG || {};
    const url = String(config.url || "").trim();
    const anonKey = String(config.anonKey || "").trim();

    return Boolean(
      url &&
      anonKey &&
      url !== "https://SEU-PROJETO.supabase.co" &&
      url !== "SUA_URL_AQUI" &&
      anonKey !== "SUA_CHAVE_ANON_PUBLIC"
    );
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
      produtoSku: origem.produto_sku || origem.produtoSku || "",
      quantidadeTotal: Number(origem.quantidade_total || origem.quantidadeTotal || 0),
      valorPago: Number(custoTotal || 0),
      custoTotal: Number(custoTotal || 0),
      custoUnitario: Number(origem.quantidade_total || 0) > 0
        ? Number(custoTotal || 0) / Number(origem.quantidade_total || 0)
        : 0,
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
      produto_sku: origem.produtoSku || origem.produto_sku || null,
      quantidade_total: Number(origem.quantidadeTotal || origem.quantidade_total || 0),
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
      createdAt: peca.created_at,
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
      sku: peca.sku || null,
      quantidade: Number(peca.quantidade || 1),
      quantidade_vendida: Number(peca.quantidadeVendida || 0),
      status: peca.status || "em_estoque",
      custo_total: Number(custoTotal || 0),
      custo: Number(custoTotal || 0),
      custo_atribuido: Number(custoTotal || 0),
      tipo_custo_atribuido: peca.tipoCusto || "real",
      preco_sugerido: Number(peca.precoVenda || 0),
      preparada: Boolean(peca.preparada),
      observacoes: peca.observacoes || null
    };
  }

  function mapearPecaParaAtualizacaoBanco(peca) {
    const custoTotal = peca.custoTotal !== undefined
      ? peca.custoTotal
      : peca.custo;

    return {
      origem_id: Number(peca.origemId),
      nome_peca: peca.nome,
      sku: peca.sku || null,
      quantidade: Number(peca.quantidade || 0),
      quantidade_vendida: Number(peca.quantidadeVendida || 0),
      status: peca.status || "em_estoque",
      custo_total: Number(custoTotal || 0),
      custo: Number(custoTotal || 0),
      custo_atribuido: Number(custoTotal || 0),
      tipo_custo_atribuido: peca.tipoCusto || "real",
      preco_sugerido: Number(peca.precoVenda || 0),
      preparada: Boolean(peca.preparada),
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
    const quantidadeVendida = Number(venda.quantidade_vendida || venda.quantidadeVendida || 1);
    const valorUnitario = Number(venda.valor_unitario || venda.valorUnitario || 0);
    const valorTotal = Number(venda.valor_total || venda.valorTotal || valorUnitario * quantidadeVendida || 0);

    return {
      id: Number(venda.id),
      pecaId: Number(venda.peca_id || 0),
      produtoNome: venda.pecas?.nome || venda.pecas?.nome_peca || venda.produtoNome || "",
      sku: venda.pecas?.sku || venda.sku || "",
      quantidadeVendida,
      quantidadeVendidaNaVenda: quantidadeVendida,
      valorUnitario,
      precoUnitario: valorUnitario,
      valorVendaUnitario: valorUnitario,
      valorTotal,
      valorVenda: valorTotal,
      canalVenda: venda.canal_venda || "",
      dataVenda: venda.data_venda,
      createdAt: venda.created_at
    };
  }

  function mapearVendaParaBanco(venda) {
    const pecaId = Number(venda.pecaId);
    const quantidadeVendida = Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda);
    const valorUnitario = Number(venda.valorUnitario || venda.valorVendaUnitario);

    if (!Number.isFinite(pecaId) || pecaId <= 0) {
      throw new Error("peca_id invalido para salvar venda.");
    }

    if (!Number.isFinite(quantidadeVendida) || quantidadeVendida <= 0) {
      throw new Error("quantidade_vendida invalida para salvar venda.");
    }

    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
      throw new Error("valor_unitario invalido para salvar venda.");
    }

    return {
      peca_id: pecaId,
      quantidade_vendida: quantidadeVendida,
      valor_unitario: valorUnitario,
      canal_venda: venda.canalVenda || null,
      data_venda: venda.dataVenda || new Date().toISOString().slice(0, 10)
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

  function mapearEntradaEstoqueDoBanco(entrada) {
    return {
      id: Number(entrada.id),
      pecaId: Number(entrada.peca_id),
      origemId: Number(entrada.origem_id || 0),
      sku: entrada.pecas?.sku || "",
      nomePeca: entrada.pecas?.nome_peca || entrada.pecas?.nome || "",
      origemDescricao: entrada.origens?.descricao || "",
      quantidadeTotal: Number(entrada.quantidade_total || 0),
      quantidadeConsumida: Number(entrada.quantidade_consumida || 0),
      custoUnitario: Number(entrada.custo_unitario || 0),
      dataEntrada: entrada.data_entrada,
      createdAt: entrada.created_at
    };
  }

  function mapearEntradaEstoqueParaBanco(entrada) {
    return {
      peca_id: Number(entrada.pecaId),
      origem_id: Number(entrada.origemId),
      quantidade_total: Number(entrada.quantidadeTotal),
      quantidade_consumida: Number(entrada.quantidadeConsumida || 0),
      custo_unitario: Number(entrada.custoUnitario || 0),
      data_entrada: entrada.dataEntrada || new Date().toISOString().slice(0, 10)
    };
  }

  function mapearConsumoEstoqueDoBanco(consumo) {
    const entrada = consumo.entradas_estoque || {};

    return {
      id: Number(consumo.id),
      vendaId: Number(consumo.venda_id),
      entradaEstoqueId: Number(consumo.entrada_estoque_id),
      pecaId: Number(entrada.peca_id || 0),
      origemId: Number(entrada.origem_id || 0),
      quantidadeConsumida: Number(consumo.quantidade_consumida || 0),
      custoUnitario: Number(consumo.custo_unitario || 0),
      custoTotal: Number(consumo.custo_total || 0),
      createdAt: consumo.created_at
    };
  }

  function obterCustoVendaPorTipo(custosVenda, tipo) {
    if (!Array.isArray(custosVenda)) {
      return 0;
    }

    const custo = custosVenda.find(item => (item.tipoCusto || item.tipo) === tipo);

    return Number(custo?.valor || 0);
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
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapearPecaDoBanco(data);
  }

  async function listarVendas() {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("vendas")
      .select("*, pecas(nome_peca, sku)")
      .order("data_venda", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(mapearVendaDoBanco);
  }

  async function listarCustosPeca() {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("custos_peca")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearCustoPecaDoBanco);
  }

  async function listarCustosVenda() {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("custos_venda")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearCustoVendaDoBanco);
  }

  async function listarEntradasEstoque() {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("entradas_estoque")
      .select("*, pecas(nome_peca, sku), origens(descricao)")
      .order("data_entrada", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearEntradaEstoqueDoBanco);
  }

  async function listarConsumosEstoque() {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("venda_consumos_estoque")
      .select("*, entradas_estoque(peca_id, origem_id)")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearConsumoEstoqueDoBanco);
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

  async function atualizarPeca(peca) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("pecas")
      .update(mapearPecaParaAtualizacaoBanco(peca))
      .eq("id", peca.id)
      .select("*, origens(descricao)")
      .single();

    if (error) {
      throw error;
    }

    return mapearPecaDoBanco(data);
  }

  async function salvarEntradaEstoque(entrada) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("entradas_estoque")
      .insert(mapearEntradaEstoqueParaBanco(entrada))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapearEntradaEstoqueDoBanco(data);
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

    if (!peca) {
      throw new Error(`Peca com id ${venda.pecaId} nao existe na tabela pecas.`);
    }

    const vendaParaBanco = mapearVendaParaBanco(venda);
    const { data: vendaId, error } = await cliente.rpc("registrar_venda_fifo", {
      p_peca_id: vendaParaBanco.peca_id,
      p_quantidade: vendaParaBanco.quantidade_vendida,
      p_valor_unitario: vendaParaBanco.valor_unitario,
      p_canal_venda: vendaParaBanco.canal_venda,
      p_data_venda: vendaParaBanco.data_venda,
      p_custo_embalagem: obterCustoVendaPorTipo(venda.custosVenda, "embalagem"),
      p_custo_comissao: obterCustoVendaPorTipo(venda.custosVenda, "comissao"),
      p_custo_frete: obterCustoVendaPorTipo(venda.custosVenda, "frete"),
      p_custo_outros: obterCustoVendaPorTipo(venda.custosVenda, "outros")
    });

    if (error) {
      console.error(error);
      throw error;
    }

    const pecaAtualizada = await buscarPecaPorId(venda.pecaId);
    const custosVenda = await listarCustosVenda();
    const custosDaVenda = custosVenda.filter(custo => Number(custo.vendaId) === Number(vendaId));

    return {
      venda: {
        id: Number(vendaId),
        pecaId: vendaParaBanco.peca_id,
        produtoNome: pecaAtualizada.nome,
        sku: pecaAtualizada.sku || "",
        quantidadeVendida: vendaParaBanco.quantidade_vendida,
        quantidadeVendidaNaVenda: vendaParaBanco.quantidade_vendida,
        valorUnitario: vendaParaBanco.valor_unitario,
        precoUnitario: vendaParaBanco.valor_unitario,
        valorVendaUnitario: vendaParaBanco.valor_unitario,
        valorTotal: vendaParaBanco.quantidade_vendida * vendaParaBanco.valor_unitario,
        valorVenda: vendaParaBanco.quantidade_vendida * vendaParaBanco.valor_unitario,
        canalVenda: vendaParaBanco.canal_venda || "",
        dataVenda: vendaParaBanco.data_venda,
        custosVenda: custosDaVenda,
        totalCustosVenda: custosDaVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0)
      },
      peca: pecaAtualizada
    };
  }

  window.supabaseService = {
    estaConfigurado: supabaseEstaConfigurado,
    listarOrigens,
    buscarOrigemPorId,
    listarPecas,
    listarPecasPorOrigem,
    buscarPecaPorId,
    listarVendas,
    listarCustosPeca,
    listarCustosVenda,
    listarEntradasEstoque,
    listarConsumosEstoque,
    salvarOrigem,
    salvarPeca,
    atualizarPeca,
    salvarEntradaEstoque,
    salvarCustoPeca,
    salvarCustosVenda,
    salvarVenda
  };
})();
