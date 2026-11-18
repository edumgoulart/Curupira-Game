# Curupira: O Protetor da Floresta — TDD

Documento de Design Técnico · v1.0 · Godot 4.7.1 · GDScript

Este documento descreve **como** o jogo é construído. O **o quê** (regras, números, arte, história) está no GDD, que é a fonte de verdade para todos os valores.

**Legenda**
- Sem marcação: vem do GDD.
- **[Implementado]**: já existe no código; este documento reflete o que o projeto faz.
- **[Assumido]**: padrão escolhido neste TDD; pode ser vetado.
- **[Divergente]**: o código faz diferente do que uma versão anterior do TDD previa; vale a decisão do código (ver seção 19).
- **[Aberto]**: ainda precisa ser decidido ou confirmado.
- **[Planejado]**: decidido, com o desenho técnico pronto neste documento, mas ainda não feito no jogo.

---

## 1. Status

Revisão v1.0 feita sobre a pasta `game/` (branch `main`), depois do mapa do mundo.

| Área | Estado |
|---|---|
| Curupira (movimento, coyote, jump buffer, pulo variável, dash, vida, invencibilidade) | Pronto |
| Curupira: mira em 8 direções, agachar, poses de tiro por direção | Pronto (falta teste manual) |
| Ataques básicos (4) e especiais (4), carga do especial | Pronto, todos em pixel art (a Bola de Fogo só tem o desenho de lado) |
| Chefes: Mula, Cuca, Boto, Máquina, 4 ataques, fases por dificuldade, combos e transição | Pronto (falta teste manual e balanceamento) |
| Arte em pixel: Curupira, 4 chefes, efeitos dos chefes, 4 arenas | Pronta, ligada nas cenas |
| Efeitos de estado (veneno, lentidão) no chefe e no Curupira | Pronto, sem componente `StatusEffects` (ver 7.6) |
| Arenas (4), HUD, pausa, derrota, vitória, créditos | Pronto |
| Menu inicial, mapa do mundo e painel de cada fase (ataques e dificuldade) | Pronto, em pixel art (falta mostrar os botões do controle no menu) |
| Save de progresso e equipamento | Pronto (formato `ConfigFile`, ver 14) |
| **Opções (volume, tela cheia)** | **Planejado** (14.2); hoje a tela é só um aviso "em breve" |
| **Áudio (barramentos, músicas, SFX)** | **Planejado** (13) |
| **Cenas de abertura** | **Planejado** (11.2) |
| **Cheats de debug** | **Planejado** (15.3) |
| **Export (Linux/Windows), `CREDITS.md`** | **Planejado** (15.2, 15.4) |

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
| Tela | `window/size/mode = 3` (tela cheia) **[Implementado]**, como pede o GDD. A troca para janela fica nas Opções (14.2) |
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
- Código (variáveis, funções, sinais, constantes, `class_name`) e nós **em português**, como no `CLAUDE.md`. Exceções em inglês: `take_damage`, `Hitbox` e `Hurtbox`.
- Constantes em `MAIÚSCULAS_COM_UNDERLINE`.
- Cada script documenta no topo as animações que espera no `SpriteFrames`.
- `Hitbox` e `Hurtbox` são **scripts com `class_name`** aplicados nos `Area2D` de cada cena, sem cena própria.

## 5. Arquitetura geral

### 5.1 Fluxo de cenas

```
Menu inicial ⇄ Opções
     ↓ (Novo Jogo apaga o save; Continuar só habilita se houver save)
Mapa do mundo (mapa) ⇄ Pausa do mapa (→ Menu inicial)
     ↓ (anda até a área do chefe, A abre o painel: ataques e dificuldade, "Lutar!")
Arena (level1..4) ⇄ Pausa
   ↙              ↘
Derrota          Vitória
(tentar de novo   ↓
 ou Mapa)        Mapa (na frente da área de onde saiu)
Máquina derrotada → Créditos (direto) → Menu inicial
```

- **Cena principal**: `main_menu.tscn` **[Implementado]**. O `main.tscn` é uma cena de teste que abre o `level1`.
- **Abertura** **[Planejado]**: entra no MVP, como quatro imagens com texto (11.2). Novo Jogo → Abertura → Mapa; Continuar vai direto ao mapa.
- `Pausa → Opções`: **[Planejado]** (14.2). A pausa tem hoje Continuar / Tentar de novo / Voltar para o mapa. O `level_select` antigo foi apagado.
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
- **Opções (volume, tela cheia) ainda não estão no `GameState`** **[Planejado]** (14.2).

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
- **Retorno do golpe** (só visual): o sprite pisca de branco por 0,15 s (`clarao.gdshader`, via `EfeitosTela.preparar_pisca`), a câmera treme 9 px por 0,25 s (`EfeitosTela.tremer`) e a pose `dano` (5 quadros, 0,33 s) recomeça do primeiro quadro. A duração da pose vem da animação; `DURACAO_POSE_DANO` só vale se ela não existir.
- Ao zerar a vida: estado `DERROTADO`, emite `derrotado`; `TelaDerrota` espera 1 s e pausa.
- Sem cura. Tentar de novo = `reload_current_scene()` (vida e barra voltam cheias).
- Religar o `monitorable` de uma `Area2D` **não** re-dispara quem já estava encostado; religar a forma de colisão dispara. Por isso a `Hurtbox` desliga as formas.

### 6.6 Animações **[Implementado]**

Lista completa no topo de `curupira.gd`. Qual animação toca é decidido pela ordem:

1. `derrota`, `especial`, `dash` (estados que só saem pelo tempo);
2. `dano` pela duração da animação (0,33 s) depois de um golpe (`DURACAO_POSE_DANO`, 0,2 s, se ela não existir);
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
- Estourar um coração do Boto **não** carrega a barra **[Implementado]** (decisão do GDD 1.0). A hurtbox do coração está na layer `enemy` para os tiros enxergarem ela, então o filtro é por flag: `Hurtbox.carrega_especial` (padrão `true`) fica `false` no coração, e o `Atirador` só emite `acerto_basico` se o alvo carrega o especial.
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
| Encanto | Não existe | `_ao_receber_efeito(&"encanto", intensidade, duracao)`: guarda `_tempo_encanto` e `_puxao_encanto`. Enquanto dura, `velocity.x = puxão × fator_lentidao()` e ele olha para o lado do puxão; não anda, não abaixa e não dá dash. Pulo e tiro valem. Chegando durante um dash, é ignorado (dash dá invencibilidade). `EfeitoEncanto` (`efeito_encanto.gd`, criado no `_ready`) tinge o Curupira de rosa e solta coraçõezinhos subindo |

