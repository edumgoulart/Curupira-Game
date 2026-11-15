/* hud_px.js — peças do HUD da luta em pixel art (exportadas já ampliadas 4×, como os botões).
   As barras (enchimento do especial e da vida do chefe) são desenhadas pelo jogo, em blocos de
   4 px, dentro do vão de cada moldura; os números do vão estão em HUD_PX e no hud_*.gd.

   - retrato do Curupira num aro de madeira, com quatro expressões (normal, dor, assustado, fúria)
   - coração cheio e vazio (4 golpes)
   - moldura de cipó da barra do especial e a cabeça da onça, apagada e acesa
   - moldura de metal da barra de vida do chefe, com o chip na ponta esquerda */

const HUD_PX = {
  retrato: 30,                                   // 30×30
  coracao: [9, 8],
  especial: { tam: [52, 9], vao: [2, 2, 48, 5] },  // vão = x, y, largura, altura do enchimento
  onca: [15, 13],
  chefe: { tam: [168, 10], vao: [14, 3, 151, 4] }
};
const PH = {
  aro: '#6B3A20', aroL: '#A86A38', aroD: '#3E2014', fundo: '#163A32', fundoL: '#1E4A3C',
  coracao: '#D8262A', coracaoL: '#FF7A6A', coracaoD: '#8A1420', vazio: '#3A2230', vazioL: '#523244',
  metal: '#5E6870', metalL: '#9AA6AE', metalD: '#30383E', metalO: '#12161A',
  chip: '#1A2420', chipL: '#2E3A36', pino: '#8A9490', led: '#FF3A2A', ledL: '#FF9A7A'
};

// retrato: rosto do Curupira recortado num círculo, com aro de madeira e três folhas
function retratoPx(nome, t = 0) {
  const N = HUD_PX.retrato, c = N / 2, cam = new Camada(N, N), furia = nome === 'furioso';
  const rosto = rostoQuadro(nome, t);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
    if (d <= 12.2) {
      const r = rosto.get(x + 2, y + 5);
      cam.set(x, y, r || (y < 12 ? PH.fundoL : PH.fundo));
    } else if (d <= 14.2) {
      // aro: luz em cima à direita, sombra embaixo à esquerda; no especial ele vira brasa
      const luz = (x - c) - (y - c) > 4, sombra = (x - c) - (y - c) < -6;
      cam.set(x, y, furia ? (luz ? PM.fogo5 : sombra ? PM.fogo2 : PM.fogo3) : (luz ? PH.aroL : sombra ? PH.aroD : PH.aro));
    } else if (d <= 15.1) cam.set(x, y, furia ? PM.fogoO : PM.olhoO);
  }
  // folhinhas presas no aro
  const folha = (cx, cy, esp) => cam.carimbo(['.gG', 'gGl', 'Gg.'], cx, cy, { G: PM.verdeM, g: PM.verde, l: PM.verdeL }, esp);
  folha(1, 21, false); folha(25, 3, true); folha(3, 4, false);
  return cam;
}

function coracaoHudPx(cheio) {
  const cam = new Camada(...HUD_PX.coracao);
  cam.carimbo(['.ooo.ooo.', 'oRLLoRRRo', 'oRLRRRRRo', 'oRRRRRRDo', '.oRRRRDo.', '..oRRDo..', '...oDo...', '....o....'], 0, 0,
    cheio ? { o: PM.olhoO, R: PH.coracao, L: PH.coracaoL, D: PH.coracaoD } : { o: PM.olhoO, R: PH.vazio, L: PH.vazioL, D: PH.vazio });
  if (!cheio) for (const [x, y] of [[4, 1], [4, 2], [3, 3], [4, 4], [5, 5]]) cam.set(x, y, PM.olhoO);   // rachado
  return cam;
}

