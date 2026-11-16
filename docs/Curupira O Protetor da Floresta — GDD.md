# Curupira: O Protetor da Floresta — GDD

Oct 5, 2026 · @Arthur

## Status atual

O design está em definição e a implementação ainda não começou.

| Integrante | Foco principal |
| --- | --- |
| Arthur Campello Gausmann | Programação e negócios |
| Eduardo Maliszewski Goulart | Programação e arte |

O trabalho é dividido de forma igualitária; a tabela indica só o foco de cada um.

- **Definido:** história, elenco de chefes, direção de arte em pixel art, controles, telas, público e plataforma. Há sprites em pixel art do Curupira, dos quatro chefes e das quatro arenas, já exportados para o Godot.
- **Em definição:** números dos ataques novos dos chefes e dos combos, botão de travar a mira e lista de áudio.
- **Implementação:** não iniciada. A estrutura de cenas e o movimento do Curupira estão planejados em Documentação técnica.
- **Bloqueios:** decisões listadas em Questões em aberto. As marcações (Q14), (Q15) e (Q16) ao longo do documento apontam para essa lista.

## Declaração de conceito

Curupira: O Protetor da Floresta é um jogo 2D de combates contra chefes em arenas fixas. O jogador controla o Curupira, que liberta os seres do folclore brasileiro controlados por chips e depois enfrenta a máquina controlada por IA que desmata as florestas para construir mais data centers.

## Gênero

Boss-rush de plataforma 2D em visão lateral. O jogo é composto somente por lutas contra chefes, cada uma em uma arena de tela única, sem rolagem de câmera e sem trechos de fase entre os chefes.

As referências de design são Cuphead e Mega Man. Do primeiro vêm o foco em lutas de chefe, as fases dentro de cada luta e a mira em oito direções; do segundo, o ataque concedido por cada chefe derrotado. O estilo visual é pixel art.

## Público-alvo

O público-alvo são jovens de 12 a 18 anos que gostam de jogos desafiadores e com uma história envolvente. A classificação indicativa pretendida é 12 anos, por violência fantasiosa. O jogo é para um jogador.

## Conceito e diferenciais

O jogador enfrenta quatro chefes: Mula sem Cabeça, Cuca, Boto cor-de-rosa e uma máquina controlada por IA. Cada chefe ocupa uma fase, e cada fase é uma arena que cabe inteira na tela. O Curupira corre, pula, usa um dash com invencibilidade, ataca com um ataque básico e dispara um especial. Ele aguenta 4 golpes.

O Curupira começa com o ataque básico Tiro de Folha e o especial Instinto Selvagem. Os três seres folclóricos são enfrentados na ordem que o jogador escolher, e cada um, ao ser derrotado, concede um ataque básico e um especial. A máquina controlada por IA é o chefe final, só é liberada depois dos três e não concede ataque. Antes de cada fase o jogador escolhe qual ataque básico e qual especial leva; durante a fase não há troca.

Diferenciais:

- **Folclore brasileiro como elenco.** O protagonista é o Curupira e os chefes são Mula sem Cabeça, Cuca e Boto cor-de-rosa.
- **Tema ambiental.** O antagonista é uma máquina controlada por IA que desmata as florestas para construir mais data centers.
- **Só chefes.** Não há fases de percurso; todo o conteúdo é luta de chefe.
- **Ordem livre e ataques herdados.** O jogador escolhe qual ser folclórico enfrentar e, ao vencer, ganha o ataque básico e o especial dele, de fogo, magia ou água.
- **Escolha antes da luta.** O ataque básico e o especial são definidos antes da fase e ficam travados até o fim dela.
- **Especial carregado por acertos.** O especial carrega pelo número de golpes acertados, não pelo dano causado.

Link do protótipo: ainda não há protótipo.

## Experiência do jogador

O jogador é o Curupira, guardião da floresta, e a fantasia é a do título: proteger a floresta de quem a destrói.

A experiência se repete em quatro etapas por fase:

1. Escolher qual chefe enfrentar.
2. Escolher o ataque básico e o especial.
3. Lutar contra o chefe na arena.
4. Vencer e receber o ataque básico e o especial do chefe.

A história é apresentada em cenas estáticas no início do jogo. As emoções buscadas são medo e receio nos primeiros minutos, e satisfação e dever cumprido ao fim de cada luta. O jogo e as lutas não têm duração fixa: cada luta só termina quando o chefe ou o jogador é derrotado, e o tempo total depende do jogador.

## Momentos-chave

O jogo tem dois momentos-chave:

- **Primeiros minutos.** O jogador sente medo e receio diante do chefe.
- **Fim de cada luta.** O jogador sente satisfação e a sensação de dever cumprido.

## Arte, som e música

O estilo visual é pixel art: personagens caricaturais de membros "de mangueira" (*rubber hose*), folclore e paisagens brasileiras, desenhados pixel por pixel numa resolução baixa e ampliados por um número inteiro. As animações são feitas em folha de sprites (sprite sheet). A arte é responsabilidade principal do Eduardo.

### Direção de arte

