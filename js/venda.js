function buscarPecas() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarPecas(pecas) {
  localStorage.setItem("produtos", JSON.stringify(pecas));
}

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigens(origens) {
  localStorage.setItem("origens", JSON.stringify(origens));
}

function buscarEntradasLocais() {
  return JSON.parse(localStorage.getItem("entradasEstoque")) || [];
}

const campoBuscaPecaVenda = document.getElementById("buscaPecaVenda");
const sugestoesPecaVenda = document.getElementById("sugestoesPecaVenda");
const campoDataVenda = document.getElementById("dataVenda");
const listaCustosVenda = document.getElementById("listaCustosVenda");
const botaoAdicionarCustoVenda = document.getElementById("botaoAdicionarCustoVenda");
const botaoNovoTipoCustoVenda = document.getElementById("botaoNovoTipoCustoVenda");
const mensagemVenda = document.getElementById("mensagemVenda");
let pecasVendaCarregadas = [];
let origensVendaCarregadas = [];
let entradasVendaCarregadas = [];
let tiposCustoVendaCarregados = [];
let sugestoesVendaAtuais = [];
let indiceSugestaoVenda = -1;
const tiposCustoVendaPadrao = ["Embalagem", "Frete", "Comissão", "Taxa marketplace", "Taxa cartão", "Desconto concedido", "Coleta", "Etiqueta", "Outros"];

function salvarVendas(vendas) {
  localStorage.setItem("vendas", JSON.stringify(vendas));
}

