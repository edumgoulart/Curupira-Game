class_name FundoArena
extends Node2D
## Fundo (e frente, se houver) animado de uma arena em pixel art.
## Lê os quadros da pasta do gerador (fundo_1.png..., frente_1.png...) e monta dois
## AnimacaoQuadros centrados na câmera, em 480×270 ampliados 4×:
##   Fundo atrás de tudo; Frente por cima dos personagens (ex.: a água na frente do Boto).
## Para trocar a arte da arena, basta exportar de novo a pasta: este script não muda.

## Pasta da arena (ex.: res://assets/pixel/arenas/mula).
@export_dir var pasta: String = ""
## Quadros por segundo do fogo, da água e das luzes do fundo.
@export var fps: float = 4.0
## z_index da frente (os personagens ficam no 0).
@export var z_frente: int = 5


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_montar("fundo", -10)
	_montar("frente", z_frente)


func _montar(prefixo: String, z: int) -> void:
	var quadros: Array[Texture2D] = []
	var i: int = 1
	while ResourceLoader.exists("%s/%s_%d.png" % [pasta, prefixo, i]):
		quadros.append(load("%s/%s_%d.png" % [pasta, prefixo, i]))
		i += 1
	if quadros.is_empty():
		return
	var camada := AnimacaoQuadros.new()
	camada.name = prefixo.capitalize()
	camada.quadros = quadros
	camada.fps = fps
	camada.texture = quadros[0]
	camada.scale = Vector2.ONE * FolhaSprites.ESCALA
	camada.z_index = z
	add_child(camada)
