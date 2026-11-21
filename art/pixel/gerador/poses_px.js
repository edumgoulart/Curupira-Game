/* poses_px.js — poses só da versão em pixel. Mudam em relação ao vetor:
   pulo mais contido (o braço da frente fica livre para atirar), pulo atirando,
   agachar comprimido de verdade e o cabelo pegando fogo só no especial. */

// pulo com a mesma física do GDD (PULO_AR, PULO_ALT); atirando = braço da frente em posição de tiro o tempo todo
function posePularPx(p, t, atirando = false) {
  const s = p * 1.5, t0 = 0.08, t1 = t0 + PULO_AR;
  const parado = poseParado(0.25, t);
  const tiro = (q0, inc, pose) => {
    if (!atirando) return pose;
    const o = ombrosDe(q0, inc), { mao, coice } = bracoTiro(o, t);
    return { ...pose, maos: [soma(o.longe, pt(-6, 24)), mao], formaMao: ['punho', 'palma'], bracoL: [46, 70], ex: 'determinado', saia: (pose.saia || 0) + coice * 4 };
  };
  // impulso: dobra os joelhos, braços descem para trás
  const qA = pt(0, -41), oA = ombrosDe(qA, 7);
  const agachado = tiro(qA, 7, { ...parado, quadril: qA, inclina: 7, pes: [pe(-11), pe(13)], maos: [pendura(oA.longe, -0.6, 38), pendura(oA.perto, -0.5, 38)], ex: 'determinado' });
  // subindo: joelho da frente sobe, perna de trás estica; braços perto do corpo
  const qS = pt(0, -54), oS = ombrosDe(qS, 3);
  const subindo = tiro(qS, 3, { ...parado, quadril: qS, inclina: 3, pes: [pe(-9, -6, 18), pe(13, -24, 24)], maos: [pendura(oS.longe, -0.45, 40), pendura(oS.perto, 0.7, 38)], ex: 'oba' });
  // topo e queda: as duas pernas descem, braços abrem só um pouco para equilibrar
  const caindo = tiro(qS, 0, { ...parado, quadril: qS, inclina: 0, pes: [pe(-10, -2, -6), pe(11, -8, 8)], maos: [pendura(oS.longe, -0.95, 40), pendura(oS.perto, 0.95, 40)], ex: 'oba' });
  // pouso: amortece e volta
  const qT = pt(0, -40), oT = ombrosDe(qT, 9);
  const pousando = tiro(qT, 9, { ...parado, quadril: qT, inclina: 9, pes: [pe(-12), pe(14)], maos: [pendura(oT.longe, 0.9, 38), pendura(oT.perto, 1.0, 38)], ex: 'oba' });
  const final = tiro(parado.quadril, parado.inclina, parado);
  const escalaPx = ALTURA_CURUPIRA_LOCAL / ALTURA_CURUPIRA_JOGO;
  let pose;
  if (s < t0) pose = mixPose(final, agachado, suave(s / t0));
  else if (s < t1) {
    const u = (s - t0) / PULO_AR, vy = 1 - 2 * u;
    pose = mixPose(agachado, subindo, suave(u / 0.14));
    if (u > 0.42) pose = mixPose(subindo, caindo, suave((u - 0.42) / 0.22));
    pose.y = -4 * PULO_ALT * u * (1 - u) * escalaPx;
    pose.vento = [0, mix(0.8, -2, (1 - vy) / 2)];
    pose.rotulo = vy > 0 ? 'pular' : 'cair';
  } else if (s < t1 + 0.16) pose = mixPose(pousando, final, suave((s - t1 - 0.04) / 0.12));
  else pose = final;
  if (s >= t1 && s < t1 + 0.04) pose = pousando;
  if (atirando) { pose.formaMao = ['punho', 'palma']; pose.ex = 'determinado'; }
  pose.rotulo = (pose.rotulo || (s < t0 ? 'pular (impulso)' : s < t1 + 0.16 ? 'pouso' : 'idle')) + (atirando ? ' + tiro' : '');
  return pose;
}

