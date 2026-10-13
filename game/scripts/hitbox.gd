class_name Hitbox
extends Area2D
## Área que CAUSA dano (ataques dos chefes, perigos). Chama take_damage em quem
## encostar e não sabe quem é o alvo.
## Quem ela atinge é decidido por layer/mask na cena:
##   ataque de chefe: layer = enemy_hitbox, mask = player.
## Ela dispara ao ENTRAR na hurtbox. Se o alvo estava invencível (hurtbox desligada)
## e ainda estiver dentro quando a invencibilidade acabar, conta como entrar de novo.

signal acertou(alvo: Area2D)

## Dano causado. Contra o Curupira, em golpes (1 ou 2, tabela de ataques dos chefes no GDD).
@export var dano: int = 1


func _ready() -> void:
	area_entered.connect(_on_area_entered)


func _on_area_entered(area: Area2D) -> void:
	if area.has_method("take_damage"):
		area.take_damage(dano, self)
		acertou.emit(area)
