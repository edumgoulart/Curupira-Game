# Curupira: O Protetor da Floresta — TDD

Documento de Design Técnico · v0.3 · Godot 4.7.1 · GDScript

Este documento descreve **como** o jogo é construído. O **o quê** (regras, números, arte, história) está no GDD, que é a fonte de verdade para todos os valores.

**Legenda**
- Sem marcação: vem do GDD.
- **[Implementado]**: já existe no código; este documento reflete o que o projeto faz.
- **[Assumido]**: padrão escolhido neste TDD; pode ser vetado.
- **[Divergente]**: o código faz diferente do que uma versão anterior do TDD previa; vale a decisão do código (ver seção 19 para vetar).
- **[Aberto]**: ainda precisa ser decidido ou confirmado.

**O que mudou da v0.2 para a v0.3**
- A arte passou a ser **pixel art** (480×270 ampliada 4×), gerada por código e importada como folhas de sprite com um `.json` de pontos (seção 10).
- Os chefes têm **três fases** e **quatro ataques** cada, e a lógica deles virou um sequenciador com `await` (seção 8).
- O Curupira **mira em 8 direções** e **agacha** (seção 6).
- Projéteis e efeitos são **modulares**: uma imagem por projétil, e o código cria quantos o ataque pedir (seção 10.5).
- As arenas trocaram o fundo antigo por `FundoArena` e o chão foi para y = 340 (seção 9).
- O Input Map ganhou `aim_up`, `crouch` e `aim_lock` (seção 12).
- Os ataques ganhos dos chefes, os menus (fonte, botões, título, fundo) e as áreas de dano passaram para a pixel art; a arte antiga foi para `art/antiga/` (seções 7, 10 e 11).

---

## 1. Status

Revisão v0.3 feita sobre a pasta `game/` (branch `movimento-curupira`), depois do port da pixel art.

| Área | Estado |
|---|---|
| Curupira (movimento, coyote, jump buffer, pulo variável, dash, vida, invencibilidade) | Pronto |
| Curupira: mira em 8 direções, agachar, poses de tiro por direção | Pronto (falta teste manual) |
| Ataques básicos (4) e especiais (4), carga do especial | Pronto, todos em pixel art (a Bola de Fogo só tem o desenho de lado) |
| Chefes: Mula, Cuca, Boto, Máquina, 3 fases × 4 ataques | Pronto (falta teste manual e balanceamento) |
| Arte em pixel: Curupira, 4 chefes, efeitos dos chefes, 4 arenas | Pronta, ligada nas cenas |
| Efeitos de estado (veneno, lentidão) no chefe e no Curupira | Pronto, sem componente `StatusEffects` (ver 7.6) |
| Arenas (4), HUD, pausa, derrota, vitória, créditos | Pronto |
| Menu inicial, seleção de fase e ataques | Pronto, em pixel art |
| Save de progresso e equipamento | Pronto (formato `ConfigFile`, ver 14) |
| **Opções (volume, tela cheia)** | **Não feito** (tela é só um aviso "em breve") |
| **Áudio (barramentos, músicas, SFX)** | **Não feito** |
| **Cenas de abertura** | **Não feito** |
| **Cheats de debug** | **Não feito** |
| **Export (Linux/Windows), `CREDITS.md`** | **Não feito** |

## 2. Visão técnica

Boss-rush de plataforma 2D em visão lateral. Quatro arenas de tela única (1920×1080), sem rolagem. Um jogador. Gamepad recomendado, teclado suportado. Linux primeiro, exportável para Windows. Distribuição em itch.io e Steam.

## 3. Stack e configuração do projeto

| Item | Valor |
|---|---|
| Motor | Godot **4.7.1** estável **[Implementado]** (`config/features` = 4.7) |
| Linguagem | GDScript, com tipagem estática (`var x: int`, `-> void`) |
| Renderer | **GL Compatibility** **[Implementado]** (2D simples; roda em hardware modesto e simplifica o export) |
| Resolução base | 1920×1080. A arte é desenhada em 480×270 e ampliada 4× (seção 10) |
| Stretch | Mode `canvas_items`, aspect `expand` **[Implementado]** |
| Tela | **[Aberto]** `window/size/mode = 2` (maximizada). O GDD pede tela cheia por padrão (modo 3), alternável nas Opções |
| Filtro de textura | **[Divergente]** Pixel art usa `Nearest`. As raízes das arenas (`level1..4`) têm `texture_filter = Nearest`, e os filhos herdam. Os menus também (raiz de cada tela). O padrão do projeto continua `Linear` por causa das folhas do dash, a última arte antiga em uso (10.3) |
| Snap 2D to pixel | Desligado **[Assumido]** |
| Física | 60 ticks/s (padrão). O combate roda no `_physics_process`, em ritmo fixo **[Implementado]** |
| Gravidade global | `2d/default_gravity = 3000` no projeto, **não usada**: o Curupira usa a própria (2800) e os chefes não usam gravidade |
| Controle de versão | Git, GitHub, GitHub Flow. **Git LFS** para `*.png`, `*.kra` e `*.mp4`; `.tscn`, `.tres` e `.import` marcados `binary` no `.gitattributes` (sem merge automático) **[Implementado]** |
| Plataformas | Linux (inicial) e Windows (export) |

**Layout do repositório [Implementado]**: o `project.godot` fica em `game/`, não na raiz. A Godot abre `game/`. `docs/`, `art/` e `teaser/` ficam fora do projeto.

## 4. Estrutura de pastas

O projeto é plano, com uma pasta `dados/` para os `.tres` e uma pasta `assets/pixel/` para a arte nova:

```
jogo-curupira/
├── CLAUDE.md, PENDENCIAS.md, README.md
├── docs/                      # GDD, tdd.md
├── art/
│   ├── source/                # .kra do Krita (arte antiga)
│   ├── antiga/                # PNGs da arte antiga e placeholders, fora do jogo (só consulta)
│   └── pixel/                 # gerador de pixel art (JS), exportador, gerar_spriteframes.gd
├── teaser/                    # scripts e vídeos do teaser
└── game/                      # <- a Godot abre aqui
    ├── project.godot
    ├── assets/
    │   ├── pixel/             # arte em uso: <personagem>/ (folha, .json, _frames.tres, efeitos/), arenas/<chefe>/, arenas/menu/, ui/
    │   └── efeitos/folha.png  # arte antiga ainda em uso (folhas do dash)
    ├── scenes/                # todas as cenas, sem subpastas
    ├── scripts/               # todos os scripts, sem subpastas
    ├── dados/
    │   ├── ataques/           # 1 .tres por ataque + catalogo.tres
    │   ├── chefes/            # mula, cuca, boto, maquina
    │   ├── curupira_movimento.tres, curupira_vida.tres
    │   └── tema_menus.tres
    └── testes/                # cenas de teste manual (F6) e teste_lutas.gd (headless)
```

**Convenções [Implementado]**
- Arquivos e pastas em `snake_case`; cena e script com o mesmo nome base (`mula.tscn` / `mula.gd`).
- Nós em `PascalCase`.
- Código (variáveis, funções, sinais, constantes, `class_name`) e nós **em português**, como no `CLAUDE.md`. Exceções em inglês: os nós dos níveis (`Floor`, `LeftWall`, `RightWall`, herdados do protótipo), `take_damage`, `Hitbox` e `Hurtbox`. **[Aberto]** O GDD pedia `Chao`, `ParedeEsquerda`, `ParedeDireita`: renomear ou atualizar o GDD.
- Constantes em `MAIÚSCULAS_COM_UNDERLINE`.
- Cada script documenta no topo as animações que espera no `SpriteFrames`.
- `Hitbox` e `Hurtbox` são **scripts com `class_name`** aplicados nos `Area2D` de cada cena, sem cena própria.

