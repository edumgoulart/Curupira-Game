/* mapa_px.js — o mapa do mundo: visão de cima, em diagonal (uns 45°), como um tabuleiro.
   960×540 px de arte (×4 = 3840×2160, a câmera segue o Curupira). No meio, a samaúma do Curupira;
   dela saem trilhas de terra vermelha para as quatro áreas:
     - Mula (embaixo, à esquerda): mata pegando fogo; entra-se por um arco de árvores em chamas.
     - Cuca (em cima, à esquerda): mata fechada e escura, com névoa e a luz verde do caldeirão.
     - Boto (embaixo, à direita): prainha no encontro das águas, com um píer.
     - Máquina (em cima, à direita): o prédio da empresa, cercado, com o portão trancado até
       os três seres serem libertados. A trilha atravessa o rio por uma ponte.
   O mapa sai em três partes:
     - fundo (16 quadros, laço de 2 s): chão, água, mata fechada, prédio, tudo que nunca fica
       na frente do Curupira;
     - objetos: árvores, palmeiras, cerca, bandeiras... cada um com a base marcada; o jogo ordena
       pela altura (y-sort), então o Curupira passa atrás ou na frente deles;
     - frente (16 quadros): névoa, fumaça e brasas, por cima de tudo.
   E uma máscara de onde dá para andar (andavel.png), tirada do mesmo desenho. */

const MAPA_W = 960, MAPA_H = 540, QUADROS_MAPA = 16, LACO_MAPA = 2;
const voltaM = (t, k = 1) => (t / LACO_MAPA * k) % 1;
const CONTORNO_MAPA = '#14200E';

/* ---------- geometria ---------- */
const HUB = pt(480, 380);
const MAPA_INICIO = pt(480, 374);
const LAGO = { c: pt(919, 506), rx: 250, ry: 169 };
const RIO = [pt(565, -15), pt(558, 62), pt(570, 138), pt(615, 206), pt(685, 269), pt(765, 328), pt(850, 388)];
const TRILHAS = {
  cuca: [HUB, pt(438, 338), pt(375, 285), pt(322, 245), pt(282, 215)],
  mula: [HUB, pt(412, 402), pt(325, 425), pt(256, 440), pt(212, 450)],
  boto: [HUB, pt(538, 398), pt(600, 425), pt(650, 452), pt(676, 465)],
  maquina: [HUB, pt(525, 352), pt(558, 288), pt(585, 232), pt(625, 202), pt(695, 207), pt(765, 210), pt(765, 186), pt(800, 166), pt(833, 150)]
};
// a trilha continua para dentro da mata da Cuca e do fogo da Mula (chão escuro, sem árvore)
const BOCA_CUCA = [pt(282, 215), pt(228, 164)];
const BOCA_MULA = [pt(212, 450), pt(146, 486)];
const PIER = [pt(676, 465), pt(740, 465)];
const CERCA = { x0: 715, x1: 920, y: 190, portao: [752, 778] };
const PREDIO = { x0: 758, x1: 898, teto: 36, frente: 80, base: 146, porta: [820, 846] };
const CALDEIRAO = pt(222, 158);
// onde cada área começa (o jogo mostra o nome e abre o painel), e onde o Curupira volta depois da luta
const ENTRADAS = {
  mula: { centro: pt(184, 464), raio: 16, volta: pt(246, 442) },
  cuca: { centro: pt(250, 186), raio: 16, volta: pt(312, 240) },
  boto: { centro: pt(728, 465), raio: 15, volta: pt(652, 455) },
  maquina: { centro: pt(833, 154), raio: 15, volta: pt(800, 170) }
};
const PORTAO = { retangulo: [CERCA.portao[0], CERCA.y - 8, CERCA.portao[1], CERCA.y + 3], aviso: pt(765, 206), raio: 26 };

/* ---------- utilidades ---------- */
function ruido(x, y, e, sem = 0) {
  const gx = x / e, gy = y / e, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = suave(gx - x0), fy = suave(gy - y0);
  const h = (i, j) => hash(i * 127.1 + j * 311.7 + sem * 74.7);
  return mix(mix(h(x0, y0), h(x0 + 1, y0), fx), mix(h(x0, y0 + 1), h(x0 + 1, y0 + 1), fx), fy);
}
function distSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
  const u = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / L, 0, 1);
  return { d: Math.hypot(p.x - a.x - dx * u, p.y - a.y - dy * u), u };
}
function distPoli(p, pts) {
  let melhor = { d: Infinity, i: 0, u: 0 };
  for (let i = 0; i < pts.length - 1; i++) { const r = distSeg(p, pts[i], pts[i + 1]); if (r.d < melhor.d) melhor = { d: r.d, i, u: r.u }; }
  return melhor;
}
// as funções das arenas desenham numa camada do tamanho da arena (480×270); no mapa (960×540)
// elas desenham numa camada da arena centrada no ponto, que depois é colada no lugar
function noMapa(cam, cx, cy, fn) {
  const l = new Camada(ARENA_W, ARENA_H), ox = Math.round(cx) - ARENA_W / 2, oy = Math.round(cy) - ARENA_H / 2;
  fn(l, cx - ox, cy - oy);
  cam.colar(l, ox, oy);
}
const fatorLago = (x, y) => Math.hypot((x - LAGO.c.x) / LAGO.rx, (y - LAGO.c.y) / LAGO.ry);
const _escuro = new Map();
// a mesma cor mais escura e puxada para o azul (sombra no chão)
function escurecer(hex, k = 0.74) {
  const ch = hex + k;
  if (!_escuro.has(ch)) {
    const [r, g, b] = hexRgb(hex);
    _escuro.set(ch, '#' + [r * k * 0.92, g * k, b * k + 10].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''));
  }
  return _escuro.get(ch);
}
const _tinge = new Map();
function tingir(hex, alvo, k) {
  const ch = hex + alvo + k;
  if (!_tinge.has(ch)) {
    const a = hexRgb(hex), b = hexRgb(alvo);
    _tinge.set(ch, '#' + a.map((v, i) => clamp(Math.round(mix(v, b[i], k)), 0, 255).toString(16).padStart(2, '0')).join(''));
  }
  return _tinge.get(ch);
}
function sombraChao(cam, cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
    if (d > 1 || (d > 0.8 && !pontilha(x, y, (1 - d) / 0.2))) continue;
    const c = cam.get(x, y);
    if (c) cam.set(x, y, escurecer(c));
  }
}

