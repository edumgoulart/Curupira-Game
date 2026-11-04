# Curupira: O Protetor da Floresta — TDD

Documento de Design Técnico · v0.2 · Godot 4.7.1 · GDScript

Este documento descreve **como** o jogo é construído. O **o quê** (regras, números, arte, história) está no GDD, que é a fonte de verdade para todos os valores.

**Legenda**
- Sem marcação: vem do GDD.
- **[Implementado]**: já existe no código; este documento passa a refletir o que o projeto faz.
- **[Assumido]**: padrão escolhido neste TDD; pode ser vetado.
- **[Divergente]**: o código faz diferente do que a v0.1 do TDD previa; a decisão registrada é a do código (ver seção 18 para vetar).
- **[Aberto]**: ainda precisa ser decidido ou confirmado.

---

## 1. Status

Revisão v0.2 feita comparando o TDD com a pasta `game/` (branch `movimento-curupira`, 23 commits).

| Área | Estado |
|---|---|
| Curupira (movimento, coyote, jump buffer, pulo variável, dash, vida, invencibilidade) | Pronto |
| Ataques básicos (4) e especiais (4), carga do especial | Pronto |
| Chefes: Mula, Cuca, Boto, Máquina (lógica e ataques) | Pronto; arte e animações da Cuca, Boto e Máquina pendentes |
| Efeitos de estado (veneno, lentidão) no chefe e no Curupira | Pronto, sem componente `StatusEffects` (ver 7.6) |
| Arenas (4), HUD, pausa, derrota, vitória, créditos | Pronto; arte da Máquina pendente (provisória em `Polygon2D`) |
| Menu inicial, seleção de fase e ataques | Pronto |
| Save de progresso e equipamento | Pronto (formato `ConfigFile`, ver 13) |
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
| Resolução base | 1920×1080 |
| Stretch | Mode `canvas_items`, aspect **`expand`** **[Divergente]** (a v0.1 previa `keep`) |
| Tela | **[Aberto]** `window/size/mode = 2` (maximizada). O GDD pede tela cheia por padrão (modo 3), alternável nas Opções |
| Filtro de textura | `Linear` (arte desenhada, não pixel art) **[Assumido]** |
| Snap 2D to pixel | Desligado **[Assumido]** |
| Física | 60 ticks/s (padrão). O código usa `physics_process` e `Timer` com `TIMER_PROCESS_PHYSICS` para manter o combate em ritmo fixo **[Implementado]** |
| Gravidade global | `2d/default_gravity = 3000` no projeto, **não usada**: o Curupira usa a própria (2800) e os chefes não usam gravidade global |
| Controle de versão | Git, GitHub, GitHub Flow. **Git LFS** para `*.png` e `*.kra`; `.tscn`, `.tres` e `.import` marcados `binary` no `.gitattributes` (sem merge automático) **[Implementado]** |
| Plataformas | Linux (inicial) e Windows (export) |

**Layout do repositório [Implementado]**: o `project.godot` fica em `game/`, não na raiz. A Godot abre `game/`. `docs/`, `art/source/` (`.kra`) e `teaser/` ficam fora do projeto.

## 4. Estrutura de pastas

**[Divergente]** A v0.1 previa `scenes/` e `scripts/` em subpastas por tipo. O projeto real é plano e tem uma pasta `dados/` para os `.tres`:

```
CurupiraGame/
├── CLAUDE.md, README.md
├── docs/                      # gdd.md, tdd.md, diagrams/
├── art/source/                # .kra do Krita
├── teaser/                    # scripts e vídeos do teaser
└── game/                      # <- a Godot abre aqui
    ├── project.godot
    ├── assets/                # PNGs (curupira, chefes, fases, efeitos/, placeholder/)
    ├── scenes/                # todas as cenas, sem subpastas (curupira, mula, level1..4, hud, menus, projéteis)
    ├── scripts/               # todos os scripts, sem subpastas
    ├── dados/
    │   ├── ataques/           # 1 .tres por ataque + catalogo.tres
    │   ├── chefes/            # mula, cuca, boto, maquina
    │   ├── curupira_movimento.tres, curupira_vida.tres
    │   └── tema_menus.tres
    └── testes/                # cenas de teste manual (F6)
```