## 5. Arquitetura geral

### 5.1 Fluxo de cenas

```
Menu inicial ⇄ Opções
     ↓ (Novo Jogo apaga o save; Continuar só habilita se houver save)
Seleção de fase e ataques  (level_select)
     ↓
Arena (level1..4) ⇄ Pausa
   ↙              ↘
Derrota          Vitória
(tentar de novo   ↓
 ou Seleção)    Seleção
Máquina derrotada → Créditos (direto) → Menu inicial
```

- **Cena principal**: `main.tscn` (hoje abre o `level1` direto, é a cena de teste). **[Aberto]** Trocar `run/main_scene` para `main_menu.tscn` antes do build.
- **Abertura**: **[Aberto]** não existe. Decidir se entra no MVP.
- `Pausa → Opções` e "voltar à seleção a partir das Opções em arena": **não feito**. A pausa tem hoje Continuar / Tentar de novo / Seleção.
- Troca de cena: `get_tree().change_scene_to_file()` direto nos scripts de UI **[Implementado]**. **[Assumido]** Só criar um `SceneManager` se entrar transição.

### 5.2 Autoloads

| Autoload | Responsabilidade |
|---|---|
| `GameState` **[Implementado]** | Progresso (`concluidas`), ataques equipados, carregar/salvar/apagar |

Regras do `GameState` **[Implementado]**:
- O progresso é uma lista de ids de fase: `fase1` (Mula), `fase2` (Cuca), `fase3` (Boto), `boss` (Máquina). Cada `ChefeData` guarda o próprio `id_progresso`; a vitória chama `marcar_concluida(id)`.
- Ataques desbloqueados são **derivados** das fases concluídas: cada `AtaqueData` / `EspecialData` tem `fase_que_libera` (`""` = inicial) e `GameState.liberado()` confere. Não são salvos separadamente.
- `boss_liberado()` só é verdadeiro com `fase1`, `fase2` e `fase3` concluídas.
- `marcar_concluida()` salva na hora; `equipar()` também.
- `GameState._ready()` carrega o save ao abrir o jogo, para que vencer uma fase aberta com F6 não apague o progresso existente.
- **Opções (volume, tela cheia) ainda não estão no `GameState`** **[Aberto]**.

### 5.3 Pausa

`get_tree().paused = true`. `MenuPausa`, `TelaDerrota` e `TelaVitoria` têm `process_mode = PROCESS_MODE_ALWAYS` para continuar recebendo input com a árvore pausada (a derrota e a vitória pausam depois de um atraso, e o menu precisa responder nos dois casos). A pausa não abre por cima de outra tela que já pausou o jogo. As esperas das telas usam `create_timer(atraso, false)` para também pararem se o jogador pausar durante o atraso.

Os chefes param junto: o sequenciador conta o tempo no `_physics_process`, que não roda com a árvore pausada (8.4).

## 6. Curupira

### 6.1 Cena **[Implementado]**

```
Curupira (CharacterBody2D)        # layer: player (2); origem no centro do corpo
├── AnimatedSprite2D              # curupira_frames.tres (gerado), escala 4, Nearest, em (0, 96) = pés
├── CollisionShape2D              # cápsula de pé; agachado troca por uma de metade da altura
├── Atirador (Marker2D)           # atirador.gd; segue o ponto "mao" do quadro atual
├── Vida (Node)                   # contador de golpes
├── Hurtbox (Area2D)              # layer 2, mask 0; também encolhe agachado
├── CargaEspecial (Node)          # barra do especial
└── EfeitoDash (instância)        # fantasmas, folhas, vento, corpo esticado (só visual)
```

- **[Divergente]** O `SpriteFrames` agora é **gerado** pelo gerador de pixel art (`curupira_frames.tres`), não montado à mão no editor. A hurtbox é uma cápsula um pouco menor que o corpo (raio 24, altura 172, 10 px abaixo do centro), para golpe de raspão no cabelo não contar.
- O sprite fica nos pés (`y = +96`) porque a âncora da folha é o pé (10.4).
- **Virar**: `sprite.scale.x = ±4`, não `flip_h` (10.4). O `EfeitoDash` mantém o sinal da escala quando estica o corpo.

### 6.2 Movimento **[Implementado]**

Valores em `dados/curupira_movimento.tres` (`MovimentoData`):

| Parâmetro | Valor |
|---|---|
| Velocidade horizontal | 600 px/s |
| Velocidade inicial do pulo | 1100 px/s (para cima) |
| Gravidade | 2800 px/s² (própria do personagem) |
| Coyote time | 0,1 s |
| Jump buffer | 0,1 s |
| Pulo variável | soltar o botão multiplica a subida por 0,5 |

- Pulo só no chão (com coyote); sem pulo duplo.
- Estados em `enum` + `match`: `PARADO, CORRENDO, PULANDO, CAINDO, AGACHADO, DASH, ESPECIAL, DERROTADO`. O estado de chão/ar é derivado da física depois do `move_and_slide()`; dash, especial e derrotado só saem pelo próprio tempo.
- `olhando_para` (±1) define o lado do tiro e do dash.

### 6.3 Mira e agachar **[Implementado]**

A mira é um ângulo em graus (`MIRA_CIMA −90`, `MIRA_DIAG_CIMA −45`, `MIRA_FRENTE 0`, `MIRA_DIAG_BAIXO 45`, `MIRA_BAIXO 90`); o lado vem de `olhando_para`. É recalculada a cada quadro em `_calcular_mira()`:

| Situação | Sem direcional | `aim_up` | `crouch` |
|---|---|---|---|
| De pé, parado | frente | cima | agacha |
| Andando | frente | diagonal para cima | agacha |
| Agachado | frente (rente ao chão) | — | — |
| Segurando `aim_lock` no chão | frente, sem andar | cima ou diagonal para cima | diagonal para baixo |
| No ar | frente | cima ou diagonal para cima (com lado) | baixo ou diagonal para baixo (com lado) |

- **Agachar** (`AGACHADO`): enquanto segura `crouch` no chão, sem `aim_lock`; não anda. A cápsula do corpo e a da hurtbox trocam para formas com metade da altura (`ALTURA_AGACHADO = 0,5`; GDD: ~40%), alinhadas pelo pé. Soltar o botão levanta; pular e dar dash saem do agachado.
- **De onde sai o tiro**: o `Atirador` vai para o ponto `mao` do quadro que está na tela (`FolhaSprites.ponto`), então o tiro sai da mão em qualquer pose e dos dois lados.
- O projétil recebe o ângulo em `configurar(dano, velocidade, direcao, angulo)` (7.3).

### 6.4 Dash **[Implementado]**

- 300 px em 0,2 s (1500 px/s), invencível durante todo o percurso (a hurtbox é desligada).
- Recarga: 0,8 s, contada a partir do fim do dash. No ar: um dash por pulo (volta ao tocar o chão).
- Direção: para onde o Curupira olha, reta na horizontal; sem gravidade durante o dash.
- Contra frames de float: `is_zero_approx` evita um 13º frame (325 px).
- O dash cancela a pose de ataque e levanta do agachado.

