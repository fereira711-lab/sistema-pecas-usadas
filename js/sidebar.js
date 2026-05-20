(function () {
  const emPaginaInterna = window.location.pathname.includes("/paginas/");
  const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

  const grupos = [
    {
      titulo: "Painel Geral",
      icone: "ri-dashboard-line",
      aberto: ["index.html", "painel.html", "dashboard.html"].includes(paginaAtual),
      itens: [
        { texto: "Painel Geral", icone: "ri-dashboard-line", url: "painel.html" }
      ]
    },
    {
      titulo: "Produtos",
      icone: "ri-box-3-line",
      aberto: ["produtos.html", "cadastro-peca.html"].includes(paginaAtual),
      itens: [
        { texto: "Produtos", icone: "ri-search-line", url: "paginas/produtos.html" },
        { texto: "Cadastro de peça", icone: "ri-tools-line", url: "paginas/cadastro-peca.html" }
      ]
    },
    {
      titulo: "Vendas",
      icone: "ri-shopping-cart-2-line",
      aberto: ["cadastro-venda.html", "historico-vendas.html"].includes(paginaAtual),
      itens: [
        { texto: "Cadastro de venda", icone: "ri-add-circle-line", url: "paginas/cadastro-venda.html" },
        { texto: "Histórico de vendas", icone: "ri-history-line", url: "paginas/historico-vendas.html" }
      ]
    },
    {
      titulo: "Estoque",
      icone: "ri-archive-line",
      aberto: ["entradas-estoque.html", "giro-estoque.html", "alertas.html"].includes(paginaAtual),
      itens: [
        { texto: "Entradas de estoque", icone: "ri-stack-line", url: "paginas/entradas-estoque.html" },
        { texto: "Giro de estoque", icone: "ri-loop-right-line", url: "paginas/giro-estoque.html" },
        { texto: "Alertas", icone: "ri-alert-line", url: "paginas/alertas.html" }
      ]
    },
    {
      titulo: "Origens",
      icone: "ri-route-line",
      aberto: ["cadastro-origem.html", "listar-origens.html"].includes(paginaAtual),
      itens: [
        { texto: "Cadastro de origem", icone: "ri-car-line", url: "paginas/cadastro-origem.html" },
        { texto: "Origens cadastradas", icone: "ri-list-check-2", url: "paginas/listar-origens.html" }
      ]
    },
    {
      titulo: "Custos",
      icone: "ri-price-tag-3-line",
      aberto: ["cadastro-custo.html", "tipos-custo.html"].includes(paginaAtual),
      itens: [
        { texto: "Custo de peça", icone: "ri-money-dollar-circle-line", url: "paginas/cadastro-custo.html" },
        { texto: "Tipos de custo", icone: "ri-price-tag-3-line", url: "paginas/tipos-custo.html" }
      ]
    },
    {
      titulo: "Análises",
      icone: "ri-bar-chart-box-line",
      aberto: ["analise-produto.html", "analise-periodo.html", "analise-custos.html"].includes(paginaAtual),
      itens: [
        { texto: "Análise por produto", icone: "ri-pie-chart-line", url: "paginas/analise-produto.html" },
        { texto: "Análise por período", icone: "ri-calendar-event-line", url: "paginas/analise-periodo.html" },
        { texto: "Análise de custos", icone: "ri-funds-line", url: "paginas/analise-custos.html" }
      ]
    },
    {
      titulo: "Sistema",
      icone: "ri-settings-3-line",
      aberto: ["mapa-mental.html"].includes(paginaAtual),
      itens: [
        { texto: "Mapa mental", icone: "ri-mind-map", url: "docs/mapa-mental.html" },
        { texto: "Documentação", icone: "ri-file-text-line", url: "DOCUMENTACAO-SISTEMA.md" }
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
            <span class="app-sidebar__group-label">${grupo.titulo}</span>
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

    const email = document.body.dataset.authEmail || "Usuario logado";
    const menuRecolhido = localStorage.getItem("menuLateralRecolhido") === "sim";
    const sidebar = document.createElement("aside");
    sidebar.className = "app-sidebar";
    sidebar.innerHTML = `
      <a class="app-sidebar__brand" href="${emPaginaInterna ? "../painel.html" : "painel.html"}">
        <span><i class="ri-recycle-line"></i></span>
        <strong>DWDW ERP</strong>
      </a>
      <button id="botaoRecolherMenu" class="app-sidebar__collapse" type="button" aria-label="Recolher menu" title="Recolher menu">
        <i class="ri-side-bar-line" aria-hidden="true"></i>
        <span>Recolher</span>
      </button>
      <nav class="app-sidebar__nav" aria-label="Menu do sistema">
        ${grupos.map(criarGrupo).join("")}
      </nav>
      <div class="app-sidebar__session">
        <span id="emailUsuarioLogado">${email}</span>
        <button id="botaoLogout" class="app-sidebar__logout" type="button">
          <span class="app-sidebar__item-icon" aria-hidden="true"><i class="ri-logout-box-line"></i></span>
          <span>Sair</span>
        </button>
      </div>
    `;

    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.classList.add("has-app-sidebar");

    if (menuRecolhido) {
      document.body.classList.add("is-sidebar-collapsed");
      atualizarBotaoRecolher();
    }
  }

  function atualizarBotaoRecolher() {
    const botao = document.getElementById("botaoRecolherMenu");
    const recolhido = document.body.classList.contains("is-sidebar-collapsed");

    if (!botao) {
      return;
    }

    botao.setAttribute("aria-label", recolhido ? "Expandir menu" : "Recolher menu");
    botao.setAttribute("title", recolhido ? "Expandir menu" : "Recolher menu");
    botao.querySelector("span").textContent = recolhido ? "Expandir" : "Recolher";
  }

  function configurarGrupos() {
    const botaoRecolher = document.getElementById("botaoRecolherMenu");

    botaoRecolher?.addEventListener("click", () => {
      const vaiRecolher = !document.body.classList.contains("is-sidebar-collapsed");

      document.body.classList.toggle("is-sidebar-collapsed", vaiRecolher);
      localStorage.setItem("menuLateralRecolhido", vaiRecolher ? "sim" : "nao");
      atualizarBotaoRecolher();
    });

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

  document.addEventListener("auth:sessao-ok", evento => {
    const emailUsuario = document.getElementById("emailUsuarioLogado");

    if (emailUsuario) {
      emailUsuario.textContent = evento.detail?.email || "Usuario logado";
    }
  });
})();
