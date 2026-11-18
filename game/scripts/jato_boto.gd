class_name JatoBoto
extends Hitbox
## Jato de água do Boto: sai reto da boca dele até a outra margem, ligado por alguns décimos
## de segundo (GDD: aviso 0,9 s, 1 golpe). Alto (abaixa-se) ou baixo (pula-se): quem escolhe é
## o Boto, que afunda ou sobe na água para a boca ficar na altura certa.
## Layer enemy_hitbox; mask player. A origem é a boca; o jato vai para o lado "direcao".
## O desenho é o pedaço "jato_meio" repetido na horizontal (região com repetição) e a ponta.

## Comprimento (px): passa da largura da arena.
const COMPRIMENTO: float = 1900.0
## Quadros da água correndo (o pedaço do meio), trocados em loop.
const QUADROS_AGUA: Array[Texture2D] = [
	preload("res://assets/pixel/boto/efeitos/jato_meio_1.png"),
	preload("res://assets/pixel/boto/efeitos/jato_meio_2.png"),
	preload("res://assets/pixel/boto/efeitos/jato_meio_3.png"),
	preload("res://assets/pixel/boto/efeitos/jato_meio_4.png"),
]
const FPS_AGUA: float = 16.0

var _duracao: float = 0.6
var _direcao: float = -1.0
var _tempo: float = 0.0

@onready var forma: CollisionShape2D = $CollisionShape2D
@onready var agua: Sprite2D = $Agua
@onready var ponta: Sprite2D = $Ponta


## direcao: -1 = vai para a esquerda, 1 = para a direita.
func configurar(direcao: float, duracao: float, golpes: int) -> void:
	_direcao = direcao
	_duracao = duracao
	dano = golpes


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	forma.position.x = COMPRIMENTO / 2.0 * _direcao
	# A região repete o pedaço de 18 px; com escala 4, cobre o comprimento todo.
	agua.region_rect = Rect2(0.0, 0.0, COMPRIMENTO / agua.scale.y, agua.region_rect.size.y)
	agua.scale.x = absf(agua.scale.x) * _direcao
	ponta.scale.x = absf(ponta.scale.x) * _direcao


func _physics_process(delta: float) -> void:
	_tempo += delta
	agua.texture = QUADROS_AGUA[int(_tempo * FPS_AGUA) % QUADROS_AGUA.size()]
	if _tempo > _duracao or is_equal_approx(_tempo, _duracao):
		queue_free()
