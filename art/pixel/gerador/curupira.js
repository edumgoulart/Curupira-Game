/* curupira.js — Curupira E5 (Fogueira): rosto com expressões e corpo de lado em poses.
   Tudo é desenhado olhando para a direita, com o chão em y = 0. */
const GIRO_LADO = 0.45;   // quanto a cabeça vira para a frente na vista de lado (0 = de frente)

const E5 = {
  perna: 54, passo: 46, tronco: 42, cabeca: 47, braco: 46, grossura: 12, mao: 9, pe: 19,
  cabecaDx: 5, quadrilL: 24, peito: 28, barriga: 6, folhas: 6, folhaTam: 22,
  fogoVel: 9, fogoAmp: 4, vento: [0, -0.8], bochecha: 1.0, franja: 3,
  pele: '#B7743E', sombra: '#91582A', cabelo: ['#E8360E', '#FFD23A'], folha: ['#2F6B2A', '#4E8C33'],
  sobrancelha: '#3A160A', iris: '#3E8A2E', alturas: [0.6, 0.9, 1.15, 1.35, 1.15, 0.9, 0.6], cabeloAltura: 40
};

/* ---------- expressões ----------
   olho: aberto | arregalado | feliz (^ ^) | apertado (> <) | espiral
   sup / supAng: pálpebra de cima (quanto cobre, inclinação; positivo = canto de dentro mais baixo, bravo)
   inf: pálpebra de baixo subindo (sorriso nos olhos). sob: sobrancelha (ang positivo = bravo).
   fogo: o cabelo reage ao humor (altura, velocidade, balanço, cor). */
const EXPR = {
  oba:         { nome: 'Oba', desc: 'O rosto escolhido do E5.', boca: 'oba', sob: { ang: 14, curva: 0.01 } },
  feliz:       { nome: 'Feliz', desc: 'Pálpebra de baixo sobe e as bochechas coram.', inf: 0.3, boca: 'risada', sob: { ang: -12, dy: -0.03, curva: 0.06 }, rubor: true, fogo: { alt: 1.1 } },
  rindo:       { nome: 'Rindo', desc: 'Olhos de arco fechados e boca aberta.', olho: 'feliz', boca: 'risada', sob: { ang: -14, dy: -0.06, curva: 0.07 }, rubor: true, fogo: { alt: 1.2, vel: 1.4 } },
  bravo:       { nome: 'Bravo', desc: 'Pálpebras inclinadas, dentes trincados, veia na testa e o fogo cresce.', sup: 0.36, supAng: 24, pupila: 0.8, boca: 'dentes', sob: { ang: 30, dy: 0.08, curva: -0.01, grossa: 1.3 }, veia: true, fogo: { alt: 1.4, vel: 1.7, amp: 1.3, cores: ['#FF1E0A', '#FFE95A'] } },
  furioso:     { nome: 'Furioso', desc: 'O grito do especial. O fogo fica no máximo.', sup: 0.3, supAng: 28, pupila: 0.65, boca: 'grito', sob: { ang: 34, dy: 0.09, curva: -0.02, grossa: 1.4 }, veia: true, fogo: { alt: 1.7, vel: 2.2, amp: 1.5, cores: ['#FF1E0A', '#FFF27A'] } },
  determinado: { nome: 'Determinado', desc: 'Para os ataques: olhar firme, boca reta.', sup: 0.22, supAng: 10, pupila: 0.9, boca: 'firme', sob: { ang: 16, dy: 0.04, curva: 0.01, grossa: 1.15 }, fogo: { alt: 1.15, vel: 1.2 } },
  convencido:  { nome: 'Convencido', desc: 'Meio olho e sorriso de dentes: provocando o chefe.', sup: 0.46, supAng: -4, boca: 'convencido', sob: { ang: 4, dy: -0.02, curva: 0.05 }, fogo: { alt: 1.05 } },
  surpreso:    { nome: 'Surpreso', desc: 'Olhos arregalados, sobrancelhas lá em cima, boca em "o".', olho: 'arregalado', pupila: 0.7, boca: 'o', sob: { ang: -6, dy: -0.12, curva: 0.08 }, fogo: { alt: 1.25, vel: 1.3 } },
  assustado:   { nome: 'Assustado', desc: 'Pupila pequena tremendo, dentes à mostra, suor e o fogo encolhe.', olho: 'arregalado', pupila: 0.5, boca: 'medo', sob: { ang: -26, dy: -0.1, curva: 0.04 }, suor: true, tremer: true, fogo: { alt: 0.7, vel: 2.6, amp: 1.6 } },
  dor:         { nome: 'Dor', desc: 'Quando leva um golpe: olhos apertados e careta.', olho: 'apertado', boca: 'dor', sob: { ang: -24, dy: 0.02, curva: 0.02 }, suor: true, fogo: { alt: 0.85, vel: 2.4, amp: 1.5 } },
  triste:      { nome: 'Triste', desc: 'Pupila grande e brilhante, lágrima e o fogo quase apaga.', sup: 0.2, supAng: -20, pupila: 1.15, boca: 'triste', sob: { ang: -26, dy: -0.02, curva: 0.03 }, lagrima: true, fogo: { alt: 0.5, vel: 0.6, amp: 0.6, cores: ['#B8400F', '#F0A030'] } },
  tonto:       { nome: 'Tonto', desc: 'Derrotado: olhos em espiral, estrelinhas e fumaça no cabelo.', olho: 'espiral', boca: 'tonto', sob: { ang: -10, dy: -0.04, curva: 0.05 }, estrelas: true, fumaca: true, fogo: { alt: 0.4, vel: 0.8, amp: 0.8, cores: ['#B8400F', '#F0A030'] } }
};
const EXPR_PADRAO = { olho: 'aberto', sup: 0, supAng: 0, inf: 0, pupila: 1, olhar: 0, boca: 'oba', sob: { ang: 0, dy: 0, curva: 0.03, grossa: 1 }, fogo: {} };
const exDe = nome => {
  const e = EXPR[nome] || EXPR.oba;
  return { ...EXPR_PADRAO, ...e, sob: { ...EXPR_PADRAO.sob, ...e.sob }, fogo: { alt: 1, vel: 1, amp: 1, ...e.fogo } };
};

/* ---------- peças ---------- */
function peLado(anc, L, ang, virado, cor) {
  const s = virado ? -1 : 1;
  const d = `M-6 -5 Q-10 3 -3 5 L${L - 2} 5 Q${L + 4} 4 ${L + 1} -2 Q${L - 3} -7 ${f(L * 0.45)} -6 Q3 -9 -6 -5Z`;
  const dedos = `M${L - 5} 5 L${L - 6} 1 M${L - 10} 5 L${L - 11} 1.5`;
  return `<g transform="translate(${f(anc.x)} ${f(anc.y)}) rotate(${f(ang * s)}) scale(${s} 1)">` +
    forma(d, cor, TR) + linha(dedos, CONTORNO, 1.6) + '</g>';
}
function punho(c, r, cor) {
  return circ(c, r, cor) + linha(D`M${c.x + r * 0.1} ${c.y - r * 0.6} Q${c.x + r * 0.75} ${c.y - r * 0.2} ${c.x + r * 0.35} ${c.y + r * 0.35}`, CONTORNO, 1.8);
}
// palma aberta: ang é para onde apontam os dedos (graus, -90 = para cima)
function palma(c, r, ang, cor) {
  let s = '';
  for (const [da, k] of [[-28, 1.45], [0, 1.6], [28, 1.45], [-88, 1.1]]) {
    const a = (ang + da) * Math.PI / 180;
    s += pelo(D`M${c.x} ${c.y} L${c.x + Math.cos(a) * r * k} ${c.y + Math.sin(a) * r * k}`, cor, r * 0.62);
  }
  return s + circ(c, r, cor);
}
const maoDe = (tipo, c, r, cor, ang) => tipo === 'palma' ? palma(c, r, ang, cor) : punho(c, r, cor);
function cinto(a, c, b) {
  const d = `M${P(a)} Q${P(c)} ${P(b)}`;
  return linha(d, CONTORNO, 7) + linha(d, '#6B4A26', 3.5);
}
function veia(c, r) {
  let s = '';
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    s += linha(D`M${c.x + sx * r * 0.25} ${c.y + sy * r} Q${c.x + sx * r * 0.3} ${c.y + sy * r * 0.3} ${c.x + sx * r} ${c.y + sy * r * 0.25}`, '#D62818', 3.2);
  }
  return s;
}

