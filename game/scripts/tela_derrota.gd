extends CanvasLayer
## Tela de derrota: aparece quando o Curupira leva o último golpe (GDD: tentar de novo
## ou voltar para a seleção). Escuta o sinal "derrotado" do Curupira da arena.
## Mesmo esquema da pausa: congela a luta e fica com process_mode "sempre".

const CENA_SELECAO: String = "res://scenes/level_select.tscn"
## Espera antes de mostrar a tela, para o jogador ver o Curupira derrotado (s). Só visual.
const ATRASO: float = 1.0

## O Curupira da arena. Apontar no inspetor da cena da arena.
@export var curupira: Node

@onready var tentar_de_novo: Button = %TentarDeNovo


func _ready() -> void:
	visible = false
	if curupira == null:
		push_warning("Tela de derrota sem Curupira no campo 'curupira'.")
		return
	curupira.derrotado.connect(_ao_derrotar)


func _ao_derrotar() -> void:
	# process_always = false: se o jogador pausar nesse 1 s, a espera também pausa.
	await get_tree().create_timer(ATRASO, false).timeout
	get_tree().paused = true
	visible = true
	tentar_de_novo.grab_focus()


func _on_tentar_de_novo_pressed() -> void:
	# Recarregar a cena recomeça a luta com vida cheia (GDD: sem cura, vida volta a cada tentativa).
	get_tree().paused = false
	get_tree().reload_current_scene()


func _on_selecao_pressed() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file(CENA_SELECAO)
