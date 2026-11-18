extends CanvasLayer
## Tela de derrota: aparece quando o Curupira leva o último golpe (GDD: tentar de novo
## ou voltar para o mapa). Escuta o sinal "derrotado" do Curupira da arena.
## Mesmo esquema da pausa: congela a luta e fica com process_mode "sempre".
##
## É uma carta de papel, no estilo das telas de derrota de jogos de chefe: o retrato do chefe
## zombando, de frente, uma frase de deboche sorteada (ChefeData.frases_derrota) e a trilha
## de até onde o jogador chegou na vida do chefe, com os entalhes das fases.

## Fora da luta, o jogo volta para o mapa do mundo (antes era a tela de seleção de fase).
const CENA_SELECAO: String = "res://scenes/mapa.tscn"
## Espera antes de mostrar a tela, para o jogador ver o Curupira derrotado (s). Só visual.
const ATRASO: float = 1.0
## A carta desce de cima até o lugar (s). Só visual.
const DURACAO_ENTRADA: float = 0.35

## O Curupira da arena. Apontar no inspetor da cena da arena.
@export var curupira: Node
## O chefe da arena (retrato, frases e quanto da vida dele o jogador tirou).
@export var chefe: Node

@onready var carta: Control = %Carta
@onready var retrato: TextureRect = %Retrato
@onready var frase: Label = %Frase
@onready var trilha: Control = %Trilha
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
	_preencher()
	get_tree().paused = true
	visible = true
	# a carta cai no lugar; os botões só respondem depois
	var destino: float = carta.position.y
	carta.position.y = destino - 120.0
	var tween: Tween = create_tween()
	tween.tween_property(carta, "position:y", destino, DURACAO_ENTRADA).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_callback(func() -> void:
		tentar_de_novo.grab_focus()
		trilha.mostrar(_progresso(), _limiares()))


func _preencher() -> void:
	var dados: ChefeData = chefe.dados if chefe != null else null
	if dados == null:
		return
	retrato.texture = dados.retrato_derrota
	if not dados.frases_derrota.is_empty():
		frase.text = "\"%s\"" % dados.frases_derrota.pick_random()


## Fração da vida do chefe que o jogador tirou, contando todas as fases.
func _progresso() -> float:
	if chefe == null or not chefe.has_node("Vida"):
		return 0.0
	var vida: Node = chefe.get_node("Vida")
	return 1.0 - float(vida.atual) / float(maxi(vida.maximo, 1))


func _limiares() -> PackedFloat32Array:
	if chefe != null and chefe.has_method("limiares_fase"):
		return chefe.limiares_fase()
	return PackedFloat32Array()


func _on_tentar_de_novo_pressed() -> void:
	# Recarregar a cena recomeça a luta com vida cheia (GDD: sem cura, vida volta a cada tentativa).
	get_tree().paused = false
	get_tree().reload_current_scene()


func _on_selecao_pressed() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file(CENA_SELECAO)