- **Grade única.** Tudo é desenhado numa resolução base de **480×270** e ampliado **4×** para a tela de 1920×1080. Curupira, chefes, projéteis, efeitos e cenários usam o mesmo tamanho de pixel: um chefe maior tem mais pixels, não pixels maiores. Não há rotação livre nem redimensionamento de sprite, porque isso quebra a grade; poses giradas (como a folha na diagonal) têm desenho próprio.
- **Tamanhos.** O Curupira tem cerca de 61 px de altura (245 px na tela). Os chefes têm entre 80 e 110 px (320 a 440 px na tela). A Máquina pendurada no teto chega a 210 px com o braço.
- **Cor.** Cada material tem uma rampa de 4 a 7 tons. A sombra puxa para o roxo e a luz para o amarelo. A luz vem de cima e da frente do personagem.
- **Contorno.** Contorno de 1 px, na cor mais escura de cada material (pele, fogo, folha, pelo), não um preto único. Sem meio-tom, sem transparência parcial e sem degradê liso: sombras, fantasmas do dash e brilhos são feitos com cor chapada ou pontilhado.
- **Expressão.** Olhos grandes e bocas desenhadas pixel a pixel. O Curupira tem 12 expressões (oba, feliz, rindo, bravo, furioso, determinado, convencido, surpreso, assustado, dor, triste e tonto).
- **Curupira.** Cabelo vermelho comum, em mechas que mexem com o corpo e deitam com o vento. O cabelo só pega fogo durante o especial e apaga depois.
- **Cenários.** Faixas de cor no céu, camadas de vegetação cada vez mais escuras e frias, sem contorno preto e com menos contraste que os personagens. A área da frente fica limpa para a luta; o que é complexo fica no fundo e nas laterais, como num palco.
- **Paleta.** Quente e terrosa nos cenários de floresta, com o fogo, a magia e a água bem saturados para os ataques se destacarem. A sala da Máquina é branca e fria, e o vermelho do laser é a cor mais forte dela.

As animações saem de um gerador escrito em código, guardado em `art/pixel/gerador/`: cada personagem é montado a partir de peças desenhadas pixel a pixel (cabeça, olhos, bocas, mãos, pés) e de um esqueleto de poses. O mesmo gerador exporta as folhas para `game/assets/pixel/`.

### Quadros por animação

- **Chefes.** 12 quadros por segundo. Cada ataque é dividido em três animações: aviso, ação e fim. Assim o tempo do aviso pode ser ajustado no Godot sem refazer arte.
- **Curupira.** 10 a 20 quadros por segundo, conforme o movimento: idle tem 12 quadros, corrida 6, tiro 4 por ciclo e especial 16.
- **Projéteis e efeitos.** De 1 a 8 quadros cada, como arquivos PNG separados.
- **Cenários.** 8 quadros a 4 por segundo para o fogo, a água e as luzes do fundo.

### Animações, som e lista de assets

As animações do Curupira são:

- **Movimento:** idle, correr, pular, cair, pouso, dash e freio.
- **Tiro de pé:** atirar para cima, na diagonal para cima, para a frente e na diagonal para baixo.
- **Tiro correndo:** para a frente e na diagonal para cima.
- **Tiro no ar:** em cinco direções, de cima até baixo.
- **Agachado:** abaixar, ficar agachado, atirar agachado e levantar.
- **Outras:** especial, dano e derrota.

As animações de cada chefe estão em Objetos do jogo.

A música de fundo é simples e de estilo brasileiro, natural e sem exageros. Música e efeitos sonoros vêm de bibliotecas gratuitas. Não decidido (Q14): quais bibliotecas, faixas e efeitos serão usados.

Lista de assets: as folhas de sprites, os efeitos e os cenários estão em `game/assets/pixel/`. Cada personagem tem um arquivo `.json` com o tamanho da célula, a âncora, o fps de cada animação e os pontos de onde saem os tiros. A planilha com os assets de som ainda não existe.

## Plataforma-alvo

O jogo é para PC e é projetado para controle (gamepad), que é a forma recomendada de jogar. O teclado também funciona. A plataforma inicial é Linux, e o projeto precisa poder ser exportado para Windows com facilidade. O jogo roda em tela cheia em 1920×1080. A arte é desenhada em 480×270 e ampliada 4×; as coordenadas do jogo continuam em pixels de 1920×1080, então os números de movimento e de combate deste documento não mudam.

Os requisitos mínimos serão definidos depois que o jogo estiver concluído.

## Concorrência

| Jogo | Lançamento | Semelhança |
| --- | --- | --- |
| Cuphead (Studio MDHR) | 2017 | Lutas contra chefes como núcleo do jogo, com fases e mira em oito direções |
| Mega Man (Capcom) | 1987 | O jogador escolhe a ordem dos chefes, e cada chefe derrotado concede seu ataque |

O que diferencia Curupira: o elenco e o cenário vêm do folclore brasileiro, o tema é a defesa da floresta, e não há fases de percurso entre os chefes.

A equipe não considera outros jogos como concorrentes diretos.

## Monetização

O jogo é vendido por R$ 5.

## Objetivos e progressão do jogador

O objetivo do jogador é derrotar os quatro chefes. Os três seres folclóricos (Mula sem Cabeça, Cuca e Boto cor-de-rosa) são enfrentados na ordem que o jogador escolher. A máquina controlada por IA é o chefe final e só é liberada depois dos três. A progressão vem dos ataques: cada ser folclórico derrotado concede um ataque básico e um especial, que ficam disponíveis na escolha feita antes das fases seguintes.

O jogo abre com cenas estáticas que explicam a história; não há outras cenas de narrativa. Derrotar a máquina controlada por IA conclui o jogo.

Laço principal (dentro de uma fase):

