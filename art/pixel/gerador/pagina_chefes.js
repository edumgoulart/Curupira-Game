/* pagina_chefes.js — seção C: chefes e arenas desenhados à mão, com a luta em fases
   e o Curupira jogável (sem dano de verdade: só pisca e conta os golpes). */

const lutaTela = document.getElementById('luta'), lutaCtx = lutaTela.getContext('2d');
const luta = { B: CHEFES_PX[0], modo: 'luta', t: 0, roteiro: [], total: 0, cache: new Map(), arenas: {}, quadrosCur: null, atual: null };

/* ---------- quadros do chefe: desenhados sob demanda a 12 por segundo e guardados ---------- */
function quadroChefe(B, e, s) {
  const idx = Math.floor(s * 12), chave = B.id + '|' + e + '|' + idx;
  let q = luta.cache.get(chave);
  if (!q) {
    if (luta.cache.size > 900) luta.cache.clear();
    const cam = nova(), r = B.desenhar(cam, e, idx / 12, idx / 12, B.sombra), rc = cam.recorte();
    // máscara dos pixels pintados: serve para ver se o Curupira encostou em algo
    const w = rc.tela.width, h = rc.tela.height, mascara = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = (y + rc.y) * ARENA_W + x + rc.x;
      if (cam.c[k] && !(cam.seguro && cam.seguro[k])) mascara[y * w + x] = 1;
    }
    q = { ...rc, w, h, mascara, treme: r.treme || 0 };
    luta.cache.set(chave, q);
  }
  return q;
}
function tocaChefe(q, x0, y0, x1, y1) {
  for (let y = Math.max(y0, q.y); y < Math.min(y1, q.y + q.h); y++) for (let x = Math.max(x0, q.x); x < Math.min(x1, q.x + q.w); x++) if (q.mascara[(y - q.y) * q.w + x - q.x]) return true;
  return false;
}
function arenaDe(B) {
  if (!luta.arenas[B.id]) luta.arenas[B.id] = Array.from({ length: 8 }, (_, k) => {
    const { cam, frente } = ARENAS_PX[B.id].quadro(k * 0.25);
    return { fundo: cam.paraTela(), frente: frente ? frente.paraTela() : null };
  });
  return luta.arenas[B.id];
}

/* ---------- roteiro: a luta inteira (fases + derrota) ou um ataque repetindo ---------- */
function montarRoteiro() {
  const B = luta.B, lista = [];
  if (luta.modo === 'luta') {
    B.fases.forEach((f, i) => f.roteiro.forEach(([e, d]) => lista.push({ e, dur: d ?? B.estados[e].dur, fase: i })));
    lista.push({ e: 'derrota', dur: B.estados.derrota.dur + 1.2, fase: B.fases.length - 1 });
  } else if (luta.modo === 'derrota') lista.push({ e: 'idle', dur: 0.8, fase: 0 }, { e: 'derrota', dur: B.estados.derrota.dur + 1.2, fase: B.fases.length - 1 });
  else {
    const fase = B.fases.findIndex(f => f.ataques.includes(luta.modo));
    lista.push({ e: 'idle', dur: 1.0, fase }, { e: luta.modo, dur: B.estados[luta.modo].dur, fase });
  }
  let ini = 0;
  for (const item of lista) { item.ini = ini; ini += item.dur; }
  luta.roteiro = lista; luta.total = ini; luta.t = 0;
}

/* ---------- Curupira jogável ---------- */
const jog = { x: 105, y: 0, vy: 0, dir: 1, chao: true, dash: 0, recarga: 0, tiro: 0, folhas: [], invul: 0, golpes: 0, aviso: 0, ativo: false, t: 0, teclas: new Set(), faiscas: [] };
const TECLAS = { esq: ['KeyA', 'ArrowLeft'], dir: ['KeyD', 'ArrowRight'], cima: ['KeyW', 'ArrowUp'], pulo: ['Space'], baixo: ['KeyS', 'ArrowDown'], tiro: ['KeyJ'], dash: ['KeyL'], trava: ['ShiftLeft', 'ShiftRight'] };
const aperta = nome => TECLAS[nome].some(k => jog.teclas.has(k));
lutaTela.addEventListener('keydown', e => {
  if (Object.values(TECLAS).flat().includes(e.code)) e.preventDefault();
  if (!jog.ativo) { jog.ativo = true; jog.x = ARENAS_PX[luta.B.id].x; }
  if (!jog.teclas.has(e.code)) {
    if (TECLAS.pulo.includes(e.code) && jog.chao && jog.dash <= 0) { jog.vy = 275; jog.chao = false; }
    if (TECLAS.dash.includes(e.code) && jog.recarga <= 0) { jog.dash = 0.2; jog.recarga = 0.5; jog.vy = Math.max(jog.vy, 0); }
  }
  jog.teclas.add(e.code);
});
lutaTela.addEventListener('keyup', e => {
  jog.teclas.delete(e.code);
  if (TECLAS.pulo.includes(e.code) && jog.vy > 80) jog.vy *= 0.5;   // pulo variável: soltar cedo pula menos
});
lutaTela.addEventListener('blur', () => jog.teclas.clear());
lutaTela.addEventListener('pointerdown', () => lutaTela.focus());

