/* exportar.js — gera as folhas de sprites para o Godot a partir dos mesmos desenhos da página.
   Roda num Chrome sem janela (exportar.html) e escreve tudo como JSON num <pre id="saida">;
   o script exportar.py lê esse JSON e grava os PNGs e as descrições em game/assets/pixel/.

   Personagens: uma folha por personagem, células do mesmo tamanho, uma linha por animação,
   âncora (pés, linha d'água ou ponto do teto) no mesmo pixel de todas as células.
   Projéteis e efeitos: quadros PNG soltos (nome_1.png, nome_2.png...), como bola_fogo_1..4.png.
   Cenários: 8 quadros de 480×270 para o fundo e, quando há, para a frente. */

const saida = { personagens: {}, efeitos: {}, arenas: {} };
const png = tela => tela.toDataURL('image/png').split(',')[1];
const rel = (p, a) => [Math.round(p.x - a.x), Math.round(p.y - a.y)];

/* ---------- folha de personagem ----------
   quadros: [{ cam (Camada 480×270), pontos: { nome: pt } }] por animação; âncora em coordenadas da camada */
function montarFolha(nome, ancora, anims, celulaFixa) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const A of anims) for (const q of A.quadros) {
    const c = q.cam;
    if (c.x1 < 0) continue;
    x0 = Math.min(x0, c.x0 - ancora.x); y0 = Math.min(y0, c.y0 - ancora.y);
    x1 = Math.max(x1, c.x1 - ancora.x); y1 = Math.max(y1, c.y1 - ancora.y);
  }
  // margem de 1 px e célula com largura e altura pares
  let ax = -x0 + 1, ay = -y0 + 1, W = x1 - x0 + 3, H = y1 - y0 + 3;
  if (celulaFixa) { [W, H] = celulaFixa.celula; [ax, ay] = celulaFixa.ancora; }
  W += W % 2; H += H % 2;
  const colunas = Math.max(...anims.map(A => A.quadros.length));
  const tela = document.createElement('canvas');
  tela.width = colunas * W; tela.height = anims.length * H;
  const ctx = tela.getContext('2d');
  const meta = { imagem: nome + '.png', celula: [W, H], ancora: [ax, ay], escala_no_jogo: 4, animacoes: [] };
  anims.forEach((A, linha) => {
    const pontos = {};
    // caixa: o que todos os quadros da animação ocupam, relativo à âncora [x0, y0, x1, y1]
    // (x1 e y1 exclusivos). O jogo usa para a área de dano acompanhar a pose.
    let cx0 = Infinity, cy0 = Infinity, cx1 = -Infinity, cy1 = -Infinity;
    A.quadros.forEach((q, col) => {
      const t = q.cam.paraTela();
      ctx.drawImage(t, ancora.x - ax, ancora.y - ay, W, H, col * W, linha * H, W, H);
      for (const [k, p] of Object.entries(q.pontos || {})) (pontos[k] = pontos[k] || []).push(rel(p, ancora));
      const c = q.cam;
      if (c.x1 >= 0) { cx0 = Math.min(cx0, c.x0); cy0 = Math.min(cy0, c.y0); cx1 = Math.max(cx1, c.x1 + 1); cy1 = Math.max(cy1, c.y1 + 1); }
    });
    const caixa = cx1 > cx0 ? [cx0 - ancora.x, cy0 - ancora.y, cx1 - ancora.x, cy1 - ancora.y] : [0, 0, 0, 0];
    meta.animacoes.push({ nome: A.nome, linha, quadros: A.quadros.length, fps: Math.round(A.fps * 10) / 10, loop: A.loop, caixa, ...(Object.keys(pontos).length ? { pontos } : {}), ...(A.nota ? { nota: A.nota } : {}) });
  });
  saida.personagens[nome] = { meta, png: png(tela) };
}

