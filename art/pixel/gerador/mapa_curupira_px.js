/* mapa_curupira_px.js — o Curupira do mapa do mundo (visão de cima, em diagonal).
   É o mesmo Curupira das lutas, montado com as mesmas peças de desenho.js: a cabeça (CABECA), a
   orelha, o cabelo (cabeloPx), o rosto "oba" (rostoPixel), o tronco com a pintura, a saia de folhas
   na corda e os pés virados para trás. Só o corpo é mais curto, para caber no mapa.
   Três direções: lado (olhando para a direita, igual à luta; o jogo espelha para a esquerda),
   baixo (de frente) e cima (de costas). A frente e as costas reaproveitam as mesmas peças.
   Âncora: entre os pés, na linha do chão. */

const CMAPA_W = 40, CMAPA_H = 46, CMAPA_ANCORA = pt(20, 43);

// cabeça de frente: o mesmo crânio da luta, redondo e simétrico, queixo recuando
const CABECA_FRENTE = [
  '......SSSSSSS......',
  '....SSSSSSSSSSS....',
  '...SSSSSSSSSSSSS...',
  '..SSSSSSSSSSSSSSS..',
  '.dSSSSSSSSSSSSSSSd.',
  '.dSSSSSSSSSSSSSSSd.',
  'ddSSSSSSSSSSSSSSSdd',
  'ddSSSSSSSSSSSSSSSdd',
  'ddSSSSSSSSSSSSSSSdd',
  'ddSSSSSSSSSSSSSSSdd',
  'ddSSSSSSSSSSSSSSSdd',
  '.dSSSSSSSSSSSSSSSd.',
  '.ddSSSSSSSSSSSSSdd.',
  '..ddSSSSSSSSSSSdd..',
  '...ddSSSSSSSSSdd...',
  '....DddSSSSSddD....',
  '......DDdddDD......'
];
const TOPO_FRENTE = [...CABECA_FRENTE[0]].map((_, x) => CABECA_FRENTE.findIndex(l => l[x] !== '.'));
// olhos de frente: os mesmos do rosto "aberto", com a íris no meio
const OLHO_FRENTE_E = ['ooooo', 'WgGGW', 'WGhPW', 'WGPPW', '.WGG.'];
const OLHO_FRENTE_D = ['ooooo', 'WGGgW', 'WPhGW', 'WPPGW', '.GGW.'];
const BOCA_FRENTE = ['oooooo', 'oMMMMo', '.oTTo.'];
// tronco de frente: ombros, peito com a pintura vermelha, cintura
const TRONCO_FRENTE = [
  '..SSSSS..',
  'dSSSSSSSL',
  'dSSrSSSSL',
  'dSSSrSrSS',
  'dSSSSSrSS',
  '.dSSSSSS.'
];
const TRONCO_COSTAS = [
  '..SSSSS..',
  'dSSSSSSSL',
  'dSSSdSSSL',
  'dSSSdSSSS',
  'dSSSdSSSS',
  '.dSSSSSS.'
];