// agachado comprimido: tronco deitado para a frente e a cabeça quase no chão.
// atirando: a cabeça sobe um pouco e o braço da frente estica rente ao chão.
function agachadoPx(t, desce = 0, olhar = 0, atirando = false) {
  const b = Math.sin(t * 4);
  const q0 = pt(-6, -19 + desce + b * 0.5), inc = 52;
  // cabeça: posição desejada no desenho, convertida para o referencial inclinado do tronco
  const Tc = E5.tronco * 0.6, alvo = atirando ? pt(34, -42 + desce) : pt(40, -37 + desce + b * 0.4);
  const d = rot(sub(alvo, q0), -inc);
  const pose = {
    quadril: q0, inclina: inc, comprime: 1, pes: [pe(-24), pe(8)],
    maos: [pt(22, -4), pt(32, -4)], formaMao: ['palma', 'palma'], bracoL: [40, 40],
    cabeca: { dx: d.x - E5.cabecaDx, dy: d.y + Tc + E5.cabeca * 0.7 }, ex: 'determinado', saia: -14, agita: 0.4,
    vento: [0, -0.4], olhar
  };
  if (atirando) {
    const ombro = soma(q0, rot(pt(-3, -Tc + 9), inc)), coice = bracoTiro({ perto: ombro }, t).coice;
    pose.maos = [pt(14, -4), pt(ombro.x + 60 - coice * 6, -22)]; pose.formaMao = ['palma', 'palma']; pose.bracoL = [40, 66];
    pose.saia -= coice * 4; pose.miraAng = 0;
  }
  return pose;
}
// agachar estilo desenho animado: desce passando do ponto e volta, como borracha
function poseAbaixarPx(p, t) {
  const parado = poseParado((t * 0.5) % 1, t);
  const agachado = (desce, olhar) => agachadoPx(t, desce, olhar);
  const olhar = Math.sin(t * 1.3) > 0.3 ? 0.4 : Math.sin(t * 1.3) < -0.3 ? -0.9 : 0;
  let pose;
  // desce passando um pouco do ponto (achata mais) e volta; levanta esticando
  if (p < 0.07) { pose = mixPose(parado, agachado(0, 0), suave(p / 0.07)); pose.comprime = suave(p / 0.07); }
  else if (p < 0.13) { const u = (p - 0.07) / 0.06; pose = agachado(3 * Math.sin(u * Math.PI), olhar); }
  else if (p < 0.85) pose = agachado(0, olhar);
  else { const u = suave((p - 0.85) / 0.15); pose = mixPose(agachado(0, 0), parado, u); pose.comprime = 1 - u; }
  pose.rotulo = p < 0.13 ? 'abaixar (descendo)' : p < 0.85 ? 'abaixar' : 'levantando';
  return pose;
}

/* ---------- mira em 8 direções ----------
   O braço de tiro é o mesmo do ataque de lado, girado em volta do ombro. Para cima o corpo
   inclina um pouco para trás; para baixo, um pouco para a frente. */
const MIRAS = { cima: -90, diag_cima: -45, lado: 0, diag_baixo: 45, baixo: 90 };
function bracoMira(o, t, ang) {
  const { mao, coice } = bracoTiro(o, t);
  return { mao: soma(o.perto, rot(sub(mao, o.perto), ang)), coice };
}
function poseAtirarPx(p, t, ang) {
  const q0 = pt(-2, -49), inc0 = -2 + ang * 0.07, o = ombrosDe(q0, inc0);
  const { mao, coice } = bracoMira(o, t, ang);
  return {
    quadril: q0, inclina: inc0 - coice * 2, pes: [pe(-17), pe(17)],
    maos: [soma(o.longe, pt(-6, 26)), mao], formaMao: ['punho', 'palma'], bracoL: [46, 70],
    cabeca: { dx: 1, dy: ang < 0 ? -1.5 : ang > 0 ? 1 : 0 }, giro: 0.55, ex: 'determinado', saia: coice * 5, miraAng: ang,
    olhar: ang < 0 ? 0.4 : 0
  };
}
function poseCorrerAtirarPx(p, t, ang) {
  const pose = poseAtacarCorrendo(p, t), o = ombrosDe(pose.quadril, 8);
  pose.maos = [pose.maos[0], bracoMira(o, t, ang).mao]; pose.miraAng = ang;
  return pose;
}
// no ar: a pose do alto do pulo (pernas descendo), o braço de trás aberto e o da frente mirando
function poseArAtirarPx(p, t, ang) {
  const qS = pt(0, -54), o = ombrosDe(qS, ang * 0.05), { mao, coice } = bracoMira(o, t, ang);
  const abre = ang > 60 ? 4 : 0;
  return {
    quadril: qS, inclina: ang * 0.05 - coice, pes: [pe(-10 - abre, -2, -6), pe(11 + abre, -8, 8)],
    maos: [pendura(o.longe, -0.95, 40), mao], formaMao: ['punho', 'palma'], bracoL: [46, 70],
    cabeca: { dy: ang < 0 ? -1.5 : 0 }, ex: 'determinado', vento: [0, -1.2], miraAng: ang, y: -34, saia: coice * 4
  };
}