/* ---------- Curupira ---------- */
function exportarCurupira() {
  const anims = [];
  const quadroCur = (pose, t) => {
    const r = curupiraPixel(pose, t);
    const cam = new Camada(QW, QH); cam.colar(r.cam);
    return { cam, pontos: { mao: r.mao } };
  };
  const porAnim = (id, nome, opcoes = {}) => {
    const A = ANIMS_PX.find(a => a.id === id), n = opcoes.n || NQ_EXP[id];
    const quadros = Array.from({ length: n }, (_, k) => { const p = k / n, t = p * A.ciclo; return quadroCur(A.pose(p, t), t); });
    anims.push({ nome, quadros, fps: n / A.ciclo, loop: opcoes.loop ?? true, nota: opcoes.nota });
  };
  const porPoses = (nome, lista, fps, loop, nota) => anims.push({ nome, quadros: lista.map(([pose, t]) => quadroCur(pose, t)), fps, loop, nota });
  porAnim('parado', 'idle');
  porAnim('correr', 'correr');
  // pulo em três partes: sobe, cai e pousa (a altura vem do código, aqui é só o corpo)
  const P = s => [posePularPx(s / 1.5, s), s];
  porPoses('pular', [0.02, 0.06, 0.12, 0.2, 0.3, 0.4].map(P), 12, false, 'impulso e subida; para no último quadro');
  porPoses('cair', [0.5, 0.58, 0.66, 0.74, 0.82].map(P), 10, false, 'queda; para no último quadro');
  porPoses('pouso', [0.868, 0.9, 0.94, 0.98].map(P), 20, false);
  // dash: o trecho de 0,2 s do dash e o freio
  const D = s => [poseDash(s / 1.4, s), s];
  porPoses('dash', [0.12, 0.17, 0.22, 0.27].map(D), 20, true, '0,2 s, como no GDD');
  porPoses('freio', [0.31, 0.36, 0.42, 0.48].map(D), 16, false);
  // atirar: parado, nas quatro direções do chão
  porAnim('atacar', 'atirar', { nota: 'para a frente' });
  porAnim('atirar_diag_cima', 'atirar_diag_cima');
  porAnim('atirar_cima', 'atirar_cima');
  porAnim('atirar_diag_baixo', 'atirar_diag_baixo', { nota: 'no chão, só com a mira travada' });
  porAnim('atacar_correndo', 'correr_atirar');
  porAnim('correr_atirar_diag_cima', 'correr_atirar_diag_cima');
  // no ar: cinco direções, a mesma pose para subir e cair
  for (const k of ['cima', 'diag_cima', 'lado', 'diag_baixo', 'baixo']) porAnim('ar_atirar_' + k, 'ar_atirar_' + k, { nota: k === 'baixo' ? 'para baixo só existe no ar' : undefined });
  // agachar: descer, ficar, atirar, levantar
  const AB = ANIMS_PX.find(a => a.id === 'abaixar');
  porPoses('abaixar', [0, 0.025, 0.05, 0.08, 0.11].map(p => [AB.pose(p, p * AB.ciclo), p * AB.ciclo]), 18, false);
  porPoses('agachado', Array.from({ length: 8 }, (_, k) => { const t = k / 8 * (TAU / 4); return [agachadoPx(t), t]; }), 5.1, true);
  porAnim('agachado_atirar', 'agachado_atirar');
  porPoses('levantar', [0.87, 0.91, 0.95, 0.99].map(p => [AB.pose(p, p * AB.ciclo), p * AB.ciclo]), 16, false);
  porAnim('especial', 'especial', { loop: false, nota: 'o cabelo pega fogo e apaga; a onça sai no quadro 7' });
  const DR = ANIMS_PX.find(a => a.id === 'derrota');
  porPoses('dano', [0.03, 0.06].map(p => [DR.pose(p, p * DR.ciclo), p * DR.ciclo]), 12, false, 'o código pisca o sprite durante a invencibilidade');
  porAnim('derrota', 'derrota', { loop: false });
  montarFolha('curupira', pt(OX, OY), anims);
  // tiros do Curupira: folha nas cinco direções e a onça do especial
  for (const a of [-90, -45, 0, 45, 90]) {
    const nome = 'folha_' + { '-90': 'cima', '-45': 'diag_cima', 0: 'lado', 45: 'diag_baixo', 90: 'baixo' }[a];
    efeito('curupira', nome, [0, 0.06].map(t => folhaDirecao(a, t)), 12, true, [7, 7], 'olhando para a direita; espelhar para a esquerda');
  }
  efeito('curupira', 'onca', [0, 0.07].map(t => oncaPixel(t)), 12, true, [10, 10]);
}
const NQ_EXP = { parado: 12, correr: 6, atacar: 4, atacar_correndo: 6, especial: 16, derrota: 22, atirar_cima: 4, atirar_diag_cima: 4, atirar_diag_baixo: 4, correr_atirar_diag_cima: 6, agachado_atirar: 4, ar_atirar_cima: 4, ar_atirar_diag_cima: 4, ar_atirar_lado: 4, ar_atirar_diag_baixo: 4, ar_atirar_baixo: 4 };

