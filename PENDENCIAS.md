# Pendências da dupla

O que um deixou para o outro conferir ou decidir. Quem resolver um item apaga ele daqui
no mesmo commit. Quem deixar algo pendente para o outro, anota aqui.

## Para o Arthur conferir no editor

- **Pixel art pronta para ligar nas cenas** (`game/assets/pixel/`, guia em `docs/tdd.md` seção 4).
  - Nenhuma cena foi mexida.
  - Os `*_frames.tres` foram gerados por script a pedido do Eduardo. É exceção à regra do `CLAUDE.md` (SpriteFrames é do Arthur).
  - Em cada cena, trocar o `sprite_frames` do `AnimatedSprite2D` pelo `<nome>_frames.tres`.
  - No mesmo node, usar `scale = (4, 4)`, `texture_filter = Nearest` e o `offset` da tabela do TDD.
  - Ajustar as `CollisionShape2D` aos sprites novos. O Curupira agachado precisa de uma cápsula baixa, com ~40% da altura.
  - Os nomes de animação mudaram: os chefes agora têm `aviso_*`, `*` e `fim_*` por ataque, e o Curupira tem `atirar_*`, `ar_atirar_*` e `agachado*`. A lista está no GDD e nos `.json`.

- **Animações criadas pelo Claude no SpriteFrames.** São exceção à regra do `CLAUDE.md`
  (SpriteFrames é do Arthur) e foram feitas a pedido do Eduardo. Conferir no editor:
  - `correr` (Curupira): 8 quadros `curupira_corrida_01..08.png`, 15 fps, loop. O FPS é
    uma estimativa (passada de ~150 px no jogo, andando a 600 px/s). Ajustar até o pé de
    apoio não deslizar no chão.
  - `atacar` (Curupira): `curupira_subindo_mao.png` → `curupira_mao_atacando.png`, 10 fps,
    sem loop. O código recomeça a animação a cada tiro.
  - `bolas` (Mula): 1 quadro, `mula_bolas.png`.
- **Tamanho e posição do Curupira** (`game/scenes/curupira.tscn`):
  - escala 1,5x: sprite com escala `0.2022` e as duas cápsulas com raio 30 e altura 192;
  - raiz da cena em `(0, 0)`, porque a posição vem de cada fase;
  - sprite em `x = 0`, para o tiro sair da mão também olhando para a esquerda;
  - `Atirador` em `(91.5, -30.5)`, a palma da mão estendida.

## Decisões em aberto

- **Mira em 8 direções, agachar e fases (GDD novo).** Arte pronta, código ainda não.
  - **Input Map:** faltam as ações de mirar para cima, abaixar e travar a mira. O botão de travar a mira está na Q15 do GDD.
  - **Curupira:** `curupira.gd` e `atirador.gd` ainda atiram só para o lado. Hoje ele "desliza na pose parada de ataque" quando corre atirando. A arte nova resolve isso com a animação `correr_atirar`, que só falta ligar.
  - **Chefes:** os scripts ainda têm os 2 ataques antigos e estado único. Os 4 ataques por fase e quando cada fase começa dependem da Q16 do GDD.
  - **Regras desatualizadas:** o resumo de regras do `CLAUDE.md` e do `AGENTS.md` ainda diz "estado único", "atira para onde está olhando" e que W/S não fazem nada. A dupla decide quando atualizar.
- **Pulo × tamanho.** Com o Curupira maior (~245 px de altura), o pulo do GDD (~215 px)
  ficou mais baixo que ele, e desviar dos ataques ficou mais difícil. Mudar `velocidade_pulo`
  é valor de combate, então tem que sair do GDD.
- **Boto.** O arco do pulo (520 px, `game/scripts/boto_data.gd:28`) foi pensado para passar
  por cima do Curupira antigo, menor. Testar se agora ele acerta o Curupira.
- **Altura do tiro.** O tiro passou a sair ~28 px mais alto que antes (da mão). Conferir se
  continua acertando os chefes como deveria.
- **Mula.** As bolas nascem rente ao chão (`altura_bola = 60`,
  `game/scripts/mula_data.gd:23`, regra do GDD), não da ponta do fogo da pose `bolas`.
  Durante o aviso (0,5 s) ela ainda fica na `idle`. Dá para criar `aviso_bolas` com o mesmo
  `mula_bolas.png` sem mexer no código.
- **`DURACAO_POSE_ATAQUE`** (0,3 s) está fixo em `game/scripts/curupira.gd:29`. O
  `CLAUDE.md` pede valores de ajuste num `.tres`. Mover para o `MovimentoData`
  (`curupira_movimento.tres`)?

## Arte

- **Cor da pele.** O `curupira.png` (idle) tem a pele mais escura que os frames de ataque e
  de corrida (no peito, RGB 220,165,98 contra 237,180,97). O tom muda quando ele começa a
  andar ou atirar. Reexportar a idle com a mesma paleta.
- **Tela e escala dos frames.** Os frames novos vieram com tela e escala diferentes da idle
  e foram alinhados por script:
  - `mula_bolas.png`: ampliado 1,08x, tela 1802×1254;
  - `curupira_corrida_*.png`: reduzidos 0,86x para 1254×1254.

  Para não precisar disso, exportar todos os frames de um personagem na mesma tela e escala
  da idle dele (Curupira e Mula: 1254×1254).
- **Frame 03 da corrida.** O pé desce ~4 px abaixo do chão. Veio assim no desenho.
- **Arte antiga.** Os três itens acima (cor da pele, tela e escala, frame 03) são da arte de 1254×1254. Deixam de valer quando a pixel art entrar nas cenas.

## Repositório

- **Teasers.** `*.mp4` agora vai pelo LFS (`.gitattributes`). Mesmo assim, o commit `4db5d5b`
  ainda guarda os três vídeos inteiros (~205 MB) no histórico, e todo clone baixa esse peso.
  - Tirar de lá exige reescrever o histórico (`git lfs migrate`) e dar force push, então só
    se a dupla decidir junta.
  - O LFS do GitHub tem cota de armazenamento e de banda, e cada versão nova de um teaser
    ocupa espaço lá.