O encanto vem do coração do Boto (`coracao_boto.gd`, `_ao_acertar`): ele chama `aplicar_efeito(&"encanto", lado × forca_encanto, duracao_encanto)` na hurtbox que tocou, sem saber de quem é. O sinal da intensidade dá o lado do puxão (para onde o Boto estava quando soltou o coração, `x_origem`). Assim o coração continua sendo só uma hitbox, e quem decide o que o encanto faz é o Curupira.

**[Aberto]** Extrair um `StatusEffects` só compensa se aparecer um terceiro tipo de alvo. O encanto é um efeito novo, mas só existe no Curupira.

Poças da Cuca (`PocaCuca`, `Area2D`, layer `enemy_hitbox`, mask `player`) **[Implementado]**:
- Duram 5 s; no máximo 2 na arena (ao criar a 3ª, a mais antiga some).
- Tipo sorteado 50/50 (veneno ou lentidão), com desenho próprio para cada um.
- Veneno: 1 golpe se o Curupira ficar **1 s seguido** dentro; o contador zera ao sair, e o dash também zera.
- Lentidão: velocidade ×0,6 enquanto dentro.

## 8. Chefes

### 8.1 Regras globais

1. Pode levar dano o tempo todo.
2. Todo ataque tem aviso: uma animação de aviso (`aviso_<ataque>`) e um brilho colorido no sprite (`avisar()`: laranja Mula, verde Cuca, azul Boto, vermelho Máquina). O jogador lê o ataque pela pose.
   - **Não há marca na tela cobrindo a área do golpe.** Uma versão teve (faixas listradas, alvos no chão, miras), e o Eduardo pediu para tirar: deixava fácil demais.
   - Ficam só os avisos do que vem de fora da vista ou é mirado:
     - o brilho no céu de cada meteoro (`meteoro.gd`);
     - a linha fina do laser e da varredura (`laser_maquina.gd`).
     O jato e o chapéu do Boto não têm linha: o próprio Boto mostra a altura, afundando ou subindo até o bico (jato) ou a nadadeira com o chapéu (chapéu) ficar nela.
     Todas ficam no grupo `ataques_chefe` e somem na transição e na derrota.
3. Os ataques mais fortes terminam com o chefe parado, cansado ou tonto (janela de ataque).
4. **[Divergente]** As fases dependem da dificuldade (GDD, Escolha antes da fase): Normal = 1 fase (Máquina: 2); Expert = 2 fases (Máquina: 3). A v0.2 e o `CLAUDE.md` ainda falam em "estado único".
5. Os ataques saem embaralhados, às vezes em combo (8.4). Mula e Cuca ficam do lado em que pararam e os ataques espelham.

A vida do chefe aparece numa barra no alto da tela (`hud_chefe.gd`, 11.1). Cada acerto faz o chefe piscar de branco (`clarao.gdshader`, força 0,85 por 0,1 s), solta uma faísca no ponto do tiro (`efeito_acerto.tscn`, no máximo uma a cada 0,05 s), dá um tranco de 4 px para longe do Curupira e, se ele estiver parado entre ataques, toca o susto `dano` (no máximo a cada 0,8 s). As caixas de dano não tremem junto: `_ajustar_caixas` usa a posição de base do sprite.

### 8.2 Dados **[Implementado]**

`ChefeData` (base) tem nome, vida, pausa entre ataques, golpes de contato, `id_progresso` e os grupos **Fases** e **Transição de fase**:

| Campo | Valor | Para quê |
|---|---|---|
| `fases_normal` / `fases_expert` | `Array[FaseChefe]` | Fases de cada dificuldade. Expert vazio = usa as do Normal |
| `duracao_transicao` | 1,2 s | Duração mínima da transição; vale a animação `transicao` (2 s) se for mais longa |
| `pausa_apos_transicao` | 0,5 s | Respiro antes do primeiro combo da fase nova |

Cada `FaseChefe` (`scripts/fase_chefe.gd`, sub-recurso no `.tres` do chefe):

| Campo | Para quê |
|---|---|
| `comeca_com_vida` | Fração da vida em que a fase começa (1,0 = começo da luta; 0,5 = metade) |
| `ataques` | Ataques do saco desta fase |
| `combos` | `Array[ComboChefe]`: `primeiro`, `segundo` e `atraso` (s entre os dois) |
| `chance_combo` | Chance de a próxima jogada ser um combo |
| `fator_pausa` | Multiplica `pausa_entre_ataques` nesta fase (0,8 = 20% mais curta) |

Tudo isso se edita no inspetor: abrir o `.tres` do chefe, expandir a fase e o combo. Os valores atuais (versão 1.0, GDD Q16 resolvida):

| Chefe | Dificuldade | Fase (vida) | Ataques | Chance | Pausa | Combos (atraso) |
|---|---|---|---|---|---|---|
| Mula | Normal | 1 (1,0) | 4 | 0,2 | ×1 | meteoros+bolas (0,6), investida+pisoteio (0,6) |
| Mula | Expert | 1 (1,0) | bolas, pisoteio, investida | 0,3 | ×0,9 | investida+pisoteio (0,4), bolas+investida (0,5) |
| Mula | Expert | 2 (0,5) | 4 | 0,5 | ×0,8 | meteoros+bolas (0,3), meteoros+pisoteio (0,3), investida+bolas (0,3), investida+meteoros (0,2) |
| Cuca | Normal | 1 (1,0) | 4 | 0,2 | ×1 | pocao+leque (0,6), bote+leque (0,6) |
| Cuca | Expert | 1 (1,0) | leque, pocao, bote | 0,3 | ×0,9 | pocao+leque (0,4), bote+leque (0,4) |
| Cuca | Expert | 2 (0,5) | 4 | 0,5 | ×0,8 | pocao+ninar (0,3), bote+leque (0,4), pocao+bote (0,4) |
| Boto | Normal | 1 (1,0) | 4 | 0,2 | ×1 | beijos+jato (0,6), salto+jato (0,6) |
| Boto | Expert | 1 (1,0) | jato, beijos, chapeu | 0,3 | ×0,9 | beijos+jato (0,4), jato+beijos (0,3) |
| Boto | Expert | 2 (0,5) | 4 | 0,5 | ×0,8 | salto+jato (0,3), salto+beijos (0,3), beijos+chapeu (0,4), beijos+jato (0,3) |
| Máquina | Normal | 1 (1,0) | laser, bombas, pistoes | 0,2 | ×1 | bombas+laser (0,6) |
| Máquina | Normal | 2 (0,5) | 4 | 0,35 | ×0,9 | bombas+laser (0,5), pistoes+laser (0,5), pistoes+varredura (0,5) |
| Máquina | Expert | 1 (1,0) | laser, bombas | 0,3 | ×0,9 | bombas+laser (0,4) |
| Máquina | Expert | 2 (0,667) | + pistoes | 0,45 | ×0,85 | bombas+laser (0,3), pistoes+laser (0,3), bombas+pistoes (0,5) |
| Máquina | Expert | 3 (0,333) | 4 | 0,6 | ×0,8 | bombas+laser (0,25), pistoes+laser (0,25), pistoes+varredura (0,3), bombas+varredura (0,4) |