**Convenções [Implementado]**
- Arquivos e pastas em `snake_case`; cena e script com o mesmo nome base (`mula.tscn` / `mula.gd`).
- Nós em `PascalCase`.
- **[Divergente]** Código (variáveis, funções, sinais, constantes, `class_name`) e nós **em português**, como no `CLAUDE.md` (`vida_mudou`, `chefe_derrotado`, `tentar_atirar`). A exceção são os nós dos níveis (`Floor`, `LeftWall`, `RightWall`) e o `take_damage` / `Hitbox` / `Hurtbox`, que ficam em inglês por convenção do projeto (`Floor` etc. herdados do protótipo; o GDD pedia `Chao`, `ParedeEsquerda`, `ParedeDireita` **[Aberto]**: renomear ou atualizar o GDD).
- Constantes em `MAIÚSCULAS_COM_UNDERLINE`.
- Cada script documenta no topo as animações que espera no `SpriteFrames`.
- A v0.1 sugeria `scenes/components/` com `hitbox.tscn` e `hurtbox.tscn`. Na prática, `Hitbox` e `Hurtbox` são **scripts com `class_name`** aplicados nos `Area2D` de cada cena, sem cena própria.

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
- Troca de cena: `get_tree().change_scene_to_file()` direto nos scripts de UI **[Divergente]** (a v0.1 previa um autoload `SceneManager`; sem transição elaborada ele não se justificou). **[Assumido]** manter assim; só criar `SceneManager` se entrar transição.

### 5.2 Autoloads

| Autoload | Responsabilidade |
|---|---|
| `GameState` **[Implementado]** | Progresso (`concluidas`), ataques equipados, carregar/salvar/apagar |

Regras do `GameState` **[Implementado]**:
- O progresso é uma lista de ids de fase: `fase1` (Mula), `fase2` (Cuca), `fase3` (Boto), `boss` (Máquina). Cada `ChefeData` guarda o próprio `id_progresso`. **[Divergente]** A v0.1 chamava de `boss_id` e `register_victory()`; o código usa `marcar_concluida(id)`.
- Ataques desbloqueados são **derivados** das fases concluídas: cada `AtaqueData` / `EspecialData` tem `fase_que_libera` (`""` = inicial) e `GameState.liberado()` confere. Não são salvos separadamente.
- `boss_liberado()` só é verdadeiro com `fase1`, `fase2` e `fase3` concluídas.
- `marcar_concluida()` salva na hora; `equipar()` também.
- `GameState._ready()` carrega o save ao abrir o jogo, para que vencer uma fase aberta com F6 não apague o progresso existente.
- **Opções (volume, tela cheia) ainda não estão no `GameState`** **[Aberto]**.

### 5.3 Pausa

`get_tree().paused = true`. Os nós `MenuPausa`, `TelaDerrota` e `TelaVitoria` têm `process_mode = PROCESS_MODE_ALWAYS` (valor 3) para continuar recebendo input com a árvore pausada **[Divergente]** (a v0.1 dizia `WHEN_PAUSED`; `ALWAYS` é necessário porque a derrota e a vitória pausam depois de um atraso e o menu precisa responder em ambos os casos). A pausa não abre por cima de outra tela que já pausou o jogo. As esperas das telas usam `create_timer(atraso, false)` para também pararem se o jogador pausar durante o atraso.

## 6. Curupira

### 6.1 Cena **[Implementado]**

```
Curupira (CharacterBody2D)        # layer: player (2)
├── AnimatedSprite2D              # SpriteFrames feitos no editor
├── CollisionShape2D
├── Atirador (Marker2D)           # script atirador.gd; ponto de saída dos projéteis (espelha com o lado)
├── Vida (Node)                   # contador de golpes
├── Hurtbox (Area2D)              # layer 2, mask 0
├── CargaEspecial (Node)          # barra do especial
└── EfeitoDash (instância)        # fantasmas, folhas, vento, corpo esticado (só visual)
```

O `Muzzle` da v0.1 virou o `Atirador`, que também cuida da cadência. Sprite e shapes são ajustados pelo Arthur no editor.

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
- Estados em `enum` + `match`: `PARADO, CORRENDO, PULANDO, CAINDO, DASH, ESPECIAL, DERROTADO`. O estado de chão/ar é derivado da física depois do `move_and_slide()`; dash, especial e derrotado só saem pelo próprio tempo.
- `olhando_para` (±1) define o lado do tiro e do dash.
- **[Divergente]** Coyote time, jump buffer e pulo variável **já estão no jogo**; a v0.1 os listava como "fora do MVP" (seção 17).

### 6.3 Dash **[Implementado]**

