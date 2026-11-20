/* mapa_px.js — o mapa do mundo: visão de cima, em diagonal (uns 45°), como um tabuleiro.
   1440×810 px de arte (×4 = 5760×3240, a câmera segue o Curupira; a tela mostra 480×270 por vez).
   No meio, a samaúma do Curupira; dela saem trilhas de terra vermelha para as quatro áreas:
     - Mula (embaixo, à esquerda): mata pegando fogo; entra-se por um arco de castanheiras em chamas.
     - Cuca (em cima, à esquerda): mata fechada e escura, com névoa e a luz verde do caldeirão.
     - Boto (embaixo, à direita): o encontro das águas, como o desenho do Eduardo. O rio Negro
       (escuro) desce do alto, faz a curva e corre para a direita; o Solimões (barrento) sobe na
       diagonal de baixo e encosta nele por baixo, na ponta da praia de areia branca. Dali os dois
       seguem lado a lado até a borda do mapa, o Negro em cima e o Solimões embaixo, com praia
       nas margens do Negro e mata fechada em cima e embaixo. Da ponta da areia, olhando rio
       abaixo, o Negro fica à esquerda e o Solimões à direita: é a vista da luta (arenas_px.js,
       encontroDasAguasPx).
     - Máquina (em cima, à direita): o prédio da empresa, cercado, entre o Negro e o Solimões, com a
       mata derrubada em volta e o portão trancado até os três seres serem libertados. A trilha
       atravessa o rio Negro por uma ponte.
   As árvores são da Amazônia: castanheiras altas, embaúbas de tronco claro, touceiras de açaí e
   buritis na beira d'água. A samaúma do meio é a maior de todas.
   O mapa sai em partes:
     - fundo (16 quadros, laço de 2 s): chão, água, mata fechada, prédio, tudo que nunca fica
       na frente do Curupira e nunca muda com o progresso;
     - objetos: árvores, palmeiras, cerca, bandeiras, as criaturas libertadas... cada um com a base
       marcada; o jogo ordena pela altura (y-sort), então o Curupira passa atrás ou na frente deles.
       Alguns ficam numa camada fixa (z): o fogo da mata e a luz do caldeirão por baixo de tudo, a
       névoa e a fumaça por cima. Os que mudam com o progresso têm "mostrar": o fogo da Mula some
       depois que ela é libertada, a névoa da Cuca levanta, e cada criatura aparece na sua área.
   E uma máscara de onde dá para andar (andavel.png), tirada do mesmo desenho. */

const MAPA_W = 1440, MAPA_H = 810, QUADROS_MAPA = 16, LACO_MAPA = 2;
const voltaM = (t, k = 1) => (t / LACO_MAPA * k) % 1;
const CONTORNO_MAPA = '#14200E';

/* ---------- geometria ---------- */
const HUB = pt(720, 570);
const MAPA_INICIO = pt(720, 560);
const SAMAUMA = pt(720, 500);
// os rios: o Negro desce do alto, faz a curva e corre para a direita; o Solimões sobe na diagonal
// e encosta nele por baixo na ponta da areia (a entrada do Boto). Dali os dois correm lado a lado
// (cada um na sua faixa, coladas) até a borda, e a linha entre as duas águas fica onde elas se tocam
const ENCONTRO = pt(1245, 550);
const I_ENCONTRO = 9;   // o ponto do Negro onde ele passa a correr colado ao Solimões
const RIO_NEGRO = [pt(848, -24), pt(838, 92), pt(858, 206), pt(924, 308), pt(1030, 404), pt(1062, 466), pt(1098, 510), pt(1142, 532), pt(1190, 534),
  pt(1239, 528), pt(1306, 512), pt(1384, 490), pt(1474, 466)];
const RIO_SOLIMOES = [pt(1132, 850), pt(1138, 792), pt(1160, 728), pt(1196, 668), pt(1236, 618), pt(1272, 582),
  pt(1318, 556), pt(1396, 534), pt(1486, 510)];
// a ponta de areia entre os dois rios, que avança até a linha das duas águas (entrada do Boto)
const ESPIGA = [pt(1146, 612), pt(1240, 556)];
const TRILHAS = {
  cuca: [HUB, pt(657, 507), pt(562, 428), pt(483, 368), pt(423, 323), pt(406, 307)],
  mula: [HUB, pt(618, 603), pt(488, 638), pt(384, 660), pt(318, 675), pt(290, 689)],
  boto: [HUB, pt(800, 598), pt(890, 632), pt(970, 652), pt(1050, 648), pt(1120, 634)],
  maquina: [HUB, pt(788, 528), pt(837, 432), pt(878, 348), pt(938, 303), pt(1043, 311), pt(1148, 318), pt(1148, 279), pt(1200, 249), pt(1250, 225)]
};
// a trilha da Cuca e a da Mula terminam na beira da mata (sem beco para dentro dela)
const CERCA = { x0: 1072, x1: 1380, y: 285, portao: [1128, 1168] };
const PREDIO = { x0: 1137, x1: 1347, teto: 54, frente: 120, base: 219, porta: [1230, 1269] };
const CALDEIRAO = pt(452, 310);
// onde cada área começa (o jogo mostra o nome e abre o painel), e onde o Curupira volta depois da luta
const ENTRADAS = {
  mula: { centro: pt(286, 691), raio: 22, volta: pt(369, 663) },
  cuca: { centro: pt(403, 304), raio: 22, volta: pt(468, 360) },
  boto: { centro: pt(1192, 584), raio: 16, volta: pt(1104, 638) },
  maquina: { centro: pt(1250, 231), raio: 20, volta: pt(1200, 255) }
};
const PORTAO = { retangulo: [CERCA.portao[0], CERCA.y - 8, CERCA.portao[1], CERCA.y + 3], aviso: pt(1148, 309), raio: 36 };
// as criaturas libertadas: onde ficam (base, nos pés ou na linha d'água) e o raio da conversa,
// contado da base: dá para falar chegando por qualquer lado, não só pela frente
const CRIATURAS = {
  mula: { base: pt(330, 612), raio: 54, progresso: 'fase1' },
  cuca: { base: pt(536, 318), raio: 44, progresso: 'fase2' },
  boto: { base: pt(1222, 642), raio: 60, progresso: 'fase3' }
};
// tamanho das criaturas no mapa: a mesma proporção do combate. Na luta o Curupira tem 52 px de
// altura; no mapa, 39. Os chefes da arena são reduzidos na mesma razão.
const ESCALA_CRIATURA = 39 / 52;

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
// as funções das arenas desenham numa camada do tamanho da arena (480×270); no mapa
// elas desenham numa camada da arena centrada no ponto, que depois é colada no lugar
function noMapa(cam, cx, cy, fn) {
  const l = new Camada(ARENA_W, ARENA_H), ox = Math.round(cx) - ARENA_W / 2, oy = Math.round(cy) - ARENA_H / 2;
  fn(l, cx - ox, cy - oy);
  cam.colar(l, ox, oy);
}
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
const TRN = { GRAMA: 0, TRILHA: 1, AREIA: 2, AGUA: 3, MATA: 4, MATA_CUCA: 5, MATA_FOGO: 6, QUEIMADO: 7, DEVASTADO: 8, PATIO: 9, PONTE: 11 };
const ANDAVEL = new Set([TRN.GRAMA, TRN.TRILHA, TRN.AREIA, TRN.QUEIMADO, TRN.DEVASTADO, TRN.PATIO, TRN.PONTE]);
const PAL_CHAO = {
  grama: ['#4C8C36', '#5A9A3C', '#68A844'], tufo: '#80C056', flores: ['#FFFFFF', '#F4F0C8'],
  terra: '#B8683A', terraL: '#C67C48', terraD: '#A65C34', terraBorda: '#86462A', pedrinha: '#D8A070',
  // areia branca das praias do rio Negro
  areia: '#EEE2C4', areiaD: '#E0D0AC', areiaMolhada: '#BFAE8A', concha: '#FFFFFF',
  // rio Negro: água cor de chá, quase preta no fundo e âmbar no raso; reflete o céu em azul
  negro: ['#16120E', '#221A14', '#4A3420'], negroL: '#4E5A66', negroEspuma: '#D6CCB8',
  // Solimões: barrento, cor de café com leite
  solimoes: ['#946E40', '#A27C4E', '#B48E5E'], solimoesL: '#B08A5A', solimoesEspuma: '#EADCBE', solimoesRedemoinho: '#BA9666',
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
  castanheira: { luz: '#6AAE4A', base: '#3E8A38', sombra: '#2A6430', contorno: CONTORNO_MAPA },
  castanheiraEsc: { luz: '#58A044', base: '#347A34', sombra: '#22562C', contorno: CONTORNO_MAPA },
  // embaúba: folhas grandes, verde-prateadas por baixo
  embauba: { luz: '#C2D6B0', base: '#86A87C', sombra: '#5A7A56', contorno: '#18281A' },
  samauma: { luz: '#62A848', base: '#3A8034', sombra: '#265C2A', contorno: '#0E1C0A' },
  broto: { luz: '#9AD86A', base: '#6AB04A', sombra: '#4A8A3A', contorno: '#1A2A10' }
};
const TRONCO_M = { luz: '#946240', base: '#6E462A', sombra: '#4C301C', risco: '#3A2416' };
const TRONCO_CAST = { luz: '#A08A72', base: '#7A6650', sombra: '#56463A', risco: '#3E3228' };
const TRONCO_EMB = { luz: '#E6E2D6', base: '#C6C0B0', sombra: '#948E80', anel: '#6E6A60' };
const TRONCO_QUEIM = { luz: '#4A3630', base: '#2E2220', sombra: '#201816', risco: '#140E0C' };

