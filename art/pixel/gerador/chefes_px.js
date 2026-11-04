/* chefes_px.js — os chefes desenhados direto no grid da arena (480×270, o mesmo pixel do Curupira).
   Cada chefe é um boneco montado por parâmetros (corpo, pescoço, pernas, fogo...). Cada ataque é uma
   função do tempo s que devolve esses parâmetros e desenha os próprios projéteis. Os tempos aqui são
   só para a animação: os valores de combate continuam saindo do GDD. */

const ARENA_W = 480, ARENA_H = 270, CHAO_PX = 220, X_CURUPIRA = 105;
const nova = () => new Camada(ARENA_W, ARENA_H);
const rad = g => g * Math.PI / 180;
const sai = u => 1 - (1 - clamp(u, 0, 1)) ** 3;
const entra = u => clamp(u, 0, 1) ** 2.2;
// passa do ponto e volta (para pancadas e pousos)
const elastico = u => { u = clamp(u, 0, 1); return 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2; };
// chaves: [[tempo, valor], ...] com transição suave entre elas
function kf(s, chaves) {
  if (s <= chaves[0][0]) return chaves[0][1];
  for (let i = 1; i < chaves.length; i++) {
    const [t1, v1, ease] = chaves[i], [t0, v0] = chaves[i - 1];
    if (s <= t1) return mix(v0, v1, (ease || suave)((s - t0) / (t1 - t0 || 1)));
  }
  return chaves[chaves.length - 1][1];
}

/* ---------- ferramentas de pixel ---------- */
function elipse(cam, cx, cy, rx, ry, cor, ang = 0) {
  const c = Math.cos(rad(ang)), s = Math.sin(rad(ang)), R = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = dx * c + dy * s, v = -dx * s + dy * c;
    if ((u / rx) ** 2 + (v / ry) ** 2 <= 1) cam.set(x, y, cor);
  }
  return cam;
}
// polígono cheio pela regra do enrolamento (partes que se sobrepõem não viram buraco)
function poli(cam, pts, cor) {
  const ys = pts.map(p => p.y), ya = Math.floor(Math.min(...ys)), yb = Math.ceil(Math.max(...ys));
  for (let y = ya; y <= yb; y++) {
    const yc = y + 0.5, cortes = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a.y <= yc) !== (b.y <= yc)) cortes.push([a.x + (yc - a.y) / (b.y - a.y) * (b.x - a.x), b.y > a.y ? 1 : -1]);
    }
    cortes.sort((m, n) => m[0] - n[0]);
    let w = 0;
    for (let i = 0; i < cortes.length - 1; i++) {
      w += cortes[i][1];
      if (w) for (let x = Math.ceil(cortes[i][0] - 0.5); x + 0.5 <= cortes[i + 1][0]; x++) cam.set(x, y, cor);
    }
  }
  return cam;
}
const curvaQ = (a, c, b, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return pt((1 - u) ** 2 * a.x + 2 * u * (1 - u) * c.x + u * u * b.x, (1 - u) ** 2 * a.y + 2 * u * (1 - u) * c.y + u * u * b.y); });
// membro de mangueira: dobra mais quanto mais perto ficam as pontas (mesma conta do Curupira)
function curvaMembro(a, b, L, lado, dobra = 1) {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 0.01, h = dobra * Math.sqrt(Math.max(0, 3 * d * (L - d) / 8));
  const n = pt(-(b.y - a.y) / d, (b.x - a.x) / d);
  return curvaQ(a, soma(lerp(a, b, 0.5), mul(n, 2 * h * lado)), b);
}
// sombra dos chefes: luz vem de cima e da esquerda (a frente deles); larg = quantos px de sombra
function sombraB(cam, base, escura, clara, larg = 1) {
  const muda = [];
  for (const [x, y] of cam.pixels()) {
    if (cam.get(x, y) !== base) continue;
    let esc = false;
    for (let j = 1; j <= larg && !esc; j++) if (!cam.get(x, y + j) || !cam.get(x + j, y)) esc = true;
    if (esc) muda.push([x, y, escura]);
    else if (clara && (!cam.get(x, y - 1) || !cam.get(x - 1, y))) muda.push([x, y, clara]);
  }
  for (const [x, y, c] of muda) cam.set(x, y, c);
  return cam;
}
// pinta por cima só onde a parte já tem pixel
function dentro(cam, teste, cor) {
  const muda = [];
  for (const [x, y] of cam.pixels()) if (cam.get(x, y) && teste(x, y)) muda.push([x, y]);
  for (const [x, y] of muda) cam.set(x, y, cor);
  return cam;
}
function arco(cam, cx, cy, r, a0, a1, cor) {
  for (let a = a0; a <= a1; a += 4) cam.set(cx + Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r, cor);
}
// anel tracejado (aviso no chão): pixels alternando, girando com o tempo
function anelAviso(cam, cx, cy, rx, ry, t, cor) {
  const n = Math.max(12, Math.round((rx + ry) * 2));
  for (let i = 0; i < n; i++) if ((i + Math.floor(t * 10)) % 4 < 2) {
    const a = i / n * TAU;
    cam.set(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, cor);
  }
}

/* ---------- fogo, fumaça, poeira, estrelas ---------- */
// labaredas saindo da base (bx, by) na direção ang (graus de tela: 0 = direita, 270 = cima)
function chamaPx(cam, bx, by, ang, larg, alt, t, { n = 5, rampa = RAMPA_FOGO, contorno = PM.fogoO, vel = 9, amp = 1, tom = 0, semente = 0 } = {}) {
  const a = rad(ang), d = pt(Math.cos(a), Math.sin(a)), nn = pt(-d.y, d.x);
  const cor = i => rampa[clamp(i + tom, 0, rampa.length - 1)];
  const meio = (n - 1) / 2, ordem = [...Array(n).keys()].sort((i, j) => Math.abs(j - meio) - Math.abs(i - meio));
  const pontas = [];
  for (const k of ordem) {
    const o = n > 1 ? (k - meio) / meio : 0;
    const h = alt * (1 - 0.42 * Math.abs(o)) * (1 + 0.15 * Math.sin(t * vel + k * 1.9 + semente));
    if (h < 1) continue;
    const w = larg / n * 1.3 * (1 - 0.15 * Math.abs(o)) + 0.6;
    const b0 = pt(bx + nn.x * o * larg * 0.4, by + nn.y * o * larg * 0.4);
    const parte = nova(), passos = Math.ceil(h * 2.5);
    for (const [fr, lim, c] of [[1, 1, 1], [0.72, 0.8, 2], [0.45, 0.55, 4], [0.22, 0.3, 5]]) {
      for (let i = 0; i <= passos * lim; i++) {
        const u = i / passos;
        const bal = Math.sin(t * vel * 0.9 + k * 2.3 + semente + u * 2) * 1.3 * amp * u + o * larg * 0.12 * u;
        parte.disco(b0.x + d.x * h * u + nn.x * bal, b0.y + d.y * h * u + nn.y * bal, (w * Math.pow(1 - u, 0.8) + 0.3) * fr, cor(c));
      }
    }
    cam.colar(contorno ? parte.contornar(contorno) : parte);
    pontas.push(pt(b0.x + d.x * h, b0.y + d.y * h));
  }
  return pontas;
}
function bolaFogoPx(cam, cx, cy, r, t, dirMov = -1) {
  chamaPx(cam, cx - dirMov * r * 0.4, cy, dirMov < 0 ? 0 : 180, r * 1.9, r * 3, t, { n: 3, vel: 22, amp: 0.6 });
  const b = nova();
  b.disco(cx, cy, r, PM.fogo4); b.disco(cx + dirMov * r * 0.2, cy - r * 0.2, r * 0.62, PM.fogo5); b.disco(cx + dirMov * r * 0.3, cy - r * 0.35, r * 0.26, PM.fogo6);
  cam.colar(b.contornar(PM.fogoO));
}
const CORES_FUMACA = { claro: '#B8B0A8', medio: '#8A8078', escuro: '#5E5650', contorno: '#2E2826' };
function fumacaPx(cam, cx, cy, r, cores = CORES_FUMACA) {
  const b = nova();
  b.disco(cx, cy, r, cores.medio); b.disco(cx - r * 0.25, cy - r * 0.3, r * 0.6, cores.claro);
  cam.colar(b.contornar(cores.contorno));
}
function poeiraPx(cam, cx, cy, u, cor = '#C9A070', claro = '#E6C898') {
  // nuvem que cresce e some (u 0..1); sem transparência, só encolhe no fim
  const r = 1.5 + 5 * sai(u), enc = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
  for (const [dx, k] of [[-r * 0.9, 0.8], [0, 1], [r * 0.9, 0.7]]) {
    elipse(cam, cx + dx, cy - r * 0.5 * k, r * 0.7 * k * enc + 0.3, r * 0.55 * k * enc + 0.3, cor);
    elipse(cam, cx + dx - 0.5, cy - r * 0.6 * k, r * 0.4 * k * enc, r * 0.3 * k * enc, claro);
  }
}
const ESTRELA_PX = [['..y..', '.yYy.', 'yYWYy', '.yYy.', '..y..'], ['y...y', '.yYy.', '.YWY.', '.yYy.', 'y...y']];
function estrelaPx(cam, cx, cy, t) {
  cam.carimbo(ESTRELA_PX[Math.floor(t * 8) % 2], Math.round(cx) - 2, Math.round(cy) - 2, { y: PM.fogo4, Y: PM.fogo5, W: PM.fogo6 });
}
function estrelasTontas(cam, cx, cy, t, raio = 12) {
  for (let k = 0; k < 3; k++) { const a = t * 4 + k * TAU / 3; estrelaPx(cam, cx + Math.cos(a) * raio, cy + Math.sin(a) * raio * 0.35, t + k); }
}
function faiscasPx(cam, cx, cy, u, n = 7, semente = 0) {
  for (let i = 0; i < n; i++) {
    const a = hash(i + semente) * TAU, v = 10 + hash(i * 3 + semente) * 14, d = v * sai(u);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d + 18 * u * u;
    cam.set(x, y, u < 0.5 ? PM.fogo6 : PM.fogo4);
    if (u < 0.4) cam.set(x - Math.cos(a), y - Math.sin(a), PM.fogo3);
  }
}
// explosão em estrela: pontas que crescem, núcleo claro, some encolhendo
function explosaoPx(cam, cx, cy, u, r = 14, cores = [PM.fogo3, PM.fogo5, PM.fogo6], contorno = PM.fogoO) {
  if (u >= 1) return;
  const R = r * (0.5 + 0.7 * sai(u)) * (u > 0.65 ? 1 - (u - 0.65) / 0.35 * 0.8 : 1), pts = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + u, rr = i % 2 ? R * 0.55 : R * (0.85 + 0.3 * hash(i)); pts.push(pt(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)); }
  const b = nova();
  poli(b, pts, cores[0]); b.disco(cx, cy, R * 0.5, cores[1]); b.disco(cx - R * 0.1, cy - R * 0.1, R * 0.25, cores[2]);
  cam.colar(b.contornar(contorno));
}
// chip do vilão: placa verde, pinos dourados, LED vermelho piscando
const CHIP_PX = ['.y.y.y.', 'yKKKKKy', '.KkkkK.', 'yKkRkKy', '.KkkkK.', 'yKKKKKy', '.y.y.y.'];
function chipPx(cam, cx, cy, t, ligado = true) {
  const b = nova();
  b.carimbo(CHIP_PX, Math.round(cx) - 3, Math.round(cy) - 3, { y: '#E8B84A', K: '#1F3A2A', k: '#2E5A3E', R: ligado && Math.floor(t * 4) % 2 ? '#FF3A2A' : '#7A1A14' });
  cam.colar(b.contornar('#0E1A14'));
}
// chip saltando do corpo na derrota (u = segundos desde que saltou)
function chipSaltandoPx(cam, x0, y0, u, t, dir = 1) {
  const voo = Math.min(u, 0.8), x = x0 + dir * 70 * voo, y = y0 - 120 * voo + 160 * voo * voo;
  const yc = Math.min(y, CHAO_PX - 4);
  chipPx(cam, x, yc, t, false);
  if (u < 0.4) faiscasPx(cam, x0, y0, u / 0.4, 8, 5);
}

/* =====================================================================
   MULA SEM CABEÇA
   Corpo de mula olhando para a esquerda, pescoço que termina num toco em brasa e uma fogueira
   no lugar da cabeça. Crina e ponta do rabo são tufos de pelo em forma de labareda.
   ===================================================================== */
