class_name BombaMaquina
extends Node2D
## Bomba da Máquina. A origem fica no CHÃO, no ponto onde ela vai cair; só o corpo
## desce do alto. No chão ela pisca e mostra a área da explosão (aviso; GDD: explode 1,5 s
## depois de cair), depois explode (2 golpes) e some.
## A bomba é só visual; quem machuca é a área "Explosao" (Hitbox, layer enemy_hitbox).

signal explodiu

## Quanto tempo a área da explosão machuca (s). Só o instante da explosão.
const DURACAO_EXPLOSAO: float = 0.15

var _velocidade: float = 900.0
var _espera: float = 1.5
var _raio: float = 180.0
var _golpes: int = 2
var _no_chao: bool = false
var _tempo: float = 0.0
var _explodiu: bool = false

@onready var corpo: Node2D = $Corpo
@onready var area_aviso: Polygon2D = $AreaAviso
@onready var explosao: Hitbox = $Explosao
@onready var forma: CollisionShape2D = $Explosao/CollisionShape2D
@onready var fogo: Polygon2D = $Fogo


func configurar(dados: MaquinaData) -> void:
	_velocidade = dados.velocidade_queda_bomba
	_espera = dados.espera_bomba
	_raio = dados.raio_explosao
	_golpes = dados.golpes_bomba


func _ready() -> void:
	add_to_group("ataques_chefe")
	explosao.dano = _golpes
	(forma.shape as CircleShape2D).radius = _raio
	forma.disabled = true
	# Área de aviso e fogo desenhados com raio 100 na cena; escala para o raio real.
	area_aviso.scale = Vector2.ONE * _raio / 100.0
	fogo.scale = Vector2.ONE * _raio / 100.0
	area_aviso.visible = false
	fogo.visible = false


func _physics_process(delta: float) -> void:
	if not _no_chao:
		corpo.position.y = minf(corpo.position.y + _velocidade * delta, 0.0)
		if corpo.position.y >= 0.0:
			_no_chao = true
			area_aviso.visible = true
		return
	_tempo += delta
	if not _explodiu:
		# Pisca cada vez mais rápido até explodir (só visual).
		var ritmo: float = lerpf(4.0, 14.0, clampf(_tempo / _espera, 0.0, 1.0))
		# Entre 20% e 75%: pisca, mas nunca some (é o aviso).
		area_aviso.modulate.a = 0.475 + 0.275 * sin(_tempo * TAU * ritmo)
		if _tempo > _espera or is_equal_approx(_tempo, _espera):
			_explodir()
	elif _tempo > _espera + DURACAO_EXPLOSAO:
		queue_free()


func _explodir() -> void:
	_explodiu = true
	corpo.visible = false
	area_aviso.visible = false
	fogo.visible = true
	# Ligar a forma (e não monitorable) faz detectar quem já está na área.
	forma.set_deferred("disabled", false)
	explodiu.emit()