- 300 px em 0,2 s (1500 px/s), invencível durante todo o percurso (a hurtbox é desligada).
- Recarga: 0,8 s, contada a partir do fim do dash. No ar: um dash por pulo (volta ao tocar o chão).
- Direção: para onde o Curupira olha, reta na horizontal; sem gravidade durante o dash.
- Contra frames de float: `is_zero_approx` evita um 13º frame (325 px).
- O dash cancela a pose de ataque.

### 6.4 Vida e invencibilidade **[Implementado]**

Valores em `dados/curupira_vida.tres` (`VidaJogadorData`): 4 golpes, 1,5 s de invencibilidade, pisca a cada 0,1 s.

- Cada golpe tira 1 ou 2 (tabela de ataques dos chefes).
- **Invencibilidade por física**: `esta_invencivel()` (dash, derrotado, ou tempo pós-golpe) liga/desliga a `Hurtbox` (`ligada`), que desabilita as `CollisionShape2D` com `set_deferred`. Não é um `if` na hitbox. `take_damage` repete a checagem para o caso de dois ataques no mesmo frame.
- O pisca é por `sprite.visible` (alternância), não alpha com `Tween` **[Divergente]**.
- Ao zerar a vida: estado `DERROTADO`, emite `derrotado`; `TelaDerrota` espera 1 s e pausa.
- Sem cura. Tentar de novo = `reload_current_scene()` (vida e barra voltam cheias).
- Detalhe técnico: religar o `monitorable` de uma `Area2D` **não** re-dispara quem já estava encostado; religar a forma de colisão dispara. Por isso a `Hurtbox` desliga as formas.

### 6.5 Animações **[Implementado]**

**[Divergente]** Nomes em português, os que o código toca: `idle`, `correr`, `pular`, `cair`, `dash`, `atacar`, `especial`, `derrota`. Se uma não existir, toca `idle` (sem erro). `atacar` fica ativa 0,3 s depois do último tiro e é cortada pelo dash. O `SpriteFrames` é do Arthur.

### 6.6 Estado durante o Canhão Flamejante **[Implementado]**

Decidido no código: durante os 1,5 s do feixe o estado é `ESPECIAL`; o Curupira **não anda, não pula, não dá dash e não vira**. O feixe é filho do `Atirador` e acompanha o corpo. A pose usa `especial` (ou `atacar` se não existir).

## 7. Combate

### 7.1 Camadas de colisão **[Implementado]**

Nomes configurados no `project.godot`.

| # | Layer | Quem está nela | Mask (o que enxerga) |
|---|---|---|---|
| 1 | `world` | Chão, paredes | — |
| 2 | `player` | Corpo e Hurtbox do Curupira | `world` (corpo); Hurtbox mask 0 |
| 3 | `player_hitbox` | Projéteis e feixe do Curupira | `enemy`, `world` (máscara 9) |
| 4 | `enemy` | Hurtbox do chefe | — |
| 5 | `enemy_hitbox` | Projéteis, poças, bombas, laser, jato do chefe | `player` |

Quem causa dano só enxerga quem recebe pelas masks, nunca por `if` no código. Projéteis do chefe também existem em grupo `ataques_chefe`, usado para limpá-los quando o chefe morre.

### 7.2 Hitbox e Hurtbox **[Implementado]**

- **Hitbox** (`Area2D`, `class_name Hitbox`): campo `dano`; ao entrar em uma `Area2D` que tenha `take_damage`, chama e emite `acertou`. Não sabe quem é o alvo.
- **Hurtbox** (`Area2D`, `class_name Hurtbox`): `take_damage(amount: int, from: Node)` emite `golpe_recebido`; o dono (Curupira ou Chefe) escuta e decide. Também tem `aplicar_efeito(efeito, intensidade, duracao)` com o sinal `efeito_recebido`.
- **[Divergente]** `amount` é `int` (golpes ou pontos de vida inteiros), não `float`. O dano dos chefes é em golpes inteiros; o do Curupira, em pontos inteiros. O GDD só usa inteiros.
- O chefe leva dano o tempo todo (sem janelas de invulnerabilidade).
- Projétil do Curupira (`class_name Projetil`, `Area2D`): reto, ou persegue o chefe mais próximo (grupo `chefes`) se `curva > 0`; some ao acertar, ao bater na parede ou ao sair da tela. Parâmetros definidos pelo `Atirador` antes de entrar na cena (o `_ready` do projétil já usa).

### 7.3 Ataques básicos **[Implementado]**

Um `.tres` (`AtaqueData`) por ataque em `dados/ataques/`. Segurar o botão atira; intervalo = `1 / (tiros_por_segundo × fator_lentidão)`. Os projéteis saem na horizontal, para o lado em que o Curupira olha.

