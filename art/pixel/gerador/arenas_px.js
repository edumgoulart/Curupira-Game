/* arenas_px.js — as quatro arenas desenhadas direto em 480×270, no mesmo pixel dos personagens.
   Cada arena devolve o fundo e a frente de um quadro (t em segundos, de 0 a 2: o laço tem 2 s,
   então tudo que mexe repete a cada 2 s). Fundo em planos: quanto mais longe, mais perto da cor
   do céu e com menos contraste; a neblina entre os planos separa um do outro. O meio da arena,
   onde se luta, fica mais liso e escuro que os personagens, para eles se destacarem. */

const LACO_ARENA = 2, QUADROS_ARENA = 16;
// beiras da areia do Boto, na linha do chão (a água fica para fora delas; o jogo põe as paredes aí)
const AREIA_BOTO = [86, 370];
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// pontilhado ordenado: liga o pixel quando u passa o limiar da matriz (u de 0 a 1)
const pontilha = (x, y, u) => u > (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
// fase de 0 a 1 que dá uma volta a cada laço (k voltas)
const volta = (t, k = 1) => (t / LACO_ARENA * k) % 1;

/* ---------- peças ---------- */
// céu em faixas, pontilhado só na passagem de uma faixa para a próxima
function ceuPx(cam, cores, y0, y1, borda = 0.5) {
  const n = cores.length;
  for (let y = y0; y < y1; y++) {
    const f = (y - y0) / (y1 - y0) * n, i = Math.min(n - 1, Math.floor(f)), u = clamp((f - i - (1 - borda)) / borda, 0, 1);
    for (let x = 0; x < ARENA_W; x++) cam.set(x, y, i < n - 1 && pontilha(x, y, u) ? cores[i + 1] : cores[i]);
  }
}
// neblina: faixa que vai enchendo para baixo (inverte = para cima), com a borda ondulando
function nevoaPx(cam, y0, y1, cor, { cheia = 1, ondula = 0, fase = 0, inverte = false, x0 = 0, x1 = ARENA_W } = {}) {
  for (let x = x0; x < x1; x++) {
    const o = ondula * (Math.sin(x * 0.031 + fase * TAU) * 0.6 + Math.sin(x * 0.083 - fase * TAU * 2) * 0.4);
    for (let y = Math.floor(y0 + (inverte ? 0 : o)); y < y1 + (inverte ? o : 0); y++) {
      let u = (y - y0) / (y1 - y0);
      if (inverte) u = 1 - u;
      if (pontilha(x, y, clamp(u, 0, 1) * cheia)) cam.set(x, y, cor);
    }
  }
}
// tufo de folhas: bola de borda recortada, luz em cima e à esquerda, salpicos de folha
// liso = fumaça: sem recorte nem salpico, e a borda some em pontilhado
function tufoPx(cam, cx, cy, r, c, sem = 0, liso = false) {
  const R = Math.ceil(r * 1.2) + 1;
  for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy);
    if (liso) {
      if (d > r || !pontilha(x, y, (r - d) / 2.5)) continue;
      // fumaça: luz só por cima, em faixa reta (luz em diagonal vira risco de chuva)
      cam.set(x, y, dy < -r * 0.55 ? c.luz : dy > r * 0.45 ? c.sombra : c.base);
      continue;
    }
    if (d > r * (1 + 0.11 * Math.sin(a * 5 + sem * 7) + 0.07 * Math.sin(a * 9 + sem * 3))) continue;
    const luz = -(dx * 0.55 + dy * 0.85) / r, h = hash(x * 0.71 + y * 3.13 + sem);
    let cor = luz > 0.4 ? c.luz : luz < -0.3 ? c.sombra : c.base;
    if (h > 0.9 && cor === c.base) cor = luz > 0 ? c.luz : c.sombra;
    else if (h < 0.07 && cor !== c.base) cor = c.base;
    cam.set(x, y, cor);
  }
}
// copa: tufos de baixo para cima (os de cima cobrem a parte de cima dos de baixo, que fica na sombra)
const TUFOS = [[-0.62, 0.22, 0.5], [0.62, 0.25, 0.5], [0, 0.38, 0.55], [-0.38, -0.22, 0.56], [0.4, -0.18, 0.55], [0, -0.5, 0.52]];
function copaPx(cam, cx, cy, r, c, sem = 0, contorno = null) {
  const parte = nova();
  TUFOS.forEach(([dx, dy, k], i) => tufoPx(parte, cx + dx * r + (hash(sem + i) - 0.5) * r * 0.25, cy + dy * r, r * k * (0.9 + 0.2 * hash(sem + i * 3)), c, sem + i));
  cam.colar(contorno ? parte.contornar(contorno) : parte);
}
// fileira de copas (a mata ao longe): enche até embaixo para não sobrar buraco
function mataPx(cam, yTopo, yBaixo, passo, r, c, sem = 0, alto = 8) {
  const parte = nova();
  for (let k = -1; k * passo < ARENA_W + passo; k++) {
    const h = hash(k * 1.3 + sem), x = k * passo + (hash(k + sem * 2) - 0.5) * passo * 0.6;
    copaPx(parte, x, yTopo + r - h * alto, r * (0.8 + 0.4 * hash(k * 2.1 + sem)), c, sem + k * 5);
  }
  for (let y = yTopo + r; y < yBaixo; y++) for (let x = 0; x < ARENA_W; x++) if (!parte.get(x, y)) parte.set(x, y, c.sombra);
  cam.colar(parte);
}
// tronco que afina para cima, entorta um pouco e abre em sapopemas no chão
function troncoArvPx(cam, x, yTopo, yBase, wBase, c, { sem = 0, curva = 3, raiz = 1, wTopo = wBase * 0.55, contorno = null } = {}) {
  const parte = nova();
  for (let y = Math.floor(yTopo); y <= yBase; y++) {
    const u = (y - yTopo) / (yBase - yTopo), aba = u > 0.78 ? ((u - 0.78) / 0.22) ** 2 * wBase * 0.9 * raiz : 0;
    const w = mix(wTopo, wBase, u), meio = x + Math.sin(u * 2.2 + sem) * curva;
    const xa = Math.round(meio - w / 2 - aba), xb = Math.round(meio + w / 2 + aba);
    for (let px = xa; px <= xb; px++) {
      const rel = (px - xa) / Math.max(1, xb - xa), col = Math.round(px - meio);
      let cor = rel < 0.2 ? c.luz : rel > 0.68 ? c.sombra : c.base;
      if (c.risco && rel > 0.1 && rel < 0.92 && hash(col * 1.7 + sem) > 0.62 && hash(Math.floor(y / 5) * 0.37 + col * 0.5 + sem) > 0.3) cor = rel > 0.68 ? c.risco : c.sombra;
      parte.set(px, y, cor);
    }
  }
  cam.colar(contorno ? parte.contornar(contorno) : parte);
}
// galho: traço que afina da base até a ponta
function galhoPx(cam, a, ctrl, b, w, cor) {
  const pts = curvaQ(a, ctrl, b, 10);
  for (let i = 0; i < pts.length - 1; i++) cam.traco([pts[i], pts[i + 1]], Math.max(1, w * (1 - i / pts.length)), cor);
}
// árvore inteira: tronco, dois galhos e copas
function arvorePx(cam, x, yBase, alt, wBase, ct, cf, sem = 0, { contorno = null, copa = 1, curva = 6 } = {}) {
  const topo = yBase - alt, r = alt * 0.2 * copa, meio = u => x + Math.sin((1 - u) * 2.2 + sem) * curva;
  const pontas = [];
  const ramo = (a, ang, L, w, nivel) => {
    const b = pt(a.x + Math.cos(rad(ang)) * L, a.y + Math.sin(rad(ang)) * L);
    galhoPx(cam, a, pt(mix(a.x, b.x, 0.5) + Math.cos(rad(ang + 90)) * L * 0.15, mix(a.y, b.y, 0.5)), b, w, ct.sombra);
    if (nivel > 0) for (const da of [-28, 24]) ramo(lerp(a, b, 0.7), ang + da + (hash(sem + ang) - 0.5) * 16, L * 0.55, w * 0.55, nivel - 1);
    else pontas.push(b);
  };
  [[-1, 0.5], [1, 0.64], [-1, 0.8]].forEach(([lado, u], i) => ramo(pt(meio(u), yBase - alt * u), lado < 0 ? 205 + i * 8 : -28, alt * (0.24 - i * 0.03), wBase * 0.32, 1));
  ramo(pt(meio(1), topo), -95 + Math.sin(sem) * 15, alt * 0.12, wBase * 0.3, 1);
  troncoArvPx(cam, x, topo, yBase, wBase, ct, { sem, contorno, curva, wTopo: wBase * 0.4 });
  if (copa > 0) pontas.forEach((b, i) => { if (hash(sem + i * 1.7) < 0.8) copaPx(cam, b.x, b.y, r * (0.5 + 0.35 * hash(sem + i)), cf, sem + 10 + i, contorno); });
}
// samambaia escura da frente: folhas em arco com folíolos
function samambaiaPx(cam, x0, y0, lado, cor, t, n = 6, tam = 38) {
  for (let f = 0; f < n; f++) {
    const a0 = rad(-80 + f * (75 / n)) , bal = Math.sin(volta(t) * TAU + f) * 0.04;
    let p = pt(x0, y0);
    for (let k = 0; k < tam; k++) {
      const u = k / tam, a = a0 + bal + u * 0.9;
      const q = pt(p.x + lado * Math.cos(a) * 1.3, p.y + Math.sin(a) * 1.3);
      cam.set(q.x, q.y, cor); cam.set(q.x, q.y + 1, cor);
      if (k % 2 === 0 && k > 3) { const l = Math.round(4 * Math.sin(u * Math.PI)) + 1; for (let j = 1; j <= l; j++) { cam.set(q.x - lado * j * 0.3, q.y - j, cor); cam.set(q.x + lado * j * 0.5, q.y + j * 0.8 + 1, cor); } }
      p = q;
    }
  }
}
function pedraPx(cam, x, y, w, cores) {
  const parte = new Camada(ARENA_W, ARENA_H);
  for (let i = 0; i < w; i++) for (let j = 0; j < w / 2; j++) if (Math.hypot((i - w / 2 + 0.5) / (w / 2), (j - w / 4) / (w / 4 + 0.5)) < 1) parte.set(x + i, y + j, j < 2 ? cores[0] : cores[1]);
  cam.colar(parte.contornar(cores[2]));
}
// chão em faixas com salpicos (pedrinhas, folhas, cinza)
function chaoPx(cam, cor, salpicos = [], semente = 0, x0 = 0, x1 = ARENA_W) {
  for (let x = x0; x < x1; x++) for (let y = CHAO_PX; y < ARENA_H; y++) {
    const d = y - CHAO_PX;
    let c = cor(d, x);
    for (const [dMin, lim, sc, tam] of salpicos) if (d >= dMin && hash(Math.floor(x / tam) * 0.37 + Math.floor(y / Math.max(1, tam - 1)) * 11.1 + semente + dMin) > lim) c = sc;
    cam.set(x, y, c);
  }
}
// palmeira: tronco curvo em anéis, coroa de folhas caídas com folíolos e cocos
function palmeiraPx(cam, x, yBase, h, inclina, t, c, sem = 0) {
  const p = nova(), topo = pt(x + inclina, yBase - h), ctrl = pt(x + inclina * 0.1, yBase - h * 0.55);
  const pts = curvaQ(pt(x, yBase), ctrl, topo, Math.ceil(h / 2));
  pts.forEach((q, i) => { const w = mix(3.2, 2.2, i / pts.length); p.traco([q, q], w, i % 2 ? c.tronco : c.troncoS); });
  const bal = Math.sin(volta(t) * TAU + sem) * 0.05;
  for (let f = 0; f < 7; f++) {
    const a = rad(-170 + f * 27 + (hash(sem + f) - 0.5) * 12) + bal, L = h * (0.42 + 0.12 * hash(sem + f * 2)), cai = L * 0.45;
    let ant = topo;
    for (let k = 1; k <= 14; k++) {
      const u = k / 14, q = pt(topo.x + Math.cos(a) * L * u, topo.y + Math.sin(a) * L * u + cai * u * u);
      p.traco([ant, q], 1.2, c.folhaS);
      const per = unit(pt(-(q.y - ant.y), q.x - ant.x)), lf = 3.4 * Math.sin(u * Math.PI * 0.9 + 0.2);
      for (const s of [-1, 1]) for (let j = 1; j <= lf; j++) p.set(q.x + per.x * s * j * 0.8, q.y + per.y * s * j * 0.8 + j * 0.5, s < 0 ? c.folhaL : c.folha);
      ant = q;
    }
  }
  for (const [dx, dy] of [[-1.5, 1.5], [1.5, 1.2], [0, 2.5]]) p.disco(topo.x + dx, topo.y + dy, 1.4, c.coco);
  cam.colar(c.contorno ? p.contornar(c.contorno) : p);
}
// fumaça do fundo: banco de tufos que balança devagar (sem contorno, cores perto do céu)
function bancoFumacaPx(cam, x, y, larg, alt, c, t, sem = 0) {
  const n = Math.max(3, Math.round(larg / alt * 2));
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), fase = volta(t) * TAU + sem + i;
    tufoPx(cam, x + (u - 0.5) * larg + Math.sin(fase) * 1.5, y - Math.sin(u * Math.PI) * alt * 0.5 + Math.cos(fase) * 1, alt * (0.45 + 0.25 * Math.sin(u * Math.PI)) * (0.85 + 0.3 * hash(sem + i)), c, sem + i * 3, true);
  }
}
const RAMPA_FOGO_LONGE = ['#4A2420', '#6A3224', '#84402A', '#9A5030', '#AE6236', '#BE7440'];

