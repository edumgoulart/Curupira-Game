extends CanvasLayer
## HUD da luta (canto inferior esquerdo, GDD): por enquanto só a vida do Curupira.
## A carga do especial entra aqui depois.
## CanvasLayer: fica fixo na tela, por cima da arena, sem depender da câmera.

## O Curupira da arena. Apontar no inspetor da cena da arena.
@export var curupira: Node

@onready var vida: HudVida = %Vida


func _ready() -> void:
	if curupira == null:
		push_warning("HUD sem Curupira no campo 'curupira'; a vida não vai aparecer.")
		return
	var vida_curupira: Vida = curupira.vida
	vida_curupira.vida_mudou.connect(vida.mostrar)
	# Mostra o valor atual já na entrada (o Curupira pode ter configurado a vida antes do HUD existir).
	vida.mostrar(vida_curupira.atual, vida_curupira.maximo)
