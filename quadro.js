// Fase do quadro: pintar por números, seguindo a ordem das cores. Dois quadros seguidos
// (os que vocês pintaram no parque). Edite só o bloco QUADRO.
// Cada quadro tem: paleta (cores na ordem 1, 2, 3...) e formas (as regiões do desenho, em tela 300 x 300;
// cada forma diz de qual cor ela é: n; r = onde fica o número; fs = tamanho do número, opcional).

// ajudante: pontos de uma flor de lótus (estrela de pétalas) pra usar em "polygon"
function flor(cx, cy, R, giro = 0, petalas = 7) {
  const pts = [];
  for (let i = 0; i < petalas * 2; i++) {
    const ang = (Math.PI * i) / petalas + (giro * Math.PI) / 180;
    const rr = i % 2 === 0 ? R : R * 0.48;
    pts.push((cx + Math.cos(ang) * rr).toFixed(1) + "," + (cy + Math.sin(ang) * rr).toFixed(1));
  }
  return pts.join(" ");
}

const QUADRO = {
  idAdesivo: "quadro",     // qual adesivo do quarto esta fase libera
  errosAteDica: 3,         // depois desses erros seguidos, as partes certas piscam
  textos: {
    agora: (c) => `Agora é a cor ${c.n} · ${c.nome}`,
    ordem: (c) => `Siga a ordem: agora é a cor ${c.n}.`,
    parteErrada: (n, c) => `Essa parte é da cor ${n}. Agora é a ${c.n}!`,
    corPronta: (c) => `Cor ${c.n} pronta! ✨`,
    dicaPiscando: "Olha as partes piscando 👀",
    meioTitulo: "Primeiro quadro pronto! 🎉",
    meioTexto: "Agora o próximo que vocês pintaram.",
    meioBotao: "Próximo quadro",
    fimTitulo: "Que quadros lindos! 🖼️",
    fimTexto: "Vocês pintaram juntas esses pedacinhos de memória.",
    fimBotaoQuarto: "Pendurar no quarto",
    fimBotaoSolo: "Pintar de novo",
  },

  quadros: [
    {
      nome: "As carpas 🐟",
      paleta: [
        { n: 1, nome: "Azul petróleo", cor: "#1f6f7d" },
        { n: 2, nome: "Verde", cor: "#5ccb3f" },
        { n: 3, nome: "Amarelo dourado", cor: "#f7c948" },
        { n: 4, nome: "Rosa", cor: "#f0527f" },
        { n: 5, nome: "Laranja", cor: "#f28a1e" },
        { n: 6, nome: "Branco", cor: "#ffffff" },
        { n: 7, nome: "Preto", cor: "#2a2a2a" },
      ],
      formas: [
        { n: 1, tag: "rect", a: { x: 0, y: 0, width: 300, height: 300 }, r: [150, 120] },                                  // água
        // ondinhas brancas
        { n: 6, tag: "ellipse", a: { cx: 62, cy: 140, rx: 24, ry: 6, transform: "rotate(-55 62 140)" }, r: [62, 140], fs: 10 },
        { n: 6, tag: "ellipse", a: { cx: 236, cy: 140, rx: 24, ry: 6, transform: "rotate(50 236 140)" }, r: [236, 140], fs: 10 },
        { n: 6, tag: "ellipse", a: { cx: 55, cy: 220, rx: 22, ry: 6, transform: "rotate(25 55 220)" }, r: [55, 220], fs: 10 },
        { n: 6, tag: "ellipse", a: { cx: 252, cy: 190, rx: 20, ry: 6, transform: "rotate(-30 252 190)" }, r: [252, 190], fs: 10 },
        { n: 6, tag: "ellipse", a: { cx: 148, cy: 28, rx: 26, ry: 6, transform: "rotate(15 148 28)" }, r: [148, 28], fs: 10 },
        // folhas de vitória-régia
        { n: 2, tag: "path", a: { d: "M0 0 L108 0 Q92 38 58 72 Q30 98 0 112 Z" }, r: [32, 38] },
        { n: 2, tag: "path", a: { d: "M300 212 L226 252 Q212 272 206 300 L300 300 Z" }, r: [262, 270] },
        { n: 2, tag: "ellipse", a: { cx: 92, cy: 288, rx: 27, ry: 14 }, r: [100, 290], fs: 11 },
        // carpa 1 (grande, de cima pra baixo)
        { n: 3, tag: "path", a: { d: "M95 236 Q80 200 90 160 Q105 105 150 75 Q172 55 194 70 Q180 85 175 95 Q150 120 140 160 Q135 200 138 232 Q118 256 95 236 Z" }, r: [112, 205] },
        { n: 3, tag: "path", a: { d: "M176 94 Q168 62 192 46 Q210 36 226 40 Q216 56 212 66 Q214 80 200 88 Q190 96 176 94 Z" }, r: [200, 62], fs: 11 }, // cauda 1
        { n: 6, tag: "ellipse", a: { cx: 80, cy: 226, rx: 13, ry: 7, transform: "rotate(-40 80 226)" }, r: [80, 226], fs: 8 },    // nadadeira
        { n: 6, tag: "ellipse", a: { cx: 148, cy: 222, rx: 13, ry: 7, transform: "rotate(50 148 222)" }, r: [148, 222], fs: 8 },
        { n: 7, tag: "circle", a: { cx: 108, cy: 240, r: 6 }, r: [108, 240], fs: 9 },
        { n: 7, tag: "circle", a: { cx: 125, cy: 236, r: 6 }, r: [125, 236], fs: 9 },
        // carpa 2 (vai pra direita)
        { n: 3, tag: "path", a: { d: "M148 172 Q158 155 178 165 Q205 185 235 215 Q258 205 276 198 Q284 216 268 236 Q252 246 228 236 Q190 226 160 196 Q145 186 148 172 Z" }, r: [200, 205] },
        { n: 3, tag: "path", a: { d: "M258 206 Q282 184 294 194 Q298 212 290 226 Q280 240 262 234 Q254 220 258 206 Z" }, r: [278, 214], fs: 11 }, // cauda 2
        { n: 6, tag: "ellipse", a: { cx: 190, cy: 160, rx: 13, ry: 7, transform: "rotate(-30 190 160)" }, r: [190, 160], fs: 8 },
        { n: 7, tag: "circle", a: { cx: 161, cy: 172, r: 5 }, r: [161, 172], fs: 8 },
        { n: 7, tag: "circle", a: { cx: 173, cy: 169, r: 5 }, r: [173, 169], fs: 8 },
        // flores de lótus
        { n: 4, tag: "polygon", a: { points: flor(250, 78, 38, 10) }, r: [250, 78] },
        { n: 4, tag: "polygon", a: { points: flor(66, 258, 36, 0) }, r: [66, 258] },
        { n: 4, tag: "polygon", a: { points: flor(288, 18, 24, 20) }, r: [284, 22], fs: 10 },
        { n: 5, tag: "circle", a: { cx: 250, cy: 78, r: 8 }, r: [250, 78], fs: 10 },
        { n: 5, tag: "circle", a: { cx: 66, cy: 258, r: 8 }, r: [66, 258], fs: 10 },
      ],
    },
    {
      nome: "A casa voadora 🎈",
      paleta: [
        { n: 1, nome: "Azul escuro", cor: "#1f5fc4" },
        { n: 2, nome: "Azul bebê", cor: "#9fd2f4" },
        { n: 3, nome: "Branco", cor: "#ffffff" },
        { n: 4, nome: "Verde-acinzentado", cor: "#7a9a90" },
        { n: 5, nome: "Preto", cor: "#2a2a2a" },
        { n: 6, nome: "Vermelho", cor: "#ee3b3b" },
        { n: 7, nome: "Amarelo", cor: "#ffd23a" },
        { n: 8, nome: "Verde", cor: "#3cb44b" },
      ],
      formas: [
        { n: 1, tag: "rect", a: { x: 0, y: 0, width: 300, height: 300 }, r: [60, 80] },                                        // céu
        { n: 2, tag: "path", a: { d: "M0 180 Q50 172 95 198 Q150 242 215 198 Q265 168 300 182 L300 300 L0 300 Z" }, r: [40, 200] }, // nuvem azulada
        { n: 3, tag: "path", a: { d: "M0 208 Q40 196 85 218 Q150 258 215 218 Q265 192 300 206 L300 300 L0 300 Z" }, r: [150, 270] }, // nuvem branca
        { n: 4, tag: "rect", a: { x: 189, y: 172, width: 34, height: 30 }, r: [206, 190] },                                  // casa
        { n: 5, tag: "path", a: { d: "M184 173 L206 158 L228 173 Z" }, r: [206, 169], fs: 9 },                                 // telhado
        // balões
        { n: 7, tag: "circle", a: { cx: 268, cy: 38, r: 14 }, r: [268, 38] },
        { n: 6, tag: "circle", a: { cx: 243, cy: 50, r: 14 }, r: [243, 50] },
        { n: 8, tag: "circle", a: { cx: 272, cy: 64, r: 14 }, r: [272, 64] },
        { n: 8, tag: "circle", a: { cx: 221, cy: 70, r: 14 }, r: [221, 70] },
        { n: 7, tag: "circle", a: { cx: 250, cy: 84, r: 14 }, r: [250, 84] },
        { n: 6, tag: "circle", a: { cx: 279, cy: 92, r: 14 }, r: [279, 92] },
        { n: 6, tag: "circle", a: { cx: 227, cy: 102, r: 14 }, r: [227, 102] },
        { n: 8, tag: "circle", a: { cx: 257, cy: 112, r: 14 }, r: [257, 112] },
        { n: 7, tag: "circle", a: { cx: 236, cy: 134, r: 14 }, r: [236, 134] },
      ],
    },
  ],
};

