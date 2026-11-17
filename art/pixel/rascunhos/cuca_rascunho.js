/* cuca_rascunho.js — rascunhos parados da Cuca para escolher roupa antes de passar para o gerador.
   Usa as ferramentas de art/pixel/gerador (Camada, elipse, poli, sombraB, cachoPx, PCU...).
   Olhando para a esquerda (frente = -x), pés em (X, CHAO_PX). */

const CR = {
  sombraOlho: '#8A5AB8', unha: '#D83A4A',
  chapeu: '#3A2250', chapeuS: '#24143A', chapeuL: '#5A3A78', faixa: '#C89A2A',
  sapato: '#3A2230', sapatoL: '#6A4458',
  metal: '#8A949A', metalS: '#545E66', metalL: '#C8D2D8', metalO: '#141A20',
  veia: '#FF3A2A', veiaD: '#9A1A14', brilho: '#FF8A6A', chipK: '#1A2420', chipk: '#2E3A36', pino: '#8A9490',
  cabo: '#2A2A34', caboL: '#7A7A8A', ciano: '#3AE0E8', magenta: '#E040C0',
  forro: '#A81A28', forroS: '#6A0E1A', botao: '#C8B060'
};
const ROUPAS = {
  roxo: { O: PCU.vestO, D: PCU.vestD, S: PCU.vestS, B: PCU.vest, L: PCU.vestL },
  noite: { O: '#0C0814', D: '#1A1226', S: '#261A38', B: '#34244C', L: '#4E3A6A' },
  ameixa: { O: '#140818', D: '#2A1230', S: '#3E1A46', B: '#54265E', L: '#764282' },
  musgo: { O: '#0A140E', D: '#1C2E20', S: '#28402C', B: '#36543A', L: '#527452' },
  carvao: { O: '#0E0E14', D: '#22222A', S: '#30303A', B: '#42424E', L: '#62626E' }
};

/* ---------- cabeça e olho (o desenho aprovado; batom opcional) ---------- */
function cabecaR(cam, P0, o) {
  const P = (x, y) => P0(x, y + 2);
  const c = nova();
  const hc = P(2, -76);
  elipse(c, hc.x, hc.y, 8.5, 7.5, PCU.verde);
  poli(c, [P(-3, -82), P(-9, -79), P(-15, -76.5), P(-19, -74.6), P(-21.5, -72.8), P(-21.5, -70.8), P(-19, -69.6), P(-11, -68.8), P(-3, -68.2), P(4, -69)], PCU.verde);
  const ol = P(-4, -81);
  c.disco(ol.x, ol.y, 6, PCU.verde);
  sombraB(c, PCU.verde, PCU.verdeS, PCU.verdeL, 1);
  for (const [x, y] of [[-11, -76.5], [-15, -75], [-8, -74], [7, -79], [5, -74]]) { const p = P(x, y); c.set(p.x, p.y, PCU.verdeS); }
  { const p = P(-20, -74); c.set(p.x, p.y, PCU.verdeD); }
  // boca num traço só, subindo num sorriso de canto
  for (let x = -21; x <= -2; x++) {
    const y = -71 + (x > -7 ? -(x + 7) * 0.6 : 0), p = P(x, y);
    if (o.batom) {
      c.set(p.x, p.y, '#7A1430');
      if (x >= -19 && x <= -11) { c.set(p.x, p.y - 1, x === -16 ? '#F06A80' : '#C8264A'); if (x >= -18 && x <= -12) c.set(p.x, p.y + 1, '#C8264A'); }
    } else c.set(p.x, p.y, x > -7 ? PCU.verdeO : PCU.verdeD);
  }
  { const p = P(-9, -70); c.set(p.x, p.y, PCU.dente); }
  if (o.rubor !== false) { const p = P(-3, -73); c.set(p.x, p.y, PCU.rubor); c.set(p.x + 1, p.y, PCU.rubor); }
  cam.colar(c.contornar(PCU.verdeO));
  return ol;
}
function olhoR(cam, cx, cy, iris, sombra) {
  const x = Math.round(cx) - 4, y = Math.round(cy) - 3;
  const b = nova(), M = { o: PCU.verdeO, W: PCU.olho, I: iris, P: PCU.verdeO, s: sombra, B: PM.branco };
  b.carimbo(['..sssss..', '.ooooooo.', 'oIIIWWWWo', 'IIBPIWWWo', 'IIIPIWWWo', 'oIIIWWWWo', '.oWWWWWo.', '..ooooo..'], x, y - 2, M);
  b.carimbo(['......o.o', '.....o.o.', '....oo.o.', '.....o...'], x + 2, y - 5, M);
  cam.colar(b);
}

