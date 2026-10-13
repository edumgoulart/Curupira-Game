extends Control


# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	# Foco no botão para dar para navegar com o controle.
	%Voltar.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	# B no controle / Esc no teclado volta para o menu principal.
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_on_voltar_pressed()


func _on_voltar_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