| Ataque | Dano | Tiros/s | Carga por acerto | Velocidade (px/s) | Comportamento |
|---|---|---|---|---|---|
| Tiro de Folha (inicial) | 4 | 5 | +1 | 1800 | Reto |
| Bola de Fogo (Mula) | 12 | 1,5 | +3 | 1000 | Reto; explosão no impacto (`explosao.tscn`) |
| Feitiço Perseguidor (Cuca) | 3 | 4 | +1 | 900 | Persegue o chefe: curva 540°/s, vida máxima 3 s |
| Bolha d'Água (Boto) | 26 | 0,8 | +6 | 600 | Lento, reto |

As velocidades e a curva foram definidas em protótipo **[Implementado]** (fecha o item da v0.1). Ajustar pelo inspetor.

### 7.4 Carga e disparo do especial **[Implementado]**

- Barra de 100 pontos (`CargaEspecial`). Cada acerto do básico soma a "carga por acerto" do ataque equipado (o `Atirador` emite `acerto_basico`).
- Barra cheia + `attack_special` dispara; a barra volta a 0 (`gastar()`).
- A barra começa em 0 a cada fase (recarregar a cena zera).
- Acertos do próprio especial não carregam a barra.
- O HUD escuta `carga_mudou` e `vida_mudou` por sinal.

### 7.5 Especiais **[Implementado]**

Um `.tres` (`EspecialData`) por especial. Duas cenas: projétil que voa, ou `FeixeCanhao` preso ao Curupira.

| Especial | Efeito técnico |
|---|---|
| Instinto Selvagem (inicial) | Projétil grande, reto, 150 de dano, 1200 px/s |
| Canhão Flamejante (Mula) | Feixe preso ao Curupira, 1,5 s, 200 de dano divididos em **10 pulsos de 20**; Curupira parado (6.6) |
| Poção Maldita (Cuca) | Projétil **reto** a 1000 px/s; 40 de dano no impacto + veneno 20/s por 8 s |
| Bolha Abissal (Boto) | Projétil reto a 700 px/s; 60 de dano + lentidão de 40% por 6 s |

A trajetória da Poção do jogador foi decidida como reta (a poção **da Cuca** é que voa em arco).

### 7.6 Efeitos de estado

**[Divergente]** Não existe o componente `StatusEffects`. Cada alvo trata o efeito no próprio script, recebido por `Hurtbox.efeito_recebido`:

| Efeito | No chefe (`chefe.gd`) | No Curupira |
|---|---|---|
| Veneno | `Timer` de 1 s: um pulso de dano por segundo; reaplicar só renova o número de pulsos. Chefe fica esverdeado | Só pela poça da Cuca (abaixo) |
| Lentidão | `fator_tempo()` = `1 − lentidão` (0,6). Cada chefe multiplica o `delta` do `_physics_process` por ele: pausas, avisos, pulos e cadência ficam mais lentos. Projéteis já soltos não mudam. Reaplicar renova o tempo. Chefe fica azulado | `aplicar_lentidao(fonte, fator)` / `remover_lentidao(fonte)` com dicionário por fonte; vale o menor fator. Reduz velocidade horizontal e a cadência do tiro. Pulo e dash não mudam |

**[Aberto]** Decidir se vale extrair um `StatusEffects` único. Hoje são ~40 linhas no `Chefe` e ~15 no `Curupira`; extrair só compensa se aparecer um terceiro tipo de alvo ou novo efeito.

Poças da Cuca (`PocaCuca`, `Area2D`, layer `enemy_hitbox`, mask `player`) **[Implementado]**:
- Duram 5 s; no máximo 2 na arena (ao criar a 3ª, a mais antiga some).
- Tipo sorteado 50/50 (veneno ou lentidão).
- Veneno: 1 golpe se o Curupira ficar **1 s seguido** dentro; o contador zera ao sair, e o dash (que desliga a hurtbox) também zera. Olha a hurtbox, então respeita invencibilidade.
- Lentidão: velocidade ×0,6 enquanto dentro (olha o corpo, que tem `aplicar_lentidao`).

## 8. Chefes

### 8.1 Regras globais

1. Pode levar dano o tempo todo.
2. Todo ataque tem aviso visual antes do golpe (brilho colorido no sprite via `avisar()`: laranja Mula, verde Cuca, azul Boto, vermelho Máquina).
3. Depois do ataque mais forte, o chefe fica parado por um instante (janela de ataque).

