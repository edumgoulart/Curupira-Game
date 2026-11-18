class_name PausaMapa
extends CanvasLayer
## Pausa do mapa do mundo. Esc / Start (ou B) abre e fecha. Mesmo esquema da pausa da luta:
## get_tree().paused para o mapa, e este nó fica com process_mode "sempre".

const CENA_MENU: String = "res://scenes/main_menu.tscn"

@onready var continuar: Button = %Continuar


func _ready() -> void:
	visible = false


func _unhandled_input(event: InputEvent) -> void:
	if visible and (event.is_action_pressed("pause") or event.is_action_pressed("ui_cancel")):
		get_viewport().set_input_as_handled()
		fechar()


func abrir() -> void:
	get_tree().paused = true
	visible = true
	continuar.grab_focus()


func fechar() -> void:
	visible = false
	get_tree().paused = false


func _on_continuar_pressed() -> void:
	fechar()


func _on_menu_pressed() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file(CENA_MENU)
