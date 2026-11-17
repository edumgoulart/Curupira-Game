# Gerador da pixel art

Os sprites do jogo são desenhados por código, pixel a pixel, nesta pasta.

- `gerador/index.html`: mostra todas as animações e uma arena jogável para testar os chefes.
- `gerador/exportar.html`, `exportar.js` e `exportar.py`: exportam as folhas para `game/assets/pixel/`.
- `gerar_spriteframes.gd`: gera os `SpriteFrames` (`.tres`) a partir das folhas, dentro do Godot.

Passo a passo em `docs/tdd.md`, seção 4.1. Cada personagem tem o próprio arquivo:

| Arquivo | O que tem |
| --- | --- |
| `desenho.js` | Curupira |
| `poses_px.js` | Poses e mira |
| `chefes_px.js` | Os quatro chefes e os ataques |
| `arenas_px.js` | Cenários |
