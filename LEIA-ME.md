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

## Fase final: o parque e o piquenique
- Depois de ganhar a capivara no arcade, aparece a porta **SAÍDA**; ao atravessá-la (fade branco) ela chega a um parque inspirado no Ibirapuera: lago com patinhos, pedalinho e passarela ao fundo, a Oca e a marquise ao longe, árvores, bancos, carrinho de pipoca e gente passeando (famílias, ciclista, corredor, casal, cachorro, criança com pipa).
- No fim do parque o **Pedro está sentado numa toalha de piquenique** (salgadinhos, suco, tintas, pincéis, lápis de cor e cavaletes com telas, uma delas com o retrato da Kitty), com **3 capivaras** em volta: uma pastando, uma deitada com um passarinho nas costas e uma passeando ao fundo. O céu vira fim de tarde conforme ela chega perto.
- O pedido é a cena de antes (ele se levanta sem jeito, escreve escondido na placa, vira e mostra), agora no piquenique. Depois do Sim: abraço, corações e a mensagem final.
- Atalhos de ensaio: `?saida` (perto da porta do arcade), `?ibira` (já no parque) e `?final` (perto do piquenique).
- As posições do piquenique e das capivaras ficam em `FASE.pedro` e `FASE.ibira.capivaras` (`fase.js`).

## O quarto (protótipo novo, separado do jogo)
- Abra `quarto.html` (ex.: `localhost:8766/quarto.html`). É uma tela nova, o jogo antigo não foi alterado.
- Arraste cada adesivo da bandeja para o lugar dele no quarto. Acertou: encaixa. Errou: volta pra bandeja; depois de 3 erros o lugar certo pisca.
- Quarto completo = tela "O quarto ficou perfeito!" com o botão "Começar a fase" (ainda é só um aviso, a fase ainda não existe).
- O progresso fica salvo no navegador. O botão ↺ recomeça.
- Tudo se edita no bloco `QUARTO` do topo do `quarto.js`: textos, itens, desenhos (SVG), posições (`cx`, `cy`) e ordem (`z`). Por enquanto é um quarto genérico rosa e amarelo, com 9 itens.
- Ainda não tem o modo para dois celulares: esta versão é só um jogador.

## A garra (protótipo de teste, uma garra só)
- Abra `garra.html` (ex.: `localhost:8766/garra.html`). Com `?ele` aparece o conjunto de pelúcias dele (rato/urso); sem nada, o dela (gatinha/urso).
- 60 segundos. Mova a garra deslizando o dedo na máquina, com ◀ ▶, ou com as setas; **PEGAR** (ou espaço) desce a garra.
- Sorte 50/50: metade das vezes ela segura até a saída (ponto); na outra metade a pelúcia escorrega no caminho e volta pra pilha.
- A capivara é rara e vale 3 pontos. Tudo (tempo, chance, pelúcias, pontos, textos) fica no bloco `GARRA` do topo do `garra.js`.
- Pra usar imagens de referência: coloque PNGs com fundo transparente em `fotos/` e ponha `img: "fotos/arquivo.png"` na pelúcia.
- Ainda falta: o placar do adversário e a conexão entre os dois celulares.

## Quarto + garra ligados (ciclo completo)
- `quarto.html` agora mostra **um adesivo por vez**. A ordem está em `QUARTO.ordem` (começa pela capivara).
- Colar o adesivo **abre a fase dele** (`QUARTO.fases`). Por enquanto só a capivara tem fase: abre `garra.html?quarto`.
- Na garra, em modo quarto, vence quem fizer a meta (`GARRA.metaQuarto`, hoje 3 pontos, provisório até existir adversário). Vencendo, "Voltar ao quarto" libera o próximo adesivo. Perdendo, "Tentar de novo".
- Adesivos sem fase ainda contam como concluídos na hora (aparece "Essa fase ainda vai chegar").
- O progresso fica no navegador (`quarto-progresso` e `quarto-progresso-fases`). O botão ↺ no quarto zera tudo.