/* ---------- terreno ---------- */
const TRN = { GRAMA: 0, TRILHA: 1, AREIA: 2, AGUA: 3, MATA: 4, MATA_CUCA: 5, MATA_FOGO: 6, QUEIMADO: 7, DEVASTADO: 8, PATIO: 9, BOCA_CUCA: 10, PONTE: 11 };
const ANDAVEL = new Set([TRN.GRAMA, TRN.TRILHA, TRN.AREIA, TRN.QUEIMADO, TRN.DEVASTADO, TRN.PATIO, TRN.BOCA_CUCA, TRN.PONTE]);
const PAL_CHAO = {
  grama: ['#4C8C36', '#5A9A3C', '#68A844'], tufo: '#80C056', flores: ['#F4E66A', '#FFFFFF', '#F09ACC', '#FFB04A'],
  terra: '#B8683A', terraL: '#C67C48', terraD: '#A65C34', terraBorda: '#86462A', pedrinha: '#D8A070',
  areia: '#E6C88A', areiaD: '#D8B474', areiaMolhada: '#C6A26A', concha: '#FFF2E2',
  agua: ['#285E9A', '#3270AC', '#4688C2'], aguaL: '#7CC0E6', espuma: '#E8F6FF',
  barro: ['#7E5A38', '#8E6A44', '#A07A50'], barroL: '#C8A070',
  queimado: ['#3E322C', '#4A3C34', '#56483E'], cinza: '#8A7E76', carvao: '#241C18',
  devastado: ['#967450', '#A88660', '#B8966C'], trilhoPneu: '#7E6044',
  patio: '#A8AEB4', patioJunta: '#8E949A', patioL: '#BAC0C6',
  bocaCuca: ['#2A4436', '#34523E', '#1A2E26'],
  mata: '#1E3E1E', mataCuca: '#0A1616', mataFogo: '#1A1010'
};
const COPA = {
  verde: { luz: '#4E9A3A', base: '#3A7A30', sombra: '#2A5C28', contorno: '#10200C' },
  cuca: { luz: '#2C5248', base: '#1C3834', sombra: '#122626', contorno: '#060E0E' },
  fogo: { luz: '#5A4038', base: '#3C2A26', sombra: '#2A1C1A', contorno: '#0E0606' },
  arvore: { luz: '#6EB24E', base: '#3E8A38', sombra: '#2A6430', contorno: CONTORNO_MAPA },
  arvoreEsc: { luz: '#5AA046', base: '#357A34', sombra: '#24582C', contorno: CONTORNO_MAPA },
  ipeAmarelo: { luz: '#FFEA74', base: '#F2C230', sombra: '#C68C1E', contorno: '#4A2A08' },
  ipeRoxo: { luz: '#F6AEDE', base: '#D26CBA', sombra: '#9A4690', contorno: '#3A1430' },
  samauma: { luz: '#62A848', base: '#3A8034', sombra: '#265C2A', contorno: '#0E1C0A' }
};
const TRONCO_M = { luz: '#946240', base: '#6E462A', sombra: '#4C301C', risco: '#3A2416' };

let TER = null;   // código do terreno por pixel
let BLOQ = null;  // 1 = algo desenhado em cima (árvore, prédio, pedra): não dá para andar
let RIO_U = null; // posição ao longo do rio (para a correnteza)

function classificar() {
  TER = new Uint8Array(MAPA_W * MAPA_H);
  RIO_U = new Float32Array(MAPA_W * MAPA_H);
  const trilhas = Object.values(TRILHAS);
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    const p = pt(x + 0.5, y + 0.5), i = y * MAPA_W + x;
    const n = ruido(x, y, 30, 1), n2 = ruido(x, y, 11, 2);
    const fl = fatorLago(p.x, p.y) + (n2 - 0.5) * 0.03;
    const r = distPoli(p, RIO), hwRio = mix(10, 17, (r.i + r.u) / (RIO.length - 1)) + (n2 - 0.5) * 2;
    let dTrilha = Infinity;
    for (const tr of trilhas) dTrilha = Math.min(dTrilha, distPoli(p, tr).d);
    const hwTrilha = 4.6 + (ruido(x, y, 8, 3) - 0.5) * 1.8;
    const borda = Math.min(x, y, MAPA_W - 1 - x, MAPA_H - 1 - y);
    const devast = x > 600 && y < 285 && fl > 1.25;
    const larguraBorda = devast ? 8 + 10 * n : 18 + 18 * n;
    const cuca = (x / 375) ** 2 + (y / 285) ** 2 < 1 + (n - 0.5) * 0.14;
    const fogo = (x / 222) ** 2 + ((MAPA_H - y) / 140) ** 2 < 1 + (n - 0.5) * 0.16;
    const queim = (x / 362) ** 2 + ((MAPA_H - y) / 231) ** 2 < 1 + (n - 0.5) * 0.14;
    const naBocaCuca = distSeg(p, BOCA_CUCA[0], BOCA_CUCA[1]).d < 11 + n2 * 2;
    const naBocaMula = distSeg(p, BOCA_MULA[0], BOCA_MULA[1]).d < 12 + n2 * 2;
    const patio = x > CERCA.x0 && x < CERCA.x1 && y < CERCA.y;
    let t = TRN.GRAMA;
    if (fl < 1 || r.d < hwRio) { t = TRN.AGUA; RIO_U[i] = r.i + r.u; }
    else if (cuca && !naBocaCuca) t = TRN.MATA_CUCA;
    else if (cuca && naBocaCuca) t = TRN.BOCA_CUCA;
    else if (fogo && !naBocaMula) t = TRN.MATA_FOGO;
    else if (patio) t = TRN.PATIO;
    else if (borda < larguraBorda && dTrilha > hwTrilha + 4) t = TRN.MATA;
    else if (fl < 1.22 + (n - 0.5) * 0.08) t = TRN.AREIA;
    else if (dTrilha < hwTrilha) t = TRN.TRILHA;
    else if (queim || naBocaMula) t = TRN.QUEIMADO;
    else if (devast) t = TRN.DEVASTADO;
    TER[i] = t;
  }
  // ponte: onde a trilha da Máquina cruza o rio
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    const i = y * MAPA_W + x;
    if (TER[i] === TRN.AGUA && distPoli(pt(x + 0.5, y + 0.5), TRILHAS.maquina).d < 6) TER[i] = TRN.PONTE;
  }
}
const ter = (x, y) => (x < 0 || y < 0 || x >= MAPA_W || y >= MAPA_H) ? TRN.MATA : TER[y * MAPA_W + x];

