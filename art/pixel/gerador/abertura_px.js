/* abertura_px.js — as quatro cenas de abertura (Novo Jogo, antes do mapa), em 480×270.
   Cada cena é uma imagem parada; o texto fica no jogo, numa faixa embaixo, então o que importa
   na imagem fica acima de y ≈ 236. Usa as peças das arenas, os chefes e o Curupira do gerador.
     1. A floresta viva, com o Curupira cuidando de um broto.
     2. A empresa e a IA: a mata sendo derrubada para o data center, de olho vermelho no alto.
     3. A Máquina pondo os chips na Mula, na Cuca e no Boto, na câmara de testes.
     4. Só o Curupira ficou livre: ele parte ao amanhecer, com as áreas dos chefes no horizonte. */

const ABERTURA_FAIXA = 236;

/* ---------- ajudantes ---------- */
// Curupira de uma animação do gerador, com os pés em (x, y); espelho = olhando para a esquerda
function aberturaCurupira(cam, id, p, x, y, espelho = false) {
  const A = ANIMS_PX.find(a => a.id === id), t = p * A.ciclo, r = curupiraPixel(A.pose(p, t), t);
  for (const [px, py] of r.cam.pixels()) {
    const c = r.cam.get(px, py);
    if (c) cam.set(espelho ? x + (OX - px) : x + (px - OX), y + (py - OY), c);
  }
}
// chefe na pose parada, no x pedido (sx = 1 olha para a esquerda, −1 para a direita)
function aberturaChefe(id, X, sx = 1, s = 0.3, t = 0.3) {
  const B = CHEFES_PX.find(b => b.id === id), q = B.estados.idle.quadro(s, t), cam = nova();
  if (id === 'maquina') { const dx = X - q.R.X; q.R.X = X; q.R.cx += dx; }
  else { q.R.X = X; q.R.x = 0; q.R.sx = sx; }
  const info = { mula: mulaPx, cuca: cucaPx, boto: botoPx, maquina: maquinaPx }[id](cam, q.R, t, null);
  return { cam, info };
}
// centro dos pixels de uma cor (acha o chip pelo verde-escuro da placa)
function centroDaCor(cam, cor) {
  let sx = 0, sy = 0, n = 0;
  for (const [x, y] of cam.pixels()) if (cam.get(x, y) === cor) { sx += x; sy += y; n++; }
  return n ? pt(sx / n + 0.5, sy / n + 0.5) : null;
}
const hexDe = rgb => '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
// puxa todas as cores para uma cor (u) e escurece (k): luz de alarme, noite
function tingirCena(cam, alvo, u, k = 0) {
  const a = hexRgb(alvo), cache = new Map();
  for (const [x, y] of cam.pixels()) {
    const c = cam.get(x, y);
    if (!c) continue;
    let n = cache.get(c);
    if (!n) { n = hexDe(hexRgb(c).map((v, i) => mix(v, a[i], u) * (1 - k))); cache.set(c, n); }
    cam.set(x, y, n);
  }
  return cam;
}
// linha de 1 px
function retaPx(cam, a, b, cor, passo = 1) {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
  for (let i = 0; i <= n; i += passo) cam.set(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, cor);
}
// brilho pontilhado em volta de um ponto
function brilhoPx(cam, c, r, cor, forca = 0.6) {
  for (let y = Math.floor(c.y - r); y <= c.y + r; y++) for (let x = Math.floor(c.x - r); x <= c.x + r; x++) {
    const d = Math.hypot(x + 0.5 - c.x, y + 0.5 - c.y);
    if (d < r && pontilha(x, y, (1 - d / r) * forca)) cam.set(x, y, cor);
  }
}
// olho vermelho da IA: carcaça branca, lente escura e a pupila acesa
function olhoIaPx(cam, c, r) {
  brilhoPx(cam, c, r * 2.6, '#7A2A26', 0.55);
  const b = nova();
  b.disco(c.x, c.y, r, '#D6DCE0'); b.disco(c.x, c.y, r * 0.72, '#22262C');
  b.disco(c.x, c.y, r * 0.42, '#C81E14'); b.disco(c.x, c.y, r * 0.24, '#FF5A3A');
  b.set(c.x - r * 0.3, c.y - r * 0.35, '#FFE0D4');
  cam.colar(b.contornar('#141518'));
}

