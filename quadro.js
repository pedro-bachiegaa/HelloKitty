// Fase do quadro: pintar por números, seguindo a ordem das cores.
// Edite só o bloco QUADRO. Pra usar o quadro de vocês: troque "paleta" pelas cores reais (na ordem
// 1, 2, 3...) e "formas" pelo desenho (cada forma diz de qual cor ela é: n).
const QUADRO = {
  titulo: "Pinte o quadro 🎨",
  dica: "Siga a ordem das cores: comece pelo 1.",
  idAdesivo: "quadro",     // qual adesivo do quarto esta fase libera
  errosAteDica: 3,         // depois desses erros seguidos, as partes certas piscam
  textos: {
    agora: (c) => `Agora é a cor ${c.n} · ${c.nome}`,
    ordem: (c) => `Siga a ordem: agora é a cor ${c.n}.`,
    parteErrada: (n, c) => `Essa parte é da cor ${n}. Agora é a ${c.n}!`,
    corPronta: (c) => `Cor ${c.n} pronta! ✨`,
    dicaPiscando: "Olha as partes piscando 👀",
    fimTitulo: "Que quadro lindo! 🖼️",
    fimTexto: "Vocês pintaram juntas esse pedacinho de memória.",
    fimBotaoQuarto: "Pendurar no quarto",
    fimBotaoSolo: "Pintar de novo",
  },

  // as cores, na ordem em que precisam ser usadas (n = número)
  paleta: [
    { n: 1, nome: "Azul bebê", cor: "#a9d6f5" },
    { n: 2, nome: "Amarelo pastel", cor: "#ffe9a8" },
    { n: 3, nome: "Rosa", cor: "#ff9fc2" },
    { n: 4, nome: "Verde", cor: "#a8dcae" },
    { n: 5, nome: "Marrom", cor: "#c79a6b" },
    { n: 6, nome: "Branco", cor: "#ffffff" },
  ],

  // o desenho (tela de 300 x 360). A ordem é a de desenho (as últimas ficam por cima).
  // tag/a = forma SVG; n = cor; r = [x, y] onde fica o número.
  formas: [
    { n: 1, tag: "rect", a: { x: 0, y: 0, width: 300, height: 360 }, r: [40, 160] },        // céu
    { n: 2, tag: "circle", a: { cx: 236, cy: 56, r: 30 }, r: [236, 56] },                       // sol
    { n: 6, tag: "ellipse", a: { cx: 72, cy: 66, rx: 40, ry: 17 }, r: [72, 66] },               // nuvem
    { n: 6, tag: "ellipse", a: { cx: 160, cy: 112, rx: 34, ry: 14 }, r: [160, 112] },           // nuvem
    { n: 4, tag: "path", a: { d: "M0 245 Q90 190 170 240 T300 228 L300 360 L0 360 Z" }, r: [60, 300] }, // morro
    { n: 5, tag: "rect", a: { x: 138, y: 215, width: 20, height: 78 }, r: [148, 262] },         // tronco
    { n: 4, tag: "circle", a: { cx: 148, cy: 184, r: 46 }, r: [148, 184] },                     // copa
    { n: 3, tag: "circle", a: { cx: 48, cy: 322, r: 14 }, r: [48, 322] },                       // flores
    { n: 3, tag: "circle", a: { cx: 98, cy: 340, r: 14 }, r: [98, 340] },
    { n: 3, tag: "circle", a: { cx: 206, cy: 330, r: 14 }, r: [206, 330] },
    { n: 3, tag: "circle", a: { cx: 256, cy: 308, r: 14 }, r: [256, 308] },
  ],
};

