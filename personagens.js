// Personagens desenhados por código, inspirados na Hello Kitty.
// O Pedro (namorado) é inspirado no Dear Daniel; a amiga é uma gatinha de cabelo ruivo.
// Origem de cada personagem = centro dos pés. Altura total ~66px.

const CONTORNO = "#2b1a22";

function caminhoRetArred(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function preencherContornar(ctx, cor, lw = 1.8) {
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = CONTORNO;
  ctx.stroke();
}

function elipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

function coracao(ctx, x, y, tam, cor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(tam / 28, tam / 28);
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.bezierCurveTo(-20, -4, -9, -20, 0, -9);
  ctx.bezierCurveTo(9, -20, 20, -4, 0, 9);
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.restore();
}

// o = { x, y, dir, anim, pose, tipo, piscando, inclinacao, flores, tremer, traje, rosto, suor, olhar, t }
// tipo:  "kitty" | "pedro" | "amiga"
// pose:  "parado" | "andando" | "pulando" | "placa" | "abraco" | "tchau" | "escrever"
// traje: "dia" (roupa normal) | "praia" (maiô / sunga)
// rosto: "normal" | "susto" | "feliz" | "timido"
// suor:  0..1 (gotinhas de suor na testa)   olhar: -1..1 (pra onde os olhos tímidos olham)
function desenharGato(ctx, o) {
  const pose = o.pose || "parado";
  const andando = pose === "andando";
  const ar = pose === "pulando";
  const s = Math.sin(o.anim || 0);
  const praia = o.traje === "praia";
  const rosto = o.rosto || "normal";
  const amiga = o.tipo === "amiga";
  const vendedora = o.tipo === "vendedora";
  const comCabelo = amiga || vendedora;
  const cabelo = vendedora ? ["#5b3a22", "#7a4a2b"] : ["#d9481f", "#e8572a"];
  const vestido = o.tipo === "kitty" || amiga || vendedora;

  ctx.save();
  ctx.translate(o.x + (o.tremer || 0), o.y);
  ctx.scale((o.dir || 1) * (o.sx || 1), o.sy || 1); // sx/sy: esticar no pulo, amassar no pouso

  // pernas
  const levE = andando ? Math.max(0, s) * 4 : ar ? 3 : 0;
  const levD = andando ? Math.max(0, -s) * 4 : ar ? 3 : 0;
  caminhoRetArred(ctx, -9, -10 - levE, 8, 10, 3);
  preencherContornar(ctx, "#fff");
  caminhoRetArred(ctx, 1, -10 - levD, 8, 10, 3);
  preencherContornar(ctx, "#fff");

  ctx.translate(0, andando ? -Math.abs(s) * 1.5 : 0);

  // corpo
  if (vestido) {
    ctx.beginPath();
    ctx.moveTo(-8, -27);
    ctx.lineTo(8, -27);
    ctx.lineTo(13, -8);
    ctx.lineTo(-13, -8);
    ctx.closePath();
    preencherContornar(ctx, vendedora ? "#f4a261" : (praia ? (amiga ? "#9b8bff" : "#4fc3f7") : "#ff8fb8"));
    if (praia) {
      // listrinhas do maiô
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.fillRect(-9, -20, 18, 2.5);
      ctx.fillRect(-11, -13, 22, 2.5);
    }
    // golinha
    elipse(ctx, 0, -26, 5, 2.5);
    preencherContornar(ctx, "#fff", 1.2);
    if (vendedora) {
      // avental branco com bolsinho rosa
      caminhoRetArred(ctx, -7, -25, 14, 17, 3);
      preencherContornar(ctx, "#fff", 1.4);
      caminhoRetArred(ctx, -4, -17, 8, 6, 2);
      preencherContornar(ctx, "#ff8fb8", 1);
    }
  } else if (praia) {
    // peito de pelo branco + sunga de bolinhas
    caminhoRetArred(ctx, -10, -27, 20, 13, 4);
    preencherContornar(ctx, "#fff");
    caminhoRetArred(ctx, -10, -16, 20, 8, 3);
    preencherContornar(ctx, "#ff7043");
    ctx.fillStyle = "#fff";
    for (const px of [-6, 0, 6]) {
      elipse(ctx, px, -12, 1.4, 1.4);
      ctx.fill();
    }
  } else {
    caminhoRetArred(ctx, -10, -27, 20, 13, 4);
    preencherContornar(ctx, "#8fbcff");
    caminhoRetArred(ctx, -10, -16, 20, 8, 3);
    preencherContornar(ctx, "#4a69b0");
  }

  // braços
  const bracosCima = ar || pose === "placa";
  if (bracosCima) {
    // (desenhados depois da cabeça, lá no fim, senão ficam escondidos atrás dela)
  } else if (pose === "abraco") {
    elipse(ctx, 12, -20, 7, 3.6, 0.2);
    preencherContornar(ctx, "#fff");
  } else {
    const bal = andando ? s * 0.35 : 0;
    elipse(ctx, -13, -19, 3.6, 6.5, 0.25 + bal);
    preencherContornar(ctx, "#fff");
    if (pose === "tchau") {
      ctx.save();
      ctx.translate(13, -30);
      ctx.rotate(-0.6 + Math.sin(o.anim || 0) * 0.35);
      elipse(ctx, 0, -6, 3.6, 7);
      preencherContornar(ctx, "#fff");
      ctx.restore();
    } else if (pose !== "escrever" && pose !== "costas") {
      // (em "escrever" o braço direito é desenhado por fora, esticado até a caneta)
      elipse(ctx, 13, -19, 3.6, 6.5, -0.25 - bal);
      preencherContornar(ctx, "#fff");
    }
  }

  // flores (Pedro)
  if (o.flores) {
    ctx.strokeStyle = "#3d9a52";
    ctx.lineWidth = 2;
    for (const a of [-0.35, 0, 0.35]) {
      ctx.beginPath();
      ctx.moveTo(14, -16);
      ctx.lineTo(14 + Math.sin(a) * 14, -16 - Math.cos(a) * 14);
      ctx.stroke();
    }
    const cores = ["#ff4d88", "#ffd23f", "#ff8fb8"];
    [-0.35, 0, 0.35].forEach((a, i) => {
      const fx = 14 + Math.sin(a) * 15, fy = -16 - Math.cos(a) * 15;
      for (let p = 0; p < 5; p++) {
        const ang = (p / 5) * Math.PI * 2;
        elipse(ctx, fx + Math.cos(ang) * 3, fy + Math.sin(ang) * 3, 2.6, 2.6);
        ctx.fillStyle = cores[i];
        ctx.fill();
      }
      elipse(ctx, fx, fy, 1.6, 1.6);
      ctx.fillStyle = "#fff6c2";
      ctx.fill();
    });
    elipse(ctx, 14, -16, 3.6, 3.6);
    preencherContornar(ctx, "#fff");
  }

  // cabeça
  ctx.save();
  ctx.translate(0, -44);
  ctx.rotate(o.inclinacao || 0);

  if (comCabelo) {
    // volume do cabelo atrás da cabeça (a amiga tem rabo de cavalo; a moça do carrinho tem coque)
    elipse(ctx, 0, -3, 27, 20);
    preencherContornar(ctx, cabelo[0], 2);
    if (amiga) {
      ctx.save();
      ctx.translate(-24, 2);
      ctx.rotate(0.35);
      elipse(ctx, 0, 9, 7, 13);
      preencherContornar(ctx, cabelo[0], 1.8);
      ctx.restore();
      elipse(ctx, -22, -3, 4.2, 3.6);
      preencherContornar(ctx, "#ffd23f", 1.3);
    } else {
      elipse(ctx, 0, -22, 9, 8);
      preencherContornar(ctx, cabelo[0], 1.8);
    }
  }

  // orelhas
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(lado * 6, -13);
    ctx.lineTo(lado * 19, -24);
    ctx.lineTo(lado * 21, -5);
    ctx.closePath();
    preencherContornar(ctx, "#fff");
  }
  elipse(ctx, 0, 0, 24, 17.5);
  preencherContornar(ctx, "#fff", 2);

  if (comCabelo) {
    // franja
    ctx.beginPath();
    ctx.moveTo(-23.5, -3);
    ctx.quadraticCurveTo(-26, -19, 0, -19.5);
    ctx.quadraticCurveTo(26, -19, 23.5, -3);
    ctx.quadraticCurveTo(19, -10, 13, -6);
    ctx.quadraticCurveTo(7, -12, 1, -6);
    ctx.quadraticCurveTo(-6, -12, -12, -6);
    ctx.quadraticCurveTo(-19, -10, -23.5, -3);
    ctx.closePath();
    preencherContornar(ctx, cabelo[1], 1.8);
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -14);
    ctx.quadraticCurveTo(-6, -17, 2, -16);
    ctx.stroke();
  }

  if (o.tipo === "pedro" && pose !== "costas") {
    // topetinho
    ctx.beginPath();
    ctx.moveTo(-10, -15);
    ctx.quadraticCurveTo(-6, -24, -2, -16);
    ctx.quadraticCurveTo(2, -25, 6, -16);
    ctx.quadraticCurveTo(10, -22, 11, -14);
    ctx.quadraticCurveTo(0, -10, -10, -15);
    ctx.fillStyle = "#3a2a22";
    ctx.fill();
  }

  if (o.tipo === "pedro" && pose === "costas") {
    // costas da cabeça: cabelo escuro cobrindo quase tudo
    elipse(ctx, 0, -4, 23.4, 14.5);
    ctx.fillStyle = "#3a2a22";
    ctx.fill();
  }

  if (pose !== "costas") {
    // olhos e sobrancelhas
    ctx.fillStyle = CONTORNO;
    ctx.strokeStyle = CONTORNO;
    ctx.lineCap = "round";
    if (rosto === "susto") {
      for (const x of [-9, 9]) {
        elipse(ctx, x, 0.5, 4.6, 5.6);
        preencherContornar(ctx, "#fff", 1.3);
        elipse(ctx, x, 1.5, 1.7, 2.3);
        ctx.fillStyle = CONTORNO;
        ctx.fill();
      }
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-14, -8); ctx.lineTo(-5, -10.5);
      ctx.moveTo(14, -8); ctx.lineTo(5, -10.5);
      ctx.stroke();
    } else if (rosto === "feliz") {
      ctx.lineWidth = 2;
      for (const x of [-9, 9]) {
        ctx.beginPath();
        ctx.arc(x, 3.5, 3.2, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    } else if (rosto === "nervoso") {
      // olhos arregalados com as pupilas correndo de um lado pro outro
      const olhar = o.olhar || 0;
      for (const x of [-9, 9]) {
        elipse(ctx, x, 1, 4.2, 5);
        preencherContornar(ctx, "#fff", 1.3);
        elipse(ctx, x + olhar * 2.2, 2, 1.5, 2);
        ctx.fillStyle = CONTORNO;
        ctx.fill();
      }
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, -5); ctx.lineTo(-5, -9);
      ctx.moveTo(14, -5); ctx.lineTo(5, -9);
      ctx.stroke();
    } else if (rosto === "timido") {
      const olhar = o.olhar || 0;
      for (const x of [-9, 9]) {
        elipse(ctx, x + olhar * 1.6, 3.4, 2.1, 2.7);
        ctx.fillStyle = CONTORNO;
        ctx.fill();
      }
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, -4); ctx.lineTo(-5, -7.5);
      ctx.moveTo(14, -4); ctx.lineTo(5, -7.5);
      ctx.stroke();
    } else if (o.piscando) {
      ctx.lineWidth = 1.8;
      for (const x of [-9, 9]) {
        ctx.beginPath();
        ctx.moveTo(x - 2.5, 2);
        ctx.lineTo(x + 2.5, 2);
        ctx.stroke();
      }
    } else {
      elipse(ctx, -9, 1.5, 2.3, 3.2);
      ctx.fill();
      elipse(ctx, 9, 1.5, 2.3, 3.2);
      ctx.fill();
    }
    // bochechas (bem coradas quando tímido)
    const timido = rosto === "timido" || rosto === "nervoso";
    ctx.fillStyle = timido ? "rgba(255, 90, 130, .75)" : "rgba(255, 120, 160, .45)";
    elipse(ctx, -14, 7, timido ? 5 : 3.5, timido ? 3.2 : 2.2);
    ctx.fill();
    elipse(ctx, 14, 7, timido ? 5 : 3.5, timido ? 3.2 : 2.2);
    ctx.fill();
    // nariz
    elipse(ctx, 0, 6, 3.2, 2.2);
    preencherContornar(ctx, "#ffd23f", 1.2);
    // boca
    if (rosto === "susto") {
      elipse(ctx, 0, 12.5, 3.6, 4.4);
      preencherContornar(ctx, "#7a1f3a", 1.3);
    } else if (rosto === "feliz") {
      ctx.beginPath();
      ctx.arc(0, 9.5, 4.6, Math.PI * 0.08, Math.PI * 0.92);
      ctx.closePath();
      preencherContornar(ctx, "#7a1f3a", 1.2);
    } else if (rosto === "nervoso") {
      // boquinha tremida
      ctx.beginPath();
      ctx.moveTo(-5, 11.5);
      ctx.quadraticCurveTo(-2.5, 8.5, 0, 11.5);
      ctx.quadraticCurveTo(2.5, 14.5, 5, 11.5);
      ctx.strokeStyle = CONTORNO;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // bigodes
    ctx.strokeStyle = CONTORNO;
    ctx.lineWidth = 1.4;
    for (const lado of [-1, 1]) {
      for (const [y1, y2] of [[3, 0], [6, 6], [9, 12]]) {
        ctx.beginPath();
        ctx.moveTo(lado * 18, y1);
        ctx.lineTo(lado * 29, y2);
        ctx.stroke();
      }
    }
  }

  // gotinhas de suor
  if (o.suor > 0.05) {
    const n = Math.ceil(o.suor * 3);
    for (let i = 0; i < n; i++) {
      const fase = (((o.t || 0) * 0.9 + i / 3) % 1 + 1) % 1;
      const x = 19 + (i % 2) * 6;
      const y = -12 + fase * 22;
      ctx.globalAlpha = (1 - fase) * Math.min(1, o.suor + 0.3);
      ctx.beginPath();
      ctx.moveTo(x, y - 5.5);
      ctx.quadraticCurveTo(x + 4.2, y, x, y + 3);
      ctx.quadraticCurveTo(x - 4.2, y, x, y - 5.5);
      ctx.fillStyle = "#6ec6ff";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#2f8fd0";
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (o.tipo === "kitty") {
    // lacinho
    ctx.save();
    ctx.translate(14, -15);
    ctx.rotate(0.35);
    elipse(ctx, -7, 0, 7.5, 5.5);
    preencherContornar(ctx, "#e8174f", 1.5);
    elipse(ctx, 7, 0, 7.5, 5.5);
    preencherContornar(ctx, "#e8174f", 1.5);
    elipse(ctx, 0, 0, 3.6, 3.6);
    preencherContornar(ctx, "#ff3b6e", 1.5);
    ctx.restore();
  }
  ctx.restore(); // fim da cabeça

  // braços pra cima (pulo / plaquinha): ao lado da cabeça, na frente dela
  if (bracosCima) {
    const bal = ar ? Math.sin((o.anim || 0) * 1.5) * 0.12 : 0;
    elipse(ctx, -23, -40, 3.8, 7.5, -0.5 + bal);
    preencherContornar(ctx, "#fff");
    elipse(ctx, 23, -40, 3.8, 7.5, 0.5 - bal);
    preencherContornar(ctx, "#fff");
  }

  // de costas escrevendo: braço dobrado, a mão rabiscando rápido ao lado da cabeça
  if (pose === "costas" && o.braco !== false) {
    const a = o.anim || 0;
    const hx = 29 + Math.sin(a * 3.1) * 3.5, hy = -37 + Math.cos(a * 2.3) * 3;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // caneta
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - 7, hy - 7);
    ctx.strokeStyle = CONTORNO;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = "#ff4d88";
    ctx.lineWidth = 3;
    ctx.stroke();
    // braço (ombro → cotovelo → mão)
    ctx.beginPath();
    ctx.moveTo(13, -29);
    ctx.lineTo(27, -22);
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = CONTORNO;
    ctx.lineWidth = 7.4;
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4.4;
    ctx.stroke();
    elipse(ctx, hx, hy, 3.6, 3.6);
    preencherContornar(ctx, "#fff", 1.5);
    ctx.restore();
  }

  ctx.restore();
}