let TER = null;    // código do terreno por pixel
let BLOQ = null;   // 1 = algo desenhado em cima (árvore, prédio, pedra): não dá para andar
let AGUA_COR = null; // 0 = rio Negro, 1 = Solimões
let PROF = null;   // quão longe da margem (px), na água
let RIO_U = null;  // posição ao longo do rio (para a correnteza)
let LADO = null;   // no Amazonas: distância até a linha onde as duas águas se encontram (NaN fora)

// de que lado de um rio (na ordem da correnteza) fica o ponto: > 0 à direita de quem desce o rio
function ladoRio(p, rio) {
  const r = distPoli(p, rio), a = rio[r.i], b = rio[r.i + 1], d = unit(sub(b, a));
  return { lado: d.x * (p.y - a.y) - d.y * (p.x - a.x), r };
}

function classificar() {
  const N = MAPA_W * MAPA_H;
  TER = new Uint8Array(N); AGUA_COR = new Uint8Array(N); PROF = new Float32Array(N); RIO_U = new Float32Array(N); LADO = new Float32Array(N).fill(NaN);
  const trilhas = Object.values(TRILHAS);
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    const p = pt(x + 0.5, y + 0.5), i = y * MAPA_W + x;
    const n = ruido(x, y, 45, 1), n2 = ruido(x, y, 16, 2);
    // os dois rios: d < 0 é água
    const ln = ladoRio(p, RIO_NEGRO), rN = ln.r, ls = ladoRio(p, RIO_SOLIMOES), rS = ls.r;
    const dN = rN.d - (mix(14, 26, clamp((rN.i + rN.u) / I_ENCONTRO, 0, 1)) + (n2 - 0.5) * 3);
    const dS = rS.d - (mix(34, 26, clamp((rS.i + rS.u) / 6, 0, 1)) + (n2 - 0.5) * 3);
    // união suave das duas águas: a ponta da ilha entre os rios fica redonda, sem bico
    const kP = 64, hP = Math.max(kP - Math.abs(dN - dS), 0) / kP;
    const dAgua = Math.min(dN, dS) - hP * hP * kP / 4;
    let dTrilha = Infinity;
    for (const tr of trilhas) dTrilha = Math.min(dTrilha, distPoli(p, tr).d);
    const hwTrilha = 6 + (ruido(x, y, 10, 3) - 0.5) * 2.4;
    const borda = Math.min(x, y, MAPA_W - 1 - x, MAPA_H - 1 - y);
    const devast = x > 900 && y < 430 && dAgua > 24;
    const larguraBorda = devast ? 12 + 15 * n : 27 + 27 * n;
    const cuca = (x / 562) ** 2 + (y / 428) ** 2 < 1 + (n - 0.5) * 0.14;
    const fogo = (x / 333) ** 2 + ((MAPA_H - y) / 210) ** 2 < 1 + (n - 0.5) * 0.16;
    const queim = (x / 543) ** 2 + ((MAPA_H - y) / 347) ** 2 < 1 + (n - 0.5) * 0.14;
    const patio = x > CERCA.x0 && x < CERCA.x1 && y < CERCA.y;
    // as margens de lá: embaixo do Solimões e em cima do Negro, mata fechada (não se chega lá),
    // com uma faixa de margem (praia no Negro, verde no Solimões) para a mata não cobrir a água
    const lesteRios = ls.lado > 0 && x > 1100;
    const lesteAmazonas = lesteRios && dAgua > 22 + n * 16;
    const norteNegro = ln.lado < 0 && x > 1070 + n * 24 && y > 392 + n * 34 && dAgua > 26 + n * 12;
    const ep = distSeg(p, ESPIGA[0], ESPIGA[1]), naEspiga = ep.d < mix(30, 5, ep.u) + (n2 - 0.5) * 3 && dAgua > -1;
    // praia de areia branca larga nas duas margens do Negro e na margem de dentro do Solimões (a da
    // ponta); a margem de fora do Solimões tem barranco e mata
    const praia = dAgua < 22 + n * 14 && x > 950 + ruido(x, y, 20, 7) * 70 && y > 380 + ruido(x, y, 20, 8) * 40 && !lesteRios;
    let t = TRN.GRAMA;
    if (naEspiga) t = TRN.AREIA;
    else if (dAgua < 0) {
      t = TRN.AGUA; PROF[i] = -dAgua;
      if (dN < 10 && dS < 10) {
        // onde os dois correm colados: a linha entre as águas fica onde as faixas se tocam e
        // ondula descendo o rio a partir da ponta da areia
        const u = (rN.i + rN.u - I_ENCONTRO) * 120, k = clamp(u / 40, 0, 1);
        RIO_U[i] = u; LADO[i] = (dN - dS) / 2 + (Math.sin(u * 0.05) * 1 + (ruido(x, y, 26, 12) - 0.5) * 1) * k;
        AGUA_COR[i] = LADO[i] < 0 ? 0 : 1;
      }
      else if (dN < dS) { AGUA_COR[i] = 0; RIO_U[i] = (rN.i + rN.u) * 110; }
      else { AGUA_COR[i] = 1; RIO_U[i] = (rS.i + rS.u) * 110; }
    }
    else if (cuca) t = TRN.MATA_CUCA;
    else if (fogo) t = TRN.MATA_FOGO;
    else if (patio) t = TRN.PATIO;
    else if (lesteAmazonas || norteNegro) t = TRN.MATA;
    else if (borda < larguraBorda && dTrilha > hwTrilha + 6 && dAgua > 20) t = TRN.MATA;
    else if (praia) t = TRN.AREIA;
    else if (dTrilha < hwTrilha) t = TRN.TRILHA;
    else if (queim) t = TRN.QUEIMADO;
    else if (devast) t = TRN.DEVASTADO;
    TER[i] = t;
    if (t !== TRN.AGUA) PROF[i] = -dAgua;   // em terra: menos a distância até a água (areia molhada perto)
  }
  // ponte: onde a trilha da Máquina cruza o rio Negro
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    const i = y * MAPA_W + x;
    if (TER[i] === TRN.AGUA && distPoli(pt(x + 0.5, y + 0.5), TRILHAS.maquina).d < 8) TER[i] = TRN.PONTE;
  }
}
const ter = (x, y) => (x < 0 || y < 0 || x >= MAPA_W || y >= MAPA_H) ? TRN.MATA : TER[y * MAPA_W + x];
const ehAgua = (x, y) => { const v = ter(x, y); return v === TRN.AGUA || v === TRN.PONTE; };
const coresAgua = i => AGUA_COR[i] ? PAL_CHAO.solimoes : PAL_CHAO.negro;