const PMU = {
  peloO: '#24100E', peloD: '#4E2418', peloS: '#73391F', pelo: '#985530', peloL: '#C07A42', barriga: '#D29A62',
  casco: '#6A7380', cascoD: '#454C58', cascoL: '#A3ADB8', cascoO: '#1C1E26', toco: '#7A1E14', tocoL: '#E0461C',
  crina: ['#1E0C08', '#3A1C10', '#56301C', '#764428', '#91592F', '#A86B3A'], crinaO: '#140806',
  rocha: '#6E5A50', rochaL: '#9A8478', rochaD: '#463830', rochaO: '#1E1410'
};
const CASCO_PX = ['.ccc.', 'cLccc', 'CCCCC'];
const MULA = {
  piv: pt(22, -44), pescBase: pt(-20, -55), topo: pt(-34, -85),
  quadris: { fl: pt(-23, -42), fn: pt(-15, -40), bl: pt(20, -43), bn: pt(27, -41) },
  pes: { fl: pt(-24, 0), fn: pt(-15, 0), bl: pt(19, 0), bn: pt(27, 0) }
};
// o corpo fica 6 px mais baixo que o desenho de referência: pernas mais curtas, mula mais pesada
const MULA_DY = 6;
const mulaCorpo = (p, inc) => { const piv = pt(MULA.piv.x, MULA.piv.y + MULA_DY); return soma(piv, rot(sub(pt(p.x, p.y + MULA_DY), piv), inc)); };
function mulaBase(t) {
  const resp = Math.sin(t * 2.6);
  return {
    X: 362, x: 0, y: resp * 0.6, inc: resp * 0.7, pesc: Math.sin(t * 1.3) * 3, sx: 1,
    pes: { ...MULA.pes }, fogo: { alt: 1, sobe: 0.55, tom: 0, vel: 9, ang: null }, rabo: Math.sin(t * 2.2) * 3, chip: true, treme: 0
  };
}
// desenha a mula; devolve a boca do fogo (para os projéteis) e o centro do corpo, em pixels da arena
function mulaPx(cam, R, t, sombraCor) {
  const sx = R.sx, X = R.X + R.x, Y = CHAO_PX + R.y;
  const L = p => pt(X + sx * p.x, Y + p.y);                         // local → arena
  const Lc = p => pt(X + sx * p.x, CHAO_PX + p.y);                  // pés: presos no chão, sem o sobe-e-desce do corpo
  const Bl = p => mulaCorpo(p, R.inc);                              // corpo inclinado (positivo = empina)
  const Nl = p => Bl(soma(MULA.pescBase, rot(sub(p, MULA.pescBase), R.pesc)));
  // sombra no chão
  if (sombraCor) aviso(() => elipse(cam, X + sx * 2, CHAO_PX + 1, 34, 2.4, sombraCor));
  // rabo: atrás de tudo, termina num tufo
  const raiz = Bl(pt(33, -55)), pontaR = pt(raiz.x + 9 + R.rabo, raiz.y + 24 + Math.abs(R.rabo) * 0.3);
  let parte = nova();
  parte.traco(curvaQ(L(raiz), L(pt(raiz.x + 11 + R.rabo * 0.4, raiz.y + 4)), L(pontaR)), 3.4, PMU.peloS);
  cam.colar(parte.contornar(PMU.peloO));
  chamaPx(cam, L(pontaR).x, L(pontaR).y - 1, 90 - sx * R.rabo * 4, 6, 8, t * 0.5, { n: 3, rampa: PMU.crina, contorno: PMU.crinaO, vel: 4, semente: 3 });
  // pernas
  const perna = (q, cores, larg) => {
    const p = nova(), a = L(Bl(MULA.quadris[q])), b = Lc(R.pes[q]), frente = q[0] === 'f';
    const pts = curvaMembro(a, soma(b, pt(0, -2)), 40, (frente ? 1 : -1) * sx, 0.6);
    p.traco(pts, larg, cores[0]);
    sombraB(p, cores[0], cores[1], cores[2], 1);
    p.carimbo(CASCO_PX, Math.round(b.x) - 2, Math.round(b.y) - 3, { c: PMU.casco, L: PMU.cascoL, C: PMU.cascoD }, sx < 0);
    cam.colar(p.contornar(PMU.peloO));
  };
  perna('bl', [PMU.peloS, PMU.peloD, PMU.pelo], 5.4);
  perna('fl', [PMU.peloS, PMU.peloD, PMU.pelo], 5.4);
  // corpo e pescoço numa peça só
  parte = nova();
  const elB = (c, rx, ry) => { const p = L(Bl(c)); elipse(parte, p.x, p.y, rx, ry, PMU.pelo, sx * R.inc); };
  elB(pt(2, -47), 28, 13); elB(pt(-19, -49), 11, 12); elB(pt(22, -50), 12, 13);
  poli(parte, [pt(-29, -50), pt(-39, -80), pt(-29, -88), pt(-12, -59)].map(p => L(Nl(p))), PMU.pelo);
  sombraB(parte, PMU.pelo, PMU.peloS, PMU.peloL, 2);
  const bar = L(Bl(pt(0, -39)));
  elipse(parte, bar.x, bar.y, 17, 2.6, PMU.barriga, sx * R.inc);
  // músculos: ombro e anca em 1 px mais escuro
  const om = L(Bl(pt(-15, -50))), an = L(Bl(pt(19, -49)));
  arco(parte, om.x, om.y, 7, sx > 0 ? 200 : -20, sx > 0 ? 300 : 80, PMU.peloS);
  arco(parte, an.x, an.y, 9, sx > 0 ? 230 : -50, sx > 0 ? 330 : 50, PMU.peloS);
  cam.colar(parte.contornar(PMU.peloO));
  if (R.chip) { const c = L(Bl(pt(8, -50))); chipPx(cam, c.x, c.y, t); }
  // crina: tufos de pelo em labareda ao longo da nuca
  const nucaA = pt(-13, -61), nucaB = pt(-29, -86);
  const angPesc = Math.atan2(L(Nl(nucaB)).y - L(Nl(nucaA)).y, L(Nl(nucaB)).x - L(Nl(nucaA)).x) * 180 / Math.PI;
  parte = nova();
  [0, 0.22, 0.44, 0.66, 0.88, 1].forEach((u, k) => {
    const b = L(Nl(lerp(nucaA, nucaB, u))), bal = Math.sin(t * 5 + k * 1.4) * 6;
    mecha(parte, b.x + sx * 0.5, b.y, angPesc + sx * (70 + k * 6) + bal, 8 - k * 0.6, 2.6, PMU.crina[3], 1.2);
  });
  sombraB(parte, PMU.crina[3], PMU.crina[2], PMU.crina[4], 1);
  cam.colar(parte.contornar(PMU.crinaO));
  // pernas de cá
  perna('bn', [PMU.pelo, PMU.peloS, PMU.peloL], 6);
  perna('fn', [PMU.pelo, PMU.peloS, PMU.peloL], 6);
  // toco do pescoço e a fogueira
  const topo = L(Nl(MULA.topo)), base = L(Nl(pt(-24, -70)));
  const angTopo = Math.atan2(topo.y - base.y, topo.x - base.x) * 180 / Math.PI;
  parte = nova();
  elipse(parte, topo.x, topo.y, 6.5, 2.4, PMU.toco, angTopo + 90);
  elipse(parte, topo.x, topo.y, 4.4, 1.3, PMU.tocoL, angTopo + 90);
  cam.colar(parte.contornar(PMU.peloO));
  // direção do fogo: entre o eixo do pescoço e o "para cima", misturando vetores (sem pular de ângulo)
  const vT = unit(pt(Math.cos(rad(angTopo)) * (1 - R.fogo.sobe), Math.sin(rad(angTopo)) * (1 - R.fogo.sobe) - R.fogo.sobe));
  const angFogo = R.fogo.ang ?? Math.atan2(vT.y, vT.x) * 180 / Math.PI;
  const pontas = chamaPx(cam, topo.x, topo.y, angFogo, 17, 24 * R.fogo.alt, t, { n: 5, vel: R.fogo.vel, tom: R.fogo.tom, amp: 1.2 });
  const dirF = pt(Math.cos(rad(angFogo)), Math.sin(rad(angFogo)));
  return { boca: soma(topo, mul(dirF, 6)), topo, pontaFogo: soma(topo, mul(dirF, 24 * R.fogo.alt)), corpo: L(Bl(pt(8, -50))), pontas, frente: L(Bl(pt(-30, -48))) };
}
// pernas de galope: cada pata apoia (desliza para trás) e voa (sobe e vem para a frente)
function galope(g, amplo = 9, altura = 8) {
  const off = { fl: 0, fn: 0.12, bl: 0.5, bn: 0.62 }, r = {};
  for (const q in off) {
    const u = ((g + off[q]) % 1 + 1) % 1, b = MULA.pes[q];
    r[q] = u < 0.5 ? pt(b.x + mix(-amplo, amplo, u / 0.5), 0) : pt(b.x + mix(amplo, -amplo, (u - 0.5) / 0.5), -altura * Math.sin(Math.PI * (u - 0.5) / 0.5));
  }
  return r;
}

