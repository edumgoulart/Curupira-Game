class_name Projetil
extends Area2D
## Projétil básico em linha reta (hitbox). Quem dispara chama configurar() antes de pôr na cena.
##
## Colisão resolvida por layer/mask na cena (sem if no código):
##   layer = player_hitbox; mask = world (some ao bater na parede) + enemy (acerta hurtbox de chefe).
## Ao encostar numa área com take_damage (uma Hurtbox), causa dano e some.

var dano: int = 1
var velocidade: float = 1000.0
## 1 = direita, -1 = esquerda.
var direcao: float = 1.0


func configurar(ataque: AtaqueData, nova_direcao: float) -> void:
	dano = ataque.dano
	velocidade = ataque.velocidade_projetil
	direcao = nova_direcao


func _ready() -> void:
	# Espelha só o visual; a forma de colisão é simétrica.
	for filho in get_children():
		if filho is Sprite2D or filho is Polygon2D:
			filho.scale.x = absf(filho.scale.x) * direcao


func _physics_process(delta: float) -> void:
	position.x += direcao * velocidade * delta


func _on_area_entered(area: Area2D) -> void:
	if area.has_method("take_damage"):
		area.take_damage(dano, self)
	queue_free()


func _on_body_entered(_body: Node2D) -> void:
	queue_free()


func _on_screen_exited() -> void:
	queue_free()