1. O chefe ataca; o jogador desvia com movimento, pulo e dash com invencibilidade.
2. O jogador acerta o chefe com o ataque básico.
3. Cada acerto carrega o especial.
4. Com o especial carregado, o jogador o dispara.
5. O laço se repete até o chefe ser derrotado ou o Curupira levar 4 golpes.

Laço externo (entre fases):

1. Escolher qual chefe enfrentar.
2. Escolher o ataque básico e o especial.
3. Jogar a fase.
4. Vencer e ganhar o ataque básico e o especial do chefe.

Ao levar o quarto golpe, o jogador perde a fase e vai para a tela de derrota, onde pode tentar de novo ou voltar para a seleção. Os chefes já derrotados continuam derrotados. O progresso é salvo a cada chefe derrotado e permanece depois de fechar o jogo.

## Mundo do jogo

O mundo é a floresta protegida pelo Curupira, dividida em quatro fases, uma por chefe. Cada fase é uma arena estática que cabe em uma única tela.

### História de fundo

Uma empresa é controlada por uma IA cujo objetivo é construir mais data centers, e por isso ela desmata as florestas brasileiras. A IA é uma máquina que pertence à empresa, mas é a cabeça pensante dela: controla tudo e age sozinha. Para destruir as florestas com a ajuda das criaturas do folclore, a máquina colocou nelas chips que controlam a mente. Só o Curupira ficou livre.

O Curupira liberta as criaturas uma a uma e depois detém a máquina para salvar as florestas. A derrota dela conclui o jogo.

### Organização das fases

| Chefe | Ordem | Cenário |
| --- | --- | --- |
| Mula sem Cabeça | Escolhida pelo jogador | Floresta Amazônica em chamas |
| Cuca | Escolhida pelo jogador | Floresta, com o caldeirão de feitiços ao fundo |
| Boto cor-de-rosa | Escolhida pelo jogador | Península com água dos dois lados |
| Máquina controlada por IA | Última, liberada depois dos três | Sala branca dentro da central da empresa |

### Cenário: Floresta Amazônica em chamas

A arena é uma clareira de terra ampla e pouco obstruída, cercada por vegetação amazônica exagerada e orgânica. Ao fundo, diferentes camadas da floresta são consumidas pelo fogo, e grandes colunas de fumaça criam profundidade e uma atmosfera dramática. A iluminação quente das chamas contrasta com os verdes escuros da vegetação ainda preservada. A sensação buscada é a de que o incêndio cerca a arena aos poucos.

Este é o cenário da fase da Mula sem Cabeça.

&#91;image: Design inicial da arena da Mula sem Cabeça: clareira de terra com a floresta em chamas ao fundo\]

### Cenário: península do Boto

A arena é uma península de areia com água dos dois lados. O Boto cor-de-rosa alterna entre os dois lados, pulando de um para o outro. No design inicial, a água é azul de um lado e barrenta do outro. O Curupira fica só na areia: as beiras dela seguram ele, e o Boto fica na água, do lado de fora. A água em volta dele se mexe (anéis, espuma e gotinhas) e respinga quando ele afunda, sobe ou salta.

&#91;image: Design inicial da arena do Boto cor-de-rosa: península de areia entre água azul e água barrenta\]

### Cenário: floresta da Cuca

A arena fica na floresta, de noite e com neblina, com o caldeirão de feitiços da Cuca ao fundo, ao pé de uma árvore oca.

&#91;image: Design inicial da arena da Cuca: clareira na floresta com um caldeirão verde ao pé de uma árvore\]

### Cenário: sala da máquina

A arena é uma câmara de testes branca dentro da central da empresa, em estilo de laboratório: parede de painéis brancos com juntas cinza e faixas de luz, a metade de baixo em metal escuro, um trilho no teto com três alçapões, piso de placas claras com faixas de perigo amarelas e pretas nas pontas e uma placa "CÂMARA 04". Uma janela de observação mostra lá fora a floresta derrubada, com tocos e fumaça. A Máquina fica pendurada no trilho do teto.

### Estrutura das arenas

As arenas têm só chão e paredes, sem plataformas, obstáculos ou perigos próprios. Elas são abertas em cima: não há teto físico, e o limite superior da tela cumpre esse papel visualmente. O teto da sala da Máquina é só desenho; os alçapões e as placas do piso que se levantam são ataques dela, não perigos da arena. A câmera é fixa no centro da arena e não segue o Curupira.

A arena inteira cabe na resolução base de 1920×1080.

### Física

O jogo é em visão lateral com gravidade. Os valores planejados estão em Sistemas e funcionalidades.

## Interface do usuário

O jogo é controlado por gamepad, com teclado como alternativa. As ações usam nomes próprios no Input Map do Godot, e não as ações `ui_*`, para não conflitar com a navegação de menus.

| Ação | Controle (layout Xbox) | Teclado | Ação no Input Map |
| --- | --- | --- | --- |
| Andar | Direcional | A e D | `move_left`, `move_right` |
| Mirar para cima | Direcional para cima | W | A definir (proposta: `aim_up`) |
| Abaixar e mirar para baixo | Direcional para baixo | S | A definir (proposta: `crouch`) |
| Travar a mira | A definir (Q15) | Shift | `aim_lock` |
| Pular | A | Espaço | `jump` |
| Ataque básico | X | J | `attack_basic` |
| Especial | Y | K | `attack_special` |
| Dash | B | L | `dash` |

### Telas

O jogo tem nove tipos de tela:

- **Cenas de abertura.** Cenas estáticas no início do jogo, que explicam a história.
- **Menu inicial.** Mostra também os botões de cada ação; é assim que o jogador aprende os controles.
- **Seleção de fase e de ataques.** O jogador escolhe o chefe, a dificuldade (Normal ou Expert) e, na mesma tela, o ataque básico e o especial.
- **Arena.** Uma por chefe, quatro no total.
- **Pausa.**
- **Opções.** Volume, alternância entre tela cheia e janela e, quando aberta no meio de uma fase, a opção de voltar para a seleção de fase.
- **Derrota.** O jogador pode tentar a fase de novo ou voltar para a seleção.
- **Vitória.** Depois dela o jogador volta para a seleção de fase.
- **Créditos.** Aparecem logo depois que o chefe final é derrotado.

### Elementos na tela durante a luta

A vida do Curupira e a carga do especial ficam no canto inferior esquerdo da tela: um retrato do Curupira, um coração por golpe que ele aguenta e uma barra de cipó com a cabeça da onça, que acende quando o especial está cheio. A vida do chefe aparece numa barra no alto da tela, com o nome dele e marcas onde a luta muda de fase (decisão do Eduardo; antes ela ficava escondida, como em Cuphead).

Durante a luta, cima e baixo servem para mirar e baixo também agacha. As regras estão em Ataque básico e especial.

## Sistemas e funcionalidades (MVP)

O MVP tem sete sistemas: movimento, dash, vida, ataque básico e especial, ataques concedidos pelos chefes, efeitos de estado e a escolha feita antes da fase. Nenhum deles está implementado ainda.

### Movimento

Os valores deste documento são os iniciais planejados e serão ajustados em protótipo. Os de movimento são dimensionados para a resolução base de 1920×1080: o Curupira cruza a tela em 3,2 s e o pulo sobe cerca de 215 px.

| Parâmetro | Valor |
| --- | --- |
| Velocidade horizontal | 600 px/s |
| Velocidade inicial do pulo | 1100 px/s para cima |
| Gravidade | 2800 px/s² |

- O pulo só sai com o Curupira no chão; não há pulo duplo.
- A gravidade é uma constante do próprio personagem, não a global do projeto. Isso permite ajustar o peso de cada personagem separadamente.
- Com esquerda e direita pressionadas ao mesmo tempo, as direções se anulam.
- O sprite espelha conforme a direção do movimento. Essa direção define depois o lado do ataque.

### Dash

O dash percorre 300 px em 0,2 s, e o Curupira fica invencível durante todo o percurso. A recarga é de 0,8 s. No ar, o Curupira pode usar um dash por pulo.

### Vida

O Curupira aguenta 4 golpes. Depois de levar um golpe, ele fica invencível por 1,5 s, piscando. Não há cura durante a fase; a vida volta cheia a cada tentativa. No quarto golpe o jogador perde a fase e vai para a tela de derrota. O progresso é salvo a cada chefe derrotado e permanece depois de fechar o jogo.

### Ataque básico e especial

O Curupira leva para cada fase um ataque básico e um especial. O especial carrega por acertos no chefe, e não pelo dano causado. Motivo: o carregamento por dano foi descartado por um problema de balanceamento.

O Curupira começa o jogo com um ataque básico, o Tiro de Folha, e um especial, o Instinto Selvagem. Cada ser folclórico derrotado concede mais um básico e mais um especial. A lista completa está em Objetos do jogo.

Todos os ataques básicos são projéteis. Eles diferem em tipo de tiro, dano e velocidade de ataque, mas causam dano por segundo parecido: o tiro rápido é seguro, o tiro lento e forte exige prever o chefe, e o teleguiado causa menos dano porque não erra.

O Curupira atira em oito direções, com o projétil saindo da mão. Segurar o botão de ataque atira sem parar.

- **De pé, parado ou andando:** para a frente, para a frente com cima na diagonal para cima e só cima reto para cima. Andando, ele atira para a frente ou na diagonal para cima.
- **Agachado:** baixo no chão agacha. Agachado, o Curupira fica com cerca de 40% da altura, não anda e atira para a frente, rente ao chão. Agachar serve para desviar de ataques altos, como o jato do Boto e a primeira varredura da Máquina.
- **Mira travada:** segurando o botão de travar a mira, ele fica parado no lugar e pode mirar em qualquer direção do chão, inclusive a diagonal para baixo. No teclado é o Shift; no controle o botão ainda não foi escolhido (Q15).
- **No ar:** atira em cinco direções, de cima até baixo: cima, diagonal para cima, frente, diagonal para baixo e baixo. Para baixo reto só existe no ar.
- **Direção:** a frente é o lado para onde ele está olhando, e as diagonais são a 45°.

A barra do especial tem 100 pontos. Cada acerto soma pontos conforme o ataque básico equipado, de modo que a barra enche em 20 a 25 s de acertos com qualquer um deles. Os valores de cada ataque estão em Objetos do jogo.

### Ataques concedidos pelos chefes

Cada ser folclórico derrotado concede ao Curupira um ataque básico e um especial do seu elemento: fogo da Mula sem Cabeça, magia da Cuca e água do Boto cor-de-rosa. A máquina controlada por IA não concede ataque, por ser o chefe final.

### Efeitos de estado

O jogo tem dois efeitos de estado:

- **Envenenamento.** Causa dano constante ao longo do tempo.
- **Lentidão.** Deixa movimentos e ataques mais lentos.