// Buquê caído no chão (rot = 0 em pé, ~1.2 deitado)
function desenharBuque(ctx, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = "#3d9a52";
  ctx.lineWidth = 2;
  for (const a of [-0.35, 0, 0.35]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(a) * 14, -Math.cos(a) * 14);
    ctx.stroke();
  }
  const cores = ["#ff4d88", "#ffd23f", "#ff8fb8"];
  [-0.35, 0, 0.35].forEach((a, i) => {
    const fx = Math.sin(a) * 15, fy = -Math.cos(a) * 15;
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2;
      elipse(ctx, fx + Math.cos(ang) * 3, fy + Math.sin(ang) * 3, 2.6, 2.6);
      ctx.fillStyle = cores[i];
      ctx.fill();
    }
    elipse(ctx, fx, fy, 1.6, 1.6);
    ctx.fillStyle = "#fff6c2";
    ctx.fill();
  });
  elipse(ctx, 0, 0, 3.6, 3.6);
  preencherContornar(ctx, "#fff");
  ctx.restore();
}

// Braço (com cotovelo) do ombro (sx, sy) até a caneta, com a ponta da caneta em (tx, ty)
function desenharBracoEscrevendo(ctx, sx, sy, tx, ty, t = 0) {
  // a ponta da caneta treme de leve, como quem está escrevendo
  tx += Math.sin(t * 34) * 1.2;
  ty += Math.cos(t * 27) * 1.0;
  const hx = tx + 6, hy = ty - 8; // mão
  const dx = hx - sx, dy = hy - sy;
  const d = Math.hypot(dx, dy) || 1;
  // cada pedaço do braço é um pouquinho maior que metade da distância → o cotovelo dobra pra baixo
  const L = Math.max(d / 2 + 4, 14);
  const alt = Math.sqrt(Math.max(0, L * L - (d / 2) * (d / 2))) * 1.7;
  const nx = -dy / d, ny = dx / d; // perpendicular
  const lado = ny > 0 ? 1 : -1;     // sempre dobra pra baixo
  const ex = sx + dx / 2 + nx * alt * lado, ey = sy + dy / 2 + ny * alt * lado;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // caneta
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = CONTORNO;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = "#ff4d88";
  ctx.lineWidth = 3;
  ctx.stroke();
  // braço
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(ex, ey, hx, hy);
  ctx.strokeStyle = CONTORNO;
  ctx.lineWidth = 7.4;
  ctx.stroke();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4.4;
  ctx.stroke();
  elipse(ctx, hx, hy, 3.6, 3.6);
  preencherContornar(ctx, "#fff", 1.5);
  ctx.restore();
}

