extends Chefe
## Mula sem Cabeça — primeiro chefe. Ataques, fases e combos por dificuldade no mula.tres.
## Leva dano o tempo todo. Vida, fases, sorteio, combos e derrota vêm da classe base Chefe.
##
## Cada ataque, na ordem em que acontece:
##   bolas      — abaixa o peito (aviso) e cospe N bolas rente ao chão, com coice a cada uma.
##                O espaço entre elas é sorteado (intervalo_bolas até intervalo_bolas_max): às
##                vezes cabe pular entre duas, às vezes é preciso pular por cima ou dar dash.
##                No Expert são mais bolas, altas (abaixar) e baixas (pular) misturadas: antes de
##                cada bola que muda de altura ela troca de pose (o aviso da altura);
##   pisoteio   — empina e segura no alto (aviso), bate as patas e solta a onda de fogo, que
##                cresce conforme se afasta: pula-se perto da Mula; longe, não dá mais;
##   investida  — agacha e raspa a pata da frente na terra duas vezes, como cavalo antes de
##                correr (aviso), corre até a parede do lado do Curupira e fica tonta. Pula-se por
##                cima ou dash.
##                Fica lá: não volta de costas para o lugar (isso prendia o Curupira na parede).
##                Os ataques seguintes saem de onde ela está, espelhados (miram o Curupira);
##   meteoros   — empina com o fogo para cima e cospe cada meteoro para o céu (dá para ver subir).
##                Cada um avisa com um brilho no alto da tela, em cima de onde vai cair, que fica
##                mais forte até a pedra descer (o brilho é do Meteoro). No Expert ela cospe
##                uma rajada de pedras para o céu e a chuva cobre a arena toda (menos perto
##                dela) em duas ondas: a segunda, nos vãos entre as pedras da primeira, só
##                começa a brilhar quando a primeira já está caindo.
##                Depois fica cansada (janela para atacar).
##                No Expert, abrindo um combo, o brilho dura mais e as pedras caem durante o
##                ataque seguinte (ex.: chove meteoro enquanto ela cospe as bolas).
## Encadeado (primeiro de um combo): a investida pula o "tonta" e os meteoros não esperam
## a última pedra cair nem o "cansada".
## Os tiros saem do ponto "boca" do desenho (a ponta do fogo do pescoço, quadro a quadro).
##
## Animações usadas (mula_frames.tres, gerado pelo gerador de pixel art):
##   idle, aviso_bolas, bolas, fim_bolas, aviso_bolas_alto, bolas_alto, fim_bolas_alto,
##   bolas_sobe, bolas_desce, aviso_pisoteio, pisoteio_alto, pisoteio,
##   aviso_investida, galope, batida, tonta, aviso_meteoros, meteoros, cansada, derrota,
##   dano e transicao (usadas pela base Chefe)

## Quadro da animação "pisoteio" em que as patas batem no chão (sai a onda).
const QUADRO_PISADA: int = 2
## Quadro da animação "transicao" em que ela desce as patas com poeira (a tela treme). Só visual.
const QUADRO_PISADA_TRANSICAO: int = 17
## Meteoro subindo da boca para o céu, a cada pedra lançada. Só visual (quem machuca é o Meteoro).
const TEXTURA_METEORO_SUBINDO: Texture2D = preload("res://assets/pixel/mula/efeitos/rocha_caindo_1.png")
const SUBIDA_METEORO_PX: float = 1300.0
const SUBIDA_METEORO_DURACAO: float = 0.35
## Na rajada do Expert: quanto cada pedra pode se desviar para os lados enquanto sobe (px) e
## quanto tempo leva para sair da tela (s), mais devagar que a pedra única, para se ver a chuva.
const SUBIDA_ESPALHADA_PX: float = 800.0
const SUBIDA_ESPALHADA_DURACAO: Vector2 = Vector2(0.6, 1.0)

## Os dados com o tipo da Mula (o campo "dados" da base é do tipo genérico ChefeData).
@onready var _d: MulaData = dados as MulaData


func _executar(nome: StringName, encadeado: bool = false) -> void:
	# Todo ataque começa de frente para o Curupira (ela pode estar em qualquer lado).
	_virar_para_alvo()
	match nome:
		&"bolas":
			await _bolas()
		&"pisoteio":
			await _pisoteio()
		&"investida":
			await _investida(encadeado)
		&"meteoros":
			await _meteoros(encadeado)


