/* desenho.js — o Curupira desenhado direto em pixels (sem converter SVG).
   As poses de curupira.js dão só o esqueleto (quadril, ombros, mãos, pés, cabeça); cabeça, rosto, fogo,
   tronco, saia, mãos, pés e tiros são desenhados pixel a pixel aqui. Resolução base 480×270 (×4 = 1920×1080). */

const MAO_BASE = [480, 270];
const SM = 480 / 1920 * ALTURA_CURUPIRA_JOGO / ALTURA_CURUPIRA_LOCAL;   // px por unidade do desenho (0,27)

/* Paleta: rampas com sombra puxando para o roxo e luz para o amarelo. Cada material tem o contorno dele. */
const PM = {
  peleO: '#3A1A2C', peleD: '#6A2E30', peleS: '#93512F', pele: '#B7743E', peleL: '#D99A58', peleLL: '#F2C47C',
  fogoO: '#5C0F24', fogo1: '#A81A14', fogo2: '#E8360E', fogo3: '#FF6F1A', fogo4: '#FFA82A', fogo5: '#FFD84A', fogo6: '#FFF6BF',
  verdeO: '#0E1E2A', verdeD: '#163A32', verde: '#2C6A2C', verdeM: '#4E8C33', verdeL: '#86B83C', verdeLL: '#C6E070',
  olhoO: '#1E0E16', branco: '#FFF6E8', iris: '#2C8A3A', irisL: '#86D04A', boca: '#5A1020', lingua: '#E0575A', rubor: '#D4604A',
  cabeloO: '#3A0C18', cabeloD: '#7A1822', cabelo: '#B02A28', cabeloL: '#DC4A36', cabeloLL: '#FF8C60',
  pintura: '#C8261B', corda: '#6B3A20', cordaL: '#A86A38', sobr: '#3A160A', agua: '#8CD0EE', aguaD: '#2F6FA8', fumaca: '#8E98AC', fumacaL: '#C3CBD8'
};

/* ---------- camada de pixels ----------
   Cada pixel guarda o número da cor numa tabela global (0 = vazio). Assim criar camadas é barato,
   e get() continua devolvendo o hex para comparar cores. */
const CORES_LISTA = [null], CORES_ID = new Map(), CORES_RGB = [null];
function idCor(cor) {
  let i = CORES_ID.get(cor);
  if (i === undefined) { i = CORES_LISTA.length; CORES_LISTA.push(cor); CORES_RGB.push(hexRgb(cor)); CORES_ID.set(cor, i); }
  return i;
}
// enquanto MODO_AVISO estiver ligado, o que se pinta fica marcado como inofensivo (aviso, sombra, poeira):
// a arena jogável usa essa marca para não contar golpe em cima de telegrafo
let MODO_AVISO = false;
function aviso(fn) { const antes = MODO_AVISO; MODO_AVISO = true; try { return fn(); } finally { MODO_AVISO = antes; } }
const inofensivo = fn => (...a) => aviso(() => fn(...a));
class Camada {
  constructor(W, H) { this.W = W; this.H = H; this.c = new Uint16Array(W * H); this.x0 = W; this.y0 = H; this.x1 = -1; this.y1 = -1; }
  setI(x, y, i, seg = MODO_AVISO) {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H || !i) return;
    const k = y * this.W + x;
    this.c[k] = i;
    if (seg) (this.seguro || (this.seguro = new Uint8Array(this.W * this.H)))[k] = 1;
    else if (this.seguro) this.seguro[k] = 0;
    // caixa do que já foi pintado: contorno, sombra e colagem só percorrem essa área
    if (x < this.x0) this.x0 = x; if (x > this.x1) this.x1 = x; if (y < this.y0) this.y0 = y; if (y > this.y1) this.y1 = y;
  }
  set(x, y, cor) { if (cor) this.setI(Math.floor(x), Math.floor(y), idCor(cor)); }
  apagar(x, y) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.W && y < this.H) this.c[y * this.W + x] = 0; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H ? CORES_LISTA[this.c[y * this.W + x]] : null; }
  *pixels(margem = 0) {
    const ya = Math.max(0, this.y0 - margem), yb = Math.min(this.H - 1, this.y1 + margem);
    const xa = Math.max(0, this.x0 - margem), xb = Math.min(this.W - 1, this.x1 + margem);
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) yield [x, y];
  }
  // desenho em texto: cada letra é uma cor do mapa, '.' não pinta
  carimbo(linhas, x0, y0, mapa, espelho = false) {
    const w = Math.max(...linhas.map(l => l.length));
    linhas.forEach((l, y) => [...l].forEach((ch, x) => { if (mapa[ch]) this.set(x0 + (espelho ? w - 1 - x : x), y0 + y, mapa[ch]); }));
  }
  // linha grossa: pinta todo pixel cujo centro fica a menos de w/2 do traço
  traco(pts, w, cor) {
    const r2 = (w / 2) ** 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 3));
      for (let k = 0; k <= n; k++) {
        const px = a.x + (b.x - a.x) * k / n, py = a.y + (b.y - a.y) * k / n;
        for (let y = Math.floor(py - w); y <= py + w; y++) for (let x = Math.floor(px - w); x <= px + w; x++) {
          if ((x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2 <= r2) this.set(x, y, cor);
        }
      }
    }
    return this;
  }
  disco(cx, cy, r, cor) {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, cor);
    }
    return this;
  }
  // contorno de 1 px por fora (vizinhança de 4)
  contornar(cor) {
    const novos = [];
    for (const [x, y] of this.pixels(1)) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) novos.push([x, y]);
    }
    for (const [x, y] of novos) this.set(x, y, cor);
    return this;
  }
  // luz de cima-frente: borda de baixo/trás escurece, borda de cima/frente clareia (só na cor base)
  sombrear(base, escura, clara) {
    const muda = [];
    for (const [x, y] of this.pixels()) {
      if (this.get(x, y) !== base) continue;
      if (!this.get(x, y + 1) || !this.get(x - 1, y)) muda.push([x, y, escura]);
      else if (clara && (!this.get(x, y - 1) || !this.get(x + 1, y)) && this.get(x, y + 2) && this.get(x - 2, y)) muda.push([x, y, clara]);
    }
    for (const [x, y, c] of muda) this.set(x, y, c);
    return this;
  }
  colar(outra, dx = 0, dy = 0) {
    for (const [x, y] of outra.pixels()) { const k = y * outra.W + x, i = outra.c[k]; if (i) this.setI(x + dx, y + dy, i, MODO_AVISO || (outra.seguro ? outra.seguro[k] === 1 : false)); }
    return this;
  }
  paraTela() {
    const tela = document.createElement('canvas');
    tela.width = this.W; tela.height = this.H;
    if (this.x1 < 0) return tela;
    const ctx = tela.getContext('2d'), im = ctx.createImageData(this.W, this.H);
    for (const [x, y] of this.pixels()) {
      const i = this.c[y * this.W + x];
      if (i) im.data.set([...CORES_RGB[i], 255], (y * this.W + x) * 4);
    }
    ctx.putImageData(im, 0, 0);
    return tela;
  }
  // só a área pintada, com a posição dela (para guardar quadros grandes sem gastar memória)
  recorte() {
    if (this.x1 < 0) return { tela: document.createElement('canvas'), x: 0, y: 0 };
    const w = this.x1 - this.x0 + 1, h = this.y1 - this.y0 + 1;
    const tela = document.createElement('canvas'); tela.width = w; tela.height = h;
    const ctx = tela.getContext('2d'), im = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = this.c[(y + this.y0) * this.W + x + this.x0];
      if (i) im.data.set([...CORES_RGB[i], 255], (y * w + x) * 4);
    }
    ctx.putImageData(im, 0, 0);
    return { tela, x: this.x0, y: this.y0 };
  }
}