/* ---------- cabeça ---------- */
function orelha(v, hc, R, lado, giro) {
  const ox = hc.x + lado * R * 0.93 - giro * 0.15 * R, oy = hc.y - R * 0.08;
  const d = D`M0 ${-0.28 * R} Q${0.45 * R} ${-0.35 * R} ${0.82 * R} ${-0.74 * R} Q${0.64 * R} ${0.1 * R} 0 ${0.3 * R} Z`;
  const dentro = D`M${0.12 * R} ${-0.1 * R} Q${0.42 * R} ${-0.2 * R} ${0.58 * R} ${-0.46 * R}`;
  return `<g transform="translate(${f(ox)} ${f(oy)}) scale(${lado} 1)">${forma(d, v.pele, TR)}${linha(dentro, CONTORNO, 2)}</g>`;
}

function cabelo(v, hc, R, giro, t, cx, fogo, vento) {
  const n = v.alturas.length;
  const centro = 270 - 55 * giro, abre = 160;
  const a0 = centro - abre / 2, a1 = centro + abre / 2, rr = R * 0.96;
  const ang = k => (a0 + (a1 - a0) * k) * Math.PI / 180;
  const base = [];
  for (let k = 0; k <= n; k++) base.push(pt(hc.x + Math.cos(ang(k / n)) * rr, hc.y + Math.sin(ang(k / n)) * rr));
  const vv = vento || v.vento;
  const dirVento = pt(vv[0] - 0.9 * giro, vv[1]);
  const cores = fogo.cores || v.cabelo;
  const pontas = [];
  let d = `M${P(base[0])}`, brilho = '';
  for (let i = 0; i < n; i++) {
    const am = ang((i + 0.5) / n);
    const nn = pt(Math.cos(am), Math.sin(am));
    const dir = unit(soma(nn, dirVento));
    const h = v.alturas[i] * v.cabeloAltura * fogo.alt;
    const fase = t * v.fogoVel * fogo.vel + i * 1.9, amp = v.fogoAmp * fogo.amp * v.alturas[i];
    const raiz = soma(hc, mul(nn, rr));
    const perp = pt(-dir.y, dir.x);
    const ponta = soma(soma(raiz, mul(dir, h)), soma(mul(perp, -h * 0.15), pt(Math.sin(fase) * amp, Math.cos(fase * 1.3) * amp * 0.5)));
    pontas.push(ponta);
    const ca = soma(soma(base[i], mul(dir, h * 0.55)), mul(perp, -h * 0.2));
    const cb = soma(soma(base[i + 1], mul(dir, h * 0.5)), mul(perp, h * 0.14));
    d += ` Q${P(ca)} ${P(ponta)} Q${P(cb)} ${P(base[i + 1])}`;
    const bl = lerp(base[i], base[i + 1], 0.3), br = lerp(base[i], base[i + 1], 0.7), pb = lerp(raiz, ponta, 0.62);
    brilho += `<path d="M${P(bl)} Q${P(soma(bl, mul(dir, h * 0.35)))} ${P(pb)} Q${P(soma(br, mul(dir, h * 0.2)))} ${P(br)}Z" fill="${cores[1]}"/>`;
  }
  // franja em pontas sobre a testa, simétrica em volta de cx
  const fr = v.franja, larg = 0.6 * R, y0 = hc.y - 0.56 * R, yp = hc.y - 0.37 * R;
  d += ` Q${P(pt(cx + 0.78 * R, hc.y - 0.62 * R))} ${P(pt(cx + larg, y0))}`;
  for (let k = 0; k < fr; k++) {
    const xs = cx + larg - 2 * larg * k / fr, xb = cx + larg - 2 * larg * (k + 1) / fr, xa = (xs + xb) / 2;
    d += ` Q${P(pt((xs + xa) / 2, y0 + (yp - y0) * 0.55))} ${P(pt(xa, yp))} Q${P(pt((xa + xb) / 2, y0 + (yp - y0) * 0.35))} ${P(pt(xb, y0))}`;
  }
  d += ` Q${P(pt(cx - 0.78 * R, hc.y - 0.62 * R))} ${P(base[0])} Z`;
  return { svg: `<path d="${d}" fill="${cores[0]}" stroke="${CONTORNO}" stroke-width="${TR}" stroke-linejoin="round"/>${brilho}`, pontas };
}