No chefe, os efeitos vêm dos especiais do Curupira. A Poção Maldita envenena por 8 s, com 20 de dano por segundo; reaplicar só renova o tempo. A Bolha Abissal deixa o chefe 40% mais lento por 6 s.

No Curupira, os efeitos vêm das poças da Cuca. A poça de veneno tira 1 golpe se ele ficar 1 s dentro dela. A poça de lentidão o deixa 40% mais lento enquanto ele estiver nela.

### Escolha antes da fase

O jogador escolhe o ataque básico e o especial antes de cada fase, na mesma tela em que escolhe o chefe. Durante a fase não há troca.

Na mesma tela ele escolhe a dificuldade da próxima luta (decisão do Eduardo):

- **Normal.** Mula, Cuca e Boto lutam numa fase só; a máquina, em duas.
- **Expert.** Os seres folclóricos lutam em duas fases; a máquina, em três. Os combos vêm mais vezes e mais colados.

Vencer no Normal já concede os ataques e conta para liberar a máquina. A vitória no Expert fica marcada à parte na seleção ("derrotada · Expert"). A dificuldade escolhida fica salva.

## Objetos do jogo

O jogo tem um personagem jogável e quatro chefes.

### Curupira

&#91;image: Design inicial do Curupira: cabelo vermelho em forma de chamas e saia de folhas\]

Na versão em pixel art, a cabeça é mais redonda e o cabelo é vermelho comum, sem fogo; ele só pega fogo durante o especial. O sprite tem cerca de 61 px de altura.

| Atributo | Valor |
| --- | --- |
| Vida | 4 golpes |
| Velocidade horizontal | 600 px/s |
| Velocidade inicial do pulo | 1100 px/s |
| Gravidade | 2800 px/s² |
| Dash | 300 px em 0,2 s, recarga de 0,8 s |
| Invencibilidade após golpe | 1,5 s |
| Forma de colisão | Cápsula (em pé) e cápsula baixa, com cerca de 40% da altura (agachado) |

A cápsula evita que o personagem prenda em quinas do cenário.

### Ataques do Curupira

O Curupira pode ter até quatro ataques básicos e quatro especiais. Ele começa com um de cada e ganha os outros ao derrotar os seres folclóricos.

Ataques básicos:

| Ataque | Origem | Projétil | Dano | Tiros/s | Dano/s | Carga por acerto |
| --- | --- | --- | --- | --- | --- | --- |
| Tiro de Folha | Inicial | Rajada de folhas cortantes, rápida e reta | 4 | 5 | 20 | +1 |
| Bola de Fogo | Mula sem Cabeça | Bola de fogo de velocidade média, com pequena explosão | 12 | 1,5 | 18 | +3 |
| Feitiço Perseguidor | Cuca | Magia de velocidade média que persegue o inimigo | 3 | 4 | 12 | +1 |
| Bolha d'Água | Boto cor-de-rosa | Bolha lenta | 26 | 0,8 | 21 | +6 |

A carga por acerto varia para que a barra do especial encha no mesmo ritmo com qualquer ataque básico.

Especiais:

| Especial | Origem | Efeito |
| --- | --- | --- |
| Instinto Selvagem | Inicial | Ataque de energia em formato de cabeça de onça. Projétil grande em linha reta, com 150 de dano |
| Canhão Flamejante | Mula sem Cabeça | Feixe de fogo concentrado e contínuo, em linha reta à frente do Curupira. Dura 1,5 s e causa até 200 de dano. O Curupira fica parado enquanto dispara |
| Poção Maldita | Cuca | 40 de dano no impacto e envenenamento de 20 por segundo durante 8 s, 200 no total |
| Bolha Abissal | Boto cor-de-rosa | Bolha densa, com 60 de dano. Deixa o chefe 40% mais lento por 6 s, nos movimentos e nos ataques |

### Chefes

Cada um dos três seres folclóricos concede um ataque básico e um especial ao ser derrotado. A máquina controlada por IA é o chefe final, liberada depois dos três, e não concede ataque.

Cada chefe tem quatro ataques. Quantas fases a luta tem depende da dificuldade (ver Escolha antes da fase):

| Chefe | Normal | Expert |
| --- | --- | --- |
| Mula, Cuca e Boto | 1 fase, com os 4 ataques | 2 fases, trocando na metade da vida. A fase 1 tem 3 ataques e a fase 2 traz o quarto |
| Máquina controlada por IA | 2 fases, trocando na metade. A fase 1 tem 3 ataques e a fase 2 traz a varredura | 3 fases, trocando a cada terço. Os ataques entram 2 + 1 + 1 |

A ideia, como no Cuphead, é variar o ritmo e brincar com o jogador em vez de repetir dois ataques a luta inteira:

- **Ordem.** Não há ordem fixa. Os ataques da fase saem embaralhados, como cartas de um baralho: todos saem uma vez antes de algum repetir.
- **Combos.** De vez em quando o chefe emenda dois ataques: o primeiro sai sem a parada do fim e o segundo vem logo depois de um atraso curto. Cada fase tem a lista de combos permitidos, a chance de sair um combo e o atraso de cada um. Os combos foram conferidos por um teste automático (`verificar_desvio.gd`, ver Testes): para cada combo, ele procura um jeito de o Curupira sair sem levar golpe, a partir de três posições.
- **Troca de fase.** O chefe termina o ataque em andamento, a tela treme, dá um clarão, todos os tiros do chefe somem e ele faz uma animação de transição (2 s). Ele continua levando dano nesse tempo. A primeira jogada da fase nova é um combo com o ataque novo.
- **Lado.** A Mula (investida) e a Cuca (bote) atravessam a arena e ficam do outro lado; não voltam de costas. Os ataques seguintes saem de lá, espelhados.