Cada chefe tem um único estado de luta (sem fases dentro da luta). A vida do chefe **não aparece** na tela; o retorno é um pisca branco a cada acerto.

### 8.2 Dados **[Implementado]**

| Chefe | Vida | Pausa entre ataques | Concede | `id_progresso` |
|---|---|---|---|---|
| Mula sem Cabeça | 1200 | 1,2 s | Bola de Fogo + Canhão Flamejante | `fase1` |
| Cuca | 1600 | 1,6 s | Feitiço Perseguidor + Poção Maldita | `fase2` |
| Boto cor-de-rosa | 2000 | 2 s | Bolha d'Água + Bolha Abissal | `fase3` |
| Máquina controlada por IA | 2400 | 1,2 s | Nada (chefe final) | `boss` |

Contato com o corpo do chefe (`Contato`, Hitbox em `enemy_hitbox`) tira 1 golpe. **[Aberto]** Valor "provisório combinado" nos `.tres`; não está no GDD. Confirmar.

### 8.3 Ataques **[Implementado]**

| Chefe | Ataque | Aviso | Golpes | Valores provisórios (ajustar testando) |
|---|---|---|---|---|
| Mula | Três bolas de fogo em sequência | 0,5 s | 1 cada | Intervalo 0,35 s; 700 px/s; 60 px acima do chão (passa por baixo de um pulo, pega o Curupira parado) |
| Mula | Meteoro | 1 s | 2 | Sombra no chão no X do Curupira; pedra aparece nos últimos 0,3 s; área do impacto 0,15 s; depois a Mula fica parada 1,5 s |
| Cuca | Feitiço | 0,5 s | 1 cada | 3 bolas em leque (abertura 15°), a do meio mirada no Curupira; 700 px/s |
| Cuca | Poção | 0,6 s | ver poças (7.6) | Arco (600 px/s horizontal, gravidade 1800) até onde o Curupira estava; depois fica parada 1,5 s |
| Boto | Troca de lado | sem aviso | 1 cada bolha | Pulo de 1,4 s (arco de 520 px), solta 3 bolhas que descem a 120 px/s |
| Boto | Jato de água | 0,7 s | 1 | Aviso: suga água pela boca; jato horizontal rente ao chão (35 px), dura 0,4 s; depois fica parado 1,2 s |
| Máquina | Raio laser | 0,8 s | 1 | Linha fina segue o Curupira e trava 0,2 s antes; laser dura 0,4 s |
| Máquina | Bombas | 1,5 s | 2 | 3 bombas (1 no Curupira, 2 ao lado, 300 px de distância), caem a 900 px/s, explodem 1,5 s depois no chão, raio 180 px; depois a Máquina fica parada 1,2 s |

Os valores sem tempo no GDD (tudo na coluna da direita) estão no `.tres` de cada chefe, para o Arthur balancear.

### 8.4 Lógica de estados **[Implementado]**

Todos os chefes seguem o mesmo molde (`enum Estado` + `match`, um temporizador `_tempo` decrescente):

- Ciclo: `ESPERANDO` (pausa) → sorteio → `AVISO_*` → golpe → (`PARADA`, quando houver) → próximo ataque.
- Quando o estado tem `PARADA`, ela **substitui** a pausa normal (o sorteio acontece direto ao sair dela).
- `_entrar(estado, duracao)` troca de estado, liga/desliga o brilho de aviso e toca a animação.
- O primeiro ataque só vem depois de uma pausa inicial (respiro).
- **Escolha do próximo ataque**: sorteio 50/50 entre dois ataques, **sem repetir o ataque forte duas vezes seguidas** (Mula: meteoro; Cuca: poção; Máquina: bombas). **Exceção: o Boto não sorteia**, faz um ciclo fixo (jato → parada → pulo → outro lado, ≈ 5,7 s por lado, próximo dos 6 s do GDD).
- **Lentidão**: todo `_physics_process` começa com `delta *= fator_tempo()`.
- **Nó raiz**: `Node2D` para todos **[Implementado]** (ficam parados; o Boto se move por interpolação em arco, calculada no `_physics_process`, entre dois pontos da arena). Nenhum usa `CharacterBody2D`, então não há colisão com o mundo.
- `Chefe` (`chefe.gd`, `class_name Chefe`) é a base: vida (`Vida`), `take_damage`, pisca, veneno, lentidão, `avisar()`, `tocar()`, `lancar_na_cena()`, `chefe_derrotado`. Cada chefe só implementa o ciclo e os ataques.
- Projéteis e perigos do chefe são adicionados à **cena atual**, não ao chefe, para não andarem junto com ele.
- Ao zerar a vida: para a máquina de estados, desliga hurtbox e contato, remove tudo do grupo `ataques_chefe`, emite `chefe_derrotado`, some com um fade de 1 s.

