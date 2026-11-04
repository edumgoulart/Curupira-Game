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

// especial: o cabelo pega fogo enquanto carrega, queima no grito e apaga depois
function poseEspecialPx(p, t) {
  const pose = poseEspecial(p, t);
  pose.chamas = p < 0.38 ? suave(trecho(p, 0.06, 0.34)) : p < 0.72 ? 1 : 1 - suave(trecho(p, 0.72, 0.96));
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

const ANIMS_PX = ANIMS.flatMap(A => {
  if (A.id === 'parado') return [{ ...A, desc: 'Respira e balança no lugar. O cabelo é vermelho e só mexe com o corpo.' }];
  if (A.id === 'especial') return [{ ...A, pose: poseEspecialPx, desc: 'Carrega a energia, o cabelo pega fogo, ele grita e solta a onça. Depois o fogo apaga.' }];
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
