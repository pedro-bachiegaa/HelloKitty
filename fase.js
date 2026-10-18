// Mapa da fase. Unidades em pixels "lógicos"; o chão fica em y = 400.
// Plataformas são atravessáveis por baixo (só dá pra ficar em cima delas).
//
// Jornada: mundo de hoje (0–1500) → transição suave (1500–2300) → parque aquático
// (portão em 2250; brinquedo da boia opcional; piscina com boias) → saída do parque (4330)
// → transição suave (4150–4950) → rua do condomínio → portão do Jau e carro de churros (6560)
// → praça do shopping (7000–7500) → entrada (7900) → corredor com lojas (7950–8250)
// → arcade (9450–9750) → máquina da capivara (10200).
// (O pedido de namoro está GUARDADO: ligue com pedidoAtivo no config.js ou abra com ?final.)
const FASE = {
  chao: 400,
  largura: 14400,
  inicio: { x: 80 },

  // faixas onde o cenário vai trocando aos poucos
  transicao: { ini: 1500, fim: 2300 },    // hoje → parque aquático
  transicao2: { ini: 4150, fim: 4950 },   // parque aquático → rua do condomínio
  transicao3: { ini: 7000, fim: 7500 },   // rua → praça do shopping
  transicao4: { ini: 7950, fim: 8250 },   // praça → corredor do shopping
  transicao5: { ini: 10010, fim: 10310 },   // corredor → arcade
  transicao6: { ini: 11580, fim: 11640 },   // arcade → parque (a Kitty sai pela porta; o cenário troca escondido pelo fade)
  portao: { x: 2250 },                    // entrada do parque: aqui eles vestem roupa de praia
  saidaParque: { x: 4330 },               // saída do parque: aqui voltam à roupa normal
  condominio: { x: 6620 },
  entradaCarros: { x0: 6730, x1: 7010 },  // o vão do portão por onde entram os carros (asfalto, sem muro)                // o portão do Jau: grande, bem atrás do carro de churros

  // Brinquedo da boia (OPCIONAL): a rampa em U fica dentro da piscina, ao fundo.
  //  x       = torre azul / escada       cx = centro da rampa em U
  //  entrada = faixa da escada onde dá pra "pular pra subir" na boia
  //  saida   = onde a Kitty reaparece depois da descida
  rampa: { x: 3040, cx: 3250, entrada: { ini: 2930, fim: 3050 }, saida: 3430 },

  // o carrinho de churros (a cena do churros acontece quando ela chega aqui)
  churros: { x: 6560 },

  // shopping: entrada com portas de vidro e as lojas do corredor
  shopping: { entrada: 7900 },
  lojas: [
    { tipo: "boutique", x: 8330, w: 470 },     // vestidos e saltos altos
    { tipo: "perfumaria", x: 8830, w: 270 },
    { tipo: "joalheria", x: 9130, w: 270 },   // (é a loja Pavão, de bijuterias)
    { tipo: "popeyes", x: 9430, w: 270 },
    { tipo: "mc", x: 9730, w: 300 },          // McLanche Feliz em destaque
  ],

  // arcade: portão neon, máquinas de pegar ursinho e a da CAPIVARA (minigame)
  //  zona = onde dá pra "pular pra jogar" na máquina da capivara
  arcade: { porta: 10160, maquinas: [10460, 10580, 10960, 11080], capivara: 10760, zona: { ini: 10690, fim: 10830 } },

  // saída do arcade: a porta que leva ao parque (só dá pra sair depois de pegar a capivara)
  saidaArcade: { x: 11400 },

  // O PARQUE (fase final, inspirado no Ibirapuera): lago ao fundo, árvores, gente passeando e o piquenique
  ibira: {
    inicio: 11780,
    // 3 capivaras em volta dos dois (reais, com movimento): pastando, deitada e passeando ao fundo
    capivaras: [
      { pose: "pastando", x: 13868, dir: 1, esc: 1, fundo: true, i: 1 },
      { pose: "deitada", x: 14168, dir: -1, esc: 1.02, passaro: true, i: 2 },
      { pose: "andando", x0: 14120, x1: 14340, v: 9, esc: 0.88, fundo: true, i: 3 },
    ],
    bancos: [11960, 12580, 13200],
    carrinho: 12830,
    pessoas: [
      { tipo: "familia", x0: 11850, x1: 12320, v: 20, i: 1 },
      { tipo: "ciclista", x0: 11780, x1: 13650, v: 85, i: 2 },
      { tipo: "corredor", x0: 12380, x1: 12980, v: 62, i: 3 },
      { tipo: "casal", x0: 12080, x1: 12520, v: 16, i: 4 },
      { tipo: "cachorro", x0: 12980, x1: 13460, v: 24, i: 5 },
      { tipo: "pipa", x: 12260, i: 6 },
      { tipo: "pipa", x: 13340, i: 7 },
      { tipo: "familia", x0: 13120, x1: 13660, v: 18, i: 8 },
    ],
  },

  plataformas: [
    // chão (com buracos entre os pedaços)
    { x: 0, y: 400, w: 700, h: 200, chao: true },
    { x: 780, y: 400, w: 470, h: 200, chao: true },
    { x: 1340, y: 400, w: 460, h: 200, chao: true },
    { x: 1880, y: 400, w: 520, h: 200, chao: true },
    { x: 2480, y: 400, w: 620, h: 200, chao: true },
    // (piscina com a rampa ao fundo: 3100–3400)
    { x: 3400, y: 400, w: 950, h: 200, chao: true },
    // rua do condomínio: calçada com buracos (bueiros)
    { x: 4430, y: 400, w: 520, h: 200, chao: true },
    { x: 5030, y: 400, w: 530, h: 200, chao: true },
    { x: 5650, y: 400, w: 550, h: 200, chao: true },
    // final da rua, praça, corredor e arcade (sem buracos; o piso muda de estilo em cada pedaço)
    { x: 6290, y: 400, w: 960, h: 200, chao: true },    // rua (até 7250)
    { x: 7250, y: 400, w: 850, h: 200, chao: true },    // praça do shopping (até 8100)
    { x: 8100, y: 400, w: 2060, h: 200, chao: true },   // corredor com lojas (até 10160)
    { x: 10160, y: 400, w: 1400, h: 200, chao: true },   // arcade (até 11560)
    { x: 11700, y: 400, w: 2700, h: 200, chao: true },   // o parque (até 14400)

    // plataformas no ar
    { x: 900, y: 320, w: 100, h: 20 },
    { x: 1050, y: 250, w: 110, h: 20 },
    { x: 1450, y: 330, w: 90, h: 20 },
    { x: 1580, y: 265, w: 90, h: 20 },
    { x: 1710, y: 200, w: 100, h: 20 },
    { x: 2050, y: 315, w: 130, h: 20 },
    { x: 2440, y: 360, w: 80, h: 20 },
    { x: 2640, y: 320, w: 100, h: 20 },
    { x: 3560, y: 320, w: 100, h: 20 },
    { x: 3720, y: 260, w: 110, h: 20 },
    // boias na piscina: o caminho "sem brinquedo" (só pular de uma em uma)
    { x: 3130, y: 400, w: 80, h: 16 },
    { x: 3235, y: 400, w: 80, h: 16 },
    // rua: jardineiras e muretas de tijolo
    { x: 4800, y: 335, w: 80, h: 24 },   // (a portaria ocupa 4490–4740: nada por cima dela)
    { x: 4895, y: 275, w: 80, h: 24 },
    { x: 5240, y: 330, w: 100, h: 24 },
    { x: 5380, y: 270, w: 100, h: 24 },
    { x: 5820, y: 335, w: 90, h: 24 },
    { x: 5960, y: 275, w: 100, h: 24 },
    { x: 6100, y: 335, w: 90, h: 24 },
  ],

  // Corações (memórias), NA ORDEM da história. (Desligados por enquanto: mostrarCoracoes)
  // Os que têm "ang" ficam na rampa da boia (ângulo em radianos no U: negativo = lado esquerdo).
  coracoes: [
    { x: 420, y: 350 },
    { x: 1105, y: 205 },
    { x: 1760, y: 155 },
    { x: 2850, y: 350 },
    { ang: -0.75 },
    { ang: 0.85 },
  ],

  // enfeites do mundo de hoje
  flores: [120, 300, 560, 860, 1200, 1400, 1650, 1950, 2150],

  // enfeites do parque (só aparecem em terra firme, nunca em cima da água)
  palmeiras: [2330, 2560, 2760, 3480, 3900, 4200],
  guardasois: [2400, 2700, 3560, 4040],

  // enfeites da rua do condomínio (também só em cima da calçada)
  postes: [4520, 5090, 5720],
  postesFios: [4880, 5330, 5780, 6320],   // postes de concreto com fios entre eles
  arvores: [4700, 5300, 5860],
  arbustos: [4850, 5480, 5780, 6040, 6330],

  // o muro da rua: alto, contínuo e pintado (grafite e piche). Fica no mesmo plano do portão do Jau.
  muros: [{ x0: 4380, x1: 6452 }, { x0: 7010, x1: 7400 }],   // um muro só, contínuo, até o portão

  // O PEDIDO (guardado): onde o Pedro espera. Hoje fica desligado (pedidoAtivo: false no config).
  pedro: { x: 14000 },   // o piquenique: o Pedro sentado na toalha, no fim do parque
};