/* ---------- especiais ----------
   Cada especial tem um gesto próprio e sai na mira: frente (0), diagonal para cima (-45) ou cima (-90).
   Partes: "inicio" (preparo; o golpe sai logo depois do último quadro), "loop" (só o Canhão: segura
   o feixe enquanto ele dura) e "fim" (o quadro 0 é o golpe saindo; depois a volta à pose parada).
   O cabelo pega fogo no preparo, queima no golpe e apaga na volta (GDD).
     onca:   puxa as mãos para trás do quadril juntando energia dourada e empurra as duas palmas, rugindo;
     canhao: abre bem as pernas, junta fogo atrás do quadril e segura o feixe com as mãos juntas, tremendo;
     pocao:  a poção aparece na mão, ele arma o braço para trás e arremessa;
     bolha:  segura uma bolha d'água entre as palmas na frente do peito e empurra. */
const ESPECIAIS_PX = {
  onca:   { nome: 'Instinto Selvagem', inicio: 4, fim: 6, fpsInicio: 20, fpsFim: 18 },
  canhao: { nome: 'Canhão Flamejante', inicio: 4, loop: 4, fim: 5, fpsInicio: 20, fpsLoop: 16, fpsFim: 16 },
  pocao:  { nome: 'Poção Maldita', inicio: 4, fim: 6, fpsInicio: 20, fpsFim: 18 },
  bolha:  { nome: 'Bolha Abissal', inicio: 4, fim: 6, fpsInicio: 20, fpsFim: 18 }
};
const MIRAS_ESPECIAL = { frente: 0, diag_cima: -45, cima: -90 };
// ponto a (x, y) de "o" no referencial da mira (x = para onde a mira aponta)
const naMira = (o, ang, x, y) => soma(o, rot(pt(x, y), ang));
const polar = (o, ang, r) => soma(o, pt(Math.cos(ang * Math.PI / 180) * r, Math.sin(ang * Math.PI / 180) * r));

// golpe saindo com as duas palmas na mira (onça e bolha); "forca" 1 = inclinado com tudo
function posePalmas(ang, forca, tipo) {
  const cima = -ang / 90;
  const q0 = pt(mix(8, 2, cima) * forca, mix(-51, -46, forca)), inc = mix(3, mix(15, -7, cima), forca), o = ombrosDe(q0, inc);
  const maos = [naMira(o.longe, ang, 62, 8), naMira(o.perto, ang, 70, 14)];
  return {
    quadril: q0, inclina: inc, pes: [pe(mix(-9, -20, forca)), pe(mix(11, 22, forca))],
    maos, formaMao: ['palma', 'palma'], angMao: [ang - 80, ang - 80], bracoL: [70, 76],
    cabeca: { dx: 2 * forca, dy: ang < 0 ? -1.5 : 0, inc: -4 * forca }, giro: 0.55, olhar: ang < 0 ? 0.4 : 0,
    ex: 'furioso', vento: [-1.2 * forca, -1.6], saia: 6 * forca,
    estouro: { c: naMira(lerp(maos[0], maos[1], 0.5), ang, 8, 0), tipo: tipo === 'bolha' ? 'agua' : tipo }
  };
}
// volta à pose parada a partir de "golpe": u de 0 (golpe) a 1 (parado)
function voltaEspecial(golpe, u, t, k) {
  const r = suave(trecho(u, 0.3, 1));
  const pose = mixPose(golpe, { ...poseParado(0.25, t), ex: 'oba' }, r);
  pose.ex = r < 0.15 ? golpe.ex : r < 0.7 ? 'determinado' : 'oba';
  pose.formaMao = r < 0.6 ? golpe.formaMao : ['punho', 'punho'];
  pose.angMao = golpe.angMao;
  pose.chamas = 1 - suave(trecho(u, 0.25, 1));
  pose.estouro = k === 0 ? golpe.estouro : k === 1 && golpe.estouro ? { ...golpe.estouro, fraco: true } : null;
  return pose;
}

