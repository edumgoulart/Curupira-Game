# Curupira: O Protetor da Floresta — GDD

Oct 5, 2026 · @Arthur

## Status atual

O design está em definição e a implementação ainda não começou.

| Integrante | Foco principal |
| --- | --- |
| Arthur Campello Gausmann | Programação e negócios |
| Eduardo Maliszewski Goulart | Programação e arte |

O trabalho é dividido de forma igualitária; a tabela indica só o foco de cada um.

- **Definido:** história, elenco de chefes, ataques e números de combate, direção de arte, controles, telas, público e plataforma. Há designs iniciais do Curupira, dos três seres folclóricos e de três arenas.
- **Em definição:** design da máquina e da arena dela, tamanho dos sprites e lista de áudio.
- **Implementação:** não iniciada. A estrutura de cenas e o movimento do Curupira estão planejados em Documentação técnica.
- **Bloqueios:** decisões listadas em Questões em aberto. As marcações (Q5) e (Q14) ao longo do documento apontam para essa lista.

## Declaração de conceito

Curupira: O Protetor da Floresta é um jogo 2D de combates contra chefes em arenas fixas. O jogador controla o Curupira, que liberta os seres do folclore brasileiro controlados por chips e depois enfrenta a máquina controlada por IA que desmata as florestas para construir mais data centers.

## Gênero

Boss-rush de plataforma 2D em visão lateral. O jogo é composto somente por lutas contra chefes, cada uma em uma arena de tela única, sem rolagem de câmera e sem trechos de fase entre os chefes.

As referências de design são Cuphead e Mega Man. Do primeiro vêm o foco em lutas de chefe e o estilo visual; do segundo, o ataque concedido por cada chefe derrotado.

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

O estilo visual é animação 2D tradicional dos anos 1930 reinterpretada através do folclore e das paisagens brasileiras, com cenários pintados à mão, formas caricaturais, textura analógica e composição teatral. A arte é desenho digital, sob responsabilidade principal do Eduardo, e as animações são feitas em sprite sheet.

### Direção de arte

- **Traço.** Estética 2D desenhada à mão, inspirada nas animações norte-americanas das décadas de 1930 e 1940, com forte influência do estilo *rubber hose*. Os contornos são orgânicos e irregulares e as formas são levemente caricaturais. O acabamento evita um aspecto digital excessivamente limpo.
- **Pintura.** Simula aquarela, guache e tinta sobre papel, com textura granulada, pequenas imperfeições e variações de cor.
- **Profundidade.** Os ambientes usam várias camadas de vegetação. Elementos próximos à câmera são maiores e mais escuros; o fundo usa silhuetas, fumaça e redução de contraste para criar perspectiva atmosférica.
- **Paleta.** Quente, terrosa e relativamente dessaturada: marrons, verdes escuros, ocres e cinzas. Elementos importantes usam cores altamente saturadas, como os vermelhos, laranjas e amarelos do fogo.
- **Composição das arenas.** Segue a lógica de um palco teatral 2D. A área frontal, relativamente limpa, é a arena jogável. Os elementos complexos e narrativos ficam no fundo e nas laterais, para manter legíveis os personagens, os inimigos e os projéteis.

As ferramentas de arte são o Krita e o ChatGPT. Não decidido (Q5): tamanho dos sprites e quadros por animação.

### Animações, som e lista de assets

As animações previstas para o Curupira são parado, correr, pular, dash e ataque. Os designs iniciais do Curupira e dos três seres folclóricos estão em Objetos do jogo, e os das três arenas estão em Mundo do jogo. Faltam o design da máquina e o da arena dela.

A música de fundo é simples e de estilo brasileiro, natural e sem exageros. Música e efeitos sonoros vêm de bibliotecas gratuitas. Não decidido (Q14): quais bibliotecas, faixas e efeitos serão usados.

Lista de assets: ainda não existe. Ela será uma planilha separada com todos os assets de arte e som, ligada a esta seção.

## Plataforma-alvo

O jogo é para PC e é projetado para controle (gamepad), que é a forma recomendada de jogar. O teclado também funciona. A plataforma inicial é Linux, e o projeto precisa poder ser exportado para Windows com facilidade. O jogo roda em tela cheia, com resolução base de 1920×1080.

Os requisitos mínimos serão definidos depois que o jogo estiver concluído.

## Concorrência

