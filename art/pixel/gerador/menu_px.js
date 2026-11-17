/* menu_px.js — interface em pixel art: fonte, título, botões e painéis, e o fundo dos menus.
   A fonte vai para o Godot como BMFont (.fnt + .png); o resto como PNG.
   Botões e painéis saem já ampliados 4× (StyleBoxTexture usa o tamanho da imagem). */

/* ---------- fonte ----------
   Cada letra em texto: linhas de cima para baixo, a partir do topo da maiúscula (linha 0)
   até o fim da descendente (linha 8); a minúscula começa na linha 2. '#' pinta.
   Acentos são compostos por código: em cima da minúscula (linhas 0 e 1) ou acima da maiúscula. */
const GLIFOS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  a: ['', '', '.###.', '....#', '.####', '#...#', '.####'],
  b: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '####.'],
  c: ['', '', '.###.', '#....', '#....', '#....', '.###.'],
  d: ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'],
  e: ['', '', '.###.', '#...#', '#####', '#....', '.###.'],
  f: ['..##', '.#..', '.#..', '###.', '.#..', '.#..', '.#..'],
  g: ['', '', '.####', '#...#', '#...#', '#...#', '.####', '....#', '.###.'],
  h: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '#...#'],
  i: ['.#.', '', '##.', '.#.', '.#.', '.#.', '###'],
  j: ['..#', '', '..#', '..#', '..#', '..#', '..#', '#.#', '.#.'],
  k: ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#'],
  l: ['##.', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  m: ['', '', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#...#'],
  n: ['', '', '####.', '#...#', '#...#', '#...#', '#...#'],
  o: ['', '', '.###.', '#...#', '#...#', '#...#', '.###.'],
  p: ['', '', '####.', '#...#', '#...#', '#...#', '####.', '#....', '#....'],
  q: ['', '', '.####', '#...#', '#...#', '#...#', '.####', '....#', '....#'],
  r: ['', '', '#.##', '##..', '#...', '#...', '#...'],
  s: ['', '', '.####', '#....', '.###.', '....#', '####.'],
  t: ['.#..', '.#..', '###.', '.#..', '.#..', '.#..', '..##'],
  u: ['', '', '#...#', '#...#', '#...#', '#...#', '.####'],
  v: ['', '', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  w: ['', '', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
  x: ['', '', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  y: ['', '', '#...#', '#...#', '#...#', '#...#', '.####', '....#', '.###.'],
  z: ['', '', '#####', '...#.', '..#..', '.#...', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['...'],
  '.': ['', '', '', '', '', '', '#'],
  ',': ['', '', '', '', '', '', '#', '#'],
  ':': ['', '', '#', '', '', '', '#'],
  ';': ['', '', '#', '', '', '', '#', '#'],
  '!': ['#', '#', '#', '#', '#', '', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '', '..#..'],
  '-': ['', '', '', '###'],
  '—': ['', '', '', '#####'],
  '–': ['', '', '', '####'],
  '+': ['', '..#..', '..#..', '#####', '..#..', '..#..'],
  '=': ['', '', '####', '', '####'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
  '"': ['#.#', '#.#'],
  "'": ['#', '#'],
  '%': ['##...', '##..#', '...#.', '..#..', '.#...', '#..##', '...##'],
  '×': ['', '', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  '·': ['', '', '', '#'],
  '…': ['', '', '', '', '', '', '#.#.#'],
  '‹': ['', '', '..#', '.#.', '#..', '.#.', '..#'],
  '›': ['', '', '#..', '.#.', '..#', '.#.', '#..'],
  '<': ['', '...#', '..#.', '.#..', '#...', '.#..', '..#.', '...#'],
  '>': ['', '#...', '.#..', '..#.', '...#', '..#.', '.#..', '#...'],
  '*': ['', '#.#', '.#.', '#.#'],
  '_': ['', '', '', '', '', '', '', '', '#####'],
  '°': ['.#.', '#.#', '.#.']
};
const ACENTOS = {
  agudo: ['..#', '.#.'], grave: ['#..', '.#.'], circunflexo: ['.#.', '#.#'], til: ['.##.#', '#.##.']
};
const COMPOSTOS = {
  'á': ['a', 'agudo'], 'à': ['a', 'grave'], 'â': ['a', 'circunflexo'], 'ã': ['a', 'til'],
  'é': ['e', 'agudo'], 'ê': ['e', 'circunflexo'], 'í': ['i', 'agudo'], 'ó': ['o', 'agudo'],
  'ô': ['o', 'circunflexo'], 'õ': ['o', 'til'], 'ú': ['u', 'agudo'],
  'Á': ['A', 'agudo'], 'À': ['A', 'grave'], 'Â': ['A', 'circunflexo'], 'Ã': ['A', 'til'],
  'É': ['E', 'agudo'], 'Ê': ['E', 'circunflexo'], 'Í': ['I', 'agudo'], 'Ó': ['O', 'agudo'],
  'Ô': ['O', 'circunflexo'], 'Õ': ['O', 'til'], 'Ú': ['U', 'agudo']
};
// grade do glifo: 2 linhas para o acento da maiúscula + 9 (maiúscula e descendente)
const FONTE_TOPO = 2, FONTE_LINHAS = FONTE_TOPO + 9, FONTE_BASE = FONTE_TOPO + 7;

// glifo como lista de pontos [x, y] na grade, e a largura
function glifo(ch) {
  const pontos = [];
  const pintar = (linhas, dy, dx = 0) => linhas.forEach((l, y) => [...l].forEach((c, x) => { if (c === '#') pontos.push([x + dx, y + dy]); }));
  let base = ch, acento = null;
  if (COMPOSTOS[ch]) [base, acento] = COMPOSTOS[ch];
  if (ch === 'ç' || ch === 'Ç') base = ch === 'ç' ? 'c' : 'C';
  let linhas = GLIFOS[base];
  if (!linhas) return null;
  if (base === 'i' && acento) linhas = ['', '', ...linhas.slice(2)];   // o acento toma o lugar do pingo
  const w = Math.max(...linhas.map(l => l.length));
  pintar(linhas, FONTE_TOPO);
  if (acento) {
    const a = ACENTOS[acento], aw = Math.max(...a.map(l => l.length)), dx = Math.floor((w - aw) / 2);
    const maiuscula = base === base.toUpperCase();
    pintar(a, maiuscula ? 0 : FONTE_TOPO, dx);   // maiúscula: acento nas 2 linhas de cima da grade
  }
  if (ch === 'ç' || ch === 'Ç') pintar(['..#..', '.##..'], FONTE_BASE, Math.floor((w - 5) / 2));
  return { pontos, w };
}
const FONTE_CARACTERES = [...Object.keys(GLIFOS), ...Object.keys(COMPOSTOS), 'ç', 'Ç'];
const FONTE_CORPO = '#FFFFFF', FONTE_CONTORNO = '#1E0E16';

// folha da fonte: cada glifo com contorno de 1 px (cabe 1 px de cada lado)
function exportarFonte() {
  const W = 256, glifos = [];
  let x = 0, y = 0;
  const lista = FONTE_CARACTERES.map(ch => ({ ch, g: glifo(ch) })).filter(e => e.g);
  const altura = FONTE_LINHAS + 2;
  const linhasFolha = Math.ceil(lista.reduce((s, e) => s + e.g.w + 3, 0) / W) + 1;
  const tela = document.createElement('canvas'); tela.width = W; tela.height = linhasFolha * altura;
  const ctx = tela.getContext('2d');
  for (const { ch, g } of lista) {
    const gw = g.w + 2;
    if (x + gw > W) { x = 0; y += altura; }
    const cam = new Camada(gw, altura);
    for (const [px, py] of g.pontos) cam.set(px + 1, py + 1, FONTE_CORPO);
    cam.contornar(FONTE_CONTORNO);
    ctx.drawImage(cam.paraTela(), x, y);
    glifos.push({ id: ch.codePointAt(0), x, y, w: gw, h: altura, xoffset: -1, yoffset: -1, xadvance: g.w + 1 });
    x += gw + 1;
  }
  saida.fontes = { pixel: { png: png(tela), glifos, tamanho: FONTE_LINHAS + 1, altura_linha: FONTE_LINHAS + 1, base: FONTE_BASE, largura: W, altura: tela.height } };
}

// escreve um texto numa camada com a fonte, ampliado "escala" vezes; cor(x, y) escolhe a cor do corpo
function escreverPx(cam, texto, x0, y0, escala, cor, contorno, espessura = 1) {
  const corpo = new Camada(cam.W, cam.H);
  let x = x0;
  for (const ch of texto) {
    const g = glifo(ch);
    if (!g) { x += 4 * escala; continue; }
    for (const [px, py] of g.pontos) for (let i = 0; i < escala; i++) for (let j = 0; j < escala; j++) {
      const X = x + px * escala + i, Y = y0 + (py - FONTE_TOPO) * escala + j;
      corpo.set(X, Y, cor(X - x0, Y - y0));
    }
    x += (g.w + 1) * escala;
  }
  for (let k = 0; k < espessura; k++) corpo.contornar(contorno);
  cam.colar(corpo);
  return x - x0;
}
const larguraTexto = (texto, escala) => [...texto].reduce((s, ch) => { const g = glifo(ch); return s + (g ? (g.w + 1) * escala : 4 * escala); }, 0);

/* ---------- título ---------- */
function tituloPx() {
  const cam = new Camada(200, 60);
  const t1 = 'CURUPIRA', e1 = 3, w1 = larguraTexto(t1, e1), x1 = Math.round((200 - w1) / 2);
  const rampa = [PM.fogo5, PM.fogo4, PM.fogo4, PM.fogo3, PM.fogo3, PM.fogo2, PM.fogo2, PM.fogo1];
  // sombra deslocada, depois o texto com degradê de fogo em faixas e contorno duplo
  const sombra = new Camada(200, 60);
  escreverPx(sombra, t1, x1 + 2, 6, e1, () => PM.fogoO, PM.fogoO, 2);
  cam.colar(sombra);
  escreverPx(cam, t1, x1, 4, e1, (x, y) => rampa[clamp(Math.floor(y / 3), 0, rampa.length - 1)], PM.fogoO, 2);
  // brilho na borda de cima de cada letra
  for (const [x, y] of [...cam.pixels()]) if (cam.get(x, y) === PM.fogo5 && cam.get(x, y - 1) === PM.fogoO) cam.set(x, y, PM.fogo6);
  const t2 = 'O Protetor da Floresta', w2 = larguraTexto(t2, 1);
  escreverPx(cam, t2, Math.round((200 - w2) / 2), 37, 1, () => PM.verdeLL, PM.verdeO, 1);
  return cam;
}

/* ---------- botões e painéis (9 fatias) ----------
   16×12 px de arte: borda de madeira, miolo plano; a sombra embaixo dá volume. */
function caixaUi(w, h, { fundo, borda, luz, sombra, contorno, cantos = true }) {
  const cam = new Camada(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const canto = cantos && (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
    if (canto) continue;
    const bordaExt = x === 0 || y === 0 || x === w - 1 || y === h - 1;
    const bordaInt = x === 1 || y === 1 || x === w - 2 || y === h - 2;
    let cor = fundo;
    if (bordaExt) cor = contorno;
    else if (bordaInt) cor = y === h - 2 ? sombra : y === 1 ? luz : borda;
    cam.set(x, y, cor);
  }
  return cam;
}
const ESTILOS_UI = {
  normal: { fundo: '#2C3A2A', borda: '#6B3A20', luz: '#A86A38', sombra: '#3A1C10', contorno: '#160E12' },
  foco: { fundo: '#B8401A', borda: '#FFA82A', luz: '#FFD84A', sombra: '#A81A14', contorno: '#5C0F24' },
  hover: { fundo: '#3E6A2C', borda: '#86B83C', luz: '#C6E070', sombra: '#2C6A2C', contorno: '#0E1E2A' },
  apertado: { fundo: '#8A2A10', borda: '#E8360E', luz: '#FF6F1A', sombra: '#5C0F24', contorno: '#3A0C18' },
  desabilitado: { fundo: '#33363A', borda: '#55585C', luz: '#6E7276', sombra: '#26282C', contorno: '#141518' },
  painel: { fundo: '#1A2620', borda: '#4A3426', luz: '#6B4A2E', sombra: '#2A1E1A', contorno: '#0C1210' }
};
// amplia uma camada n vezes (para o StyleBoxTexture usar a imagem no tamanho da tela)
function ampliarTela(origem, n) {
  const tela = document.createElement('canvas'); tela.width = origem.width * n; tela.height = origem.height * n;
  const ctx = tela.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(origem, 0, 0, tela.width, tela.height);
  return tela;
}
const ampliarCamada = (cam, n) => ampliarTela(cam.paraTela(), n);

function exportarMenu() {
  exportarFonte();
  saida.ui = {};
  // título recortado no que foi pintado, já ampliado 4×
  const r = tituloPx().recorte();
  saida.ui.titulo = { png: png(ampliarTela(r.tela, 4)), tamanho: [r.tela.width * 4, r.tela.height * 4] };
  for (const [nome, estilo] of Object.entries(ESTILOS_UI)) {
    const cam = caixaUi(16, 12, estilo);
    if (nome === 'foco') { cam.set(2, 2, PM.fogo6); cam.set(13, 2, PM.fogo6); }
    saida.ui['botao_' + nome] = { png: png(ampliarCamada(cam, 4)), tamanho: [64, 48], margem: 12 };
  }
  // fundo dos menus: a floresta desenhada à mão, 8 quadros (vaga-lumes e samambaias mexendo)
  saida.arenas.menu = {
    fps: 4, fundo: Array.from({ length: 8 }, (_, k) => png(florestaPixel(k * 0.5).paraTela())),
    frente: null, chao_y: 220, curupira_x: 110
  };
}