Todos os combos passaram no `verificar_desvio.gd` (15.3). O bote+leque do Expert fase 2 subiu de 0,3 para 0,4 s: com 0,3 s, o Curupira encurralado no canto não escapava.

| Chefe | Vida | Pausa entre ataques | Concede | `id_progresso` |
|---|---|---|---|---|
| Mula sem Cabeça | 1200 | 1,2 s | Bola de Fogo + Canhão Flamejante | `fase1` |
| Cuca | 1600 | 1,6 s | Feitiço Perseguidor + Poção Maldita | `fase2` |
| Boto cor-de-rosa | 2000 | 2 s | Bolha d'Água + Bolha Abissal | `fase3` |
| Máquina controlada por IA | 2400 | 1,2 s | Nada (chefe final) | `boss` |

Cada chefe tem a própria classe de dados (`MulaData`, `CucaData`, `BotoData`, `MaquinaData`), com um `@export_group` por ataque e a cena de cada projétil. Contato com o corpo do chefe (`Contato`) tira 1 golpe (`golpes_contato`), como fixa o GDD 1.0.

### 8.3 Ataques **[Implementado]**

A coluna Fase é a ordem em que os ataques entram nas lutas com mais fases (Máquina no Expert); quais ataques cada fase usa está em 8.2. Os números são os da versão 1.0 e ficam no `.tres`; se o teste mudar algum, atualizar o GDD junto.

| Chefe | Fase | Ataque | Aviso | Golpes | O que acontece (valores no `.tres`) |
|---|---|---|---|---|---|
| Mula | 1 | `bolas` | 0,8 s | 1 cada | Abaixa o peito e cospe 3 bolas rente ao chão (60 px), a 700 px/s, uma a cada 0,35 s |
| Mula | 1 | `pisoteio` | 1 s | 1 | Empina, bate as patas e solta uma onda de fogo pelo chão a 650 px/s |
| Mula | 2 | `investida` | 1,1 s | 1 | Aviso: agacha e raspa a pata da frente na terra duas vezes (`aviso_investida`, 13 quadros a 12/s, do tamanho do aviso). Corre até a parede do lado do Curupira a 1400 px/s, fica tonta 1,4 s e fica lá, virada para ele |
| Mula | 3 | `meteoros` | 1,3 s cada | 2 cada | 3 meteoros, o 1º no Curupira e os outros a ±300 px. Cada um sobe da boca (dá para ver). No alto da tela, em cima do ponto de queda, um brilho fica mais forte e pisca mais rápido até a pedra cair (0,3 s finais), e a pedra sai dele; no chão a sombra cresce. Depois fica cansada 1,5 s |
| Cuca | 1 | `leque` | 0,8 s | 1 cada | 3 feitiços em leque (abertura 20°) saindo da garra, o do meio mirado no Curupira na hora do disparo; 700 px/s |
| Cuca | 1 | `pocao` | 0,8 s | ver poças (7.6) | Poção em arco (600 px/s, gravidade 1800) até onde o Curupira estava na hora de jogar; depois fica parada 1,5 s |
| Cuca | 2 | `bote` | 0,9 s | 1 | Bote de jacaré: avança a 1100 px/s até 150 px da parede do lado do Curupira (`margem_parede_bote`), levanta e fica lá |
| Cuca | 3 | `ninar` | 0,9 s | 1 cada | Melodia de 6 notas soltas, uma a cada 0,7 s, a 400 px/s: grave (36 px do chão, laranja; pula-se) ou aguda (128 px, azul; abaixa-se), 50/50 |
| Boto | 1 | `jato` | 0,9 s | 1 | Sorteia alto (130 px do chão, dura 0,5 s; abaixa-se) ou baixo (40 px, dura 0,35 s; pula-se), 50/50. No começo do aviso afunda (ou sobe) na água até o bico, na pose `jato`, ficar na altura sorteada (0,3 s, `ajuste_jato`); o alto afunda ~70 px e o baixo ~160 px, só com a cabeça para fora. Nos 0,5 s finais (`crescida_jato`), a água sai do bico fina e vai crescendo (`jato_crescendo`). O jato sai reto do bico; no `fim_jato` ele volta para a linha d'água (também no combo). Depois fica parado 1,2 s |
| Boto | 1 | `beijos` | 0,6 s | 1 cada | 4 corações, um a cada 0,45 s, que perseguem o Curupira a 240 px/s virando no máximo 90°/s (curva larga, dá para despistar) e ondulam para os lados (24 px, 0,9 Hz). Estouram com tiro ou depois de 6 s. O que encosta também encanta: puxa o Curupira para o lado do Boto a 300 px/s por 1 s (7.6) |
| Boto | 2 | `chapeu` | 0,8 s | 1 | Chapéu bumerangue: vai baixo (40 px) e volta alto (140 px), ou o contrário (50/50), 0,9 s cada trecho. Aviso: `aviso_chapeu` (tira o chapéu e puxa o braço para trás) e `segura_chapeu` (segura, tremendo). No começo do aviso afunda ou sobe até a nadadeira, no último quadro do `arremesso`, ficar na altura da ida (0,3 s, `ajuste_chapeu`). O chapéu sai reto da nadadeira; no `fim_arremesso` ele volta para a linha d'água |
| Boto | 3 | `salto` | 0,8 s | 1 cada bolha; 1 no rasante | Duas formas, 50/50 (`chance_rasante`). Por cima: `mergulho` (afunda reto) e pula para o outro lado (1,4 s, arco de 520 px) soltando 5 bolhas que descem a 200 px/s balançando 48 px a 1,6 Hz. Rasante: `aviso_rasante` (deita para a frente e bate a cauda, 0,8 s) e atravessa deitado em 1,2 s, com a barriga 120 px acima da areia (entre o Curupira agachado, 86, e em pé, 172); sobe e desce só nos 12% das pontas, sobre a água. Abaixar ou dash |
| Máquina | 1 | `laser` | 1 s | 1 | Linha fina segue o Curupira e trava 0,3 s antes; laser dura 0,4 s |
| Máquina | 1 | `bombas` | animação `aviso_bombas` | 2 | 3 alçapões abrem no teto e soltam bombas (1 no Curupira, 2 a ±300 px), que explodem 1,5 s depois no chão (raio 180); parada 1,2 s |
| Máquina | 2 | `pistoes` | 0,9 s | 1 | Duas ondas de placas sobem do chão de um lado ao outro (960 px/s, a 2ª 1,25× mais rápida); cada placa avisa 0,4 s antes |
| Máquina | 3 | `varredura` | 0,8 s cada | 1 | Desce até a altura do Curupira e dispara um laser reto na altura da cabeça (0,6 s; agachar desvia); depois mira o chão e o ponto de impacto corre até a parede (0,85 s; pular desvia). Linha fina antes de cada passada |