/* ---------- peças em texto ---------- */
// cabeça de 3/4 olhando para a direita, 19×18: crânio redondo, nariz de 1 px e queixo recuando para a nuca
const CABECA = [
  '.......SSSSS.......',
  '.....SSSSSSSSS.....',
  '....SSSSSSSSSSS....',
  '...SSSSSSSSSSSLS...',
  '..dSSSSSSSSSSSSLS..',
  '..dSSSSSSSSSSSSSS..',
  '.ddSSSSSSSSSSSSSSS.',
  '.ddSSSSSSSSSSSSSSS.',
  '.ddSSSSSSSSSSSSSSSS',
  'DddSSSSSSSSSSSSSSSS',
  'DddSSSSSSSSSSSSSSSSS',
  'DddSSSSSSSSSSSSSSSS',
  '.DdSSSSSSSSSSSSSSSS',
  '..DdSSSSSSSSSSSSSSd',
  '...DdSSSSSSSSSSSSd.',
  '....DddSSSSSSSSSd..',
  '......DDddSSSSSd...',
  '........DDDdddD....'
];
const ORELHA = [
  '.SS.',
  'SddS',
  'SdeS',
  '.SdS',
  '..S.'
];
const MAPA_PELE = { S: PM.pele, d: PM.peleS, D: PM.peleD, L: PM.peleL, e: PM.peleD, r: PM.pintura };
const MAPA_SAIA = { G: PM.verdeM, g: PM.verde, l: PM.verdeL };
const PUNHO = ['.SS.', 'SSSL', 'dSSS', '.dd.'];
const PALMA = ['S.S.', 'SSSS', 'SSSL', 'dSSS', '.dd.'];

/* olhos e bocas (a letra o é o traço escuro do rosto) */
const MAPA_OLHO = { o: PM.olhoO, W: PM.branco, G: PM.iris, g: PM.irisL, P: PM.olhoO, h: PM.branco, S: PM.pele };
const OLHOS = {
  aberto:     { perto: ['ooooo', 'WWgGG', 'WWGhP', 'WWGPP', '.WGG.'], longe: ['oooo', 'WgGG', 'WGhP', 'WGPP', '.GG.'] },
  pequena:    { perto: ['ooooo', 'WWWWW', 'WWWPW', 'WWWWW', '.WWW.'], longe: ['oooo', 'WWWW', 'WWPW', 'WWWW', '.WW.'] },
  feliz:      { perto: ['.....', '.ooo.', 'o...o', '.....', '.....'], longe: ['....', '.oo.', 'o..o', '....', '....'] },
  apertado:   { perto: ['.....', 'oo...', '..ooo', 'oo...', '.....'], longe: ['....', '..oo', 'oo..', '..oo', '....'] },
  espiral:    { perto: ['o...o', '.o.o.', '..o..', '.o.o.', 'o...o'], longe: ['o..o', '.oo.', '.oo.', 'o..o', '....'] },
  fechado:    { perto: ['.....', '.....', '.....', 'ooooo', '.....'], longe: ['....', '....', '....', 'oooo', '....'] }
};
const MAPA_BOCA = { o: PM.olhoO, M: PM.boca, T: PM.lingua, W: PM.branco };
const BOCAS = {
  oba:        ['oooooo', '.MMMMo', '.oTTo.'],
  risada:     ['oooooo', 'oWWWWo', 'oMTTMo', '.oooo.'],
  dentes:     ['oooooo', 'oWWWWo', 'oooooo'],
  grito:      ['.oooo.', 'oMMMMo', 'oMMMMo', 'oMTTMo', '.oooo.'],
  firme:      ['......', '.oooo.'],
  convencido: ['.....o', '.oooo.'],
  o:          ['.oo.', 'oMMo', '.oo.'],
  medo:       ['oooooo', 'oWoWoW', 'oooooo'],
  dor:        ['o.o.o.', '.o.o.o'],
  triste:     ['.oooo.', 'o....o'],
  tonto:      ['.o.o.', 'o.o.o']
};

/* ---------- cabelo ----------
   Cabelo vermelho comum (não é fogo): touca que segue o crânio, mechas espetadas para trás e franja.
   As mechas balançam com o corpo e deitam com o vento da corrida e do pulo. */
