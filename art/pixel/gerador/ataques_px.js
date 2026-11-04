/* ataques_px.js — ataques que o Curupira ganha dos chefes (básicos e especiais) e os
   respingos do impacto. Cada um é um projétil só; quantos saem e para onde é do jogo.
   Todos olham para a direita (o jogo espelha). Centro do desenho = centro do projétil. */

const PAT = {
  veneno: '#5BD13A', venenoL: '#B6F27A', venenoD: '#2A7A22',
  abismo: '#14285A', abismoD: '#0A1636', abismoL: '#3B82C4'
};

// Feitiço Perseguidor: bolinha verde com miolo roxo e rastro de faíscas (o jogo gira na direção do voo)
function feiticoJogadorPx(cam, cx, cy, t) {
  const f = Math.floor(t * 16) % 2;
  for (let i = 0; i < 4; i++) {
    const x = cx - 5 - i * 2.2, y = cy + Math.sin(t * 20 + i * 1.7) * 1.4;
    cam.set(x, y, i < 2 ? PCU.magiaL : PCU.magia);
    if (i === 1 && f) cam.set(x, y - 1, PCU.roxoL);
  }
  const b = nova();
  b.disco(cx, cy, 3.6, PCU.magia);
  b.disco(cx + 0.4, cy, 2, PCU.roxo);
  b.set(cx - 1, cy - 2, PCU.magiaL); b.set(cx, cy - 2, PCU.magiaL);
  b.set(cx + 1, cy, f ? PCU.roxoL : PCU.roxo);
  cam.colar(b.contornar(PCU.magiaO));
}

// Bolha d'Água: bolha que balança (achata e estica) com brilho em cima
function bolhaAguaPx(cam, cx, cy, t, r = 5.5) {
  const k = Math.sin(t * TAU * 2.5) * 0.5, b = nova();
  elipse(b, cx, cy, r + k, r - k, PBO.agua);
  elipse(b, cx + 0.5, cy + 0.8, (r + k) * 0.7, (r - k) * 0.65, PBO.aguaL);
  elipse(b, cx + 0.5, cy + 1.2, (r + k) * 0.45, (r - k) * 0.4, PBO.agua);
  b.set(cx - 2, cy - 3, PM.branco); b.set(cx - 3, cy - 2, PM.branco); b.set(cx - 2, cy - 2, PM.branco);
  cam.colar(b.contornar(PBO.aguaO));
}

// Bolha Abissal: bolha grande e escura com um redemoinho girando por dentro
function bolhaAbissalPx(cam, cx, cy, u, r = 10) {
  const b = nova();
  b.disco(cx, cy, r, PAT.abismoL);
  b.disco(cx, cy, r - 1.5, PAT.abismo);
  for (let braco = 0; braco < 3; braco++) {
    for (let k = 0; k < 14; k++) {
      const d = k / 14 * (r - 2), a = u * TAU + braco * TAU / 3 + k * 0.32;
      b.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d, k < 5 ? PAT.abismoD : PBO.agua);
    }
  }
  b.disco(cx, cy, 1.5, PAT.abismoD);
  b.set(cx - r * 0.5, cy - r * 0.6, PM.branco); b.set(cx - r * 0.5 + 1, cy - r * 0.6, PM.branco); b.set(cx - r * 0.5, cy - r * 0.6 + 1, PBO.aguaL);
  cam.colar(b.contornar(PBO.aguaO));
  // bolhinhas subindo em volta
  for (let i = 0; i < 2; i++) { const v = (u + i * 0.5) % 1; cam.set(cx + (i ? 1 : -1) * (r + 2), cy + r - v * 2 * r, PBO.aguaL); }
}

// Poção Maldita: frasco grande de veneno com uma caveira no rótulo (o jogo não gira; o desenho gira)
function pocaoMalditaPx(cam, cx, cy) {
  const b = nova();
  b.disco(cx, cy + 2, 5.5, PCU.vidro);
  b.disco(cx, cy + 2, 4.5, PAT.veneno);
  for (let x = cx - 4; x <= cx + 4; x++) b.set(x, cy - 1, PAT.venenoL);   // superfície do líquido
  for (let y = cy - 6; y <= cy - 3; y++) for (let x = cx - 1; x <= cx + 1; x++) b.set(x, y, PCU.vidro);
  for (let x = cx - 1; x <= cx + 1; x++) { b.set(x, cy - 8, PCU.rolha); b.set(x, cy - 7, PCU.rolha); }
  b.set(cx - 3, cy, PM.branco); b.set(cx - 3, cy + 1, PM.branco);
  b.carimbo(['.WWW.', 'WkWkW', '.WWW.', '.W.W.'], cx - 2, cy + 1, { W: PM.branco, k: PAT.venenoD });
  cam.colar(b.contornar(PCU.vidroO));
}