/* ---------- peças das cenas ---------- */
const ARARA_PX = [
  '..rrr..',
  '.rrWok.',
  '.rrWWkk',
  'rrrr.k.',
  'rrayr..',
  'raayr..',
  '.aayr..',
  '..ar...',
  '..aR...',
  '..a....',
  '..a....'
];
function araraPx(cam, x, y) {
  const b = new Camada(ARENA_W, ARENA_H);
  b.carimbo(ARARA_PX, x, y, { r: '#D8301E', R: '#8A1A14', W: '#FFF6E8', o: '#1E0E16', k: '#3A3236', y: '#F2C230', a: '#2E6AC4' });
  cam.colar(b.contornar('#1A1210'));
}
function borboletaPx(cam, x, y, cor, aberta = true) {
  const b = new Camada(ARENA_W, ARENA_H);
  b.carimbo(aberta ? ['c.c', 'ckc', 'c.c'] : ['.c.', '.k.', '.c.'], x - 1, y - 1, { c: cor, k: '#1E0E16' });
  cam.colar(b);
}
function passaroLongePx(cam, x, y, cor, asa = 0) {
  cam.carimbo(asa ? ['a...a', '.a.a.', '..a..'] : ['.....', 'aa.aa', '..a..'], x - 2, y - 1, { a: cor });
}
function florPx(cam, x, y, cor) {
  cam.set(x, y, '#2C6A2C'); cam.set(x, y - 1, '#2C6A2C');
  cam.carimbo(['.c.', 'cyc', '.c.'], x - 1, y - 4, { c: cor, y: '#FFD84A' });
}
// broto: talinho com duas folhas e uma terceira nascendo
function brotoPx(cam, x, y) {
  const b = new Camada(ARENA_W, ARENA_H);
  b.traco([pt(x, y), pt(x + 0.5, y - 7), pt(x - 0.5, y - 13)], 1.6, PM.verdeM);
  elipse(b, x - 5, y - 10, 4.5, 2.2, PM.verdeL, -25); elipse(b, x + 5, y - 13, 4.5, 2.2, PM.verdeL, 25);
  elipse(b, x - 5.5, y - 10.5, 2.5, 1, PM.verdeLL, -25); elipse(b, x + 5.5, y - 13.5, 2.5, 1, PM.verdeLL, 25);
  elipse(b, x - 0.5, y - 16, 1.5, 2.6, PM.verdeLL);
  cam.colar(b.contornar('#0E1E2A'));
  // terra mexida em volta
  for (let k = -4; k <= 4; k++) cam.set(x + k, y + 1, k % 2 ? '#5A3A22' : '#6E4A2A');
}
// trator de esteira olhando para a esquerda (lâmina na frente), base em (x, y)
function tratorPx(cam, x, y) {
  const b = new Camada(ARENA_W, ARENA_H), am = '#E8B830', amD = '#A87A18', amL = '#FFE07A';
  // esteira
  for (let yy = y - 8; yy < y; yy++) for (let xx = x + 4; xx < x + 44; xx++) b.set(xx, yy, (yy === y - 8 || yy === y - 1) ? '#1E1E22' : '#34343A');
  for (let k = 0; k < 5; k++) { b.disco(x + 9 + k * 8, y - 4, 2.6, '#55555E'); b.set(x + 9 + k * 8, y - 4, '#1E1E22'); }
  // corpo e cabine
  for (let yy = y - 18; yy < y - 8; yy++) for (let xx = x + 8; xx < x + 42; xx++) b.set(xx, yy, yy < y - 16 ? amL : yy > y - 11 ? amD : am);
  for (let yy = y - 32; yy < y - 18; yy++) for (let xx = x + 22; xx < x + 38; xx++) {
    const vidro = xx > x + 24 && xx < x + 36 && yy > y - 30 && yy < y - 21;
    b.set(xx, yy, vidro ? (xx - yy) % 7 === 0 ? '#C8E0EE' : '#5A8AA8' : yy < y - 30 ? amL : am);
  }
  // escapamento e braço da lâmina
  for (let yy = y - 27; yy < y - 18; yy++) b.set(x + 14, yy, '#34343A');
  b.traco([pt(x + 10, y - 12), pt(x + 3, y - 8)], 2.4, amD);
  // lâmina
  for (let yy = y - 16; yy < y; yy++) for (let xx = x - 2; xx < x + 3; xx++) b.set(xx, yy, xx === x - 2 ? '#8A8E96' : xx > x + 1 ? amD : am);
  cam.colar(b.contornar('#1A1210'));
}
// toco cortado
function tocoPx(cam, x, y, w, h) {
  const b = new Camada(ARENA_W, ARENA_H);
  for (let yy = y - h; yy < y; yy++) for (let xx = x - w; xx <= x + w; xx++) b.set(xx, yy, xx === x - w ? '#4A2E1E' : xx >= x + w - 1 ? '#8A6440' : '#6B4A2E');
  for (let xx = x - w; xx <= x + w; xx++) b.set(xx, y - h - 1, '#C8A070');
  b.set(x, y - h - 1, '#8A6440');
  for (const l of [-1, 1]) b.set(x + l * (w + 1), y - 1, '#4A2E1E');
  cam.colar(b.contornar('#1A1210'));
}