const TOPO_CABECA = [...CABECA[0]].map((_, x) => CABECA.findIndex(l => l[x] !== '.'));
// mecha: ponta afinando a partir da base, com ângulo em graus (0 = frente, 90 = baixo, 180 = trás, 270 = cima)
function mecha(cam, bx, by, ang, h, w, cor, cai = 0) {
  const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), n = Math.ceil(h * 4);
  for (let i = 0; i <= n; i++) {
    const u = i / n, cx = bx + dx * h * u, cy = by + dy * h * u + cai * u * u, hw = w * (1 - u) + 0.35;
    for (let y = Math.floor(cy - hw); y <= cy + hw; y++) for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= hw * hw) cam.set(x, y, cor);
    }
  }
}
const MECHAS = [   // coluna da base, ângulo, comprimento, largura, queda
  [2, 196, 5, 2.2, 1.2], [4, 214, 5.5, 2.4, 0.8], [7, 230, 6.5, 2.5, 0.4], [10, 244, 6.5, 2.5, 0], [13, 258, 5, 2.2, 0], [16, 272, 3.5, 1.8, 0]
];
function cabeloPx(cam, hx, hy, t, vento, agita = 1) {
  const vx = vento ? vento[0] : 0, vy = vento ? vento[1] : -0.8;
  const cab = new Camada(cam.W, cam.H), largura = CABECA[0].length;
  // touca: do alto do crânio até a testa na frente e até perto da orelha na nuca
  for (let x = 0; x < largura; x++) {
    const topo = TOPO_CABECA[x];
    if (topo < 0) continue;
    const fim = x < 6 ? Math.round(10.5 - x * 1.0) : x < 12 ? 5 : 4 + (x === 14 || x === 17 ? 1 : 0);
    for (let y = topo - 1; y <= fim; y++) cab.set(hx + x, hy + y, PM.cabelo);
  }
  // mechas: deitam para trás com vento contra (corrida) e levantam quando cai
  const sobe = clamp(-(vy + 0.8), -1, 2);
  MECHAS.forEach(([bx, ang, h, w, cai], k) => {
    const bal = Math.sin(t * 6 * agita + k * 1.3) * 5 * agita;
    const a = ang + vx * 12 + bal + sobe * 9 * (ang < 270 ? 1 : -1);
    mecha(cab, hx + bx + 0.5, hy + TOPO_CABECA[bx] + 0.5, a, h * (1 + Math.abs(vx) * 0.08), w, PM.cabelo, cai * (1 - sobe * 0.5));
  });
  // franja: duas pontinhas caindo na testa
  mecha(cab, hx + 14.5, hy + 4, 95, 2.2, 1.2, PM.cabelo);
  mecha(cab, hx + 17.5, hy + 3.5, 80, 2, 1.1, PM.cabelo);
  // luz de cima, sombra embaixo e na nuca, faixa de brilho no alto da cabeça
  const muda = [];
  for (const [x, y] of cab.pixels()) {
    if (!cab.get(x, y)) continue;
    if (!cab.get(x, y + 1) || !cab.get(x - 1, y)) muda.push([x, y, PM.cabeloD]);
    else if (!cab.get(x, y - 1)) muda.push([x, y, PM.cabeloL]);
  }
  for (const [x, y, c] of muda) cab.set(x, y, c);
  for (let x = 8; x <= 12; x++) { const y = hy + TOPO_CABECA[x] + 1; if (cab.get(hx + x, y) === PM.cabelo) cab.set(hx + x, y, PM.cabeloLL); }
  cam.colar(cab.contornar(PM.cabeloO));
}

/* ---------- cabelo pegando fogo (só no especial) ----------
   Sete labaredas nascem no alto do cabelo e deitam para trás. Cada uma tem núcleo amarelo,
   meio laranja e borda vermelha, com contorno vinho. intensidade 0..1 faz o fogo crescer e apagar. */
const RAMPA_FOGO = [PM.fogo1, PM.fogo2, PM.fogo3, PM.fogo4, PM.fogo5, PM.fogo6];
function cabeloFogo(cam, hx, hy, t, fogo, vento, intensidade = 1) {
  const tom = fogo.cores ? (fogo.cores[0] === '#B8400F' ? -1 : 1) : 0;
  const cor = n => RAMPA_FOGO[Math.max(0, Math.min(5, n + tom))];
  const vx = vento ? vento[0] : 0, vy = vento ? vento[1] : -0.8;
  const alturas = E5.alturas, ordem = [0, 6, 1, 5, 2, 4, 3];
  const pontas = [];
  for (const k of ordem) {
    const parte = new Camada(cam.W, cam.H);
    const col = Math.round(1 + k * 2.7), bx = hx + col + 0.5, by = hy + TOPO_CABECA[col] + 1;
    const h = 8 * alturas[k] * fogo.alt * intensidade * (1 + 0.12 * Math.sin(t * 9 * fogo.vel + k * 1.9)) * (vy < -1 ? 1.15 : 1);
    if (h < 1.5) continue;
    const deita = -h * 0.18 + vx * 0.32 * h + (k - 3) * 0.09 * h;
    const balanco = Math.sin(t * 8 * fogo.vel + k * 2.3) * 1.1 * fogo.amp;
    const larg = (2.8 - Math.abs(k - 3) * 0.15) * Math.min(1, 0.5 + intensidade * 0.5);
    for (let y = Math.floor(by - h); y <= by; y++) {
      const u = (by - (y + 0.5)) / h;
      if (u < 0 || u > 1) continue;
      const cx = bx + deita * Math.pow(u, 1.4) + balanco * u * u, hw = larg * Math.pow(1 - u, 0.75) + 0.2;
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
        const d = Math.abs(x + 0.5 - cx) / hw;
        if (d > 1) continue;
        parte.set(x, y, d < 0.45 && u < 0.45 ? cor(4) : d < 0.8 && u < 0.75 ? cor(3) : cor(2));
      }
    }
    cam.colar(parte.contornar(PM.fogoO));
    pontas[k] = { x: bx + deita + balanco, y: by - h };
  }
  return pontas.filter(Boolean);
}

