class_name Hurtbox
extends Area2D
## Área que RECEBE dano. Fica como filha de quem leva golpe (chefe, Curupira, alvo de teste).
## Quem causa dano (hitbox) só chama take_damage aqui, sem saber quem é o dono.
## O dono escuta o sinal golpe_recebido e decide o que fazer (perder vida, piscar, ignorar se invencível).
## Layer/mask são configurados na cena: hurtbox de inimigo no layer "enemy", do Curupira no "player".

signal golpe_recebido(amount: int, from: Node)

## false = nenhuma hitbox enxerga esta hurtbox (ex.: Curupira invencível).
## Desliga as formas de colisão, e não o monitorable: testado no Godot 4.7, religar o
## monitorable NÃO faz a hitbox detectar de novo quem já estava encostado; religar a forma faz.
var ligada: bool = true:
	set(valor):
		if valor == ligada:
			return
		ligada = valor
		for filho in get_children():
			if filho is CollisionShape2D or filho is CollisionPolygon2D:
				filho.set_deferred("disabled", not valor)


func take_damage(amount: int, from: Node) -> void:
	golpe_recebido.emit(amount, from)
