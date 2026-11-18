// O quarto: primeiro modelo. Arraste cada adesivo para o lugar certo no quarto.
// Edite só o bloco QUARTO abaixo para trocar textos, itens e posições.
const QUARTO = {
  titulo: "Monte o quarto 🏠",
  dica: "Arraste cada adesivo para o lugar dele",
  tituloFim: "O quarto ficou perfeito! 💖",
  textoFim: "Tudo no lugar. Agora a fase pode começar.",
  textoBotao: "Começar a fase",
  textoEmBreve: "A fase ainda está sendo preparada 🛠️",
  acerto: ["Perfeito! 💖", "Isso! ✨", "Encaixou! 🌸", "Lindo! 🎀"],
  erro: ["Hmm, aqui não 🤔", "Quase! Tenta de novo", "Não é aí, não 😅", "Pensa no seu quarto 💭"],
  distanciaAcerto: 30,   // o quão perto do lugar certo precisa soltar
  errosAteDica: 3,       // depois de tantos erros o lugar certo pisca
  chaveSalvar: "quarto-progresso",
  // Ordem em que os adesivos aparecem (um por vez). O próximo só libera depois de vencer a fase do anterior.
  ordem: ["capivara", "cama", "janela", "quadro", "poema", "estante", "luminaria", "planta", "tapete"],
  // Fases já criadas: id do adesivo -> página da fase. Adesivo sem fase conta como concluído na hora.
  fases: { capivara: "garra.html?quarto" },
  faseTitulo: "Hora da fase! 🧸",
  faseTexto: "Você colou: ",
  faseBotao: "Jogar",
  semFase: "Essa fase ainda vai chegar 🛠️",

  // Cada item é desenhado centrado em (0,0). cx/cy = onde fica no quarto (quarto: 300 x 400).
  // z = ordem de desenho (maior fica na frente).
  itens: [
    { id: "tapete", nome: "Tapete", cx: 130, cy: 350, w: 120, h: 36, z: 0, svg: `
      <ellipse rx="60" ry="18" fill="#ffb3cf"/><ellipse rx="48" ry="13" fill="#ffe9a8"/><ellipse rx="34" ry="8" fill="#ffc2d9"/>` },
    { id: "estante", nome: "Estante", cx: 38, cy: 232, w: 56, h: 120, z: 1, svg: `
      <rect x="-28" y="-60" width="56" height="120" rx="4" fill="#e2b98a"/>
      <rect x="-23" y="-55" width="46" height="34" fill="#c99a68"/><rect x="-23" y="-17" width="46" height="34" fill="#c99a68"/><rect x="-23" y="21" width="46" height="34" fill="#c99a68"/>
      <rect x="-20" y="-50" width="7" height="29" fill="#ff8fb8"/><rect x="-12" y="-46" width="7" height="25" fill="#ffe08a"/><rect x="-4" y="-51" width="7" height="30" fill="#fff"/><rect x="4" y="-48" width="7" height="27" fill="#9fd8ff"/>
      <rect x="-20" y="-12" width="9" height="29" fill="#ffe08a"/><rect x="-10" y="-8" width="7" height="25" fill="#ff8fb8"/>
      <circle cx="10" cy="6" r="6" fill="#ffd0e1"/>
      <rect x="-14" y="30" width="28" height="25" rx="3" fill="#fff"/><path d="M-14 30h28l-6 -7h-16z" fill="#ffb3cf"/>` },
    { id: "cama", nome: "Cama", cx: 215, cy: 262, w: 130, h: 70, z: 2, svg: `
      <rect x="54" y="-35" width="11" height="70" rx="3" fill="#d9a066"/>
      <rect x="-62" y="-4" width="120" height="28" rx="6" fill="#fff"/>
      <rect x="-62" y="0" width="92" height="26" rx="6" fill="#ffb3cf"/>
      <path d="M-30 0v26M-12 0v26M6 0v26" stroke="#ffe9a8" stroke-width="5"/>
      <ellipse cx="40" cy="-6" rx="15" ry="9" fill="#ffe9a8"/>
      <rect x="-60" y="24" width="6" height="11" fill="#d9a066"/><rect x="50" y="24" width="6" height="11" fill="#d9a066"/>` },
    { id: "janela", nome: "Janela", cx: 110, cy: 105, w: 90, h: 100, z: 3, svg: `
      <rect x="-45" y="-50" width="90" height="100" rx="6" fill="#fff"/>
      <rect x="-38" y="-43" width="76" height="86" rx="3" fill="#bfe6ff"/>
      <ellipse cx="-12" cy="-22" rx="15" ry="7" fill="#fff"/><ellipse cx="0" cy="-27" rx="11" ry="7" fill="#fff"/>
      <circle cx="22" cy="-26" r="8" fill="#ffe08a"/>
      <path d="M0 -43V43M-38 0H38" stroke="#fff" stroke-width="5"/>
      <path d="M-45 -50q14 50 0 100h16q-10 -50 0 -100z" fill="#ffb3cf"/><path d="M45 -50q-14 50 0 100h-16q10 -50 0 -100z" fill="#ffb3cf"/>` },
    { id: "quadro", nome: "Quadro pintado", cx: 215, cy: 90, w: 60, h: 75, z: 3, svg: `
      <rect x="-30" y="-37" width="60" height="75" rx="3" fill="#e9b872"/>
      <rect x="-25" y="-32" width="50" height="65" fill="#fff7e6"/>
      <circle cx="-6" cy="-12" r="14" fill="#ffd0e1"/><circle cx="8" cy="-4" r="11" fill="#ffe08a"/>
      <path d="M-25 20q12 -14 25 0t25 -4v17h-50z" fill="#ffb3cf"/><path d="M-25 26q12 -10 25 0t25 -3v10h-50z" fill="#ffe9a8"/>` },
    { id: "poema", nome: "Poema", cx: 262, cy: 165, w: 40, h: 52, z: 3, svg: `
      <g transform="rotate(4)"><rect x="-20" y="-26" width="40" height="52" rx="2" fill="#fffdf5" stroke="#e8d9b0"/>
      <path d="M-13 -14h26M-13 -7h20M-13 0h26M-13 7h16" stroke="#cdb99a" stroke-width="2" stroke-linecap="round"/>
      <path d="M0 22c-8 -6 -9 -11 -4 -13c2 -1 4 1 4 3c0 -2 2 -4 4 -3c5 2 4 7 -4 13z" fill="#ff8fb8"/></g>` },
    { id: "luminaria", nome: "Luminária", cx: 98, cy: 255, w: 24, h: 70, z: 4, svg: `
      <ellipse cy="33" rx="11" ry="3.5" fill="#d9a066"/><rect x="-1.5" y="-12" width="3" height="45" fill="#d9a066"/>
      <path d="M-12 -12l4 -23h8h8l4 23z" fill="#ffe08a"/><path d="M-12 -12h24" stroke="#ffcf5a" stroke-width="2"/>` },
    { id: "planta", nome: "Plantinha", cx: 132, cy: 262, w: 32, h: 56, z: 4, svg: `
      <path d="M-13 12h26l-4 16h-18z" fill="#ff9fc2"/><rect x="-14" y="9" width="28" height="5" rx="2" fill="#ffb3cf"/>
      <ellipse cx="-8" cy="-6" rx="6" ry="14" transform="rotate(-25 -8 -6)" fill="#7fd08c"/>
      <ellipse cx="8" cy="-8" rx="6" ry="15" transform="rotate(25 8 -8)" fill="#6cc27a"/>
      <ellipse cx="0" cy="-14" rx="6" ry="16" fill="#8ddc99"/>` },
    { id: "capivara", nome: "Capivara", cx: 195, cy: 322, w: 44, h: 30, z: 5, svg: `
      <rect x="-14" y="10" width="5" height="6" rx="2" fill="#9a6f46"/><rect x="6" y="10" width="5" height="6" rx="2" fill="#9a6f46"/>
      <ellipse cx="-1" cy="3" rx="20" ry="11" fill="#c79a6b"/>
      <ellipse cx="15" cy="-2" rx="9" ry="8" fill="#c79a6b"/>
      <circle cx="12" cy="-9" r="2.6" fill="#9a6f46"/><circle cx="18.5" cy="-1.5" r="1.3" fill="#3a2a22"/>
      <ellipse cx="22" cy="1" rx="3" ry="2.4" fill="#8a603b"/>
      <path d="M-4 -4c-6 -5 -7 -9 -3 -10c2 -1 3 1 3 2c0 -1 1 -3 3 -2c4 1 3 5 -3 10z" fill="#ff6fa5"/>` },
  ],
};

(() => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("cena");
  const $ = (id) => document.getElementById(id);
  const el = (tag, attrs = {}, pai) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  };

  $("titulo").textContent = QUARTO.titulo;
  $("dica").textContent = QUARTO.dica;
  $("fim-titulo").textContent = QUARTO.tituloFim;
  $("fim-texto").textContent = QUARTO.textoFim;
  $("btn-comecar").textContent = QUARTO.textoBotao;

  // ---------- cenário ----------
  const defs = el("defs", {}, svg);
  const clip = el("clipPath", { id: "recorte" }, defs);
  el("rect", { x: 0, y: 0, width: 300, height: 400, rx: 18 }, clip);

  const sala = el("g", { "clip-path": "url(#recorte)" }, svg);
  el("rect", { width: 300, height: 290, fill: "#ffd9e8" }, sala);
  for (let x = 12; x < 300; x += 24) for (let y = 12; y < 290; y += 24) {
    el("circle", { cx: x + ((y / 24) % 2 ? 12 : 0), cy: y, r: 1.6, fill: "#ffc2da" }, sala);
  }
  el("rect", { y: 290, width: 300, height: 110, fill: "#ffeab0" }, sala);
  for (let y = 306; y < 400; y += 16) el("path", { d: `M0 ${y}H300`, stroke: "#f6d98a", "stroke-width": 1.5 }, sala);
  el("rect", { y: 284, width: 300, height: 8, fill: "#fff" }, sala);
  const camadaSala = el("g", { "clip-path": "url(#recorte)" }, svg);
  const camadaDicas = el("g", {}, svg);

  // bandeja dos adesivos
  el("rect", { x: 0, y: 408, width: 300, height: 122, rx: 18, fill: "rgba(255,255,255,.65)" }, svg);
  const camadaBandeja = el("g", {}, svg);
  const camadaArrasto = el("g", {}, svg);

  // ---------- estado ----------
  let salvo = [];
  try { salvo = JSON.parse(localStorage.getItem(QUARTO.chaveSalvar) || "[]"); } catch (e) { salvo = []; }
  const itens = QUARTO.itens.map((d, i) => ({ d, i, g: null, estado: "bandeja", erros: 0, slot: { x: 0, y: 0, s: 1 }, dica: null, t: null }));

  // concluídas = adesivos cuja fase já foi vencida. Vem de ?concluiu=id (a fase volta pra cá assim).
  const chaveFases = QUARTO.chaveSalvar + "-fases";
  let concluidas = [];
  try { concluidas = JSON.parse(localStorage.getItem(chaveFases) || "[]"); } catch (e) { concluidas = []; }
  const volta = new URLSearchParams(location.search).get("concluiu");
  if (volta && !concluidas.includes(volta)) concluidas.push(volta);
  if (volta) history.replaceState(null, "", location.pathname);
  const ordenados = QUARTO.ordem.map((id) => itens.find((i) => i.d.id === id)).filter(Boolean);

  // o adesivo da vez fica sozinho no meio da bandeja
  itens.forEach((it) => {
    it.slot = { x: 150, y: 468, s: Math.min(1.4, 90 / it.d.w, 70 / it.d.h) };
    it.g = el("g", { class: "item" }, camadaBandeja);
    it.g.innerHTML = it.d.svg;
    it.g.dataset.id = it.d.id;
    poe(it, it.slot.x, it.slot.y, it.slot.s);
    it.g.addEventListener("pointerdown", (e) => comecarArrasto(e, it));
  });

  function poe(it, x, y, s = 1, rot = 0) {
    it.t = { x, y, s, rot };
    it.g.setAttribute("transform", `translate(${x} ${y}) rotate(${rot}) scale(${s})`);
  }

  function animar(it, para, ms, depois) {
    const de = { ...it.t };
    const t0 = performance.now();
    const passo = (agora) => {
      const p = Math.min(1, (agora - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      poe(it, de.x + (para.x - de.x) * e, de.y + (para.y - de.y) * e, de.s + (para.s - de.s) * e, (de.rot || 0) * (1 - e));
      if (p < 1) requestAnimationFrame(passo); else if (depois) depois();
    };
    requestAnimationFrame(passo);
  }

  function reordenarSala() {
    itens.filter((it) => it.estado === "travado").sort((a, b) => a.d.z - b.d.z).forEach((it) => camadaSala.appendChild(it.g));
  }

  // ---------- arrastar ----------
  const ponto = svg.createSVGPoint();
  function paraSvg(e) {
    ponto.x = e.clientX; ponto.y = e.clientY;
    return ponto.matrixTransform(svg.getScreenCTM().inverse());
  }

  let ativo = null;
  function comecarArrasto(e, it) {
    if (it.estado !== "bandeja" || ativo) return;
    e.preventDefault();
    ativo = it;
    it.estado = "arrastando";
    it.g.classList.add("arrastando");
    camadaArrasto.appendChild(it.g);
    const p = paraSvg(e);
    poe(it, p.x, p.y - 36, 1);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
  }
  function mover(e) {
    if (!ativo) return;
    const p = paraSvg(e);
    poe(ativo, p.x, p.y - 36, 1);
  }
  function soltar() {
    window.removeEventListener("pointermove", mover);
    window.removeEventListener("pointerup", soltar);
    window.removeEventListener("pointercancel", soltar);
    const it = ativo; ativo = null;
    if (!it) return;
    it.g.classList.remove("arrastando");
    const dist = Math.hypot(it.t.x - it.d.cx, it.t.y - it.d.cy);
    if (dist <= QUARTO.distanciaAcerto) acertou(it); else errou(it);
  }

  function acertou(it) {
    it.estado = "travado";
    it.g.classList.add("travado");
    if (it.dica) { it.dica.remove(); it.dica = null; }
    animar(it, { x: it.d.cx, y: it.d.cy, s: 1 }, 140, () => { reordenarSala(); });
    camadaSala.appendChild(it.g);
    reordenarSala();
    toast(sorteio(QUARTO.acerto));
    salvar();
    if (QUARTO.fases[it.d.id]) setTimeout(() => mostrarFase(it), 700);
    else { concluir(it.d.id); toast(QUARTO.semFase); }
    atualizar();
  }

  // colar o adesivo abre a fase dele
  function mostrarFase(it) {
    $("fase-titulo").textContent = QUARTO.faseTitulo;
    $("fase-texto").textContent = QUARTO.faseTexto + it.d.nome;
    $("btn-fase").textContent = QUARTO.faseBotao;
    $("btn-fase").onclick = () => { location.href = QUARTO.fases[it.d.id]; };
    $("fase").classList.remove("escondido");
  }
  function concluir(id) {
    if (!concluidas.includes(id)) concluidas.push(id);
    try { localStorage.setItem(chaveFases, JSON.stringify(concluidas)); } catch (e) { /* sem salvar */ }
  }

  function errou(it) {
    it.erros++;
    it.estado = "bandeja";
    camadaBandeja.appendChild(it.g);
    it.t.rot = 6;
    animar(it, it.slot, 260);
    toast(sorteio(QUARTO.erro));
    if (it.erros >= QUARTO.errosAteDica && !it.dica) {
      it.dica = el("rect", {
        x: it.d.cx - it.d.w / 2 - 3, y: it.d.cy - it.d.h / 2 - 3, width: it.d.w + 6, height: it.d.h + 6, rx: 8,
        fill: "rgba(255,255,255,.35)", stroke: "#ff6fa5", "stroke-width": 2, "stroke-dasharray": "6 4", class: "alvo-dica",
      }, camadaDicas);
    }
  }

  // ---------- interface ----------
  let timerToast = 0;
  function toast(txt) {
    const t = $("toast");
    t.textContent = txt;
    t.classList.remove("escondido");
    clearTimeout(timerToast);
    timerToast = setTimeout(() => t.classList.add("escondido"), 1400);
  }
  const sorteio = (l) => l[Math.floor(Math.random() * l.length)];

  function salvar() {
    try { localStorage.setItem(QUARTO.chaveSalvar, JSON.stringify(itens.filter((i) => i.estado === "travado").map((i) => i.d.id))); } catch (e) { /* sem salvar */ }
  }

  // mostra só o adesivo da vez na bandeja; o resto espera a fase anterior ser vencida
  function atualizar() {
    const vez = ordenados.find((i) => !concluidas.includes(i.d.id));
    itens.forEach((it) => { it.g.style.display = it.estado === "travado" || it === vez ? "" : "none"; });
    $("contador").textContent = `🧸 ${concluidas.length}/${itens.length}`;
    if (!vez) setTimeout(() => $("fim").classList.remove("escondido"), 700);
  }

  $("btn-comecar").addEventListener("click", () => toast(QUARTO.textoEmBreve));
  $("btn-reiniciar").addEventListener("click", () => {
    concluidas = [];
    try { localStorage.setItem(chaveFases, "[]"); } catch (e) { /* sem salvar */ }
    itens.forEach((it) => {
      it.estado = "bandeja"; it.erros = 0; it.g.classList.remove("travado");
      if (it.dica) { it.dica.remove(); it.dica = null; }
      camadaBandeja.appendChild(it.g);
      poe(it, it.slot.x, it.slot.y, it.slot.s);
    });
    $("fim").classList.add("escondido");
    $("fase").classList.add("escondido");
    salvar();
    atualizar();
  });

  // retoma o que já tinha sido colado
  itens.forEach((it) => {
    if (salvo.includes(it.d.id)) {
      it.estado = "travado";
      it.g.classList.add("travado");
      poe(it, it.d.cx, it.d.cy, 1);
    }
  });
  reordenarSala();
  if (volta) { toast("Fase vencida! 🎉"); }
  concluidas = concluidas.filter((id) => itens.some((i) => i.d.id === id));
  try { localStorage.setItem(chaveFases, JSON.stringify(concluidas)); } catch (e) { /* sem salvar */ }
  atualizar();
  // se colou o adesivo mas ainda não venceu a fase, a fase abre de novo
  const pendente = ordenados.find((i) => i.estado === "travado" && !concluidas.includes(i.d.id));
  if (pendente && QUARTO.fases[pendente.d.id]) mostrarFase(pendente);
  else if (pendente) concluir(pendente.d.id), atualizar();
})();