Os números das fases e dos combos (chance, atraso, pausa) são provisórios e ficam no `.tres` de cada chefe (Q16).

Três regras valem para todos os chefes:

- O chefe pode levar dano o tempo todo.
- Todo ataque tem um aviso visual antes do golpe: o chefe brilha e faz a animação de aviso, e o jogador lê o ataque pela pose. Não há marca na tela cobrindo a área do golpe; o Eduardo achou que deixava fácil demais. As exceções são o que vem de fora da vista ou é mirado: o brilho no céu dos meteoros, a linha fina do laser e a linha da altura do chapéu do Boto. No jato, quem mostra a altura é o próprio Boto, afundando na água até o bico ficar nela.
- Depois do ataque mais forte, o chefe fica parado por um instante. É a janela para o jogador atacar.

| Chefe | Perfil | Vida | Duração-alvo | Pausa entre ataques | Concede ao Curupira |
| --- | --- | --- | --- | --- | --- |
| Mula sem Cabeça | Dano alto e vida baixa | 1200 | 1 min 15 s | 1,2 s | Bola de Fogo e Canhão Flamejante |
| Cuca | Equilibrada entre vida e dano | 1600 | 1 min 40 s | 1,6 s | Feitiço Perseguidor e Poção Maldita |
| Boto cor-de-rosa | Vida alta, mais movimento e dano baixo | 2000 | 2 min | 2 s | Bolha d'Água e Bolha Abissal |
| Máquina controlada por IA | Vida alta e dano alto, os maiores entre todos os chefes | 2400 | 2 min 30 s | 1,2 s | Nada, por ser o chefe final |

A duração-alvo supõe que o jogador acerta o chefe em 60% do tempo. Uma partida sem derrotas soma cerca de 7 min 30 s.

Ataques de cada chefe. Os avisos ficaram mais longos a pedido do Eduardo, para dar tempo de desviar (o valor antigo está entre parênteses). Os golpes dos ataques novos continuam "a definir" (Q16).

| Chefe | Fase | Ataque | Aviso | Golpes | Como desviar |
| --- | --- | --- | --- | --- | --- |
| Mula sem Cabeça | 1 | Rajada rasteira: abaixa o peito até o chão e cospe três bolas de fogo em sequência, rente ao chão | 0,8 s (0,5) | 1 cada | Pular |
| Mula sem Cabeça | 1 | Pisoteio: empina, segura no alto e bate as patas da frente; uma onda de fogo corre pelo chão | 1 s (0,8) | A definir | Pular |
| Mula sem Cabeça | 2 | Investida: agacha e raspa a pata da frente na terra duas vezes, jogando terra para trás, como cavalo antes de correr. Depois atravessa a arena e bate na parede. Fica tonta e fica daquele lado | 1,1 s (0,9) | A definir | Pular por cima ou dash |
| Mula sem Cabeça | 3 | Chuva de meteoros: cospe três meteoros para o céu (dá para ver cada um subir). Um brilho no alto da tela, bem em cima de onde cada um vai cair, fica mais forte e pisca mais rápido até a pedra descer; no chão, uma sombra cresce. Depois fica parada por 1,5 s | 1,3 s cada (1) | 2 cada | Sair de baixo dos brilhos |
| Cuca | 1 | Feitiço em leque: três feitiços grandes e bem separados, o do meio mirado no Curupira | 0,8 s (0,5) | 1 cada | Passar entre eles |
| Cuca | 1 | Poção que deixa uma poça de veneno ou de lentidão por 5 s. No máximo duas poças na arena | 0,8 s (0,6) | Ver Efeitos de estado | Sair da poça |
| Cuca | 2 | Bote de jacaré: abre a boca, se joga de barriga e desliza até perto da outra parede abocanhando. Levanta e fica daquele lado | 0,9 s (0,6) | A definir | Pular |
| Cuca | 3 | Canção de ninar: uma melodia de seis notas, uma de cada vez. A grave vem rente ao chão e a aguda na altura do peito, cada uma de uma cor | 0,9 s (0,4) | A definir | Pular a grave e abaixar na aguda |
| Boto cor-de-rosa | 1 | Jato de água saindo reto da boca até a outra margem, alto (na altura do peito) ou baixo (rente à areia), sorteado. No aviso, o Boto afunda na água até o bico ficar na altura do jato (no baixo, só a cabeça fica de fora), e a água começa a sair do bico, fina, e vai crescendo até virar o jato. Depois o Boto fica parado por 1,2 s | 0,9 s (0,7) | 1 | Abaixar (alto) ou pular (baixo) |
| Boto cor-de-rosa | 1 | Beijos de bolha: quatro corações lentos e ondulando, que estouram com um tiro | 0,6 s | A definir | Atirar neles |
| Boto cor-de-rosa | 2 | Chapéu bumerangue: o chapéu vai baixo e volta alto, ou vai alto e volta baixo (sorteado). Uma linha fina mostra a altura da ida | 0,8 s (0,6) | A definir | Pular o baixo e abaixar no alto |
| Boto cor-de-rosa | 3 | Salto: mergulha (o aviso) e troca de lado pulando por cima da areia, girando e soltando três bolhas lentas | 0,8 s (sem aviso) | 1 cada | Correr para baixo dele |
| Máquina controlada por IA | 1 | Raio laser. Uma linha fina segue o Curupira, trava 0,3 s antes e dispara | 1 s (0,8) | 1 | Sair da linha |
| Máquina controlada por IA | 1 | Bombas, que caem dos alçapões do teto e explodem 1,5 s depois de cair. Depois a Máquina fica parada por 1,2 s | 1,5 s | 2 | Sair da área |
| Máquina controlada por IA | 2 | Piso traiçoeiro: as placas do chão saltam em sequência, em duas ondas vindo na direção do Curupira. Cada placa pisca 0,4 s (0,25) antes de saltar | 0,9 s (0,5) | A definir | Pular as placas |
| Máquina controlada por IA | 3 | Varredura: desce até a altura do Curupira e varre a arena com o laser, primeiro reto na altura da cabeça e depois mirando o chão. Uma linha fina mostra cada passada antes | 0,8 s cada (0,5) | A definir | Abaixar e depois pular |

