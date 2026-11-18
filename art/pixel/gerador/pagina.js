/* pagina.js — palcos de pixels: cada um desenha na resolução base (480×270) e o CSS amplia por um inteiro. */
const reduzirMov = matchMedia('(prefers-reduced-motion: reduce)').matches;
const estado = { pausado: reduzirMov, lento: false, virados: false, animCena: 'parado' };
// quadros por ciclo de cada animação (~10 a 12 por segundo, como nos jogos de pixel art)
const NQ = {
  parado: 12, correr: 6, atacar: 4, atacar_correndo: 6, especial: 16, pular: 15, pular_atirando: 15, dash: 14, abaixar: 18, derrota: 22,
  atirar_cima: 4, atirar_diag_cima: 4, atirar_diag_baixo: 4, correr_atirar_diag_cima: 6, agachado_atirar: 4,
  ar_atirar_cima: 4, ar_atirar_diag_cima: 4, ar_atirar_lado: 4, ar_atirar_diag_baixo: 4, ar_atirar_baixo: 4
};

/* ---------- fontes de quadros ----------
   Cada quadro: tela, âncora (ox, oy = pés), deslocamento do corpo (dx, dy), mão e pontas do fogo (relativas à âncora). */
function quadroBase(A, k) {
  const n = NQ[A.id], p = k / n, t = p * A.ciclo, pose = A.pose(p, t);
  return { p, t, pose };
}
const FONTE_MAO = {
  id: 'mao', escala: SM, base: MAO_BASE, fator: 4, cache: {}, anims: ANIMS_PX,
  obter(A) {
    if (!this.cache[A.id]) {
      const lista = [];
      for (let k = 0; k < NQ[A.id]; k++) {
        const { t, pose } = quadroBase(A, k);
        const r = curupiraPixel(pose, t, false, estado.virados);
        lista.push({
          tela: r.cam.paraTela(), ox: OX, oy: OY, dx: (pose.x || 0) * SM, dy: (pose.y || 0) * SM, pose,
          mao: { x: r.mao.x - OX, y: r.mao.y - OY }, pontas: r.pontas.map(q => ({ x: q.x - OX, y: q.y - OY }))
        });
      }
      this.cache[A.id] = Promise.resolve(lista);
    }
    return this.cache[A.id];
  },
  tiros: null,
  obterTiros() {
    return this.tiros || (this.tiros = Promise.resolve({
      folha: [folhaPixel(0), folhaPixel(0.06)].map(c => ({ tela: c.paraTela(), cx: 7, cy: 3 })),
      folhaDir: Object.fromEntries([-90, -45, 0, 45, 90].map(a => [a, [0, 0.06].map(t => ({ tela: folhaDirecao(a, t).paraTela(), cx: 7, cy: 7 }))])),
      onca: [oncaPixel(0), oncaPixel(0.07)].map(c => ({ tela: c.paraTela(), cx: 10, cy: 10 }))
    }));
  }
};
/* ---------- cores do palco (tiradas da paleta do desenho à mão) ---------- */
const CORES_PALCO = {
  mao: { ceu: ['#40606E', '#587A78', '#7D9478', '#AEA670'], longe: '#46685C', perto: '#2F5444', chao: '#8A5A34', linha: '#4E8C33', grama: '#86B83C', marca: '#6E4428', sombra: '#5E3A2A', poeira: '#D9B070', brasa: [PM.fogo5, PM.fogo3] }
};
const coresDe = fonte => CORES_PALCO[fonte.id];

const silhuetas = new WeakMap();
function silhuetaDe(tela, hex, fase) {
  let m = silhuetas.get(tela);
  if (!m) { m = {}; silhuetas.set(tela, m); }
  const k = hex + fase;
  if (m[k]) return m[k];
  const d = tela.getContext('2d').getImageData(0, 0, tela.width, tela.height).data;
  const idx = new Int16Array(tela.width * tela.height);
  for (let i = 0; i < idx.length; i++) idx[i] = d[i * 4 + 3] ? 0 : -1;
  return (m[k] = silhueta(idx, tela.width, tela.height, hex, fase));
}
function elipsePx(ctx, cx, cy, rx, ry, cor) {
  ctx.fillStyle = cor;
  for (let y = -Math.floor(ry); y <= Math.floor(ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2)));
    if (w > 0) ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
}