function pintarChao(cam) {
  const P = PAL_CHAO;
  const nivel = (x, y, cores, e, sem) => {
    const v = ruido(x, y, e, sem) * (cores.length - 0.01) * 1.15 - 0.08;
    const k = clamp(Math.floor(v), 0, cores.length - 1), fr = v - Math.floor(v);
    return k < cores.length - 1 && pontilha(x, y, (fr - 0.6) / 0.4) ? cores[k + 1] : cores[k];
  };
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    const t = ter(x, y), h = hash(x * 0.71 + y * 13.13);
    let c;
    switch (t) {
      case TRN.GRAMA: {
        c = nivel(x, y, P.grama, 22, 4);
        if (h > 0.986) c = P.tufo;
        if (ruido(x, y, 9, 5) > 0.74 && h > 0.955) c = P.flores[Math.floor(hash(x * 3.1 + y) * 4)];
        break;
      }
      case TRN.TRILHA: {
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const v = ter(x + dx, y + dy); return v !== TRN.TRILHA && v !== TRN.PONTE; });
        c = borda ? P.terraBorda : ruido(x, y, 5, 6) > 0.7 ? P.terraL : ruido(x, y, 7, 7) < 0.25 ? P.terraD : P.terra;
        if (!borda && h > 0.985) c = P.pedrinha;
        break;
      }
      case TRN.AREIA: {
        const fl = fatorLago(x, y);
        c = fl < 1.04 ? P.areiaMolhada : ruido(x, y, 6, 8) > 0.62 ? P.areiaD : P.areia;
        if (h > 0.994) c = P.concha;
        break;
      }
      case TRN.AGUA: case TRN.PONTE: {
        const fl = fatorLago(x, y), barro = x > 850 + Math.sin(y * 0.045) * 22 + Math.sin(y * 0.13) * 6 && fl < 1.05;
        const cores = barro ? P.barro : P.agua;
        const perto = [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => { const v = ter(x + dx, y + dy); return v !== TRN.AGUA && v !== TRN.PONTE; });
        c = perto ? cores[2] : fl < 0.75 ? cores[0] : fl < 1 ? (pontilha(x, y, (fl - 0.75) / 0.25) ? cores[2] : cores[1]) : cores[1];
        break;
      }
      case TRN.MATA: c = P.mata; break;
      case TRN.MATA_CUCA: c = P.mataCuca; break;
      case TRN.MATA_FOGO: c = P.mataFogo; break;
      case TRN.QUEIMADO: {
        c = nivel(x, y, P.queimado, 14, 9);
        if (h > 0.975) c = P.cinza; else if (h < 0.02) c = P.carvao;
        break;
      }
      case TRN.DEVASTADO: {
        c = nivel(x, y, P.devastado, 16, 10);
        // marcas de pneu do trator
        const u = Math.sin(x * 0.02 + 1) * 30 + 120 - y;
        if (Math.abs(u) < 1 || Math.abs(u - 6) < 1) c = P.trilhoPneu;
        if (h > 0.985) c = P.devastado[2];
        break;
      }
      case TRN.PATIO: c = (x - CERCA.x0) % 14 === 0 || y % 14 === 0 ? P.patioJunta : h > 0.97 ? P.patioL : P.patio; break;
      case TRN.BOCA_CUCA: {
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ter(x + dx, y + dy) === TRN.MATA_CUCA);
        c = borda ? P.bocaCuca[2] : ruido(x, y, 5, 11) > 0.55 ? P.bocaCuca[1] : P.bocaCuca[0];
        // a trilha continua para dentro, em terra escura
        if (!borda && distSeg(pt(x + 0.5, y + 0.5), BOCA_CUCA[0], BOCA_CUCA[1]).d < 4.2 + (ruido(x, y, 8, 3) - 0.5) * 1.6) c = h > 0.9 ? '#5A3E2C' : '#6A4834';
        break;
      }
    }
    cam.set(x, y, c);
  }
  // margem do rio e do lago: uma linha escura na grama e um degrau na areia
  for (let y = 1; y < MAPA_H - 1; y++) for (let x = 1; x < MAPA_W - 1; x++) {
    const t = ter(x, y);
    if (t !== TRN.GRAMA && t !== TRN.DEVASTADO && t !== TRN.AREIA) continue;
    if (ter(x, y - 1) === TRN.AGUA || ter(x - 1, y) === TRN.AGUA || ter(x + 1, y) === TRN.AGUA) cam.set(x, y, escurecer(cam.get(x, y), 0.8));
    if (ter(x, y + 1) === TRN.AGUA) cam.set(x, y + 1, t === TRN.AREIA ? '#9A7A4A' : '#3A5A2A');   // barranco visto de cima
  }
}

/* ---------- mata fechada (fundo) ---------- */
const CHAMAS_MATA = [];
function bloquear(cam, dx, dy) {
  for (const [x, y] of cam.pixels()) if (cam.get(x, y)) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < MAPA_W && Y < MAPA_H) BLOQ[Y * MAPA_W + X] = 1; }
}
function bloquearElipse(cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++)
    if (x >= 0 && y >= 0 && x < MAPA_W && y < MAPA_H && ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) BLOQ[y * MAPA_W + x] = 1;
}
// cola uma camada local (desenhada em volta de (ox, oy)) no mapa, e marca como bloqueada
function colarObjeto(cam, local, ox, oy, bloqueia = true) {
  cam.colar(local, ox, oy);
  if (bloqueia) bloquear(local, ox, oy);
}
function mataFechada(cam) {
  const passo = 11, blobs = [];
  for (let gy = -6; gy < MAPA_H + 12; gy += passo * 0.8) for (let gx = -6; gx < MAPA_W + 12; gx += passo) {
    const k = gx * 0.31 + gy * 1.7;
    const x = gx + (hash(k) - 0.5) * passo * 0.9 + ((gy / (passo * 0.8)) % 2 ? passo / 2 : 0), y = gy + (hash(k + 5) - 0.5) * passo * 0.6;
    const t = ter(clamp(Math.round(x), 0, MAPA_W - 1), clamp(Math.round(y), 0, MAPA_H - 1));
    if (t !== TRN.MATA && t !== TRN.MATA_CUCA && t !== TRN.MATA_FOGO) continue;
    // não fecha a boca da trilha na Cuca e no fogo
    const r = 9 + hash(k + 9) * 4;
    if (distSeg(pt(x, y), BOCA_CUCA[0], BOCA_CUCA[1]).d < 8 + r * 1.2 || distSeg(pt(x, y), BOCA_MULA[0], BOCA_MULA[1]).d < 9 + r * 1.2) continue;
    blobs.push({ x, y, t, r, sem: k });
  }
  blobs.sort((a, b) => a.y - b.y);
  for (const b of blobs) {
    const pal = b.t === TRN.MATA_CUCA ? COPA.cuca : b.t === TRN.MATA_FOGO ? COPA.fogo : COPA.verde;
    const R = Math.ceil(b.r * 1.3) + 3, local = new Camada(R * 2 + 1, R * 2 + 8);
    // tronco curto (só aparece na beira de baixo da mata)
    for (let yy = R + Math.round(b.r * 0.6); yy < R + Math.round(b.r * 0.6) + 5; yy++) for (let xx = R - 1; xx <= R + 1; xx++) local.set(xx, yy, xx === R - 1 ? TRONCO_M.base : TRONCO_M.sombra);
    tufoPx(local, R, R, b.r, pal, b.sem);
    local.contornar(pal.contorno);
    colarObjeto(cam, local, Math.round(b.x) - R, Math.round(b.y) - R);
    if (b.t === TRN.MATA_FOGO && hash(b.sem + 2) > 0.45) CHAMAS_MATA.push({ x: b.x, y: b.y - b.r * 0.4, larg: 8 + hash(b.sem) * 6, alt: 7 + hash(b.sem + 1) * 8, sem: b.sem });
  }
}

/* ---------- objetos ---------- */
const OBJETOS = [];   // { nome, x, y, desenhar(cam, x, y, t), animado, mostrar, pe }
function objeto(nome, x, y, desenhar, { animado = false, mostrar = '', pe = [3, 2], sombra = null, caixa = [200, 180, 100, 160] } = {}) {
  OBJETOS.push({ nome, x: Math.round(x), y: Math.round(y), desenhar, animado, mostrar, pe, sombra, caixa });
}

