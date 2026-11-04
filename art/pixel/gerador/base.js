/* base.js — geometria e traço compartilhados pelo Curupira, pelos chefes e pelas arenas. */
const CONTORNO = '#1A1210';
const TR = 3;
const TAU = Math.PI * 2;

const f = n => Math.round(n * 10) / 10;
const pt = (x, y) => ({ x, y });
const soma = (a, b) => pt(a.x + b.x, a.y + b.y);
const sub = (a, b) => pt(a.x - b.x, a.y - b.y);
const mul = (a, k) => pt(a.x * k, a.y * k);
const lerp = (a, b, u) => pt(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
const unit = a => { const d = Math.hypot(a.x, a.y) || 1; return pt(a.x / d, a.y / d); };
const rot = (a, graus) => {
  const r = graus * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return pt(a.x * c - a.y * s, a.x * s + a.y * c);
};
const P = a => `${f(a.x)} ${f(a.y)}`;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const mix = (a, b, u) => a + (b - a) * u;
const suave = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
// progresso de p dentro do trecho [a, b], de 0 a 1
const trecho = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const hash = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// template que arredonda os números do caminho
const D = (s, ...v) => s.reduce((a, str, i) => a + str + (i < v.length ? (typeof v[i] === 'number' ? f(v[i]) : v[i]) : ''), '');

const linha = (d, cor, w, extra = '') => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const forma = (d, cor, w = 2.4, extra = '') => `<path d="${d}" fill="${cor}" stroke="${CONTORNO}" stroke-width="${w}" stroke-linejoin="round"${extra}/>`;
const pelo = (d, cor, w) => linha(d, CONTORNO, w + 2.6) + linha(d, cor, w);
const circ = (c, r, cor, w = TR, extra = '') => `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(r)}" fill="${cor}"${w ? ` stroke="${CONTORNO}" stroke-width="${w}"` : ''}${extra}/>`;
const elip = (c, rx, ry, cor, w = TR, extra = '') => `<ellipse cx="${f(c.x)}" cy="${f(c.y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${cor}"${w ? ` stroke="${CONTORNO}" stroke-width="${w}"` : ''}${extra}/>`;
const grupo = (transform, conteudo, extra = '') => `<g transform="${transform}"${extra}>${conteudo}</g>`;

/* Membro "de mangueira": curva quadrática que dobra mais quanto mais perto ficam as pontas. */
function membro(a, b, L, lado, w, cor) {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 0.01;
  const h = Math.sqrt(Math.max(0, 3 * d * (L - d) / 8));
  const n = pt(-(b.y - a.y) / d, (b.x - a.x) / d);
  const c = soma(lerp(a, b, 0.5), mul(n, 2 * h * lado));
  const d2 = `M${P(a)} Q${P(c)} ${P(b)}`;
  return `<path d="${d2}" fill="none" stroke="${CONTORNO}" stroke-width="${f(w + TR * 2)}" stroke-linecap="round"/>` +
         `<path d="${d2}" fill="none" stroke="${cor}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
}

function folha(x, y, ang, len, cor) {
  const w = len * 0.42;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})">` +
    forma(D`M0 0 Q${w} ${len * 0.4} 0 ${len} Q${-w} ${len * 0.4} 0 0Z`, cor, 2.4) +
    `<path d="M0 3 L0 ${f(len * 0.8)}" stroke="${CONTORNO}" stroke-width="1.2" opacity=".5"/></g>`;
}

/* Labareda: base de a até b, crescendo na direção "cima", uma ponta por altura. */
function labareda(a, b, cima, alturas, t, vel, amp, cor, contorno = true, semente = 0) {
  const n = alturas.length, up = unit(cima), perp = pt(-up.y, up.x);
  let d = `M${P(a)}`;
  for (let i = 0; i < n; i++) {
    const b0 = lerp(a, b, i / n), b1 = lerp(a, b, (i + 1) / n), m = lerp(b0, b1, 0.5);
    const fase = t * vel + i * 1.9 + semente;
    const h = alturas[i] * (1 + 0.12 * Math.sin(fase * 1.7));
    const ponta = soma(soma(m, mul(up, h)), mul(perp, Math.sin(fase) * amp - h * 0.12));
    const ca = soma(soma(b0, mul(up, h * 0.55)), mul(perp, -h * 0.18));
    const cb = soma(soma(b1, mul(up, h * 0.45)), mul(perp, h * 0.12));
    d += ` Q${P(ca)} ${P(ponta)} Q${P(cb)} ${P(b1)}`;
  }
  return contorno
    ? `<path d="${d} Z" fill="${cor}" stroke="${CONTORNO}" stroke-width="${TR}" stroke-linejoin="round"/>`
    : `<path d="${d} Z" fill="${cor}"/>`;
}

/* Fogueira de três camadas (vermelho, laranja, amarelo) centrada em c. */
const CORES_FOGO = ['#E8360E', '#FF8A1F', '#FFD23A'];
function fogueira(c, larg, alt, t, { cima = pt(0, -1), n = 5, vel = 8, amp = 4, cores = CORES_FOGO, semente = 0, contorno = true } = {}) {
  const up = unit(cima), perp = pt(-up.y, up.x);
  const alturas = k => Array.from({ length: n }, (_, i) => alt * k * (0.5 + 0.5 * Math.sin(Math.PI * (i + 0.5) / n)) * (0.8 + 0.4 * hash(i + semente)));
  let s = '';
  [[1, 1], [0.78, 0.68], [0.52, 0.4]].forEach(([w, k], camada) => {
    const a = soma(c, mul(perp, -larg * w / 2)), b = soma(c, mul(perp, larg * w / 2));
    s += labareda(a, b, up, alturas(k), t, vel, amp * k, cores[camada], contorno && camada === 0, semente + camada * 3.1);
  });
  return s;
}

/* Fumaça: bolotas cinzentas que sobem e somem; u de 0 a 1 é a idade. */
function fumaca(base, u, tam, cor = '#6E625A', deriva = 30) {
  const c = soma(base, pt(Math.sin(u * 5) * 6 + deriva * u, -u * tam * 4));
  const r = tam * (0.5 + u);
  return `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(r)}" fill="${cor}" opacity="${f((1 - u) * 0.75)}"/>`;
}

/* Estrela de cinco pontas (tontura, brilho). */
function estrela(c, r, cor, ang = 0) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (ang - 90 + i * 36) * Math.PI / 180, rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${f(c.x + Math.cos(a) * rr)} ${f(c.y + Math.sin(a) * rr)} `;
  }
  return forma(d + 'Z', cor, 1.8);
}

/* Gota (suor, lágrima, água). */
function gota(c, r, cor = '#8FD3F4') {
  return forma(D`M${c.x} ${c.y - r * 1.8} Q${c.x + r * 1.1} ${c.y - r * 0.2} ${c.x} ${c.y + r} Q${c.x - r * 1.1} ${c.y - r * 0.2} ${c.x} ${c.y - r * 1.8}Z`, cor, 1.8) +
    `<circle cx="${f(c.x - r * 0.3)}" cy="${f(c.y - r * 0.1)}" r="${f(r * 0.25)}" fill="#FFFFFF" opacity=".8"/>`;
}

/* Chip de controle mental: o mesmo em todos os seres folclóricos. */
function chip(c, tam, t, ligado = true, ang = 0) {
  const h = tam / 2;
  let s = '';
  for (let k = -1; k <= 1; k++) {
    s += `<path d="M${f(-h - 5)} ${f(k * h * 0.5)} L${f(h + 5)} ${f(k * h * 0.5)} M${f(k * h * 0.5)} ${f(-h - 5)} L${f(k * h * 0.5)} ${f(h + 5)}" stroke="${CONTORNO}" stroke-width="2.4"/>`;
  }
  s += `<rect x="${f(-h)}" y="${f(-h)}" width="${f(tam)}" height="${f(tam)}" rx="4" fill="#7D848E" stroke="${CONTORNO}" stroke-width="${TR}"/>`;
  s += `<rect x="${f(-h * 0.6)}" y="${f(-h * 0.6)}" width="${f(tam * 0.6)}" height="${f(tam * 0.6)}" rx="2" fill="#2E333B"/>`;
  const pisca = ligado ? 0.55 + 0.45 * Math.sin(t * 6) : 0;
  s += `<circle r="${f(h * 0.32)}" fill="${ligado ? '#FF2A1A' : '#5A2A26'}"/>`;
  if (ligado) s += `<circle r="${f(h * 0.75)}" fill="#FF2A1A" opacity="${f(pisca * 0.35)}"/>`;
  return grupo(`translate(${f(c.x)} ${f(c.y)}) rotate(${f(ang)})`, s);
}

/* Faíscas de curto-circuito em volta de c. */
function faiscas(c, r, t, n = 5) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i + Math.floor(t * 14)) * TAU, d = r * (0.4 + hash(i * 3 + Math.floor(t * 14)));
    const p = soma(c, pt(Math.cos(a) * d, Math.sin(a) * d));
    s += linha(D`M${p.x} ${p.y} l${Math.cos(a) * 8} ${Math.sin(a) * 8}`, '#FFE14A', 3);
  }
  return s;
}
