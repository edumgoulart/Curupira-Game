class_name AnimacaoQuadros
extends Sprite2D
## Animação simples de efeito (fogo, brilho): troca a textura entre os quadros da lista
## em loop. Para efeitos de ataque, que não são personagens — os personagens continuam
## com SpriteFrames no AnimatedSprite2D, feitos pelo Arthur.
## Começa num quadro sorteado, para várias bolas de fogo juntas não piscarem iguais.

## Os quadros, na ordem. Ex.: bola_fogo_1..4.png.
@export var quadros: Array[Texture2D] = []
## Quadros por segundo.
@export_range(1.0, 60.0, 1.0) var fps: float = 12.0

var _indice: int = 0
var _tempo: float = 0.0


func _ready() -> void:
	if quadros.is_empty():
		return
	_indice = randi() % quadros.size()
	texture = quadros[_indice]


func _process(delta: float) -> void:
	if quadros.size() < 2:
		return
	_tempo += delta
	var passo: float = 1.0 / fps
	while _tempo >= passo:
		_tempo -= passo
		_indice = (_indice + 1) % quadros.size()
	texture = quadros[_indice]
