/* arenas_px.js — as quatro arenas desenhadas direto em 480×270, no mesmo pixel dos personagens.
   Cada arena devolve o fundo e a frente de um quadro (t em segundos); a página guarda 8 quadros.
   Fundo sem contorno preto e com menos contraste, para o Curupira e o chefe se destacarem. */

function faixasCeu(cam, cores, ate, ondula = 0, t = 0) {
  for (let y = 0; y < ate; y++) {
    const f = Math.min(cores.length - 1, Math.floor(y / ate * cores.length));
    for (let x = 0; x < ARENA_W; x++) cam.set(x, y, cores[f]);
  }
}
function copasPx(cam, base, alt, passo, raio, cor, clara, semente, ate = ARENA_H) {
  const parte = new Camada(ARENA_W, ARENA_H);
  for (let k = -1; k * passo < ARENA_W + passo; k++) {
    const h = hash(k + semente), x = k * passo + h * passo * 0.5, r = raio * (0.75 + h * 0.5);
    parte.disco(x, base - alt * h, r, cor);
  }
  for (let y = base; y < ate; y++) for (let x = 0; x < ARENA_W; x++) parte.set(x, y, cor);
  if (clara) for (const [x, y] of parte.pixels()) if (parte.get(x, y) === cor && !parte.get(x, y - 1) && hash(x * 7 + y) > 0.3) parte.set(x, y, clara);
  cam.colar(parte);
}
function troncoPx(cam, x0, w, lado, cores, ate = CHAO_PX) {
  const parte = new Camada(ARENA_W, ARENA_H);
  for (let y = 0; y < ate + 2; y++) {
    const aba = y > ate - 40 ? Math.round(((y - (ate - 40)) / 40) ** 2 * 22) : 0;
    for (let x = x0 - (lado < 0 ? aba : 0); x < x0 + w + (lado > 0 ? aba : 0); x++) {
      const casca = (x - x0) % 5 === 0 && hash(y * 3 + x) > 0.35;
      parte.set(x, y, casca ? cores[3] : x < x0 + 3 ? cores[0] : x > x0 + w - 4 ? cores[2] : cores[1]);
    }
  }
  cam.colar(parte.contornar(cores[4]));
}
function chaoPx(cam, faixas, salpico, semente = 0) {
  for (let x = 0; x < ARENA_W; x++) {
    const tufo = faixas.grama && hash(x * 1.3 + semente) > 0.82 ? 1 + Math.floor(hash(x + semente) * 2) : 0;
    for (let y = CHAO_PX - tufo; y < ARENA_H; y++) {
      const d = y - CHAO_PX;
      let cor = faixas.cor(d, x);
      if (salpico && d >= 8 && hash(Math.floor(x / 2) * 0.37 + Math.floor(y / 2) * 11.1 + semente) > 0.965) cor = salpico[0];
      if (salpico && d >= 22 && hash(Math.floor(x / 3) * 0.71 + Math.floor(y / 2) * 5.3 + semente) > 0.95) cor = salpico[1];
      cam.set(x, y, cor);
    }
  }
}
function folhagemFrentePx(cam, x0, lado, cor, t) {
  for (let f = 0; f < 6; f++) {
    const ang = (-70 + f * 20) * Math.PI / 180, bal = Math.sin(t * 1.2 + f) * 0.05;
    for (let k = 0; k < 40; k++) {
      const u = k / 40, a = ang + bal + u * 0.45 * lado, x = x0 + lado * Math.cos(a) * k * 1.4, y = ARENA_H + 2 - Math.sin(a) * k * 1.3;
      const w = Math.max(1, Math.round(3.2 * Math.sin(u * Math.PI)));
      for (let j = -w; j <= w; j++) cam.set(x, y + j, cor);
    }
  }
}
function pedraPx(cam, x, y, w, cores) {
  const parte = new Camada(ARENA_W, ARENA_H);
  for (let i = 0; i < w; i++) for (let j = 0; j < w / 2; j++) if (Math.hypot((i - w / 2 + 0.5) / (w / 2), (j - w / 4) / (w / 4 + 0.5)) < 1) parte.set(x + i, y + j, j < 2 ? cores[0] : cores[1]);
  cam.colar(parte.contornar(cores[2]));
}
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
    desc: 'Clareira de terra; atrás, as copas queimando, colunas de fumaça e brasas subindo. O fogo fica no fundo, longe da luta.',
    quadro(t) {
      const cam = nova(), frente = nova();
      faixasCeu(cam, ['#2A1A1E', '#3A2024', '#552A26', '#7A3826', '#A24C28', '#C8642C', '#E88A38', '#F4A848'], CHAO_PX);
      // colunas de fumaça subindo devagar
      for (const [x0, k0] of [[90, 0], [250, 0.3], [400, 0.6]]) for (let k = 0; k < 6; k++) {
        const u = (t * 0.05 + k / 6 + k0) % 1, r = 10 + 22 * u;
        fumacaPx(cam, x0 + Math.sin(u * 3 + k) * 12 + u * 30, 150 - 150 * u, r, { claro: '#6E5450', medio: '#5A4440', contorno: '#4A3634' });
      }
      copasPx(cam, 150, 26, 44, 24, '#4A2A22', '#5E3828', 1);
      // fogo nas copas do fundo, sem contorno e mais escuro que o da Mula
      const fundoFogo = [PM.fogo1, '#C02A12', '#E04A18', '#F07A28', '#F8A840', '#FCD070'];
      for (let k = 0; k < 7; k++) chamaPx(cam, 30 + k * 70 + hash(k) * 20, 140 - hash(k + 3) * 14, 270, 40, 26 + hash(k + 5) * 14, t * 0.6, { n: 5, rampa: fundoFogo, contorno: null, vel: 5, semente: k * 3 });
      copasPx(cam, 182, 30, 38, 22, '#2A2620', '#3A3226', 7);
      troncoPx(cam, 22, 22, 1, ['#3E2A20', '#33231C', '#28201A', '#1E1612', '#120C0A']);
      troncoPx(cam, 438, 26, -1, ['#3E2A20', '#33231C', '#28201A', '#1E1612', '#120C0A']);
      copasPx(cam, 208, 14, 28, 14, '#1E1E18', '#2A2820', 13, CHAO_PX + 2);
      chaoPx(cam, { cor: d => d < 1 ? '#7A5A2A' : d < 3 ? '#5E4A24' : d < 4 ? '#3E3020' : d < 20 ? '#8E5E36' : d < 34 ? '#744A2C' : '#5E3A26' }, ['#B07A48', '#3A2324'], 4);
      // brasas no chão do fundo
      for (let x = 0; x < ARENA_W; x += 7) if (hash(x * 0.9) > 0.8 && Math.sin(t * 4 + x) > 0) cam.set(x, CHAO_PX + 1, PM.fogo3);
      pedraPx(cam, 70, 238, 9, ['#8A7E76', '#6A5E56', '#2E2826']); pedraPx(cam, 330, 250, 12, ['#8A7E76', '#6A5E56', '#2E2826']);
      // frente: brasas subindo e folhas escuras nos cantos
      for (let i = 0; i < 26; i++) {
        const vel = 12 + 18 * hash(i * 3), y = ARENA_H - ((t * vel + hash(i * 5) * ARENA_H) % ARENA_H), x = hash(i) * ARENA_W + Math.sin(t + i) * 6;
        frente.set(x, y, Math.sin(t * 5 + i) > 0 ? PM.fogo5 : PM.fogo3);
      }
      folhagemFrentePx(frente, -4, 1, '#120E0C', t); folhagemFrentePx(frente, 484, -1, '#120E0C', t + 2);
      return { cam, frente };
    }
  },
  cuca: {
    nome: 'Floresta da Cuca', x: X_CURUPIRA,
    desc: 'Clareira escura ao pé de uma árvore enorme, com o caldeirão borbulhando verde no meio das raízes, frascos, cogumelos, vaga-lumes e névoa rasteira.',
    quadro(t) {
      const cam = nova(), frente = nova();
      faixasCeu(cam, ['#0E1A16', '#122018', '#16281C', '#1C3020', '#223A26', '#2A442C'], CHAO_PX);
      for (let i = 0; i < 9; i++) { const x = Math.floor(hash(i + 40) * ARENA_W), w = 6 + Math.floor(hash(i + 41) * 10); for (let y = 0; y < CHAO_PX; y++) for (let k = 0; k < w; k++) cam.set(x + k, y, '#1E2E22'); }
      copasPx(cam, 0, -30, 40, 30, '#14241A', null, 5, 30);
      // a árvore gigante com o oco
      const arv = nova();
      for (let y = 0; y < CHAO_PX + 2; y++) {
        const base = y > CHAO_PX - 50 ? ((y - (CHAO_PX - 50)) / 50) ** 2 * 40 : 0, larg = 52 + base;
        for (let x = Math.round(240 - larg); x < 240 + larg; x++) arv.set(x, y, (x - 240 + larg) < 6 ? '#4A3A2A' : (240 + larg - x) < 8 ? '#2A2018' : (x % 9 === 0 && hash(y + x) > 0.4) ? '#2E241A' : '#3A2E22');
      }
      cam.colar(arv.contornar('#140E0A'));
      elipse(cam, 240, 182, 20, 32, '#0E0A08'); for (let y = 182; y < CHAO_PX; y++) for (let x = 220; x < 260; x++) if (cam.get(x, y) !== '#0E0A08' && Math.abs(x - 240) < 20) cam.set(x, y, '#0E0A08');
      // brilho verde em volta do caldeirão, em anéis (sem transparência)
      const pulso = 0.5 + 0.5 * Math.sin(t * 3);
      for (let y = 150; y < CHAO_PX; y++) for (let x = 180; x < 300; x++) {
        const d = Math.hypot((x - 240) / 1.3, y - 205);
        if (d < 30 + pulso * 2 && cam.get(x, y) === '#0E0A08') cam.set(x, y, d < 18 ? '#2C5A30' : '#1C3A22');
      }
      // raízes, frascos e cogumelos
      for (const [x0, x1] of [[200, 150], [280, 330], [210, 120], [270, 360]]) for (let u = 0; u <= 1; u += 0.01) { const x = mix(x0, x1, u), y = CHAO_PX - 14 * Math.sin(u * Math.PI) * (1 - u * 0.3); for (let k = 0; k < 4 * (1 - u) + 1; k++) cam.set(x, y + k, k === 0 ? '#4A3A2A' : '#2E241A'); }
      frascoPx(cam, pt(158, CHAO_PX - 8), PCU.roxo, t, true); frascoPx(cam, pt(168, CHAO_PX - 6), PCU.magia, t); frascoPx(cam, pt(318, CHAO_PX - 8), '#3B82C4', t, true);
      for (const [x, k] of [[130, 1], [140, 0.7], [345, 1], [355, 0.6]]) { const c = nova(); c.carimbo(k > 0.8 ? ['.rrrr.', 'rrWrrr', 'rrrrWr', '..ss..', '..ss..'] : ['.rr.', 'rWrr', '.ss.'], x - 3, CHAO_PX - (k > 0.8 ? 5 : 3), { r: '#C8461E', W: '#F2E0C0', s: '#E8DCC0' }); cam.colar(c.contornar('#1A0E0A')); }
      // caldeirão no fogo
      chamaPx(cam, 240, CHAO_PX, 270, 26, 10, t, { n: 5, vel: 12 });
      const cal = nova();
      elipse(cal, 240, CHAO_PX - 14, 22, 12, '#26242A'); elipse(cal, 240, CHAO_PX - 24, 23, 4, '#3A3840');
      for (let x = 222; x < 258; x++) cal.set(x, CHAO_PX - 13, '#3A3840');
      cam.colar(cal.contornar('#0A080C'));
      elipse(cam, 240, CHAO_PX - 24, 19, 2.6, PCU.magia); elipse(cam, 236, CHAO_PX - 25, 9, 1, PCU.magiaL);
      for (let i = 0; i < 5; i++) { const u = (t * 0.9 + i / 5) % 1, x = 226 + hash(i) * 28; const b = nova(); if (u < 0.8) b.disco(x, CHAO_PX - 25 - u * 6, 1.2 + u * 2.2, PCU.magia); else for (let a = 0; a < 8; a++) b.set(x + Math.cos(a) * 5, CHAO_PX - 31 + Math.sin(a) * 2, PCU.magiaL); cam.colar(b.contornar(PCU.magiaO)); }
      chaoPx(cam, { cor: d => d < 1 ? '#3E5A2E' : d < 3 ? '#2E4424' : d < 20 ? '#4E3E28' : d < 34 ? '#3E3020' : '#30261A' }, ['#5E4E34', '#22180F'], 9);
      // frente: vaga-lumes, névoa rasteira e folhas
      for (let i = 0; i < 16; i++) {
        const x = hash(i * 2) * ARENA_W + Math.sin(t * 0.7 + i) * 10, y = 60 + hash(i * 4) * 140 + Math.cos(t * 0.9 + i * 2) * 8, on = Math.sin(t * 2.5 + i * 1.7);
        if (on > 0) { frente.set(x, y, '#F0FF9A'); if (on > 0.7) { frente.set(x + 1, y, '#9AD04A'); frente.set(x - 1, y, '#9AD04A'); frente.set(x, y - 1, '#9AD04A'); frente.set(x, y + 1, '#9AD04A'); } }
      }
      for (let i = 0; i < 3; i++) { const x0 = ((t * (6 + i * 2) + i * 170) % 640) - 80; for (let x = x0; x < x0 + 90; x++) if ((x + i) % 2 === 0) frente.set(x, CHAO_PX + 2 + i * 6, '#6E8A70'); }
      folhagemFrentePx(frente, -4, 1, '#08100A', t); folhagemFrentePx(frente, 484, -1, '#08100A', t + 2);
      return { cam, frente };
    }
  },
  boto: {
    nome: 'Encontro das águas', x: X_CURUPIRA_BOTO,
    desc: 'Faixa de areia entre duas águas que não se misturam: azul de um lado, barrenta do outro. O Boto fica na água e salta por cima da areia.',
    quadro(t) {
      const cam = nova(), frente = nova();
      faixasCeu(cam, ['#5E9CC4', '#6EAACB', '#80B8D2', '#94C6D8', '#AAD2DC', '#C2DEDC', '#DCEAD8'], 160);
      // sol e nuvens de bolha
      const sol = nova(); sol.disco(400, 40, 15, '#FFF3B8'); sol.disco(400, 40, 11, '#FFFBE0'); cam.colar(sol.contornar('#F2D77A'));
      for (const [i, y, e] of [[0, 30, 1.2], [1, 58, 0.9], [2, 22, 1.0], [3, 75, 0.7]]) {
        const x = ((t * (2 + i) + i * 150) % 600) - 60, n = nova();
        for (const [dx, dy, r] of [[-14, 3, 7], [-4, -2, 9], [8, 0, 8], [16, 4, 6]]) n.disco(x + dx * e, y + dy * e, r * e, '#FBF7EC');
        for (const [px, py] of n.pixels()) if (n.get(px, py) && !n.get(px, py + 2)) n.set(px, py, '#D8D2C2');
        cam.colar(n.contornar('#B8C4CC'));
      }
      copasPx(cam, 162, 12, 18, 10, '#6E9A68', '#86B07A', 2, 175);
      // as duas águas ao fundo
      for (let y = 165; y < CHAO_PX + 6; y++) for (let x = 0; x < ARENA_W; x++) {
        const azul = x < 240 + Math.sin(y * 0.3 + t) * 3;
        cam.set(x, y, azul ? (y < 172 ? '#6AA2C4' : '#3E7EB6') : (y < 172 ? '#B08A5E' : '#9A6E42'));
      }
      for (let i = 0; i < 18; i++) { const y = 175 + (i % 6) * 8, x = ((i * 53 + t * (i % 2 ? 8 : -8)) % 520 + 520) % 520 - 20; for (let k = 0; k < 6; k++) cam.set(x + k, y, x < 240 ? '#7FC3E8' : '#C99A6A'); }
      // palmeiras
      for (const [x, h] of [[90, 60], [150, 48], [330, 56], [380, 44]]) {
        const p = nova();
        for (let y = 0; y < h; y++) { const xx = x + Math.round(Math.sin(y / h * 1.2) * 6); p.set(xx, CHAO_PX - y, '#7A6440'); p.set(xx + 1, CHAO_PX - y, y % 4 ? '#7A6440' : '#5E4A30'); }
        const topo = pt(x + Math.round(Math.sin(1.2) * 6), CHAO_PX - h);
        for (let f = 0; f < 6; f++) { const a = rad(-170 + f * 32) + Math.sin(t * 1.5 + f) * 0.05; mecha(p, topo.x, topo.y, a * 180 / Math.PI, 20, 2.6, '#4E7A45', 7); }
        cam.colar(p.contornar('#2A3A22'));
      }
      // a península de areia
      const areia = nova();
      for (let y = CHAO_PX; y < ARENA_H; y++) for (let x = 0; x < ARENA_W; x++) {
        const borda = (y - CHAO_PX) * 0.5;
        if (x > 56 - borda && x < 400 + borda) { const d = y - CHAO_PX; areia.set(x, y, d < 2 ? '#F2D08A' : d < 8 ? '#E2B872' : (hash(Math.floor(x / 3) + y * 7) > 0.94 ? '#C99A55' : '#D8AC66')); }
      }
      cam.colar(areia.contornar('#9A7240'));
      pedraPx(cam, 120, 244, 9, ['#C8BCAA', '#A89A8A', '#5E544A']);
      // frente: as águas da frente cobrindo a base do Boto, com espuma batendo na areia
      for (let y = CHAO_PX + 4; y < ARENA_H; y++) for (let x = 0; x < ARENA_W; x++) {
        const borda = (y - CHAO_PX) * 0.5, ond = Math.round(Math.sin(x * 0.15 + t * 3) * 1.2);
        if (y < AGUA_Y + ond) continue;
        if (x <= 56 - borda) frente.set(x, y, y < AGUA_Y + 2 + ond ? '#8CD0EE' : '#2F6FA8');
        else if (x >= 400 + borda) frente.set(x, y, y < AGUA_Y + 2 + ond ? '#C9A070' : '#8A5E36');
      }
      for (const [x0, l] of [[56, -1], [400, 1]]) for (let i = 0; i < 5; i++) { const y = AGUA_Y + 4 + i * 8, k = Math.round(Math.sin(t * 2 + i) * 2); frente.set(x0 + l * (i * 4 + k), y, '#FFFFFF'); frente.set(x0 + l * (i * 4 + k + 1), y, '#FFFFFF'); }
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
      for (let i = 0; i < 3; i++) { const u = (t * 0.06 + i / 3) % 1; fumacaPx(cam, jx + 30 + i * 30 + u * 10, jy + jh - 16 - u * 30, 3 + u * 6, { claro: '#9A8E84', medio: '#8A7E74', contorno: '#7A6E64' }); }
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