function normalizarPeca(peca) {
  const quantidade = Number(peca.quantidade || 1);
  const quantidadeVendida = Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
  const quantidadeDisponivel = Math.max(quantidade - quantidadeVendida, 0);

  return {
    ...peca,
    id: Number(peca.id),
    nome: peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`,
    sku: peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "",
    quantidade,
    quantidadeVendida,
    origemId: Number(peca.origemId || peca.origem_id || 0),
    status: quantidadeDisponivel <= 0 ? "vendida" : "em_estoque"
  };
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escaparRegex(texto) {
  return String(texto || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function destacarBusca(texto) {
  const termo = String(campoBuscaPecaVenda?.value || "").trim();
  const textoSeguro = escaparHtml(texto);

  if (!termo) {
    return textoSeguro;
  }

  return textoSeguro.replace(new RegExp(`(${escaparRegex(termo)})`, "gi"), "<mark>$1</mark>");
}

function padronizarNomeTipoCusto(nome) {
  const texto = String(nome || "").trim().replace(/\s+/g, " ").toLowerCase();

  if (!texto) {
    return "";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function normalizarNomeTipoCusto(nome) {
  return String(nome || "").trim().toLowerCase();
}

function buscarTiposCustoVendaLocais() {
  const tipos = JSON.parse(localStorage.getItem("tiposCusto")) || [];

  if (tipos.length > 0) {
    return tipos;
  }

  return tiposCustoVendaPadrao.map((nome, indice) => ({
    id: `local-venda-${indice + 1}`,
    nome,
    categoria: "venda",
    ativo: true
  }));
}

function salvarTiposCustoVendaLocais(tipos) {
  localStorage.setItem("tiposCusto", JSON.stringify(tipos));
}

function criarOpcoesTiposCustoVenda(tipoSelecionado = "") {
  return [
    '<option value="">Tipo de custo</option>',
    ...tiposCustoVendaCarregados
      .filter(tipo => tipo.ativo !== false && ["venda", "ambos"].includes(tipo.categoria || "ambos"))
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"))
      .map(tipo => {
        const selecionado = tipo.nome === tipoSelecionado ? " selected" : "";
        return `<option value="${escaparHtml(tipo.nome)}" data-tipo-id="${escaparHtml(tipo.id)}"${selecionado}>${escaparHtml(tipo.nome)}</option>`;
      })
  ].join("");
}

function atualizarSelectsTiposCustoVenda() {
  listaCustosVenda?.querySelectorAll("[data-campo='tipo']").forEach(select => {
    const valorAtual = select.value;
    select.innerHTML = criarOpcoesTiposCustoVenda(valorAtual);
    select.value = valorAtual;
  });
}

async function carregarTiposCustoVenda() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      tiposCustoVendaCarregados = await window.supabaseService.listarTiposCusto("venda") || [];
      salvarTiposCustoVendaLocais(tiposCustoVendaCarregados);
      atualizarSelectsTiposCustoVenda();
      return;
    } catch (erro) {
      console.error("Erro ao carregar tipos de custo da venda:", erro);
    }
  }

  tiposCustoVendaCarregados = buscarTiposCustoVendaLocais();
  atualizarSelectsTiposCustoVenda();
}

function adicionarLinhaCustoVenda(custo = {}) {
  if (!listaCustosVenda) {
    return;
  }

  const linha = document.createElement("div");
  linha.className = "cost-line";
  linha.innerHTML = `
    <select data-campo="tipo" aria-label="Tipo de custo da venda">
      ${criarOpcoesTiposCustoVenda(custo.tipoCusto || custo.tipo || "")}
    </select>
    <input data-campo="valor" type="number" min="0" step="0.01" placeholder="Valor" value="${custo.valor || ""}">
    <input data-campo="descricao" type="text" placeholder="Observacao" value="${escaparHtml(custo.descricao || "")}">
    <button type="button" class="button-secondary" data-acao="remover-custo">Remover</button>
  `;

  listaCustosVenda.appendChild(linha);
}

async function criarNovoTipoCustoVenda() {
  const nomeDigitado = prompt("Nome do novo tipo de custo da venda:");
  const nomePadronizado = padronizarNomeTipoCusto(nomeDigitado);

  if (!nomeDigitado) {
    return;
  }

  if (!nomePadronizado) {
    alert("Informe um nome valido para o tipo de custo.");
    return;
  }

  const tipoExistente = tiposCustoVendaCarregados.find(tipo => (
    normalizarNomeTipoCusto(tipo.nome) === normalizarNomeTipoCusto(nomePadronizado)
  ));

  if (tipoExistente) {
    atualizarSelectsTiposCustoVenda();
    alert(`Tipo "${tipoExistente.nome}" ja existe.`);
    return;
  }

  const categoriaDigitada = prompt("Categoria do tipo: peca, venda ou ambos", "venda");
  const categoria = normalizarNomeTipoCusto(categoriaDigitada || "venda");

  if (!["peca", "venda", "ambos"].includes(categoria)) {
    alert("Categoria invalida. Use peca, venda ou ambos.");
    return;
  }

  try {
    const novoTipo = window.supabaseService && window.supabaseService.estaConfigurado()
      ? await window.supabaseService.criarTipoCusto(nomePadronizado, categoria)
      : {
          id: `local-venda-${Date.now()}`,
          nome: nomePadronizado,
          categoria,
          ativo: true
        };

    tiposCustoVendaCarregados.push(novoTipo);
    salvarTiposCustoVendaLocais(tiposCustoVendaCarregados);
    atualizarSelectsTiposCustoVenda();
    adicionarLinhaCustoVenda({ tipoCusto: novoTipo.nome });
  } catch (erro) {
    console.error("Erro ao criar tipo de custo da venda:", erro);
    alert("Nao foi possivel criar o tipo de custo.");
  }
}

function formatarNomePecaDestacado(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || "").trim();

  return sku
    ? `${destacarBusca(sku)} - ${destacarBusca(nome)}`
    : destacarBusca(nome);
}

function filtrarPecasPorBusca(pecas) {
  const termo = String(campoBuscaPecaVenda?.value || "").trim().toLowerCase();

  if (!termo) {
    return pecas;
  }

  return pecas.filter(peca => {
    const nome = String(peca.nome || peca.nome_peca || peca.nomeProduto || "").toLowerCase();
    const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").toLowerCase();

    return nome.includes(termo) || sku.includes(termo);
  });
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 1) - Number(peca.quantidadeVendida || 0), 0);
}

function obterCampoPeca() {
  return document.getElementById("pecaId");
}

function salvarPecaNoCache(pecaAtualizada) {
  const pecas = buscarPecas().map(normalizarPeca);
  const indice = pecas.findIndex(peca => Number(peca.id) === Number(pecaAtualizada.id));

  if (indice >= 0) {
    pecas[indice] = normalizarPeca(pecaAtualizada);
  } else {
    pecas.push(normalizarPeca(pecaAtualizada));
  }

  salvarPecas(pecas);
}

function salvarVendaNoCache(venda) {
  const vendas = buscarVendas().filter(item => Number(item.id) !== Number(venda.id));
  vendas.push(venda);
  salvarVendas(vendas);
}

function lerValorCampo(id) {
  const campo = document.getElementById(id);

  if (!campo || campo.value === "") {
    return 0;
  }

  return Number(campo.value);
}

function obterDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function preencherDataVendaPadrao() {
  if (campoDataVenda && !campoDataVenda.value) {
    campoDataVenda.value = obterDataHoje();
  }
}

function criarCustoVenda(tipo, descricao, valor) {
  return {
    tipo,
    tipoCusto: tipo,
    descricao,
    valor,
    data: new Date().toISOString().slice(0, 10),
    dataCusto: new Date().toISOString().slice(0, 10)
  };
}

function lerCustosVendaDoFormulario() {
  if (!listaCustosVenda) {
    return [];
  }

  return Array.from(listaCustosVenda.querySelectorAll(".cost-line"))
    .map(linha => {
      const selectTipo = linha.querySelector("[data-campo='tipo']");
      const tipo = selectTipo?.value || "";
      const tipoCustoId = selectTipo?.selectedOptions[0]?.dataset?.tipoId || null;
      const valor = Number(linha.querySelector("[data-campo='valor']")?.value || 0);
      const descricao = linha.querySelector("[data-campo='descricao']")?.value.trim() || tipo;

      return {
        ...criarCustoVenda(tipo, descricao, valor),
        tipoCustoId
      };
    })
    .filter(custo => custo.tipo && Number(custo.valor || 0) > 0);
}

function somarCustosVenda(custosVenda) {
  return custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function existeCustoVendaNegativo() {
  if (!listaCustosVenda) {
    return false;
  }

  return Array.from(listaCustosVenda.querySelectorAll("[data-campo='valor']"))
    .some(campo => Number(campo.value || 0) < 0);
}

function existeCustoVendaIncompleto() {
  if (!listaCustosVenda) {
    return false;
  }

  return Array.from(listaCustosVenda.querySelectorAll(".cost-line"))
    .some(linha => {
      const tipo = linha.querySelector("[data-campo='tipo']")?.value || "";
      const valor = Number(linha.querySelector("[data-campo='valor']")?.value || 0);
      return valor > 0 && !tipo;
    });
}

function normalizarSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function obterOrigensDoProduto(peca) {
  const sku = normalizarSku(peca.sku);
  const origensPorSku = origensVendaCarregadas.filter(origem => normalizarSku(origem.produtoSku || origem.produto_sku) === sku);

  return origensPorSku.length > 0
    ? origensPorSku
    : origensVendaCarregadas.filter(origem => Number(origem.id) === Number(peca.origemId || 0));
}

function calcularCustoBasePeca(peca) {
  const entradasDaPeca = entradasVendaCarregadas.filter(entrada => Number(entrada.pecaId || 0) === Number(peca.id || 0));

  if (entradasDaPeca.length > 0) {
    const totalUnidadesEntrada = entradasDaPeca.reduce((total, entrada) => total + Number(entrada.quantidadeTotal || 0), 0);
    const totalInvestidoEntrada = entradasDaPeca.reduce((total, entrada) => {
      return total + (Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0));
    }, 0);

    if (totalUnidadesEntrada > 0 && totalInvestidoEntrada > 0) {
      return totalInvestidoEntrada / totalUnidadesEntrada;
    }
  }

  const origensDoProduto = obterOrigensDoProduto(peca);

  const totalUnidades = origensDoProduto.reduce((total, origem) => {
    return total + Number(origem.quantidadeTotal || origem.quantidade_total || 0);
  }, 0);
  const totalInvestido = origensDoProduto.reduce((total, origem) => {
    return total + Number(origem.valorPago || origem.valor_pago || origem.custoTotal || origem.custo_total || 0);
  }, 0);

  if (totalUnidades <= 0 || totalInvestido <= 0) {
    return Number(peca.custoTotal || peca.custo || 0);
  }

  return totalInvestido / totalUnidades;
}

function calcularLucroVenda(venda, peca) {
  const valorTotal = Number(venda.valorTotal || venda.valorVenda || 0);
  const custoUnitario = calcularCustoBasePeca(peca);
  const custoPeca = custoUnitario * Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0);
  const totalCustosVenda = somarCustosVenda(venda.custosVenda || []);

  return valorTotal - custoPeca - totalCustosVenda;
}

async function buscarPecaParaVenda(pecaId) {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    const peca = await window.supabaseService.buscarPecaPorId(pecaId);

    if (peca) {
      salvarPecaNoCache(peca);
    }

    return peca;
  }

  return buscarPecas()
    .map(normalizarPeca)
    .find(item => Number(item.id) === Number(pecaId));
}

async function carregarPecasParaVenda() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    const pecas = await window.supabaseService.listarPecas();
    salvarPecas(pecas.map(normalizarPeca));
    return pecas.map(normalizarPeca);
  }

  return buscarPecas().map(normalizarPeca);
}

async function carregarOrigensParaVenda() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    const origens = await window.supabaseService.listarOrigens();
    salvarOrigens(origens);
    return origens;
  }

  return buscarOrigens();
}

function selecionarPeca(peca) {
  const campoPeca = obterCampoPeca();
  const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);

  if (!campoPeca || quantidadeDisponivel <= 0) {
    return;
  }

  campoPeca.value = String(peca.id);
  campoBuscaPecaVenda.value = formatarNomePeca(peca);
  fecharSugestoesVenda();
  atualizarLimiteQuantidadeSelecionada();
}

function fecharSugestoesVenda() {
  sugestoesPecaVenda.innerHTML = "";
  sugestoesPecaVenda.classList.remove("is-open");
  indiceSugestaoVenda = -1;
}

function mostrarMensagemVenda(texto, tipo = "success") {
  if (!mensagemVenda) {
    return;
  }

  mensagemVenda.textContent = texto;
  mensagemVenda.className = texto ? `form-message form-message--${tipo}` : "form-message";
}

function obterPrimeiroIndiceDisponivel(pecas) {
  return pecas.findIndex(peca => calcularQuantidadeDisponivel(peca) > 0);
}

function renderizarSugestoesVenda(pecas) {
  if (!String(campoBuscaPecaVenda?.value || "").trim()) {
    fecharSugestoesVenda();
    return;
  }

  sugestoesVendaAtuais = pecas;
  sugestoesPecaVenda.innerHTML = "";
  indiceSugestaoVenda = obterPrimeiroIndiceDisponivel(pecas);

  if (pecas.length === 0) {
    const item = document.createElement("div");
    item.className = "autocomplete-option";
    item.textContent = "Nenhuma peça encontrada";
    sugestoesPecaVenda.appendChild(item);
    sugestoesPecaVenda.classList.add("is-open");
    return;
  }

  pecas.forEach((peca, indice) => {
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
    const botao = document.createElement("button");
    const textoQuantidade = quantidadeDisponivel > 0
      ? `${quantidadeDisponivel} disponível${quantidadeDisponivel === 1 ? "" : "s"}`
      : "SEM ESTOQUE";

    botao.type = "button";
    botao.className = `autocomplete-option${indice === indiceSugestaoVenda ? " is-active" : ""}${quantidadeDisponivel <= 0 ? " autocomplete-option--unavailable" : ""}`;
    botao.disabled = quantidadeDisponivel <= 0;
    botao.innerHTML = `
      <span>${formatarNomePecaDestacado(peca)}</span>
      <span class="autocomplete-option__meta">${textoQuantidade}</span>
    `;
    botao.addEventListener("click", () => selecionarPeca(peca));

    sugestoesPecaVenda.appendChild(botao);
  });

  sugestoesPecaVenda.classList.add("is-open");
}

function atualizarDestaqueSugestoesVenda() {
  Array.from(sugestoesPecaVenda.querySelectorAll(".autocomplete-option")).forEach((item, indice) => {
    item.classList.toggle("is-active", indice === indiceSugestaoVenda);
  });
}

function moverDestaqueSugestoesVenda(direcao) {
  const indicesDisponiveis = sugestoesVendaAtuais
    .map((peca, indice) => calcularQuantidadeDisponivel(peca) > 0 ? indice : -1)
    .filter(indice => indice >= 0);

  if (indicesDisponiveis.length === 0) {
    indiceSugestaoVenda = -1;
    atualizarDestaqueSugestoesVenda();
    return;
  }

  const posicaoAtual = indicesDisponiveis.indexOf(indiceSugestaoVenda);
  const proximaPosicao = posicaoAtual < 0
    ? 0
    : (posicaoAtual + direcao + indicesDisponiveis.length) % indicesDisponiveis.length;

  indiceSugestaoVenda = indicesDisponiveis[proximaPosicao];
  atualizarDestaqueSugestoesVenda();
}

function atualizarSugestoesVenda() {
  const campoPeca = obterCampoPeca();

  if (campoPeca) {
    campoPeca.value = "";
  }

  renderizarSugestoesVenda(filtrarPecasPorBusca(pecasVendaCarregadas));
  atualizarLimiteQuantidadeSelecionada();
}

function atualizarLimiteQuantidadeSelecionada() {
  const campoPeca = obterCampoPeca();
  const campoQuantidade = document.getElementById("quantidadeVendidaNaVenda");

  if (!campoPeca || !campoQuantidade) {
    return;
  }

  const peca = buscarPecas()
    .map(normalizarPeca)
    .find(item => Number(item.id) === Number(campoPeca.value));

  if (!peca) {
    campoQuantidade.removeAttribute("max");
    return;
  }

  campoQuantidade.max = calcularQuantidadeDisponivel(peca);
}

function obterPecaIdDaUrl() {
  const params = new URLSearchParams(window.location.search);
  const pecaIdUrl = Number(params.get("pecaId"));

  return pecaIdUrl || null;
}

function selecionarPecaDaUrl() {
  const pecaIdUrl = obterPecaIdDaUrl();
  const campoPeca = obterCampoPeca();

  if (!campoPeca) {
    return;
  }

  if (!pecaIdUrl) {
    campoPeca.value = "";
    return;
  }

  const pecaEncontrada = pecasVendaCarregadas.find(peca => Number(peca.id) === pecaIdUrl);

  if (!pecaEncontrada) {
    console.warn(`Peca com id ${pecaIdUrl} nao foi encontrada no dropdown de venda.`);
    return;
  }

  selecionarPeca(pecaEncontrada);
}

async function inicializarFormularioVenda() {
  const campoPeca = obterCampoPeca();

  preencherDataVendaPadrao();
  await carregarTiposCustoVenda();
  adicionarLinhaCustoVenda();

  if (!campoPeca) {
    return;
  }

  try {
    const [pecas, origens, entradas] = await Promise.all([
      carregarPecasParaVenda(),
      carregarOrigensParaVenda(),
      window.supabaseService && window.supabaseService.estaConfigurado()
        ? window.supabaseService.listarEntradasEstoque()
        : Promise.resolve(buscarEntradasLocais())
    ]);

    pecasVendaCarregadas = pecas;
    origensVendaCarregadas = origens;
    entradasVendaCarregadas = entradas || [];
    selecionarPecaDaUrl();
    atualizarLimiteQuantidadeSelecionada();
  } catch (erro) {
    console.error("Erro ao carregar peças para venda:", erro);
    pecasVendaCarregadas = buscarPecas().map(normalizarPeca);
    origensVendaCarregadas = buscarOrigens();
    entradasVendaCarregadas = buscarEntradasLocais();
    selecionarPecaDaUrl();
    atualizarLimiteQuantidadeSelecionada();
    alert("Não foi possível carregar as peças do Supabase. Verifique a configuração e tente novamente.");
  }

  campoBuscaPecaVenda?.addEventListener("input", atualizarSugestoesVenda);

  campoBuscaPecaVenda?.addEventListener("focus", () => {
    if (!campoPeca.value && String(campoBuscaPecaVenda.value || "").trim()) {
      renderizarSugestoesVenda(filtrarPecasPorBusca(pecasVendaCarregadas));
    }
  });

  campoBuscaPecaVenda?.addEventListener("keydown", evento => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      moverDestaqueSugestoesVenda(1);
      return;
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      moverDestaqueSugestoesVenda(-1);
      return;
    }

    if (evento.key === "Escape") {
      fecharSugestoesVenda();
      return;
    }

    if (evento.key !== "Enter") {
      return;
    }

    evento.preventDefault();
    const peca = sugestoesVendaAtuais[indiceSugestaoVenda] || sugestoesVendaAtuais[0];

    if (peca) {
      selecionarPeca(peca);
    }
  });

  botaoAdicionarCustoVenda?.addEventListener("click", () => adicionarLinhaCustoVenda());
  botaoNovoTipoCustoVenda?.addEventListener("click", criarNovoTipoCustoVenda);
  listaCustosVenda?.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-acao='remover-custo']");

    if (botao) {
      botao.closest(".cost-line")?.remove();
    }
  });
}

function lerVendaDoFormulario() {
  const quantidadeVendida = Number(document.getElementById("quantidadeVendidaNaVenda").value);
  const valorUnitario = Number(document.getElementById("valorVenda").value);
  const custosVenda = lerCustosVendaDoFormulario();
  const totalCustosVenda = somarCustosVenda(custosVenda);

  return {
    id: Date.now(),
    pecaId: Number(document.getElementById("pecaId").value),
    quantidadeVendida,
    quantidadeVendidaNaVenda: quantidadeVendida,
    valorUnitario,
    valorVendaUnitario: valorUnitario,
    valorVenda: quantidadeVendida * valorUnitario,
    valorTotal: quantidadeVendida * valorUnitario,
    canalVenda: document.getElementById("canalVenda").value.trim(),
    dataVenda: campoDataVenda?.value || obterDataHoje(),
    custosVenda,
    totalCustosVenda
  };
}

function validarVenda(venda) {
  if (!venda.pecaId) {
    return "Selecione uma peça.";
  }

  if (!venda.quantidadeVendida || venda.quantidadeVendida <= 0) {
    return "Informe uma quantidade vendida maior que zero.";
  }

  if (!Number.isFinite(venda.valorUnitario) || venda.valorUnitario < 0) {
    return "Informe um valor unitario valido para a venda.";
  }

  if (!venda.dataVenda) {
    return "Informe a data da venda.";
  }

  if (existeCustoVendaNegativo()) {
    return "Os custos da venda devem ser maiores ou iguais a zero.";
  }

  if (existeCustoVendaIncompleto()) {
    return "Selecione o tipo de custo em todas as linhas com valor.";
  }

  return "";
}

function atualizarPecaVendidaLocalmente(peca, quantidadeVendida) {
  const pecaAtualizada = normalizarPeca({
    ...peca,
    quantidadeVendida: Number(peca.quantidadeVendida || 0) + quantidadeVendida
  });

  pecaAtualizada.status = pecaAtualizada.quantidadeVendida >= Number(pecaAtualizada.quantidade || 1)
    ? "vendida"
    : "em_estoque";

  salvarPecaNoCache(pecaAtualizada);
  return pecaAtualizada;
}

function atualizarPecaNaListaVenda(pecaAtualizada) {
  const pecaNormalizada = normalizarPeca(pecaAtualizada);
  const indice = pecasVendaCarregadas.findIndex(peca => Number(peca.id) === Number(pecaNormalizada.id));

  if (indice >= 0) {
    pecasVendaCarregadas[indice] = pecaNormalizada;
    return;
  }

  pecasVendaCarregadas.push(pecaNormalizada);
}

function limparFormularioVenda() {
  document.getElementById("pecaId").value = "";
  document.getElementById("valorVenda").value = "";
  document.getElementById("quantidadeVendidaNaVenda").value = "";
  document.getElementById("canalVenda").value = "";

  if (campoBuscaPecaVenda) {
    campoBuscaPecaVenda.value = "";
  }

  fecharSugestoesVenda();

  if (campoDataVenda) {
    campoDataVenda.value = obterDataHoje();
  }

  if (listaCustosVenda) {
    listaCustosVenda.innerHTML = "";
    adicionarLinhaCustoVenda();
  }

  campoBuscaPecaVenda?.focus();

  if (window.location.search) {
    window.history.replaceState({}, "", window.location.pathname);
  }
}

async function salvarVenda() {
  const venda = lerVendaDoFormulario();
  const erroValidacao = validarVenda(venda);
  const botaoSalvar = document.querySelector("button[onclick='salvarVenda()']");

  if (erroValidacao) {
    alert(erroValidacao);
    return;
  }

  botaoSalvar.disabled = true;

  try {
    const peca = await buscarPecaParaVenda(venda.pecaId);

    if (!peca) {
      alert("Peca nao encontrada.");
      return;
    }

    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);

    if (venda.quantidadeVendida > quantidadeDisponivel) {
      alert("Quantidade vendida maior que o estoque disponivel.");
      return;
    }

    if (window.supabaseService && window.supabaseService.estaConfigurado()) {
      const resultado = await window.supabaseService.salvarVenda(venda);
      const vendaComLucro = {
        ...resultado.venda,
        lucroVenda: calcularLucroVenda(resultado.venda, resultado.peca)
      };

      salvarVendaNoCache(vendaComLucro);
      salvarPecaNoCache(resultado.peca);
      atualizarPecaNaListaVenda(resultado.peca);
      mostrarMensagemVenda("Venda e custos da venda cadastrados com sucesso.", "success");
    } else {
      const pecaAtualizada = atualizarPecaVendidaLocalmente(peca, venda.quantidadeVendida);
      salvarVendaNoCache({
        ...venda,
        produtoNome: pecaAtualizada.nome,
        sku: pecaAtualizada.sku || "",
        lucroVenda: calcularLucroVenda(venda, pecaAtualizada)
      });
      atualizarPecaNaListaVenda(pecaAtualizada);
      mostrarMensagemVenda("Venda cadastrada no armazenamento temporario. Configure o Supabase para salvar no banco.", "warning");
    }

    limparFormularioVenda();
  } catch (erro) {
    console.error("Erro ao cadastrar venda:", erro);
    mostrarMensagemVenda(`Nao foi possivel salvar a venda: ${erro.message || "erro desconhecido"}`, "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", inicializarFormularioVenda);