Animações dos chefes no Godot (nomes no `SpriteFrames`):

| Chefe | Animações |
| --- | --- |
| Mula sem Cabeça | `idle`, `aviso_bolas`, `bolas`, `fim_bolas`, `aviso_pisoteio`, `pisoteio_alto`, `pisoteio`, `aviso_investida`, `galope`, `batida`, `tonta`, `aviso_meteoros`, `meteoros`, `cansada`, `dano`, `transicao`, `derrota` |
| Cuca | `idle`, `aviso_feitico`, `feitico`, `fim_feitico`, `aviso_pocao`, `pocao`, `fim_pocao`, `aviso_bote`, `bote`, `levantar`, `aviso_ninar`, `ninar`, `fim_ninar`, `dano`, `transicao`, `derrota` |
| Boto cor-de-rosa | `idle`, `aviso_jato`, `jato`, `fim_jato`, `aviso_beijos`, `beijos`, `fim_beijos`, `aviso_chapeu`, `arremesso`, `sem_chapeu`, `pega_chapeu`, `mergulho`, `salto`, `emergir`, `dano`, `transicao`, `derrota` |
| Máquina controlada por IA | `idle`, `aviso_laser`, `mirando`, `laser`, `fim_laser`, `aviso_bombas`, `bombas`, `fim_bombas`, `aviso_pistoes`, `pistoes`, `descer`, `varredura`, `varredura_chao`, `subir`, `dano`, `transicao`, `derrota` |

`dano` é um susto curto (0,33 s), tocado quando o chefe leva tiro parado entre ataques. Cada tiro também faz o chefe piscar de branco, soltar uma faísca onde bateu e recuar alguns pixels. `transicao` é a animação da troca de fase (2 s). O Curupira tem a própria animação `dano`: ao levar golpe, pisca de branco e a tela treme.

Os projéteis e efeitos de cada chefe (bola de fogo, onda de fogo, meteoro, feitiço, poção, poça, nota, jato, coração, chapéu, laser, bomba, alçapão, placa, explosões) são animações separadas, em `game/assets/pixel/<chefe>/efeitos/`. Quantidade, espaçamento, velocidade e tempo de cada ataque ficam no `.tres` de dados do chefe, no Godot.

Os três seres folclóricos lutam sob controle mental, por chips colocados pela máquina. Nos designs iniciais abaixo, o chip controlador aparece implantado no corpo de cada um, e o olho do chefe fica vermelho enquanto o chip está ligado. Na derrota, o chip salta do corpo e o olho volta à cor normal.

A máquina controlada por IA, o Núcleo, é uma casca branca de painéis pendurada no trilho do teto por um braço mecânico. Ela tem uma lente vermelha no lugar do olho, abas que abrem quando ela carrega um ataque e cabos soltos embaixo. Na derrota, a casca racha, a lente apaga e nasce um broto da rachadura.

&#91;image: Design inicial da Mula sem Cabeça: corpo de mula com chamas saindo do pescoço no lugar da cabeça e chip no flanco\]

&#91;image: Design inicial da Cuca: jacaré verde de cabelo loiro, com chip na lateral do corpo\]

&#91;image: Design inicial do Boto cor-de-rosa: boto de olho vermelho, com chip nas costas\]

### Planilha de dados

Ainda não existe. Ela reunirá os atributos numéricos de cada objeto e ficará ligada a esta seção.

## Localização

O jogo é somente em português.

## Ferramentas

| Uso | Ferramenta |
| --- | --- |
| Motor | Godot 4.x |
| Linguagem | GDScript |
| Arte | Gerador de pixel art em código (`art/pixel/gerador/`) e Krita para retoques |
| Música e efeitos | Bibliotecas gratuitas |
| Controle de versão | Git pelo Godot Git Plugin, com repositório no GitHub |
| Fluxo de branches | GitHub Flow |

O GDScript foi escolhido em vez de C# pela iteração mais rápida e pela quantidade de tutoriais disponíveis. O GitHub Flow foi escolhido por ser adequado a uma equipe pequena.

## Documentação técnica

O projeto usa Godot 4.x com GDScript. Nada foi implementado ainda. As estruturas abaixo são o plano para as duas primeiras cenas: o personagem (`curupira.tscn`) e a arena.

### Cena do Curupira

