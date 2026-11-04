# Technical Design Document — Curupira

> Documento técnico. Preencher ao longo do semestre.

## 1. Ambiente
### 1.1. Engine e versão
### 1.2. Linguagem
### 1.3. Ferramentas
### 1.4. Controle de versão

## 2. Arquitetura
### 2.1. Visão geral
### 2.2. Organização de pastas
### 2.3. Autoloads / singletons
### 2.4. Gerenciamento de estado
### 2.5. Sistema de cenas

## 3. Sistemas
### 3.1. Player
### 3.2. Máquina de estados dos chefes
### 3.3. Colisão e camadas de física
### 3.4. Câmera
### 3.5. Input
### 3.6. Salvamento

## 4. Assets
### 4.1. Pipeline de arte
A arte é pixel art em 480×270, ampliada 4× para 1920×1080. Ela sai de um gerador em JavaScript (`art/pixel/gerador/`), que desenha cada personagem pixel a pixel a partir de peças e poses e exporta as folhas para `game/assets/pixel/`:

1. `exportar.html` roda num Chrome sem janela e escreve todas as folhas em JSON:
   `google-chrome --headless=new --allow-file-access-from-files --virtual-time-budget=200000 --dump-dom file://$PWD/art/pixel/gerador/exportar.html > /tmp/dom.html`
2. `python3 art/pixel/gerador/exportar.py /tmp/dom.html game/assets/pixel` grava os PNGs e os `.json`.
3. Com o editor fechado: `godot --path game --headless --editor --quit` importa os PNGs, e `godot --path game --headless --script $PWD/art/pixel/gerar_spriteframes.gd` gera um `<nome>_frames.tres` para cada personagem.

`index.html` (na mesma pasta) mostra todas as animações e uma arena jogável para testar os ataques.

### 4.2. Convenções de nomenclatura
- `game/assets/pixel/<personagem>/<personagem>.png`: folha do personagem, uma linha por animação, todas as células do mesmo tamanho.
- `<personagem>.json`: `celula` (largura e altura da célula), `ancora` (pixel da célula que fica na posição do node: os pés, a linha d'água ou o ponto do teto) e, por animação, `fps`, `loop`, `quadros` e `pontos`.
- `pontos` são por quadro e relativos à âncora, em pixels da arte: `mao` (Curupira), `boca` (Mula e Cuca), `garra` (Cuca), `bico` (Boto) e `lente` (Máquina). No mundo, multiplicar por 4 e espelhar o x quando o personagem vira.
- `<personagem>_frames.tres`: SpriteFrames gerado da folha, com os mesmos nomes de animação do JSON.
- `<personagem>/efeitos/<efeito>_<n>.png`: projéteis e efeitos em quadros soltos (como `bola_fogo_1..4.png`), descritos em `efeitos/efeitos.json` (fps, loop, tamanho e centro).
- `arenas/<chefe>/fundo_<n>.png` e `frente_<n>.png`: 8 quadros de 480×270 a 4 fps. A frente vai por cima dos personagens; por exemplo, a água da frente do Boto.

### 4.3. Configurações de importação
- Importação padrão do Godot (`compress/mode = Lossless`, sem mipmaps).
- Em todo node que mostra pixel art (`AnimatedSprite2D`, `Sprite2D`, `AnimacaoQuadros`): `texture_filter = Nearest` e `scale = (4, 4)`.
- O filtro padrão do projeto (`rendering/textures/canvas_textures/default_texture_filter`) só deve virar `Nearest` quando toda a arte antiga (1254×1254) tiver saído, para ela não ficar serrilhada até lá.
- As coordenadas do jogo continuam em 1920×1080: velocidades, pulo, dash e posições do GDD não mudam. O chão das arenas fica em y = 880 (220 × 4).

### 4.4. Sprites e animações
- **Âncora no node.** Com `centered = true`, `offset = (celula / 2) − ancora`. Valores atuais:

  | Personagem | Célula | Âncora | `offset` |
  | --- | --- | --- | --- |
  | Curupira | 52×68 | (24, 64) | (2, −30) |
  | Mula | 170×162 | (100, 153) | (−15, −72) |
  | Cuca | 150×124 | (79, 113) | (−4, −51) |
  | Boto | 140×144 | (73, 99) | (−3, −27) |
  | Máquina | 126×214 | (57, 6) | (6, 101) |

  Se o gerador mudar uma célula, o JSON diz o novo valor.
- **Virar o personagem.** Use `scale.x = −4` no node do sprite, não `flip_h`. O `flip_h` espelha em volta do centro da textura e a âncora sairia do lugar.
- **Mesmo pixel em tudo.** Para o pixel dos personagens não ficar desalinhado do cenário, arredonde a posição do node visual para múltiplos de 4 na tela. O corpo físico continua com a posição exata.
- **Ataques dos chefes.** Cada ataque tem três animações: `aviso_<ataque>` (sem loop, para no último quadro), `<ataque>` (a ação, quase sempre em loop) e `fim_<ataque>`. O código troca de animação nos tempos que estão no `.tres` de dados do chefe. Projéteis e efeitos são cenas próprias, criadas nos `pontos` do quadro atual.
- **Curupira.** A mira escolhe a animação: `atirar`, `atirar_diag_cima`, `atirar_cima` ou `atirar_diag_baixo` de pé; `correr_atirar` ou `correr_atirar_diag_cima` andando; `ar_atirar_<cima|diag_cima|lado|diag_baixo|baixo>` no ar; `agachado_atirar` agachado. A folha do tiro tem uma imagem por direção (`folha_cima`, `folha_diag_cima`, `folha_lado`, `folha_diag_baixo` e `folha_baixo`).

## 5. Performance
### 5.1. Metas
### 5.2. Pontos de atenção

## 6. Build e Distribuição
### 6.1. Presets de exportação
### 6.2. Plataformas-alvo

## 7. Testes
### 7.1. Estratégia
### 7.2. Casos críticos

## 8. Dívida Técnica