function olho(v, o, ey, R, ex, olhar, piscando, t) {
  const { x, k, lado } = o;
  const fixo = ex.olho === 'feliz' || ex.olho === 'apertado' || ex.olho === 'espiral';
  if (piscando && !fixo) {
    const w = 0.17 * R * k;
    return linha(D`M${x - w} ${ey + 0.03 * R} Q${x} ${ey - 0.13 * R} ${x + w} ${ey + 0.03 * R}`, CONTORNO, 3);
  }
  if (ex.olho === 'feliz') {
    const w = 0.16 * R * k;
    return linha(D`M${x - w} ${ey + 0.06 * R} Q${x} ${ey - 0.2 * R} ${x + w} ${ey + 0.06 * R}`, CONTORNO, 3.6);
  }
  if (ex.olho === 'apertado') {
    const xo = x + lado * 0.14 * R * k, xt = x - lado * 0.1 * R * k;
    return linha(D`M${xo} ${ey - 0.11 * R} L${xt} ${ey} L${xo} ${ey + 0.11 * R}`, CONTORNO, 3.6);
  }
  const grande = ex.olho === 'arregalado' || ex.olho === 'espiral';
  const rx = (grande ? 0.22 : 0.19) * R * k, ry = (grande ? 0.28 : 0.24) * R;
  let s = elip(pt(x, ey), rx, ry, '#FFFFFF', 2.6);
  if (ex.olho === 'espiral') {
    let d = '';
    for (let i = 0; i <= 30; i++) {
      const a = i * 0.55 + t * 7 * lado, r = (i / 30) * rx * 0.85;
      d += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * r)} ${f(ey + Math.sin(a) * r * ry / rx)} `;
    }
    return s + linha(d, CONTORNO, 2.2);
  }
  const pf = ex.pupila;
  const treme = ex.tremer ? Math.sin(t * 47 + lado) * 0.014 * R : 0;
  const ix = x + olhar * 0.07 * R + treme, iy = ey + 0.02 * R;
  s += elip(pt(ix, iy), 0.125 * R * k * pf, 0.15 * R * pf, v.iris, 0) +
    elip(pt(ix, iy), 0.07 * R * k * pf, 0.085 * R * pf, CONTORNO, 0) +
    circ(pt(ix - 0.045 * R * pf, iy - 0.06 * R * pf), 0.04 * R * Math.max(pf, 0.6), '#FFFFFF', 0) +
    circ(pt(ix + 0.05 * R * k * pf, iy + 0.06 * R * pf), 0.018 * R, '#FFFFFF', 0);
  if (ex.sup) {
    const yl = ey - ry + ex.sup * 2 * ry, inc = Math.tan(ex.supAng * Math.PI / 180) * rx;
    const xi = x - lado * (rx + 3), xo = x + lado * (rx + 3), yi = yl + inc, yo = yl - inc;
    s += `<path d="${D`M${xo} ${ey - ry - 6} L${xi} ${ey - ry - 6} L${xi} ${yi} L${xo} ${yo} Z`}" fill="${v.pele}"/>`;
    s += linha(D`M${xi} ${yi} L${xo} ${yo}`, CONTORNO, 3.2);
  }
  if (ex.inf) {
    const yb = ey + ry - ex.inf * 2 * ry;
    s += `<path d="${D`M${x - rx - 3} ${yb + 0.05 * R} Q${x} ${yb - 0.1 * R} ${x + rx + 3} ${yb + 0.05 * R} L${x + rx + 3} ${ey + ry + 4} L${x - rx - 3} ${ey + ry + 4} Z`}" fill="${v.pele}"/>`;
    s += linha(D`M${x - rx} ${yb + 0.04 * R} Q${x} ${yb - 0.1 * R} ${x + rx} ${yb + 0.04 * R}`, CONTORNO, 2.6);
  }
  return s;
}

function sobrancelha(v, o, by, R, sob) {
  const L = 0.16 * R * o.k, a = Math.sin(sob.ang * Math.PI / 180) * L;
  const xi = o.x - o.lado * L, xo = o.x + o.lado * L;
  return pelo(D`M${xo} ${by - a} Q${o.x} ${by - sob.curva * R} ${xi} ${by + a}`, E5.sobrancelha, R * 0.07 * sob.grossa);
}

function boca(tipo, mx, my, R, sombra) {
  const w = 0.24 * R, V = '#6B1A12', L = '#E0575A';
  let s = '';
  if (tipo === 'oba') {
    s += elip(pt(mx, my + 0.11 * R), 0.15 * R, 0.15 * R, V, 2.6) + elip(pt(mx, my + 0.19 * R), 0.09 * R, 0.05 * R, L, 0);
    s += forma(D`M${mx - 0.1 * R} ${my - 0.01 * R} Q${mx} ${my - 0.05 * R} ${mx + 0.1 * R} ${my - 0.01 * R} L${mx + 0.09 * R} ${my + 0.04 * R} Q${mx} ${my + 0.02 * R} ${mx - 0.09 * R} ${my + 0.04 * R} Z`, '#FFFFFF', 1.4);
  } else if (tipo === 'risada') {
    s += forma(D`M${mx - w * 1.05} ${my - 0.02 * R} Q${mx} ${my + 0.06 * R} ${mx + w * 1.05} ${my - 0.02 * R} C${mx + w * 0.95} ${my + 0.3 * R} ${mx + w * 0.5} ${my + 0.42 * R} ${mx} ${my + 0.42 * R} C${mx - w * 0.5} ${my + 0.42 * R} ${mx - w * 0.95} ${my + 0.3 * R} ${mx - w * 1.05} ${my - 0.02 * R} Z`, V, 2.6);
    s += `<path d="${D`M${mx - 0.13 * R} ${my + 0.36 * R} Q${mx} ${my + 0.2 * R} ${mx + 0.13 * R} ${my + 0.36 * R} Q${mx} ${my + 0.41 * R} ${mx - 0.13 * R} ${my + 0.36 * R}Z`}" fill="${L}"/>`;
    s += forma(D`M${mx - w * 0.72} ${my + 0.02 * R} Q${mx} ${my + 0.07 * R} ${mx + w * 0.72} ${my + 0.02 * R} L${mx + w * 0.66} ${my + 0.1 * R} Q${mx} ${my + 0.15 * R} ${mx - w * 0.66} ${my + 0.1 * R} Z`, '#FFFFFF', 1.4);
  } else if (tipo === 'dentes') {
    s += `<rect x="${f(mx - 0.2 * R)}" y="${f(my)}" width="${f(0.4 * R)}" height="${f(0.15 * R)}" rx="${f(0.04 * R)}" fill="#FFFFFF" stroke="${CONTORNO}" stroke-width="2.6"/>`;
    s += linha(D`M${mx - 0.2 * R} ${my + 0.075 * R} L${mx + 0.2 * R} ${my + 0.075 * R} M${mx - 0.1 * R} ${my} L${mx - 0.1 * R} ${my + 0.15 * R} M${mx} ${my} L${mx} ${my + 0.15 * R} M${mx + 0.1 * R} ${my} L${mx + 0.1 * R} ${my + 0.15 * R}`, CONTORNO, 1.5);
  } else if (tipo === 'grito') {
    s += forma(D`M${mx - w * 1.1} ${my - 0.05 * R} Q${mx} ${my + 0.02 * R} ${mx + w * 1.1} ${my - 0.05 * R} L${mx + w * 0.75} ${my + 0.36 * R} Q${mx} ${my + 0.46 * R} ${mx - w * 0.75} ${my + 0.36 * R} Z`, V, 2.6);
    s += elip(pt(mx, my + 0.33 * R), 0.14 * R, 0.06 * R, L, 0);
    s += forma(D`M${mx - w * 0.92} ${my - 0.01 * R} Q${mx} ${my + 0.05 * R} ${mx + w * 0.92} ${my - 0.01 * R} L${mx + w * 0.85} ${my + 0.06 * R} L${mx + w * 0.62} ${my + 0.07 * R} L${mx + w * 0.55} ${my + 0.15 * R} L${mx + w * 0.48} ${my + 0.08 * R} L${mx - w * 0.48} ${my + 0.08 * R} L${mx - w * 0.55} ${my + 0.15 * R} L${mx - w * 0.62} ${my + 0.07 * R} L${mx - w * 0.85} ${my + 0.06 * R} Z`, '#FFFFFF', 1.4);
  } else if (tipo === 'medo') {
    const x0 = mx - 0.22 * R, x1 = mx + 0.22 * R, n = 4, dx = (x1 - x0) / n;
    let d = D`M${x0} ${my + 0.02 * R}`;
    for (let i = 0; i < n; i++) d += D` q${dx / 2} ${-0.045 * R} ${dx} 0`;
    d += D` L${x1} ${my + 0.17 * R}`;
    for (let i = 0; i < n; i++) d += D` q${-dx / 2} ${0.045 * R} ${-dx} 0`;
    s += forma(d + ' Z', '#FFFFFF', 2.6);
    let m = D`M${x0} ${my + 0.095 * R}`;
    for (let i = 0; i < n * 2; i++) m += D` L${x0 + (i + 1) * dx / 2} ${my + (i % 2 ? 0.095 : 0.065) * R}`;
    s += linha(m, CONTORNO, 1.6);
  } else if (tipo === 'o') {
    s += elip(pt(mx, my + 0.1 * R), 0.085 * R, 0.11 * R, V, 2.6) + elip(pt(mx, my + 0.16 * R), 0.05 * R, 0.03 * R, L, 0);
  } else if (tipo === 'firme') {
    s += linha(D`M${mx - 0.16 * R} ${my + 0.08 * R} Q${mx} ${my + 0.04 * R} ${mx + 0.16 * R} ${my + 0.08 * R}`, CONTORNO, 3.2);
  } else if (tipo === 'convencido') {
    s += forma(D`M${mx - w} ${my} Q${mx} ${my + 0.08 * R} ${mx + w} ${my} Q${mx} ${my + 0.3 * R} ${mx - w} ${my} Z`, '#FFFFFF', 2.6);
    s += linha(D`M${mx - w * 0.8} ${my + 0.06 * R} Q${mx} ${my + 0.13 * R} ${mx + w * 0.8} ${my + 0.06 * R} M${mx - 0.1 * R} ${my + 0.05 * R} L${mx - 0.1 * R} ${my + 0.13 * R} M${mx + 0.1 * R} ${my + 0.05 * R} L${mx + 0.1 * R} ${my + 0.13 * R}`, CONTORNO, 1.4);
    s += linha(D`M${mx - w - 0.04 * R} ${my - 0.05 * R} L${mx - w + 0.01 * R} ${my + 0.01 * R} M${mx + w + 0.04 * R} ${my - 0.05 * R} L${mx + w - 0.01 * R} ${my + 0.01 * R}`, CONTORNO, 2.6);
  } else if (tipo === 'dor') {
    s += forma(D`M${mx - 0.23 * R} ${my + 0.01 * R} L${mx + 0.23 * R} ${my - 0.03 * R} L${mx + 0.2 * R} ${my + 0.19 * R} L${mx - 0.2 * R} ${my + 0.15 * R} Z`, V, 2.6);
    s += `<path d="${D`M${mx - 0.21 * R} ${my + 0.02 * R} L${mx + 0.21 * R} ${my - 0.02 * R} L${mx + 0.205 * R} ${my + 0.045 * R} L${mx - 0.205 * R} ${my + 0.08 * R} Z M${mx - 0.2 * R} ${my + 0.11 * R} L${mx + 0.2 * R} ${my + 0.14 * R} L${mx + 0.2 * R} ${my + 0.18 * R} L${mx - 0.2 * R} ${my + 0.145 * R} Z`}" fill="#FFFFFF"/>`;
  } else if (tipo === 'triste') {
    s += linha(D`M${mx - 0.16 * R} ${my + 0.13 * R} Q${mx} ${my - 0.03 * R} ${mx + 0.16 * R} ${my + 0.13 * R}`, CONTORNO, 3.2);
  } else if (tipo === 'tonto') {
    s += forma(D`M${mx + 0.02 * R} ${my + 0.07 * R} Q${mx + 0.02 * R} ${my + 0.26 * R} ${mx + 0.1 * R} ${my + 0.25 * R} Q${mx + 0.18 * R} ${my + 0.23 * R} ${mx + 0.15 * R} ${my + 0.07 * R} Z`, L, 2);
    let d = D`M${mx - 0.2 * R} ${my + 0.06 * R}`;
    for (let i = 0; i < 4; i++) d += D` q${0.05 * R} ${(i % 2 ? 0.06 : -0.06) * R} ${0.1 * R} 0`;
    s += linha(d, CONTORNO, 3);
  }
  return s;
}

function rosto(v, hc, R, cx, giro, piscando, ex, t, olharExtra) {
  let s = '';
  const ey = hc.y + 0.02 * R, sep = 0.3 * R, olhar = giro * 0.35 + ex.olhar + (olharExtra || 0);
  const olhos = [{ x: cx - sep, k: 1, lado: -1 }, { x: cx + sep, k: 1 - 0.18 * giro, lado: 1 }];
  for (const o of olhos) s += olho(v, o, ey, R, ex, olhar, piscando, t);
  for (const o of olhos) {
    const bx = o.x + o.lado * 0.24 * R * o.k, by = hc.y + 0.3 * R;
    if (ex.rubor) s += elip(pt(bx, by + 0.02 * R), 0.15 * R * o.k, 0.085 * R, '#E8604A', 0, ' opacity=".55"');
    for (const dy of [-0.04, 0.06]) s += linha(D`M${bx - 0.11 * R * o.k} ${by + dy * R} L${bx + 0.11 * R * o.k} ${by + dy * R}`, '#C8261B', R * 0.055);
  }
  for (const o of olhos) s += sobrancelha(v, o, ey - 0.33 * R + ex.sob.dy * R, R, ex.sob);
  const nx = cx + giro * 0.25 * R, ny = hc.y + 0.24 * R;
  s += forma(D`M${nx - 0.09 * R} ${ny - 0.05 * R} Q${nx} ${ny - 0.08 * R} ${nx + 0.09 * R} ${ny - 0.05 * R} Q${nx + 0.02 * R} ${ny + 0.08 * R} ${nx} ${ny + 0.08 * R} Q${nx - 0.02 * R} ${ny + 0.08 * R} ${nx - 0.09 * R} ${ny - 0.05 * R} Z`, v.sombra, 2);
  s += boca(ex.boca, cx + giro * 0.18 * R, hc.y + 0.45 * R, R, v.sombra);
  if (ex.lagrima) for (const o of olhos) {
    const u = (t * 0.7 + (o.lado > 0 ? 0.5 : 0)) % 1;
    s += gota(pt(o.x + o.lado * 0.1 * R, ey + 0.3 * R + u * 0.35 * R), 0.06 * R * (0.6 + 0.4 * Math.min(1, u * 3)));
  }
  if (ex.veia) {
    const k = 1 + 0.12 * Math.sin(t * 9);
    s += veia(pt(cx + 0.62 * R, hc.y - 0.3 * R), 0.13 * R * k);
  }
  return s;
}

function cabeca(v, hc0, R, giro, t, piscando, ex, vento, inc = 0, olharExtra = 0) {
  const hc = ex.tremer ? soma(hc0, pt(Math.sin(t * 53) * 1.2, Math.cos(t * 41) * 0.8)) : hc0;
  const cx = hc.x + giro * 0.3 * R;
  let s = '';
  for (const lado of (giro < 0.2 ? [-1, 1] : [-1])) s += orelha(v, hc, R, lado, giro);
  const bx = hc.x + giro * 0.12 * R;
  const formas = `<circle cx="${f(hc.x)}" cy="${f(hc.y)}" r="${f(R)}"/><ellipse cx="${f(bx)}" cy="${f(hc.y + R * 0.3)}" rx="${f(R * v.bochecha)}" ry="${f(R * 0.66)}"/>`;
  s += `<g fill="${CONTORNO}" stroke="${CONTORNO}" stroke-width="${TR * 2}">${formas}</g><g fill="${v.pele}">${formas}</g>`;
  const cab = cabelo(v, hc, R, giro, t, cx, ex.fogo, vento);
  s += cab.svg;
  s += rosto(v, hc, R, cx, giro, piscando, ex, t, olharExtra);
  if (ex.suor) {
    const u = (t * 0.8) % 1, lado = giro > 0.2 ? -1 : 1;
    s += gota(pt(hc.x + lado * 0.98 * R, hc.y - 0.3 * R + u * 0.3 * R), 0.09 * R);
  }
  if (ex.fumaca) for (let i = 0; i < 3; i++) {
    const u = (t * 0.5 + i / 3) % 1, pp = cab.pontas[(i * 3) % cab.pontas.length];
    s += fumaca(pp, u, 0.12 * R, '#8A817A', -10);
  }
  if (ex.estrelas) for (let i = 0; i < 3; i++) {
    const a = t * 3 + i * TAU / 3;
    s += estrela(pt(hc.x + Math.cos(a) * 0.95 * R, hc.y - 1.0 * R + Math.sin(a) * 0.22 * R), 0.13 * R, '#FFD23A', t * 120);
  }
  let pontas = cab.pontas;
  if (inc) {
    s = grupo(`rotate(${f(inc)} ${f(hc.x)} ${f(hc.y)})`, s);
    pontas = pontas.map(p => soma(hc, rot(sub(p, hc), inc)));
  }
  return { svg: s, pontas };
}

/* ---------- corpo de lado ---------- */
function troncoLocal(v, t, pose) {
  const T = v.tronco, wh = v.quadrilL, wc = v.peito, bar = v.barriga;
  const q0 = pt(0, 0), topo = pt(0, -T);
  const A = d => P(soma(q0, d)), B = d => P(soma(topo, d));
  let s = forma(`M${A(pt(-wh / 2, 2))} C${A(pt(-wh / 2 - 3, -T * 0.45))} ${B(pt(-wc / 2, T * 0.25))} ${B(pt(-wc * 0.32, 0))} Q${B(pt(0, -5))} ${B(pt(wc * 0.32, 0))} C${B(pt(wc / 2 + 2, T * 0.3))} ${A(pt(wh / 2 + bar, -T * 0.4))} ${A(pt(wh / 2, 2))} Z`, v.pele, TR);
  s += linha(`M${A(pt(wh * 0.25 + bar * 0.4, -T * 0.27))} q2 2 4 0`, CONTORNO, 1.8);
  for (const k of [0, 1]) s += linha(`M${B(pt(-wc * 0.05 + k * 7, T * 0.45))} l5 9`, '#C8261B', 3);
  const vento = pose.saia || 0, agita = pose.agita ?? 1;
  for (let k = 0; k < v.folhas; k++) {
    const u = k / (v.folhas - 1);
    const x = -wh * 0.62 + (wh * 1.24 + bar * 0.6) * u, y = -6 - Math.sin(u * Math.PI) * 2;
    s += folha(x, y, 28 - 56 * u + vento + Math.sin(t * 7 + k * 1.3) * 4 * agita, v.folhaTam, v.folha[k % 2]);
  }
  s += cinto(pt(-wh * 0.66, -6), pt(bar * 0.2, -3), pt(wh * 0.62 + bar * 0.5, -6));
  return s;
}

function ombrosDe(q0, inc) {
  const W = d => soma(q0, rot(d, inc));
  return { perto: W(pt(-3, -E5.tronco + 9)), longe: W(pt(-7, -E5.tronco + 8)) };
}
const pendura = (o, a, r) => soma(o, pt(Math.sin(a) * r, Math.cos(a) * r));
const pe = (x, y = 0, ang = 0) => ({ p: pt(x, -5 + y), ang });

/* Energia do especial entre as mãos (bola que cresce) */
function bolaEnergia(c, r, t) {
  let s = circ(c, r * 1.8, '#FFC94A', 0, ' opacity=".22"') + circ(c, r * 1.3, '#FFB43A', 0, ' opacity=".4"');
  s += circ(c, r, '#FFD86A', 2.4) + circ(soma(c, pt(-r * 0.3, -r * 0.3)), r * 0.35, '#FFFBEA', 0);
  for (let i = 0; i < 6; i++) {
    const a = t * 6 + i * TAU / 6, p0 = soma(c, pt(Math.cos(a) * r * 2.4, Math.sin(a) * r * 2.4));
    s += linha(D`M${p0.x} ${p0.y} L${mix(p0.x, c.x, 0.4)} ${mix(p0.y, c.y, 0.4)}`, '#FFE58A', 2.4);
  }
  return s;
}

function corpoLado(v, pose, t, piscando, virados, exForcada) {
  const T = v.tronco, R = v.cabeca, L = v.perna;
  const q0 = pose.quadril, inc = pose.inclina || 0;
  const W = d => soma(q0, rot(d, inc));
  const o = ombrosDe(q0, inc);
  const [maoL, maoP] = pose.maos, [peL, peP] = pose.pes;
  const formas = pose.formaMao || ['punho', 'punho'], angs = pose.angMao || [-90, -90];
  // braço de mangueira: pode esticar além do tamanho normal; cotovelo 1 dobra para baixo/trás, -1 para o outro lado
  const bl = pose.bracoL || [v.braco, v.braco], cot = pose.cotovelo || [1, 1];
  const ex = exDe(exForcada || pose.ex);
  let s = '';
  s += membro(o.longe, maoL, bl[0], cot[0], v.grossura - 1, v.sombra) + maoDe(formas[0], maoL, v.mao - 0.5, v.sombra, angs[0]);
  s += membro(W(pt(-3, 0)), peL.p, L, -1, v.grossura, v.sombra) + peLado(peL.p, v.pe, peL.ang, virados, v.sombra);
  s += membro(W(pt(3, 0)), peP.p, L, -1, v.grossura, v.pele) + peLado(peP.p, v.pe, peP.ang, virados, v.pele);
  s += grupo(`translate(${f(q0.x)} ${f(q0.y)}) rotate(${f(inc)})`, troncoLocal(v, t, pose));
  const cb = pose.cabeca || {};
  const hc = W(pt(v.cabecaDx + (cb.dx || 0), -T - R * 0.7 + (cb.dy || 0)));
  const cab = cabeca(v, hc, R, pose.giro ?? GIRO_LADO, t, piscando, ex, pose.vento, (cb.inc || 0) + inc * 0.4, pose.olhar || 0);
  s += cab.svg;
  if (pose.energia) s += bolaEnergia(pose.energia.c, pose.energia.r, t);
  s += membro(o.perto, maoP, bl[1], cot[1], v.grossura, v.pele) + maoDe(formas[1], maoP, v.mao, v.pele, angs[1]);
  return { svg: s, pontas: cab.pontas, mao: maoP };
}

/* Busto de frente, para os retratos de expressão */
function retrato(nome, t, piscando, giro = 0) {
  const v = E5, R = v.cabeca, ex = exDe(nome);
  const ombroY = 0.78 * R;
  let s = forma(D`M${-0.95 * R} ${2.2 * R} C${-0.95 * R} ${1.25 * R} ${-0.6 * R} ${ombroY} 0 ${ombroY} C${0.6 * R} ${ombroY} ${0.95 * R} ${1.25 * R} ${0.95 * R} ${2.2 * R} Z`, v.pele, TR);
  for (const l of [-1, 1]) s += linha(D`M${l * 0.3 * R} ${1.45 * R} l${l * 3} 10 M${l * 0.45 * R} ${1.4 * R} l${l * 3} 10`, '#C8261B', 3);
  s += cabeca(v, pt(0, 0), R, giro, t, piscando, ex, null).svg;
  return s;
}

/* ---------- animações ----------
   pose(p, t) devolve a pose do quadro; x e y deslocam o boneco inteiro (o código do jogo faz isso,
   então ficam fora da folha de quadros). */
function mixPose(a, b, u) {
  const m = (x, y) => mix(x ?? 0, y ?? 0, u);
  const mp = (x, y) => pt(m(x.x, y.x), m(x.y, y.y));
  return {
    ...(u < 0.5 ? a : b),
    quadril: mp(a.quadril, b.quadril), inclina: m(a.inclina, b.inclina),
    pes: a.pes.map((pa, i) => ({ p: mp(pa.p, b.pes[i].p), ang: m(pa.ang, b.pes[i].ang) })),
    maos: a.maos.map((ma, i) => mp(ma, b.maos[i])),
    bracoL: [0, 1].map(i => m((a.bracoL || [E5.braco, E5.braco])[i], (b.bracoL || [E5.braco, E5.braco])[i])),
    cabeca: { dx: m(a.cabeca?.dx, b.cabeca?.dx), dy: m(a.cabeca?.dy, b.cabeca?.dy), inc: m(a.cabeca?.inc, b.cabeca?.inc) },
    saia: m(a.saia, b.saia), giro: m(a.giro ?? GIRO_LADO, b.giro ?? GIRO_LADO),
    vento: [m((a.vento || E5.vento)[0], (b.vento || E5.vento)[0]), m((a.vento || E5.vento)[1], (b.vento || E5.vento)[1])],
    escala: [m(a.escala?.[0] ?? 1, b.escala?.[0] ?? 1), m(a.escala?.[1] ?? 1, b.escala?.[1] ?? 1)],
    x: m(a.x, b.x), y: m(a.y, b.y)
  };
}

function poseParado(p, t) {
  const b = Math.sin(TAU * p);
  const q0 = pt(0, -51 + 1.6 * (b * 0.5 + 0.5)), inc = 3 + b * 1.2, o = ombrosDe(q0, inc);
  return {
    quadril: q0, inclina: inc, pes: [pe(-9), pe(11)],
    maos: [pendura(o.longe, -0.15 + b * 0.05, 40), pendura(o.perto, 0.2 - b * 0.05, 40)],
    cabeca: { dy: b * 1.2, inc: b * 1.5 }, ex: 'oba', saia: 0
  };
}

function peCorrida(q, S, ergue) {
  const ap = 0.4;
  if (q < ap) { const u = q / ap; return { x: S / 2 - S * u, y: 0, ang: -4 + 10 * u }; }
  const u = (q - ap) / (1 - ap), e = suave(u);
  return {
    x: -S / 2 + S * e - S * 0.18 * Math.sin(Math.PI * u),
    y: -ergue * Math.sin(Math.PI * u) - ergue * 0.5 * Math.sin(Math.PI * Math.min(1, u * 2)) * (1 - u),
    ang: 55 * Math.sin(Math.PI * u) * (1 - u) - 8 * u
  };
}
function pernasCorrida(p) {
  const S = 60, fa = peCorrida(p, S, 26), fb = peCorrida((p + 0.5) % 1, S, 26);
  const voo = Math.cos(2 * TAU * (p - 0.45));
  return { pes: [pe(fb.x, fb.y, fb.ang), pe(fa.x, fa.y, fa.ang)], voo, q0: pt(4, -47 - 3 * voo) };
}
function poseCorrer(p) {
  const { pes, voo, q0 } = pernasCorrida(p);
  const inc = 13, o = ombrosDe(q0, inc), bal = Math.cos(TAU * p);
  return {
    quadril: q0, inclina: inc, pes,
    maos: [pendura(o.longe, 0.3 + 1.0 * bal, 28), pendura(o.perto, 0.3 - 1.0 * bal, 28)],
    cabeca: { dy: 1 + voo, inc: -3 }, ex: 'determinado', vento: [-1.6, -0.3], saia: 16 + 4 * voo, agita: 1.6
  };
}

// braço do tiro: arma, estica e dá um coice a cada tiro (5 tiros/s no Tiro de Folha)
const INTERVALO_TIRO = 0.2;
function bracoTiro(o, t) {
  const q = (t / INTERVALO_TIRO) % 1;
  const ida = q < 0.25 ? suave(q / 0.25) : 1, coice = q >= 0.25 ? Math.exp(-(q - 0.25) * 12) : 0;
  const estendida = soma(o.perto, pt(66 - coice * 8, 14)), armada = soma(o.perto, pt(42, 2));
  return { mao: lerp(armada, estendida, ida), coice };
}
function poseAtacar(p, t) {
  const q0 = pt(-2, -49);
  let o = ombrosDe(q0, -2);
  const { mao, coice } = bracoTiro(o, t);
  return {
    quadril: q0, inclina: -2 - coice * 2, pes: [pe(-17), pe(17)],
    maos: [soma(o.longe, pt(-6, 26)), mao], formaMao: ['punho', 'palma'], angMao: [-90, -80], bracoL: [46, 70],
    cabeca: { dx: 1, inc: -2 }, giro: 0.55, ex: 'determinado', saia: coice * 5
  };
}
function poseAtacarCorrendo(p, t) {
  const { pes, voo, q0 } = pernasCorrida(p);
  const inc = 8, o = ombrosDe(q0, inc), bal = Math.cos(TAU * p);
  const { mao, coice } = bracoTiro(o, t);
  return {
    quadril: q0, inclina: inc - coice * 2, pes,
    maos: [pendura(o.longe, 0.3 + 1.0 * bal, 28), mao], formaMao: ['punho', 'palma'], angMao: [-90, -80], bracoL: [46, 70],
    cabeca: { dy: 1 + voo, inc: -6 }, giro: 0.55, ex: 'determinado', vento: [-1.6, -0.3], saia: 16 + 4 * voo, agita: 1.6
  };
}

function poseEspecial(p, t) {
  let inc, qx, qy, k, ex;
  const carga = trecho(p, 0, 0.38);
  if (p < 0.38) { const u = suave(carga); inc = mix(3, -8, u); qx = mix(0, -6, u); qy = mix(-51, -44, u); k = 0; ex = 'bravo'; }
  else if (p < 0.46) { const u = suave(trecho(p, 0.38, 0.46)); inc = mix(-8, 15, u); qx = mix(-6, 8, u); qy = mix(-44, -46, u); k = u; ex = 'furioso'; }
  else if (p < 0.72) { inc = 15 - 2 * trecho(p, 0.46, 0.72); qx = 8; qy = -46; k = 1; ex = p < 0.62 ? 'furioso' : 'determinado'; }
  else { const u = suave(trecho(p, 0.72, 1)); inc = mix(13, 3, u); qx = mix(8, 0, u); qy = mix(-46, -51, u); k = 1 - u; ex = u < 0.6 ? 'determinado' : 'oba'; }
  const q0 = pt(qx, qy), o = ombrosDe(q0, inc);
  const base = suave(carga) * (p < 0.72 ? 1 : 1 - suave(trecho(p, 0.72, 1)));
  const armada = [soma(o.longe, pt(-14, 30)), soma(o.perto, pt(-18, 33))];
  const solta = [soma(o.longe, pt(62, 8)), soma(o.perto, pt(70, 15))];
  const solto = [pendura(o.longe, -0.15, 40), pendura(o.perto, 0.2, 40)];
  let maos;
  if (p < 0.38) maos = armada.map((a, i) => lerp(solto[i], a, suave(carga)));
  else if (p < 0.72) maos = armada.map((a, i) => lerp(a, solta[i], k));
  else maos = solta.map((a, i) => lerp(solto[i], a, k));
  const pernas = Math.max(base, k);
  const treme = p < 0.38 ? Math.sin(t * 60) * carga * 1.2 : 0;
  return {
    quadril: soma(q0, pt(treme, 0)), inclina: inc,
    pes: [pe(mix(-9, -20, pernas)), pe(mix(11, 22, pernas))],
    maos, formaMao: ['palma', 'palma'], angMao: p < 0.38 ? [-30, -30] : [-80, -80], bracoL: [mix(46, 70, k), mix(46, 76, k)],
    cabeca: { dx: k * 2, inc: -4 * k }, giro: mix(GIRO_LADO, 0.55, k), ex,
    vento: [mix(0, -1.2, k), mix(-0.8, -1.6, carga)], saia: 6 * k - 4 * carga,
    energia: p < 0.43 ? { c: lerp(maos[0], maos[1], 0.5), r: 3 + 11 * suave(carga) } : null
  };
}

// pulo com os números do GDD: sobe 1100 px/s, gravidade 2800 px/s² → 0,786 s no ar, ~215 px de altura
const PULO_AR = 2 * 1100 / 2800, PULO_ALT = 1100 * 1100 / (2 * 2800);
const ALTURA_CURUPIRA_JOGO = 245;   // altura do sprite no jogo (PENDENCIAS.md)
const ALTURA_CURUPIRA_LOCAL = 226;  // do pé à ponta do cabelo, neste desenho
function posePular(p, t) {
  const s = p * 1.5, t0 = 0.1, t1 = t0 + PULO_AR;
  const parado = poseParado(0.25, t);
  const qA = pt(0, -40), oA = ombrosDe(qA, 6);
  const agachado = { ...parado, quadril: qA, inclina: 6, pes: [pe(-11), pe(13)], maos: [pendura(oA.longe, -0.8, 40), pendura(oA.perto, -0.7, 40)], ex: 'determinado', escala: [1.06, 0.94] };
  const qS = pt(0, -52), oS = ombrosDe(qS, 4);
  const subindo = { ...parado, quadril: qS, inclina: 4, pes: [pe(-12, -2, 20), pe(12, -22, 30)], maos: [pendura(oS.longe, -0.6, 40), soma(oS.perto, pt(60, -50))], bracoL: [46, 100], ex: 'oba', escala: [0.94, 1.08] };
  const aceno = Math.sin(t * 20) * 8;
  const caindo = { ...parado, quadril: qS, inclina: 0, pes: [pe(-6, 6, -10), pe(9, 6, -10)], maos: [soma(oS.longe, pt(-58, -40 + aceno)), soma(oS.perto, pt(62, -36 - aceno))], bracoL: [96, 96], cotovelo: [-1, 1], ex: 'surpreso', escala: [0.97, 1.04] };
  const qT = pt(0, -41), oT = ombrosDe(qT, 8);
  const pousando = { ...parado, quadril: qT, inclina: 8, pes: [pe(-12), pe(14)], maos: [pendura(oT.longe, 1.2, 40), pendura(oT.perto, 1.4, 40)], ex: 'oba', escala: [1.1, 0.9] };
  const escalaPx = ALTURA_CURUPIRA_LOCAL / ALTURA_CURUPIRA_JOGO;
  let pose;
  if (s < t0) pose = mixPose(parado, agachado, suave(s / t0));
  else if (s < t1) {
    const u = (s - t0) / PULO_AR, vy = 1 - 2 * u;
    pose = u < 0.5 ? mixPose(agachado, subindo, suave(u / 0.12)) : subindo;
    if (u > 0.4) pose = mixPose(subindo, caindo, suave((u - 0.4) / 0.25));
    pose.y = -4 * PULO_ALT * u * (1 - u) * escalaPx;
    pose.vento = [0, mix(0.6, -2.2, (1 - vy) / 2)];
    pose.rotulo = vy > 0 ? 'pular' : 'cair';
  } else if (s < t1 + 0.14) pose = mixPose(pousando, parado, suave((s - t1) / 0.14));
  else pose = parado;
  if (s >= t1 && s < t1 + 0.04) pose = pousando;
  pose.rotulo = pose.rotulo || (s < t0 ? 'pular (impulso)' : s < t1 + 0.14 ? 'pouso' : 'idle');
  return pose;
}

// dash do GDD: 300 px em 0,2 s
const DASH_PX = 300, DASH_T = 0.2;
function poseDash(p, t) {
  const s = p * 1.4, t0 = 0.1, t1 = t0 + DASH_T, t2 = t1 + 0.2;
  const ida = DASH_PX * ALTURA_CURUPIRA_LOCAL / ALTURA_CURUPIRA_JOGO;
  const parado = poseParado((t * 0.6) % 1, t);
  const qP = pt(-2, -44), oP = ombrosDe(qP, -6);
  const prepara = { ...parado, quadril: qP, inclina: -6, pes: [pe(-12), pe(14)], maos: [pendura(oP.longe, 1.0, 40), pendura(oP.perto, 1.2, 40)], ex: 'determinado', escala: [1.05, 0.95] };
  const qD = pt(0, -46), oD = ombrosDe(qD, 38);
  const dash = { quadril: qD, inclina: 38, pes: [pe(-30, -10, 30), pe(-18, -4, 20)], maos: [soma(oD.longe, pt(-34, 12)), soma(oD.perto, pt(-30, 20))], cabeca: { inc: -22 }, ex: 'determinado', vento: [-3, 0.2], saia: 40, agita: 2, escala: [1.18, 0.88] };
  const qF = pt(-4, -45), oF = ombrosDe(qF, -14);
  const freio = { quadril: qF, inclina: -14, pes: [pe(-14, 0, -10), pe(22, 0, -15)], maos: [soma(oF.longe, pt(-48, -12)), soma(oF.perto, pt(60, 8))], bracoL: [66, 70], cotovelo: [-1, 1], cabeca: { inc: 4 }, ex: 'determinado', vento: [1, -0.6], saia: -12 };
  let pose, x;
  if (s < t0) { pose = mixPose(parado, prepara, suave(s / t0)); x = 0; }
  else if (s < t1) { pose = mixPose(prepara, dash, suave((s - t0) / 0.05)); x = ida * (s - t0) / DASH_T; pose.rotulo = 'dash'; pose.fantasmas = true; }
  else if (s < t2) { pose = mixPose(dash, freio, suave((s - t1) / 0.06)); x = ida + 10 * suave((s - t1) / 0.2); pose.poeira = true; }
  else { pose = mixPose(freio, { ...parado, ex: 'convencido' }, suave((s - t2) / 0.2)); x = ida + 10; }
  pose.x = x - (ida + 10) / 2;
  pose.rotulo = pose.rotulo || (s < t0 ? 'dash (impulso)' : s < t2 ? 'dash (freio)' : 'idle');
  return pose;
}

function poseAbaixar(p, t) {
  const parado = poseParado((t * 0.5) % 1, t);
  const b = Math.sin(t * 4);
  const q0 = pt(-2, -24 + b * 0.8), inc = 20;
  const agachado = {
    quadril: q0, inclina: inc, pes: [pe(-16), pe(18)],
    maos: [pt(13, -31 + b * 0.6), pt(19, -33 + b * 0.6)],
    cabeca: { dy: 3, inc: -14 }, ex: 'determinado', saia: -6, vento: [0, -0.5], olhar: Math.sin(t * 1.3) > 0.3 ? 0.4 : Math.sin(t * 1.3) < -0.3 ? -0.9 : 0
  };
  let pose;
  if (p < 0.1) pose = mixPose(parado, agachado, suave(p / 0.1));
  else if (p < 0.85) pose = agachado;
  else pose = mixPose(agachado, parado, suave((p - 0.85) / 0.15));
  pose.rotulo = p < 0.1 ? 'abaixar (descendo)' : p < 0.85 ? 'abaixar' : 'levantando';
  return pose;
}

function poseDerrota(p, t) {
  const qG = pt(-6, -54), oG = ombrosDe(qG, -22);
  const golpe = { quadril: qG, inclina: -22, pes: [pe(-12, -6, -20), pe(14, -10, -30)], maos: [soma(oG.longe, pt(-50, -36)), soma(oG.perto, pt(58, -30))], bracoL: [90, 90], cotovelo: [-1, 1], cabeca: { inc: -10 }, ex: 'dor', saia: -15, x: -8, y: -10 };
  const w = Math.sin(t * 3);
  const qS = pt(-10, -15), incS = -14 + w * 4, oS = ombrosDe(qS, incS);
  const sentado = { quadril: qS, inclina: incS, pes: [pe(26, 0, -30), pe(36, -2, -40)], maos: [pt(-32, -4), pt(-26, -4)], cabeca: { inc: w * 8 }, ex: 'tonto', saia: -10, x: -14, y: 0, vento: [0, -0.6] };
  let pose;
  if (p < 0.08) pose = mixPose(poseParado(0.25, t), golpe, suave(p / 0.04));
  else if (p < 0.3) pose = mixPose(golpe, sentado, suave((p - 0.08) / 0.22));
  else pose = sentado;
  pose.opacidade = p < 0.3 && Math.floor(p * 60) % 2 ? 0.45 : 1;
  pose.rotulo = p < 0.08 ? 'dano' : 'derrota';
  return pose;
}

const ANIMS = [
  { id: 'parado', nome: 'Parado', godot: 'idle', ciclo: 1.6, pose: poseParado, desc: 'Respira e balança no lugar. O cabelo nunca para de queimar.' },
  { id: 'correr', nome: 'Correr', godot: 'correr', ciclo: 0.48, pose: poseCorrer, rolagem: 60 / (0.4 * 0.48), pegadas: true, desc: 'Inclinado para a frente, braços dobrados, um instante com os dois pés no ar. O fogo e a saia vão para trás.' },
  { id: 'atacar', nome: 'Atacar', godot: 'atacar', ciclo: 0.4, pose: poseAtacar, tiro: true, desc: 'Palma aberta à frente; a cada tiro a mão arma e dá um coice. 5 tiros por segundo, como o Tiro de Folha.' },
  { id: 'atacar_correndo', nome: 'Atacar correndo', godot: 'correr_atacar', ciclo: 0.48, pose: poseAtacarCorrendo, rolagem: 60 / (0.4 * 0.48), pegadas: true, tiro: true, desc: 'Pernas da corrida, braço de tiro esticado e o outro bombeando. Resolve o "desliza na pose parada" das pendências.' },
  { id: 'especial', nome: 'Especial', godot: 'especial', ciclo: 1.6, pose: poseEspecial, onca: 0.42, desc: 'Carrega a energia entre as mãos com cara de bravo, grita e empurra: sai a cabeça de onça do Instinto Selvagem.' },
  { id: 'pular', nome: 'Pular e cair', godot: 'pular / cair', ciclo: 1.5, pose: posePular, quadros: [0.05, 0.14, 0.26, 0.42, 0.55, 0.7, 0.84, 0.94].map(s => s / 1.5), desc: 'Altura e tempo do GDD (1100 px/s, 2800 px/s²) na escala do sprite de 245 px. Subindo, o fogo deita; caindo, ele estica.' },
  { id: 'dash', nome: 'Dash', godot: 'dash', ciclo: 1.4, pose: poseDash, vaiVolta: true, quadros: [0.04, 0.09, 0.12, 0.16, 0.2, 0.26, 0.33, 0.6].map(s => s / 1.4), desc: '300 px em 0,2 s, como no GDD. Corpo esticado, fantasmas e freio levantando poeira.' },
  { id: 'abaixar', nome: 'Abaixar', godot: 'abaixar', ciclo: 2.2, pose: poseAbaixar, desc: 'Agacha com as mãos nos joelhos e olha para os lados. O GDD diz que baixo não tem função na luta.' },
  { id: 'derrota', nome: 'Dano e derrota', godot: 'derrota', ciclo: 2.6, pose: poseDerrota, desc: 'Leva o golpe piscando, cai sentado e fica tonto, com estrelinhas e fumaça no cabelo.' }
];

/* Projéteis do Curupira */
function folhaTiro(c, t, dir = 1) {
  let s = '';
  for (let k = 1; k <= 3; k++) s += linha(D`M${c.x - dir * (10 + k * 7)} ${c.y + (k - 2) * 4} l${-dir * 10} 0`, '#CFE8A8', 2.2, ' opacity=".7"');
  return s + folha(c.x, c.y, -90 * dir + Math.sin(t * 30) * 12, 20, E5.folha[1]);
}
function oncaEnergia(c, r, t, dir = 1) {
  const X = x => c.x + dir * x;
  let s = elip(c, r * 1.6, r * 1.25, '#FFB43A', 0, ' opacity=".18"') + elip(c, r * 1.25, r * 1.0, '#FFC94A', 0, ' opacity=".3"');
  for (let k = 0; k < 4; k++) s += linha(D`M${X(-r * 0.8)} ${c.y + (k - 1.5) * r * 0.35} l${-dir * r * (1.1 + 0.6 * hash(k + Math.floor(t * 12)))} 0`, '#FFD86A', r * 0.16, ' opacity=".55"');
  for (const ox of [-0.4, 0.1]) {
    s += circ(pt(X(r * ox), c.y - r * 0.78), r * 0.28, '#FF9A1F') + circ(pt(X(r * ox), c.y - r * 0.76), r * 0.13, '#C2410C', 0);
  }
  s += elip(c, r, r * 0.84, '#FFA62B');
  // mandíbula aberta (rugido)
  s += forma(D`M${X(r * 0.2)} ${c.y + r * 0.3} Q${X(r * 0.8)} ${c.y + r * 1.0} ${X(r * 1.18)} ${c.y + r * 0.5} L${X(r * 0.95)} ${c.y + r * 0.32} Z`, '#7A1A0E', 2.6);
  s += forma(D`M${X(r * 0.98)} ${c.y + r * 0.46} L${X(r * 1.02)} ${c.y + r * 0.7} L${X(r * 0.88)} ${c.y + r * 0.5} Z`, '#FFFFFF', 1.4);
  s += elip(pt(X(r * 0.68), c.y + r * 0.12), r * 0.52, r * 0.32, '#FFD27A');
  s += forma(D`M${X(r * 0.98)} ${c.y + r * 0.22} L${X(r * 0.9)} ${c.y + r * 0.45} L${X(r * 0.8)} ${c.y + r * 0.26} Z`, '#FFFFFF', 1.4);
  s += elip(pt(X(r * 1.08), c.y - r * 0.02), r * 0.12, r * 0.09, CONTORNO, 0);
  // olho bravo
  s += elip(pt(X(r * 0.32), c.y - r * 0.2), r * 0.16, r * 0.12, '#FFFBEA', 2) + circ(pt(X(r * 0.36), c.y - r * 0.19), r * 0.06, CONTORNO, 0);
  s += linha(D`M${X(r * 0.1)} ${c.y - r * 0.42} L${X(r * 0.5)} ${c.y - r * 0.3}`, CONTORNO, 3.2);
  // rosetas
  for (const [x, y] of [[-0.55, -0.1], [-0.3, 0.35], [-0.65, 0.3], [0.0, -0.5], [-0.15, 0.05]]) {
    s += `<circle cx="${f(X(r * x))}" cy="${f(c.y + r * y)}" r="${f(r * 0.1)}" fill="none" stroke="#9A3412" stroke-width="2.4"/>`;
  }
  return s;
}