function pintarChao(cam) {
  const P = PAL_CHAO;
  const nivel = (x, y, cores, e, sem) => {
    const v = ruido(x, y, e, sem) * (cores.length - 0.01) * 1.15 - 0.08;
    const k = clamp(Math.floor(v), 0, cores.length - 1), fr = v - Math.floor(v);
    return k < cores.length - 1 && pontilha(x, y, (fr - 0.6) / 0.4) ? cores[k + 1] : cores[k];
  };
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    const i = y * MAPA_W + x, t = TER[i], h = hash(x * 0.71 + y * 13.13);
    let c;
    switch (t) {
      case TRN.GRAMA: {
        c = nivel(x, y, P.grama, 33, 4);
        if (h > 0.986) c = P.tufo;
        if (ruido(x, y, 13, 5) > 0.78 && h > 0.965) c = P.flores[Math.floor(hash(x * 3.1 + y) * 2)];
        break;
      }
      case TRN.TRILHA: {
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const v = ter(x + dx, y + dy); return v !== TRN.TRILHA && v !== TRN.PONTE; });
        c = borda ? P.terraBorda : ruido(x, y, 5, 6) > 0.7 ? P.terraL : ruido(x, y, 7, 7) < 0.25 ? P.terraD : P.terra;
        if (!borda && h > 0.985) c = P.pedrinha;
        break;
      }
      case TRN.AREIA: {
        c = PROF[i] > -3 ? P.areiaMolhada : PROF[i] > -5 && pontilha(x, y, 0.5) ? P.areiaMolhada : ruido(x, y, 8, 8) > 0.62 ? P.areiaD : P.areia;
        if (h > 0.994) c = P.concha;
        break;
      }
      case TRN.AGUA: case TRN.PONTE: {
        const cores = coresAgua(i), pr = PROF[i];
        // raso na beira (o Negro fica âmbar, o Solimões mais claro), fundo no meio
        c = pr < 3 ? cores[2] : pr < 8 ? (pontilha(x, y, (8 - pr) / 5) ? cores[2] : cores[1]) : pr > 22 ? cores[0] : pr > 15 ? (pontilha(x, y, (pr - 15) / 7) ? cores[0] : cores[1]) : cores[1];
        break;
      }
      case TRN.MATA: c = P.mata; break;
      case TRN.MATA_CUCA: c = P.mataCuca; break;
      case TRN.MATA_FOGO: c = P.mataFogo; break;
      case TRN.QUEIMADO: {
        c = nivel(x, y, P.queimado, 21, 9);
        if (h > 0.975) c = P.cinza; else if (h < 0.02) c = P.carvao;
        break;
      }
      case TRN.DEVASTADO: {
        c = nivel(x, y, P.devastado, 24, 10);
        // marcas de pneu do trator
        const u = Math.sin(x * 0.013 + 1) * 45 + 180 - y;
        if (Math.abs(u) < 1 || Math.abs(u - 7) < 1) c = P.trilhoPneu;
        if (h > 0.985) c = P.devastado[2];
        break;
      }
      case TRN.PATIO: c = (x - CERCA.x0) % 16 === 0 || y % 16 === 0 ? P.patioJunta : h > 0.97 ? P.patioL : P.patio; break;
    }
    cam.set(x, y, c);
  }
  // margem dos rios: uma linha escura na grama e um degrau (barranco) visto de cima
  for (let y = 1; y < MAPA_H - 1; y++) for (let x = 1; x < MAPA_W - 1; x++) {
    const t = ter(x, y);
    if (t !== TRN.GRAMA && t !== TRN.DEVASTADO && t !== TRN.AREIA) continue;
    if (ter(x, y - 1) === TRN.AGUA || ter(x - 1, y) === TRN.AGUA || ter(x + 1, y) === TRN.AGUA) cam.set(x, y, escurecer(cam.get(x, y), 0.8));
    if (ter(x, y + 1) === TRN.AGUA) cam.set(x, y + 1, t === TRN.AREIA ? '#A89874' : '#3A5A2A');
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
  const passo = 16, blobs = [];
  for (let gy = -8; gy < MAPA_H + 18; gy += passo * 0.8) for (let gx = -8; gx < MAPA_W + 18; gx += passo) {
    const k = gx * 0.31 + gy * 1.7;
    const x = gx + (hash(k) - 0.5) * passo * 0.9 + ((gy / (passo * 0.8)) % 2 ? passo / 2 : 0), y = gy + (hash(k + 5) - 0.5) * passo * 0.6;
    const t = ter(clamp(Math.round(x), 0, MAPA_W - 1), clamp(Math.round(y), 0, MAPA_H - 1));
    if (t !== TRN.MATA && t !== TRN.MATA_CUCA && t !== TRN.MATA_FOGO) continue;
    const r = 13 + hash(k + 9) * 6;
    blobs.push({ x, y, t, r, sem: k });
  }
  blobs.sort((a, b) => a.y - b.y);
  for (const b of blobs) {
    const pal = b.t === TRN.MATA_CUCA ? COPA.cuca : b.t === TRN.MATA_FOGO ? COPA.fogo : COPA.verde;
    const R = Math.ceil(b.r * 1.3) + 3, local = new Camada(R * 2 + 1, R * 2 + 10);
    // tronco curto (só aparece na beira de baixo da mata)
    for (let yy = R + Math.round(b.r * 0.6); yy < R + Math.round(b.r * 0.6) + 7; yy++) for (let xx = R - 1; xx <= R + 1; xx++) local.set(xx, yy, xx === R - 1 ? TRONCO_M.base : TRONCO_M.sombra);
    tufoPx(local, R, R, b.r, pal, b.sem);
    local.contornar(pal.contorno);
    colarObjeto(cam, local, Math.round(b.x) - R, Math.round(b.y) - R);
    if (b.t === TRN.MATA_FOGO && hash(b.sem + 2) > 0.74) CHAMAS_MATA.push({ x: b.x, y: b.y - b.r * 0.4, larg: 10 + hash(b.sem) * 7, alt: 9 + hash(b.sem + 1) * 10, sem: b.sem });
  }
}

/* ---------- objetos ---------- */
// { nome, x, y, desenhar(cam, x, y, t), animado, quadros, mostrar, pe, z, transparente, caixa }
//   quadros: quantos quadros no laço de 2 s (padrão 16; menos para objetos grandes e lentos);
//   z: camada fixa (-9 = logo acima do chão, 9 = por cima de tudo); sem z, entra no y-sort;
//   transparente: a copa fica translúcida quando o Curupira passa atrás.
const OBJETOS = [];
function objeto(nome, x, y, desenhar, { animado = false, quadros = QUADROS_MAPA, mostrar = '', pe = [3, 2], sombra = null, z = null, transparente = false, caixa = [200, 180, 100, 160] } = {}) {
  OBJETOS.push({ nome, x: Math.round(x), y: Math.round(y), desenhar, animado, quadros, mostrar, pe, sombra, z, transparente, caixa });
}
// camada que cobre um retângulo do mapa (fogo, névoa, luz): o objeto fica no canto de cima
function sobreposicao(nome, x0, y0, x1, y1, desenhar, opcoes) {
  x0 = Math.floor(x0); y0 = Math.floor(y0);
  objeto(nome, x0, y0, (c, X, Y, t) => desenhar(c, t, x0, y0), { pe: [0, 0], caixa: [Math.ceil(x1) - x0, Math.ceil(y1) - y0, 0, 0], ...opcoes });
}

