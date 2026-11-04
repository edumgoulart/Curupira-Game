class_name ChapeuBoto
extends Hitbox
## Chapéu bumerangue do Boto: vai baixo até perto da parede do outro lado e volta alto até
## a cabeça dele, girando. Layer enemy_hitbox; mask player.
## Desvia-se pulando na ida e abaixando (ou ficando embaixo) na volta.
## Quem lança chama lancar(); o Boto espera o sinal "voltou" para pegar o chapéu.

signal voltou

var _saida: Vector2 = Vector2.ZERO
var _virada: Vector2 = Vector2.ZERO
var _chegada: Node2D
var _altura_volta: float = 0.0
var _duracao_ida: float = 0.9
var _duracao_volta: float = 0.9
var _tempo: float = 0.0


## saida: de onde sai (a nadadeira). virada: onde ele vira (baixo, perto da parede).
## chegada: o node que ele procura na volta (o Boto). altura_volta: quanto acima do chão volta.
func lancar(saida: Vector2, virada: Vector2, chegada: Node2D, altura_volta: float, duracao_ida: float, duracao_volta: float) -> void:
	_saida = saida
	_virada = virada
	_chegada = chegada
	_altura_volta = altura_volta
	_duracao_ida = duracao_ida
	_duracao_volta = duracao_volta
	global_position = saida


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")


func _physics_process(delta: float) -> void:
	_tempo += delta
	if _tempo < _duracao_ida:
		# Ida: desce logo para a altura baixa e corre até a virada.
		var u: float = _tempo / _duracao_ida
		var x: float = lerpf(_saida.x, _virada.x, 1.0 - pow(1.0 - u, 2.0))
		var y: float = lerpf(_saida.y, _virada.y, clampf(u * 3.0, 0.0, 1.0))
		global_position = Vector2(x, y)
		return
	# Volta: sobe até a altura alta e vem até a cabeça do Boto.
	var v: float = clampf((_tempo - _duracao_ida) / _duracao_volta, 0.0, 1.0)
	var destino: Vector2 = _chegada.global_position if is_instance_valid(_chegada) else _saida
	var alto: float = _virada.y - _altura_volta
	var y_volta: float = lerpf(_virada.y, alto, clampf(v * 3.0, 0.0, 1.0))
	if v > 0.7:
		y_volta = lerpf(alto, destino.y, (v - 0.7) / 0.3)
	global_position = Vector2(lerpf(_virada.x, destino.x, v * v), y_volta)
	if v >= 1.0:
		voltou.emit()
		queue_free()
