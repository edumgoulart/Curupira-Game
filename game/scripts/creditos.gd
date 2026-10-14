extends Control
## Créditos: aparecem depois que o chefe final é derrotado (GDD). Voltam ao menu principal.

func _ready() -> void:
	%Voltar.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_on_voltar_pressed()


func _on_voltar_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
