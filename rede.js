// Conexão direta entre dois celulares (WebRTC via PeerJS). Sem servidor próprio:
// um cria uma sala com código de 4 letras, o outro digita o código.
// Só trafegam mensagens pequenas (placar, "começar", "fim").
const Rede = (() => {
  const PREFIXO = "bea-garra-";
  const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sem I/O, pra não confundir com 1/0
  let peer = null, conn = null, aberto = false;
  const ouv = { msg: () => {}, abriu: () => {}, caiu: () => {} };

  const novoCodigo = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join("");

  function ligar(c) {
    conn = c;
    c.on("data", (d) => ouv.msg(d));
    c.on("close", () => ouv.caiu());
    c.on("error", () => ouv.caiu());
    const abrir = () => { aberto = true; ouv.abriu(); };
    if (c.open) abrir(); else c.on("open", abrir);
  }

  function limpar() {
    try { if (conn) conn.close(); } catch (e) {}
    try { if (peer) peer.destroy(); } catch (e) {}
    peer = null; conn = null; aberto = false;
  }

  // quem cria a sala: recebe o código assim que o servidor de encontro responde
  function criarSala(aoTerCodigo, aoErro, tentativa = 0) {
    if (typeof Peer === "undefined") return aoErro({ type: "sem-internet" });
    limpar();
    const codigo = novoCodigo();
    peer = new Peer(PREFIXO + codigo);
    peer.on("open", () => aoTerCodigo(codigo));
    peer.on("connection", (c) => { if (conn && conn.open) { c.close(); return; } ligar(c); });
    peer.on("error", (e) => {
      if (e.type === "unavailable-id" && tentativa < 5) criarSala(aoTerCodigo, aoErro, tentativa + 1);
      else aoErro(e);
    });
  }

  // quem entra: digita o código da sala
  function entrar(codigo, aoErro) {
    if (typeof Peer === "undefined") return aoErro({ type: "sem-internet" });
    limpar();
    peer = new Peer();
    peer.on("open", () => ligar(peer.connect(PREFIXO + codigo.trim().toUpperCase(), { reliable: true })));
    peer.on("error", (e) => aoErro(e));
    const meu = peer;
    setTimeout(() => { if (peer === meu && !aberto) aoErro({ type: "tempo" }); }, 15000);
  }

  return {
    criarSala, entrar, sair: limpar,
    enviar: (obj) => { if (conn && conn.open) conn.send(obj); },
    get conectado() { return !!(conn && conn.open); },
    aoReceber: (f) => { ouv.msg = f; },
    aoAbrir: (f) => { ouv.abriu = f; },
    aoCair: (f) => { ouv.caiu = f; },
  };
})();
