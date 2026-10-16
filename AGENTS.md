# Curupira: O Protetor da Floresta — instruções para o Codex

Boss-rush 2D de plataforma (visão lateral, com gravidade), inspirado em Cuphead e Mega Man.
Godot 4.x, **GDScript** (não usar C#). Jogo só em português — textos de UI, nomes de nodes e comentários em português.

O design completo está em `docs/` (GDD, ataques, chefes, história). **Leia `docs/` antes de implementar qualquer mecânica e use os valores de lá.** Se um valor não estiver definido nos docs, pergunte — não invente números de combate.

---

## Divisão de trabalho (IMPORTANTE)

**O Codex faz:**
- Scripts `.gd` (movimento, dash, ataques, projéteis, chefes, HUD, menus, save).
- Cenas `.tscn`: criar a estrutura de nodes, ligar scripts, sinais, layers/masks.
- Resources `.tres` de dados (ex.: `AtaqueData`, `ChefeData`).
- `project.godot`: Input Map, layer names, autoloads.

**O Arthur faz no editor (NÃO mexer):**
- `SpriteFrames` (frames das animações) — nunca criar, editar ou remover.
- Formato e tamanho das `CollisionShape2D` / `shape` — criar o node é ok, mas deixar a shape para o Arthur ajustar (ou usar um placeholder e avisar).
- Posição de elementos visuais (fundos, obstáculos, posição do chefe na arena).

Quando um passo depender de algo do editor, **pare e diga exatamente o que o Arthur precisa fazer** (qual cena, qual node, o quê), em vez de tentar fazer pelo texto.

Nomes de animação esperados no código: documentar no topo de cada script quais animações ele usa (ex.: `idle`, `correr`, `pular`, `cair`, `dash`, `atirar`, `dano`), para o Arthur criar no `SpriteFrames` com os mesmos nomes.

---

## Regras para editar `.tscn` / `.tres`

- **Faça commit (ou peça para o Arthur fazer) antes de editar qualquer `.tscn`.**
- Prefira cenas pequenas e instanciadas (uma cena por personagem, projétil, chefe) a uma cena gigante.
- Ao editar o texto da cena: manter os `id` de `ext_resource`/`sub_resource` consistentes, não duplicar UIDs, não apagar referências que você não criou.
- Se a mudança na cena for grande ou arriscada, prefira montar os nodes em `_ready()` por código ou explicar o passo para o Arthur fazer no editor.
- Depois de editar, valide rodando o projeto em headless (ver "Validação").

---

## Convenções de código

- Tipagem estática sempre que possível (`var vida: int = 4`, `func f(x: float) -> void`).
- Constantes de tuning ficam em `Resource` (`.tres`), não hardcoded no script — o Arthur balanceia pelo inspetor.
- Um script por responsabilidade; nada de "God script".
- Sinais para comunicação para cima/lateral (ex.: `vida_mudou`, `especial_carregou`, `chefe_derrotado`); chamada direta só para filhos.
- Estados do jogador e dos chefes com máquina de estados simples (enum + `match`), não com booleanos espalhados.

### Input Map (ações customizadas — não usar `ui_*` no gameplay)
| Ação | Teclado | Controle (layout Xbox) |
|---|---|---|
| `move_left` / `move_right` | A / D | direcional / analógico esquerdo |
| `jump` | Espaço | A |
| `attack_basic` | J | X |
| `attack_special` | K | Y |
| `dash` | L | B |
| `pause` | Esc | Start |

Controle é a forma principal de jogar; teclado também precisa funcionar 100%.

### Camadas de colisão
| Layer | Nome | Uso |
|---|---|---|
| 1 | `world` | chão, paredes |
| 2 | `player` | corpo/hurtbox do Curupira |
| 3 | `player_hitbox` | projéteis e ataques do Curupira |
| 4 | `enemy` | corpo/hurtbox dos chefes |
| 5 | `enemy_hitbox` | projéteis e ataques dos chefes |

Hitbox do jogador só detecta hurtbox de inimigo e vice-versa — **resolver com layers/masks, não com `if` no código**.

### Dano
- Hitbox = `Area2D` que causa dano; Hurtbox = `Area2D` que recebe.
- Todo mundo que leva dano implementa `func take_damage(amount: int, from: Node) -> void`.
- A hitbox só chama `take_damage`, sem saber quem é o alvo.

---

## Regras de jogo (resumo — detalhes em `docs/`)

- Curupira aguenta **4 golpes**; no 4º perde a fase.
- **Dash dá invencibilidade.**
- Curupira atira **para onde está olhando**.
- Ataque básico + ataque especial. Especial **carrega por acertos**, não por dano causado.
- Troca de ataques só na tela de seleção, antes da fase — nunca durante a luta.
- Ataques iniciais: **Tiro de Folha** (básico, rajada de folhas) e **Instinto Selvagem** (especial, energia em forma de cabeça de onça).
- Cada ser folclórico derrotado concede 1 básico + 1 especial. Todos os básicos são projéteis (variam tipo de tiro, dano, cadência).
- Chefes: Mula sem Cabeça, Cuca, Boto (ordem livre) → Máquina de IA (final, liberada após os três).
- Chefes têm **estado único** (sem fases dentro da luta). Ataques com telegrafo + janela de recuperação.
- Vida do chefe **não aparece** na tela (estilo Cuphead).
- HUD: vida e carga do especial no canto inferior esquerdo.
- Arenas sem rolagem, só chão e paredes. Câmera fixa (filha da arena, não do Curupira).
- Progresso salvo após cada chefe derrotado e persistente entre sessões.
- Resolução base 1920×1080, tela cheia, PC (Linux primeiro, build fácil para Windows).

---

## Estrutura de pastas

```
res://
├── docs/              # GDD e definições (somente leitura para o Codex)
├── assets/            # PNGs, fundos, áudio — vindos do Arthur/Eduardo
├── personagens/curupira/
├── chefes/<nome>/     # cena, script e dados de cada chefe
├── projeteis/
├── ataques/           # AtaqueData.gd + .tres de cada ataque
├── arenas/<nome>/
├── ui/                # HUD, menus, telas
├── sistemas/          # autoloads: save, progresso, áudio
└── testes/
```

---

## Validação

Depois de cada mudança:
1. Rodar `godot --headless --path . --quit-after 120` (ou `--check-only` em scripts) e corrigir erros de parse/script.
2. Dizer ao Arthur **qual cena rodar com F6** e **o que observar** (ex.: "pule perto da borda e veja se ainda sai o pulo").
3. Não marcar nada como pronto sem esse teste manual — o Codex não vê o jogo rodando.

---

## Jeito de trabalhar

- Passos pequenos e testáveis. Uma mecânica por vez.
- Para coisas grandes (um chefe, sistema de save), apresentar um plano curto antes de escrever código.
- Explicar o **porquê** das decisões de arquitetura — o Arthur precisa conseguir explicar o código na apresentação.
- Não refatorar o que não foi pedido.
- Ordem sugerida: movimento com game feel (coyote time, jump buffer, pulo variável) → dash com invencibilidade → projétil básico + hitbox/hurtbox → vida/dano/derrota → primeiro chefe completo → HUD → menus/seleção → save → demais chefes.
