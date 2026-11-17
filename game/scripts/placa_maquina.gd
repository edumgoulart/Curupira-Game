class_name PlacaMaquina
extends Node2D
## Placa do piso que salta (ataque "pistões" da Máquina). A origem fica no chão:
##   1. o aviso (marcas vermelhas) pisca no chão;
##   2. a placa sobe e desce (animação "placa"); enquanto ela está em cima, machuca.
## Quem cria chama configurar() antes de pôr na cena. Desvia-se pulando a placa.

var _atraso: float = 0.0
var _aviso: float = 0.25
var _golpes: int = 1
var _tempo: float = 0.0
var _subiu: bool = false

@onready var aviso: Polygon2D = $Aviso
@onready var visual: AnimacaoQuadros = $Visual
@onready var area: Hitbox = $Area
@onready var forma: CollisionShape2D = $Area/CollisionShape2D


## atraso: espera antes do aviso (s), para as placas saltarem em onda.
func configurar(atraso: float, tempo_aviso: float, golpes: int) -> void:
	_atraso = atraso
	_aviso = tempo_aviso
	_golpes = golpes


func _ready() -> void:
	add_to_group("ataques_chefe")
	area.dano = _golpes
	visual.visible = false
	visual.set_process(false)  # só anima quando a placa sobe
	aviso.visible = false
	visual.terminou.connect(queue_free)


func _physics_process(delta: float) -> void:
	_tempo += delta
	if _tempo < _atraso:
		return
	if not _subiu:
		aviso.visible = int((_tempo - _atraso) * 16.0) % 2 == 0
		if _tempo >= _atraso + _aviso:
			_subiu = true
			aviso.visible = false
			visual.visible = true
			visual.trocar_quadros(visual.quadros)
			visual.set_process(true)
			forma.set_deferred("disabled", false)
		return
	# Machuca só na metade de cima do movimento (os quadros do meio da animação).
	var fim: float = visual.quadros.size() / visual.fps
	if _tempo > _atraso + _aviso + fim * 0.75:
		forma.set_deferred("disabled", true)