Os avisos subiram a pedido do Eduardo ("não dá tempo de desviar"). Valores antigos: bolas 0,5, pisoteio 0,8, investida 0,9, meteoros 1, leque 0,5, poção 0,6, bote 0,6, ninar 0,4, jato 0,7, beijos 0,4 (não era usado), chapéu 0,6, salto sem aviso, laser 0,8 (trava 0,2), pistões 0,5 (placa 0,25), varredura 0,5. Os que o GDD fixa (bolas, meteoros, leque, poção, jato, laser) mudaram também no GDD.

**[Divergente]** O `ninar` antigo (2,4 s de duas fileiras de notas com uma brecha que subia e descia) não dava para desviar: a brecha era menor que o Curupira. Agora é uma nota por vez, cada uma numa das duas alturas que o Curupira já sabe desviar (pular ou abaixar).

### 8.4 Sequenciador de ataques **[Implementado]** **[Divergente]**

A v0.2 tinha um `enum Estado` com um valor por passo de cada ataque (`AVISO_BOLAS`, `BOLAS`, `PARADA`...) e um `_tempo` decrescente. Com 4 ataques e 3 animações por ataque, isso passaria de 20 estados por chefe. Agora:

- A base `Chefe` tem uma máquina de estados simples, `EstadoLuta { ESPERANDO, ATACANDO, TRANSICAO, DERROTADO }`, num laço (`_lutar()`): pausa → troca de fase, se passou do limiar → sorteia uma jogada (um ataque ou um combo) → `await` → pausa...
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
- Outras ajudas da base: `tocar`, `reiniciar`, `tocar_e_esperar(anim)`, `andar_ate(x, velocidade)`, `virar(para_direita)`, `lado_do_alvo()`, `pos_do_alvo()`, `x_do_alvo()`, `ponto(nome)` (ponto do desenho no mundo, 10.4) e `lancar_na_cena(no)`.
- **Fases**: `fases_para(GameState.dificuldade)` dá a lista de `FaseChefe` da luta; `_atualizar_fase()` compara a fração da vida com `comeca_com_vida` e emite `fase_mudou`. `limiares_fase()` dá os entalhes da barra do HUD.
- **Transição** (`_transicao_de_fase()`): espera o ataque em andamento acabar (a pausa entre jogadas é cortada se o limiar passar no meio dela), estado `TRANSICAO`, remove tudo do grupo `ataques_chefe`, vira para o Curupira (`_virar_para_alvo()`, o Boto olha para a arena), treme a tela 14 px, clarão claro de 0,45 s, pisca branco e toca `transicao`. Espera `max(animação, duracao_transicao)` + `pausa_apos_transicao`. Continua levando dano. `_efeitos_da_transicao()` (virtual) põe tremores nos quadros da animação (a pisada da Mula, os respingos do Boto).
- **Sorteio** (`_sortear_combo()` e `_tirar_do_saco()`): a cada jogada, sai um combo com chance `chance_combo`, senão o próximo ataque do **saco**. O saco tem os ataques da fase embaralhados (Fisher-Yates) e só enche de novo quando esvazia, então todos saem antes de repetir. Os ataques de um combo saem do saco. Não repete o mesmo combo seguido, nem começa um combo com o ataque que acabou de sair; se nenhum combo puder, vai um ataque sozinho.
- **Combo** (`_jogar_combo()`): `await _executar(primeiro, true)`, espera `atraso`, `await _executar(segundo, false)`. Com `encadeado = true`, o ataque não espera os próprios projéteis sumirem e pula a recuperação do fim (tonta, cansada, parada). A primeira jogada depois de uma transição é sempre um combo com um ataque novo ou um combo novo da fase.
- **Lado**: cada `_executar` começa com `_virar_para_alvo()`. A investida da Mula e o bote da Cuca param do lado do Curupira e ficam lá; os ataques seguintes usam `lado_do_alvo()` e saem espelhados.
- **[Divergente]** O Boto não tem mais ciclo fixo: sorteia como os outros, e só troca de lado com o `salto` (fase 3).
- **Nó raiz**: `Node2D` para todos. Mula (investida) e Cuca (bote) andam com `andar_ate`, sem física, e param perto da parede (`margem_parede`, `margem_parede_bote`). Nenhum chefe colide com o mundo.
- Projéteis e perigos do chefe vão para a **cena atual**, não para o chefe, para não andarem junto com ele.

### 8.5 Valores no código

Números de balanceamento ficam em `Resource` (`ChefeData` → `MulaData`, `CucaData`, `BotoData`, `MaquinaData`; `AtaqueData`; `EspecialData`; `MovimentoData`; `VidaJogadorData`), editáveis no inspetor. Ficam como `const` só valores visuais ou ligados ao desenho: cores de aviso, tempo e força do pisca, tremores e clarão (`PISCA_*`, `TREMOR_*`, `TRANCO_PX`, `INTERVALO_SUSTO`), o pisca da água crescendo no bico (`PISCA_CRESCIDA`), quanto o Boto precisa mexer para a água respingar (`MOVIMENTO_RESPINGO`) e a volta à linha d'água na derrota (`VOLTA_NA_DERROTA`), o brilho do meteoro (`MARGEM_BRILHO`, `PISCA_BRILHO_*`), `QUADRO_PISADA` e `QUADRO_PISADA_TRANSICAO` (em que quadro a pata bate no chão), `DURACAO_POSE_ATAQUE` e `DURACAO_POSE_DANO` do Curupira (a pose de tiro é estática e igual para todos os tiros, então não é valor de balanceamento).

### 8.6 Derrota do chefe **[Implementado]**

Ao zerar a vida: `EstadoLuta.DERROTADO` (o ataque em andamento sai no próximo `esperar`), desliga hurtbox e contato, remove tudo do grupo `ataques_chefe`, toca `derrota` e emite `chefe_derrotado`. **[Divergente]** O fade de 1 s saiu: agora existe a animação `derrota`.