/* ---------- palco de uma animação ---------- */
const palcos = [];
const observador = new IntersectionObserver(es => es.forEach(e => { e.target._palco.visivel = e.isIntersecting; }), { rootMargin: '120px' });
class Palco {
  constructor(tela, fonte, animId, opts = {}) {
    this.tela = tela; this.fonte = fonte; this.opts = opts; this.visivel = true;
    this.ctx = tela.getContext('2d');
    tela._palco = this; observador.observe(tela);
    this.trocar(animId);
    palcos.push(this);
  }
  trocar(animId) {
    this.A = (this.fonte.anims || ANIMS).find(a => a.id === animId);
    this.t = 0; this.parts = []; this.ultimoTiro = null; this.pAntes = 0; this.scroll = 0; this.quadros = null; this.tiros = null; this.andou = 0;
    const s = this.fonte.escala;
    if (!this.opts.cena) {
      this.W = Math.round((this.A.id === 'dash' ? 470 : 300) * s);
      this.H = Math.round((this.A.id.startsWith('pular') || this.A.noAr || this.A.id === 'atirar_cima' ? 480 : 300) * s);
      this.chao = this.H - Math.round(22 * s);
      this.tela.width = this.W; this.tela.height = this.H;
      this.tela.style.width = this.W * this.fonte.fator + 'px';
      this.fundoFixo = null;
    }
    const pedido = this.A.id;
    Promise.all([this.fonte.obter(this.A), this.fonte.obterTiros()]).then(([q, t]) => { if (this.A.id === pedido) { this.quadros = q; this.tiros = t; } });
  }
  desenharFundo(ctx) {
    const c = coresDe(this.fonte), W = this.W, H = this.H, s = this.fonte.escala;
    if (!this.fundoFixo) {
      const f = document.createElement('canvas'); f.width = W; f.height = H;
      const g = f.getContext('2d');
      for (let y = 0; y < this.chao; y++) {
        const u = y / this.chao * (c.ceu.length - 1), b = Math.floor(u), fr = u - b;
        for (let x = 0; x < W; x++) {
          const sobe = c.dither ? (fr > 0.5 && (x + y) % 2 === 0) : fr > 0.75;
          g.fillStyle = c.ceu[Math.min(c.ceu.length - 1, b + (sobe ? 1 : 0))];
          g.fillRect(x, y, 1, 1);
        }
      }
      g.fillStyle = c.chao; g.fillRect(0, this.chao, W, H - this.chao);
      g.fillStyle = c.linha; g.fillRect(0, this.chao, W, 1);
      if (c.grama) { g.fillStyle = c.grama; g.fillRect(0, this.chao - 1, W, 1); }
      this.fundoFixo = f;
    }
    ctx.drawImage(this.fundoFixo, 0, 0);
    // troncos em duas camadas que correm em velocidades diferentes
    for (const [esp, larg, cor, vel, sem] of [[120, 16, c.longe, 0.2, 7], [190, 26, c.perto, 0.45, 31]]) {
      const E = esp * s, off = this.scroll * vel * s, k0 = Math.floor(off / E) - 1;
      ctx.fillStyle = cor;
      for (let k = k0; k < k0 + W / E + 3; k++) {
        const h = hash(k + sem), x = Math.round(k * E - off + h * E * 0.4), w = Math.max(2, Math.round((larg + h * larg * 0.9) * s));
        ctx.fillRect(x, 0, w, this.chao);
      }
    }
    ctx.fillStyle = c.marca;
    const E = 46 * s, off = this.scroll * s, k0 = Math.floor(off / E) - 1;
    for (let k = k0; k < k0 + W / E + 3; k++) {
      const h = hash(k);
      ctx.fillRect(Math.round(k * E - off + h * 30 * s), this.chao + 2 + Math.round(h * (H - this.chao - 4)), Math.max(2, Math.round((3 + h * 6) * s)), 1);
    }
  }
  atualizar(dt) {
    const A = this.A, ctx = this.ctx;
    if (!this.quadros) {
      if (this.opts.cena) this.opts.cena.fundo(ctx, this.t); else this.desenharFundo(ctx);
      return;
    }
    this.t += dt;
    const s = this.fonte.escala, n = NQ[A.id], c = coresDe(this.fonte);
    const p = ((this.t / A.ciclo) % 1 + 1) % 1, volta = Math.floor(this.t / A.ciclo);
    const q = this.quadros[Math.floor(p * n) % n];
    const dir = A.vaiVolta && volta % 2 ? -1 : 1;
    if (A.rolagem && dt) this.scroll += dt * A.rolagem;
    // na cena o Curupira anda de verdade; no palco o chão corre
    let xBase, chao;
    if (this.opts.cena) {
      chao = this.opts.cena.chao;
      if (A.rolagem) this.andou = (this.andou + dt * A.rolagem * s) % (this.opts.cena.W + 80);
      xBase = A.rolagem ? -40 + this.andou : this.opts.cena.x;
      this.opts.cena.fundo(ctx, this.t);
    } else {
      chao = this.chao;
      xBase = this.W * (A.tiro || A.onca !== undefined ? 0.36 : 0.5);
      this.desenharFundo(ctx);
    }
    const x = Math.round(xBase + q.dx * dir), y = Math.round(chao + q.dy);
    // sombra no chão: elipse cheia num tom mais escuro do chão (sem transparência)
    elipsePx(ctx, x, chao + 1, Math.max(3, 30 * s * (1 - Math.min(0.6, -q.dy / (260 * s)))), Math.max(1, 3 * s), c.sombra);
    const piscaDano = q.pose.opacidade < 1 && Math.floor(this.t * 20) % 2;
    const pos = (fx, fy) => dir > 0 ? { x: x + fx, y: y + fy } : { x: x - fx, y: y + fy };
    const desenharSprite = (tela, ox, oy, dx = 0) => {
      if (dir > 0) ctx.drawImage(tela, x - ox + dx, y - oy);
      else { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(tela, -(x + dx) - ox, y - oy); ctx.restore(); }
    };
    if (q.pose.fantasmas) for (let k = 3; k >= 1; k--) desenharSprite(silhuetaDe(q.tela, c.brasa[1], k % 2), q.ox, q.oy, -dir * Math.round(k * 36 * s));
    if (!piscaDano) desenharSprite(q.tela, q.ox, q.oy);
    // eventos: tiro, onça, poeira, brasas
    if (dt) {
      const m = pos(q.mao.x, q.mao.y);
      if (A.tiro) {
        const nT = Math.floor((this.t - 0.05) / INTERVALO_TIRO);
        const ang = q.pose.miraAng ?? 0, v = 889 * s;
        if (this.ultimoTiro !== null && nT !== this.ultimoTiro) this.parts.push({ tipo: 'folha', x: m.x + dir * 2, y: m.y, vx: dir * v * Math.cos(rad(ang)), vy: v * Math.sin(rad(ang)) || 0, ang, vida: 1.4, dir });
        this.ultimoTiro = nT;
      }
      if (A.onca !== undefined && this.pAntes < A.onca && p >= A.onca) this.parts.push({ tipo: 'onca', x: m.x + dir * 8, y: m.y - 1, vx: dir * 583 * s, vida: 2.2, dir });
      if (A.pegadas) for (const o of [0, 0.5]) {
        if ((this.pAntes + o) % 1 > (p + o) % 1) this.parts.push({ tipo: 'poeira', x: x - dir * 4, y: chao, vx: this.opts.cena ? 0 : -A.rolagem * s, vida: 0.4 });
      }
      if (q.pose.poeira && Math.random() < dt * 25) this.parts.push({ tipo: 'poeira', x: x + dir * 4, y: chao, vx: -dir * (10 + Math.random() * 20), vida: 0.4 });
      if (Math.random() < dt * 8 && q.pontas.length) {
        const pp = q.pontas[Math.floor(Math.random() * q.pontas.length)], b = pos(pp.x, pp.y);
        this.parts.push({ tipo: 'brasa', x: b.x, y: b.y, vx: (Math.random() - 0.5) * 8 - (A.rolagem && !this.opts.cena ? 18 : 0), vy: -10 - Math.random() * 10, vida: 1 });
      }
      for (const b of this.parts) { b.x += b.vx * dt; if (b.vy) b.y += b.vy * dt; b.vida -= dt; }
      const larg = this.opts.cena ? this.opts.cena.W : this.W;
      this.parts = this.parts.filter(b => b.vida > 0 && b.x > -40 && b.x < larg + 40);
    }
    this.pAntes = p;
    for (const b of this.parts) {
      if (b.tipo === 'folha' || b.tipo === 'onca') {
        const lista = b.tipo === 'folha' ? this.tiros.folhaDir[b.ang ?? 0] : this.tiros[b.tipo], f = lista[Math.floor(this.t * 12) % 2];
        if (b.dir > 0) ctx.drawImage(f.tela, Math.round(b.x) - f.cx, Math.round(b.y) - f.cy);
        else { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(f.tela, -Math.round(b.x) - f.cx, Math.round(b.y) - f.cy); ctx.restore(); }
      } else if (b.tipo === 'poeira') {
        const k = 1 - b.vida / 0.4;
        elipsePx(ctx, b.x, b.y - 1 - k * 3 * s * 4, 1 + k * 3 * s * 6, 1 + k * 2 * s * 4, c.poeira);
      } else {
        ctx.fillStyle = c.brasa[b.vida > 0.5 ? 0 : 1];
        ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
      }
    }
    if (this.opts.rotulo) this.opts.rotulo.textContent = `quadro ${Math.floor(p * n) % n + 1}/${n} · ${q.pose.rotulo || A.godot}`;
  }
}