### 6.5 Vida e invencibilidade **[Implementado]**

Valores em `dados/curupira_vida.tres` (`VidaJogadorData`): 4 golpes, 1,5 s de invencibilidade, pisca a cada 0,1 s.

- Cada golpe tira 1 ou 2 (tabela de ataques dos chefes).
- **Invencibilidade por física**: `esta_invencivel()` (dash, derrotado, ou tempo pós-golpe) liga/desliga a `Hurtbox` (`ligada`), que desabilita as `CollisionShape2D` com `set_deferred`. Não é um `if` na hitbox. `take_damage` repete a checagem para o caso de dois ataques no mesmo frame.
- O pisca é por `sprite.visible` (alternância).
- Ao zerar a vida: estado `DERROTADO`, emite `derrotado`; `TelaDerrota` espera 1 s e pausa.
- Sem cura. Tentar de novo = `reload_current_scene()` (vida e barra voltam cheias).
- Religar o `monitorable` de uma `Area2D` **não** re-dispara quem já estava encostado; religar a forma de colisão dispara. Por isso a `Hurtbox` desliga as formas.

### 6.6 Animações **[Implementado]**

Lista completa no topo de `curupira.gd`. Qual animação toca é decidido pela ordem:

1. `derrota`, `especial`, `dash` (estados que só saem pelo tempo);
2. `dano` por 0,2 s depois de um golpe (`DURACAO_POSE_DANO`);
3. **tiro** (0,3 s depois do último tiro, `DURACAO_POSE_ATAQUE`), escolhido pela mira e pelo estado: `atirar`, `atirar_diag_cima`, `atirar_cima`, `atirar_diag_baixo` de pé; `correr_atirar`, `correr_atirar_diag_cima` andando; `ar_atirar_<cima|diag_cima|lado|diag_baixo|baixo>` no ar; `agachado_atirar` agachado;
4. movimento: `abaixar` → `agachado` → `levantar`, `correr`, `pular`, `cair`, `pouso` (curto, ao tocar o chão), `idle`.

Se uma animação não existir, toca `idle` (sem erro). Isso resolve a decisão "atirar correndo" da v0.2: existe `correr_atirar`.

### 6.7 Estado durante o Canhão Flamejante **[Implementado]**

Durante os 1,5 s do feixe o estado é `ESPECIAL`; o Curupira **não anda, não pula, não dá dash e não vira**. O feixe é filho do `Atirador` e acompanha o corpo. A pose usa `especial`.

## 7. Combate

### 7.1 Camadas de colisão **[Implementado]**

Nomes configurados no `project.godot`.

| # | Layer | Quem está nela | Mask (o que enxerga) |
|---|---|---|---|
| 1 | `world` | Chão, paredes | — |
| 2 | `player` | Corpo e Hurtbox do Curupira | `world` e `limite_arena` (corpo, máscara 33); Hurtbox mask 0 |
| 3 | `player_hitbox` | Projéteis e feixe do Curupira | `enemy`, `world` (máscara 9) |
| 4 | `enemy` | Hurtbox do chefe; corações do Boto (podem ser estourados) | — |
| 5 | `enemy_hitbox` | Projéteis, ondas, poças, bombas, placas, laser, jato do chefe | `player` |
| 6 | `limite_arena` | Paredes que só seguram o corpo do Curupira (beiras da areia do Boto) | — |

Quem causa dano só enxerga quem recebe pelas masks, nunca por `if` no código. As paredes da areia do Boto ficam na `limite_arena`, e não na `world`, para os tiros do Curupira passarem por elas até o Boto na água. As ondas de fogo da Mula têm mask só `player` (2) para não baterem no chão em que correm. Projéteis do chefe também ficam no grupo `ataques_chefe`, usado para limpá-los quando o chefe morre.

### 7.2 Hitbox e Hurtbox **[Implementado]**

- **Hitbox** (`Area2D`, `class_name Hitbox`): campo `dano`; ao entrar em uma `Area2D` que tenha `take_damage`, chama e emite `acertou`. Não sabe quem é o alvo.
- **Hurtbox** (`Area2D`, `class_name Hurtbox`): `take_damage(amount: int, from: Node)` emite `golpe_recebido`; o dono (Curupira, Chefe ou um projétil que pode ser estourado) escuta e decide. Também tem `aplicar_efeito(efeito, intensidade, duracao)` com o sinal `efeito_recebido`.
- `amount` é `int`: golpes inteiros contra o Curupira, pontos inteiros contra o chefe.
- O chefe leva dano o tempo todo (sem janelas de invulnerabilidade).
- Projétil do Curupira (`class_name Projetil`, `Area2D`): reto, ou persegue o chefe mais próximo (grupo `chefes`) se `curva > 0`; some ao acertar, ao bater na parede ou ao sair da tela.

### 7.3 Ataques básicos **[Implementado]**

Um `.tres` (`AtaqueData`) por ataque em `dados/ataques/`. Segurar o botão atira; intervalo = `1 / (tiros_por_segundo × fator_lentidão)`. Os projéteis saem **na direção da mira** (6.3).

| Ataque | Dano | Tiros/s | Carga por acerto | Velocidade (px/s) | Comportamento | Arte |
|---|---|---|---|---|---|---|
| Tiro de Folha (inicial) | 4 | 5 | +1 | 1800 | Reto | Pixel, um desenho por direção |
| Bola de Fogo (Mula) | 12 | 1,5 | +3 | 1000 | Reto; explosão no impacto (`explosao_mula.tscn`) | Pixel (a bola da Mula), só de lado |
| Feitiço Perseguidor (Cuca) | 3 | 4 | +1 | 900 | Persegue o chefe: curva 540°/s, vida máxima 3 s | Pixel (`feitico`), gira com o voo |
| Bolha d'Água (Boto) | 26 | 0,8 | +6 | 600 | Lento, reto; respingo no impacto | Pixel (`bolha_agua`, `respingo_agua`) |

**Desenho por direção**: pixel art não gira bem. O projétil reto escolhe os quadros pelo ângulo (`quadros_cima` acima de 67°, `quadros_diagonal` acima de 22°, o de lado no resto), espelha com o lado e vira de cabeça para baixo para os tiros para baixo. O perseguidor gira inteiro, porque muda de direção no voo.

### 7.4 Carga e disparo do especial **[Implementado]**

- Barra de 100 pontos (`CargaEspecial`). Cada acerto do básico soma a "carga por acerto" do ataque equipado (o `Atirador` emite `acerto_basico`).
- Barra cheia + `attack_special` dispara; a barra volta a 0 (`gastar()`).
- A barra começa em 0 a cada fase (recarregar a cena zera).
- Acertos do próprio especial não carregam a barra.
- **[Aberto]** Estourar um coração do Boto também conta como acerto e carrega a barra (a hurtbox do coração está na layer `enemy`). Decidir se é desejado.
- O HUD escuta `carga_mudou` e `vida_mudou` por sinal.

### 7.5 Especiais **[Implementado]**

Um `.tres` (`EspecialData`) por especial. Duas cenas: projétil que voa, ou `FeixeCanhao` preso ao Curupira.