// castanheira: tronco alto e reto, copa larga e achatada lá em cima
function castanheiraMapa(cam, x, y, { sem = 0, h = 56, r = 24, pal = COPA.castanheira, tronco = TRONCO_CAST } = {}) {
  troncoArvPx(cam, x, y - h, y, 8, tronco, { sem, curva: 1.2, raiz: 1.3, wTopo: 4.5, contorno: pal.contorno });
  const topo = y - h;
  for (const [a, L] of [[-150, r * 0.7], [-30, r * 0.75], [-100, r * 0.4]]) {
    const b = pt(x + Math.cos(rad(a)) * L, topo + 6 + Math.sin(rad(a)) * L * 0.5);
    galhoPx(cam, pt(x, topo + 8), pt(mix(x, b.x, 0.5), topo + 4), b, 2.2, tronco.sombra);
  }
  copaPx(cam, x - r * 0.85, topo + 2, r * 0.7, pal, sem + 1, pal.contorno);
  copaPx(cam, x + r * 0.9, topo + 1, r * 0.72, pal, sem + 2, pal.contorno);
  copaPx(cam, x, topo - r * 0.35, r, pal, sem + 3, pal.contorno);
}
// embaúba: tronco fino e claro, com anéis, e guarda-chuvas de folhas grandes nas pontas
function embaubaMapa(cam, x, y, { sem = 0, h = 50 } = {}) {
  const p = nova(), c = TRONCO_EMB, topo = pt(x + (hash(sem) - 0.5) * 8, y - h);
  const pts = curvaQ(pt(x, y), pt(x + (hash(sem + 1) - 0.5) * 6, y - h * 0.5), topo, Math.ceil(h / 2));
  pts.forEach((q, i) => { p.traco([q, q], i < 3 ? 5 : 3.6, c.base); p.set(q.x - 1, q.y, c.luz); p.set(q.x + 1, q.y, c.sombra); if (i % 3 === 0) p.set(q.x, q.y, c.anel); });
  const pontas = [];
  for (const [a, L] of [[-155, 18], [-120, 20], [-90, 10], [-60, 20], [-25, 18]]) {
    const b = pt(topo.x + Math.cos(rad(a + (hash(sem + a) - 0.5) * 14)) * L, topo.y + Math.sin(rad(a)) * L * 0.6);
    galhoPx(p, topo, pt(mix(topo.x, b.x, 0.5), topo.y - 4), b, 2, c.sombra);
    pontas.push(b);
  }
  cam.colar(p.contornar(COPA.embauba.contorno));
  // cada folha é uma mão aberta (vista meio de cima): leque achatado com lobos
  const f = nova(), pal = COPA.embauba;
  for (const [k, b] of pontas.entries()) {
    for (let j = 0; j < 9; j++) {
      const a = rad(-200 + j * 27.5 + (hash(sem + k + j) - 0.5) * 10), L = 12 + hash(sem + j * 2 + k) * 4;
      const q = pt(b.x + Math.cos(a) * L, b.y + Math.sin(a) * L * 0.5 + 2);
      f.traco([b, lerp(b, q, 0.6), q], 4.4, j < 2 || j > 6 ? pal.sombra : j === 4 ? pal.luz : pal.base);
    }
    f.disco(b.x, b.y, 3, pal.luz);
  }
  cam.colar(f.contornar(pal.contorno));
}
// touceira de açaí: três ou quatro palmeiras finas e altas, com o cacho roxo embaixo da coroa
function acaiMapa(cam, x, y, t, sem) {
  const c = { tronco: '#8E8A74', troncoS: '#6A6656', folha: '#4E9A44', folhaL: '#7CC060', folhaS: '#2E6A30', coco: '#3A1E3A', contorno: CONTORNO_MAPA };
  const n = 3 + (hash(sem) > 0.5 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const dx = (k - (n - 1) / 2) * 5 + (hash(sem + k) - 0.5) * 3;
    palmeiraPx(cam, x + dx, y + (k % 2), 46 + hash(sem + k * 3) * 22, dx * 1.6 + (hash(sem + k * 5) - 0.5) * 6, t, c, sem + k);
  }
}
// buriti: palmeira grossa da beira d'água
function buritiMapa(cam, x, y, t, sem) {
  palmeiraPx(cam, x, y, 44 + hash(sem) * 12, (hash(sem + 1) - 0.5) * 10, t, {
    tronco: '#9A7A52', troncoS: '#76603E', folha: '#5AA048', folhaL: '#8ACC66', folhaS: '#346E30', coco: '#7A3A1E', contorno: CONTORNO_MAPA
  }, sem);
  palmeiraPx(cam, x + 3, y + 1, 30 + hash(sem + 2) * 8, 8, t, {
    tronco: '#9A7A52', troncoS: '#76603E', folha: '#5AA048', folhaL: '#8ACC66', folhaS: '#346E30', coco: '#7A3A1E', contorno: CONTORNO_MAPA
  }, sem + 7);
}
// árvore seca e queimada; brasa = 1 ainda tem brasa nos galhos, brasa = 0 já brotou folha nova
function arvoreQueimada(cam, x, y, t, sem, { brasa = 1, k = 1.6 } = {}) {
  const g = nova(), cor = TRONCO_QUEIM.base, alto = Math.round(18 * k);
  for (let yy = y - alto; yy <= y; yy++) for (let xx = x - 1; xx <= x + 2 + (yy > y - 4 ? 1 : 0); xx++) g.set(xx, yy, xx === x - 1 ? TRONCO_QUEIM.luz : cor);
  const pontas = [];
  for (const [a, L] of [[-130, 9], [-60, 10], [-95, 7]]) {
    const b = pt(x + Math.cos(rad(a + (hash(sem) - 0.5) * 20)) * L * k, y - alto * 0.78 + Math.sin(rad(a)) * L * k);
    galhoPx(g, pt(x, y - alto * 0.66), pt(mix(x, b.x, 0.5), y - alto * 0.84), b, 2.2, cor);
    pontas.push(b);
  }
  cam.colar(g.contornar('#0E0808'));
  if (brasa) {
    for (const p of pontas) cam.set(p.x, p.y, Math.sin(voltaM(t) * TAU * 2 + sem + p.x) > 0 ? '#FF8A2A' : '#C8401A');
    if (hash(sem * 1.9) > 0.7) noMapa(cam, pontas[1].x, pontas[1].y + 1, (l, X, Y) => chamaPx(l, X, Y, 270, 5, 5, voltaM(t) * TAU * 2 + sem, { n: 2, vel: 1, semente: sem }));
  } else {
    // folhinhas novas brotando nos galhos e no pé
    for (const p of pontas) if (hash(sem + p.x) > 0.25) { const f = nova(); tufoPx(f, p.x, p.y - 1, 3.2, COPA.broto, sem + p.y); cam.colar(f.contornar(COPA.broto.contorno)); }
    for (const dx of [-4, 4]) { cam.set(x + dx, y, COPA.broto.base); cam.set(x + dx, y - 1, COPA.broto.luz); }
  }
}
// castanheira grande pegando fogo (o arco da entrada da Mula)
function castanheiraEmChamas(cam, x, y, t, sem) {
  castanheiraMapa(cam, x, y, { sem, h: 50, r: 22, pal: COPA.fogo, tronco: TRONCO_QUEIM });
  const v = voltaM(t) * TAU * 2;
  for (const [dx, dy, l, a] of [[-18, -52, 12, 16], [16, -54, 13, 18], [0, -74, 12, 16], [-8, -62, 9, 12]])
    noMapa(cam, x + dx, y + dy, (l2, X, Y) => chamaPx(l2, X, Y, 270, l, a, v + sem + dx, { n: 3, vel: 1, semente: sem + dx }));
}
// a mesma castanheira depois do fogo: tronco carvão, galhos pelados e brotos verdes
function castanheiraRebrotando(cam, x, y, sem) {
  troncoArvPx(cam, x, y - 50, y, 8, TRONCO_QUEIM, { sem, curva: 1.2, raiz: 1.3, wTopo: 4.5, contorno: '#0E0606' });
  const g = nova(), pontas = [];
  for (const [a, L] of [[-155, 20], [-120, 16], [-60, 17], [-25, 20], [-90, 12]]) {
    const b = pt(x + Math.cos(rad(a)) * L, y - 48 + Math.sin(rad(a)) * L * 0.8);
    galhoPx(g, pt(x, y - 44), pt(mix(x, b.x, 0.5), y - 52), b, 2, TRONCO_QUEIM.base);
    pontas.push(b);
  }
  cam.colar(g.contornar('#0E0606'));
  for (const [i, p] of pontas.entries()) { const f = nova(); tufoPx(f, p.x, p.y - 2, 5 + hash(sem + i) * 2, COPA.broto, sem + i); cam.colar(f.contornar(COPA.broto.contorno)); }
}
function arvoreTorta(cam, x, y, sem) {
  const g = nova(), cor = '#2A2420';
  for (let k = 0; k <= 26; k++) { const xx = x + Math.round(Math.sin(k * 0.24 + sem) * 3); g.set(xx - 1, y - k, '#3E3430'); g.set(xx, y - k, cor); g.set(xx + 1, y - k, cor); g.set(xx + 2, y - k, cor); }
  galhoPx(g, pt(x, y - 19), pt(x - 12, y - 31), pt(x - 20, y - 27), 2.6, cor);
  galhoPx(g, pt(x + 1, y - 22), pt(x + 12, y - 30), pt(x + 18, y - 36), 2.2, cor);
  cam.colar(g.contornar(COPA.cuca.contorno));
  copaPx(cam, x + 3, y - 40, 18, COPA.cuca, sem, COPA.cuca.contorno);
  // barba-de-velho pendurada, com um brilho verde da luz do caldeirão
  for (const [dx, l] of [[-14, 10], [-6, 15], [4, 12], [13, 9], [-20, 7], [18, 6]]) for (let k = 0; k < l; k++) cam.set(x + dx + (k % 3 === 2 ? 1 : 0), y - 30 + k, k === l - 1 ? '#7ABF7A' : '#4A6A5A');
}
function samaumaMapa(cam, x, y) {
  troncoArvPx(cam, x, y - 46, y, 28, TRONCO_M, { sem: 3, curva: 2, raiz: 1.4, wTopo: 16, contorno: CONTORNO_MAPA });
  // copa enorme em três andares de tufos
  for (const [dx, dy, r, s] of [[-52, -66, 38, 1], [52, -63, 40, 2], [0, -87, 44, 3], [-27, -117, 36, 4], [30, -120, 37, 5], [0, -144, 33, 6]])
    copaPx(cam, x + dx, y + dy, r, COPA.samauma, s + 40, COPA.samauma.contorno);
  // cipós caindo da copa
  for (const [dx, l] of [[-64, 24], [-39, 33], [45, 27], [66, 18], [-12, 20]]) for (let k = 0; k < l; k++) {
    const yy = y - 57 + k, xx = x + dx + Math.round(Math.sin(k * 0.3) * 1.2);
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
    for (let yy = y - 11; yy <= y; yy++) {
      if (poste) c.set(x, yy, yy === y - 11 ? '#C8CED4' : '#6E767E');
      else if (yy === y - 10) c.set(x, yy, '#9AA2AA');   // arame de cima
      else if (yy > y - 10 && yy < y && (x + yy) % 3 === 0) c.set(x, yy, '#8A929A');   // tela
    }
  }
  cam.colar(c);
}
const MEIO_PORTAO = (CERCA.portao[1] - CERCA.portao[0]) / 2;
function portaoMapa(cam, aberto, xm, y) {
  const a = Math.round(xm - MEIO_PORTAO), b = Math.round(xm + MEIO_PORTAO);
  const c = new Camada(cam.W, cam.H);
  if (!aberto) {
    for (let x = a; x <= b; x++) for (let yy = y - 12; yy <= y; yy++) {
      const quadro = x === a || x === b || x === Math.round((a + b) / 2) || yy === y - 12 || yy === y;
      if (quadro) c.set(x, yy, '#4A5058'); else if ((x + yy) % 3 === 0) c.set(x, yy, '#8A929A');
    }
    cam.colar(c.contornar('#1A1C20'));
    // corrente e cadeado, e a placa de perigo
    const m = Math.round((a + b) / 2);
    for (let yy = y - 7; yy <= y - 4; yy++) { cam.set(m - 1, yy, '#C8CED4'); cam.set(m + 1, yy, '#C8CED4'); }
    cam.carimbo(['.ooo.', 'o...o', 'YYYYY', 'YYkYY', 'YYYYY'], m - 2, y - 8, { o: '#9AA2AA', Y: '#F2C230', k: '#1A1C20' });
    cam.carimbo(['RRRRRRR', 'RWWWWWR', 'RWRRRWR', 'RWWWWWR', 'RRRRRRR'], a + 3, y - 10, { R: '#C8261B', W: '#FFFFFF' });
  } else {
    // as duas folhas abertas para dentro do pátio
    for (const [x, dir] of [[a, 1], [b, -1]]) for (let k = 0; k < 9; k++) for (let yy = y - 12 - k; yy <= y - k; yy++) {
      const xx = x + dir * Math.round(k * 0.4), quadro = k === 0 || k === 8 || yy === y - 12 - k || yy === y - k;
      if (quadro) c.set(xx, yy, '#4A5058'); else if ((k + yy) % 3 === 0) c.set(xx, yy, '#8A929A');
    }
    cam.colar(c);
  }
}