A `TelaVitoria` (filha da arena) chama `GameState.marcar_concluida(dados.id_progresso)` (que salva; no Expert também marca `concluidas_expert`), espera 1,5 s e pausa mostrando "Você libertou…" e os ataques ganhos. A Máquina leva aos créditos; os outros, à seleção. **Não é vitória se o Curupira já tinha sido derrotado.**

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
├── HUD                           # instância, com curupira e chefe
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
- A água em volta do Boto (`AguaBoto`, `agua_boto.gd`, criada no `_ready` do Boto) fica na linha d'água e segue o Boto em x; ele afunda e sobe para o jato, e ela não. Duas camadas: a de trás (metade de lá dos anéis, z −1) e a da frente (espuma colada no corpo, gotinhas e metade de cá dos anéis, z 6, por cima da água da frente). Duas paletas, como a arena: `agua_*_azul` na margem esquerda e `agua_*_barro` na direita, trocadas pelo lado em que ele está. `respingar(x)` solta `agua_respingo_*` quando ele afunda ou sobe mais de 16 px e na saída e na chegada do salto; no ar a água em volta some. Quantidade de quadros, fps e centro saem do `efeitos.json`.
- **[Assumido]** Extrair uma `arena_base.tscn` só se as quatro começarem a divergir; hoje a duplicação é de poucos nós.

### 9.1 Mapa do mundo **[Implementado]**

Pedido do Eduardo: escolher o chefe andando até ele, como no tabuleiro do Cuphead, visto de cima em diagonal. O mapa tem 960×540 px de arte (3840×2160 na tela) e a câmera segue o Curupira, sem passar da borda.

```
Mapa (Node2D, mapa.gd)           # liga Curupira, câmera, aviso e painel; guarda a área ao ir lutar
├── Mundo (Node2D, CenarioMapa)  # y-sort; monta Fundo (z −10), objetos e Frente (z 10) de assets/pixel/mapa/
│   └── Curupira (curupira_mapa.tscn, CurupiraMapa)
├── Camera (Camera2D)            # segue o Curupira, com limites no tamanho do mapa
├── Interface/CaixaAviso/Aviso   # nome da área + "A / Espaço: entrar", ou "Portão trancado"
├── PainelFase (painel_fase.tscn) # ataques, dificuldade, Lutar!, Voltar ao mapa (pausa o mapa)
└── PausaMapa (pausa_mapa.tscn)   # Continuar / Menu principal
```

- **Áreas** (centro da entrada, em pixels da arte, no `dados.json`): Mula (184, 464), entre quatro árvores pegando fogo na beira da mata em chamas; Cuca (250, 186), na boca da mata fechada, com névoa, frascos e a luz verde do caldeirão; Boto (728, 465), na ponta do píer da prainha; Máquina (833, 154), na porta do prédio. Começo no pé da samaúma (480, 374). Depois da luta o Curupira aparece no ponto `volta` da área (`GameState.entrada_mapa`, só na memória).
- **Profundidade**: o `Mundo` tem `y_sort_enabled`, e cada objeto (árvore, palmeira, samaúma, cerca, portão, bandeira) tem a origem na base. Assim o Curupira passa atrás da árvore quando está acima da base dela, sem código de profundidade.
- **Onde dá para andar**: máscara `andavel.png` (branco = chão), exportada pelo gerador junto com o desenho, em vez de `CollisionShape2D`. Água, mata fechada, troncos, prédio e cerca ficam fora. O Curupira confere 4 pontos em volta dos pés (`raio_pes`) e desliza na beira (tenta só x, depois só y). O portão trancado (`portao.retangulo`) bloqueia até `GameState.boss_liberado()`.
- **Bandeiras**: aparecem na volta de cada área depois de vencer o chefe (`mostrar: "concluiu:faseN"`). Portão: `trancado` / `aberto`.
- **Animação**: fundo, frente e objetos animados trocam de quadro pelo mesmo relógio (16 quadros, 8 fps, laço de 2 s), para fogo, água, névoa e bandeiras baterem.
- **Ajustes** em `dados/mapa/mapa_ajustes.tres` (`MapaData`): velocidade (64 px de arte/s), raio dos pés, suavidade da câmera.
- **Controles**: anda com `move_left`/`move_right`/`aim_up`/`crouch` (analógico, direcional, WASD), entra com `ui_accept` ou `jump`, pausa com `pause` ou `ui_cancel`.
- O painel herdou a lógica de escolha do antigo `level_select`, que foi apagado (está no histórico do Git).
- **Arte** (`mapa_px.js`, `mapa_curupira_px.js`): o terreno sai de formas simples (lago, rio, trilhas, elipses de cada área) com ruído; a mata fechada é um tapete de copas; o Curupira do mapa é o mesmo da luta (cabeça, cabelo, rosto, saia de folhas, pés para trás) com o corpo encurtado, em 5 direções (`baixo`, `diag_baixo`, `lado`, `diag_cima`, `cima`; esquerda é espelho).

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
- `mapa/`: `fundo_<n>.png` e `frente_<n>.png` (16 quadros de 960×540), `andavel.png` (máscara do chão), `objetos.png` (atlas de todos os objetos e quadros) e `dados.json` (tamanho, fps, início, entradas, portão e, por objeto, `pos` da base, `deslocamento` do recorte, `tamanho`, `quadros` no atlas e `mostrar`). Chama-se `dados.json`, e não `mapa.json`, porque o `gerar_spriteframes.gd` trata `<pasta>/<pasta>.json` como folha de personagem.
- `curupira_mapa/`: folha do Curupira do mapa (`parado_*` e `andar_*` nas 5 direções), com `curupira_mapa_frames.tres` gerado.
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
- `ponto_na_pose(sprite, anim, nome, quadro)`: o ponto `nome` (em pixels da arte) num quadro de outra animação, sem tocá-la. O Boto usa para saber onde o bico vai estar na pose `jato` e afundar até a altura certa antes de disparar.
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
| Mula | `bola_de_fogo_mula`, `onda_fogo_mula`, `meteoro` (o brilho no céu é criado no `meteoro.gd`, com `brilho_meteoro_1..12.png`), `explosao_mula`, `poeira_mula` |
| Cuca | `feitico_cuca`, `pocao_cuca`, `poca_cuca`, `nota_cuca`, `vidro_cuca` |
| Boto | `jato_boto` (meio repetido em `region` + ponta), `coracao_boto`, `coracao_estoura_boto`, `chapeu_boto`, `bolha_boto`, `respingo_boto`. Criados no código: a água em volta dele (`agua_boto.gd`, ver 9) e a água crescendo no bico no aviso do jato (`jato_crescendo_1..16.png`: 8 tamanhos × 2 variantes, quadro = tamanho × 2 + variante). No Curupira, o `EfeitoEncanto` usa o `coracao_1.png` do Boto (7.6) |
| Máquina | `laser_maquina`, `bomba_maquina`, `explosao_maquina`, `placa_maquina`, `alcapao_maquina`, `faiscas_maquina` |
| Curupira (ataques ganhos) | `projetil_feitico_perseguidor`, `projetil_bolha_agua`, `projetil_bolha_abissal`, `projetil_pocao_maldita`, `feixe_canhao`, `respingo_agua`, `respingo_veneno`; a Bola de Fogo usa a bola e a explosão da Mula |