const MULA_ESTADOS = {
  idle: {
    dur: 2.4, nome: 'Parada, respirando',
    quadro(s, t) {
      const R = mulaBase(t), c = (s % 2.4) / 2.4;
      // bate o casco de vez em quando
      if (c > 0.55 && c < 0.85) { const k = Math.sin((c - 0.55) / 0.3 * Math.PI); R.pes.fn = pt(-15 - 4 * k, -6 * k); }
      return { R };
    }
  },
  bolas: {
    dur: 2.6, nome: 'Rajada rasteira', fase: 1, dica: 'pular',
    desc: 'Abaixa o peito até o chão, aponta o fogo para a frente e cospe três bolas rolando rente ao chão. Coice a cada bola.',
    quadro(s, t) {
      const R = mulaBase(t);
      const k = suave(trecho(s, 0, 0.45)) * (1 - suave(trecho(s, 2.0, 2.5)));
      R.y += 9 * k; R.inc = -13 * k; R.pesc = -52 * k;
      R.pes.fn = pt(-15 - 13 * k, 0); R.pes.fl = pt(-24 - 11 * k, 0); R.pes.bn = pt(27 + 3 * k, 0);
      R.fogo.sobe = 0.55 * (1 - k); R.fogo.alt = 1 + 0.25 * k + (s < 0.5 ? 0.15 * Math.sin(t * 40) * k : 0);
      R.fogo.tom = s > 0.2 && s < 0.5 ? 1 : 0;
      const tiros = [];
      for (const ts of [0.55, 1.0, 1.45]) {
        const d = s - ts;
        if (d < 0) continue;
        R.x += 3 * Math.exp(-d * 12); R.inc -= 3 * Math.exp(-d * 12); R.fogo.alt += 0.5 * Math.exp(-d * 9);
        tiros.push(d);
      }
      return {
        R, depois(cam, info) {
          // aviso: anel piscando na boca e brasas sendo puxadas
          if (s > 0.12 && s < 0.55) aviso(() => {
            const u = trecho(s, 0.12, 0.55);
            if (Math.floor(t * 16) % 2) elipse(cam, info.boca.x, info.boca.y, 2 + 3 * u, 2 + 3 * u, PM.fogo6);
            for (let i = 0; i < 6; i++) { const a = i * 1.1 + s * 3, d = 18 * (1 - (u * 2 + i / 6) % 1); cam.set(info.boca.x + Math.cos(a) * d, info.boca.y + Math.sin(a) * d * 0.7, PM.fogo4); }
          });
          for (const d of tiros) {
            const x = info.boca.x - 8 - 250 * d, y = mix(info.boca.y, CHAO_PX - 6, Math.min(1, d / 0.1)) - Math.abs(Math.sin(d * 16)) * 1.5;
            if (x > -12) bolaFogoPx(cam, x, y, 4.5, t + d);
            if (d < 0.12) explosaoPx(cam, info.boca.x - 3, info.boca.y, d / 0.12, 7);
          }
        }
      };
    }
  },
  pisoteio: {
    dur: 2.5, nome: 'Pisoteio', fase: 1, dica: 'pular',
    desc: 'Empina nas patas de trás, segura no alto tremendo e desce com tudo. A pancada solta uma onda de fogo correndo pelo chão.',
    quadro(s, t) {
      const R = mulaBase(t);
      const inc = kf(s, [[0, 0], [0.55, 36, sai], [0.85, 38], [0.95, -6, entra], [1.2, 2], [1.5, 0]]);
      R.inc = inc + (s > 0.55 && s < 0.85 ? Math.sin(t * 50) * 1.2 : 0);
      R.pesc = kf(s, [[0, 0], [0.55, 18], [0.9, 18], [1.0, -12], [1.6, 0]]);
      const ar = clamp(inc / 36, 0, 1);
      // patas da frente acompanham o peito e pedalam no ar
      for (const q of ['fn', 'fl']) {
        const quad = mulaCorpo(MULA.quadris[q], R.inc);
        const noAr = pt(quad.x - 8 + Math.sin(t * 14 + (q === 'fn' ? 0 : 2)) * 3, quad.y + 30 - R.y);
        R.pes[q] = lerp(pt(MULA.pes[q].x - (s > 0.9 ? 4 : 0), 0), noAr, ar);
      }
      R.pes.bn = pt(27 + 4 * ar, 0); R.pes.bl = pt(19 + 4 * ar, 0);
      R.fogo.sobe = 0.55 + 0.45 * ar; R.fogo.alt = 1 + 0.6 * ar + (s > 0.92 && s < 1.2 ? 0.6 : 0);
      R.treme = s > 0.92 && s < 1.25 ? 2 : 0;
      return {
        R, depois(cam, info) {
          const d = s - 0.93;
          if (d < 0) return;
          const x0 = info.frente.x - 6;
          if (d < 0.4) for (const dx of [-8, 8]) poeiraPx(cam, x0 + dx + 6, CHAO_PX, d / 0.4);
          // onda de fogo: três labaredas que andam juntas e diminuem no fim
          const xf = x0 - 230 * d, fim = clamp((xf + 10) / 40, 0, 1);
          if (xf > -20) for (let i = 0; i < 3; i++) {
            const h = (16 - i * 4) * fim * Math.min(1, d / 0.08);
            chamaPx(cam, xf + i * 7, CHAO_PX, 270 + i * 8, 9, h, t + i, { n: 3, vel: 16 });
          }
          // trilha de brasas no chão onde a onda passou
          aviso(() => { for (let x = Math.ceil(xf + 22); x < x0; x += 3) if (hash(x * 1.7) > 0.5 && (x - xf) < 120) cam.set(x, CHAO_PX - 1, (x - xf) < 60 ? PM.fogo3 : PM.fogo1); });
        }
      };
    }
  },
  investida: {
    dur: 3.9, nome: 'Investida', fase: 2, dica: 'dash',
    desc: 'Raspa o casco duas vezes, abaixa o fogo como chifre e atravessa a arena até bater na parede. Fica tonta: é a hora de bater nela.',
    quadro(s, t) {
      const R = mulaBase(t);
      const W = -(R.X - 58);
      let poeiras = [], tonta = 0;
      if (s < 0.9) {
        const k = suave(trecho(s, 0, 0.25));
        R.pesc = -34 * k; R.inc = -6 * k; R.y += 3 * k;
        R.fogo.sobe = 0; R.fogo.tom = 1; R.fogo.vel = 16; R.fogo.alt = 1.15;
        for (const t0 of [0.25, 0.55]) { const u = trecho(s, t0, t0 + 0.22); if (u > 0 && u < 1) R.pes.bn = pt(27 + 10 * Math.sin(u * Math.PI), -3 * Math.sin(u * Math.PI)); if (s > t0 + 0.1) poeiras.push([R.X + 40, (s - t0 - 0.1) / 0.5]); }
      } else if (s < 1.5) {
        const u = trecho(s, 0.9, 1.5);
        R.x = W * entra(u); R.pesc = -38; R.inc = -6; R.y += 2 - Math.abs(Math.sin(s * 28)) * 2;
        R.pes = galope(s * 4.5, 11, 9);
        R.fogo.ang = 10; R.fogo.alt = 1.3; R.fogo.tom = 1; R.fogo.vel = 18;
        for (let k = 0; k < 6; k++) { const ts = 0.95 + k * 0.1; if (s > ts) poeiras.push([R.X + W * entra(trecho(ts, 0.9, 1.5)) + 34, (s - ts) / 0.5]); }
      } else if (s < 2.45) {
        const u = trecho(s, 1.5, 1.7);
        R.x = W + 8 * sai(u); R.inc = 10 * (1 - u) - 2; R.pesc = mix(-38, 10, sai(u)); R.y += 2;
        R.pes = { fl: pt(-20, 0), fn: pt(-11, 0), bl: pt(22, 0), bn: pt(30, 0) };
        R.fogo.alt = 0.55; R.fogo.tom = -1; R.fogo.sobe = 1; tonta = 1;
        R.treme = s < 1.75 ? 3 : 0;
      } else if (s < 3.6) {
        // vira e volta trotando para o lugar
        const u = trecho(s, 2.55, 3.55);
        R.sx = -1; R.x = mix(W + 8, 0, u); R.y += -Math.abs(Math.sin(s * 14)) * 1.2;
        if (s > 2.55) R.pes = galope(s * 2.6, 6, 5);
        R.fogo.ang = mix(270, 180 + 30, 0.4);
      } else { R.pes = { ...MULA.pes }; }
      return {
        R, depois(cam, info) {
          for (const [x, u] of poeiras) if (u < 1) poeiraPx(cam, x, CHAO_PX, u);
          if (s > 1.5 && s < 1.8) { faiscasPx(cam, info.frente.x - 8, info.frente.y, (s - 1.5) / 0.3, 9, 2); explosaoPx(cam, info.frente.x - 10, info.frente.y, (s - 1.5) / 0.18, 9, [PM.fogo6, PM.fogo5, PM.branco]); }
          if (tonta) estrelasTontas(cam, info.topo.x, info.topo.y - 14, t, 11);
        }
      };
    }
  },
  meteoros: {
    dur: 3.2, nome: 'Chuva de meteoros', fase: 3, dica: 'andar para fora das sombras',
    desc: 'Empina, o fogo vira uma coluna e lança três pedras em brasa para o alto. As sombras no chão mostram onde cada uma vai cair, uma depois da outra.',
    quadro(s, t) {
      const R = mulaBase(t);
      const k = kf(s, [[0, 0], [0.45, 1, sai], [1.1, 1], [1.5, 0.15], [3.2, 0]]);
      R.inc = 18 * k + (s > 0.4 && s < 1.1 ? Math.sin(t * 45) : 0); R.pesc = 12 * k;
      R.fogo.sobe = 0.55 + 0.45 * k; R.fogo.alt = 1 + 1.1 * k; R.fogo.tom = k > 0.5 ? 1 : 0;
      for (const q of ['fn', 'fl']) { const quad = mulaCorpo(MULA.quadris[q], R.inc); R.pes[q] = lerp(MULA.pes[q], pt(quad.x - 6, quad.y + 26), clamp(R.inc / 18, 0, 1)); }
      if (s > 1.4) { R.fogo.alt *= 0.75; R.y += 2; R.fogo.tom = -1; }
      const alvos = [[X_CURUPIRA, 0.55, 1.75], [190, 0.75, 2.05], [40, 0.95, 2.35]];
      return {
        R, depois(cam, info) {
          for (const [x, ts, tq] of alvos) {
            const sobe = s - ts;
            if (sobe > 0 && sobe < 0.5) desenharRocha(cam, info.pontaFogo.x - 2, info.pontaFogo.y - 600 * sobe * sobe - 80 * sobe, t + x, true);
            if (s > ts + 0.25 && s < tq) {
              const u = trecho(s, ts + 0.25, tq);
              aviso(() => elipse(cam, x, CHAO_PX + 1, 2 + 9 * u, 1 + 1.5 * u, '#3A2324'));
              anelAviso(cam, x, CHAO_PX + 1, 4 + 10 * u, 2 + 2 * u, t, PM.fogo2);
            }
            const cai = trecho(s, tq - 0.32, tq);
            if (cai > 0 && cai < 1) desenharRocha(cam, x, mix(-14, CHAO_PX - 6, entra(cai)), t + x, true, true);
            const d = s - tq;
            if (d >= 0 && d < 0.32) explosaoPx(cam, x, CHAO_PX - 8, d / 0.32, 15);
            if (d >= 0.15 && d < 0.85) chamaPx(cam, x, CHAO_PX, 270, 10, 9 * (1 - trecho(d, 0.5, 0.85)), t + x, { n: 3 });
          }
          if (s > 1.5) for (let i = 0; i < 2; i++) { const u = (s * 0.8 + i / 2) % 1; fumacaPx(cam, info.topo.x + 6 * u, info.topo.y - 8 - 16 * u, 1.5 + 2.5 * u); }
        },
        treme: [1.75, 2.05, 2.35].some(tq => s > tq && s < tq + 0.15) ? 1 : 0
      };
    }
  },
  derrota: {
    dur: 3.6, nome: 'Derrota',
    quadro(s, t) {
      const R = mulaBase(t);
      const k = suave(trecho(s, 0.25, 1.0));
      R.x = 4 * (1 - trecho(s, 0, 0.3)) * (s < 0.3 ? 1 : 0); R.y = 22 * k; R.inc = mix(-4, 0, k);
      R.pesc = mix(0, -18, k) + Math.sin(t * 1.4) * 2 * k;
      R.pes = { fl: pt(mix(-24, -40, k), 0), fn: pt(mix(-15, -34, k), 0), bl: pt(mix(19, 40, k), 0), bn: pt(mix(27, 34, k), 0) };
      R.fogo.alt = mix(1, 0.5, k); R.fogo.tom = s > 1.4 ? -1 : 0; R.fogo.vel = mix(9, 4, k); R.fogo.sobe = 1;
      R.chip = s < 1.05; R.rabo = Math.sin(t * 1.2) * 4;
      return {
        R, depois(cam, info) {
          if (s >= 1.05) chipSaltandoPx(cam, info.corpo.x, info.corpo.y, s - 1.05, t, 1);
          if (s > 1.8) { const u = ((s - 1.8) * 0.5) % 1; fumacaPx(cam, info.topo.x - 4 * u, info.topo.y - 16 - 18 * u, 1 + 2 * u, { claro: '#E8E2D8', medio: '#C8C0B4', contorno: '#6E665E' }); }
        }
      };
    }
  }
};
function desenharRocha(cam, cx, cy, t, emBrasa, caindo = false) {
  if (caindo) chamaPx(cam, cx, cy - 3, 270, 9, 14, t, { n: 3, vel: 20 });
  const b = nova(), pts = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 3, r = 5 * (0.8 + 0.35 * hash(i + 4)); pts.push(pt(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
  poli(b, pts, PMU.rocha);
  sombraB(b, PMU.rocha, PMU.rochaD, PMU.rochaL, 1);
  if (emBrasa) { b.set(cx, cy, PM.fogo4); b.set(cx + 1, cy, PM.fogo3); b.set(cx - 1, cy + 2, PM.fogo3); }
  cam.colar(b.contornar(PMU.rochaO));
}

/* =====================================================================
   CUCA
   Jacaré de pé, corcunda de bruxa, juba loira em cachos, cinto de poções e o olho vermelho do chip.
   ===================================================================== */
const PCU = {
  verdeO: '#122818', verdeD: '#24502C', verdeS: '#3A7838', verde: '#58A042', verdeL: '#9ACC5A', barriga: '#EEDCA0', barrigaS: '#C8AC6C',
  cab: '#F6C434', cabS: '#D08A1C', cabL: '#FFEA8E', cabO: '#5A320A', dente: '#FFF8EC', boca: '#4A0E1E', lingua: '#E0575A',
  olho: '#FFF8EC', iris: '#E0241B', irisCalma: '#E8A010', cinto: '#5A2E18', cintoL: '#E0B040', garra: '#F2E8D0',
  vestO: '#1C0C26', vestD: '#341A4A', vestS: '#4E2868', vest: '#6A3A88', vestL: '#9264AE', renda: '#EADCC6', rendaS: '#B8A48E', remendo: '#8A6A3A', rubor: '#D9786A',
  magia: '#5BD94A', magiaL: '#C8FF9A', magiaD: '#1F7A2A', magiaO: '#0E3A14', roxo: '#8E44AD', roxoL: '#C07BDB', roxoD: '#4E1E66',
  vidro: '#D8EEF2', vidroO: '#2A3A44', rolha: '#8A5A2E', nota: '#2A1E3A', notaL: '#B48CFF', azul: '#3B82C4'
};
const CUCA = { quadril: pt(0, -24), ombroP: pt(-6, -56), ombroL: pt(3, -58), pes: [pt(-9, 0), pt(8, 0)] };
function cucaBase(t) {
  const r = Math.sin(t * 2.2);
  // esfrega as garras na frente do peito, como vilã de desenho
  const esf = Math.sin(t * 9);
  return {
    X: 372, x: 0, y: 0, inc: 6 + r, cab: r * 1.5, mand: 3, sx: 1, olho: 'bravo', iris: PCU.iris,
    pes: CUCA.pes.map(p => ({ ...p })), maos: [pt(-22 + esf * 2, -46 + Math.abs(esf)), pt(-17 - esf * 2, -48)], rabo: Math.sin(t * 2) * 3,
    chip: true, lingua: false, sorriso: false, deitada: 0, treme: 0, corpoY: r * 0.7, cabelo: Math.sin(t * 2.2 - 0.8)
  };
}
// cacho: bola com sombra embaixo/atrás e brilho em cima/frente (luz de cima e da esquerda da tela)
function cachoPx(cam, cx, cy, r) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    if (dx * dx + dy * dy > r * r) continue;
    const luz = -(dx * 0.6 + dy * 0.8) / r;
    cam.set(x, y, luz < -0.45 ? PCU.cabS : luz > 0.5 ? PCU.cabL : PCU.cab);
  }
  // risquinho do cacho enrolando
  cam.set(cx + r * 0.25, cy + r * 0.1, PCU.cabS); cam.set(cx + r * 0.25 - 1, cy + r * 0.1 + 1, PCU.cabS);
}
function cucaPx(cam, R, t, sombraCor) {
  const sx = R.sx, X = R.X + R.x, Y = CHAO_PX + R.y;
  const L = p => pt(X + sx * p.x, Y + p.y);
  const Lc = p => pt(X + sx * p.x, CHAO_PX + p.y);
  const giro = -R.inc - 80 * R.deitada;
  // tronco inclina a partir do quadril; deitada = de barriga no chão (bote)
  const T = p => { const q = soma(CUCA.quadril, rot(sub(p, CUCA.quadril), giro)); return pt(q.x, q.y + R.corpoY + 15 * R.deitada); };
  const piv = pt(-2, -68), Hc = T(piv);
  const H = p => soma(Hc, rot(sub(p, piv), -R.inc * 0.4 - R.cab + 6 * R.deitada));
  const ang = -sx * (R.inc + 80 * R.deitada);
  if (sombraCor) aviso(() => elipse(cam, X + sx * 4, CHAO_PX + 1, 26 + 14 * R.deitada, 2.2, sombraCor));
  // rabo grosso que afina, com a crista de escamas no dorso
  let parte = nova();
  const r0 = T(pt(8, -22)), rp = pt(42 + R.rabo, -3 + Math.abs(R.rabo) * 0.3);
  const ptsR = curvaQ(L(r0), L(pt(32, -14 + R.rabo * 0.5)), Lc(rp), 14);
  ptsR.forEach((p, i) => parte.disco(p.x, p.y, 6 * (1 - i / 16) + 0.7, PCU.verde));
  sombraB(parte, PCU.verde, PCU.verdeS, PCU.verdeL, 2);
  ptsR.forEach((p, i) => { if (i % 2 === 0 && i > 1 && i < 13) { const h = 6 * (1 - i / 16) + 0.7; parte.set(p.x, p.y - h - 0.5, PCU.verdeS); parte.set(p.x, p.y - h - 1.5, PCU.verdeS); } });
  cam.colar(parte.contornar(PCU.verdeO));
  // braço: manga do vestido com babado rasgado, antebraço verde e três garras
  const braco = (o, m, escuro) => {
    const p = nova(), a = L(T(o)), b = L(m), pts = curvaMembro(a, b, 26, -sx, 0.8);
    const meio = Math.round(pts.length * 0.5), punho = pts[meio];
    p.traco(pts.slice(meio), 4.6, escuro ? PCU.verdeS : PCU.verde);
    sombraB(p, escuro ? PCU.verdeS : PCU.verde, escuro ? PCU.verdeD : PCU.verdeS, escuro ? PCU.verde : PCU.verdeL, 1);
    const dir = unit(sub(b, punho));
    for (const da of [-40, 0, 40]) { const v = rot(dir, da); for (let k = 2; k <= 4; k++) p.set(b.x + v.x * k, b.y + v.y * k, k < 4 ? PCU.garra : PCU.barrigaS); }
    p.disco(b.x, b.y, 2.6, escuro ? PCU.verdeS : PCU.verde);
    cam.colar(p.contornar(PCU.verdeO));
    const m2 = nova(), vc = escuro ? [PCU.vestS, PCU.vestD, PCU.vest] : [PCU.vest, PCU.vestS, PCU.vestL];
    m2.traco(pts.slice(0, meio + 1), 6.4, vc[0]);
    // boca da manga alargando, com pontas
    m2.disco(punho.x, punho.y, 4.2, vc[0]);
    for (const da of [-70, 70]) { const v = rot(dir, da); m2.traco([punho, pt(punho.x + v.x * 5 + dir.x * 2, punho.y + v.y * 5 + dir.y * 2)], 2, vc[0]); }
    sombraB(m2, vc[0], vc[1], vc[2], 1);
    cam.colar(m2.contornar(PCU.vestO));
  };
  const perna = (q, pe, escuro) => {
    const p = nova(), a = L(T(q)), b = Lc(pe), base = escuro ? PCU.verdeS : PCU.verde;
    p.traco(curvaMembro(a, soma(b, pt(0, -2)), 24, sx, 0.8), 7, base);
    elipse(p, b.x - sx * 3, b.y - 1.5, 6, 2.6, base);
    sombraB(p, base, escuro ? PCU.verdeD : PCU.verdeS, escuro ? PCU.verde : PCU.verdeL, 1);
    for (const dx of [-9, -6, -3]) { p.set(b.x + sx * dx, b.y - 1, PCU.garra); p.set(b.x + sx * (dx - 1), b.y - 1, PCU.garra); }
    cam.colar(p.contornar(PCU.verdeO));
  };
  braco(CUCA.ombroL, R.maos[1], true);
  perna(pt(6, -24), R.pes[1], true);
  // cabelo de trás: cachos descendo pelas costas, balançando um pouco atrasados
  const cachos = nova(), bal = R.cabelo || 0;
  [[13, -62, 4.6], [11, -54, 4.2], [15, -50, 3.6], [9, -47, 3.4]].forEach(([x, y, r], k) => { const c = L(T(pt(x + bal * (0.5 + k * 0.3), y + Math.abs(bal) * 0.4))); cachoPx(cachos, c.x, c.y, r); });
  cam.colar(cachos.contornar(PCU.cabO));
  perna(pt(-6, -24), R.pes[0], false);
  // vestido: corpete corcunda, saia rodada com a barra rasgada, dobras e remendo
  parte = nova();
  const elT = (c, rx, ry, cor = PCU.vest) => { const p = L(T(c)); elipse(parte, p.x, p.y, rx, ry, cor, ang); };
  elT(pt(1, -46), 11, 14); elT(pt(6, -55), 9, 8); elT(pt(0, -30), 14, 10);
  const barra = [];
  for (let x = -19; x <= 19; x++) barra.push(pt(x, -15 + ((x + 19) % 6 < 3 ? (x + 19) % 6 : 6 - (x + 19) % 6) * 1.2));
  poli(parte, [pt(-12, -36), pt(13, -36), ...barra.reverse()].map(p => L(T(p))), PCU.vest);
  sombraB(parte, PCU.vest, PCU.vestS, PCU.vestL, 2);
  for (const x0 of [-9, -1, 8]) for (let y = -28; y <= -17; y++) { const p = L(T(pt(x0 + (y + 28) * 0.12 * Math.sign(x0 || 1), y))); if (parte.get(p.x, p.y) === PCU.vest) parte.set(p.x, p.y, PCU.vestS); }
  const rm = L(T(pt(-9, -26)));
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (parte.get(rm.x + i, rm.y + j)) parte.set(rm.x + i, rm.y + j, (i + j) % 4 === 0 ? PCU.vestO : PCU.remendo);
  cam.colar(parte.contornar(PCU.vestO));
  // cinto com fivela e duas poções
  parte = nova();
  const c0 = L(T(pt(-14, -35))), c1 = L(T(pt(14, -36)));
  for (let u = 0; u <= 1; u += 0.03) { const p = lerp(c0, c1, u); parte.set(p.x, p.y, PCU.cinto); parte.set(p.x, p.y + 1, PCU.cinto); }
  const fv = lerp(c0, c1, 0.3);
  parte.carimbo(['ooo', 'o.o', 'ooo'], Math.round(fv.x) - 1, Math.round(fv.y) - 1, { o: PCU.cintoL });
  cam.colar(parte.contornar(PCU.vestO));
  if (!R.semPocao) { frascoPx(cam, L(T(pt(7, -31))), PCU.magia, t); frascoPx(cam, L(T(pt(0, -30))), PCU.azul, t + 1); }
  if (R.chip) { const c = L(T(pt(-1, -47))); chipPx(cam, c.x, c.y, t); }
  // pescoço e gola de renda
  parte = nova();
  { const p = L(T(pt(-3, -62))); elipse(parte, p.x, p.y, 6, 5, PCU.verde, ang); }
  sombraB(parte, PCU.verde, PCU.verdeS, null, 1);
  cam.colar(parte.contornar(PCU.verdeO));
  parte = nova();
  for (let k = 0; k <= 6; k++) { const p = L(T(pt(-9 + k * 3, -59 - k * 0.4))); parte.disco(p.x, p.y, 2.4, PCU.renda); }
  sombraB(parte, PCU.renda, PCU.rendaS, null, 1);
  cam.colar(parte.contornar(PCU.vestO));
  // cabeça: crânio redondo, focinho curto e arredondado, mandíbula clara que abre
  parte = nova();
  const hc = L(H(pt(2, -77)));
  elipse(parte, hc.x, hc.y, 13, 11, PCU.verde);
  poli(parte, [pt(-3, -88), pt(-12, -85), pt(-20, -81), pt(-25, -78.5), pt(-28, -75), pt(-28, -70), pt(-3, -68)].map(p => L(H(p))), PCU.verde);
  const ponta = L(H(pt(-24.5, -74)));
  parte.disco(ponta.x, ponta.y, 4.8, PCU.verde);
  // calombo do olho
  const oc = L(H(pt(-8, -86)));
  parte.disco(oc.x, oc.y, 6.5, PCU.verde);
  sombraB(parte, PCU.verde, PCU.verdeS, PCU.verdeL, 1);
  // narina e pintinhas de escama
  const na = L(H(pt(-26, -78)));
  parte.set(na.x, na.y, PCU.verdeD); parte.set(na.x + sx, na.y, PCU.verdeD);
  for (const [x, y] of [[-16, -78], [-11, -80], [-19, -75], [-13, -75], [4, -80]]) { const p = L(H(pt(x, y))); parte.set(p.x, p.y, PCU.verdeS); }
  // boca aberta: fundo vinho e língua
  const dob = pt(-3, -69);
  const Mn = p => H(soma(dob, rot(sub(p, dob), R.mand * -1)));
  if (R.mand > 4) poli(parte, [...[pt(-4, -69), pt(-27, -70)].map(H), ...[pt(-25, -64), pt(-4, -63)].map(Mn)].map(p => L(p)), PCU.boca);
  if (R.lingua || R.mand > 9) { const l0 = L(Mn(pt(-12, -65))); parte.disco(l0.x, l0.y, 2.6, PCU.lingua); parte.disco(l0.x - sx * 3, l0.y + 1, 1.8, PCU.lingua); }
  // dentinhos de cima: só dois caninos aparecem com a boca fechada
  if (R.mand > 4) for (let x = -25; x <= -7; x += 3) { const p = L(H(pt(x, -69))); parte.set(p.x, p.y, PCU.dente); parte.set(p.x, p.y + 1, PCU.dente); }
  else for (const x of [-21, -11]) { const p = L(H(pt(x, -69))); parte.set(p.x, p.y, PCU.dente); parte.set(p.x, p.y + 1, PCU.dente); parte.set(p.x + sx, p.y, PCU.dente); }
  cam.colar(parte.contornar(PCU.verdeO));
  // mandíbula: verde por fora, papo creme por baixo
  parte = nova();
  poli(parte, [pt(-3, -69), pt(-26, -69.5), pt(-27, -67), pt(-23, -64), pt(-4, -63)].map(p => L(Mn(p))), PCU.verde);
  for (let x = -22; x <= -2; x++) { const p = L(Mn(pt(x, -64.2))); if (parte.get(p.x, p.y)) parte.set(p.x, p.y, PCU.barriga); const q = L(Mn(pt(x, -65.2))); if (parte.get(q.x, q.y) && x > -20) parte.set(q.x, q.y, PCU.barriga); }
  sombraB(parte, PCU.verde, PCU.verdeS, null, 1);
  if (R.mand > 4) for (let x = -23; x <= -8; x += 3) { const p = L(Mn(pt(x, -69))); parte.set(p.x, p.y - 1, PCU.dente); }
  cam.colar(parte.contornar(PCU.verdeO));
  // risco do sorriso subindo no fim da boca (de boca fechada a Cuca sorri de lado)
  if (R.mand <= 4 || R.sorriso) { const a = L(H(pt(-3, -69))); cam.set(a.x, a.y, PCU.verdeO); cam.set(a.x + sx, a.y - 1, PCU.verdeO); cam.set(a.x + 2 * sx, a.y - 2, PCU.verdeO); }
  // bochecha corada
  { const p = L(H(pt(-6, -73))); cam.set(p.x, p.y, PCU.rubor); cam.set(p.x + sx, p.y, PCU.rubor); cam.set(p.x + 2 * sx, p.y, PCU.rubor); cam.set(p.x + sx, p.y + 1, PCU.rubor); }
  olhoJacarePx(cam, oc.x - sx * 0.5, oc.y, R.olho, R.iris, t, sx);
  // cabeleira loira: cachos fofos no alto da cabeça e caindo atrás da nuca
  const frente = nova();
  // primeiro o volume (bolas grandes), depois os cachos da borda por cima
  [[11, -82, 9], [14, -72, 7], [5, -88, 7]].forEach(([x, y, r]) => { const c = L(H(pt(x + bal * 0.3, y))); cachoPx(frente, c.x, c.y, r); });
  [[20, -82, 5], [20, -73, 5], [17, -65, 4.6], [17, -90, 5], [10, -95, 5.4], [3, -96, 5], [-4, -95, 4.4], [12, -64, 4]].forEach(([x, y, r], k) => {
    const c = L(H(pt(x + bal * (0.3 + 0.1 * k), y))); cachoPx(frente, c.x, c.y, r);
  });
  // franja: um cacho caindo na testa, atrás do olho
  { const c = L(H(pt(-10, -96))); cachoPx(frente, c.x, c.y, 3.4); }
  cam.colar(frente.contornar(PCU.cabO));
  braco(CUCA.ombroP, R.maos[0], false);
  return { mao: R.maos.map(m => L(m)), boca: L(H(pt(-27, -67))), cabeca: hc, corpo: L(T(pt(-1, -47))) };
}
// olhão de jacaré no calombo: esclera grande, íris com pupila de fenda, pálpebra pesada e cílios
function olhoJacarePx(cam, cx, cy, tipo, iris, t, sx) {
  const b = nova();
  const cilios = () => { for (const [dx, dy] of [[2, -4], [3, -5], [4, -3], [5, -4], [4, -1], [6, -2]]) b.set(cx + sx * dx, cy + dy, PCU.verdeO); };
  if (tipo === 'feliz' || tipo === 'piscando') {
    // olho fechado: arco para cima (feliz) ou linha reta (piscando)
    elipse(b, cx, cy, 3.8, 4.2, PCU.verde);
    for (let k = -3; k <= 3; k++) b.set(cx + k, cy + (tipo === 'feliz' ? (Math.abs(k) < 2 ? -1 : 0) : 1), PCU.verdeO);
    cilios(); cam.colar(b.contornar(PCU.verdeO)); return;
  }
  elipse(b, cx, cy, 3.8, 4.2, PCU.olho);
  if (tipo === 'tonto') { for (let i = 0; i < 12; i++) { const a = i * 0.7 + t * 7, r = i / 12 * 3; b.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, PCU.verdeO); } cilios(); cam.colar(b.contornar(PCU.verdeO)); return; }
  const ix = cx - sx * 0.8, iy = cy + 0.6;
  b.disco(ix, iy, 2.6, iris);
  b.set(ix, iy - 1, PCU.verdeO); b.set(ix, iy, PCU.verdeO); b.set(ix, iy + 1, PCU.verdeO);
  b.set(cx + sx * 1.2, cy - 1.6, PM.branco); b.set(cx + sx * 1.2, cy - 0.6, PM.branco);
  // pálpebra: brava = inclinada para o focinho; cansada = meio fechada
  const cobre = tipo === 'bravo' ? 1.6 : tipo === 'cansado' ? 3 : 0.6;
  for (let x = -4; x <= 4; x++) {
    const lim = cy - 4.4 + cobre + (tipo === 'bravo' ? -sx * x * 0.4 : 0);
    for (let y = Math.floor(cy - 5); y <= lim; y++) if (b.get(Math.floor(cx + x), y)) b.set(cx + x, y, PCU.verde);
    if (b.get(Math.floor(cx + x), Math.floor(lim) + 1)) b.set(cx + x, lim + 1, PCU.verdeO);
  }
  cilios();
  cam.colar(b.contornar(PCU.verdeO));
}
const FRASCO_PX = ['.r.', 'vvv', 'vLv', 'cCc', '.c.'];
function frascoPx(cam, c, cor, t, grande = false) {
  const b = nova();
  if (grande) {
    b.carimbo(['..rr..', '..vv..', '.vvvv.', 'vLcccv', 'vccccv', 'vcCccv', '.vccv.'], Math.round(c.x) - 3, Math.round(c.y) - 4, { r: PCU.rolha, v: PCU.vidro, L: PM.branco, c: cor, C: PM.branco });
  } else b.carimbo(FRASCO_PX, Math.round(c.x) - 1, Math.round(c.y) - 2, { r: PCU.rolha, v: PCU.vidro, L: PM.branco, c: cor, C: cor });
  cam.colar(b.contornar(PCU.vidroO));
}
function orbePx(cam, cx, cy, r, t) {
  const b = nova();
  b.disco(cx, cy, r, PCU.magia); b.disco(cx - r * 0.3, cy - r * 0.3, r * 0.45, PCU.magiaL);
  for (let i = 0; i < 6; i++) { const a = i * 0.9 + t * 9, d = i / 6 * r * 0.8; if (b.get(Math.floor(cx + Math.cos(a) * d), Math.floor(cy + Math.sin(a) * d))) b.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d, PCU.magiaD); }
  cam.colar(b.contornar(PCU.magiaO));
  // faíscas em volta
  for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; cam.set(cx + Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3), PCU.magiaL); }
}
const NOTA_PX = [['..oo', '..oL', '..o.', '..o.', 'ooo.', 'ooo.'], ['..oooo', '..o..o', '..o..o', 'ooo.oo', 'ooo.oo']];
function notaPx(cam, cx, cy, k, t) {
  const b = nova();
  b.carimbo(NOTA_PX[k % 2], Math.round(cx) - 2, Math.round(cy) - 3, { o: PCU.nota, L: PCU.notaL });
  cam.colar(b.contornar(PCU.notaL));
  if (Math.floor(t * 8 + k) % 3 === 0) cam.set(cx + 4, cy - 4, PM.branco);
}
function pocaPx(cam, x, larg, t, cores = [PCU.roxoD, PCU.roxo, PCU.roxoL]) {
  const b = nova();
  elipse(b, x, CHAO_PX - 0.5, larg, 2.2, cores[1]);
  elipse(b, x - larg * 0.2, CHAO_PX - 1, larg * 0.45, 0.8, cores[2]);
  cam.colar(b.contornar(cores[0]));
  for (let i = 0; i < 3; i++) { const u = (t * 1.2 + i / 3) % 1, bx = x + (i - 1) * larg * 0.5; if (u < 0.8) { const r = 1 + u * 1.5; const bb = nova(); bb.disco(bx, CHAO_PX - 3 - u * 9, r, cores[1]); cam.colar(bb.contornar(cores[0])); } }
}