/* ---------- cena 1: a floresta viva ---------- */
function aberturaCena1() {
  const cam = florestaPixel(0);
  // galho no tronco da esquerda, com a arara
  { const g = new Camada(ARENA_W, ARENA_H); g.traco([pt(48, 122), pt(66, 118), pt(84, 119)], 3, '#4A2E22'); g.traco([pt(70, 118), pt(76, 112)], 1.5, '#4A2E22'); elipse(g, 78, 110, 5, 3, PM.verde); elipse(g, 88, 117, 4, 2.5, PM.verdeM); cam.colar(g.contornar('#0E1E2A')); }
  araraPx(cam, 62, 106);
  // pássaros longe, no céu do fim de tarde
  for (const [x, y, a] of [[180, 40, 0], [192, 46, 1], [204, 38, 0], [330, 30, 1], [342, 36, 0]]) passaroLongePx(cam, x, y, '#24304A', a);
  // flores no chão
  for (const [x, c] of [[150, '#F2A0C8'], [158, '#FFF6E8'], [276, '#F2A0C8'], [290, '#E8607A'], [300, '#FFF6E8'], [342, '#F2A0C8']]) florPx(cam, x, 219, c);
  // o broto e o Curupira olhando para ele
  brotoPx(cam, 252, 219);
  aberturaCurupira(cam, 'parado', 0.25, 222, 220);
  // borboletas em volta
  borboletaPx(cam, 268, 186, '#FFA82A'); borboletaPx(cam, 240, 170, '#8CD0EE', false); borboletaPx(cam, 296, 200, '#FFD84A');
  // vaga-lumes acesos perto do chão
  for (const [x, y] of [[120, 190], [330, 176], [380, 196], [96, 168], [410, 150]]) { cam.set(x, y, '#E8FF9A'); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) cam.set(x + dx, y + dy, '#7AA83A'); }
  return cam;
}

