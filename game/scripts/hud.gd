extends CanvasLayer
## HUD da luta (canto inferior esquerdo, GDD): vida do Curupira e carga do especial.
## A vida do chefe não aparece (GDD, estilo Cuphead).
## CanvasLayer: fica fixo na tela, por cima da arena, sem depender da câmera.

## O Curupira da arena. Apontar no inspetor da cena da arena.
@export var curupira: Node

@onready var vida: HudVida = %Vida
@onready var especial: HudEspecial = %Especial


func _ready() -> void:
	if curupira == null:
		push_warning("HUD sem Curupira no campo 'curupira'; vida e especial não vão aparecer.")
		return
	# Mostra os valores atuais já na entrada: o Curupira configura vida e carga antes do HUD existir.
	var vida_curupira: Vida = curupira.vida
	vida_curupira.vida_mudou.connect(vida.mostrar)
	vida.mostrar(vida_curupira.atual, vida_curupira.maximo)

	var carga: CargaEspecial = curupira.carga
	carga.carga_mudou.connect(especial.mostrar)
	especial.mostrar(carga.atual, carga.maximo)