### 8.5 Valores no código

**[Divergente]** A v0.1 mandava `const` no topo dos scripts, sem `Resource`. O `CLAUDE.md` pede o contrário, e é o que o código faz: números de balanceamento em `Resource` (`ChefeData` → `MulaData`, `CucaData`, `BotoData`, `MaquinaData`; `AtaqueData`; `EspecialData`; `MovimentoData`; `VidaJogadorData`), editáveis no inspetor. Só ficam como `const` valores puramente visuais (cores de aviso, tempo de pisca, atrasos de tela). A seção 17 ("valores em Resource" fora do MVP) deixa de valer.

### 8.6 Derrota do chefe **[Implementado]**

O chefe emite `chefe_derrotado`. A `TelaVitoria` (filha da arena, com `chefe` e `curupira` apontados no inspetor) chama `GameState.marcar_concluida(dados.id_progresso)` (que salva), espera 1,5 s e pausa o jogo mostrando "Você libertou…" e os ataques ganhos. A Máquina leva aos créditos; os outros, à seleção. **Não é vitória se o Curupira já tinha sido derrotado** (um tiro ainda no ar não conta).

Não existe um `arena.gd`: o fluxo de vitória/derrota está nas duas telas, ligadas por sinais. **[Divergente]** (a v0.1 previa um script na raiz da arena).

## 9. Arenas

Quatro arenas (`level1` Mula, `level2` Cuca, `level3` Boto, `level4` Máquina), só com chão e paredes, abertas em cima, câmera fixa.

**[Divergente]** Não há cena base herdada: cada `levelN.tscn` é independente, com `Camera2D`, `Floor`, `LeftWall`, `RightWall` (`StaticBody2D` com `WorldBoundaryShape2D`, layer `world`), `Curupira`, o chefe, `HUD`, `MenuPausa`, `TelaDerrota`, `TelaVitoria`.

```
LevelN (Node2D)
├── Fundo / SalaBranca            # arte (Sprite2D) ou Polygon2D provisório (Máquina)
├── Camera2D                      # fixa, sem limits; filha da arena, nunca do Curupira
├── Floor, LeftWall, RightWall    # StaticBody2D, layer world
├── Curupira                      # instância
├── <Chefe>                       # instância, com alvo = Curupira
├── HUD                           # instância, com curupira
├── MenuPausa, TelaDerrota, TelaVitoria
```

- **Coordenadas**: a arena é centrada em (0, 0) (câmera na origem, paredes em ±960, chão em y ≈ 410), **[Divergente]** não em (960, 540) como a v0.1 dizia.
- **[Aberto]** O chão e as paredes têm shapes de teste; posição e altura final dependem da arte.
- A Máquina usa visual provisório em `Polygon2D` (`SalaBranca`, `VisualProvisorio`); aguarda arte.
- **[Assumido]** Vale extrair `arena_base.tscn` só se as quatro começarem a divergir em manutenção; hoje a duplicação é de 6 nós.

## 10. Interface

### 10.1 HUD **[Implementado]**
Canto inferior esquerdo: vida do Curupira (4) e barra do especial (`hud_vida.gd`, `hud_especial.gd`, via sinais). Sem barra de vida do chefe.

### 10.2 Telas

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

### 10.3 Navegação de menus **[Implementado]**
Menus são `Control`/`CanvasLayer` com tema compartilhado (`dados/tema_menus.tres`) e fundo (`fundo_menu.tscn`). Usam `ui_*`, nunca as ações de jogo (exceto `pause` na luta). O primeiro botão recebe `grab_focus()` ao abrir. `ui_accept` e `ui_cancel` foram redefinidos no projeto (Enter/Espaço/A e Esc/B).

## 11. Input Map

**[Divergente]** Nomes reais das ações (seguem o `CLAUDE.md`, não a v0.1):

| Ação | Controle (Xbox) | Teclado |
|---|---|---|
| `move_left` / `move_right` | Direcional e analógico esquerdo | A / D |
| `jump` | A | Espaço |
| `attack_basic` | X | J |
| `attack_special` | Y | K |
| `dash` | B | L |
| `pause` | Start | Esc |

Cima/baixo (direcional) e W/S não têm função durante a luta. O analógico usa deadzone 0,5 nas ações de movimento.

## 12. Áudio — **[Aberto, não iniciado]**