/* ---------- efeitos (quadros soltos) ---------- */
function efeito(pasta, nome, camadas, fps, loop, centro, nota) {
  // recorta todos os quadros na mesma caixa, para o centro não pular entre um e outro
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of camadas) if (c.x1 >= 0) { x0 = Math.min(x0, c.x0); y0 = Math.min(y0, c.y0); x1 = Math.max(x1, c.x1); y1 = Math.max(y1, c.y1); }
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  const quadros = camadas.map(c => { const t = document.createElement('canvas'); t.width = W; t.height = H; t.getContext('2d').drawImage(c.paraTela(), x0, y0, W, H, 0, 0, W, H); return png(t); });
  saida.efeitos[pasta + '/' + nome] = { pasta, nome, fps, loop, tamanho: [W, H], centro: [centro[0] - x0, centro[1] - y0], quadros, ...(nota ? { nota } : {}) };
}
// desenha um efeito centrado no meio da arena e devolve a camada
const C0 = pt(240, 135);
const em = fn => { const cam = nova(); fn(cam, C0.x, C0.y); return cam; };
const seq = (n, fn) => Array.from({ length: n }, (_, k) => em((cam, x, y) => fn(cam, x, y, k / n, k)));
function girar90(cam, vezes) {
  let c = cam;
  for (let v = 0; v < vezes; v++) {
    const n = nova();
    for (const [x, y] of c.pixels()) n.set(C0.x - (y - C0.y), C0.y + (x - C0.x), c.get(x, y));
    c = n;
  }
  return c;
}

/* ---------- chefes ----------
   Cada animação pega um trecho [s0, s1] de um estado da página (ou um s fixo com o tempo correndo),
   desenha só o corpo (os projéteis viram efeitos à parte) e trava o chefe no lugar: quem anda,
   pula ou desce na arena é o código. depois = true inclui efeitos presos ao corpo (estrelas, chip). */
function exportarChefe(B, desenhar, ancoraDe, lista, pontosDe) {
  const anims = lista.map(([nome, e, s0, s1, fps, loop, op = {}]) => {
    const n = op.n || Math.max(1, Math.round((s1 - s0) * fps));
    const quadros = Array.from({ length: n }, (_, k) => {
      const u = loop ? k / n : (n === 1 ? 0 : k / (n - 1));
      const s = op.sFixo ?? mix(s0, s1, u), t = op.sFixo !== undefined ? mix(s0, s1, u) : s;
      const q = B.estados[e].quadro(s, t);
      op.ajuste?.(q.R);
      const cam = nova(), info = desenhar(cam, q.R, t);
      if (op.depois && q.depois) q.depois(cam, info);
      return { cam, pontos: pontosDe(info) };
    });
    return { nome, quadros, fps, loop, nota: op.nota };
  });
  montarFolha(B.id, ancoraDe, anims);
}
const noLugar = X => R => { R.X = X; R.x = 0; R.sx = 1; };