/* ---------- cena 2: a empresa e a IA ---------- */
function aberturaCena2() {
  const cam = nova();
  ceuPx(cam, ['#2E2A30', '#3A3236', '#4A3C3A', '#5E4A42', '#76584A', '#8E6650', '#A47456'], 0, CHAO_PX);
  // fumaça alta cobrindo o céu
  for (const [x, y, l, a, s] of [[90, 40, 180, 30, 1], [260, 24, 200, 34, 2], [420, 56, 160, 26, 3]]) bancoFumacaPx(cam, x, y, l, a, { luz: '#5A4A46', base: '#4E403E', sombra: '#443836' }, 0, s);
  // mata que ainda resta, à esquerda, sumindo onde já cortaram
  const mata = nova();
  mataPx(mata, 128, 222, 24, 15, { luz: '#4E7A3A', base: '#3A6430', sombra: '#2C5028' }, 3, 10);
  for (const [x, y] of mata.pixels()) if (x > 132) mata.apagar(x, y);
  cam.colar(mata);
  // a beira do corte arredondada por copas
  for (const [x, y, r, s] of [[132, 150, 15, 11], [138, 176, 14, 12], [130, 200, 13, 13]]) copaPx(cam, x, y, r, { luz: '#4E7A3A', base: '#3A6430', sombra: '#2C5028' }, s);
  arvorePx(cam, 34, 224, 120, 10, { luz: '#6A4A30', base: '#4A3222', sombra: '#3A261A', risco: '#2A1A12' }, { luz: '#5E8A3E', base: '#467232', sombra: '#345C2A' }, 1.7);
  arvorePx(cam, 104, 224, 104, 8, { luz: '#6A4A30', base: '#4A3222', sombra: '#3A261A', risco: '#2A1A12' }, { luz: '#5E8A3E', base: '#467232', sombra: '#345C2A' }, 3.3);
  // prédio mais longe, desbotado
  for (let y = 130; y < 222; y++) for (let x = 250; x < 330; x++) cam.set(x, y, (x % 12 === 0 || y % 14 === 4) ? '#6A5E5C' : '#7A6C68');
  for (let y = 140; y < 218; y += 14) for (let x = 254; x < 326; x += 6) cam.set(x, y, hash(x + y) > 0.5 ? '#9AC8A8' : '#5E5452');
  // o data center: blocos de servidores com luzinhas
  for (let y = 112; y < 222; y++) for (let x = 300; x < 470; x++) {
    const junta = (x - 300) % 34 === 0 || y === 112 || y === 113;
    cam.set(x, y, junta ? '#5C636E' : y < 118 ? '#B9C2CA' : x > 466 ? '#6E7680' : '#8A9098');
  }
  for (const yb of [124, 146, 168, 190]) for (let y = yb; y < yb + 12; y++) for (let x = 306; x < 464; x++) {
    if ((x - 300) % 34 < 4) continue;
    const led = y % 3 === 1 && x % 4 === 1;
    cam.set(x, y, led ? (hash(x * 1.7 + y * 0.3) > 0.55 ? '#4AE06A' : hash(x + y * 3.1) > 0.5 ? '#4AB8F0' : '#2E333B') : y === yb ? '#14171C' : '#1E2228');
  }
  // portão de carga e máquinas de refrigeração no teto
  for (let y = 200; y < 222; y++) for (let x = 350; x < 384; x++) cam.set(x, y, y % 3 === 0 ? '#5C636E' : '#7A828C');
  for (const x of [316, 350, 384, 418]) { for (let y = 102; y < 112; y++) for (let xx = x; xx < x + 22; xx++) cam.set(xx, y, y === 102 ? '#D6DCE0' : '#9AA2AA'); const v = nova(); v.disco(x + 11, 107, 3.5, '#3A3F48'); v.set(x + 11, 107, '#9AA2AA'); cam.colar(v); }
  // torre com o olho vermelho da IA
  for (let y = 44; y < 102; y++) for (let x = 436; x < 444; x++) cam.set(x, y, x === 436 ? '#5C636E' : x === 443 ? '#3A3F48' : (y % 8 === 0 ? '#5C636E' : '#8A9098'));
  for (let y = 44; y < 102; y += 8) { cam.set(434, y, '#5C636E'); cam.set(445, y, '#3A3F48'); }
  const olho = pt(440, 36);
  // o olho vigiando a mata: um facho vermelho bem fraco até as árvores
  for (let y = 40; y < 224; y++) {
    const u = (y - 40) / 184, xa = mix(olho.x, 20, u), xb = mix(olho.x, 150, u);
    for (let x = Math.floor(xa); x < xb; x++) if (pontilha(x, y, 0.16 * (1 - u * 0.5))) cam.set(x, y, '#B83A2A');
  }
  olhoIaPx(cam, olho, 9);
  // chão de terra, com grama só onde ainda há mata
  chaoPx(cam, d => d < 1 ? '#7A5A3E' : d < 2 ? '#6A4A30' : d < 16 ? '#5E4230' : d < 30 ? '#4E3626' : '#42301F', [[5, 0.95, '#3A2618', 2], [8, 0.97, '#7E6048', 2]], 6);
  for (let x = 0; x < 160; x++) { cam.set(x, CHAO_PX, '#5E8A3E'); if (hash(x * 1.3) > 0.4 && x < 150 - hash(x) * 20) cam.set(x, CHAO_PX - 1, '#467232'); }
  // marcas de esteira na terra
  for (let x = 170; x < 300; x += 3) { cam.set(x, 232, '#3A2618'); cam.set(x + 1, 236, '#3A2618'); }
  // tocos e um tronco caído
  for (const [x, w, h] of [[176, 4, 6], [258, 5, 5], [286, 3, 4], [228, 3, 3]]) tocoPx(cam, x, CHAO_PX + 1, w, h);
  { const tr = new Camada(ARENA_W, ARENA_H); tr.traco([pt(186, 226), pt(240, 223)], 6, '#6B4A2E'); tr.traco([pt(186, 224), pt(240, 221)], 1.5, '#8A6440'); for (let k = 0; k < 4; k++) tr.disco(186, 226, 2.8 - k * 0.7, k % 2 ? '#C8A070' : '#8A6440'); cam.colar(tr.contornar('#1A1210')); }
  copaPx(cam, 252, 218, 11, { luz: '#7A8A3E', base: '#5E7232', sombra: '#4A5C2A' }, 4, '#1A1210');
  // a árvore caindo para trás, empurrada pelo trator
  const base = pt(176, CHAO_PX), topo = soma(base, mul(unit(pt(-Math.sin(rad(32)), -Math.cos(rad(32)))), 96));
  { const tr = new Camada(ARENA_W, ARENA_H); tr.traco([base, topo], 7, '#5A3A26'); tr.traco([soma(base, pt(-2, 0)), soma(topo, pt(-2, 0))], 2, '#7A5236'); cam.colar(tr.contornar('#1A1210')); }
  copaPx(cam, topo.x, topo.y, 22, { luz: '#5E8A3E', base: '#467232', sombra: '#345C2A' }, 6, '#1A1210');
  for (let k = 0; k < 3; k++) retaPx(cam, pt(topo.x + 14 + k * 6, topo.y - 34 + k * 5), pt(topo.x + 30 + k * 6, topo.y - 26 + k * 5), '#C8B8A0', 2);
  // terra levantando na raiz
  for (const [x, y, r] of [[170, 218, 3], [178, 216, 3.5], [186, 218, 2.5], [164, 219, 2]]) { const r2 = nova(); r2.disco(x, y, r, '#8A6A4A'); r2.disco(x - 0.5, y - 1, r * 0.5, '#B89A78'); cam.colar(r2); }
  tratorPx(cam, 184, CHAO_PX + 2);
  for (let k = 0; k < 5; k++) tufoPx(cam, 199 + k * 5, 186 - k * 7, 2.5 + k * 1.2, { luz: '#8A8078', base: '#6E645E', sombra: '#5E5650' }, k, true);
  return cam;
}