| Jogo | Lançamento | Semelhança |
| --- | --- | --- |
| Cuphead (Studio MDHR) | 2017 | Lutas contra chefes como núcleo do jogo; estilo visual de referência |
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

A arena é uma península de areia com água dos dois lados. O Boto cor-de-rosa alterna entre os dois lados, pulando de um para o outro. No design inicial, a água é azul de um lado e barrenta do outro.

&#91;image: Design inicial da arena do Boto cor-de-rosa: península de areia entre água azul e água barrenta\]

### Cenário: floresta da Cuca

A arena fica na floresta, com o caldeirão de feitiços da Cuca ao fundo.

&#91;image: Design inicial da arena da Cuca: clareira na floresta com um caldeirão verde ao pé de uma árvore\]

### Cenário: sala da máquina

A arena é uma sala branca dentro da central da empresa. O design desse cenário ainda não foi feito.

### Estrutura das arenas

As arenas têm só chão e paredes, sem plataformas, obstáculos ou perigos próprios. Elas são abertas em cima: não há teto físico, e o limite superior da tela cumpre esse papel visualmente. A câmera é fixa no centro da arena e não segue o Curupira.

A arena inteira cabe na resolução base de 1920×1080.

### Física

O jogo é em visão lateral com gravidade. Os valores planejados estão em Sistemas e funcionalidades.

## Interface do usuário

O jogo é controlado por gamepad, com teclado como alternativa. As ações usam nomes próprios no Input Map do Godot, e não as ações `ui_*`, para não conflitar com a navegação de menus.

| Ação | Controle (layout Xbox) | Teclado | Ação no Input Map |
| --- | --- | --- | --- |
| Andar | Direcional | WASD | `move_left`, `move_right` |
| Pular | A | Espaço | `jump` |
| Ataque básico | X | J | A definir |
| Especial | Y | K | A definir |
| Dash | B | L | A definir |

### Telas

O jogo tem nove tipos de tela:

- **Cenas de abertura.** Cenas estáticas no início do jogo, que explicam a história.
- **Menu inicial.** Mostra também os botões de cada ação; é assim que o jogador aprende os controles.
- **Seleção de fase e de ataques.** O jogador escolhe o chefe e, na mesma tela, o ataque básico e o especial.
- **Arena.** Uma por chefe, quatro no total.
- **Pausa.**
- **Opções.** Volume, alternância entre tela cheia e janela e, quando aberta no meio de uma fase, a opção de voltar para a seleção de fase.
- **Derrota.** O jogador pode tentar a fase de novo ou voltar para a seleção.
- **Vitória.** Depois dela o jogador volta para a seleção de fase.
- **Créditos.** Aparecem logo depois que o chefe final é derrotado.

### Elementos na tela durante a luta

A vida do Curupira e a carga do especial ficam no canto inferior esquerdo da tela. A vida do chefe não aparece: o jogo a contabiliza, mas não a mostra ao jogador, como em Cuphead.

Durante a luta, W e S no teclado e cima e baixo no direcional não têm função.

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

O Curupira atira na horizontal, para o lado em que está olhando. Segurar o botão de ataque atira sem parar.

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

## Objetos do jogo

O jogo tem um personagem jogável e quatro chefes.

### Curupira

&#91;image: Design inicial do Curupira: cabelo vermelho em forma de chamas e saia de folhas\]

| Atributo | Valor |
| --- | --- |
| Vida | 4 golpes |
| Velocidade horizontal | 600 px/s |
| Velocidade inicial do pulo | 1100 px/s |
| Gravidade | 2800 px/s² |
| Dash | 300 px em 0,2 s, recarga de 0,8 s |
| Invencibilidade após golpe | 1,5 s |
| Forma de colisão | Cápsula |

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

Cada um dos três seres folclóricos concede um ataque básico e um especial ao ser derrotado. A máquina controlada por IA é o chefe final, liberada depois dos três, e não concede ataque. Cada chefe tem um estado único: nenhuma luta muda de fase no meio.

Três regras valem para todos os chefes:

- O chefe pode levar dano o tempo todo.
- Todo ataque tem um aviso visual antes do golpe.
- Depois do ataque mais forte, o chefe fica parado por um instante. É a janela para o jogador atacar.