const IDS_JOGO = ['parado', 'correr', 'atacar', 'atacar_correndo', 'pular', 'abaixar', 'dash', 'agachado_atirar', 'atirar_cima', 'atirar_diag_cima', 'atirar_diag_baixo', 'correr_atirar_diag_cima',
  'ar_atirar_cima', 'ar_atirar_diag_cima', 'ar_atirar_lado', 'ar_atirar_diag_baixo', 'ar_atirar_baixo'];
Promise.all(IDS_JOGO.map(id => FONTE_MAO.obter(ANIMS_PX.find(a => a.id === id))))
  .then(listas => { luta.quadrosCur = Object.fromEntries(IDS_JOGO.map((id, i) => [id, listas[i]])); });
// mira pelas setas: cima/baixo + frente; no chão, baixo agacha e a diagonal para baixo pede a mira travada
function miraAtual(noChao, travada) {
  const v = (aperta('baixo') ? 1 : 0) - (aperta('cima') ? 1 : 0), h = aperta('dir') || aperta('esq');
  if (v < 0) return h ? 'diag_cima' : 'cima';
  if (v > 0 && !noChao) return h ? 'diag_baixo' : 'baixo';
  if (v > 0 && travada) return 'diag_baixo';
  return 'lado';
}

function atualizarJogador(dt, qChefe) {
  const Q = luta.quadrosCur;
  jog.t += dt; jog.invul -= dt; jog.recarga -= dt; jog.aviso -= dt;
  const trava = aperta('trava') && jog.chao, baixo = aperta('baixo') && jog.chao && !trava, atira = aperta('tiro');
  const mira = miraAtual(jog.chao, trava);
  if (jog.dash > 0) { jog.dash -= dt; jog.x += jog.dir * 375 * dt; }
  else {
    const mov = (aperta('dir') ? 1 : 0) - (aperta('esq') ? 1 : 0);
    if (mov) jog.dir = mov;
    if (!baixo && !trava) jog.x += mov * 150 * dt;
    if (!jog.chao) { jog.vy -= 700 * dt; jog.y += jog.vy * dt; if (jog.y <= 0) { jog.y = 0; jog.vy = 0; jog.chao = true; } }
  }
  jog.x = clamp(jog.x, 14, ARENA_W - 14);
  // quadro conforme o estado (os mesmos sprites das animações da seção A)
  const anda = (aperta('dir') || aperta('esq')) && !baixo && !trava;
  const ciclo = (L, c) => Math.floor(jog.t / c * L.length) % L.length;
  let lista, k;
  if (jog.dash > 0) { lista = Q.dash; k = 2; }
  else if (!jog.chao) { if (atira) { lista = Q['ar_atirar_' + mira]; k = ciclo(lista, 0.4); } else { lista = Q.pular; k = jog.vy > 120 ? 3 : jog.vy > -60 ? 6 : 8; } }
  else if (baixo) { if (atira) { lista = Q.agachado_atirar; k = ciclo(lista, 0.4); } else { lista = Q.abaixar; k = 9; } }
  else if (anda) { lista = atira ? (mira === 'diag_cima' ? Q.correr_atirar_diag_cima : Q.atacar_correndo) : Q.correr; k = ciclo(lista, 0.48); }
  else if (atira || trava) { lista = mira === 'lado' ? Q.atacar : Q['atirar_' + mira]; k = atira ? ciclo(lista, 0.4) : 2; }
  else { lista = Q.parado; k = ciclo(lista, 1.6); }
  const q = lista[k];
  // tiros de folha a cada 0,2 s, saindo da mão
  jog.tiro -= dt;
  if (atira && jog.tiro <= 0 && jog.dash <= 0) {
    jog.tiro = INTERVALO_TIRO;
    const ang = q.pose.miraAng ?? 0;
    jog.folhas.push({ x: jog.x + jog.dir * (q.mao.x + 2), y: CHAO_PX - jog.y + q.mao.y, dir: jog.dir, ang });
  }
  for (const f of jog.folhas) { f.x += f.dir * 240 * Math.cos(rad(f.ang)) * dt; f.y += 240 * Math.sin(rad(f.ang)) * dt; }
  jog.folhas = jog.folhas.filter(f => {
    if (f.x < -10 || f.x > ARENA_W + 10 || f.y < -10 || f.y > CHAO_PX) return false;
    if (qChefe && tocaChefe(qChefe, Math.round(f.x) - 2, Math.round(f.y) - 2, Math.round(f.x) + 2, Math.round(f.y) + 2)) { jog.faiscas.push({ x: f.x, y: f.y, u: 0 }); return false; }
    return true;
  });
  for (const fa of jog.faiscas) fa.u += dt * 3;
  jog.faiscas = jog.faiscas.filter(fa => fa.u < 1);
  // golpe: encostar no chefe ou num ataque dele. O dash dá invencibilidade.
  if (qChefe && jog.invul <= 0 && jog.dash <= 0) {
    const base = Math.round(CHAO_PX - jog.y), cx = Math.round(jog.x);
    const caixa = baixo ? [cx - 10 * jog.dir, base - 22, cx + 12 * jog.dir, base] : [cx - 7, base - 46, cx + 7, base];
    if (tocaChefe(qChefe, Math.min(caixa[0], caixa[2]), caixa[1], Math.max(caixa[0], caixa[2]), caixa[3])) {
      jog.golpes++; jog.invul = 1.2;
      if (jog.golpes >= 4) { jog.golpes = 0; jog.aviso = 1.8; }
    }
  }
  return q;
}

