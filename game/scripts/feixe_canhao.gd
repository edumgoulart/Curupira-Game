class_name FeixeCanhao
extends Area2D
## Canhão Flamejante: feixe de fogo contínuo em linha reta à frente do Curupira (GDD).
## Fica preso ao Atirador (anda/cai junto com o Curupira) durante duracao_disparo.
## O dano vem em pulsos: a cada intervalo, cada hurtbox dentro do feixe leva dano / pulsos.
## Ficando dentro o tempo todo, o chefe leva o dano total (GDD: até 200).
##
## Layer player_hitbox; mask enemy (só hurtbox de chefe). Não para na parede: atravessa a tela.

## Comprimento do feixe (px): passa da largura da arena (1920), então acerta de qualquer distância.
const COMPRIMENTO: float = 1900.0

var _dano_por_pulso: int = 20
var _pulsos: int = 10
var _intervalo: float = 0.15
var _pulsos_dados: int = 0
var _tempo: float = 0.0
var _direcao: float = 1.0

@onready var forma: CollisionShape2D = $CollisionShape2D
@onready var visual: Node2D = $VisualProvisorio


func configurar(dados: EspecialData, direcao: float) -> void:
	_pulsos = maxi(dados.pulsos, 1)
	_dano_por_pulso = dados.dano / _pulsos
	_intervalo = dados.duracao_disparo / _pulsos
	# O feixe começa no Atirador e vai para o lado em que o Curupira olha.
	_direcao = direcao


func _ready() -> void:
	forma.position.x = COMPRIMENTO / 2.0 * _direcao
	visual.scale.x = _direcao


func _physics_process(delta: float) -> void:
	_tempo += delta
	# Tremulação só visual.
	visual.scale.y = 1.0 + 0.12 * sin(_tempo * 40.0)
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