func _efeitos_da_transicao() -> void:
	var fps: float = sprite.sprite_frames.get_animation_speed(&"transicao") if sprite.sprite_frames.has_animation(&"transicao") else 12.0
	if await esperar(QUADRO_PISADA_TRANSICAO / fps):
		EfeitosTela.tremer(self, 12.0, 0.35)


func _bolas() -> void:
	var lado: float = lado_do_alvo()
	var altas: Array[bool] = _sortear_alturas()
	avisar(true)
	tocar(&"aviso_bolas_alto" if altas[0] else &"aviso_bolas")
	if not await esperar(_d.aviso_bolas):
		return
	avisar(false)
	for i in altas.size():
		reiniciar(&"bolas_alto" if altas[i] else &"bolas")  # um coice por bola
		_lancar_bola(lado, altas[i])
		var intervalo: float = _sorteio.randf_range(_d.intervalo_bolas, maxf(_d.intervalo_bolas_max, _d.intervalo_bolas))
		if i + 1 < altas.size() and altas[i + 1] != altas[i]:
			# A próxima muda de altura: termina o coice e troca de pose antes de cuspir.
			intervalo = maxf(intervalo, _d.intervalo_troca_altura)
			var coice: float = minf(0.15, intervalo * 0.4)
			if not await esperar(coice):
				return
			reiniciar(&"bolas_sobe" if altas[i + 1] else &"bolas_desce")
			intervalo -= coice
		if not await esperar(intervalo):
			return
	await tocar_e_esperar(&"fim_bolas_alto" if altas.back() else &"fim_bolas")


## A altura de cada bola da rajada (true = alta). No Normal, todas baixas; no Expert, sorteadas,
## com pelo menos uma de cada.
func _sortear_alturas() -> Array[bool]:
	var altas: Array[bool] = []
	if not _expert():
		altas.resize(maxi(_d.quantidade_bolas, 1))
		altas.fill(false)
		return altas
	for i in maxi(_d.quantidade_bolas_expert, 1):
		altas.append(_sorteio.randf() < _d.chance_bola_alta_expert)
	if altas.size() > 1 and (altas.all(func(a: bool) -> bool: return a) or not altas.has(true)):
		var i: int = _sorteio.randi_range(0, altas.size() - 1)
		altas[i] = not altas[i]
	return altas


func _expert() -> bool:
	return GameState.dificuldade == GameState.Dificuldade.EXPERT


func _lancar_bola(lado: float, alta: bool) -> void:
	var bola: BolaDeFogoMula = _d.cena_bola.instantiate()
	bola.dano = _d.golpes_bola
	# Sai da boca de fogo, rente ao chão ou na altura do peito (a origem da Mula fica nos pés).
	bola.global_position = Vector2(ponto("boca").x, global_position.y - (_d.altura_bola_alta if alta else _d.altura_bola))
	bola.lancar(lado, _d.velocidade_horizontal_bola)
	lancar_na_cena(bola)


func _pisoteio() -> void:
	var lado: float = lado_do_alvo()
	avisar(true)
	if not await tocar_e_esperar(&"aviso_pisoteio"):
		return
	# Segura no alto o resto do aviso.
	tocar(&"pisoteio_alto")
	if not await esperar(maxf(_d.aviso_pisoteio - FolhaSprites.duracao(sprite, &"aviso_pisoteio"), 0.0)):
		return
	avisar(false)
	reiniciar(&"pisoteio")
	var fps: float = sprite.sprite_frames.get_animation_speed(&"pisoteio")
	if not await esperar(QUADRO_PISADA / fps):
		return
	for i in _d.quantidade_ondas:
		_soltar_onda(lado)
		if i < _d.quantidade_ondas - 1 and not await esperar(_d.intervalo_ondas):
			return
	await esperar(maxf(FolhaSprites.duracao(sprite, &"pisoteio") - QUADRO_PISADA / fps, 0.0))


