(function () {
  const config = window.SUPABASE_CONFIG || {};
  const supabaseAuth = window.supabase?.createClient && config.url && config.anonKey
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  function caminhoLogin() {
    return window.location.pathname.includes("/paginas/")
      ? "login.html"
      : "paginas/login.html";
  }

  function caminhoInicial() {
    return window.location.pathname.includes("/paginas/")
      ? "../painel.html"
      : "painel.html";
  }

  function definirMensagem(elemento, texto, tipo = "") {
    if (!elemento) {
      return;
    }

    elemento.textContent = texto;
    elemento.className = `form-message${tipo ? ` form-message--${tipo}` : ""}`;
  }

  // Destino depois do login (?redirect=): só caminho dentro do próprio sistema, começando com "/".
  // Recusa endereço de outro site ("//site", "/\site"), esquema ("http:", "javascript:"), caracteres de
  // controle e qualquer coisa que não comece com "/". Valor recusado: volta null e o login abre o Painel.
  function validarDestinoRetorno(valor) {
    const destino = String(valor ?? "").trim();

    if (!destino.startsWith("/")) return null;
    if (destino.startsWith("//") || destino.includes("\\")) return null;
    if (/[\u0000-\u001f\u007f]/.test(destino)) return null;
    if (/^\/*[a-z][a-z0-9+.-]*:/i.test(destino)) return null;

    return destino;
  }

  function obterUrlRetorno() {
    const parametros = new URLSearchParams(window.location.search);
    return validarDestinoRetorno(parametros.get("redirect")) || caminhoInicial();
  }

  function limparSessaoLocal() {
    try {
      Object.keys(window.localStorage || {}).forEach(chave => {
        if (chave.startsWith("sb-") || chave.includes("supabase.auth.token")) {
          window.localStorage.removeItem(chave);
        }
      });
    } catch (erro) {
      console.warn("Nao foi possivel limpar a sessao local.", erro);
    }
  }

  function redirecionarParaLogin() {
    // Só o caminho da página (sem origem), para passar na validação do retorno.
    const caminho = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const destino = `${caminhoLogin()}?redirect=${encodeURIComponent(caminho)}`;
    window.location.replace(destino);
  }

  async function verificarSessaoProtegida() {
    const mensagemAuth = document.getElementById("mensagemAuth");

    if (!supabaseAuth) {
      definirMensagem(mensagemAuth, "Configure o Supabase antes de acessar o sistema.", "warning");
      window.location.replace(caminhoLogin());
      return;
    }

    const { data, error } = await supabaseAuth.auth.getSession();

    if (error || !data.session) {
      redirecionarParaLogin();
      return;
    }

    const { data: dadosUsuario, error: erroUsuario } = await supabaseAuth.auth.getUser();

    if (erroUsuario || !dadosUsuario.user) {
      limparSessaoLocal();
      redirecionarParaLogin();
      return;
    }

    const emailUsuario = document.getElementById("emailUsuarioLogado");
    const email = dadosUsuario.user.email || data.session.user?.email || "Usuario logado";

    document.body.dataset.authEmail = email;

    if (emailUsuario) {
      emailUsuario.textContent = email;
    }

    document.body.classList.remove("auth-checking");
    document.dispatchEvent(new CustomEvent("auth:sessao-ok", { detail: { email } }));
  }

  async function fazerLogin(evento) {
    evento.preventDefault();

    const mensagemLogin = document.getElementById("mensagemLogin");
    const campoEmail = document.getElementById("emailLogin");
    const campoSenha = document.getElementById("senhaLogin");
    const botaoLogin = document.getElementById("botaoLogin");

    if (!supabaseAuth) {
      definirMensagem(mensagemLogin, "Configure o Supabase antes de fazer login.", "warning");
      return;
    }

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    if (!email || !senha) {
      definirMensagem(mensagemLogin, "Informe email e senha.", "warning");
      return;
    }

    botaoLogin.disabled = true;
    definirMensagem(mensagemLogin, "Entrando...");

    const { error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      definirMensagem(mensagemLogin, "Email ou senha invalidos.", "warning");
      botaoLogin.disabled = false;
      return;
    }

    definirMensagem(mensagemLogin, "Login realizado com sucesso.", "success");
    window.location.href = obterUrlRetorno();
  }

  // ---- Esqueci minha senha (Login) ----

  const TAMANHO_MINIMO_SENHA = 8;

  function alternarRecuperacao(mostrar) {
    const formLogin = document.getElementById("formLogin");
    const formRecuperar = document.getElementById("formRecuperarSenha");
    const titulo = document.getElementById("tituloLogin");
    const subtitulo = document.getElementById("subtituloLogin");

    if (!formLogin || !formRecuperar) return;

    formLogin.hidden = mostrar;
    formRecuperar.hidden = !mostrar;
    if (titulo) titulo.textContent = mostrar ? "Recuperar senha" : "Entrar";
    if (subtitulo) {
      subtitulo.textContent = mostrar
        ? "Informe o e-mail da loja. Enviamos um link para criar uma nova senha."
        : "Use o e-mail e a senha da loja.";
    }

    const campo = document.getElementById(mostrar ? "emailRecuperacao" : "emailLogin");
    const emailDigitado = document.getElementById("emailLogin")?.value || "";
    if (mostrar && campo && !campo.value) campo.value = emailDigitado;
    campo?.focus();
  }

  async function enviarLinkRecuperacao(evento) {
    evento.preventDefault();

    const mensagem = document.getElementById("mensagemRecuperacao");
    const campoEmail = document.getElementById("emailRecuperacao");
    const botao = document.getElementById("botaoRecuperarSenha");
    const email = campoEmail.value.trim();

    if (!supabaseAuth) {
      definirMensagem(mensagem, "Configure o Supabase antes de recuperar a senha.", "warning");
      return;
    }

    if (!email) {
      definirMensagem(mensagem, "Informe o e-mail.", "warning");
      return;
    }

    botao.disabled = true;
    definirMensagem(mensagem, "Enviando...");

    // O link do e-mail volta para a tela de nova senha, na mesma pasta do Login.
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("nova-senha.html", window.location.href).href
    });

    botao.disabled = false;

    if (error) {
      console.error("Erro ao enviar o link de recuperação:", error);
      definirMensagem(mensagem, "Não foi possível enviar o link agora. Tente de novo em alguns minutos.", "warning");
      return;
    }

    // Mesma resposta para qualquer e-mail, para não revelar quais estão cadastrados.
    definirMensagem(mensagem, "Se esse e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.", "success");
  }

  // ---- Nova senha (link do e-mail) ----

  function linkComErro() {
    const parametros = new URLSearchParams(window.location.hash.replace(/^#/, "") || window.location.search);
    return parametros.get("error_code") || parametros.get("error") || "";
  }

  async function prepararNovaSenha() {
    const form = document.getElementById("formNovaSenha");
    const mensagem = document.getElementById("mensagemNovaSenha");

    if (!form) return;

    if (!supabaseAuth) {
      definirMensagem(mensagem, "Configure o Supabase antes de trocar a senha.", "warning");
      return;
    }

    // O cliente do Supabase lê o link do e-mail sozinho; getSession espera essa leitura terminar.
    const erroDoLink = linkComErro();
    const { data } = await supabaseAuth.auth.getSession();

    if (erroDoLink || !data.session) {
      definirMensagem(mensagem, "Este link é inválido ou já expirou. Peça um novo em \"Esqueci minha senha\", na tela de entrada.", "warning");
      document.getElementById("linkVoltarLogin")?.removeAttribute("hidden");
      return;
    }

    // Tira os dados do link da barra de endereço.
    window.history.replaceState(null, "", window.location.pathname);
    form.hidden = false;
    document.getElementById("novaSenha")?.focus();
  }

  async function salvarNovaSenha(evento) {
    evento.preventDefault();

    const mensagem = document.getElementById("mensagemNovaSenha");
    const senha = document.getElementById("novaSenha").value;
    const confirmacao = document.getElementById("confirmarNovaSenha").value;
    const botao = document.getElementById("botaoSalvarNovaSenha");

    if (senha.length < TAMANHO_MINIMO_SENHA) {
      definirMensagem(mensagem, `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`, "warning");
      return;
    }

    if (senha !== confirmacao) {
      definirMensagem(mensagem, "As duas senhas não são iguais.", "warning");
      return;
    }

    botao.disabled = true;
    definirMensagem(mensagem, "Salvando...");

    const { error } = await supabaseAuth.auth.updateUser({ password: senha });

    if (error) {
      console.error("Erro ao trocar a senha:", error);
      botao.disabled = false;
      definirMensagem(mensagem, error.message && /different|diferente/i.test(error.message)
        ? "A nova senha precisa ser diferente da anterior."
        : "Não foi possível trocar a senha. Peça um novo link e tente de novo.", "warning");
      return;
    }

    document.getElementById("formNovaSenha").reset();
    definirMensagem(mensagem, "Senha alterada. Abrindo o sistema...", "success");
    window.setTimeout(() => {
      window.location.href = caminhoInicial();
    }, 1500);
  }

  async function sair() {
    if (supabaseAuth) {
      await supabaseAuth.auth.signOut();
    }

    limparSessaoLocal();
    window.location.href = caminhoLogin();
  }

  async function redirecionarUsuarioLogado() {
    if (!supabaseAuth) {
      return;
    }

    const { data } = await supabaseAuth.auth.getSession();

    if (data.session) {
      window.location.href = obterUrlRetorno();
    }
  }

  window.authRetorno = { validarDestinoRetorno };

  document.addEventListener("DOMContentLoaded", () => {
    const paginaAuth = document.body.dataset.auth;
    const formularioLogin = document.getElementById("formLogin");

    if (paginaAuth === "protected") {
      verificarSessaoProtegida();
    }

    if (paginaAuth === "login") {
      redirecionarUsuarioLogado();
    }

    if (paginaAuth === "nova-senha") {
      prepararNovaSenha();
    }

    formularioLogin?.addEventListener("submit", fazerLogin);
    document.getElementById("formRecuperarSenha")?.addEventListener("submit", enviarLinkRecuperacao);
    document.getElementById("formNovaSenha")?.addEventListener("submit", salvarNovaSenha);
    document.getElementById("botaoEsqueciSenha")?.addEventListener("click", () => alternarRecuperacao(true));
    document.getElementById("botaoVoltarLogin")?.addEventListener("click", () => alternarRecuperacao(false));
  });

  document.addEventListener("click", evento => {
    const botaoLogout = evento.target.closest("#botaoLogout");

    if (!botaoLogout) {
      return;
    }

    evento.preventDefault();
    sair();
  });
})();
