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

  function caminhoIndex() {
    return window.location.pathname.includes("/paginas/")
      ? "../index.html"
      : "index.html";
  }

  function definirMensagem(elemento, texto, tipo = "") {
    if (!elemento) {
      return;
    }

    elemento.textContent = texto;
    elemento.className = `form-message${tipo ? ` form-message--${tipo}` : ""}`;
  }

  function obterUrlRetorno() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("redirect") || caminhoIndex();
  }

  async function verificarSessaoProtegida() {
    const mensagemAuth = document.getElementById("mensagemAuth");

    if (!supabaseAuth) {
      definirMensagem(mensagemAuth, "Configure o Supabase antes de acessar o sistema.", "warning");
      document.body.classList.remove("auth-checking");
      return;
    }

    const { data, error } = await supabaseAuth.auth.getSession();

    if (error || !data.session) {
      const destino = `${caminhoLogin()}?redirect=${encodeURIComponent(window.location.href)}`;
      window.location.replace(destino);
      return;
    }

    const emailUsuario = document.getElementById("emailUsuarioLogado");

    if (emailUsuario) {
      emailUsuario.textContent = data.session.user?.email || "Usuario logado";
    }

    document.body.classList.remove("auth-checking");
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

  async function sair() {
    if (supabaseAuth) {
      await supabaseAuth.auth.signOut();
    }

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

  document.addEventListener("DOMContentLoaded", () => {
    const paginaAuth = document.body.dataset.auth;
    const formularioLogin = document.getElementById("formLogin");
    const botaoLogout = document.getElementById("botaoLogout");

    if (paginaAuth === "protected") {
      verificarSessaoProtegida();
    }

    if (paginaAuth === "login") {
      redirecionarUsuarioLogado();
    }

    formularioLogin?.addEventListener("submit", fazerLogin);
    botaoLogout?.addEventListener("click", sair);
  });
})();