// Canhão Flamejante: pedaço do meio do feixe (16 px, emenda lado a lado) e a boca do canhão
const FEIXE_W = 16;
function feixeMeioPx(cam, x0, cy, k) {
  for (let i = 0; i < FEIXE_W; i++) {
    const fase = (i / FEIXE_W) * TAU, borda = 6 + Math.round(Math.sin(fase * 2 + k * TAU / 4) * 0.9 + Math.sin(fase + k * TAU / 4 * 3) * 0.6);
    for (let d = -borda - 1; d <= borda + 1; d++) {
      const a = Math.abs(d);
      const cor = a > borda ? PM.fogo1 : a === borda ? PM.fogo2 : a > borda - 2 ? PM.fogo3 : a > 2 ? PM.fogo4 : a > 0 ? PM.fogo5 : PM.fogo6;
      cam.set(x0 + i, cy + d, cor);
    }
    // labaredas correndo dentro do feixe
    if ((i + k * 4) % 8 < 2) { cam.set(x0 + i, cy - 3, PM.fogo5); cam.set(x0 + i, cy + 3, PM.fogo5); }
  }
}
function feixeBocaPx(cam, cx, cy, t) {
  const b = nova(), r = 9 + Math.floor(t * 24) % 2;
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU + t * 3, rr = i % 2 ? r * 0.7 : r * (1 + 0.25 * hash(i + Math.floor(t * 24)));
    b.traco([pt(cx, cy), pt(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)], 3, PM.fogo3);
  }
  b.disco(cx, cy, r * 0.65, PM.fogo4); b.disco(cx, cy, r * 0.42, PM.fogo5); b.disco(cx, cy, r * 0.2, PM.fogo6);
  cam.colar(b.contornar(PM.fogo1));
}

function exportarAtaquesJogador() {
  efeito('curupira', 'feitico', [0, 0.06, 0.12, 0.18].map(t => em((c, x, y) => feiticoJogadorPx(c, x, y, t))), 16, true, [C0.x, C0.y], 'aponta para a direita; o jogo gira na direção do voo');
  efeito('curupira', 'bolha_agua', [0, 0.1, 0.2, 0.3].map(t => em((c, x, y) => bolhaAguaPx(c, x, y, t))), 10, true, [C0.x, C0.y]);
  efeito('curupira', 'bolha_abissal', seq(6, (c, x, y, u) => bolhaAbissalPx(c, x, y, u)), 12, true, [C0.x, C0.y]);
  const frasco = em((c, x, y) => pocaoMalditaPx(c, x, y));
  efeito('curupira', 'pocao_maldita', [0, 1, 2, 3].map(v => girar90(frasco, v)), 12, true, [C0.x, C0.y], 'girando no voo');
  efeito('curupira', 'feixe_meio', [0, 1, 2, 3].map(k => em((c, x, y) => feixeMeioPx(c, x, y, k))), 16, true, [C0.x, C0.y], 'emendar lado a lado (16 px); o lado esquerdo é a emenda');
  efeito('curupira', 'feixe_boca', [0, 0.04, 0.08, 0.12].map(t => em((c, x, y) => feixeBocaPx(c, x, y, t))), 16, true, [C0.x, C0.y], 'na saída do feixe, na mão');
  efeito('curupira', 'respingo_agua', seq(6, (c, x, y, u) => { explosaoPx(c, x, y, u, 10, [PBO.agua, PBO.aguaL, PM.branco], PBO.aguaO); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; gotaPx(c, x + Math.cos(a) * (4 + 10 * u), y + Math.sin(a) * (4 + 10 * u) + 6 * u * u); } }), 18, false, [C0.x, C0.y]);
  efeito('curupira', 'respingo_veneno', seq(6, (c, x, y, u) => { explosaoPx(c, x, y, u, 10, [PAT.veneno, PAT.venenoL, PM.branco], PCU.magiaO); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.7, d = 5 + 9 * u; c.set(x + Math.cos(a) * d, y + Math.sin(a) * d, PAT.venenoD); c.set(x + Math.cos(a) * d + 1, y + Math.sin(a) * d, PAT.veneno); } }), 18, false, [C0.x, C0.y]);
}
