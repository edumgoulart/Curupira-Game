extends Control
## Cenas de abertura: quatro imagens paradas com uma ou duas frases embaixo (GDD, Telas).
## O Novo Jogo abre esta tela antes do mapa; o Continuar vai direto ao mapa.
##   - A / Enter / Espaço (ui_accept) ou clique: avança para a próxima cena;
##   - Start / Esc (pause): pula todas e vai para o mapa.
## As imagens e os textos vêm de dados/abertura.tres (AberturaData).
## Não usa animações: as imagens são paradas, e a troca é um escurecer e clarear.

const CENA_MAPA: String = "res://scenes/mapa.tscn"

@export var dados: AberturaData

## Cena que está na tela (0 a 3).
var indice: int = 0
var _trocando: bool = false
var _saindo: bool = false

@onready var imagem: TextureRect = %Imagem
@onready var texto: Label = %Texto
@onready var escuro: ColorRect = %Escuro


func _ready() -> void:
	if dados == null or dados.imagens.is_empty():
		push_warning("Abertura sem imagens no campo 'dados': indo direto para o mapa.")
		_ir_para_o_mapa.call_deferred()
		return
	_mostrar(0)
	# Começa no escuro e clareia, igual às trocas.
	escuro.modulate.a = 1.0
	_trocando = true
	var tween: Tween = create_tween()
	tween.tween_property(escuro, "modulate:a", 0.0, dados.duracao_troca)
	tween.tween_callback(func() -> void: _trocando = false)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_echo():
		return
	if event.is_action_pressed("pause"):
		get_viewport().set_input_as_handled()
		_ir_para_o_mapa()
	elif event.is_action_pressed("ui_accept") or _eh_clique(event):
		get_viewport().set_input_as_handled()
		_avancar()


func _eh_clique(event: InputEvent) -> bool:
	var botao := event as InputEventMouseButton
	return botao != null and botao.pressed and botao.button_index == MOUSE_BUTTON_LEFT


func _avancar() -> void:
	# Durante a troca o aperto é ignorado, para um toque duplo não pular uma cena sem ler.
	if _trocando or _saindo:
		return
	_trocando = true
	var metade: float = dados.duracao_troca / 2.0
	var tween: Tween = create_tween()
	tween.tween_property(escuro, "modulate:a", 1.0, metade)
	if indice >= dados.imagens.size() - 1:
		tween.tween_callback(_ir_para_o_mapa)
		return
	tween.tween_callback(func() -> void: _mostrar(indice + 1))
	tween.tween_property(escuro, "modulate:a", 0.0, metade)
	tween.tween_callback(func() -> void: _trocando = false)


func _mostrar(i: int) -> void:
	indice = i
	imagem.texture = dados.imagens[i]
	texto.text = dados.textos[i] if i < dados.textos.size() else ""


func _ir_para_o_mapa() -> void:
	if _saindo:
		return
	_saindo = true
	get_tree().change_scene_to_file(CENA_MAPA)
