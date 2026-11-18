/* derrota_px.js — a carta da tela de derrota (o Curupira perdeu a luta).
   Um cartão de papel velho com o retrato do chefe zombando num círculo, a frase dele (texto do
   jogo), a trilha do progresso e as opções. Exportado já ampliado 4×, como os botões.
     - derrota_carta: o papel, com moldura dupla e marcas de dobra
     - derrota_retrato_<chefe>: o chefe numa pose de deboche, recortado num círculo colorido
     - derrota_chip: o chip na ponta da trilha (o que falta para libertar o chefe) */

const DERROTA_PX = { carta: [150, 196], retrato: 84 };
const PD = { papel: '#E6D9BC', papelL: '#F1E7CF', papelD: '#D3C3A0', papelDD: '#BFAE88', tinta: '#4A3628', tintaL: '#7A6046' };

function cartaDerrotaPx() {
  const [W, H] = DERROTA_PX.carta, cam = new Camada(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // papel: manchas grandes e grão miúdo, mais escuro nas beiras
    const borda = Math.min(x, y, W - 1 - x, H - 1 - y);
    const mancha = Math.sin(x * 0.07 + y * 0.03) * Math.sin(y * 0.05 - x * 0.02) + (hash(Math.floor(x / 6) * 7.1 + Math.floor(y / 6) * 3.3) - 0.5) * 0.6;
    let c = mancha > 0.45 ? PD.papelD : mancha < -0.55 ? PD.papelL : PD.papel;
    if (borda < 6 && pontilha(x, y, (6 - borda) / 7)) c = PD.papelDD;
    const g = hash(x * 12.9 + y * 78.2);
    if (g > 0.985) c = PD.papelDD; else if (g < 0.012) c = PD.papelL;
    cam.set(x, y, c);
  }
  // marcas de dobra: uma linha clara com sombra ao lado, em cruz
  for (let y = 4; y < H - 4; y++) { if (hash(y * 0.31) > 0.25) cam.set(W / 2, y, PD.papelL); if (hash(y * 0.53) > 0.5) cam.set(W / 2 + 1, y, PD.papelD); }
  for (let x = 4; x < W - 4; x++) { if (hash(x * 0.37) > 0.25) cam.set(x, 98, PD.papelL); if (hash(x * 0.59) > 0.5) cam.set(x, 99, PD.papelD); }
  // moldura dupla de tinta, com falhas
  const linhaRet = (m, cor) => {
    for (let x = m; x < W - m; x++) for (const y of [m, H - 1 - m]) if (hash(x * 3.7 + y) > 0.06) cam.set(x, y, cor);
    for (let y = m; y < H - m; y++) for (const x of [m, W - 1 - m]) if (hash(y * 5.3 + x) > 0.06) cam.set(x, y, cor);
  };
  linhaRet(0, PD.tinta); linhaRet(4, PD.tinta); linhaRet(6, PD.tintaL);
  // cantos com um losango
  for (const [cx, cy] of [[5, 5], [W - 6, 5], [5, H - 6], [W - 6, H - 6]]) cam.carimbo(['.t.', 'ttt', '.t.'], cx - 1, cy - 1, { t: PD.tinta });
  return cam;
}