| Especial | Efeito técnico | Arte |
|---|---|---|
| Instinto Selvagem (inicial) | Projétil grande, reto, 150 de dano, 1200 px/s | Pixel (onça) |
| Canhão Flamejante (Mula) | Feixe preso ao Curupira, 1,5 s, 200 de dano em **10 pulsos de 20**; Curupira parado (6.7) | Pixel: `feixe_meio` repetido em `region` (como o jato do Boto) + `feixe_boca` na mão |
| Poção Maldita (Cuca) | Projétil **reto** a 1000 px/s; 40 de dano no impacto + veneno 20/s por 8 s | Pixel (`pocao_maldita` girando, `respingo_veneno`) |
| Bolha Abissal (Boto) | Projétil reto a 700 px/s; 60 de dano + lentidão de 40% por 6 s | Pixel (`bolha_abissal`, `respingo_agua`) |

### 7.6 Efeitos de estado

Não existe um componente `StatusEffects`. Cada alvo trata o efeito no próprio script, recebido por `Hurtbox.efeito_recebido`:

| Efeito | No chefe (`chefe.gd`) | No Curupira |
|---|---|---|
| Veneno | `Timer` de 1 s: um pulso de dano por segundo; reaplicar só renova o número de pulsos. Chefe fica esverdeado | Só pela poça da Cuca (abaixo) |
| Lentidão | `fator_tempo()` = `1 − lentidão` (0,6). O sequenciador multiplica o `delta` por ele: avisos, pausas, corridas e cadência ficam mais lentos, e as animações tocam mais devagar (`speed_scale`). Projéteis já soltos não mudam. Chefe fica azulado | `aplicar_lentidao(fonte, fator)` / `remover_lentidao(fonte)` com dicionário por fonte; vale o menor fator. Reduz velocidade horizontal e cadência do tiro. Pulo e dash não mudam |

**[Aberto]** Extrair um `StatusEffects` só compensa se aparecer um terceiro tipo de alvo ou um efeito novo.

Poças da Cuca (`PocaCuca`, `Area2D`, layer `enemy_hitbox`, mask `player`) **[Implementado]**:
- Duram 5 s; no máximo 2 na arena (ao criar a 3ª, a mais antiga some).
- Tipo sorteado 50/50 (veneno ou lentidão), com desenho próprio para cada um.
- Veneno: 1 golpe se o Curupira ficar **1 s seguido** dentro; o contador zera ao sair, e o dash também zera.
- Lentidão: velocidade ×0,6 enquanto dentro.

## 8. Chefes

### 8.1 Regras globais

1. Pode levar dano o tempo todo.
2. Todo ataque tem aviso: uma animação de aviso (`aviso_<ataque>`) e um brilho colorido no sprite (`avisar()`: laranja Mula, verde Cuca, azul Boto, vermelho Máquina).
3. Os ataques mais fortes terminam com o chefe parado, cansado ou tonto (janela de ataque).
4. **[Divergente]** A luta tem **três fases**, trocadas pela vida que sobra (GDD, seção dos chefes; números em Q16). A v0.2 e o `CLAUDE.md` ainda falam em "estado único".

A vida do chefe **não aparece** na tela; o retorno é um pisca branco a cada acerto.

### 8.2 Dados **[Implementado]**

`ChefeData` (base) tem nome, vida, pausa entre ataques, golpes de contato, `id_progresso` e o grupo **Fases**:

| Campo | Valor | Para quê |
|---|---|---|
| `vida_fase_2` | 0,667 | Fração da vida em que começa a fase 2 (provisório, GDD Q16) |
| `vida_fase_3` | 0,333 | Fração da vida em que começa a fase 3 (provisório, GDD Q16) |
| `ataques_fase_1..3` | `Array[StringName]` | Nomes dos ataques sorteados em cada fase |

| Chefe | Vida | Pausa entre ataques | Concede | `id_progresso` |
|---|---|---|---|---|
| Mula sem Cabeça | 1200 | 1,2 s | Bola de Fogo + Canhão Flamejante | `fase1` |
| Cuca | 1600 | 1,6 s | Feitiço Perseguidor + Poção Maldita | `fase2` |
| Boto cor-de-rosa | 2000 | 2 s | Bolha d'Água + Bolha Abissal | `fase3` |
| Máquina controlada por IA | 2400 | 1,2 s | Nada (chefe final) | `boss` |

Cada chefe tem a própria classe de dados (`MulaData`, `CucaData`, `BotoData`, `MaquinaData`), com um `@export_group` por ataque e a cena de cada projétil. Contato com o corpo do chefe (`Contato`) tira 1 golpe. **[Aberto]** Valor provisório, não está no GDD.

### 8.3 Ataques **[Implementado]**

Fase 1 usa os dois primeiros ataques; a fase 2 acrescenta o terceiro; a fase 3, o quarto. "Provisório" = não está no GDD, ajustar testando no `.tres`.

| Chefe | Fase | Ataque | Aviso | Golpes | O que acontece (valores no `.tres`) |
|---|---|---|---|---|---|
| Mula | 1 | `bolas` | 0,5 s | 1 cada | Abaixa o peito e cospe 3 bolas rente ao chão (60 px), a 700 px/s, uma a cada 0,35 s |
| Mula | 1 | `pisoteio` | 0,8 s | 1 | Empina, bate as patas e solta uma onda de fogo pelo chão a 650 px/s (provisório) |
| Mula | 2 | `investida` | 0,9 s | 1 | Corre até a parede a 1400 px/s, fica tonta 1,4 s e volta trotando (provisório) |
| Mula | 3 | `meteoros` | 1 s cada | 2 cada | 3 meteoros, o 1º no Curupira e os outros a ±300 px, com sombra no chão; depois fica cansada 1,5 s |
| Cuca | 1 | `leque` | 0,5 s | 1 cada | 3 feitiços em leque (abertura 20°) saindo da garra, o do meio mirado no Curupira; 700 px/s |
| Cuca | 1 | `pocao` | 0,6 s | ver poças (7.6) | Poção em arco (600 px/s, gravidade 1800) até onde o Curupira estava; depois fica parada 1,5 s |
| Cuca | 2 | `bote` | 0,6 s | 1 | Bote de jacaré: avança a 1100 px/s até 200 px além do Curupira e volta a 420 px/s (provisório) |
| Cuca | 3 | `ninar` | 0,4 s | 1 cada | 2,4 s de notas pela boca em duas fileiras (56 e 256 px do chão) com uma brecha que sobe e desce (provisório) |
| Boto | 1 | `jato` | 0,7 s | 1 | Jato reto saindo do bico, dura 0,5 s; depois fica parado 1,2 s |
| Boto | 1 | `beijos` | 0,4 s | 1 cada | 4 corações em onda (280 px/s), um a cada 0,45 s; dá para estourar com tiro (provisório) |
| Boto | 2 | `chapeu` | 0,6 s | 1 | Chapéu bumerangue: vai baixo (0,9 s) até perto da parede e volta alto (0,9 s) (provisório) |
| Boto | 3 | `salto` | — | 1 cada bolha | Pula para o outro lado (1,4 s, arco de 520 px) soltando 3 bolhas que descem a 120 px/s |
| Máquina | 1 | `laser` | 0,8 s | 1 | Linha fina segue o Curupira e trava 0,2 s antes; laser dura 0,4 s |
| Máquina | 1 | `bombas` | animação `aviso_bombas` | 2 | 3 alçapões abrem no teto e soltam bombas (1 no Curupira, 2 a ±300 px), que explodem 1,5 s depois no chão (raio 180); parada 1,2 s |
| Máquina | 2 | `pistoes` | 0,5 s | 1 | Duas ondas de placas sobem do chão de um lado ao outro (960 px/s, a 2ª 1,25× mais rápida); cada placa avisa 0,25 s antes (provisório) |
| Máquina | 3 | `varredura` | 0,5 s | 1 | Desce até a altura do Curupira e dispara um laser reto na altura da cabeça (0,6 s; agachar desvia); depois mira o chão e o ponto de impacto corre até a parede (0,85 s; pular desvia) (provisório) |