// cabelo de frente/costas: touca simétrica, mechas espetadas para cima e para os lados
const MECHAS_FRENTE = [   // coluna da base, ângulo, comprimento, largura, queda
  [1, 200, 5, 2.2, 1.2], [3, 218, 5.5, 2.4, 0.6], [6, 238, 6.5, 2.5, 0.2], [9, 268, 6, 2.5, 0],
  [12, 302, 6.5, 2.5, 0.2], [15, 322, 5.5, 2.4, 0.6], [17, 340, 5, 2.2, 1.2]
];
function cabeloFrentePx(cam, hx, hy, t, costas, agita, giro = 0) {
  const cab = new Camada(cam.W, cam.H), largura = CABECA_FRENTE[0].length;
  for (let x = 0; x < largura; x++) {
    const topo = TOPO_FRENTE[x];
    if (topo < 0) continue;
    // de frente a touca para na testa; de costas desce até a nuca
    const fim = costas ? 13 - (x < 2 || x > 16 ? 2 : 0) - (giro < 0 && x > 15 ? 2 : 0) : (x < 3 || x > 15 ? 7 : 4) + (giro > 0 && x < 4 ? 2 : 0);
    for (let y = topo - 1; y <= fim; y++) cab.set(hx + x, hy + y, PM.cabelo);
  }
  MECHAS_FRENTE.forEach(([bx, ang, h, w, cai], k) => {
    const bal = Math.sin(t * 6 * agita + k * 1.3) * 5 * agita;
    mecha(cab, hx + bx + 0.5, hy + TOPO_FRENTE[bx] + 0.5, ang + bal - giro * 14, h, w, PM.cabelo, cai);
  });
  if (costas) {
    // nuca: pontas caindo por cima do pescoço
    for (const [x, a] of [[3.5, 110], [7.5, 95], [11.5, 85], [15.5, 70]]) mecha(cab, hx + x, hy + 12, a, 2.6, 1.4, PM.cabelo);
  } else {
    // franja: três pontinhas caindo na testa
    for (const [x, a] of [[6.5, 100], [9.5, 90], [12.5, 80]]) mecha(cab, hx + x + giro * 2, hy + 4, a, 2.2, 1.2, PM.cabelo);
  }
  const muda = [];
  for (const [x, y] of cab.pixels()) {
    if (!cab.get(x, y)) continue;
    if (!cab.get(x, y + 1)) muda.push([x, y, PM.cabeloD]);
    else if (!cab.get(x, y - 1)) muda.push([x, y, PM.cabeloL]);
  }
  for (const [x, y, c] of muda) cab.set(x, y, c);
  for (let x = 7; x <= 11; x++) { const y = hy + TOPO_FRENTE[x] + 1; if (cab.get(hx + x, y) === PM.cabelo) cab.set(hx + x, y, PM.cabeloLL); }
  cam.colar(cab.contornar(PM.cabeloO));
}

// perna curta de mangueira: do quadril ao pé, com o pé virado para trás
function pernaMapa(cam, a, b, cores, pe, espelho) {
  const parte = new Camada(cam.W, cam.H);
  parte.traco([a, lerp(a, b, 0.5), b], 3.2, cores.S);
  parte.sombrear(cores.S, cores.d, cores.L);
  if (pe) parte.carimbo(PE, Math.round(b.x - (espelho ? 4 : 2)), Math.round(b.y - 1), pe, espelho);
  cam.colar(parte.contornar(PM.peleO));
}
function bracoMapa(cam, a, b, cores, punho) {
  const parte = new Camada(cam.W, cam.H);
  parte.traco([a, b], 2.6, cores.S);
  parte.sombrear(cores.S, cores.d, cores.L);
  parte.carimbo(PUNHO, Math.round(b.x - 2), Math.round(b.y - 1), punho);
  cam.colar(parte.contornar(PM.peleO));
}
function saiaMapa(cam, cx, y, t, agita) {
  const parte = new Camada(cam.W, cam.H), fase = Math.floor(t * 7 * agita) % 2;
  parte.carimbo(SAIA[fase].slice(0, 4), Math.round(cx - 6), y, MAPA_SAIA);
  cam.colar(parte.contornar(PM.verdeO));
  for (let x = -6; x <= 6; x++) cam.set(Math.round(cx + x), y - 1, x % 3 ? PM.corda : PM.cordaL);
}

const CMAPA_COR_TRAS = { S: PM.peleS, d: PM.peleD, L: PM.pele };
const CMAPA_COR_FRENTE = { S: PM.pele, d: PM.peleS, L: PM.peleL };
const CMAPA_RAMPA_TRAS = { S: PM.peleS, d: PM.peleD, D: PM.peleD, L: PM.pele, e: PM.peleD };

// diagonal para baixo: olhos virados para a direita (o de longe mais estreito), como na luta
const OLHO_DIAG_PERTO = OLHOS.aberto.perto, OLHO_DIAG_LONGE = OLHOS.aberto.longe;

/* Direções do mapa. O jogo espelha (scale.x = −4) para os lados da esquerda. */
const CMAPA_DIRECOES = ['baixo', 'diag_baixo', 'lado', 'diag_cima', 'cima'];

