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
// brilho no céu em cima de onde o meteoro vai cair; n 0..1 = força (cresce até a queda).
// variante 0 = raios em ×, 1 = em +: alternando, o brilho pisca.
function brilhoMeteoroPx(cam, cx, cy, n, variante) {
  cx = Math.round(cx); cy = Math.round(cy);
  const r = 0.9 + 2.1 * n, L = Math.round(2 + 8 * n) * (variante ? 1 : 0.6);
  const dirs = variante ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  const fim = Math.ceil(r) + Math.round(L);
  for (const [dx, dy] of dirs) for (let i = 1; i <= fim; i++) cam.set(cx + dx * i, cy + dy * i, i <= fim * 0.6 ? (n > 0.6 ? PM.fogo5 : PM.fogo4) : PM.fogo3);
  if (n > 0.3) elipse(cam, cx + 0.5, cy + 0.5, r + 1, r + 1, PM.fogo2);
  elipse(cam, cx + 0.5, cy + 0.5, r + 0.4, r + 0.4, PM.fogo4);
  elipse(cam, cx + 0.5, cy + 0.5, r * 0.6, r * 0.6, n > 0.5 ? PM.fogo6 : PM.fogo5);
  if (n > 0.7) cam.set(cx, cy, PM.branco);
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
// raio elétrico: linha quebrada saindo de um ponto, com a base mais clara (ang em radianos)
function raioPx(cam, x0, y0, ang, comp, semente, cor = '#FF3A2A', luz = '#FFE0D4') {
  let p = pt(x0, y0);
  for (let i = 1; i <= 4; i++) {
    const a = ang + (hash(semente * 7 + i * 13) - 0.5) * 1.8;
    const q = pt(p.x + Math.cos(a) * comp / 4, p.y + Math.sin(a) * comp / 4);
    for (let u = 0; u <= 1; u += 0.25) { const r = lerp(p, q, u); cam.set(r.x, r.y, i === 1 ? luz : cor); }
    p = q;
  }
}
// chip em sobrecarga (troca de fase): o LED estoura de luz a cada dois quadros (12 fps),
// com anel vermelho, raios e faíscas. k = intensidade 0..1
function chipSobrecargaPx(cam, cx, cy, s, k, semente = 0) {
  if (k < 0.05) return;
  const x = Math.round(cx), y = Math.round(cy), q = Math.round(s * 12), forte = q % 2 === 0;
  if (forte) cam.disco(x + 0.5, y + 0.5, 2.4 + k * 0.6, '#FF6A4A');
  cam.disco(x + 0.5, y + 0.5, forte ? 1.6 : 1.1, forte ? '#FFE0D4' : '#FF3A2A');
  if (forte) { const r = 4.5 + 3 * k; for (let i = 1; i < 24; i += 2) { const a = i / 24 * TAU; cam.set(x + 0.5 + Math.cos(a) * r, y + 0.5 + Math.sin(a) * r, '#FF3A2A'); } }
  const nr = Math.round(1 + 3 * k);
  for (let i = 0; i < nr; i++) raioPx(cam, x + 0.5, y + 0.5, hash(q * 5 + i + semente) * TAU, 7 + 9 * k * hash(q * 3 + i + semente), q * 11 + i + semente);
  faiscasPx(cam, x, y, (s * 3) % 1, Math.round(2 + 5 * k), Math.floor(s * 3) + semente);
}
// estalo do chip quando o chefe leva um golpe (u = 0..1 da animação de dano)
function chipEstaloPx(cam, cx, cy, u, semente = 0) {
  const x = Math.round(cx), y = Math.round(cy);
  if (u < 0.3) {
    cam.disco(x + 0.5, y + 0.5, 1.6, '#FFE0D4');
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, 3], [3, -3], [-3, 3]]) cam.set(x + dx, y + dy, '#FF3A2A');
  }
  faiscasPx(cam, x, y, Math.min(0.95, 0.08 + u * 0.9), 5, 9 + semente);
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

// aviso da investida (s): agacha, raspa a pata da frente duas vezes e fica pronta (= aviso_investida)
const INVESTIDA_AVISO = 1.1, INVESTIDA_RASPADAS = [0.22, 0.58], INVESTIDA_RASPADA = 0.34;
// pata da frente (fn) numa raspada, u 0..1: sobe e vai à frente (e segura um instante lá no alto,
// para aparecer num quadro inteiro), finca, arrasta para trás, volta
function pataRaspando(u) {
  if (u < 0.32) { const a = suave(u / 0.14); return pt(mix(-15, -27, a), -11 * a); }
  if (u < 0.42) { const a = entra((u - 0.32) / 0.1); return pt(-27 + 2 * a, mix(-11, 0, a)); }
  if (u < 0.8) return pt(mix(-25, -6, suave((u - 0.42) / 0.38)), 0);
  const a = suave((u - 0.8) / 0.2); return pt(mix(-6, -15, a), -3 * Math.sin(a * Math.PI));
}
// terra que a pata joga para trás ao arrastar, e um pouco de poeira; d = tempo desde o início da
// raspada. Fica entre as patas, embaixo da barriga (não aumenta a caixa do desenho).
const CORES_TERRA = { torrao: '#7A5238', torraoO: '#24100E', poeira: '#8A6A50', poeiraL: '#A88868' };
function terraRaspadaPx(cam, R, d, semente) {
  const X = R.X + R.x, sx = R.sx, finca = INVESTIDA_RASPADA * 0.42, arrasto = INVESTIDA_RASPADA * 0.38;
  const dp = d - finca;
  if (dp > 0 && dp < 0.45) poeiraPx(cam, X + sx * (-22 + 10 * suave(dp / arrasto)), CHAO_PX - 1, dp / 0.45, CORES_TERRA.poeira, CORES_TERRA.poeiraL);
  for (let i = 0; i < 5; i++) {
    const te = finca + arrasto * (0.1 + 0.8 * i / 4), a = d - te;
    if (a <= 0) continue;
    const vx = 30 + 30 * hash(i * 7 + semente * 13), vy = 50 + 30 * hash(i * 3 + semente * 29);
    const x = mix(-24, -8, i / 4) + vx * a, y = -vy * a + 200 * a * a;
    if (y > -2) continue;  // caiu no chão
    const b = nova();
    b.disco(X + sx * x, CHAO_PX + y, 0.9 + (i % 2) * 0.6, CORES_TERRA.torrao);
    cam.colar(b.contornar(CORES_TERRA.torraoO));
  }
}