function exportarMula() {
  const B = CHEFES_PX.find(b => b.id === 'mula'), X = 240, aj = noLugar(X);
  exportarChefe(B, (cam, R, t) => mulaPx(cam, R, t, null), pt(X, CHAO_PX), [
    ['idle', 'idle', 0, 2.4, 12, true, { ajuste: aj }],
    ['aviso_bolas', 'bolas', 0, 0.5, 12, false, { ajuste: aj, nota: 'abaixa o peito até a altura das bolas' }],
    ['bolas', 'bolas', 0.55, 1.0, 12, true, { ajuste: aj, nota: 'um coice por bola: recomeçar a cada tiro' }],
    ['fim_bolas', 'bolas', 2.0, 2.5, 12, false, { ajuste: aj }],
    ['aviso_pisoteio', 'pisoteio', 0, 0.55, 12, false, { ajuste: aj }],
    ['pisoteio_alto', 'pisoteio', 0.55, 0.85, 12, true, { ajuste: aj, nota: 'segura no alto tremendo; dura o resto do aviso' }],
    ['pisoteio', 'pisoteio', 0.85, 1.5, 12, false, { ajuste: aj, nota: 'a onda de fogo sai no quadro 2' }],
    ['aviso_investida', 'investida', 0, 0.9, 12, false, { ajuste: aj, nota: 'raspa o casco duas vezes' }],
    ['galope', 'investida', 0.95, 0.95 + 1 / 4.5, 27, true, { ajuste: aj, n: 6 }],
    ['batida', 'investida', 1.5, 1.75, 12, false, { ajuste: aj, depois: true }],
    ['tonta', 'investida', 1.8, 2.4, 12, true, { ajuste: aj, depois: true, nota: 'janela de punição' }],
    ['trote', 'investida', 2.6, 2.6 + 1 / 2.6, 16, true, { ajuste: aj, n: 6, nota: 'voltando ao lugar; o código espelha' }],
    ['aviso_meteoros', 'meteoros', 0, 0.5, 12, false, { ajuste: aj }],
    ['meteoros', 'meteoros', 0.5, 1.1, 12, true, { ajuste: aj, nota: 'cada pedra sai da ponta do fogo' }],
    ['cansada', 'meteoros', 0, 1.0, 12, true, { ajuste: aj, sFixo: 2.2 }],
    ['derrota', 'derrota', 0, 3.6, 10, false, { ajuste: aj, depois: true }]
  ], info => ({ boca: info.boca, ponta_fogo: info.pontaFogo, frente: info.frente }));
  efeito('mula', 'bola_fogo', [0, 0.08, 0.16, 0.24].map(t => em((c, x, y) => bolaFogoPx(c, x, y, 4.5, t))), 12, true, [C0.x, C0.y], 'anda para a esquerda; espelhar para a direita');
  efeito('mula', 'onda_fogo', [0, 0.08, 0.16, 0.24].map(t => em((c, x, y) => { for (let i = 0; i < 3; i++) chamaPx(c, x - 7 + i * 7, y, 270 + i * 8, 9, 16 - i * 4, t + i, { n: 3, vel: 16 }); })), 12, true, [C0.x, C0.y], 'base no chão (centro = ponto de apoio)');
  efeito('mula', 'rocha', seq(8, (c, x, y, u) => desenharRocha(c, x, y, u * TAU / 3, true)), 12, true, [C0.x, C0.y], 'subindo');
  efeito('mula', 'rocha_caindo', seq(4, (c, x, y, u) => desenharRocha(c, x, y, u * 0.33, true, true)), 12, true, [C0.x, C0.y]);
  efeito('mula', 'sombra_meteoro', seq(8, (c, x, y, u) => aviso(() => { elipse(c, x, y, 2 + 9 * u, 1 + 1.5 * u, '#3A2324'); anelAviso(c, x, y, 4 + 10 * u, 2 + 2 * u, u * 2, PM.fogo2); })), 8, false, [C0.x, C0.y], 'aviso no chão; tocar durante o tempo de queda');
  efeito('mula', 'explosao', seq(8, (c, x, y, u) => explosaoPx(c, x, y, u, 15)), 24, false, [C0.x, C0.y]);
  efeito('mula', 'fogo_chao', [0, 0.08, 0.16, 0.24].map(t => em((c, x, y) => chamaPx(c, x, y, 270, 10, 9, t, { n: 3 }))), 12, true, [C0.x, C0.y], 'base no chão');
  efeito('mula', 'poeira', seq(6, (c, x, y, u) => poeiraPx(c, x, y, u)), 15, false, [C0.x, C0.y], 'base no chão');
}
function exportarCuca() {
  const B = CHEFES_PX.find(b => b.id === 'cuca'), X = 240, aj = noLugar(X);
  exportarChefe(B, (cam, R, t) => cucaPx(cam, R, t, null), pt(X, CHAO_PX), [
    ['idle', 'idle', 0, 2.4, 12, true, { ajuste: aj }],
    ['aviso_feitico', 'leque', 0, 0.75, 12, false, { ajuste: aj, depois: true, nota: 'as bolas crescem nas garras' }],
    ['feitico', 'leque', 0.75, 1.0, 12, false, { ajuste: aj, nota: 'empurra; os feitiços saem no quadro 1' }],
    ['fim_feitico', 'leque', 1.6, 2.1, 12, false, { ajuste: aj }],
    ['aviso_pocao', 'pocao', 0, 0.75, 12, false, { ajuste: aj, depois: true, nota: 'tira a poção do cinto e chacoalha rindo' }],
    ['pocao', 'pocao', 0.75, 0.9, 12, false, { ajuste: aj, nota: 'arremesso; o frasco sai da garra' }],
    ['fim_pocao', 'pocao', 1.5, 2.0, 12, false, { ajuste: aj }],
    ['aviso_bote', 'bote', 0, 0.6, 12, false, { ajuste: aj, nota: 'agacha com a bocarra aberta' }],
    ['bote', 'bote', 0, 0.7, 12, true, { ajuste: aj, sFixo: 1.0, nota: 'deslizando de barriga; o código move' }],
    ['levantar', 'bote', 1.6, 1.95, 12, false, { ajuste: aj }],
    ['andar', 'bote', 2.2, 2.2 + TAU / 5, 12, true, { ajuste: aj, nota: 'voltando ao lugar; o código espelha' }],
    ['aviso_ninar', 'ninar', 0, 0.35, 12, false, { ajuste: aj }],
    ['ninar', 'ninar', 0, TAU / 4, 12, true, { ajuste: aj, sFixo: 1.5, nota: 'cantando; as notas saem da boca' }],
    ['fim_ninar', 'ninar', 2.9, 3.3, 12, false, { ajuste: aj }],
    ['derrota', 'derrota', 0, 3.6, 10, false, { ajuste: aj, depois: true }]
  ], info => ({ garra: info.mao[0], boca: info.boca }));
  efeito('cuca', 'feitico', [0, 0.08, 0.16, 0.24].map(t => em((c, x, y) => orbePx(c, x, y, 6.5, t))), 12, true, [C0.x, C0.y]);
  const fr = em((c, x, y) => frascoPx(c, pt(x, y), PCU.roxo, 0, true));
  efeito('cuca', 'pocao_veneno', [0, 1, 2, 3].map(v => girar90(fr, v)), 12, true, [C0.x, C0.y], 'girando no voo');
  const frA = em((c, x, y) => frascoPx(c, pt(x, y), '#3B82C4', 0, true));
  efeito('cuca', 'pocao_lentidao', [0, 1, 2, 3].map(v => girar90(frA, v)), 12, true, [C0.x, C0.y], 'girando no voo');
  efeito('cuca', 'poca_veneno', seq(6, (c, x, y, u) => pocaPx(c, x, 18, u * 2.5)), 8, true, [C0.x, CHAO_PX], 'centro na linha do chão');
  efeito('cuca', 'poca_lentidao', seq(6, (c, x, y, u) => pocaPx(c, x, 18, u * 2.5, ['#1C2A58', '#3B82C4', '#8CC0EC'])), 8, true, [C0.x, CHAO_PX], 'centro na linha do chão');
  efeito('cuca', 'vidro_quebrando', seq(6, (c, x, y, u) => explosaoPx(c, x, y, u, 10, [PCU.roxo, PCU.roxoL, PM.branco], PCU.roxoD)), 20, false, [C0.x, C0.y]);
  efeito('cuca', 'nota', [0, 1, 2, 3].map(k => em((c, x, y) => notaPx(c, x, y, k, 0))), 6, true, [C0.x, C0.y]);
}
function exportarBoto() {
  const B = CHEFES_PX.find(b => b.id === 'boto'), X = 240, aj = noLugar(X);
  const ajSalto = R => { aj(R); R.y = 0; };
  exportarChefe(B, (cam, R, t) => botoPx(cam, R, t), pt(X, AGUA_Y), [
    ['idle', 'idle', 0, 2.4, 12, true, { ajuste: aj }],
    ['aviso_jato', 'jato', 0, 0.8, 12, false, { ajuste: aj, depois: true, nota: 'incha e puxa gotas para o bico' }],
    ['jato', 'jato', 0, 0.5, 12, true, { ajuste: aj, sFixo: 1.2, nota: 'boca aberta; o jato sai reto do bico' }],
    ['fim_jato', 'jato', 1.9, 2.4, 12, false, { ajuste: aj }],
    ['aviso_beijos', 'beijos', 0, 0.45, 12, false, { ajuste: aj }],
    ['beijos', 'beijos', 0.45, 0.9, 12, true, { ajuste: aj, nota: 'um beijo por volta' }],
    ['fim_beijos', 'beijos', 2.0, 2.4, 12, false, { ajuste: aj }],
    ['aviso_chapeu', 'chapeu', 0, TAU / 18, 12, true, { ajuste: aj, sFixo: 0.4, depois: true, n: 6, nota: 'gira o chapéu na nadadeira' }],
    ['arremesso', 'chapeu', 0.6, 0.8, 12, false, { ajuste: aj }],
    ['sem_chapeu', 'chapeu', 0, 0.5, 12, true, { ajuste: aj, sFixo: 1.5, nota: 'esperando o chapéu voltar; o espiráculo espirra' }],
    ['pega_chapeu', 'chapeu', 2.4, 2.6, 12, false, { ajuste: aj }],
    ['mergulho', 'salto', 0, 0.45, 12, false, { ajuste: aj }],
    ['salto', 'salto', 0.45, 1.5, 12, false, { ajuste: ajSalto, nota: 'só o giro; o arco do salto é do código' }],
    ['emergir', 'salto', 3.15, 3.5, 12, false, { ajuste: aj }],
    ['derrota', 'derrota', 0, 3.6, 10, false, { ajuste: aj, depois: true }]
  ], info => ({ bico: info.bico, nadadeira: info.fin }));
  // jato: pedaço do meio (repete na horizontal), boca e ponta
  efeito('boto', 'jato_meio', [0, 1, 2, 3].map(k => em((c, x, y) => {
    for (let i = 0; i < 18; i++) { const xx = x - 9 + i; for (let d = -3; d <= 3; d++) c.set(xx, y + d, Math.abs(d) === 3 ? PBO.aguaO : d >= 2 ? PBO.aguaD : PBO.agua); if ((i + k * 2) % 9 < 3) c.set(xx, y - 2 + ((i + k * 2) % 9 === 2 ? 1 : 0), PBO.aguaL); }
  })), 16, true, [C0.x, C0.y], 'emendar lado a lado (18 px); rolar os quadros dá o movimento');
  efeito('boto', 'jato_ponta', [0, 0.1, 0.2, 0.3].map(t => em((c, x, y) => { const b = nova(); b.disco(x, y, 4.5, PBO.agua); b.disco(x - 1, y - 1.5, 1.8, PBO.aguaL); c.colar(b.contornar(PBO.aguaO)); for (let i = 0; i < 3; i++) gotaPx(c, x - 4 - i * 3, y - 5 - ((t * 5 + i * 0.3) % 1) * 10); })), 12, true, [C0.x, C0.y]);
  efeito('boto', 'bola_agua', seq(6, (c, x, y, u) => { const b = nova(); b.disco(x, y, 1 + 5 * u, PBO.agua); b.disco(x - 1, y - 1.5, 2 * u, PBO.aguaL); c.colar(b.contornar(PBO.aguaO)); }), 8, false, [C0.x, C0.y], 'aviso no bico; cresce durante o aviso');
  efeito('boto', 'gota', [em((c, x, y) => gotaPx(c, x, y))], 1, false, [C0.x, C0.y]);
  efeito('boto', 'coracao', [0, 0.2].map(t => em((c, x, y) => coracaoPx(c, x, y, t))), 6, true, [C0.x, C0.y]);
  efeito('boto', 'coracao_estoura', seq(4, (c, x, y, u) => coracaoPx(c, x, y, 0, 0.15 + u)), 16, false, [C0.x, C0.y]);
  efeito('boto', 'chapeu', seq(8, (c, x, y, u) => chapeuPx(c, x, y, u * 360, 0)), 16, true, [C0.x, C0.y], 'girando no voo');
  efeito('boto', 'respingo', seq(6, (c, x, y, u) => respingoPx(c, x, y, u)), 15, false, [C0.x, C0.y], 'na linha da água');
}
function exportarMaquina() {
  const B = CHEFES_PX.find(b => b.id === 'maquina'), X = 240;
  // a âncora é o ponto do trilho no teto: o braço e a descida já estão no desenho
  const aj = R => { const dx = X - R.X; R.X = X; R.cx += dx; };
  exportarChefe(B, (cam, R, t) => maquinaPx(cam, R, t), pt(X + 22, MAQ_TETO), [
    ['idle', 'idle', 0, 2.4, 12, true, { ajuste: aj }],
    ['aviso_laser', 'laser', 0, 0.4, 12, false, { ajuste: aj, nota: 'a lente abre; a linha de mira é do código' }],
    ['mirando', 'laser', 0, 0.5, 12, true, { ajuste: aj, sFixo: 0.8 }],
    ['laser', 'laser', 0, 0.3, 20, true, { ajuste: aj, sFixo: 1.6, nota: 'disparando; o feixe sai da lente' }],
    ['fim_laser', 'laser', 2.0, 2.3, 12, false, { ajuste: aj }],
    ['aviso_bombas', 'bombas', 0, 0.4, 12, false, { ajuste: aj, nota: 'recolhe para o alto' }],
    ['bombas', 'bombas', 0, 1.0, 12, true, { ajuste: aj, sFixo: 1.0 }],
    ['fim_bombas', 'bombas', 2.4, 2.9, 12, false, { ajuste: aj }],
    ['aviso_pistoes', 'pistoes', 0, 0.5, 12, false, { ajuste: aj }],
    ['pistoes', 'pistoes', 0, 1.0, 12, true, { ajuste: aj, sFixo: 1.0 }],
    ['descer', 'varredura', 0, 0.5, 12, false, { ajuste: aj, nota: 'desce até a altura do Curupira' }],
    ['varredura', 'varredura', 0, 0.5, 12, true, { ajuste: aj, sFixo: 1.2, nota: 'laser reto' }],
    ['varredura_chao', 'varredura', 0, 0.5, 12, true, { ajuste: aj, sFixo: 2.5, nota: 'lente apontada para o chão' }],
    ['subir', 'varredura', 3.0, 3.6, 12, false, { ajuste: aj }],
    ['derrota', 'derrota', 0, 3.8, 10, false, { ajuste: aj, depois: true, nota: 'nasce um broto da rachadura' }]
  ], info => ({ lente: info.lente }));
  efeito('maquina', 'laser_meio', [0, 1, 2, 3].map(k => em((c, x, y) => laserPx(c, pt(x - 8, y), pt(x + 7, y), 2.4, k / 30))), 20, true, [C0.x, C0.y], 'emendar lado a lado (16 px)');
  efeito('maquina', 'laser_impacto', seq(4, (c, x, y, u) => { explosaoPx(c, x, y, u * 0.5, 7, [PMQ.laser, PMQ.laserL, PM.branco], PMQ.laserD); faiscasPx(c, x, y, u, 6, 3); }), 16, true, [C0.x, C0.y]);
  efeito('maquina', 'bomba', [0, 0.1, 0.2, 0.3].map(t => em((c, x, y) => bombaPx(c, x, y, t, true))), 8, true, [C0.x, C0.y], 'em fps 8 pisca devagar; no fim do aviso subir para 16');
  efeito('maquina', 'explosao', seq(8, (c, x, y, u) => explosaoPx(c, x, y, u, 16, [PM.fogo3, PM.fogo6, PM.branco])), 24, false, [C0.x, C0.y]);
  efeito('maquina', 'alcapao', seq(4, (c, x, y, u) => alcapaoPx(c, x, (u + 0.25))), 12, false, [C0.x, MAQ_TETO], 'abrindo; o centro fica na linha do teto');
  efeito('maquina', 'placa', seq(6, (c, x, y, u) => placaPx(c, x, 15 * Math.sin((u + 1 / 12) * Math.PI))), 20, false, [C0.x, CHAO_PX], 'sobe e desce; centro na linha do chão');
  efeito('maquina', 'faiscas', seq(6, (c, x, y, u) => faiscasPx(c, x, y, u, 8, 1)), 15, false, [C0.x, C0.y]);
}
function exportarArenas() {
  for (const id of Object.keys(ARENAS_PX)) {
    const quadros = Array.from({ length: QUADROS_ARENA }, (_, k) => ARENAS_PX[id].quadro(k * LACO_ARENA / QUADROS_ARENA));
    saida.arenas[id] = {
      fps: QUADROS_ARENA / LACO_ARENA, fundo: quadros.map(q => png(q.cam.paraTela())),
      frente: quadros[0].frente ? quadros.map(q => png(q.frente.paraTela())) : null,
      chao_y: CHAO_PX, curupira_x: ARENAS_PX[id].x
    };
  }
}

try {
  exportarCurupira(); exportarAtaquesJogador(); exportarMula(); exportarCuca(); exportarBoto(); exportarMaquina(); exportarArenas(); exportarMenu(); exportarHud();
  document.getElementById('saida').textContent = JSON.stringify(saida);
  document.title = 'pronto';
} catch (e) { document.getElementById('saida').textContent = 'ERRO ' + e.stack; }