/* ---------- A: desenhado à mão ---------- */
const cenaTela = document.getElementById('cena-mao');
let florestaQuadros = null;
const CENA = {
  W: 480, H: 270, chao: 220, x: 140,
  fundo(ctx, t) {
    if (!florestaQuadros) florestaQuadros = Array.from({ length: 8 }, (_, k) => florestaPixel(k * 0.5).paraTela());
    ctx.drawImage(florestaQuadros[Math.floor(t * 2) % 8], 0, 0);
  }
};
const palcoCena = new Palco(cenaTela, FONTE_MAO, estado.animCena, { cena: CENA });
function encaixarCena() {
  const larg = cenaTela.parentElement.clientWidth;
  const z = Math.max(1, Math.min(3, Math.floor(larg / 480)));
  cenaTela.style.width = (larg < 480 ? larg : 480 * z) + 'px';
}
const escolhaCena = document.getElementById('escolha-cena');
function botoesAnim(caixa, chave, aoEscolher, lista = ANIMS) {
  lista.forEach(A => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = A.nome; b.dataset.id = A.id;
    b.setAttribute('aria-pressed', A.id === estado[chave]);
    b.addEventListener('click', () => {
      estado[chave] = A.id;
      for (const x of caixa.children) x.setAttribute('aria-pressed', x.dataset.id === A.id);
      aoEscolher(A.id);
    });
    caixa.appendChild(b);
  });
}
botoesAnim(escolhaCena, 'animCena', id => palcoCena.trocar(id), ANIMS_PX);

