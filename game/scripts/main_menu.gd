extends Control
## Tela principal. O Curupira parado na floresta usa a animação "idle" do curupira_frames.tres.
## Novo jogo passa pelas cenas de abertura e depois vai ao mapa do mundo; Continuar vai direto
## ao mapa, onde se escolhe o chefe andando até ele.

const CENA_MAPA: String = "res://scenes/mapa.tscn"
const CENA_ABERTURA: String = "res://scenes/abertura.tscn"


func _ready() -> void:
	# Âncora da folha (os pés) na posição do node, como nas fases.
	FolhaSprites.preparar($Curupira)
	# Desabilita o botao continuar se nao tem save
	%Continuar.disabled = not GameState.tem_save()
	# Foco no primeiro botão para dar para navegar com o controle.
	get_node("%Novo Jogo").grab_focus()


func _on_novo_jogo_pressed() -> void:
	GameState.apagar_save()
	get_tree().change_scene_to_file(CENA_ABERTURA)


func _on_continuar_pressed() -> void:
	if GameState.carregar():
		get_tree().change_scene_to_file(CENA_MAPA)


func _on_opcoes_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/options_menu.tscn")


func _on_sair_pressed() -> void:
	get_tree().quit()
