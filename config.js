// ============================================================
//  PERSONALIZE AQUI 💌
//  Edite só este arquivo — não precisa mexer em mais nada.
// ============================================================
const CONFIG = {
  // Nomes
  seuNome: "Devedor de imposto",   // assina a cartinha depois do "Sim"
  nomeAmor: "Bê",

  // Tela de abertura
  textoAbertura: "Fiz um joguinho em sua homenagem, é bem simples, espero que goste.",

  // Parque aquático (aparece no portão) e a saída dele
  nomeParque: "Parque Aquático",
  textoSaidaParque: "Até a próxima! 👋",

  // Rua do condomínio (casas marrons) e o destino desta fase: o carrinho de churros
  nomeCondominio: "Jau",
  textoChegada: "Chegamos! 🥖",
  tituloFimFase: "Capivara conquistada! 🦫💖",
  textoFimFase: "Fim desta fase. A próxima está chegando... 💌",

  // A moça do carrinho e a Kitty (a conversa do churros)
  vendedoraOla: "Oi, querida! O que vai ser hoje? 🥖",
  kittyPede: "Um churros de chocolate com granulado, por favor! 🍫",
  vendedoraPronto: "Prontinho! Quentinho e bem recheado 🍫✨",
  kittyPaga: "Quanto fica? 💰",
  vendedoraPago: "Não precisa! Um rapaz já deixou pago 😉",
  kittyFeliz: "Quem será? 🥰",
  textoBotaoRecomecar: "Jogar de novo",

  // O PEDIDO DE NAMORO está guardado pra última fase. Ligue com true (ou abra com ?final no endereço).
  pedidoAtivo: false,

  // ---------- Brinquedo da boia (a Kitty desce com a amiga ruiva) ----------
  nomeAmiga: "Mirella",
  amigaConvite: "Bora na boia? 🛟",       // a Mirella espera ao lado da escada e chama
  dicaSubir: "Pule aqui pra subir! ⤴",
  dicaRampa: "Segura firme! 🌊",
  gritoKitty: "AAAAAAH!!! 😱",
  gritoAmiga: "AAAAAAAAH!!!",
  risadaRampa: "UHUUUL! 😆",
  // Frase da amiga quando a Kitty sai da rampa (aparece com o nome dela na frente)
  falaPosRampa: "Vai lá! Tem uma surpresa te esperando 😉",

  // ---------- Resgate: quando a Kitty cai num buraco, o herói aranha salva ela com a teia ----------
  falaHeroi: "Segura aí! 🕸️",
  falaHeroi2: "Cuidado com os buracos! 🕷️",

  // ---------- Shopping e arcade ----------
  nomeShopping: "Shopping Jau",
  textoMaquina: "CAPIVARA",
  capivaraVista: "Olha só... uma capivara segurando um coração! 🦫💖",
  dicaGarra: "Pule aqui pra jogar! ⤴",
  garraDica: "◀ ▶ mexem a garra · ⤴ pega!",
  garraQuase: "Quase! Tenta de novo 😅",
  garraEscorregou: "Escorregou! 😮",
  garraGanhou: "Conseguiu! A capivara é sua! 🦫💖",

  // Música: coloque o arquivo na pasta "musica" com este nome (ou mude aqui)
  musica: "musica/nossa-musica.mp3",

  // Corações coletáveis com as memórias. Desligados por enquanto (true liga de novo).
  mostrarCoracoes: false,

  // Memórias: cada uma vira um coração no caminho (máximo 6) quando mostrarCoracoes = true.
  // "foto" é opcional: coloque a imagem na pasta "fotos" e escreva o caminho, ex: "fotos/1.jpg"
  memorias: [
    { titulo: "Onde tudo começou", texto: "Eu não fazia ideia de que aquela conversa ia mudar tanta coisa.", foto: "fotos/1.jpg" },
    { titulo: "Nosso primeiro rolê", texto: "Passei a semana inteira com frio na barriga, mas valeu cada segundo.", foto: "fotos/2.jpg" },
    { titulo: "Aquela piada interna", texto: "Você sabe qual é. Eu ainda rio sozinho(a) lembrando.", foto: "fotos/3.jpg" },
    { titulo: "Seu sorriso", texto: "Não tem nada que melhore meu dia mais rápido.", foto: "fotos/4.jpg" },
    { titulo: "Nossas conversas", texto: "Podia passar a noite inteira falando com você (e às vezes passo).", foto: "fotos/5.jpg" },
    { titulo: "Daqui pra frente", texto: "Quero viver muitas outras memórias com você...", foto: "fotos/6.jpg" },
  ],

  // O que o Pedro escreve na plaquinha (escondido, de costas; só aparece quando ele vira pra ela)
  textoPlaca: "Quer namorar comigo?",
  // O que aparece enquanto ele escreve escondido, de costas (a placa só mostra o verso)
  textoRabisco: "rabisca rabisca ✏️",

  // O botão "Não" muda de texto cada vez que foge
  textosBotaoNao: [
    "Não",
    "Tem certeza?",
    "Pensa melhor 🥺",
    "Última chance!",
    "Vai mesmo?",
    "Sério??",
    "Tá bom, eu choro 😭",
    "Não tem como clicar aqui não 😌",
  ],

  // Depois do SIM
  tituloFinal: "AAAAAA SIIIIM!!! 💖",
  mensagemFinal: "Prometo cuidar de você, te fazer rir, dividir a sobremesa (às vezes) e estar sempre do seu lado.",
  textoOlhaPraMim: "Agora olha pra mim 👀",
  segundosAteOlhaPraMim: 7,
};