### 8.4 Sequenciador de ataques **[Implementado]** **[Divergente]**

A v0.2 tinha um `enum Estado` com um valor por passo de cada ataque (`AVISO_BOLAS`, `BOLAS`, `PARADA`...) e um `_tempo` decrescente. Com 4 ataques e 3 animações por ataque, isso passaria de 20 estados por chefe. Agora:

- A base `Chefe` tem uma máquina de estados simples, `EstadoLuta { ESPERANDO, ATACANDO, DERROTADO }`, num laço (`_lutar()`): pausa → atualiza a fase → sorteia um ataque da fase → `await _executar(nome)` → pausa...
- **Cada ataque é uma função** no script do chefe, escrita de cima a baixo na ordem em que acontece:

  ```gdscript
  func _bolas() -> void:
      avisar(true)
      tocar(&"aviso_bolas")
      if not await esperar(_d.aviso_bolas):
          return
      avisar(false)
      for i in _d.quantidade_bolas:
          reiniciar(&"bolas")
          _lancar_bola()
          if not await esperar(_d.intervalo_bolas):
              return
      await tocar_e_esperar(&"fim_bolas")
  ```

- `esperar(s)` conta pelo **relógio do chefe**: a base emite o sinal `_passo(delta × fator_tempo())` no `_physics_process`, e `esperar` soma esses passos. Por isso a lentidão e a pausa do jogo valem para todos os ataques sem código extra. `esperar` devolve `false` se o chefe for derrotado no meio, e o ataque sai com `return`.
- Outras ajudas da base: `tocar`, `reiniciar`, `tocar_e_esperar(anim)`, `andar_ate(x, velocidade)`, `virar(para_direita)`, `lado_do_alvo()`, `pos_do_alvo()`, `x_do_alvo()`, `ponto(nome)` (ponto do desenho no mundo, 10.4), `lancar_na_cena(no)`.
- **Fases**: `_atualizar_fase()` compara a fração da vida com `vida_fase_2/3` e emite `fase_mudou`. O ataque novo da fase é usado logo no primeiro sorteio, para o jogador ver a novidade.
- **Sorteio**: aleatório entre os ataques da fase, **sem repetir o último**.
- **[Divergente]** O Boto não tem mais ciclo fixo: sorteia como os outros, e só troca de lado com o `salto` (fase 3).
- **Nó raiz**: `Node2D` para todos. Mula (investida) e Cuca (bote) andam com `andar_ate`, sem física, e param a `margem_parede` da parede. Nenhum chefe colide com o mundo.
- Projéteis e perigos do chefe vão para a **cena atual**, não para o chefe, para não andarem junto com ele.

### 8.5 Valores no código

Números de balanceamento ficam em `Resource` (`ChefeData` → `MulaData`, `CucaData`, `BotoData`, `MaquinaData`; `AtaqueData`; `EspecialData`; `MovimentoData`; `VidaJogadorData`), editáveis no inspetor. Ficam como `const` só valores visuais ou ligados ao desenho: cores de aviso, tempo de pisca, `QUADRO_PISADA` (em que quadro da animação a pata bate no chão), `DURACAO_POSE_ATAQUE` e `DURACAO_POSE_DANO` do Curupira. **[Aberto]** Mover as duas durações de pose para o `MovimentoData`.

### 8.6 Derrota do chefe **[Implementado]**

Ao zerar a vida: `EstadoLuta.DERROTADO` (o ataque em andamento sai no próximo `esperar`), desliga hurtbox e contato, remove tudo do grupo `ataques_chefe`, toca `derrota` e emite `chefe_derrotado`. **[Divergente]** O fade de 1 s saiu: agora existe a animação `derrota`.

A `TelaVitoria` (filha da arena) chama `GameState.marcar_concluida(dados.id_progresso)` (que salva), espera 1,5 s e pausa mostrando "Você libertou…" e os ataques ganhos. A Máquina leva aos créditos; os outros, à seleção. **Não é vitória se o Curupira já tinha sido derrotado.**

## 9. Arenas

Quatro arenas (`level1` Mula, `level2` Cuca, `level3` Boto, `level4` Máquina), só com chão e paredes, abertas em cima, câmera fixa. Cada `levelN.tscn` é independente:

```
LevelN (Node2D)                   # texture_filter = Nearest (pixel art)
├── Fundo (Node2D, FundoArena)    # monta Fundo (z −10) e Frente (z 5) a partir de assets/pixel/arenas/<chefe>/
├── Camera2D                      # fixa na origem; filha da arena, nunca do Curupira
├── Floor, LeftWall, RightWall    # StaticBody2D com WorldBoundaryShape2D, layer world
├── LimiteAreiaEsquerdo/Direito   # só no Boto: paredes nas beiras da areia, layer limite_arena
├── Curupira                      # instância
├── <Chefe>                       # instância, com alvo = Curupira
├── HUD                           # instância, com curupira
├── MenuPausa, TelaDerrota, TelaVitoria
```

**Coordenadas** (arena centrada em (0, 0), paredes em ±960):

