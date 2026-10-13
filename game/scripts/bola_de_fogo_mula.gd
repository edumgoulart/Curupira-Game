class_name BolaDeFogoMula
extends Hitbox
## Bola de fogo da Mula: reta na horizontal, velocidade constante.
## Layer enemy_hitbox; mask player (acerta a hurtbox do Curupira) + world (some na parede).

var velocidade: Vector2 = Vector2.ZERO


## direcao: -1 = esquerda, 1 = direita.
func lancar(direcao: float, nova_velocidade: float) -> void:
	velocidade = Vector2(direcao * nova_velocidade, 0.0)


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	acertou.connect(func(_alvo: Area2D) -> void: queue_free())
	body_entered.connect(func(_corpo: Node2D) -> void: queue_free())


func _physics_process(delta: float) -> void:
	position += velocidade * delta
