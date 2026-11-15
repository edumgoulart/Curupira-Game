/* curupira_rascunho.js — rascunhos parados do Curupira para escolher o desenho antes de passar
   para o gerador. Coluna reta (nada de barriga para a frente com as costas arqueadas) e os pés
   virados para trás, como na lenda: o calcanhar fica na frente e os dedos apontam para trás.
   A cabeça é a de hoje (CABECA, cabeloPx e rostoPixel de desenho.js); só o corpo muda.
   Usa as ferramentas de art/pixel/gerador (Camada, elipse, poli, curvaQ, PM...).
   Olhando para a direita (frente = +x), pés em (X, CHAO_PX). */

// medidas em pixels da arena (480×270). quadril = altura do quadril; tronco = do quadril ao ombro.
const PROPORCOES = {
  atual:  { quadril: 16.5, tronco: 12.5, r: 9, coxa: 7.4, canela: 7, braco: [5.4, 5], peito: 4.6, costas: 4.2, wCoxa: 5, wCanela: 4, wBraco: 3.2, wAnte: 3 },
  heroi:  { quadril: 16.5, tronco: 13, r: 9, coxa: 7.4, canela: 7, braco: [5.6, 5.2], peito: 5.8, costas: 4.8, wCoxa: 5.6, wCanela: 4.4, wBraco: 3.8, wAnte: 3.4 },
  esguio: { quadril: 18.5, tronco: 11.5, r: 9, coxa: 8.4, canela: 8, braco: [5.4, 5.2], peito: 4.2, costas: 3.8, wCoxa: 4.2, wCanela: 3.4, wBraco: 2.8, wAnte: 2.6 }
};
const PINT = '#2A1424';   // jenipapo: tinta escura, para não parecer machucado
const RF = { S: PM.pele, d: PM.peleS, L: PM.peleL };    // membros da frente
const RT = { S: PM.peleS, d: PM.peleD, L: PM.pele };    // membros de trás

// junta do meio (joelho, cotovelo) por cinemática inversa; dir diz para que lado ela dobra
function ikR(a, b, L1, L2, dir) {
  const d = Math.min(Math.hypot(b.x - a.x, b.y - a.y), L1 + L2 - 0.01) || 0.01, u = unit(sub(b, a));
  const ang = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)) * 180 / Math.PI;
  const k1 = soma(a, mul(rot(u, ang), L1)), k2 = soma(a, mul(rot(u, -ang), L1));
  const s = k => (k.x - a.x) * dir.x + (k.y - a.y) * dir.y;
  return s(k1) >= s(k2) ? k1 : k2;
}
// pinta só onde a camada já tem a cor base (para riscar detalhe por cima da pele)
const riscoR = (c, x, y, cor, base) => { x = Math.floor(x); y = Math.floor(y); if (c.get(x, y) && (!base || c.get(x, y) === base)) c.set(x, y, cor); };