**[Divergente]** `succao_boto` (aviso antigo do jato) saiu: o aviso agora é a animação `aviso_jato` do Boto.

## 11. Interface

### 11.1 HUD **[Implementado]**
Pixel art do gerador (`art/pixel/gerador/hud_px.js` → `assets/pixel/ui/hud_*.png`, já ampliada 4×). O `hud.gd` só liga sinais; cada parte desenha a si mesma em `_draw()`, em passos de 4 px (1 pixel da arte).
- **Canto inferior esquerdo** (`hud_vida.gd`): retrato do Curupira num aro de madeira e um coração por golpe. O retrato muda de cara: dor logo depois de um golpe, fúria (cabelo em chamas) com o especial cheio, assustado com 1 golpe e normal no resto. O coração perdido treme e pisca; o último pula como um batimento.
- **Especial** (`hud_especial.gd`): moldura de cipó que enche de verde; cheia, vira brasa e a cabeça da onça acende.
- **Chefe** (`hud_chefe.gd`): nome (`dados.nome`) e barra de metal com o chip na ponta, no alto da tela. Enche do zero na entrada, deixa um rastro claro a cada golpe, tem entalhes nos limiares das fases da dificuldade (`chefe.limiares_fase()`), e o LED do chip apaga quando o chefe é libertado. Cada `levelN` aponta o campo `chefe` do HUD para o chefe da arena.
- O vão de cada moldura (onde entra o enchimento) está em `HUD_PX` no gerador e na constante `VAO` dos scripts: mudar nos dois.

### 11.2 Telas

| Tela | Estado |
|---|---|
| Cenas de abertura | **[Planejado]**, ver abaixo |
| Menu inicial | Pronto: Novo Jogo (apaga o save), Continuar (desabilitado sem save), Opções, Sair. **[Planejado]** mostrar os botões de cada ação do controle na tela, ver abaixo |
| Mapa do mundo | Pronto (seção 9.1). O painel de cada área lista só ataques liberados, troca com ←/→, salva a escolha e tem o botão **Dificuldade** (Normal/Expert, ←/→) com uma linha de explicação; chefe vencido mostra "Derrotada" ou "Derrotada · Expert". Máquina atrás do portão até as 3 fases |
| Pausa do mapa | Pronto: Continuar / Menu principal |
| Arena (×4) | Pronto (seção 9) |
| Pausa | Pronto: Continuar / Tentar de novo / Voltar para o mapa |
| Opções | **Só placeholder** ("Volume e tela cheia chegam em breve"); **[Planejado]** em 14.2 |
| Derrota | Pronto: Tentar de novo / Voltar para o mapa (aparece 1 s depois do último golpe) |
| Vitória | Pronto |
| Créditos | Pronto (tela + voltar ao menu); **[Planejado]** o texto, gerado do `CREDITS.md` (15.4) |

**Cenas de abertura [Planejado]**
- Cena `abertura.tscn` (`Control`, script `abertura.gd`), aberta pelo Novo Jogo antes do mapa. O Continuar não passa por ela.
- Quatro imagens em pixel art de 480×270, geradas pelo gerador como o resto (`art/pixel/gerador/`), exportadas para `assets/pixel/abertura/cena_1..4.png` e mostradas ampliadas 4× (filtro `Nearest`).
- Texto de uma ou duas frases embaixo de cada imagem, com a fonte do tema dos menus. Os textos ficam num `Resource` (`AberturaData`, `dados/abertura.tres`) para trocar sem mexer no código.
- `ui_accept` (A, Enter, Espaço) avança; `pause` (Start, Esc) pula tudo e vai para o mapa. Troca de imagem com fade de 0,3 s.
- As quatro cenas: a floresta viva com o Curupira; a empresa e a IA derrubando árvores para data centers; os chips na Mula, na Cuca e no Boto, de olho vermelho; o Curupira livre partindo para libertar as criaturas.

**Botões no menu inicial [Planejado]**: uma faixa embaixo do menu com o ícone de cada botão do controle e o nome da ação (andar, pular, atirar, especial, dash, travar mira). Ícones em pixel art no gerador (`assets/pixel/ui/botao_*.png`).

### 11.3 Navegação de menus **[Implementado]**
Menus são `Control`/`CanvasLayer` com tema compartilhado (`dados/tema_menus.tres`) e fundo (`fundo_menu.tscn`: `FundoArena` com a floresta de `arenas/menu` e brasas de 4 px). O tema usa a fonte em pixel e `StyleBoxTexture` em 9 fatias (margem de 12 px = 3 px da arte). A fonte tem 12 px de altura de linha e é importada com `scaling_mode = Integer Only`: os tamanhos de fonte das telas são múltiplos de 12 (24, 36, 48, 60, 72), senão os pixels saem desiguais. O contorno vem desenhado na fonte, então `outline_size = 0`. O menu inicial mostra o Curupira da folha (`idle`) em pé no chão da floresta. Usam `ui_*`, nunca as ações de jogo (exceto `pause` na luta). O primeiro botão recebe `grab_focus()` ao abrir. `ui_accept` e `ui_cancel` foram redefinidos no projeto (Enter/Espaço/A e Esc/B).

## 12. Input Map

| Ação | Controle (Xbox) | Teclado |
|---|---|---|
| `move_left` / `move_right` | Direcional e analógico esquerdo | A / D |
| `aim_up` | Direcional ↑ e analógico ↑ | W / ↑ |
| `crouch` | Direcional ↓ e analógico ↓ | S / ↓ |
| `aim_lock` | L2 (gatilho esquerdo, eixo 4) | Shift |
| `jump` | A | Espaço |
| `attack_basic` | X | J |
| `attack_special` | Y | K |
| `dash` | B | L |
| `pause` | Start | Esc |