const CUCA_ESTADOS = {
  idle: {
    dur: 2.4, nome: 'Esfregando as garras',
    quadro(s, t) {
      const R = cucaBase(t), u = s % 2.4;
      // pisca no meio e solta uma risadinha no fim: cabeça para trás, ombros sacudindo
      if (u > 0.9 && u < 1.05) R.olho = 'piscando';
      const ri = suave(trecho(u, 1.55, 1.7)) * (1 - suave(trecho(u, 2.15, 2.35)));
      if (ri > 0) { R.mand = 3 + ri * (6 + Math.abs(Math.sin(t * 22)) * 5); R.cab = -9 * ri; R.corpoY += -Math.abs(Math.sin(t * 22)) * 1.2 * ri; R.olho = ri > 0.6 ? 'feliz' : R.olho; }
      return { R };
    }
  },
  leque: {
    dur: 2.3, nome: 'Feitiço em leque', fase: 1, dica: 'passar entre as bolas',
    desc: 'Ergue as duas garras e carrega bolas verdes; depois empurra e solta três feitiços grandes em leque, bem separados, que andam ondulando.',
    quadro(s, t) {
      const R = cucaBase(t);
      const sobe = suave(trecho(s, 0, 0.3)), empurra = elastico(trecho(s, 0.75, 0.9)), solta = suave(trecho(s, 1.6, 2.1));
      R.maos = [lerp(lerp(R.maos[0], pt(-34, -62), sobe), pt(-42, -58), empurra * (1 - solta)), lerp(lerp(R.maos[1], pt(8, -104), sobe), pt(-36, -66), empurra * (1 - solta))];
      if (solta > 0) R.maos = R.maos.map((m, i) => lerp(m, cucaBase(t).maos[i], solta));
      R.inc = 4 - 10 * sobe * (1 - empurra) + 12 * empurra * (1 - solta); R.mand = 6 + 12 * sobe * (1 - solta) + (s < 0.75 ? Math.abs(Math.sin(t * 22)) * 4 : 0); R.cab = -8 * sobe * (1 - empurra);
      R.treme = 0;
      return {
        R, depois(cam, info) {
          if (s > 0.15 && s < 0.82) for (const m of info.mao) orbePx(cam, m.x, m.y - 4, 1 + 4 * suave(trecho(s, 0.15, 0.7)), t);
          const d = s - 0.82;
          if (d > 0) for (let k = -1; k <= 1; k++) {
            const ang = rad(180 + k * 20), dist = 170 * d;
            const x = info.mao[0].x - 6 + Math.cos(ang) * dist, y = info.mao[0].y - 4 + Math.sin(ang) * dist + Math.sin(d * 9 + k) * 4;
            if (x > -10 && y < CHAO_PX - 6) orbePx(cam, x, y, 6.5, t + k);
          }
        }
      };
    }
  },
  pocao: {
    dur: 2.6, nome: 'Poção de veneno', fase: 1, dica: 'sair da poça',
    desc: 'Tira a poção do cinto, chacoalha rindo e joga em arco onde o Curupira está. O vidro quebra e vira uma poça borbulhando.',
    quadro(s, t) {
      const R = cucaBase(t);
      const pega = suave(trecho(s, 0, 0.25)), arma = suave(trecho(s, 0.25, 0.55)), joga = elastico(trecho(s, 0.75, 0.88)), volta = suave(trecho(s, 1.5, 2.0));
      let m0 = lerp(R.maos[0], pt(-4, -20), pega);
      m0 = lerp(m0, pt(16 + Math.sin(t * 30) * 2, -96), arma);
      m0 = lerp(m0, pt(-42, -78), joga);
      R.maos[0] = lerp(m0, R.maos[0], volta);
      R.inc = 4 - 10 * arma * (1 - joga) + 14 * joga * (1 - volta); R.semPocao = s > 0.2 && s < 2.0;
      R.mand = s > 0.3 && s < 0.75 ? 10 + Math.abs(Math.sin(t * 20)) * 5 : 4; R.olho = s > 0.3 && s < 0.75 ? 'feliz' : 'bravo';
      return {
        R, depois(cam, info) {
          if (s > 0.2 && s < 0.8) frascoPx(cam, pt(info.mao[0].x, info.mao[0].y - 5), PCU.roxo, t, true);
          const voo = trecho(s, 0.8, 1.45);
          if (voo > 0 && voo < 1) { const a = pt(info.mao[0].x, info.mao[0].y - 5), x = mix(a.x, X_CURUPIRA, voo), y = mix(a.y, CHAO_PX - 4, voo) - 90 * 4 * voo * (1 - voo); frascoPx(cam, pt(x, y), PCU.roxo, t, true); }
          const d = s - 1.45;
          if (d >= 0) {
            if (d < 0.25) explosaoPx(cam, X_CURUPIRA, CHAO_PX - 4, d / 0.25, 10, [PCU.roxo, PCU.roxoL, PM.branco], PCU.roxoD);
            const larg = 6 + 16 * sai(trecho(d, 0, 0.25)) - 18 * trecho(d, 0.85, 1.15);
            if (larg > 1) pocaPx(cam, X_CURUPIRA, larg, t);
          }
        }
      };
    }
  },
  bote: {
    dur: 3.4, nome: 'Bote de jacaré', fase: 2, dica: 'pular por cima',
    desc: 'Agacha com a bocarra aberta, os dentes brilham e ela se joga de barriga, deslizando pela arena e abocanhando. Depois levanta e volta andando.',
    quadro(s, t) {
      const R = cucaBase(t);
      const W = X_CURUPIRA + 10 - R.X;
      const arma = suave(trecho(s, 0, 0.5)), deita = suave(trecho(s, 0.6, 0.75)), levanta = suave(trecho(s, 1.6, 1.9));
      R.inc = 4 + 20 * arma * (1 - deita); R.mand = 6 + 20 * arma * (1 - deita);
      R.deitada = deita * (1 - levanta);
      const desl = sai(trecho(s, 0.62, 1.45));
      R.x = W * desl;
      if (R.deitada > 0.5) { R.mand = 4 + 22 * Math.abs(Math.sin(t * 9)); R.rabo = Math.sin(t * 20) * 8; R.maos = [pt(-30, -6), pt(-22, -6)]; R.pes = [pt(12, 0), pt(20, 0)]; }
      if (s > 1.9) { const u = trecho(s, 2.1, 3.3); R.sx = s < 3.3 ? -1 : 1; R.x = mix(W, 0, u); R.corpoY = -Math.abs(Math.sin(s * 10)) * 1.5; const g = s * 5; R.pes = [pt(-10 + Math.sin(g) * 5, -Math.max(0, Math.cos(g)) * 3), pt(9 - Math.sin(g) * 5, -Math.max(0, -Math.cos(g)) * 3)]; }
      R.olho = s > 0.3 && s < 1.6 ? 'bravo' : R.olho;
      return {
        R, depois(cam, info) {
          if (s > 0.3 && s < 0.6 && Math.floor(t * 12) % 2) aviso(() => estrelaPx(cam, info.boca.x + 6, info.boca.y - 2, t));
          if (R.deitada > 0.5 && s < 1.45) for (let k = 0; k < 3; k++) poeiraPx(cam, info.corpo.x + 20 + k * 8, CHAO_PX, ((s * 3) + k / 3) % 1);
        }
      };
    }
  },
  ninar: {
    dur: 3.4, nome: 'Canção de ninar', fase: 3, dica: 'passar na brecha entre as notas',
    desc: '"Nana, neném...": balança cantando e solta duas fileiras de notas em onda, uma alta e uma baixa, com uma brecha entre elas que sobe e desce.',
    quadro(s, t) {
      const R = cucaBase(t);
      const k = suave(trecho(s, 0, 0.35)) * (1 - suave(trecho(s, 2.9, 3.3)));
      const bal = Math.sin(t * 4) * k;
      R.inc = 4 + bal * 8; R.cab = bal * 6 - 6 * k; R.mand = 6 + 8 * k * (0.5 + 0.5 * Math.abs(Math.sin(t * 8))); R.olho = k > 0.5 ? 'feliz' : 'bravo';
      R.maos = [lerp(R.maos[0], pt(-26, -76 + bal * 4), k), lerp(R.maos[1], pt(-4, -84 - bal * 4), k)];
      return {
        R, depois(cam, info) {
          for (let i = 0; i < 16; i++) {
            const ts = 0.4 + i * 0.14, d = s - ts;
            if (d < 0) continue;
            const x = info.boca.x - 6 - 120 * d, onda = Math.sin(ts * 3.2) * 18;
            for (const [alt, k2] of [[-64, 0], [-14, 1]]) {
              const y = CHAO_PX + alt + onda + Math.sin(d * 7 + i) * 2;
              if (x > -8 && (alt > -40 ? y < CHAO_PX - 4 : true)) notaPx(cam, x, Math.min(y, CHAO_PX - 6), i + k2, t);
            }
          }
        }
      };
    }
  },
  derrota: {
    dur: 3.6, nome: 'Derrota',
    quadro(s, t) {
      const R = cucaBase(t);
      const k = suave(trecho(s, 0.1, 0.7));
      R.corpoY = 12 * k; R.inc = mix(4, -14, k) + Math.sin(t * 2) * 2 * k; R.pes = [pt(-24 * k - 10 * (1 - k), 0), pt(-14 * k + 9 * (1 - k), 0)];
      R.maos = [pt(-20, -30 * k - 48 * (1 - k)), pt(-14, -32 * k - 50 * (1 - k))];
      R.chip = s < 1.0; R.mand = 3;
      R.olho = s < 1.0 ? 'bravo' : s < 2.0 ? 'tonto' : 'feliz'; R.iris = s > 1.2 ? PCU.irisCalma : PCU.iris; R.sorriso = s > 2.0;
      return { R, depois(cam, info) { if (s >= 1.0) chipSaltandoPx(cam, info.corpo.x, info.corpo.y, s - 1.0, t, 1); if (s > 1.0 && s < 2.0) estrelasTontas(cam, info.cabeca.x, info.cabeca.y - 12, t, 10); } };
    }
  }
};

