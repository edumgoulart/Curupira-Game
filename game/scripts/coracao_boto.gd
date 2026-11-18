class_name CoracaoBoto
extends Hitbox
## Beijo de bolha do Boto: coração que persegue o Curupira, ondulando. Vira devagar (curva
## larga), então dá para despistar correndo ou pulando, e estoura com um tiro: a Hurtbox
## filha fica no layer enemy, então os tiros do Curupira enxergam ela.
## Machuca ao encostar (layer enemy_hitbox, mask player) e encanta (lenda do Boto): chama
## aplicar_efeito(&"encanto") na hurtbox atingida, como o veneno dos projéteis, sem saber quem
## é o alvo. A intensidade é a velocidade do puxão, com sinal: negativa puxa para a esquerda,
## positiva para a direita (para o lado do Boto que mandou o beijo).

## Estouro do coração. Só visual.
const CENA_ESTOURO: PackedScene = preload("res://scenes/coracao_estoura_boto.tscn")

## Quem manda o beijo (o Boto) preenche tudo antes de pôr na cena.
var velocidade: float = 240.0
## Direção em que sai (-1 = esquerda, 1 = direita); depois ele vira atrás do alvo.
var direcao: float = -1.0
## Quanto vira por segundo atrás do alvo (graus/s).
var curva: float = 90.0
## Ondulação para os lados do caminho: altura (px) e ondas por segundo.
var amplitude: float = 24.0
var frequencia: float = 0.9
## Depois desse tempo (s) ele estoura sozinho.
var duracao: float = 6.0
## Quem ele persegue. Sem alvo, segue reto.
var alvo: Node2D
## Encanto: velocidade do puxão (px/s), duração (s) e o x de onde veio (o Boto).
var forca_encanto: float = 300.0
var duracao_encanto: float = 1.0
var x_origem: float = 0.0

var _velocidade: Vector2 = Vector2.ZERO
var _caminho: Vector2 = Vector2.ZERO  # posição sem a ondulação
var _tempo: float = 0.0

@onready var hurtbox: Hurtbox = $Hurtbox


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	_caminho = global_position
	_velocidade = Vector2(direcao * velocidade, 0.0)
	hurtbox.golpe_recebido.connect(func(_quanto: int, _de: Node) -> void: estourar())
	acertou.connect(_ao_acertar)
	var aviso_tela := get_node_or_null("VisibleOnScreenNotifier2D") as VisibleOnScreenNotifier2D
	if aviso_tela:
		aviso_tela.screen_exited.connect(queue_free)


func _physics_process(delta: float) -> void:
	_tempo += delta
	# Vira atrás do alvo, no máximo "curva" graus por segundo.
	if is_instance_valid(alvo):
		var diferenca: float = _velocidade.angle_to(alvo.global_position - _caminho)
		var maximo: float = deg_to_rad(curva) * delta
		_velocidade = _velocidade.rotated(clampf(diferenca, -maximo, maximo))
	_caminho += _velocidade * delta
	# Ondula para os lados do caminho (perpendicular à direção em que voa).
	var lado: Vector2 = _velocidade.normalized().orthogonal()
	global_position = _caminho + lado * amplitude * sin(_tempo * TAU * frequencia)
	if _tempo >= duracao:
		estourar()


func _ao_acertar(area: Area2D) -> void:
	if area.has_method("aplicar_efeito") and duracao_encanto > 0.0:
		var lado: float = signf(x_origem - area.global_position.x)
		area.aplicar_efeito(&"encanto", lado * forca_encanto, duracao_encanto)
	estourar()


func estourar() -> void:
	if is_queued_for_deletion():
		return
	var efeito: Node2D = CENA_ESTOURO.instantiate()
	efeito.global_position = global_position
	get_parent().add_child.call_deferred(efeito)
	queue_free()