function poseEspecialTipo(tipo, ang, parte, k, t) {
  const E = ESPECIAIS_PX[tipo], cima = -ang / 90, parado = poseParado(0.25, t);
  const treme = (k % 2 ? 1 : -1);
  if (parte === 'inicio') {
    const e = suave((k + 1) / E.inicio), chamas = 0.15 + 0.85 * e;
    if (tipo === 'onca' || tipo === 'canhao') {
      const canhao = tipo === 'canhao';
      const q0 = pt(mix(0, canhao ? -8 : -6, e) + (e > 0.6 ? treme * 0.8 : 0), mix(-51, canhao ? -42 : -44, e)), inc = mix(3, canhao ? -6 : -10, e), o = ombrosDe(q0, inc);
      const armada = [soma(o.longe, pt(-14, 30)), soma(o.perto, pt(-18, 33))];
      const maos = armada.map((a, i) => lerp(parado.maos[i], a, e));
      return {
        quadril: q0, inclina: inc, pes: [pe(mix(-9, canhao ? -26 : -20, e)), pe(mix(11, canhao ? 26 : 22, e))],
        maos, formaMao: ['palma', 'palma'], angMao: [-30, -30], bracoL: [46, 46],
        cabeca: { inc: 4 * e, dy: ang < 0 ? -1 : 0 }, olhar: ang < 0 ? 0.4 : 0, ex: 'bravo', saia: -4 * e,
        vento: [0, mix(-0.8, -1.8, e)], chamas, energia: { c: lerp(maos[0], maos[1], 0.5), r: 3 + (canhao ? 11 : 10) * e, tipo: canhao ? 'fogo' : 'onca' }
      };
    }
    if (tipo === 'pocao') {
      const q0 = pt(mix(0, -4, e), mix(-51, -48, e)), inc = mix(3, -10, e), o = ombrosDe(q0, inc);
      const mao = lerp(parado.maos[1], polar(o.perto, ang - 135, 40), e);
      const mira = lerp(parado.maos[0], naMira(o.longe, ang, 50, 0), e);
      return {
        quadril: q0, inclina: inc, pes: [pe(-12), pe(mix(11, 15, e), -5 * e, 12 * e)],
        maos: [mira, mao], formaMao: ['palma', 'punho'], angMao: [ang - 80, -90], bracoL: [52, 46],
        cabeca: { inc: 3 * e, dy: ang < 0 ? -1.5 : 0 }, giro: 0.55, olhar: ang < 0 ? 0.4 : 0,
        ex: k < 2 ? 'convencido' : 'determinado', saia: -3 * e, chamas, frasco: { c: mao, brilho: k % 2 }
      };
    }
    // bolha: as palmas seguram a bolha na frente do peito, uma em cima e outra embaixo
    const q0 = pt(mix(0, -3, e), mix(-51, -47, e)), inc = mix(3, -4, e), o = ombrosDe(q0, inc);
    const c = soma(o.perto, pt(28, 14)), rr = 7 + 9 * e;
    const maos = [lerp(parado.maos[0], soma(c, pt(-3, rr)), e), lerp(parado.maos[1], soma(c, pt(1, -rr)), e)];
    return {
      quadril: q0, inclina: inc, pes: [pe(mix(-9, -14, e)), pe(mix(11, 16, e))],
      maos, formaMao: ['palma', 'palma'], angMao: [-90, 90], bracoL: [52, 50],
      cabeca: { inc: 2 * e, dy: 1 }, giro: 0.55, ex: 'determinado', saia: -2 * e, vento: [0, -1.2], chamas,
      energia: { c, r: 4 + 10 * e, tipo: 'agua' }
    };
  }
  if (parte === 'loop') {
    // Canhão segurando o feixe: mãos juntas na mira, corpo tremendo com o tranco
    const q0 = pt(mix(6, 0, cima) + treme * 1.2, -43 + (k % 2) * 0.6), inc = mix(14, -6, cima) - (k % 2) * 1.5, o = ombrosDe(q0, inc);
    return {
      quadril: q0, inclina: inc, pes: [pe(-26), pe(24)],
      maos: [naMira(o.longe, ang, 70, 9), naMira(o.perto, ang, 72, 10)], formaMao: ['palma', 'palma'], angMao: [ang - 80, ang - 80], bracoL: [70, 72],
      cabeca: { dx: 2, dy: ang < 0 ? -1.5 : 0, inc: -4 }, giro: 0.55, olhar: ang < 0 ? 0.4 : 0, ex: 'furioso', chamas: 1,
      vento: [mix(-2.4, -0.8, cima), mix(-0.4, 0.5, cima)], saia: 18 + (k % 2) * 6, agita: 2
    };
  }
  // fim: o quadro 0 é o golpe saindo
  const u = k / (E.fim - 1);
  if (tipo === 'onca' || tipo === 'bolha') return voltaEspecial(posePalmas(ang, tipo === 'onca' ? 1 : 0.8, tipo), u, t, k);
  if (tipo === 'canhao') {
    const golpe = poseEspecialTipo('canhao', ang, 'loop', 0, t);
    golpe.estouro = null;
    const pose = voltaEspecial(golpe, mix(0.25, 1, u), t, 9);
    pose.fumaca = { c: lerp(golpe.maos[0], golpe.maos[1], 0.5), u };
    pose.chamas = 1 - suave(u);
    return pose;
  }
  // poção: o braço passa da mira e desce (continuação do arremesso), depois volta
  const giro = ang + 55 * suave(trecho(u, 0, 0.45));
  const q0 = pt(mix(6, 1, cima), -48), inc = mix(14, -4, cima), o = ombrosDe(q0, inc);
  const golpe = {
    quadril: q0, inclina: inc, pes: [pe(-14), pe(19)],
    maos: [soma(o.longe, pt(-30, 16)), polar(o.perto, giro + 8, 66)], formaMao: ['punho', 'palma'], angMao: [-90, giro - 80], bracoL: [50, 70],
    cabeca: { dx: 2, dy: ang < 0 ? -1.5 : 0, inc: -3 }, giro: 0.55, olhar: ang < 0 ? 0.4 : 0, ex: 'determinado', saia: 8,
    estouro: { c: polar(o.perto, ang + 8, 80), tipo: 'veneno' }
  };
  return voltaEspecial(golpe, trecho(u, 0.2, 1), t, k);
}
/* Agachado: o mesmo gesto de cada especial, com o corpo comprimido e o golpe saindo para a frente,
   rente ao chão (como o tiro agachado). A volta termina na pose agachada, não de pé. */
