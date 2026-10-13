class_name Projetil
extends Area2D
## Projétil do Curupira em linha reta (hitbox): usado pelo básico e pelo especial.
## Quem dispara chama configurar() antes de pôr na cena.
##
## Colisão resolvida por layer/mask na cena (sem if no código):
##   layer = player_hitbox; mask = world (some ao bater na parede) + enemy (acerta hurtbox de chefe).
## Ao encostar numa área com take_damage (uma Hurtbox), causa dano, avisa "acertou" e some.

## Emitido quando acerta uma hurtbox. O Atirador usa para carregar o especial.
signal acertou(alvo: Area2D)

## Efeito criado no ponto de impacto (ex.: pequena explosão da Bola de Fogo). Opcional, só visual.
@export var cena_impacto: PackedScene

var dano: int = 1
var velocidade: float = 1000.0
## 1 = direita, -1 = esquerda.
var direcao: float = 1.0


func configurar(novo_dano: int, nova_velocidade: float, nova_direcao: float) -> void:
	dano = novo_dano
	velocidade = nova_velocidade
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
		acertou.emit(area)
	_impactar()


func _on_body_entered(_body: Node2D) -> void:
	_impactar()


func _on_screen_exited() -> void:
	queue_free()


func _impactar() -> void:
	if cena_impacto:
		var efeito: Node2D = cena_impacto.instantiate()
		efeito.global_position = global_position
		get_tree().current_scene.add_child(efeito)
	queue_free()