/* ---------- desenho ---------- */
function desenharLutaPx(dt) {
  if (!luta.quadrosCur || !estaVisivel()) return;
  const B = luta.B, ctx = lutaCtx;
  luta.t = (luta.t + dt) % luta.total;
  const item = luta.roteiro.find(i => luta.t >= i.ini && luta.t < i.ini + i.dur) || luta.roteiro[0];
  const dur = B.estados[item.e].dur, s = item.e === 'idle' ? luta.t - item.ini : Math.min(luta.t - item.ini, dur - 1 / 24);
  const qc = quadroChefe(B, item.e, s);
  if (luta.atual !== item) { luta.atual = item; atualizarStatus(item); }
  const arena = arenaDe(B)[Math.floor(luta.t * 8) % 8];
  const treme = qc.treme ? Math.round((hash(Math.floor(luta.t * 30)) - 0.5) * 2 * qc.treme) : 0;
  ctx.save(); ctx.translate(treme, qc.treme ? Math.round((hash(Math.floor(luta.t * 30) + 7) - 0.5) * qc.treme) : 0);
  ctx.drawImage(arena.fundo, 0, 0);
  // Curupira: parado na marca até alguém jogar
  let q;
  if (jog.ativo) q = atualizarJogador(dt, qc);
  else { const L = luta.quadrosCur.parado; q = L[Math.floor(luta.t / 1.6 * L.length) % L.length]; jog.x = ARENAS_PX[B.id].x; jog.y = 0; jog.dir = 1; }
  const cores = CORES_PALCO.mao, base = Math.round(CHAO_PX - jog.y), x = Math.round(jog.x);
  if (B.id !== 'boto' || (x > 60 && x < 400)) elipsePx(ctx, x, CHAO_PX + 1, Math.max(3, 8 * (1 - Math.min(0.6, jog.y / 80))), 1, cores.sombra);
  if (!(jog.invul > 0 && Math.floor(jog.t * 20) % 2)) {
    if (jog.dir > 0) ctx.drawImage(q.tela, x - q.ox, base - q.oy);
    else { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(q.tela, -x - q.ox, base - q.oy); ctx.restore(); }
  }
  ctx.drawImage(qc.tela, qc.x, qc.y);
  for (const f of jog.folhas) {
    const fl = folhasTela[f.ang][Math.floor(jog.t * 12) % 2];
    if (f.dir > 0) ctx.drawImage(fl.tela, Math.round(f.x) - fl.cx, Math.round(f.y) - fl.cy);
    else { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(fl.tela, -Math.round(f.x) - fl.cx, Math.round(f.y) - fl.cy); ctx.restore(); }
  }
  for (const fa of jog.faiscas) for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, d = 2 + 5 * fa.u; ctx.fillStyle = fa.u < 0.5 ? '#FFF6BF' : '#86B83C'; ctx.fillRect(Math.round(fa.x + Math.cos(a) * d), Math.round(fa.y + Math.sin(a) * d), 1, 1); }
  if (arena.frente) ctx.drawImage(arena.frente, 0, 0);
  ctx.restore();
  // placar: vida do Curupira no canto inferior esquerdo (a do chefe não aparece, como no GDD)
  if (jog.ativo) {
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#1A1210'; ctx.fillRect(8 + i * 9, 252, 8, 8); ctx.fillStyle = i < 4 - jog.golpes ? '#E0461C' : '#4A2C24'; ctx.fillRect(9 + i * 9, 253, 6, 6); }
    if (jog.aviso > 0) { ctx.fillStyle = '#1A1210'; ctx.fillRect(160, 120, 160, 22); ctx.fillStyle = '#FFF6E8'; ctx.font = '12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('4 golpes: perdeu a fase', 240, 135); ctx.textAlign = 'start'; }
  }
}
const folhasTela = Object.fromEntries([-90, -45, 0, 45, 90].map(a => [a, [0, 0.06].map(t => ({ tela: folhaDirecao(a, t).paraTela(), cx: 7, cy: 7 }))]));
// só desenha a luta quando a arena está na tela (mesmo critério dos palcos da seção A)
let lutaVisivel = true;
new IntersectionObserver(es => { lutaVisivel = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(lutaTela);
const estaVisivel = () => lutaVisivel;

/* ---------- controles, status e cartões ---------- */
const caixaChefe = document.getElementById('escolha-chefe'), caixaAtaque = document.getElementById('escolha-ataque');
const statusLuta = document.getElementById('luta-status'), cartoesAtaque = document.getElementById('cartoes-ataques'), descArena = document.getElementById('desc-arena');
function atualizarStatus(item) {
  const B = luta.B, est = B.estados[item.e];
  statusLuta.innerHTML = `<b>${B.fases[item.fase].nome}</b> · ${est.nome}${est.dica ? ` <span class="dica">como desviar: ${est.dica}</span>` : ''}`;
  for (const c of cartoesAtaque.children) c.classList.toggle('ativo', c.dataset.id === item.e);
}
function montarAtaques() {
  const B = luta.B;
  caixaAtaque.innerHTML = ''; cartoesAtaque.innerHTML = '';
  const itens = [['luta', 'Luta inteira'], ...B.fases.flatMap((f, i) => f.ataques.map(a => [a, `F${i + 1} · ${B.estados[a].nome}`])), ['derrota', 'Derrota']];
  for (const [id, nome] of itens) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = nome; b.dataset.id = id; b.setAttribute('aria-pressed', id === luta.modo);
    b.addEventListener('click', () => { luta.modo = id; for (const x of caixaAtaque.children) x.setAttribute('aria-pressed', x.dataset.id === id); montarRoteiro(); });
    caixaAtaque.appendChild(b);
  }
  B.fases.forEach((f, i) => f.ataques.forEach(a => {
    const est = B.estados[a], el = document.createElement('article');
    el.className = 'cartao ataque'; el.dataset.id = a;
    el.innerHTML = `<div class="linha-topo"><h3>${est.nome}</h3><span class="chip">${f.nome}${i ? ' · novo' : ''}</span></div><p class="desc">${est.desc}</p><p class="desc"><b>Como desviar:</b> ${est.dica}</p>`;
    cartoesAtaque.appendChild(el);
  }));
  descArena.textContent = `${ARENAS_PX[B.id].nome}: ${ARENAS_PX[B.id].desc}`;
}
CHEFES_PX.forEach(B => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = B.nome; b.dataset.id = B.id; b.setAttribute('aria-pressed', B === luta.B);
  b.addEventListener('click', () => {
    luta.B = B; luta.modo = 'luta'; luta.cache.clear(); luta.atual = null;
    jog.folhas = []; jog.golpes = 0; jog.x = ARENAS_PX[B.id].x; jog.y = 0; jog.chao = true;
    for (const x of caixaChefe.children) x.setAttribute('aria-pressed', x.dataset.id === B.id);
    montarAtaques(); montarRoteiro();
  });
  caixaChefe.appendChild(b);
});
function encaixarLuta() {
  const larg = lutaTela.parentElement.clientWidth;
  const z = Math.max(1, Math.min(3, Math.floor(larg / 480)));
  lutaTela.style.width = (larg < 480 ? larg : 480 * z) + 'px';
}
addEventListener('resize', encaixarLuta);
montarAtaques(); montarRoteiro(); encaixarLuta();
