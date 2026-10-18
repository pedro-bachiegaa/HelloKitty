# 🎀 Pedido de namoro: jogo da Kitty

## Personalizar (só o config.js)
- **Nomes**: `seuNome` e `nomeAmor`.
- **Memórias**: até 6. Cada uma vira um coração no caminho. Ao pegar o coração, aparece a foto com o texto.
- **Fotos**: coloque na pasta `fotos/` como `1.jpg`, `2.jpg`... ou mude os caminhos no config. Se a foto não existir, o cartão aparece só com o texto.
- **Música**: coloque o arquivo em `musica/nossa-musica.mp3`.
- **Plaquinha**: `textoPlaca`.
- **Final**: `tituloFinal`, `mensagemFinal`, `textoOlhaPraMim` e `segundosAteOlhaPraMim`.

## Testar
- Abra o `index.html` no navegador (dois cliques já funciona). No computador, jogue com as setas e o espaço.
- Para **ensaiar só o final**, abra com `?final` no fim do endereço (ex.: `seusite.netlify.app/?final`).

## Publicar
Arraste a pasta inteira em https://app.netlify.com/drop e você recebe um link na hora.
**Teste no seu celular antes do dia**, com o som ligado.

## Como funciona
1. Abertura → "Toque para começar" (a música começa aqui)
2. Fase: a Kitty anda, pula e pega os corações. Se cair num buraco, ela volta na hora.
3. No fim, o Pedro está com flores. Ele vira de costas, procura algo e levanta a plaquinha com a pergunta.
4. Sim/Não: o "Não" foge 😌
5. Abraço, chuva de corações e a cartinha. Depois de alguns segundos aparece **"Agora olha pra mim 👀"**: é a sua deixa!

## Atalhos pra ensaiar (coloque no fim do endereço)
- `?parque` começa logo antes do portão do parque aquático
- `?rampa` começa perto do brinquedo da boia
- `?final` começa perto do Pedro e da plaquinha

## Jornada atual
Mundo de hoje (cidade) → transição suave → portão do parque (maiô e sunga) → brinquedo da boia na rampa em U → Pedro com a plaquinha.
Os textos novos no config.js: `nomeParque`, `dicaRampa` e `falaPosRampa`.

## Novidades desta versão
- **Corações coletáveis desligados por enquanto.** Pra religar, mude `mostrarCoracoes` pra `true` no config.js.
- **Rampa da boia:** a Kitty desce com a amiga ruiva, sem controle. Primeira descida bem alta (com grito e cara de susto), depois vai diminuindo até parar. Textos no config.js: `nomeAmiga`, `gritoKitty`, `gritoAmiga`, `risadaRampa`, `falaPosRampa`.
- **Pedro tímido:** quanto mais a Kitty chega perto, mais ele fica corado e suando. Ele larga as flores e vira de costas pra ela. A placa aparece de costas (só o verso de papelão) com "rabisca rabisca" e rabiscos no ar, pra dar a entender que ele escreve escondido. Depois ele vira todo tímido, pega a placa, ela vira e mostra a pergunta (`textoPlaca`; o texto do rabisco é `textoRabisco`).
- **Atalho `?lento`:** roda tudo em câmera lenta (ex.: `?final&lento`), bom pra ensaiar o pedido.

## Brinquedo da boia (opcional)
- A rampa em U fica dentro da piscina, ao fundo, só como cenário. Dá pra passar pela piscina pulando nas boias amarelas, sem usar o brinquedo.
- Pra usar: a Mirella espera ao lado da escada e chama. Quem **pula na escada** (botão de pulo) sobe na boia com ela.
- Textos no config.js: `nomeAmiga`, `amigaConvite`, `dicaSubir`.

## Pendente
- A "travada" ocasional do jogo ainda vai ser investigada.

## Resgate do herói aranha
Se a Kitty cair num buraco (na cidade ou na piscina), o herói aranha chega balançando, atira a teia, puxa ela e deixa no último lugar seguro, com uma fala em cada momento. Textos no config.js: `falaHeroi` e `falaHeroi2`.

## Fase 2: a rua do condomínio (nova)
- Depois do parque tem uma **saída** ("Até a próxima! 👋"). Lá a roupa de praia volta pra roupa normal.
- A transição é leve, igual à do parque: o céu vira fim de tarde, o parque vai sumindo e as **casas marrons do condomínio** aparecem. Tem portal do condomínio, calçada, meio-fio, postes, árvores, jardineiras de tijolo (plataformas) e bueiros (buracos com asfalto). O Homem-Aranha também salva ali.
- O destino é o **carrinho de churros**: a Kitty chega pulando de alegria e aparece a tela "Fim desta fase".
- Textos no config.js: `nomeCondominio`, `textoSaidaParque`, `textoChegada`, `tituloFimFase`, `textoFimFase`, `textoBotaoRecomecar`.
- Atalhos novos: `?rua` (começa na transição) e `?churros` (começa perto do carrinho).