/* ---------- cabelo e chapéu ---------- */
const cachosR = (cam, P, lista) => { const c = nova(); lista.forEach(([x, y, r]) => { const p = P(x, y); cachoPx(c, p.x, p.y, r); }); cam.colar(c.contornar(PCU.cabO)); };
const CABELO_A_TRAS = [[9, -64, 4.2], [11, -57, 3.8], [8, -52, 3.4], [13, -50, 3]];
const CABELO_A_FRENTE = [[9, -78, 5], [11, -71, 4.2], [4, -85, 3.4], [8, -86, 3.6], [13, -82, 3.8]];
function chapeuR(cam, P, h = {}) {
  const inc = h.inc ?? -14, c = nova(), base = P(7, -88), r = rad(inc);
  const Q = (x, y) => pt(base.x + x * Math.cos(r) - y * Math.sin(r), base.y + x * Math.sin(r) + y * Math.cos(r));
  const cone = h.amassado
    ? [Q(-8, 0), Q(-6, -6), Q(-3, -9), Q(-4, -13), Q(0, -17), Q(6, -19), Q(12, -16), Q(14, -12), Q(9, -13), Q(5, -11), Q(4, -7), Q(7, 0)]
    : [Q(-8, 0), Q(-5, -8), Q(-1, -15), Q(5, -20), Q(11, -19), Q(7, -16), Q(5, -12), Q(7, 0)];
  poli(c, cone, CR.chapeu);
  sombraB(c, CR.chapeu, CR.chapeuS, CR.chapeuL, 1);
  // faixa: dourada (a A), de metal com rebites, ou com o chip cravado
  const corFaixa = h.faixa === 'metal' ? CR.metal : h.faixa === 'couro' ? '#3A2418' : CR.faixa;
  for (let x = -7; x <= 7; x += 0.5) for (const yy of h.faixa === 'metal' ? [-2, -3, -4] : [-2, -3]) { const p = Q(x, yy); if (c.get(Math.floor(p.x), Math.floor(p.y))) c.set(p.x, p.y, yy === -4 ? CR.metalL : yy === -2 && h.faixa === 'metal' ? CR.metalS : corFaixa); }
  if (h.faixa === 'metal') for (const x of [-5, 0, 5]) { const p = Q(x, -3); c.set(p.x, p.y, CR.metalO); }
  if (h.rasgos) for (const [x, y] of h.rasgos) { const p = Q(x, y); c.set(p.x, p.y, PCU.vestO); c.set(p.x + 1, p.y + 1, PCU.vestO); }
  cam.colar(c.contornar(PCU.vestO));
  const a = nova();
  elipse(a, base.x, base.y + 0.5, 15, 2.4, CR.chapeu, inc);
  sombraB(a, CR.chapeu, CR.chapeuS, CR.chapeuL, 1);
  if (h.abaRoida) for (const k of [-12, -6, 9]) { const p = Q(k, 1.5); a.apagar(p.x, p.y); a.apagar(p.x + 1, p.y); }
  cam.colar(a.contornar(PCU.vestO));
  if (h.led) { const p = Q(-1, -3); cam.carimbo(['oRo', 'RLR', 'oRo'], Math.round(p.x) - 1, Math.round(p.y) - 1, { o: CR.metalO, R: CR.veia, L: CR.brilho }); }
  if (h.chip) chipR(cam, Q(-1, -4), { pequeno: true });
  if (h.cabos) for (const [x0, cx, cy, ex, ey] of h.cabos) caboR(cam, Q(x0, -6), P(cx, cy), P(ex, ey));
  return Q;
}

