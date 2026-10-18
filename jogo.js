// Motor do jogo: física, câmera, controles, cenários, rampa da boia e cena do pedido.
const Jogo = (() => {
  const GRAVIDADE = 1500;
  const VELOCIDADE = 170;
  const PULO = -640;
  const TEMPO_COYOTE = 0.12; // ainda dá pra pular logo depois de sair da borda
  const TEMPO_BUFFER = 0.14; // apertar pular um pouquinho antes de encostar no chão conta
  const CAM_RAMPA = 2700;    // posição "falsa" da câmera na cena da rampa (só pro fundo)
  const PLACA_ESC_FIM = 1.3;  // quanto a plaquinha cresce quando ele a levanta

  let canvas, ctx, dpr = 1, escala = 1, viewW = 300, viewH = 440;
  let cb = {};
  // parado | jogando | pausado | indo | rampa | cena | abraco
  let estado = "parado";
  let retorno = "jogando"; // pra onde voltar depois de ler uma memória
  let tempo = 0, ultimo = 0;
  let kitty, pedro, coracoes = [], coletados = 0;
  const amiga = { x: 0, visivel: true, andando: false, anim: 0 }; // a Mirella
  let traje = "dia";
  let rampaFeita = false; // o brinquedo da boia é opcional: depois que anda nele, não repete
  let chegadaFeita = false;      // a cena do churros só acontece uma vez
  let segurandoChurros = false;  // a Kitty anda com o churros na mão até o arcade
  let garraGanha = false;        // já pegou a capivara?
  const cam = { x: 0, y: 0 };
  const particulas = [];
  const entrada = { esq: false, dir: false };
  let bufferPulo = 0;
  const cena = {};
  const rampa = { t: 0, ang: -1.34, vel: 0, fim: false, picos: 0, parou: -1 };
  // resgate: quando a Kitty cai num buraco o herói aranha chega balançando e salva ela com a teia
  const heroi = { vis: false, x: 0, y: 0, dir: -1, pose: "balancando", saindo: false, t: 0, sx0: 0, sy0: 0, ax: 0 };
  const resgate = { t: 0, x0: 0, y0: 0, sx: 0, sy: 0 };
  let fade = 0, fadeDir = 0, aposFade = null;

  // ---------- utilidades ----------
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const cor = (c) => (c[0] === '#' ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c.match(/\d+/g).map(Number));
  const mix = (a, b, t) => {
    const A = cor(a), B = cor(b);
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
  };
  const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  // 0 = mundo de hoje, 1 = parque aquático
  const mistura2 = (x) => clamp01((x - FASE.transicao2.ini) / (FASE.transicao2.fim - FASE.transicao2.ini)); // parque → rua
  const mistura = (x) => clamp01((x - FASE.transicao.ini) / (FASE.transicao.fim - FASE.transicao.ini));

  // roupa: de praia só dentro do parque (entre o portão de entrada e a saída)
  const trajeEm = (x) => (x > FASE.portao.x && x < FASE.saidaParque.x ? "praia" : "dia");

  // ---------- configuração ----------
  function init(elCanvas, callbacks) {
    canvas = elCanvas;
    ctx = canvas.getContext("2d");
    cb = callbacks;
    new ResizeObserver(redimensionar).observe(canvas);
    configurarControles();
    reiniciar();
    requestAnimationFrame(loop);
  }

  function redimensionar() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    escala = Math.min(r.width / 300, r.height / 440);
    viewW = r.width / escala;
    viewH = r.height / escala;
  }

  function reiniciar() {
    // abra o site com ?final, ?rampa ou ?parque no endereço para começar perto dessas partes (bom pra ensaiar)
    const q = location.search;
    if (q.includes("final")) CONFIG.pedidoAtivo = true; // ?final liga o pedido (guardado) pra ensaiar
    const x0 = q.includes("final") ? FASE.pedro.x - 420
      : q.includes("rampa") ? FASE.rampa.entrada.ini - 200
      : q.includes("arcade") ? FASE.arcade.porta - 130
      : q.includes("shopping") ? FASE.shopping.entrada - 400
      : q.includes("churros") ? FASE.churros.x - 240
      : q.includes("rua") ? FASE.transicao2.ini - 150
      : q.includes("parque") ? FASE.portao.x - 200
      : FASE.inicio.x;
    kitty = {
      x: x0, y: FASE.chao, vx: 0, vy: 0,
      noChao: true, coyote: 0, dir: 1, anim: 0, piscar: 0, caiu: false, andando: false,
      seguro: { x: x0, y: FASE.chao },
    };
    traje = trajeEm(x0);
    rampaFeita = false;
    chegadaFeita = segurandoChurros = garraGanha = false;
    if (x0 > FASE.churros.x + 100) { chegadaFeita = true; segurandoChurros = true; } // atalhos de ensaio: já passou pelo churros
    amiga.x = FASE.rampa.x - 124; // espera ao lado da escada
    pedro = { x: FASE.pedro.x, y: FASE.chao, dir: -1, pose: "parado", flores: true, pulo: 0 };
    Object.assign(cena, {
      t: 0, te: 0, estagio: "chegando", perguntou: false, proxCoracao: 0,
      zoom: 1, foco: 0, pop: 0, reveal: 0, levanta: 0, giro: 0, lean: 0, buque: null,
    });
    const n = CONFIG.mostrarCoracoes ? Math.min(CONFIG.memorias.length, FASE.coracoes.length) : 0;
    coracoes = FASE.coracoes.slice(0, n).map((c, i) => ({ ...c, i, pego: false }));
    coletados = 0;
  }

  function configurarControles() {
    const teclas = {
      ArrowLeft: "esq", a: "esq", A: "esq",
      ArrowRight: "dir", d: "dir", D: "dir",
      ArrowUp: "pulo", w: "pulo", W: "pulo", " ": "pulo",
    };
    window.addEventListener("keydown", (e) => {
      const c = teclas[e.key];
      if (!c) return;
      e.preventDefault();
      if (c === "pulo") { if (!e.repeat) bufferPulo = TEMPO_BUFFER; }
      else entrada[c] = true;
    });
    window.addEventListener("keyup", (e) => {
      const c = teclas[e.key];
      if (c && c !== "pulo") entrada[c] = false;
    });

    document.querySelectorAll("[data-ctl]").forEach((btn) => {
      const c = btn.dataset.ctl;
      const soltar = () => { btn.classList.remove("apertado"); if (c !== "pulo") entrada[c] = false; };
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        btn.classList.add("apertado");
        if (c === "pulo") bufferPulo = TEMPO_BUFFER;
        else entrada[c] = true;
      });
      btn.addEventListener("pointerup", soltar);
      btn.addEventListener("pointercancel", soltar);
      btn.addEventListener("pointerleave", soltar);
      btn.addEventListener("contextmenu", (e) => e.preventDefault());
    });
  }

  // ---------- loop ----------
  function loop(agora) {
    // ?lento no endereço roda tudo em câmera lenta (bom pra ensaiar)
    const dt = Math.min((agora - ultimo) / 1000 || 0, 0.05) * (location.search.includes("lento") ? 0.25 : 1);
    ultimo = agora;
    tempo += dt;
    atualizar(dt);
    desenhar();
    requestAnimationFrame(loop);
  }

  function naRampa() {
    return estado === "rampa" || (estado === "pausado" && retorno === "rampa");
  }

  function atualizar(dt) {
    if (estado === "jogando") atualizarKitty(dt);
    else if (estado === "indo") atualizarIndo(dt);
    else if (estado === "rampa") atualizarRampa(dt);
    else if (estado === "resgate") atualizarResgate(dt);
    else if (estado === "chegada") atualizarChegada(dt);
    else if (estado === "garra") atualizarGarra(dt);
    else if (estado === "cena" || estado === "abraco") atualizarCena(dt);
    atualizarFade(dt);
    atualizarTraje();
    // depois de salvar a Kitty o herói vai embora balançando
    if (heroi.saindo) {
      heroi.t += dt;
      heroi.x += 230 * dt;
      heroi.y -= 200 * dt;
      if (heroi.t > 0.9) { heroi.vis = false; heroi.saindo = false; }
    }

    // câmera
    cam.y = FASE.chao + 90 - viewH;
    if (naRampa()) {
      cam.x = CAM_RAMPA;
    } else {
      let alvoX = kitty.x - viewW * 0.4;
      if (estado === "cena" || estado === "abraco") alvoX = (kitty.x + pedro.x) / 2 - viewW / 2 + 40 * cena.foco;
      if (estado === "chegada") alvoX = FASE.churros.x - 62 - viewW / 2;
      alvoX = Math.max(0, Math.min(FASE.largura - viewW, alvoX));
      cam.x += (alvoX - cam.x) * Math.min(1, dt * 6);
    }

    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      p.vida -= dt * (p.decai || 1);
      if (p.vida <= 0) particulas.splice(i, 1);
    }
  }

  function atualizarFade(dt) {
    if (!fadeDir) return;
    fade += (fadeDir * dt) / 0.55;
    if (fadeDir > 0 && fade >= 1) {
      fade = 1; fadeDir = 0;
      const f = aposFade; aposFade = null; if (f) f();
    } else if (fadeDir < 0 && fade <= 0) {
      fade = 0; fadeDir = 0;
      const f = aposFade; aposFade = null; if (f) f();
    }
  }
  function fadeAte(alvo, depois) { fadeDir = alvo ? 1 : -1; aposFade = depois || null; }

  // roupa de praia depois do portão do parque
  function atualizarTraje() {
    const novo = trajeEm(kitty.x);
    if (novo === traje) return;
    traje = novo;
    if (estado === "jogando") {
      brilhos(kitty.x, kitty.y - 30, 18, "#fff");
      brilhos(kitty.x, kitty.y - 30, 10, "#4fc3f7");
    }
  }

  // esticar (subindo) e amassar (pousando) a Kitty
  function deformacao() {
    const k = kitty;
    let sy = 1;
    if (estado === "jogando" && !k.noChao) sy = k.vy < 0 ? 1 + 0.09 * clamp01(-k.vy / 640) : 1 - 0.03 * clamp01(k.vy / 900);
    else if (k.pouso > 0) sy = 1 - 0.16 * (k.pouso / 0.14);
    return { sx: 1 / Math.sqrt(sy), sy };
  }

  // o quanto o Pedro fica sem jeito conforme ela se aproxima (0 = longe, 1 = pertinho)
  function timidez() {
    return clamp01((520 - (pedro.x - kitty.x)) / 380);
  }

  function coletar(c, x, y) {
    c.pego = true;
    coletados++;
    brilhos(x, y, 14, "#ff4d88");
    retorno = estado;
    estado = "pausado";
    entrada.esq = entrada.dir = false;
    cb.onColeta && cb.onColeta(c.i, coletados, coracoes.length);
  }

  function atualizarKitty(dt) {
    const k = kitty;
    const mov = (entrada.dir ? 1 : 0) - (entrada.esq ? 1 : 0);
    k.vx = mov * VELOCIDADE;
    if (mov) k.dir = mov;

    k.coyote = k.noChao ? TEMPO_COYOTE : k.coyote - dt;
    bufferPulo -= dt;
    // "pular pra subir": o brinquedo da boia é opcional, só entra quem pula na escada
    if (bufferPulo > 0 && k.noChao && !rampaFeita && k.x >= FASE.rampa.entrada.ini && k.x <= FASE.rampa.entrada.fim) {
      bufferPulo = 0;
      return iniciarRampa();
    }
    // "pular pra jogar": a máquina da capivara, no arcade
    if (bufferPulo > 0 && k.noChao && !garraGanha && k.x >= FASE.arcade.zona.ini && k.x <= FASE.arcade.zona.fim) {
      bufferPulo = 0;
      return iniciarGarra();
    }
    if (bufferPulo > 0 && k.coyote > 0) {
      k.vy = PULO;
      k.coyote = 0;
      bufferPulo = 0;
      k.noChao = false;
      brilhos(k.x, k.y, 4, "#fff");
    }

    k.vy = Math.min(k.vy + GRAVIDADE * dt, 900);
    const vyAntes = k.vy;
    const yAntes = k.y;
    k.x = Math.max(15, Math.min(FASE.largura - 15, k.x + k.vx * dt));
    k.y += k.vy * dt;

    const estavaNoAr = !k.noChao;
    k.noChao = false;
    if (k.vy >= 0) {
      for (const p of FASE.plataformas) {
        if (k.x + 11 > p.x && k.x - 11 < p.x + p.w && yAntes <= p.y + 0.5 && k.y >= p.y) {
          k.y = p.y;
          k.vy = 0;
          k.noChao = true;
          k.caiu = false;
          if (estavaNoAr && vyAntes > 250) k.pouso = 0.14; // amassadinha ao pousar
          if (k.x > p.x + 24 && k.x < p.x + p.w - 24) k.seguro = { x: k.x, y: p.y };
          break;
        }
      }
    }

    // espirro de água / poeirinha quando cai no buraco
    if (k.y > FASE.chao + 30 && !k.caiu) {
      k.caiu = true;
      brilhos(k.x, FASE.chao + 8, 14, k.x > FASE.transicao2.ini + 400 ? "#d9cbb8" : (k.x > FASE.transicao.ini + 400 ? "#9be3ff" : "#ffd1e3"));
    }
    // caiu no buraco → o herói aranha vem salvar (ver iniciarResgate)
    if (k.y > FASE.chao + 45) return iniciarResgate();
    // (plano B) se por algum motivo continuar caindo, volta na hora pro último lugar seguro
    if (k.y > FASE.chao + 260) {
      k.x = k.seguro.x;
      k.y = k.seguro.y;
      k.vx = k.vy = 0;
      k.piscar = 1;
      k.caiu = false;
    }
    k.piscar = Math.max(0, k.piscar - dt);
    k.pouso = Math.max(0, (k.pouso || 0) - dt);
    k.anim += mov && k.noChao ? dt * 12 : 0;
    if (!k.noChao) k.anim += dt * 10; // balançadinha dos braços no ar

    for (const c of coracoes) {
      if (c.pego || c.ang !== undefined) continue;
      if (Math.hypot(k.x - c.x, k.y - 28 - c.y) < 32) {
        coletar(c, c.x, c.y);
        return;
      }
    }

    if (CONFIG.pedidoAtivo && k.x >= pedro.x - 200) return iniciarCena();   // o pedido (guardado)
    if (!CONFIG.pedidoAtivo && !chegadaFeita && k.x >= FASE.churros.x - 170) return iniciarChegada();
  }

  // ---------- chegada no carrinho de churros (fim desta fase) ----------
  // fases: andando → ola (a moça cumprimenta) → pede → prepara (chocolate + granulado)
  //        → entrega → paga → pago ("um rapaz já deixou pago") → fim da fase
  const chegada = { t: 0, te: 0, fase: "andando", fim: false, temChurros: false };

  function mudarFaseCheg(f) {
    chegada.fase = f;
    chegada.te = 0;
  }

  function iniciarChegada() {
    estado = "chegada";
    entrada.esq = entrada.dir = false;
    kitty.vx = 0;
    Object.assign(chegada, { t: 0, te: 0, fase: "andando", fim: false, temChurros: false });
  }

  function atualizarChegada(dt) {
    const k = kitty, c = chegada;
    c.t += dt;
    c.te += dt;
    const alvo = FASE.churros.x - 165;
    if (c.fase === "andando") {
      k.y = FASE.chao;
      if (k.x < alvo - 1) {
        k.x = Math.min(alvo, k.x + VELOCIDADE * 0.7 * dt);
        k.anim += dt * 10;
        k.dir = 1;
        k.andando = true;
        return;
      }
      k.andando = false;
      mudarFaseCheg("ola");
      return;
    }
    k.andando = false;
    k.dir = 1;
    k.y = FASE.chao;
    k.anim += dt * 10;
    switch (c.fase) {
      case "ola":
        if (c.te > 1.7) mudarFaseCheg("pede");
        break;
      case "pede":
        if (c.te > 2.0) mudarFaseCheg("prepara");
        break;
      case "prepara":
        if (c.te > 3.0) mudarFaseCheg("entrega");
        break;
      case "entrega":
        if (c.te > 0.9) { c.temChurros = true; mudarFaseCheg("paga"); }
        break;
      case "paga":
        if (c.te > 1.9) mudarFaseCheg("pago");
        break;
      case "pago":
        if (c.te > 1.0) k.y = FASE.chao - Math.abs(Math.sin((c.te - 1.0) * 6)) * 12; // pulinhos de alegria
        cena.proxCoracao -= dt;
        if (cena.proxCoracao <= 0) {
          cena.proxCoracao = 0.28;
          coracaoSubindo(k.x + 20 + (Math.random() - 0.5) * 40, FASE.chao - 80);
        }
        if (c.te > 4.0 && !c.fim) {
          c.fim = true;
          chegadaFeita = true;
          segurandoChurros = true; // segue pro shopping com o churros na mão
          k.y = FASE.chao;
          k.andando = false;
          estado = "jogando";
        }
        break;
    }
  }

  function poseKittyChegada() {
    const c = chegada;
    if (c.fase === "andando") return "andando";
    if (c.fase === "pago" && c.te > 1.0) return "pulando";
    return "parado";
  }
  function rostoKittyChegada() {
    const c = chegada;
    if (c.fase === "pago" && c.te < 1.0) return "susto";
    return "feliz";
  }

  // um churros (com cobertura de chocolate e granulado, se for o caso)
  function desenharChurros(x, y, rot, choco, gran, esc) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(esc, esc);
    caminhoRetArred(ctx, -5, -16, 10, 32, 5);
    ctx.fillStyle = "#e3a857";
    ctx.fill();
    // listras do churros
    ctx.strokeStyle = "rgba(140,90,40,.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let yy = -12; yy < 16; yy += 6) { ctx.moveTo(-5, yy); ctx.lineTo(5, yy + 2); }
    ctx.stroke();
    if (choco > 0) {
      // chocolate escorrendo pelo churros
      ctx.save();
      caminhoRetArred(ctx, -5, -16, 10, 32, 5);
      ctx.clip();
      ctx.fillStyle = "#4a2412";
      const fim = -16 + 2 + choco * 24;
      ctx.fillRect(-6, -17, 12, fim + 17);
      elipse(ctx, -2.5, fim, 2.2, 3.2);
      ctx.fill();
      elipse(ctx, 2.5, fim - 2, 2.2, 2.6);
      ctx.fill();
      ctx.restore();
      // granulado colorido em cima do chocolate
      const cores = ["#ff4d88", "#ffd23f", "#4cc9f0", "#7be08f", "#fff"];
      const n = Math.round(gran * 14);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = cores[i % 5];
        ctx.save();
        ctx.translate(-3.5 + ((i * 5) % 8), -14 + (((i * 7) % 20) / 20) * (choco * 22));
        ctx.rotate(i);
        ctx.fillRect(-1.3, -0.7, 2.6, 1.4);
        ctx.restore();
      }
    }
    caminhoRetArred(ctx, -5, -16, 10, 32, 5);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "#8a5a2a";
    ctx.stroke();
    ctx.restore();
  }

  // a cena do pedido de churros: churros sendo montado, entrega, moedinha e as falas
  function desenharChegada() {
    if (estado !== "chegada") return;
    const c = chegada, k = kitty, cx = FASE.churros.x, y = FASE.chao;
    const base = { x: cx - 104, y: y - 66 }; // em cima da mesinha

    if (c.fase === "prepara") {
      const t = c.te;
      const choco = clamp01((t - 0.5) / 1.0);
      const gran = clamp01((t - 1.7) / 0.9);
      desenharChurros(base.x, base.y, 0, choco, gran, 1);
      if (t > 0.5 && t < 1.6) {
        // frasquinho esguichando chocolate
        const topo = base.y - 14 + choco * 24;
        ctx.strokeStyle = "#4a2412";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(base.x + 22, base.y - 44);
        ctx.quadraticCurveTo(base.x + 10, base.y - 40, base.x, topo - 2);
        ctx.stroke();
        ctx.save();
        ctx.translate(base.x + 26, base.y - 50);
        ctx.rotate(-0.9);
        caminhoRetArred(ctx, -5, -12, 10, 18, 3);
        preencherContornar(ctx, "#6b3a1e", 1.2);
        ctx.restore();
      }
      if (t > 1.7 && t < 2.8) {
        // chuva de granulado
        const cores = ["#ff4d88", "#ffd23f", "#4cc9f0", "#7be08f", "#fff"];
        for (let i = 0; i < 16; i++) {
          const f = ((t - 1.7) * 1.5 + i / 16) % 1;
          ctx.fillStyle = cores[i % 5];
          ctx.save();
          ctx.translate(base.x + (rnd(i + 3) - 0.5) * 18, base.y - 56 + f * 40);
          ctx.rotate(i + tempo * 4);
          ctx.fillRect(-2, -1, 4, 2);
          ctx.restore();
        }
      }
    } else if (c.fase === "entrega") {
      // o churros voa do balcão pra mão da Kitty
      const q = easeInOut(clamp01(c.te / 0.9));
      const hx = k.x + 17, hy = k.y - 28;
      desenharChurros(base.x + (hx - base.x) * q, base.y + (hy - base.y) * q - Math.sin(Math.PI * q) * 26, 0.45 * q, 1, 1, 1);
    } else if (c.temChurros) {
      desenharChurros(k.x + 17, k.y - 28 + Math.sin(tempo * 5), 0.45, 1, 1, 1);
    }

    // moedinha na hora de pagar
    if (c.fase === "paga") {
      ctx.save();
      ctx.translate(k.x + 27, k.y - 44 + Math.sin(tempo * 6) * 2);
      elipse(ctx, 0, 0, 6.5, 6.5);
      preencherContornar(ctx, "#ffd23f", 1.6);
      ctx.fillStyle = "#8a5a00";
      ctx.font = "700 9px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", 0, 0.5);
      ctx.restore();
    }

    // as falas
    const kBal = (txt) => balaoMundo([txt], k.x, k.y - 80);
    const vBal = (txt) => balaoMundo([txt], cx - 58, y - 176);
    if (c.fase === "ola") vBal(CONFIG.vendedoraOla);
    else if (c.fase === "pede") kBal(CONFIG.kittyPede);
    else if (c.fase === "prepara" && c.te > 2.3) vBal(CONFIG.vendedoraPronto);
    else if (c.fase === "paga") kBal(CONFIG.kittyPaga);
    else if (c.fase === "pago") {
      if (c.te < 2.2) vBal(CONFIG.vendedoraPago);
      else kBal(CONFIG.kittyFeliz);
    }
  }

  // ---------- resgate do herói aranha ----------
  const RES_A = 0.8, RES_B = 1.25, RES_C = 2.3, RES_D = 2.8;

  function iniciarResgate() {
    const k = kitty;
    estado = "resgate";
    entrada.esq = entrada.dir = false;
    k.vx = k.vy = 0;
    k.andando = false;
    Object.assign(resgate, { t: 0, x0: k.x, y0: k.y, sx: k.seguro.x, sy: k.seguro.y });
    Object.assign(heroi, {
      vis: true, saindo: false, t: 0, pose: "balancando", dir: -1,
      x: cam.x + viewW + 70, y: cam.y - 70,
    });
    heroi.sx0 = heroi.x;
    heroi.sy0 = heroi.y;
  }

  function atualizarResgate(dt) {
    const r = resgate, k = kitty, h = heroi;
    r.t += dt;
    const t = r.t;
    const pairaX = r.x0 + 28, pairaY = FASE.chao - 50;        // onde ele fica quando alcança a Kitty
    const saiX = r.sx + 28, saiY = FASE.chao - 135;            // onde ele fica quando solta ela

    if (t < RES_A) {
      // chega balançando de cima, em arco
      const q = easeInOut(t / RES_A);
      h.x = h.sx0 + (pairaX - h.sx0) * q;
      h.y = h.sy0 + (pairaY - h.sy0) * q - Math.sin(Math.PI * q) * 40;
      h.pose = "balancando";
      h.dir = -1;
      h.ax = pairaX + 14;
      k.y = r.y0 + Math.sin(tempo * 7) * 1.2;
    } else if (t < RES_B) {
      // atira a teia
      h.x = pairaX + Math.sin(tempo * 5) * 1.5;
      h.y = pairaY + Math.sin(tempo * 6) * 2;
      h.pose = "puxando";
      h.dir = -1;
      k.y = r.y0 + Math.sin(tempo * 7) * 1.2;
    } else if (t < RES_C) {
      // puxa a Kitty pra cima e pro último lugar seguro, balançando
      const q = easeInOut((t - RES_B) / (RES_C - RES_B));
      k.x = r.x0 + (r.sx - r.x0) * q;
      k.y = r.y0 + (r.sy - r.y0) * q - Math.sin(Math.PI * q) * 95;
      h.x = pairaX + (saiX - pairaX) * q;
      h.y = pairaY + (saiY - pairaY) * q - Math.sin(Math.PI * q) * 18;
      h.ax = h.x + 14;
      h.dir = k.x < h.x ? -1 : 1;
      h.pose = "puxando";
    } else if (t < RES_D) {
      // solta a teia e a Kitty desce até o chão, em segurança
      h.x = saiX;
      h.y = saiY + Math.sin(tempo * 6) * 2;
      h.pose = "balancando";
      k.x = r.sx;
      k.vy = Math.min(k.vy + GRAVIDADE * dt, 900);
      k.y = Math.min(r.sy, k.y + k.vy * dt);
    } else {
      k.x = r.sx;
      k.y = r.sy;
      k.vx = k.vy = 0;
      k.noChao = true;
      k.caiu = false;
      k.coyote = TEMPO_COYOTE;
      brilhos(k.x, k.y - 30, 12, "#fff");
      // o herói vai embora balançando
      heroi.saindo = true;
      heroi.t = 0;
      heroi.dir = 1;
      estado = "jogando";
    }
  }

  // teia: linha branca com contorno; p = quanto já foi esticada (0..1)
  function teia(x1, y1, x2, y2, p = 1, alfa = 1) {
    const ex = x1 + (x2 - x1) * p, ey = y1 + (y2 - y1) * p;
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + ex) / 2, (y1 + ey) / 2 + 5 * Math.sin(p * Math.PI), ex, ey);
    ctx.strokeStyle = "rgba(50,50,70,.45)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (p >= 1) {
      // teiazinha onde grudou
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(a) * 9, ey + Math.sin(a) * 9);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function desenharResgate() {
    if (!heroi.vis) return;
    const h = heroi, r = resgate;
    const emResgate = estado === "resgate";
    // mãozinha de onde sai a teia (e o braço que segura a corda quando está balançando)
    const maoCima = { x: h.x + 19 * h.dir, y: h.y - 57 };
    const maoFrente = { x: h.x + 29 * h.dir, y: h.y - 39 };

    // a corda de teia presa lá em cima
    if (emResgate && r.t < RES_D) {
      const ancora = { x: h.ax || h.x, y: cam.y - 110 };
      teia(ancora.x, ancora.y, maoCima.x, maoCima.y, 1, 0.8);
    } else if (h.saindo) {
      teia(h.x + 90, cam.y - 110, maoCima.x, maoCima.y, 1, Math.max(0, 1 - h.t / 0.9));
    }

    ctx.save();
    if (h.saindo) ctx.globalAlpha = Math.max(0, 1 - Math.max(0, h.t - 0.3) / 0.6);
    desenharAranha(ctx, { x: h.x, y: h.y, dir: h.dir, pose: h.saindo ? "balancando" : h.pose, anim: tempo * 8 });
    ctx.restore();

    // a teia que prende a Kitty
    if (emResgate && r.t >= RES_A && r.t < RES_D) {
      const p = Math.min(1, (r.t - RES_A) / (RES_B - RES_A));
      const alfa = r.t > RES_C ? Math.max(0, 1 - (r.t - RES_C) / (RES_D - RES_C)) : 1;
      teia(maoFrente.x, maoFrente.y, kitty.x, kitty.y - 38, p, alfa);
    }

    // falas
    if (emResgate && r.t > 0.5 && r.t < RES_C) {
      balaoMundo([CONFIG.falaHeroi], h.x, h.y - 74);
    } else if ((emResgate && r.t >= RES_C) || (h.saindo && h.t < 0.6)) {
      balaoMundo([CONFIG.falaHeroi2], h.x, h.y - 74);
    }
  }

  // ---------- brinquedo da boia ----------
  function iniciarRampa() {
    rampaFeita = true;
    estado = "indo";
    entrada.esq = entrada.dir = false;
    kitty.vx = 0;
    fadeAte(1, entrarRampa);
  }

  function atualizarIndo(dt) {
    const k = kitty;
    k.x += 60 * dt;
    k.anim += dt * 10;
    k.andando = true;
    k.dir = 1;
    // a Mirella sobe junto
    amiga.x += 60 * dt;
    amiga.anim += dt * 10;
    amiga.andando = true;
  }

  function entrarRampa() {
    estado = "rampa";
    kitty.andando = false;
    amiga.andando = false;
    particulas.length = 0;
    Object.assign(rampa, { t: 0, ang: -1.34, vel: 0, fim: false, picos: 0, parou: -1 });
    cb.onControles && cb.onControles(false); // aqui ninguém controla nada: é só curtir a descida
    fadeAte(0);
  }

  function atualizarRampa(dt) {
    const r = rampa;
    r.t += dt;
    if (r.t < 1.2) return; // segura um pouquinho antes de soltar

    // pêndulo: desce o U lá do alto, sobe quase até a borda do outro lado
    // e depois cada ida e volta fica menor (o atrito aumenta depois da 1ª subida)
    const atrito = r.picos < 1 ? 0.04 : 0.55;
    const acc = -2.5 * Math.sin(r.ang) - atrito * r.vel;
    const velAntes = r.vel;
    r.vel += acc * dt;
    r.ang += r.vel * dt;
    if (velAntes * r.vel < 0) r.picos++;
    const lim = 1.4;
    if (Math.abs(r.ang) > lim) { r.ang = Math.sign(r.ang) * lim; r.vel *= -0.3; }

    if (Math.abs(r.ang) < 0.5 && Math.abs(r.vel) > 1.3 && Math.random() < dt * 45) {
      const p = pontoRampa(geoRampa(), r.ang, 8);
      particulas.push({
        tipo: "brilho", x: p.x, y: p.y, vx: -Math.sign(r.vel) * (30 + Math.random() * 40),
        vy: -30 - Math.random() * 60, g: 260, vida: 0.6, cor: "#bff0ff", tam: 3,
      });
    }

    if (!r.fim) {
      const quieto = r.picos >= 4 && Math.abs(r.ang) < 0.15 && Math.abs(r.vel) < 0.45;
      if (quieto && r.parou < 0) r.parou = r.t;
      if ((r.parou >= 0 && r.t - r.parou > 0.9) || r.t > 16) {
        r.fim = true;
        fadeAte(1, sairRampa);
      }
    }
  }

  function sairRampa() {
    const k = kitty;
    k.x = FASE.rampa.saida;
    k.y = FASE.chao;
    k.vx = k.vy = 0;
    k.noChao = true;
    k.dir = 1;
    k.andando = false;
    k.seguro = { x: k.x, y: k.y };
    cam.x = Math.max(0, Math.min(FASE.largura - viewW, k.x - viewW * 0.4));
    particulas.length = 0;
    amiga.x = FASE.rampa.saida - 52;
    amiga.visivel = true;
    estado = "jogando";
    cb.onControles && cb.onControles(true);
    fadeAte(0, () => cb.onFala && cb.onFala(`${CONFIG.nomeAmiga}: ${CONFIG.falaPosRampa}`));
  }

  function geoRampa() {
    const R = Math.min(viewW * 0.36, 125);
    const gY = FASE.chao - cam.y;
    return { R, cx: viewW / 2, cy: gY - 14 - R, gY };
  }
  // ponto dentro da rampa, "dist" px acima da superfície
  function pontoRampa(g, ang, dist) {
    return { x: g.cx + (g.R - dist) * Math.sin(ang), y: g.cy + (g.R - dist) * Math.cos(ang) };
  }

  // ---------- cena do pedido ----------
  function iniciarCena() {
    estado = "cena";
    cena.t = cena.te = 0;
    cena.estagio = "chegando";
    entrada.esq = entrada.dir = false;
    cb.onCena && cb.onCena();
  }

  function mudarEstagio(e) {
    cena.estagio = e;
    cena.te = 0;
    if (e === "viraCostas" || e === "viraFrente") cena.giro = 0; // começa o giro do zero
  }

  // Estágios: chegando → tremendo (tímido, com flores) → largar (solta as flores)
  //   → viraCostas → escrevendo (de costas, escondido dela) → viraFrente (ainda mais nervoso)
  //   → levanta (mostra a placa já escrita) → mostra → pergunta
  function atualizarCena(dt) {
    const c = cena, k = kitty, p = pedro;
    c.t += dt;
    c.te += dt;

    // Kitty anda sozinha até perto do Pedro
    const alvo = estado === "abraco" ? p.x - 30 : p.x - 58;
    k.vy = Math.min(k.vy + GRAVIDADE * dt, 900);
    k.y = Math.min(FASE.chao, k.y + k.vy * dt);
    if (k.y >= FASE.chao) k.vy = 0;
    if (k.x < alvo - 1) {
      k.x = Math.min(alvo, k.x + VELOCIDADE * 0.7 * dt);
      k.anim += dt * 10;
      k.dir = 1;
      k.andando = true;
    } else k.andando = false;
    k.piscar = 0;

    // zoom suave pra ver ele de pertinho
    const zoomAlvo = estado === "abraco" ? 1
      : ({ chegando: 1, tremendo: 1.08, largar: 1.1, viraCostas: 1.12, escrevendo: 1.15, viraFrente: 1.15, levanta: 1.12, mostra: 1.08 }[c.estagio] || 1);
    c.zoom += (zoomAlvo - c.zoom) * Math.min(1, dt * 3);
    // a câmera desloca um pouco pra direita enquanto a plaquinha está ali ao lado dele
    const focoAlvo = ["largar", "viraCostas", "escrevendo", "viraFrente"].includes(c.estagio) && estado === "cena" ? 1 : 0;
    c.foco += (focoAlvo - c.foco) * Math.min(1, dt * 3);
    // ele se inclina pra perto da placa enquanto escreve
    c.lean = estado !== "cena" ? 0
      : c.estagio === "viraCostas" ? 12 * clamp01(c.te / 0.5)
      : c.estagio === "escrevendo" ? 12
      : c.estagio === "viraFrente" ? 12 * (1 - clamp01(c.te / 0.9))
      : 0;

    // buquê caindo no chão
    if (c.buque) {
      const b = c.buque;
      b.vy += 900 * dt;
      b.y += b.vy * dt;
      if (b.y > p.y - 4) { b.y = p.y - 4; b.vy = 0; }
      b.rot += (1.25 - b.rot) * Math.min(1, dt * 6);
    }

    if (estado === "abraco") {
      p.pose = "abraco";
      p.pulo = 0;
      c.proxCoracao -= dt;
      if (c.proxCoracao <= 0) {
        c.proxCoracao = 0.25;
        coracaoSubindo((k.x + p.x) / 2 + (Math.random() - 0.5) * 40, FASE.chao - 70);
      }
      return;
    }

    const duracaoEscrita = Math.max(2.4, CONFIG.textoPlaca.length * 0.14);
    switch (c.estagio) {
      case "chegando":
        if (!k.andando) mudarEstagio("tremendo");
        break;
      case "tremendo":
        emitirCoracoes(dt, k, p);
        if (c.te > 1.4) mudarEstagio("largar");
        break;
      case "largar":
        emitirCoracoes(dt, k, p);
        if (!c.buque) c.buque = { x: p.x + 14 * p.dir, y: p.y - 18, vy: -140, rot: 0 };
        p.flores = false;
        c.pop = clamp01((c.te - 0.2) / 0.5); // a plaquinha em branco aparece ao lado dele
        if (c.te > 1.0) mudarEstagio("viraCostas");
        break;
      case "viraCostas":
        c.giro = clamp01(c.te / 0.5);
        if (c.giro >= 1) mudarEstagio("escrevendo");
        break;
      case "escrevendo":
        // ele escreve escondido: a gente só vê o verso da placa e ele rabiscando
        if (c.te > 3.2) mudarEstagio("viraFrente");
        break;
      case "viraFrente":
        c.giro = clamp01(c.te / 0.9);
        if (c.giro >= 1) mudarEstagio("levanta");
        break;
      case "levanta":
        c.levanta = clamp01(c.te / 0.9);
        if (c.te > 0.45) p.pose = "placa";
        p.pulo = Math.sin(Math.PI * c.levanta) * 10;
        if (c.levanta >= 1) { p.pulo = 0; mudarEstagio("mostra"); }
        break;
      case "mostra":
        if (c.te > 0.8 && !c.perguntou) {
          c.perguntou = true;
          cb.onPergunta && cb.onPergunta();
        }
        break;
    }
  }

  function emitirCoracoes(dt, k, p) {
    cena.proxCoracao -= dt;
    if (cena.proxCoracao <= 0) {
      cena.proxCoracao = 0.3;
      coracaoSubindo((k.x + p.x) / 2 + (Math.random() - 0.5) * 20, FASE.chao - 60);
    }
  }

  // ---------- partículas ----------
  function brilhos(x, y, n, cor) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 120;
      particulas.push({ tipo: "brilho", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 300, vida: 0.7, cor, tam: 3 });
    }
  }
  function coracaoSubindo(x, y) {
    particulas.push({
      tipo: "coracao", x, y, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 25,
      vida: 1.6, decai: 0.7, cor: ["#ff4d88", "#ff8fb8", "#e8174f"][Math.floor(Math.random() * 3)],
      tam: 10 + Math.random() * 8,
    });
  }
  function desenharParticulas() {
    for (const p of particulas) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.vida));
      if (p.tipo === "coracao") coracao(ctx, p.x, p.y, p.tam, p.cor);
      else { ctx.fillStyle = p.cor; ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam); }
    }
    ctx.globalAlpha = 1;
  }

  // texto grande com contorno (gritos, dicas, "?" e "!")
  function textoGrande(txt, x, y, tam, cor = "#fff", contorno = "#ff4d88") {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.font = `700 ${tam}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(4, tam * 0.24);
    ctx.strokeStyle = contorno;
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = cor;
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  // =====================================================================
  //  FASE 3 — SHOPPING: praça, corredor com lojas, arcade e a máquina da capivara
  // =====================================================================
  const mistura3 = (x) => clamp01((x - FASE.transicao3.ini) / (FASE.transicao3.fim - FASE.transicao3.ini)); // rua → praça do shopping
  const mistura4 = (x) => clamp01((x - FASE.transicao4.ini) / (FASE.transicao4.fim - FASE.transicao4.ini)); // praça → corredor
  const mistura5 = (x) => clamp01((x - FASE.transicao5.ini) / (FASE.transicao5.fim - FASE.transicao5.ini)); // corredor → arcade

  // qual cenário domina em cada ponto (0 hoje, 1 parque, 2 rua, 3 praça, 4 corredor, 5 arcade)
  function temaDe(cx) {
    if (mistura5(cx) > 0.5) return 5;
    if (mistura4(cx) > 0.5) return 4;
    if (mistura3(cx) > 0.5) return 3;
    if (mistura2(cx) > 0.5) return 2;
    if (mistura(cx) > 0.5) return 1;
    return 0;
  }

  // objeto estático (loja, fachada...) guardado numa imagem pra não gastar a cada quadro.
  // No desenho, (0,0) é o canto de baixo à esquerda do objeto e o "pra cima" é y negativo.
  const cacheEst = new Map();
  function estatico(chave, x, yBase, w, h, fn) {
    const esc = Math.max(2, Math.min(3, Math.ceil(dpr * escala)));
    const k = `${chave}|${esc}`;
    let c = cacheEst.get(k);
    if (!c) {
      c = document.createElement("canvas");
      c.width = Math.round(w * esc);
      c.height = Math.round(h * esc);
      const salvo = ctx;
      ctx = c.getContext("2d");
      ctx.scale(esc, esc);
      ctx.translate(0, h);
      try { fn(); } finally { ctx = salvo; }
      if (!fontesProntas) { ctx.drawImage(c, x, yBase - h, w, h); return; } // fonte ainda carregando: não guarda
      cacheEst.set(k, c);
    }
    ctx.drawImage(c, x, yBase - h, w, h);
  }

  // ---------------------------------------------------------------------
  //  PELÚCIAS (usadas nas máquinas e no minigame) e a CAPIVARA com o coração
  // ---------------------------------------------------------------------
  // cabecinha de pelúcia: tipo "urso" | "coelho" | "gato" | "pato"
  function pelucia(x, y, r, cor, tipo) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.strokeStyle = "#2b1a22";
    const orelha = (ox, oy, rx, ry, rot) => { elipse(ctx, ox, oy, rx, ry, rot); ctx.fillStyle = cor; ctx.fill(); ctx.stroke(); };
    if (tipo === "coelho") { orelha(-r * 0.45, -r * 1.1, r * 0.25, r * 0.7, -0.15); orelha(r * 0.45, -r * 1.1, r * 0.25, r * 0.7, 0.15); }
    else if (tipo === "gato") {
      for (const l of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(l * r * 0.2, -r * 0.8); ctx.lineTo(l * r * 0.9, -r * 1.3); ctx.lineTo(l * r * 0.95, -r * 0.3); ctx.closePath();
        ctx.fillStyle = cor; ctx.fill(); ctx.stroke();
      }
    } else { orelha(-r * 0.75, -r * 0.8, r * 0.32, r * 0.32, 0); orelha(r * 0.75, -r * 0.8, r * 0.32, r * 0.32, 0); }
    elipse(ctx, 0, 0, r, r * 0.92);
    ctx.fillStyle = cor;
    ctx.fill();
    ctx.stroke();
    // focinho, olhos e nariz
    if (tipo === "pato") {
      elipse(ctx, 0, r * 0.28, r * 0.5, r * 0.26);
      ctx.fillStyle = "#ff9d2b"; ctx.fill(); ctx.stroke();
    } else {
      elipse(ctx, 0, r * 0.3, r * 0.42, r * 0.3);
      ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.fill();
      elipse(ctx, 0, r * 0.18, r * 0.12, r * 0.08);
      ctx.fillStyle = "#2b1a22"; ctx.fill();
    }
    ctx.fillStyle = "#2b1a22";
    for (const l of [-1, 1]) { elipse(ctx, l * r * 0.38, -r * 0.1, r * 0.09, r * 0.12); ctx.fill(); }
    ctx.restore();
  }

  // A CAPIVARA de pelúcia segurando um coração (inspirada na foto). Origem = base, centro dos pés.
  function desenharCapivara(x, y, esc, bob = 0) {
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(esc, esc);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "#6b3f1e";
    // orelhinhas redondas
    for (const [ox, oy] of [[-3, -53], [15, -51]]) {
      elipse(ctx, ox, oy, 5.2, 5.2); ctx.fillStyle = "#8a5a2e"; ctx.fill(); ctx.stroke();
      elipse(ctx, ox, oy + 0.6, 2.4, 2.4); ctx.fillStyle = "#5a3418"; ctx.fill();
    }
    // corpo gordinho
    elipse(ctx, 0, -23, 25, 27); ctx.fillStyle = "#b9763a"; ctx.fill(); ctx.stroke();
    elipse(ctx, 4, -28, 17, 20); ctx.fillStyle = "rgba(214,150,84,.55)"; ctx.fill();
    // pelinhos
    ctx.strokeStyle = "rgba(107,63,30,.35)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) { const px = -16 + (i % 7) * 5.5, py = -42 + Math.floor(i / 7) * 14 + (i % 3); ctx.moveTo(px, py); ctx.lineTo(px + 2, py + 3); }
    ctx.stroke();
    ctx.strokeStyle = "#6b3f1e"; ctx.lineWidth = 1.6;
    // focinho marrom escuro (parte de cima, à esquerda)
    caminhoRetArred(ctx, -22, -46, 22, 17, 8);
    ctx.fillStyle = "#6b3f22"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2b1608";
    elipse(ctx, -16, -38, 1.7, 2.2); ctx.fill();
    elipse(ctx, -8, -38, 1.7, 2.2); ctx.fill();
    // olhinho fechado
    ctx.strokeStyle = "#3a2010"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(4, -41); ctx.lineTo(11, -42); ctx.stroke();
    // pés
    ctx.strokeStyle = "#6b3f1e"; ctx.lineWidth = 1.4;
    for (const fx of [-12, 9]) { elipse(ctx, fx, -2, 7.5, 4.2); ctx.fillStyle = "#6b3f22"; ctx.fill(); ctx.stroke(); }
    // o coração vermelho fofinho
    coracao(ctx, -8, -17, 31, "#b8161f");
    coracao(ctx, -8, -18, 29, "#e0262f");
    ctx.fillStyle = "rgba(255,255,255,.55)";
    elipse(ctx, -15, -23, 3.4, 1.8, -0.7); ctx.fill();
    // patinhas segurando o coração
    for (const [ax, ay] of [[1, -14], [-20, -13]]) {
      elipse(ctx, ax, ay, 6.5, 4.4); ctx.fillStyle = "#a8682f"; ctx.fill();
      ctx.strokeStyle = "#6b3f1e"; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  //  LOJAS DO CORREDOR (desenhadas uma vez e guardadas em imagem)
  // ---------------------------------------------------------------------
  const ALT_LOJA = 190;

  function portaVidro(x, corAro, corVidro) {
    ctx.fillStyle = corAro;
    ctx.fillRect(x - 3, -104, 62, 104);
    ctx.fillStyle = corVidro;
    ctx.fillRect(x, -100, 56, 100);
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.beginPath(); ctx.moveTo(x + 6, -100); ctx.lineTo(x + 22, -100); ctx.lineTo(x + 6, -60); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#e6c46a";
    ctx.fillRect(x + 26, -58, 3, 18);
    ctx.fillRect(x + 31, -58, 3, 18);
  }

  // salto alto, de lado (x = calcanhar, y = chão)
  function salto(x, y, cor, esc = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(esc, esc);
    ctx.beginPath();
    ctx.moveTo(-1, -17);
    ctx.quadraticCurveTo(8, -23, 14, -13);
    ctx.quadraticCurveTo(22, -9, 27, -4);
    ctx.quadraticCurveTo(29, 0, 23, 0);
    ctx.lineTo(12, -5);
    ctx.lineTo(6, -8);
    ctx.lineTo(4, 0);
    ctx.lineTo(1.5, 0);
    ctx.lineTo(1, -9);
    ctx.closePath();
    ctx.fillStyle = cor; ctx.fill();
    ctx.lineWidth = 1.1; ctx.strokeStyle = "#2b1a22"; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(4, -19); ctx.quadraticCurveTo(9, -20, 12, -14); ctx.stroke();
    ctx.restore();
  }

  function manequimVestido(cx, chao, cor, corBorda) {
    // pé do manequim
    elipse(ctx, cx, chao, 15, 4); ctx.fillStyle = "#a9998a"; ctx.fill();
    // saia longa e rodada
    ctx.beginPath();
    ctx.moveTo(cx - 6, chao - 64);
    ctx.quadraticCurveTo(cx - 12, chao - 30, cx - 24, chao - 2);
    ctx.lineTo(cx + 24, chao - 2);
    ctx.quadraticCurveTo(cx + 12, chao - 30, cx + 6, chao - 64);
    ctx.closePath();
    ctx.fillStyle = cor; ctx.fill();
    ctx.strokeStyle = corBorda; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const dx of [-14, -6, 2, 10]) { ctx.moveTo(cx + dx * 0.4, chao - 62); ctx.quadraticCurveTo(cx + dx * 0.9, chao - 30, cx + dx * 1.7, chao - 3); }
    ctx.stroke();
    // corpete
    ctx.beginPath();
    ctx.moveTo(cx - 7, chao - 62); ctx.lineTo(cx - 9, chao - 84); ctx.lineTo(cx + 9, chao - 84); ctx.lineTo(cx + 7, chao - 62);
    ctx.closePath();
    ctx.fillStyle = cor; ctx.fill(); ctx.strokeStyle = corBorda; ctx.stroke();
    ctx.fillStyle = corBorda; ctx.fillRect(cx - 8, chao - 66, 16, 4);
    // brilho do tecido
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.beginPath(); ctx.moveTo(cx - 3, chao - 60); ctx.quadraticCurveTo(cx - 8, chao - 30, cx - 14, chao - 6); ctx.lineTo(cx - 9, chao - 6); ctx.quadraticCurveTo(cx - 4, chao - 30, cx - 1, chao - 60); ctx.closePath(); ctx.fill();
    // pescoço e cabeça
    ctx.fillStyle = "#efe0d2";
    ctx.fillRect(cx - 2.5, chao - 91, 5, 8);
    elipse(ctx, cx, chao - 98, 7, 9); ctx.fill();
    // colar de pérolas
    ctx.fillStyle = "#fff";
    for (let k = -2; k <= 2; k++) { elipse(ctx, cx + k * 2.4, chao - 85 + Math.abs(k) * 0.9, 1.1, 1.1); ctx.fill(); }
  }

  function lojaBoutique(w) {
    const H = ALT_LOJA;
    ctx.fillStyle = "#241d2b"; ctx.fillRect(0, -H, w, H);
    ctx.fillStyle = "#d4a94c"; ctx.fillRect(0, -H, w, 3); ctx.fillRect(0, -H + 46, w, 3);
    ctx.fillStyle = "#d4a94c";
    ctx.font = "600 34px Caveat, cursive"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Boutique", w / 2, -H + 21);
    ctx.font = "600 8px Fredoka, sans-serif";
    ctx.fillText("M O D A   ·   E L E G Â N C I A", w / 2, -H + 38);
    // vitrine
    const vx = 14, vy = -H + 58, vw = w - 98, vh = H - 58 - 16;
    const fundo = ctx.createLinearGradient(0, vy, 0, vy + vh);
    fundo.addColorStop(0, "#fbf0e4"); fundo.addColorStop(1, "#f0d8c0");
    ctx.fillStyle = fundo; ctx.fillRect(vx, vy, vw, vh);
    ctx.fillStyle = "#e3cbb2"; ctx.fillRect(vx, vy + vh - 14, vw, 14);
    ctx.strokeStyle = "#d4a94c"; ctx.lineWidth = 3; ctx.strokeRect(vx, vy, vw, vh);
    // luzes de teto
    for (let k = 0; k < 5; k++) {
      const lx = vx + 40 + k * ((vw - 80) / 4);
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.beginPath(); ctx.moveTo(lx - 4, vy); ctx.lineTo(lx + 4, vy); ctx.lineTo(lx + 22, vy + vh - 14); ctx.lineTo(lx - 22, vy + vh - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fffbe8"; elipse(ctx, lx, vy + 3, 5, 2.5); ctx.fill();
    }
    const chao = vy + vh - 14;
    // manequins com vestidos
    manequimVestido(vx + 52, chao, "#c0356b", "#7a1b44");
    manequimVestido(vx + 130, chao, "#2c4f9e", "#18306a");
    manequimVestido(vx + 208, chao, "#e8c14a", "#a6821a");
    // pedestais com saltos altos
    const px = vx + 262;
    for (const [dx, alt, cor] of [[0, 20, "#d6203c"], [48, 36, "#ff8fb8"], [96, 20, "#e6c46a"]]) {
      if (px + dx + 40 > vx + vw) continue;
      caminhoRetArred(ctx, px + dx - 4, chao - alt, 38, alt, 3);
      ctx.fillStyle = "#f3ece4"; ctx.fill(); ctx.strokeStyle = "#cdbba8"; ctx.lineWidth = 1; ctx.stroke();
      salto(px + dx, chao - alt, cor, 1.15);
    }
    // prateleira de sapatos ao fundo
    ctx.fillStyle = "#d9c3aa"; ctx.fillRect(vx + 8, vy + 22, vw - 16, 3);
    ["#d6203c", "#ff8fb8", "#2c4f9e", "#e6c46a", "#7a1b44", "#d6203c", "#ff8fb8", "#2c4f9e"].forEach((c, i) => {
      const sx = vx + 14 + i * ((vw - 60) / 7);
      if (sx + 28 < vx + vw) salto(sx, vy + 22, c, 0.8);
    });
    portaVidro(w - 76, "#d4a94c", "rgba(111,90,127,.75)");
  }

  function lojaPerfumaria(w) {
    const H = ALT_LOJA;
    ctx.fillStyle = "#f3c6d3"; ctx.fillRect(0, -H, w, H);
    ctx.fillStyle = "#e79ab4"; ctx.fillRect(0, -H, w, 46);
    ctx.fillStyle = "#fff"; ctx.font = "700 22px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Perfumaria", w / 2, -H + 24);
    const vx = 12, vy = -H + 58, vw = w - 90, vh = H - 58 - 14;
    ctx.fillStyle = "#fff6f8"; ctx.fillRect(vx, vy, vw, vh);
    ctx.strokeStyle = "#e79ab4"; ctx.lineWidth = 3; ctx.strokeRect(vx, vy, vw, vh);
    const cores = ["#ff8fb8", "#8fd3ff", "#ffd23f", "#b48bff", "#7be08f"];
    for (let r = 0; r < 3; r++) {
      const sy = vy + 38 + r * 38;
      ctx.fillStyle = "#e6c1cc"; ctx.fillRect(vx + 4, sy, vw - 8, 3);
      for (let k = 0; k < 4; k++) {
        const bx = vx + 14 + k * ((vw - 40) / 3), cor = cores[(r * 2 + k) % 5];
        caminhoRetArred(ctx, bx, sy - 22, 14, 22, 4); ctx.fillStyle = cor; ctx.fill();
        ctx.fillStyle = "#e6c46a"; ctx.fillRect(bx + 4, sy - 28, 6, 6);
        ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(bx + 2, sy - 19, 3, 14);
      }
    }
    coracao(ctx, vx + vw / 2, vy + 24, 20, "#ff4d88");
    portaVidro(w - 66, "#e79ab4", "rgba(255,200,215,.6)");
  }

  function lojaJoalheria(w) {
    const H = ALT_LOJA;
    ctx.fillStyle = "#1d2f5a"; ctx.fillRect(0, -H, w, H);
    ctx.fillStyle = "#12204a"; ctx.fillRect(0, -H, w, 46);
    ctx.fillStyle = "#e6c46a"; ctx.font = "600 34px Caveat, cursive"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Joias", w / 2, -H + 24);
    const vx = 12, vy = -H + 58, vw = w - 90, vh = H - 58 - 14;
    ctx.fillStyle = "#241a30"; ctx.fillRect(vx, vy, vw, vh);
    ctx.strokeStyle = "#e6c46a"; ctx.lineWidth = 3; ctx.strokeRect(vx, vy, vw, vh);
    // colares
    for (let k = 0; k < 2; k++) {
      const cx = vx + vw * (0.28 + k * 0.44);
      ctx.strokeStyle = "#e6c46a"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, vy + 14, 30, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.fillStyle = k ? "#ff4d88" : "#5bbcf5";
      elipse(ctx, cx, vy + 14 + 30 * Math.sin(0.5 * Math.PI), 6, 8); ctx.fill();
      ctx.fillStyle = "#fff";
      for (let g = -3; g <= 3; g++) { const a = 0.5 * Math.PI + g * 0.16; elipse(ctx, cx + Math.cos(a) * 30, vy + 14 + Math.sin(a) * 30, 1.8, 1.8); ctx.fill(); }
    }
    // anéis em almofadinhas
    for (let k = 0; k < 3; k++) {
      const rx = vx + 26 + k * ((vw - 52) / 2), ry = vy + vh - 18;
      caminhoRetArred(ctx, rx - 14, ry, 28, 16, 5); ctx.fillStyle = "#5a2a6e"; ctx.fill();
      ctx.strokeStyle = "#e6c46a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(rx, ry - 2, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = ["#7df0ff", "#ff4d88", "#fff"][k]; elipse(ctx, rx, ry - 9, 3.2, 3.2); ctx.fill();
    }
    // brilhinhos
    ctx.fillStyle = "#fff";
    for (let k = 0; k < 8; k++) {
      const sx = vx + 10 + rnd(k + 7) * (vw - 20), sy = vy + 8 + rnd(k + 17) * (vh - 30), r = 2 + rnd(k + 27) * 2.6;
      ctx.beginPath(); ctx.moveTo(sx, sy - r); ctx.lineTo(sx + r * 0.3, sy - r * 0.3); ctx.lineTo(sx + r, sy); ctx.lineTo(sx + r * 0.3, sy + r * 0.3);
      ctx.lineTo(sx, sy + r); ctx.lineTo(sx - r * 0.3, sy + r * 0.3); ctx.lineTo(sx - r, sy); ctx.lineTo(sx - r * 0.3, sy - r * 0.3); ctx.closePath(); ctx.fill();
    }
    portaVidro(w - 66, "#e6c46a", "rgba(40,60,110,.7)");
  }

  function desenharLojas() {
    for (const l of FASE.lojas) {
      if (l.x + l.w < cam.x - 40 || l.x > cam.x + viewW + 40) continue;
      const alfa = mistura4(l.x + l.w / 2);
      if (alfa < 0.05) continue;
      ctx.globalAlpha = Math.min(1, alfa * 1.5);
      const fn = l.tipo === "boutique" ? lojaBoutique : l.tipo === "perfumaria" ? lojaPerfumaria : lojaJoalheria;
      estatico("loja-" + l.tipo, l.x, FASE.chao, l.w, ALT_LOJA, () => fn(l.w));
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------------
  //  ENTRADA DO SHOPPING (portas de vidro que abrem quando a Kitty chega perto)
  // ---------------------------------------------------------------------
  function entradaShoppingFixa(w, h) {
    ctx.fillStyle = "#dfe6ee"; ctx.fillRect(0, -h, w, h);
    // vidros em grade
    ctx.fillStyle = "#b9d6e6"; ctx.fillRect(20, -h + 52, w - 40, h - 52);
    ctx.strokeStyle = "#8fa6b8"; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 20; x <= w - 20; x += 40) { ctx.moveTo(x, -h + 52); ctx.lineTo(x, 0); }
    for (let y = -h + 52; y <= 0; y += 42) { ctx.moveTo(20, y); ctx.lineTo(w - 20, y); }
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.beginPath(); ctx.moveTo(60, -h + 52); ctx.lineTo(120, -h + 52); ctx.lineTo(70, 0); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w - 130, -h + 52); ctx.lineTo(w - 90, -h + 52); ctx.lineTo(w - 140, 0); ctx.lineTo(w - 180, 0); ctx.closePath(); ctx.fill();
    // pilares laterais
    ctx.fillStyle = "#e8e2da"; ctx.fillRect(0, -h, 20, h); ctx.fillRect(w - 20, -h, 20, h);
    // letreiro
    caminhoRetArred(ctx, 28, -h + 6, w - 56, 38, 8);
    ctx.fillStyle = "#1f2f55"; ctx.fill();
    ctx.strokeStyle = "#e6c46a"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = "#f6d37a"; ctx.font = "700 22px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(CONFIG.nomeShopping || "Shopping", w / 2, -h + 26);
    // marquise sobre as portas
    ctx.fillStyle = "#2d3a52"; ctx.fillRect(w / 2 - 78, -132, 156, 12);
    ctx.fillStyle = "#e6c46a"; ctx.fillRect(w / 2 - 78, -121, 156, 3);
    // batentes das portas
    ctx.fillStyle = "#8f9fb0"; ctx.fillRect(w / 2 - 60, -122, 6, 122); ctx.fillRect(w / 2 + 54, -122, 6, 122);
  }

  function desenharEntradaShopping() {
    const x = FASE.shopping.entrada, y = FASE.chao, W = 380, H = 252;
    const alfa = mistura3(x);
    if (alfa < 0.04) return;
    ctx.globalAlpha = Math.min(1, alfa * 1.4);
    estatico("entrada-shopping", x - W / 2, y, W, H, () => entradaShoppingFixa(W, H));
    // por dentro das portas: o corredor (claro e quentinho)
    const px = x - 54;
    ctx.fillStyle = "#f6e9da"; ctx.fillRect(px, y - 116, 108, 116);
    const luz = ctx.createLinearGradient(0, y - 116, 0, y);
    luz.addColorStop(0, "#fff4e0"); luz.addColorStop(1, "#f0d8c0");
    ctx.fillStyle = luz; ctx.fillRect(px, y - 116, 108, 116);
    ctx.fillStyle = "#e3cfb6"; ctx.fillRect(px, y - 14, 108, 14);
    // as portas de correr (abrem quando a Kitty chega perto)
    const ab = clamp01(1 - Math.abs(kitty.x - x) / 150);
    for (const lado of [-1, 1]) {
      const gx = lado < 0 ? px - ab * 54 : px + 54 + ab * 54;
      ctx.fillStyle = "rgba(150,205,228,.5)"; ctx.fillRect(gx, y - 116, 54, 116);
      ctx.strokeStyle = "#7e8da0"; ctx.lineWidth = 2; ctx.strokeRect(gx, y - 116, 54, 116);
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.beginPath(); ctx.moveTo(gx + 8, y - 116); ctx.lineTo(gx + 22, y - 116); ctx.lineTo(gx + 8, y - 70); ctx.closePath(); ctx.fill();
    }
    // vasos e luminárias ao lado
    for (const dx of [-W / 2 - 30, W / 2 + 30]) {
      caminhoRetArred(ctx, x + dx - 14, y - 26, 28, 26, 4); ctx.fillStyle = "#9b6b4a"; ctx.fill();
      ctx.fillStyle = "#6ea060";
      for (const [lx, ly, rx, ry] of [[0, -44, 14, 18], [-9, -36, 8, 12], [9, -36, 8, 12]]) { elipse(ctx, x + dx + lx, y + ly, rx, ry); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------------
  //  ARCADE: entrada neon e as máquinas de pegar ursinho
  // ---------------------------------------------------------------------
  function neonTexto(txt, x, y, tam, cor) {
    ctx.save();
    ctx.font = `700 ${tam}px Fredoka, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    for (const [lw, al] of [[tam * 0.38, 0.14], [tam * 0.2, 0.3]]) {
      ctx.globalAlpha = al; ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.strokeText(txt, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff"; ctx.fillText(txt, x, y);
    ctx.globalAlpha = 0.55; ctx.fillStyle = cor; ctx.fillText(txt, x, y);
    ctx.restore();
  }

  function arcadeFachada(w, h) {
    ctx.fillStyle = "#1a0f33"; ctx.fillRect(0, -h, w, h);
    ctx.fillStyle = "#2b1650"; ctx.fillRect(0, -h, w, 8);
    // moldura neon rosa
    ctx.lineCap = "round";
    for (const [lw, al] of [[10, 0.14], [5, 0.3], [2.2, 1]]) {
      ctx.globalAlpha = al; ctx.strokeStyle = "#ff4fd8"; ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(30, 0); ctx.lineTo(30, -150); ctx.quadraticCurveTo(30, -h + 56, w / 2, -h + 56); ctx.quadraticCurveTo(w - 30, -h + 56, w - 30, -150); ctx.lineTo(w - 30, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // entrada escura e quentinha
    ctx.beginPath();
    ctx.moveTo(36, 0); ctx.lineTo(36, -150); ctx.quadraticCurveTo(36, -h + 62, w / 2, -h + 62); ctx.quadraticCurveTo(w - 36, -h + 62, w - 36, -150); ctx.lineTo(w - 36, 0); ctx.closePath();
    const luz = ctx.createLinearGradient(0, -h, 0, 0);
    luz.addColorStop(0, "#3b1d6e"); luz.addColorStop(1, "#7a2f9e");
    ctx.fillStyle = luz; ctx.fill();
    // letreiro neon
    neonTexto("URSINHOS", w / 2, -h + 26, 24, "#37e6ff");
    neonTexto("ARCADE", w / 2, -h + 46, 14, "#ff4fd8");
    // capivarinha mascote na entrada
    desenharCapivara(w / 2, -4, 1.05);
    // coração neon
    coracao(ctx, w / 2 + 52, -108, 22, "#ff4fd8");
    coracao(ctx, w / 2 + 52, -108, 14, "#ffd1f2");
  }

  const CORES_MAQ = ["#37c6e8", "#ffb347", "#7be08f", "#b48bff", "#ff6fa8"];
  const TEXTOS_MAQ = ["URSINHOS", "PELÚCIAS", "GARRA", "FOFURAS"];

  function corpoMaquina(w, h, cor, texto, sem, especial) {
    ctx.lineJoin = "round";
    caminhoRetArred(ctx, 2, -h + 4, w - 4, h - 6, 10);
    ctx.fillStyle = cor; ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = "#2b1a22"; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.fillRect(6, -h + 8, 4, h - 18); ctx.fillRect(w - 10, -h + 8, 4, h - 18);
    // letreiro
    caminhoRetArred(ctx, 8, -h + 9, w - 16, 22, 6); ctx.fillStyle = "#2b1a3a"; ctx.fill();
    ctx.fillStyle = "#fff3a8"; ctx.font = `700 ${especial ? 11 : 10}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(texto, w / 2, -h + 20);
    // vidro com pelúcias dentro
    const gx = 8, gy = -h + 36, gw = w - 16, gh = Math.round(h * 0.5);
    const fundo = ctx.createLinearGradient(0, gy, 0, gy + gh);
    fundo.addColorStop(0, "#4a2a7a"); fundo.addColorStop(1, "#2a1650");
    ctx.fillStyle = fundo; ctx.fillRect(gx, gy, gw, gh);
    const tipos = ["urso", "coelho", "gato", "pato"], cores = ["#f4a6c0", "#8fd3ff", "#ffd23f", "#b9f0a8", "#ffb8e8", "#ffcf8a"];
    const r = Math.max(8, gw * 0.12);
    for (let i = 0; i < 8; i++) {
      const px = gx + r + (i % 4) * ((gw - 2 * r) / 3) + (Math.floor(i / 4) ? (gw - 2 * r) / 6 : 0);
      const py = gy + gh - r - 2 - Math.floor(i / 4) * r * 1.3;
      if (px + r > gx + gw) continue;
      pelucia(px, py, r, cores[(i + sem) % 6], tipos[(i + sem) % 4]);
    }
    // trilho da garra
    ctx.fillStyle = "#8d8aa0"; ctx.fillRect(gx, gy + 3, gw, 4);
    // reflexo do vidro
    ctx.fillStyle = "rgba(255,255,255,.1)";
    ctx.beginPath(); ctx.moveTo(gx + 6, gy); ctx.lineTo(gx + 26, gy); ctx.lineTo(gx + 8, gy + gh); ctx.lineTo(gx - 6, gy + gh); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = "#2b1a22"; ctx.strokeRect(gx, gy, gw, gh);
    // painel com joystick e botão
    const py = gy + gh + 4;
    ctx.fillStyle = "#d9d9e6"; ctx.fillRect(6, py, w - 12, h - 10 - (py + h));
    ctx.fillStyle = "#d9d9e6"; ctx.fillRect(6, py, w - 12, 22);
    ctx.fillStyle = "#555"; ctx.fillRect(w * 0.3 - 1.5, py + 3, 3, 12);
    elipse(ctx, w * 0.3, py + 3, 5, 5); ctx.fillStyle = "#e0262f"; ctx.fill();
    elipse(ctx, w * 0.68, py + 12, 7, 7); ctx.fillStyle = "#ffd23f"; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
    // calha do prêmio
    caminhoRetArred(ctx, 10, -22, w * 0.4, 14, 4); ctx.fillStyle = "#1a0f33"; ctx.fill();
    ctx.fillStyle = "#2b1a3a"; ctx.fillRect(0, -9, w, 9);
  }

  // as máquinas do arcade (garra balançando por dentro; a da capivara brilha e chama atenção)
  function desenharMaquinas() {
    const A = FASE.arcade;
    const lista = A.maquinas.map((x, i) => ({ x, i, especial: false })).concat([{ x: A.capivara, i: 9, especial: true }]);
    for (const m of lista) {
      const w = m.especial ? 104 : 78, h = m.especial ? 178 : 150;
      const x0 = m.x - w / 2;
      if (x0 + w < cam.x - 60 || x0 > cam.x + viewW + 60) continue;
      const alfa = mistura5(m.x);
      if (alfa < 0.04) continue;
      ctx.globalAlpha = Math.min(1, alfa * 1.4);
      const y = FASE.chao;
      if (m.especial) {
        // brilho rosa e raios atrás da máquina da capivara
        const pulso = 0.5 + 0.5 * Math.sin(tempo * 3);
        const g = ctx.createRadialGradient(m.x, y - 90, 10, m.x, y - 90, 120);
        g.addColorStop(0, `rgba(255,110,200,${0.45 + pulso * 0.2})`);
        g.addColorStop(1, "rgba(255,110,200,0)");
        ctx.fillStyle = g; ctx.fillRect(m.x - 130, y - 220, 260, 240);
      }
      const cor = m.especial ? "#ff5fa2" : CORES_MAQ[m.i % 5];
      estatico(`maquina-${m.i}-${m.especial ? 1 : 0}`, x0, y, w, h, () => corpoMaquina(w, h, cor, m.especial ? "★ CAPIVARA ★" : TEXTOS_MAQ[m.i % 4], m.i, m.especial));
      // por dentro do vidro: a garra passeando e (na especial) a capivara
      const gx = x0 + 8, gy = y - h + 36, gw = w - 16, gh = Math.round(h * 0.5);
      ctx.save();
      ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
      if (m.especial) desenharCapivara(gx + gw * 0.6, gy + gh - 2, 0.78, Math.sin(tempo * 4) * 1.2);
      const cx = gx + gw * (0.5 + 0.34 * Math.sin(tempo * 0.7 + m.i)), cy = gy + 18 + 6 * Math.sin(tempo * 1.4 + m.i);
      ctx.strokeStyle = "#cfd3dc"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx, gy + 5); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.fillStyle = "#9aa0b0"; ctx.fillRect(cx - 5, cy - 2, 10, 6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const s of [-1, 1]) { ctx.moveTo(cx + s * 4, cy + 3); ctx.lineTo(cx + s * 10, cy + 12); ctx.lineTo(cx + s * 6, cy + 18); }
      ctx.stroke();
      ctx.restore();
      if (m.especial) {
        // corações subindo e estrelinhas
        for (let k = 0; k < 4; k++) {
          const f = (tempo * 0.45 + k / 4) % 1;
          ctx.globalAlpha = (1 - f) * 0.9;
          coracao(ctx, m.x + Math.sin(k * 2 + f * 3) * 34, y - h - 6 - f * 46, 10 + k % 2 * 3, "#ff4d88");
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  function desenharArcadeEntrada() {
    const x = FASE.arcade.porta, y = FASE.chao, W = 240, H = 240;
    if (x + W / 2 < cam.x - 40 || x - W / 2 > cam.x + viewW + 40) return;
    estatico("arcade-fachada", x - W / 2, y, W, H, () => arcadeFachada(W, H));
  }

  // =====================================================================
  //  MINIGAME: a GARRA (pegar a capivara com o coração)
  // =====================================================================
  const garra = { fase: "mover", u: 0.3, v: 0.06, abre: 1, item: null, t: 0, msg: "", msgT: 0, tent: 0, dica: true, fim: false, caiu: null, escorregou: false, capU: 0.64, capV: 1 };
  const ITENS_GARRA = [
    { u: 0.08, row: 0, tipo: "urso", cor: "#f4a6c0" }, { u: 0.2, row: 0, tipo: "coelho", cor: "#8fd3ff" }, { u: 0.33, row: 0, tipo: "gato", cor: "#ffd23f" },
    { u: 0.46, row: 0, tipo: "pato", cor: "#fff08a" }, { u: 0.81, row: 0, tipo: "urso", cor: "#b9f0a8" }, { u: 0.92, row: 0, tipo: "coelho", cor: "#ffb8e8" },
    { u: 0.14, row: 1, tipo: "pato", cor: "#ffd9a0" }, { u: 0.4, row: 1, tipo: "urso", cor: "#cdb8ff" }, { u: 0.87, row: 1, tipo: "gato", cor: "#8fe0d0" },
  ];

  function geoGarra() {
    const mw = Math.min(viewW * 0.94, 360), mh = Math.min(viewH * 0.94, 520);
    const mx = (viewW - mw) / 2, my = (viewH - mh) / 2;
    const gx = mx + mw * 0.07, gy = my + mh * 0.17, gw = mw * 0.86, gh = mh * 0.5;
    return { mw, mh, mx, my, gx, gy, gw, gh, trilho: gy + 10, chaoV: gy + gh, r: gw * 0.085 };
  }

  function iniciarGarra() {
    estado = "indo-garra";
    segurandoChurros = false;
    entrada.esq = entrada.dir = false;
    kitty.vx = 0;
    fadeAte(1, entrarGarra);
  }

  function entrarGarra() {
    Object.assign(garra, { fase: "mover", u: 0.3, v: 0.06, abre: 1, item: null, t: 0, msg: "", msgT: 0, tent: 0, dica: true, fim: false, caiu: null, escorregou: false, capU: 0.64, capV: 1 });
    estado = "garra";
    particulas.length = 0;
    fadeAte(0);
  }

  function mensagemGarra(txt, seg = 1.5) { garra.msg = txt; garra.msgT = seg; }

  function atualizarGarra(dt) {
    const g = garra;
    g.t += dt;
    bufferPulo -= dt;
    if (g.msgT > 0) g.msgT -= dt;
    const mov = (entrada.dir ? 1 : 0) - (entrada.esq ? 1 : 0);
    switch (g.fase) {
      case "mover":
        g.u = Math.max(0.08, Math.min(0.92, g.u + mov * 0.34 * dt));
        if (mov) g.dica = false;
        if (bufferPulo > 0) { bufferPulo = 0; g.dica = false; g.tent++; g.fase = "desce"; g.t = 0; }
        break;
      case "desce":
        g.v += 0.62 * dt;
        if (g.v >= 0.78) { g.v = 0.78; g.fase = "fecha"; g.t = 0; }
        break;
      case "fecha": {
        g.abre = Math.max(0, g.abre - 3.2 * dt);
        if (g.abre <= 0.02) {
          // o que a garra pegou? (a capivara é generosa: quem chega perto, pega)
          const G = geoGarra();
          const dCap = Math.abs(g.u - g.capU) * G.gw;
          if (dCap < G.gw * 0.12) g.item = "capy";
          else if (ITENS_GARRA.some((it) => Math.abs(it.u - g.u) * G.gw < G.gw * 0.07)) g.item = "outro";
          else g.item = null;
          g.fase = "sobe"; g.t = 0; g.escorregou = false;
        }
        break;
      }
      case "sobe":
        g.v -= 0.5 * dt;
        if (g.item === "outro" && g.v < 0.5 && !g.escorregou) {
          g.escorregou = true; g.item = null; g.caiu = { u: g.u, v: g.v, t: 0 };
          mensagemGarra(CONFIG.garraEscorregou, 1.4);
        }
        if (g.v <= 0.06) {
          g.v = 0.06;
          if (g.item === "capy") g.fase = "leva";
          else { if (g.msgT <= 0) mensagemGarra(CONFIG.garraQuase, 1.4); g.fase = "espera"; g.t = 0; }
        }
        break;
      case "espera":
        if (g.t > 1.4) { g.abre = 1; g.fase = "mover"; g.caiu = null; }
        break;
      case "leva":
        g.u = Math.max(0.13, g.u - 0.32 * dt);
        if (g.u <= 0.135) { g.fase = "solta"; g.t = 0; }
        break;
      case "solta":
        g.abre = Math.min(1, g.abre + 3 * dt);
        if (g.t > 1.0) { g.fase = "ganhou"; g.t = 0; garraGanha = true; mensagemGarra(CONFIG.garraGanhou, 5); }
        break;
      case "ganhou":
        if (Math.random() < dt * 9) {
          const G = geoGarra();
          coracaoSubindo(G.gx + Math.random() * G.gw, G.gy + G.gh * (0.4 + Math.random() * 0.5));
        }
        if (g.t > 4.2 && !g.fim) { g.fim = true; cb.onFimFase && cb.onFimFase(); }
        break;
    }
    if (g.caiu) { g.caiu.t += dt; }
  }

  function desenharGarraMecanica(x, yTrilho, yGarra, abre) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#cfd3dc"; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x, yTrilho); ctx.lineTo(x, yGarra - 6); ctx.stroke();
    caminhoRetArred(ctx, x - 9, yGarra - 8, 18, 11, 3);
    ctx.fillStyle = "#9aa0b0"; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = "#2b1a22"; ctx.stroke();
    for (const s of [-1, 1]) {
      const ponta1 = [x + s * (8 + 16 * abre), yGarra + 16], ponta2 = [x + s * (5 + 4 * abre), yGarra + 32];
      ctx.beginPath(); ctx.moveTo(x + s * 6, yGarra + 2); ctx.lineTo(ponta1[0], ponta1[1]); ctx.lineTo(ponta2[0], ponta2[1]);
      ctx.strokeStyle = "#2b1a22"; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = "#dfe3ec"; ctx.lineWidth = 3.6; ctx.stroke();
    }
    ctx.restore();
  }

  function cenaGarra() {
    const G = geoGarra(), g = garra;
    // fundo do arcade, escuro e neon
    const bg = ctx.createLinearGradient(0, 0, 0, viewH);
    bg.addColorStop(0, "#140a2a"); bg.addColorStop(1, "#2b1650");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, viewW, viewH);
    ctx.lineCap = "round";
    for (const [yy, cor] of [[viewH * 0.16, "#37e6ff"], [viewH * 0.24, "#ff4fd8"]]) {
      for (const [lw, al] of [[10, 0.12], [5, 0.25], [2, 1]]) { ctx.globalAlpha = al; ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(viewW, yy); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // o gabinete
    caminhoRetArred(ctx, G.mx, G.my, G.mw, G.mh, 24);
    ctx.fillStyle = "#ff5fa2"; ctx.fill(); ctx.lineWidth = 3.2; ctx.strokeStyle = "#2b1a22"; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.fillRect(G.mx + 8, G.my + 14, 6, G.mh - 28); ctx.fillRect(G.mx + G.mw - 14, G.my + 14, 6, G.mh - 28);
    // letreiro piscando
    caminhoRetArred(ctx, G.mx + G.mw * 0.08, G.my + G.mh * 0.035, G.mw * 0.84, G.mh * 0.1, 12);
    ctx.fillStyle = "#2b1a3a"; ctx.fill();
    for (let k = 0; k < 12; k++) {
      ctx.fillStyle = (Math.floor(tempo * 3) + k) % 2 ? "#ffe9a8" : "#ff8ad8";
      elipse(ctx, G.mx + G.mw * 0.1 + k * (G.mw * 0.8 / 11), G.my + G.mh * 0.042, 2.4, 2.4); ctx.fill();
    }
    ctx.fillStyle = "#fff3a8"; ctx.font = `700 ${Math.max(13, G.mh * 0.055)}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("★ " + (CONFIG.textoMaquina || "CAPIVARA") + " ★", G.mx + G.mw / 2, G.my + G.mh * 0.095);

    // o vidro e o que tem dentro
    const vidro = ctx.createLinearGradient(0, G.gy, 0, G.gy + G.gh);
    vidro.addColorStop(0, "#4a2a7a"); vidro.addColorStop(1, "#2a1650");
    ctx.fillStyle = vidro; ctx.fillRect(G.gx, G.gy, G.gw, G.gh);
    ctx.save();
    ctx.beginPath(); ctx.rect(G.gx, G.gy, G.gw, G.gh); ctx.clip();
    // pelúcias no fundo (só as "outras")
    for (const it of ITENS_GARRA) {
      pelucia(G.gx + it.u * G.gw, G.chaoV - G.r - 2 - it.row * G.r * 1.25, G.r, it.cor, it.tipo);
    }
    // a capivara (parada no fundo, ou presa na garra, ou caindo na calha)
    const escCap = (G.r * 2.6) / 64;
    const capX = G.gx + (g.item === "capy" || g.fase === "solta" || g.fase === "ganhou" ? g.u : g.capU) * G.gw;
    if (g.fase === "mover" || g.fase === "desce" || g.fase === "fecha" || g.fase === "espera" || (g.fase === "sobe" && g.item !== "capy")) {
      desenharCapivara(G.gx + g.capU * G.gw, G.chaoV - 2, escCap, Math.sin(tempo * 4) * 1.2);
    } else if (g.fase === "sobe" || g.fase === "leva") {
      desenharCapivara(capX, G.trilho + g.v * (G.gh - 14) + 54 * escCap * 0.6 + 30, escCap * 0.9, 0);
    } else if (g.fase === "solta") {
      const q = clamp01(g.t / 0.8);
      desenharCapivara(capX, G.trilho + g.v * (G.gh - 14) + 30 + (G.chaoV - 2 - (G.trilho + g.v * (G.gh - 14) + 30)) * q * q, escCap * 0.9, 0);
    }
    // pelúcia que escorregou e cai de volta
    if (g.caiu) {
      const t = g.caiu.t;
      pelucia(G.gx + g.caiu.u * G.gw, Math.min(G.chaoV - G.r, G.trilho + g.caiu.v * (G.gh - 14) + 40 + t * t * 260), G.r * 0.9, "#ffd9a0", "urso");
    }
    // trilho e garra
    ctx.fillStyle = "#8d8aa0"; ctx.fillRect(G.gx, G.trilho - 6, G.gw, 6);
    desenharGarraMecanica(G.gx + g.u * G.gw, G.trilho, G.trilho + g.v * (G.gh - 14), g.abre);
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.beginPath(); ctx.moveTo(G.gx + 14, G.gy); ctx.lineTo(G.gx + 54, G.gy); ctx.lineTo(G.gx + 20, G.gy + G.gh); ctx.lineTo(G.gx - 10, G.gy + G.gh); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#2b1a22"; ctx.strokeRect(G.gx, G.gy, G.gw, G.gh);

    // painel de controle e a calha do prêmio
    const py = G.gy + G.gh + 8;
    caminhoRetArred(ctx, G.mx + 14, py, G.mw * 0.34, G.mh * 0.11, 8);
    ctx.fillStyle = "#1a0f33"; ctx.fill(); ctx.strokeStyle = "#2b1a22"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#d9d9e6"; ctx.fillRect(G.mx + G.mw * 0.42, py, G.mw * 0.46, G.mh * 0.11);
    ctx.fillStyle = "#555"; ctx.fillRect(G.mx + G.mw * 0.52 - 2, py + 6, 4, G.mh * 0.05);
    elipse(ctx, G.mx + G.mw * 0.52, py + 6, 8, 8); ctx.fillStyle = "#e0262f"; ctx.fill();
    elipse(ctx, G.mx + G.mw * 0.78, py + G.mh * 0.055, 12, 12); ctx.fillStyle = (g.fase === "mover" && Math.floor(tempo * 3) % 2) ? "#fff08a" : "#ffd23f"; ctx.fill(); ctx.strokeStyle = "#2b1a22"; ctx.stroke();

    // dica / mensagem
    if (g.dica && g.fase === "mover") textoGrande(CONFIG.garraDica, viewW / 2, G.my - 4 < 26 ? 26 : G.my - 4, 14);
    if (g.msgT > 0 && g.msg) textoGrande(g.msg, viewW / 2, G.gy + G.gh * 0.5, g.fase === "ganhou" ? 20 : 17, "#fff", g.fase === "ganhou" ? "#ff4d88" : "#7c4dff");
    // comemoração: a capivara cresce no meio da tela
    if (g.fase === "ganhou") {
      const q = easeOutBack(clamp01(g.t / 0.7));
      ctx.fillStyle = `rgba(20,10,42,${0.55 * clamp01(g.t / 0.5)})`;
      ctx.fillRect(0, 0, viewW, viewH);
      const gl = ctx.createRadialGradient(viewW / 2, viewH * 0.55, 10, viewW / 2, viewH * 0.55, 150);
      gl.addColorStop(0, "rgba(255,150,220,.55)"); gl.addColorStop(1, "rgba(255,150,220,0)");
      ctx.fillStyle = gl; ctx.fillRect(0, 0, viewW, viewH);
      desenharCapivara(viewW / 2, viewH * 0.62, Math.max(0.01, q) * 3.4, Math.sin(tempo * 4) * 2);
      if (g.msgT > 0) textoGrande(CONFIG.garraGanhou, viewW / 2, viewH * 0.16, 18, "#fff", "#ff4d88");
    }
    desenharParticulas();
  }


  // =====================================================================
  //  DESENHO
  // =====================================================================
  function desenhar() {
    if (!canvas.width) return;
    ctx.setTransform(dpr * escala, 0, 0, dpr * escala, 0, 0);

    const rampaAtiva = naRampa();
    const camX = rampaAtiva ? CAM_RAMPA : cam.x;
    const cxv = camX + viewW / 2;
    const t = mistura(cxv), u = mistura2(cxv), v = mistura3(cxv), z = mistura4(cxv), a5 = mistura5(cxv);

    if (estado === "garra") {
      cenaGarra();
    } else {
      fundo(camX, t, u, v, z, a5);
      if (rampaAtiva) cenaRampa();
      else mundo(t);
    }

    if (fade > 0) {
      ctx.fillStyle = `rgba(255,255,255,${fade})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  // ---------- fundo (céu + camadas com parallax) ----------
  // t = parque aquático, u = rua do condomínio, v = praça do shopping, z = corredor do shopping, a = arcade
  // (cada um vai de 0 a 1 conforme a Kitty avança: é isso que faz a transição ser leve)
  function fundo(camX, t, u, v, z, a) {
    const chaoTela = FASE.chao - cam.y;
    const T = (c0, c1, c2, c3, c4, c5) => mix(mix(mix(mix(mix(c0, c1, t), c2, u), c3, v), c4, z), c5, a);

    const ceu = ctx.createLinearGradient(0, 0, 0, viewH);
    ceu.addColorStop(0, T("#ffd9ea", "#5fc3ff", "#ffd2a6", "#6f86d6", "#f6e9da", "#140a2a"));
    ceu.addColorStop(1, T("#fff3f8", "#e6f8ff", "#fff0dc", "#ffcfa0", "#f6e9da", "#2b1650"));
    ctx.fillStyle = ceu;
    ctx.fillRect(0, 0, viewW, viewH);

    // solzinho de fim de tarde (aparece na rua e some na praça)
    const solA = u * (1 - v);
    if (solA > 0.05) {
      const sx = viewW * 0.78, sy = chaoTela - 190;
      const brilho = ctx.createRadialGradient(sx, sy, 6, sx, sy, 110);
      brilho.addColorStop(0, `rgba(255,226,170,${0.75 * solA})`);
      brilho.addColorStop(1, "rgba(255,226,170,0)");
      ctx.fillStyle = brilho;
      ctx.fillRect(sx - 110, sy - 110, 220, 220);
      ctx.fillStyle = `rgba(255,236,190,${0.9 * solA})`;
      elipse(ctx, sx, sy, 20, 20);
      ctx.fill();
    }
    // estrelinhas do começo da noite (praça)
    const estA = v * (1 - z);
    if (estA > 0.05) {
      ctx.fillStyle = `rgba(255,255,255,${0.8 * estA})`;
      for (let i = 0; i < 14; i++) {
        const sx = ((i * 97 + 40) % (viewW + 40)) - 10, sy = (i * 53 + 20) % (chaoTela * 0.5);
        elipse(ctx, sx, sy, 1.4 + (i % 3) * 0.4, 1.4 + (i % 3) * 0.4);
        ctx.fill();
      }
    }

    // nuvens (some quando está lá dentro)
    if (z < 0.95) {
      for (const [vel, alt, esp, alfa] of [[0.08, 420, 300, 0.6], [0.15, 280, 240, 0.85]]) {
        ctx.fillStyle = `rgba(255,255,255,${alfa * (1 - z) * (1 - v * 0.7)})`;
        const desl = (camX * vel + tempo * 6) % esp;
        for (let i = -1; i < viewW / esp + 2; i++) {
          const x = i * esp - desl;
          const y = chaoTela - alt + (i % 2 ? 50 : 0);
          for (const [dx, dy, r] of [[0, 0, 22], [24, -10, 26], [50, 0, 20]]) {
            elipse(ctx, x + dx, y + dy, r, r * 0.8);
            ctx.fill();
          }
        }
      }
    }

    // coraçõezinhos flutuando (somem no parque)
    if (t < 0.95) {
      for (let i = 0; i < 6; i++) {
        const m = viewW + 40;
        const x = (((i * 137 - camX * 0.05 + tempo * 8) % m) + m) % m - 20;
        const y = chaoTela - 150 - ((i * 89 + tempo * 12) % 380);
        ctx.globalAlpha = 0.35 * (1 - t);
        coracao(ctx, x, y, 12 + (i % 3) * 4, "#ff8fb8");
      }
      ctx.globalAlpha = 1;
    }

    // camadas de cada cenário: cada uma some enquanto a próxima aparece
    camadaParque(camX, chaoTela, t * (1 - u));
    camadaRua(camX, chaoTela, u * (1 - v));
    camadaShopping(camX, chaoTela, v * (1 - z));
    camadaCidade(camX, chaoTela, 1 - t);
    camadaInterior(camX, chaoTela, z * (1 - a));
    camadaArcade(camX, chaoTela, a);

    // base (o "buraco"): rosa na cidade, piscina no parque, asfalto na rua, piso escuro no shopping
    ctx.fillStyle = T("#ffd9e8", "#fff4e2", "#d8c6a6", "#c8b8a0", "#e8d4bf", "#2a1650");
    ctx.fillRect(0, chaoTela, viewW, 12);
    ctx.fillStyle = T("#f3a6c4", "#4cc9f0", "#9a8a6e", "#8f7f68", "#d9b36a", "#37e6ff");
    ctx.fillRect(0, chaoTela + 10, viewW, 3);
    ctx.fillStyle = T("#e58db4", "#3fbfee", "#5f5750", "#5a5260", "#d9c3aa", "#1a0f33");
    ctx.fillRect(0, chaoTela + 13, viewW, viewH - chaoTela);
    const ondas = t * (1 - u);
    if (ondas > 0.05) {
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * ondas})`;
      ctx.lineWidth = 2;
      for (const dy of [24, 40]) {
        ctx.beginPath();
        for (let x = -20; x <= viewW + 20; x += 10) {
          const yy = chaoTela + dy + Math.sin((x + camX) * 0.08 + tempo * 3 + dy) * 2.2;
          if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    }
    const faixa = u * (1 - v);
    if (faixa > 0.05) {
      ctx.fillStyle = `rgba(245,215,110,${0.85 * faixa})`;
      const per = 56, off = ((camX % per) + per) % per;
      for (let x = -per; x < viewW + per; x += per) ctx.fillRect(x - off, chaoTela + 56, 28, 4);
    }
  }

  // praça do shopping: prédios da cidade ao longe e lojinhas da praça
  function camadaShopping(camX, chaoTela, alfa) {
    if (alfa <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alfa;
    // prédios ao longe, silhuetas azuladas com janelas acesas
    {
      const passo = 150, off = camX * 0.08, ini = Math.floor(off / passo) - 1;
      for (let i = ini; i < ini + viewW / passo + 3; i++) {
        const x = i * passo - off, w = 84 + Math.floor(rnd(i + 210) * 3) * 14, h = 110 + Math.floor(rnd(i + 211) * 5) * 26, top = chaoTela - 26 - h;
        ctx.fillStyle = ["#8b93c9", "#9a8fc0", "#7f8cc4"][((i % 3) + 3) % 3];
        ctx.fillRect(x, top, w, h + 30);
        let linha = 0;
        for (let wy = top + 10; wy < chaoTela - 40; wy += 16, linha++) {
          let col = 0;
          for (let wx = x + 8; wx < x + w - 8; wx += 14, col++) {
            ctx.fillStyle = rnd(i * 31 + linha * 7 + col * 3) > 0.6 ? "#ffe39a" : "rgba(40,40,90,.35)";
            ctx.fillRect(wx, wy, 7, 9);
          }
        }
      }
    }
    // lojinhas da praça
    {
      const passo = 250, off = camX * 0.35, ini = Math.floor(off / passo) - 1;
      const cores = ["#f2d7c4", "#d8e2f2", "#f4e6a8", "#e3cbe8"], toldos = ["#d9503a", "#3a8dde", "#2fb86e", "#b48bff"], nomes = ["MODA", "CAFÉ", "LIVROS", "FLORES"];
      for (let i = ini; i < ini + viewW / passo + 3; i++) {
        const x = i * passo - off + 10, w = 214, h = 112, k = ((i % 4) + 4) % 4, topo = chaoTela - h;
        ctx.fillStyle = cores[k];
        ctx.fillRect(x, topo, w, h);
        ctx.fillStyle = "#2a2f4a";
        ctx.fillRect(x + 20, topo + 6, w - 40, 18);
        ctx.fillStyle = "#fff3a8";
        ctx.font = "700 11px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nomes[k], x + w / 2, topo + 15);
        ctx.fillStyle = "#7fb0c4";
        ctx.fillRect(x + 14, topo + 40, w - 28, 54);
        ctx.fillStyle = "rgba(255,255,255,.3)";
        ctx.beginPath(); ctx.moveTo(x + 30, topo + 40); ctx.lineTo(x + 56, topo + 40); ctx.lineTo(x + 34, topo + 94); ctx.lineTo(x + 14, topo + 94); ctx.closePath(); ctx.fill();
        for (let s = 0; s < 8; s++) {
          ctx.fillStyle = s % 2 ? "#ffffff" : toldos[k];
          ctx.fillRect(x + 8 + s * ((w - 16) / 8), topo + 28, (w - 16) / 8, 12);
        }
      }
    }
    ctx.restore();
  }

  // corredor do shopping: paredes claras, teto com luminárias, pilastras e plantas
  function camadaInterior(camX, chaoTela, alfa) {
    if (alfa <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alfa;
    const teto = chaoTela * 0.3;
    ctx.fillStyle = "#f6e9da";
    ctx.fillRect(0, 0, viewW, chaoTela + 2);
    ctx.fillStyle = "#e8d4bf";
    ctx.fillRect(0, 0, viewW, teto);
    ctx.fillStyle = "#d9b36a";
    ctx.fillRect(0, teto, viewW, 4);
    // luminárias do teto
    const passoL = 170, offL = camX * 0.5;
    for (let k = Math.floor(offL / passoL) - 1; k < Math.floor(offL / passoL) + viewW / passoL + 3; k++) {
      const lx = k * passoL - offL;
      const br = ctx.createRadialGradient(lx + 40, teto * 0.62, 2, lx + 40, teto * 0.62, 70);
      br.addColorStop(0, "rgba(255,250,220,.7)"); br.addColorStop(1, "rgba(255,250,220,0)");
      ctx.fillStyle = br; ctx.fillRect(lx - 30, 0, 140, teto + 40);
      caminhoRetArred(ctx, lx, teto * 0.55, 80, 8, 4); ctx.fillStyle = "#fffbe8"; ctx.fill();
    }
    // pilastras com detalhe dourado
    const passoP = 190, offP = camX * 0.45;
    for (let k = Math.floor(offP / passoP) - 1; k < Math.floor(offP / passoP) + viewW / passoP + 3; k++) {
      const px = k * passoP - offP;
      ctx.fillStyle = "#eadbc6"; ctx.fillRect(px, teto + 4, 18, chaoTela - teto - 4);
      ctx.fillStyle = "#d9b36a"; ctx.fillRect(px - 3, teto + 4, 24, 6); ctx.fillRect(px - 3, chaoTela - 30, 24, 5);
    }
    ctx.fillStyle = "#e3cfb6";
    ctx.fillRect(0, chaoTela - 26, viewW, 28);
    // plantas grandes em vasos (parallax maior)
    const passoV = 420, offV = camX * 0.8;
    for (let k = Math.floor(offV / passoV) - 1; k < Math.floor(offV / passoV) + viewW / passoV + 2; k++) {
      const vx = k * passoV - offV + 120 * rnd(k + 5);
      caminhoRetArred(ctx, vx - 16, chaoTela - 34, 32, 34, 5); ctx.fillStyle = "#a9794f"; ctx.fill();
      ctx.fillStyle = "#6ea060";
      for (const [lx, ly, rx, ry] of [[0, -62, 22, 28], [-16, -48, 13, 20], [16, -48, 13, 20]]) { elipse(ctx, vx + lx, chaoTela + ly, rx, ry); ctx.fill(); }
    }
    ctx.restore();
  }

  // arcade: paredes escuras com neon, silhuetas de máquinas ao fundo e luzinhas no teto
  function camadaArcade(camX, chaoTela, alfa) {
    if (alfa <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alfa;
    const g = ctx.createLinearGradient(0, 0, 0, chaoTela);
    g.addColorStop(0, "#140a2a"); g.addColorStop(1, "#2b1650");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, chaoTela + 2);
    // luzinhas no teto
    for (let k = 0; k < 18; k++) {
      const lx = ((k * 61 - camX * 0.4) % (viewW + 40) + viewW + 40) % (viewW + 40) - 10;
      ctx.fillStyle = k % 3 === 0 ? "#ff4fd8" : k % 3 === 1 ? "#37e6ff" : "#ffe36a";
      ctx.globalAlpha = alfa * (0.5 + 0.5 * Math.sin(tempo * 3 + k));
      elipse(ctx, lx, 12 + (k % 4) * 8, 2.2, 2.2);
      ctx.fill();
    }
    ctx.globalAlpha = alfa;
    // faixas de neon
    ctx.lineCap = "round";
    for (const [yy, cor] of [[chaoTela * 0.3, "#37e6ff"], [chaoTela * 0.42, "#ff4fd8"]]) {
      for (const [lw, al] of [[10, 0.12], [5, 0.25], [2, 1]]) {
        ctx.globalAlpha = alfa * al; ctx.strokeStyle = cor; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(viewW, yy); ctx.stroke();
      }
    }
    ctx.globalAlpha = alfa;
    // máquinas ao fundo (silhuetas escuras com telinhas)
    const passo = 120, off = camX * 0.3;
    for (let k = Math.floor(off / passo) - 1; k < Math.floor(off / passo) + viewW / passo + 3; k++) {
      const mx = k * passo - off + 20;
      caminhoRetArred(ctx, mx, chaoTela - 112, 56, 112, 8); ctx.fillStyle = "#1d1040"; ctx.fill();
      ctx.fillStyle = ["#37e6ff", "#ff4fd8", "#ffe36a"][((k % 3) + 3) % 3];
      ctx.globalAlpha = alfa * 0.55;
      ctx.fillRect(mx + 8, chaoTela - 100, 40, 24);
      ctx.globalAlpha = alfa;
    }
    ctx.restore();
  }

  // pisos: praça (pedras claras), corredor (porcelanato brilhante), arcade (carpete escuro com neon)
  function plataformaPraca(p) {
    ctx.fillStyle = "#bfae96";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "rgba(90,70,50,.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = p.y + 40; y < p.y + p.h; y += 28) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
    ctx.stroke();
    ctx.fillStyle = "#c9bba5";
    ctx.fillRect(p.x, p.y + 15, p.w, 7);
    ctx.fillStyle = "#e8dccb";
    ctx.fillRect(p.x - 2, p.y, p.w + 4, 16);
    ctx.strokeStyle = "#cdbba5";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = p.x + 34 - (p.x % 34); x < p.x + p.w; x += 34) { ctx.moveTo(x, p.y); ctx.lineTo(x, p.y + 15); }
    ctx.stroke();
  }

  function plataformaInterior(p) {
    ctx.fillStyle = "#e0c8b2";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "rgba(120,80,50,.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = p.y + 40; y < p.y + p.h; y += 30) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
    ctx.stroke();
    // porcelanato quadriculado e brilhante
    for (let x = Math.floor(p.x / 36) * 36; x < p.x + p.w; x += 36) {
      const ini = Math.max(x, p.x), fim = Math.min(x + 36, p.x + p.w);
      ctx.fillStyle = Math.floor(x / 36) % 2 ? "#f1dfd0" : "#ead3c0";
      ctx.fillRect(ini, p.y, fim - ini, 15);
    }
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.fillRect(p.x, p.y + 2, p.w, 3);
    ctx.fillStyle = "#d9b36a";
    ctx.fillRect(p.x, p.y + 15, p.w, 3);
  }

  function plataformaArcade(p) {
    ctx.fillStyle = "#2a1650";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "rgba(160,120,255,.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = p.y + 40; y < p.y + p.h; y += 30) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
    ctx.stroke();
    for (let x = Math.floor(p.x / 24) * 24; x < p.x + p.w; x += 24) {
      const ini = Math.max(x, p.x), fim = Math.min(x + 24, p.x + p.w);
      ctx.fillStyle = Math.floor(x / 24) % 2 ? "#3a1f6b" : "#4a2b8a";
      ctx.fillRect(ini, p.y, fim - ini, 15);
    }
    ctx.lineCap = "round";
    for (const [lw, al] of [[8, 0.15], [4, 0.3], [2, 1]]) {
      ctx.globalAlpha = al; ctx.strokeStyle = "#37e6ff"; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(p.x, p.y + 15); ctx.lineTo(p.x + p.w, p.y + 15); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // rua do condomínio (inspirada num condomínio de verdade): blocos de apartamento salmão e bege,
  // garagens cobertas com carros, árvores grandes e o muro branco ao longo da calçada
  function camadaRua(camX, chaoTela, alfa) {
    if (alfa <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alfa;

    // arvoredo ao fundo
    ctx.fillStyle = "#b9c99a";
    const desl = (camX * 0.1) % 280;
    for (let i = -1; i < viewW / 280 + 2; i++) {
      elipse(ctx, i * 280 - desl + 140, chaoTela + 10, 200, 62);
      ctx.fill();
    }

    // chão distante (some atrás dos prédios do fundo)
    ctx.fillStyle = "#cdbba0";
    ctx.fillRect(0, chaoTela - 56, viewW, 62);

    // fileiras de blocos em profundidade: bem ao fundo (pequenos e esmaecidos), no meio e mais perto
    for (const [esc, subida, par, esp, alfaL, semente] of [[0.4, 44, 0.07, 112, 0.55, 200], [0.56, 34, 0.11, 146, 0.68, 100], [0.76, 18, 0.19, 208, 0.88, 50]]) {
      const offL = camX * par;
      const iniL = Math.floor(offL / esp) - 1;
      ctx.save();
      ctx.globalAlpha = alfa * alfaL;
      for (let i = iniL; i < iniL + viewW / esp + 3; i++) {
        ctx.save();
        ctx.translate(i * esp - offL, chaoTela - subida);
        ctx.scale(esc, esc);
        bloco(0, 0, i + semente);
        ctx.restore();
      }
      ctx.restore();
    }

    // na frente: blocos grandes e garagens cobertas (parallax mais rápido)
    const passo = 300, off = camX * 0.3;
    const ini = Math.floor(off / passo) - 1;
    for (let i = ini; i < ini + viewW / passo + 3; i++) {
      const x = i * passo - off + 10;
      if (((i % 3) + 3) % 3 === 2) garagemCoberta(x, chaoTela, i); // dois blocos, uma garagem coberta
      else bloco(x, chaoTela, i);
    }

    // árvores grandes (parallax médio): copas escuras e troncos grossos
    const passoA = 330, offA = camX * 0.55;
    const iniA = Math.floor(offA / passoA) - 1;
    for (let i = iniA; i < iniA + viewW / passoA + 3; i++) {
      const x = i * passoA - offA + rnd(i + 90) * 90;
      ctx.fillStyle = "#5a4632";
      ctx.fillRect(x - 5, chaoTela - 96, 10, 96);
      for (const [dx, dy, rx, ry, c] of [[0, -112, 38, 28, "#4f7a4a"], [-26, -92, 26, 20, "#5f8a56"], [26, -92, 26, 20, "#5f8a56"], [4, -128, 24, 17, "#6c9a60"]]) {
        ctx.fillStyle = c;
        elipse(ctx, x + dx, chaoTela + dy, rx, ry);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // =====================================================================
  //  MURO PINTADO (grafite e piche) — um muro só, contínuo, preso ao mundo
  // =====================================================================
  const cacheMuro = new Map();
  let fontesProntas = false;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fontesProntas = true; });

  // desenha um painel pintado. Fica guardado numa imagem (cache) pra não gastar a cada quadro.
  function painel(x, y, w, h, tipo, sem) {
    if (tipo === "liso") return;
    const esc = Math.max(2, Math.min(4, Math.ceil(dpr * escala)));
    const chave = `${tipo}|${sem}|${Math.round(w)}|${Math.round(h)}|${esc}`;
    let img = cacheMuro.get(chave);
    if (!img) {
      const c = document.createElement("canvas");
      c.width = Math.round(w * esc);
      c.height = Math.round(h * esc);
      const salvo = ctx;
      ctx = c.getContext("2d");
      ctx.scale(esc, esc);
      try { pintarPainel(0, 0, w, h, tipo, sem); } finally { ctx = salvo; }
      if (!fontesProntas) { ctx.drawImage(c, x, y, w, h); return; } // fonte ainda carregando: não guarda
      cacheMuro.set(chave, c);
      img = c;
    }
    ctx.drawImage(img, x, y, w, h);
  }

  function pintarPainel(x, y, w, h, tipo, sem) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    if (tipo === "piche") pintarPiche(x, y, w, h, sem);
    else if (tipo === "wild") pintarWild(x, y, w, h, sem);
    else if (tipo === "carlos") pintarCarlos(x, y, w, h, sem);
    else pintarBubble(x, y, w, h, sem);
    ctx.restore();
  }

  // letras "bubble": gordinhas, coloridas, com contorno preto, brilho e pingos (como na referência)
  function pintarBubble(x, y, w, h, sem) {
    const palavras = ["TABOÃO", "AMOR", "PAZ", "JAU", "BÊ", "SP", "ZL", "FAMÍLIA"];
    const palavra = palavras[Math.floor(rnd(sem + 77) * palavras.length)];
    const cores = ["#5bbcf5", "#ffc61a", "#f27a72", "#a55ee8"];
    const desloc = Math.floor(rnd(sem + 5) * 4);
    // respingos de spray ao redor
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(25,22,35,${0.18 + rnd(sem + i) * 0.25})`;
      elipse(ctx, x + rnd(sem + i + 100) * w, y + rnd(sem + i + 200) * h, 0.5 + rnd(sem + i + 300) * 1.1, 0.5 + rnd(sem + i + 300) * 1.1);
      ctx.fill();
    }
    let tam = h * 0.62;
    const medir = () => {
      ctx.font = `700 ${tam}px Fredoka, sans-serif`;
      return [...palavra].map((ch) => ctx.measureText(ch).width + tam * 0.1);
    };
    let larg = medir();
    let total = larg.reduce((a, b) => a + b, 0);
    if (total > w * 0.86) { tam *= (w * 0.86) / total; larg = medir(); total = larg.reduce((a, b) => a + b, 0); }
    let cursor = x + (w - total) / 2;
    const cy = y + h * 0.5;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    [...palavra].forEach((ch, i) => {
      const lw = larg[i], cx = cursor + lw / 2, k = tam;
      const cor = cores[(i + desloc) % 4];
      // pingo escorrendo (atrás da letra)
      if (rnd(sem + i * 7 + 3) > 0.4) {
        const dx = cx + (rnd(sem + i + 9) - 0.5) * lw * 0.5, dl = k * (0.16 + rnd(sem + i + 11) * 0.26), y0 = cy + k * 0.32;
        ctx.fillStyle = "#17131c";
        ctx.fillRect(dx - k * 0.045, y0 - 2, k * 0.09, dl + 3);
        elipse(ctx, dx, y0 + dl + 2, k * 0.06, k * 0.07);
        ctx.fill();
        ctx.fillStyle = cor;
        ctx.fillRect(dx - k * 0.026, y0, k * 0.052, dl);
        elipse(ctx, dx, y0 + dl + 1, k * 0.04, k * 0.05);
        ctx.fill();
      }
      ctx.strokeStyle = "#17131c";
      ctx.lineWidth = k * 0.3;
      ctx.strokeText(ch, cx + k * 0.04, cy + k * 0.06); // sombra
      ctx.lineWidth = k * 0.28;
      ctx.strokeText(ch, cx, cy);
      ctx.strokeStyle = cor;
      ctx.lineWidth = k * 0.2;
      ctx.strokeText(ch, cx, cy);
      ctx.fillStyle = cor;
      ctx.fillText(ch, cx, cy);
      // brilho
      ctx.fillStyle = "rgba(255,255,255,.62)";
      elipse(ctx, cx - lw * 0.2, cy - k * 0.22, k * 0.065, k * 0.027, -0.6);
      ctx.fill();
      elipse(ctx, cx - lw * 0.02, cy - k * 0.31, k * 0.022, k * 0.022);
      ctx.fill();
      cursor += lw;
    });
  }

  // "wildstyle": letras angulares coloridas, contorno azul-marinho, auréola laranja, pingos e respingos
  function pintarWild(x, y, w, h, sem) {
    const P = (u, v) => [x + u * w, y + v * h];
    const formas = [
      { pts: [[.05, .55], [.2, .25], [.28, .45], [.35, .2], [.38, .7], [.22, .82], [.12, .62]], cor: "#ff3fa8" },
      { pts: [[.32, .25], [.5, .12], [.58, .5], [.48, .88], [.36, .7]], cor: "#31c4f0" },
      { pts: [[.5, .35], [.8, .18], [.75, .4], [.97, .34], [.8, .72], [.75, .58], [.5, .82]], cor: "#ffe21a" },
      { pts: [[.42, .13], [.55, .06], [.62, .24], [.5, .3]], cor: "#7be03a" },
    ];
    const caminho = (pts, dx = 0, dy = 0) => {
      ctx.beginPath();
      pts.forEach(([u, v], i) => {
        const [px, py] = P(u, v);
        if (i === 0) ctx.moveTo(px + dx, py + dy); else ctx.lineTo(px + dx, py + dy);
      });
      ctx.closePath();
    };
    // respingos azuis e laranja
    for (let i = 0; i < 22; i++) {
      ctx.fillStyle = i % 2 ? "#2f5bff" : "#ff7a1a";
      elipse(ctx, x + w * (0.62 + rnd(sem + i) * 0.36), y + h * (0.02 + rnd(sem + i + 50) * 0.3), 0.7 + rnd(sem + i + 90) * 1.6, 0.7 + rnd(sem + i + 90) * 1.6);
      ctx.fill();
    }
    // auréola laranja
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#ff7a1a";
    ctx.fillStyle = "#ff7a1a";
    ctx.lineWidth = h * 0.17;
    for (const f of formas) { caminho(f.pts); ctx.stroke(); ctx.fill(); }
    // lado 3D (sombra azul-marinho)
    ctx.fillStyle = "#1d2a6b";
    for (const f of formas) { caminho(f.pts, w * 0.02, h * 0.045); ctx.fill(); }
    // letras
    for (const f of formas) {
      caminho(f.pts);
      ctx.fillStyle = f.cor;
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "#1d2a6b";
      ctx.stroke();
      // brilho
      const [ax, ay] = P(f.pts[0][0], f.pts[0][1]), [bx, by] = P(f.pts[1][0], f.pts[1][1]);
      ctx.strokeStyle = "rgba(255,255,255,.7)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ax + 2, ay - 1);
      ctx.lineTo(bx + 2, by + 1);
      ctx.stroke();
    }
    // pingos
    for (const [u, cor] of [[0.24, "#ff3b3b"], [0.52, "#ffe21a"], [0.78, "#2f5bff"]]) {
      const [px, py] = P(u, 0.84);
      ctx.fillStyle = cor;
      ctx.fillRect(px - 1.3, py, 2.6, h * (0.1 + rnd(sem + u * 100) * 0.12));
      elipse(ctx, px, py + h * (0.1 + rnd(sem + u * 100) * 0.12), 2.2, 2.8);
      ctx.fill();
    }
    // assinatura pequena
    ctx.font = `italic 700 ${Math.max(8, h * 0.1)}px Fredoka, sans-serif`;
    ctx.fillStyle = "#2f3fa8";
    ctx.textAlign = "center";
    ctx.fillText("JAU", x + w * 0.9, y + h * 0.9);
  }

  // piche: tinta preta escorrendo, com letras brancas
  function pintarPiche(x, y, w, h, sem) {
    const tags = ["ZS", "SP", "PAZ", "ZL", "55"];
    ctx.fillStyle = "#1c1a1b";
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.1);
    for (let k = 0; k <= 8; k++) ctx.lineTo(x + (w * k) / 8, y + h * (0.1 + rnd(sem + k) * 0.1));
    ctx.lineTo(x + w, y + h * 0.55);
    for (let k = 8; k >= 0; k--) ctx.lineTo(x + (w * k) / 8, y + h * (0.5 + rnd(sem + k + 20) * 0.3));
    ctx.closePath();
    ctx.fill();
    for (let k = 0; k < 6; k++) {
      const dx = x + w * (0.08 + rnd(sem + k + 40) * 0.84), dl = h * (0.25 + rnd(sem + k + 60) * 0.5);
      ctx.fillRect(dx, y + h * 0.55, 2.6, dl);
      elipse(ctx, dx + 1.3, y + h * 0.55 + dl, 2.4, 3);
      ctx.fill();
    }
    ctx.font = `700 ${Math.max(10, h * 0.34)}px Fredoka, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f1f1ee";
    ctx.fillText(tags[Math.floor(rnd(sem + 77) * tags.length)], x + w / 2, y + h * 0.34);
  }

  // CARLOS ADÃO (clássico de Taboão): letras verdes à mão, num retângulo cinza sobre o muro preto
  function pintarCarlos(x, y, w, h, sem) {
    ctx.fillStyle = "#141416";
    ctx.fillRect(x, y, w, h);
    // respingos coloridos no fundo preto
    const sp = ["#ffffff", "#f7b6d8", "#7df06a", "#8fb3ff", "#cfcfd6"];
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = sp[i % 5];
      ctx.globalAlpha = 0.35 + rnd(sem + i) * 0.5;
      elipse(ctx, x + rnd(sem + i + 100) * w, y + rnd(sem + i + 200) * h, 0.4 + rnd(sem + i + 300) * 1.1, 0.4 + rnd(sem + i + 300) * 1.1);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // retângulo cinza meio torto (a "base" da pintura)
    const rx = x + w * 0.09, ry = y + h * 0.15, rw = w * 0.82, rh = h * 0.72;
    const jit = (i) => (rnd(sem + i) - 0.5) * 3.2;
    ctx.fillStyle = "#3a3a3e";
    ctx.beginPath();
    ctx.moveTo(rx + jit(1), ry + jit(2));
    for (let k = 1; k <= 8; k++) ctx.lineTo(rx + (rw * k) / 8 + jit(k + 10), ry + jit(k + 20));
    for (let k = 1; k <= 6; k++) ctx.lineTo(rx + rw + jit(k + 30), ry + (rh * k) / 6 + jit(k + 40));
    for (let k = 7; k >= 0; k--) ctx.lineTo(rx + (rw * k) / 8 + jit(k + 50), ry + rh + jit(k + 60));
    for (let k = 5; k >= 1; k--) ctx.lineTo(rx + jit(k + 70), ry + (rh * k) / 6 + jit(k + 80));
    ctx.closePath();
    ctx.fill();
    // fio verde escorrendo no topo
    ctx.strokeStyle = "#4cc83a";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.46, y);
    ctx.quadraticCurveTo(x + w * 0.4, y + h * 0.07, x + w * 0.38, y + h * 0.15);
    ctx.stroke();

    // os traços das letras (coordenadas dentro do retângulo cinza)
    const gx = (u) => rx + u * rw, gy = (v) => ry + v * rh;
    const elip = (cx, cy, rxx, ryy) => {
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const a = -Math.PI * 0.7 + (k / 10) * Math.PI * 2.1;
        pts.push([cx + Math.cos(a) * rxx, cy + Math.sin(a) * ryy]);
      }
      return pts;
    };
    const tracos = [
      // CARLOS
      [[.14, .12], [.07, .10], [.03, .22], [.05, .36], [.12, .42], [.17, .38]],
      [[.19, .42], [.245, .08], [.30, .42]], [[.205, .30], [.285, .30]],
      [[.33, .42], [.33, .09], [.42, .09], [.44, .20], [.35, .26], [.44, .42]],
      [[.49, .09], [.49, .40], [.62, .40]],
      elip(.74, .25, .07, .15),
      [[.95, .12], [.86, .12], [.85, .24], [.95, .28], [.95, .38], [.86, .42]],
      [[.10, .47], [.50, .48], [.98, .51]],
      // ADÃO
      [[.08, .97], [.17, .72], [.28, .54]], [[.28, .54], [.36, .95]], [[.16, .80], [.34, .80]],
      [[.45, .58], [.45, .92], [.56, .90], [.62, .76], [.57, .60], [.45, .58]],
      [[.66, .92], [.72, .60], [.78, .92]], [[.69, .81], [.76, .81]], [[.67, .53], [.72, .47], [.78, .53]],
      elip(.89, .76, .07, .17),
      [[.30, .96], [.98, .98]],
    ];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const [cor, lw] of [["#2f9e2a", w * 0.078], ["#5ef24a", w * 0.062], ["#b8ffa0", w * 0.02]]) {
      ctx.strokeStyle = cor;
      ctx.lineWidth = lw;
      tracos.forEach((pts, t) => {
        ctx.beginPath();
        pts.forEach(([u, v], i) => {
          const px = gx(u) + (rnd(sem + t * 13 + i) - 0.5) * 1.6, py = gy(v) + (rnd(sem + t * 17 + i + 5) - 0.5) * 1.6;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
      });
    }
    // textura de tinta falhada (pontinhos escuros por cima das letras)
    ctx.fillStyle = "rgba(20,30,20,.35)";
    for (let i = 0; i < 40; i++) {
      elipse(ctx, rx + rnd(sem + i + 400) * rw, ry + rnd(sem + i + 500) * rh, 0.6, 0.6);
      ctx.fill();
    }
  }

  // sequência dos painéis do muro (do portão pra trás): [tipo, largura]
  const SEQ_MURO = [["liso", 300], ["carlos", 134], ["bubble", 150], ["liso", 44], ["wild", 172], ["bubble", 150], ["piche", 120], ["liso", 56], ["bubble", 150], ["wild", 172], ["carlos", 134], ["liso", 64], ["bubble", 150]];

  // o muro alto da rua: contínuo, preso ao chão (junto com o portão do Jau), pintado de grafite e piche
  function muroMundo(x0, x1) {
    const y = FASE.chao, h = 88;
    const ini = Math.max(x0, cam.x - 120), fim = Math.min(x1, cam.x + viewW + 120);
    // base branca encardida + capa (some junto com a transição pro parque)
    for (let sx = Math.floor(ini / 100) * 100; sx < fim; sx += 100) {
      const a = Math.max(sx, x0), b = Math.min(sx + 100, x1);
      if (b <= a) continue;
      const alfa = mistura2(sx + 50) * (1 - mistura3(sx + 50));
      if (alfa <= 0.01) continue;
      ctx.globalAlpha = alfa;
      ctx.fillStyle = "#e6e4dd";
      ctx.fillRect(a, y - h, b - a + 0.5, h + 1);
      ctx.fillStyle = "rgba(120,110,95,.12)";
      ctx.fillRect(a + 14 + rnd(sx) * 30, y - h + 6 + rnd(sx + 5) * 20, 34, 10);
      ctx.fillStyle = "#cfcac0";
      ctx.fillRect(a, y - h - 5, b - a + 0.5, 6);
    }
    // painéis, do fim (portão) pra trás, sempre na mesma ordem
    let cursor = x1, k = 0;
    while (cursor > x0 + 20) {
      const [tipo, wp] = SEQ_MURO[k % SEQ_MURO.length];
      const px = cursor - wp;
      if (px >= x0 - 1 && px + wp > cam.x - 20 && px < cam.x + viewW + 20) {
        const alfa = mistura2(px + wp / 2) * (1 - mistura3(px + wp / 2));
        if (alfa > 0.02) {
          ctx.globalAlpha = alfa;
          painel(px + 3, y - h + 5, wp - 6, h - 10, tipo, k * 13 + 7);
          ctx.globalAlpha = 1;
        }
      }
      cursor = px;
      k++;
    }
    ctx.globalAlpha = 1;
  }

  // um bloco de apartamentos (3 ou 4 andares) com torre da escada e telhado de cerâmica
  function bloco(x, base, i) {
    const cores = ["#e0a28a", "#d98c78", "#e8b9a0", "#cdb89d", "#d6a38c", "#c98f78"];
    const w = 210 + Math.floor(rnd(i + 5) * 3) * 14;
    const andares = 3 + Math.floor(rnd(i + 6) * 3);
    const h = andares * 34 + 10;
    const cor = cores[Math.floor(rnd(i + 7) * cores.length)];
    const topo = base - h;
    const tx = x + w * 0.38, tw = 38; // torre da escada

    ctx.fillStyle = cor;
    ctx.fillRect(x, topo, w, h);
    // torre da escada: mais alta e mais escura, com janelinhas estreitas
    ctx.fillStyle = "#c4a08a";
    ctx.fillRect(tx, topo - 18, tw, h + 18);
    ctx.fillStyle = "#7f9fb0";
    for (let f = 0; f < andares; f++) ctx.fillRect(tx + 15, topo + 8 + f * 34, 8, 16);
    // lajes entre os andares
    ctx.fillStyle = "rgba(80,40,20,.16)";
    for (let f = 1; f <= andares; f++) ctx.fillRect(x, topo + f * 34 - 2, w, 4);
    // telhado de cerâmica baixo
    ctx.fillStyle = "#a65a3a";
    ctx.beginPath();
    ctx.moveTo(x - 8, topo + 4);
    ctx.lineTo(x + 10, topo - 14);
    ctx.lineTo(x + w - 10, topo - 14);
    ctx.lineTo(x + w + 8, topo + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8a4a2f";
    ctx.fillRect(tx - 3, topo - 22, tw + 6, 6);
    ctx.strokeStyle = "rgba(0,0,0,.14)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 1; k < 3; k++) { ctx.moveTo(x - 6 + k * 6, topo + 4 - k * 6); ctx.lineTo(x + w + 6 - k * 6, topo + 4 - k * 6); }
    ctx.stroke();
    // janelas (a cor de cada uma vem do número dela: nunca da posição na tela)
    const cols = 4, gap = (w - 28) / cols;
    for (let f = 0; f < andares; f++) {
      for (let c = 0; c < cols; c++) {
        const wx = x + 14 + c * gap + gap / 2 - 9;
        if (wx + 18 > tx - 4 && wx < tx + tw + 4) continue;
        const wy = topo + 8 + f * 34;
        ctx.fillStyle = "#f4ecdc";
        ctx.fillRect(wx - 2, wy - 2, 22, 24);
        ctx.fillStyle = rnd(i * 17 + f * 5 + c * 3) > 0.62 ? "#ffe3a3" : "#7f9fb0";
        ctx.fillRect(wx, wy, 18, 20);
        ctx.fillStyle = "#f4ecdc";
        ctx.fillRect(wx + 8, wy, 2, 20);
        ctx.fillRect(wx - 3, wy + 20, 24, 3);
      }
    }
    // porta do prédio e sombra no pé
    ctx.fillStyle = "#3d3d44";
    ctx.fillRect(tx + 8, base - 30, 22, 30);
    ctx.fillStyle = "#8fb3c4";
    ctx.fillRect(tx + 10, base - 27, 18, 14);
    ctx.fillStyle = "rgba(60,30,10,.25)";
    ctx.fillRect(x, base - 8, w, 8);
  }

  // garagem coberta com telhado de zinco e carros estacionados
  function garagemCoberta(x, base, i) {
    const w = 230;
    const cores = ["#2d3a55", "#d8d8d8", "#6b2a2a", "#1d1d1f", "#3a6b4f", "#b9b9c0"];
    // carros por baixo do telhado
    for (let k = 0; k < 3; k++) {
      const cx = x + 36 + k * 76;
      const c = cores[Math.floor(rnd(i * 7 + k + 70) * cores.length)];
      caminhoRetArred(ctx, cx - 28, base - 28, 56, 15, 5);
      ctx.fillStyle = c;
      ctx.fill();
      caminhoRetArred(ctx, cx - 16, base - 40, 32, 15, 5);
      ctx.fill();
      ctx.fillStyle = "#9db6c4";
      ctx.fillRect(cx - 12, base - 37, 11, 9);
      ctx.fillRect(cx + 1, base - 37, 11, 9);
      ctx.fillStyle = "#1c1c20";
      for (const dx of [-17, 17]) { elipse(ctx, cx + dx, base - 12, 7, 7); ctx.fill(); }
    }
    // postes e telhado de zinco
    ctx.fillStyle = "#8a8f93";
    for (let k = 0; k < 4; k++) ctx.fillRect(x + 4 + k * 74, base - 78, 4, 78);
    ctx.beginPath();
    ctx.moveTo(x - 8, base - 74);
    ctx.lineTo(x + w + 8, base - 82);
    ctx.lineTo(x + w + 8, base - 74);
    ctx.lineTo(x - 8, base - 66);
    ctx.closePath();
    ctx.fillStyle = "#707a80";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 26; k++) { const px = x - 4 + k * 9.2; ctx.moveTo(px, base - 73 - k * 0.3); ctx.lineTo(px, base - 66 - k * 0.3); }
    ctx.stroke();
  }

  // cidade de hoje: prédios pastel e árvores
  function camadaCidade(camX, chaoTela, alfa) {
    if (alfa <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alfa;

    const cores = ["#ffc2d9", "#ffd9b8", "#e6d0ff", "#c4e4ff", "#fff0b3", "#ffcfe6"];
    const passo = 74, off = camX * 0.3;
    const ini = Math.floor(off / passo) - 1;
    for (let i = ini; i < ini + viewW / passo + 3; i++) {
      const x = i * passo - off;
      const w = 54 + Math.floor(rnd(i) * 3) * 6;
      const h = 90 + Math.floor(rnd(i + 9) * 6) * 22;
      const topo = chaoTela - h;
      ctx.fillStyle = cores[Math.floor(rnd(i + 3) * cores.length)];
      caminhoRetArred(ctx, x, topo, w, h + 6, 5);
      ctx.fill();
      // telhadinho
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.fillRect(x - 2, topo, w + 4, 6);
      // janelas: a cor de cada uma vem do NÚMERO dela (linha/coluna), não da posição na tela,
      // senão elas piscam enquanto a câmera anda
      let linha = 0;
      for (let wy = topo + 18; wy < chaoTela - 16; wy += 22, linha++) {
        let col = 0;
        for (let wx = x + 9; wx < x + w - 10; wx += 15, col++) {
          ctx.fillStyle = rnd(i * 131 + linha * 17 + col * 5) > 0.7 ? "rgba(255,226,120,.95)" : "rgba(255,255,255,.7)";
          ctx.fillRect(wx, wy, 8, 11);
        }
      }
    }

    // árvores
    const passoA = 190, offA = camX * 0.55;
    const iniA = Math.floor(offA / passoA) - 1;
    for (let i = iniA; i < iniA + viewW / passoA + 3; i++) {
      const x = i * passoA - offA + rnd(i + 40) * 60;
      const h = 34 + rnd(i + 41) * 14;
      ctx.fillStyle = "#c98b5a";
      ctx.fillRect(x - 3, chaoTela - h, 6, h);
      ctx.fillStyle = "#9fe3b0";
      for (const [dx, dy, r] of [[0, -h - 6, 19], [-13, -h + 4, 14], [13, -h + 4, 14]]) {
        elipse(ctx, x + dx, chaoTela + dy, r, r);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // parque aquático: torres com tobogãs coloridos e palmeiras
  function camadaParque(camX, chaoTela, alfa) {
    if (alfa <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alfa;

    // morros verdes ao longe
    ctx.fillStyle = "#8fe0b4";
    const desl = (camX * 0.12) % 260;
    for (let i = -1; i < viewW / 260 + 2; i++) {
      elipse(ctx, i * 260 - desl + 130, chaoTela + 20, 190, 70);
      ctx.fill();
    }

    // torres + tobogãs (parallax lento)
    const periodo = 720, off = camX * 0.22;
    const ini = Math.floor((off - 360) / periodo);
    for (let k = ini; k < ini + viewW / periodo + 3; k++) {
      tobogas(k * periodo - off + 160, chaoTela, 0.9);
    }

    // palmeiras ao fundo
    const passoP = 230, offP = camX * 0.5;
    const iniP = Math.floor(offP / passoP) - 1;
    for (let i = iniP; i < iniP + viewW / passoP + 3; i++) {
      const x = i * passoP - offP + rnd(i + 70) * 90;
      palma(x, chaoTela + 6, 110 + rnd(i + 71) * 40, (rnd(i + 72) - 0.5) * 40, 1.15);
    }
    ctx.restore();
  }

  function torreTreliça(x, base, h, w) {
    ctx.save();
    ctx.lineCap = "round";
    for (const [cor, lw, dy] of [["#9fc4dc", 5, 1.5], ["#ffffff", 3, 0]]) {
      ctx.strokeStyle = cor;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x - w, base + dy); ctx.lineTo(x - w, base - h + dy);
      ctx.moveTo(x + w, base + dy); ctx.lineTo(x + w, base - h + dy);
      for (let y = base; y > base - h + 30; y -= 34) {
        ctx.moveTo(x - w, y + dy); ctx.lineTo(x + w, y - 34 + dy);
        ctx.moveTo(x + w, y + dy); ctx.lineTo(x - w, y - 34 + dy);
        ctx.moveTo(x - w, y + dy); ctx.lineTo(x + w, y + dy);
      }
      ctx.stroke();
    }
    // plataforma no topo
    ctx.fillStyle = "#4aa3df";
    ctx.fillRect(x - w - 9, base - h - 7, 2 * w + 18, 8);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w - 9, base - h - 20); ctx.lineTo(x + w + 9, base - h - 20);
    ctx.moveTo(x - w - 9, base - h - 7); ctx.lineTo(x - w - 9, base - h - 20);
    ctx.moveTo(x + w + 9, base - h - 7); ctx.lineTo(x + w + 9, base - h - 20);
    ctx.stroke();
    ctx.restore();
  }

  function tubo(seg, cor, borda, larg) {
    const tracar = () => {
      ctx.beginPath();
      ctx.moveTo(seg[0], seg[1]);
      for (let i = 2; i < seg.length; i += 6) {
        ctx.bezierCurveTo(seg[i], seg[i + 1], seg[i + 2], seg[i + 3], seg[i + 4], seg[i + 5]);
      }
    };
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    tracar(); ctx.strokeStyle = borda; ctx.lineWidth = larg + 5; ctx.stroke();
    tracar(); ctx.strokeStyle = cor; ctx.lineWidth = larg; ctx.stroke();
    // "escamas" do tubo
    ctx.save();
    ctx.setLineDash([3, 6]);
    tracar(); ctx.strokeStyle = "rgba(0,0,0,.14)"; ctx.lineWidth = larg - 6; ctx.stroke();
    ctx.restore();
    // brilho
    ctx.save();
    ctx.translate(-2, -3);
    tracar(); ctx.strokeStyle = "rgba(255,255,255,.42)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  function tobogas(x0, base, esc) {
    ctx.save();
    ctx.translate(x0, base);
    ctx.scale(esc, esc);
    // coordenadas locais: base em y = 0, sobe pra y negativo
    torreTreliça(-170, 0, 180, 10);
    torreTreliça(0, 0, 300, 14);
    torreTreliça(210, 0, 240, 12);
    // tubo verde (grande, estilo "escama")
    tubo([0, -292, -110, -300, -200, -250, -120, -215, -60, -195, 20, -200, 80, -150, 150, -110, 200, -120, 250, -40], "#3fbf5a", "#1f7d3a", 16);
    // tubo vermelho/laranja
    tubo([210, -234, 320, -240, 350, -170, 270, -140, 170, -110, 60, -100, -20, -70, -80, -48, -150, -60, -200, -20], "#ff6b4a", "#a82a22", 15);
    // tubo amarelo
    tubo([-170, -184, -250, -190, -262, -118, -190, -96, -120, -74, -60, -64, -10, -30], "#ffd23f", "#c79a00", 13);
    ctx.restore();
  }

  function palma(x, y, h, lean, esc = 1) {
    const topX = x + lean, topY = y - h;
    ctx.save();
    ctx.lineCap = "round";
    // tronco
    ctx.strokeStyle = "#a9703f";
    ctx.lineWidth = 8 * esc;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * 0.1, y - h * 0.5, topX, topY);
    ctx.stroke();
    ctx.strokeStyle = "#8a562c";
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      const f = i / 6;
      const px = (1 - f) * (1 - f) * x + 2 * (1 - f) * f * (x + lean * 0.1) + f * f * topX;
      const py = (1 - f) * (1 - f) * y + 2 * (1 - f) * f * (y - h * 0.5) + f * f * topY;
      ctx.beginPath();
      ctx.moveTo(px - 4 * esc, py);
      ctx.lineTo(px + 4 * esc, py);
      ctx.stroke();
    }
    // folhas
    for (const lado of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const L = (46 - i * 8) * esc;
        const ex = topX + lado * L * (1 - i * 0.08);
        const ey = topY + (8 + i * 14) * esc;
        for (const [cor, lw] of [["#35b36b", 7 * esc], ["#7be0a0", 2.5 * esc]]) {
          ctx.strokeStyle = cor;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(topX, topY);
          ctx.quadraticCurveTo(topX + lado * L * 0.55, topY - (20 - i * 5) * esc, ex, ey);
          ctx.stroke();
        }
      }
    }
    ctx.strokeStyle = "#35b36b";
    ctx.lineWidth = 6 * esc;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(topX, topY - 22 * esc);
    ctx.stroke();
    // cocos
    ctx.fillStyle = "#7a4a22";
    for (const dx of [-3, 4]) {
      elipse(ctx, topX + dx * esc, topY + 6 * esc, 3.4 * esc, 3.4 * esc);
      ctx.fill();
    }
    ctx.restore();
  }

  function guardaSol(x, y) {
    ctx.save();
    ctx.strokeStyle = "#e7e1d6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 54);
    ctx.stroke();
    ctx.translate(x, y - 50);
    ctx.scale(1, 0.55);
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 34, Math.PI + (k * Math.PI) / 6, Math.PI + ((k + 1) * Math.PI) / 6);
      ctx.closePath();
      ctx.fillStyle = k % 2 ? "#fff" : "#2fb86e";
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- mundo (plataformas, enfeites, personagens) ----------
  function mundo() {
    ctx.save();
    // zoom suave (só na cena do pedido), centrado no chão pra tudo continuar apoiado
    if (cena.zoom !== 1 && (estado === "cena" || estado === "abraco")) {
      const fy = FASE.chao - cam.y;
      ctx.translate(viewW / 2, fy);
      ctx.scale(cena.zoom, cena.zoom);
      ctx.translate(-viewW / 2, -fy);
    }
    ctx.translate(-cam.x, -cam.y);

    const visivel = (x, m = 80) => x > cam.x - m && x < cam.x + viewW + m;

    // a rampa em U do brinquedo da boia fica dentro da piscina, bem ao fundo (só enfeite)
    if (visivel(FASE.rampa.cx, 220)) rampaCenario();
    // o muro pintado da rua (um só, contínuo): fica atrás de tudo que está na calçada
    for (const m of FASE.muros) if (m.x1 > cam.x - 40 && m.x0 < cam.x + viewW + 40) muroMundo(m.x0, m.x1);
    // shopping: lojas do corredor, entrada de vidro e o arcade com as máquinas
    desenharLojas();
    desenharEntradaShopping();
    desenharArcadeEntrada();
    desenharMaquinas();

    for (const fx of FASE.flores) if (visivel(fx, 20)) florzinha(fx, FASE.chao);
    for (const px of FASE.palmeiras) if (visivel(px) && sobreChao(px)) palma(px, FASE.chao + 2, 96, (rnd(px) - 0.5) * 24, 1);
    for (const gx of FASE.guardasois) if (visivel(gx) && sobreChao(gx)) guardaSol(gx, FASE.chao);
    for (const x of FASE.postes) if (visivel(x, 60) && sobreChao(x)) poste(x);
    for (const x of FASE.arvores) if (visivel(x, 60) && sobreChao(x)) arvoreRua(x);
    for (const x of FASE.arbustos) if (visivel(x, 40) && sobreChao(x)) arbusto(x);
    for (let i = 0; i < FASE.postesFios.length; i++) {
      const px = FASE.postesFios[i], nx = FASE.postesFios[i + 1];
      const aparece = nx !== undefined ? (nx > cam.x - 80 && px < cam.x + viewW + 80) : visivel(px, 80);
      if (aparece && sobreChao(px)) posteFios(px, nx);
    }
    if (visivel(FASE.portao.x, 140)) portao(FASE.portao.x, CONFIG.nomeParque || "Parque Aquático");
    if (visivel(FASE.saidaParque.x, 140)) portao(FASE.saidaParque.x, CONFIG.textoSaidaParque || "Até a próxima! 👋");
    if (visivel(FASE.condominio.x, 300)) portaoCondominio(FASE.condominio.x, CONFIG.nomeCondominio || "Condomínio");
    if (visivel(FASE.churros.x, 160)) carrinhoChurros(FASE.churros.x);
    if (visivel(FASE.rampa.x, 140)) torreRampa();

    for (const p of FASE.plataformas) plataforma(p);

    for (const c of coracoes) {
      if (c.pego || c.ang !== undefined) continue;
      const bob = Math.sin(tempo * 3 + c.i) * 4;
      const brilho = ctx.createRadialGradient(c.x, c.y + bob, 2, c.x, c.y + bob, 26);
      brilho.addColorStop(0, "rgba(255,255,255,.9)");
      brilho.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = brilho;
      ctx.fillRect(c.x - 26, c.y + bob - 26, 52, 52);
      coracao(ctx, c.x, c.y + bob + 1, 28, "#c2185b");
      coracao(ctx, c.x, c.y + bob, 26, "#ff4d88");
    }

    // buquê que o Pedro largou
    if (cena.buque) desenharBuque(ctx, cena.buque.x, cena.buque.y, cena.buque.rot);

    // Mirella: espera ao lado da escada do brinquedo (e acena de novo depois da rampa)
    if (amiga.visivel && visivel(amiga.x)) desenharMirella();

    const placa = geoPlaca();
    const pedroY = pedro.y - pedro.pulo;
    // a plaquinha fica atrás do Pedro (ao lado dele enquanto ele escreve; depois sobe por trás da cabeça)
    if (placa) {
      const base = placa.cy + (placa.h * placa.esc) / 2;
      desenharCaboPlaca(ctx, placa.cx, base, pedroY - 36 - base);
      if (placa.pernas) {
        // pezinhos da plaquinha em pé no chão
        ctx.strokeStyle = "#c98b5a";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (const lado of [-1, 1]) {
          ctx.moveTo(placa.cx + lado * 22 * placa.esc, base - 2);
          ctx.lineTo(placa.cx + lado * 28 * placa.esc, FASE.chao);
        }
        ctx.stroke();
      }
      desenharPlacaEscrita(ctx, { cx: placa.cx, cy: placa.cy, esc: placa.esc, flip: placa.flip, texto: CONFIG.textoPlaca });
    }

    if (CONFIG.pedidoAtivo) desenharPedro(pedroY);
    if (placa && estado === "cena" && cena.estagio === "escrevendo") {
      // a mão dele rabiscando na borda da placa (o texto fica do outro lado, escondido)
      const mx = placa.cx - 25 + Math.sin(tempo * 17) * 3.5;
      const my = placa.cy - 8 + Math.sin(tempo * 9) * 9;
      desenharBracoEscrevendo(ctx, pedro.x + cena.lean + 13, pedroY - 31, mx, my, tempo);
      desenharRabiscos(placa);
    }

    // Kitty
    const e = estado === "abraco" ? "mostra" : cena.estagio;
    const emCena = estado === "cena" || estado === "abraco";
    if (!(kitty.piscar > 0 && Math.floor(tempo * 14) % 2)) {
      let pose = "parado";
      if (estado === "resgate") pose = "pulando";
      else if (estado === "chegada") pose = poseKittyChegada();
      else if (estado === "abraco" && !kitty.andando) pose = "abraco";
      else if (estado === "jogando" && !kitty.noChao) pose = "pulando";
      else if ((estado === "jogando" && kitty.vx) || kitty.andando) pose = "andando";
      desenharGato(ctx, {
        tipo: "kitty", x: kitty.x, y: kitty.y, dir: kitty.dir, anim: kitty.anim, pose, traje, ...deformacao(),
        inclinacao: pose === "abraco" ? 0.15 : (emCena && e === "escrevendo" ? 0.14 : 0),
        piscando: piscadela(0), rosto: estado === "chegada" ? rostoKittyChegada() : estado === "resgate" ? (resgate.t < RES_C ? "susto" : "feliz") : (emCena && e === "mostra" ? "feliz" : "normal"), t: tempo,
      });
    }
    if (estado === "cena" && !kitty.andando) {
      const bob = Math.sin(tempo * 6) * 2;
      if (e === "viraCostas" || e === "escrevendo") textoGrande("?", kitty.x + 6, kitty.y - 92 + bob, 22);
      else if (e === "viraFrente" || e === "levanta") textoGrande("!", kitty.x + 6, kitty.y - 92 + bob, 24);
    }

    // o churros na mão da Kitty (até ela chegar no arcade)
    if (segurandoChurros && estado === "jogando") desenharChurros(kitty.x + 17 * kitty.dir, kitty.y - 28 + Math.sin(tempo * 5), 0.45 * kitty.dir, 1, 1, 1);
    // a máquina da capivara chama atenção: balão quando ela chega perto
    if (estado === "jogando" && !garraGanha && kitty.x > FASE.arcade.zona.ini - 190 && kitty.x < FASE.arcade.zona.fim + 40) {
      balaoMundo([CONFIG.capivaraVista, CONFIG.dicaGarra], FASE.arcade.capivara, FASE.chao - 216);
    }
    desenharChegada();
    desenharResgate();

    if (estado === "abraco") {
      const s = 30 + Math.sin(tempo * 5) * 4;
      coracao(ctx, (kitty.x + pedro.x) / 2, FASE.chao - 95, s, "#ff4d88");
    }

    desenharParticulas();
    ctx.restore();
  }

  // terra firme? (coqueiros e guarda-sóis nunca ficam em cima da água)
  function sobreChao(x) {
    return FASE.plataformas.some((p) => p.chao && x > p.x + 16 && x < p.x + p.w - 16);
  }

  function desenharMirella() {
    const perto = Math.abs(kitty.x - amiga.x) < 260;
    const dir = kitty.x < amiga.x ? -1 : 1;
    const pose = amiga.andando ? "andando" : (perto || rampaFeita ? "tchau" : "parado");
    desenharGato(ctx, {
      tipo: "amiga", x: amiga.x, y: FASE.chao, dir, pose,
      anim: amiga.andando ? amiga.anim : tempo * 8,
      traje: "praia", rosto: "feliz", t: tempo,
    });
    // convite: só enquanto a Kitty está chegando perto da escada
    if (estado === "jogando" && !rampaFeita && kitty.x > amiga.x - 300 && kitty.x < FASE.rampa.entrada.fim + 60) {
      balaoMundo([CONFIG.amigaConvite, CONFIG.dicaSubir], amiga.x, FASE.chao - 84);
    }
  }

  // balão de fala no mundo (linhas de texto, com a pontinha apontando pra baixo)
  function balaoMundo(linhas, x, yBase) {
    ctx.save();
    ctx.font = "700 12px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // quebra as falas compridas em linhas (no máximo ~150px de largura)
    const quebradas = [];
    for (const l of linhas) {
      let atual = "";
      for (const palavra of l.split(" ")) {
        const teste = atual ? atual + " " + palavra : palavra;
        if (ctx.measureText(teste).width > 150 && atual) { quebradas.push(atual); atual = palavra; }
        else atual = teste;
      }
      quebradas.push(atual);
    }
    linhas = quebradas;
    const w = Math.max(...linhas.map((l) => ctx.measureText(l).width)) + 18;
    const h = linhas.length * 15 + 10;
    // o balão se ajusta pra nunca sair da tela (a pontinha continua apontando pra quem fala)
    const bx = Math.max(cam.x + w / 2 + 6, Math.min(cam.x + viewW - w / 2 - 6, x));
    const ponta = Math.max(bx - w / 2 + 14, Math.min(bx + w / 2 - 14, x));
    const y = yBase - h + Math.sin(tempo * 4) * 1.5;
    caminhoRetArred(ctx, bx - w / 2, y, w, h, 10);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ff4d88";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ponta - 6, y + h - 1);
    ctx.lineTo(ponta, y + h + 8);
    ctx.lineTo(ponta + 6, y + h - 1);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.fillStyle = "#d6336c";
    linhas.forEach((l, i) => ctx.fillText(l, bx, y + 12 + i * 15));
    ctx.restore();
  }

  // posição/tamanho da plaquinha em cada estágio da cena (null = ainda não existe)
  // flip: 0 = de costas (verso liso), 1 = de frente (texto visível)
  function geoPlaca() {
    if (estado !== "cena" && estado !== "abraco") return null;
    const p = pedro, c = cena;
    const m = medirPlaca(ctx, CONFIG.textoPlaca);
    const bx = p.x + 78, by = FASE.chao - 10 - m.h / 2;      // em pé no chão, ao lado dele
    const ry = p.y - 118 - (m.h * PLACA_ESC_FIM) / 2;        // levantada acima da cabeça
    const e = estado === "abraco" ? "mostra" : c.estagio;
    if (e === "largar") {
      return c.pop > 0 ? { cx: bx, cy: by, esc: Math.max(0.01, easeOutBack(c.pop)), flip: 0, h: m.h, pernas: true } : null;
    }
    if (e === "viraCostas" || e === "escrevendo" || e === "viraFrente") return { cx: bx, cy: by, esc: 1, flip: 0, h: m.h, pernas: true };
    if (e === "levanta") {
      // ele pega a plaquinha, levanta e ela vira: agora dá pra ler a pergunta
      const q = easeInOut(c.levanta);
      return {
        cx: bx + (p.x - bx) * q,
        cy: by + (ry - by) * q - Math.sin(Math.PI * q) * 26,
        esc: 1 + (PLACA_ESC_FIM - 1) * q,
        flip: clamp01(c.levanta * 2.2), h: m.h, pernas: q < 0.1,
      };
    }
    if (e === "mostra") return { cx: p.x, cy: ry, esc: PLACA_ESC_FIM, flip: 1, h: m.h, pernas: false };
    return null;
  }

  function desenharPedro(y) {
    const p = pedro, c = cena;
    const emCena = estado === "cena";
    const abraco = estado === "abraco";
    const e = c.estagio;
    let rosto = "normal", suor = 0, tremer = 0, pose = p.pose, dir = p.dir, sx = 1, olhar = -1;

    if (abraco) {
      rosto = "feliz";
      pose = "abraco";
    } else if (emCena) {
      rosto = "timido";
      suor = 1;
      if (e === "chegando" || e === "tremendo" || e === "largar") {
        tremer = Math.sin(tempo * 34) * 1.8;
      } else if (e === "viraCostas") {
        // gira como uma cartinha: encolhe a frente e abre as costas
        const q = c.giro;
        if (q < 0.5) sx = Math.max(0.05, 1 - 2 * q);
        else { pose = "costas"; dir = 1; sx = Math.max(0.05, 2 * q - 1); }
        tremer = Math.sin(tempo * 34) * 1.8;
      } else if (e === "escrevendo") {
        pose = "costas";
        dir = 1;
        tremer = Math.sin(tempo * 26) * 1.4;
      } else if (e === "viraFrente") {
        // vira de volta pra ela, todo tímido
        rosto = "timido";
        olhar = -1;
        const q = c.giro;
        if (q < 0.5) { pose = "costas"; dir = 1; sx = Math.max(0.05, 1 - 2 * q); }
        else { sx = Math.max(0.05, 2 * q - 1); }
        tremer = Math.sin(tempo * 40) * 2.8;
      } else if (e === "levanta") {
        rosto = "timido";
        tremer = Math.sin(tempo * 40) * 2.6;
      } else if (e === "mostra") {
        rosto = "timido"; // continua tímido enquanto pergunta
        tremer = Math.sin(tempo * 36) * 2;
      }
    } else {
      // ela ainda está chegando: ele vai ficando mais e mais sem jeito
      const tim = timidez();
      rosto = tim > 0.15 ? "timido" : "normal";
      suor = tim;
      tremer = Math.sin(tempo * 32) * 1.3 * tim;
    }

    desenharGato(ctx, {
      tipo: "pedro", x: p.x + (emCena ? c.lean : 0), y, traje: "praia", dir, pose, sx, braco: false,
      flores: p.flores && !abraco && !(emCena && (e === "viraCostas" || e === "escrevendo" || e === "viraFrente" || e === "levanta" || e === "mostra")),
      tremer, rosto, suor, olhar, t: tempo, anim: tempo * 10,
      inclinacao: abraco ? -0.15 : (emCena && e === "escrevendo" ? 0.12 : 0),
      piscando: piscadela(1.3),
    });
  }

  // sinais de que ele está escrevendo escondido: rabiscos voando e o "rabisca rabisca"
  function desenharRabiscos(placa) {
    const x0 = placa.cx - 14, y0 = placa.cy - placa.h / 2 - 8;
    ctx.save();
    ctx.strokeStyle = "#d6336c";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const f = (tempo * 1.3 + i / 3) % 1;
      const x = x0 + f * 20 - 6, y = y0 - f * 16;
      ctx.globalAlpha = Math.sin(f * Math.PI) * 0.9;
      ctx.beginPath();
      for (let k = 0; k <= 5; k++) {
        const px = x + k * 3, py = y + Math.sin(k * 1.8 + tempo * 18 + i) * 2.2;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
    textoGrande(CONFIG.textoRabisco, placa.cx, y0 - 28 + Math.sin(tempo * 6) * 2, 13, "#fff", "#d6336c");
  }

  function piscadela(fase) {
    return (tempo + fase) % 3.4 < 0.12;
  }

  function plataforma(p) {
    if (p.x > cam.x + viewW + 20 || p.x + p.w < cam.x - 20) return;
    const cx = p.x + p.w / 2, th = temaDe(cx);
    if (th === 5) return plataformaArcade(p);
    if (th === 4) return plataformaInterior(p);
    if (th === 3) return p.chao ? plataformaPraca(p) : plataformaRua(p);
    if (th === 2) return plataformaRua(p);
    if (th === 1) return plataformaParque(p);

    const cobertura = p.chao ? 16 : 10;
    // massa do bolo
    caminhoRetArred(ctx, p.x, p.y, p.w, p.h, p.chao ? 6 : 8);
    ctx.fillStyle = "#f7c99f";
    ctx.fill();
    if (p.chao) {
      ctx.fillStyle = "#ffe9d2";
      for (let y = p.y + 40; y < p.y + p.h; y += 36) ctx.fillRect(p.x, y, p.w, 6);
    }
    // cobertura com "babadinho"
    ctx.fillStyle = "#ff9ec4";
    caminhoRetArred(ctx, p.x, p.y, p.w, cobertura, 6);
    ctx.fill();
    for (let x = p.x + 8; x < p.x + p.w - 4; x += 16) {
      elipse(ctx, x, p.y + cobertura, 7, 5);
      ctx.fill();
    }
    // granulado
    const cores = ["#fff", "#ffd23f", "#8fd3ff", "#b48bff"];
    for (let x = p.x + 6, i = 0; x < p.x + p.w - 6; x += 13, i++) {
      ctx.fillStyle = cores[i % 4];
      ctx.save();
      ctx.translate(x, p.y + 4 + ((i * 7) % (cobertura - 6)));
      ctx.rotate(i);
      ctx.fillRect(-2.5, -1, 5, 2);
      ctx.restore();
    }
  }

  // no parque: borda da piscina com azulejo, e pranchas coloridas no ar
  function plataformaParque(p) {
    if (p.chao) {
      ctx.fillStyle = "#bdeeff";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#8fd9f5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let y = p.y + 30; y < p.y + p.h; y += 28) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
      for (let x = p.x + 28 - (p.x % 28); x < p.x + p.w; x += 28) { ctx.moveTo(x, p.y + 12); ctx.lineTo(x, p.y + p.h); }
      ctx.stroke();
      // deck/borda
      ctx.fillStyle = "#fff4e2";
      ctx.fillRect(p.x - 2, p.y, p.w + 4, 12);
      ctx.fillStyle = "#4cc9f0";
      ctx.fillRect(p.x - 2, p.y + 10, p.w + 4, 3);
      ctx.fillStyle = "rgba(200,170,130,.35)";
      for (let x = p.x + 18; x < p.x + p.w - 6; x += 36) ctx.fillRect(x, p.y + 3, 14, 2);
    } else {
      caminhoRetArred(ctx, p.x, p.y, p.w, p.h, 10);
      ctx.fillStyle = "#ffd23f";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#c79a00";
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.75)";
      for (let x = p.x + 12; x < p.x + p.w - 10; x += 22) ctx.fillRect(x, p.y + 3, 10, p.h - 6);
    }
  }

  function florzinha(x, y) {
    ctx.strokeStyle = "#5cb874";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 16);
    ctx.stroke();
    const balanco = Math.sin(tempo * 2 + x) * 1.5;
    ctx.fillStyle = x % 3 ? "#fff" : "#ffd23f";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      elipse(ctx, x + balanco + Math.cos(a) * 4, y - 19 + Math.sin(a) * 4, 3.4, 3.4);
      ctx.fill();
    }
    elipse(ctx, x + balanco, y - 19, 2.4, 2.4);
    ctx.fillStyle = "#ff8fb8";
    ctx.fill();
  }

  // calçada da rua (chão) e jardineiras de tijolo (plataformas no ar)
  function plataformaRua(p) {
    if (p.chao) {
      // calçada: pedras claras em cima, meio-fio, e a base de tijolo
      ctx.fillStyle = "#b79b78";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "rgba(90,60,35,.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let y = p.y + 40; y < p.y + p.h; y += 26) { ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); }
      ctx.stroke();
      // meio-fio pintado de preto e branco (alternando a cada 22px, fixo no mundo)
      for (let cx = Math.floor(p.x / 22) * 22; cx < p.x + p.w; cx += 22) {
        const ini = Math.max(cx, p.x), fim = Math.min(cx + 22, p.x + p.w);
        ctx.fillStyle = Math.floor(cx / 22) % 2 ? "#2a2a2e" : "#f1f1ee";
        ctx.fillRect(ini, p.y + 14, fim - ini, 9);
      }
      ctx.fillStyle = "#e3ded3";
      ctx.fillRect(p.x - 2, p.y, p.w + 4, 15);
      ctx.strokeStyle = "#cdbb9b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = p.x + 40 - (p.x % 40); x < p.x + p.w; x += 40) { ctx.moveTo(x, p.y); ctx.lineTo(x, p.y + 14); }
      ctx.stroke();
    } else {
      // jardineira: bloco de tijolos com um matinho em cima
      ctx.fillStyle = "#a8643c";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#8d5230";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let y = p.y + 8, k = 0; y < p.y + p.h; y += 8, k++) {
        ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y);
        for (let x = p.x + (k % 2 ? 10 : 20); x < p.x + p.w; x += 20) { ctx.moveTo(x, y - 8); ctx.lineTo(x, y); }
      }
      ctx.stroke();
      ctx.fillStyle = "#d3b08a";
      ctx.fillRect(p.x - 2, p.y - 2, p.w + 4, 6);
      ctx.fillStyle = "#7aa068";
      for (let x = p.x + 8; x < p.x + p.w - 4; x += 16) {
        elipse(ctx, x, p.y - 3, 8, 6);
        ctx.fill();
      }
    }
  }

  function poste(x) {
    const y = FASE.chao;
    const brilho = ctx.createRadialGradient(x + 15, y - 98, 2, x + 15, y - 98, 44);
    brilho.addColorStop(0, "rgba(255,226,160,.5)");
    brilho.addColorStop(1, "rgba(255,226,160,0)");
    ctx.fillStyle = brilho;
    ctx.fillRect(x - 30, y - 142, 90, 90);
    ctx.fillStyle = "#3b3030";
    ctx.fillRect(x - 2, y - 98, 4, 98);
    ctx.fillRect(x - 6, y - 6, 12, 6);
    ctx.strokeStyle = "#3b3030";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y - 98);
    ctx.quadraticCurveTo(x, y - 108, x + 14, y - 106);
    ctx.stroke();
    caminhoRetArred(ctx, x + 8, y - 108, 16, 8, 3);
    ctx.fillStyle = "#3b3030";
    ctx.fill();
    ctx.fillStyle = "#ffe9a8";
    ctx.fillRect(x + 11, y - 101, 10, 3);
  }

  function arvoreRua(x) {
    const y = FASE.chao;
    ctx.fillStyle = "#7a4e2d";
    ctx.fillRect(x - 4, y - 54, 8, 54);
    for (const [dx, dy, r, c] of [[0, -74, 25, "#86a96d"], [-17, -60, 17, "#7d9f66"], [17, -60, 17, "#7d9f66"], [3, -86, 15, "#9bbd82"]]) {
      ctx.fillStyle = c;
      elipse(ctx, x + dx, y + dy, r, r);
      ctx.fill();
    }
  }

  function arbusto(x) {
    const y = FASE.chao;
    ctx.fillStyle = "#7aa068";
    for (const [dx, dy, rx, ry] of [[0, -10, 22, 12], [-15, -8, 13, 9], [15, -8, 13, 9]]) {
      elipse(ctx, x + dx, y + dy, rx, ry);
      ctx.fill();
    }
    ctx.fillStyle = "#93b880";
    elipse(ctx, x - 4, y - 14, 9, 5);
    ctx.fill();
  }

  // entrada do condomínio (inspirada na de verdade): portão de correr de ferro com painéis laranja,
  // guarita com telhado de zinco, cancela laranja e amarela levantada, cone e a placa com o nome
  function portaoCondominio(x, txt) {
    const y = FASE.chao;
    // o portão é BEM maior (na vida real ele toma a rua inteira): desenho em escala 1,5, um pouco ao fundo
    ctx.save();
    ctx.translate(x, y - 4);
    ctx.scale(1.5, 1.5);
    ctx.translate(-x, -y);
    // portão de correr (barras pretas em cima, painéis laranja embaixo)
    const gx = x - 100, gw = 96;
    ctx.fillStyle = "#3d4a46";
    ctx.fillRect(gx, y - 92, gw, 92);
    ctx.fillStyle = "#1f2a27";
    for (let k = 0; k < 9; k++) ctx.fillRect(gx + 4 + k * 10.3, y - 88, 3.5, 44);
    ctx.fillStyle = "#e08a5a";
    ctx.fillRect(gx + 3, y - 46, gw - 6, 42);
    ctx.fillStyle = "#f0a070";
    for (let k = 0; k < 8; k++) ctx.fillRect(gx + 8 + k * 11.5, y - 46, 5, 42);
    ctx.fillStyle = "#3d4a46";
    ctx.fillRect(gx - 4, y - 5, gw + 118, 5);
    // guarita
    const bx = x + 8;
    ctx.fillStyle = "#e8b9a0";
    ctx.fillRect(bx, y - 70, 64, 70);
    ctx.fillStyle = "#e07a4a";
    ctx.fillRect(bx, y - 18, 64, 18);
    ctx.fillStyle = "#f4ecdc";
    ctx.fillRect(bx + 8, y - 62, 42, 30);
    ctx.fillStyle = "#2a2f3a";
    ctx.fillRect(bx + 10, y - 60, 38, 26);
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(bx + 12, y - 58, 8, 22);
    // telhado de zinco cobrindo o portão e a guarita
    ctx.fillStyle = "#4b5560";
    ctx.fillRect(gx - 2, y - 102, 5, 102);
    ctx.fillRect(bx + 64, y - 106, 5, 106);
    ctx.beginPath();
    ctx.moveTo(gx - 12, y - 98);
    ctx.lineTo(bx + 82, y - 110);
    ctx.lineTo(bx + 82, y - 101);
    ctx.lineTo(gx - 12, y - 90);
    ctx.closePath();
    ctx.fillStyle = "#707a80";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 24; k++) { const px = gx - 6 + k * 9.6; ctx.moveTo(px, y - 97 - k * 0.5); ctx.lineTo(px, y - 91 - k * 0.5); }
    ctx.stroke();
    // placa com o nome do condomínio, presa no telhado
    ctx.font = "700 14px Fredoka, sans-serif";
    const w = Math.max(64, ctx.measureText(txt).width + 26);
    ctx.strokeStyle = "#4b5560";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 8, y - 124); ctx.lineTo(x - w / 2 + 8, y - 103);
    ctx.moveTo(x + w / 2 - 8, y - 124); ctx.lineTo(x + w / 2 - 8, y - 105);
    ctx.stroke();
    caminhoRetArred(ctx, x - w / 2, y - 150, w, 30, 5);
    ctx.fillStyle = "#2f5f4a";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#e9e4d4";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, x, y - 135);
    // cancela levantada (laranja e amarela)
    const cx0 = bx + 96;
    ctx.fillStyle = "#e07a4a";
    ctx.fillRect(cx0 - 6, y - 30, 14, 30);
    ctx.save();
    ctx.translate(cx0 + 1, y - 28);
    ctx.rotate(-1.2);
    for (let k = 0; k < 7; k++) {
      ctx.fillStyle = k % 2 ? "#f2d04a" : "#e07a4a";
      ctx.fillRect(k * 10, -3, 10, 6);
    }
    ctx.restore();
    // cone
    ctx.fillStyle = "#e8742a";
    ctx.beginPath();
    ctx.moveTo(cx0 + 28, y);
    ctx.lineTo(cx0 + 46, y);
    ctx.lineTo(cx0 + 40, y - 28);
    ctx.lineTo(cx0 + 34, y - 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx0 + 31, y - 20, 12, 4);
    ctx.restore();
  }

  // poste de concreto com fios (a parte de baixo pintada de branco, como nas ruas daqui)
  function posteFios(x, proximo) {
    const y = FASE.chao;
    ctx.fillStyle = "#9a948a";
    ctx.fillRect(x - 5, y - 210, 10, 210);
    ctx.fillStyle = "#f0eee8";
    ctx.fillRect(x - 5, y - 72, 10, 72);
    ctx.fillStyle = "#7a7468";
    ctx.fillRect(x - 30, y - 202, 60, 5);
    ctx.fillRect(x - 22, y - 184, 44, 4);
    ctx.fillStyle = "#cfd3d6";
    for (const dx of [-26, 0, 26]) ctx.fillRect(x + dx - 2, y - 208, 4, 6);
    // fios
    ctx.strokeStyle = "#2b2b2e";
    ctx.lineWidth = 1.2;
    const fim = proximo === undefined ? x + 520 : proximo;
    for (const [dx, dy] of [[-26, 0], [0, 0], [26, 0], [-18, 18], [18, 18]]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y - 206 + dy);
      ctx.quadraticCurveTo((x + fim) / 2 + dx, y - 206 + dy + 30, fim + dx, y - 206 + dy);
      ctx.stroke();
    }
  }

  // O CARRO DO CHURROS (inspirado no de verdade): uma van vinho, com um guarda-sol grande de flores,
  // uma mesinha com churros e a moça do lado de fora. x = traseira da van; a van fica à direita.
  function carrinhoChurros(x) {
    const y = FASE.chao;
    const pulo = 0; // a van está estacionada: não pula nem mexe as rodas
    const VIN = "#8a2748", VIN2 = "#5f1a33", LINHA = "#3b1020";

    // ---------- a van (de perfil, de frente pra direita) ----------
    ctx.save();
    ctx.translate(0, -pulo);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    elipse(ctx, x + 78, y + 1, 84, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x, y - 82);
    ctx.lineTo(x + 102, y - 82);
    ctx.lineTo(x + 120, y - 62);
    ctx.lineTo(x + 150, y - 58);
    ctx.lineTo(x + 154, y - 24);
    ctx.lineTo(x + 154, y - 14);
    ctx.closePath();
    ctx.fillStyle = VIN;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = LINHA;
    ctx.stroke();
    ctx.fillStyle = VIN2;
    ctx.fillRect(x + 1.5, y - 30, 151, 10);
    // vidros
    ctx.beginPath();
    ctx.moveTo(x + 84, y - 76);
    ctx.lineTo(x + 101, y - 76);
    ctx.lineTo(x + 116, y - 61);
    ctx.lineTo(x + 84, y - 61);
    ctx.closePath();
    ctx.fillStyle = "#2a2f3a";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.stroke();
    caminhoRetArred(ctx, x + 14, y - 76, 58, 22, 3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 22, y - 72); ctx.lineTo(x + 32, y - 58);
    ctx.moveTo(x + 90, y - 72); ctx.lineTo(x + 98, y - 62);
    ctx.stroke();
    // letreiro na lateral
    caminhoRetArred(ctx, x + 14, y - 50, 78, 17, 4);
    ctx.fillStyle = "#fff3d6";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#8c5836";
    ctx.stroke();
    ctx.fillStyle = "#8a2748";
    ctx.font = "700 12px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CHURROS", x + 53, y - 41);
    // porta, maçaneta, farol, lanterna, para-choques
    ctx.strokeStyle = VIN2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 78, y - 82); ctx.lineTo(x + 78, y - 30);
    ctx.stroke();
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(x + 84, y - 52, 8, 3);
    elipse(ctx, x + 150, y - 46, 3.5, 5);
    ctx.fillStyle = "#ffe9a8";
    ctx.fill();
    ctx.fillStyle = "#d9503a";
    ctx.fillRect(x - 1, y - 52, 4, 12);
    ctx.fillStyle = "#3a3a40";
    ctx.fillRect(x + 148, y - 24, 9, 8);
    ctx.fillRect(x - 4, y - 24, 7, 8);
    // rodas
    for (const wx of [x + 32, x + 122]) {
      elipse(ctx, wx, y - 14, 19, 19);
      ctx.fillStyle = "#1c1418";
      ctx.fill();
      elipse(ctx, wx, y - 14, 14, 14);
      ctx.fillStyle = "#2b2b30";
      ctx.fill();
      elipse(ctx, wx, y - 14, 6, 6);
      ctx.fillStyle = "#c8c8d0";
      ctx.fill();
      ctx.strokeStyle = "#c8c8d0";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI;
        ctx.moveTo(wx - Math.cos(a) * 9, y - 14 - Math.sin(a) * 9);
        ctx.lineTo(wx + Math.cos(a) * 9, y - 14 + Math.sin(a) * 9);
      }
      ctx.stroke();
    }
    ctx.restore();

    // ---------- a moça, em pé do lado de fora, entre a mesinha e a van ----------
    {
      const fase = estado === "chegada" ? chegada.fase : "";
      let pose = "parado";
      if (fase === "ola" || fase === "entrega" || fase === "pago") pose = "tchau";
      else if (fase === "prepara") pose = "andando";
      else if (!fase && Math.abs(kitty.x - x) < 340) pose = "tchau";
      ctx.save();
      ctx.translate(x - 58, y);
      desenharGato(ctx, { tipo: "vendedora", x: 0, y: 0, dir: -1, pose, anim: tempo * 8, rosto: "feliz", t: tempo, piscando: piscadela(0.5) });
      ctx.restore();
    }

    // ---------- mesinha com toalha xadrez e bandeja de churros ----------
    {
      const tx = x - 104;
      ctx.strokeStyle = "#6b4a3a";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx - 20, y - 44); ctx.lineTo(tx - 26, y);
      ctx.moveTo(tx + 20, y - 44); ctx.lineTo(tx + 26, y);
      ctx.moveTo(tx - 22, y - 8); ctx.lineTo(tx + 22, y - 8);
      ctx.stroke();
      caminhoRetArred(ctx, tx - 30, y - 50, 60, 7, 2);
      ctx.fillStyle = "#c98b5a";
      ctx.fill();
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = k % 2 ? "#fff" : "#ffd0dc";
        ctx.fillRect(tx - 30 + k * 10, y - 44, 10, 12);
      }
      caminhoRetArred(ctx, tx - 22, y - 56, 44, 7, 3);
      ctx.fillStyle = "#e8d9b8";
      ctx.fill();
      for (let k = 0; k < 5; k++) {
        caminhoRetArred(ctx, tx - 18 + k * 8.5, y - 69, 5.5, 14, 2.7);
        ctx.fillStyle = "#e3a857";
        ctx.fill();
        ctx.strokeStyle = "#8a5a2a";
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    }

    // ---------- o guarda-sol grande de flores (inclinado, por cima da moça e da mesinha) ----------
    {
      const px = x - 84, topo = y - 128;
      ctx.strokeStyle = "#8a7a6a";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, topo + 6);
      ctx.stroke();
      ctx.save();
      ctx.translate(px, topo);
      ctx.rotate(-0.16);
      const domo = () => {
        ctx.beginPath();
        ctx.moveTo(-84, 6);
        ctx.quadraticCurveTo(-62, -48, 0, -48);
        ctx.quadraticCurveTo(62, -48, 84, 6);
        for (let k = 0; k < 6; k++) {
          const x1 = 84 - k * 28, x2 = x1 - 28;
          ctx.quadraticCurveTo((x1 + x2) / 2, 16, x2, 6);
        }
        ctx.closePath();
      };
      domo();
      ctx.fillStyle = "#f3ecd0";
      ctx.fill();
      ctx.save();
      domo();
      ctx.clip();
      // gomos
      ctx.strokeStyle = "rgba(150,130,80,.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = -3; k <= 3; k++) { ctx.moveTo(0, -48); ctx.lineTo(k * 28, 8); }
      ctx.stroke();
      // flores e folhinhas
      const cores = ["#e87c8c", "#d9503a", "#6bb6a8", "#f0a46a"];
      for (let i = 0; i < 26; i++) {
        const fx = -78 + rnd(i + 300) * 156, fy = -42 + rnd(i + 400) * 48;
        ctx.fillStyle = "#7aa068";
        elipse(ctx, fx + 5, fy + 2, 4, 2, 0.5);
        ctx.fill();
        ctx.fillStyle = cores[i % 4];
        elipse(ctx, fx, fy, 3.4, 3.4);
        ctx.fill();
        ctx.fillStyle = "#fff6c2";
        elipse(ctx, fx, fy, 1.2, 1.2);
        ctx.fill();
      }
      ctx.restore();
      domo();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "#cfc39a";
      ctx.stroke();
      ctx.restore();
    }

    // fumacinha cheirosa saindo da mesinha
    for (let k = 0; k < 3; k++) {
      const f = (tempo * 0.5 + k / 3) % 1;
      ctx.globalAlpha = (1 - f) * 0.45;
      ctx.fillStyle = "#fff";
      elipse(ctx, x - 104 + Math.sin(f * 6 + k) * 8, y - 80 - f * 34, 5 + f * 7, 4 + f * 5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // portão de entrada do parque
  function portao(x, txt) {
    const y = FASE.chao;
    ctx.font = "700 15px Fredoka, sans-serif";
    const w = Math.max(150, ctx.measureText(txt).width + 40);

    for (const lado of [-1, 1]) {
      const px = x + lado * (w / 2);
      caminhoRetArred(ctx, px - 8, y - 112, 16, 112, 5);
      preencherContornar(ctx, "#fff");
      ctx.fillStyle = "#4cc9f0";
      for (let yy = y - 100; yy < y - 6; yy += 22) ctx.fillRect(px - 8, yy, 16, 9);
    }
    // bandeirinhas
    const cores = ["#ff8fb8", "#ffd23f", "#4cc9f0", "#9b8bff"];
    for (let i = 0; i < 8; i++) {
      const fx = x - w / 2 + 6 + (i * (w - 12)) / 7;
      ctx.beginPath();
      ctx.moveTo(fx - 7, y - 142);
      ctx.lineTo(fx + 7, y - 142);
      ctx.lineTo(fx, y - 128 + Math.sin(tempo * 3 + i) * 1.5);
      ctx.closePath();
      ctx.fillStyle = cores[i % 4];
      ctx.fill();
    }
    // faixa com o nome
    const g = ctx.createLinearGradient(0, y - 134, 0, y - 94);
    g.addColorStop(0, "#7be0ff");
    g.addColorStop(1, "#2fb4e8");
    caminhoRetArred(ctx, x - w / 2 - 6, y - 134, w + 12, 38, 13);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, x, y - 114);
  }

  // torre de acesso ao brinquedo da boia (a plataforma de cima encosta na borda da rampa)
  function torreRampa() {
    const x = FASE.rampa.x, y = FASE.chao;
    const topo = y - 126; // altura da plataforma = altura da borda da rampa
    // escada diagonal
    ctx.strokeStyle = "#2f6fb5";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 100, y); ctx.lineTo(x - 40, topo + 8);
    ctx.moveTo(x - 82, y); ctx.lineTo(x - 40, topo + 28);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i < 7; i++) {
      const f = i / 7;
      ctx.moveTo(x - 100 + 60 * f - 4, y - (y - topo - 8) * f);
      ctx.lineTo(x - 82 + 42 * f + 2, y - (y - topo - 28) * f);
    }
    ctx.stroke();
    // pernas + cruzetas
    ctx.fillStyle = "#3a8dde";
    ctx.fillRect(x - 38, topo, 8, y - topo);
    ctx.fillRect(x + 30, topo, 8, y - topo);
    ctx.strokeStyle = "#6ab4ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let yy = y; yy > topo + 20; yy -= 42) {
      ctx.moveTo(x - 34, yy); ctx.lineTo(x + 34, yy - 42);
      ctx.moveTo(x + 34, yy); ctx.lineTo(x - 34, yy - 42);
    }
    ctx.stroke();
    // plataforma (vai até a borda da rampa) + corrimão
    ctx.fillStyle = "#2f6fb5";
    ctx.fillRect(x - 48, topo - 4, 128, 9);
    ctx.strokeStyle = "#6ab4ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 46, topo - 34); ctx.lineTo(x + 46, topo - 34);
    ctx.moveTo(x - 46, topo - 4); ctx.lineTo(x - 46, topo - 34);
    ctx.moveTo(x + 46, topo - 4); ctx.lineTo(x + 46, topo - 34);
    ctx.stroke();
    // placa
    caminhoRetArred(ctx, x - 50, topo - 78, 100, 30, 10);
    ctx.fillStyle = "#ffd23f";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#c79a00";
    ctx.stroke();
    ctx.fillStyle = "#7a4a00";
    ctx.font = "700 14px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🛟 Boia", x, topo - 63);
    // setinha pulando no pé da escada (só até alguém usar o brinquedo)
    if (!rampaFeita) {
      const sx = x - 90, sy = y - 78 + Math.sin(tempo * 5) * 4;
      ctx.beginPath();
      ctx.moveTo(sx - 9, sy - 8);
      ctx.lineTo(sx + 9, sy - 8);
      ctx.lineTo(sx, sy + 6);
      ctx.closePath();
      ctx.fillStyle = "#ffd23f";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#c79a00";
      ctx.stroke();
    }
  }

  // a rampa em U dentro da piscina (enfeite ao fundo: dá pra passar na frente, não atrapalha)
  function rampaCenario() {
    const R = 125, cx = FASE.rampa.cx, gY = FASE.chao, cy = gY - 14 - R, maxAng = 1.45;
    ctx.save();
    ctx.globalAlpha = 0.96;
    // escoras
    ctx.strokeStyle = "#8fa3b8";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (const a of [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2]) {
      const ex = cx + (R + 16) * Math.sin(a), ey = cy + (R + 16) * Math.cos(a);
      ctx.moveTo(ex, ey); ctx.lineTo(ex, gY + 14);
    }
    ctx.stroke();
    // casca creme + superfície interna
    ctx.beginPath();
    ctx.arc(cx, cy, R + 16, Math.PI / 2 - maxAng, Math.PI / 2 + maxAng);
    ctx.arc(cx, cy, R, Math.PI / 2 + maxAng, Math.PI / 2 - maxAng, true);
    ctx.closePath();
    ctx.fillStyle = "#fff8ea";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#cdbfa6";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 3, Math.PI / 2 - maxAng, Math.PI / 2 + maxAng);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(76,201,240,.55)";
    ctx.stroke();
    // a boia amarela parada lá embaixo, mostrando que é um brinquedo
    const bx = cx, by = cy + R - 12;
    caminhoRetArred(ctx, bx - 28, by - 8, 56, 17, 8);
    ctx.fillStyle = "#ffd23f";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#c79a00";
    ctx.stroke();
    ctx.restore();
  }

  // ---------- cena da rampa em U ----------
  function cenaRampa() {
    const g = geoRampa();
    const { R, cx, cy, gY } = g;
    const maxAng = 1.45;

    // deck do parque
    ctx.fillStyle = "#bdeeff";
    ctx.fillRect(0, gY, viewW, viewH - gY + 4);
    ctx.fillStyle = "#fff4e2";
    ctx.fillRect(0, gY, viewW, 12);
    ctx.fillStyle = "#4cc9f0";
    ctx.fillRect(0, gY + 10, viewW, 3);

    // palmeiras ao lado
    palma(viewW * 0.07, gY + 2, 100, 14, 1);
    palma(viewW * 0.95, gY + 2, 120, -16, 1.05);

    // escoras por trás da rampa
    ctx.strokeStyle = "#8fa3b8";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (const a of [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2]) {
      const ex = cx + (R + 16) * Math.sin(a), ey = cy + (R + 16) * Math.cos(a);
      ctx.moveTo(ex, ey); ctx.lineTo(ex, gY + 2);
    }
    ctx.stroke();

    // torre azul da esquerda (de onde a boia sai)
    const xl = cx - (R + 8) * Math.sin(maxAng), yl = cy + (R + 8) * Math.cos(maxAng);
    ctx.fillStyle = "#3a8dde";
    ctx.fillRect(xl - 34, yl, 8, gY - yl);
    ctx.fillRect(xl - 2, yl, 8, gY - yl);
    ctx.fillStyle = "#2f6fb5";
    ctx.fillRect(xl - 40, yl - 4, 52, 8);
    ctx.strokeStyle = "#6ab4ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xl - 40, yl - 30); ctx.lineTo(xl + 8, yl - 30);
    ctx.moveTo(xl - 40, yl - 4); ctx.lineTo(xl - 40, yl - 30);
    ctx.stroke();

    // a rampa: casca creme com a superfície interna branca
    ctx.beginPath();
    ctx.arc(cx, cy, R + 16, Math.PI / 2 - maxAng, Math.PI / 2 + maxAng);
    ctx.arc(cx, cy, R, Math.PI / 2 + maxAng, Math.PI / 2 - maxAng, true);
    ctx.closePath();
    ctx.fillStyle = "#fff8ea";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#cdbfa6";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 3, Math.PI / 2 - maxAng, Math.PI / 2 + maxAng);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(76,201,240,.55)";
    ctx.stroke();

    // a boia com a Kitty e a amiga ruiva
    const r = rampa;
    const antes = r.t < 1.2;           // esperando soltar
    const primeira = !antes && r.picos < 1; // primeira descida + primeira subida: pânico!
    const rosto = primeira ? "susto" : antes ? "normal" : "feliz";
    const suor = antes ? 0.7 : primeira ? 1 : 0;
    const pf = pontoRampa(g, r.ang, 10);
    ctx.save();
    ctx.translate(pf.x + (antes ? Math.sin(tempo * 40) * 0.8 : 0), pf.y);
    ctx.rotate(-r.ang + (antes ? 0 : Math.sin(tempo * 7) * 0.03));
    ctx.save();
    ctx.rotate(r.ang * 0.5); // as duas ficam mais "em pé" que a boia
    ctx.scale(0.55, 0.55);
    const pose = antes ? "parado" : "pulando";
    desenharGato(ctx, { tipo: "kitty", x: -30, y: -5, dir: 1, pose, traje: "praia", rosto, suor, t: tempo, inclinacao: 0.05 });
    desenharGato(ctx, { tipo: "amiga", x: 30, y: -5, dir: 1, pose, traje: "praia", rosto, suor, t: tempo, inclinacao: -0.05 });
    ctx.restore();
    // boia amarela (por cima das perninhas)
    caminhoRetArred(ctx, -35, -9, 70, 20, 10);
    ctx.fillStyle = "#ffd23f";
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#c79a00";
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.fillRect(-26, -6, 18, 3);
    elipse(ctx, 0, 2, 5, 3.2);
    ctx.fillStyle = "#e0a800";
    ctx.fill();
    ctx.restore();

    desenharParticulas();

    // gritos e dicas (só texto)
    if (r.t < 1.6) textoGrande(CONFIG.dicaRampa, viewW / 2, 80, 20);
    const up = { x: -Math.sin(r.ang), y: -Math.cos(r.ang) };
    const bx = Math.max(62, Math.min(viewW - 62, pf.x + up.x * 78));
    const by = Math.max(74, pf.y + up.y * 78);
    if (primeira) {
      const tr = Math.sin(tempo * 45) * 2;
      textoGrande(CONFIG.gritoKitty, bx - 8 + tr, by, 22);
      textoGrande(CONFIG.gritoAmiga, bx + 8 - tr, by - 28, 19, "#fff", "#7c4dff");
    } else if (!antes && r.picos === 1) {
      textoGrande(CONFIG.risadaRampa, bx, by, 22);
    }
  }

  // ---------- API ----------
  return {
    init,
    comecar() { redimensionar(); estado = "jogando"; },
    continuar() { estado = retorno; },
    disseSim() { estado = "abraco"; cena.proxCoracao = 0; },
    // (para ensaios/testes) avança o jogo "na mão", sem depender do navegador estar visível
    avancar(seg) {
      const n = Math.max(1, Math.round(seg * 60));
      for (let i = 0; i < n; i++) { tempo += 1 / 60; atualizar(1 / 60); }
      desenhar();
    },
    get fase() { return estado === "chegada" ? "chegada:" + chegada.fase : estado; }, // (ensaio)
    get totalCoracoes() { return coracoes.length; },
    get estado() { return estado; },
    get kitty() { return kitty; },
  };
})();