// cabeça da onça do Instinto Selvagem, de frente, com pintas: apagada enquanto carrega, em brasa quando cheia
function oncaIconePx(acesa) {
  const cam = new Camada(...HUD_PX.onca);
  const mapa = acesa
    ? { o: PM.fogoO, K: PM.fogo4, k: PM.fogo3, s: PM.fogo1, W: PM.fogo6, e: PM.branco, p: PM.fogoO, n: PM.fogoO, m: PM.fogoO }
    : { o: PM.olhoO, K: '#5A5060', k: '#463E4C', s: '#2A2430', W: '#7A7080', e: '#9A90A0', p: PM.olhoO, n: PM.olhoO, m: PM.olhoO };
  cam.carimbo([
    '.ooo.......ooo.',
    'okkKo.....oKkko',
    'okKKKoooooKKKko',
    'oKKsKKKKKKKsKKo',
    'oKsKKKsKsKKKsKo',
    'oKKepKKKKKpeKKo',
    'osKkeKKKKKekKso',
    'oKKKKWWnWWKKKKo',
    '.oKKWWWmWWWKKo.',
    '.oKsWWmWmWWsKo.',
    '..okKWWWWWKko..',
    '...ookkkkkoo...',
    '.....ooooo.....'], 0, 0, mapa);
  return cam;
}

// moldura de cipó: vão transparente onde o jogo desenha o enchimento
function molduraEspecialPx() {
  const [W, H] = HUD_PX.especial.tam, [vx, vy, vw, vh] = HUD_PX.especial.vao, cam = new Camada(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const canto = (x === 0 || x === W - 1) && (y === 0 || y === H - 1);
    if (canto) continue;
    const dentro = x >= vx && x < vx + vw && y >= vy && y < vy + vh;
    if (dentro) continue;
    const borda = x === 0 || y === 0 || x === W - 1 || y === H - 1;
    cam.set(x, y, borda ? PM.verdeO : y < vy ? PM.verdeM : (x + y) % 5 === 0 ? PM.verde : PM.verdeD);
  }
  // folhas brotando do cipó
  for (const x of [9, 23, 37]) cam.carimbo(['.l', 'GG'], x, -1, { G: PM.verdeM, l: PM.verdeLL });
  return cam;
}

// moldura de metal da vida do chefe, com o chip cravado na ponta esquerda
function molduraChefePx() {
  const [W, H] = HUD_PX.chefe.tam, [vx, vy, vw, vh] = HUD_PX.chefe.vao, cam = new Camada(W, H);
  for (let y = 1; y < H - 1; y++) for (let x = 8; x < W; x++) {
    const canto = x === W - 1 && (y === 1 || y === H - 2);
    if (canto || (x >= vx && x < vx + vw && y >= vy && y < vy + vh)) continue;
    const borda = y === 1 || y === H - 2 || x === W - 1;
    cam.set(x, y, borda ? PH.metalO : y === 2 ? PH.metalL : y === H - 3 ? PH.metalD : PH.metal);
  }
  for (const x of [40, 78, 116, 154]) { cam.set(x, 2, PH.metalD); cam.set(x + 1, 2, PH.metalL); }   // rebites
  // chip: corpo escuro, pinos e o LED vermelho
  for (let y = 0; y < H; y++) for (let x = 0; x < 12; x++) {
    const borda = x === 0 || y === 0 || x === 11 || y === H - 1;
    cam.set(x, y, borda ? PH.metalO : (x + y) % 4 === 0 ? PH.chipL : PH.chip);
  }
  for (const x of [2, 5, 8]) { cam.set(x, -1, PH.pino); cam.set(x, H, PH.pino); }
  cam.set(5, 4, PH.led); cam.set(6, 4, PH.led); cam.set(5, 5, PH.led); cam.set(6, 5, PH.ledL);
  for (const [x, y] of [[2, 2], [3, 2], [9, 7], [8, 7], [2, 7]]) cam.set(x, y, PH.pino);
  return cam;
}

function exportarHud() {
  const ui = (nome, cam) => { saida.ui['hud_' + nome] = { png: png(ampliarCamada(cam, 4)), tamanho: [cam.W * 4, cam.H * 4] }; };
  for (const [nome, ex] of [['normal', 'oba'], ['dor', 'dor'], ['assustado', 'assustado'], ['furia', 'furioso']]) ui('retrato_' + nome, retratoPx(ex, 0.3));
  ui('coracao_cheio', coracaoHudPx(true)); ui('coracao_vazio', coracaoHudPx(false));
  ui('onca_apagada', oncaIconePx(false)); ui('onca_acesa', oncaIconePx(true));
  ui('moldura_especial', molduraEspecialPx());
  ui('moldura_chefe', molduraChefePx());
}