function poseEspecialAgachado(tipo, parte, k, t) {
  const E = ESPECIAIS_PX[tipo], treme = (k % 2 ? 1 : -1);
  const corpo = (cabecaAlta, tremendo = 0) => {
    const base = agachadoPx(t, 0, 0, cabecaAlta);
    base.quadril = soma(base.quadril, pt(tremendo, 0));
    const Tc = E5.tronco * 0.6;
    return { base, perto: soma(base.quadril, rot(pt(-3, -Tc + 9), base.inclina)), longe: soma(base.quadril, rot(pt(-7, -Tc + 8), base.inclina)) };
  };
  const golpePalmas = (tipoGolpe) => {
    const est = tipoGolpe === 'bolha' ? 'agua' : tipoGolpe;
    const { base, perto, longe } = corpo(true);
    const maos = [soma(longe, pt(56, 4)), soma(perto, pt(62, 2))];
    return { ...base, maos, formaMao: ['palma', 'palma'], angMao: [-80, -80], bracoL: [62, 66], ex: 'furioso', saia: -18, vento: [-1.4, -0.6],
      estouro: est ? { c: soma(lerp(maos[0], maos[1], 0.5), pt(8, 0)), tipo: est } : null };
  };
  const volta = (golpe, u, kk) => {
    const r = suave(trecho(u, 0.3, 1));
    const pose = mixPose(golpe, agachadoPx(t), r);
    pose.comprime = 1;
    pose.ex = r < 0.15 ? golpe.ex : 'determinado';
    pose.formaMao = golpe.formaMao; pose.angMao = golpe.angMao;
    pose.chamas = 1 - suave(trecho(u, 0.25, 1));
    pose.estouro = kk === 0 ? golpe.estouro : kk === 1 && golpe.estouro ? { ...golpe.estouro, fraco: true } : null;
    return pose;
  };
  if (parte === 'inicio') {
    const e = suave((k + 1) / E.inicio), chamas = 0.15 + 0.85 * e;
    const { base, perto, longe } = corpo(false, e > 0.6 && tipo !== 'pocao' ? treme * 0.6 : 0);
    const inicio = { ...base, ex: 'bravo', chamas, saia: -14 - 3 * e };
    if (tipo === 'onca' || tipo === 'canhao') {
      // mãos puxadas para trás, rente ao quadril, juntando energia
      const maos = [lerp(base.maos[0], soma(base.quadril, pt(-12, -2)), e), lerp(base.maos[1], soma(base.quadril, pt(-8, -4)), e)];
      return { ...inicio, maos, formaMao: ['palma', 'palma'], angMao: [-30, -30],
        energia: { c: lerp(maos[0], maos[1], 0.5), r: 3 + 9 * e, tipo: tipo === 'canhao' ? 'fogo' : 'onca' } };
    }
    if (tipo === 'pocao') {
      // a poção sobe para trás da cabeça; a outra mão aponta para a frente
      const mao = lerp(base.maos[1], soma(perto, pt(-18, -24)), e), mira = lerp(base.maos[0], soma(longe, pt(46, 4)), e);
      return { ...inicio, maos: [mira, mao], formaMao: ['palma', 'punho'], angMao: [-80, -90], bracoL: [50, 44], ex: k < 2 ? 'convencido' : 'determinado', frasco: { c: mao, brilho: k % 2 } };
    }
    // bolha entre as palmas, na frente do rosto
    const c = soma(perto, pt(26, 4)), rr = 6 + 8 * e;
    return { ...inicio, ex: 'determinado', maos: [lerp(base.maos[0], soma(c, pt(-3, rr)), e), lerp(base.maos[1], soma(c, pt(1, -rr)), e)],
      formaMao: ['palma', 'palma'], angMao: [-90, 90], bracoL: [50, 48], energia: { c, r: 4 + 9 * e, tipo: 'agua' } };
  }
  if (parte === 'loop') {
    const { base, perto, longe } = corpo(true, treme * 1.0);
    return { ...base, maos: [soma(longe, pt(60, 6)), soma(perto, pt(62, 4))], formaMao: ['palma', 'palma'], angMao: [-80, -80], bracoL: [66, 66],
      ex: 'furioso', chamas: 1, vento: [-2.4, -0.4], saia: -18 - (k % 2) * 4, agita: 2 };
  }
  const u = k / (E.fim - 1);
  if (tipo === 'onca' || tipo === 'bolha') return volta(golpePalmas(tipo), u, k);
  if (tipo === 'canhao') {
    const golpe = poseEspecialAgachado('canhao', 'loop', 0, t);
    const pose = volta(golpe, mix(0.25, 1, u), 9);
    pose.fumaca = { c: lerp(golpe.maos[0], golpe.maos[1], 0.5), u };
    pose.chamas = 1 - suave(u);
    return pose;
  }
  // poção: arremessa para a frente e o braço desce até o chão
  const { base, perto, longe } = corpo(true);
  const giro = 8 + 50 * suave(trecho(u, 0, 0.45));
  const golpe = { ...base, maos: [soma(longe, pt(-20, 10)), polar(perto, giro, 62)], formaMao: ['punho', 'palma'], angMao: [-90, giro - 80], bracoL: [44, 66],
    ex: 'determinado', saia: -18, estouro: { c: polar(perto, 8, 76), tipo: 'veneno' } };
  return volta(golpe, trecho(u, 0.2, 1), k);
}
// pose de um quadro do especial; mira = 'frente' | 'diag_cima' | 'cima' | 'agachado'
function poseEspecialMira(tipo, mira, parte, k, t) {
  return mira === 'agachado' ? poseEspecialAgachado(tipo, parte, k, t) : poseEspecialTipo(tipo, MIRAS_ESPECIAL[mira], parte, k, t);
}
// a sequência inteira (preparo, golpe e volta) numa só, para a página do gerador
function poseEspecialSeq(tipo, mira, p, t) {
  const E = ESPECIAIS_PX[tipo], nl = E.loop ? E.loop * 3 : 0, n = E.inicio + nl + E.fim;
  const k = Math.min(n - 1, Math.floor(p * n));
  const pose = k < E.inicio ? poseEspecialMira(tipo, mira, 'inicio', k, t)
    : k < E.inicio + nl ? poseEspecialMira(tipo, mira, 'loop', (k - E.inicio) % E.loop, t)
      : poseEspecialMira(tipo, mira, 'fim', k - E.inicio - nl, t);
  pose.rotulo = E.nome;
  return pose;
}

