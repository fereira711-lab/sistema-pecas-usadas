function abrirPagina(caminho) {
  window.location.href = caminho;
}

function mostrarTelaFutura(mensagem) {
  alert(mensagem);
}

function configurarNavegacao() {
  const botoes = document.querySelectorAll("[data-url], [data-alert], [data-tela]");

  botoes.forEach(botao => {
    botao.addEventListener("click", () => {
      if (botao.dataset.url) {
        abrirPagina(botao.dataset.url);
        return;
      }

      if (botao.dataset.alert) {
        mostrarTelaFutura(botao.dataset.alert);
        return;
      }

      if (botao.dataset.tela) {
        mostrarTelaFutura(`Tela de ${botao.dataset.tela} será criada na próxima etapa.`);
      }
    });
  });
}

function fecharGrupoAccordion(botao) {
  const painel = document.getElementById(botao.getAttribute("aria-controls"));
  const icone = botao.querySelector(".accordion-icon");

  botao.setAttribute("aria-expanded", "false");

  if (painel) {
    painel.hidden = true;
  }

  if (icone) {
    icone.textContent = "+";
  }
}

function abrirGrupoAccordion(botao) {
  const painel = document.getElementById(botao.getAttribute("aria-controls"));
  const icone = botao.querySelector(".accordion-icon");

  botao.setAttribute("aria-expanded", "true");

  if (painel) {
    painel.hidden = false;
  }

  if (icone) {
    icone.textContent = "-";
  }
}

function configurarAccordion() {
  const botoes = document.querySelectorAll(".accordion-trigger");

  botoes.forEach(botao => {
    botao.addEventListener("click", () => {
      const estavaAberto = botao.getAttribute("aria-expanded") === "true";

      botoes.forEach(fecharGrupoAccordion);

      if (!estavaAberto) {
        abrirGrupoAccordion(botao);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", configurarNavegacao);
document.addEventListener("DOMContentLoaded", configurarAccordion);