function arvoreMapa(cam, x, y, { r = 13, h = 8, pal = COPA.arvore, sem = 0 } = {}) {
  const tr = new Camada(cam.W, cam.H);
  for (let yy = y - h - 3; yy <= y; yy++) {
    const u = (yy - (y - h - 3)) / (h + 3), w = 1.6 + (u > 0.7 ? (u - 0.7) * 7 : 0);
    for (let xx = Math.round(x - w); xx <= Math.round(x + w); xx++) tr.set(xx, yy, xx < x - w * 0.35 ? TRONCO_M.luz : xx > x + w * 0.35 ? TRONCO_M.sombra : TRONCO_M.base);
  }
  cam.colar(tr.contornar(pal.contorno));
  copaPx(cam, x, y - h - r * 0.72, r, pal, sem, pal.contorno);
}
function arvoreQueimada(cam, x, y, t, sem) {
  const g = new Camada(cam.W, cam.H), cor = '#2E2220';
  for (let yy = y - 18; yy <= y; yy++) for (let xx = x - 1; xx <= x + 1 + (yy > y - 3 ? 1 : 0); xx++) g.set(xx, yy, xx === x - 1 ? '#4A3630' : cor);
  const pontas = [];
  for (const [a, L] of [[-130, 9], [-60, 10], [-95, 7]]) {
    const b = pt(x + Math.cos(rad(a + (hash(sem) - 0.5) * 20)) * L, y - 14 + Math.sin(rad(a)) * L);
    galhoPx(g, pt(x, y - 12), pt(mix(x, b.x, 0.5), y - 15), b, 2, cor);
    pontas.push(b);
  }
  cam.colar(g.contornar('#0E0808'));
  // brasa nas pontas dos galhos e um foguinho no alto
  for (const p of pontas) cam.set(p.x, p.y, Math.sin(voltaM(t) * TAU * 2 + sem + p.x) > 0 ? '#FF8A2A' : '#C8401A');
  if (hash(sem * 1.9) > 0.7) chamaPx(cam, pontas[1].x, pontas[1].y + 1, 270, 4, 4, voltaM(t) * TAU * 2 + sem, { n: 2, vel: 1, semente: sem });
}
function arvoreEmChamas(cam, x, y, t, sem) {
  arvoreMapa(cam, x, y, { r: 14, h: 9, pal: COPA.fogo, sem });
  const v = voltaM(t) * TAU * 2;
  for (const [dx, dy, l, a] of [[-7, -26, 9, 12], [6, -30, 10, 15], [0, -38, 8, 11]])
    chamaPx(cam, x + dx, y + dy, 270, l, a, v + sem + dx, { n: 3, vel: 1, semente: sem + dx });
}
function arvoreTorta(cam, x, y, sem) {
  const g = new Camada(cam.W, cam.H), cor = '#2A2420';
  for (let k = 0; k <= 16; k++) { const xx = x + Math.round(Math.sin(k * 0.35 + sem) * 2); g.set(xx - 1, y - k, '#3E3430'); g.set(xx, y - k, cor); g.set(xx + 1, y - k, cor); }
  galhoPx(g, pt(x, y - 12), pt(x - 8, y - 20), pt(x - 13, y - 17), 2, cor);
  cam.colar(g.contornar(COPA.cuca.contorno));
  copaPx(cam, x + 2, y - 26, 12, COPA.cuca, sem, COPA.cuca.contorno);
  // barba-de-velho pendurada, com um brilho verde da luz do caldeirão
  for (const [dx, l] of [[-9, 7], [-4, 10], [3, 8], [9, 6], [-13, 5]]) for (let k = 0; k < l; k++) cam.set(x + dx + (k % 3 === 2 ? 1 : 0), y - 20 + k, k === l - 1 ? '#7ABF7A' : '#4A6A5A');
}
function palmeiraMapa(cam, x, y, t, sem) {
  palmeiraPx(cam, x, y, 30 + hash(sem) * 8, (hash(sem + 1) - 0.5) * 16, t, {
    tronco: '#A0845A', troncoS: '#7A6242', folha: '#4E9A44', folhaL: '#7CC060', folhaS: '#2E6A30', coco: '#6A4A2A', contorno: CONTORNO_MAPA
  }, sem);
}
function samaumaMapa(cam, x, y) {
  troncoArvPx(cam, x, y - 30, y, 18, TRONCO_M, { sem: 3, curva: 2, raiz: 1.3, wTopo: 11, contorno: CONTORNO_MAPA });
  // copa enorme em três andares de tufos
  for (const [dx, dy, r, s] of [[-34, -44, 26, 1], [34, -42, 27, 2], [0, -58, 30, 3], [-18, -78, 24, 4], [20, -80, 25, 5], [0, -96, 22, 6]])
    copaPx(cam, x + dx, y + dy, r, COPA.samauma, s + 40, COPA.samauma.contorno);
  // cipós caindo da copa
  for (const [dx, l] of [[-42, 16], [-26, 22], [30, 18], [44, 12]]) for (let k = 0; k < l; k++) {
    const yy = y - 38 + k, xx = x + dx + Math.round(Math.sin(k * 0.4) * 0.8);
    cam.set(xx, yy, k % 4 === 0 ? '#86B83C' : '#2C6A2C');
  }
}
function bandeiraMapa(cam, x, y, t) {
  for (let yy = y - 22; yy <= y; yy++) { cam.set(x, yy, '#6B3A20'); cam.set(x + 1, yy, '#A86A38'); }
  cam.set(x, y - 23, '#FFD84A'); cam.set(x + 1, y - 23, '#FFD84A');
  // bandeira verde com a folha do Curupira, tremulando
  const v = voltaM(t, 2) * TAU;
  for (let i = 0; i < 12; i++) {
    const dy = Math.round(Math.sin(v - i * 0.5) * 1.2);
    for (let j = 0; j < 8; j++) {
      const borda = j === 0 || j === 7 || i === 11;
      cam.set(x + 2 + i, y - 21 + j + dy, borda ? '#2C6A2C' : '#4E8C33');
    }
  }
  const dy = Math.round(Math.sin(v - 3) * 1.2);
  cam.carimbo(['..L..', '.LVL.', 'LVVVL', '.LVL.', '..L..'], x + 6, y - 20 + dy, { L: '#C6E070', V: '#86B83C' });
}
function placaMapa(cam, x, y) {
  const p = new Camada(cam.W, cam.H);
  for (let yy = y - 18; yy <= y; yy++) { p.set(x, yy, '#7A4A28'); p.set(x + 1, yy, '#5A341C'); }
  for (const [dy, dir, w] of [[-17, 1, 12], [-11, -1, 11], [-5, 1, 10]]) for (let k = 0; k < w; k++) for (let j = 0; j < 4; j++) {
    const xx = dir > 0 ? x + 2 + k : x - 1 - k, ponta = k === w - 1 && (j === 0 || j === 3);
    if (!ponta) p.set(xx, y + dy + j, j === 0 ? '#C8925A' : j === 3 ? '#7A4A28' : '#A8743E');
  }
  cam.colar(p.contornar(CONTORNO_MAPA));
}
function cercaMapa(cam, x0, x1, y, aberturas = []) {
  const c = new Camada(cam.W, cam.H);
  const livre = x => aberturas.every(([a, b]) => x < a || x > b);
  for (let x = x0; x <= x1; x++) {
    if (!livre(x)) continue;
    const poste = (x - x0) % 10 === 0;
    for (let yy = y - 9; yy <= y; yy++) {
      if (poste) c.set(x, yy, yy === y - 9 ? '#C8CED4' : '#6E767E');
      else if (yy === y - 8) c.set(x, yy, '#9AA2AA');   // arame de cima
      else if (yy > y - 8 && yy < y && (x + yy) % 3 === 0) c.set(x, yy, '#8A929A');   // tela
    }
  }
  cam.colar(c);
}
const MEIO_PORTAO = (CERCA.portao[1] - CERCA.portao[0]) / 2;
function portaoMapa(cam, aberto, xm, y) {
  const a = Math.round(xm - MEIO_PORTAO), b = Math.round(xm + MEIO_PORTAO);
  const c = new Camada(cam.W, cam.H);
  if (!aberto) {
    for (let x = a; x <= b; x++) for (let yy = y - 10; yy <= y; yy++) {
      const quadro = x === a || x === b || x === Math.round((a + b) / 2) || yy === y - 10 || yy === y;
      if (quadro) c.set(x, yy, '#4A5058'); else if ((x + yy) % 3 === 0) c.set(x, yy, '#8A929A');
    }
    cam.colar(c.contornar('#1A1C20'));
    // corrente e cadeado, e a placa de perigo
    const m = Math.round((a + b) / 2);
    for (let yy = y - 6; yy <= y - 3; yy++) { cam.set(m - 1, yy, '#C8CED4'); cam.set(m + 1, yy, '#C8CED4'); }
    cam.carimbo(['.ooo.', 'o...o', 'YYYYY', 'YYkYY', 'YYYYY'], m - 2, y - 7, { o: '#9AA2AA', Y: '#F2C230', k: '#1A1C20' });
    cam.carimbo(['RRRRRRR', 'RWWWWWR', 'RWRRRWR', 'RWWWWWR', 'RRRRRRR'], a + 2, y - 9, { R: '#C8261B', W: '#FFFFFF' });
  } else {
    // as duas folhas abertas para dentro do pátio
    for (const [x, dir] of [[a, 1], [b, -1]]) for (let k = 0; k < 7; k++) for (let yy = y - 10 - k; yy <= y - k; yy++) {
      const xx = x + dir * Math.round(k * 0.4), quadro = k === 0 || k === 6 || yy === y - 10 - k || yy === y - k;
      if (quadro) c.set(xx, yy, '#4A5058'); else if ((k + yy) % 3 === 0) c.set(xx, yy, '#8A929A');
    }
    cam.colar(c);
  }
}

