extends Control


# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	# Desabilita o botao continuar se nao tem save
	%Continuar.disabled = not GameState.tem_save()


func _on_novo_jogo_pressed() -> void:
	GameState.apagar_save()
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")


func _on_continuar_pressed() -> void:
	if GameState.carregar():
		get_tree().change_scene_to_file("res://scenes/level_select.tscn")


func _on_opcoes_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/options_menu.tscn")


func _on_sair_pressed() -> void:
	get_tree().quit()