// pose da rajada de bolas: k = quanto já abaixou (0 = parada, 1 = na pose); a = altura do tiro
// (0 = baixa, peito no chão, bolas rente ao chão; 1 = alta, pescoço esticado para a frente, bolas
// na altura do peito do Curupira). Com a = 0 é a pose de sempre.
const BOLA_ALTA = { y: 6, inc: -10, pesc: -42, fn: 7, fl: 6 };
function poseBolasMula(R, k, a) {
  R.y += mix(9, BOLA_ALTA.y, a) * k; R.inc = mix(-13, BOLA_ALTA.inc, a) * k; R.pesc = mix(-52, BOLA_ALTA.pesc, a) * k;
  R.pes.fn = pt(-15 - mix(13, BOLA_ALTA.fn, a) * k, 0); R.pes.fl = pt(-24 - mix(11, BOLA_ALTA.fl, a) * k, 0); R.pes.bn = pt(27 + 3 * k, 0);
  R.fogo.sobe = 0.55 * (1 - k);
}
function bolasMula(s, t, a) {
  const R = mulaBase(t);
  const k = suave(trecho(s, 0, 0.45)) * (1 - suave(trecho(s, 2.0, 2.5)));
  poseBolasMula(R, k, a);
  R.fogo.alt = 1 + 0.25 * k + (s < 0.5 ? 0.15 * Math.sin(t * 40) * k : 0);
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
      // a baixa rola rente ao chão; a alta voa reta na altura do peito do Curupira (35 px)
      const yAlvo = a > 0.5 ? CHAO_PX - 35 : CHAO_PX - 6;
      for (const d of tiros) {
        const x = info.boca.x - 8 - 250 * d, y = mix(info.boca.y, yAlvo, Math.min(1, d / 0.1)) - (a > 0.5 ? 0 : Math.abs(Math.sin(d * 16)) * 1.5);
        if (x > -12) bolaFogoPx(cam, x, y, 4.5, t + d);
        if (d < 0.12) explosaoPx(cam, info.boca.x - 3, info.boca.y, d / 0.12, 7);
      }
    }
  };
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
    quadro: (s, t) => bolasMula(s, t, 0)
  },
  bolas_alto: {
    dur: 2.6, nome: 'Rajada alta (Expert)', fase: 1, dica: 'abaixar',
    desc: 'Abaixa só um pouco, com o pescoço esticado para a frente, e cospe as bolas retas na altura do peito do Curupira. No Expert ela mistura bolas altas e baixas na mesma rajada.',
    quadro: (s, t) => bolasMula(s, t, 1)
  },
  bolas_troca: {
    dur: 0.5, nome: 'Troca de altura (Expert)', fase: 1,
    desc: 'No meio da rajada, passa da pose baixa para a alta (até 0,25 s) e da alta para a baixa (depois), avisando a altura da próxima bola.',
    quadro(s, t) {
      const R = mulaBase(t);
      poseBolasMula(R, 1, s < 0.25 ? suave(s / 0.25) : 1 - suave((s - 0.25) / 0.25));
      return { R };
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
    dur: 4.1, nome: 'Investida', fase: 2, dica: 'dash',
    desc: 'Agacha e raspa a pata da frente na terra duas vezes, como cavalo antes de correr, abaixa o fogo como chifre e atravessa a arena até bater na parede. Fica tonta: é a hora de bater nela.',
    quadro(s, t) {
      const R = mulaBase(t);
      const W = -(R.X - 58);
      let poeiras = [], tonta = 0, raspadas = [];
      if (s < INVESTIDA_AVISO) {
        // agacha: o peito desce, o fogo aponta para a frente e as patas de trás firmam abertas
        const k = suave(trecho(s, 0, 0.22)), pronto = suave(trecho(s, 0.92, 1.05));
        R.y += 5 * k + 2 * pronto; R.inc = -6 * k - 2 * pronto; R.pesc = -32 * k - 6 * pronto;
        R.pes.bl = pt(19 + 3 * k, 0); R.pes.bn = pt(27 + 5 * k, 0); R.pes.fl = pt(-24 - 2 * k, 0);
        R.rabo += 4 * Math.sin(t * 9) * k;
        R.fogo.sobe = 0.55 * (1 - k); R.fogo.alt = 1 + 0.1 * k + 0.25 * pronto;
        R.fogo.vel = 9 + 4 * k + 6 * pronto; R.fogo.tom = pronto > 0.4 ? 1 : 0;
        // duas raspadas da pata da frente: ergue e leva à frente, finca e arrasta para trás
        for (const t0 of INVESTIDA_RASPADAS) {
          const u = trecho(s, t0, t0 + INVESTIDA_RASPADA);
          if (u > 0.42) raspadas.push(t0);
          if (u <= 0 || u >= 1) continue;
          R.pes.fn = pataRaspando(u);
          if (u > 0.42 && u < 0.8) R.inc -= 1.5 * Math.sin((u - 0.42) / 0.38 * Math.PI);
        }
      } else if ((s = +(s - INVESTIDA_AVISO + 0.9).toFixed(6)) < 1.5) {  // daqui em diante, os tempos de antes do aviso novo
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
          for (const t0 of raspadas) terraRaspadaPx(cam, R, s - t0, t0);
          for (const [x, u] of poeiras) if (u < 1) poeiraPx(cam, x, CHAO_PX, u);
          if (s > 1.5 && s < 1.8) { faiscasPx(cam, info.frente.x - 8, info.frente.y, (s - 1.5) / 0.3, 9, 2); explosaoPx(cam, info.frente.x - 10, info.frente.y, (s - 1.5) / 0.18, 9, [PM.fogo6, PM.fogo5, PM.branco]); }
          if (tonta) estrelasTontas(cam, info.topo.x, info.topo.y - 14, t, 11);
        }
      };
    }
  },
  meteoros: {
    dur: 3.2, nome: 'Chuva de meteoros', fase: 3, dica: 'andar para fora das sombras',
    desc: 'Empina, o fogo vira uma coluna e lança três pedras em brasa para o alto. Um brilho no alto, em cima de onde cada uma vai cair, fica mais forte até ela descer.',
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
            if (s > ts + 0.25 && s < tq - 0.32) {
              const u = trecho(s, ts + 0.25, tq - 0.32);
              brilhoMeteoroPx(cam, x, 10, Math.ceil(u * 6) / 6, Math.floor(t * mix(8, 16, u)) % 2);
            }
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
  transicao: {
    dur: 2.0, nome: 'Troca de fase',
    desc: 'O chip sobrecarrega piscando em vermelho e soltando faíscas. Ela empina bem alto, o fogo cresce e esquenta, e desce com tudo levantando poeira.',
    quadro(s, t) {
      const R = mulaBase(t);
      // tranco do choque antes de empinar
      const choque = s < 0.3 ? Math.sin(s * 90) * 1.5 * (1 - s / 0.3) : 0;
      const inc = kf(s, [[0, 0], [0.3, -3], [0.75, 36, sai], [1.2, 38], [1.38, -6, entra], [1.6, 2], [2.0, 0]]);
      R.inc = inc + (s > 0.75 && s < 1.2 ? Math.sin(t * 50) * 1.5 : 0) + choque;
      R.x = Math.round(choque);
      R.y += s > 1.36 && s < 1.55 ? 2 : 0;
      R.pesc = kf(s, [[0, 0], [0.3, -8], [0.75, 20], [1.2, 20], [1.4, -14], [2.0, 0]]);
      const ar = clamp(inc / 36, 0, 1);
      // patas da frente pedalando no ar, como no pisoteio
      for (const q of ['fn', 'fl']) {
        const quad = mulaCorpo(MULA.quadris[q], R.inc);
        const noAr = pt(quad.x - 8 + Math.sin(t * 16 + (q === 'fn' ? 0 : 2)) * 4, quad.y + 30 - R.y);
        R.pes[q] = lerp(pt(MULA.pes[q].x - (s > 1.35 && s < 1.8 ? 4 : 0) - R.x, 0), noAr, ar);
      }
      R.pes.bn = pt(27 + 4 * ar - R.x, 0); R.pes.bl = pt(19 + 4 * ar - R.x, 0);
      // o fogo cresce e esquenta (mais claro), estoura na pancada e volta ao normal
      const quente = kf(s, [[0, 0], [0.3, 0.3], [0.75, 1], [1.4, 1], [2.0, 0]]);
      R.fogo.sobe = 0.55 + 0.45 * Math.max(ar, quente * 0.6);
      R.fogo.alt = 1 + 0.72 * quente + (s > 1.38 && s < 1.6 ? 0.3 : 0) + (s < 0.3 && Math.round(s * 12) % 2 ? -0.3 : 0);
      R.fogo.tom = quente > 0.5 ? 1 : 0; R.fogo.vel = 9 + 7 * quente;
      R.rabo = s > 0.3 && s < 1.4 ? Math.sin(t * 18) * 6 : R.rabo;
      R.treme = s > 1.38 && s < 1.65 ? 2 : s > 0.75 && s < 1.2 ? 1 : 0;
      const k = kf(s, [[0, 0.6], [0.15, 1], [1.5, 1], [2.0, 0]]);
      return {
        R, depois(cam, info) {
          chipSobrecargaPx(cam, info.corpo.x, info.corpo.y, s, k, 1);
          const d = s - 1.38;
          if (d >= 0 && d < 0.5) for (const dx of [-8, 3, 14]) poeiraPx(cam, info.frente.x + dx, CHAO_PX, d / 0.5);
        }
      };
    }
  },
  dano: {
    dur: 0.33, nome: 'Levando golpe',
    desc: 'Encolhe para trás com o golpe: o pescoço joga para trás, o fogo baixa um instante e o chip dá um estalo.',
    quadro(s, t) {
      const R = mulaBase(t);
      const d = kf(s, [[0, 4], [0.1, 6, sai], [0.33, 0]]), k = kf(s, [[0, 0.8], [0.1, 1], [0.33, 0]]);
      R.x = Math.round(d); R.inc = mix(R.inc, 5, k); R.y += 2 * k; R.pesc = mix(R.pesc, 16, k);
      for (const q in R.pes) R.pes[q] = pt(MULA.pes[q].x - R.x * (q[0] === 'f' ? 0.4 : 1), 0);
      R.fogo.alt = mix(1, 0.6, k); R.fogo.tom = k > 0.6 ? -1 : 0; R.fogo.sobe = mix(0.55, 0.9, k); R.rabo = mix(R.rabo, 7, k);
      return { R, depois(cam, info) { chipEstaloPx(cam, info.corpo.x, info.corpo.y, s / 0.33, 2); } };
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
   Jacaré de pé, esguia, juba loira em cachos e chapéu de bruxa. O chip tomou conta: está cravado na gola
   do sobretudo, com veias de circuito, uma luz vermelha na faixa de metal do chapéu e o olho vermelho.
   ===================================================================== */
const PCU = {
  verdeO: '#122818', verdeD: '#24502C', verdeS: '#3A7838', verde: '#58A042', verdeL: '#9ACC5A', barriga: '#EEDCA0', barrigaS: '#C8AC6C',
  cab: '#F6C434', cabS: '#D08A1C', cabL: '#FFEA8E', cabO: '#5A320A', dente: '#FFF8EC', boca: '#4A0E1E', lingua: '#E0575A',
  olho: '#FFF8EC', iris: '#E0241B', irisCalma: '#E8A010', cinto: '#1A0C1E', cintoL: '#E0B040', garra: '#F2E8D0', rubor: '#D9786A',
  // vestido e sobretudo cor de ameixa, forro vermelho
  vestO: '#140818', vestD: '#2A1230', vestS: '#3E1A46', vest: '#54265E', vestL: '#764282', forro: '#A81A28', forroS: '#6A0E1A', botao: '#C8B060',
  chapeu: '#3A2250', chapeuS: '#24143A', chapeuL: '#5A3A78', chapeuO: '#1C0C26',
  metal: '#8A949A', metalS: '#545E66', metalL: '#C8D2D8', metalO: '#141A20',
  veia: '#FF3A2A', veiaD: '#9A1A14', brilho: '#FF8A6A', chipK: '#1A2420', chipk: '#2E3A36', pino: '#8A9490',
  magia: '#5BD94A', magiaL: '#C8FF9A', magiaD: '#1F7A2A', magiaO: '#0E3A14', roxo: '#8E44AD', roxoL: '#C07BDB', roxoD: '#4E1E66',
  vidro: '#D8EEF2', vidroO: '#2A3A44', rolha: '#8A5A2E', nota: '#2A1E3A', notaL: '#B48CFF', azul: '#3B82C4'
};
const CUCA = { quadril: pt(0, -24), ombroP: pt(-5, -59), ombroL: pt(5, -60), pes: [pt(-6, 0), pt(3, 0)] };
function cucaBase(t) {
  const r = Math.sin(t * 2.2);
  // garra da frente erguida, dedos mexendo; a outra na cintura
  const g = Math.sin(t * 3);
  return {
    X: 372, x: 0, y: 0, inc: 3 + r, cab: r * 1.5, mand: 0, sx: 1, olho: 'normal', iris: PCU.iris,
    pes: CUCA.pes.map(p => ({ ...p })), maos: [pt(-18 + g, -57 + Math.cos(t * 3) * 1.2), pt(8, -43)], rabo: Math.sin(t * 2) * 3,
    chip: true, lingua: false, sorriso: false, deitada: 0, treme: 0, corpoY: r * 0.6, cabelo: Math.sin(t * 2.2 - 0.8)
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
// carimbo que vira junto quando a Cuca olha para o outro lado (cx = coluna do eixo)
function carimboSx(cam, linhas, ox, oy, mapa, sx, cx) {
  const w = Math.max(...linhas.map(l => l.length));
  cam.carimbo(linhas, sx > 0 ? ox : 2 * cx - ox - w + 1, oy, mapa, sx < 0);
}
function cucaPx(cam, R, t, sombraCor) {
  const sx = R.sx, X = R.X + R.x, Y = CHAO_PX + R.y;
  const L = p => pt(X + sx * p.x, Y + p.y);
  const Lc = p => pt(X + sx * p.x, CHAO_PX + p.y);
  const giro = -R.inc - 80 * R.deitada;
  // tronco inclina a partir do quadril; deitada = de barriga no chão (bote)
  const T = p => { const q = soma(CUCA.quadril, rot(sub(p, CUCA.quadril), giro)); return pt(q.x, q.y + R.corpoY + 15 * R.deitada); };
  const LT = p => L(T(p)), LTs = ps => ps.map(([x, y]) => LT(pt(x, y)));
  // saia e sobretudo: quando a Cuca afunda (derrota), a barra amontoa no chão em vez de passar dele
  const LTc = ps => ps.map(([x, y]) => { const q = LT(pt(x, y)); return pt(q.x, Math.min(q.y, CHAO_PX)); });
  const piv = pt(-1, -66), Hc = T(piv);
  const H = p => soma(Hc, rot(sub(p, piv), -R.inc * 0.4 - R.cab + 6 * R.deitada));
  const LH = p => L(H(p)), LHs = ps => ps.map(([x, y]) => LH(pt(x, y)));
  const bal = R.cabelo || 0;
  if (sombraCor) aviso(() => elipse(cam, X + sx * 4, CHAO_PX + 1, 24 + 16 * R.deitada, 2.2, sombraCor));
  // pinta um pixel de um ponto do tronco (para listras e pregas que acompanham a inclinação)
  const marca = (c, x, y, cor, so) => { const p = LT(pt(x, y)); if (p.y > CHAO_PX) return; const g = c.get(Math.floor(p.x), Math.floor(p.y)); if (!so || (so === true ? g : g === so)) c.set(p.x, p.y, cor); };
  let c;
  // rabo fino com crista, saindo de trás da saia
  c = nova();
  const ptsR = curvaQ(LT(pt(6, -16)), L(pt(24, -12 + R.rabo * 0.5)), Lc(pt(31 + R.rabo, -2 + Math.abs(R.rabo) * 0.3)), 14);
  ptsR.forEach((p, i) => c.disco(p.x, p.y, 3.4 * (1 - i / 15) + 0.6, PCU.verde));
  sombraB(c, PCU.verde, PCU.verdeS, PCU.verdeL, 1);
  c.contornar(PCU.verdeO);
  ptsR.forEach((p, i) => { if (i % 2 && i > 1 && i < 11) c.set(p.x, p.y - 3.4 * (1 - i / 15) - 1.2, PCU.verdeO); });
  cam.colar(c);
  // cachos de trás
  c = nova();
  [[9, -64, 4.2], [11, -57, 3.8], [8, -52, 3.4], [13, -50, 3]].forEach(([x, y, r], k) => { const p = LT(pt(x + bal * (0.4 + k * 0.3), y + Math.abs(bal) * 0.3)); cachoPx(c, p.x, p.y, r); });
  cam.colar(c.contornar(PCU.cabO));
  // braço: manga justa de ameixa, antebraço verde e três garras
  const braco = (o, m, la) => {
    const a = LT(o), b = L(m), pts = curvaMembro(a, b, 20, la ? sx : -sx, 0.9);
    const n = pts.length, k = Math.round(n * 0.72), pele = la ? PCU.verdeS : PCU.verde;
    const mp = nova(), dir = unit(sub(b, pts[n - 3]));
    mp.traco(pts.slice(k - 2), 2.6, pele);
    mp.disco(b.x, b.y, 2.1, pele);
    for (const da of [-45, 0, 45]) { const v = rot(dir, da); for (let j = 1; j <= 3; j++) mp.set(b.x + v.x * (1.5 + j), b.y + v.y * (1.5 + j), j < 3 ? pele : PCU.garra); }
    cam.colar(mp.contornar(PCU.verdeO));
    const cv = la ? [PCU.vestS, PCU.vestD, PCU.vest] : [PCU.vest, PCU.vestS, PCU.vestL];
    const mg = nova();
    mg.traco(pts.slice(0, k + 1), 3.4, cv[0]);
    mg.disco(a.x, a.y, 2.6, cv[0]);
    sombraB(mg, cv[0], cv[1], cv[2], 1);
    cam.colar(mg.contornar(PCU.vestO));
  };
  braco(CUCA.ombroL, R.maos[1], true);
  // pés descalços de jacaré, garras de fora
  c = nova();
  R.pes.forEach((pe, i) => {
    const b = Lc(pe), cor = i ? PCU.verdeS : PCU.verde;
    poli(c, [[4, -6], [4, -1], [-5, -1], [-5, -3], [-1, -6]].map(([x, y]) => pt(b.x + sx * x, b.y + y)), cor);
    sombraB(c, cor, i ? PCU.verdeD : PCU.verdeS, null, 1);
  });
  c.contornar(PCU.verdeO);
  R.pes.forEach(pe => { const b = Lc(pe); for (const dx of [-6, -4]) c.set(b.x + sx * dx, b.y - 1, PCU.garra); });
  cam.colar(c);
  // saia longa com a barra rasgada
  c = nova();
  const barra = [];
  for (let x = -20, k = 0; x <= 18; k++) {
    const w = 2 + Math.floor(hash(7 + k) * 3), fundo = hash(13 + k) < 0.3 ? 3 + Math.floor(hash(k + 1) * 3) : 1 + Math.floor(hash(k * 3 + 1) * 2);
    barra.push([x, -5], [x + w / 2, -5 + fundo], [x + w, -5]); x += w;
  }
  poli(c, LTc([[-7, -42], [-12, -26], ...barra, [13, -24], [8, -42]]), PCU.vest);
  sombraB(c, PCU.vest, PCU.vestS, PCU.vestL, 2);
  for (const [x0, k] of [[-8, -0.28], [-1, -0.05], [6, 0.18]]) for (let y = -34; y <= -6; y++) marca(c, x0 + (y + 34) * k, y, PCU.vestS, PCU.vest);
  cam.colar(c.contornar(PCU.vestO));
  // sobretudo aberto: painel de trás comprido e aba da frente, forro vermelho nas beiras
  c = nova();
  poli(c, LTc([[-4, -62], [8, -63], [11, -52], [15, -30], [19, -4], [6, -4], [3, -26], [1, -42]]), PCU.vestD);
  poli(c, LTc([[-8, -60], [-5, -62], [-4, -42], [-8, -26], [-14, -4], [-18, -4], [-13, -26], [-9, -42]]), PCU.vestD);
  sombraB(c, PCU.vestD, PCU.vestO, PCU.vestS, 1);
  for (let y = -40; y <= -6; y++) { marca(c, 3 + (y + 42) * 0.08, y, PCU.forro, true); marca(c, -9 - (y + 42) * 0.24, y, PCU.forro, true); }
  cam.colar(c.contornar(PCU.vestO));
  // corpete
  c = nova();
  poli(c, LTs([[-7, -42], [-7.5, -48], [-9.5, -53], [-9, -57], [-6, -61], [5, -62], [8, -58], [8, -50], [8, -42]]), PCU.vest);
  { const p = LT(pt(-6.5, -54)); c.disco(p.x, p.y, 3.4, PCU.vest); }
  sombraB(c, PCU.vest, PCU.vestS, PCU.vestL, 1);
  cam.colar(c.contornar(PCU.vestO));
  // lapela da frente com os botões
  c = nova();
  poli(c, LTs([[-9, -60], [-6, -62], [-5, -50], [-8, -43]]), PCU.vestD);
  sombraB(c, PCU.vestD, PCU.vestO, PCU.vestS, 1);
  cam.colar(c.contornar(PCU.vestO));
  for (const y of [-56, -50]) marca(cam, -7, y, PCU.botao);
  // cinto escuro e a poção pendurada
  c = nova();
  for (let x = -8; x <= 8; x++) { marca(c, x, -43, PCU.cinto); marca(c, x, -42, PCU.cinto); }
  cam.colar(c);
  if (!R.semPocao) frascoPx(cam, LT(pt(6, -39)), PCU.roxo, t);
  // gola alta e dura, atrás da cabeça
  c = nova();
  poli(c, LTs([[-6, -61], [-8, -67], [-4, -66], [2, -74], [6, -75], [12, -71], [10, -62]]), PCU.vestD);
  sombraB(c, PCU.vestD, PCU.vestO, PCU.vestS, 1);
  for (let k = 0; k < 6; k++) marca(c, 4 + k, -73 + k * 1.6, PCU.forro, PCU.vestD);
  cam.colar(c.contornar(PCU.vestO));
  // pescoço
  c = nova();
  c.traco([LT(pt(0, -60)), LH(pt(-1, -66))], 5.4, PCU.verde);
  sombraB(c, PCU.verde, PCU.verdeS, null, 1);
  cam.colar(c.contornar(PCU.verdeO));
  // cabeça: crânio redondo e focinho fino. Fechada, a boca é um traço; aberta, o focinho racha
  // e a mandíbula gira na dobra, sem peça separada (mesma cor, um contorno só)
  c = nova();
  const hc = LH(pt(2, -74));
  elipse(c, hc.x, hc.y, 8.5, 7.5, PCU.verde);
  const dobra = pt(-4, -68), aberta = R.mand > 3;
  const Mn = p => H(soma(dobra, rot(sub(p, dobra), -R.mand)));
  const linhaBoca = x => -69 + (x > -7 ? -(x + 7) * 0.6 : 0);
  poli(c, LHs([[-3, -80], [-9, -77], [-15, -74.5], [-19, -72.6], [-21.5, -70.8], [-21.5, -69], [-7, -69], [-2, -72], [4, -67]]), PCU.verde);
  if (aberta) {
    poli(c, [LH(pt(-21, -69)), LH(pt(-5, -69)), L(Mn(pt(-5, -69))), L(Mn(pt(-21, -69)))], PCU.boca);
    if (R.lingua || R.mand > 9) { const l0 = L(Mn(pt(-12, -68))); c.disco(l0.x, l0.y - 1, 2.2, PCU.lingua); }
  }
  poli(c, [[-21.5, -69], [-7, -69], [-3, -68.5], [-3, -66.2], [-11, -66.8], [-19, -67.6], [-21.5, -68.4]].map(([x, y]) => L(Mn(pt(x, y)))), PCU.verde);
  const ol = LH(pt(-4, -79));
  c.disco(ol.x, ol.y, 6, PCU.verde);
  sombraB(c, PCU.verde, PCU.verdeS, PCU.verdeL, 1);
  for (const [x, y] of [[-11, -74.5], [-15, -73], [-8, -72], [7, -77], [5, -72]]) { const p = LH(pt(x, y)); c.set(p.x, p.y, PCU.verdeS); }
  { const p = LH(pt(-20, -72)); c.set(p.x, p.y, PCU.verdeD); }
  if (aberta) {
    // dentes nas duas beiradas
    for (let x = -19; x <= -7; x += 3) { const p = LH(pt(x, -69)); c.set(p.x, p.y, PCU.dente); const q = L(Mn(pt(x + 1, -69))); c.set(q.x, q.y - 1, PCU.dente); }
    for (let x = -6; x <= -2; x++) { const p = LH(pt(x, linhaBoca(x))); c.set(p.x, p.y, PCU.verdeO); }
  } else {
    for (let x = -21; x <= -2; x++) { const p = LH(pt(x, linhaBoca(x))); c.set(p.x, p.y, x > -7 ? PCU.verdeO : PCU.verdeD); }
    const p = LH(pt(-9, -68)); c.set(p.x, p.y, PCU.dente);
  }
  { const p = LH(pt(-3, -71)); c.set(p.x, p.y, PCU.rubor); c.set(p.x + sx, p.y, PCU.rubor); }
  cam.colar(c.contornar(PCU.verdeO));
  // cachos da frente e o chapéu
  c = nova();
  [[9, -78, 5], [11, -71, 4.2], [4, -85, 3.4], [8, -86, 3.6], [13, -82, 3.8]].forEach(([x, y, r], k) => { const p = LH(pt(x + bal * (0.2 + 0.1 * k), y)); cachoPx(c, p.x, p.y, r); });
  cam.colar(c.contornar(PCU.cabO));
  const luz = chapeuCucaPx(cam, LH, sx, t, bal, R.chip);
  olhoCucaPx(cam, ol.x, ol.y + 0.5, R.olho, R.iris, t, sx);
  braco(CUCA.ombroP, R.maos[0], false);
  // chip cravado na gola, com as veias de circuito correndo pela roupa
  const chip = LT(pt(-2, -57));
  if (R.chip) {
    for (const passos of [[[0, 4], [-3, 0], [0, 3]], [[4, 0], [0, 6]], [[-3, 0], [0, -2]]]) {
      let q = pt(Math.round(chip.x), Math.round(chip.y));
      passos.forEach(([dx, dy], i) => { const n = Math.max(Math.abs(dx), Math.abs(dy)); for (let s = 1; s <= n; s++) cam.set(q.x + sx * Math.sign(dx) * s, q.y + Math.sign(dy) * s, (i + s) % 4 === 0 ? PCU.veia : PCU.veiaD); q = pt(q.x + sx * dx, q.y + dy); });
      cam.carimbo(['ee', 'ec'], q.x, q.y, { e: PCU.veiaD, c: PCU.veia });
    }
    chipCravadoPx(cam, chip.x, chip.y, t);
  }
  return { mao: R.maos.map(m => L(m)), boca: LH(pt(-22, -69)), cabeca: hc, corpo: chip, luz };
}
// chip escuro com a luz vermelha piscando e um brilho em volta
function chipCravadoPx(cam, cx, cy, t, ligado = true) {
  const x = Math.round(cx), y = Math.round(cy), b = nova(), luz = ligado && Math.floor(t * 4) % 2 ? PCU.veia : PCU.veiaD;
  b.carimbo(['.y.y.y.', 'yKKKKKy', '.KkkkK.', 'yKkRRKy', '.KkRRK.', 'yKKKKKy', '.y.y.y.'], x - 3, y - 3, { y: PCU.pino, K: PCU.chipK, k: PCU.chipk, R: luz });
  cam.colar(b.contornar('#0A0E0C'));
  if (ligado) for (const [dx, dy] of [[-4, 1], [4, -1], [1, -4], [-1, 4]]) cam.set(x + dx, y + dy, PCU.brilho);
}
// chapéu de bruxa com a ponta caindo para trás e a faixa de metal com a luz do chip
function chapeuCucaPx(cam, LH, sx, t, bal, ligado = true) {
  const base = pt(7, -88), inc = -14 - bal * 2, r = rad(inc);
  const Q = (x, y) => LH(pt(base.x + x * Math.cos(r) - y * Math.sin(r), base.y + x * Math.sin(r) + y * Math.cos(r)));
  const c = nova();
  poli(c, [Q(-8, 0), Q(-5, -8), Q(-1, -15), Q(5, -20), Q(11, -19), Q(7, -16), Q(5, -12), Q(7, 0)], PCU.chapeu);
  sombraB(c, PCU.chapeu, PCU.chapeuS, PCU.chapeuL, 1);
  for (let x = -7; x <= 7; x += 0.5) for (const y of [-2, -3, -4]) { const p = Q(x, y); if (c.get(Math.floor(p.x), Math.floor(p.y))) c.set(p.x, p.y, y === -4 ? PCU.metalL : y === -2 ? PCU.metalS : PCU.metal); }
  for (const x of [-5, 5]) { const p = Q(x, -3); c.set(p.x, p.y, PCU.metalO); }
  cam.colar(c.contornar(PCU.chapeuO));
  const a = nova(), aba = [];
  for (let k = 0; k < 28; k++) { const u = k / 28 * TAU; aba.push(Q(Math.cos(u) * 15, 0.5 + Math.sin(u) * 2.4)); }
  poli(a, aba, PCU.chapeu);
  sombraB(a, PCU.chapeu, PCU.chapeuS, PCU.chapeuL, 1);
  cam.colar(a.contornar(PCU.chapeuO));
  const p = Q(-1, -3);
  cam.carimbo(['oRo', 'RLR', 'oRo'], Math.round(p.x) - 1, Math.round(p.y) - 1, { o: PCU.metalO, R: ligado && Math.floor(t * 4) % 2 ? PCU.veia : PCU.veiaD, L: ligado ? PCU.brilho : PCU.veiaD });
  return p;
}
// olhão amendoado com cílios para trás; a pálpebra é da cor da pele (sem maquiagem)
function olhoCucaPx(cam, cx, cy, tipo, iris, t, sx) {
  const X0 = Math.round(cx), x = X0 - 4, y = Math.round(cy) - 3;
  const b = nova(), M = { o: PCU.verdeO, W: PCU.olho, I: iris, P: PCU.verdeO, s: PCU.verdeS, B: PM.branco, g: PCU.verde };
  const S = (linhas, ox, oy) => carimboSx(b, linhas, ox, oy, M, sx, X0);
  if (tipo === 'feliz') S(['.........', '..ooooo..', '.o.....o.', 'o.......o'], x, y);
  else if (tipo === 'piscando') S(['.........', '.........', 'ooooooooo', '.o.o.o.o.'], x, y);
  // apertado de dor (levando golpe)
  else if (tipo === 'dor') S(['....ooooo', '.ooooo...', 'ooo......', '.ooooo...', '....ooooo'], x, y - 1);
  else {
    S(['..sssss..', '.ooooooo.', 'oIIIWWWWo', 'IIBPIWWWo', 'IIIPIWWWo', 'oIIIWWWWo', '.oWWWWWo.', '..ooooo..'], x, y - 2);
    if (tipo === 'bravo') S(['ooooo....', 'ggoo.....'], x, y - 1);
    if (tipo === 'cansado') S(['ooooooooo', 'ggggggggg'], x, y);
    if (tipo === 'tonto') { for (let i = 0; i < 4; i++) b.set(X0 - 2 + i, y + 1 + (i % 2), PCU.verdeO); b.set(X0, y + 3, PCU.verdeO); }
  }
  S(['......o.o', '.....o.o.', '....oo.o.', '.....o...'], x + 2, y - 5);
  cam.colar(b);
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
    dur: 2.4, nome: 'Garra erguida',
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
  transicao: {
    dur: 2.0, nome: 'Troca de fase',
    desc: 'O chip sobrecarrega e a luz do chapéu acende forte. Ela ergue as duas garras, gargalha tremendo e três bolas verdes giram em volta dela.',
    quadro(s, t) {
      const R = cucaBase(t);
      const sobe = suave(trecho(s, 0.2, 0.5)), desce = suave(trecho(s, 1.6, 1.95)), ri = sobe * (1 - desce);
      const choque = s < 0.25 ? Math.sin(s * 90) * (1 - s / 0.25) : 0, treme = Math.sin(t * 40) * ri;
      R.maos = [lerp(R.maos[0], pt(-30 + treme * 2, -100 + Math.sin(t * 30) * 2), ri), lerp(R.maos[1], pt(24 - treme * 2, -98 + Math.cos(t * 30) * 2), ri)];
      R.inc = 3 - 9 * ri + choque * 2; R.x = Math.round(treme + choque);
      R.pes = R.pes.map(p => pt(p.x - R.x, p.y));
      R.cab = -12 * ri + choque * 3;
      const gargalha = s > 0.45 && s < 1.7;
      R.mand = s < 0.2 ? 8 : gargalha ? 6 + Math.abs(Math.sin(t * 22)) * 10 : 4 + 6 * ri;
      if (gargalha) R.corpoY -= Math.abs(Math.sin(t * 22)) * 1.5;
      R.olho = gargalha && Math.floor(t * 6) % 3 ? 'feliz' : 'bravo';
      const k = kf(s, [[0, 0.6], [0.15, 1], [1.6, 1], [2.0, 0]]);
      return {
        R, depois(cam, info) {
          chipSobrecargaPx(cam, info.corpo.x, info.corpo.y, s, k, 3);
          // luz do chapéu acesa forte (sem piscar), com brilho em volta
          if (k > 0.3) {
            const x = Math.round(info.luz.x), y = Math.round(info.luz.y);
            cam.carimbo(['oRo', 'RLR', 'oRo'], x - 1, y - 1, { o: PCU.metalO, R: PCU.veia, L: '#FFE0D4' });
            const raios = Math.round(s * 12) % 2 ? [[-3, 0], [3, 0], [0, -3], [0, 3]] : [[-2, -2], [2, -2], [-2, 2], [2, 2]];
            for (const [dx, dy] of raios) { cam.set(x + dx, y + dy, PCU.veia); cam.set(x + dx * 1.4, y + dy * 1.4, PCU.brilho); }
          }
          // três bolas verdes girando em volta dela (as de trás menores)
          const g = suave(trecho(s, 0.35, 0.7)) * (1 - suave(trecho(s, 1.55, 1.9)));
          if (g > 0.05) for (let i = 0; i < 3; i++) {
            const a = s * 7 + i * TAU / 3, frente = Math.sin(a);
            orbePx(cam, info.corpo.x + Math.cos(a) * 30, info.corpo.y - 4 + frente * 9, g * (frente > 0 ? 3.6 : 2.4), t + i);
          }
        }
      };
    }
  },
  dano: {
    dur: 0.33, nome: 'Levando golpe',
    desc: 'Joga a cabeça e o tronco para trás com os olhos apertados, as garras abrem e o chip dá um estalo.',
    quadro(s, t) {
      const R = cucaBase(t);
      const d = kf(s, [[0, 3], [0.1, 5, sai], [0.33, 0]]), k = kf(s, [[0, 0.8], [0.1, 1], [0.33, 0]]);
      R.x = Math.round(d); R.pes = R.pes.map(p => pt(p.x - R.x, p.y));
      R.inc = mix(R.inc, -10, k); R.cab = mix(R.cab, -12, k); R.corpoY += 1.5 * k;
      R.maos = [lerp(R.maos[0], pt(-26, -80), k), lerp(R.maos[1], pt(14, -62), k)];
      R.mand = 4 + 8 * k; R.olho = k > 0.3 ? 'dor' : R.olho;
      return { R, depois(cam, info) { chipEstaloPx(cam, info.corpo.x, info.corpo.y, s / 0.33, 4); } };
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
    finP: pt(-16 + Math.sin(t * 4) * 2, -38 + Math.cos(t * 4) * 2), finL: pt(14, -40), chapeu: { dx: 0, dy: 0, ang: -8, solto: false, mao: false }, chip: true, giro: 0, treme: 0,
    cabeca: 0, cauda: 0
  };
}
function botoPx(cam, R, t) {
  const sx = R.sx, X = R.X + R.x, Y = AGUA_Y + R.y;
  const piv = pt(0, -34), pc = pt(-3, -62);
  const B = p => soma(piv, rot(sub(p, piv), -R.inc + R.giro));
  // cabeça: gira em volta do centro dela (R.cabeca). No rasante, com o corpo deitado, o bico
  // aponta para a frente e o alto da cabeça (com o chapéu) para cima.
  const H = p => B(soma(pc, rot(sub(p, pc), R.cabeca)));
  const L = p => pt(X + sx * p.x, Y + p.y);
  const inc = sx * (-R.inc + R.giro), incC = inc + sx * R.cabeca, cr = 1 + R.incha * 0.12;
  // nadadeira de lá e cauda (aparece quando ele sai da água)
  let parte = nova();
  mecha(parte, L(B(pt(8, -44))).x, L(B(pt(8, -44))).y, Math.atan2(L(B(R.finL)).y - L(B(pt(8, -44))).y, L(B(R.finL)).x - L(B(pt(8, -44))).x) * 180 / Math.PI, 11, 3.2, PBO.rosaS, 0);
  cam.colar(parte.contornar(PBO.rosaO));
  parte = nova();
  const cauda = L(B(pt(4, 14)));
  for (const lado of [-1, 1]) mecha(parte, cauda.x, cauda.y, 90 + inc + lado * 50 + sx * R.cauda, 10, 3.6, PBO.rosaS, 0);
  cam.colar(parte.contornar(PBO.rosaO));
  // corpo: torpedo em pé, cabeça (melão) e bico comprido
  parte = nova();
  const el = (c, rx, ry, cor) => { const p = L(B(c)); elipse(parte, p.x, p.y, rx * cr, ry, cor, inc); };
  el(pt(0, -26), 13, 34, PBO.rosa);
  { const p = L(B(pc)); elipse(parte, p.x, p.y, 12 * cr, 10, PBO.rosa, incC); }
  poli(parte, [pt(-11, -64), pt(-34 - R.bico, -59), pt(-35 - R.bico, -56), pt(-11, -55)].map(p => L(H(p))), PBO.rosa);
  sombraB(parte, PBO.rosa, PBO.rosaS, PBO.rosaL, 2);
  el(pt(-6, -26), 6, 26, PBO.barriga);
  // dorso e corcova
  const d = L(B(pt(12, -40)));
  parte.disco(d.x + sx, d.y, 3, PBO.rosaS);
  // boca: linha de sorriso no bico ou aberta no jato
  const b0 = L(H(pt(-12, -57))), b1 = L(H(pt(-33 - R.bico, -57)));
  if (R.boca > 0.3) { poli(parte, [b0, b1, L(H(pt(-30, -52))), L(H(pt(-13, -51)))], '#5A1020'); for (let u = 0.1; u < 0.9; u += 0.16) { const p = lerp(b0, b1, u); parte.set(p.x, p.y, PM.branco); } }
  else { for (let u = 0; u <= 1; u += 0.04) { const p = lerp(b0, b1, u); parte.set(p.x, p.y + (u < 0.15 ? -1 : 0), PBO.rosaD); } }
  cam.colar(parte.contornar(PBO.rosaO));
  // olho
  const oc = L(H(pt(-11, -65)));
  if (R.olho === 'feliz') { cam.set(oc.x - 1, oc.y, PBO.rosaO); cam.set(oc.x, oc.y - 1, PBO.rosaO); cam.set(oc.x + 1, oc.y, PBO.rosaO); }
  else if (R.olho === 'tonto') { cam.carimbo(['o.o', '.o.', 'o.o'], Math.round(oc.x) - 1, Math.round(oc.y) - 1, { o: PBO.rosaO }); }
  else if (R.olho === 'dor') { cam.carimbo(['..oo', 'oo..', '..oo'], Math.round(oc.x) - 2, Math.round(oc.y) - 1, { o: PBO.rosaO }); }
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
  const topo = L(H(pt(-2, -71)));
  if (!R.chapeu.solto && !R.chapeu.mao) chapeuPx(cam, topo.x + sx * R.chapeu.dx, topo.y + R.chapeu.dy, sx * R.chapeu.ang + incC, t);
  else {
    cam.set(topo.x, topo.y + 1, PBO.rosaO); cam.set(topo.x + 1, topo.y + 1, PBO.rosaO);
    for (let k = 0; k < 4; k++) { const u = (t * 3 + k / 4) % 1; cam.set(topo.x + Math.sin(k * 2) * 4 * u, topo.y - 2 - 10 * u + 12 * u * u, u < 0.5 ? PBO.aguaL : PBO.agua); }
  }
  // nadadeira de cá (o braço dele)
  parte = nova();
  const ob = L(B(pt(-6, -44))), fp = L(B(R.finP));
  // chapéu na mão: a aba fica na ponta da nadadeira (ponto "nadadeira"), atrás dela
  if (R.chapeu.mao) chapeuPx(cam, fp.x + sx * R.chapeu.dx, fp.y + R.chapeu.dy, sx * R.chapeu.ang, t);
  mecha(parte, ob.x, ob.y, Math.atan2(fp.y - ob.y, fp.x - ob.x) * 180 / Math.PI, Math.hypot(fp.x - ob.x, fp.y - ob.y), 3.6, PBO.rosa, 0);
  sombraB(parte, PBO.rosa, PBO.rosaS, PBO.rosaL, 1);
  cam.colar(parte.contornar(PBO.rosaO));
  return { bico: L(H(pt(-36 - R.bico, -57))), topo, fin: fp, corpo: L(B(pt(5, -32))), olho: oc };
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
// respingo grande (troca de fase do Boto): coroa d'água dos dois lados e gotas altas; g = tamanho
function respingoGrandePx(cam, x, y, u, g = 1) {
  const h = 15 * g * Math.sin(Math.PI * Math.min(1, u * 1.25));
  if (h > 1) for (const lado of [-1, 1]) {
    const b = nova();
    for (let i = 0; i < 3; i++) { const bx = x + lado * (9 + i * 5 + 5 * u), hh = h * (1 - i * 0.28); b.traco([pt(bx, y), pt(bx + lado * (2 + 3 * u), y - hh)], 3.2 - i * 0.7, PBO.agua); }
    sombraB(b, PBO.agua, PBO.aguaD, PBO.aguaL, 1);
    cam.colar(b.contornar(PBO.aguaO));
  }
  for (let i = 0; i < 10; i++) {
    const a = rad(236 + i * 7.6), v = (50 + hash(i + 3) * 35) * g, px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 60 * u * u;
    if (py < y + 1) gotaPx(cam, px, py);
  }
}
function respingoPx(cam, x, y, u) {
  for (let i = 0; i < 7; i++) { const a = rad(200 + i * 23), v = 22 + hash(i) * 10; const px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 40 * u * u; if (u < 0.9) gotaPx(cam, px, py); }
}
/* Água em volta do Boto: efeito à parte, que o código põe na linha d'água seguindo o Boto em x
   (ele afunda e sobe para o jato; a água fica). Duas camadas: a de trás (metade de lá dos anéis
   e as cristas atrás do corpo) e a da frente (metade de cá, espuma colada no corpo e gotinhas).
   Duas paletas, porque a água da esquerda é a do rio Negro (escura) e a da direita, a do
   Solimões (barrenta), iguais à arena. A chave "azul" ficou pelo nome dos arquivos que o jogo lê. */
const AGUA_BOTO_PALETAS = {
  azul: { espuma: '#E8E2D4', espumaS: '#B4B2AC', claro: '#7A8A9A', medio: '#3E4A58', escuro: '#101418' },
  barro: { espuma: '#F6EAD0', espumaS: '#E6D2A8', claro: '#C9A070', medio: '#A8784A', escuro: '#4E3018' }
};
const AGUA_BOTO_QUADROS = 12;  // laço de 1 s a 12 fps
// u = fase do laço (0..1); camada = 'atras' ou 'frente'; P = paleta
function aguaBotoPx(cam, cx, cy, u, P, camada) {
  const frente = camada === 'frente', k = Math.round(u * AGUA_BOTO_QUADROS);
  // anéis abrindo: elipses achatadas que crescem e se desfazem em pontinhos
  for (let i = 0; i < 2; i++) {
    const v = (u + i / 2) % 1, r = 11 + 25 * v, ry = 1.5 + 3 * v;
    const cor = v < 0.3 ? P.espumaS : v < 0.6 ? P.claro : P.medio;
    for (let a = 0; a < TAU; a += 0.5 / r) {
      const s = Math.sin(a), x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + s * ry);
      if ((s > 0) !== frente) continue;
      if (v > 0.6 && (x + y + i) % 2) continue;                     // no fim, pontilhado
      if (Math.floor((a * r) / 5 + i * 2) % 5 === 0) continue;       // falhas: parece onda, não fio
      cam.set(x, y, cor);
    }
  }
  if (!frente) {
    // cristas da água atrás do corpo, subindo e descendo
    for (const lado of [-1, 1]) for (let j = 0; j < 3; j++) {
      const x = cx + lado * (9 + j * 3), h = Math.round(Math.sin(u * TAU * 2 + j * 1.7 + lado) * 0.8 + 0.6);
      cam.set(x, cy - 1 - h, P.claro); cam.set(x + lado, cy - 1 - h, P.claro);
      if (h > 0) cam.set(x, cy - 1, P.medio);
    }
    return;
  }
  // espuma colada no corpo: faixa irregular de 1 a 2 px que borbulha
  for (let x = -14; x <= 14; x++) {
    const borda = Math.abs(x) > 10;
    const h = hash(x * 7 + k * 13) > (borda ? 0.75 : 0.45) ? 2 : 1;
    const ond = Math.round(Math.sin(x * 0.8 + u * TAU * 2) * 0.6);
    for (let d = 0; d < h; d++) cam.set(cx + x, cy + ond - d, d === 0 && hash(x + k * 5) > 0.3 ? P.espuma : P.espumaS);
    if (hash(x * 3 + k * 11) > 0.82) cam.set(cx + x, cy + ond + 1, P.claro);
  }
  // pedaços de espuma soltos, se afastando do corpo
  for (let j = 0; j < 4; j++) {
    const lado = j % 2 ? 1 : -1, v = (u + j / 4) % 1, x = Math.round(cx + lado * (15 + 12 * v)), y = cy + 1 + (j >> 1);
    if (v < 0.8) { cam.set(x, y, P.espumaS); if (v < 0.4) cam.set(x + lado, y, P.espuma); }
  }
  // gotinhas pulando da espuma, alternando os lados
  for (let j = 0; j < 4; j++) {
    const lado = j % 2 ? 1 : -1, p = ((u * 2 + j / 4) % 1) / 0.55;
    if (p >= 1) continue;
    const x = Math.round(cx + lado * (6 + j * 2 + 7 * p)), y = Math.round(cy - 2 - (7 + 4 * hash(j + 1)) * 4 * p * (1 - p));
    cam.set(x, y, P.espuma); cam.set(x, y + 1, P.claro);
  }
}
// respingo na linha d'água quando o Boto afunda, sobe ou salta: coroa dos dois lados e gotas
function aguaRespingoPx(cam, x, y, u, P) {
  const h = 13 * Math.sin(Math.PI * Math.min(1, u * 1.3));
  if (h > 1) for (const lado of [-1, 1]) {
    const b = nova();
    for (let i = 0; i < 3; i++) { const bx = x + lado * (8 + i * 4 + 5 * u), hh = h * (1 - i * 0.3); b.traco([pt(bx, y), pt(bx + lado * (1 + 3 * u), y - hh)], 2.6 - i * 0.6, P.claro); }
    sombraB(b, P.claro, P.medio, P.espuma, 1);
    cam.colar(b.contornar(P.escuro));
  }
  for (let i = 0; i < 9; i++) {
    const a = rad(232 + i * 9.5), v = 34 + hash(i + 7) * 22, px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 48 * u * u;
    if (py < y && u < 0.95) { cam.set(px, py, P.espuma); cam.set(px, py + 1, P.claro); }
  }
  // espuma abrindo na base
  const r = 8 + 14 * u;
  for (let a = 0; a < TAU; a += 0.6 / r) { const xx = Math.round(x + Math.cos(a) * r), yy = Math.round(y + Math.sin(a) * 1.6); if (u < 0.7 || (xx + yy) % 2) cam.set(xx, yy, u < 0.5 ? P.espuma : P.espumaS); }
}
// aviso do jato: a água começa a sair do bico, curta e fina, e vai engrossando e crescendo até
// virar o jato. n = 0..1 (quanto cresceu); o desenho aponta para a esquerda, como o Boto, com o
// centro no bico. variante = 0/1, para a ponta pulsar.
function jatoCrescendoPx(cam, x, y, n, variante) {
  const L = Math.round(9 + 25 * n), meia = n < 0.34 ? 0 : 1, gross = n >= 0.67 ? 1 : 0;
  const b = nova();
  for (let i = 0; i <= L; i++) {
    const xx = x - i;
    for (let d = -meia; d <= meia + gross; d++) b.set(xx, y + d, d > 0 && d === meia + gross ? PBO.aguaD : PBO.agua);
    if (meia > 0 && (i + variante * 3) % 6 < 2) b.set(xx, y - meia, PBO.aguaL);
  }
  // a ponta é uma gota maior que pulsa
  b.disco(x - L, y + gross * 0.5, 1.2 + meia * 0.8 + gross * 0.4 + variante * 0.6, PBO.agua);
  cam.colar(b.contornar(PBO.aguaO));
  // borrifos saindo da ponta
  for (let j = 0; j < 2 + meia; j++) {
    const p = (variante * 0.5 + j / (2 + meia)) % 1;
    cam.set(x - L - 2 - p * 5, y - 2 - p * 4 + p * p * 7 + j, j % 2 ? PBO.aguaL : PBO.agua);
  }
}
const JATO_CRESCENDO_NIVEIS = 8;
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
    dur: 2.9, nome: 'Chapéu bumerangue', fase: 2, dica: 'olhar a altura da nadadeira: baixa, pular; alta, abaixar',
    desc: 'Tira o chapéu da cabeça com a nadadeira, puxa o braço para trás e segura, na altura em que vai jogar. No jogo ele afunda ou sobe antes, para a nadadeira ficar na altura da ida. Arremessa: o chapéu vai reto até o outro lado e volta na outra altura, girando. Sem chapéu, o espiráculo espirra água.',
    quadro(s, t) {
      const R = botoBase(t), base = R.finP;
      // a mesma altura atrás (segurando) e na frente (soltando), já contando a inclinação do corpo
      const CAB = pt(-4, -72), ALTO = pt(-2, -80), TRAS = pt(15, -46), FRENTE = pt(-32, -50);
      if (s < 0.75) {
        // pega o chapéu na cabeça, tira (de galã, inclinando a aba) e puxa o braço para trás
        const pega = suave(trecho(s, 0, 0.2)), tira = suave(trecho(s, 0.2, 0.32)), arma = suave(trecho(s, 0.32, 0.55));
        R.finP = s < 0.2 ? lerp(base, CAB, pega) : s < 0.32 ? lerp(CAB, ALTO, tira) : lerp(ALTO, TRAS, arma);
        R.chapeu.mao = s >= 0.2;
        R.chapeu.ang = s < 0.32 ? -20 * tira : -20 * (1 - arma);
        R.inc = -8 * arma; R.olho = s < 0.32 ? 'galante' : 'bravo';
        if (s >= 0.55) { R.finP = soma(TRAS, pt(Math.round(Math.sin(t * 40)), 0)); R.chapeu.ang = 4 * Math.sin(t * 40); }   // segura, tremendo
      } else if (s <= 0.95) {
        // arremesso: o braço vem de trás para a frente na mesma altura; solta no último quadro
        const u = trecho(s, 0.75, 0.95);
        R.finP = lerp(TRAS, FRENTE, u); R.finP.y -= 4 * Math.sin(u * Math.PI);
        R.chapeu.mao = true; R.chapeu.ang = 0;
        R.inc = mix(-8, 10, u); R.olho = 'bravo';
      } else {
        const solta = suave(trecho(s, 0.95, 1.25));
        R.chapeu.solto = s < 2.58;
        R.finP = lerp(FRENTE, base, solta); R.inc = 10 * (1 - solta); R.olho = s < 2.5 ? 'bravo' : 'galante';
        if (s > 2.4) R.finP = lerp(R.finP, pt(-10, -74), suave(trecho(s, 2.4, 2.55)));
      }
      return {
        R, depois(cam, info) {
          const u = trecho(s, 0.95, 2.5);
          if (u > 0 && u < 1) {
            // ida reta na altura em que saiu da nadadeira, curva na parede e volta na outra altura
            const ida = u < 0.5, v = ida ? u / 0.5 : (u - 0.5) / 0.5;
            const x0 = R.X - 34, yIda = AGUA_Y - 44, yVolta = CHAO_PX - 10;
            const x = ida ? mix(x0, 30, sai(v)) : mix(30, info.topo.x, v * v);
            let y = ida ? yIda : mix(yIda, yVolta, sai(Math.min(1, v * 3)));
            if (!ida && v > 0.7) y = mix(yVolta, info.topo.y, (v - 0.7) / 0.3);
            chapeuPx(cam, x, y, t * 1400, t);
          }
        }
      };
    }
  },
  salto: {
    dur: 3.6, nome: 'Salto do boto', fase: 3, dica: 'correr para baixo dele e passar entre as bolhas',
    desc: 'Afunda reto, a água borbulha e ele salta num arco enorme por cima da areia, girando e soltando cinco bolhas que descem balançando, até a outra margem. Depois salta de volta.',
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
  rasante: {
    dur: 2.4, nome: 'Salto rasante', fase: 3, dica: 'abaixar (ou dash)',
    desc: 'Deita para a frente na água, de cara para a areia, e bate a cauda espirrando água para trás. Então sai num salto baixo e reto, deitado, na altura do peito do Curupira, até a outra margem. Sem bolhas.',
    quadro(s, t) {
      const R = botoBase(t);
      const X2 = 26 - R.X;
      if (s < 0.6) {
        // aviso: inclina para a frente e afunda um pouco; a cauda bate atrás
        const deita = suave(trecho(s, 0, 0.4));
        R.giro = -40 * deita; R.y += 14 * deita; R.cabeca = 30 * deita; R.olho = 'bravo';
        R.finP = lerp(R.finP, pt(-4, -22), deita); R.cauda = 30 * Math.sin(t * TAU * 3) * deita;
      } else if (s < 1.8) {
        // voando deitado, reto: o corpo ondula e a cauda bate (o caminho, no jogo, é do código)
        const u = trecho(s, 0.6, 1.8), a = 0.12;
        const sobe = Math.sin(Math.PI / 2 * clamp(u / a, 0, 1)) * Math.sin(Math.PI / 2 * clamp((1 - u) / a, 0, 1));
        R.x = mix(0, X2, u); R.y = 14 - (14 + 15) * sobe;
        R.giro = -90 * Math.min(1, sobe * 1.5) + 3 * Math.sin(t * TAU * 1.5); R.cabeca = 90 * Math.min(1, sobe * 1.5);
        R.olho = 'bravo'; R.finP = pt(-8, -18); R.cauda = 30 * Math.sin(t * TAU * 3);
      } else {
        R.x = X2; R.sx = -1; R.y = 30 * (1 - suave(trecho(s, 1.9, 2.3)));
      }
      return {
        R, depois(cam, info) {
          if (s < 0.6) aviso(() => {
            // água espirrando atrás, onde a cauda bate
            const xc = R.X + R.x + 26 * R.sx;
            for (let i = 0; i < 6; i++) { const u = (t * 2.5 + i / 6) % 1; gotaPx(cam, xc + R.sx * (4 + 14 * u + i), AGUA_Y - 2 - 26 * u + 30 * u * u); }
          });
          if (s >= 0.6 && s < 1.8) aviso(() => {
            // gotas ficando para trás
            for (let i = 0; i < 3; i++) { const u = (t * 3 + i / 3) % 1; gotaPx(cam, info.corpo.x + R.sx * (40 + 30 * u), info.corpo.y + 4 + 16 * u * u); }
          });
        }
      };
    }
  },
  transicao: {
    dur: 2.0, nome: 'Troca de fase',
    desc: 'O chip sobrecarrega soltando faíscas. Ele afunda, sobe girando para fora da água num respingo enorme e cai de volta, bravo.',
    quadro(s, t) {
      const R = botoBase(t);
      const choque = s < 0.25 ? Math.sin(s * 90) * 1.5 * (1 - s / 0.25) : 0;
      R.x = Math.round(choque); R.olho = 'bravo';
      R.y = kf(s, [[0, 0], [0.25, 0], [0.4, 8, entra], [0.6, -6, sai], [1.4, -6], [1.6, 6, entra], [1.8, -1], [2.0, 0]]);
      R.giro = -360 * suave(trecho(s, 0.5, 1.45));
      const ergue = suave(trecho(s, 0.4, 0.55)) * (1 - suave(trecho(s, 1.45, 1.7)));
      R.finP = lerp(R.finP, pt(-22, -64), ergue); R.finL = lerp(R.finL, pt(24, -60), ergue);
      R.incha = s > 0.25 && s < 0.45 ? 0.6 : 0; R.boca = s > 0.55 && s < 1.45 ? 1 : 0;
      const k = kf(s, [[0, 0.6], [0.15, 1], [1.6, 1], [2.0, 0]]);
      return {
        R, depois(cam, info) {
          chipSobrecargaPx(cam, info.corpo.x, info.corpo.y, s, k, 5);
          // respingo grande na saída (dois, um para cada lado) e outro na volta
          for (const [t0, dx, g] of [[0.48, 0, 1], [1.58, 0, 0.7]]) { const u = trecho(s, t0, t0 + 0.5); if (u > 0 && u < 1) respingoGrandePx(cam, R.X + R.x + dx, AGUA_Y, u, g); }
          // anel de espuma na linha d'água enquanto ele gira fora dela
          const e = trecho(s, 0.5, 1.5);
          if (e > 0 && e < 1) for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + s * 4, r = 14 + 6 * e; cam.set(R.X + R.x + Math.cos(a) * r, AGUA_Y - 1 + Math.sin(a) * 1.5, i % 2 ? PBO.aguaL : PBO.agua); }
        }
      };
    }
  },
  dano: {
    dur: 0.33, nome: 'Levando golpe',
    desc: 'Encolhe para trás com os olhos apertados, a nadadeira sacode, o chapéu pula na cabeça e o chip dá um estalo.',
    quadro(s, t) {
      const R = botoBase(t);
      const d = kf(s, [[0, 3], [0.1, 4, sai], [0.33, 0]]), k = kf(s, [[0, 0.8], [0.1, 1], [0.33, 0]]);
      R.x = Math.round(d); R.inc = mix(R.inc, 12, k); R.y += 2 * k; R.incha = s < 0.15 ? 0.5 : 0.2 * k;
      R.finP = lerp(R.finP, pt(-22, -58), k); R.olho = k > 0.3 ? 'dor' : R.olho;
      R.chapeu.dy = -3 * k; R.chapeu.ang = -8 - 10 * k;
      return { R, depois(cam, info) { chipEstaloPx(cam, info.corpo.x, info.corpo.y, s / 0.33, 6); } };
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
  const pontasCabo = [];
  [[-10, 18, 1], [0, 24, -1], [9, 15, 1]].forEach(([x, comp, l], k) => {
    const a = A(pt(x, 14)), b = soma(a, pt(Math.sin(t * 2 + k) * 4 * l + R.cabos * 2, comp));
    pontasCabo.push(b);
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
  return { olho: O, lente: L0, corpo: A(pt(8, -10)), topo: A(pt(-4, -20)), pontasCabo };
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
  transicao: {
    dur: 2.0, nome: 'Troca de fase',
    desc: 'Sobrecarga: o Núcleo treme inteiro, as abas abrem até o fim, a lente brilha forte e os cabos soltam faíscas.',
    quadro(s, t) {
      const R = maqBase(t);
      const k = kf(s, [[0, 0.5], [0.3, 1], [1.6, 1], [2.0, 0]]), sac = k * (1 - suave(trecho(s, 1.6, 1.9)));
      // tremida puxada para trás (direita): o brilho em volta da lente não passa da borda da folha
      R.cx += (1 + Math.sin(t * 60)) * 1.3 * sac; R.cy += Math.cos(t * 47) * 1.2 * sac; R.ang += Math.sin(t * 38) * 6 * sac;
      R.abas = kf(s, [[0, 0], [0.4, 1.5, sai], [1.6, 1.5], [2.0, 0]]) + (s > 0.4 && s < 1.6 ? Math.sin(t * 30) * 0.15 : 0);
      R.brilho = kf(s, [[0, 0], [0.4, 1], [1.6, 1], [2.0, 0]]);
      R.bravo = true; R.abre = s < 0.3 && Math.round(s * 12) % 2 ? 0.25 : 1;
      R.cabos = Math.sin(t * 25) * 2 * sac;
      return {
        R, depois(cam, info) {
          chipSobrecargaPx(cam, info.corpo.x, info.corpo.y, s, k, 7);
          // lente estourando de brilho: miolo branco e raios em cruz, alternando + e x
          if (R.brilho > 0.3) {
            const x = Math.round(info.lente.x), y = Math.round(info.lente.y), q = Math.round(s * 12);
            cam.disco(x - 0.5, y - 0.5, 2.4, PMQ.laserL); cam.disco(x - 0.5, y - 0.5, 1.3, PM.branco);
            for (const [dx, dy] of q % 2 ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) for (let d = 14; d <= 17; d++) cam.set(x + dx * d, y + dy * d, d < 16 ? PMQ.laserL : PMQ.laser);
          }
          // faíscas e raios saindo das pontas dos cabos
          info.pontasCabo.forEach((p, i) => {
            if (k < 0.3) return;
            const q = Math.round(s * 12);
            for (let j = 0; j < 4; j++) { const a = hash(i * 5 + j + q) * TAU, d = 2 + 7 * ((s * 4 + i / 3 + j * 0.13) % 1); cam.set(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d + d * 0.3, j % 2 ? PM.fogo6 : PMQ.amarelo); }
            if ((Math.round(s * 12) + i) % 3 === 0) raioPx(cam, p.x, p.y, rad(60 + 60 * hash(i + Math.round(s * 12))), 8, i * 31 + Math.round(s * 12), PMQ.amarelo, PM.branco);
          });
        },
        treme: s < 1.6 ? 1 : 0
      };
    }
  },
  dano: {
    dur: 0.33, nome: 'Levando golpe',
    desc: 'Balança para trás no braço, a lente aperta e o chip dá um estalo.',
    quadro(s, t) {
      const R = maqBase(t);
      const k = kf(s, [[0, 0.8], [0.1, 1, sai], [0.33, 0]]);
      R.cx += 6 * k; R.cy -= 2 * k; R.ang += 12 * k + (s < 0.2 ? Math.sin(t * 70) * 2 : 0);
      R.abre = 1 - 0.6 * k; R.bravo = true; R.abas = 0.4 * k; R.cabos = 3 * k;
      return { R, depois(cam, info) { chipEstaloPx(cam, info.corpo.x, info.corpo.y, s / 0.33, 8); } };
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
respingoPx = inofensivo(respingoPx); alcapaoPx = inofensivo(alcapaoPx); respingoGrandePx = inofensivo(respingoGrandePx);
raioPx = inofensivo(raioPx); chipSobrecargaPx = inofensivo(chipSobrecargaPx); chipEstaloPx = inofensivo(chipEstaloPx);

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
      { nome: 'Fase 3', ataques: ['salto', 'rasante'], roteiro: [['idle', 0.6], ['salto'], ['idle', 0.4], ['chapeu'], ['idle', 0.4], ['rasante'], ['idle', 0.4], ['jato'], ['idle', 0.4], ['salto'], ['idle', 0.4], ['beijos']] }
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