/* ---------- prédio da Máquina (fundo) ---------- */
function predioMapa(cam) {
  const P = PREDIO, p = new Camada(MAPA_W, MAPA_H);
  // sombra do prédio no pátio, para a direita e para baixo
  sombraChao(cam, (P.x0 + P.x1) / 2 + 10, P.base + 2, (P.x1 - P.x0) / 2 + 6, 6);
  // telhado (a face de cima): laje clara com máquinas de ar
  for (let y = P.teto; y < P.frente; y++) for (let x = P.x0; x <= P.x1; x++) {
    const borda = y === P.teto || x === P.x0 || x === P.x1 || y === P.frente - 1;
    p.set(x, y, borda ? '#E2E6EA' : (x + y) % 16 === 0 ? '#B6BCC2' : '#C8CED4');
  }
  for (const [x, y] of [[P.x0 + 12, P.teto + 8], [P.x0 + 34, P.teto + 10], [P.x1 - 40, P.teto + 22]]) {
    for (let j = 0; j < 9; j++) for (let i = 0; i < 14; i++) p.set(x + i, y + j, j < 5 ? (i % 3 === 0 ? '#7E868E' : '#9AA2AA') : '#6E767E');
  }
  // fachada: concreto com três faixas de janelas espelhadas
  for (let y = P.frente; y <= P.base; y++) for (let x = P.x0; x <= P.x1; x++) {
    const linha = (y - P.frente - 6) % 20, col = (x - P.x0 - 6) % 14;
    const janela = y > P.frente + 4 && y < P.base - 26 && linha >= 0 && linha < 11 && col >= 0 && col < 10;
    let c = x === P.x0 ? '#A0A8B0' : x === P.x1 ? '#5E666E' : y === P.frente ? '#B6BEC6' : '#7E868E';
    if (janela) c = (linha + col) % 9 < 3 ? '#9CD0F0' : linha < 3 ? '#4A82B4' : '#36689A';
    p.set(x, y, c);
  }
  // porta de vidro escuro, letreiro com o chip e degrau
  for (let y = P.base - 22; y <= P.base; y++) for (let x = P.porta[0]; x <= P.porta[1]; x++) {
    const meio = x === Math.round((P.porta[0] + P.porta[1]) / 2);
    p.set(x, y, x === P.porta[0] || x === P.porta[1] || y === P.base - 22 || meio ? '#2A2E34' : (x + y) % 7 < 2 ? '#4A6A8A' : '#1E2A38');
  }
  for (let y = P.base - 34; y < P.base - 25; y++) for (let x = P.porta[0] - 12; x <= P.porta[1] + 12; x++) p.set(x, y, y === P.base - 34 || y === P.base - 26 ? '#1A1C20' : '#2E3440');
  noMapa(p, (P.porta[0] + P.porta[1]) / 2, P.base - 30, (l, x, y) => chipPx(l, x, y, 0, true));
  // chaminé e antena no telhado
  for (let y = P.teto - 22; y < P.teto + 14; y++) for (let x = P.x1 - 18; x < P.x1 - 8; x++) p.set(x, y, Math.floor((y - P.teto + 22) / 6) % 2 ? '#C8261B' : '#E6EAED');
  for (let x = P.x1 - 18; x < P.x1 - 8; x++) p.set(x, P.teto - 22, '#2A2E34');
  for (let y = P.teto - 30; y < P.teto + 6; y++) p.set(P.x0 + 16, y, '#4A5058');
  p.contornar('#121418');
  colarObjeto(cam, p, 0, 0);
}
function tratorMapa(cam, x, y) {
  const p = new Camada(MAPA_W, MAPA_H);
  // lâmina, esteiras, corpo amarelo e cabine
  for (let i = -2; i < 26; i++) for (let j = 0; j < 4; j++) p.set(x + i, y + j, j === 0 ? '#3A3E44' : '#2A2E34');
  for (let i = 0; i < 24; i++) for (let j = -12; j < 0; j++) p.set(x + i, y + j, j < -9 ? '#FFE070' : i > 18 ? '#C8961E' : '#F2C230');
  for (let i = 6; i < 18; i++) for (let j = -22; j < -12; j++) p.set(x + i, y + j, j === -22 ? '#4A5058' : (i < 9 || i > 15) ? '#4A5058' : '#7AB0D0');
  for (let i = -6; i < 30; i++) for (let j = 0; j < 3; j++) if (i < 0 || i > 24) p.set(x + i, y - 4 + j, '#6E767E');
  p.contornar('#121418');
  colarObjeto(cam, p, 0, 0);
}
function tocoMapa(cam, x, y, sem) {
  const p = new Camada(MAPA_W, MAPA_H), r = 3 + Math.round(hash(sem) * 2);
  for (let yy = y - 4; yy <= y; yy++) for (let xx = x - r; xx <= x + r; xx++) p.set(xx, yy, xx < x - r + 2 ? '#8A5A34' : '#6B4428');
  elipse(p, x + 0.5, y - 4.5, r + 0.5, 2, '#D6A86E');
  p.set(x, y - 5, '#B88A54'); p.set(x + 1, y - 4, '#B88A54');
  p.contornar(CONTORNO_MAPA);
  colarObjeto(cam, p, 0, 0);
}
function pedraMapa(cam, x, y, w, sem) {
  const p = new Camada(MAPA_W, MAPA_H);
  elipse(p, x, y - w * 0.3, w, w * 0.6, '#9A9890');
  elipse(p, x - w * 0.25, y - w * 0.5, w * 0.6, w * 0.3, '#C2BEB4');
  p.contornar('#2E2C28');
  colarObjeto(cam, p, 0, 0);
}
function arbustoMapa(cam, x, y, sem, pal = COPA.arvoreEsc) {
  const p = new Camada(64, 64);
  tufoPx(p, 32, 26, 6 + hash(sem) * 2, pal, sem);
  tufoPx(p, 27, 29, 4.5, pal, sem + 1); tufoPx(p, 37, 29, 4.5, pal, sem + 2);
  if (hash(sem + 3) > 0.5) for (const [dx, dy] of [[-3, -2], [2, -4], [4, 0]]) p.set(32 + dx, 26 + dy, '#F4E66A');
  p.contornar(pal.contorno);
  colarObjeto(cam, p, x - 32, y - 33);
}
function canoaMapa(cam, x, y) {
  const p = new Camada(MAPA_W, MAPA_H);
  elipse(p, x, y, 16, 4, '#8A5A34', -12);
  elipse(p, x, y - 1, 13, 2.4, '#5A3A20', -12);
  for (const k of [-6, 0, 6]) p.set(x + k, y - 1 - Math.round(k * -0.2), '#A8743E');
  p.contornar(CONTORNO_MAPA);
  colarObjeto(cam, p, 0, 0);
  // o remo largado na areia
  for (let k = 0; k < 14; k++) cam.set(x + 10 + k, y + 7 - Math.round(k * 0.3), k > 10 ? '#C8925A' : '#7A4A28');
}
function caldeiraoMapa(cam, x, y) {
  const p = new Camada(MAPA_W, MAPA_H);
  elipse(p, x, y - 4, 9, 6, '#26242C');
  elipse(p, x, y - 8, 9, 3, '#3A3842');
  elipse(p, x, y - 8, 7, 2, '#3EA83A');
  p.set(x - 5, y - 5, '#4E4C58');
  p.contornar('#060408');
  colarObjeto(cam, p, 0, 0);
}
function vitoriaRegia(cam, x, y, r) {
  const p = new Camada(MAPA_W, MAPA_H);
  elipse(p, x, y, r, r * 0.55, '#4E9A3A');
  elipse(p, x - r * 0.2, y - r * 0.1, r * 0.6, r * 0.3, '#6CB050');
  for (let k = 0; k < r; k++) p.apagar(x + k, y);   // o corte da folha
  p.contornar('#1E4A1E');
  cam.colar(p);
}
function pierMapa(cam) {
  const [a, b] = PIER, y = a.y;
  for (let x = a.x; x <= b.x; x++) for (let yy = y - 5; yy <= y + 4; yy++) {
    const tabua = (x - a.x) % 4 === 3;
    cam.set(x, yy, yy === y + 4 ? '#5A341C' : tabua ? '#7A4A28' : yy === y - 5 ? '#C8925A' : '#A8743E');
    TER[yy * MAPA_W + x] = TRN.PONTE;
  }
  for (const x of [a.x + 2, a.x + 22, a.x + 42, b.x - 2]) for (const yy of [y - 7, y + 4]) for (let k = 0; k < 4; k++) cam.set(x, yy + k, '#4A2A16');
}
function ponteMapa(cam) {
  // tábuas atravessadas na direção da trilha, com corrimão nas beiras
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    if (TER[y * MAPA_W + x] !== TRN.PONTE) continue;
    const p = pt(x + 0.5, y + 0.5), r = distPoli(p, TRILHAS.maquina);
    const a = TRILHAS.maquina[r.i], b = TRILHAS.maquina[r.i + 1], dir = unit(sub(b, a));
    const ao = (p.x - a.x) * dir.x + (p.y - a.y) * dir.y;
    const beira = r.d > 4.6;
    cam.set(x, y, beira ? '#4A2A16' : Math.floor(ao) % 4 === 0 ? '#7A4A28' : (ao % 4) < 1.5 ? '#C8925A' : '#A8743E');
  }
}