/* ---------- dano ----------
   Leva o golpe: tranco para trás, cabeça jogada para trás, cabelo arrepiado, braços abertos e
   olhos apertados; depois amortece nos joelhos e volta à pose parada. k = 0 (golpe) .. 4 (recuperado). */
function poseDanoPx(k, t) {
  const parado = poseParado(0.25, t);
  const qG = pt(-6, -53), oG = ombrosDe(qG, -20);
  const golpe = {
    quadril: qG, inclina: -20, pes: [pe(-12, 0, -10), pe(12, -6, -26)],
    maos: [soma(oG.longe, pt(-36, 12)), soma(oG.perto, pt(40, 8))], bracoL: [39, 42], cotovelo: [-1, 1], formaMao: ['palma', 'palma'],
    cabeca: { dx: -2, dy: 1, inc: -16 }, ex: 'dor', saia: -14, vento: [0.6, -2.8], agita: 0.2
  };
  const qA = pt(-3, -45), oA = ombrosDe(qA, -6);
  const amortece = {
    quadril: qA, inclina: -6, pes: [pe(-12), pe(13)],
    maos: [pendura(oA.longe, -0.7, 38), pendura(oA.perto, 0.9, 38)], bracoL: [40, 40], formaMao: ['palma', 'punho'],
    cabeca: { dy: 1, inc: -4 }, ex: 'dor', saia: -6, vento: [0.3, -1.6], agita: 0.6
  };
  const pose = [
    () => mixPose(parado, golpe, 0.8),
    () => golpe,
    () => mixPose(golpe, amortece, 0.55),
    () => amortece,
    () => ({ ...mixPose(amortece, parado, 0.7), ex: 'determinado' })
  ][k]();
  pose.rotulo = 'dano';
  return pose;
}

