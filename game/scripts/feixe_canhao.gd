class_name FeixeCanhao
extends Area2D
## Canhão Flamejante: feixe de fogo contínuo em linha reta à frente do Curupira (GDD).
## Fica preso ao Atirador (anda/cai junto com o Curupira) durante duracao_disparo.
## O dano vem em pulsos: a cada intervalo, cada hurtbox dentro do feixe leva dano / pulsos.
## Ficando dentro o tempo todo, o chefe leva o dano total (GDD: até 200).
##
## Layer player_hitbox; mask enemy (só hurtbox de chefe). Não para na parede: atravessa a tela.
## O desenho é o pedaço "feixe_meio" repetido na horizontal (região com repetição, como o
## jato do Boto) e a boca do canhão na mão.

## Comprimento do feixe (px): passa da largura da arena (1920), então acerta de qualquer distância.
const COMPRIMENTO: float = 1900.0
## Quadros do fogo correndo (o pedaço do meio), trocados em loop.
const QUADROS_FOGO: Array[Texture2D] = [
	preload("res://assets/pixel/curupira/efeitos/feixe_meio_1.png"),
	preload("res://assets/pixel/curupira/efeitos/feixe_meio_2.png"),
	preload("res://assets/pixel/curupira/efeitos/feixe_meio_3.png"),
	preload("res://assets/pixel/curupira/efeitos/feixe_meio_4.png"),
]
const FPS_FOGO: float = 16.0

var _dano_por_pulso: int = 20
var _pulsos: int = 10
var _intervalo: float = 0.15
var _pulsos_dados: int = 0
var _tempo: float = 0.0
var _direcao: float = 1.0

@onready var forma: CollisionShape2D = $CollisionShape2D
@onready var fogo: Sprite2D = $Fogo
@onready var boca: Sprite2D = $Boca


func configurar(dados: EspecialData, direcao: float) -> void:
	_pulsos = maxi(dados.pulsos, 1)
	_dano_por_pulso = dados.dano / _pulsos
	_intervalo = dados.duracao_disparo / _pulsos
	# O feixe começa no Atirador e vai para o lado em que o Curupira olha.
	_direcao = direcao


func _ready() -> void:
	forma.position.x = COMPRIMENTO / 2.0 * _direcao
	# A região repete o pedaço de 16 px; com escala 4, cobre o comprimento todo.
	fogo.region_rect = Rect2(0.0, 0.0, COMPRIMENTO / fogo.scale.y, fogo.region_rect.size.y)
	fogo.scale.x = absf(fogo.scale.x) * _direcao
	boca.scale.x = absf(boca.scale.x) * _direcao


func _physics_process(delta: float) -> void:
	_tempo += delta
	fogo.texture = QUADROS_FOGO[int(_tempo * FPS_FOGO) % QUADROS_FOGO.size()]
	# Pulso k acontece em k × intervalo (k = 1..pulsos). O primeiro espera um intervalo:
	# dá tempo de a física calcular quem está dentro do feixe.
	while _pulsos_dados < _pulsos and _passou((_pulsos_dados + 1) * _intervalo):
		_pulsos_dados += 1
		for area in get_overlapping_areas():
			if area.has_method("take_damage"):
				area.take_damage(_dano_por_pulso, self)
	if _pulsos_dados >= _pulsos:
		queue_free()


## Compara tempo com tolerância (somas de 1/60 não batem exato em float).
func _passou(instante: float) -> bool:
	return _tempo > instante or is_equal_approx(_tempo, instante)