(() => {
  const NS = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);
  const tela = $("tela");
  const modoQuarto = new URLSearchParams(location.search).has("quarto");
  if (modoQuarto) $("btn-sair").classList.remove("escondido"); // sair da fase e voltar ao quarto

  let iq = 0;            // quadro atual
  let quadro, ordem;     // dados do quadro atual
  let atual = null;      // cor da vez
  let erros = 0;
  let formas = [];       // { d, el, num, pintada }
  let botoes = {};

  const cor = (n) => quadro.paleta.find((c) => c.n === n);

  // ---------- monta um quadro ----------
  function carregar(i) {
    iq = i; quadro = QUADRO.quadros[i];
    ordem = quadro.paleta.map((c) => c.n).sort((a, b) => a - b);
    atual = ordem[0]; erros = 0; formas = []; botoes = {};
    tela.replaceChildren(); $("paleta").replaceChildren();
    tela.classList.remove("pronto");
    $("titulo").textContent = `${quadro.nome} · ${i + 1}/${QUADRO.quadros.length}`;

    for (const d of quadro.formas) {
      const el = document.createElementNS(NS, d.tag);
      for (const [k, v] of Object.entries(d.a)) el.setAttribute(k, v);
      el.setAttribute("class", "forma");
      tela.appendChild(el);
      const f = { d, el, num: null, pintada: false };
      el.addEventListener("pointerdown", (e) => { e.preventDefault(); tocar(f); });
      formas.push(f);
    }
    // os números ficam por cima de tudo (senão uma forma desenhada depois cobre o número)
    for (const f of formas) {
      const num = document.createElementNS(NS, "text");
      num.setAttribute("class", "num"); num.setAttribute("x", f.d.r[0]); num.setAttribute("y", f.d.r[1]);
      if (f.d.fs) num.style.fontSize = f.d.fs + "px";
      num.textContent = f.d.n;
      tela.appendChild(num); f.num = num;
    }
    for (const c of quadro.paleta) {
      const b = document.createElement("button");
      b.className = "cor"; b.style.background = c.cor; b.textContent = c.n; b.setAttribute("aria-label", `${c.n} ${c.nome}`);
      b.addEventListener("click", () => escolher(c));
      $("paleta").appendChild(b);
      botoes[c.n] = b;
    }
    atualizarPaleta();
  }

  // ---------- jogo ----------
  let tToast;
  function toast(txt) {
    const t = $("toast"); t.textContent = txt; t.classList.remove("escondido");
    clearTimeout(tToast); tToast = setTimeout(() => t.classList.add("escondido"), 2200);
  }
  function balancar(el) { el.classList.remove("balanca"); void el.getBoundingClientRect(); el.classList.add("balanca"); setTimeout(() => el.classList.remove("balanca"), 400); }

  const faltam = (n) => formas.filter((f) => f.d.n === n && !f.pintada);

  function atualizarPaleta() {
    for (const c of quadro.paleta) {
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
      f.el.classList.remove("dica"); void f.el.getBoundingClientRect(); f.el.classList.add("dica");
      setTimeout(() => f.el.classList.remove("dica"), 3400);
    }
    toast(QUADRO.textos.dicaPiscando);
  }

  function corPronta() {
    const c = cor(atual);
    const i = ordem.indexOf(atual);
    atual = i + 1 < ordem.length ? ordem[i + 1] : null;
    atualizarPaleta();
    if (atual === null) { setTimeout(quadroPronto, 600); return; }
    toast(QUADRO.textos.corPronta(c));
  }

  let aoClicarFim = null;
  function quadroPronto() {
    tela.classList.add("pronto");
    const T = QUADRO.textos;
    const ultimo = iq === QUADRO.quadros.length - 1;
    $("fim-titulo").textContent = ultimo ? T.fimTitulo : T.meioTitulo;
    $("fim-texto").textContent = ultimo ? T.fimTexto : T.meioTexto;
    $("btn-fim").textContent = ultimo ? (modoQuarto ? T.fimBotaoQuarto : T.fimBotaoSolo) : T.meioBotao;
    aoClicarFim = ultimo
      ? () => { if (modoQuarto) location.href = "index.html?concluiu=" + QUADRO.idAdesivo; else { $("fim").classList.add("escondido"); carregar(0); } }
      : () => { $("fim").classList.add("escondido"); carregar(iq + 1); };
    setTimeout(() => $("fim").classList.remove("escondido"), 1200);
  }
  $("btn-fim").addEventListener("click", () => aoClicarFim && aoClicarFim());

  carregar(0);
  // ganchos pra testar no console
  window.Quadro = { get atual() { return atual; }, get formas() { return formas; }, get indice() { return iq; }, tocar, carregar, QUADRO };
})();
