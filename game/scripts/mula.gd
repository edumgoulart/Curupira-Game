extends Chefe
## Mula sem Cabeça — primeiro chefe. Três fases (vida em mula.tres):
##   fase 1: bolas, pisoteio;   fase 2: + investida;   fase 3: + meteoros.
## Leva dano o tempo todo. Vida, fases, sorteio e derrota vêm da classe base Chefe.
##
## Cada ataque, na ordem em que acontece:
##   bolas      — abaixa o peito (aviso) e cospe N bolas rente ao chão, com coice a cada uma;
##   pisoteio   — empina e segura no alto (aviso), bate as patas e solta a onda de fogo;
##   investida  — raspa o casco (aviso), corre até a parede, fica tonta e volta trotando;
##   meteoros   — empina com o fogo para cima, lança N meteoros (sombra no chão de cada um)
##                e fica cansada (janela para atacar).
## Os tiros saem do ponto "boca" do desenho (a ponta do fogo do pescoço, quadro a quadro).
##
## Animações usadas (mula_frames.tres, gerado pelo gerador de pixel art):
##   idle, aviso_bolas, bolas, fim_bolas, aviso_pisoteio, pisoteio_alto, pisoteio,
##   aviso_investida, galope, batida, tonta, trote, aviso_meteoros, meteoros, cansada, derrota

## Quadro da animação "pisoteio" em que as patas batem no chão (sai a onda).
const QUADRO_PISADA: int = 2

## Os dados com o tipo da Mula (o campo "dados" da base é do tipo genérico ChefeData).
@onready var _d: MulaData = dados as MulaData
## Onde a Mula fica entre os ataques (volta para cá depois da investida).
@onready var _x_inicial: float = global_position.x


func _executar(nome: StringName) -> void:
	match nome:
		&"bolas":
			await _bolas()
		&"pisoteio":
			await _pisoteio()
		&"investida":
			await _investida()
		&"meteoros":
			await _meteoros()


func _bolas() -> void:
	avisar(true)
	tocar(&"aviso_bolas")
	if not await esperar(_d.aviso_bolas):
		return
	avisar(false)
	for i in _d.quantidade_bolas:
		reiniciar(&"bolas")  # um coice por bola
		_lancar_bola()
		if not await esperar(_d.intervalo_bolas):
			return
	await tocar_e_esperar(&"fim_bolas")


func _lancar_bola() -> void:
	var bola: BolaDeFogoMula = _d.cena_bola.instantiate()
	bola.dano = _d.golpes_bola
	# Sai da boca de fogo, na altura rente ao chão (a origem da Mula fica nos pés).
	bola.global_position = Vector2(ponto("boca").x, global_position.y - _d.altura_bola)
	bola.lancar(lado_do_alvo(), _d.velocidade_horizontal_bola)
	lancar_na_cena(bola)


func _pisoteio() -> void:
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
		_soltar_onda()
		if i < _d.quantidade_ondas - 1 and not await esperar(_d.intervalo_ondas):
			return
	await esperar(maxf(FolhaSprites.duracao(sprite, &"pisoteio") - QUADRO_PISADA / fps, 0.0))


func _soltar_onda() -> void:
	var onda: OndaFogoMula = _d.cena_onda.instantiate()
	onda.dano = _d.golpes_onda
	# Nasce no chão, na frente das patas, e corre para o lado do Curupira.
	onda.global_position = Vector2(ponto("frente").x, global_position.y)
	onda.lancar(lado_do_alvo(), _d.velocidade_onda)
	lancar_na_cena(onda)


func _investida() -> void:
	var lado: float = lado_do_alvo()
	avisar(true)
	tocar(&"aviso_investida")
	if not await esperar(_d.aviso_investida):
		return
	avisar(false)
	# Corre até a parede do lado do Curupira; o corpo (Contato) é que machuca.
	contato.dano = _d.golpes_investida
	virar(lado > 0.0)
	tocar(&"galope")
	var parede: float = lado * (ARENA_MEIA_LARGURA - _d.margem_parede)
	if not await andar_ate(parede, _d.velocidade_investida):
		return
	contato.dano = dados.golpes_contato
	if not await tocar_e_esperar(&"batida"):
		return
	tocar(&"tonta")
	if not await esperar(_d.tempo_tonta):
		return
	# Volta trotando para o lugar, de frente para onde vai.
	virar(_x_inicial > global_position.x)
	tocar(&"trote")
	if not await andar_ate(_x_inicial, _d.velocidade_volta):
		return
	virar(x_do_alvo() > global_position.x)


func _meteoros() -> void:
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
	# Espera o último cair, cansada.
	tocar(&"cansada")
	await esperar(_d.aviso_meteoro - _d.intervalo_meteoros + _d.parada_apos_meteoro)


func _soltar_meteoro(x: float) -> void:
	var meteoro: Meteoro = _d.cena_meteoro.instantiate()
	meteoro.configurar(_d)
	meteoro.global_position = Vector2(x, global_position.y)
	lancar_na_cena(meteoro)


func _ao_ser_derrotado() -> void:
	contato.dano = dados.golpes_contato
