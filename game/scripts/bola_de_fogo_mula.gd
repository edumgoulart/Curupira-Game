class_name BolaDeFogoMula
extends Hitbox
## Bola de fogo da Mula: reta na horizontal, velocidade constante.
## Layer enemy_hitbox; mask player (acerta a hurtbox do Curupira) + world (some na parede).
## O desenho (Fogo) é a bola de fogo animada, com a cabeça na origem e o rastro para trás.

## Efeito que fica no lugar quando a bola some (acertou ou bateu na parede). Só visual.
const CENA_ESTOURO: PackedScene = preload("res://scenes/explosao.tscn")

var velocidade: Vector2 = Vector2.ZERO

@onready var fogo: Sprite2D = $Fogo


## direcao: -1 = esquerda, 1 = direita.
func lancar(direcao: float, nova_velocidade: float) -> void:
	velocidade = Vector2(direcao * nova_velocidade, 0.0)


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	# O PNG voa para a direita: espelha quando vai para a esquerda.
	if velocidade.x < 0.0:
		fogo.scale.x = -absf(fogo.scale.x)
	acertou.connect(func(_alvo: Area2D) -> void: _estourar())
	body_entered.connect(func(_corpo: Node2D) -> void: _estourar())


func _physics_process(delta: float) -> void:
	position += velocidade * delta


func _estourar() -> void:
	var estouro: Node2D = CENA_ESTOURO.instantiate()
	estouro.global_position = global_position
	get_parent().add_child.call_deferred(estouro)
	queue_free()
