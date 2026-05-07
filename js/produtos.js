const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagemProdutos = document.getElementById("mensagemProdutos");
const campoBuscaProdutos = document.getElementById("buscaProdutos");
const filtroEstoqueProdutos = document.getElementById("filtroEstoqueProdutos");
const filtroOrigemProdutos = document.getElementById("filtroOrigemProdutos");
const ordenacaoProdutos = document.getElementById("ordenacaoProdutos");
const campoImagemProdutoExistente = document.getElementById("imagemProdutoExistente");
let dadosProdutos = { pecas: [], origens: [] };
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
    preparada: Boolean(peca.preparada)
  };
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 0) - Number(peca.quantidadeVendida || 0), 0);
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemProdutos.textContent = "Configure o Supabase para carregar a lista de pecas.";
    return { pecas: [] };
  }

  try {
    const [pecasSupabase, origensSupabase] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarOrigens()
    ]);

    return {
      pecas: pecasSupabase.map(normalizarPeca),
      origens: origensSupabase || []
    };
  } catch (erro) {
    console.error("Erro ao carregar produtos do Supabase:", erro);
    mensagemProdutos.textContent = "Nao foi possivel carregar os dados do Supabase.";
    return { pecas: [] };
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

    return nome.includes(termo) || sku.includes(termo);
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
    filtrarPecasPorOrigem(
      filtrarPecasPorEstoque(
        filtrarPecasPorBusca(dadosProdutos.pecas)
      )
    )
  );
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

function renderizarMidiaProduto(peca) {
  const imagemUrl = String(peca.imagemUrl || "").trim();

  if (imagemUrl) {
    return `<img src="${escaparHtml(imagemUrl)}" alt="Imagem de ${escaparHtml(formatarNomePeca(peca))}" loading="lazy">`;
  }

  return `<span>${escaparHtml(obterIniciaisProduto(peca))}</span>`;
}

function renderizarProdutos(pecas) {
  tabelaProdutos.innerHTML = "";

  if (pecas.length === 0) {
    mensagemProdutos.textContent = campoBuscaProdutos?.value
      ? "Nenhuma peca encontrada para a busca."
      : "Nenhuma peca cadastrada.";
    return;
  }

  mensagemProdutos.textContent = "";

  pecas.forEach(peca => {
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
    const classeStatus = obterClasseStatus(peca.status);
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-card__media">
        ${renderizarMidiaProduto(peca)}
      </div>

      <div class="product-card__body">
        <div class="product-card__header">
          <div>
            <p class="product-card__sku">${escaparHtml(formatarSku(peca))}</p>
            <h3>${escaparHtml(peca.nome || "-")}</h3>
          </div>
          <span class="${classeStatus}">${escaparHtml(peca.status)}</span>
        </div>

        <div class="product-card__stock">
          <span>Estoque disponível</span>
          <strong>${quantidadeDisponivel}</strong>
        </div>

        <div class="product-card__actions">
          <button type="button" data-acao="detalhes" data-peca-id="${peca.id}">Ver detalhes</button>
          <button type="button" data-acao="venda" data-peca-id="${peca.id}" onclick="abrirVenda(${peca.id})" ${quantidadeDisponivel > 0 ? "" : "disabled"}>Vender</button>
          <button type="button" data-acao="custo" data-peca-id="${peca.id}">Lançar custo</button>
          <button type="button" data-acao="origem" data-origem-id="${peca.origemId}" ${peca.origemId ? "" : "disabled"}>Ver origem</button>
        </div>
      </div>
    `;

    tabelaProdutos.appendChild(card);
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

[filtroEstoqueProdutos, filtroOrigemProdutos, ordenacaoProdutos].forEach(campo => {
  campo?.addEventListener("change", () => renderizarProdutos(obterPecasVisiveis()));
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

  if (botao.dataset.acao === "venda") {
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