/* ---------- montagem ---------- */
const FRASCOS = [[262, 200, '#5AF07A'], [246, 178, '#A06AF0'], [236, 192, '#5AF07A'], [270, 214, '#F06AA8'], [214, 170, '#5AF07A']];
let MAPA_BASE = null, ANDA = null, AGUA_PIX = null, BRASAS = null;

function montarMapa() {
  if (MAPA_BASE) return;
  classificar();
  BLOQ = new Uint8Array(MAPA_W * MAPA_H);
  const cam = new Camada(MAPA_W, MAPA_H);
  pintarChao(cam);
  ponteMapa(cam);
  pierMapa(cam);
  mataFechada(cam);

  // samaúma do Curupira e a placa no cruzamento
  objeto('samauma', 480, 336, (c, x, y) => samaumaMapa(c, x, y), { pe: [12, 4], sombra: [56, 14] });
  objeto('placa', 506, 390, (c, x, y) => placaMapa(c, x, y), { pe: [2, 1] });

  // Máquina: prédio, cerca, portão, trator e tocos da mata derrubada
  predioMapa(cam);
  for (const [x, y0, y1] of [[CERCA.x0, 14, CERCA.y], [CERCA.x1, 14, CERCA.y]]) {
    for (let y = y0; y <= y1; y++) {
      if ((y - y0) % 8 === 0) for (let k = 0; k < 9; k++) cam.set(x, y - k, k === 8 ? '#C8CED4' : '#6E767E');
      cam.set(x, y - 8, '#9AA2AA');
      if (y % 3 === 0) cam.set(x + 1, y - 4, '#8A929A');
    }
    // a cerca do lado fecha o pátio do alto do mapa até a cerca da frente (sem fresta nas pontas)
    for (let y = 0; y <= y1; y++) for (let k = -1; k <= 1; k++) BLOQ[y * MAPA_W + x + k] = 1;
  }
  const meioCerca = Math.round((CERCA.x1 - CERCA.x0) / 2);
  objeto('cerca', CERCA.x0 + meioCerca, CERCA.y, (c, x, y) => cercaMapa(c, x - meioCerca, x + meioCerca, y,
    [[x - meioCerca + CERCA.portao[0] - CERCA.x0, x - meioCerca + CERCA.portao[1] - CERCA.x0]]), { pe: [0, 0], caixa: [meioCerca * 2 + 12, 20, meioCerca + 6, 16] });
  for (let x = CERCA.x0; x <= CERCA.x1; x++) if (x < CERCA.portao[0] || x > CERCA.portao[1]) for (let y = CERCA.y - 2; y <= CERCA.y; y++) BLOQ[y * MAPA_W + x] = 1;
  const mPortao = Math.round((CERCA.portao[0] + CERCA.portao[1]) / 2);
  objeto('portao_fechado', mPortao, CERCA.y, (c, x, y) => portaoMapa(c, false, x, y), { mostrar: 'trancado', pe: [0, 0], caixa: [44, 24, 22, 20] });
  objeto('portao_aberto', mPortao, CERCA.y - 1, (c, x, y) => portaoMapa(c, true, x, y + 1), { mostrar: 'aberto', pe: [0, 0], caixa: [44, 30, 22, 25] });
  tratorMapa(cam, 652, 112);
  for (let k = 0; k < 40; k++) {
    const x = 610 + hash(k * 3.7) * 340, y = 20 + hash(k * 5.1) * 260;
    const t = ter(Math.round(x), Math.round(y));
    if (t !== TRN.DEVASTADO || distPoli(pt(x, y), TRILHAS.maquina).d < 12) continue;
    tocoMapa(cam, Math.round(x), Math.round(y), k);
  }

  // Mula: duas árvores grandes pegando fogo, uma de cada lado da trilha (o arco da entrada)
  for (const [x, y, s] of [[194, 437, 1], [221, 490, 2], [168, 452, 3], [178, 506, 4]])
    objeto('arvore_fogo', x, y, (c, X, Y, t) => arvoreEmChamas(c, X, Y, t, s), { animado: true, pe: [3, 2], sombra: [10, 4] });

  // Cuca: duas árvores tortas e escuras com barba-de-velho, uma de cada lado da boca da mata
  for (const [x, y, s] of [[292, 196, 5], [249, 224, 6]])
    objeto('arvore_cuca', x, y, (c, X, Y) => arvoreTorta(c, X, Y, s), { pe: [3, 2], sombra: [10, 4] });

  // Cuca: caldeirão no fim da boca da mata
  caldeiraoMapa(cam, CALDEIRAO.x, CALDEIRAO.y);

  // Boto: canoa, vitórias-régias e palmeiras na prainha
  canoaMapa(cam, 640, 492);
  for (const [x, y, r] of [[770, 430, 7], [800, 520, 9], [742, 500, 6], [860, 452, 8]]) vitoriaRegia(cam, x, y, r);
  for (const [x, y, s] of [[612, 470, 1], [632, 412, 2], [700, 392, 3], [606, 516, 4], [756, 372, 5]]) {
    if (ter(x, y) !== TRN.AREIA && ter(x, y) !== TRN.GRAMA) continue;
    objeto('palmeira', x, y, (c, X, Y, t) => palmeiraMapa(c, X, Y, t, s), { animado: true, pe: [2, 1], sombra: [12, 4] });
  }

  // pedras na beira do rio
  for (const [x, y, w] of [[540, 120, 5], [596, 160, 4], [640, 300, 6], [530, 40, 4]]) if (ANDAVEL.has(ter(x, y))) pedraMapa(cam, x, y, w, x);

  // árvores soltas nos campos: verdes, ipês amarelos e roxos; queimadas perto do fogo
  const longeDeTudo = (x, y, d) => Object.values(TRILHAS).every(tr => distPoli(pt(x, y), tr).d > d)
    && Object.values(ENTRADAS).every(e => Math.hypot(e.centro.x - x, e.centro.y - y) > 34 && Math.hypot(e.volta.x - x, e.volta.y - y) > 26)
    && Math.hypot(x - HUB.x, y - HUB.y) > 70 && Math.hypot(x - 480, y - 300) > 70;
  let k = 0;
  for (let gy = 20; gy < MAPA_H; gy += 34) for (let gx = 20; gx < MAPA_W; gx += 38) {
    k++;
    const x = Math.round(gx + (hash(k * 1.3) - 0.5) * 30 + (Math.floor(gy / 34) % 2) * 19), y = Math.round(gy + (hash(k * 2.9) - 0.5) * 24);
    if (x < 6 || y < 6 || x > MAPA_W - 6 || y > MAPA_H - 6) continue;
    const t = ter(x, y), sorteio = hash(k * 7.7);
    if (!longeDeTudo(x, y, 15) || BLOQ[y * MAPA_W + x]) continue;
    if (t === TRN.GRAMA) {
      if (sorteio < 0.12) { arbustoMapa(cam, x, y, k); continue; }
      const pal = sorteio < 0.62 ? (hash(k) > 0.5 ? COPA.arvore : COPA.arvoreEsc) : sorteio < 0.86 ? COPA.ipeAmarelo : COPA.ipeRoxo;
      const r = 11 + Math.round(hash(k * 4.4) * 4), sem = k;
      objeto('arvore', x, y, (c, X, Y) => arvoreMapa(c, X, Y, { r, pal, sem }), { pe: [3, 2], sombra: [r * 0.9, r * 0.38] });
      // flores caídas embaixo dos ipês
      if (pal === COPA.ipeAmarelo || pal === COPA.ipeRoxo) for (let f = 0; f < 18; f++) {
        const a = hash(k + f * 1.7) * TAU, d = hash(k * 3 + f) * r * 1.1, fx = Math.round(x + Math.cos(a) * d), fy = Math.round(y + 2 + Math.sin(a) * d * 0.45);
        if (ter(fx, fy) === TRN.GRAMA) cam.set(fx, fy, pal.base);
      }
    } else if (t === TRN.QUEIMADO && sorteio < 0.7) {
      const sem = k;
      objeto('arvore_queimada', x, y, (c, X, Y, tt) => arvoreQueimada(c, X, Y, tt, sem), { animado: true, pe: [2, 1], sombra: [7, 3] });
    } else if (t === TRN.DEVASTADO && sorteio < 0.3) tocoMapa(cam, x, y, k);
  }

  // bandeiras: aparecem depois de libertar cada ser
  for (const [id, prog, dx, dy] of [['mula', 'fase1', 18, -16], ['cuca', 'fase2', 22, 6], ['boto', 'fase3', -8, -26], ['maquina', 'boss', 30, -4]]) {
    const v = ENTRADAS[id].volta;
    objeto('bandeira_' + id, v.x + dx, v.y + dy, (c, x, y, t) => bandeiraMapa(c, x, y, t), { animado: true, mostrar: 'concluiu:' + prog, pe: [1, 1] });
  }

  // sombras no chão e pés dos objetos (bloqueiam só o tronco)
  for (const o of OBJETOS) {
    if (o.sombra) sombraChao(cam, o.x + 2, o.y + 1, o.sombra[0], o.sombra[1]);
    if (o.pe[0] > 0) bloquearElipse(o.x, o.y, o.pe[0], o.pe[1]);
  }

  // onde dá para andar
  ANDA = new Uint8Array(MAPA_W * MAPA_H);
  for (let y = 4; y < MAPA_H - 4; y++) for (let x = 4; x < MAPA_W - 4; x++) {
    const i = y * MAPA_W + x;
    ANDA[i] = ANDAVEL.has(TER[i]) && !BLOQ[i] ? 1 : 0;
  }
  // a ponte e o píer passam por cima de tudo
  for (let i = 0; i < ANDA.length; i++) if (TER[i] === TRN.PONTE) ANDA[i] = 1;
  // a mata da Cuca e a do fogo: só a boca, até a entrada
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    const p = pt(x + 0.5, y + 0.5);
    if (distSeg(p, BOCA_CUCA[0], BOCA_CUCA[1]).d < 8 && ter(x, y) === TRN.BOCA_CUCA && Math.hypot(p.x - CALDEIRAO.x, p.y - CALDEIRAO.y) > 14) ANDA[y * MAPA_W + x] = 1;
  }

  // listas para animar
  AGUA_PIX = [];
  for (let i = 0; i < TER.length; i++) if (TER[i] === TRN.AGUA) AGUA_PIX.push(i);
  BRASAS = [];
  for (let k2 = 0; k2 < 260; k2++) {
    const x = Math.round(hash(k2 * 9.1) * 380), y = Math.round(300 + hash(k2 * 4.3) * 240);
    if (ter(x, y) === TRN.QUEIMADO) BRASAS.push([x, y, hash(k2)]);
  }
  MAPA_BASE = cam;
}