- `aim_up` e `crouch` também servem para mirar no ar (6.3).
- Trava de mira: Shift no teclado e **L2** no controle **[Implementado]** (GDD Q15). O L2 é um eixo (`InputEventJoypadMotion`, eixo 4), então vale a partir da deadzone 0,2 da ação.
- O analógico usa deadzone 0,5 nas ações de movimento e mira.

## 13. Áudio — **[Planejado]**

Nada implementado ainda: não há barramentos configurados, `AudioStreamPlayer`, nem arquivos de áudio. As faixas e os efeitos de cada tela estão no GDD (Som e música).

- **Origem:** música e efeitos feitos com o **Google Flow** e com **bibliotecas open source**. Cada arquivo entra no `CREDITS.md` com fonte, autor e licença (15.4). Só entram licenças que permitem venda (o jogo é pago).
- **Formato e pasta:** música em `.ogg` (com laço ligado na importação), efeitos em `.wav` curtos, em `game/assets/audio/musica/` e `game/assets/audio/efeitos/`. Adicionar `*.ogg` e `*.wav` ao Git LFS antes do primeiro arquivo.
- **Barramentos:** `Master`, `Musica` e `Efeitos`, no `default_bus_layout.tres`.
- **Música:** autoload `Musica` com um `AudioStreamPlayer` no barramento `Musica`. Cada cena chama `Musica.tocar(faixa)` no `_ready`; se for a mesma faixa, ela continua sem reiniciar (menu → mapa não corta), senão troca com fade de 0,5 s. A faixa de cada arena fica no `ChefeData` (`musica`), para o `.tres` escolher.
- **Efeitos:** `AudioStreamPlayer` (interface) ou `AudioStreamPlayer2D` (na luta) no barramento `Efeitos`. As rotinas de ataque dos chefes (8.4) tocam o som de cada passo (aviso, golpe); o som de cada tiro e especial fica no `AtaqueData`/`EspecialData` (`som`), para cada ataque ter o seu.
- **Volume:** dois sliders nas Opções (música e efeitos), de 0 a 100%, convertidos com `linear_to_db`. `Master` fica fixo em 0 dB.

## 14. Save e opções

### 14.1 Save de progresso **[Implementado]**

Um único `ConfigFile` em `user://save.cfg`:

```
[progresso]  concluidas = ["fase1", "fase2", ...]
             concluidas_expert = ["fase1", ...]   # vencidas no Expert (só marca)
[opcoes]     dificuldade = 0                      # 0 = Normal, 1 = Expert
[equipamento] basico = "res://dados/ataques/....tres"   # "" = padrão
              especial = "res://dados/ataques/....tres"
```

- Carregar ao abrir o jogo (`GameState._ready`) e no Continuar; salvar a cada fase concluída e a cada mudança de equipamento ou de dificuldade.
- Vencer no Normal já concede os ataques e libera a Máquina; o Expert só marca a vitória à parte e não dá nada a mais (decisão do GDD 1.0).
- Novo Jogo apaga o arquivo e zera a memória.
- Equipamento guarda **caminhos** de `.tres`: renomear ou mover um `.tres` de ataque quebra saves existentes. **[Planejado]** Guardar o nome do arquivo sem pasta e sem extensão como id (`tiro_de_folha`) e procurar em `dados/ataques/`; se não achar, equipar o ataque inicial em vez de quebrar.
- Sem versão de formato no arquivo. **[Planejado]** Gravar `[save] versao = 1` e, ao ler um save sem versão ou mais antigo, converter (caminho → id) e gravar de novo.

### 14.2 Opções **[Planejado]**
Volume e tela cheia/janela ainda não existem; a tela de Opções é um aviso "em breve".

- **Tela** (`options_menu.tscn`, já existe): dois `HSlider` (Música e Efeitos, 0 a 100, passo 10) e um `CheckButton` (Tela cheia), com o tema dos menus, navegáveis no controle (←/→ mudam o slider).
- **Onde salva:** seção `[opcoes]` do mesmo `save.cfg` (`volume_musica`, `volume_efeitos`, `tela_cheia`). `apagar_save()` passa a preservar essa seção, para o Novo Jogo não apagar as opções.
- **Quando aplica:** no `_ready` do `GameState` e na hora em que o jogador mexe. Tela cheia = `DisplayServer.WINDOW_MODE_FULLSCREEN`; janela = `WINDOWED`.
- **Na luta:** a pausa ganha o botão Opções, que abre a mesma tela por cima (com `PROCESS_MODE_ALWAYS`) e volta para a pausa.

## 15. Build, versionamento e qualidade

### 15.1 Git
- Git LFS para `*.png`, `*.kra` e `*.mp4` **[Implementado]**; `*.ogg` e `*.wav` **[Planejado]** antes do primeiro arquivo de áudio.
- `.gitignore` ignora `game/.godot/`, `game/build/`, `*.pck`, `*.exe`. Mantém `.import` versionados.
- `export_presets.cfg` não existe ainda. **[Planejado]** Versionar (sem segredos) para o build ser reproduzível pelos dois.
- `.tscn`, `.tres` e `.import` como `binary`: conflito de merge se resolve escolhendo uma versão inteira. A dupla não trabalha em paralelo (`CLAUDE.md`).
- As cenas novas de projéteis e efeitos usam `ext_resource` só com `path` (sem `uid`); o Godot completa o `uid` na primeira vez que salvar a cena.

### 15.2 Export — **[Planejado]**
- Dois presets no `export_presets.cfg`: **Linux** (x86_64, `.x86_64` + `.pck` embutido) e **Windows Desktop** (`.exe`, `.pck` embutido, ícone do jogo).
- Filtro de arquivos não-recurso: `*.json` (pontos e âncoras da pixel art, 10.3) e `*.txt`, senão os tiros saem do lugar errado no build.
- Saída em `game/build/` (já no `.gitignore`).
- Antes de exportar: `LIBERAR_TUDO_PARA_TESTE` não vale no build (só em `is_debug_build()`), mas conferir a progressão de verdade com ele em `false`.
- Testar o build nos dois sistemas: abrir em tela cheia, jogar uma luta com controle, vencer e conferir o save.
- Steam e web: fora do MVP.

