// Garra: versão de teste com UMA garra (um jogador). 60 segundos.
// Edite só o bloco GARRA. A pilha é fixa: o que você pega NÃO volta a aparecer.
const GARRA = {
  tempo: 60,             // segundos de jogo
  metaQuarto: 4,         // no modo ?quarto: pontos pra vencer a fase (teste, sem adversário)
  idAdesivo: "capivara", // qual adesivo do quarto esta fase libera
  textos: {
    titulo: "Garra! 🧸",
    intro: "Você tem 60 segundos. Pegue o máximo que conseguir. Os bichinhos não voltam e a garra nem sempre segura!",
    introQuarto: "Faça pelo menos 4 pontos em 60 segundos pra vencer. Os bichinhos não voltam e a garra nem sempre segura!",
    botao: "Começar",
    fim: "Tempo! ⏰",
    fimBotao: "Jogar de novo",
    venceu: "Você venceu! 🏆",
    quase: "Quase! 😅",
    voltarQuarto: "Voltar ao quarto",
    pegou: "Pegou! 🎉",
    escorregou: "Escorregou! 😮",
    quaseSaida: "Tão perto! 😭",
    nada: "Errou! 😅",
    vazio: "Acabaram os bichinhos! 🎉",
  },
  // Os bichinhos da máquina. "qtd" = quantos tem na pilha (não repõe).
  // "chance" = chance de a garra segurar até a saída (os grandes/escorregadios seguram menos).
  // "rx"/"ry" = tamanho (largura/altura); cada um sai um pouco diferente. "forma" escolhe o desenho.
  tipos: [
    { id: "capivara", nome: "Capivara", forma: "capivara", cor: "#c79a6b", rx: 23, ry: 14, pontos: 3, chance: 0.25, qtd: 3 },
    { id: "stitch", nome: "Stitch", forma: "stitch", cor: "#5fa8e8", rx: 17, ry: 17, pontos: 2, chance: 0.35, qtd: 4 },
    { id: "pikachu", nome: "Pikachu", forma: "pikachu", cor: "#ffd93d", rx: 14, ry: 19, pontos: 1, chance: 0.5, qtd: 3 },
    { id: "jigglypuff", nome: "Jigglypuff", forma: "jigglypuff", cor: "#ffb3cf", rx: 19, ry: 17, pontos: 1, chance: 0.5, qtd: 2 },
  ],
};