## Garra v2 (pilha fixa e bichinhos variados)
- A pilha é **fixa**: 12 bichinhos (3 capivaras, 4 Stitch, 3 Pikachu, 2 Jigglypuff) e o que você pega **não volta**. Os de cima descem pra ocupar o espaço.
- Cada tipo tem tamanho, forma, pontos e **chance de a garra segurar** diferentes (capivara vale 3 mas escorrega mais; Pikachu/Jigglypuff valem 1 e seguram melhor). Cada bichinho também sai com tamanho e posição (em pé, de lado, deitado) levemente diferentes.
- Pontaria conta: a garra precisa estar bem em cima do bichinho pra agarrar; senão "Errou!".
- Tudo no bloco `GARRA.tipos` do `garra.js` (qtd, rx/ry, pontos, chance). Os desenhos são genéricos; pra usar imagens suas, é só trocar a função `pelucia`.
- Meta do modo quarto (`metaQuarto`): 4 pontos, provisória.

## Garra: sorte mais variada
- A chance de segurar agora muda **a cada tentativa**: depende do tipo do bichinho, da **mira** (bem centralizado segura mais) e de um pouco de sorte. Nada de padrão fixo.
- A falha também varia: pode escorregar **logo ao levantar**, **no meio do caminho** ou **quase na saída** ("Tão perto! 😭").
- Teste feito: o resultado de uma tentativa não influencia a próxima (a chance depois de acerto e depois de falha é praticamente a mesma).

## Página principal (2026-11-18)
- O jogo principal agora é o quarto de adesivos: `index.html` (antes `quarto.html`). Endereço raiz do site abre ele.
- O jogo antigo da Hello Kitty foi guardado em `kitty.html` (endereço `/kitty`). Parâmetros antigos continuam, ex.: `kitty.html?final`.
- Onde esta documentação diz `quarto.html`, leia `index.html`; onde diz `index.html` (jogo da Kitty), leia `kitty.html`.

## Fase do quadro (2026-11-18)
- `quadro.html` / `quadro.css` / `quadro.js`: pintura por números. As cores têm número e precisam ser usadas na ordem (1, 2, 3...). Tocar numa parte de outra cor avisa e balança; depois de 3 erros as partes certas piscam.
- Está ligada ao adesivo do quadro no quarto (`QUARTO.fases.quadro`). Pra testar direto: `quadro.html?quarto`.
- O desenho atual é um parque genérico. Pra usar os quadros que vocês pintaram: no bloco `QUADRO` do `quadro.js`, troque `paleta` (nome, cor e número, na ordem) e `formas` (cada região do desenho, com a cor n dela). Com a foto do quadro dá pra montar essas regiões.

## Quadro com as pinturas reais (2026-11-18)
- A fase do quadro agora tem **dois quadros em sequência**, baseados nos que vocês pintaram: as carpas com lótus (7 cores) e a casa do "Up" com balões (8 cores). Terminando o segundo, libera o adesivo no quarto.
- Os desenhos são aproximações em formas simples (tela 300x300), no bloco `QUADRO.quadros` do `quadro.js`. Cada quadro tem `paleta` (cores na ordem de pintura) e `formas` (regiões, cada uma com sua cor `n`).
- Dá pra refinar: mudar a ordem das cores, os tons, ou o formato das regiões. Quanto mais fiel a forma ao quadro, mais bonito fica ao pintar.

## Sair das fases e ordem dos adesivos (2026-11-18)
- Dentro de uma fase aberta pelo quarto (`?quarto`), o botão **←** (canto de cima à esquerda) volta ao quarto sem terminar (`index.html?pausa`). O adesivo continua colado e a fase fica pendente.
- No quarto, a janela da fase tem **Agora não**, que fecha o aviso. Tocar num adesivo já colado com fase pendente reabre a fase.
- Nova ordem dos adesivos: capivara, **quadro**, cama, janela, poema... (o quadro é o segundo, logo depois da capivara). Mude em `QUARTO.ordem` no `quarto.js`.
- Ao mudar CSS/JS, aumente o `?v=` nos HTMLs pra o celular não usar cache velho (agora em `?v=5`/`?v=6`).
