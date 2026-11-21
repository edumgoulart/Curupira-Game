class_name BolhaBoto
extends Hitbox
## Bolha do Boto (GDD): solta durante o salto por cima, desce balançando e estoura
## ao tocar o chão ou o Curupira. Layer enemy_hitbox; mask player + world.

## Quem solta (o Boto) preenche com os valores do boto.tres antes de pôr na cena.
var velocidade: float = 200.0
## Balanço de um lado para o outro enquanto desce: largura (px) e idas e voltas por segundo.
var balanco: float = 48.0
var frequencia: float = 1.6
var _x_inicial: float = 0.0
var _tempo: float = 0.0


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	_x_inicial = global_position.x
	acertou.connect(func(_alvo: Area2D) -> void: queue_free())
	# Só some em chão e parede (o corpo do Curupira também está na mask; ver Hitbox.e_mundo).
	body_entered.connect(func(corpo: Node2D) -> void:
		if Hitbox.e_mundo(corpo):
			queue_free())


func _physics_process(delta: float) -> void:
	_tempo += delta
	global_position = Vector2(
		_x_inicial + balanco * sin(_tempo * TAU * frequencia),
		global_position.y + velocidade * delta)