/* ---------- pé virado para trás ---------- */
function peR(c, k, rp) {
  const P = (x, y) => pt(k.x + x, CHAO_PX + y);
  // calcanhar redondo na frente (+x), peito do pé descendo até os dedos atrás (-x)
  poli(c, [P(-1.6, -4.6), P(1.4, -4.6), P(2.6, -3.6), P(3.2, -1.8), P(2.6, 0), P(-5.6, 0), P(-5.8, -2.2), P(-3.6, -3.2)], rp.S);
  // três dedos redondos apontando para trás
  for (const [dx, dy, rr] of [[-5.6, -1.6, 1.3], [-6.4, -0.9, 1.1], [-4.4, -2.4, 1.2]]) c.disco(k.x + dx, CHAO_PX + dy, rr, rp.S);
}
function dedosR(c, k, rp) {
  const x = Math.floor(k.x), y = CHAO_PX;
  // vincos entre os dedos, unhas claras na ponta, osso do tornozelo e luz no calcanhar
  riscoR(c, x - 5, y - 3, rp.d); riscoR(c, x - 6, y - 2, rp.d);
  riscoR(c, x - 8, y - 1, PM.peleLL); riscoR(c, x - 7, y - 2, PM.peleLL); riscoR(c, x - 6, y - 3, PM.peleLL);
  riscoR(c, x + 2, y - 3, rp.L); riscoR(c, x + 2, y - 2, rp.L);
  riscoR(c, x - 1, y - 4, rp.d);
}
/* ---------- membros ---------- */
function pernaR(cam, A, quadril, tornozelo, rp, o) {
  const c = nova(), d = Math.hypot(tornozelo.x - quadril.x, tornozelo.y - quadril.y);
  // perna reta: coxa e canela somam só um pouco mais que a distância, então o joelho quase não dobra
  const kL = o.dobra ? 1 : Math.min(1, d * 1.015 / (A.coxa + A.canela));
  const joelho = ikR(quadril, tornozelo, A.coxa * kL, A.canela * kL, pt(1, -0.15));
  c.traco([quadril, joelho], A.wCoxa, rp.S);
  c.traco([joelho, tornozelo], A.wCanela, rp.S);
  peR(c, tornozelo, rp);
  c.sombrear(rp.S, rp.d, rp.L);
  dedosR(c, tornozelo, rp);
  if (o.tornozeleira) for (let i = 0; i < 4; i++) {
    const p = pt(tornozelo.x - 2 + i * 1.4, tornozelo.y - 1.6);
    c.set(p.x, p.y, i % 2 ? PM.verdeM : PM.verde); c.set(p.x, p.y + 1, PM.verdeD);
    if (i % 2) c.set(p.x - 0.5, p.y - 1, PM.verdeL);
  }
  cam.colar(c.contornar(PM.peleO));
}
function maoR(c, p, forma, rp, frente) {
  if (forma === 'palma') {
    poli(c, [pt(p.x - 1.5, p.y - 1.8), pt(p.x + 3.4, p.y - 1.4), pt(p.x + 3.6, p.y + 0.6), pt(p.x - 1.5, p.y + 1.8)], rp.S);
    c.set(p.x + 0.5, p.y - 2.6, rp.S); c.set(p.x + 1.5, p.y - 2.6, rp.S);   // polegar para cima
  } else if (forma === 'garra') {
    c.disco(p.x, p.y, 2, rp.S);
    for (const dx of [-1, 1, 3]) { c.set(p.x + dx, p.y + 2, rp.S); c.set(p.x + dx + 1, p.y + 3, rp.d); }
  } else c.disco(p.x, p.y, frente ? 2.2 : 2, rp.S);
}
function bracoR(cam, A, ombro, mao, forma, rp, o, frente) {
  const c = nova(), cot = ikR(ombro, mao, A.braco[0], A.braco[1], pt(-0.55, 1));
  c.traco([ombro, cot], A.wBraco, rp.S);
  c.traco([cot, mao], A.wAnte, rp.S);
  maoR(c, mao, forma, rp, frente);
  c.sombrear(rp.S, rp.d, rp.L);
  const meio = lerp(ombro, cot, 0.55), n = unit(rot(sub(cot, ombro), 90));
  const faixa = (m, cor, cor2) => { for (let s = -2; s <= 2; s++) { riscoR(c, m.x + n.x * s, m.y + n.y * s, cor); riscoR(c, m.x + n.x * s + 0.4, m.y + n.y * s + 1, cor2); } };
  if (frente && o.bracadeira) faixa(meio, PM.corda, PM.cordaL);
  if (frente && o.pintura) { faixa(lerp(cot, mao, 0.45), PINT, null); faixa(lerp(ombro, cot, 0.3), PINT, null); }
  if (forma !== 'palma') riscoR(c, mao.x + 1, mao.y - 1, rp.L);
  cam.colar(c.contornar(PM.peleO));
}

