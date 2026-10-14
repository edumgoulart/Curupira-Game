class_name JatoBoto
extends Hitbox
## Jato de água do Boto: faixa horizontal rente ao chão, do lado dele até a outra parede,
## ligada por alguns décimos de segundo (GDD: aviso 0,7 s, 1 golpe).
## Layer enemy_hitbox; mask player. Como toda Hitbox, se o Curupira ficar dentro quando a
## invencibilidade acabar, conta como encostar de novo.

## Comprimento (px): passa da largura da arena.
const COMPRIMENTO: float = 1900.0

var _duracao: float = 0.6
var _direcao: float = -1.0
var _tempo: float = 0.0

@onready var forma: CollisionShape2D = $CollisionShape2D
@onready var visual: Node2D = $VisualProvisorio


## direcao: -1 = vai para a esquerda, 1 = para a direita.
func configurar(direcao: float, duracao: float, golpes: int) -> void:
	_direcao = direcao
	_duracao = duracao
	dano = golpes


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	forma.position.x = COMPRIMENTO / 2.0 * _direcao
	visual.scale.x = _direcao


func _physics_process(delta: float) -> void:
	_tempo += delta
	visual.scale.y = 1.0 + 0.15 * sin(_tempo * 45.0)  # tremulação (só visual)
	if _tempo > _duracao or is_equal_approx(_tempo, _duracao):
		queue_free()