/* ---------- peças da possessão ---------- */
function chipR(cam, p, o = {}) {
  const x = Math.round(p.x), y = Math.round(p.y), b = nova();
  if (o.pequeno) b.carimbo(['y.y.y', 'KKKKK', 'KkRkK', 'KkRkK', 'KKKKK', 'y.y.y'], x - 2, y - 3, { y: CR.pino, K: CR.chipK, k: CR.chipk, R: CR.veia });
  else b.carimbo(['.y.y.y.', 'yKKKKKy', '.KkkkK.', 'yKkRRKy', '.KkRRK.', 'yKKKKKy', '.y.y.y.'], x - 3, y - 3, { y: CR.pino, K: CR.chipK, k: CR.chipk, R: CR.veia });
  cam.colar(b.contornar('#0A0E0C'));
  for (const [dx, dy] of o.pequeno ? [[-3, 0], [3, -1], [0, -4]] : [[-4, 1], [4, -1], [1, -4], [-1, 4]]) cam.set(x + dx, y + dy, CR.brilho);
}
// trilhas de circuito em ângulo reto, com uma bolinha no fim (passos relativos)
function trilhasR(cam, P, x0, y0, caminhos, cor = CR.veia, escura = CR.veiaD) {
  for (const cam1 of caminhos) {
    let q = P(x0, y0);
    cam1.forEach(([dx, dy], i) => {
      const n = Math.max(Math.abs(dx), Math.abs(dy));
      for (let s = 1; s <= n; s++) cam.set(q.x + Math.sign(dx) * s, q.y + Math.sign(dy) * s, (i + s) % 4 === 0 ? cor : escura);
      q = pt(q.x + dx, q.y + dy);
    });
    cam.carimbo(['ee', 'ec'], Math.round(q.x), Math.round(q.y), { e: escura, c: cor });
  }
}
function caboR(cam, a, ctrl, b, cor = CR.cabo) {
  const c = nova();
  const pts = curvaQ(a, ctrl, b, 16);
  c.traco(pts, 1.6, cor);
  pts.forEach((p, i) => { if (i % 4 === 2) c.set(p.x, p.y, CR.caboL); });
  cam.colar(c);
  cam.carimbo(['mm', 'mR'], Math.round(b.x) - 1, Math.round(b.y) - 1, { m: CR.metalS, R: CR.veia });
}

/* ---------- braço ---------- */
// manga: 'bufante' (a A), 'sino' (boca larga com ponta caindo) ou 'justa'
function bracoR(cam, P, b, V, la, o) {
  const [om, cot, mao] = b.pts.map(([x, y]) => P(x, y));
  const cv = la ? [V.S, V.D, V.B] : [V.B, V.S, V.L];
  const m = nova(), dir = unit(sub(mao, cot));
  const pele = la ? PCU.verdeS : PCU.verde;
  m.disco(mao.x, mao.y, 2.1, pele);
  for (const da of b.dedos || [-30, 10]) { const v = rot(dir, da); for (let k = 1; k <= 3; k++) m.set(mao.x + v.x * (1.5 + k), mao.y + v.y * (1.5 + k), k < 3 ? pele : PCU.garra); }
  if (o.manga === 'sino' || o.metal) m.traco([lerp(cot, mao, 0.4), mao], 2.6, pele);
  cam.colar(m.contornar(PCU.verdeO));
  const c = nova(), punho = lerp(cot, mao, o.manga === 'sino' ? 0.45 : 0.72);
  c.traco([...curvaQ(om, cot, cot, 4), ...curvaQ(cot, cot, punho, 4)], 3.4, cv[0]);
  if (o.manga === 'bufante') c.disco(om.x, om.y, 3.6, cv[0]); else c.disco(om.x, om.y, 2.6, cv[0]);
  if (o.manga === 'sino') {
    const n = rot(dir, 90), pon = soma(punho, pt(dir.x * 2, 6));
    poli(c, [soma(cot, mul(n, 1.8)), soma(punho, mul(n, 4)), pon, soma(punho, mul(n, -3.5)), soma(cot, mul(n, -1.8))], cv[0]);
  }
  sombraB(c, cv[0], cv[1], cv[2], 1);
  if (o.manga === 'bufante') c.disco(punho.x, punho.y, 1.9, la ? PCU.rendaS : PCU.renda);
  if (o.manga === 'sino' && o.forro) { const pp = lerp(punho, soma(punho, pt(dir.x * 2, 6)), 0.3); c.set(pp.x, pp.y, CR.forroS); c.set(pp.x + 1, pp.y, CR.forro); }
  cam.colar(c.contornar(V.O));
  // braçadeira de metal no antebraço
  if (o.metal && !la) {
    const g = nova();
    g.traco([lerp(cot, mao, 0.35), lerp(cot, mao, 0.8)], 3.4, CR.metal);
    sombraB(g, CR.metal, CR.metalS, CR.metalL, 1);
    const r1 = lerp(cot, mao, 0.5); g.set(r1.x, r1.y, CR.metalO);
    cam.colar(g.contornar(CR.metalO));
  }
}