/* ---------- prédio da Máquina (fundo) ---------- */
function predioMapa(cam) {
  const P = PREDIO, p = new Camada(MAPA_W, MAPA_H);
  // sombra do prédio no pátio, para a direita e para baixo
  sombraChao(cam, (P.x0 + P.x1) / 2 + 14, P.base + 3, (P.x1 - P.x0) / 2 + 8, 8);
  // telhado (a face de cima): laje clara com máquinas de ar
  for (let y = P.teto; y < P.frente; y++) for (let x = P.x0; x <= P.x1; x++) {
    const borda = y === P.teto || x === P.x0 || x === P.x1 || y === P.frente - 1;
    p.set(x, y, borda ? '#E2E6EA' : (x + y) % 16 === 0 ? '#B6BCC2' : '#C8CED4');
  }
  for (const [x, y] of [[P.x0 + 16, P.teto + 12], [P.x0 + 50, P.teto + 14], [P.x0 + 84, P.teto + 10], [P.x1 - 60, P.teto + 34]]) {
    for (let j = 0; j < 12; j++) for (let i = 0; i < 20; i++) p.set(x + i, y + j, j < 7 ? (i % 3 === 0 ? '#7E868E' : '#9AA2AA') : '#6E767E');
  }
  // fachada: concreto com faixas de janelas espelhadas
  for (let y = P.frente; y <= P.base; y++) for (let x = P.x0; x <= P.x1; x++) {
    const linha = (y - P.frente - 6) % 20, col = (x - P.x0 - 6) % 14;
    const janela = y > P.frente + 4 && y < P.base - 30 && linha >= 0 && linha < 11 && col >= 0 && col < 10;
    let c = x === P.x0 ? '#A0A8B0' : x === P.x1 ? '#5E666E' : y === P.frente ? '#B6BEC6' : '#7E868E';
    if (janela) c = (linha + col) % 9 < 3 ? '#9CD0F0' : linha < 3 ? '#4A82B4' : '#36689A';
    p.set(x, y, c);
  }
  // porta de vidro escuro, letreiro com o chip e degrau
  for (let y = P.base - 26; y <= P.base; y++) for (let x = P.porta[0]; x <= P.porta[1]; x++) {
    const meio = x === Math.round((P.porta[0] + P.porta[1]) / 2);
    p.set(x, y, x === P.porta[0] || x === P.porta[1] || y === P.base - 26 || meio ? '#2A2E34' : (x + y) % 7 < 2 ? '#4A6A8A' : '#1E2A38');
  }
  for (let y = P.base - 40; y < P.base - 29; y++) for (let x = P.porta[0] - 14; x <= P.porta[1] + 14; x++) p.set(x, y, y === P.base - 40 || y === P.base - 30 ? '#1A1C20' : '#2E3440');
  noMapa(p, (P.porta[0] + P.porta[1]) / 2, P.base - 35, (l, x, y) => chipPx(l, x, y, 0, true));
  // chaminé e antena no telhado
  for (let y = P.teto - 30; y < P.teto + 18; y++) for (let x = P.x1 - 24; x < P.x1 - 10; x++) p.set(x, y, Math.floor((y - P.teto + 30) / 7) % 2 ? '#C8261B' : '#E6EAED');
  for (let x = P.x1 - 24; x < P.x1 - 10; x++) p.set(x, P.teto - 30, '#2A2E34');
  for (let y = P.teto - 40; y < P.teto + 8; y++) p.set(P.x0 + 20, y, '#4A5058');
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
  const p = new Camada(MAPA_W, MAPA_H), r = 4 + Math.round(hash(sem) * 3);
  for (let yy = y - 5; yy <= y; yy++) for (let xx = x - r; xx <= x + r; xx++) p.set(xx, yy, xx < x - r + 2 ? '#8A5A34' : '#6B4428');
  elipse(p, x + 0.5, y - 5.5, r + 0.5, 2.4, '#D6A86E');
  p.set(x, y - 6, '#B88A54'); p.set(x + 1, y - 5, '#B88A54');
  p.contornar(CONTORNO_MAPA);
  colarObjeto(cam, p, 0, 0);
}
function pedraMapa(cam, x, y, w) {
  const p = new Camada(MAPA_W, MAPA_H);
  elipse(p, x, y - w * 0.3, w, w * 0.6, '#9A9890');
  elipse(p, x - w * 0.25, y - w * 0.5, w * 0.6, w * 0.3, '#C2BEB4');
  p.contornar('#2E2C28');
  colarObjeto(cam, p, 0, 0);
}
// moita baixa; algumas com helicônias (flor vermelha da beira da mata)
function arbustoMapa(cam, x, y, sem, pal = COPA.castanheiraEsc) {
  const p = new Camada(64, 64);
  tufoPx(p, 32, 26, 7 + hash(sem) * 2, pal, sem);
  tufoPx(p, 26, 29, 5, pal, sem + 1); tufoPx(p, 38, 29, 5, pal, sem + 2);
  if (hash(sem + 3) > 0.6) for (const [dx, dy] of [[-4, -3], [3, -5], [5, 0]]) p.carimbo(['r', 'R', 'y'], 32 + dx, 24 + dy, { r: '#E84A2A', R: '#B8301E', y: '#F2C84A' });
  p.contornar(pal.contorno);
  colarObjeto(cam, p, x - 32, y - 33);
}
function canoaMapa(cam, x, y) {
  const p = new Camada(MAPA_W, MAPA_H);
  elipse(p, x, y, 18, 4.5, '#8A5A34', -12);
  elipse(p, x, y - 1, 15, 2.6, '#5A3A20', -12);
  for (const k of [-7, 0, 7]) p.set(x + k, y - 1 - Math.round(k * -0.2), '#A8743E');
  p.contornar(CONTORNO_MAPA);
  colarObjeto(cam, p, 0, 0);
  // o remo largado na areia
  for (let k = 0; k < 16; k++) cam.set(x + 12 + k, y + 8 - Math.round(k * 0.3), k > 12 ? '#C8925A' : '#7A4A28');
}
function caldeiraoMapa(cam, x, y) {
  const p = new Camada(MAPA_W, MAPA_H);
  elipse(p, x, y - 5, 12, 8, '#26242C');
  elipse(p, x, y - 11, 12, 4, '#3A3842');
  elipse(p, x, y - 11, 9.5, 2.6, '#3EA83A');
  p.set(x - 7, y - 7, '#4E4C58'); p.set(x - 6, y - 6, '#4E4C58');
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
function ponteMapa(cam) {
  // tábuas atravessadas na direção da trilha, com corrimão nas beiras
  for (let y = 0; y < MAPA_H; y++) for (let x = 0; x < MAPA_W; x++) {
    if (TER[y * MAPA_W + x] !== TRN.PONTE) continue;
    const p = pt(x + 0.5, y + 0.5), r = distPoli(p, TRILHAS.maquina);
    const a = TRILHAS.maquina[r.i], b = TRILHAS.maquina[r.i + 1], dir = unit(sub(b, a));
    const ao = (p.x - a.x) * dir.x + (p.y - a.y) * dir.y;
    const beira = r.d > 6.6;
    cam.set(x, y, beira ? '#4A2A16' : Math.floor(ao) % 4 === 0 ? '#7A4A28' : (ao % 4) < 1.5 ? '#C8925A' : '#A8743E');
  }
}

/* ---------- as criaturas libertadas (os mesmos desenhos das lutas, sem o chip) ---------- */
// desenha um chefe da arena numa camada da arena e cola com a base (pés ou linha d'água) em (x, y)
function chefeNoMapa(cam, x, y, desenhar, X, Y) {
  const l = nova();
  desenhar(l);
  cam.colar(reduzir(l, ESCALA_CRIATURA, X, Y), Math.round(x - X), Math.round(y - Y));
}
// reduz uma camada pela fração f em volta de (ax, ay), sem misturar cores: cada pixel novo
// pega a cor que mais aparece no pedaço que ele cobre (o contorno escuro ganha nos empates)
function reduzir(l, f, ax, ay) {
  const r = new Camada(l.W, l.H), k = 3;
  if (l.x1 < 0) return r;
  const X0 = Math.floor(ax + (l.x0 - ax) * f) - 1, X1 = Math.ceil(ax + (l.x1 + 1 - ax) * f) + 1;
  const Y0 = Math.floor(ay + (l.y0 - ay) * f) - 1, Y1 = Math.ceil(ay + (l.y1 + 1 - ay) * f) + 1;
  for (let Y = Y0; Y <= Y1; Y++) for (let X = X0; X <= X1; X++) {
    const conta = new Map();
    let cheio = 0;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) {
      const sx = Math.floor(ax + (X + (i + 0.5) / k - ax) / f), sy = Math.floor(ay + (Y + (j + 0.5) / k - ay) / f);
      const c = sx >= 0 && sy >= 0 && sx < l.W && sy < l.H ? l.c[sy * l.W + sx] : 0;
      if (!c) continue;
      cheio++;
      conta.set(c, (conta.get(c) || 0) + 1);
    }
    if (cheio * 2 < k * k) continue;
    let melhor = 0, n = -1;
    for (const [c, v] of conta) if (v > n || (v === n && luzCor(CORES_LISTA[c]) < luzCor(CORES_LISTA[melhor]))) { melhor = c; n = v; }
    r.setI(X, Y, melhor);
  }
  return r;
}
function luzCor(cor) {
  const v = parseInt(cor.slice(1, 7), 16);
  return ((v >> 16) & 255) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11;
}
function mulaLivre(cam, x, y, t) {
  const R = mulaBase(t);
  R.X = 240; R.chip = false;
  chefeNoMapa(cam, x, y, l => mulaPx(l, R, t, '#2A201C'), 240, CHAO_PX);
}
function cucaLivre(cam, x, y, t) {
  const R = cucaBase(t);
  R.X = 240; R.chip = false; R.iris = PCU.irisCalma; R.sorriso = true;
  chefeNoMapa(cam, x, y, l => cucaPx(l, R, t, '#2E5A26'), 240, CHAO_PX);
}
function botoLivre(cam, x, y, t) {
  const R = botoBase(t);
  R.X = 240; R.chip = false; R.iris = PBO.irisCalma;
  chefeNoMapa(cam, x, y, l => {
    botoPx(l, R, t);
    // só a parte de fora d'água; embaixo, a sombra rosada no rio escuro
    for (const [px, py] of l.pixels()) if (py > AGUA_Y && l.get(px, py)) { if (py < AGUA_Y + 6 && (px + py) % 2) l.set(px, py, '#5A3A3A'); else l.apagar(px, py); }
  }, 240, AGUA_Y);
  // anéis na água em volta
  const v = voltaM(t);
  for (let k = 0; k < 2; k++) {
    const u = (v + k / 2) % 1, rx = (14 + u * 16) * ESCALA_CRIATURA, ry = rx * 0.32;
    for (let a = 0; a < TAU; a += 0.06) if (pontilha(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), 1 - u)) cam.set(x + Math.cos(a) * rx, y + 1 + Math.sin(a) * ry, PAL_CHAO.negroEspuma);
  }
}