/* ---------- rosto ---------- */
function rostoPixel(cam, hx, hy, ex, t, piscando, olharExtra) {
  const tremer = ex.tremer ? Math.round(Math.sin(t * 70)) : 0;
  let tipo = ex.olho === 'arregalado' ? (ex.pupila < 0.6 ? 'pequena' : 'aberto') : ex.olho;
  if (tipo === 'aberto' && ex.pupila < 0.6) tipo = 'pequena';
  if (piscando && !['feliz', 'apertado', 'espiral'].includes(tipo)) tipo = 'fechado';
  const O = OLHOS[tipo] || OLHOS.aberto;
  const sobe = ex.olho === 'arregalado' ? -1 : 0;
  const olhar = Math.round((ex.olhar || 0) + (olharExtra || 0));
  const xs = [hx + 7, hy + 7 + sobe], xl = [hx + 13, hy + 7 + sobe];
  const desenharOlho = (linhas, x, y) => {
    let l = linhas.slice();
    // pálpebra baixa (bravo, convencido): a linha de cima desce
    if (ex.sup > 0.2 && !['feliz', 'apertado', 'espiral', 'fechado'].includes(tipo)) l = ['.'.repeat(l[0].length), l[0], ...l.slice(2)];
    if (olhar < 0) l = l.map(r => r.replace(/G/g, 'x').replace(/W/, 'G').replace(/x/, 'W'));
    cam.carimbo(l, x + tremer, y, MAPA_OLHO);
  };
  desenharOlho(O.perto, ...xs);
  desenharOlho(O.longe, ...xl);
  // sobrancelhas: ângulo positivo = canto de dentro mais baixo (bravo)
  const a = ex.sob.ang, dy = Math.round(-ex.sob.dy * 20) * -1;
  const inc = a > 10 ? 1 : a < -10 ? -1 : 0, grossa = ex.sob.grossa > 1.2;
  const by = hy + 6 + sobe + dy;
  for (let i = 0; i < 5; i++) {
    const y = by - (inc > 0 ? (i < 3 ? 1 : 0) : inc < 0 ? (i < 2 ? 0 : 1) : 0);
    cam.set(hx + 7 + i, y, PM.sobr);
    if (grossa) cam.set(hx + 7 + i, y + 1, PM.sobr);
  }
  for (let i = 0; i < 4; i++) {
    const y = by - (inc > 0 ? (i < 1 ? 0 : 1) : inc < 0 ? (i < 2 ? 1 : 0) : 0);
    cam.set(hx + 13 + i, y, PM.sobr);
    if (grossa) cam.set(hx + 13 + i, y + 1, PM.sobr);
  }
  // bochechas
  if (ex.rubor || tipo !== 'espiral') {
    cam.set(hx + 6, hy + 12, PM.rubor); cam.set(hx + 7, hy + 12, PM.rubor);
    cam.set(hx + 17, hy + 12, PM.rubor);
  }
  // nariz: um pixel de sombra na ponta
  cam.set(hx + 18, hy + 11, PM.peleS);
  const B = BOCAS[ex.boca] || BOCAS.oba;
  cam.carimbo(B, hx + 10 + (B[0].length < 6 ? 1 : 0), hy + 13, MAPA_BOCA);
  // extras
  if (ex.veia) cam.carimbo(['o.o', '.o.', 'o.o'], hx + 19, hy + 1, { o: PM.fogo1 });
  if (ex.suor) cam.carimbo(['.a', 'aa', 'Aa'], hx + 19, hy + 4 + Math.floor((t * 3) % 2), { a: PM.agua, A: PM.aguaD });
  if (ex.lagrima) cam.carimbo(['a', 'a', 'A'], hx + 8, hy + 12 + Math.floor((t * 2) % 3), { a: PM.agua, A: PM.aguaD });
  if (ex.estrelas) for (let k = 0; k < 3; k++) {
    const ang = t * 3 + k * TAU / 3, x = hx + 10 + Math.round(Math.cos(ang) * 13), y = hy - 4 + Math.round(Math.sin(ang) * 4);
    cam.carimbo(['.y.', 'yYy', '.y.'], x - 1, y - 1, { y: PM.fogo4, Y: PM.fogo6 });
  }
  if (ex.fumaca) for (let k = 0; k < 3; k++) {
    const u = (t * 0.6 + k / 3) % 1, x = hx + 5 + k * 4 - Math.round(u * 4), y = hy - 6 - Math.round(u * 12);
    cam.disco(x, y, 1.2 + u * 1.6, u < 0.5 ? PM.fumacaL : PM.fumaca);
  }
}

/* ---------- corpo: pernas retas, pé virado para trás, tronco de costas retas, saia de folhas ----------
   O desenho escolhido nos rascunhos (art/pixel/rascunhos/curupira_rascunho.js, "moleque da mata"). */