// Cabo da plaquinha: do pé da placa (xTopo, yTopo) descendo "comp" pixels
function desenharCaboPlaca(ctx, x, yTopo, comp) {
  if (comp <= 0) return;
  caminhoRetArred(ctx, x - 3, yTopo - 2, 6, comp + 2, 2);
  preencherContornar(ctx, "#c98b5a", 1.5);
}

// Plaquinha estreita e alta (o texto quebra em linhas curtas)
const PLACA_W = 72;
const PLACA_LH = 20;

// Quebra o texto em linhas e calcula a altura da placa
function medirPlaca(ctx, texto) {
  ctx.save();
  ctx.font = "600 20px Caveat, cursive";
  const linhas = [];
  let atual = "";
  for (const palavra of texto.split(" ")) {
    const teste = atual ? atual + " " + palavra : palavra;
    if (ctx.measureText(teste).width > PLACA_W - 14 && atual) {
      linhas.push(atual);
      atual = palavra;
    } else atual = teste;
  }
  linhas.push(atual);
  ctx.restore();
  return { linhas, w: PLACA_W, h: Math.max(46, linhas.length * PLACA_LH + 16) };
}

// Plaquinha com o texto sendo escrito aos poucos (reveal 0..1).
// c = { cx, cy, texto, reveal, esc }  (esc aumenta tudo)
// Devolve a posição (no mundo) da ponta da caneta.
function desenharPlacaEscrita(ctx, c) {
  const m = medirPlaca(ctx, c.texto);
  const w = m.w, h = m.h;
  const esc = c.esc === undefined ? 1 : c.esc;
  const reveal = c.reveal === undefined ? 1 : c.reveal;
  if (esc <= 0) return { x: c.cx, y: c.cy };

  // flip: 0 = a gente vê só o VERSO da placa (ele escreve escondido), 1 = a frente com o texto.
  // Valores no meio fazem a placa girar (encolhe de um lado e abre do outro).
  const flip = c.flip === undefined ? 1 : c.flip;
  const larg = c.flip === undefined ? 1 : (flip < 0.5 ? 1 - 2 * flip : 2 * flip - 1);

  ctx.save();
  ctx.translate(c.cx, c.cy);
  ctx.scale(esc * Math.max(0.02, larg), esc);

  if (flip < 0.5) {
    // verso: papelão liso, só dá pra ver que tem alguma coisa escrita do outro lado
    caminhoRetArred(ctx, -w / 2, -h / 2, w, h, 9);
    ctx.fillStyle = "#e6c79a";
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#b8905a";
    ctx.stroke();
    ctx.strokeStyle = "rgba(120,80,30,.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const dy of [-h * 0.28, 0, h * 0.28]) {
      ctx.moveTo(-w / 2 + 8, dy);
      ctx.lineTo(w / 2 - 8, dy);
    }
    ctx.stroke();
    caminhoRetArred(ctx, -11, -h / 2 - 3, 22, 8, 2);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fill();
    ctx.restore();
    return { x: c.cx, y: c.cy };
  }

  caminhoRetArred(ctx, -w / 2, -h / 2, w, h, 9);
  ctx.fillStyle = "#fff8ee";
  ctx.fill();
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = "#ff4d88";
  ctx.stroke();
  coracao(ctx, -w / 2 + 2, -h / 2 + 2, 11, "#ff4d88");
  coracao(ctx, w / 2 - 2, -h / 2 + 2, 11, "#ff4d88");

  ctx.font = "600 20px Caveat, cursive";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#d6336c";

  const total = m.linhas.reduce((n, l) => n + l.length, 0);
  let restante = Math.round(reveal * total);
  const y0 = -((m.linhas.length - 1) / 2) * PLACA_LH + 2;
  let ponta = { x: -w / 2 + 12, y: y0 + 6 };
  m.linhas.forEach((linha, i) => {
    const y = y0 + i * PLACA_LH;
    const x0 = -ctx.measureText(linha).width / 2;
    const parte = linha.slice(0, Math.max(0, restante));
    if (parte) {
      ctx.fillText(parte, x0, y);
      ponta = { x: x0 + ctx.measureText(parte).width, y: y + 6 };
    }
    restante -= linha.length;
  });
  ctx.restore();
  return { x: c.cx + ponta.x * esc, y: c.cy + ponta.y * esc };
}

