// Garra: versão de teste com UMA garra (um jogador). 60 segundos, sorte 50/50.
// Edite só o bloco GARRA. Abra com ?ele para ver o conjunto de pelúcias dele.
const GARRA = {
  tempo: 60,          // segundos de jogo
  chance: 0.5,        // chance de a garra segurar a pelúcia até a saída (0.5 = 50/50)
  textos: {
    titulo: "Garra! 🧸",
    intro: "Você tem 60 segundos. Pegue o máximo de pelúcias que conseguir. A garra nem sempre segura!",
    botao: "Começar",
    fim: "Tempo! ⏰",
    fimBotao: "Jogar de novo",
    pegou: "Pegou! 🎉",
    escorregou: "Escorregou! 😮",
    nada: "Nada aqui 😅",
  },
  // Pelúcias de cada um. "forma": gato | rato | urso | capivara. "img" (opcional): caminho de uma imagem PNG.
  // "peso" = chance de aparecer, "pontos" = quanto vale.
  conjuntos: {
    ela: [
      { nome: "Gatinha de laço", forma: "gato", cor: "#fff", laco: "#ff5d8f", peso: 4, pontos: 1 },
      { nome: "Gatinha rosa", forma: "gato", cor: "#ffc2da", laco: "#fff", peso: 3, pontos: 1 },
      { nome: "Ursinho", forma: "urso", cor: "#ffe08a", peso: 3, pontos: 1 },
      { nome: "Capivara", forma: "capivara", cor: "#c79a6b", peso: 1, pontos: 3 },
    ],
    ele: [
      { nome: "Rato amarelo", forma: "rato", cor: "#ffd93d", peso: 4, pontos: 1 },
      { nome: "Rato azul", forma: "rato", cor: "#8fd0ff", peso: 3, pontos: 1 },
      { nome: "Ursinho", forma: "urso", cor: "#ffb88a", peso: 3, pontos: 1 },
      { nome: "Capivara", forma: "capivara", cor: "#c79a6b", peso: 1, pontos: 3 },
    ],
  },
};