(() => {
  const W = 300, H = 440;
  const CHAO = 330, PISO = 320, TOPO_TRILHO = 52, REPOUSO_Y = 78, X_INICIO = 175, X_SAIDA = 38;
  const GX = 14, GY = 42, GW = 272, GH = CHAO - 42; // a janela de vidro da máquina
  const X_MIN = 78, X_MAX = 284; // por onde as pelúcias ficam (o buraco da saída fica à esquerda)
  const $ = (id) => document.getElementById(id);
  const canvas = $("tela"), ctx = canvas.getContext("2d");

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
  let pilha = [];            // pelúcias paradas na máquina
  const quedas = [];         // caindo na saída
  const textos = [];
  const g = { x: X_INICIO, y: REPOUSO_Y, estado: "idle", abertura: 1, carga: null, t: 0, profund: 0, feito: 0, total: 1, soltaEm: 2, alvoX: null };
  const entrada = { esq: false, dir: false };
  const aleat = (a, b) => a + Math.random() * (b - a);
  const registro = []; // resultado de cada tentativa (só pra conferir a aleatoriedade nos testes)

  // ---------- a pilha ----------
  // altura (centro) em que uma pelúcia de tamanho rx/ry repousa em x, apoiada nas que já estão lá
  function alturaRepouso(x, rx, ry, base) {
    let y = PISO - ry;
    for (const q of base) {
      const dx = Math.abs(x - q.x), alcance = q.rx + rx * 0.5;
      if (dx >= alcance) continue;
      const u = Math.min(1, Math.max(0, dx - rx * 0.5) / q.rx);
      const topo = q.y - q.ry * Math.sqrt(1 - u * u);
      y = Math.min(y, topo - ry * 0.75);
    }
    return y;
  }

  function criarPilha() {
    const todos = [];
    for (const t of GARRA.tipos) for (let i = 0; i < t.qtd; i++) todos.push(t);
    todos.sort(() => Math.random() - 0.5);
    const lista = [];
    for (const t of todos) {
      const e = aleat(0.88, 1.12);
      const p = { t, rx: t.rx * e, ry: t.ry * (e + aleat(-0.06, 0.06)), flip: Math.random() < 0.5 ? -1 : 1, vy: 0 };
      // uns em pé, outros meio deitados ou de lado
      p.rot = Math.random() < 0.3 ? aleat(-1.1, 1.1) : aleat(-0.35, 0.35);
      // escolhe o lugar mais baixo entre alguns sorteados, pra pilha não virar uma torre
      let melhorX = 0, melhorY = -1;
      for (let k = 0; k < 7; k++) {
        const x = aleat(X_MIN + p.rx, X_MAX - p.rx), y = alturaRepouso(x, p.rx, p.ry, lista);
        if (y > melhorY || Math.random() < 0.15) { melhorX = x; melhorY = y; }
      }
      p.x = melhorX;
      p.y = melhorY;
      p.ty = p.y;
      lista.push(p);
    }
    return lista;
  }

  // depois que alguma sai, as que estavam em cima descem pra ocupar o espaço
  function assentar() {
    const base = [];
    for (const p of [...pilha].sort((a, b) => b.y - a.y)) {
      p.ty = alturaRepouso(p.x, p.rx, p.ry, base);
      base.push({ x: p.x, rx: p.rx, y: p.ty, ry: p.ry });
    }
  }

  // ---------- regras ----------
  // a mais alta que a garra consegue tocar nesta posição
  function alvoDaGarra(x) {
    let melhor = null;
    for (const p of pilha) {
      const dx = Math.abs(p.x - x);
      if (dx > p.rx + 10) continue;
      const topo = p.y - p.ry;
      if (!melhor || topo < melhor.topo || (topo === melhor.topo && dx < melhor.dx)) melhor = { p, topo, dx };
    }
    return melhor;
  }

  function pegar() {
    if (!jogando || g.estado !== "idle") return;
    const a = alvoDaGarra(g.x);
    g.profund = a ? Math.min(CHAO - 28, a.topo - 28 + a.p.ry * 0.6) : CHAO - 28;
    g.estado = "desce";
  }

  function texto(txt, x, y, cor) { textos.push({ txt, x, y, t: 0, cor: cor || "#d6336c" }); }

  function soltarCarga(sucesso) {
    const p = g.carga; g.carga = null;
    g.abertura = 1;
    if (sucesso) {
      quedas.push({ p, x: g.x, y: g.y + 22, vy: 0 });
      return;
    }
    registro.push("escorregou");
    texto(g.falha === "quase" ? GARRA.textos.quaseSaida : GARRA.textos.escorregou, g.x, g.y + 10, "#e0457b");
    // cai de volta na pilha, onde ela estava passando
    p.x = Math.max(X_MIN + p.rx, Math.min(X_MAX - p.rx, g.x));
    p.y = g.y + 22; p.vy = 0;
    pilha.push(p);
    assentar();
  }

  // ---------- atualização ----------
  function atualizar(dt) {
    tempo += dt;
    if (jogando) {
      restante -= dt;
      if (restante <= 0) { restante = 0; terminar(); }
      else if (!pilha.length && !g.carga && !quedas.length) terminar();
    }
    atualizarGarra(dt);
    for (const p of pilha) {
      if (p.y < p.ty) { p.vy += 900 * dt; p.y = Math.min(p.ty, p.y + p.vy * dt); if (p.y >= p.ty) p.vy = 0; }
    }
    for (let i = quedas.length - 1; i >= 0; i--) {
      const q = quedas[i];
      q.vy += 900 * dt; q.y += q.vy * dt;
      if (q.y >= CHAO + 40) {
        registro.push("pegou");
        pontos += q.p.t.pontos;
        texto(GARRA.textos.pegou + (q.p.t.pontos > 1 ? " +" + q.p.t.pontos : ""), X_SAIDA + 40, CHAO - 10, "#1fa463");
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
        const a = alvoDaGarra(g.x);
        // precisa estar bem em cima da pelúcia pra agarrar
        if (a && a.dx <= a.p.rx * 0.6 + 6) {
          pilha.splice(pilha.indexOf(a.p), 1);
          g.carga = a.p;
          // a chance muda a cada tentativa: depende do tipo, da mira (centralizado segura mais) e de um pouco de sorte
          const limite = a.p.rx * 0.6 + 6;
          const mira = 0.55 + 0.45 * (1 - a.dx / limite);
          const chance = Math.max(0.05, Math.min(0.9, a.p.t.chance * 1.1 * mira * aleat(0.6, 1.4)));
          if (Math.random() < chance) g.soltaEm = 2; // >1 = segura até o fim
          else {
            // e a falha também varia: escorrega logo ao levantar, no meio do caminho ou quase na saída
            const r = Math.random();
            if (r < 0.25) { g.soltaEm = aleat(0.02, 0.15); g.falha = "levanta"; }
            else if (r < 0.75) { g.soltaEm = aleat(0.2, 0.85); g.falha = "caminho"; }
            else { g.soltaEm = aleat(0.9, 0.98); g.falha = "quase"; }
          }
          assentar();
        } else { registro.push("errou"); texto(GARRA.textos.nada, g.x, g.y, "#8a6a7a"); }
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
  const el = (x, y, rx, ry, cor, rot = 0) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 7); ctx.fill(); };

  function pelucia(p, x = p.x, y = p.y) {
    const { rx, ry } = p, f = p.t.forma, cor = p.t.cor;
    ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot || 0); ctx.scale(p.flip || 1, 1);
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,.14)";
    if (f === "capivara") {
      el(-rx * .55, ry * .85, rx * .16, ry * .22, "#9a6f46"); el(rx * .2, ry * .88, rx * .16, ry * .22, "#9a6f46");
      el(0, 0, rx, ry, cor); ctx.stroke();
      el(rx * .75, ry * .35, rx * .38, ry * .5, "#a87a4d");                       // focinho
      el(rx * .95, ry * .2, rx * .1, ry * .12, "#3a2a22");                          // nariz
      el(rx * .45, -ry * .75, rx * .12, ry * .2, "#9a6f46");                        // orelha
      el(rx * .6, -ry * .2, rx * .06, ry * .1, "#3a2a22");                          // olho
      ctx.fillStyle = "#ff6fa5"; ctx.beginPath(); ctx.arc(-rx * .25, -ry * .35, ry * .22, 0, 7); ctx.fill(); // coraçãozinho
    } else if (f === "stitch") {
      el(-rx * .95, -ry * .55, rx * .32, ry * .85, cor, -.75); el(-rx * .95, -ry * .55, rx * .17, ry * .6, "#ff9fc2", -.75);
      el(rx * .95, -ry * .55, rx * .32, ry * .85, cor, .75); el(rx * .95, -ry * .55, rx * .17, ry * .6, "#ff9fc2", .75);
      el(0, 0, rx, ry, cor); ctx.stroke();
      el(0, ry * .35, rx * .6, ry * .5, "#a9d3f5");                                 // barriga clara
      el(-rx * .38, -ry * .2, rx * .2, ry * .26, "#1b2540"); el(rx * .38, -ry * .2, rx * .2, ry * .26, "#1b2540"); // olhões
      el(0, ry * .05, rx * .13, ry * .1, "#1b2540");                                // nariz
    } else if (f === "pikachu") {
      el(-rx * .55, -ry * 1.0, rx * .22, ry * .5, cor, -.25); el(-rx * .62, -ry * 1.35, rx * .2, ry * .2, "#2a2a2a", -.25);
      el(rx * .55, -ry * 1.0, rx * .22, ry * .5, cor, .25); el(rx * .62, -ry * 1.35, rx * .2, ry * .2, "#2a2a2a", .25);
      ctx.strokeStyle = "#b9822d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-rx * .9, ry * .3); ctx.lineTo(-rx * 1.35, ry * .1); ctx.lineTo(-rx * 1.1, -ry * .2); ctx.lineTo(-rx * 1.6, -ry * .4); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,.14)";
      el(0, 0, rx, ry, cor); ctx.stroke();
      el(-rx * .62, ry * .25, rx * .2, ry * .15, "#ff5a5a"); el(rx * .62, ry * .25, rx * .2, ry * .15, "#ff5a5a");
      el(-rx * .35, -ry * .1, rx * .1, ry * .1, "#2a2a2a"); el(rx * .35, -ry * .1, rx * .1, ry * .1, "#2a2a2a");
    } else if (f === "jigglypuff") {
      el(-rx * .6, -ry * .85, rx * .25, ry * .3, cor, -.4); el(rx * .6, -ry * .85, rx * .25, ry * .3, cor, .4);
      el(0, 0, rx, ry, cor); ctx.stroke();
      ctx.strokeStyle = "#ff8fb8"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -ry * .78, rx * .22, Math.PI * 0.2, Math.PI * 1.9); ctx.stroke();
      ctx.lineWidth = 1;
      el(-rx * .38, -ry * .05, rx * .24, ry * .3, "#fff"); el(rx * .38, -ry * .05, rx * .24, ry * .3, "#fff");
      el(-rx * .38, ry * .0, rx * .16, ry * .22, "#2fb7a3"); el(rx * .38, ry * .0, rx * .16, ry * .22, "#2fb7a3");
    }
    ctx.restore();
  }

  // a garra de metal: carrinho no trilho, cabo de mola e três dedos
  function garraDesenho() {
    const a = g.abertura * 0.6, curl = 4 + 7 * g.abertura;
    // carrinho no trilho
    ctx.fillStyle = "#8a89a0"; rr(g.x - 13, TOPO_TRILHO - 7, 26, 14, 3); ctx.fill();
    ctx.fillStyle = "#5d5c73"; ctx.fillRect(g.x - 13, TOPO_TRILHO + 2, 26, 5);
    ctx.fillStyle = "#ff4d4d"; ctx.beginPath(); ctx.arc(g.x + 8, TOPO_TRILHO - 2, 2, 0, 7); ctx.fill();
    // cabo em mola
    ctx.strokeStyle = "#d5d8e0"; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(g.x, TOPO_TRILHO + 7);
    for (let y = TOPO_TRILHO + 11, k = 0; y < g.y; y += 4, k++) ctx.lineTo(g.x + (k % 2 ? 2.6 : -2.6), y);
    ctx.lineTo(g.x, g.y); ctx.stroke();
    // cubo de metal
    const cg = ctx.createLinearGradient(g.x - 9, 0, g.x + 9, 0);
    cg.addColorStop(0, "#9fa4b0"); cg.addColorStop(0.5, "#f2f4f8"); cg.addColorStop(1, "#8d92a0");
    ctx.fillStyle = cg; rr(g.x - 9, g.y - 3, 18, 12, 3); ctx.fill();
    // três dedos: um de trás (menor) e dois na frente
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const dedo = (lado, esc, cor) => {
      const x0 = g.x + lado * 5 * esc, y0 = g.y + 7;
      const x1 = x0 + lado * 16 * esc * Math.sin(a), y1 = y0 + 16 * Math.cos(a);
      const x2 = x1 - lado * curl * esc, y2 = y1 + 9;
      ctx.strokeStyle = "#6f7484"; ctx.lineWidth = 5.4 * esc;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = cor; ctx.lineWidth = 3.4 * esc;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    dedo(1, 0.7, "#aeb3c0");
    dedo(-1, 1, "#e6e9ef"); dedo(1, 1, "#e6e9ef");
  }

  // luz neon: desenha com brilho
  function neon(cor, blur, fn) { ctx.save(); ctx.shadowColor = cor; ctx.shadowBlur = blur; fn(); ctx.restore(); }

  // gabinete preto com neon rosa e amarelo, como as máquinas de verdade
  function maquina() {
    const pulso = 0.75 + 0.25 * Math.sin(tempo * 2.2);
    ctx.fillStyle = "#15131d"; rr(0, 0, W, H, 20); ctx.fill();
    neon("#ff5da2", 12 * pulso, () => { ctx.strokeStyle = "#ff86bb"; ctx.lineWidth = 2.4; rr(5, 5, W - 10, H - 10, 16); ctx.stroke(); });
    neon("#ffd93d", 8 * pulso, () => { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 1.4; rr(9, 9, W - 18, H - 18, 13); ctx.stroke(); });

    // letreiro
    ctx.fillStyle = "#0b0a11"; rr(16, 14, 268, 24, 7); ctx.fill();
    ctx.textAlign = "center";
    neon("#ff5da2", 10, () => { ctx.fillStyle = "#fff"; ctx.font = "800 17px Fredoka, sans-serif"; ctx.fillText("GARRA PREMIUM", 150, 32); });

    // vidro: por dentro é escuro, com uma luz no teto
    const fundo = ctx.createLinearGradient(0, GY, 0, CHAO);
    fundo.addColorStop(0, "#34334a"); fundo.addColorStop(1, "#1b1a27");
    ctx.fillStyle = fundo; rr(GX, GY, GW, GH, 8); ctx.fill();
    neon("#fff", 10, () => { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(GX + 10, GY + 3, GW - 20, 3); });
    // trilho do carrinho
    ctx.fillStyle = "#4a4960"; rr(GX + 4, TOPO_TRILHO - 3, GW - 8, 6, 3); ctx.fill();
    // piso de metal e a boca da saída
    ctx.fillStyle = "#3d3c4c"; ctx.fillRect(GX, CHAO - 10, GW, 10);
    ctx.fillStyle = "#07060b"; ctx.fillRect(GX, CHAO - 10, 58, 10);
    neon("#ff5da2", 8, () => { ctx.strokeStyle = "#ff86bb"; ctx.lineWidth = 1.5; ctx.strokeRect(GX + 1, CHAO - 10, 56, 10); });
    ctx.fillStyle = "#ff9ac6"; ctx.font = "700 9px Fredoka, sans-serif"; ctx.fillText("SAÍDA", X_SAIDA, CHAO - 15);
    // moldura do vidro
    ctx.strokeStyle = "#4b4a60"; ctx.lineWidth = 2; rr(GX, GY, GW, GH, 8); ctx.stroke();

    // faixa de instruções embaixo do vidro
    ctx.fillStyle = "#d3d3dc"; ctx.fillRect(GX, CHAO, GW, 18);
    ctx.fillStyle = "#3a6df0"; ctx.fillRect(GX + 8, CHAO + 4, 34, 10);
    ctx.fillStyle = "#ffd93d"; ctx.fillRect(GX + 130, CHAO + 4, 60, 10);
    ctx.fillStyle = "#e84a5f"; ctx.fillRect(GX + 196, CHAO + 4, 40, 10);

    // painel de controle
    ctx.fillStyle = "#0d0c13"; rr(86, CHAO + 26, 188, 60, 12); ctx.fill();
    neon("#ff5da2", 8, () => { ctx.strokeStyle = "#ff86bb"; ctx.lineWidth = 1.6; rr(86, CHAO + 26, 188, 60, 12); ctx.stroke(); });
    ctx.fillStyle = "#2a2935"; ctx.beginPath(); ctx.arc(118, CHAO + 62, 11, 0, 7); ctx.fill();            // base do joystick
    ctx.strokeStyle = "#8d92a0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(118, CHAO + 62); ctx.lineTo(118, CHAO + 48); ctx.stroke();
    ctx.fillStyle = "#e0453b"; ctx.beginPath(); ctx.arc(118, CHAO + 45, 7, 0, 7); ctx.fill();            // bolinha
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(116, CHAO + 43, 2.4, 0, 7); ctx.fill();
    neon("#41e6ff", 12 * pulso, () => { ctx.fillStyle = "#5ceaff"; ctx.beginPath(); ctx.arc(172, CHAO + 56, 13, 0, 7); ctx.fill(); }); // botão
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(168, CHAO + 51, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = "#ffb938"; ctx.lineWidth = 1.5; ctx.strokeRect(206, CHAO + 40, 14, 24); ctx.strokeRect(226, CHAO + 40, 14, 24); // entradas
    ctx.fillStyle = "#c5c8d2"; rr(248, CHAO + 38, 16, 30, 3); ctx.fill();                                 // moedeiro

    // porta de prêmio embaixo à esquerda
    ctx.fillStyle = "#0d0c13"; rr(16, CHAO + 26, 60, 74, 8); ctx.fill();
    neon("#ffd93d", 6, () => { ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 1.4; rr(16, CHAO + 26, 60, 74, 8); ctx.stroke(); });
    ctx.fillStyle = "#fff"; ctx.font = "700 10px Fredoka, sans-serif"; ctx.fillText("PRIZE OUT", 46, CHAO + 52);
    ctx.fillStyle = "#fff"; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) ctx.fillRect(36 + i * 7, CHAO + 60 + j * 7, 7, 7);
  }

  function desenhar() {
    ctx.clearRect(0, 0, W, H);
    maquina();
    ctx.save(); rr(GX, GY, GW, GH, 8); ctx.clip();
    // as de baixo primeiro, as de cima por cima
    for (const p of [...pilha].sort((a, b) => b.y - a.y)) pelucia(p);
    for (const q of quedas) pelucia(q.p, q.x, q.y);
    ctx.restore();
    garraDesenho();
    if (g.carga) pelucia(g.carga, g.x, g.y + 24);
    // reflexos do vidro
    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.beginPath(); ctx.moveTo(GX + 22, GY); ctx.lineTo(GX + 66, GY); ctx.lineTo(GX + 30, CHAO - 10); ctx.lineTo(GX, CHAO - 10); ctx.lineTo(GX, GY + 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.beginPath(); ctx.moveTo(GX + 84, GY); ctx.lineTo(GX + 104, GY); ctx.lineTo(GX + 68, CHAO - 10); ctx.lineTo(GX + 48, CHAO - 10); ctx.closePath(); ctx.fill();
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
    pilha = criarPilha();
    jogando = true;
    $("overlay").classList.add("escondido");
  }

  // Modo quarto (?quarto): vence quem bate a meta; vencendo, volta pro quarto e libera o próximo adesivo.
  // (Quando o adversário existir, a meta vira "pegar mais que ele".)
  const modoQuarto = location.search.includes("quarto");
  let venceu = false;
  function terminar() {
    if (!jogando) return;
    jogando = false;
    const txt = `Você pegou ${pontos} ${pontos === 1 ? "ponto" : "pontos"}!`;
    if (modoQuarto && pontos >= GARRA.metaQuarto) {
      venceu = true;
      mostrar("🏆", GARRA.textos.venceu, txt, GARRA.textos.voltarQuarto);
    } else if (modoQuarto) {
      mostrar("🧸", GARRA.textos.quase, `${txt} A meta era ${GARRA.metaQuarto}.`, GARRA.textos.fimBotao);
    } else {
      mostrar("🏆", GARRA.textos.fim, txt, GARRA.textos.fimBotao);
    }
  }
  $("btn-comecar").addEventListener("click", () => {
    if (venceu) location.href = "quarto.html?concluiu=" + GARRA.idAdesivo;
    else comecar();
  });

  pilha = criarPilha();
  mostrar("🧸", GARRA.textos.titulo, modoQuarto ? GARRA.textos.introQuarto : GARRA.textos.intro, GARRA.textos.botao);

  let ultimo = 0;
  function loop(agora) {
    const dt = Math.min((agora - ultimo) / 1000 || 0, 0.05);
    ultimo = agora;
    atualizar(dt);
    desenhar();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ganchos pra testar no console
  window.Garra = { estado: () => ({ pontos, restante, estado: g.estado, naPilha: pilha.length }), g, get pilha() { return pilha; }, acabar: () => { restante = 0; }, registro, avancar: (s) => { for (let i = 0; i < s * 60; i++) atualizar(1 / 60); }, comecar };
})();