/* ---------- montagem ---------- */
const FRASCOS = [[CALDEIRAO.x - 18, CALDEIRAO.y + 2, '#5AF07A'], [CALDEIRAO.x + 17, CALDEIRAO.y - 3, '#A06AF0'], [CALDEIRAO.x + 22, CALDEIRAO.y + 6, '#5AF07A'], [CALDEIRAO.x - 12, CALDEIRAO.y + 10, '#F06AA8']];
let MAPA_BASE = null, ANDA = null, AGUA_PIX = null, BRASAS = null;

function montarMapa() {
  if (MAPA_BASE) return;
  classificar();
  BLOQ = new Uint8Array(MAPA_W * MAPA_H);
  const cam = new Camada(MAPA_W, MAPA_H);
  pintarChao(cam);
  ponteMapa(cam);
  mataFechada(cam);

  // samaúma do Curupira e a placa no cruzamento
  objeto('samauma', SAMAUMA.x, SAMAUMA.y, (c, x, y) => samaumaMapa(c, x, y), { pe: [16, 5], sombra: [84, 20], transparente: true, caixa: [320, 240, 160, 228] });
  objeto('placa', 760, 586, (c, x, y) => placaMapa(c, x, y), { pe: [2, 1] });

  // Máquina: prédio, cerca, portão, trator e tocos da mata derrubada
  predioMapa(cam);
  for (const [x, y0, y1] of [[CERCA.x0, 20, CERCA.y], [CERCA.x1, 20, CERCA.y]]) {
    for (let y = y0; y <= y1; y++) {
      if ((y - y0) % 8 === 0) for (let k = 0; k < 11; k++) cam.set(x, y - k, k === 10 ? '#C8CED4' : '#6E767E');
      cam.set(x, y - 10, '#9AA2AA');
      if (y % 3 === 0) cam.set(x + 1, y - 5, '#8A929A');
    }
    // a cerca do lado fecha o pátio do alto do mapa até a cerca da frente (sem fresta nas pontas)
    for (let y = 0; y <= y1; y++) for (let k = -1; k <= 1; k++) BLOQ[y * MAPA_W + x + k] = 1;
  }
  const meioCerca = Math.round((CERCA.x1 - CERCA.x0) / 2);
  objeto('cerca', CERCA.x0 + meioCerca, CERCA.y, (c, x, y) => cercaMapa(c, x - meioCerca, x + meioCerca, y,
    [[x - meioCerca + CERCA.portao[0] - CERCA.x0, x - meioCerca + CERCA.portao[1] - CERCA.x0]]), { pe: [0, 0], caixa: [meioCerca * 2 + 12, 22, meioCerca + 6, 18] });
  for (let x = CERCA.x0; x <= CERCA.x1; x++) if (x < CERCA.portao[0] || x > CERCA.portao[1]) for (let y = CERCA.y - 2; y <= CERCA.y; y++) BLOQ[y * MAPA_W + x] = 1;
  const mPortao = Math.round((CERCA.portao[0] + CERCA.portao[1]) / 2);
  objeto('portao_fechado', mPortao, CERCA.y, (c, x, y) => portaoMapa(c, false, x, y), { mostrar: 'trancado', pe: [0, 0], caixa: [56, 26, 28, 22] });
  objeto('portao_aberto', mPortao, CERCA.y - 1, (c, x, y) => portaoMapa(c, true, x, y + 1), { mostrar: 'aberto', pe: [0, 0], caixa: [56, 34, 28, 29] });
  tratorMapa(cam, 978, 168);
  for (let k = 0; k < 70; k++) {
    const x = 915 + hash(k * 3.7) * 510, y = 30 + hash(k * 5.1) * 390;
    const t = ter(Math.round(x), Math.round(y));
    if (t !== TRN.DEVASTADO || distPoli(pt(x, y), TRILHAS.maquina).d < 18) continue;
    tocoMapa(cam, Math.round(x), Math.round(y), k);
  }

  // Mula: castanheiras grandes pegando fogo dos dois lados da trilha (o arco da entrada).
  // Depois que a Mula é libertada, o fogo apaga e elas rebrotam.
  for (const [x, y, s] of [[268, 654, 1], [338, 766, 2], [222, 640, 3], [258, 768, 4]]) {
    objeto('castanheira_fogo', x, y, (c, X, Y, t) => castanheiraEmChamas(c, X, Y, t, s), { animado: true, mostrar: 'nao_concluiu:fase1', pe: [5, 2], sombra: [22, 7], transparente: true });
    objeto('castanheira_rebrota', x, y, (c, X, Y) => castanheiraRebrotando(c, X, Y, s), { mostrar: 'concluiu:fase1', pe: [5, 2], transparente: true });
  }

  // Cuca: duas árvores tortas e escuras com barba-de-velho, uma de cada lado da entrada
  for (const [x, y, s] of [[430, 282, 5], [378, 330, 6]])
    objeto('arvore_cuca', x, y, (c, X, Y) => arvoreTorta(c, X, Y, s), { pe: [4, 2], sombra: [16, 6], transparente: true });

  // Cuca: caldeirão e frascos na beira da mata, ao lado da entrada
  caldeiraoMapa(cam, CALDEIRAO.x, CALDEIRAO.y);
  bloquearElipse(CALDEIRAO.x, CALDEIRAO.y - 2, 12, 5);
  FRASCOS.forEach(([x, y, cor]) => cam.carimbo(['.k.', '.k.', 'GLG', 'GGG', '.G.'], x - 1, y - 4, { k: '#6E5A44', G: cor, L: tingir(cor, '#FFFFFF', 0.5) }));

  // Boto: canoa na praia, vitórias-régias no remanso do Negro e buritis na beira
  canoaMapa(cam, 1120, 552);
  for (const [x, y, r] of [[1104, 512, 7], [1080, 470, 9], [1150, 506, 6], [1120, 690, 8], [1096, 712, 6]]) if (ter(x, y) === TRN.AGUA && AGUA_COR[y * MAPA_W + x] === 0) vitoriaRegia(cam, x, y, r);
  for (const [x, y, s] of [[1000, 690, 1], [1030, 594, 2], [968, 610, 3], [1012, 740, 4], [1080, 580, 5], [1180, 760, 6]]) {
    if (ter(x, y) !== TRN.AREIA && ter(x, y) !== TRN.GRAMA) continue;
    objeto('buriti', x, y, (c, X, Y, t) => buritiMapa(c, X, Y, t, s), { animado: true, pe: [2, 1], sombra: [16, 5], transparente: true });
  }

  // pedras na beira do rio
  for (const [x, y, w] of [[810, 180, 7], [894, 240, 6], [960, 450, 8], [795, 60, 6], [1250, 470, 6]]) if (ANDAVEL.has(ter(x, y))) pedraMapa(cam, x, y, w);

  // árvores soltas nos campos: castanheiras, embaúbas e touceiras de açaí; queimadas perto do fogo
  const longeDeTudo = (x, y, d) => Object.values(TRILHAS).every(tr => distPoli(pt(x, y), tr).d > d)
    && Object.values(ENTRADAS).every(e => Math.hypot(e.centro.x - x, e.centro.y - y) > 64 && Math.hypot(e.volta.x - x, e.volta.y - y) > 40)
    && Object.values(CRIATURAS).every(e => Math.hypot(e.base.x - x, e.base.y - y) > 60)
    && Math.hypot(x - CALDEIRAO.x, y - CALDEIRAO.y) > 36
    // a copa fica uns 50 px acima do tronco: também não pode tapar as entradas
    && Object.values(ENTRADAS).every(e => Math.hypot(e.centro.x - x, e.centro.y - (y - 50)) > 72)
    && Math.hypot(x - HUB.x, y - HUB.y) > 100 && Math.hypot(x - SAMAUMA.x, y - SAMAUMA.y) > 110;
  let k = 0;
  for (let gy = 30; gy < MAPA_H; gy += 60) for (let gx = 30; gx < MAPA_W; gx += 70) {
    k++;
    const x = Math.round(gx + (hash(k * 1.3) - 0.5) * 50 + (Math.floor(gy / 60) % 2) * 35), y = Math.round(gy + (hash(k * 2.9) - 0.5) * 40);
    if (x < 10 || y < 10 || x > MAPA_W - 10 || y > MAPA_H - 10) continue;
    const t = ter(x, y), sorteio = hash(k * 7.7);
    if (!longeDeTudo(x, y, 32) || BLOQ[y * MAPA_W + x] || PROF[y * MAPA_W + x] > -36) continue;
    if (t === TRN.GRAMA) {
      if (sorteio < 0.16) { arbustoMapa(cam, x, y, k); continue; }
      const sem = k;
      if (sorteio < 0.56) {
        const h = 46 + Math.round(hash(k * 4.4) * 22), r = 20 + Math.round(hash(k * 5.5) * 8), pal = hash(k) > 0.5 ? COPA.castanheira : COPA.castanheiraEsc;
        objeto('castanheira', x, y, (c, X, Y) => castanheiraMapa(c, X, Y, { sem, h, r, pal }), { pe: [5, 2], sombra: [r * 1.2, r * 0.42], transparente: true });
      } else if (sorteio < 0.78) {
        const h = 44 + Math.round(hash(k * 4.4) * 16);
        objeto('embauba', x, y, (c, X, Y) => embaubaMapa(c, X, Y, { sem, h }), { pe: [3, 1], sombra: [18, 6], transparente: true });
      } else {
        objeto('acai', x, y, (c, X, Y, tt) => acaiMapa(c, X, Y, tt, sem), { animado: true, pe: [5, 2], sombra: [18, 6], transparente: true });
      }
    } else if (t === TRN.QUEIMADO && sorteio < 0.7) {
      const sem = k;
      objeto('arvore_queimada', x, y, (c, X, Y, tt) => arvoreQueimada(c, X, Y, tt, sem), { animado: true, mostrar: 'nao_concluiu:fase1', pe: [3, 1], sombra: [11, 4] });
      objeto('arvore_rebrota', x, y, (c, X, Y, tt) => arvoreQueimada(c, X, Y, tt, sem, { brasa: 0 }), { mostrar: 'concluiu:fase1', pe: [3, 1] });
    } else if (t === TRN.DEVASTADO && sorteio < 0.3) tocoMapa(cam, x, y, k);
  }

  // bandeiras: aparecem depois de libertar cada ser
  for (const [id, prog, dx, dy] of [['mula', 'fase1', 26, -26], ['cuca', 'fase2', 32, 10], ['boto', 'fase3', -10, -24], ['maquina', 'boss', 44, -6]]) {
    const v = ENTRADAS[id].volta;
    objeto('bandeira_' + id, v.x + dx, v.y + dy, (c, x, y, t) => bandeiraMapa(c, x, y, t), { animado: true, mostrar: 'concluiu:' + prog, pe: [1, 1] });
  }

  // as criaturas libertadas, cada uma na sua área (não bloqueiam: aparecem só depois da luta)
  objeto('mula_livre', CRIATURAS.mula.base.x, CRIATURAS.mula.base.y, (c, x, y, t) => mulaLivre(c, x, y, t), { animado: true, mostrar: 'concluiu:fase1', pe: [0, 0], caixa: [200, 140, 100, 128] });
  objeto('cuca_livre', CRIATURAS.cuca.base.x, CRIATURAS.cuca.base.y, (c, x, y, t) => cucaLivre(c, x, y, t), { animado: true, mostrar: 'concluiu:fase2', pe: [0, 0], caixa: [180, 160, 90, 150] });
  objeto('boto_livre', CRIATURAS.boto.base.x, CRIATURAS.boto.base.y, (c, x, y, t) => botoLivre(c, x, y, t), { animado: true, mostrar: 'concluiu:fase3', pe: [0, 0], caixa: [180, 130, 90, 110] });

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
  // a ponte passa por cima de tudo
  for (let i = 0; i < ANDA.length; i++) if (TER[i] === TRN.PONTE) ANDA[i] = 1;

  // listas para animar
  AGUA_PIX = [];
  for (let i = 0; i < TER.length; i++) if (TER[i] === TRN.AGUA) AGUA_PIX.push(i);
  BRASAS = [];
  for (let k2 = 0; k2 < 600; k2++) {
    const x = Math.round(hash(k2 * 9.1) * 570), y = Math.round(450 + hash(k2 * 4.3) * 360);
    if (ter(x, y) === TRN.QUEIMADO) BRASAS.push([x, y, hash(k2)]);
  }
  MAPA_BASE = cam;
  camadasDoProgresso();
}

