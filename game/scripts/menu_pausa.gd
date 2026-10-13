extends CanvasLayer
## Menu de pausa da luta. Esc / Start abre e fecha.
## Pausar = get_tree().paused: tudo com process_mode "herdar" para (Curupira, chefe,
## projéteis, timers). Este nó usa process_mode "sempre" para continuar ouvindo o
## controle e os botões enquanto o resto está parado.

const CENA_SELECAO: String = "res://scenes/level_select.tscn"

@onready var continuar: Button = %Continuar


func _ready() -> void:
	visible = false


func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("pause"):
		return
	if visible:
		fechar()
	elif not get_tree().paused:
		# Se o jogo já está pausado por outra tela (ex.: derrota), não abre por cima.
		abrir()
	get_viewport().set_input_as_handled()


func abrir() -> void:
	get_tree().paused = true
	visible = true
	continuar.grab_focus()


func fechar() -> void:
	visible = false
	get_tree().paused = false


func _on_continuar_pressed() -> void:
	fechar()


func _on_tentar_de_novo_pressed() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()


func _on_selecao_pressed() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file(CENA_SELECAO)