/* ---------- cena 3: os chips ---------- */
function aberturaCena3() {
  const cam = ARENAS_PX.maquina.quadro(0).cam;
  // luz de alarme: a sala branca fica vermelha e escura
  tingirCena(cam, '#5A1414', 0.55, 0.45);
  // poço d'água no piso para o Boto
  const P0 = 326, P1 = 434;
  for (let y = CHAO_PX; y < ARENA_H; y++) for (let x = P0 - 3; x <= P1 + 3; x++) cam.set(x, y, x < P0 || x > P1 ? '#3A2A2E' : y < AGUA_Y ? '#140C10' : '#1E2A44');
  // os três seres, de olho vermelho e com o chip aceso
  const mula = aberturaChefe('mula', 112, -1), cuca = aberturaChefe('cuca', 250, 1), boto = aberturaChefe('boto', 384, 1);
  const maq = aberturaChefe('maquina', 248);
  cam.colar(maq.cam);
  cam.colar(mula.cam); cam.colar(cuca.cam); cam.colar(boto.cam);
  // água da frente cobrindo a base do Boto
  for (let y = AGUA_Y; y < ARENA_H; y++) for (let x = P0; x <= P1; x++) cam.set(x, y, y === AGUA_Y ? '#5A86B0' : y < AGUA_Y + 3 ? '#2E4A70' : pontilha(x, y, (y - AGUA_Y) / 40) ? '#18223A' : '#1E2A44');
  // da lente da Máquina, um raio fino até cada chip
  const lente = maq.info.lente;
  for (const c of [mula, cuca, boto]) {
    const chip = centroDaCor(c.cam, '#1F3A2A');
    if (!chip) continue;
    brilhoPx(cam, chip, 9, '#C81E14', 0.5);
    retaPx(cam, lente, chip, '#FF3A2A');
    retaPx(cam, soma(lente, pt(0, 1)), soma(chip, pt(0, 1)), '#8A1A14', 2);
    chipPx(cam, chip.x, chip.y, 0.3, true);
  }
  brilhoPx(cam, lente, 12, '#FF5A3A', 0.5);
  return cam;
}

