class_name BolhaBoto
extends Hitbox
## Bolha lenta do Boto (GDD): solta durante o pulo, desce devagar balançando e estoura
## ao tocar o chão ou o Curupira. Layer enemy_hitbox; mask player + world.

## Balanço de um lado para o outro enquanto desce. Só visual/movimento leve.
const BALANCO_PX: float = 30.0
const BALANCO_HZ: float = 1.2

var velocidade: float = 120.0
var _x_inicial: float = 0.0
var _tempo: float = 0.0


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	_x_inicial = global_position.x
	acertou.connect(func(_alvo: Area2D) -> void: queue_free())
	body_entered.connect(func(_corpo: Node2D) -> void: queue_free())


func _physics_process(delta: float) -> void:
	_tempo += delta
	global_position = Vector2(
		_x_inicial + BALANCO_PX * sin(_tempo * TAU * BALANCO_HZ),
		global_position.y + velocidade * delta)
