class_name OndaFogoMula
extends Hitbox
## Onda de fogo do pisoteio da Mula: corre pelo chão em linha reta até a parede.
## A origem fica no chão. Layer enemy_hitbox; mask player (não enxerga o chão, onde ela corre);
## some quando sai da tela.
## Pula-se por cima dela.

var velocidade: Vector2 = Vector2.ZERO

@onready var fogo: Sprite2D = $Fogo


## direcao: -1 = esquerda, 1 = direita.
func lancar(direcao: float, nova_velocidade: float) -> void:
	velocidade = Vector2(direcao * nova_velocidade, 0.0)


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	# As labaredas deitam para trás: o desenho corre para a esquerda.
	if velocidade.x > 0.0:
		fogo.scale.x = -absf(fogo.scale.x)
	body_entered.connect(func(_corpo: Node2D) -> void: queue_free())
	var aviso_tela := get_node_or_null("VisibleOnScreenNotifier2D") as VisibleOnScreenNotifier2D
	if aviso_tela:
		aviso_tela.screen_exited.connect(queue_free)


func _physics_process(delta: float) -> void:
	position += velocidade * delta
