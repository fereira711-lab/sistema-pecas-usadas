(function () {
  function normalizarTextoMoeda(valor) {
    return String(valor ?? "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/^R\$/i, "")
      .replace(/[^\d,.-]/g, "");
  }

  function parseMoedaBR(valor) {
    if (typeof valor === "number") {
      return Number.isFinite(valor) ? valor : 0;
    }

    const textoOriginal = normalizarTextoMoeda(valor);

    if (!textoOriginal) {
      return 0;
    }

    const negativo = textoOriginal.startsWith("-");
    let texto = textoOriginal.replace(/-/g, "");
    const ultimaVirgula = texto.lastIndexOf(",");
    const ultimoPonto = texto.lastIndexOf(".");
    let separadorDecimal = "";

    if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
      separadorDecimal = ultimaVirgula > ultimoPonto ? "," : ".";
    } else if (ultimaVirgula >= 0) {
      separadorDecimal = ",";
    } else if (ultimoPonto >= 0) {
      const partes = texto.split(".");
      separadorDecimal = partes.length === 2 && partes[1].length !== 3 ? "." : "";
    }

    if (separadorDecimal === ",") {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (separadorDecimal === ".") {
      const indiceDecimal = texto.lastIndexOf(".");
      texto = `${texto.slice(0, indiceDecimal).replace(/\./g, "")}.${texto.slice(indiceDecimal + 1)}`;
    } else {
      texto = texto.replace(/[.,]/g, "");
    }

    const numero = Number(negativo ? `-${texto}` : texto);
    return Number.isFinite(numero) ? numero : 0;
  }

  function formatarMoedaBR(valor) {
    return parseMoedaBR(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function formatarEntradaMoedaBR(valor) {
    const numero = parseMoedaBR(valor);
    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function registrarCampoMoeda(campo) {
    if (!campo || campo.dataset.moedaRegistrada === "sim") {
      return;
    }

    campo.dataset.moedaRegistrada = "sim";
    campo.addEventListener("focus", () => {
      if (!campo.value.trim()) {
        return;
      }

      campo.value = formatarEntradaMoedaBR(campo.value);
    });
    campo.addEventListener("blur", () => {
      if (!campo.value.trim()) {
        return;
      }

      campo.value = formatarMoedaBR(campo.value);
    });
  }

  window.moedaUtils = {
    formatarMoedaBR,
    parseMoedaBR,
    formatarEntradaMoedaBR,
    registrarCampoMoeda
  };
})();