// O herói aranha (estilo desenho, sem logos): máscara vermelha com teia, olhos grandes brancos,
// corpo vermelho e azul. o = { x, y, dir, pose, anim }
// pose: "parado" | "balancando" (braço pra cima segurando a teia) | "puxando" (braço esticado pra frente)
function desenharAranha(ctx, o) {
  const pose = o.pose || "parado";
  const VERM = "#e23636", AZUL = "#2457c5", ESCURO = "#8f1d1d";
  const encolhido = pose === "balancando" || pose === "puxando";
  const bal = Math.sin(o.anim || 0);

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(o.dir || 1, 1);

  // pernas azuis com botas vermelhas (dobradas quando está balançando)
  const levE = encolhido ? 8 + bal * 1.5 : 0;
  const levD = encolhido ? 3 - bal * 1.5 : 0;
  for (const [x, lev] of [[-9, levE], [1, levD]]) {
    caminhoRetArred(ctx, x, -11 - lev, 8, 11, 3);
    preencherContornar(ctx, AZUL);
    caminhoRetArred(ctx, x - 0.5, -5 - lev, 9, 6, 2);
    preencherContornar(ctx, VERM);
  }

  // corpo
  caminhoRetArred(ctx, -10, -39, 20, 26, 6);
  preencherContornar(ctx, VERM);
  caminhoRetArred(ctx, -10, -21, 20, 8, 3);
  preencherContornar(ctx, AZUL);
  // teia no peito
  ctx.strokeStyle = ESCURO;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -39); ctx.lineTo(0, -21);
  ctx.moveTo(-9, -35); ctx.quadraticCurveTo(0, -31, 9, -35);
  ctx.moveTo(-9, -28); ctx.quadraticCurveTo(0, -24, 9, -28);
  ctx.stroke();
  // aranhinha preta no peito
  ctx.fillStyle = "#1d1d26";
  elipse(ctx, 0, -31, 2.2, 3.2);
  ctx.fill();
  ctx.strokeStyle = "#1d1d26";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const lado of [-1, 1]) {
    for (const [y1, y2] of [[-33, -37], [-31, -32], [-29, -26]]) {
      ctx.moveTo(lado * 2, y1);
      ctx.lineTo(lado * 7, y2);
    }
  }
  ctx.stroke();

  // braços
  ctx.lineCap = "round";
  const braco = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = CONTORNO;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = VERM;
    ctx.lineWidth = 5;
    ctx.stroke();
    elipse(ctx, x2, y2, 3.6, 3.6);
    preencherContornar(ctx, VERM, 1.4);
  };
  if (pose === "balancando") {
    braco(10, -35, 19, -57);   // segurando a teia lá em cima
    braco(-10, -35, -15, -23); // outro braço solto
  } else if (pose === "puxando") {
    braco(10, -35, 29, -39);   // atirando a teia pra frente
    braco(-10, -35, -16, -24);
  } else {
    braco(10, -35, 14, -23);
    braco(-10, -35, -14, -23);
  }

  // cabeça (máscara)
  elipse(ctx, 0, -51, 15.5, 15);
  preencherContornar(ctx, VERM, 2);
  ctx.strokeStyle = ESCURO;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -66); ctx.lineTo(0, -36);
  ctx.moveTo(-14, -58); ctx.quadraticCurveTo(0, -54, 14, -58);
  ctx.moveTo(-15, -50); ctx.quadraticCurveTo(0, -45, 15, -50);
  ctx.moveTo(-12, -42); ctx.quadraticCurveTo(0, -38, 12, -42);
  ctx.moveTo(0, -51); ctx.lineTo(-12, -62);
  ctx.moveTo(0, -51); ctx.lineTo(12, -62);
  ctx.stroke();
  // olhos grandes e brancos (inclinados)
  for (const lado of [-1, 1]) {
    elipse(ctx, lado * 6.8, -50, 6, 4, lado * 0.45);
    preencherContornar(ctx, "#fff", 1.6);
  }

  ctx.restore();
}