/* ---------- tronco, saia e enfeites ---------- */
function troncoR(cam, A, T, pescoco, o) {
  const c = nova(), H = A.tronco, p = A.peito, k = A.costas;
  // costas quase retas: a linha de trás desce sem barriga para a frente nem bunda para trás
  poli(c, [T(-k + 0.4, 1.5), T(-k, -3), T(-k - 0.2, -H * 0.6), T(-k + 0.6, -H + 1.2), T(-k + 2, -H), T(1.5, -H), T(p - 1, -H + 1),
    T(p, -H * 0.72), T(p - 0.4, -H * 0.45), T(p - 1, -H * 0.2), T(p - 0.6, 1.5)], PM.pele);
  c.traco(pescoco, 3.6, PM.pele);
  c.sombrear(PM.pele, PM.peleS, PM.peleL);
  // linha do peitoral e umbigo
  for (let x = 0.2; x <= p - 1.2; x += 0.5) riscoR(c, T(x, -H * 0.55 + (x - p) * -0.12).x, T(x, -H * 0.55 + (x - p) * -0.12).y, PM.peleS, PM.pele);
  { const u = T(p - 1.6, -H * 0.22); riscoR(c, u.x, u.y, PM.peleS); }
  if (o.pintura) for (const [x, y] of [[0.5, -H + 3.5], [1.5, -H + 4.5], [2.5, -H + 3.5], [0.5, -H * 0.38], [1.5, -H * 0.38 + 1]]) { const q = T(x, y); riscoR(c, q.x, q.y, PINT); }
  if (o.cipo) {
    const a = T(-k + 0.6, -H + 1.4), b = T(p - 0.6, -2.6);
    c.traco([a, b], 1.4, PM.verde);
    for (const u of [0.25, 0.55, 0.8]) { const q = lerp(a, b, u); c.set(q.x + 1, q.y - 1, PM.verdeL); c.set(q.x + 2, q.y - 1, PM.verdeM); }
  }
  cam.colar(c.contornar(PM.peleO));
}
function saiaR(cam, A, T, o) {
  const longa = o.saia === 'longa', tanga = o.saia === 'tanga';
  const n = longa ? 7 : 6, comp = longa ? 9 : tanga ? 3.8 : 5.6;
  const tras = nova(), frente = nova();
  for (const i of [...Array(n).keys()].sort((a, b) => (a % 2) - (b % 2))) {
    const u = i / (n - 1), x = mix(-A.costas - 0.6, A.peito + 0.4, u);
    const len = comp * (i % 2 ? 0.62 : 1.08) * (0.9 + 0.2 * hash(i * 3.1 + 7)) * (tanga && u > 0.3 && u < 0.8 ? 0.75 : 1);
    const abre = (u - 0.45) * 4.6;                 // as de trás abrem para trás, as da frente para a frente
    const c = u < 0.3 ? tras : frente, cor = u < 0.3 ? (i % 2 ? PM.verde : PM.verdeD) : (i % 2 ? PM.verdeM : PM.verde);
    // folha estreita pendurada no cinto, com ponta fina
    poli(c, [T(x - 1, -1.6), T(x + 1, -1.6), T(x + 1.7 + abre * 0.5, len * 0.45), T(x + abre, len + 1.8), T(x - 1.7 + abre * 0.5, len * 0.45)], cor);
    if (c === frente) for (let s = 0; s < len * 0.8; s += 0.7) { const q = T(x + abre * s / len * 0.8, s); if (frente.get(Math.floor(q.x), Math.floor(q.y)) === cor) frente.set(q.x, q.y, PM.verdeL); }
  }
  cam.colar(tras.contornar(PM.verdeO)); cam.colar(frente.contornar(PM.verdeO));
  for (let x = -A.costas - 0.5; x <= A.peito + 0.5; x += 0.5) { const q = T(x, -2); cam.set(q.x, q.y, Math.floor(x * 2) % 3 ? PM.corda : PM.cordaL); }
  const n1 = T(A.peito - 0.2, -1.4); cam.set(n1.x, n1.y, PM.cordaL); cam.set(n1.x, n1.y + 1, PM.corda);   // ponta do nó
}
function capaR(cam, A, T) {
  const c = nova(), H = A.tronco;
  for (let i = 0; i < 6; i++) {
    const x = -A.costas + 1.5 - i * 0.9, len = 13 + i * 1.6 + hash(i) * 2, top = -H + 0.5 + i * 0.8;
    poli(c, [T(x + 1, top), T(x + 2.2, top + len * 0.4), T(x - 1.2 - i * 0.6, top + len), T(x - 2.6, top + len * 0.45)], i % 2 ? PM.verde : PM.verdeD);
    for (let s = 1; s < len - 1; s += 0.8) { const q = T(x + 0.4 - s * (0.12 + i * 0.04), top + s); riscoR(c, q.x, q.y, PM.verdeM); }
  }
  cam.colar(c.contornar(PM.verdeO));
}
function colarR(cam, A, T) {
  const pts = curvaQ(T(-1.4, -A.tronco + 0.8), T(1.2, -A.tronco + 5.4), T(A.peito - 0.5, -A.tronco + 2), 14);
  pts.forEach((q, i) => cam.set(q.x, q.y, i % 3 === 0 ? PM.branco : i % 3 === 1 ? PM.pintura : PM.cordaL));
  const m = pts[8]; cam.set(m.x, m.y + 1, PM.branco); cam.set(m.x, m.y + 2, PM.branco); cam.set(m.x + 1, m.y + 1, PM.olhoO);
}

