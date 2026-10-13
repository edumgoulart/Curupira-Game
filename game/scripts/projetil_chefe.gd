class_name ProjetilChefe
extends Hitbox
## Projétil de chefe em linha reta, em qualquer direção (ex.: feitiço da Cuca).
## Layer enemy_hitbox; mask player (acerta a hurtbox do Curupira) + world (some no chão/parede).
## Sem teto na arena: se sair da tela por cima, some pelo VisibleOnScreenNotifier2D.

var velocidade: Vector2 = Vector2.ZERO


func lancar(nova_velocidade: Vector2) -> void:
	velocidade = nova_velocidade
	rotation = velocidade.angle()


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	acertou.connect(func(_alvo: Area2D) -> void: queue_free())
	body_entered.connect(func(_corpo: Node2D) -> void: queue_free())
	var aviso_tela := get_node_or_null("VisibleOnScreenNotifier2D") as VisibleOnScreenNotifier2D
	if aviso_tela:
		aviso_tela.screen_exited.connect(queue_free)


func _physics_process(delta: float) -> void:
	position += velocidade * delta