/* =====================================================================
   BOTO COR-DE-ROSA
   Boto de pé na água, chapéu branco da lenda (esconde o espiráculo) e gravata-borboleta de galã.
   ===================================================================== */
const PBO = {
  rosaO: '#4A1430', rosaD: '#A8406E', rosaS: '#D96A94', rosa: '#F28BB0', rosaL: '#FFC2D8', barriga: '#FBD8E2',
  chapeu: '#F4F1E6', chapeuS: '#C8C2B0', chapeuO: '#3A3428', fita: '#3A1E14', gravata: '#C8261B', gravataL: '#F0504A',
  agua: '#4A9FD8', aguaL: '#BFE8FF', aguaD: '#2A6FB0', aguaO: '#0E2A4A', coracao: '#FF6FA0', coracaoL: '#FFD0E0', coracaoO: '#7A1440',
  iris: '#E0241B', irisCalma: '#7A4A2A'
};
const AGUA_Y = CHAO_PX + 6;
function botoBase(t) {
  const b = Math.sin(t * 2);
  return {
    X: 440, x: 0, y: b * 1.5, inc: Math.sin(t * 1.3) * 3, sx: 1, incha: 0, boca: 0, bico: 0, olho: 'galante', iris: PBO.iris,
    finP: pt(-16 + Math.sin(t * 4) * 2, -38 + Math.cos(t * 4) * 2), finL: pt(14, -40), chapeu: { dx: 0, dy: 0, ang: -8, solto: false }, chip: true, giro: 0, treme: 0
  };
}
function botoPx(cam, R, t) {
  const sx = R.sx, X = R.X + R.x, Y = AGUA_Y + R.y;
  const piv = pt(0, -34);
  const B = p => soma(piv, rot(sub(p, piv), -R.inc + R.giro));
  const L = p => pt(X + sx * p.x, Y + p.y);
  const inc = sx * (-R.inc + R.giro), cr = 1 + R.incha * 0.12;
  // nadadeira de lá e cauda (aparece quando ele sai da água)
  let parte = nova();
  mecha(parte, L(B(pt(8, -44))).x, L(B(pt(8, -44))).y, Math.atan2(L(B(R.finL)).y - L(B(pt(8, -44))).y, L(B(R.finL)).x - L(B(pt(8, -44))).x) * 180 / Math.PI, 11, 3.2, PBO.rosaS, 0);
  cam.colar(parte.contornar(PBO.rosaO));
  parte = nova();
  const cauda = L(B(pt(4, 14)));
  for (const lado of [-1, 1]) mecha(parte, cauda.x, cauda.y, 90 + inc + lado * 50, 10, 3.6, PBO.rosaS, 0);
  cam.colar(parte.contornar(PBO.rosaO));
  // corpo: torpedo em pé, cabeça (melão) e bico comprido
  parte = nova();
  const el = (c, rx, ry, cor) => { const p = L(B(c)); elipse(parte, p.x, p.y, rx * cr, ry, cor, inc); };
  el(pt(0, -26), 13, 34, PBO.rosa); el(pt(-3, -62), 12, 10, PBO.rosa);
  poli(parte, [pt(-11, -64), pt(-34 - R.bico, -59), pt(-35 - R.bico, -56), pt(-11, -55)].map(p => L(B(p))), PBO.rosa);
  sombraB(parte, PBO.rosa, PBO.rosaS, PBO.rosaL, 2);
  el(pt(-6, -26), 6, 26, PBO.barriga);
  // dorso e corcova
  const d = L(B(pt(12, -40)));
  parte.disco(d.x + sx, d.y, 3, PBO.rosaS);
  // boca: linha de sorriso no bico ou aberta no jato
  const b0 = L(B(pt(-12, -57))), b1 = L(B(pt(-33 - R.bico, -57)));
  if (R.boca > 0.3) { poli(parte, [b0, b1, L(B(pt(-30, -52))), L(B(pt(-13, -51)))], '#5A1020'); for (let u = 0.1; u < 0.9; u += 0.16) { const p = lerp(b0, b1, u); parte.set(p.x, p.y, PM.branco); } }
  else { for (let u = 0; u <= 1; u += 0.04) { const p = lerp(b0, b1, u); parte.set(p.x, p.y + (u < 0.15 ? -1 : 0), PBO.rosaD); } }
  cam.colar(parte.contornar(PBO.rosaO));
  // olho
  const oc = L(B(pt(-11, -65)));
  if (R.olho === 'feliz') { cam.set(oc.x - 1, oc.y, PBO.rosaO); cam.set(oc.x, oc.y - 1, PBO.rosaO); cam.set(oc.x + 1, oc.y, PBO.rosaO); }
  else if (R.olho === 'tonto') { cam.carimbo(['o.o', '.o.', 'o.o'], Math.round(oc.x) - 1, Math.round(oc.y) - 1, { o: PBO.rosaO }); }
  else {
    cam.carimbo(['.WW.', 'WIIW', 'WIPW', '.WW.'], Math.round(oc.x) - 2, Math.round(oc.y) - 2, { W: PM.branco, I: R.iris, P: PM.olhoO });
    // pálpebra de galã (meio fechada, sobrancelha arqueada)
    const lid = R.olho === 'bravo' ? ['oooo', 'rrrr'] : ['.oo.', 'rrrr'];
    cam.carimbo(lid, Math.round(oc.x) - 2, Math.round(oc.y) - 3, { o: PBO.rosaO, r: PBO.rosa });
  }
  // gravata-borboleta
  const g = L(B(pt(-8, -50)));
  parte = nova();
  parte.carimbo(['g...g', 'ggGgg', 'g...g'], Math.round(g.x) - 2, Math.round(g.y) - 1, { g: PBO.gravata, G: PBO.gravataL });
  cam.colar(parte.contornar(PBO.rosaO));
  if (R.chip) { const c = L(B(pt(5, -32))); chipPx(cam, c.x, c.y, t); }
  // chapéu (ou o espiráculo espirrando, quando o chapéu sai)
  const topo = L(B(pt(-2, -71)));
  if (!R.chapeu.solto) chapeuPx(cam, topo.x + sx * R.chapeu.dx, topo.y + R.chapeu.dy, sx * R.chapeu.ang + inc, t);
  else {
    cam.set(topo.x, topo.y + 1, PBO.rosaO); cam.set(topo.x + 1, topo.y + 1, PBO.rosaO);
    for (let k = 0; k < 4; k++) { const u = (t * 3 + k / 4) % 1; cam.set(topo.x + Math.sin(k * 2) * 4 * u, topo.y - 2 - 10 * u + 12 * u * u, u < 0.5 ? PBO.aguaL : PBO.agua); }
  }
  // nadadeira de cá (o braço dele)
  parte = nova();
  const ob = L(B(pt(-6, -44))), fp = L(B(R.finP));
  mecha(parte, ob.x, ob.y, Math.atan2(fp.y - ob.y, fp.x - ob.x) * 180 / Math.PI, Math.hypot(fp.x - ob.x, fp.y - ob.y), 3.6, PBO.rosa, 0);
  sombraB(parte, PBO.rosa, PBO.rosaS, PBO.rosaL, 1);
  cam.colar(parte.contornar(PBO.rosaO));
  return { bico: L(B(pt(-36 - R.bico, -57))), topo, fin: fp, corpo: L(B(pt(5, -32))), olho: oc };
}
function chapeuPx(cam, cx, cy, ang, t) {
  const b = nova();
  elipse(b, cx, cy, 11, 2, PBO.chapeu, ang);
  const c = Math.cos(rad(ang)), s = Math.sin(rad(ang)), P2 = (x, y) => pt(cx + x * c - y * s, cy + x * s + y * c);
  poli(b, [P2(-6, -1), P2(-5, -8), P2(5, -8), P2(6, -1)], PBO.chapeu);
  sombraB(b, PBO.chapeu, PBO.chapeuS, null, 1);
  for (let x = -5.5; x <= 5.5; x += 0.5) { const p = P2(x, -2.5); b.set(p.x, p.y, PBO.fita); const q = P2(x, -3.2); b.set(q.x, q.y, PBO.fita); }
  cam.colar(b.contornar(PBO.chapeuO));
}
function coracaoPx(cam, cx, cy, t, estoura = 0) {
  const b = nova();
  if (estoura > 0) { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, d = 3 + 6 * estoura; cam.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d, PBO.coracao); } return; }
  const pul = Math.floor(t * 6) % 2;
  b.carimbo(pul ? ['.cc.cc.', 'cLcccca', 'ccccccc', '.ccccc.', '..ccc..', '...c...'] : ['.cc.cc.', 'cLcccca', 'ccccccc', 'ccccccc', '.ccccc.', '..ccc..', '...c...'], Math.round(cx) - 3, Math.round(cy) - 3, { c: PBO.coracao, L: PBO.coracaoL, a: '#FF9AC0' });
  cam.colar(b.contornar(PBO.coracaoO));
}
function gotaPx(cam, cx, cy) { cam.carimbo(['.a.', 'aLa', 'aaa', '.A.'], Math.round(cx) - 1, Math.round(cy) - 2, { a: PBO.agua, L: PBO.aguaL, A: PBO.aguaD }); }
function respingoPx(cam, x, y, u) {
  for (let i = 0; i < 7; i++) { const a = rad(200 + i * 23), v = 22 + hash(i) * 10; const px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 40 * u * u; if (u < 0.9) gotaPx(cam, px, py); }
}
const X_CURUPIRA_BOTO = 160;
const BOTO_ESTADOS = {
  idle: {
    dur: 2.4, nome: 'Boiando, galanteador',
    quadro(s, t) { const R = botoBase(t); const c = s % 2.4; if (c > 1.5 && c < 2.1) { const k = Math.sin((c - 1.5) / 0.6 * Math.PI); R.chapeu.ang = -8 - 14 * k; R.chapeu.dy = -3 * k; R.finP = pt(-10, -70 + 6 * (1 - k)); R.olho = 'feliz'; } return { R }; }
  },
  jato: {
    dur: 2.5, nome: 'Jato d\'água', fase: 1, dica: 'abaixar',
    desc: 'Incha as bochechas puxando gotas para a boca, a bola d\'água cresce no bico e ele dispara um jato reto, saindo da boca, até a outra margem. Passa na altura do peito do Curupira.',
    quadro(s, t) {
      const R = botoBase(t);
      const k = suave(trecho(s, 0, 0.7)), tiro = trecho(s, 0.8, 1.9), fim = suave(trecho(s, 1.9, 2.4));
      R.incha = k * (1 - suave(trecho(s, 0.8, 0.9))); R.inc = (tiro > 0 ? -2 : -8 * k) * (1 - fim); R.y = 2 * k * (1 - fim);
      R.boca = tiro > 0 && tiro < 1 ? 1 : 0; R.olho = 'bravo'; R.x = tiro > 0 ? 3 * (1 - fim) : 0;
      R.finP = lerp(R.finP, pt(-18, -30), k * (1 - fim));
      return {
        R, depois(cam, info) {
          if (s < 0.8) {
            for (let i = 0; i < 6; i++) { const u = (s * 2.2 + i / 6) % 1, a = i * 1.1; aviso(() => gotaPx(cam, mix(info.bico.x + Math.cos(a) * 30 - 10, info.bico.x, u), mix(info.bico.y + Math.sin(a) * 18 + 10, info.bico.y, u))); }
            const b = nova(); b.disco(info.bico.x - 3, info.bico.y, 1 + 5 * k, PBO.agua); b.disco(info.bico.x - 4, info.bico.y - 1.5, 2 * k, PBO.aguaL); cam.colar(b.contornar(PBO.aguaO));
          }
          if (tiro > 0 && tiro < 1) {
            const xf = mix(info.bico.x, -10, sai(trecho(tiro, 0, 0.15))), y0 = Math.round(info.bico.y);
            const b = nova();
            // jato: reto, saindo da boca na horizontal até a outra margem
            b.disco(info.bico.x - 2, y0, 4.5, PBO.agua);
            for (let x = info.bico.x - 2; x > xf; x -= 1) { b.set(x, y0 - 3, PBO.agua); b.set(x, y0 - 2, PBO.agua); b.set(x, y0 - 1, PBO.agua); b.set(x, y0, PBO.agua); b.set(x, y0 + 1, PBO.agua); b.set(x, y0 + 2, PBO.aguaD); b.set(x, y0 + 3, PBO.aguaD); }
            for (let x = info.bico.x - 6; x > xf + 4; x -= 9) { const xx = x - ((t * 240) % 9); b.set(xx, y0 - 2, PBO.aguaL); b.set(xx - 1, y0 - 2, PBO.aguaL); b.set(xx - 2, y0 - 1, PBO.aguaL); }
            cam.colar(b.contornar(PBO.aguaO));
            if (xf > 0) for (let i = 0; i < 3; i++) gotaPx(cam, xf - 2 - i * 3, y0 - 6 - ((t * 5 + i * 0.3) % 1) * 10);
          }
        }
      };
    }
  },
  beijos: {
    dur: 3.4, nome: 'Beijos de bolha', fase: 1, dica: 'atirar nos corações',
    desc: 'Ajeita o chapéu, faz bico e manda quatro beijos: corações de bolha que vêm devagar ondulando. Um tiro estoura cada um.',
    quadro(s, t) {
      const R = botoBase(t);
      const k = suave(trecho(s, 0, 0.3)) * (1 - suave(trecho(s, 2.0, 2.4)));
      R.bico = 3 * k; R.olho = 'feliz'; R.inc = -6 * k;
      const beijo = (s * 2.2) % 1;
      R.finP = lerp(R.finP, lerp(pt(-20, -60), pt(-36, -52), beijo < 0.3 ? beijo / 0.3 : 1), k);
      R.chapeu.ang = -14 * k;
      return {
        R, depois(cam, info) {
          for (let i = 0; i < 4; i++) {
            const ts = 0.45 + i * 0.45, d = s - ts;
            if (d < 0) continue;
            const x = info.bico.x - 4 - 70 * d, y = info.bico.y + i * 5 - 6 + Math.sin(d * 4 + i) * 10 + d * 8;
            const vida = trecho(d, 2.2, 2.5);
            if (x > -6) coracaoPx(cam, x, y, t + i, vida);
          }
        }
      };
    }
  },
  chapeu: {
    dur: 2.9, nome: 'Chapéu bumerangue', fase: 2, dica: 'pular na ida, abaixar na volta',
    desc: 'Gira o chapéu na nadadeira e arremessa: ele vai baixo até o outro lado e volta alto, girando. Sem chapéu, o espiráculo espirra água.',
    quadro(s, t) {
      const R = botoBase(t);
      const gira = trecho(s, 0, 0.6), joga = elastico(trecho(s, 0.6, 0.75)), pega = trecho(s, 2.45, 2.6);
      R.finP = s < 0.6 ? pt(-6 + Math.cos(t * 18) * 6, -74 + Math.sin(t * 18) * 3) : lerp(pt(-36, -46), botoBase(t).finP, suave(trecho(s, 0.75, 1.1)));
      if (s > 2.4) R.finP = lerp(R.finP, pt(-10, -74), suave(trecho(s, 2.4, 2.55)));
      R.inc = s < 0.6 ? -6 * suave(gira) : 10 * joga * (1 - suave(trecho(s, 0.8, 1.2)));
      R.chapeu.solto = s >= 0.6 && s < 2.58; R.olho = s > 0.6 && s < 2.5 ? 'bravo' : 'galante';
      if (s < 0.6) { R.chapeu.dx = 0; R.chapeu.dy = 0; }
      return {
        R, depois(cam, info) {
          if (s < 0.6) chapeuPx(cam, info.fin.x, info.fin.y - 3, t * 900, t);
          const u = trecho(s, 0.6, 2.5);
          if (u > 0 && u < 1) {
            // ida baixa, curva na parede e volta alta
            const ida = u < 0.5, v = ida ? u / 0.5 : (u - 0.5) / 0.5;
            const x = ida ? mix(info.fin.x, 30, sai(v)) : mix(30, info.topo.x, entra(v) * 0.5 + v * 0.5);
            const y = ida ? CHAO_PX - 10 : mix(CHAO_PX - 10, CHAO_PX - 58, sai(Math.min(1, v * 3))) + (v > 0.7 ? mix(0, info.topo.y - (CHAO_PX - 58), (v - 0.7) / 0.3) : 0);
            chapeuPx(cam, x, y, t * 1400, t);
            for (let k = 1; k <= 3; k++) cam.set(x + (ida ? 6 : -6) * k, y + Math.sin(t * 30 + k) * 2, PBO.chapeuS);
          }
        }
      };
    }
  },
  salto: {
    dur: 3.6, nome: 'Salto do boto', fase: 3, dica: 'correr para baixo dele',
    desc: 'Afunda, a água borbulha e ele salta num arco enorme por cima da areia, girando e deixando cair gotas, até a outra margem. Depois salta de volta.',
    quadro(s, t) {
      const R = botoBase(t);
      const X2 = 26 - R.X;
      const afunda = suave(trecho(s, 0, 0.35));
      R.y += 30 * afunda;
      const salto = (t0, xa, xb) => {
        const u = trecho(s, t0, t0 + 1.05);
        if (u <= 0 || u >= 1) return false;
        R.x = mix(xa, xb, u); R.y = 30 - (30 + 110) * 4 * u * (1 - u) + 30 * (u > 0.85 ? (u - 0.85) / 0.15 : 0);
        R.giro = (xb < xa ? 1 : -1) * -mix(-40, 220, u); R.olho = 'feliz'; R.finP = pt(-14, -40);
        return true;
      };
      if (!salto(0.45, 0, X2)) {
        if (s >= 1.5 && s < 2.1) { R.x = X2; R.y = 30 * (1 - suave(trecho(s, 1.6, 1.9))) + 30 * suave(trecho(s, 1.9, 2.05)); R.sx = -1; }
        else if (!salto(2.1, X2, 0) && s >= 3.15) { R.y = 30 * (1 - suave(trecho(s, 3.15, 3.5))); }
      } else if (s > 0.98) R.sx = -1;
      if (s >= 2.1 && s < 3.15) R.sx = s < 2.62 ? -1 : 1;
      return {
        R, depois(cam, info) {
          if (s < 0.45) aviso(() => { for (let i = 0; i < 4; i++) { const u = (s * 3 + i / 4) % 1; const b = nova(); b.disco(R.X - 8 + i * 6, AGUA_Y - u * 8, 1 + u * 1.5, PBO.aguaL); cam.colar(b.contornar(PBO.aguaO)); } });
          for (const [t0, xs] of [[0.45, R.X], [1.5, 26], [2.1, 26], [3.15, R.X]]) { const u = trecho(s, t0, t0 + 0.4); if (u > 0 && u < 1) respingoPx(cam, xs, AGUA_Y, u); }
          if ((s > 0.6 && s < 1.4) || (s > 2.25 && s < 3.05)) for (let i = 0; i < 2; i++) gotaPx(cam, info.corpo.x + (i - 0.5) * 8, info.corpo.y + 10 + ((t * 4 + i * 0.5) % 1) * 30);
          if ((s > 0.6 && s < 1.4) || (s > 2.25 && s < 3.05)) aviso(() => elipse(cam, info.corpo.x, CHAO_PX + 1, 10, 1.6, '#B88A4A'));
        }
      };
    }
  },
  derrota: {
    dur: 3.6, nome: 'Derrota',
    quadro(s, t) {
      const R = botoBase(t);
      R.chip = s < 0.8; R.olho = s < 0.8 ? 'bravo' : s < 1.8 ? 'tonto' : 'feliz'; R.iris = s > 1.0 ? PBO.irisCalma : PBO.iris;
      R.y += 10 * suave(trecho(s, 0, 0.6)) * (1 - suave(trecho(s, 1.8, 2.3)));
      // tira o chapéu e faz uma reverência
      const rev = suave(trecho(s, 2.0, 2.5)) * (1 - suave(trecho(s, 3.2, 3.6)));
      R.inc = -16 * rev; R.finP = lerp(R.finP, pt(-14, -82), rev);
      R.chapeu.solto = rev > 0.3;
      return { R, depois(cam, info) { if (s >= 0.8) chipSaltandoPx(cam, info.corpo.x, info.corpo.y, s - 0.8, t, 1); if (R.chapeu.solto) chapeuPx(cam, info.fin.x, info.fin.y - 2, -20, t); if (s > 0.8 && s < 1.8) estrelasTontas(cam, info.topo.x, info.topo.y - 8, t, 10); } };
    }
  }
};