## O pedido de namoro está GUARDADO
Tudo continua pronto (Pedro tímido, placa de costas, pergunta, Sim/Não e final), só desligado. Pra ensaiar: abra com `?final` no endereço. Pra ligar de vez, mude `pedidoAtivo` pra `true` no config.js. Quando a última fase chegar a gente posiciona ele no lugar certo.

## O carrinho de churros (cena)
A moça do carrinho cumprimenta, a Kitty pede um churros de chocolate com granulado, a moça monta na hora (chocolate, depois granulado caindo) e entrega. Quando a Kitty vai pagar, a moça diz que um rapaz já deixou pago. Aí aparece a tela de fim de fase.
Todas as falas ficam no config.js: `vendedoraOla`, `kittyPede`, `vendedoraPronto`, `kittyPaga`, `vendedoraPago`, `kittyFeliz`, `tituloFimFase`, `textoFimFase`.
A placa do condomínio é o `nomeCondominio` (hoje: "Jau").

## Inspirado em lugares de verdade
- **O condomínio** agora é inspirado na entrada de um condomínio de verdade: blocos de apartamento salmão e bege com telhado de cerâmica, garagens cobertas com carros, muro branco, meio-fio pintado de preto e branco, poste de concreto com fios e a portaria com portão de correr laranja, guarita, cancela e cone. A placa com o nome é `nomeCondominio` no config.js.
- **O carro do churros** é uma van vinho com um guarda-sol grande de flores, mesinha com churros e a moça do lado de fora.

## Como na vida real (final da rua)
- O **portão do Jau** é grande e fica **bem atrás do carro de churros**: portão de correr, guarita com telhado de zinco, cancela e cone, tudo em escala maior, com a placa "Jau" por cima.
- Os **muros** são pintados: painéis de **grafite** (fundo colorido, formas e letras "bubble") e de **piche** (tinta preta escorrendo, com letras brancas), tanto no muro de fundo da rua quanto no muro alto ao lado do portão. As palavras dos grafites ficam na lista `tags` dentro de `pintarPainel` (jogo.js).

## Muro pintado (versão nova)
- **Um muro só**, contínuo, da entrada da rua até o portão do Jau (agora preso ao chão, então "conecta" com o portão).
- Painéis em sequência a partir do portão: **CARLOS ADÃO** (letras verdes à mão num retângulo cinza sobre fundo preto, como na referência), letras **bubble** coloridas (azul, amarelo, coral e roxo, com brilho e pingos), **wildstyle** colorido com auréola laranja, e **piche**.
- As palavras bubble estão na lista `palavras` dentro de `pintarBubble` (jogo.js): TABOÃO, AMOR, PAZ, JAU, BÊ, SP, ZL, FAMÍLIA. A ordem e a largura dos painéis está em `SEQ_MURO`.

## Fase 3: o shopping e o arcade (nova)
- Depois do churros (a Kitty segue com o churros na mão), a rua vira a **praça do shopping** ao entardecer, com estrelinhas, prédios ao longe e lojinhas. A **entrada de vidro** tem portas de correr que abrem quando ela chega perto.
- O **corredor** tem teto com luminárias, pilastras douradas e lojas: **Boutique** (vestidos nos manequins e saltos altos), **Miniso**, **Pavão**, **Popeyes** e **McDonald's** (com o McLanche Feliz + alface extra em destaque).
- O **arcade** tem entrada neon, máquinas de pegar ursinho e a **máquina da capivara**, que brilha, solta corações e tem um balão chamando a atenção.
- **Minigame:** perto da máquina da capivara, **pule** pra jogar. ◀ ▶ movem a garra e o botão de pulo desce e pega. Se a garra pega outra pelúcia, ela escorrega; se pega a capivara com o coração, ela vai pra calha, cresce no meio da tela e aparece a tela de fim.
- Textos no config.js: `nomeShopping`, `textoMaquina`, `capivaraVista`, `dicaGarra`, `garraDica`, `garraQuase`, `garraEscorregou`, `garraGanhou`, `tituloFimFase`, `textoFimFase`.
- Atalhos: `?shopping` (praça) e `?arcade` (entrada do arcade).

## Publicar no Cloudflare Pages
É um site estático: não tem build. Aponte o Pages para este repositório, sem comando de build e com a pasta raiz (`/`) como diretório de saída. Coloque a música em `musica/nossa-musica.mp3` e as fotos em `fotos/` antes de publicar.