Nada implementado: não há barramentos configurados, `AudioStreamPlayer`, nem arquivos de áudio.

Proposta para fechar **[Assumido]**:
- Barramentos: `Master`, `Music`, `SFX`.
- Uma música por cena (menu, seleção, cada arena); troca ao entrar na cena.
- Efeitos via `AudioStreamPlayer` / `AudioStreamPlayer2D`.
- Volume: **dois sliders (música e efeitos)** + Master fixo em 0 dB; o valor é salvo nas opções.
- Lista de faixas e efeitos (Q14): **[Aberto]**, depende da planilha de assets.

## 13. Save e opções

### 13.1 Save de progresso **[Implementado]**

**[Divergente]** Um único `ConfigFile` em `user://save.cfg` (não JSON):

```
[progresso]  concluidas = ["fase1", "fase2", ...]
[equipamento] basico = "res://dados/ataques/....tres"   # "" = padrão
              especial = "res://dados/ataques/....tres"
```

- Carregar ao abrir o jogo (`GameState._ready`) e no Continuar; salvar a cada fase concluída e a cada mudança de equipamento.
- Novo Jogo apaga o arquivo e zera a memória.
- Equipamento guarda **caminhos** de `.tres`: renomear ou mover um `.tres` de ataque quebra saves existentes. **[Aberto]** Considerar guardar um id (`tiro_de_folha`) em vez do caminho, ou garantir fallback quando o `load` falhar (hoje não há).
- Sem versão de formato no arquivo. **[Aberto]** Adicionar `versao` antes do lançamento.

### 13.2 Opções **[Aberto, não iniciado]**
Volume e tela cheia/janela ainda não existem. **[Assumido]** Guardar em seção `[opcoes]` do mesmo `save.cfg` (um arquivo só, em vez de `settings.cfg` separado) e aplicar no `_ready` do `GameState`. Isso faz **Novo Jogo** apagar as opções junto: se não for desejado, usar `settings.cfg` separado (sugestão original) ou preservar a seção `[opcoes]` em `apagar_save()`.

## 14. Build, versionamento e qualidade

### 14.1 Git
- Git LFS para `*.png` e `*.kra` **[Implementado]**; `*.ogg` e `*.wav` **[Aberto]** adicionar ao `.gitattributes` quando entrar áudio.
- `.gitignore` atual ignora `game/.godot/`, `game/build/`, `*.pck`, `*.exe`, traduções. Mantém `.import` versionados **[Implementado]**.
- `export_presets.cfg` não está ignorado e não existe ainda. **[Aberto]** Versionar (sem segredos) para o build ser reproduzível pelos dois.
- **[Implementado]** `.tscn`, `.tres` e `.import` como `binary`: conflito de merge se resolve escolhendo uma versão inteira (README). Combinar antes quem mexe em qual cena.

### 14.2 Export — **[Aberto, não iniciado]**
Presets para Linux (x86_64) e Windows Desktop. O projeto deve exportar para os dois sem ajuste de código. Não há `export_presets.cfg`. Há uma entrada `rendering_device/driver.windows="d3d12"` no `project.godot` (irrelevante no Compatibility). Steam (GodotSteam ou similar): fora deste TDD.

### 14.3 Testes
Sem testes automatizados. Teste manual:
- F6 roda qualquer arena isolada.
- Cenas de teste em `game/testes/`: `teste_dano`, `teste_tiro`, `alvo_teste`.
- `Debug > Visible Collision Shapes` para conferir hitboxes; aba Remote para valores em execução.
- Validação headless: `godot --headless --path game --quit-after 120`. Depois de criar `.tres` ou scripts novos, rodar `--headless --import`.
- **Cheats de debug (`OS.is_debug_build()`): não implementados [Aberto]**: invencibilidade, carga total do especial, matar chefe, desbloquear todos os ataques. Sugestão: ações de Input Map só de debug lidas num autoload `Debug` removível do build.

### 14.4 Créditos
`CREDITS.md` com fonte, autor e licença de cada asset: **não existe [Aberto]**. Há assets em `game/assets/placeholder/` (tileset e personagens) cuja origem e licença precisam ser registradas.

## 15. Ordem de implementação

Concluído (itens 1 a 10) e restante:

1. ~~Projeto base~~ — feito (exceto presets de export)
2. ~~Curupira: movimento, pulo, gravidade, flip~~
3. ~~Arena base, câmera fixa~~
4. ~~Hitbox/Hurtbox, camadas, vida, invencibilidade, dash~~
5. ~~Ataque básico e projétil~~
6. ~~Chefe base + Mula~~
7. ~~Carga e disparo do especial~~
8. ~~Veneno e lentidão~~
9. ~~`GameState`, seleção, fluxo de telas, save~~
10. ~~Cuca, Boto, Máquina (lógica)~~
11. **Restante**: arte e animações (Cuca, Boto, Máquina), áudio, Opções (volume, tela cheia), abertura, conteúdo dos créditos, cheats de debug, `CREDITS.md`, `main_scene` = menu, export Linux/Windows.

## 16. Pendências

| Item | Impacto | Sugestão |
|---|---|---|
| Opções (volume, tela cheia) | Requisito do GDD | Implementar com 2 sliders + toggle; salvar no `GameState` (13.2) |
| Áudio (barramentos, faixas, SFX) | Requisito do GDD | Criar buses; lista de assets (Q14) |
| Tela cheia por padrão | GDD pede; hoje `mode = 2` (maximizada) | Trocar para `mode = 3` |
| `run/main_scene` | Hoje abre `main.tscn` → level1 | Apontar para `main_menu.tscn` |
| Cenas de abertura | Requisito do GDD | Decidir se entra no MVP |
| Pausa → Opções e "voltar à seleção" nas Opções em arena | Seção 5.3 | Implementar junto das Opções |
| Cheats de debug | Seção 14.3 | Autoload `Debug` só em `is_debug_build()` |
| Export Linux/Windows | Entrega | Criar `export_presets.cfg` e testar nos dois |
| `CREDITS.md` | Licenças dos assets | Criar agora, preencher conforme os assets entram |
| Arte/animações da Cuca, Boto, Máquina; arena da Máquina | Chefes finais | Pendente com o Eduardo/Arthur; Máquina em `Polygon2D` |
| Tamanho dos sprites e quadros por animação (Q5) | Cápsula, hitboxes, `SpriteFrames` | Definir com a arte |
| Save guarda caminho de `.tres` sem fallback | Save quebra se mover arquivos | Guardar id ou tratar `load` nulo; adicionar versão |
| Dano de contato com o corpo do chefe (1 golpe) | "Provisório combinado" | Confirmar no GDD |
| Nomes `Floor/LeftWall/RightWall` vs GDD | Consistência | Renomear ou atualizar o GDD |
| `.gitattributes` para áudio | LFS quando entrar `.ogg`/`.wav` | Adicionar |
| Steam | Export e build | Tratar depois do jogo pronto |

## 17. Fora do MVP

Ideias do GDD ainda não adotadas: hitstop, tremor de câmera e squash and stretch; partículas no dash (parte já feita pelo `EfeitoDash`: fantasmas, folhas, vento, corpo esticado); exportação para Web.

Saíram desta lista por já estarem implementados: coyote time, jump buffer, pulo de altura variável e valores de ataque em `Resource`.

## 18. Decisões registradas (para o Arthur vetar)

Escolhas que o código já fez e que este TDD passa a tratar como oficiais. Se alguma não for desejada, ela vira tarefa.

1. **Estrutura plana** em `scenes/`, `scripts/`, `dados/` (em vez de subpastas por tipo).
2. **Português** em todo o código e nós, com `take_damage`, `Hitbox`, `Hurtbox` como exceção em inglês.
3. **Nomes de ação do Input Map**: `attack_basic`, `attack_special`.
4. **`Resource` (`.tres`) para todos os números**, não `const` (8.5).
5. **Sem `SceneManager` nem `StatusEffects`**: troca de cena direta; veneno e lentidão tratados em `Chefe` e `Curupira` (5.1, 7.6).
6. **Sem script de arena**: fluxo de vitória/derrota nas telas `TelaVitoria` e `TelaDerrota` (8.6).
7. **Progresso por ids de fase** (`fase1..3`, `boss`) e ataques liberados derivados deles (5.2).
8. **Chefes são `Node2D`** parados, sem colisão com o mundo (8.4).
9. **Telas de pausa/derrota/vitória com `PROCESS_MODE_ALWAYS`** (5.3).
10. **Save em `ConfigFile`** (`save.cfg`), com progresso e equipamento (13.1).
11. **Dash não é possível durante o Canhão Flamejante** (6.6); **Poção Maldita do jogador é reta** (7.5).
12. **Boto tem ciclo fixo**, os outros três sorteiam sem repetir o ataque forte (8.4).
13. **Câmera na origem (0, 0)**, arena centrada nela, `stretch aspect = expand` (3, 9).
