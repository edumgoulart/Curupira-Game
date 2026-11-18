class_name DialogoMapa
extends CanvasLayer
## Caixa de conversa do mapa do mundo, embaixo da tela. Mostra uma fala por vez, com o texto
## aparecendo letra a letra. A / Espaço: se o texto ainda está aparecendo, mostra inteiro; senão,
## passa para a próxima fala. B / Esc fecha. No fim, avisa com o sinal "terminou".
## Não pausa o jogo (a criatura continua mexendo); o mapa trava o Curupira enquanto ela está aberta.

signal terminou

## Letras por segundo. Só visual.
const LETRAS_POR_SEGUNDO: float = 45.0
const COR_CURUPIRA: Color = Color(0.55, 0.85, 0.42)
const COR_CRIATURA: Color = Color(1.0, 0.7, 0.32)

var aberto: bool = false
var _falas: Array[String] = []
var _indice: int = 0
var _tween: Tween

@onready var quem: Label = %Quem
@onready var texto: Label = %Texto


func _ready() -> void:
	visible = false


func abrir(conversa: ConversaData) -> void:
	if conversa == null or conversa.falas.is_empty():
		return
	_falas = conversa.falas
	_indice = 0
	aberto = true
	visible = true
	_mostrar()


func _unhandled_input(event: InputEvent) -> void:
	if not aberto:
		return
	if event.is_action_pressed("ui_accept") or event.is_action_pressed("jump"):
		get_viewport().set_input_as_handled()
		if texto.visible_ratio < 1.0:
			_tween.kill()
			texto.visible_ratio = 1.0
		else:
			_indice += 1
			if _indice >= _falas.size():
				fechar()
			else:
				_mostrar()
	elif event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		fechar()


func fechar() -> void:
	aberto = false
	visible = false
	terminou.emit()


## "Quem: texto" -> nome em cima, colorido (Curupira verde, criatura laranja), e o texto embaixo.
func _mostrar() -> void:
	var fala: String = _falas[_indice]
	var dois_pontos: int = fala.find(":")
	var nome: String = fala.substr(0, dois_pontos).strip_edges() if dois_pontos > 0 else ""
	quem.text = nome
	quem.add_theme_color_override("font_color", COR_CURUPIRA if nome == "Curupira" else COR_CRIATURA)
	texto.text = fala.substr(dois_pontos + 1).strip_edges() if dois_pontos > 0 else fala
	texto.visible_ratio = 0.0
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(texto, "visible_ratio", 1.0, texto.text.length() / LETRAS_POR_SEGUNDO)
