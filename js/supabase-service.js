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

  function obterDataLocalHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function normalizarSku(valor) {
    return String(valor || "").trim().toUpperCase();
  }

  function formatarCodigoOrigem(valor) {
    return `ORI-${String(valor || "").padStart(6, "0")}`;
  }

  function mapearOrigemDoBanco(origem) {
    const tipoOrigem = origem.tipo_origem || origem.tipo;
    const custoTotal = origem.custo_total !== null && origem.custo_total !== undefined
      ? origem.custo_total
      : origem.valor_pago;

    return {
      id: Number(origem.id),
      codigoOrigem: formatarCodigoOrigem(origem.id),
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
      data_compra: origem.dataCompra || obterDataLocalHoje(),
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
      imagemUrl: peca.imagem_url || peca.imagemUrl || "",
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
      imagem_url: peca.imagemUrl || null,
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
      imagem_url: peca.imagemUrl || null,
      preparada: Boolean(peca.preparada),
      observacoes: peca.observacoes || null
    };
  }

  function obterExtensaoArquivo(nomeArquivo) {
    const partes = String(nomeArquivo || "").split(".");
    const extensao = partes.length > 1 ? partes.pop() : "jpg";

    return extensao.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  }

  function normalizarNomeArquivo(texto) {
    return String(texto || "peca")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "peca";
  }

  async function uploadImagemPeca(arquivo, peca = {}) {
    const cliente = obterCliente();

    if (!cliente || !arquivo) {
      return "";
    }

    const extensao = obterExtensaoArquivo(arquivo.name);
    const nomeBase = normalizarNomeArquivo(peca.sku || peca.nome || peca.id);
    const caminho = `${nomeBase}-${Date.now()}.${extensao}`;
    const { error } = await cliente.storage
      .from("pecas")
      .upload(caminho, arquivo, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data } = cliente.storage
      .from("pecas")
      .getPublicUrl(caminho);

    return data?.publicUrl || "";
  }

  function mapearCustoPecaDoBanco(custo) {
    const tipoCustoNome = custo.tipos_custo?.nome || custo.tipo_custo;

    return {
      id: Number(custo.id),
      pecaId: Number(custo.peca_id),
      tipo: tipoCustoNome,
      tipoCusto: tipoCustoNome,
      tipoCustoId: custo.tipo_custo_id ? Number(custo.tipo_custo_id) : null,
      descricao: custo.descricao || "",
      observacoes: custo.observacoes || "",
      valor: Number(custo.valor || 0),
      data: custo.data_custo,
      dataCusto: custo.data_custo
    };
  }

  function mapearCustoPecaParaBanco(custo) {
    const tipoCustoId = Number(custo.tipoCustoId || 0);

    return {
      peca_id: Number(custo.pecaId),
      tipo_custo: custo.tipoCusto || custo.tipo,
      tipo_custo_id: Number.isFinite(tipoCustoId) && tipoCustoId > 0 ? tipoCustoId : null,
      descricao: custo.descricao || null,
      observacoes: custo.observacoes || custo.observacao || null,
      valor: Number(custo.valor || 0),
      data_custo: custo.dataCusto || custo.data || obterDataLocalHoje()
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
      observacoes: venda.observacoes || "",
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
      data_venda: venda.dataVenda || obterDataLocalHoje()
    };
  }

  function mapearCustoVendaDoBanco(custo) {
    const tipoCustoNome = custo.tipos_custo?.nome || custo.tipo_custo;

    return {
      id: Number(custo.id),
      vendaId: Number(custo.venda_id),
      tipo: tipoCustoNome,
      tipoCusto: tipoCustoNome,
      tipoCustoId: custo.tipo_custo_id ? Number(custo.tipo_custo_id) : null,
      descricao: custo.descricao || "",
      observacoes: custo.observacoes || "",
      valor: Number(custo.valor || 0),
      data: custo.data_custo,
      dataCusto: custo.data_custo
    };
  }

  function mapearCustoVendaParaBanco(vendaId, custo) {
    const tipoCustoId = Number(custo.tipoCustoId || 0);

    return {
      venda_id: Number(vendaId),
      tipo_custo: custo.tipoCusto || custo.tipo,
      tipo_custo_id: Number.isFinite(tipoCustoId) && tipoCustoId > 0 ? tipoCustoId : null,
      descricao: custo.descricao || null,
      observacoes: custo.observacoes || custo.observacao || null,
      valor: Number(custo.valor || 0),
      data_custo: custo.dataCusto || custo.data || obterDataLocalHoje()
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

  function listarEntradasDaPeca(pecaId, entradas = []) {
    const idNormalizado = Number(pecaId || 0);

    return (entradas || []).filter(entrada => Number(entrada?.pecaId || entrada?.peca_id || 0) === idNormalizado);
  }

  function calcularSaldoPeca(peca, entradas = []) {
    const entradasDaPeca = listarEntradasDaPeca(peca?.id, entradas);

    if (entradasDaPeca.length > 0) {
      const quantidadeTotal = entradasDaPeca.reduce((total, entrada) => total + Number(entrada?.quantidadeTotal || entrada?.quantidade_total || 0), 0);
      const quantidadeVendida = entradasDaPeca.reduce((total, entrada) => total + Number(entrada?.quantidadeConsumida || entrada?.quantidade_consumida || 0), 0);

      return {
        usaEntradas: true,
        quantidadeTotal,
        quantidadeVendida,
        quantidadeDisponivel: Math.max(quantidadeTotal - quantidadeVendida, 0),
        entradas: entradasDaPeca
      };
    }

    const quantidadeTotal = Number(peca?.quantidade || 0);
    const quantidadeVendida = Number(peca?.quantidadeVendida || peca?.quantidade_vendida || 0);

    return {
      usaEntradas: false,
      quantidadeTotal,
      quantidadeVendida,
      quantidadeDisponivel: Math.max(quantidadeTotal - quantidadeVendida, 0),
      entradas: []
    };
  }

  function padronizarNomeTipoCusto(nome) {
    const texto = String(nome || "").trim().replace(/\s+/g, " ").toLowerCase();

    if (!texto) {
      return "";
    }

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function mapearTipoCustoDoBanco(tipo) {
    return {
      id: Number(tipo.id),
      nome: tipo.nome || "",
      categoria: tipo.categoria || "ambos",
      ativo: Boolean(tipo.ativo),
      createdAt: tipo.created_at
    };
  }

  function mapearEntradaEstoqueParaBanco(entrada) {
    return {
      peca_id: Number(entrada.pecaId),
      origem_id: Number(entrada.origemId),
      quantidade_total: Number(entrada.quantidadeTotal),
      quantidade_consumida: Number(entrada.quantidadeConsumida || 0),
      custo_unitario: Number(entrada.custoUnitario || 0),
      data_entrada: entrada.dataEntrada || obterDataLocalHoje()
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

  async function buscarPecaPorSku(sku, pecaIdIgnorado = null) {
    const cliente = obterCliente();
    const skuNormalizado = normalizarSku(sku);

    if (!cliente || !skuNormalizado) {
      return null;
    }

    const { data, error } = await cliente
      .from("pecas")
      .select("*, origens(descricao)")
      .ilike("sku", skuNormalizado)
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    const pecaEncontrada = (data || []).find(item => (
      normalizarSku(item?.sku) === skuNormalizado &&
      Number(item.id) !== Number(pecaIdIgnorado || 0)
    ));
    return pecaEncontrada ? mapearPecaDoBanco(pecaEncontrada) : null;
  }

  async function validarSkuDisponivel(sku, pecaIdIgnorado = null) {
    const pecaExistente = await buscarPecaPorSku(sku, pecaIdIgnorado);

    if (pecaExistente) {
      throw new Error("Já existe uma peça cadastrada com este SKU.");
    }

    return true;
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
      .select("*, tipos_custo:tipo_custo_id(nome)")
      .order("data_custo", { ascending: false })
      .order("id", { ascending: false });

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
      .select("*, tipos_custo:tipo_custo_id(nome)")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearCustoVendaDoBanco);
  }

  async function listarTiposCusto(categoria = "") {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    let consulta = cliente
      .from("tipos_custo")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (categoria) {
      consulta = consulta.in("categoria", [categoria, "ambos"]);
    }

    const { data, error } = await consulta;

    if (error) {
      throw error;
    }

    return data.map(mapearTipoCustoDoBanco);
  }

  async function listarTodosTiposCusto() {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("tipos_custo")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(mapearTipoCustoDoBanco);
  }

  async function contarUsoTipoCusto(tipoCustoId) {
    const cliente = obterCliente();
    const id = Number(tipoCustoId || 0);

    if (!cliente || !id) {
      return { peca: 0, venda: 0, total: 0 };
    }

    const [
      { count: totalPeca, error: erroPeca },
      { count: totalVenda, error: erroVenda }
    ] = await Promise.all([
      cliente.from("custos_peca").select("id", { count: "exact", head: true }).eq("tipo_custo_id", id),
      cliente.from("custos_venda").select("id", { count: "exact", head: true }).eq("tipo_custo_id", id)
    ]);

    if (erroPeca) {
      throw erroPeca;
    }

    if (erroVenda) {
      throw erroVenda;
    }

    return {
      peca: Number(totalPeca || 0),
      venda: Number(totalVenda || 0),
      total: Number(totalPeca || 0) + Number(totalVenda || 0)
    };
  }

  async function atualizarTipoCusto(tipo) {
    const cliente = obterCliente();
    const nomePadronizado = padronizarNomeTipoCusto(tipo.nome);
    const categoriaNormalizada = ["peca", "venda", "ambos"].includes(tipo.categoria) ? tipo.categoria : "ambos";

    if (!cliente) {
      return null;
    }

    if (!tipo.id || !nomePadronizado) {
      throw new Error("Informe tipo de custo valido para atualizar.");
    }

    const tipos = await listarTodosTiposCusto();
    const duplicado = (tipos || []).find(item => (
      Number(item.id) !== Number(tipo.id) &&
      String(item.nome || "").trim().toLowerCase() === nomePadronizado.toLowerCase()
    ));

    if (duplicado) {
      throw new Error("Ja existe um tipo de custo com esse nome.");
    }

    const { data, error } = await cliente
      .from("tipos_custo")
      .update({
        nome: nomePadronizado,
        categoria: categoriaNormalizada,
        ativo: tipo.ativo !== false
      })
      .eq("id", tipo.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapearTipoCustoDoBanco(data);
  }

  async function desativarTipoCusto(tipoCustoId) {
    return atualizarTipoCusto({
      ...(await listarTodosTiposCusto()).find(tipo => Number(tipo.id) === Number(tipoCustoId)),
      ativo: false
    });
  }

  async function excluirTipoCusto(tipoCustoId) {
    const cliente = obterCliente();
    const id = Number(tipoCustoId || 0);

    if (!cliente || !id) {
      return false;
    }

    const uso = await contarUsoTipoCusto(id);

    if (uso.total > 0) {
      throw new Error("Este tipo ja esta sendo usado em custos. Desative em vez de excluir.");
    }

    const { error } = await cliente
      .from("tipos_custo")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return true;
  }

  async function criarTipoCusto(nome, categoria = "ambos") {
    const cliente = obterCliente();
    const nomePadronizado = padronizarNomeTipoCusto(nome);
    const categoriaNormalizada = ["peca", "venda", "ambos"].includes(categoria) ? categoria : "ambos";

    if (!cliente) {
      return null;
    }

    if (!nomePadronizado) {
      throw new Error("Informe o nome do tipo de custo.");
    }

    const tipos = await listarTodosTiposCusto();
    const tipoExistente = (tipos || []).find(tipo => (
      String(tipo.nome || "").trim().toLowerCase() === nomePadronizado.toLowerCase()
    ));

    if (tipoExistente) {
      throw new Error("Ja existe um tipo de custo com esse nome.");
    }

    const { data, error } = await cliente
      .from("tipos_custo")
      .insert({
        nome: nomePadronizado,
        categoria: categoriaNormalizada,
        ativo: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapearTipoCustoDoBanco(data);
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

  async function atualizarOrigem(origem) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("origens")
      .update(mapearOrigemParaBanco(origem))
      .eq("id", Number(origem.id))
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

  async function atualizarDadosPeca(peca) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const id = Number(peca?.id || 0);
    const nome = String(peca?.nome || "").trim();
    const sku = normalizarSku(peca?.sku);
    const precoVenda = Number(peca?.precoVenda || 0);
    const observacoes = String(peca?.observacoes || "").trim();

    await validarSkuDisponivel(sku, id);

    const { data, error } = await cliente
      .from("pecas")
      .update({
        nome_peca: nome,
        sku: sku || null,
        preco_sugerido: precoVenda,
        observacoes: observacoes || null
      })
      .eq("id", id)
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

  async function buscarEntradaEstoquePorId(entradaId) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("entradas_estoque")
      .select("*, pecas(nome_peca, sku), origens(descricao)")
      .eq("id", entradaId)
      .single();

    if (error) {
      throw error;
    }

    return mapearEntradaEstoqueDoBanco(data);
  }

  async function criarPecaComEntrada(peca) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    await validarSkuDisponivel(peca.sku);

    const { data, error } = await cliente.rpc("criar_peca_com_entrada", {
      p_sku: normalizarSku(peca.sku),
      p_nome: peca.nome,
      p_origem_id: Number(peca.origemId),
      p_quantidade: Number(peca.quantidade),
      p_valor_atribuido: Number(peca.valorAtribuidoEntrada || 0),
      p_imagem_url: peca.imagemUrl || null,
      p_observacoes: peca.observacoes || null
    });

    if (error) {
      throw error;
    }

    const resultado = Array.isArray(data) ? data[0] : data;
    const pecaId = Number(resultado?.peca_id || resultado?.pecaId || 0);
    const entradaId = Number(resultado?.entrada_id || resultado?.entradaId || 0);

    if (!pecaId || !entradaId) {
      throw new Error("A funcao criar_peca_com_entrada nao retornou os IDs esperados.");
    }

    const [pecaSalva, entradaSalva] = await Promise.all([
      buscarPecaPorId(pecaId),
      buscarEntradaEstoquePorId(entradaId)
    ]);

    return {
      peca: pecaSalva,
      entrada: entradaSalva
    };
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
        tipo_custo_id: custoParaBanco.tipo_custo_id,
        descricao: custoParaBanco.descricao,
        observacoes: custoParaBanco.observacoes,
        valor: custoParaBanco.valor,
        data_custo: custoParaBanco.data_custo
      })
      .select("*, tipos_custo:tipo_custo_id(nome)")
      .single();

    if (error) {
      throw error;
    }

    return mapearCustoPecaDoBanco(data);
  }

  async function atualizarCustoPeca(custo) {
    const cliente = obterCliente();
    const tipoCustoId = Number(custo.tipoCustoId || 0);

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("custos_peca")
      .update({
        tipo_custo: custo.tipoCusto || custo.tipo,
        tipo_custo_id: Number.isFinite(tipoCustoId) && tipoCustoId > 0 ? tipoCustoId : null,
        descricao: custo.descricao || null,
        observacoes: custo.observacoes || custo.observacao || null,
        valor: Number(custo.valor || 0),
        data_custo: custo.dataCusto || custo.data || obterDataLocalHoje()
      })
      .eq("id", custo.id)
      .select("*, tipos_custo:tipo_custo_id(nome)")
      .single();

    if (error) {
      throw error;
    }

    return mapearCustoPecaDoBanco(data);
  }

  async function excluirCustoPeca(custoId) {
    const cliente = obterCliente();
    const id = Number(custoId || 0);

    if (!cliente || !id) {
      return false;
    }

    const { data, error } = await cliente
      .from("custos_peca")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.id) {
      throw new Error("Custo da peca nao encontrado para exclusao.");
    }

    return true;
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
      .select("*, tipos_custo:tipo_custo_id(nome)");

    if (error) {
      throw error;
    }

    return data.map(mapearCustoVendaDoBanco);
  }

  async function substituirCustosVenda(vendaId, custosVenda) {
    const cliente = obterCliente();

    if (!cliente) {
      return [];
    }

    const { error: erroDelete } = await cliente
      .from("custos_venda")
      .delete()
      .eq("venda_id", vendaId);

    if (erroDelete) {
      throw erroDelete;
    }

    return salvarCustosVenda(vendaId, custosVenda);
  }

  async function atualizarVendaBasica(venda) {
    const cliente = obterCliente();

    if (!cliente) {
      return null;
    }

    const { data, error } = await cliente
      .from("vendas")
      .update({
        data_venda: venda.dataVenda,
        canal_venda: venda.canalVenda || null
      })
      .eq("id", venda.id)
      .select("*, pecas(nome_peca, sku)")
      .single();

    if (error) {
      throw error;
    }

    return mapearVendaDoBanco(data);
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
      p_custo_embalagem: 0,
      p_custo_comissao: 0,
      p_custo_frete: 0,
      p_custo_outros: 0
    });

    if (error) {
      console.error(error);
      throw error;
    }

    const observacoesVenda = String(venda.observacoes || "").trim();

    if (observacoesVenda) {
      const { error: errorObservacoes } = await cliente
        .from("vendas")
        .update({ observacoes: observacoesVenda })
        .eq("id", vendaId);

      if (errorObservacoes) {
        console.error(errorObservacoes);
        throw errorObservacoes;
      }
    }

    const pecaAtualizada = await buscarPecaPorId(venda.pecaId);
    const custosDaVenda = await salvarCustosVenda(vendaId, venda.custosVenda || []);

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
        observacoes: observacoesVenda,
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
    buscarPecaPorSku,
    validarSkuDisponivel,
    listarVendas,
    listarCustosPeca,
    listarCustosVenda,
    listarTiposCusto,
    listarTodosTiposCusto,
    criarTipoCusto,
    contarUsoTipoCusto,
    atualizarTipoCusto,
    desativarTipoCusto,
    excluirTipoCusto,
    listarEntradasEstoque,
    listarConsumosEstoque,
    listarEntradasDaPeca,
    calcularSaldoPeca,
    salvarOrigem,
    atualizarOrigem,
    salvarPeca,
    atualizarPeca,
    atualizarDadosPeca,
    uploadImagemPeca,
    buscarEntradaEstoquePorId,
    criarPecaComEntrada,
    salvarEntradaEstoque,
    salvarCustoPeca,
    atualizarCustoPeca,
    excluirCustoPeca,
    salvarCustosVenda,
    substituirCustosVenda,
    atualizarVendaBasica,
    salvarVenda
  };
})();