const ANIMS_PX = ANIMS.flatMap(A => {
  if (A.id === 'parado') return [{ ...A, desc: 'Respira e balança no lugar. O cabelo é vermelho e só mexe com o corpo.' }];
  if (A.id === 'especial') return Object.entries(ESPECIAIS_PX).map(([tipo, E]) => {
    const n = E.inicio + (E.loop ? E.loop * 3 : 0) + E.fim;
    const ciclo = E.inicio / E.fpsInicio + (E.loop ? E.loop * 3 / E.fpsLoop : 0) + E.fim / E.fpsFim;
    return {
      ...A, id: 'especial_' + tipo, nome: 'Especial: ' + E.nome, godot: `especial_${tipo}_<mira>_inicio/fim`, ciclo, n,
      onca: tipo === 'onca' ? E.inicio / n : undefined,
      pose: (p, t) => poseEspecialSeq(tipo, 'frente', p, t),
      desc: { onca: 'Puxa as mãos para trás juntando energia dourada e empurra as duas palmas, rugindo: sai a onça.',
        canhao: 'Abre as pernas, junta fogo atrás do quadril e segura o feixe com as mãos juntas, tremendo. No fim sai fumaça das mãos.',
        pocao: 'A poção aparece na mão, ele arma o braço para trás e arremessa.',
        bolha: 'Segura uma bolha d\'água entre as palmas na frente do peito e empurra.' }[tipo] + ' Sai também na diagonal para cima, para cima e agachado.'
    };
  });
  if (A.id === 'pular') return [
    { ...A, pose: (p, t) => posePularPx(p, t), desc: 'Mesma altura e tempo do GDD. Pulo contido: joelho sobe, braços perto do corpo, sem agitar. Para atirar no ar, veja as cinco animações "No ar, atirando".' }
  ];
  if (A.id === 'atacar') return [
    { ...A, nome: 'Atirar (frente)', godot: 'atirar', desc: 'Palma aberta à frente; a cada tiro a mão arma e dá um coice. 5 tiros por segundo, como o Tiro de Folha.' },
    { ...A, id: 'atirar_diag_cima', nome: 'Atirar na diagonal para cima', godot: 'atirar_diag_cima', pose: (p, t) => poseAtirarPx(p, t, MIRAS.diag_cima), desc: 'Parado, braço a 45° para cima; o corpo inclina um pouco para trás.' },
    { ...A, id: 'atirar_cima', nome: 'Atirar para cima', godot: 'atirar_cima', pose: (p, t) => poseAtirarPx(p, t, MIRAS.cima), desc: 'Parado, braço reto para cima e o olhar acompanhando.' },
    { ...A, id: 'atirar_diag_baixo', nome: 'Atirar na diagonal para baixo', godot: 'atirar_diag_baixo', pose: (p, t) => poseAtirarPx(p, t, MIRAS.diag_baixo), desc: 'Parado, braço a 45° para baixo. No chão só sai com a mira travada; no ar sai normal.' }
  ];
  if (A.id === 'atacar_correndo') return [
    { ...A, nome: 'Correr atirando', godot: 'correr_atirar' },
    { ...A, id: 'correr_atirar_diag_cima', nome: 'Correr atirando na diagonal', godot: 'correr_atirar_diag_cima', pose: (p, t) => poseCorrerAtirarPx(p, t, MIRAS.diag_cima), desc: 'Pernas da corrida e braço a 45° para cima, para acertar o chefe alto sem parar.' }
  ];
  if (A.id === 'abaixar') return [
    { ...A, pose: poseAbaixarPx, desc: 'Comprime o corpo, deita para a frente e a cabeça fica quase no chão. Desce passando do ponto e volta, como borracha.' },
    { ...A, id: 'agachado_atirar', nome: 'Atirar agachado', godot: 'agachado_atirar', ciclo: 0.4, tiro: true, pose: (p, t) => agachadoPx(t, 0, 0, true), desc: 'Agachado, a cabeça sobe um pouco e o braço da frente estica rente ao chão. Os tiros saem baixos.' }
  ];
  if (A.id === 'derrota') return [
    { ...A, desc: 'Leva o golpe piscando, cai sentado e fica tonto, com estrelinhas e fumaça saindo da cabeça.' },
    ...Object.entries({ cima: 'para cima', diag_cima: 'na diagonal para cima', lado: 'para a frente', diag_baixo: 'na diagonal para baixo', baixo: 'para baixo' }).map(([k, nome]) => ({
      id: 'ar_atirar_' + k, nome: 'No ar, atirando ' + nome, godot: 'ar_atirar_' + k, ciclo: 0.4, tiro: true, noAr: true,
      pose: (p, t) => poseArAtirarPx(p, t, MIRAS[k]), desc: 'Mesma pose para subir e cair, só o braço muda.' + (k === 'baixo' ? ' Para baixo só existe no ar.' : '')
    }))
  ];
  return [A];
});