### 15.3 Testes
Sem testes unitários. Teste manual e um teste de fumaça headless:
- F6 roda qualquer arena isolada.
- Cenas de teste em `game/testes/`: `teste_dano`, `teste_tiro`, `alvo_teste`.
- `Debug > Visible Collision Shapes` para conferir hitboxes; aba Remote para valores em execução.
- Validação headless: `godot --headless --path game --quit-after 120`. Depois de criar scripts com `class_name` ou PNGs novos, importar antes (`--headless --editor --quit`).
- **Liberar tudo para testar**: `GameState.LIBERAR_TUDO_PARA_TESTE = true` libera a Máquina e todos os ataques no painel do mapa, sem vencer as fases. Só vale em build de debug (`OS.is_debug_build()`); o jogo exportado ignora. Pôr `false` para testar a progressão de verdade.
- **`testes/teste_lutas.gd`** **[Implementado]**: roda as quatro arenas no Normal e depois no Expert, 60 s cada, com o Curupira invencível, andando, agachando, mirando e atirando, e tira vida do chefe aos poucos. Imprime as trocas de fase e a ordem das jogadas (`a+b` = combo, `[TRANSICAO]`); qualquer erro de script aparece no log. Rodar com o editor fechado (ou numa cópia de `game/`):
  `godot --headless --fixed-fps 60 --disable-vsync --path game --script res://testes/teste_lutas.gd`
- **`testes/verificar_desvio.gd`** **[Implementado]**: responde "dá para desviar?" para cada ataque e cada combo das fases, e qual o menor atraso de combo que ainda dá. Grava a luta de verdade (cena, scripts, projéteis) com um boneco no lugar do Curupira, força o ataque ou combo e marca, quadro a quadro, as caixas de dano ligadas numa grade de 8 px. Depois procura uma sequência de comandos (parado, andar, pular, pulo curto, abaixar, dash) com a física do `MovimentoData` e a hurtbox real, primeiro sem dash. Como os chefes miram no Curupira, grava de novo com o boneco seguindo o caminho achado e confere. Testa 3 posições iniciais × 2 sorteios (`SORTEIOS`, sementes 11 e 44: o primeiro número de cada uma dá 0,83 e 0,30, então as duas formas dos ataques sorteados 50/50 entram, como jato alto e baixo, chapéu normal e invertido, salto por cima e rasante). O boneco não atira, então coisas que se estouram com tiro (corações do Boto) contam como sólidas. "FALHOU" = não achou caminho (pode ser impossível ou apertado demais). Também mostra em quantos casos o Curupira parado leva golpe (prova de que a gravação pega o ataque). Leva ~5 min:
  `godot --headless --fixed-fps 60 --disable-vsync --path game --script res://testes/verificar_desvio.gd`
  Filtros depois de `--`: `chefe=mula`, `dificuldade=1`, `so=combos` ou `so=ataques`, `rapido` (sem procurar o atraso mínimo), `depurar`.
- **`testes/teste_mapa.gd`** **[Implementado]**: abre o mapa, anda para baixo, sai da volta de cada área e anda até a entrada, abre e fecha o painel da Mula com A/B, e confere que o portão trancado bloqueia. Com `FOTOS=1 PASTA_FOTOS=<pasta>` (e um display, ex. `xvfb-run`) grava prints.
  `godot --headless --fixed-fps 60 --disable-vsync --path game --script res://testes/teste_mapa.gd`
- **Cheats de debug [Planejado]**: autoload `Debug` que só age em `OS.is_debug_build()`, com teclas de função: F1 invencibilidade, F2 especial cheio, F3 pular para a próxima fase do chefe, F4 vencer a luta, F5 liberar todos os ataques e a Máquina (o mesmo que `LIBERAR_TUDO_PARA_TESTE`). Mostra "DEBUG" num canto quando algum está ligado.

### 15.4 Créditos **[Planejado]**
- `CREDITS.md` na raiz do repositório: equipe, ferramentas (Godot, Krita, gerador de pixel art, Google Flow) e uma tabela com cada asset de terceiros (arquivo, autor, fonte, licença). A fonte em pixel e todo o áudio entram nela.
- A tela de créditos do jogo mostra o mesmo conteúdo: um `CreditosData` (`dados/creditos.tres`) com as linhas, atualizado junto com o `CREDITS.md`.
- Os placeholders antigos em `art/antiga/placeholder/` estão fora do jogo; registrar a origem só se voltarem.

## 16. Ordem de implementação

1. ~~Projeto base~~ (exceto presets de export)
2. ~~Curupira: movimento, pulo, gravidade, flip~~
3. ~~Arena base, câmera fixa~~
4. ~~Hitbox/Hurtbox, camadas, vida, invencibilidade, dash~~
5. ~~Ataque básico e projétil~~
6. ~~Chefe base + Mula~~
7. ~~Carga e disparo do especial~~
8. ~~Veneno e lentidão~~
9. ~~`GameState`, fluxo de telas, save~~
10. ~~Cuca, Boto, Máquina (lógica)~~
11. ~~Pixel art: personagens, efeitos, arenas; fases por dificuldade × 4 ataques; mira em 8 direções; agachar~~
12. ~~Mapa do mundo~~
13. **Agora**: teste manual de cada luta e do mapa no controle; ajustar os valores da v1.0 se precisar.
14. **Depois**: Opções (14.2) → áudio (13) → cenas de abertura e botões no menu (11.2) → créditos e `CREDITS.md` (15.4) → cheats (15.3) → versão no save (14.1) → export Linux/Windows (15.2).

## 17. Pendências

| Item | Impacto | Sugestão |
|---|---|---|
| Teste manual das 4 lutas e do mapa | Nada da pixel art nem do mapa foi visto rodando no controle | Rodar cada `levelN` e o `mapa` com F6 (ver `PENDENCIAS.md`) |
| Combos do Boto que começam com `beijos` | O `verificar_desvio.gd` não acha desvio com o Curupira em x = 480 (colado na água); o boneco não atira | Testar no F6; se for injusto, baixar `curva_beijo` ou `quantidade_beijos`, ou subir o atraso desses combos |
| Folhas do dash com a arte antiga | Mistura de estilos | Gerar no `art/pixel/gerador` |
| Opções, áudio, abertura, créditos, cheats, save, export | Requisitos do GDD | Seguir a ordem da seção 16; o desenho de cada um está neste TDD |
| Arte antiga sem uso em `game/assets/` | Peso do repositório | Apagar o que nenhuma cena usa mais |

## 18. Fora do MVP

Ideias do GDD ainda não adotadas: hitstop e squash and stretch; exportação para web (itch.io); desenho próprio da Bola de Fogo em cada direção; remapear botões.

Já implementados (saíram da lista): tremor de câmera (golpe no Curupira e troca de fase), coyote time, jump buffer, pulo de altura variável, valores em `Resource`, partículas no dash (`EfeitoDash`).

## 19. Decisões registradas

Escolhas técnicas que o código fez e que a dupla aceitou como oficiais na v1.0.

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