const gradeMao = document.getElementById('grade-mao');
const palcosMao = ANIMS_PX.map(A => {
  const el = document.createElement('article');
  el.className = 'cartao';
  el.innerHTML = `<div class="linha-topo"><h3>${A.nome}</h3>${A.godot.split(' / ').map(g => `<span class="chip">${g}</span>`).join(' ')}</div>
    <canvas class="pixels" aria-label="Curupira desenhado à mão: ${A.nome.toLowerCase()}"></canvas><span class="quadro-atual"></span>`;
  gradeMao.appendChild(el);
  return new Palco(el.querySelector('canvas'), FONTE_MAO, A.id, { rotulo: el.querySelector('.quadro-atual') });
});

const rostosMao = document.getElementById('rostos-mao');
const rostosVivos = Object.entries(EXPR).map(([nome, e], i) => {
  const fig = document.createElement('figure');
  fig.innerHTML = `<canvas class="pixels" width="34" height="34" style="width:136px" aria-label="Rosto ${e.nome.toLowerCase()}"></canvas><figcaption>${e.nome}</figcaption>`;
  rostosMao.appendChild(fig);
  const tela = fig.querySelector('canvas'), ctx = tela.getContext('2d');
  const quadros = Array.from({ length: 4 }, (_, k) => rostoQuadro(nome, k * 0.11 + i).paraTela());
  const piscando = rostoQuadro(nome, i, true).paraTela();
  return { tela, ctx, quadros, piscando, prox: 2 + hash(i) * 3, fim: 0, i };
});