const CORPO = { peito: 4.6, costas: 4.2, coxa: 8.8, canela: 8.3, wCoxa: 5, wCanela: 4 };
const ESTIRA = 2.5;
const pintaSe = (c, x, y, cor, base) => { x = Math.floor(x); y = Math.floor(y); if (c.get(x, y) && (!base || c.get(x, y) === base)) c.set(x, y, cor); };
// joelho por cinemática inversa
function joelhoPx(a, b, L1, L2) {
  const d = Math.min(Math.hypot(b.x - a.x, b.y - a.y), L1 + L2 - 0.01) || 0.01, u = unit(sub(b, a));
  const ang = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)) * 180 / Math.PI;
  const k1 = soma(a, mul(rot(u, ang), L1)), k2 = soma(a, mul(rot(u, -ang), L1));
  // o joelho fica do lado esquerdo de quem anda do quadril para o pé: para a frente com a perna em pé,
  // para cima com o corpo agachado (nunca atravessa o chão)
  const lado = rot(u, -90), s = k => (k.x - a.x) * lado.x + (k.y - a.y) * lado.y;
  return s(k1) >= s(k2) ? k1 : k2;
}
// pé virado para trás: calcanhar redondo na frente (+x), dedos apontando para trás (-x).
// ang > 0 é a ponta do pé descendo (pé no ar), como no rig.
function pePx(c, k, ang, cores) {
  const g = k.y + 2.6, R = (x, y) => soma(k, rot(pt(x, y - 2.6), -ang));
  poli(c, [R(-1.6, -4.6), R(1.4, -4.6), R(2.6, -3.6), R(3.2, -1.8), R(2.6, 0), R(-5.6, 0), R(-5.8, -2.2), R(-3.6, -3.2)], cores.S);
  for (const [dx, dy, rr] of [[-5.6, -1.6, 1.3], [-6.4, -0.9, 1.1], [-4.4, -2.4, 1.2]]) { const p = R(dx, dy); c.disco(p.x, p.y, rr, cores.S); }
  return R;
}
function dedosPx(c, R, cores) {
  for (const [x, y, cor] of [[-4.5, -2.5, cores.d], [-5.5, -1.5, cores.d], [-7.5, -0.5, PM.peleLL], [-6.5, -1.5, PM.peleLL], [-5.5, -2.5, PM.peleLL],
    [2.5, -2.5, cores.L], [2.5, -1.5, cores.L], [-0.5, -3.5, cores.d]]) { const p = R(x, y); pintaSe(c, p.x, p.y, cor); }
}
function pernaPx(cam, quadril, peRig, ang, cores) {
  const c = new Camada(QW, QH), k = soma(peRig, pt(0, -1.2));
  // perna reta: perto da altura normal, coxa e canela somam só um pouco mais que a distância e o
  // joelho quase não dobra; quando o pé chega perto do quadril (agachado, pulo), dobra de verdade
  const L = CORPO.coxa + CORPO.canela, d = Math.hypot(k.x - quadril.x, k.y - quadril.y), r = d / L;
  const kL = r >= 0.85 ? Math.min(1, r * 1.015) : r <= 0.6 ? 1 : mix(1, 0.86, (r - 0.6) / 0.25);
  const joelho = joelhoPx(quadril, k, CORPO.coxa * kL, CORPO.canela * kL);
  c.traco([quadril, joelho], CORPO.wCoxa, cores.S);
  c.traco([joelho, k], CORPO.wCanela, cores.S);
  const R = pePx(c, k, ang, cores);
  c.sombrear(cores.S, cores.d, cores.L);
  dedosPx(c, R, cores);
  cam.colar(c.contornar(PM.peleO));
}
function troncoPx(c, T, H, pescoco) {
  const p = CORPO.peito, k = CORPO.costas;
  // a linha das costas desce reta: sem barriga para a frente nem bunda para trás
  poli(c, [T(-k + 0.4, 1.5), T(-k, -3), T(-k - 0.2, -H * 0.6), T(-k + 0.6, -H + 1.2), T(-k + 2, -H), T(1.5, -H), T(p - 1, -H + 1),
    T(p, -H * 0.72), T(p - 0.4, -H * 0.45), T(p - 1, -H * 0.2), T(p - 0.6, 1.5)], PM.pele);
  c.traco(pescoco, 3.6, PM.pele);
  c.sombrear(PM.pele, PM.peleS, PM.peleL);
  for (let x = 0.2; x <= p - 1.2; x += 0.5) { const m = T(x, -H * 0.55 - (x - p) * 0.12); pintaSe(c, m.x, m.y, PM.peleS, PM.pele); }
  const u = T(p - 1.6, -H * 0.22); pintaSe(c, u.x, u.y, PM.peleS);
}
// seis folhas finas penduradas na corda, compridas e curtas alternadas; o vento (saia) puxa as pontas para trás
function saiaPx(cam, T, t, saia, agita) {
  const n = 6, comp = 5.6, puxa = saia / 10, tras = new Camada(QW, QH), frente = new Camada(QW, QH);
  const Tc = (x, y) => { const q = T(x, y); return pt(q.x, Math.min(q.y, OY)); };
  for (const i of [0, 2, 4, 1, 3, 5]) {
    const u = i / (n - 1), x = mix(-CORPO.costas - 0.6, CORPO.peito + 0.4, u);
    const len = comp * (i % 2 ? 0.62 : 1.08) * (0.9 + 0.2 * hash(i * 3.1 + 7));
    const abre = (u - 0.45) * 4.6 - puxa + Math.sin(t * 7 * agita + i * 1.7) * 0.5 * agita;
    const c = u < 0.3 ? tras : frente, cor = u < 0.3 ? (i % 2 ? PM.verde : PM.verdeD) : (i % 2 ? PM.verdeM : PM.verde);
    poli(c, [Tc(x - 1, -1.6), Tc(x + 1, -1.6), Tc(x + 1.7 + abre * 0.5, len * 0.45), Tc(x + abre, len + 1.8), Tc(x - 1.7 + abre * 0.5, len * 0.45)], cor);
    if (c === frente) for (let s = 0; s < len * 0.8; s += 0.7) { const q = Tc(x + abre * s / len * 0.8, s); if (frente.get(Math.floor(q.x), Math.floor(q.y)) === cor) frente.set(q.x, q.y, PM.verdeL); }
  }
  cam.colar(tras.contornar(PM.verdeO)); cam.colar(frente.contornar(PM.verdeO));
  for (let x = -CORPO.costas - 0.5; x <= CORPO.peito + 0.5; x += 0.5) { const q = T(x, -2); cam.set(q.x, q.y, Math.floor(x * 2) % 3 ? PM.corda : PM.cordaL); }
  const no = T(CORPO.peito - 0.2, -1.4); cam.set(no.x, no.y, PM.cordaL); cam.set(no.x, no.y + 1, PM.corda);
}
// braçadeira de corda no braço da frente, um pouco acima do cotovelo
function bracadeiraPx(c, pts) {
  const m = pts[4], n = unit(rot(sub(pts[5], pts[3]), 90));
  for (let s = -2; s <= 2; s++) { pintaSe(c, m.x + n.x * s, m.y + n.y * s, PM.corda); pintaSe(c, m.x + n.x * s + 0.4, m.y + n.y * s + 1, PM.cordaL); }
}

/* ---------- corpo inteiro ----------
   Devolve a camada do quadro (pés na linha OY), a mão da frente e as pontas do fogo, em pixels. */