/* ---------- cena 4: o Curupira parte ---------- */
function aberturaCena4() {
  const cam = nova();
  ceuPx(cam, ['#1E2A44', '#2B3A55', '#3E4E6A', '#5E6478', '#8A7480', '#B88478', '#E0A070', '#F6C47C'], 0, 172);
  // sol nascendo no horizonte
  for (let y = 100; y < 172; y++) for (let x = 280; x < 380; x++) { const d = Math.hypot(x - 330, y - 150); if (d > 15 && d < 44 && pontilha(x, y, (44 - d) / 29 * 0.55)) cam.set(x, y, '#FBD890'); }
  { const sol = nova(); sol.disco(330, 150, 15, '#FFE6A8'); sol.disco(330, 150, 11, '#FFF6DC'); cam.colar(sol); }
  // estrelas que ainda restam
  for (let i = 0; i < 18; i++) { const x = hash(i * 3.7) * 480, y = hash(i * 1.9) * 60; cam.set(x, y, i % 3 ? '#8A9AB8' : '#C6D2DE'); }
  // morros longe
  mataPx(cam, 150, 200, 20, 9, { luz: '#5E6A80', base: '#545E74', sombra: '#4A546A' }, 2, 7);
  // no horizonte, as áreas dos chefes
  // Mula: incêndio à esquerda, coluna de fumaça e brilho laranja
  brilhoPx(cam, pt(60, 166), 30, '#C86A3A', 0.55);
  for (let k = 0; k < 4; k++) chamaPx(cam, 44 + k * 10, 172, 270, 10, 6 + hash(k) * 6, k, { n: 3, contorno: null, rampa: ['#A8401E', '#D8602A', '#F09040', '#F8B860', '#F8B860', '#F8B860'] });
  for (let k = 0; k < 9; k++) tufoPx(cam, 56 + k * k * 0.9 + Math.sin(k * 1.3) * 3, 162 - k * 11, 5 + k * 1.5, { luz: '#7A6A70', base: '#625660', sombra: '#544852' }, k + 30, true);
  // Cuca: mata fechada e escura, com a luz verde lá dentro
  for (let k = 0; k < 6; k++) copaPx(cam, 150 + k * 11, 166 - Math.sin(k / 5 * Math.PI) * 10, 11, { luz: '#2E3A4A', base: '#263040', sombra: '#202838' }, k + 20);
  brilhoPx(cam, pt(178, 166), 14, '#4EC86A', 0.5);
  cam.set(176, 166, '#B8F4C0'); cam.set(181, 163, '#8ADA6A');
  // a empresa: prédio e torre de olho vermelho à direita
  for (let y = 146; y < 174; y++) for (let x = 404; x < 452; x++) cam.set(x, y, (x % 8 === 0) ? '#3A3A48' : '#4A4A5A');
  for (let y = 150; y < 172; y += 5) for (let x = 406; x < 450; x += 4) if (hash(x + y * 2) > 0.6) cam.set(x, y, '#9AC8A8');
  for (let y = 116; y < 146; y++) { cam.set(440, y, '#3A3A48'); cam.set(441, y, '#4A4A5A'); }
  olhoIaPx(cam, pt(440, 112), 4);
  // mata perto (vale) e o morro onde o Curupira está
  mataPx(cam, 172, ARENA_H, 26, 12, { luz: '#3E6A3A', base: '#30582E', sombra: '#264A28' }, 7, 10);
  // Boto: o rio saindo do horizonte e descendo pelo vale
  for (let y = 174; y < 250; y++) { const u = (y - 174) / 76, c = mix(292, 420, u) + Math.sin(u * 6) * 14, w = mix(2, 20, u); for (let x = Math.floor(c - w); x < c + w; x++) cam.set(x, y, Math.abs(x - c) > w - 1.5 ? '#264A40' : pontilha(x, y, 0.2 + 0.3 * (1 - u)) ? '#F6C47C' : u < 0.4 ? '#8AA8C0' : '#5E8AB0'); }
  const morro = x => 206 + Math.pow((x - 60) / 300, 2) * 26;
  for (let x = 0; x < ARENA_W; x++) for (let y = Math.floor(morro(x)); y < ARENA_H; y++) {
    const d = y - morro(x);
    cam.set(x, y, d < 1 ? '#86B83C' : d < 2 ? '#4E8C33' : d < 5 ? '#2C6A2C' : pontilha(x, y, (d - 5) / 30) ? '#163A32' : '#1E4A2E');
  }
  for (let x = 0; x < 300; x += 3) if (hash(x * 2.3) > 0.5) { const y = Math.floor(morro(x)); cam.set(x, y - 1, '#86B83C'); if (hash(x) > 0.7) cam.set(x + 1, y - 2, '#C6E070'); }
  // árvore grande na beira, emoldurando
  troncoArvPx(cam, 12, -6, 214, 22, { luz: '#5A3A2A', base: '#3A2620', sombra: '#2E1E1A', risco: '#22160F' }, { sem: 3, curva: 2, contorno: '#0E080A' });
  for (const [x, y, r, s] of [[6, 4, 34, 1], [56, -10, 30, 2], [30, 40, 22, 3]]) copaPx(cam, x, y, r, { luz: '#2E5A30', base: '#244A28', sombra: '#1C3A22' }, s, '#0E1A14');
  // o Curupira correndo para a direita, e as folhas indo atrás dele
  aberturaCurupira(cam, 'correr', 0.3, 132, Math.round(morro(132)));
  for (const [x, y, a] of [[104, 182, 20], [90, 172, -30], [78, 188, 60], [64, 176, -60], [52, 190, 10]]) {
    const fo = new Camada(ARENA_W, ARENA_H);
    elipse(fo, x, y, 2.8, 1.3, PM.verdeL, a); fo.set(x, y, PM.verdeLL);
    cam.colar(fo.contornar('#0E1E2A'));
  }
  return cam;
}

const ABERTURA_CENAS = [aberturaCena1, aberturaCena2, aberturaCena3, aberturaCena4];