/* =====================================================================
   MÁQUINA DE IA — o Núcleo
   Design próprio na linha de "laboratório de testes": casca branca de painéis pendurada no teto
   por um braço mecânico, uma lente vermelha (o chip) e cabos soltos embaixo.
   ===================================================================== */
const PMQ = {
  branco: '#F2F4F5', brancoS: '#C9D0D6', brancoD: '#8E98A2', contorno: '#1A1E24', metal: '#3A3F48', metalL: '#5C636E', metalD: '#22262C',
  lente: '#E3261B', lenteL: '#FF8A6A', lenteD: '#7A1010', laser: '#FF3A2A', laserL: '#FFE0D4', laserD: '#A8100A',
  verde: '#5CF28A', azul: '#4AB8FF', amarelo: '#F2C230', bomba: '#E9EDF0', placa: '#DDE3E8', placaS: '#AEB8C2', planta: '#4E8C33', plantaL: '#86B83C'
};
const MAQ_TETO = 14, ALCAPOES = [X_CURUPIRA, 190, 270];
function maqBase(t) {
  return {
    X: 380, cx: 380 + Math.sin(t * 0.9) * 4, cy: 96 + Math.sin(t * 1.7) * 2.5, ang: Math.sin(t * 0.9) * 4,
    olhar: pt(Math.round(Math.sin(t * 0.7) * 1.4), Math.round(Math.cos(t * 1.1) * 0.8)), abre: 1, brilho: 0, lente: PMQ.lente,
    chip: true, abas: 0, quebrado: 0, treme: 0, cabos: Math.sin(t * 2)
  };
}
function maquinaPx(cam, R, t) {
  const E = 1.3, C = pt(R.cx, R.cy), A = p => soma(C, rot(mul(p, E), R.ang));   // E: tamanho do Núcleo
  // braço: ombro no trilho do teto, cotovelo dobrando para a direita, punho no alto da casca
  const ombro = pt(R.X + 22, MAQ_TETO + 2), punho = A(pt(6, -18));
  const d = Math.hypot(punho.x - ombro.x, punho.y - ombro.y), L1 = 52;
  const meio = lerp(ombro, punho, 0.5), dobra = Math.sqrt(Math.max(0, (L1 / 2) ** 2 - (d / 2) ** 2));
  const cot = soma(meio, mul(pt((punho.y - ombro.y) / d, -(punho.x - ombro.x) / d), -dobra));
  let parte = nova();
  // carrinho no trilho
  poli(parte, [pt(ombro.x - 9, MAQ_TETO - 4), pt(ombro.x + 9, MAQ_TETO - 4), pt(ombro.x + 7, MAQ_TETO + 4), pt(ombro.x - 7, MAQ_TETO + 4)], PMQ.metalL);
  parte.traco([ombro, cot], 6, PMQ.metal); parte.traco([cot, punho], 5, PMQ.metal);
  for (const [p, r] of [[ombro, 4], [cot, 4.5]]) { parte.disco(p.x, p.y, r, PMQ.branco); parte.disco(p.x, p.y, r - 2, PMQ.brancoS); }
  // pistão no segmento de cima
  const pis = lerp(ombro, cot, 0.5); parte.disco(pis.x, pis.y, 1.6, PMQ.metalL);
  cam.colar(parte.contornar(PMQ.contorno));
  // cabos soltos embaixo
  parte = nova();
  [[-10, 18, 1], [0, 24, -1], [9, 15, 1]].forEach(([x, comp, l], k) => {
    const a = A(pt(x, 14)), b = soma(a, pt(Math.sin(t * 2 + k) * 4 * l + R.cabos * 2, comp));
    parte.traco(curvaQ(a, soma(lerp(a, b, 0.5), pt(5 * l, 0)), b, 8), 1.6, PMQ.metal);
    parte.carimbo(['mm', 'MM'], Math.round(b.x) - 1, Math.round(b.y), { m: PMQ.metalL, M: PMQ.amarelo });
  });
  cam.colar(parte.contornar(PMQ.contorno));
  // abas traseiras (abrem quando carrega)
  parte = nova();
  for (const lado of [-1, 1]) {
    const b0 = A(pt(16, lado * 9)), ang = R.ang + lado * (25 + 30 * R.abas);
    const c = Math.cos(rad(ang)), sn = Math.sin(rad(ang)), Q = (x, y) => pt(b0.x + x * c - y * sn, b0.y + x * sn + y * c);
    poli(parte, [Q(0, -4 * E), Q(13 * E, -3 * E), Q(14 * E, 3 * E), Q(0, 4 * E)], PMQ.branco);
    for (let x = 4; x <= 11; x += 3) { const p = Q(x * E, 0); parte.set(p.x, p.y, PMQ.brancoD); }
  }
  sombraB(parte, PMQ.branco, PMQ.brancoS, null, 1);
  cam.colar(parte.contornar(PMQ.contorno));
  // casca: esfera de painéis brancos, metade de baixo mais escura
  parte = nova();
  elipse(parte, C.x, C.y, 24 * E, 20 * E, PMQ.branco, R.ang);
  dentro(parte, (x, y) => { const v = rot(sub(pt(x + 0.5, y + 0.5), C), -R.ang); return v.y > 5 * E; }, PMQ.brancoS);
  sombraB(parte, PMQ.branco, PMQ.brancoS, null, 1);
  sombraB(parte, PMQ.brancoS, PMQ.brancoD, null, 2);
  // juntas dos painéis
  for (const [x0, y0, x1, y1] of [[-2, -20, 2, -8], [12, -16, 9, 15], [-20, 5, 22, 5]]) {
    const a = A(pt(x0, y0)), b = A(pt(x1, y1));
    for (let u = 0; u <= 1; u += 0.04) { const p = lerp(a, b, u); if (parte.get(p.x, p.y)) parte.set(p.x, p.y, PMQ.brancoD); }
  }
  // rachadura (derrota)
  if (R.quebrado > 0) { const pts = [pt(-6, -19), pt(-2, -14), pt(-5, -10), pt(0, -5)].map(A); for (let i = 0; i < 3 * R.quebrado; i++) { const a = pts[i], b = pts[i + 1]; for (let u = 0; u <= 1; u += 0.1) { const p = lerp(a, b, u); parte.set(p.x, p.y, PMQ.contorno); } } }
  cam.colar(parte.contornar(PMQ.contorno));
  // LEDs de status
  for (let k = 0; k < 3; k++) { const p = A(pt(4 + k * 3, 10)); const on = R.quebrado ? false : Math.floor(t * 3 + k) % 3 !== 0; cam.set(p.x, p.y, on ? (k === 1 ? PMQ.azul : PMQ.verde) : PMQ.metal); }
  if (R.chip) { const p = A(pt(8, -10)); chipPx(cam, p.x, p.y, t); }
  // olho: anel escuro, anel metálico e a lente
  const O = A(pt(-12, 0));
  parte = nova();
  parte.disco(O.x, O.y, 10 * E, PMQ.metal); parte.disco(O.x, O.y, 8 * E, PMQ.metalL); parte.disco(O.x, O.y, 6.5 * E, PMQ.metalD);
  const L0 = soma(O, R.olhar), rl = (3.2 + 1.5 * R.brilho) * E;
  if (R.lente) {
    parte.disco(L0.x, L0.y, rl + 1, R.lente === PMQ.lente ? PMQ.lenteD : '#1E5A3A');
    parte.disco(L0.x, L0.y, rl, R.lente);
    parte.disco(L0.x, L0.y, rl * 0.55, R.lente === PMQ.lente ? PMQ.lenteL : '#C8FFD8');
    parte.set(L0.x - 2, L0.y - 2, PM.branco);
  }
  // pálpebras: placas brancas que fecham por cima e por baixo
  const fecha = 1 - R.abre;
  const rO = Math.round(9 * E);
  if (fecha > 0.05) for (let y = -rO; y <= rO; y++) for (let x = -rO; x <= rO; x++) {
    if (x * x + y * y > rO * rO) continue;
    const v = pt(x, y), lim = rO * (1 - fecha);
    if (v.y < -lim + (R.bravo ? x * 0.4 : 0) || v.y > lim + 2) parte.set(O.x + x, O.y + y, v.y < 0 ? PMQ.branco : PMQ.brancoS);
  }
  cam.colar(parte.contornar(PMQ.contorno));
  // brilho do carregamento em volta da lente
  if (R.brilho > 0.1 && Math.floor(t * 20) % 2) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 3, r = (11 + 3 * R.brilho) * E; cam.set(O.x + Math.cos(a) * r, O.y + Math.sin(a) * r, PMQ.laserL); }
  return { olho: O, lente: L0, corpo: A(pt(8, -10)), topo: A(pt(-4, -20)) };
}
// laser: núcleo claro e bordas vermelhas, com tremidinha
function laserPx(cam, a, b, larg, t) {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)), dx = (b.x - a.x) / n, dy = (b.y - a.y) / n, nx = -dy, ny = dx;
  for (let i = 0; i <= n; i++) {
    const w = larg + (Math.floor(t * 30 + i * 0.3) % 2);
    for (let k = -w; k <= w; k++) { const cor = Math.abs(k) <= w * 0.35 ? PMQ.laserL : Math.abs(k) < w ? PMQ.laser : PMQ.laserD; cam.set(a.x + dx * i + nx * k * 0.9, a.y + dy * i + ny * k * 0.9, cor); }
  }
}
function linhaMira(cam, a, b, t, cheia) {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
  for (let i = 0; i <= n; i++) if (cheia || (i + Math.floor(t * 30)) % 6 < 3) cam.set(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, PMQ.laser);
}
function bombaPx(cam, cx, cy, t, rapido) {
  const b = nova();
  b.disco(cx, cy, 5, PMQ.bomba); b.disco(cx - 1.5, cy - 1.5, 2, PM.branco);
  sombraB(b, PMQ.bomba, PMQ.brancoS, null, 1);
  b.carimbo(['mmm', '.m.'], Math.round(cx) - 1, Math.round(cy) - 7, { m: PMQ.metal });
  const pisca = Math.floor(t * (rapido ? 16 : 5)) % 2;
  b.set(cx, cy, pisca ? PMQ.laser : PMQ.lenteD); b.set(cx + 1, cy, pisca ? PMQ.laser : PMQ.lenteD);
  cam.colar(b.contornar(PMQ.contorno));
}
function alcapaoPx(cam, x, abre) {
  if (abre <= 0) return;
  const w = 9, a = abre * w;
  for (let y = MAQ_TETO - 2; y <= MAQ_TETO + 1; y++) for (let k = -w; k <= w; k++) cam.set(x + k, y, Math.abs(k) < a ? PMQ.contorno : null);
  // as duas portinholas penduradas
  for (const l of [-1, 1]) for (let k = 0; k < 6 * abre; k++) { cam.set(x + l * (w - 1), MAQ_TETO + 2 + k, PMQ.brancoS); cam.set(x + l * w, MAQ_TETO + 2 + k, PMQ.contorno); }
}
function placaPx(cam, x, alt) {
  if (alt <= 0.3) return;
  const b = nova(), w = 7, y = CHAO_PX - alt;
  for (let k = -w; k <= w; k++) { b.set(x + k, y, PM.branco); b.set(x + k, y + 1, PMQ.placa); b.set(x + k, y + 2, PMQ.placaS); }
  for (let yy = y + 3; yy < CHAO_PX; yy++) { b.set(x - 1, yy, PMQ.metal); b.set(x, yy, PMQ.metalL); b.set(x + 1, yy, PMQ.metal); }
  cam.colar(b.contornar(PMQ.contorno));
}
const MAQ_ESTADOS = {
  idle: {
    dur: 2.4, nome: 'Observando',
    quadro(s, t) { const R = maqBase(t); const c = s % 2.4; if (c > 1.9 && c < 2.05) R.abre = 0.1; return { R }; }
  },
  laser: {
    dur: 2.4, nome: 'Laser de mira', fase: 1, dica: 'sair da linha antes de travar',
    desc: 'A lente abre, uma linha tracejada segue o Curupira, trava piscando e o laser dispara. O tiro arranca faíscas e deixa o chão marcado.',
    quadro(s, t) {
      const R = maqBase(t);
      const k = suave(trecho(s, 0, 0.3)) * (1 - suave(trecho(s, 2.0, 2.3)));
      R.brilho = k; R.abas = k; R.bravo = true; R.abre = 1;
      const dispara = s > 1.3 && s < 1.9;
      if (dispara) { R.cx += 2 + Math.sin(t * 60); R.ang += 3; }
      const alvo = pt(X_CURUPIRA + Math.sin(s * 3) * 12 * (s < 1.0 ? 1 : 0), CHAO_PX - 20);
      R.olhar = pt(-2, 1);
      return {
        R, depois(cam, info) {
          const fim = pt(alvo.x + (alvo.x - info.lente.x) * 0.25, alvo.y + (alvo.y - info.lente.y) * 0.25);
          if (s > 0.3 && s < 1.0) linhaMira(cam, info.lente, fim, t, false);
          if (s >= 1.0 && s < 1.3 && Math.floor(t * 14) % 2) linhaMira(cam, info.lente, fim, t, true);
          if (dispara) {
            laserPx(cam, info.lente, fim, 2.4 * (s < 1.4 ? (s - 1.3) / 0.1 : s > 1.8 ? (1.9 - s) / 0.1 : 1) + 0.5, t);
            faiscasPx(cam, fim.x, Math.min(fim.y, CHAO_PX - 2), (s * 4) % 1, 6, Math.floor(s * 4));
          }
          if (s > 1.3) aviso(() => { for (let k2 = -6; k2 <= 6; k2++) cam.set(fim.x + k2, CHAO_PX - 1, Math.abs(k2) < 3 ? '#2A2E36' : '#5A606A'); });
        }
      };
    }
  },
  bombas: {
    dur: 3.0, nome: 'Alçapões', fase: 1, dica: 'sair da área da bomba',
    desc: 'Recolhe para o alto, os alçapões do teto abrem e três bombas caem quicando. Elas piscam cada vez mais rápido e explodem.',
    quadro(s, t) {
      const R = maqBase(t);
      R.cy -= 14 * suave(trecho(s, 0, 0.4)) * (1 - suave(trecho(s, 2.4, 2.9))); R.abre = 0.55; R.bravo = true; R.olhar = pt(-1, 2);
      return {
        R, depois(cam, info) {
          ALCAPOES.forEach((x, i) => {
            const t0 = 0.4 + i * 0.25;
            alcapaoPx(cam, x, suave(trecho(s, t0 - 0.2, t0)) * (1 - suave(trecho(s, t0 + 0.6, t0 + 0.9))));
            const d = s - t0;
            if (d < 0) return;
            const queda = 0.55, yq = d < queda ? MAQ_TETO + 6 + (CHAO_PX - 5 - MAQ_TETO - 6) * (d / queda) ** 2 : CHAO_PX - 5 - Math.max(0, 14 * Math.sin(Math.min(1, (d - queda) / 0.3) * Math.PI));
            const boom = 1.6;
            if (d < boom) {
              bombaPx(cam, x, yq, t, d > 1.1);
              if (d > queda) aviso(() => { for (let a = 0; a < 20; a++) if ((a + Math.floor(t * 12)) % 4 < 2) cam.set(x + Math.cos(a / 20 * TAU) * 16, CHAO_PX + Math.sin(a / 20 * TAU) * 2.5, PMQ.laser); });
            } else if (d < boom + 0.35) explosaoPx(cam, x, CHAO_PX - 8, (d - boom) / 0.35, 16, [PM.fogo3, PM.fogo6, PM.branco]);
          });
        },
        treme: ALCAPOES.some((x, i) => { const d = s - 0.4 - i * 0.25 - 1.6; return d > 0 && d < 0.15; }) ? 2 : 0
      };
    }
  },
  pistoes: {
    dur: 2.8, nome: 'Piso traiçoeiro', fase: 2, dica: 'pular a onda de placas',
    desc: 'A lente olha para o chão, um feixe varre o piso e as placas saltam em sequência, uma onda de pistões vindo na direção do Curupira. Depois vem uma segunda onda.',
    quadro(s, t) {
      const R = maqBase(t);
      R.olhar = pt(-2, 3); R.abre = 0.8; R.brilho = s < 0.5 ? suave(s / 0.5) : 0.3; R.ang -= 6 * suave(trecho(s, 0, 0.3));
      return {
        R, depois(cam, info) {
          if (s < 0.5) linhaMira(cam, info.lente, pt(info.lente.x - 20, CHAO_PX), t, false);
          for (const [t0, vel] of [[0.5, 240], [1.5, 300]]) {
            const d = s - t0;
            if (d < 0) continue;
            const frente = 352 - vel * d;
            for (let x = 352; x > 0; x -= 16) {
              const atraso = (352 - x) / vel, u = (d - atraso) / 0.3;
              if (u > 0 && u < 1) placaPx(cam, x, 15 * Math.sin(u * Math.PI));
              if (u > -0.3 && u < 0 && Math.floor(t * 20) % 2) aviso(() => { for (let k = -6; k <= 6; k += 2) cam.set(x + k, CHAO_PX, PMQ.laser); });
            }
          }
        },
        treme: 0
      };
    }
  },
  varredura: {
    dur: 3.6, nome: 'Varredura', fase: 3, dica: 'abaixar no alto, pular no baixo',
    desc: 'O Núcleo desce até a altura do Curupira e varre a arena: primeiro um laser reto na altura da cabeça (abaixe), depois o feixe mira o chão e o ponto queimando corre até a parede (pule por cima).',
    quadro(s, t) {
      const R = maqBase(t);
      const y1 = CHAO_PX - 44;
      R.cy = kf(s, [[0, R.cy], [0.5, y1, sai], [3.0, y1], [3.6, R.cy]]);
      R.cx = 400; R.ang = s > 2.0 && s < 3.0 ? -10 : 0; R.olhar = s > 1.8 && s < 3.0 ? pt(-3, 2) : pt(-3, 0); R.abas = 1; R.bravo = true;
      R.brilho = (s > 0.5 && s < 1.6) || (s > 2.0 && s < 3.0) ? 1 : 0.2;
      return {
        R, depois(cam, info) {
          // 1ª passada: reto na altura da cabeça
          let u = trecho(s, 0.5, 1.6);
          if (u > 0 && u < 1) {
            const fim = pt(-4, info.lente.y);
            if (u < 0.45) { if (Math.floor(t * 12) % 2) linhaMira(cam, info.lente, fim, t, u > 0.3); }
            else { laserPx(cam, info.lente, fim, 2.6, t); for (let i = 0; i < 3; i++) faiscasPx(cam, 2, info.lente.y, (s * 3 + i / 3) % 1, 4, i); }
          }
          // 2ª passada: mira o chão perto dela e o ponto de impacto corre para a esquerda
          u = trecho(s, 1.8, 3.0);
          if (u > 0 && u < 1) {
            const x = u < 0.3 ? 330 : mix(330, -4, (u - 0.3) / 0.7), fim = pt(x, CHAO_PX - 1);
            if (u < 0.3) { if (Math.floor(t * 12) % 2) linhaMira(cam, info.lente, fim, t, u > 0.2); }
            else {
              laserPx(cam, info.lente, fim, 1.8, t);
              explosaoPx(cam, x, CHAO_PX - 4, (s * 6) % 1 * 0.5, 7, [PMQ.laser, PMQ.laserL, PM.branco], PMQ.laserD);
              aviso(() => { for (let xx = Math.ceil(x + 4); xx < 330; xx += 2) cam.set(xx, CHAO_PX - 1, xx - x < 40 ? PM.fogo3 : '#2A2E36'); });
            }
          }
        },
        treme: (s > 1.0 && s < 1.6) || (s > 2.5 && s < 3.0) ? 1 : 0
      };
    }
  },
  derrota: {
    dur: 3.8, nome: 'Derrota',
    quadro(s, t) {
      const R = maqBase(t);
      const k = suave(trecho(s, 0.3, 1.2));
      R.cy = mix(R.cy, 150, k); R.ang = mix(R.ang, 28, k) + (s < 1.2 ? Math.sin(t * 40) * 3 * (1 - k) : 0); R.cx += 10 * k;
      R.quebrado = clamp(s / 0.6, 0, 1); R.chip = s < 0.9; R.abas = 0;
      R.lente = s < 1.4 ? (Math.floor(t * 12) % 3 ? PMQ.lente : null) : s < 2.2 ? null : '#5CF28A';
      R.abre = s < 2.2 ? 0.4 : 1; R.olhar = pt(0, 1); R.cabos = 0;
      return {
        R, depois(cam, info) {
          if (s < 1.4) faiscasPx(cam, info.topo.x, info.topo.y + 4, (s * 2.5) % 1, 8, Math.floor(s * 2.5));
          if (s >= 0.9) chipSaltandoPx(cam, info.corpo.x, info.corpo.y, s - 0.9, t, 1);
          // um broto nasce da rachadura
          const b = suave(trecho(s, 2.2, 3.2));
          if (b > 0) { const p = info.topo, h = 10 * b; for (let y = 0; y < h; y++) cam.set(p.x + Math.round(Math.sin(y * 0.4)), p.y - y, PMQ.planta); if (b > 0.5) { cam.carimbo(['LL..', 'LLL.', '.LLl'], Math.round(p.x) - 4, Math.round(p.y - h) - 1, { L: PMQ.plantaL, l: PMQ.planta }); cam.carimbo(['..LL', '.LLL', 'lLL.'], Math.round(p.x) + 1, Math.round(p.y - h) - 2, { L: PMQ.plantaL, l: PMQ.planta }); } }
        },
        treme: s < 0.4 ? 2 : 0
      };
    }
  }
};