```
Curupira (CharacterBody2D)
├── CollisionShape2D   (CapsuleShape2D)
└── AnimatedSprite2D
```

- `CharacterBody2D` na raiz: o personagem é movido por código, com `velocity` e `move_and_slide()`, sem sofrer física externa.
- `AnimatedSprite2D` desde o início, mesmo com um quadro só: o código que troca de animação já aponta para o nó definitivo.

### Cena de arena

```
Arena (Node2D)
├── Camera2D
├── Chao (StaticBody2D)
├── ParedeEsquerda (StaticBody2D)
├── ParedeDireita (StaticBody2D)
├── Curupira (instância de curupira.tscn)
└── Chefe
```

- Chão e paredes são `StaticBody2D`, cada um com seu `CollisionShape2D`. É a geometria de que `is_on_floor()` e a colisão lateral dependem.
- A `Camera2D` é filha da arena, não do Curupira, para ficar fixa. Os limites da câmera coincidem com as bordas da arena.
- O Curupira entra na arena como instância da cena dele. Ajustes no personagem se propagam para todas as fases.
- Enquanto a arte definitiva não existe, os visuais provisórios usam `Polygon2D`, não `ColorRect`, porque `ColorRect` é nó de interface.

### Riscos e restrições

- A arena inteira precisa caber na resolução base de 1920×1080.
- O sistema de ataque depende de camadas e máscaras de colisão, ainda não definidas.
- O projeto precisa exportar para Linux e para Windows.

### Testes

Cada arena pode ser executada isoladamente com F6, sem ser a cena principal do projeto. Cheats de teste: nenhum definido.

A estrutura de pastas e a convenção de nomes de arquivos ainda não foram definidas.

## Ideias e expansões

Ideias fora do MVP, ainda não adotadas:

- Tolerância de pulo: coyote time, jump buffer e pulo de altura variável.
- Impacto: hitstop, tremor de câmera e squash and stretch no sprite.
- Partículas no dash.
- Valores de ataque em `Resource` do Godot, editáveis no inspetor.
- Exportação para Web e publicação no itch.io.

## Questões em aberto

Há 3 questões em aberto. As marcações (Q14), (Q15) e (Q16) ao longo do documento apontam para esta lista.

- [ ] **Q14. Áudio.** Bibliotecas, faixas e efeitos usados, com a fonte e a licença de cada um.
- [ ] **Q15. Travar a mira no controle.** No teclado ficou o Shift (ação `aim_lock`). Falta o botão do controle.
- [ ] **Q16. Fases, combos e ataques novos.** A estrutura está decidida (fases por dificuldade, trocando na metade ou a cada terço). Faltam, depois de testar: a chance e o atraso dos combos, a pausa de cada fase e o aviso, a duração, a velocidade e os golpes dos ataques marcados como "a definir". Valores provisórios no `.tres` de cada chefe.

### Resolvidas

| Questão | Decisão | Onde está |
| --- | --- | --- |
| O jogo tem trechos com rolagem? | Não. Só arenas fixas de chefe | Gênero |
| Qual é a ordem dos chefes? | O jogador escolhe a ordem dos três seres folclóricos. A máquina controlada por IA é o chefe final, liberada depois dos três | Objetivos e progressão |
| O que cada chefe concede? | Cada ser folclórico concede um ataque básico e um especial. A máquina não concede nada | Objetos do jogo |
| Como funciona a troca de ataques? | Escolha antes de cada fase, sem troca durante | Sistemas e funcionalidades |
| Os ataques básicos são projéteis? | Sim, todos. Variam em tipo de tiro, dano e velocidade de ataque | Sistemas e funcionalidades |
| Para onde o Curupira atira? | Em oito direções: para cima, nas diagonais e para a frente; para baixo só no ar. Também atira agachado | Sistemas e funcionalidades |
| O dash dá invencibilidade? | Sim | Sistemas e funcionalidades |
| O que acontece no quarto golpe e como é o salvamento? | O jogador perde a fase. O progresso é salvo a cada chefe derrotado e permanece depois de fechar o jogo | Sistemas e funcionalidades |
| Os chefes mudam de fase durante a luta? | Depende da dificuldade. Normal: 1 fase (máquina: 2). Expert: 2 fases (máquina: 3). Quatro ataques por chefe | Objetos do jogo |
| Os ataques têm ordem fixa? | Não. Saem embaralhados, e às vezes dois vêm emendados (combo) | Objetos do jogo |
| Tamanho dos sprites e quadros por animação (Q5)? | Pixel art em 480×270 ampliada 4×. Curupira com ~61 px, chefes entre 80 e 110 px, chefes a 12 quadros por segundo | Arte, som e música |
| Qual é o design da máquina e da arena dela? | O Núcleo pendurado no teto, numa câmara de testes branca | Objetos do jogo e Mundo do jogo |
| As arenas têm plataformas ou perigos próprios? | Não. Só chão e paredes | Mundo do jogo |
| A vida do chefe aparece na tela? | Sim, numa barra no alto da tela com o nome do chefe (mudou a pedido do Eduardo; antes era escondida, estilo Cuphead) | Interface do usuário |
| Como a história é contada? | Em cenas estáticas no início do jogo | Objetivos e progressão |
| Qual é a duração do jogo? | Não é fixa. Cada luta termina quando o chefe ou o jogador é derrotado | Experiência do jogador |

## Protótipos

Ainda não há protótipo. A implementação não começou.
