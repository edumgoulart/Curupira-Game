extends CanvasLayer
## HUD da luta (canto inferior esquerdo, GDD): vida do Curupira e carga do especial.
## No canto inferior direito, SÓ EM DESENVOLVIMENTO, a vida do chefe em número
## (o GDD diz que a vida do chefe não aparece; no jogo exportado ela some sozinha).
## CanvasLayer: fica fixo na tela, por cima da arena, sem depender da câmera.

## O Curupira da arena. Apontar no inspetor da cena da arena.
@export var curupira: Node
## O chefe da arena (só para o número de vida de desenvolvimento). Pode ficar vazio.
@export var chefe: Node

@onready var vida: HudVida = %Vida
@onready var especial: HudEspecial = %Especial
@onready var vida_chefe: Label = %VidaChefe


func _ready() -> void:
	_ligar_chefe()
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


func _ligar_chefe() -> void:
	# OS.is_debug_build(): verdadeiro rodando pelo editor, falso no jogo exportado.
	vida_chefe.visible = OS.is_debug_build() and chefe != null
	if not vida_chefe.visible:
		return
	var vida_do_chefe: Vida = chefe.vida
	var mostrar := func(atual: int, maximo: int) -> void:
		vida_chefe.text = "%s: %d / %d  [dev]" % [chefe.name, atual, maximo]
	vida_do_chefe.vida_mudou.connect(mostrar)
	mostrar.call(vida_do_chefe.atual, vida_do_chefe.maximo)
