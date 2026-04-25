const http = require("http");
const fs = require("fs");
const path = require("path");

const porta = Number(process.env.PORT || 8000);
const raiz = __dirname;
const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const servidor = http.createServer((requisicao, resposta) => {
  const url = decodeURIComponent(requisicao.url.split("?")[0]);
  const caminhoUrl = url === "/" ? "/index.html" : url;
  const arquivo = path.normalize(path.join(raiz, caminhoUrl));

  if (!arquivo.startsWith(raiz)) {
    resposta.writeHead(403);
    resposta.end("Acesso negado");
    return;
  }

  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) {
      resposta.writeHead(404);
      resposta.end("Arquivo nao encontrado");
      return;
    }

    resposta.writeHead(200, {
      "Content-Type": tipos[path.extname(arquivo).toLowerCase()] || "application/octet-stream"
    });
    resposta.end(conteudo);
  });
});

servidor.on("error", erro => {
  console.error("Nao foi possivel iniciar o servidor local:", erro.message);
  process.exit(1);
});

servidor.listen(porta, "127.0.0.1", () => {
  console.log(`Servidor local em http://127.0.0.1:${porta}`);
  console.log(`Custos: http://127.0.0.1:${porta}/paginas/custos.html`);
});