/* ---------- a Cuca inteira ---------- */
function cucaR(cam, X, o) {
  const Y = CHAO_PX, V = ROUPAS[o.roupa || 'roxo'], sem = o.semente || 1;
  const P = (x, y) => pt(X + x, Y + y);
  const Pp = ps => ps.map(([x, y]) => P(x, y));
  let c;
  // manto de trás: cai dos ombros até o chão, barra comida
  if (o.manto) {
    c = nova();
    const pts = [[-2, -63], [8, -64], [13, -52], [18, -30], [24, -6]];
    for (let x = 24, k = 0; x >= 2; x -= 2.5, k++) pts.push([x, -3 - (k % 2 ? 2.5 : 0) - (hash(k + sem) < 0.3 ? 3 : 0)]);
    pts.push([4, -30]);
    poli(c, Pp(pts), V.D);
    sombraB(c, V.D, V.O, V.S, 1);
    for (const [x0, k] of [[10, 0.2], [15, 0.3]]) for (let y = -50; y <= -8; y++) { const x = x0 + (y + 50) * k; if (c.get(Math.floor(X + x), Y + y) === V.D) c.set(X + x, Y + y, V.O); }
    // forro vermelho aparecendo na beira de dentro
    for (let y = -40; y <= -5; y++) { const x = 4 + (y + 40) * 0.05; if (c.get(Math.floor(X + x) + 1, Y + y)) c.set(X + x + 1, Y + y, y % 3 ? CR.forro : CR.forroS); }
    cam.colar(c.contornar(V.O));
  }
  // rabo
  c = nova();
  curvaQ(P(6, -16), P(24, -12), P(31, -2), 14).forEach((p, i) => c.disco(p.x, p.y, 3.4 * (1 - i / 15) + 0.6, PCU.verde));
  sombraB(c, PCU.verde, PCU.verdeS, PCU.verdeL, 1);
  cam.colar(c.contornar(PCU.verdeO));
  cachosR(cam, P, o.cabeloTras || CABELO_A_TRAS);
  if (o.cabosCostas) for (const k of o.cabosCostas) caboR(cam, P(k[0], k[1]), P(k[2], k[3]), P(k[4], k[5]));
  bracoR(cam, P, o.bracos[1], V, true, o);
  // pés: sapatinho (a A) ou garras de fora
  c = nova();
  for (const [x, esc] of [[3, true], [-6, false]]) {
    if (o.pes === 'garras') {
      const cor = esc ? PCU.verdeS : PCU.verde;
      poli(c, Pp([[x + 4, -6], [x + 4, -1], [x - 5, -1], [x - 5, -3], [x - 1, -6]]), cor);
      sombraB(c, cor, esc ? PCU.verdeD : PCU.verdeS, null, 1);
    } else {
      poli(c, Pp([[x + 4, -4], [x + 4, -1], [x - 6, -1], [x - 7, -2], [x - 3, -4]]), CR.sapato);
      c.set(X + x - 4, Y - 3, CR.sapatoL); c.set(X + x - 3, Y - 3, CR.sapatoL);
    }
  }
  c.contornar(PCU.verdeO);
  if (o.pes === 'garras') for (const x of [3, -6]) for (const dx of [-6, -4]) c.set(X + x + dx, Y - 1, PCU.garra);
  cam.colar(c);
  // saia
  c = nova();
  const barra = [];
  if (o.barra === 'rasgada') {
    let x = -20, k = 0;
    while (x <= 18) { const w = 2 + Math.floor(hash(sem * 7 + k) * 3), fundo = hash(sem * 13 + k) < 0.3 ? 3 + Math.floor(hash(k + sem) * 3) : 1 + Math.floor(hash(k * 3 + sem) * 2); barra.push([x, -5], [x + w / 2, -5 + fundo], [x + w, -5]); x += w; k++; }
  } else for (let x = -19; x <= 17; x++) barra.push([x, -4 + (Math.abs(((x + 19) % 8) - 4) < 2 ? 0 : 1)]);
  poli(c, Pp([[-7, -42], [-12, -26], ...barra, [13, -24], [8, -42]]), V.B);
  sombraB(c, V.B, V.S, V.L, 2);
  for (const [x0, k] of [[-8, -0.28], [-1, -0.05], [6, 0.18]]) for (let y = -34; y <= -6; y++) { const x = x0 + (y + 34) * k; if (c.get(Math.floor(X + x), Y + y) === V.B) c.set(X + x, Y + y, V.S); }
  if (o.renda) for (let x = -19; x <= 17; x++) for (let y = -6; y <= -3; y++) { if (c.get(X + x, Y + y) && !c.get(X + x, Y + y + 1)) { c.set(X + x, Y + y, (x % 2) ? PCU.renda : PCU.rendaS); break; } }
  // barra se desfazendo em pixels (defeito digital)
  if (o.barra === 'glitch') {
    for (let y = -16; y <= -3; y++) if (hash(y * 3 + sem) < 0.35) {
      const d = hash(y + sem * 5) < 0.5 ? -2 : 2, linha = [];
      for (let x = -22; x <= 20; x++) linha.push(c.get(X + x, Y + y));
      for (let x = -22; x <= 20; x++) c.apagar(X + x, Y + y);
      linha.forEach((cor, i) => { if (cor) c.set(X - 22 + i + d, Y + y, cor); });
    }
    for (let k = 0; k < 9; k++) { const bx = -18 + Math.floor(hash(k * 7 + sem) * 34), by = -12 + Math.floor(hash(k * 11 + sem) * 9); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) c.apagar(X + bx + i, Y + by + j); }
  }
  cam.colar(c.contornar(V.O));
  if (o.barra === 'glitch') {
    const cores = [V.L, CR.veia, CR.ciano, V.B, CR.magenta, V.S];
    for (let k = 0; k < 14; k++) { const bx = -22 + Math.floor(hash(k * 5 + 3) * 44), by = -14 + Math.floor(hash(k * 9 + 1) * 14), w = 1 + Math.floor(hash(k + 2) * 3); for (let i = 0; i < w; i++) { cam.set(X + bx + i, Y + by, cores[k % cores.length]); if (k % 3 === 0) cam.set(X + bx + i, Y + by + 1, cores[k % cores.length]); } }
  }
  // sobretudo: painel de trás longo e abas abertas mostrando o vestido
  if (o.casaco) {
    c = nova();
    poli(c, Pp([[-4, -62], [8, -63], [11, -52], [15, -30], [19, -4], [6, -4], [3, -26], [1, -42]]), V.D);
    poli(c, Pp([[-8, -60], [-5, -62], [-4, -42], [-8, -26], [-14, -4], [-18, -4], [-13, -26], [-9, -42]]), V.D);
    sombraB(c, V.D, V.O, V.S, 1);
    for (let y = -40; y <= -6; y++) { const x = 3 - (y + 40) * 0.0; const p = P(3 + (y + 42) * 0.08, y); if (c.get(Math.floor(p.x), p.y)) c.set(p.x, p.y, CR.forro); const q = P(-9 - (y + 42) * 0.24, y); if (c.get(Math.floor(q.x), q.y)) c.set(q.x, q.y, CR.forro); }
    for (const y of [-56, -50, -44]) { const p = P(-6, y); c.set(p.x, p.y, CR.botao); }
    cam.colar(c.contornar(V.O));
  }
  if (o.avental) {
    c = nova();
    poli(c, Pp([[-6, -41], [-11, -24], [-14, -9], [-2, -8], [2, -24], [1, -41]]), '#EFE4CC');
    sombraB(c, '#EFE4CC', '#C8B898', null, 1);
    cam.colar(c.contornar(V.O));
  }
  // corpete
  c = nova();
  poli(c, Pp([[-7, -42], [-7.5, -48], [-9.5, -53], [-9, -57], [-6, -61], [5, -62], [8, -58], [8, -50], [8, -42]]), V.B);
  elipse(c, X - 6.5, Y - 54, 3.6, 3.4, V.B);
  sombraB(c, V.B, V.S, V.L, 1);
  if (o.decote === 'v') for (let k = 0; k < 5; k++) { c.set(X - 6 + k * 0.6, Y - 61 + k, V.O); c.set(X - 2 - k * 0.2, Y - 61 + k, V.O); }
  cam.colar(c.contornar(V.O));
  if (o.casaco) { c = nova(); poli(c, Pp([[-9, -60], [-6, -62], [-5, -50], [-8, -43]]), V.D); sombraB(c, V.D, V.O, V.S, 1); cam.colar(c.contornar(V.O)); }
  // cinto
  c = nova();
  for (let x = -8; x <= 8; x++) { c.set(X + x, Y - 43, o.cinto || PCU.cinto); c.set(X + x, Y - 42, o.cinto || PCU.cinto); }
  if (o.fivela !== false) c.carimbo(['oo', 'oo'], X - 3, Y - 43, { o: o.cinto === CR.metalS ? CR.metalL : PCU.cintoL });
  cam.colar(c);
  if (o.pocoes) frascoPx(cam, P(6, -40), PCU.magia, 0);
  // trilhas do circuito tomando o vestido
  if (o.circuito) trilhasR(cam, P, o.chip.x, o.chip.y, o.circuito);
  // gola alta dura atrás da cabeça
  if (o.gola === 'alta') {
    c = nova();
    poli(c, Pp([[-6, -61], [-8, -67], [-4, -66], [2, -74], [6, -75], [12, -71], [10, -62]]), V.D);
    sombraB(c, V.D, V.O, V.S, 1);
    for (let k = 0; k < 6; k++) { const p = P(4 + k, -73 + k * 1.6); if (c.get(Math.floor(p.x), Math.floor(p.y))) c.set(p.x, p.y, CR.forro); }
    cam.colar(c.contornar(V.O));
  }
  // pescoço
  c = nova();
  c.traco(Pp([[0, -60], [-1, -66]]), 5.4, PCU.verde);
  sombraB(c, PCU.verde, PCU.verdeS, null, 1);
  cam.colar(c.contornar(PCU.verdeO));
  if (o.gola === 'renda') { c = nova(); for (let k = 0; k <= 5; k++) c.disco(X - 7 + k * 2.6, Y - 61 - k * 0.3, 1.8, PCU.renda); sombraB(c, PCU.renda, PCU.rendaS, null, 1); cam.colar(c.contornar(V.O)); }
  if (o.gola === 'metal') { c = nova(); c.traco(Pp([[-5, -62], [0, -63], [5, -63]]), 2.6, CR.metal); sombraB(c, CR.metal, CR.metalS, CR.metalL, 1); cam.colar(c.contornar(CR.metalO)); }
  const ol = cabecaR(cam, P, o);
  cachosR(cam, P, o.cabeloFrente || CABELO_A_FRENTE);
  if (o.chapeu !== false) chapeuR(cam, P, o.chapeu || {});
  olhoR(cam, ol.x, ol.y + 0.5, o.iris || PCU.irisCalma, o.sombraOlho || CR.sombraOlho);
  if (o.chip && !o.chip.frente) { if (o.chip.veias) trilhasR(cam, P, o.chip.x, o.chip.y, o.chip.veias); chipR(cam, P(o.chip.x, o.chip.y), o.chip); }
  bracoR(cam, P, o.bracos[0], V, false, o);
  // ombreira de metal por cima do ombro da frente, com cabo saindo
  if (o.metal) {
    c = nova();
    const om = P(-5, -60);
    elipse(c, om.x, om.y, 5, 3.6, CR.metal, -10);
    sombraB(c, CR.metal, CR.metalS, CR.metalL, 1);
    for (let k = -3; k <= 3; k += 2) c.set(om.x + k, om.y + 1, CR.metalS);
    c.set(om.x - 3, om.y - 1, CR.metalO); c.set(om.x + 2, om.y - 2, CR.metalO);
    cam.colar(c.contornar(CR.metalO));
  }
  if (o.chip && o.chip.frente) { if (o.chip.veias) trilhasR(cam, P, o.chip.x, o.chip.y, o.chip.veias); chipR(cam, P(o.chip.x, o.chip.y), o.chip); }
  if (o.cabosFrente) for (const k of o.cabosFrente) caboR(cam, P(k[0], k[1]), P(k[2], k[3]), P(k[4], k[5]));
}