const QW = 84, QH = 92, OX = 40, OY = 86;
function curupiraPixel(pose, t, piscando = false, virados = false, exForcada = '') {
  const v = E5, cam = new Camada(QW, QH);
  const q0 = pose.quadril, inc = pose.inclina || 0;
  // pernas mais compridas que as do rig: tudo do quadril para cima sobe ESTIRA px, os pés ficam.
  // Diminui quando o quadril desce (agachado, deitado), para o corpo não flutuar acima do chão.
  const estira = ESTIRA * clamp(-q0.y / 51, 0, 1);
  const P = l => ({ x: OX + l.x * SM, y: OY + l.y * SM - estira });
  const Pe = l => ({ x: OX + l.x * SM, y: OY + l.y * SM });
  const W = d => soma(q0, rot(d, inc));
  // agachado (comprime = 1): o tronco encolhe e a cabeça desce junto, como borracha
  const comp = pose.comprime || 0, Tc = v.tronco * (1 - 0.4 * comp);
  const o = { perto: W(pt(-3, -Tc + 9)), longe: W(pt(-7, -Tc + 8)) };
  const [maoL, maoP] = pose.maos, [peL, peP] = pose.pes;
  const formas = pose.formaMao || ['punho', 'punho'];
  const bl = pose.bracoL || [v.braco, v.braco], cot = pose.cotovelo || [1, 1];
  const ex = exDe(exForcada || pose.ex);
  const rampaTras = { S: PM.peleS, d: PM.peleD, D: PM.peleD, L: PM.pele, e: PM.peleD };

  // membro de mangueira em pixels (braços): mesma curva do rig, traço grosso, sombra embaixo
  const membroPx = (a, b, L, lado, w, cores) => {
    const parte = new Camada(QW, QH);
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 0.01, h = Math.sqrt(Math.max(0, 3 * d * (L - d) / 8));
    const n = pt(-(b.y - a.y) / d, (b.x - a.x) / d), c = soma(lerp(a, b, 0.5), mul(n, 2 * h * lado));
    const pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push(P(pt((1 - u) ** 2 * a.x + 2 * u * (1 - u) * c.x + u * u * b.x, (1 - u) ** 2 * a.y + 2 * u * (1 - u) * c.y + u * u * b.y))); }
    parte.traco(pts, w, cores.S);
    parte.sombrear(cores.S, cores.d, cores.L);
    parte.pts = pts;
    return parte;
  };
  const mao = (parte, c, forma, cores) => {
    const linhas = forma === 'palma' ? PALMA : PUNHO, p = P(c);
    parte.carimbo(linhas, Math.round(p.x - 2), Math.round(p.y - linhas.length / 2), cores);
  };
  const corTras = { S: PM.peleS, d: PM.peleD, L: PM.pele }, corFrente = { S: PM.pele, d: PM.peleS, L: PM.peleL };

  // 1. braço de trás
  let parte = membroPx(o.longe, maoL, bl[0], cot[0], 2.6, corTras);
  mao(parte, maoL, formas[0], rampaTras);
  cam.colar(parte.contornar(PM.peleO));
  // 2. perna de trás e 3. perna da frente (retas, com o pé virado para trás)
  pernaPx(cam, P(W(pt(-3, 0))), Pe(peL.p), peL.ang, corTras);
  pernaPx(cam, P(W(pt(3, 0))), Pe(peP.p), peP.ang, corFrente);
  // 4. tronco de costas retas e pescoço (até a nuca, atrás do queixo)
  const cb = pose.cabeca || {};
  const hcL = W(pt(v.cabecaDx + (cb.dx || 0), -Tc - v.cabeca * 0.7 + (cb.dy || 0)));
  const hc = P(hcL), hx = Math.round(hc.x - 9.5), hy = Math.round(hc.y - 9);
  const q = P(q0), H = Tc * SM, T = (x, y) => soma(q, rot(pt(x, y), inc));
  parte = new Camada(QW, QH);
  troncoPx(parte, T, H, [T(0.9, -H + 0.6), pt(hx + 8.5, hy + 15.5)]);
  cam.colar(parte.contornar(PM.peleO));
  // 5. saia de folhas e corda
  saiaPx(cam, T, t, pose.saia || 0, pose.agita ?? 1);
  // 6. cabeça e orelha
  parte = new Camada(QW, QH);
  parte.carimbo(ORELHA, hx - 2, hy + 8, MAPA_PELE);
  cam.colar(parte.contornar(PM.peleO));
  parte = new Camada(QW, QH);
  parte.carimbo(CABECA, hx, hy, MAPA_PELE);
  cam.colar(parte.contornar(PM.peleO));
  // 7. cabelo (pega fogo só no especial)  8. rosto
  cabeloPx(cam, hx, hy, t, pose.vento || v.vento, pose.agita ?? 1);
  const pontas = pose.chamas > 0.05 ? cabeloFogo(cam, hx, hy, t, ex.fogo, pose.vento || v.vento, pose.chamas) : [];
  rostoPixel(cam, hx, hy, ex, t, piscando, pose.olhar);
  // 9. bola de energia do especial
  if (pose.energia) {
    const c = P(pose.energia.c), r = pose.energia.r * SM * 1.3 + 0.6;
    cam.disco(c.x, c.y, r + 1.2 + Math.sin(t * 40) * 0.4, PM.fogo3);
    cam.disco(c.x, c.y, r, PM.fogo5);
    cam.disco(c.x, c.y, Math.max(0.6, r * 0.5), PM.fogo6);
  }
  // 10. braço da frente
  parte = membroPx(o.perto, maoP, bl[1], cot[1], 2.8, corFrente);
  bracadeiraPx(parte, parte.pts);
  mao(parte, maoP, formas[1], MAPA_PELE);
  cam.colar(parte.contornar(PM.peleO));
  // agachado e deitado, joelho, mão e quadril encostam no chão: nada passa da linha do contorno
  for (let y = OY + 1; y < QH; y++) for (let x = 0; x < QW; x++) cam.apagar(x, y);
  return { cam, mao: P(maoP), pontas };
}