func _soltar_onda(lado: float) -> void:
	var onda: OndaFogoMula = _d.cena_onda.instantiate()
	onda.dano = _d.golpes_onda
	# Nasce no chão, na frente das patas, e corre para o lado do Curupira.
	onda.global_position = Vector2(ponto("frente").x, global_position.y)
	onda.lancar(lado, _d.velocidade_onda, (_d.escala_onda_longe - 1.0) / maxf(_d.distancia_onda_longe, 1.0), _d.escala_onda_max)
	lancar_na_cena(onda)


func _investida(encadeado: bool) -> void:
	var lado: float = lado_do_alvo()
	var parede: float = lado * (ARENA_MEIA_LARGURA - _d.margem_parede)
	avisar(true)
	# Agacha e raspa a pata da frente na terra: a animação inteira é o aviso.
	tocar(&"aviso_investida")
	if not await esperar(_d.aviso_investida):
		return
	avisar(false)
	# Corre até a parede do lado do Curupira; o corpo (Contato) é que machuca.
	contato.dano = _d.golpes_investida
	virar(lado > 0.0)
	tocar(&"galope")
	if not await andar_ate(parede, _d.velocidade_investida):
		return
	contato.dano = dados.golpes_contato
	if not await tocar_e_esperar(&"batida"):
		return
	if not encadeado:
		tocar(&"tonta")
		if not await esperar(_d.tempo_tonta):
			return
	# Fica nesta parede e só se vira para o Curupira.
	_virar_para_alvo()


func _meteoros(encadeado: bool) -> void:
	avisar(true)
	if not await tocar_e_esperar(&"aviso_meteoros"):
		return
	tocar(&"meteoros")
	var centro: float = x_do_alvo()
	# Abrindo um combo no Expert, as pedras demoram mais e caem durante o ataque seguinte.
	var aviso: float = _d.aviso_meteoro_combo_expert if encadeado and _expert() else -1.0
	if _expert():
		var ate_cair: float = await _chuva_expert(aviso)
		if ate_cair < 0.0:
			return
		avisar(false)
		if encadeado:
			return  # as pedras caem sozinhas; o próximo ataque do combo já começa
		# Cansada até a última pedra cair, e mais a parada (o relógio dela anda no ritmo da fase).
		tocar(&"cansada")
		await esperar((ate_cair + _d.parada_apos_meteoro) * fase_atual().ritmo)
		return
	for i in _d.quantidade_meteoros:
		# O primeiro no Curupira; os outros alternando dos lados (0, -d, +d, -2d...).
		var passo_lado: int = (i + 1) / 2
		var lado: float = -1.0 if i % 2 == 1 else 1.0
		_soltar_meteoro(aviso, _x_meteoro(centro + lado * passo_lado * _d.distancia_meteoros))
		if not await esperar(_d.intervalo_meteoros):
			return
	avisar(false)
	if encadeado:
		return  # as pedras caem sozinhas; o próximo ataque do combo já começa
	# Espera o último cair, cansada.
	tocar(&"cansada")
	await esperar(_d.aviso_meteoro - _d.intervalo_meteoros + _d.parada_apos_meteoro)


## Chuva do Expert, pela arena toda menos perto da Mula:
##   1. ela cospe uma rajada de pedras para o céu (só visual);
##   2. primeira onda: um ponto a cada distancia_meteoros a partir do Curupira; os brilhos
##      acendem do mais perto dele ao mais longe e ficam fortes;
##   3. segunda onda, nos vãos entre os da primeira: só começa a brilhar (fraco) quando a
##      primeira começa a cair, e cai logo depois.
## Devolve quanto falta (s) para a última pedra cair, ou -1 se ela foi derrotada no meio.
func _chuva_expert(aviso_combo: float) -> float:
	var lancamento: float = 0.0
	while lancamento < _d.lancamento_meteoros_expert:
		for i in _d.pedras_por_vez_lancamento:
			_meteoro_subindo(true)
		if not await esperar(_d.intervalo_pedras_lancamento):
			return -1.0
		lancamento += _d.intervalo_pedras_lancamento
	# Mira onde o Curupira está no fim do lançamento.
	var centro: float = x_do_alvo()
	var aviso_primeira: float = aviso_combo if aviso_combo > 0.0 else _d.aviso_meteoro
	var primeira: Array[float] = _pontos_chuva(centro, 0.0)
	var segunda: Array[float] = _pontos_chuva(centro, 0.5)
	var ultimo: float = 0.0
	for i in primeira.size():
		var espera: float = i * _d.intervalo_meteoros_expert
		_criar_meteoro(primeira[i], aviso_primeira, espera)
		ultimo = maxf(ultimo, espera + aviso_primeira)
	# A segunda acende quando a primeira pedra da primeira onda começa a cair.
	var inicio_segunda: float = maxf(aviso_primeira - _d.duracao_queda_meteoro, 0.0)
	for i in segunda.size():
		var espera: float = inicio_segunda + i * _d.intervalo_meteoros_expert
		_criar_meteoro(segunda[i], _d.aviso_segunda_onda_expert, espera)
		ultimo = maxf(ultimo, espera + _d.aviso_segunda_onda_expert)
	return ultimo