/* ---------- camadas que mudam com o progresso (objetos com z e "mostrar") ---------- */
function camadasDoProgresso() {
  // Mula: o fogo da mata e as brasas no chão queimado (somem quando ela é libertada)
  {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const ch of CHAMAS_MATA) { x0 = Math.min(x0, ch.x - 20); x1 = Math.max(x1, ch.x + 20); y0 = Math.min(y0, ch.y - 30); y1 = Math.max(y1, ch.y + 6); }
    sobreposicao('fogo_mata', Math.max(0, x0), y0, Math.min(MAPA_W, x1), Math.min(MAPA_H, y1), (c, t, ox, oy) => {
      const v = voltaM(t);
      for (const ch of CHAMAS_MATA) noMapa(c, ch.x - ox, ch.y - oy, (l, x, y) => chamaPx(l, x, y, 270, ch.larg, ch.alt, v * TAU * 2 + ch.sem, { n: 4, vel: 1, semente: ch.sem }));
    }, { animado: true, z: -9, mostrar: 'nao_concluiu:fase1' });
    sobreposicao('brasas', 0, 450, 572, MAPA_H, (c, t, ox, oy) => {
      const v = voltaM(t);
      for (const [x, y, f] of BRASAS) { const s = Math.sin((v * 2 + f) * TAU); if (s > 0.2) c.set(x - ox, y - oy, s > 0.8 ? '#FFB04A' : '#C8501A'); }
    }, { animado: true, quadros: 8, z: -9, mostrar: 'nao_concluiu:fase1' });
    // fumaça e brasas subindo, por cima de tudo
    sobreposicao('fumaca_mata', 0, 460, 420, MAPA_H, (c, t, ox, oy) => {
      const v = voltaM(t);
      for (const [x, y, s] of [[60, 645, 1], [165, 705, 2], [90, 757, 3], [240, 772, 4], [30, 720, 5]]) for (let k = 0; k < 3; k++) {
        const u = (v + k / 3 + hash(s) * 0.3) % 1;
        if (u < 0.85) tufoPx(c, x - ox + Math.sin(u * 3 + s) * 6 + u * 15, y - oy - u * 69, (3 + u * 10) * (u > 0.6 ? 1 - (u - 0.6) * 1.6 : 1), { luz: '#7A6A62', base: '#5E504A', sombra: '#4A3E3A' }, s + k, true);
      }
      for (let i = 0; i < 34; i++) {
        const u = (v + hash(i * 5)) % 1, x = hash(i) * 390 + Math.sin(u * TAU + i) * 7, y = 790 - hash(i * 3) * 180 - u * 105;
        if (u < 0.85) c.set(x - ox, y - oy, u < 0.5 && i % 3 === 0 ? '#FFB04A' : '#E0602A');
      }
    }, { animado: true, quadros: 8, z: 9, mostrar: 'nao_concluiu:fase1' });
    // depois: brotos verdes no chão queimado
    sobreposicao('brotos', 0, 450, 572, MAPA_H, (c, t, ox, oy) => {
      for (let k2 = 0; k2 < 900; k2++) {
        const x = Math.round(hash(k2 * 2.7 + 1) * 570), y = Math.round(452 + hash(k2 * 6.1 + 2) * 356);
        if (ter(x, y) !== TRN.QUEIMADO || BLOQ[y * MAPA_W + x]) continue;
        const cor = hash(k2) > 0.5 ? COPA.broto.base : COPA.broto.luz;
        c.set(x - ox, y - oy, cor);
        if (hash(k2 * 1.3) > 0.4) { c.set(x - ox - 1, y - oy - 1, cor); c.set(x - ox + 1, y - oy - 1, COPA.broto.sombra); }
      }
    }, { z: -9, mostrar: 'concluiu:fase1' });
  }
  // Cuca: a luz verde do caldeirão pulsando (tinge o chão) e a névoa com vaga-lumes
  {
    const R = 93;
    sobreposicao('luz_caldeirao', CALDEIRAO.x - R, CALDEIRAO.y - R, CALDEIRAO.x + R, CALDEIRAO.y + R, (c, t, ox, oy) => {
      const v = voltaM(t), pulso = 0.8 + 0.2 * Math.sin(v * TAU * 2);
      for (let y = CALDEIRAO.y - R; y < CALDEIRAO.y + R; y++) for (let x = CALDEIRAO.x - R; x < CALDEIRAO.x + R; x++) {
        const d = Math.hypot((x - CALDEIRAO.x) * 0.9, y - CALDEIRAO.y) / R;
        if (d >= 1) continue;
        const cor = MAPA_BASE.get(x, y);
        if (cor && pontilha(x, y, (1 - d) * pulso * 1.3)) c.set(x - ox, y - oy, tingir(cor, '#5AF07A', 0.55 * (1 - d) + 0.12));
      }
      for (let i = 0; i < 4; i++) {
        const u = (v * 2 + i / 4) % 1, x = CALDEIRAO.x - 7 + hash(i) * 14, y = CALDEIRAO.y - 13 - u * 10;
        if (u < 0.8) c.disco(x - ox, y - oy, 1 + u * 1.2, '#8AFA8A'); else c.set(x - ox, y - oy, '#C8FFC8');
      }
      FRASCOS.forEach(([x, y, cor], i) => {
        if (Math.sin((v * 2 + i / FRASCOS.length) * TAU) > 0.3) for (const [dx, dy] of [[-2, -2], [2, -2], [0, -5], [-3, 0], [3, 0]]) c.set(x + dx - ox, y + dy - oy, tingir(cor, '#FFFFFF', 0.4));
      });
    }, { animado: true, z: -9, mostrar: 'nao_concluiu:fase2' });
    sobreposicao('nevoa', 0, 0, 600, 450, (c, t, ox, oy) => {
      const v = voltaM(t);
      for (let i = 0; i < 20; i++) {
        const cx = 30 + hash(i * 2.3) * 500 + Math.sin(v * TAU + i) * 7, cy = 30 + hash(i * 4.1) * 360 + Math.cos(v * TAU + i * 1.7) * 3;
        const rx = 51 + hash(i * 6.1) * 45, ry = rx * 0.32 * (1 + 0.08 * Math.sin(v * TAU * 2 + i));
        for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (ruido(x, y, 13, i) - 0.5) * 0.5;
          if (d >= 1 || x < 0 || y < 0) continue;
          // a névoa não cobre a beira onde se entra
          if (ter(x, y) !== TRN.MATA_CUCA || Math.hypot(x - ENTRADAS.cuca.centro.x, y - ENTRADAS.cuca.centro.y) < 48) continue;
          if (pontilha(x, y, (1 - d) * 0.8)) c.set(x - ox, y - oy, d < 0.3 ? '#8AA4A0' : '#5E7C80');
        }
      }
      for (let i = 0; i < 16; i++) {
        const x = hash(i * 3.3) * 450 + 15, y = hash(i * 7.7) * 330 + 15 + Math.sin(v * TAU + i) * 6, on = Math.sin(v * TAU * 2 + i * 1.9);
        if (on > 0.2 && ter(Math.round(x), Math.round(y)) === TRN.MATA_CUCA) { c.set(x - ox, y - oy, '#C8FF9A'); if (on > 0.8) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) c.set(x + dx - ox, y + dy - oy, '#4AC85A'); }
      }
    }, { animado: true, quadros: 8, z: 9, mostrar: 'nao_concluiu:fase2' });
  }
  // Boto: ainda possuído, nada na linha das duas águas (só a barbatana, com um brilho vermelho)
  {
    const c0 = pt(1282, 540);
    sobreposicao('boto_possuido', c0.x - 40, c0.y - 24, c0.x + 40, c0.y + 24, (c, t, ox, oy) => {
      const a = voltaM(t) * TAU, p = pt(c0.x + Math.cos(a) * 26 - ox, c0.y + Math.sin(a) * 11 - oy);
      for (let k = 1; k < 8; k++) { const b = pt(p.x - Math.cos(a + Math.PI / 2) * k * 2, p.y - Math.sin(a + Math.PI / 2) * k); c.set(b.x + k * 0.6, b.y + 1, PAL_CHAO.negroEspuma); c.set(b.x - k * 0.6, b.y + 1, PAL_CHAO.negroEspuma); }
      c.carimbo(['..o..', '.oPo.', 'oPPLo', 'oPPPL'], Math.round(p.x) - 2, Math.round(p.y) - 3, { o: '#6A2A40', P: '#E88AB0', L: '#FFC0D8' });
      if (Math.sin(a * 3) > 0.6) c.set(p.x, p.y - 5, '#FF2A1A');
    }, { animado: true, z: -9, mostrar: 'nao_concluiu:fase3' });
  }
  // Máquina: fumaça da chaminé, por cima de tudo
  {
    const cx = PREDIO.x1 - 17, cy = PREDIO.teto - 34;
    sobreposicao('fumaca_chamine', cx - 20, cy - 60, cx + 40, cy + 12, (c, t, ox, oy) => {
      const v = voltaM(t);
      for (let i = 0; i < 4; i++) {
        const u = (v + i / 4) % 1;
        noMapa(c, cx + u * 20 - ox, cy - u * 38 - oy, (l, x, y) => fumacaPx(l, x, y, 4 + u * 7, { claro: '#B8B4B0', medio: '#9A9690', contorno: '#6E6A66' }));
      }
    }, { animado: true, z: 9 });
  }
}

