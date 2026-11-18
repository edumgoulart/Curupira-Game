extends Chefe
## Mula sem Cabeça — primeiro chefe. Ataques, fases e combos por dificuldade no mula.tres.
## Leva dano o tempo todo. Vida, fases, sorteio, combos e derrota vêm da classe base Chefe.
##
## Cada ataque, na ordem em que acontece:
##   bolas      — abaixa o peito (aviso) e cospe N bolas rente ao chão, com coice a cada uma.
##                Pula-se;
##   pisoteio   — empina e segura no alto (aviso), bate as patas e solta a onda de fogo. Pula-se;
##   investida  — agacha e raspa a pata da frente na terra duas vezes, como cavalo antes de
##                correr (aviso), corre até a parede do lado do Curupira e fica tonta. Pula-se por
##                cima ou dash.
##                Fica lá: não volta de costas para o lugar (isso prendia o Curupira na parede).
##                Os ataques seguintes saem de onde ela está, espelhados (miram o Curupira);
##   meteoros   — empina com o fogo para cima e cospe cada meteoro para o céu (dá para ver subir).
##                Cada um avisa com um brilho no alto da tela, em cima de onde vai cair, que fica
##                mais forte até a pedra descer (o brilho é do Meteoro). Depois fica cansada
##                (janela para atacar).
## Encadeado (primeiro de um combo): a investida pula o "tonta" e os meteoros não esperam
## a última pedra cair nem o "cansada".
## Os tiros saem do ponto "boca" do desenho (a ponta do fogo do pescoço, quadro a quadro).
##
## Animações usadas (mula_frames.tres, gerado pelo gerador de pixel art):
##   idle, aviso_bolas, bolas, fim_bolas, aviso_pisoteio, pisoteio_alto, pisoteio,
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
	avisar(true)
	tocar(&"aviso_bolas")
	if not await esperar(_d.aviso_bolas):
		return
	avisar(false)
	for i in _d.quantidade_bolas:
		reiniciar(&"bolas")  # um coice por bola
		_lancar_bola(lado)
		if not await esperar(_d.intervalo_bolas):
			return
	await tocar_e_esperar(&"fim_bolas")


func _lancar_bola(lado: float) -> void:
	var bola: BolaDeFogoMula = _d.cena_bola.instantiate()
	bola.dano = _d.golpes_bola
	# Sai da boca de fogo, na altura rente ao chão (a origem da Mula fica nos pés).
	bola.global_position = Vector2(ponto("boca").x, global_position.y - _d.altura_bola)
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
	onda.lancar(lado, _d.velocidade_onda)
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
	for i in _d.quantidade_meteoros:
		# O primeiro no Curupira; os outros alternando dos lados (0, -d, +d, -2d...).
		var passo_lado: int = (i + 1) / 2
		var lado: float = -1.0 if i % 2 == 1 else 1.0
		var x: float = clampf(centro + lado * passo_lado * _d.distancia_meteoros, -ARENA_MEIA_LARGURA + 80.0, ARENA_MEIA_LARGURA - 80.0)
		_soltar_meteoro(x)
		if not await esperar(_d.intervalo_meteoros):
			return
	avisar(false)
	if encadeado:
		return  # as pedras caem sozinhas; o próximo ataque do combo já começa
	# Espera o último cair, cansada.
	tocar(&"cansada")
	await esperar(_d.aviso_meteoro - _d.intervalo_meteoros + _d.parada_apos_meteoro)


func _soltar_meteoro(x: float) -> void:
	_meteoro_subindo()
	var meteoro: Meteoro = _d.cena_meteoro.instantiate()
	meteoro.configurar(_d)
	meteoro.global_position = Vector2(x, global_position.y)
	lancar_na_cena(meteoro)


## A pedra sai da boca de fogo e sobe para fora da tela: assim se vê que a chuva vem dela.
func _meteoro_subindo() -> void:
	var pedra := Sprite2D.new()
	pedra.add_to_group("ataques_chefe")
	pedra.texture = TEXTURA_METEORO_SUBINDO
	pedra.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	pedra.scale = Vector2(4.0, -4.0)  # de cabeça para baixo: o rastro de fogo fica embaixo
	pedra.global_position = ponto("boca")
	lancar_na_cena(pedra)
	var subida: Tween = pedra.create_tween()
	subida.tween_property(pedra, "global_position:y", pedra.global_position.y - SUBIDA_METEORO_PX, SUBIDA_METEORO_DURACAO).set_ease(Tween.EASE_IN)
	subida.tween_callback(pedra.queue_free)


func _ao_ser_derrotado() -> void:
	contato.dano = dados.golpes_contato