// retratos de frente, olhando para o jogador, ainda possuídos (olho e fogo vermelhos)
const DEBOCHE = {
  mula: { fundo: ['#F0A850', '#E08A3A', '#C86A2A'], desenhar: frenteMulaPx },
  cuca: { fundo: ['#9CCB7A', '#7AB062', '#5E944E'], desenhar: frenteCucaPx },
  boto: { fundo: ['#8CC8E8', '#6AAED6', '#4E90BE'], desenhar: frenteBotoPx },
  maquina: { fundo: ['#F08A78', '#D86A5A', '#B84E44'], desenhar: frenteMaquinaPx }
};
const FOGO_VERMELHO = ['#3A0610', '#7A0E14', '#B8141A', '#E0241B', '#FF4A3A', '#FF9A84'];
const parteR = () => new Camada(DERROTA_PX.retrato, DERROTA_PX.retrato);
const lado = (c, w) => (x, y) => x > c + w;
// olho de frente: branco, íris vermelha acesa, pupila, pálpebra de deboche e sobrancelha
function olhoFrentePx(cam, x, y, r, { pele, contorno, esq = true, palpebra = 0.35 }) {
  const o = parteR();
  o.disco(x, y, r, '#FFF8EC');
  o.disco(x + (esq ? 0.6 : -0.6), y + 0.4, r * 0.62, '#E0241B');
  o.disco(x + (esq ? 0.6 : -0.6), y + 0.4, r * 0.3, '#3A0606');
  o.set(x + (esq ? -0.6 : -1.4), y - 0.8, '#FFD0C0');
  // pálpebra caída por cima (cara de deboche): corta a parte de cima em diagonal
  for (const [px, py] of o.pixels()) if (o.get(px, py) && py < y - r + r * 2 * palpebra + (esq ? 1 : -1) * (px - x) * 0.25) o.set(px, py, pele);
  cam.colar(o.contornar(contorno));
  // sobrancelha inclinada para o meio
  const s = esq ? 1 : -1;
  cam.traco([pt(x - s * (r + 1), y - r - 2.5), pt(x + s * (r + 0.5), y - r)], 1.6, contorno);
  // brilho vermelho em volta do olho
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.4; if (!cam.get(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3))) continue; }
}
function frenteMulaPx(cam) {
  // crina escura atrás do pescoço
  const cr = parteR();
  for (let k = 0; k < 7; k++) elipse(cr, 42 + (k % 2 ? 9 : -9), 34 + k * 5, 5, 4, PMU.crina[1 + (k % 3)]);
  cam.colar(cr.contornar(PMU.crinaO));
  const c = parteR();
  // patas da frente e peito
  c.traco([pt(26, 72), pt(23, 92)], 10, PMU.pelo); c.traco([pt(58, 72), pt(61, 92)], 10, PMU.pelo);
  elipse(c, 42, 80, 29, 20, PMU.pelo);
  // pescoço subindo até o toco
  poli(c, [pt(29, 76), pt(55, 76), pt(51, 30), pt(33, 30)], PMU.pelo);
  dentro(c, (x, y) => x > 47 + (76 - y) * 0.08, PMU.peloS);
  dentro(c, (x, y) => x < 35 + (76 - y) * 0.06 && y < 74, PMU.peloL);
  elipse(c, 42, 84, 13, 10, PMU.barriga);
  dentro(c, (x, y) => y > 70 && x > 60, PMU.peloD); dentro(c, (x, y) => y > 70 && x < 24, PMU.peloS);
  cam.colar(c.contornar(PMU.peloO));
  // toco do pescoço e o fogo vermelho saindo dele
  const t = parteR(); elipse(t, 42, 30, 9, 3.5, PMU.toco); elipse(t, 42, 29.5, 6, 2, '#E0241B');
  cam.colar(t.contornar(PMU.peloO));
  chamaPx(cam, 42, 31, 270, 22, 30, 1.3, { n: 5, rampa: FOGO_VERMELHO, contorno: '#2A040A', vel: 9, amp: 1.2 });
  // chip no peito, aceso
  brilhoPx(cam, pt(42, 62), 7, '#FF4A3A', 0.45);
  chipPx(cam, 42, 62, 0.3, true);
}
function frenteCucaPx(cam) {
  // sobretudo e gola alta com o forro vermelho
  const go = parteR();
  poli(go, [pt(22, 64), pt(14, 38), pt(32, 50), pt(33, 64)], PCU.forro); poli(go, [pt(62, 64), pt(70, 38), pt(52, 50), pt(51, 64)], PCU.forro);
  dentro(go, (x, y) => x < 18 || x > 66, PCU.vest); dentro(go, (x, y) => y > 56 && (x < 26 || x > 58), PCU.forroS);
  cam.colar(go.contornar(PCU.vestO));
  const co = parteR();
  poli(co, [pt(2, 92), pt(82, 92), pt(72, 64), pt(56, 58), pt(28, 58), pt(12, 64)], PCU.vest);
  dentro(co, lado(54, 0), PCU.vestS); dentro(co, (x, y) => x < 20 && y < 74, PCU.vestL);
  poli(co, [pt(34, 58), pt(42, 82), pt(50, 58)], PCU.vestD);
  for (const y of [74, 82]) co.set(42, y, PCU.botao);
  cam.colar(co.contornar(PCU.vestO));
  // tranças loiras dos dois lados
  for (const l of [-1, 1]) {
    const tr = parteR();
    for (let k = 0; k < 8; k++) elipse(tr, 42 + l * (19 + k * 0.4), 34 + k * 4.6, 4, 3, k % 2 ? PCU.cab : PCU.cabL);
    dentro(tr, (x, y) => (y % 5) === 0, PCU.cabS);
    cam.colar(tr.contornar(PCU.cabO));
  }
  // cabeça de jacaré de frente: crânio, focinho vindo para a frente e a bocarra rindo
  const h = parteR();
  elipse(h, 42, 44, 16, 12, PCU.verde); elipse(h, 42, 56, 14, 9, PCU.verde);
  elipse(h, 33, 37, 6, 5, PCU.verde); elipse(h, 51, 37, 6, 5, PCU.verde);
  dentro(h, lado(48, 0), PCU.verdeS); dentro(h, (x, y) => y < 42 && x < 40, PCU.verdeL);
  for (const [x, y] of [[38, 46], [46, 45], [42, 42], [36, 52], [48, 52]]) h.set(x, y, PCU.verdeS);
  cam.colar(h.contornar(PCU.verdeO));
  // boca: sorriso largo aberto, dentes em cima e embaixo
  const b = parteR();
  for (let x = 30; x <= 54; x++) {
    const u = (x - 42) / 12, topo = 56 - 3 * u * u + 0.5, base = 58 + 4 * (1 - u * u);
    for (let y = Math.floor(topo); y <= base; y++) b.set(x, y, y > base - 1.5 && Math.abs(u) < 0.5 ? PCU.lingua : PCU.boca);
    if (x % 3 === 0) { b.set(x, Math.floor(topo), PCU.dente); b.set(x, Math.floor(topo) + 1, PCU.dente); }
    if (x % 3 === 1 && Math.abs(u) < 0.8) b.set(x, Math.floor(base), PCU.dente);
  }
  cam.colar(b.contornar(PCU.verdeO));
  cam.set(39, 50, PCU.verdeO); cam.set(45, 50, PCU.verdeO);
  olhoFrentePx(cam, 33, 37, 3.6, { pele: PCU.verde, contorno: PCU.verdeO, esq: true });
  olhoFrentePx(cam, 51, 37, 3.6, { pele: PCU.verde, contorno: PCU.verdeO, esq: false });
  // chapéu de bruxa com a faixa de metal e a luz vermelha
  const ch = parteR();
  poli(ch, [pt(30, 30), pt(55, 30), pt(52, 17), pt(60, 4), pt(46, 12), pt(37, 22)], PCU.chapeu);
  elipse(ch, 42, 30, 23, 4, PCU.chapeu);
  dentro(ch, (x, y) => y >= 24 && y <= 26 && x > 32 && x < 54, PCU.metal);
  dentro(ch, (x, y) => y === 24 && x > 32 && x < 54, PCU.metalL);
  dentro(ch, lado(50, 0), PCU.chapeuS); dentro(ch, (x, y) => y > 30, PCU.chapeuS);
  cam.colar(ch.contornar(PCU.chapeuO));
  cam.disco(42, 25, 1.6, PCU.veia); cam.set(42, 24, PCU.brilho);
  // garra erguida rindo
  const g = parteR();
  elipse(g, 13, 64, 6, 5, PCU.verde); g.traco([pt(13, 68), pt(16, 84)], 6, PCU.vest);
  for (const [dx, a] of [[-4, -110], [0, -90], [4, -70]]) g.traco([pt(13 + dx, 61), pt(13 + dx + Math.cos(rad(a)) * 5, 61 + Math.sin(rad(a)) * 5)], 2, PCU.garra);
  cam.colar(g.contornar(PCU.verdeO));
  brilhoPx(cam, pt(42, 70), 6, '#FF4A3A', 0.45);
  chipPx(cam, 42, 70, 0.3, true);
}
function frenteBotoPx(cam) {
  const b = parteR();
  // corpo e nadadeiras
  elipse(b, 10, 80, 6, 12, PBO.rosaS, 35); elipse(b, 74, 80, 6, 12, PBO.rosaS, -35);
  elipse(b, 42, 90, 31, 26, PBO.rosa); elipse(b, 42, 94, 17, 18, PBO.barriga);
  dentro(b, (x, y) => x > 62 && y > 70, PBO.rosaS);
  cam.colar(b.contornar(PBO.rosaO));
  // gravata borboleta
  const gv = parteR();
  poli(gv, [pt(42, 68), pt(33, 63), pt(33, 73)], PBO.gravata); poli(gv, [pt(42, 68), pt(51, 63), pt(51, 73)], PBO.gravata);
  gv.disco(42, 68, 2.2, PBO.gravataL);
  cam.colar(gv.contornar(PBO.rosaO));
  // cabeça (o melão) e o bico vindo para a frente
  const h = parteR();
  elipse(h, 42, 42, 21, 18, PBO.rosa);
  dentro(h, (x, y) => x > 54 || y > 54, PBO.rosaS); dentro(h, (x, y) => x < 32 && y < 40, PBO.rosaL);
  elipse(h, 42, 55, 10, 7, PBO.rosaL); elipse(h, 42, 53, 5, 2.5, PBO.barriga);
  cam.colar(h.contornar(PBO.rosaO));
  // sorrisinho de lado
  for (let x = 34; x <= 51; x++) { const u = (x - 42) / 9; cam.set(x, Math.round(58 + 1.5 * (1 - u * u) - (x > 47 ? (x - 47) * 0.8 : 0)), PBO.rosaO); }
  cam.set(52, 55, PBO.rosaO); cam.set(33, 58, PBO.rosaO);
  olhoFrentePx(cam, 31, 43, 3.4, { pele: PBO.rosa, contorno: PBO.rosaO, esq: true, palpebra: 0.45 });
  olhoFrentePx(cam, 53, 43, 3.4, { pele: PBO.rosa, contorno: PBO.rosaO, esq: false, palpebra: 0.45 });
  // chapéu panamá branco com fita escura
  const ch = parteR();
  poli(ch, [pt(29, 25), pt(55, 25), pt(53, 12), pt(42, 9), pt(31, 12)], PBO.chapeu);
  elipse(ch, 42, 26, 25, 4.5, PBO.chapeu);
  dentro(ch, (x, y) => y >= 20 && y <= 22 && x > 29 && x < 55, PBO.fita);
  dentro(ch, (x, y) => y > 26 || x > 52, PBO.chapeuS);
  dentro(ch, (x, y) => y === 13 && x > 36 && x < 48, PBO.chapeuS);
  cam.colar(ch.contornar(PBO.chapeuO));
  // um beijinho voando
  coracaoPx(cam, 68, 46, 0); coracaoPx(cam, 74, 34, 0.2);
  brilhoPx(cam, pt(60, 80), 6, '#FF4A3A', 0.45);
  chipPx(cam, 60, 80, 0.3, true);
}
function frenteMaquinaPx(cam) {
  // braço do trilho
  const a = parteR();
  a.traco([pt(42, -2), pt(42, 22)], 5, PMQ.metalL); a.disco(42, 16, 4, PMQ.metal); a.disco(42, 16, 1.5, PMQ.metalL);
  cam.colar(a.contornar(PMQ.contorno));
  // abas dos lados
  const f = parteR();
  poli(f, [pt(16, 38), pt(4, 28), pt(4, 54), pt(16, 58)], PMQ.branco); poli(f, [pt(68, 38), pt(80, 28), pt(80, 54), pt(68, 58)], PMQ.branco);
  dentro(f, (x, y) => y > 48, PMQ.brancoS);
  cam.colar(f.contornar(PMQ.contorno));
  // pernas penduradas
  const p = parteR();
  for (const [x0, x1] of [[33, 28], [42, 42], [51, 56]]) p.traco([pt(x0, 70), pt(x1, 88)], 2, PMQ.metal);
  cam.colar(p.contornar(PMQ.contorno));
  // corpo branco
  const b = parteR();
  elipse(b, 42, 48, 28, 25, PMQ.branco);
  dentro(b, (x, y) => y > 60 || x > 64, PMQ.brancoS); dentro(b, (x, y) => (y > 68 && x > 50) || x > 68, PMQ.brancoD);
  dentro(b, (x, y) => y === 30 && x > 30 && x < 54, PMQ.brancoS);
  cam.colar(b.contornar(PMQ.contorno));
  // lente vermelha no meio, brilhando
  brilhoPx(cam, pt(42, 45), 17, '#FF8A6A', 0.4);
  const l = parteR();
  l.disco(42, 45, 12, PMQ.metal); l.disco(42, 45, 10, PMQ.metalD); l.disco(42, 45, 8, PMQ.lenteD);
  l.disco(42, 45, 6, PMQ.lente); l.disco(42, 45, 2.5, PMQ.lenteL); l.set(39, 41, PMQ.laserL); l.set(40, 41, PMQ.laserL);
  cam.colar(l.contornar(PMQ.contorno));
  // tela de LED embaixo da lente: um sorrisinho verde
  for (let x = 31; x <= 53; x += 2) { const u = (x - 42) / 11; cam.set(x, Math.round(64 - 3.5 * u * u), PMQ.verde); }
  // luzinhas do lado
  for (const [x, y, c] of [[22, 44, PMQ.azul], [22, 48, PMQ.verde], [62, 44, PMQ.amarelo], [62, 48, PMQ.azul]]) cam.set(x, y, c);
}
function retratoDerrotaPx(id) {
  const D = DEBOCHE[id], N = DERROTA_PX.retrato, c = N / 2, raio = c - 4;
  const corpo = parteR();
  D.desenhar(corpo);
  const cam = new Camada(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
    if (d <= raio) {
      // fundo em três faixas com raios de sol, e o chefe por cima
      const ang = Math.atan2(y + 0.5 - c, x + 0.5 - c), raioSol = Math.floor((ang / TAU + 1) * 16) % 2 === 0;
      const faixa = d < raio * 0.45 ? 0 : d < raio * 0.8 ? 1 : 2;
      cam.set(x, y, corpo.get(x, y) || D.fundo[raioSol && faixa > 0 ? faixa - 1 : faixa]);
    } else if (d <= raio + 1.2) cam.set(x, y, PD.papelL);
    else if (d <= raio + 3.2) cam.set(x, y, PD.tinta);
  }
  return cam;
}
function chipDerrotaPx() {
  const cam = new Camada(11, 11);
  cam.carimbo(CHIP_PX, 2, 2, { y: '#E8B84A', K: '#1F3A2A', k: '#2E5A3E', R: '#FF3A2A' });
  return cam.contornar('#0E1A14');
}

function exportarDerrota() {
  const ui = (nome, cam) => { saida.ui[nome] = { png: png(ampliarCamada(cam, 4)), tamanho: [cam.W * 4, cam.H * 4] }; };
  ui('derrota_carta', cartaDerrotaPx());
  for (const id of Object.keys(DEBOCHE)) ui('derrota_retrato_' + id, retratoDerrotaPx(id));
  ui('derrota_chip', chipDerrotaPx());
}