(() => {
  const NS = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);
  const tela = $("tela");
  const modoQuarto = new URLSearchParams(location.search).has("quarto");

  $("titulo").textContent = QUADRO.titulo;
  const cor = (n) => QUADRO.paleta.find((c) => c.n === n);
  const ordem = QUADRO.paleta.map((c) => c.n).sort((a, b) => a - b);

  let atual = ordem[0];   // cor da vez
  let erros = 0;
  const formas = [];      // { d, el, num, pintada }
  const botoes = {};

  // ---------- desenha ----------
  for (const d of QUADRO.formas) {
    const el = document.createElementNS(NS, d.tag);
    for (const [k, v] of Object.entries(d.a)) el.setAttribute(k, v);
    el.setAttribute("class", "forma");
    tela.appendChild(el);
    const num = document.createElementNS(NS, "text");
    num.setAttribute("class", "num"); num.setAttribute("x", d.r[0]); num.setAttribute("y", d.r[1]);
    num.textContent = d.n;
    tela.appendChild(num);
    const f = { d, el, num, pintada: false };
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); tocar(f); });
    formas.push(f);
  }
  // os números ficam por cima de tudo (senão uma forma desenhada depois cobre o número)
  for (const f of formas) tela.appendChild(f.num);

  for (const c of QUADRO.paleta) {
    const b = document.createElement("button");
    b.className = "cor"; b.style.background = c.cor; b.textContent = c.n; b.setAttribute("aria-label", `${c.n} ${c.nome}`);
    b.addEventListener("click", () => escolher(c));
    $("paleta").appendChild(b);
    botoes[c.n] = b;
  }

  // ---------- jogo ----------
  let tToast;
  function toast(txt) {
    const t = $("toast"); t.textContent = txt; t.classList.remove("escondido");
    clearTimeout(tToast); tToast = setTimeout(() => t.classList.add("escondido"), 2200);
  }
  function balancar(el) { el.classList.remove("balanca"); void el.getBBox?.(); el.classList.add("balanca"); setTimeout(() => el.classList.remove("balanca"), 400); }

  function faltam(n) { return formas.filter((f) => f.d.n === n && !f.pintada); }

  function atualizarPaleta() {
    for (const c of QUADRO.paleta) {
      const b = botoes[c.n];
      b.classList.toggle("agora", c.n === atual);
      b.classList.toggle("feita", atual === null || c.n < atual);
      b.classList.toggle("espera", atual !== null && c.n > atual);
    }
    $("dica").textContent = atual === null ? "" : QUADRO.textos.agora(cor(atual));
  }

  function escolher(c) {
    if (atual === null) return;
    if (c.n === atual) { toast(QUADRO.textos.agora(c)); return; }
    if (c.n > atual) { toast(QUADRO.textos.ordem(cor(atual))); balancar(botoes[c.n]); }
  }

  function tocar(f) {
    if (atual === null || f.pintada) return;
    if (f.d.n === atual) {
      f.pintada = true; erros = 0;
      f.el.classList.add("pintada");
      f.el.style.fill = cor(f.d.n).cor;
      f.num.classList.add("sumiu");
      if (!faltam(atual).length) corPronta();
    } else {
      erros++;
      balancar(f.el);
      toast(QUADRO.textos.parteErrada(f.d.n, cor(atual)));
      if (erros >= QUADRO.errosAteDica) { erros = 0; dica(); }
    }
  }

  function dica() {
    for (const f of faltam(atual)) {
      f.el.classList.remove("dica"); void f.el.getBBox?.(); f.el.classList.add("dica");
      setTimeout(() => f.el.classList.remove("dica"), 3400);
    }
    toast(QUADRO.textos.dicaPiscando);
  }

  function corPronta() {
    const c = cor(atual);
    const i = ordem.indexOf(atual);
    atual = i + 1 < ordem.length ? ordem[i + 1] : null;
    atualizarPaleta();
    if (atual === null) { setTimeout(fim, 600); return; }
    toast(QUADRO.textos.corPronta(c));
  }

  function fim() {
    tela.classList.add("pronto");
    $("fim-titulo").textContent = QUADRO.textos.fimTitulo;
    $("fim-texto").textContent = QUADRO.textos.fimTexto;
    $("btn-fim").textContent = modoQuarto ? QUADRO.textos.fimBotaoQuarto : QUADRO.textos.fimBotaoSolo;
    setTimeout(() => $("fim").classList.remove("escondido"), 1200);
  }
  $("btn-fim").addEventListener("click", () => {
    if (modoQuarto) location.href = "index.html?concluiu=" + QUADRO.idAdesivo;
    else location.reload();
  });

  atualizarPaleta();
  // ganchos pra testar no console
  window.Quadro = { get atual() { return atual; }, formas, tocar, QUADRO };
})();