/* um quadro do fundo: a água correndo, a linha das duas águas ondulando e a luz da antena */
function mapaQuadro(t) {
  montarMapa();
  const v = voltaM(t), cam = new Camada(MAPA_W, MAPA_H);
  cam.colar(MAPA_BASE);
  for (const i of AGUA_PIX) {
    const x = i % MAPA_W, y = (i - x) / MAPA_W, h = hash(x * 0.37 + y * 1.71), u = RIO_U[i];
    let cor = AGUA_COR[i];
    // a linha onde as duas águas se encontram: quase reta, com uma ondinha leve descendo o rio
    if (!Number.isNaN(LADO[i]) && Math.abs(LADO[i]) < 9) {
      const s = LADO[i] + Math.sin(u * 0.06 - v * TAU) * 1 + Math.sin(u * 0.2 + y * 0.05 + v * TAU * 2) * 0.5;
      cor = s < 0 ? 0 : 1;
      const cores = cor ? PAL_CHAO.solimoes : PAL_CHAO.negro;
      cam.set(x, y, Math.abs(s) < 1.2 && pontilha(x, y, 0.5) ? (cor ? PAL_CHAO.negro[2] : PAL_CHAO.solimoes[0]) : PROF[i] > 22 ? cores[0] : cores[1]);
    }
    // Solimões: redemoinhos claros, compridos no rumo da água, que escorrem com ela
    if (cor && PROF[i] > 3) {
      const r = Math.sin(u * 0.16 - v * TAU * 2 + Math.sin(PROF[i] * 0.35 + u * 0.03) * 2.2) * Math.sin(PROF[i] * 0.5 + u * 0.05);
      if (r > 0.62 && pontilha(x, y, (r - 0.62) / 0.25)) cam.set(x, y, PAL_CHAO.solimoesRedemoinho);
    }
    // correnteza: risquinhos claros descendo o rio, em faixas (cada faixa no seu ritmo)
    const faixa = Math.floor(PROF[i] / 3), k = Math.floor(u * 0.25 - v * 2 * 10 + hash(faixa * 7.3) * 11);
    if (((k % 9) + 9) % 9 === 0 && hash(faixa * 3.1 + Math.floor(k / 9) * 1.7) > 0.6) cam.set(x, y, cor ? PAL_CHAO.solimoesL : PAL_CHAO.negroL);
    const beira = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !ehAgua(x + dx, y + dy));
    if (beira && Math.sin(v * TAU * 2 + x * 0.21 + y * 0.13) > 0.1) cam.set(x, y, cor ? PAL_CHAO.solimoesEspuma : PAL_CHAO.negroEspuma);
  }
  // Máquina: luz da antena piscando
  if (Math.floor(t * 2) % 2) for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) cam.set(PREDIO.x0 + 20 + k, PREDIO.teto - 41 + j, '#FF2A1A');
  return { cam };
}

/* um objeto num quadro: camada pequena com a base em (ax, ay) */
function objetoQuadro(o, t) {
  const [W, H, ax, ay] = o.caixa, cam = new Camada(W, H);
  o.desenhar(cam, ax, ay, t);
  return { cam, ax, ay };
}
