class_name Hurtbox
extends Area2D
## Área que RECEBE dano. Fica como filha de quem leva golpe (chefe, Curupira, alvo de teste).
## Quem causa dano (hitbox) só chama take_damage aqui, sem saber quem é o dono.
## O dono escuta o sinal golpe_recebido e decide o que fazer (perder vida, piscar, ignorar se invencível).
## Layer/mask são configurados na cena: hurtbox de inimigo no layer "enemy", do Curupira no "player".

signal golpe_recebido(amount: int, from: Node)


func take_damage(amount: int, from: Node) -> void:
	golpe_recebido.emit(amount, from)