## Pontos de queda de uma onda da chuva: centro + (k + deslocamento) × d, dentro da arena e
## fora da zona livre da Mula, do mais perto do Curupira ao mais longe.
func _pontos_chuva(centro: float, deslocamento: float) -> Array[float]:
	var d: float = maxf(_d.distancia_meteoros, 1.0)
	var limite: float = ARENA_MEIA_LARGURA - 80.0
	var pontos: Array[float] = []
	for k in range(-ceili(2.0 * limite / d) - 1, ceili(2.0 * limite / d) + 2):
		var x: float = centro + (k + deslocamento) * d
		if absf(x) <= limite and absf(x - global_position.x) >= _d.zona_livre_mula_expert:
			pontos.append(x)
	pontos.sort_custom(func(a: float, b: float) -> bool: return absf(a - centro) < absf(b - centro))
	return pontos


## Ponto de queda dentro da arena, longe das paredes.
func _x_meteoro(x: float) -> float:
	return clampf(x, -ARENA_MEIA_LARGURA + 80.0, ARENA_MEIA_LARGURA - 80.0)


func _soltar_meteoro(aviso: float, x: float) -> void:
	_meteoro_subindo()
	_criar_meteoro(x, aviso, 0.0)


func _criar_meteoro(x: float, aviso: float, espera: float) -> void:
	var meteoro: Meteoro = _d.cena_meteoro.instantiate()
	meteoro.configurar(_d, aviso, espera)
	meteoro.global_position = Vector2(x, global_position.y)
	lancar_na_cena(meteoro)


## A pedra sai da boca de fogo e sobe para fora da tela: assim se vê que a chuva vem dela.
## espalhada = na rajada do Expert: cada pedra sobe num ângulo e numa velocidade um pouco
## diferentes, em leque, para parecer uma chuva saindo dela.
func _meteoro_subindo(espalhada: bool = false) -> void:
	var pedra := Sprite2D.new()
	pedra.add_to_group("ataques_chefe")
	pedra.texture = TEXTURA_METEORO_SUBINDO
	pedra.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	pedra.scale = Vector2(4.0, -4.0)  # de cabeça para baixo: o rastro de fogo fica embaixo
	pedra.global_position = ponto("boca")
	lancar_na_cena(pedra)
	var subida: Tween = pedra.create_tween()
	var duracao: float = SUBIDA_METEORO_DURACAO
	if espalhada:
		duracao = _sorteio.randf_range(SUBIDA_ESPALHADA_DURACAO.x, SUBIDA_ESPALHADA_DURACAO.y)
		# Umas maiores, outras menores (em pixels inteiros do desenho), para dar profundidade.
		var tamanho: float = 3.0 if _sorteio.randf() < 0.4 else 4.0
		pedra.scale = Vector2(tamanho, -tamanho)
		var desvio: float = _sorteio.randf_range(-SUBIDA_ESPALHADA_PX, SUBIDA_ESPALHADA_PX)
		pedra.rotation = atan2(desvio, SUBIDA_METEORO_PX)
		subida.set_parallel(true)
		subida.tween_property(pedra, "global_position:x", pedra.global_position.x + desvio, duracao)
	subida.tween_property(pedra, "global_position:y", pedra.global_position.y - SUBIDA_METEORO_PX, duracao).set_ease(Tween.EASE_IN)
	subida.chain().tween_callback(pedra.queue_free)


func _ao_ser_derrotado() -> void:
	contato.dano = dados.golpes_contato
