/* pixel.js — utilidades de cor e de silhueta usadas pelo desenho à mão. */
const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// silhueta numa cor só, em xadrez (os fantasmas do dash: sem transparência parcial)
function silhueta(idx, W, H, hex, fase) {
  const tela = document.createElement('canvas');
  tela.width = W; tela.height = H;
  const ctx = tela.getContext('2d'), im = ctx.createImageData(W, H), c = hexRgb(hex);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (idx[i] < 0 || (x + y + fase) % 2) continue;
    im.data[i * 4] = c[0]; im.data[i * 4 + 1] = c[1]; im.data[i * 4 + 2] = c[2]; im.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  return tela;
}

