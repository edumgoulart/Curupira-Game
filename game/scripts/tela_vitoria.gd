extends CanvasLayer
## Tela de vitória: aparece quando o chefe da arena é derrotado.
## Salva o progresso na hora (GDD: salvo a cada chefe derrotado) e depois mostra
## quem foi libertado e os ataques ganhos. Depois dela o jogador volta para a seleção (GDD).
## Mesmo esquema da derrota: congela a luta e fica com process_mode "sempre".

const CENA_SELECAO: String = "res://scenes/level_select.tscn"
## Espera antes de mostrar a tela, para o chefe sumir (ele some em 1 s). Só visual.
const ATRASO: float = 1.5

## O chefe da arena. Precisa ter o sinal chefe_derrotado e "dados" com nome,
## id_progresso e recompensa (ex.: MulaData). Apontar no inspetor da arena.
@export var chefe: Node
## O Curupira da arena: se ele já tinha perdido, não conta como vitória.
@export var curupira: Node

@onready var subtitulo: Label = %Subtitulo
@onready var recompensa: Label = %Recompensa
@onready var voltar: Button = %Voltar


func _ready() -> void:
	visible = false
	if chefe == null:
		push_warning("Tela de vitória sem chefe no campo 'chefe'.")
		return
	chefe.chefe_derrotado.connect(_ao_vencer)


func _ao_vencer() -> void:
	# Uma folha ainda no ar pode matar o chefe depois que o Curupira já perdeu: aí não é vitória.
	if curupira and curupira.estado == curupira.Estado.DERROTADO:
		return
	var dados: Resource = chefe.dados
	GameState.marcar_concluida(dados.id_progresso)
	subtitulo.text = "Você libertou a %s do chip da máquina!" % dados.nome
	recompensa.text = "Novos ataques: %s" % dados.recompensa

	# process_always = false: se o jogador pausar nesse tempo, a espera também pausa.
	await get_tree().create_timer(ATRASO, false).timeout
	get_tree().paused = true
	visible = true
	voltar.grab_focus()


func _on_voltar_pressed() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file(CENA_SELECAO)
