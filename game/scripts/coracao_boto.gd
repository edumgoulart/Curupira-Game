class_name CoracaoBoto
extends Hitbox
## Beijo de bolha do Boto: coração lento que vem ondulando na direção do Curupira.
## Machuca ao encostar (layer enemy_hitbox, mask player) e estoura com um tiro: a Hurtbox
## filha fica no layer enemy, então os tiros do Curupira enxergam ela.

## Estouro do coração. Só visual.
const CENA_ESTOURO: PackedScene = preload("res://scenes/coracao_estoura_boto.tscn")

var velocidade: float = 280.0
var direcao: float = -1.0
## Altura da onda (px) e quantas ondas por segundo.
var amplitude: float = 40.0
var frequencia: float = 1.2
## Depois desse tempo (s) ele estoura sozinho.
var duracao: float = 6.0

var _y_inicial: float = 0.0
var _tempo: float = 0.0

@onready var hurtbox: Hurtbox = $Hurtbox


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	_y_inicial = global_position.y
	hurtbox.golpe_recebido.connect(func(_quanto: int, _de: Node) -> void: estourar())
	acertou.connect(func(_alvo: Area2D) -> void: estourar())
	var aviso_tela := get_node_or_null("VisibleOnScreenNotifier2D") as VisibleOnScreenNotifier2D
	if aviso_tela:
		aviso_tela.screen_exited.connect(queue_free)


func _physics_process(delta: float) -> void:
	_tempo += delta
	global_position = Vector2(global_position.x + direcao * velocidade * delta,
		_y_inicial + amplitude * sin(_tempo * TAU * frequencia))
	if _tempo >= duracao:
		estourar()


func estourar() -> void:
	if is_queued_for_deletion():
		return
	var efeito: Node2D = CENA_ESTOURO.instantiate()
	efeito.global_position = global_position
	get_parent().add_child.call_deferred(efeito)
	queue_free()