(() => {
  const W = 300, H = 400;
  const CHAO = 330, TOPO_TRILHO = 30, REPOUSO_Y = 58, X_INICIO = 175, X_SAIDA = 38, R = 16;
  const $ = (id) => document.getElementById(id);
  const canvas = $("tela"), ctx = canvas.getContext("2d");
  const conjunto = GARRA.conjuntos[location.search.includes("ele") ? "ele" : "ela"];

  // imagens opcionais
  conjunto.forEach((p) => { if (p.img) { p.im = new Image(); p.im.src = p.img; } });

  // ---------- tamanho ----------
  function redimensionar() {
    const palco = $("palco").getBoundingClientRect();
    const esc = Math.min(palco.width / W, palco.height / H);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = W * esc + "px";
    canvas.style.height = H * esc + "px";
    canvas.width = Math.round(W * esc * dpr);
    canvas.height = Math.round(H * esc * dpr);
    ctx.setTransform((W * esc * dpr) / W, 0, 0, (H * esc * dpr) / H, 0, 0);
  }
  new ResizeObserver(redimensionar).observe($("palco"));

  // ---------- estado ----------
  let tempo = 0, jogando = false, restante = GARRA.tempo, pontos = 0;
  const slots = [];
  for (let i = 0; i < 6; i++) slots.push({ x: 84 + i * 36, y: CHAO - R - 1, linha: 0 });
  for (let i = 0; i < 5; i++) slots.push({ x: 102 + i * 36, y: CHAO - R - 28, linha: 1 });
  slots.forEach((s) => { s.estado = "vazio"; s.plush = null; s.livreEm = 0; });
  const quedas = [];
  const textos = [];
  const g = { x: X_INICIO, y: REPOUSO_Y, estado: "idle", abertura: 1, carga: null, t: 0, profund: 0, feito: 0, total: 1, soltaEm: 2, alvoX: null };
  const entrada = { esq: false, dir: false };

  function sortear() {
    const total = conjunto.reduce((a, p) => a + (p.peso || 1), 0);
    let r = Math.random() * total;
    for (const p of conjunto) { r -= p.peso || 1; if (r <= 0) return p; }
    return conjunto[0];
  }
  function popular() {
    slots.forEach((s) => { s.estado = "cheio"; s.plush = { p: sortear(), slot: s }; });
  }

  // ---------- regras ----------
  function maisAlta(x) {
    let melhor = null;
    for (const s of slots) {
      if (s.estado !== "cheio" || Math.abs(s.x - x) > 20) continue;
      if (!melhor || s.y < melhor.y || (s.y === melhor.y && Math.abs(s.x - x) < Math.abs(melhor.x - x))) melhor = s;
    }
    return melhor;
  }

  function pegar() {
    if (!jogando || g.estado !== "idle") return;
    const s = maisAlta(g.x);
    g.profund = s ? s.y - 20 : CHAO - 28;
    g.estado = "desce";
  }

  function texto(txt, x, y, cor) { textos.push({ txt, x, y, t: 0, cor: cor || "#d6336c" }); }

  function soltarCarga(sucesso) {
    const pl = g.carga; g.carga = null;
    g.abertura = 1;
    if (sucesso) {
      quedas.push({ pl, x: g.x, y: g.y + 22, vy: 0, tx: g.x, ty: CHAO + 50, destino: "saida" });
      return;
    }
    texto(GARRA.textos.escorregou, g.x, g.y + 10, "#e0457b");
    // a pelúcia cai no lugar livre mais perto
    let melhor = null;
    for (const s of slots) {
      if (s.estado === "vazio" || s === pl.slot) if (!melhor || Math.abs(s.x - g.x) < Math.abs(melhor.x - g.x)) melhor = s;
    }
    if (melhor !== pl.slot) { pl.slot.estado = "vazio"; pl.slot.livreEm = tempo + 0.9; }
    melhor.estado = "chegando"; pl.slot = melhor;
    quedas.push({ pl, x: g.x, y: g.y + 22, vy: 0, tx: melhor.x, ty: melhor.y, destino: "slot" });
  }

  // ---------- atualização ----------
  function atualizar(dt) {
    tempo += dt;
    if (jogando) {
      restante -= dt;
      if (restante <= 0) { restante = 0; terminar(); }
    }
    atualizarGarra(dt);
    for (const s of slots) {
      if (jogando && s.estado === "vazio" && tempo >= s.livreEm) {
        s.estado = "chegando";
        const pl = { p: sortear(), slot: s };
        quedas.push({ pl, x: s.x, y: 15, vy: 0, tx: s.x, ty: s.y, destino: "slot" });
      }
    }
    for (let i = quedas.length - 1; i >= 0; i--) {
      const q = quedas[i];
      q.vy += 900 * dt; q.y += q.vy * dt;
      q.x += (q.tx - q.x) * Math.min(1, dt * 12);
      if (q.y >= q.ty) {
        if (q.destino === "slot") { q.pl.slot.estado = "cheio"; q.pl.slot.plush = q.pl; }
        else {
          pontos += q.pl.p.pontos || 1;
          texto(GARRA.textos.pegou + ((q.pl.p.pontos || 1) > 1 ? " +" + q.pl.p.pontos : ""), X_SAIDA + 40, CHAO - 10, "#1fa463");
          q.pl.slot.estado = "vazio"; q.pl.slot.livreEm = tempo + 0.9;
        }
        quedas.splice(i, 1);
      }
    }
    for (let i = textos.length - 1; i >= 0; i--) { textos[i].t += dt; if (textos[i].t > 1.1) textos.splice(i, 1); }
    $("tempo").textContent = "⏱ " + Math.ceil(restante);
    $("tempo").classList.toggle("urgente", jogando && restante <= 10);
    $("pontos").textContent = "🧸 " + pontos;
  }

  function atualizarGarra(dt) {
    if (g.estado === "idle") {
      if (jogando) {
        const dir = (entrada.dir ? 1 : 0) - (entrada.esq ? 1 : 0);
        g.x += dir * 140 * dt;
        if (g.alvoX !== null) g.x += Math.max(-300 * dt, Math.min(300 * dt, g.alvoX - g.x));
        g.x = Math.max(30, Math.min(272, g.x));
      }
      g.abertura = Math.min(1, g.abertura + dt * 4);
    } else if (g.estado === "desce") {
      g.y += 170 * dt;
      if (g.y >= g.profund) { g.y = g.profund; g.estado = "fecha"; g.t = 0; }
    } else if (g.estado === "fecha") {
      g.t += dt;
      g.abertura = Math.max(0.1, 1 - g.t / 0.45);
      if (g.t >= 0.45) {
        const s = maisAlta(g.x);
        if (s) {
          const pl = s.plush;
          s.estado = "carga"; s.plush = null;
          g.carga = pl;
          g.soltaEm = Math.random() < GARRA.chance ? 2 : 0.15 + Math.random() * 0.8; // >1 = segura até o fim
        } else { texto(GARRA.textos.nada, g.x, g.y, "#8a6a7a"); }
        g.total = Math.max(1, (g.y - REPOUSO_Y) + Math.abs(g.x - X_SAIDA));
        g.feito = 0;
        g.estado = "sobe";
      }
    } else if (g.estado === "sobe") {
      const d = Math.min(170 * dt, g.y - REPOUSO_Y);
      g.y -= d; g.feito += d;
      checarQueda();
      if (g.y <= REPOUSO_Y) g.estado = g.carga ? "leva" : "volta";
    } else if (g.estado === "leva") {
      const d = Math.min(150 * dt, g.x - X_SAIDA);
      g.x -= d; g.feito += d;
      checarQueda();
      if (g.x <= X_SAIDA) { g.estado = g.carga ? "solta" : "volta"; g.t = 0; }
    } else if (g.estado === "solta") {
      g.t += dt;
      g.abertura = Math.min(1, g.t / 0.3);
      if (g.carga && g.t >= 0.15) soltarCarga(true);
      if (g.t >= 0.7) g.estado = "volta";
    } else if (g.estado === "volta") {
      g.abertura = Math.min(1, g.abertura + dt * 3);
      const d = Math.max(-170 * dt, Math.min(170 * dt, X_INICIO - g.x));
      g.x += d;
      if (Math.abs(g.x - X_INICIO) < 1) { g.x = X_INICIO; g.estado = "idle"; }
    }
  }
  function checarQueda() {
    if (g.carga && g.feito / g.total >= g.soltaEm) soltarCarga(false);
  }

  // ---------- desenho ----------
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function pelucia(x, y, r, p) {
    if (p.im && p.im.complete && p.im.naturalWidth) { ctx.drawImage(p.im, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4); return; }
    ctx.save(); ctx.translate(x, y);
    const orelha = (cx, cy, rr2, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(cx, cy, rr2, 0, 7); ctx.fill(); };
    if (p.forma === "gato") {
      ctx.fillStyle = p.cor;
      ctx.beginPath(); ctx.moveTo(-r * .9, -r * .2); ctx.lineTo(-r * .75, -r * 1.25); ctx.lineTo(-r * .1, -r * .8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * .9, -r * .2); ctx.lineTo(r * .75, -r * 1.25); ctx.lineTo(r * .1, -r * .8); ctx.fill();
    } else if (p.forma === "rato") {
      ctx.fillStyle = p.cor;
      ctx.beginPath(); ctx.ellipse(-r * .7, -r * 1.05, r * .25, r * .65, -.35, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * .7, -r * 1.05, r * .25, r * .65, .35, 0, 7); ctx.fill();
      ctx.fillStyle = "#3a2a2a";
      ctx.beginPath(); ctx.ellipse(-r * .8, -r * 1.55, r * .16, r * .22, -.35, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * .8, -r * 1.55, r * .16, r * .22, .35, 0, 7); ctx.fill();
    } else { orelha(-r * .75, -r * .75, r * .35, p.cor); orelha(r * .75, -r * .75, r * .35, p.cor); }
    ctx.fillStyle = p.cor; ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * .92, 0, 0, 7); ctx.fill(); ctx.stroke();
    if (p.forma === "capivara") {
      ctx.fillStyle = "#a87a4d"; ctx.beginPath(); ctx.ellipse(r * .2, r * .3, r * .5, r * .32, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#3a2a22"; ctx.beginPath(); ctx.ellipse(r * .35, r * .2, r * .12, r * .09, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(-r * .35, -r * .15, 1.8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(r * .35, -r * .15, 1.8, 0, 7); ctx.fill();
      ctx.fillStyle = "#ff6fa5"; ctx.beginPath(); ctx.arc(0, -r * .9, r * .22, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = "#3a2a2a";
      ctx.beginPath(); ctx.arc(-r * .35, -r * .05, 1.9, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(r * .35, -r * .05, 1.9, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,120,150,.55)";
      ctx.beginPath(); ctx.arc(-r * .62, r * .25, 2.6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(r * .62, r * .25, 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = "#f2a53b"; ctx.beginPath(); ctx.arc(0, r * .2, 1.7, 0, 7); ctx.fill();
    }
    if (p.laco) {
      ctx.fillStyle = p.laco;
      ctx.beginPath(); ctx.moveTo(r * .55, -r * .85); ctx.lineTo(r * 1.0, -r * 1.15); ctx.lineTo(r * 1.0, -r * .55); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * .55, -r * .85); ctx.lineTo(r * .1, -r * 1.15); ctx.lineTo(r * .1, -r * .55); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(r * .55, -r * .85, 2, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function garraDesenho() {
    const a = g.abertura * 0.6, curl = 4 + 7 * g.abertura;
    ctx.strokeStyle = "#b9b4c4"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.x, TOPO_TRILHO); ctx.lineTo(g.x, g.y); ctx.stroke();
    ctx.fillStyle = "#e9e4f2"; rr(g.x - 9, g.y - 2, 18, 10, 4); ctx.fill();
    ctx.strokeStyle = "#d2cbe0"; ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const lado of [-1, 1]) {
      const x0 = g.x + lado * 5, y0 = g.y + 6;
      const x1 = x0 + lado * 16 * Math.sin(a), y1 = y0 + 16 * Math.cos(a);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1 - lado * curl, y1 + 9); ctx.stroke();
    }
  }

  function maquina() {
    // corpo
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#ff9fc2"); gr.addColorStop(1, "#ffd96b");
    ctx.fillStyle = gr; rr(0, 0, W, H, 22); ctx.fill();
    // letreiro
    ctx.fillStyle = "#fff"; rr(70, 5, 160, 22, 11); ctx.fill();
    ctx.fillStyle = "#d6336c"; ctx.font = "700 14px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("GARRA 🧸", 150, 21);
    // vidro
    ctx.fillStyle = "#fff6fb"; rr(12, 34, 276, CHAO - 34, 10); ctx.fill();
    ctx.fillStyle = "#ffeaf3"; ctx.fillRect(12, CHAO - 8, 276, 8);
    // trilho
    ctx.fillStyle = "#cfc7dc"; rr(16, TOPO_TRILHO - 3, 268, 6, 3); ctx.fill();
    // buraco da saída
    ctx.fillStyle = "#b8306a"; ctx.fillRect(14, CHAO - 2, 56, 62);
    ctx.fillStyle = "#7a1f48"; ctx.fillRect(18, CHAO + 4, 48, 52);
    ctx.fillStyle = "#fff"; ctx.font = "700 11px Fredoka, sans-serif"; ctx.fillText("SAÍDA", 42, CHAO + 32);
    // painel de baixo
    ctx.fillStyle = "rgba(255,255,255,.55)"; rr(80, CHAO + 8, 190, 52, 12); ctx.fill();
    ctx.fillStyle = "#ff7aa8"; ctx.beginPath(); ctx.arc(120, CHAO + 34, 12, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffd96b"; ctx.beginPath(); ctx.arc(160, CHAO + 34, 12, 0, 7); ctx.fill();
    ctx.fillStyle = "#555"; rr(200, CHAO + 26, 52, 14, 5); ctx.fill();
  }

  function desenhar() {
    ctx.clearRect(0, 0, W, H);
    maquina();
    ctx.save(); rr(12, 34, 276, CHAO - 34, 10); ctx.clip();
    // pelúcias (linha de trás primeiro)
    for (const lin of [1, 0]) for (const s of slots) if (s.linha === lin && s.estado === "cheio" && s.plush) pelucia(s.x, s.y, R, s.plush.p);
    for (const q of quedas) pelucia(q.x, q.y, R, q.pl.p);
    ctx.restore();
    // o que cai na saída fica atrás do vidro: recorta embaixo
    garraDesenho();
    if (g.carga) pelucia(g.x, g.y + 24, R, g.carga.p);
    // reflexo do vidro
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath(); ctx.moveTo(30, 34); ctx.lineTo(70, 34); ctx.lineTo(40, CHAO); ctx.lineTo(14, CHAO); ctx.closePath(); ctx.fill();
    // textos flutuantes
    ctx.textAlign = "center"; ctx.font = "700 14px Fredoka, sans-serif";
    for (const t of textos) {
      ctx.globalAlpha = 1 - t.t / 1.1;
      ctx.fillStyle = "#fff"; ctx.strokeStyle = t.cor; ctx.lineWidth = 3;
      ctx.strokeText(t.txt, t.x, t.y - t.t * 30); ctx.fillText(t.txt, t.x, t.y - t.t * 30);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- controles ----------
  function xDoToque(e) {
    const r = canvas.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  }
  canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); g.alvoX = xDoToque(e); });
  canvas.addEventListener("pointermove", (e) => { if (g.alvoX !== null) g.alvoX = xDoToque(e); });
  const soltou = () => { g.alvoX = null; };
  canvas.addEventListener("pointerup", soltou);
  canvas.addEventListener("pointercancel", soltou);

  function botao(id, aoApertar, aoSoltar) {
    const b = $(id);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); b.classList.add("apertado"); aoApertar(); });
    const s = () => { b.classList.remove("apertado"); if (aoSoltar) aoSoltar(); };
    b.addEventListener("pointerup", s); b.addEventListener("pointerleave", s); b.addEventListener("pointercancel", s);
  }
  botao("btn-esq", () => { entrada.esq = true; }, () => { entrada.esq = false; });
  botao("btn-dir", () => { entrada.dir = true; }, () => { entrada.dir = false; });
  botao("btn-pegar", pegar);
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") entrada.esq = true;
    else if (e.key === "ArrowRight") entrada.dir = true;
    else if (e.key === " " || e.key === "ArrowDown") { e.preventDefault(); if (!e.repeat) pegar(); }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") entrada.esq = false;
    else if (e.key === "ArrowRight") entrada.dir = false;
  });

  // ---------- início e fim ----------
  function mostrar(emoji, titulo, texto, botaoTxt) {
    $("ov-emoji").textContent = emoji; $("ov-titulo").textContent = titulo;
    $("ov-texto").textContent = texto; $("btn-comecar").textContent = botaoTxt;
    $("overlay").classList.remove("escondido");
  }
  function comecar() {
    pontos = 0; restante = GARRA.tempo; quedas.length = 0; textos.length = 0;
    Object.assign(g, { x: X_INICIO, y: REPOUSO_Y, estado: "idle", abertura: 1, carga: null });
    popular();
    jogando = true;
    $("overlay").classList.add("escondido");
  }
  function terminar() {
    jogando = false;
    mostrar("🏆", GARRA.textos.fim, `Você pegou ${pontos} ${pontos === 1 ? "ponto" : "pontos"}!`, GARRA.textos.fimBotao);
  }
  $("btn-comecar").addEventListener("click", comecar);

  popular();
  mostrar("🧸", GARRA.textos.titulo, GARRA.textos.intro, GARRA.textos.botao);

  let ultimo = 0;
  function loop(agora) {
    const dt = Math.min((agora - ultimo) / 1000 || 0, 0.05);
    ultimo = agora;
    atualizar(dt);
    desenhar();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // para testes no console: Garra.estado()
  window.Garra = { estado: () => ({ pontos, restante, estado: g.estado }), g, slots };
})();
