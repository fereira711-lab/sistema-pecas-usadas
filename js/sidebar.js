// Navegação principal do sistema (redesenho, seção 6 da especificação).
// Monta a sidebar em todas as telas, marca o item ativo e mostra o contador de "precisa de atenção".
(function () {
  // O nome comercial do sistema ainda está pendente (seção 9 da especificação).
  const NOME_SISTEMA = "DWDW ERP";
  const NOME_LOJA = "DWDW Autopeças";

  const CHAVE_CONTADOR = "sidebar:contadorAtencao";
  const VALIDADE_CONTADOR_MS = 5 * 60 * 1000;

  const emPaginaInterna = window.location.pathname.includes("/paginas/");
  const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

  // "paginas" lista as telas que deixam o item ativo além da própria url (subpáginas e cadastros).
  const secoes = [
    {
      titulo: "Operação",
      itens: [
        { id: "painel", texto: "Painel", icone: "ri-layout-grid-line", url: "painel.html", paginas: ["index.html", "dashboard.html"] },
        { id: "produtos", texto: "Produtos", icone: "ri-box-3-line", url: "paginas/produtos.html", paginas: ["cadastro-peca.html", "detalhes-produto.html", "cadastro-custo.html"] },
        { id: "origens", texto: "Origens", icone: "ri-car-line", url: "paginas/listar-origens.html", paginas: ["cadastro-origem.html", "detalhes-origem.html", "lotes.html"] },
        { id: "vendas", texto: "Vendas", icone: "ri-shopping-cart-2-line", url: "paginas/historico-vendas.html", paginas: ["cadastro-venda.html", "detalhes-venda.html"] },
        { id: "entradas", texto: "Entradas de estoque", icone: "ri-download-2-line", url: "paginas/entradas-estoque.html", paginas: [] },
        { id: "alertas", texto: "Alertas", icone: "ri-notification-3-line", url: "paginas/alertas.html", paginas: [], contador: true }
      ]
    },
    {
      titulo: "Gestão",
      itens: [
        { id: "analises", texto: "Análises", icone: "ri-bar-chart-2-line", url: "paginas/analise-produto.html", paginas: ["analise-periodo.html", "analise-custos.html", "giro-estoque.html", "relatorios.html"] },
        { id: "tipos-custo", texto: "Tipos de custo", icone: "ri-price-tag-3-line", url: "paginas/tipos-custo.html", paginas: [] }
      ]
    }
  ];

  function carregarRemixIcons() {
    if (document.querySelector("link[data-remix-icons]")) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css";
    link.dataset.remixIcons = "true";
    document.head.appendChild(link);
  }

  function normalizarUrl(url) {
    if (!emPaginaInterna) return url;
    if (url.startsWith("paginas/")) return url.replace("paginas/", "");
    return "../" + url;
  }

  function nomeArquivo(url) {
    return String(url || "").split("/").pop();
  }

  function itemEstaAtivo(item) {
    return nomeArquivo(item.url) === paginaAtual || item.paginas.includes(paginaAtual);
  }

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function criarItem(item) {
    const ativo = itemEstaAtivo(item);
    const contador = item.contador
      ? `<span class="side-nav__count" data-contador-atencao hidden></span>`
      : "";

    return `
      <a class="side-nav__link" href="${normalizarUrl(item.url)}"${ativo ? ' aria-current="page"' : ""}>
        <span class="side-nav__icon" aria-hidden="true"><i class="${item.icone}"></i></span>
        <span class="side-nav__label">${item.texto}</span>
        ${contador}
      </a>
    `;
  }

  function criarSecao(secao) {
    const idTitulo = `side-nav-${secao.titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`;

    return `
      <div class="side-nav__section" role="group" aria-labelledby="${idTitulo}">
        <p class="side-nav__section-title" id="${idTitulo}">${secao.titulo}</p>
        ${secao.itens.map(criarItem).join("")}
      </div>
    `;
  }

  function criarSidebar() {
    if (document.querySelector(".side-nav")) return;

    const sidebar = document.createElement("nav");
    sidebar.className = "side-nav";
    sidebar.setAttribute("aria-label", "Navegação principal");
    sidebar.innerHTML = `
      <div class="side-nav__top">
        <a class="side-nav__brand" href="${normalizarUrl("painel.html")}">
          <span class="side-nav__brand-mark" aria-hidden="true"><i class="ri-car-line"></i></span>
          <span class="side-nav__brand-text">
            <span class="side-nav__brand-name">${NOME_SISTEMA}</span>
            <span class="side-nav__brand-store">${NOME_LOJA}</span>
          </span>
        </a>
        <button class="side-nav__toggle" type="button" aria-expanded="false" aria-controls="sideNavCorpo" aria-label="Abrir menu">
          <i class="ri-menu-line" aria-hidden="true"></i>
        </button>
      </div>
      <div class="side-nav__body" id="sideNavCorpo">
        ${secoes.map(criarSecao).join("")}
        <div class="side-nav__footer">
          <div class="side-nav__user">
            <span class="side-nav__avatar" id="avatarUsuarioLogado" aria-hidden="true">?</span>
            <span class="side-nav__user-text">
              <span class="side-nav__user-name" id="nomeUsuarioLogado">Usuário</span>
              <span class="side-nav__user-role" id="emailUsuarioLogado"></span>
            </span>
          </div>
          <button id="botaoLogout" class="side-nav__logout" type="button" aria-label="Sair do sistema" title="Sair do sistema">
            <i class="ri-logout-box-r-line" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;

    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.classList.add("has-side-nav");

    const botaoMenu = sidebar.querySelector(".side-nav__toggle");
    botaoMenu.addEventListener("click", () => {
      const abrir = !sidebar.classList.contains("is-open");
      sidebar.classList.toggle("is-open", abrir);
      botaoMenu.setAttribute("aria-expanded", String(abrir));
      botaoMenu.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
    });
  }

  function preencherUsuario(email) {
    const texto = String(email || "").trim();
    const nome = texto.split("@")[0] || "Usuário";
    const nomeEl = document.getElementById("nomeUsuarioLogado");
    const emailEl = document.getElementById("emailUsuarioLogado");
    const avatarEl = document.getElementById("avatarUsuarioLogado");

    if (nomeEl) nomeEl.textContent = nome;
    if (emailEl) emailEl.textContent = texto;
    if (avatarEl) avatarEl.textContent = nome.charAt(0) || "?";
  }

  // ---- Contador de "precisa de atenção" ----

  function mostrarContador(total) {
    const alvo = document.querySelector("[data-contador-atencao]");
    if (!alvo) return;

    const numero = Number(total || 0);
    alvo.textContent = String(numero);
    alvo.hidden = numero <= 0;
    alvo.setAttribute("aria-label", `${numero} ${numero === 1 ? "item precisa" : "itens precisam"} de atenção`);
  }

  function lerContadorGuardado() {
    try {
      const guardado = JSON.parse(sessionStorage.getItem(CHAVE_CONTADOR) || "null");
      if (guardado && Date.now() - guardado.em < VALIDADE_CONTADOR_MS) return guardado.total;
    } catch (erro) {
      // sessionStorage indisponível: calcula de novo.
    }
    return null;
  }

  function guardarContador(total) {
    try {
      sessionStorage.setItem(CHAVE_CONTADOR, JSON.stringify({ total, em: Date.now() }));
    } catch (erro) {
      // Sem armazenamento, o contador só não fica em cache.
    }
    mostrarContador(total);
  }

  function carregarScript(caminho) {
    return new Promise((resolver, rejeitar) => {
      const script = document.createElement("script");
      script.src = normalizarUrl(caminho);
      script.onload = resolver;
      script.onerror = () => rejeitar(new Error(`Não foi possível carregar ${caminho}`));
      document.head.appendChild(script);
    });
  }

  async function calcularContador() {
    const guardado = lerContadorGuardado();
    if (guardado !== null) {
      mostrarContador(guardado);
      return;
    }

    const servico = window.supabaseService;
    if (!servico || !servico.estaConfigurado?.()) return;

    try {
      if (!window.financeiroUtils) await carregarScript("js/financeiro-utils.js?v=2");
      if (!window.alertasRegras) await carregarScript("js/alertas-regras.js?v=1");

      const [origens, pecas, vendas, consumosEstoque, entradasEstoque, custosVenda] = await Promise.all([
        servico.listarOrigens(),
        servico.listarPecas(),
        servico.listarVendas(),
        servico.listarConsumosEstoque(),
        servico.listarEntradasEstoque(),
        servico.listarCustosVenda?.() || []
      ]);

      guardarContador(window.alertasRegras.contarGruposDeAtencao({
        origens: origens || [],
        pecas: pecas || [],
        vendas: vendas || [],
        consumosEstoque: consumosEstoque || [],
        entradasEstoque: entradasEstoque || [],
        custosVenda: custosVenda || []
      }));
    } catch (erro) {
      console.error("Não foi possível calcular o contador de alertas:", erro);
    }
  }

  // O Painel já carrega todos os dados; ele avisa o total para a sidebar não buscar de novo.
  window.sidebarNavegacao = { atualizarContadorAtencao: guardarContador };

  document.addEventListener("DOMContentLoaded", () => {
    carregarRemixIcons();
    criarSidebar();
  });

  document.addEventListener("auth:sessao-ok", evento => {
    preencherUsuario(evento.detail?.email);

    if (!document.body.dataset.contadorPeloPainel) {
      calcularContador();
    }
  });
})();