// efeitos que não machucam
anelAviso = inofensivo(anelAviso); linhaMira = inofensivo(linhaMira); fumacaPx = inofensivo(fumacaPx); poeiraPx = inofensivo(poeiraPx);
estrelasTontas = inofensivo(estrelasTontas); faiscasPx = inofensivo(faiscasPx); chipSaltandoPx = inofensivo(chipSaltandoPx);
respingoPx = inofensivo(respingoPx); alcapaoPx = inofensivo(alcapaoPx);

const CHEFES_PX = [
  {
    id: 'mula', nome: 'Mula sem Cabeça', estados: MULA_ESTADOS, sombra: '#4A2C1C',
    desenhar(cam, e, s, t, sombra) {
      const q = this.estados[e].quadro(s, t);
      const info = mulaPx(cam, q.R, t, sombra);
      if (q.depois) q.depois(cam, info);
      return { treme: q.treme ?? q.R.treme ?? 0 };
    },
    fases: [
      { nome: 'Fase 1', ataques: ['bolas', 'pisoteio'], roteiro: [['idle', 1.2], ['bolas'], ['idle', 0.9], ['pisoteio'], ['idle', 0.9], ['bolas'], ['idle', 0.8], ['pisoteio']] },
      { nome: 'Fase 2', ataques: ['investida'], roteiro: [['idle', 0.8], ['investida'], ['idle', 0.6], ['bolas'], ['idle', 0.6], ['pisoteio'], ['idle', 0.6], ['investida']] },
      { nome: 'Fase 3', ataques: ['meteoros'], roteiro: [['idle', 0.6], ['meteoros'], ['idle', 0.4], ['investida'], ['idle', 0.4], ['bolas'], ['idle', 0.4], ['meteoros'], ['idle', 0.4], ['pisoteio']] }
    ]
  },
  {
    id: 'cuca', nome: 'Cuca', estados: CUCA_ESTADOS, sombra: '#1E2A16',
    desenhar(cam, e, s, t, sombra) {
      const q = this.estados[e].quadro(s, t);
      const info = cucaPx(cam, q.R, t, sombra);
      if (q.depois) q.depois(cam, info);
      return { treme: q.treme ?? q.R.treme ?? 0 };
    },
    fases: [
      { nome: 'Fase 1', ataques: ['leque', 'pocao'], roteiro: [['idle', 1.2], ['leque'], ['idle', 0.9], ['pocao'], ['idle', 0.9], ['leque'], ['idle', 0.8], ['pocao']] },
      { nome: 'Fase 2', ataques: ['bote'], roteiro: [['idle', 0.8], ['bote'], ['idle', 0.6], ['leque'], ['idle', 0.6], ['pocao'], ['idle', 0.6], ['bote']] },
      { nome: 'Fase 3', ataques: ['ninar'], roteiro: [['idle', 0.6], ['ninar'], ['idle', 0.4], ['bote'], ['idle', 0.4], ['leque'], ['idle', 0.4], ['ninar'], ['idle', 0.4], ['pocao']] }
    ]
  },
  {
    id: 'boto', nome: 'Boto cor-de-rosa', estados: BOTO_ESTADOS, sombra: null,
    desenhar(cam, e, s, t) {
      const q = this.estados[e].quadro(s, t);
      const info = botoPx(cam, q.R, t);
      if (q.depois) q.depois(cam, info);
      return { treme: q.treme ?? q.R.treme ?? 0 };
    },
    fases: [
      { nome: 'Fase 1', ataques: ['jato', 'beijos'], roteiro: [['idle', 1.2], ['jato'], ['idle', 0.9], ['beijos'], ['idle', 0.9], ['jato'], ['idle', 0.8], ['beijos']] },
      { nome: 'Fase 2', ataques: ['chapeu'], roteiro: [['idle', 0.8], ['chapeu'], ['idle', 0.6], ['jato'], ['idle', 0.6], ['beijos'], ['idle', 0.6], ['chapeu']] },
      { nome: 'Fase 3', ataques: ['salto'], roteiro: [['idle', 0.6], ['salto'], ['idle', 0.4], ['chapeu'], ['idle', 0.4], ['jato'], ['idle', 0.4], ['salto'], ['idle', 0.4], ['beijos']] }
    ]
  },
  {
    id: 'maquina', nome: 'Máquina de IA', estados: MAQ_ESTADOS, sombra: null,
    desenhar(cam, e, s, t) {
      const q = this.estados[e].quadro(s, t);
      const info = maquinaPx(cam, q.R, t);
      if (q.depois) q.depois(cam, info);
      return { treme: q.treme ?? q.R.treme ?? 0 };
    },
    fases: [
      { nome: 'Fase 1', ataques: ['laser', 'bombas'], roteiro: [['idle', 1.2], ['laser'], ['idle', 0.9], ['bombas'], ['idle', 0.9], ['laser'], ['idle', 0.8], ['bombas']] },
      { nome: 'Fase 2', ataques: ['pistoes'], roteiro: [['idle', 0.8], ['pistoes'], ['idle', 0.6], ['laser'], ['idle', 0.6], ['bombas'], ['idle', 0.6], ['pistoes']] },
      { nome: 'Fase 3', ataques: ['varredura'], roteiro: [['idle', 0.6], ['varredura'], ['idle', 0.4], ['pistoes'], ['idle', 0.4], ['laser'], ['idle', 0.4], ['varredura'], ['idle', 0.4], ['bombas']] }
    ]
  }
];
