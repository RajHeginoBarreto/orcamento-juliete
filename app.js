// Formulário de orçamento — Juliete Acabamentos
// Monta a mensagem e abre o WhatsApp da empresa. Nada é salvo em servidor.

(function () {
  "use strict";

  var WHATSAPP = "5548996547244";

  var form = document.getElementById("form");
  var steps = document.getElementById("steps");
  var done = document.getElementById("done");
  var doneLink = document.getElementById("done-link");
  var again = document.getElementById("again");
  var summary = document.getElementById("summary");
  var outrosField = document.getElementById("outros-field");

  var altura = form.elements.altura;
  var largura = form.elements.largura;
  var metragem = form.elements.metragem;
  var metragemManual = false;

  // "2,80" ou "2.80" → 2.8 ; vazio/ inválido → NaN
  function num(v) {
    v = String(v || "").trim().replace(/\s/g, "").replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(v)) return NaN;
    return parseFloat(v);
  }

  function fmt(n) {
    return (Math.round(n * 100) / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  }

  function fieldOf(el) {
    return el.closest(".field");
  }

  function setInvalid(el, bad) {
    var f = fieldOf(el);
    if (f) f.classList.toggle("is-invalid", !!bad);
  }

  // ----- metragem automática (altura × largura) -----
  function recalc() {
    var a = num(altura.value);
    var l = num(largura.value);
    if (!metragemManual) {
      if (a > 0 && l > 0) {
        metragem.value = fmt(a * l);
        metragem.classList.add("is-auto");
        setInvalid(metragem, false);
      } else {
        metragem.value = "";
        metragem.classList.remove("is-auto");
      }
    }
    updateSummary();
  }

  altura.addEventListener("input", function () {
    setInvalid(altura, false);
    recalc();
  });
  largura.addEventListener("input", function () {
    setInvalid(largura, false);
    recalc();
  });
  metragem.addEventListener("input", function () {
    metragem.classList.remove("is-auto");
    metragemManual = metragem.value.trim() !== "";
    setInvalid(metragem, false);
    if (!metragemManual) recalc();
    updateSummary();
  });

  // ----- "Outros" mostra o campo "Qual?" -----
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.type === "radio") {
      setInvalid(t, false);
      if (t.name === "origem") {
        outrosField.hidden = t.value !== "Outros";
        if (t.value === "Outros") form.elements.origem_outros.focus();
      }
      updateSummary();
    }
  });

  form.addEventListener("input", function (e) {
    var t = e.target;
    if (t.required && t.type !== "radio" && t.value.trim()) setInvalid(t, false);
  });

  function radio(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function updateSummary() {
    var m = num(metragem.value);
    var tipo = radio("tipo");
    var apl = radio("aplicacao");
    if (m > 0 && tipo) {
      summary.hidden = false;
      summary.textContent =
        "Resumo: " + fmt(m) + " m² de " + tipo.toLowerCase() + (apl ? " · aplicação " + apl.toLowerCase() : "");
    } else {
      summary.hidden = true;
    }
  }

  // ----- validação -----
  function validate() {
    var firstBad = null;
    function check(el, ok) {
      setInvalid(el, !ok);
      if (!ok && !firstBad) firstBad = el;
    }

    var nome = form.elements.nome;
    check(nome, nome.value.trim().split(/\s+/).filter(Boolean).length >= 2);
    check(form.elements.cidade, form.elements.cidade.value.trim().length >= 2);
    check(form.elements.endereco, form.elements.endereco.value.trim().length >= 4);
    check(form.querySelector('input[name="aplicacao"]'), !!radio("aplicacao"));
    check(altura, !altura.value.trim() || num(altura.value) > 0);
    check(largura, !largura.value.trim() || num(largura.value) > 0);
    check(metragem, num(metragem.value) > 0);
    check(form.querySelector('input[name="tipo"]'), !!radio("tipo"));
    check(form.querySelector('input[name="origem"]'), !!radio("origem"));

    if (firstBad) {
      var target = fieldOf(firstBad) || firstBad;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () {
        firstBad.focus({ preventScroll: true });
      }, 350);
    }
    return !firstBad;
  }

  // ----- envio pelo WhatsApp -----
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    var v = function (n) {
      return form.elements[n].value.trim();
    };
    var origem = radio("origem");
    if (origem === "Outros" && v("origem_outros")) origem = "Outros — " + v("origem_outros");

    var a = num(altura.value);
    var l = num(largura.value);

    var lines = [
      "Olá, Juliete! Gostaria de solicitar um orçamento.",
      "",
      "*1. DADOS DO CLIENTE*",
      "Nome: " + v("nome"),
      "Cidade: " + v("cidade"),
      "Endereço da obra: " + v("endereco"),
      "",
      "*2. INFORMAÇÕES DA PAREDE*",
      "Aplicação: " + radio("aplicacao"),
    ];
    if (a > 0) lines.push("Altura: " + fmt(a) + " m");
    if (l > 0) lines.push("Largura: " + fmt(l) + " m");
    lines.push(
      "Metragem total: " + fmt(num(metragem.value)) + " m²",
      "",
      "*3. TIPO DE REVESTIMENTO*",
      radio("tipo"),
      "",
      "*4. COMO CONHECEU A EMPRESA*",
      origem
    );

    var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
    doneLink.href = url;

    // (com "noopener" o window.open sempre devolve null, então o opener é limpo à mão)
    var win = window.open(url, "_blank");
    if (win) win.opener = null;
    steps.hidden = true;
    done.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    // se o navegador bloquear a nova aba, abre na mesma
    if (!win) window.location.href = url;
  });

  again.addEventListener("click", function () {
    form.reset();
    metragemManual = false;
    metragem.classList.remove("is-auto");
    outrosField.hidden = true;
    summary.hidden = true;
    done.hidden = true;
    steps.hidden = false;
    form.elements.nome.focus();
  });
})();
