# Pixel art do jogo

Folhas de sprites, efeitos e cenários em pixel art (480×270, ampliados 4× no jogo).
Gerados por `art/pixel/gerador/`: não edite os PNGs à mão, mude o gerador e exporte de novo.

- `<personagem>/<personagem>.png` + `.json`: folha e descrição (célula, âncora, fps, pontos de tiro).
- `<personagem>/<personagem>_frames.tres`: SpriteFrames pronto para o `AnimatedSprite2D`.
- `<personagem>/efeitos/`: projéteis e efeitos em quadros soltos, para o `AnimacaoQuadros`.
- `arenas/<chefe>/`: fundo e frente animados (8 quadros, 4 fps).

Como usar no Godot: `docs/tdd.md`, seção 4.
