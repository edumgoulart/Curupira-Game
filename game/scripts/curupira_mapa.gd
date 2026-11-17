class_name CurupiraMapa
extends Node2D
## O Curupira andando no mapa do mundo, visto de cima em diagonal. Anda em 8 direções com o
## analógico, o direcional ou WASD (move_left, move_right, aim_up, crouch). Não pula nem atira.
## Quem diz onde dá para pisar é o cenário (máscara do chão): se o passo inteiro bate na beira,
## tenta só o lado ou só a altura, para ele deslizar na parede em vez de grudar.
##
## Animações (curupira_mapa_frames.tres, gerado pelo gerador de pixel art; a origem é os pés):
##   parado_baixo, parado_diag_baixo, parado_lado, parado_diag_cima, parado_cima
##   andar_baixo,  andar_diag_baixo,  andar_lado,  andar_diag_cima,  andar_cima
## As de lado e diagonal olham para a direita; para a esquerda o sprite vira (escala x = -4).

enum Estado { PARADO, ANDANDO, TRAVADO }

const ESCALA: float = 4.0
## Abaixo disso no analógico conta como solto.
const ZONA_MORTA: float = 0.2

@export var ajustes: MapaData = preload("res://dados/mapa/mapa_ajustes.tres")

## Quem responde pode_andar(posição). Sem cenário, anda livre (para testar a cena sozinha).
var cenario: CenarioMapa
var estado: Estado = Estado.PARADO
var _direcao: String = "baixo"
var _esquerda: bool = false

@onready var sprite: AnimatedSprite2D = $Sprite


func _ready() -> void:
	FolhaSprites.preparar(sprite)
	_tocar()


## Para enquanto o painel da fase ou a pausa estão abertos.
func travar(sim: bool) -> void:
	estado = Estado.TRAVADO if sim else Estado.PARADO
	_tocar()


func _physics_process(delta: float) -> void:
	if estado == Estado.TRAVADO:
		return
	var entrada: Vector2 = Input.get_vector("move_left", "move_right", "aim_up", "crouch")
	if entrada.length() < ZONA_MORTA:
		estado = Estado.PARADO
		_tocar()
		return
	estado = Estado.ANDANDO
	_virar(entrada)
	var passo: Vector2 = entrada.limit_length(1.0) * ajustes.velocidade * ESCALA * delta
	if _livre(position + passo):
		position += passo
	elif _livre(position + Vector2(passo.x, 0.0)):
		position.x += passo.x
	elif _livre(position + Vector2(0.0, passo.y)):
		position.y += passo.y
	_tocar()


## Os pés cabem aqui? Confere quatro pontos em volta dos pés (a elipse é achatada: visto de cima
## em diagonal, a profundidade aparece pela metade). Se já está preso num lugar proibido (ex.:
## a máscara mudou), deixa sair.
func _livre(p: Vector2) -> bool:
	if cenario == null or not cenario.pode_andar(position):
		return true
	var r: float = ajustes.raio_pes * ESCALA
	for d: Vector2 in [Vector2(r, 0.0), Vector2(-r, 0.0), Vector2(0.0, r * 0.5), Vector2(0.0, -r * 0.5)]:
		if not cenario.pode_andar(p + d):
			return false
	return true


## 8 direções: o ângulo do analógico em fatias de 45°.
func _virar(v: Vector2) -> void:
	var fatia: int = wrapi(roundi(v.angle() / (PI / 4.0)), 0, 8)  # 0 = direita, 2 = baixo, 6 = cima
	_direcao = ["lado", "diag_baixo", "baixo", "diag_baixo", "lado", "diag_cima", "cima", "diag_cima"][fatia]
	if fatia in [3, 4, 5]:
		_esquerda = true
	elif fatia in [0, 1, 7]:
		_esquerda = false


func _tocar() -> void:
	var anim: StringName = StringName(("andar_" if estado == Estado.ANDANDO else "parado_") + _direcao)
	if sprite.animation != anim and sprite.sprite_frames and sprite.sprite_frames.has_animation(anim):
		sprite.play(anim)
	elif not sprite.is_playing():
		sprite.play()
	sprite.scale = Vector2(-ESCALA if _esquerda else ESCALA, ESCALA)
