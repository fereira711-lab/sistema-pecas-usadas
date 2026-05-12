const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 8080);

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function resolverArquivo(url) {
  const caminhoUrl = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname);
  const caminhoSeguro = path.normalize(caminhoUrl).replace(/^(\.\.[/\\])+/, "");
  const arquivo = path.join(root, caminhoSeguro === "/" ? "index.html" : caminhoSeguro);

  if (!arquivo.startsWith(root)) {
    return null;
  }

  return arquivo;
}

http.createServer((req, res) => {
  const arquivo = resolverArquivo(req.url);

  if (!arquivo) {
    res.writeHead(403);
    res.end("Acesso negado");
    return;
  }

  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404);
      res.end("Arquivo nao encontrado");
      return;
    }

    res.writeHead(200, {
      "Content-Type": tipos[path.extname(arquivo).toLowerCase()] || "application/octet-stream"
    });
    res.end(conteudo);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Servidor local em http://127.0.0.1:${port}`);
});