/* Um quadro: dir = uma de CMAPA_DIRECOES; passo 0 = parado, 1..4 = andando; t em segundos. */
function curupiraMapaPx(dir, passo, t = 0) {
  const cam = new Camada(CMAPA_W, CMAPA_H), anda = passo > 0;
  const s = anda ? Math.sin((passo - 1) / 4 * TAU) : 0;   // passo 1 e 3: pernas juntas; 2 e 4: abertas
  // o corpo sobe 1 px quando as pernas passam uma pela outra; parado, respira a cada 2 s
  const bob = anda ? (passo % 2 === 1 ? -1 : 0) : (Math.sin(t * TAU / 2) > 0.5 ? -1 : 0);
  const chao = CMAPA_ANCORA.y, cx = CMAPA_ANCORA.x;
  const quadril = chao - 7 + bob;
  const agita = anda ? 0.7 : 0.4;
  const costas = dir === 'cima' || dir === 'diag_cima';
  const giro = dir === 'diag_baixo' ? 1 : dir === 'diag_cima' ? -1 : 0;   // quanto o rosto vira para a direita

  if (dir === 'lado') {
    // de perfil: braço de trás escondido atrás do tronco, passada com os pés virados para trás
    const peT = pt(cx - 1 - s * 4, chao - (s < -0.3 ? 1 : 0)), peF = pt(cx + 1 + s * 4, chao - (s > 0.3 ? 1 : 0));
    // os dois braços ficam atrás do tronco: só a mão aparece quando balança para a frente ou para trás
    bracoMapa(cam, pt(cx - 1, quadril - 5), pt(cx - 1 + s * 6, quadril - 1), CMAPA_COR_TRAS, CMAPA_RAMPA_TRAS);
    bracoMapa(cam, pt(cx, quadril - 5), pt(cx - s * 6, quadril - 1), CMAPA_COR_FRENTE, MAPA_PELE);
    pernaMapa(cam, pt(cx - 1, quadril), peT, CMAPA_COR_TRAS, CMAPA_RAMPA_TRAS, true);
    pernaMapa(cam, pt(cx + 1, quadril), peF, CMAPA_COR_FRENTE, MAPA_PELE, true);
    const linhas = [0, 1, 2, 3, 4, 5, 8, 10].map(i => TRONCO[i]);   // o tronco da luta, encurtado
    const tr = new Camada(cam.W, cam.H);
    tr.carimbo(linhas, cx - 5, quadril - linhas.length + 1, MAPA_PELE);
    cam.colar(tr.contornar(PM.peleO));
    saiaMapa(cam, cx, quadril - 1, t, agita);
    const hx = cx - 10, hy = quadril - linhas.length - 15;
    const orelha = new Camada(cam.W, cam.H); orelha.carimbo(ORELHA, hx - 2, hy + 8, MAPA_PELE); cam.colar(orelha.contornar(PM.peleO));
    const cab = new Camada(cam.W, cam.H); cab.carimbo(CABECA, hx, hy, MAPA_PELE); cam.colar(cab.contornar(PM.peleO));
    cabeloPx(cam, hx, hy, t, null, agita);
    rostoPixel(cam, hx, hy, exDe('oba'), t, false, 0);
    return cam;
  }

  // frente, costas e diagonais: as pernas sobem e descem alternadas (na diagonal, com um passinho de lado)
  const sobeE = s > 0.3 ? 1 : 0, sobeD = s < -0.3 ? 1 : 0, dxP = giro !== 0 ? Math.round(s * 1.5) : 0;
  const pes = [[cx - 2 + giro - dxP, sobeE], [cx + 2 + giro + dxP, sobeD]];
  for (const [x, sobe] of pes) pernaMapa(cam, pt(cx + (x < cx + giro ? -2 : 2), quadril), pt(x, chao - sobe), CMAPA_COR_FRENTE, null);
  // pés virados: de frente aparece o calcanhar; de costas, os dedos
  for (const [x, sobe] of pes) {
    const pe = new Camada(cam.W, cam.H);
    pe.carimbo(costas ? ['SSS', 'LSS', 'ddd'] : ['.SS', 'SSL', 'ddd'], x - 1, chao - sobe - 1, MAPA_PELE);
    cam.colar(pe.contornar(PM.peleO));
  }
  const balanco = Math.round(s * 1.5);
  // na diagonal o braço do lado de lá fica meio escondido atrás do tronco
  const bracoE = () => bracoMapa(cam, pt(cx - 4 + giro, quadril - 5), pt(cx - 6 + giro * 2, quadril - 1 + balanco), giro < 0 ? CMAPA_COR_FRENTE : CMAPA_COR_TRAS, giro < 0 ? MAPA_PELE : CMAPA_RAMPA_TRAS);
  const bracoD = () => bracoMapa(cam, pt(cx + 4 + giro, quadril - 5), pt(cx + 6 + (giro > 0 ? -1 : giro), quadril - 1 - balanco), giro > 0 ? CMAPA_COR_TRAS : CMAPA_COR_FRENTE, giro > 0 ? CMAPA_RAMPA_TRAS : MAPA_PELE);
  if (giro > 0) bracoD();
  if (giro < 0) bracoE();
  const tr = new Camada(cam.W, cam.H), linhas = costas ? TRONCO_COSTAS : TRONCO_FRENTE;
  tr.carimbo(linhas, cx - 4 + giro, quadril - linhas.length + 1, MAPA_PELE);
  cam.colar(tr.contornar(PM.peleO));
  saiaMapa(cam, cx + giro, quadril - 1, t, agita);
  if (giro <= 0) bracoD();
  if (giro >= 0) bracoE();
  const hx = cx - 9 + giro, hy = quadril - linhas.length - 15;
  // orelhas: de frente e de costas as duas; na diagonal para baixo só a de trás (esquerda),
  // na diagonal para cima só a da direita
  for (const lado of [-1, 1]) {
    if ((giro > 0 && lado > 0) || (giro < 0 && lado < 0)) continue;
    const o = new Camada(cam.W, cam.H);
    o.carimbo(ORELHA, lado < 0 ? hx - 2 : hx + 17, hy + 7, MAPA_PELE, lado > 0);
    cam.colar(o.contornar(PM.peleO));
  }
  const cab = new Camada(cam.W, cam.H); cab.carimbo(CABECA_FRENTE, hx, hy, MAPA_PELE); cam.colar(cab.contornar(PM.peleO));
  cabeloFrentePx(cam, hx, hy, t, costas, agita, giro);
  if (dir === 'baixo') {
    // sobrancelhas grossas (canto de dentro mais baixo, como no "oba"), olhos, bochechas, boca
    for (let i = 0; i < 5; i++) { cam.set(hx + 3 + i, hy + 6 - (i < 3 ? 1 : 0), PM.sobr); cam.set(hx + 11 + i, hy + 6 - (i > 1 ? 1 : 0), PM.sobr); }
    cam.carimbo(OLHO_FRENTE_E, hx + 3, hy + 7, MAPA_OLHO);
    cam.carimbo(OLHO_FRENTE_D, hx + 11, hy + 7, MAPA_OLHO);
    for (const x of [2, 3, 15, 16]) cam.set(hx + x, hy + 12, PM.rubor);
    cam.carimbo(BOCA_FRENTE, hx + 6, hy + 13, MAPA_BOCA);
  } else if (dir === 'diag_baixo') {
    // o rosto da luta (olhos olhando para a direita) puxado para o lado do giro
    for (let i = 0; i < 5; i++) cam.set(hx + 5 + i, hy + 6 - (i < 3 ? 1 : 0), PM.sobr);
    for (let i = 0; i < 4; i++) cam.set(hx + 12 + i, hy + 6 - (i > 0 ? 1 : 0), PM.sobr);
    cam.carimbo(OLHO_DIAG_PERTO, hx + 5, hy + 7, MAPA_OLHO);
    cam.carimbo(OLHO_DIAG_LONGE, hx + 12, hy + 7, MAPA_OLHO);
    for (const x of [4, 5, 17]) cam.set(hx + x, hy + 12, PM.rubor);
    cam.set(hx + 17, hy + 11, PM.peleS);   // nariz
    cam.carimbo(BOCAS.oba, hx + 9, hy + 13, MAPA_BOCA);
  } else if (dir === 'diag_cima') {
    // de costas virando para a direita: aparece um pedaço da bochecha embaixo do cabelo
    for (const [x, y] of [[17, 12], [17, 13], [16, 13], [16, 14]]) if (cam.get(hx + x, hy + y) === PM.cabeloD || cam.get(hx + x, hy + y) === PM.cabelo) cam.set(hx + x, hy + y, PM.pele);
  }
  return cam;
}