const BRACOS_A = [{ pts: [[-5, -59], [-10, -50], [-15, -47]], dedos: [-20, 20] }, { pts: [[5, -60], [-2, -50], [-11, -48]], dedos: [-20, 20] }];
const BRACOS_GARRA = [{ pts: [[-5, -59], [-12, -52], [-18, -57]], dedos: [-70, -30, 10] }, { pts: [[5, -60], [12, -51], [8, -43]], dedos: [80, 120] }];
const VERMELHO = '#E0241B';

const ROUPAS_CUCA = [
  { nome: 'A sem batom', bracos: BRACOS_A, manga: 'bufante', gola: 'renda', renda: true, pocoes: true },
  { nome: 'circuito no vestido', roupa: 'noite', bracos: BRACOS_A, manga: 'sino', forro: true, barra: 'rasgada', pes: 'garras', iris: VERMELHO, sombraOlho: PCU.verdeS, fivela: false, cinto: '#1A1226',
    chapeu: { faixa: 'couro', amassado: true },
    chip: { x: 1, y: -53 }, circuito: [[[0, 9], [-5, 0], [0, 12], [-4, 0], [0, 14]], [[0, 9], [5, 0], [0, 8], [4, 0], [0, 16]], [[0, 9], [0, 12], [1, 0], [0, 12]], [[-4, 0], [0, -5]], [[4, 0], [0, -4], [2, 0]]] },
  { nome: 'sobretudo de gola alta', roupa: 'ameixa', casaco: true, gola: 'alta', bracos: BRACOS_GARRA, manga: 'justa', pes: 'garras', iris: VERMELHO, sombraOlho: PCU.verdeS, fivela: false, cinto: '#1A0C1E',
    chapeu: { faixa: 'metal', led: true },
    chip: { x: -2, y: -57, frente: true, veias: [[[0, 4], [-3, 0], [0, 3]], [[4, 0], [0, 6]], [[-3, 0], [0, -2]]] } },
  { nome: 'meio máquina', roupa: 'carvao', metal: true, gola: 'metal', bracos: BRACOS_A, manga: 'justa', barra: 'rasgada', pes: 'garras', iris: VERMELHO, sombraOlho: PCU.verdeS, cinto: CR.metalS,
    chapeu: { faixa: 'metal', chip: true },
    chip: { x: 2, y: -52, veias: [[[0, -6], [-4, 0]], [[5, 0], [0, 7]], [[0, 6], [-3, 0], [0, 6]]] },
    cabosFrente: [[3, -53, -2, -58, -4, -60]] },
  { nome: 'manto e cabos', roupa: 'musgo', manto: true, gola: 'alta', bracos: BRACOS_GARRA, manga: 'sino', forro: true, barra: 'rasgada', pes: 'garras', iris: VERMELHO, sombraOlho: PCU.verdeS, fivela: false, cinto: '#16241A',
    chapeu: { amassado: true, abaRoida: true, faixa: 'couro', cabos: [[4, 22, -80, 13, -60], [6, 24, -70, 16, -46]] },
    chip: { x: -1, y: -59, frente: true, pequeno: true, veias: [[[0, 4], [-3, 0], [0, 3]], [[3, 0], [0, 5]]] } },
  { nome: 'vestido em pane', roupa: 'roxo', barra: 'glitch', bracos: BRACOS_A, manga: 'sino', gola: 'metal', pes: 'garras', iris: VERMELHO, sombraOlho: PCU.verdeS,
    chapeu: { led: true, faixa: 'metal', rasgos: [[2, -14], [-2, -8]] },
    chip: { x: 1, y: -53 }, circuito: [[[0, 10], [-4, 0], [0, 6]], [[0, 10], [5, 0], [0, 10]], [[-4, 0], [0, -4]]] },
  { nome: 'feiticeira de luto', roupa: 'carvao', manto: true, decote: 'v', bracos: BRACOS_GARRA, manga: 'sino', forro: true, pes: 'garras', iris: VERMELHO, sombraOlho: PCU.verdeS, fivela: false, cinto: CR.metalS,
    chapeu: { faixa: 'metal', chip: true, cabos: [[4, 20, -84, 12, -62]] },
    chip: { x: -2, y: -58, frente: true, veias: [[[0, 5], [-3, 0], [0, 4]], [[4, 0], [0, 7]], [[-3, 0], [0, -3]]] } }
];