/* Busto de frente para os rostos: a mesma cabeça, sem corpo, numa camada pequena */
function rostoQuadro(nome, t, piscando = false) {
  const cam = new Camada(34, 34), ex = exDe(nome);
  const hx = 7, hy = 12;
  let parte = new Camada(34, 34);
  parte.carimbo(['..SSSSSSSSSS..', '.SSSSrSSSSrSS.', 'SSSSSSrSSSSrSS', 'SSSSSSSSSSSSSS'], hx + 2, hy + 17, MAPA_PELE);
  cam.colar(parte.contornar(PM.peleO));
  parte = new Camada(34, 34);
  parte.carimbo(ORELHA, hx - 2, hy + 8, MAPA_PELE);
  cam.colar(parte.contornar(PM.peleO));
  parte = new Camada(34, 34);
  parte.carimbo(CABECA, hx, hy, MAPA_PELE);
  cam.colar(parte.contornar(PM.peleO));
  cabeloPx(cam, hx, hy, t, E5.vento, 0.6);
  if (nome === 'furioso') cabeloFogo(cam, hx, hy, t, ex.fogo, E5.vento, 0.8);
  rostoPixel(cam, hx, hy, ex, t, piscando, 0);
  return cam;
}

/* ---------- tiros ---------- */
function folhaPixel(t) {
  const cam = new Camada(14, 7);
  const f = Math.floor(t * 20) % 2;
  cam.carimbo(f ? ['....GG.', '..lGGGG', '.lGGGGG', '..gGGg.'] : ['...GG..', '.lGGGG.', 'lGGGGGG', '.gGGGg.'], 6, 1, MAPA_SAIA);
  const parte = new Camada(14, 7);
  parte.colar(cam);
  parte.contornar(PM.verdeO);
  parte.set(1, 3, PM.verdeLL); parte.set(2, 3, PM.verdeLL); parte.set(3, 4, PM.verdeL);
  return parte;
}
// folha na direção do tiro, numa camada 15×15 com o centro em (7, 7).
// 0 = frente, -90 = cima, 90 = baixo, ±45 = diagonais (a diagonal tem desenho próprio, sem girar pixel)
function folhaDirecao(ang, t) {
  const cam = new Camada(15, 15), f = Math.floor(t * 20) % 2;
  if (ang === 0 || Math.abs(ang) === 90) {
    const h = folhaPixel(t);
    for (const [x, y] of h.pixels()) {
      const c = h.get(x, y);
      if (ang === 0) cam.set(x, y + 4, c);
      else if (ang < 0) cam.set(y + 4, 14 - x, c);
      else cam.set(y + 4, x, c);
    }
    return cam;
  }
  // diagonal: oval pontudo ao longo do eixo de 45°, nervura clara no meio, rastro atrás
  const corpo = new Camada(15, 15), ax = Math.SQRT1_2, ay = -Math.SQRT1_2, cx = 8.5, cy = 6.5;
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = dx * ax + dy * ay, v = -dx * ay + dy * ax;
    const meia = 2.4 * Math.sqrt(Math.max(0, 1 - (u / 4.9) ** 2)) * (u > 0 ? 1 - u / 7 : 1) * (f ? 0.9 : 1);
    if (Math.abs(v) > meia) continue;
    corpo.set(x, y, Math.abs(v) < 0.6 && u > -3.5 && u < 2.5 ? PM.verdeL : v < 0 ? PM.verdeM : PM.verde);
  }
  corpo.contornar(PM.verdeO);
  for (const [x, y, c] of [[3, 11, PM.verdeLL], [2, 12, PM.verdeLL], [4, 10, PM.verdeL]]) corpo.set(x, y, c);
  if (ang < 0) return corpo;
  for (const [x, y] of corpo.pixels()) cam.set(x, 14 - y, corpo.get(x, y));
  return cam;
}

// cabeça de onça feita de energia, olhando para a direita, boca aberta no rugido
function oncaPixel(t) {
  const cam = new Camada(24, 20);
  const pisca = Math.floor(t * 16) % 2;
  const corpo = new Camada(24, 20);
  corpo.disco(10, 10, 7.2, PM.fogo4);
  corpo.disco(15.5, 12, 4.2, PM.fogo4);
  corpo.disco(5.5, 3.8, 2.4, PM.fogo4); corpo.disco(12.5, 3.4, 2.4, PM.fogo4);
  corpo.disco(9, 8.5, 4.5, PM.fogo5); corpo.disco(8.5, 7.5, 2, PM.fogo6);
  corpo.contornar(pisca ? PM.fogo2 : PM.fogo1);
  cam.colar(corpo);
  cam.carimbo(['o', 'o'], 5, 3, { o: PM.fogo2 }); cam.carimbo(['o', 'o'], 12, 3, { o: PM.fogo2 });
  // boca, dentes, nariz e olho bravo
  cam.carimbo(['MMMM.', 'WMMMM', '.MMMW', '..MM.'], 15, 12, { M: PM.fogo1, W: PM.fogo6 });
  cam.carimbo(['NN'], 18, 9, { N: PM.fogoO });
  cam.carimbo(['oo.', 'WPo'], 11, 7, { o: PM.fogoO, W: PM.fogo6, P: PM.fogoO });
  for (const [x, y] of [[5, 9], [7, 13], [4, 12], [9, 15], [6, 6]]) { cam.set(x, y, PM.fogo2); cam.set(x + 1, y, PM.fogo2); }
  // rastro
  for (let k = 0; k < 3; k++) { const y = 6 + k * 4 + pisca; cam.set(0, y, PM.fogo5); cam.set(1, y, PM.fogo4); }
  return cam;
}

/* ---------- cenário desenhado: floresta ao amanhecer, 480×270 ----------
   Céu em faixas (sem degradê liso), três camadas de copa cada vez mais escuras e frias,
   troncos de sapopema, chão em camadas com grama e pedras, samambaias na frente. */