function montarFolha() {
  const n = Math.max(...Object.values(NQ));
  Promise.all(ANIMS_PX.map(A => FONTE_MAO.obter(A))).then(todas => {
    const f = document.createElement('canvas');
    f.width = n * QW; f.height = ANIMS_PX.length * QH;
    const g = f.getContext('2d');
    todas.forEach((lista, lin) => lista.forEach((q, col) => g.drawImage(q.tela, col * QW, lin * QH)));
    const img = document.getElementById('folha-mao');
    img.src = f.toDataURL('image/png');
    img.style.width = f.width + 'px';
    document.getElementById('info-folha').textContent = `PNG de ${f.width}×${f.height} px (aqui em tamanho real, sem ampliar). Quadros de ${QW}×${QH} px com os pés na linha ${OY}. Uma linha por animação: ${ANIMS_PX.map(a => a.godot).join(', ')}. Clique com o botão direito para salvar.`;
  });
}

/* ---------- controles e laço ---------- */
const btPausar = document.getElementById('bt-pausar');
const atualizarPausa = () => { btPausar.textContent = estado.pausado ? 'Continuar' : 'Pausar'; btPausar.setAttribute('aria-pressed', estado.pausado); };
btPausar.addEventListener('click', () => { estado.pausado = !estado.pausado; atualizarPausa(); });
document.getElementById('op-lento').addEventListener('change', e => { estado.lento = e.target.checked; });
document.getElementById('op-virados').addEventListener('change', e => {
  estado.virados = e.target.checked;
  FONTE_MAO.cache = {};
  palcoCena.trocar(palcoCena.A.id);
  palcosMao.forEach(p => p.trocar(p.A.id));
  montarFolha();
});
addEventListener('resize', encaixarCena);

let antes = performance.now();
function laco(agora) {
  const dtReal = clamp((agora - antes) / 1000, 0, 0.05);
  antes = agora;
  const dt = estado.pausado ? 0 : dtReal * (estado.lento ? 0.25 : 1);
  for (const p of palcos) if (p.visivel) p.atualizar(dt);
  for (const r of rostosVivos) {
    r.tempo = (r.tempo || r.i) + dt;
    if (r.tempo > r.prox) { r.fim = r.tempo + 0.15; r.prox = r.tempo + 2.4 + hash(r.prox) * 3; }
    r.ctx.clearRect(0, 0, 34, 34);
    r.ctx.drawImage(r.tempo < r.fim ? r.piscando : r.quadros[Math.floor(r.tempo * 8) % 4], 0, 0);
  }
  if (typeof desenharLutaPx === 'function') desenharLutaPx(dt);
  requestAnimationFrame(laco);
}
atualizarPausa();
encaixarCena();
montarFolha();
for (const p of palcos) p.atualizar(0);
requestAnimationFrame(laco);
