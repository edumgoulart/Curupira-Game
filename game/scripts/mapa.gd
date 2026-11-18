extends Node2D
## Mapa do mundo, no estilo do tabuleiro do Cuphead: depois do menu principal, o Curupira anda
## pelo mapa (visto de cima, em diagonal) e escolhe o chefe indo até a área dele:
##   - Mula sem Cabeça: entra entre as árvores pegando fogo (embaixo, à esquerda);
##   - Cuca: entra na mata fechada, com névoa e a luz verde das poções (em cima, à esquerda);
##   - Boto: o encontro das águas (embaixo, à direita); vai pela praia até a ponta de areia;
##   - Máquina de IA: o prédio da empresa (em cima, à direita), atrás de um portão que só
##     abre depois que os três foram libertados (GDD: chefe final liberado após os três).
## Na entrada aparece o nome da área; A / Espaço abre o painel com ataques e dificuldade, e de
## lá se vai para a luta. Depois da luta, o Curupira volta para a frente da área de onde saiu.
## Depois de libertada, cada criatura fica na sua área, e perto dela A / Espaço abre a conversa
## (falas em dados/mapa/conversa_<id>.tres).
##
## Quem faz o quê: o cenário (Mundo) monta o desenho e diz onde dá para pisar; o Curupira só
## anda; este script liga os dois à câmera, ao aviso e ao painel.

const CENAS: Dictionary = {
	"mula": "res://scenes/level1.tscn",
	"cuca": "res://scenes/level2.tscn",
	"boto": "res://scenes/level3.tscn",
	"maquina": "res://scenes/level4.tscn",
}
const CHEFES: Dictionary = {
	"mula": preload("res://dados/chefes/mula.tres"),
	"cuca": preload("res://dados/chefes/cuca.tres"),
	"boto": preload("res://dados/chefes/boto.tres"),
	"maquina": preload("res://dados/chefes/maquina.tres"),
}
const CONVERSAS: Dictionary = {
	"mula": preload("res://dados/mapa/conversa_mula.tres"),
	"cuca": preload("res://dados/mapa/conversa_cuca.tres"),
	"boto": preload("res://dados/mapa/conversa_boto.tres"),
}

var _area_perto: String = ""
var _conversa_perto: String = ""

@onready var cenario: CenarioMapa = $Mundo
@onready var curupira: CurupiraMapa = $Mundo/Curupira
@onready var camera: Camera2D = $Camera
@onready var caixa_aviso: Control = %CaixaAviso
@onready var aviso: Label = %Aviso
@onready var painel: PainelFase = $PainelFase
@onready var pausa: PausaMapa = $PausaMapa
@onready var dialogo: DialogoMapa = $DialogoMapa


func _ready() -> void:
	curupira.cenario = cenario
	curupira.position = cenario.ponto_de_partida(GameState.entrada_mapa)
	# A câmera segue o Curupira sem mostrar nada fora do mapa.
	var t: Vector2 = cenario.tamanho()
	camera.limit_left = 0
	camera.limit_top = 0
	camera.limit_right = int(t.x)
	camera.limit_bottom = int(t.y)
	camera.position_smoothing_enabled = curupira.ajustes.suavidade_camera > 0.0
	camera.position_smoothing_speed = curupira.ajustes.suavidade_camera
	camera.position = curupira.position
	camera.reset_smoothing.call_deferred()
	painel.lutar.connect(_lutar)
	dialogo.terminou.connect(_ao_terminar_conversa)
	_atualizar_aviso()


func _process(_delta: float) -> void:
	camera.position = curupira.position
	cenario.ponto_curupira = curupira.position
	_atualizar_aviso()


func _unhandled_input(event: InputEvent) -> void:
	if dialogo.aberto:
		return
	if event.is_action_pressed("pause") or event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		caixa_aviso.visible = false
		pausa.abrir()
	elif _area_perto != "" and (event.is_action_pressed("ui_accept") or event.is_action_pressed("jump")):
		get_viewport().set_input_as_handled()
		caixa_aviso.visible = false
		painel.abrir(_area_perto, CHEFES[_area_perto])
	elif _conversa_perto != "" and (event.is_action_pressed("ui_accept") or event.is_action_pressed("jump")):
		get_viewport().set_input_as_handled()
		caixa_aviso.visible = false
		curupira.travar(true)
		dialogo.abrir(CONVERSAS[_conversa_perto])


func _ao_terminar_conversa() -> void:
	curupira.travar(false)


func _atualizar_aviso() -> void:
	_area_perto = cenario.entrada_em(curupira.position)
	_conversa_perto = cenario.conversa_em(curupira.position) if _area_perto == "" else ""
	if dialogo.aberto:
		aviso.text = ""
	elif _area_perto != "":
		aviso.text = "%s\nA / Espaço: entrar" % CHEFES[_area_perto].nome
	elif _conversa_perto != "":
		aviso.text = "%s\nA / Espaço: conversar" % CONVERSAS[_conversa_perto].nome
	elif cenario.perto_do_portao_trancado(curupira.position):
		aviso.text = "Portão trancado\nLiberte a Mula, a Cuca e o Boto"
	else:
		aviso.text = ""
	caixa_aviso.visible = aviso.text != ""


func _lutar(id_area: String) -> void:
	# Lembra de onde saiu, para voltar para a frente desta área depois da luta.
	GameState.entrada_mapa = id_area
	get_tree().change_scene_to_file(CENAS[id_area])
