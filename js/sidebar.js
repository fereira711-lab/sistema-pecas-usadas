(function () {
  const emPaginaInterna = window.location.pathname.includes("/paginas/");
  const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

  const grupos = [
    {
      titulo: "Cadastros",
      icone: "ri-folder-add-line",
      aberto: ["cadastro-peca.html", "cadastro-origem.html", "cadastro-sucata.html", "cadastro-custo.html", "tipos-custo.html"].includes(paginaAtual),
      itens: [
        { texto: "Cadastro de Pecas", icone: "ri-tools-line", url: "paginas/cadastro-peca.html" },
        { texto: "Cadastro de Localizacao", icone: "ri-map-pin-line", url: "#", aviso: "Tela de localizacao sera criada em etapa futura." },
        { texto: "Cadastrar Origem", icone: "ri-car-line", url: "paginas/cadastro-origem.html" },
        { texto: "Cadastro de Sucata", icone: "ri-truck-line", url: "paginas/cadastro-sucata.html" },
        { texto: "Cadastro de Custo da Peca", icone: "ri-money-dollar-circle-line", url: "paginas/cadastro-custo.html" },
        { texto: "Tipos de Custo", icone: "ri-price-tag-3-line", url: "paginas/tipos-custo.html" }
      ]
    },
    {
      titulo: "Estoque",
      icone: "ri-archive-line",
      aberto: ["produtos.html", "estoque.html", "lotes.html"].includes(paginaAtual),
      itens: [
        { texto: "Produtos", icone: "ri-box-3-line", url: "paginas/produtos.html" },
        { texto: "Entradas de Estoque / Lotes", icone: "ri-stack-line", url: "paginas/lotes.html" },
        { texto: "Endereco de Peca", icone: "ri-map-pin-2-line", url: "#", aviso: "Tela de endereco de peca sera criada em etapa futura." },
      ]
    },
    {
      titulo: "Vendas",
      icone: "ri-shopping-cart-2-line",
      aberto: ["cadastro-venda.html", "historico-vendas.html"].includes(paginaAtual),
      itens: [
        { texto: "Nova Venda", icone: "ri-add-circle-line", url: "paginas/cadastro-venda.html" },
        { texto: "Historico de Venda", icone: "ri-history-line", url: "paginas/historico-vendas.html" }
      ]
    },
    {
      titulo: "Analise",
      icone: "ri-bar-chart-box-line",
      aberto: ["painel.html", "analise-produto.html", "analise-periodo.html", "analise-custos.html", "giro-estoque.html", "alertas.html", "origens.html"].includes(paginaAtual),
      itens: [
        { texto: "Painel Geral", icone: "ri-line-chart-line", url: "painel.html" },
        { texto: "Analise por Produto", icone: "ri-pie-chart-line", url: "paginas/analise-produto.html" },
        { texto: "Analise por Periodo", icone: "ri-calendar-event-line", url: "paginas/analise-periodo.html" },
        { texto: "Analise de Custos", icone: "ri-funds-line", url: "paginas/analise-custos.html" },
        { texto: "Giro de Estoque", icone: "ri-loop-right-line", url: "paginas/giro-estoque.html" },
        { texto: "Alertas", icone: "ri-alert-line", url: "paginas/alertas.html" },
        { texto: "Origens", icone: "ri-route-line", url: "paginas/origens.html" }
      ]
    },
    {
      titulo: "Detalhes",
      icone: "ri-information-line",
      aberto: ["detalhes-origem.html", "detalhes-produto.html", "detalhes-venda.html", "listar-origens.html", "relatorios.html"].includes(paginaAtual),
      itens: [
        { texto: "Listar Origens", icone: "ri-list-check-2", url: "paginas/listar-origens.html" },
        { texto: "Detalhes da Origem", icone: "ri-file-list-3-line", url: "#", aviso: "resolver depois" },
        { texto: "Detalhes da Peca", icone: "ri-file-search-line", url: "#", aviso: "resolver depois" },
        { texto: "Detalhes da Venda", icone: "ri-receipt-line", url: "#", aviso: "resolver depois" },
        { texto: "Relatorios", icone: "ri-file-chart-line", url: "paginas/relatorios.html" }
      ]
    },
    {
      titulo: "Sistema",
      icone: "ri-settings-3-line",
      aberto: ["login.html"].includes(paginaAtual),
      itens: [
        { texto: "Login", icone: "ri-login-box-line", url: "paginas/login.html" },
        { texto: "Mapa Mental", icone: "ri-mind-map", url: "docs/mapa-mental.html" }
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
    if (url === "#" || url.startsWith("http")) return url;
    if (!emPaginaInterna) return url;
    if (url.startsWith("paginas/")) return url.replace("paginas/", "");
    return "../" + url;
  }

  function nomeArquivo(url) {
    return String(url || "").split("/").pop();
  }

  function criarItem(item) {
    const ativo = nomeArquivo(item.url) === paginaAtual;
    const href = normalizarUrl(item.url);
    return `
      <a class="app-sidebar__link${ativo ? " is-active" : ""}" href="${href}"${item.aviso ? ` data-sidebar-alert="${item.aviso}"` : ""}>
        <span class="app-sidebar__item-icon" aria-hidden="true"><i class="${item.icone}"></i></span>
        <span>${item.texto}</span>
      </a>
    `;
  }

  function criarGrupo(grupo, index) {
    const aberto = grupo.aberto || (paginaAtual === "index.html" && index === 0);
    return `
      <section class="app-sidebar__group${aberto ? " is-open" : ""}">
        <button class="app-sidebar__group-button" type="button" aria-expanded="${aberto ? "true" : "false"}">
          <span class="app-sidebar__group-title">
            <span class="app-sidebar__group-icon" aria-hidden="true"><i class="${grupo.icone}"></i></span>
            ${grupo.titulo}
          </span>
          <span class="app-sidebar__chevron" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span>
        </button>
        <div class="app-sidebar__items">
          ${grupo.itens.map(criarItem).join("")}
        </div>
      </section>
    `;
  }

  function criarSidebar() {
    if (document.querySelector(".app-sidebar")) return;

    const sidebar = document.createElement("aside");
    sidebar.className = "app-sidebar";
    sidebar.innerHTML = `
      <a class="app-sidebar__brand" href="${emPaginaInterna ? "../dashboard.html" : "dashboard.html"}">
        <span><i class="ri-recycle-line"></i></span>
        <strong>DWDW ERP</strong>
      </a>
      <a class="app-sidebar__dashboard${paginaAtual === "dashboard.html" ? " is-active" : ""}" href="${emPaginaInterna ? "../dashboard.html" : "dashboard.html"}">
        <span class="app-sidebar__item-icon" aria-hidden="true"><i class="ri-dashboard-line"></i></span>
        <span>Dashboard</span>
      </a>
      <nav class="app-sidebar__nav" aria-label="Menu do sistema">
        ${grupos.map(criarGrupo).join("")}
      </nav>
    `;

    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.classList.add("has-app-sidebar");
  }

  function configurarGrupos() {
    document.querySelectorAll(".app-sidebar__group-button").forEach(botao => {
      botao.addEventListener("click", () => {
        const grupo = botao.closest(".app-sidebar__group");
        const vaiAbrir = !grupo.classList.contains("is-open");

        grupo.classList.toggle("is-open", vaiAbrir);
        botao.setAttribute("aria-expanded", String(vaiAbrir));
      });
    });

    document.querySelectorAll("[data-sidebar-alert]").forEach(link => {
      link.addEventListener("click", evento => {
        evento.preventDefault();
        alert(link.dataset.sidebarAlert);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    carregarRemixIcons();
    criarSidebar();
    configurarGrupos();
  });
})();
