class_name AnimacaoQuadros
extends Sprite2D
## Animação simples de efeito (fogo, brilho, projétil): troca a textura entre os quadros da
## lista. Para efeitos e projéteis, que não são personagens; os personagens usam o
## SpriteFrames no AnimatedSprite2D.
## Com loop, começa num quadro sorteado, para várias bolas de fogo juntas não piscarem iguais.
## Sem loop, toca uma vez e para no último quadro (ou se apaga, se apagar_ao_terminar).

signal terminou

## Os quadros, na ordem. Ex.: bola_fogo_1..4.png.
@export var quadros: Array[Texture2D] = []
## Quadros por segundo.
@export_range(1.0, 60.0, 1.0) var fps: float = 12.0
## false = toca uma vez (explosão, poeira).
@export var loop: bool = true
## Sem loop: apaga o node (ou o pai, se apagar_pai) ao terminar. Para efeitos soltos na arena.
@export var apagar_ao_terminar: bool = false
@export var apagar_pai: bool = false

var _indice: int = 0
var _tempo: float = 0.0
var _parado: bool = false


func _ready() -> void:
	if quadros.is_empty():
		return
	_indice = randi() % quadros.size() if loop else 0
	texture = quadros[_indice]


## Troca a lista de quadros (ex.: folha do tiro numa direção) e recomeça.
func trocar_quadros(novos: Array[Texture2D]) -> void:
	quadros = novos
	_indice = 0
	_tempo = 0.0
	_parado = false
	if not quadros.is_empty():
		texture = quadros[0]


## Mostra o quadro mais perto de uma fração da animação (0 = primeiro, 1 = último).
## Para efeitos que seguem um progresso (sombra do meteoro crescendo).
func mostrar_progresso(fracao: float) -> void:
	if quadros.is_empty():
		return
	_parado = true
	texture = quadros[clampi(int(fracao * quadros.size()), 0, quadros.size() - 1)]


func _process(delta: float) -> void:
	if _parado or quadros.size() < 2:
		return
	_tempo += delta
	var passo: float = 1.0 / fps
	while _tempo >= passo:
		_tempo -= passo
		if _indice + 1 >= quadros.size() and not loop:
			_parado = true
			terminou.emit()
			if apagar_ao_terminar:
				(get_parent() if apagar_pai else self).queue_free()
			return
		_indice = (_indice + 1) % quadros.size()
	texture = quadros[_indice]