function florestaPixel(t) {
  const [W, H] = MAO_BASE, CH = 220, cam = new Camada(W, H);
  const ceu = ['#2B3A55', '#344A62', '#40606E', '#587A78', '#7D9478', '#AEA670', '#DDB466', '#F2C47C'];
  for (let y = 0; y < CH; y++) {
    const f = Math.min(ceu.length - 1, Math.floor(y / 150 * ceu.length));
    for (let x = 0; x < W; x++) cam.set(x, y, ceu[f]);
  }
  // sol baixo atrás das copas
  cam.disco(330, 128, 20, '#FFE7A8'); cam.disco(330, 128, 15, '#FFF3CF');
  const copa = (base, alt, passo, raio, cor, clara, semente) => {
    const parte = new Camada(W, H);
    for (let k = -1; k * passo < W + passo; k++) {
      const h = hash(k + semente), x = k * passo + h * passo * 0.5, r = raio * (0.75 + h * 0.5);
      parte.disco(x, base - alt * h, r, cor);
    }
    for (let y = base; y < H; y++) for (let x = 0; x < W; x++) parte.set(x, y, cor);
    // luz na borda de cima das copas
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) if (parte.get(x, y) === cor && !parte.get(x, y - 1) && hash(x * 7 + y) > 0.3) parte.set(x, y, clara);
    cam.colar(parte);
  };
  copa(160, 30, 46, 26, '#56786A', '#6E9078', 1);
  // troncos distantes
  for (const [x, w] of [[60, 8], [170, 6], [255, 10], [400, 7]]) for (let y = 120; y < CH; y++) for (let i = 0; i < w; i++) cam.set(x + i, y, i < 2 ? '#3E5E54' : '#46685C');
  copa(185, 34, 38, 24, '#2F5444', '#3E6A50', 7);
  // sapopemas: troncos grandes com raízes em aleta
  const tronco = (x0, w, lado) => {
    const parte = new Camada(W, H);
    for (let y = 0; y < CH + 2; y++) {
      const aba = y > CH - 40 ? Math.round(((y - (CH - 40)) / 40) ** 2 * 22) : 0;
      for (let x = x0 - (lado < 0 ? aba : 0); x < x0 + w + (lado > 0 ? aba : 0); x++) {
        const casca = (x - x0) % 5 === 0 && hash(y * 3 + x) > 0.35;
        parte.set(x, y, casca ? '#2A1E1A' : x < x0 + 3 ? '#4A3426' : x > x0 + w - 4 ? '#2E2220' : '#3A2A22');
      }
    }
    cam.colar(parte.contornar('#160E12'));
  };
  tronco(28, 22, 1); tronco(436, 26, -1);
  copa(206, 18, 30, 16, '#1E3A32', '#28503C', 13);
  // cipós
  for (const [x0, x1, y] of [[10, 120, 40], [360, 470, 60]]) {
    for (let x = x0; x <= x1; x++) { const u = (x - x0) / (x1 - x0), y2 = Math.round(y + Math.sin(u * Math.PI) * 26); cam.set(x, y2, '#2C4A22'); if (x % 9 === 0) cam.carimbo(['GG', '.G'], x, y2 + 1, { G: '#4E8C33' }); }
  }
  // chão: grama, terra em camadas, pedras
  for (let x = 0; x < W; x++) {
    const tufo = hash(x * 1.3) > 0.82 ? 1 + Math.floor(hash(x) * 2) : 0;
    for (let y = CH - tufo; y < H; y++) {
      const d = y - CH;
      let cor = d < 1 ? '#C6E070' : d < 3 ? '#86B83C' : d < 5 ? '#4E8C33' : d < 6 ? '#2C6A2C' : d < 20 ? '#8A5A34' : d < 34 ? '#6E4428' : '#5E3A2A';
      if (d >= 8 && d < 19 && hash(Math.floor(x / 2) * 0.37 + Math.floor(y / 2) * 11.1) > 0.97) cor = '#B5844A';
      if (d >= 22 && hash(Math.floor(x / 3) * 0.71 + Math.floor(y / 2) * 5.3) > 0.95) cor = '#3A2324';
      if (d === 19 || d === 33) cor = hash(x * 0.13) > 0.5 ? '#5E3A2A' : cor;
      cam.set(x, y, cor);
    }
  }
  for (const [x, y, w] of [[90, 236, 9], [300, 250, 13], [420, 240, 7]]) {
    const parte = new Camada(W, H);
    for (let i = 0; i < w; i++) for (let j = 0; j < w / 2; j++) if (Math.hypot((i - w / 2 + 0.5) / (w / 2), (j - w / 4) / (w / 4 + 0.5)) < 1) parte.set(x + i, y + j, j < 2 ? '#C3CBD8' : '#8E98AC');
    cam.colar(parte.contornar('#343A50'));
  }
  // samambaias na frente, balançando devagar
  const samambaia = (x0, lado) => {
    for (let f = 0; f < 5; f++) {
      const ang = (-60 + f * 22) * Math.PI / 180, bal = Math.sin(t * 1.5 + f) * 0.06;
      for (let k = 0; k < 34; k++) {
        const u = k / 34, a = ang + bal + u * 0.5 * lado;
        const x = x0 + lado * Math.cos(a) * k * 1.4, y = H - 2 + Math.sin(a) * k * 1.4 * -1;
        cam.set(x, y, '#0E1E2A'); cam.set(x, y + 1, '#0E1E2A');
        if (k % 3 === 0 && k > 4) { cam.set(x + lado * 1, y - 2, '#163A32'); cam.set(x - lado * 1, y + 2, '#163A32'); }
      }
    }
  };
  samambaia(-6, 1); samambaia(486, -1);
  // vaga-lumes
  for (let k = 0; k < 9; k++) {
    const x = Math.round(40 + hash(k) * 400 + Math.sin(t * 0.7 + k) * 8), y = Math.round(90 + hash(k + 9) * 100 + Math.cos(t * 0.9 + k * 2) * 6);
    if (Math.sin(t * 2.3 + k * 1.7) > -0.2) { cam.set(x, y, '#FFF6BF'); if (Math.sin(t * 2.3 + k * 1.7) > 0.6) { cam.set(x + 1, y, '#C6E070'); cam.set(x - 1, y, '#C6E070'); cam.set(x, y - 1, '#C6E070'); cam.set(x, y + 1, '#C6E070'); } }
  }
  return cam;
}