// fonte de 3×5 para placas
const FONTE_PX = {
  C: ['###', '#..', '#..', '#..', '###'], A: ['###', '#.#', '###', '#.#', '#.#'], M: ['#.#', '###', '###', '#.#', '#.#'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  '0': ['###', '#.#', '#.#', '#.#', '###'], '4': ['#.#', '#.#', '###', '..#', '..#'], ' ': ['...', '...', '...', '...', '...']
};
function textoPx(cam, txt, x, y, cor) {
  [...txt].forEach((ch, i) => (FONTE_PX[ch] || FONTE_PX[' ']).forEach((l, j) => [...l].forEach((c, k) => { if (c === '#') cam.set(x + i * 4 + k, y + j, cor); })));
}

const ARENAS_PX = {
  mula: {
    nome: 'Floresta Amazônica em chamas', x: X_CURUPIRA,
    desc: 'Clareira de terra queimada. Ao longe a mata pega fogo atrás de uma cortina de fumaça; o fogo do fundo é apagado e enfumaçado, para o da Mula brilhar mais.',
    quadro(t) {
      const cam = nova(), frente = nova(), v = volta(t);
      ceuPx(cam, ['#181016', '#1E1318', '#26161A', '#2E1A1C', '#38201E', '#44261F', '#502C22', '#5C3426'], 0, 178);
      for (let y = 178; y < CHAO_PX; y++) for (let x = 0; x < ARENA_W; x++) cam.set(x, y, '#5C3426');
      // bancos de fumaça altos, quase da cor do céu
      const fumAlta = { luz: '#3E2826', base: '#33221F', sombra: '#2A1C1C' };
      for (const [x, y, l, a, s] of [[70, 40, 150, 34, 1], [300, 26, 190, 40, 2], [470, 58, 140, 30, 3], [180, 92, 170, 30, 4]]) bancoFumacaPx(cam, x, y, l, a, fumAlta, t, s);
      // brilho do incêndio no horizonte, pontilhado subindo
      nevoaPx(cam, 120, 178, '#6A3A28', { inverte: false, cheia: 0.9, ondula: 3, fase: v });
      nevoaPx(cam, 150, 178, '#7A4430', { cheia: 0.8, ondula: 2, fase: v + 0.3 });
      // fogo bem longe, pequeno e apagado, dançando atrás da mata
      for (let k = 0; k < 11; k++) {
        const x = 14 + k * 44 + hash(k * 7) * 18, h = 8 + hash(k + 3) * 9;
        chamaPx(cam, x, 172, 270, 16 + hash(k) * 10, h, v * TAU + k, { n: 4, rampa: RAMPA_FOGO_LONGE, contorno: null, vel: 1, semente: k * 3 });
      }
      // mata queimada ao longe
      mataPx(cam, 160, CHAO_PX, 30, 11, { luz: '#3A2220', base: '#2E1C1C', sombra: '#281818' }, 3, 10);
      for (const [x, h] of [[40, 30], [132, 24], [214, 36], [300, 26], [372, 32], [446, 22]]) { troncoArvPx(cam, x, 172 - h, 176, 3, { luz: '#3A2220', base: '#2A1818', sombra: '#241616' }, { sem: x, curva: 1, raiz: 0, wTopo: 1 }); galhoPx(cam, pt(x, 172 - h * 0.6), pt(x + 6, 172 - h * 0.75), pt(x + 9, 172 - h * 0.9), 1.5, '#2A1818'); }
      nevoaPx(cam, 172, 214, '#4A2C26', { cheia: 0.75, ondula: 3, fase: v });
      // árvores do meio: troncos queimados com luz do fogo de um lado e copas ralas
      const tq = { luz: '#5A3426', base: '#2E1E1C', sombra: '#261818', risco: '#1E1214' }, cq = { luz: '#3E2A22', base: '#2E201C', sombra: '#261A18' };
      arvorePx(cam, 96, 216, 150, 12, tq, cq, 1.3, { copa: 0.8 });
      arvorePx(cam, 236, 216, 172, 10, tq, cq, 2.7, { copa: 0, curva: 8 });
      arvorePx(cam, 372, 216, 160, 13, tq, cq, 4.1, { copa: 0.7 });
      // fumaça baixa passando na frente das árvores do meio
      nevoaPx(cam, 150, 214, '#3E2622', { cheia: 0.45, ondula: 6, fase: v });
      for (const [x, y, l, a, s] of [[150, 176, 120, 18, 7], [400, 182, 130, 16, 8]]) bancoFumacaPx(cam, x, y, l, a, { luz: '#4A302A', base: '#3E2824', sombra: '#352220' }, t, s);
      // troncos grandes nas bordas, no escuro, com a luz do fogo na casca
      const tb = { luz: '#4E2C22', base: '#22161A', sombra: '#1C1216', risco: '#140C10' };
      troncoArvPx(cam, 16, -4, 216, 26, tb, { sem: 1, curva: 2, contorno: '#0E080A' });
      troncoArvPx(cam, 466, -4, 216, 30, tb, { sem: 5, curva: 2, contorno: '#0E080A' });
      for (const [x, y, r, s] of [[10, 8, 34, 1], [70, -6, 30, 2], [470, 4, 36, 3], [410, -8, 28, 4]]) copaPx(cam, x, y, r, { luz: '#2E1E1A', base: '#24181A', sombra: '#1C1216' }, s, '#0E080A');
      // chão: terra queimada com cinza e brasa apagada
      chaoPx(cam, d => d < 1 ? '#4E3424' : d < 2 ? '#3E2A20' : d < 3 ? '#2A1C18' : d < 16 ? '#5A3C2A' : d < 30 ? '#4A3024' : '#3C261E',
        [[4, 0.95, '#6E6058', 2], [6, 0.97, '#7A5238', 2], [18, 0.94, '#2E1E1A', 3]], 4);
      for (let x = 0; x < ARENA_W; x += 5) if (hash(x * 0.9) > 0.82) cam.set(x, CHAO_PX + 1, Math.sin(v * TAU + x) > 0.3 ? '#A8502A' : '#6A3424');
      pedraPx(cam, 70, 238, 9, ['#6A5E58', '#544842', '#241E1E']); pedraPx(cam, 330, 250, 12, ['#6A5E58', '#544842', '#241E1E']);
      // frente: brasas subindo devagar (cada uma vive um laço) e mato queimado nos cantos
      for (let i = 0; i < 18; i++) {
        const u = (v + hash(i * 5)) % 1, x = hash(i) * ARENA_W + Math.sin(u * TAU + i) * 5, y = 250 - hash(i * 3) * 120 - u * 50;
        if (u < 0.85) frente.set(x, y, u < 0.5 && i % 3 === 0 ? '#E07A34' : '#A8502A');
      }
      samambaiaPx(frente, -6, 272, 1, '#0E0808', t); samambaiaPx(frente, 486, 272, -1, '#0E0808', t + 1);
      return { cam, frente };
    }
  },
  cuca: {
    nome: 'Floresta da Cuca', x: X_CURUPIRA,
    desc: 'Mata fechada de noite, azulada e com neblina, ao pé da árvore oca da Cuca, com o caldeirão borbulhando entre as raízes, cogumelos que brilham e vaga-lumes.',
    quadro(t) {
      const cam = nova(), frente = nova(), v = volta(t);
      ceuPx(cam, ['#090C18', '#0C1020', '#101628', '#141C30', '#182238', '#1C2840'], 0, CHAO_PX);
      // lua atrás das copas, com halo pontilhado
      for (let y = 10; y < 80; y++) for (let x = 350; x < 440; x++) { const d = Math.hypot(x - 396, y - 40); if (d < 30 && pontilha(x, y, (30 - d) / 30 * 0.7)) cam.set(x, y, '#22304C'); }
      { const lua = nova(); lua.disco(396, 40, 13, '#C6D2DE'); lua.disco(392, 36, 3, '#AEBCCC'); lua.disco(401, 45, 2.2, '#AEBCCC'); lua.disco(398, 33, 1.4, '#AEBCCC'); cam.colar(lua); }
      // árvores longe: troncos finos e copas da cor da noite
      const cLonge = { luz: '#1E2A40', base: '#18223A', sombra: '#151E34' };
      for (const [x, w, s] of [[30, 6, 1], [96, 5, 2], [150, 7, 3], [330, 6, 4], [410, 5, 5], [452, 7, 6]]) troncoArvPx(cam, x, 0, 206, w, cLonge, { sem: s, curva: 5, raiz: 0.5, wTopo: w * 0.6 });
      mataPx(cam, -14, 10, 34, 20, cLonge, 9, 12);
      nevoaPx(cam, 120, 200, '#22304A', { cheia: 0.85, ondula: 5, fase: v });
      // árvores do meio, com barba-de-velho pendurada
      const tm = { luz: '#2C3444', base: '#222A38', sombra: '#1C2230', risco: '#181C28' }, cm = { luz: '#24303C', base: '#1E2834', sombra: '#18202C' };
      for (const [x, w, s] of [[62, 11, 1], [150, 9, 2], [338, 10, 3], [424, 12, 4]]) {
        troncoArvPx(cam, x, 0, 216, w, tm, { sem: s, curva: 7, wTopo: w * 0.55 });
        const lado = s % 2 ? 1 : -1, a = pt(x + Math.sin(0.6 * 2.2 + s) * 7, 70 + s * 6);
        galhoPx(cam, a, pt(a.x + lado * 14, a.y - 4), pt(a.x + lado * 26, a.y - 26), w * 0.4, tm.sombra);
      }
      mataPx(cam, -6, 24, 40, 18, cm, 4, 14);
      for (let k = 0; k < 14; k++) { const x = 8 + k * 34 + hash(k) * 12, l = 10 + hash(k + 2) * 26; for (let y = 20; y < 20 + l; y++) { const xx = x + Math.round(Math.sin(y * 0.3 + v * TAU + k) * 0.8); cam.set(xx, y, '#2A3C3A'); if (y % 4 === 0) cam.set(xx + 1, y, '#22302E'); } }
      nevoaPx(cam, 150, 214, '#26344C', { cheia: 0.5, ondula: 4, fase: v + 0.5 });
      // a árvore oca, grande e torta, com raízes abertas no chão
      const ta = { luz: '#4A3C4C', base: '#362C3A', sombra: '#2A2230', risco: '#221A28' };
      // galhões saindo do alto para os dois lados, sumindo nas copas
      for (const [a, c, b, w] of [[pt(222, 40), pt(180, 30), pt(140, -6), 16], [pt(256, 30), pt(300, 22), pt(330, -8), 14], [pt(236, 10), pt(226, 0), pt(220, -10), 18]]) { const g = nova(); galhoPx(g, a, c, b, w, ta.base); sombraB(g, ta.base, ta.sombra, ta.luz, 2); cam.colar(g.contornar('#120E16')); }
      troncoArvPx(cam, 240, -4, 218, 70, ta, { sem: 2, curva: 9, raiz: 1.1, wTopo: 46, contorno: '#120E16' });
      // nós da casca e musgo
      for (const [x, y, rx, ry] of [[214, 96, 5, 7], [262, 140, 4, 6], [232, 50, 3, 5]]) { elipse(cam, x, y, rx, ry, ta.risco); elipse(cam, x - 1, y - 1, rx - 2, ry - 2, '#1A1420'); cam.set(x - rx + 1, y, ta.luz); }
      for (const [x0, x1, alt] of [[196, 150, 12], [284, 336, 14], [210, 118, 8], [272, 366, 8]]) {
        const r = nova(); galhoPx(r, pt(x0, CHAO_PX - 6), pt(mix(x0, x1, 0.4), CHAO_PX - alt), pt(x1, CHAO_PX + 1), 7, ta.base);
        sombraB(r, ta.base, ta.sombra, ta.luz, 1); for (const [x, y] of r.pixels()) if (r.get(x, y) === ta.luz && hash(x * 3.1) > 0.4) r.set(x, y, '#2E4A44'); cam.colar(r.contornar('#120E16'));
      }
      // o oco, com o brilho verde do caldeirão lá dentro
      const oco = nova(); elipse(oco, 240, 182, 19, 30, '#0C0A12');
      for (let y = 182; y < CHAO_PX; y++) for (let x = 221; x < 260; x++) if (Math.abs(x - 240) < 19) oco.set(x, y, '#0C0A12');
      const pulso = 0.5 + 0.5 * Math.sin(v * TAU * 2);
      for (const [x, y] of oco.pixels()) if (oco.get(x, y)) { const d = Math.hypot((x - 240) / 1.2, y - 208); if (pontilha(x, y, clamp((30 - d) / 22, 0, 1) * (0.7 + 0.3 * pulso))) oco.set(x, y, '#1E3A2A'); }
      cam.colar(oco.contornar('#4A3C4C'));
      // caldeirão no fogo baixo
      chamaPx(cam, 240, CHAO_PX, 270, 24, 8, v * TAU * 2, { n: 5, vel: 1, rampa: ['#8A2A1A', '#B8441E', '#D86A28', '#E89040', '#F0B060', '#F0B060'] });
      const cal = nova();
      elipse(cal, 240, CHAO_PX - 13, 21, 11, '#26242C'); elipse(cal, 240, CHAO_PX - 23, 22, 4, '#3A3842');
      for (let x = 223; x < 257; x++) cal.set(x, CHAO_PX - 12, '#34323C');
      cal.set(229, CHAO_PX - 17, '#4E4C58'); cal.set(229, CHAO_PX - 16, '#4E4C58');
      cam.colar(cal.contornar('#0A080C'));
      elipse(cam, 240, CHAO_PX - 23, 18, 2.6, '#3EA83A'); elipse(cam, 236, CHAO_PX - 24, 8, 1, '#8ADA6A');
      for (let i = 0; i < 4; i++) { const u = (v * 2 + i / 4) % 1, x = 228 + hash(i) * 24; const b = nova(); if (u < 0.75) b.disco(x, CHAO_PX - 24 - u * 6, 1 + u * 1.8, '#3EA83A'); else for (let a = 0; a < 8; a++) b.set(x + Math.cos(a) * 4, CHAO_PX - 30 + Math.sin(a) * 2, '#8ADA6A'); cam.colar(b.contornar('#0E3A14')); }
      // frascos e cogumelos que brilham nas raízes
      frascoPx(cam, pt(160, CHAO_PX - 7), PCU.roxo, t, true); frascoPx(cam, pt(170, CHAO_PX - 4), PCU.magia, t); frascoPx(cam, pt(320, CHAO_PX - 9), PCU.azul, t, true);
      for (const [x, y, k] of [[128, CHAO_PX, 1], [137, CHAO_PX, 0.6], [350, CHAO_PX, 1], [360, CHAO_PX, 0.7], [205, CHAO_PX - 9, 0.6]]) {
        const c = nova(), aceso = Math.sin(v * TAU + x) > -0.3;
        c.carimbo(k > 0.8 ? ['.cccc.', 'cCcccc', 'ccccCc', '..ss..', '..ss..'] : ['.cc.', 'cCcc', '.ss.'], x - 3, y - (k > 0.8 ? 5 : 3), { c: aceso ? '#4EC8C0' : '#3A9A98', C: '#B8F4EC', s: '#8AA8B0' });
        cam.colar(c.contornar('#0A1418'));
      }
      // chão: terra escura com musgo azulado
      chaoPx(cam, d => d < 1 ? '#2E4A44' : d < 2 ? '#22383A' : d < 3 ? '#1A2830' : d < 18 ? '#2C2630' : d < 32 ? '#241F2A' : '#1C1822',
        [[4, 0.96, '#3A3440', 2], [5, 0.97, '#2E4A44', 2], [20, 0.94, '#141018', 3]], 9);
      nevoaPx(cam, 196, 222, '#2E3C56', { cheia: 0.55, ondula: 3, fase: v });
      // frente: vaga-lumes, neblina rasteira e samambaias
      for (let i = 0; i < 14; i++) {
        const x = hash(i * 2) * ARENA_W + Math.sin(v * TAU + i) * 8, y = 70 + hash(i * 4) * 130 + Math.cos(v * TAU + i * 2) * 6, on = Math.sin(v * TAU * 2 + i * 1.7);
        if (on > 0) { frente.set(x, y, '#E8FF9A'); if (on > 0.75) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) frente.set(x + dx, y + dy, '#7AA83A'); }
      }
      for (let i = 0; i < 3; i++) { const x0 = ((v + i / 3) % 1) * 600 - 80, y = CHAO_PX + 4 + i * 7; for (let x = x0; x < x0 + 110; x++) { const u = 1 - Math.abs((x - x0) / 55 - 1); if (pontilha(Math.round(x), y, u * 0.6)) frente.set(x, y, '#5E7090'); if (pontilha(Math.round(x), y + 1, u * 0.35)) frente.set(x, y + 1, '#5E7090'); } }
      samambaiaPx(frente, -6, 272, 1, '#060A10', t); samambaiaPx(frente, 486, 272, -1, '#060A10', t + 1);
      return { cam, frente };
    }
  },
  boto: {
    nome: 'Encontro das águas', x: X_CURUPIRA_BOTO,
    desc: 'Faixa de areia estreita entre duas águas que não se misturam: azul de um lado, barrenta do outro, e a mata na outra margem. O Boto fica na água e salta por cima da areia.',
    quadro(t) {
      const cam = nova(), frente = nova(), v = volta(t);
      ceuPx(cam, ['#5A96C2', '#649FC8', '#70AACC', '#7EB4D2', '#8EBED6', '#A0C8DA', '#B6D4DC', '#CCE0DE'], 0, 166);
      const sol = nova(); sol.disco(402, 38, 13, '#FFF0B0'); sol.disco(402, 38, 10, '#FFFADC'); cam.colar(sol);
      for (let y = 16; y < 62; y++) for (let x = 376; x < 430; x++) { const d = Math.hypot(x - 402, y - 38); if (d > 13 && d < 22 && pontilha(x, y, (22 - d) / 9 * 0.5)) cam.set(x, y, '#C8E0E0'); }
      // nuvens: tufos claros com a barriga reta e sombreada
      for (const [x0, y, e, s] of [[60, 34, 1.1, 1], [210, 20, 1.3, 2], [320, 64, 0.8, 3], [460, 28, 1, 4]]) {
        const n = nova(), x = x0 + Math.sin(v * TAU + s) * 1.5;
        for (const [dx, dy, r] of [[-16, 3, 7], [-6, -2, 9], [6, -4, 10], [17, 2, 7], [0, 4, 8]]) tufoPx(n, x + dx * e, y + dy * e, r * e, { luz: '#FFFFFF', base: '#F2F2EC', sombra: '#D6DCDE' }, s + dx);
        for (const [px, py] of n.pixels()) if (n.get(px, py) && py > y + 6 * e) n.apagar(px, py);
        cam.colar(n);
      }
      // mata da outra margem: um plano azulado ao longe e um mais verde na frente
      mataPx(cam, 140, 168, 22, 8, { luz: '#9CC0BA', base: '#8CB2AE', sombra: '#80A6A4' }, 2, 8);
      for (const [x, h, s] of [[120, 30, 1], [300, 34, 2], [420, 26, 3]]) { troncoArvPx(cam, x, 160 - h, 160, 2, { luz: '#7E9E96', base: '#76968E', sombra: '#6E8E88' }, { sem: s, raiz: 0, curva: 1, wTopo: 1 }); copaPx(cam, x, 160 - h, 9, { luz: '#94BAB2', base: '#86ACA6', sombra: '#7CA29E' }, s); }
      mataPx(cam, 150, 172, 26, 10, { luz: '#7EA678', base: '#6A946A', sombra: '#5A845E' }, 5, 9);
      palmeiraPx(cam, 34, 168, 40, -6, t, { tronco: '#8A7452', troncoS: '#6E5A40', folha: '#5A8A50', folhaL: '#7AA864', folhaS: '#44703E', coco: '#5A4026' }, 1);
      palmeiraPx(cam, 452, 168, 46, 7, t, { tronco: '#8A7452', troncoS: '#6E5A40', folha: '#5A8A50', folhaL: '#7AA864', folhaS: '#44703E', coco: '#5A4026' }, 2);
      palmeiraPx(cam, 474, 170, 32, 4, t, { tronco: '#8A7452', troncoS: '#6E5A40', folha: '#5A8A50', folhaL: '#7AA864', folhaS: '#44703E', coco: '#5A4026' }, 3);
      // as duas águas: reflexo escuro da mata embaixo da margem e brilhos correndo
      for (let y = 170; y < CHAO_PX + 6; y++) for (let x = 0; x < ARENA_W; x++) {
        const azul = x < 238 + Math.sin(y * 0.3 + v * TAU) * 3, u = (y - 170) / 14;
        const cor = azul ? (pontilha(x, y, u) ? '#3E7EB6' : '#4E8A9A') : (pontilha(x, y, u) ? '#9A6E42' : '#7E6A48');
        cam.set(x, y, cor);
      }
      for (let i = 0; i < 22; i++) { const y = 176 + (i % 7) * 7, x = ((i * 53 + v * 40 * (i % 2 ? 1 : -1)) % 500 + 500) % 500 - 10, w = 3 + (i % 3) * 2; for (let k = 0; k < w; k++) cam.set(x + k, y, x < 238 ? '#7CBCE0' : '#BC9264'); }
      // a península de areia: mais estreita, molhada na beira, com marcas do vento
      const areia = nova(), bordaE = AREIA_BOTO[0], bordaD = AREIA_BOTO[1];
      for (let y = CHAO_PX; y < ARENA_H; y++) for (let x = 0; x < ARENA_W; x++) {
        const abre = (y - CHAO_PX) * 0.5, xa = bordaE - abre, xb = bordaD + abre;
        if (x <= xa || x >= xb) continue;
        const d = y - CHAO_PX, beira = Math.min(x - xa, xb - x);
        let c = d < 1 ? '#F0D290' : d < 2 ? '#E8C47E' : beira < 4 ? '#C49A5C' : '#DCB06C';
        if (d > 4 && beira >= 4 && Math.sin(x * 0.18 + d * 0.9 + Math.sin(x * 0.05) * 2) > 0.93) c = '#C8985A';
        if (d > 3 && beira >= 4 && hash(Math.floor(x / 2) + y * 7.3) > 0.97) c = '#EED6A0';
        areia.set(x, y, c);
      }
      cam.colar(areia.contornar('#9A7240'));
      pedraPx(cam, 132, 244, 9, ['#C8BCAA', '#A89A8A', '#5E544A']); pedraPx(cam, 300, 256, 7, ['#C8BCAA', '#A89A8A', '#5E544A']);
      // frente: as águas da frente cobrindo a base do Boto, com espuma batendo na areia
      for (let y = CHAO_PX + 4; y < ARENA_H; y++) for (let x = 0; x < ARENA_W; x++) {
        const abre = (y - CHAO_PX) * 0.5, ond = Math.round(Math.sin(x * 0.15 + v * TAU) * 1.2);
        if (y < AGUA_Y + ond) continue;
        const fundo = y > AGUA_Y + 14 && pontilha(x, y, (y - AGUA_Y - 14) / 30);
        if (x <= AREIA_BOTO[0] - abre) frente.set(x, y, y < AGUA_Y + 2 + ond ? '#8CD0EE' : fundo ? '#285E92' : '#2F6FA8');
        else if (x >= AREIA_BOTO[1] + abre) frente.set(x, y, y < AGUA_Y + 2 + ond ? '#C9A070' : fundo ? '#74502E' : '#8A5E36');
      }
      for (const [x0, l] of [[AREIA_BOTO[0], -1], [AREIA_BOTO[1], 1]]) for (let i = 0; i < 6; i++) {
        const y = AGUA_Y + 3 + i * 7, k = Math.round(Math.sin(v * TAU + i) * 2), xb = x0 + l * ((y - CHAO_PX) * 0.5 + 1 + k);
        frente.set(xb, y, '#FFFFFF'); frente.set(xb + l, y, '#FFFFFF'); frente.set(xb + l * 3, y + 1, '#E0F2FA');
      }
      for (let i = 0; i < 8; i++) { const u = (v + i / 8) % 1, x = (i % 2 ? 20 : 420) + hash(i) * 50, y = AGUA_Y + 10 + hash(i + 4) * 30; if (u < 0.5) { frente.set(x + u * 8, y, i % 2 ? '#8CD0EE' : '#C9A070'); frente.set(x + u * 8 + 1, y, i % 2 ? '#8CD0EE' : '#C9A070'); } }
      return { cam, frente };
    }
  },
  maquina: {
    nome: 'Câmara de testes', x: X_CURUPIRA,
    desc: 'Sala branca de painéis, limpa e fria, com o trilho e os alçapões no teto, pistões no piso e uma janela de observação para a floresta derrubada lá fora.',
    quadro(t) {
      const cam = nova();
      // parede de painéis brancos com juntas; a faixa de baixo é de metal escuro
      for (let y = 0; y < CHAO_PX; y++) for (let x = 0; x < ARENA_W; x++) {
        const px = x % 24, py = (y - 2) % 24, junta = px === 0 || py === 0;
        const escuro = y > 150, tom = hash(Math.floor(x / 24) * 3.1 + Math.floor((y - 2) / 24) * 7.7);
        cam.set(x, y, escuro ? (junta ? '#22262C' : tom > 0.8 ? '#3A3F48' : '#30353C') : junta ? '#A8B2BC' : tom > 0.85 ? '#D6DCE0' : '#E6EAED');
      }
      // luzes nas juntas (faixas acesas)
      for (let y = 26; y < 150; y += 48) for (let x = 0; x < ARENA_W; x++) if (Math.floor(x / 24) % 3 === 0) cam.set(x, y, '#FFFFFF');
      // janela de observação com a floresta derrubada
      const jx = 28, jy = 34, jw = 120, jh = 60;
      for (let y = jy; y < jy + jh; y++) for (let x = jx; x < jx + jw; x++) cam.set(x, y, y < jy + 30 ? '#8A8078' : '#A8947C');
      for (let k = 0; k < 7; k++) { const x = jx + 8 + k * 16 + Math.floor(hash(k) * 6), h = 4 + Math.floor(hash(k + 2) * 4); for (let y = jy + jh - 14 - h; y < jy + jh - 12; y++) for (let i = 0; i < 6; i++) cam.set(x + i, y, i === 0 ? '#8A6A48' : '#6B4A2E'); }
      for (let x = jx; x < jx + jw; x++) for (let y = jy + jh - 12; y < jy + jh; y++) cam.set(x, y, '#9A7A58');
      for (let i = 0; i < 3; i++) { const u = (volta(t) + i / 3) % 1; fumacaPx(cam, jx + 30 + i * 30 + u * 10, jy + jh - 16 - u * 30, 3 + u * 6, { claro: '#9A8E84', medio: '#8A7E74', contorno: '#7A6E64' }); }
      for (let x = jx - 3; x < jx + jw + 3; x++) for (const y of [jy - 3, jy - 2, jy - 1, jy + jh, jy + jh + 1, jy + jh + 2]) cam.set(x, y, '#B9C2CA');
      for (let y = jy - 3; y < jy + jh + 3; y++) for (const x of [jx - 3, jx - 2, jx - 1, jx + 40, jx + 80, jx + jw, jx + jw + 1, jx + jw + 2]) cam.set(x, y, '#B9C2CA');
      for (let k = 0; k < 10; k++) { cam.set(jx + 8 + k, jy + 6 + k, '#C8C0B8'); cam.set(jx + 88 + k, jy + 4 + k, '#C8C0B8'); }
      // placa da câmara
      for (let y = 104; y < 116; y++) for (let x = 40; x < 82; x++) cam.set(x, y, '#2E3440');
      textoPx(cam, 'CAMARA 04', 43, 107, '#E9EDF0'); cam.set(48, 105, '#E9EDF0'); cam.set(47, 106, '#E9EDF0'); cam.set(49, 106, '#E9EDF0');
      // teto: faixa, trilho e alçapões fechados
      for (let y = 0; y < MAQ_TETO + 2; y++) for (let x = 0; x < ARENA_W; x++) cam.set(x, y, y < MAQ_TETO - 4 ? '#DDE3E8' : y < MAQ_TETO - 2 ? '#3A3F48' : y < MAQ_TETO ? '#5C636E' : '#22262C');
      for (const x of ALCAPOES) for (let k = -9; k <= 9; k++) { cam.set(x + k, MAQ_TETO + 1, '#22262C'); if (Math.abs(k) === 9) for (let y = MAQ_TETO - 4; y < MAQ_TETO + 2; y++) cam.set(x + k, y, '#22262C'); }
      for (const x of ALCAPOES) for (let k = -8; k <= 8; k += 4) cam.set(x + k, MAQ_TETO - 4, '#F2C230');
      // piso: placas cinza claras com juntas, faixas de perigo nas pontas
      for (let y = CHAO_PX; y < ARENA_H; y++) for (let x = 0; x < ARENA_W; x++) {
        const d = y - CHAO_PX, junta = x % 16 === 0 || d === 0 || d === 18;
        let cor = d < 1 ? '#5C636E' : junta ? '#AEB8C2' : d < 18 ? '#DDE3E8' : '#C9D0D6';
        if (x < 10 || x > 469) cor = (Math.floor((x + d) / 4) % 2) ? '#F2C230' : '#2E3440';
        cam.set(x, y, cor);
      }
      // LED piscando de "gravando"
      if (Math.floor(t * 2) % 2) for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) cam.set(456 + k, 24 + j, PMQ.laser);
      return { cam, frente: null };
    }
  }
};
