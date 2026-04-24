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

document.addEventListener("DOMContentLoaded", configurarNavegacao);
