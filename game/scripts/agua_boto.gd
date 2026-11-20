class_name AguaBoto
extends Node2D
## A água em volta do Boto: anéis abrindo, espuma colada no corpo e gotinhas pulando. Só visual.
## Filha do Boto, mas fica sempre na linha d'água: ele afunda e sobe para o jato, e a água não.
## Duas camadas: a de trás (metade de lá dos anéis) fica atrás do Boto, e a da frente (espuma,
## gotas e a metade de cá) fica por cima da água da frente da arena (FundoArena, z 5).
## A água da esquerda é a do rio Negro (escura, arquivos "azul") e a da direita, a do Solimões
## (barrenta): a cor troca quando ele troca de lado.
## Os quadros vêm do gerador (efeitos do Boto: agua_atras_*, agua_frente_*, agua_respingo_*);
## a quantidade, o fps e o centro saem do efeitos.json.

const PASTA: String = "res://assets/pixel/boto/efeitos/"
const Z_ATRAS: int = -1
const Z_FRENTE: int = 6
const ESCALA: float = 4.0

static var _info: Dictionary = {}

## Altura (global) da linha d'água. Quem cria (o Boto) define.
var linha_agua: float = 0.0

var _atras: AnimacaoQuadros
var _frente: AnimacaoQuadros
var _cor: String = ""


func _ready() -> void:
	_atras = _criar_camada(Z_ATRAS)
	_frente = _criar_camada(Z_FRENTE)
	_acompanhar()


func _process(_delta: float) -> void:
	_acompanhar()


## Mostra ou esconde a água parada em volta dele (some enquanto ele está no ar, no salto).
func mostrar(ligada: bool) -> void:
	_atras.visible = ligada
	_frente.visible = ligada


## Respingo na linha d'água, no x dado: quando ele afunda, sobe, mergulha ou cai do salto.
## Fica na arena (não segue o Boto), para o do mergulho ficar onde ele saiu.
func respingar(x: float) -> void:
	var nome: String = "agua_respingo_" + _cor_do_lado(x)
	var respingo := AnimacaoQuadros.new()
	_preparar(respingo, nome)
	respingo.loop = false
	respingo.apagar_ao_terminar = true
	respingo.z_index = Z_FRENTE
	get_tree().current_scene.add_child(respingo)
	respingo.global_position = Vector2(x, linha_agua)


# Segue o Boto em x e fica na linha d'água em y; troca a cor quando ele muda de margem.
func _acompanhar() -> void:
	global_position = Vector2(get_parent().global_position.x, linha_agua)
	var cor: String = _cor_do_lado(global_position.x)
	if cor != _cor:
		_cor = cor
		_atras.trocar_quadros(quadros_do_efeito("agua_atras_" + cor))
		_frente.trocar_quadros(quadros_do_efeito("agua_frente_" + cor))


func _criar_camada(z: int) -> AnimacaoQuadros:
	var camada := AnimacaoQuadros.new()
	_preparar(camada, "agua_frente_azul")
	camada.z_index = z
	add_child(camada)
	return camada


func _preparar(sprite: AnimacaoQuadros, nome: String) -> void:
	sprite.quadros = quadros_do_efeito(nome)
	sprite.fps = float(_info_do_efeito(nome).get("fps", 12))
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	sprite.scale = Vector2(ESCALA, ESCALA)
	sprite.centered = false
	sprite.offset = -centro_do_efeito(nome)


static func _cor_do_lado(x: float) -> String:
	return "azul" if x < 0.0 else "barro"


## Quadros de um efeito do Boto (pasta efeitos), na ordem: nome_1.png, nome_2.png...
static func quadros_do_efeito(nome: String) -> Array[Texture2D]:
	var lista: Array[Texture2D] = []
	for i in int(_info_do_efeito(nome).get("quadros", 0)):
		lista.append(load("%s%s_%d.png" % [PASTA, nome, i + 1]) as Texture2D)
	return lista


## Ponto do desenho do efeito que fica na origem (pixels da arte), do efeitos.json.
static func centro_do_efeito(nome: String) -> Vector2:
	var centro: Array = _info_do_efeito(nome).get("centro", [0, 0])
	return Vector2(centro[0], centro[1])


static func _info_do_efeito(nome: String) -> Dictionary:
	if _info.is_empty():
		var json: Variant = JSON.parse_string(FileAccess.get_file_as_string(PASTA + "efeitos.json"))
		_info = json if json is Dictionary else {}
	return _info.get(nome, {})