| O quê | Posição |
|---|---|
| Chão | y = 340 (linha 220 da arte de 270 → 880 na tela) |
| Curupira (centro do corpo; pés em +96) | (−540, 244); na arena do Boto, (−320, 244) |
| Mula | (488, 340) |
| Cuca | (528, 340) |
| Boto (linha d'água em 364) | (800, 364); marcadores `LadoEsquerdo` (−856, 364) e `LadoDireito` (800, 364) |
| Beiras da areia do Boto (paredes `LimiteAreia*`) | x = −616 e x = 520 (colunas 86 e 370 da arte, `AREIA_BOTO` no gerador) |
| Máquina (ponto de fixação no teto) | (648, −484) |

- **[Divergente]** O `Fundo`/`SalaBranca`/`TileMapLayer` antigos saíram. `FundoArena` lê `fundo_1.png...` e `frente_1.png...` da pasta e anima no `fps` do `arena.json` (o `fps` exportado no node só vale se o json não tiver); trocar a arte é só exportar de novo a pasta.
- **Arte das arenas** (`arenas_px.js`): fundo em planos (céu, mata ao longe, árvores do meio, troncos das bordas, chão). Quanto mais longe, mais perto da cor do céu e com menos contraste, com neblina pontilhada entre os planos. O meio da arena fica escuro e liso para o Curupira e o chefe se destacarem. O fogo do fundo da Mula é pequeno, sem contorno e numa rampa apagada (`RAMPA_FOGO_LONGE`), atrás da fumaça, para não competir com o fogo dela. A floresta da Cuca é azulada de noite, para a Cuca verde e roxa saltar. O laço tem 2 s: tudo que mexe no fundo repete a cada 2 s (`volta(t)`).
- A frente do Boto (água) fica por cima dos personagens.
- **[Assumido]** Extrair uma `arena_base.tscn` só se as quatro começarem a divergir; hoje a duplicação é de poucos nós.

## 10. Arte e animações (pixel art)

### 10.1 Pipeline **[Implementado]**

A arte é pixel art em 480×270, ampliada 4× para 1920×1080. Ela é desenhada por um gerador em JavaScript (`art/pixel/gerador/`), que monta cada personagem pixel a pixel a partir de peças e poses e exporta as folhas para `game/assets/pixel/`:

1. `exportar.html` roda num Chrome sem janela e escreve todas as folhas em JSON:
   `google-chrome --headless=new --allow-file-access-from-files --virtual-time-budget=200000 --dump-dom file://$PWD/art/pixel/gerador/exportar.html > /tmp/dom.html`
2. `python3 art/pixel/gerador/exportar.py /tmp/dom.html game/assets/pixel` grava os PNGs e os `.json`.
3. Com o editor fechado: `godot --path game --headless --editor --quit` importa os PNGs, e `godot --path game --headless --script $PWD/art/pixel/gerar_spriteframes.gd` gera um `<nome>_frames.tres` para cada personagem.

`index.html` (na mesma pasta) mostra todas as animações e uma arena jogável para testar os ataques. O gerador é determinístico: exportar de novo sem mudar o desenho dá os mesmos arquivos.

### 10.2 Arquivos

- `game/assets/pixel/<personagem>/<personagem>.png`: folha do personagem, uma linha por animação, todas as células do mesmo tamanho.
- `<personagem>.json`: `celula` (largura e altura da célula), `ancora` (pixel da célula que fica na posição do node: os pés, a linha d'água ou o ponto do teto) e, por animação, `fps`, `loop`, `quadros`, `pontos` e `caixa` (o retângulo que os quadros da animação ocupam, relativo à âncora, `[x0, y0, x1, y1]`).
- `pontos` são por quadro e relativos à âncora, em pixels da arte: `mao` (Curupira), `boca` e `frente` (Mula), `boca` e `garra` (Cuca), `bico` e `nadadeira` (Boto), `lente` (Máquina).
- `<personagem>_frames.tres`: `SpriteFrames` gerado da folha, com os mesmos nomes de animação do JSON.
- `<personagem>/efeitos/<efeito>_<n>.png`: projéteis e efeitos em quadros soltos, descritos em `efeitos/efeitos.json` (fps, loop, tamanho, centro).
- `arenas/<chefe>/fundo_<n>.png` e `frente_<n>.png`: 16 quadros de 480×270, num laço de 2 s (8 fps, no `arena.json`). `arenas/menu/` é a floresta do fundo dos menus (8 quadros a 4 fps).
- `ui/fonte_pixel.fnt` + `.png`: fonte BMFont (11 linhas: acento, maiúscula de 7 e descendente), com o contorno escuro já desenhado. `ui/titulo.png` e `ui/botao_<estado>.png` (normal, foco, hover, apertado, desabilitado, painel) já vêm ampliados 4×, para o `StyleBoxTexture` usar no tamanho da tela.

### 10.3 Importação e filtro

- Importação padrão do Godot (`compress/mode = Lossless`, sem mipmaps).
- Todo node que mostra pixel art usa `texture_filter = Nearest` e `scale = (4, 4)`. Nas arenas isso vem da raiz do nível; cenas que podem ser abertas sozinhas (projéteis, efeitos, chefes) também definem no próprio node.
- O filtro padrão do projeto (`rendering/textures/canvas_textures/default_texture_filter`) continua `Linear` por causa das folhas do dash (`assets/efeitos/folha.png`), a última arte antiga em uso. Os menus põem `Nearest` na raiz de cada tela (ou no `Painel`, nas telas que são `CanvasLayer`).
- As coordenadas do jogo continuam em 1920×1080: velocidades, pulo, dash e posições do GDD não mudam.
- **Export**: o `.json` não é recurso do Godot. Incluir `*.json` no filtro "arquivos não-recurso" do preset de export, senão os pontos e a âncora somem no build.

### 10.4 `FolhaSprites` **[Implementado]**

`folha_sprites.gd` (`class_name FolhaSprites`, só funções estáticas) lê o `.json` que fica ao lado do `SpriteFrames` (`<nome>_frames.tres` → `<nome>.json`), com cache:

- `preparar(sprite)`: liga `Nearest` e põe a âncora na origem do node (`centered = true`, `offset = celula/2 − ancora`). A base `Chefe` chama no `_ready`.
- `ponto(sprite, nome, padrao)`: posição no mundo do ponto `nome` no quadro que está na tela, já com escala e espelhamento. É assim que o tiro sai da mão do Curupira, a bola sai da boca da Mula, o feitiço da garra da Cuca e o jato do bico do Boto, em qualquer quadro.
- `duracao(sprite, anim)`: duração da animação em segundos.
- `caixa(sprite, anim)`: a `caixa` da animação, em pixels da arte. A base `Chefe` usa para que `Hurtbox` e `Contato` acompanhem a pose: a cada troca de animação (e ao virar), as duas viram retângulos com uma fração do desenho (`fracao_hurtbox`, centrada; `fracao_contato`, presa embaixo, nos pés), definidas no `ChefeData`. A Máquina fica de fora: as caixas dela estão no `Nucleo`, que segue a lente.

Regras:
- **Virar o personagem**: `scale.x = −4` no node do sprite, não `flip_h`. O `flip_h` espelha em volta do centro da textura e a âncora sairia do lugar.
- **Âncoras atuais**:

  | Personagem | Célula | Âncora | `offset` |
  | --- | --- | --- | --- |
  | Curupira | 52×68 | (24, 64) | (2, −30) |
  | Mula | 170×162 | (100, 153) | (−15, −72) |
  | Cuca | 150×124 | (79, 113) | (−4, −51) |
  | Boto | 140×144 | (73, 99) | (−3, −27) |
  | Máquina | 126×214 | (57, 6) | (6, 101) |

  Se o gerador mudar uma célula, o JSON diz o novo valor e o código não muda.

### 10.5 Ataques modulares **[Implementado]**

Princípio: **a arte desenha uma unidade; o código decide quantas, para onde e quando.**

- Cada ataque de chefe tem três animações no personagem: `aviso_<ataque>` (sem loop), `<ataque>` (a ação) e `fim_<ataque>`. Quanto tempo cada uma fica na tela vem do `.tres`, não do desenho.
- Projéteis e perigos são **cenas próprias com uma imagem só**: um feitiço, uma bola de fogo, uma nota, um coração, uma placa. O ataque cria quantos o `.tres` pedir. Exemplo: o leque da Cuca é uma cena `feitico_cuca.tscn` criada `quantidade_feiticos` vezes, com a `abertura_feitico` dividida entre elas. Para mudar para 5 feitiços ou outra abertura, muda-se o `.tres`, não a arte.
- Efeitos soltos (explosão, poeira, vidro quebrando, respingo, faíscas, alçapão) são `AnimacaoQuadros` sem loop, com `apagar_ao_terminar`.
- `AnimacaoQuadros` (`Sprite2D`): lista de quadros e fps; com `loop`, começa num quadro sorteado (várias bolas juntas não piscam iguais); sem loop, emite `terminou` e pode se apagar (ou apagar o pai). Também tem `trocar_quadros()` (tiro por direção) e `mostrar_progresso(fração)` (sombra do meteoro crescendo).

Cenas de ataque dos chefes:

| Chefe | Cenas |
|---|---|
| Mula | `bola_de_fogo_mula`, `onda_fogo_mula`, `meteoro`, `explosao_mula`, `poeira_mula` |
| Cuca | `feitico_cuca`, `pocao_cuca`, `poca_cuca`, `nota_cuca`, `vidro_cuca` |
| Boto | `jato_boto` (meio repetido em `region` + ponta), `coracao_boto`, `coracao_estoura_boto`, `chapeu_boto`, `bolha_boto`, `respingo_boto` |
| Máquina | `laser_maquina`, `bomba_maquina`, `explosao_maquina`, `placa_maquina`, `alcapao_maquina`, `faiscas_maquina` |
| Curupira (ataques ganhos) | `projetil_feitico_perseguidor`, `projetil_bolha_agua`, `projetil_bolha_abissal`, `projetil_pocao_maldita`, `feixe_canhao`, `respingo_agua`, `respingo_veneno`; a Bola de Fogo usa a bola e a explosão da Mula |

**[Divergente]** `succao_boto` (aviso antigo do jato) saiu: o aviso agora é a animação `aviso_jato` do Boto.

## 11. Interface

### 11.1 HUD **[Implementado]**
Canto inferior esquerdo: vida do Curupira (4) e barra do especial (`hud_vida.gd`, `hud_especial.gd`, via sinais). Sem barra de vida do chefe. Arte antiga (não pixel).

### 11.2 Telas

| Tela | Estado |
|---|---|
| Cenas de abertura | **Não feito [Aberto]** |
| Menu inicial | Pronto: Novo Jogo (apaga o save), Continuar (desabilitado sem save), Opções, Sair. **[Aberto]** o GDD pede os botões de cada ação do controle na tela |
| Seleção de fase e ataques | Pronto: lista só ataques liberados, troca com ←/→, salva a escolha; Máquina bloqueada até as 3 fases |
| Arena (×4) | Pronto (seção 9) |
| Pausa | Pronto: Continuar / Tentar de novo / Seleção |
| Opções | **Só placeholder** ("Volume e tela cheia chegam em breve") |
| Derrota | Pronto: Tentar de novo / Seleção (aparece 1 s depois do último golpe) |
| Vitória | Pronto |
| Créditos | Pronto (tela + voltar ao menu); **[Aberto]** conteúdo real dos créditos |

### 11.3 Navegação de menus **[Implementado]**
Menus são `Control`/`CanvasLayer` com tema compartilhado (`dados/tema_menus.tres`) e fundo (`fundo_menu.tscn`: `FundoArena` com a floresta de `arenas/menu` e brasas de 4 px). O tema usa a fonte em pixel e `StyleBoxTexture` em 9 fatias (margem de 12 px = 3 px da arte). A fonte tem 12 px de altura de linha e é importada com `scaling_mode = Integer Only`: os tamanhos de fonte das telas são múltiplos de 12 (24, 36, 48, 60, 72), senão os pixels saem desiguais. O contorno vem desenhado na fonte, então `outline_size = 0`. O menu inicial mostra o Curupira da folha (`idle`) em pé no chão da floresta. Usam `ui_*`, nunca as ações de jogo (exceto `pause` na luta). O primeiro botão recebe `grab_focus()` ao abrir. `ui_accept` e `ui_cancel` foram redefinidos no projeto (Enter/Espaço/A e Esc/B).

## 12. Input Map

| Ação | Controle (Xbox) | Teclado |
|---|---|---|
| `move_left` / `move_right` | Direcional e analógico esquerdo | A / D |
| `aim_up` | Direcional ↑ e analógico ↑ | W / ↑ |
| `crouch` | Direcional ↓ e analógico ↓ | S / ↓ |
| `aim_lock` | — (sem botão) | Shift |
| `jump` | A | Espaço |
| `attack_basic` | X | J |
| `attack_special` | Y | K |
| `dash` | B | L |
| `pause` | Start | Esc |

- `aim_up` e `crouch` também servem para mirar no ar (6.3).
- Trava de mira só no Shift, decisão do Eduardo. **[Aberto]** No controle a trava ficou sem botão (era RB); falta escolher um (GDD Q15).
- O analógico usa deadzone 0,5 nas ações de movimento e mira.

## 13. Áudio — **[Aberto, não iniciado]**

Nada implementado: não há barramentos configurados, `AudioStreamPlayer`, nem arquivos de áudio.

Proposta **[Assumido]**:
- Barramentos: `Master`, `Music`, `SFX`.
- Uma música por cena (menu, seleção, cada arena); troca ao entrar na cena.
- Efeitos via `AudioStreamPlayer` / `AudioStreamPlayer2D`. As rotinas de ataque dos chefes (8.4) são o lugar natural para tocar o som de cada passo.
- Volume: **dois sliders (música e efeitos)** + Master fixo em 0 dB; o valor é salvo nas opções.
- Lista de faixas e efeitos (Q14): **[Aberto]**.

## 14. Save e opções

### 14.1 Save de progresso **[Implementado]**

Um único `ConfigFile` em `user://save.cfg`:

```
[progresso]  concluidas = ["fase1", "fase2", ...]
[equipamento] basico = "res://dados/ataques/....tres"   # "" = padrão
              especial = "res://dados/ataques/....tres"
```

- Carregar ao abrir o jogo (`GameState._ready`) e no Continuar; salvar a cada fase concluída e a cada mudança de equipamento.
- Novo Jogo apaga o arquivo e zera a memória.
- Equipamento guarda **caminhos** de `.tres`: renomear ou mover um `.tres` de ataque quebra saves existentes. **[Aberto]** Guardar um id (`tiro_de_folha`) em vez do caminho, ou tratar o `load` nulo (hoje não há).
- Sem versão de formato no arquivo. **[Aberto]** Adicionar `versao` antes do lançamento.

### 14.2 Opções **[Aberto, não iniciado]**
Volume e tela cheia/janela ainda não existem. **[Assumido]** Guardar em seção `[opcoes]` do mesmo `save.cfg` e aplicar no `_ready` do `GameState`, preservando essa seção em `apagar_save()` para o Novo Jogo não apagar as opções.

## 15. Build, versionamento e qualidade

### 15.1 Git
- Git LFS para `*.png`, `*.kra` e `*.mp4` **[Implementado]**; `*.ogg` e `*.wav` **[Aberto]** adicionar quando entrar áudio.
- `.gitignore` ignora `game/.godot/`, `game/build/`, `*.pck`, `*.exe`. Mantém `.import` versionados.
- `export_presets.cfg` não existe ainda. **[Aberto]** Versionar (sem segredos) para o build ser reproduzível pelos dois.
- `.tscn`, `.tres` e `.import` como `binary`: conflito de merge se resolve escolhendo uma versão inteira. A dupla não trabalha em paralelo (`CLAUDE.md`).
- As cenas novas de projéteis e efeitos usam `ext_resource` só com `path` (sem `uid`); o Godot completa o `uid` na primeira vez que salvar a cena.

### 15.2 Export — **[Aberto, não iniciado]**
Presets para Linux (x86_64) e Windows Desktop, com `*.json` no filtro de arquivos não-recurso (10.3). Steam (GodotSteam ou similar): fora deste TDD.

### 15.3 Testes
Sem testes unitários. Teste manual e um teste de fumaça headless:
- F6 roda qualquer arena isolada.
- Cenas de teste em `game/testes/`: `teste_dano`, `teste_tiro`, `alvo_teste`.
- `Debug > Visible Collision Shapes` para conferir hitboxes; aba Remote para valores em execução.
- Validação headless: `godot --headless --path game --quit-after 120`. Depois de criar scripts com `class_name` ou PNGs novos, importar antes (`--headless --editor --quit`).
- **Liberar tudo para testar**: `GameState.LIBERAR_TUDO_PARA_TESTE = true` libera a Máquina e todos os ataques na seleção, sem vencer as fases. Só vale em build de debug (`OS.is_debug_build()`); o jogo exportado ignora. Pôr `false` para testar a progressão de verdade.
- **`testes/teste_lutas.gd`** **[Implementado]**: roda as quatro arenas por 60 s cada, com o Curupira invencível, andando, agachando, mirando e atirando, e tira vida do chefe aos poucos. Imprime as trocas de fase e os ataques que apareceram; qualquer erro de script aparece no log. Rodar com o editor fechado (ou numa cópia de `game/`):
  `godot --headless --path game --script res://testes/teste_lutas.gd`
- **Cheats de debug (`OS.is_debug_build()`): não implementados [Aberto]**: invencibilidade, carga total do especial, pular para a fase 2/3 do chefe, desbloquear todos os ataques. Sugestão: autoload `Debug` removível do build.

### 15.4 Créditos
`CREDITS.md` com fonte, autor e licença de cada asset: **não existe [Aberto]**. Há placeholders antigos em `art/antiga/placeholder/` (fora do jogo) cuja origem e licença precisam ser registradas.

## 16. Ordem de implementação

1. ~~Projeto base~~ (exceto presets de export)
2. ~~Curupira: movimento, pulo, gravidade, flip~~
3. ~~Arena base, câmera fixa~~
4. ~~Hitbox/Hurtbox, camadas, vida, invencibilidade, dash~~
5. ~~Ataque básico e projétil~~
6. ~~Chefe base + Mula~~
7. ~~Carga e disparo do especial~~
8. ~~Veneno e lentidão~~
9. ~~`GameState`, seleção, fluxo de telas, save~~
10. ~~Cuca, Boto, Máquina (lógica)~~
11. ~~Pixel art: personagens, efeitos, arenas; 3 fases × 4 ataques; mira em 8 direções; agachar~~
12. **Agora**: teste manual de cada luta e balanceamento dos valores provisórios.
13. **Restante**: HUD em pixel, áudio, Opções, abertura, conteúdo dos créditos, cheats de debug, `CREDITS.md`, `main_scene` = menu, export Linux/Windows.

## 17. Pendências

| Item | Impacto | Sugestão |
|---|---|---|
| Teste manual das 4 lutas | Nada da pixel art foi visto rodando no Godot | Rodar cada `levelN` com F6 (ver `PENDENCIAS.md`) |
| Valores "provisório" dos ataques novos | Combate pode estar fácil ou difícil demais | Fechar no GDD (Q16) depois de testar |
| Limiares das fases (0,667 / 0,333) | Ritmo da luta | Fechar no GDD (Q16) |
| Trava de mira sem botão no controle | Controle | Escolher o botão (GDD Q15) |
| Coração do Boto carrega o especial | Pode ser exploit | Decidir; se não, tirar a hurtbox do coração do sinal de acerto |
| HUD e folhas do dash com a arte antiga | Mistura de estilos | Gerar no `art/pixel/gerador` |
| `CLAUDE.md` diz "chefes com estado único" | Instrução desatualizada | Atualizar o resumo de regras do `CLAUDE.md` |
| Opções (volume, tela cheia) | Requisito do GDD | 2 sliders + toggle; salvar no `GameState` (14.2) |
| Áudio (barramentos, faixas, SFX) | Requisito do GDD | Criar buses; lista de assets (Q14) |
| Tela cheia por padrão | GDD pede; hoje `mode = 2` | Trocar para `mode = 3` |
| `run/main_scene` | Hoje abre `main.tscn` → level1 | Apontar para `main_menu.tscn` |
| Cenas de abertura | Requisito do GDD | Decidir se entra no MVP |
| Cheats de debug | 15.3 | Autoload `Debug` só em `is_debug_build()` |
| Export Linux/Windows | Entrega | `export_presets.cfg` com `*.json`; testar nos dois |
| `CREDITS.md` | Licenças dos assets | Criar agora |
| Save guarda caminho de `.tres` sem fallback | Save quebra se mover arquivos | Guardar id ou tratar `load` nulo; adicionar versão |
| Dano de contato (1 golpe) | Provisório | Confirmar no GDD |
| Nomes `Floor/LeftWall/RightWall` vs GDD | Consistência | Renomear ou atualizar o GDD |
| Arte antiga sem uso em `game/assets/` | Peso do repositório | Apagar o que nenhuma cena usa mais |

## 18. Fora do MVP

Ideias do GDD ainda não adotadas: hitstop, tremor de câmera e squash and stretch; exportação para Web.

Já implementados (saíram da lista): coyote time, jump buffer, pulo de altura variável, valores em `Resource`, partículas no dash (`EfeitoDash`).

## 19. Decisões registradas (para o Arthur vetar)

Escolhas que o código já fez e que este TDD trata como oficiais. Se alguma não for desejada, ela vira tarefa.

1. **Estrutura plana** em `scenes/`, `scripts/`, `dados/` (em vez de subpastas por tipo).
2. **Português** em todo o código e nós, com `take_damage`, `Hitbox`, `Hurtbox` como exceção em inglês.
3. **Nomes de ação do Input Map**: `attack_basic`, `attack_special`, `aim_up`, `crouch`, `aim_lock`.
4. **`Resource` (`.tres`) para todos os números de combate**, não `const` (8.5).
5. **Sem `SceneManager` nem `StatusEffects`**: troca de cena direta; veneno e lentidão tratados em `Chefe` e `Curupira` (5.1, 7.6).
6. **Sem script de arena**: fluxo de vitória/derrota nas telas `TelaVitoria` e `TelaDerrota` (8.6).
7. **Progresso por ids de fase** (`fase1..3`, `boss`) e ataques liberados derivados deles (5.2).
8. **Chefes são `Node2D`**, sem colisão com o mundo; os que andam usam `andar_ate` com margem da parede (8.4).
9. **Telas de pausa/derrota/vitória com `PROCESS_MODE_ALWAYS`** (5.3).
10. **Save em `ConfigFile`** (`save.cfg`), com progresso e equipamento (14.1).
11. **Dash não é possível durante o Canhão Flamejante** (6.7); **Poção Maldita do jogador é reta** (7.5).
12. **Câmera na origem (0, 0)**, arena centrada nela, `stretch aspect = expand` (3, 9).
13. **Pixel art gerada por código**, com `SpriteFrames` gerado da folha (10.1). Exceção à regra do `CLAUDE.md` de que o `SpriteFrames` é do Arthur: ele não é editado à mão, e sim gerado de novo.
14. **Pontos do desenho num `.json`** lido por `FolhaSprites`, em vez de `Marker2D` posicionados à mão (10.4): o ponto acompanha cada quadro de cada animação.
15. **Virar por `scale.x`**, não `flip_h` (10.4).
16. **Sequenciador com `await`** no lugar de um `enum` com um estado por passo de ataque (8.4). A máquina de estados continua existindo (`EstadoLuta`), só que no nível da luta.
17. **Três fases por vida restante**, com a lista de ataques de cada fase no `.tres` (8.2).
18. **Uma imagem por projétil**; quantidade, ângulo e ritmo no `.tres` (10.5).
