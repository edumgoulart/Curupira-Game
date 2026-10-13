extends Control
## Seleção de fase: escolhe o chefe. Os ataques aparecem fixos por enquanto
## (só existe o básico e o especial iniciais; a troca entra quando houver mais).
##
## Ids de progresso no GameState: fase1 = Mula sem Cabeça, fase2 = Cuca,
## fase3 = Boto cor-de-rosa, boss = Máquina (liberada depois dos três).

const CENA_MULA: String = "res://scenes/level1.tscn"

@onready var mula: Button = %Mula
@onready var maquina: Button = %Maquina


func _ready() -> void:
	if GameState.concluiu("fase1"):
		mula.text += "  (derrotada)"
	# A Máquina só libera depois dos três; mesmo liberada, a fase ainda não existe.
	if GameState.boss_liberado():
		maquina.text = "Máquina de IA — em breve"
	# Foco no primeiro botão para dar para navegar com o controle.
	mula.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	# B no controle / Esc no teclado volta para o menu principal.
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_on_voltar_pressed()


func _on_mula_pressed() -> void:
	get_tree().change_scene_to_file(CENA_MULA)


func _on_voltar_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
