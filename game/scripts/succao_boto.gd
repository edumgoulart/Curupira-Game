class_name SuccaoBoto
extends Node2D
## Aviso do jato do Boto: ele SUGA água antes de atirar. Gotas vêm de todos os lados para
## a boca (partículas) e uma bola de água cresce na boca até o jato sair.
## Só visual. Quem cria e apaga é o Boto; ele chama mostrar_progresso() a cada frame do aviso
## (assim, se o Boto estiver lento pela Bolha Abissal, o aviso visual acompanha o relógio dele).

@onready var gotas: CPUParticles2D = $Gotas
@onready var bola: Polygon2D = $Bola


func _ready() -> void:
	add_to_group("ataques_chefe")
	mostrar_progresso(0.0)


## progresso: 0 = começou a sugar, 1 = cheio (o jato sai).
func mostrar_progresso(progresso: float) -> void:
	var p: float = clampf(progresso, 0.0, 1.0)
	bola.scale = Vector2.ONE * lerpf(0.15, 1.0, p)
	# Treme mais perto do fim, para avisar que vai sair.
	bola.position = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * 4.0 * p * p
	# Para de puxar gotas no finzinho (a bola já está cheia).
	gotas.emitting = p < 0.85