| Chefe | Perfil | Vida | Duração-alvo | Pausa entre ataques | Concede ao Curupira |
| --- | --- | --- | --- | --- | --- |
| Mula sem Cabeça | Dano alto e vida baixa | 1200 | 1 min 15 s | 1,2 s | Bola de Fogo e Canhão Flamejante |
| Cuca | Equilibrada entre vida e dano | 1600 | 1 min 40 s | 1,6 s | Feitiço Perseguidor e Poção Maldita |
| Boto cor-de-rosa | Vida alta, mais movimento e dano baixo | 2000 | 2 min | 2 s | Bolha d'Água e Bolha Abissal |
| Máquina controlada por IA | Vida alta e dano alto, os maiores entre todos os chefes | 2400 | 2 min 30 s | 1,2 s | Nada, por ser o chefe final |

A duração-alvo supõe que o jogador acerta o chefe em 60% do tempo. Uma partida sem derrotas soma cerca de 7 min 30 s.

Ataques de cada chefe:

| Chefe | Ataque | Aviso | Golpes |
| --- | --- | --- | --- |
| Mula sem Cabeça | Três bolas de fogo em sequência | 0,5 s | 1 cada |
| Mula sem Cabeça | Meteoro, que ela atira para cima com seus poderes. Uma sombra no chão marca a queda. Depois dele, a Mula fica parada por 1,5 s | 1 s | 2 |
| Cuca | Feitiço | 0,5 s | 1 |
| Cuca | Poção que deixa uma poça de veneno ou de lentidão por 5 s. No máximo duas poças na arena | 0,6 s | Ver Efeitos de estado |
| Boto cor-de-rosa | Troca de lado a cada 6 s, pulando e soltando três bolhas lentas | Sem aviso | 1 cada |
| Boto cor-de-rosa | Jato de água, parado em um dos lados. Depois dele, o Boto fica parado por 1,2 s | 0,7 s | 1 |
| Máquina controlada por IA | Raio laser. Uma linha fina mostra o trajeto antes do disparo | 0,8 s | 1 |
| Máquina controlada por IA | Bombas, que explodem 1,5 s depois de cair | 1,5 s | 2 |

Os três seres folclóricos lutam sob controle mental, por chips colocados pela máquina. Nos designs iniciais abaixo, o chip controlador aparece implantado no corpo de cada um. O design da máquina ainda não foi feito.

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
| Arte | Krita e ChatGPT |
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

Há 2 questões em aberto. As marcações (Q5) e (Q14) ao longo do documento apontam para esta lista.

- [ ] **Q5. Produção da arte.** Tamanho dos sprites e quadros por animação; design da máquina e da arena dela.
- [ ] **Q14. Áudio.** Bibliotecas, faixas e efeitos usados, com a fonte e a licença de cada um.

### Resolvidas

| Questão | Decisão | Onde está |
| --- | --- | --- |
| O jogo tem trechos com rolagem? | Não. Só arenas fixas de chefe | Gênero |
| Qual é a ordem dos chefes? | O jogador escolhe a ordem dos três seres folclóricos. A máquina controlada por IA é o chefe final, liberada depois dos três | Objetivos e progressão |
| O que cada chefe concede? | Cada ser folclórico concede um ataque básico e um especial. A máquina não concede nada | Objetos do jogo |
| Como funciona a troca de ataques? | Escolha antes de cada fase, sem troca durante | Sistemas e funcionalidades |
| Os ataques básicos são projéteis? | Sim, todos. Variam em tipo de tiro, dano e velocidade de ataque | Sistemas e funcionalidades |
| Para onde o Curupira atira? | Na direção para onde está olhando | Sistemas e funcionalidades |
| O dash dá invencibilidade? | Sim | Sistemas e funcionalidades |
| O que acontece no quarto golpe e como é o salvamento? | O jogador perde a fase. O progresso é salvo a cada chefe derrotado e permanece depois de fechar o jogo | Sistemas e funcionalidades |
| Os chefes mudam de fase durante a luta? | Não. Cada chefe tem um estado único | Objetos do jogo |
| As arenas têm plataformas ou perigos próprios? | Não. Só chão e paredes | Mundo do jogo |
| A vida do chefe aparece na tela? | Não. Só a vida do Curupira e a carga do especial, no canto inferior esquerdo | Interface do usuário |
| Como a história é contada? | Em cenas estáticas no início do jogo | Objetivos e progressão |
| Qual é a duração do jogo? | Não é fixa. Cada luta termina quando o chefe ou o jogador é derrotado | Experiência do jogador |

## Protótipos

Ainda não há protótipo. A implementação não começou.