/* um quadro do fundo (com a água, o fogo e as luzes mexendo) e da frente */
function mapaQuadro(t) {
  montarMapa();
  const v = voltaM(t), cam = new Camada(MAPA_W, MAPA_H), frente = new Camada(MAPA_W, MAPA_H);
  cam.colar(MAPA_BASE);
  // água: brilhos piscando, correnteza descendo o rio e espuma na beira
  for (const i of AGUA_PIX) {
    const x = i % MAPA_W, y = (i - x) / MAPA_W, h = hash(x * 0.37 + y * 1.71);
    const noRio = fatorLago(x, y) >= 1;
    if (noRio) {
      if (Math.floor(RIO_U[i] * 40 - v * 2 * 12 + h * 3) % 9 === 0 && h > 0.55) cam.set(x, y, PAL_CHAO.aguaL);
    } else if (h > 0.93 && Math.sin((v * 2 + h * 7) * TAU) > 0.7) cam.set(x, y, x > 850 + Math.sin(y * 0.045) * 22 ? PAL_CHAO.barroL : PAL_CHAO.aguaL);
    const beira = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const q = ter(x + dx, y + dy); return q !== TRN.AGUA && q !== TRN.PONTE; });
    if (beira && Math.sin(v * TAU * 2 + x * 0.21 + y * 0.13) > 0.1) cam.set(x, y, PAL_CHAO.espuma);
  }
  // o Boto nadando em volta do píer: a barbatana rosa e o rastro
  {
    const a = v * TAU, c = pt(PIER[1].x + 34 + Math.cos(a) * 22, PIER[1].y + 18 + Math.sin(a) * 9);
    for (let k = 1; k < 7; k++) { const b = pt(c.x - Math.cos(a + Math.PI / 2) * k * 2, c.y - Math.sin(a + Math.PI / 2) * k); cam.set(b.x + k * 0.6, b.y + 1, PAL_CHAO.espuma); cam.set(b.x - k * 0.6, b.y + 1, PAL_CHAO.espuma); }
    cam.carimbo(['..o..', '.oPo.', 'oPPLo', 'oPPPL'], Math.round(c.x) - 2, Math.round(c.y) - 3, { o: '#6A2A40', P: '#E88AB0', L: '#FFC0D8' });
  }
  // fogo da mata da Mula e brasas no chão queimado
  for (const ch of CHAMAS_MATA) noMapa(cam, ch.x, ch.y, (l, x, y) => chamaPx(l, x, y, 270, ch.larg, ch.alt, v * TAU * 2 + ch.sem, { n: 4, vel: 1, semente: ch.sem }));
  for (const [x, y, f] of BRASAS) { const s = Math.sin((v * 2 + f) * TAU); if (s > 0.2) cam.set(x, y, s > 0.8 ? '#FFB04A' : '#C8501A'); }
  // luz verde do caldeirão da Cuca, pulsando na boca da mata
  {
    const pulso = 0.8 + 0.2 * Math.sin(v * TAU * 2), R = 62;
    for (let y = CALDEIRAO.y - R; y < CALDEIRAO.y + R; y++) for (let x = CALDEIRAO.x - R; x < CALDEIRAO.x + R; x++) {
      const d = Math.hypot((x - CALDEIRAO.x) * 0.9, y - CALDEIRAO.y) / R;
      if (d >= 1) continue;
      const c = cam.get(x, y);
      if (c && pontilha(x, y, (1 - d) * pulso * 1.3)) cam.set(x, y, tingir(c, '#5AF07A', 0.55 * (1 - d) + 0.12));
    }
    for (let i = 0; i < 4; i++) {
      const u = (v * 2 + i / 4) % 1, x = CALDEIRAO.x - 5 + hash(i) * 10, y = CALDEIRAO.y - 9 - u * 7;
      if (u < 0.8) cam.disco(x, y, 0.8 + u, '#8AFA8A'); else cam.set(x, y, '#C8FFC8');
    }
  }
  // frascos de poção largados na boca da mata, brilhando um de cada vez
  FRASCOS.forEach(([x, y, cor], i) => {
    const brilho = Math.sin((v * 2 + i / FRASCOS.length) * TAU) > 0.3;
    if (brilho) for (const [dx, dy] of [[-2, -2], [2, -2], [0, -5], [-3, 0], [3, 0]]) cam.set(x + dx, y + dy, tingir(cor, '#FFFFFF', 0.4));
    cam.carimbo(['.k.', '.k.', 'GLG', 'GGG', '.G.'], x - 1, y - 4, { k: '#6E5A44', G: cor, L: brilho ? '#FFFFFF' : tingir(cor, '#FFFFFF', 0.5) });
  });
  // Máquina: luz da antena e o olho do chip piscando
  if (Math.floor(t * 2) % 2) for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) cam.set(PREDIO.x0 + 16 + k, PREDIO.teto - 31 + j, '#FF2A1A');

  // frente: névoa da Cuca, fumaça da Mula e da chaminé, brasas subindo, vaga-lumes verdes
  for (let i = 0; i < 14; i++) {
    const cx = 20 + hash(i * 2.3) * 330 + Math.sin(v * TAU + i) * 5, cy = 20 + hash(i * 4.1) * 240 + Math.cos(v * TAU + i * 1.7) * 2;
    const rx = 34 + hash(i * 6.1) * 30, ry = rx * 0.32 * (1 + 0.08 * Math.sin(v * TAU * 2 + i));
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (ruido(x, y, 9, i) - 0.5) * 0.5;
      if (d >= 1 || x < 0 || y < 0) continue;
      const q = ter(x, y);
      // a névoa não cobre a boca da trilha (é por ali que se entra)
      if (q !== TRN.MATA_CUCA || distSeg(pt(x, y), BOCA_CUCA[0], BOCA_CUCA[1]).d < 32) continue;
      if (pontilha(x, y, (1 - d) * 0.8)) frente.set(x, y, d < 0.3 ? '#8AA4A0' : '#5E7C80');
    }
  }
  for (let i = 0; i < 10; i++) {
    const x = hash(i * 3.3) * 300 + 10, y = hash(i * 7.7) * 220 + 10 + Math.sin(v * TAU + i) * 4, on = Math.sin(v * TAU * 2 + i * 1.9);
    if (on > 0.2 && ter(Math.round(x), Math.round(y)) === TRN.MATA_CUCA) { frente.set(x, y, '#C8FF9A'); if (on > 0.8) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) frente.set(x + dx, y + dy, '#4AC85A'); }
  }
  for (const [x, y, s] of [[40, 430, 1], [110, 470, 2], [60, 505, 3], [160, 515, 4], [20, 480, 5]]) for (let k = 0; k < 3; k++) {
    const u = (v + k / 3 + hash(s) * 0.3) % 1;
    if (u < 0.85) tufoPx(frente, x + Math.sin(u * 3 + s) * 4 + u * 10, y - u * 46, (2 + u * 7) * (u > 0.6 ? 1 - (u - 0.6) * 1.6 : 1), { luz: '#7A6A62', base: '#5E504A', sombra: '#4A3E3A' }, s + k, true);
  }
  for (let i = 0; i < 22; i++) {
    const u = (v + hash(i * 5)) % 1, x = hash(i) * 260 + Math.sin(u * TAU + i) * 5, y = 520 - hash(i * 3) * 120 - u * 70;
    if (u < 0.85) frente.set(x, y, u < 0.5 && i % 3 === 0 ? '#FFB04A' : '#E0602A');
  }
  for (let i = 0; i < 4; i++) {
    const u = (v + i / 4) % 1;
    noMapa(frente, PREDIO.x1 - 13 + u * 14, PREDIO.teto - 26 - u * 26, (l, x, y) => fumacaPx(l, x, y, 3 + u * 5, { claro: '#B8B4B0', medio: '#9A9690', contorno: '#6E6A66' }));
  }
  return { cam, frente };
}

/* um objeto num quadro: camada pequena com a base em (ax, ay) */
function objetoQuadro(o, t) {
  const [W, H, ax, ay] = o.caixa, cam = new Camada(W, H);
  o.desenhar(cam, ax, ay, t);
  return { cam, ax, ay };
}
