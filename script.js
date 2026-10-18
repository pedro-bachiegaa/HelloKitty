// Telas, música, memórias, pergunta e final.
const $ = (s) => document.querySelector(s);

function irPara(id) {
  document.querySelectorAll(".tela").forEach((t) => t.classList.remove("ativa"));
  $(id).classList.add("ativa");
}

// Preenche textos do config.js
document.querySelectorAll("[data-cfg]").forEach((el) => {
  el.textContent = CONFIG[el.dataset.cfg] ?? "";
});

// Corações flutuando no fundo da abertura
const fundo = setInterval(() => {
  const s = document.createElement("span");
  s.textContent = ["💗", "💕", "🎀", "❤️"][Math.floor(Math.random() * 4)];
  s.style.left = Math.random() * 100 + "vw";
  s.style.fontSize = 14 + Math.random() * 22 + "px";
  s.style.animationDuration = 6 + Math.random() * 6 + "s";
  $("#bg-hearts").appendChild(s);
  setTimeout(() => s.remove(), 13000);
}, 600);

// ---------- música ----------
const musica = new Audio(CONFIG.musica);
musica.loop = true;
musica.volume = 0.7;
$("#btn-som").onclick = () => {
  musica.muted = !musica.muted;
  $("#btn-som").textContent = musica.muted ? "🔇" : "🔊";
};

// ---------- jogo ----------
function atualizarContador(n, total) {
  $("#contador").textContent = `💗 ${n}/${total}`;
}

Jogo.init($("#jogo"), {
  onColeta(i, n, total) {
    atualizarContador(n, total);
    mostrarMemoria(CONFIG.memorias[i]);
  },
  onFimFase() {
    $("#fim-titulo").textContent = CONFIG.tituloFimFase;
    $("#fim-texto").textContent = CONFIG.textoFimFase;
    $("#btn-recomecar").textContent = CONFIG.textoBotaoRecomecar;
    $("#fim-fase").classList.remove("escondido");
  },
  onControles(visivel) {
    $("#tela-jogo").classList.toggle("sem-controles", !visivel);
  },
  onCena() {
    $("#tela-jogo").classList.add("cena");
  },
  onPergunta() {
    $("#pergunta").classList.remove("escondido");
  },
  onFala(texto) {
    const toast = $("#toast");
    toast.textContent = texto;
    toast.classList.remove("escondido");
    setTimeout(() => toast.classList.add("escondido"), 4200);
  },
});

$("#btn-comecar").onclick = () => {
  clearInterval(fundo);
  $("#bg-hearts").innerHTML = "";
  irPara("#tela-jogo");
  if (CONFIG.mostrarCoracoes) atualizarContador(0, Jogo.totalCoracoes);
  else $("#contador").classList.add("escondido"); // corações desligados: sem contador
  Jogo.comecar();
  musica.play().catch(() => {}); // se não tiver música, segue sem
};

// ---------- memórias ----------
const foto = $("#memoria-foto");
foto.onerror = () => foto.classList.add("escondido");

function mostrarMemoria(m) {
  foto.classList.toggle("escondido", !m.foto);
  if (m.foto) foto.src = m.foto;
  $("#memoria-titulo").textContent = m.titulo;
  $("#memoria-texto").textContent = m.texto;
  $("#modal-memoria").classList.remove("escondido");
}

$("#btn-continuar").onclick = () => {
  $("#modal-memoria").classList.add("escondido");
  Jogo.continuar();
};

// ---------- a pergunta ----------
const btnNao = $("#btn-nao");
const btnSim = $("#btn-sim");
let fugas = 0;

function fugir(e) {
  if (e) e.preventDefault();
  fugas++;
  const textos = CONFIG.textosBotaoNao;
  btnNao.textContent = textos[Math.min(fugas, textos.length - 1)];
  btnNao.classList.add("fugindo");
  const r = btnNao.getBoundingClientRect();
  btnNao.style.left = 16 + Math.random() * (window.innerWidth - r.width - 32) + "px";
  btnNao.style.top = 16 + Math.random() * (window.innerHeight * 0.6) + "px";
  btnSim.style.transform = `scale(${Math.min(1 + fugas * 0.15, 2)})`;
}
btnNao.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") fugir(); });
btnNao.addEventListener("pointerdown", fugir);
btnNao.addEventListener("click", fugir);

btnSim.onclick = () => {
  $("#pergunta").classList.add("escondido");
  btnNao.style.display = "none";
  Jogo.disseSim();
  soltarConfete(7000);
  setTimeout(() => $("#final").classList.remove("escondido"), 1500);
  setTimeout(() => $("#olha").classList.remove("escondido"), CONFIG.segundosAteOlhaPraMim * 1000);
};

// ---------- chuva de corações ----------
const cc = $("#confete");
const cctx = cc.getContext("2d");
let confetes = [];
let confeteAte = 0;
let confeteRodando = false;

function soltarConfete(duracao) {
  cc.width = window.innerWidth;
  cc.height = window.innerHeight;
  confeteAte = performance.now() + duracao;
  if (!confeteRodando) { confeteRodando = true; requestAnimationFrame(animarConfete); }
}

function animarConfete(agora) {
  if (agora < confeteAte) {
    for (let i = 0; i < 3; i++) {
      confetes.push({
        x: Math.random() * cc.width, y: -20,
        vy: 2 + Math.random() * 3, vx: (Math.random() - 0.5) * 2,
        tam: 14 + Math.random() * 18, giro: Math.random() * 6,
        emoji: ["💖", "💕", "🎀", "🌸", "✨", "💗"][Math.floor(Math.random() * 6)],
      });
    }
  }
  cctx.clearRect(0, 0, cc.width, cc.height);
  cctx.textAlign = "center";
  confetes = confetes.filter((c) => c.y < cc.height + 40);
  for (const c of confetes) {
    c.x += c.vx; c.y += c.vy; c.giro += 0.05;
    cctx.save();
    cctx.translate(c.x, c.y);
    cctx.rotate(Math.sin(c.giro) * 0.5);
    cctx.font = c.tam + "px serif";
    cctx.fillText(c.emoji, 0, 0);
    cctx.restore();
  }
  if (confetes.length || agora < confeteAte) requestAnimationFrame(animarConfete);
  else confeteRodando = false;
}

// ---------- fim desta fase ----------
$("#btn-recomecar").onclick = () => location.reload();
