const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagemProdutos = document.getElementById("mensagemProdutos");
const campoBuscaProdutos = document.getElementById("buscaProdutos");
const filtroEstoqueProdutos = document.getElementById("filtroEstoqueProdutos");
const filtroOrigemProdutos = document.getElementById("filtroOrigemProdutos");
const filtroStatusProdutos = document.getElementById("filtroStatusProdutos");
const ordenacaoProdutos = document.getElementById("ordenacaoProdutos");
const quantidadePaginaProdutos = document.getElementById("quantidadePaginaProdutos");
const campoImagemProdutoExistente = document.getElementById("imagemProdutoExistente");
const shellProdutos = document.querySelector(".products-shell");
const botaoAbrirFiltrosProdutos = document.getElementById("botaoAbrirFiltrosProdutos");
const botaoFecharFiltrosProdutos = document.getElementById("botaoFecharFiltrosProdutos");
const botaoLimparFiltrosProdutos = document.getElementById("botaoLimparFiltrosProdutos");
const botaoAplicarFiltrosProdutos = document.getElementById("botaoAplicarFiltrosProdutos");
let dadosProdutos = { pecas: [], origens: [], entradas: [] };
let pecaSelecionadaParaImagem = null;

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarMoeda(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterIniciaisProduto(peca) {
  const sku = formatarSku(peca);

  if (sku !== "-") {
    return sku
      .split("-")
      .map(parte => parte[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }

  return String(peca.nome || "P")
    .split(" ")
    .filter(Boolean)
    .map(parte => parte[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function normalizarPeca(peca) {
  const quantidade = Number(peca.quantidade || 1);
  const quantidadeVendida = Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
  const origemId = Number(peca.origemId || peca.origem_id || 0);

  return {
    ...peca,
    id: Number(peca.id),
    nome: peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`,
    sku: peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "",
    origemId,
    quantidade,
    quantidadeVendida,
    status: peca.status || "em_estoque",
    imagemUrl: peca.imagemUrl || peca.imagem_url || "",
    precoVenda: Number(peca.precoVenda || peca.preco_venda || peca.valorVenda || peca.valor_venda || peca.preco_sugerido || 0),
    preparada: Boolean(peca.preparada)
  };
}

function calcularQuantidadeDisponivel(peca) {
  if (window.supabaseService?.calcularSaldoPeca) {
    return window.supabaseService.calcularSaldoPeca(peca, dadosProdutos.entradas || []).quantidadeDisponivel;
  }

  return Math.max(Number(peca.quantidade || 0) - Number(peca.quantidadeVendida || 0), 0);
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemProdutos.textContent = "Configure o Supabase para carregar a lista de pecas.";
    return { pecas: [] };
  }

  try {
    const [pecasSupabase, origensSupabase, entradasSupabase] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    return {
      pecas: pecasSupabase.map(normalizarPeca),
      origens: origensSupabase || [],
      entradas: entradasSupabase || []
    };
  } catch (erro) {
    console.error("Erro ao carregar produtos do Supabase:", erro);
    mensagemProdutos.textContent = "Nao foi possivel carregar os dados do Supabase.";
    return { pecas: [], origens: [], entradas: [] };
  }
}

function abrirDetalhesOrigem(origemId) {
  window.location.href = `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}`;
}

function abrirDetalhesProduto(pecaId) {
  window.location.href = `detalhes-produto.html?pecaId=${encodeURIComponent(pecaId)}`;
}

function abrirLancamentoCusto(pecaId) {
  window.location.href = `cadastro-custo.html?pecaId=${encodeURIComponent(pecaId)}`;
}

function filtrarPecasPorBusca(pecas) {
  const termo = String(campoBuscaProdutos?.value || "").trim().toLowerCase();

  if (!termo) {
    return pecas;
  }

  return pecas.filter(peca => {
    const nome = String(peca.nome || peca.nome_peca || "").toLowerCase();
    const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").toLowerCase();
    const codigo = String(peca.codigo || peca.codigo_peca || peca.cod || peca.id || "").toLowerCase();

    return nome.includes(termo) || sku.includes(termo) || codigo.includes(termo);
  });
}

function filtrarPecasPorEstoque(pecas) {
  const filtro = filtroEstoqueProdutos?.value || "";

  if (!filtro) {
    return pecas;
  }

  return pecas.filter(peca => {
    const disponivel = calcularQuantidadeDisponivel(peca);

    if (filtro === "em-estoque") {
      return disponivel > 0;
    }

    if (filtro === "sem-estoque") {
      return disponivel <= 0;
    }

    if (filtro === "estoque-baixo") {
      return disponivel > 0 && disponivel <= 2;
    }

    return true;
  });
}

function filtrarPecasPorOrigem(pecas) {
  const origemId = Number(filtroOrigemProdutos?.value || 0);

  if (!origemId) {
    return pecas;
  }

  return pecas.filter(peca => Number(peca.origemId || 0) === origemId);
}

function filtrarPecasPorStatus(pecas) {
  const status = filtroStatusProdutos?.value || "";

  if (!status) {
    return pecas;
  }

  return pecas.filter(peca => String(peca.status || "") === status);
}

function ordenarPecas(pecas) {
  const ordenacao = ordenacaoProdutos?.value || "nome";

  return [...pecas].sort((a, b) => {
    if (ordenacao === "sku") {
      return formatarSku(a).localeCompare(formatarSku(b), "pt-BR");
    }

    if (ordenacao === "estoque") {
      return calcularQuantidadeDisponivel(b) - calcularQuantidadeDisponivel(a);
    }

    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  });
}

function obterPecasVisiveis() {
  return ordenarPecas(
    filtrarPecasPorStatus(
      filtrarPecasPorOrigem(
        filtrarPecasPorEstoque(
          filtrarPecasPorBusca(dadosProdutos.pecas)
        )
      )
    )
  );
}

function limitarPecasPorPagina(pecas) {
  const valor = quantidadePaginaProdutos?.value || "24";

  if (valor === "todos") {
    return pecas;
  }

  const limite = Number(valor);
  return Number.isFinite(limite) && limite > 0 ? pecas.slice(0, limite) : pecas;
}

function alternarPainelFiltrosProdutos(aberto) {
  shellProdutos?.classList.toggle("products-shell--filters-open", aberto);
  botaoAbrirFiltrosProdutos?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

function limparFiltrosProdutos() {
  if (filtroEstoqueProdutos) filtroEstoqueProdutos.value = "";
  if (filtroOrigemProdutos) filtroOrigemProdutos.value = "";
  if (filtroStatusProdutos) filtroStatusProdutos.value = "";
  if (ordenacaoProdutos) ordenacaoProdutos.value = "nome";

  renderizarProdutos(obterPecasVisiveis());
}

function renderizarFiltroOrigens() {
  if (!filtroOrigemProdutos) {
    return;
  }

  const valorAtual = filtroOrigemProdutos.value;
  filtroOrigemProdutos.innerHTML = '<option value="">Todas</option>';

  dadosProdutos.origens
    .slice()
    .sort((a, b) => String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR"))
    .forEach(origem => {
      const opcao = document.createElement("option");
      opcao.value = origem.id;
      opcao.textContent = origem.descricao || origem.codigoOrigem || `Origem ${origem.id}`;
      filtroOrigemProdutos.appendChild(opcao);
    });

  filtroOrigemProdutos.value = valorAtual;
}

function abrirVenda(pecaId) {
  const id = Number(pecaId);

  if (!id) {
    alert("Nao foi possivel identificar a peca selecionada.");
    return;
  }

  window.location.href = `cadastro-venda.html?pecaId=${encodeURIComponent(id)}`;
}

function buscarPecaCarregada(pecaId) {
  return dadosProdutos.pecas.find(peca => Number(peca.id) === Number(pecaId));
}

function pedirImagemProduto(pecaId) {
  const peca = buscarPecaCarregada(pecaId);

  if (!peca) {
    alert("Nao foi possivel encontrar a peca selecionada.");
    return;
  }

  pecaSelecionadaParaImagem = peca;
  campoImagemProdutoExistente.value = "";
  campoImagemProdutoExistente.click();
}

function validarArquivoImagem(arquivo) {
  if (!arquivo) {
    return "Selecione uma imagem.";
  }

  if (!arquivo.type.startsWith("image/")) {
    return "Selecione um arquivo de imagem valido.";
  }

  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    return "Configure o Supabase antes de enviar imagens.";
  }

  return "";
}

async function salvarImagemProdutoExistente(arquivo) {
  const erroImagem = validarArquivoImagem(arquivo);

  if (erroImagem) {
    alert(erroImagem);
    return;
  }

  if (!pecaSelecionadaParaImagem) {
    alert("Selecione uma peca antes de enviar a imagem.");
    return;
  }

  mensagemProdutos.textContent = "Enviando imagem da peca...";

  try {
    const imagemUrl = await window.supabaseService.uploadImagemPeca(arquivo, pecaSelecionadaParaImagem);
    const pecaAtualizada = await window.supabaseService.atualizarPeca({
      ...pecaSelecionadaParaImagem,
      imagemUrl
    });

    dadosProdutos.pecas = dadosProdutos.pecas.map(peca => {
      return Number(peca.id) === Number(pecaAtualizada.id)
        ? normalizarPeca(pecaAtualizada)
        : peca;
    });

    renderizarProdutos(obterPecasVisiveis());
    mensagemProdutos.textContent = "Imagem da peca atualizada com sucesso.";
  } catch (erro) {
    console.error("Erro ao atualizar imagem da peca:", erro);
    mensagemProdutos.textContent = "Nao foi possivel atualizar a imagem da peca.";
  } finally {
    pecaSelecionadaParaImagem = null;
    campoImagemProdutoExistente.value = "";
  }
}

function obterClasseStatus(status) {
  if (status === "vendida") {
    return "status-badge status-badge--sold";
  }

  return "status-badge status-badge--stock";
}

function formatarStatusProduto(status, quantidadeDisponivel) {
  if (quantidadeDisponivel <= 0) {
    return "Sem estoque";
  }

  if (status === "vendida") {
    return "Vendido";
  }

  return "Em estoque";
}

function obterClasseStatusProduto(status, quantidadeDisponivel) {
  if (quantidadeDisponivel <= 0) {
    return "status-badge status-badge--empty";
  }

  return obterClasseStatus(status);
}

function renderizarBadgeStatusProduto(status, quantidadeDisponivel) {
  if (quantidadeDisponivel <= 0 || status === "vendida") {
    const classeStatus = obterClasseStatusProduto(status, quantidadeDisponivel);
    const statusProduto = formatarStatusProduto(status, quantidadeDisponivel);
    return `<span class="${classeStatus}">${escaparHtml(statusProduto)}</span>`;
  }

  if (quantidadeDisponivel <= 2) {
    return '<span class="status-badge status-badge--warning">Estoque baixo</span>';
  }

  return '<span class="status-badge status-badge--stock">Em estoque</span>';
}

function renderizarMidiaProduto(peca) {
  const imagemUrl = String(peca.imagemUrl || "").trim();

  if (imagemUrl) {
    return `<img src="${escaparHtml(imagemUrl)}" alt="Imagem de ${escaparHtml(formatarNomePeca(peca))}" loading="lazy">`;
  }

  return `<span>${escaparHtml(obterIniciaisProduto(peca))}</span>`;
}

function renderizarProdutos(pecas) {
  tabelaProdutos.innerHTML = "";
  const pecasPaginadas = limitarPecasPorPagina(pecas);

  if (pecas.length === 0) {
    mensagemProdutos.textContent = campoBuscaProdutos?.value
      ? "Nenhuma peca encontrada para a busca."
      : "Nenhuma peca cadastrada.";
    return;
  }

  mensagemProdutos.textContent = "";

  pecasPaginadas.forEach(peca => {
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
    const badgeStatus = renderizarBadgeStatusProduto(peca.status, quantidadeDisponivel);
    const precoOperacional = Number(peca.precoVenda || 0) > 0 ? formatarMoeda(peca.precoVenda) : "Sem preco";
    const linha = document.createElement("article");
    linha.className = `product-line${quantidadeDisponivel <= 0 ? " product-line--muted" : ""}`;

    linha.innerHTML = `
      <div class="product-line__thumb">
        ${renderizarMidiaProduto(peca)}
      </div>

      <div class="product-line__identity">
        <strong>${escaparHtml(formatarSku(peca))}</strong>
        <h3>${escaparHtml(peca.nome || "-")}</h3>
      </div>

      <div class="product-line__price">${escaparHtml(precoOperacional)}</div>

      <div class="product-line__stock">
        <span>${quantidadeDisponivel}</span>
      </div>

      ${badgeStatus}

      <div class="product-line__actions">
        <button class="product-line__button" type="button" data-acao="detalhes" data-peca-id="${peca.id}">Detalhes</button>
        <button class="product-line__button product-line__button--sale" type="button" data-acao="venda" data-peca-id="${peca.id}" ${quantidadeDisponivel > 0 ? "" : "disabled"}>Vender</button>
        <details class="product-line__menu">
          <summary aria-label="Mais acoes">...</summary>
          <div class="product-line__menu-list">
            <button type="button" data-acao="custo" data-peca-id="${peca.id}">Lancar custo</button>
            <button type="button" data-acao="origem" data-origem-id="${peca.origemId}" ${peca.origemId ? "" : "disabled"}>Ver origem</button>
            <button type="button" data-acao="imagem" data-peca-id="${peca.id}">Trocar imagem</button>
          </div>
        </details>
      </div>
    `;

    tabelaProdutos.appendChild(linha);
  });
}

async function inicializarProdutos() {
  dadosProdutos = await carregarDados();
  renderizarFiltroOrigens();
  renderizarProdutos(obterPecasVisiveis());
}

campoBuscaProdutos?.addEventListener("input", () => {
  renderizarProdutos(obterPecasVisiveis());
});

[filtroEstoqueProdutos, filtroOrigemProdutos, filtroStatusProdutos, ordenacaoProdutos, quantidadePaginaProdutos].forEach(campo => {
  campo?.addEventListener("change", () => renderizarProdutos(obterPecasVisiveis()));
});

botaoAbrirFiltrosProdutos?.addEventListener("click", () => {
  const aberto = !shellProdutos?.classList.contains("products-shell--filters-open");
  alternarPainelFiltrosProdutos(aberto);
});

botaoFecharFiltrosProdutos?.addEventListener("click", () => {
  alternarPainelFiltrosProdutos(false);
});

botaoAplicarFiltrosProdutos?.addEventListener("click", () => {
  renderizarProdutos(obterPecasVisiveis());
  alternarPainelFiltrosProdutos(false);
});

botaoLimparFiltrosProdutos?.addEventListener("click", () => {
  limparFiltrosProdutos();
});

document.addEventListener("keydown", evento => {
  if (evento.key === "Escape") {
    alternarPainelFiltrosProdutos(false);
  }
});

tabelaProdutos.addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-acao]");

  if (!botao) {
    return;
  }

  if (botao.dataset.acao === "origem" && botao.dataset.origemId) {
    abrirDetalhesOrigem(botao.dataset.origemId);
    return;
  }

  if (botao.dataset.acao === "detalhes" && botao.dataset.pecaId) {
    abrirDetalhesProduto(botao.dataset.pecaId);
    return;
  }

  if (botao.dataset.acao === "custo" && botao.dataset.pecaId) {
    abrirLancamentoCusto(botao.dataset.pecaId);
    return;
  }

  if (botao.dataset.acao === "imagem" && botao.dataset.pecaId) {
    pedirImagemProduto(botao.dataset.pecaId);
    return;
  }

  if (botao.dataset.acao === "venda" && botao.dataset.pecaId) {
    abrirVenda(botao.dataset.pecaId);
    return;
  }
});

campoImagemProdutoExistente?.addEventListener("change", evento => {
  const arquivo = evento.target.files?.[0];

  if (arquivo) {
    salvarImagemProdutoExistente(arquivo);
  }
});

document.addEventListener("DOMContentLoaded", inicializarProdutos);