/* ---------- boneco inteiro ---------- */
function curupiraR(cam, X, o) {
  const A = PROPORCOES[o.prop || 'atual'], pose = POSES_R[o.pose || 'guarda'], H = A.tronco, r = A.r;
  const queda = pose.agacha || 0;
  const W = (x, y) => pt(X + x, CHAO_PX + y);
  const quadril = W(pose.quadrilX || 0, -A.quadril * (1 - queda)), inc = pose.inclina;
  const T = (x, y) => soma(quadril, rot(pt(x, y), inc));
  const ombro = T(0.4, -H + 2.2), ombroT = T(-1.2, -H + 2.4);
  const pesc = T(0.9, -H + 0.6), hc = soma(pesc, pt(1.2 + (pose.cabDx || 0), -(r * 0.94 + 0.6 + (o.pescoco || 0))));
  const tornozelos = pose.pes.map(x => W(x, -2.6));
  const maos = pose.maos.map((m, i) => soma(i ? ombro : ombroT, pt(m[0], m[1])));

  if (o.capa) capaR(cam, A, T);
  bracoR(cam, A, ombroT, maos[0], pose.formas[0], RT, o, false);
  const op = { ...o, dobra: pose.dobra };
  pernaR(cam, A, T(-1.4, 0), tornozelos[0], RT, op);
  pernaR(cam, A, T(1.4, 0), tornozelos[1], RF, op);
  troncoR(cam, A, T, [pesc, pt(hc.x - 0.6, hc.y + r * 0.6)], o);
  saiaR(cam, A, T, o);
  if (o.colar) colarR(cam, A, T);
  // cabeça, cabelo e rosto de hoje (desenho.js), sem mudar nada
  const hx = Math.round(hc.x - 9.5), hy = Math.round(hc.y - 9);
  let parte = nova(); parte.carimbo(ORELHA, hx - 2, hy + 8, MAPA_PELE); cam.colar(parte.contornar(PM.peleO));
  parte = nova(); parte.carimbo(CABECA, hx, hy, MAPA_PELE); cam.colar(parte.contornar(PM.peleO));
  cabeloPx(cam, hx, hy, 0, E5.vento, 1);
  rostoPixel(cam, hx, hy, exDe(o.ex || 'oba'), 0, false, 0);
  bracoR(cam, A, ombro, maos[1], pose.formas[1], RF, o, true);
  return { mao: maos[1], cabeca: hc };
}

// mãos relativas ao ombro (trás, frente); pés = x do tornozelo de trás e da frente
const POSES_R = {
  guarda:   { pes: [-3.6, 3.4], maos: [[5, 6], [7, 3]], formas: ['punho', 'punho'], inclina: 4 },
  relaxado: { pes: [-2.2, 2.6], maos: [[0.5, 10.5], [1.8, 10]], formas: ['punho', 'punho'], inclina: 1.5 },
  mira:     { pes: [-4.4, 4], maos: [[3.5, 6], [12, 0.5]], formas: ['punho', 'palma'], inclina: 6 },
  bote:     { pes: [-7.5, 6.5], maos: [[7, 7], [10, 5]], formas: ['garra', 'garra'], inclina: 16, agacha: 0.18, cabDx: 1, dobra: true }
};

const VERSOES_CURUPIRA = [
  { nome: 'coluna reta', sub: 'o corpo de hoje, endireitado', prop: 'atual', pose: 'guarda', saia: 'curta', ex: 'oba' },
  { nome: 'herói', sub: 'peito largo, colar de dentes', prop: 'heroi', pose: 'guarda', saia: 'curta', ex: 'determinado', colar: true },
  { nome: 'jenipapo', sub: 'pinturas, tanga curta, mirando', prop: 'heroi', pose: 'mira', saia: 'tanga', ex: 'determinado', pintura: true },
  { nome: 'guardião', sub: 'capa de folhas, cipó', prop: 'heroi', pose: 'relaxado', saia: 'longa', ex: 'oba', capa: true, cipo: true },
  { nome: 'moleque da mata', sub: 'tornozeleira e braçadeira', prop: 'atual', pose: 'relaxado', saia: 'curta', ex: 'feliz', tornozeleira: true, bracadeira: true },
  { nome: 'esguio', sub: 'pernas longas, pinturas', prop: 'esguio', pose: 'guarda', saia: 'curta', ex: 'determinado', pintura: true, bracadeira: true },
  { nome: 'bicho do mato', sub: 'agachado, garras', prop: 'heroi', pose: 'bote', saia: 'tanga', ex: 'bravo', pintura: true, colar: true }
];
