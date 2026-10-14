class_name LaserMaquina
extends Hitbox
## Raio laser da Máquina (GDD: "uma linha fina mostra o trajeto antes do disparo").
## A Máquina comanda as fases (pelo relógio dela, que a Bolha Abissal deixa mais lento):
##   mirar(ponto)  — durante o aviso a linha fina acompanha o Curupira;
##   travar()      — no fim do aviso a linha para e pisca;
##   disparar()    — o laser grosso liga e machuca (1 golpe).
## Layer enemy_hitbox; mask player. A forma começa desligada e só liga no disparo.

## Comprimento (px): sai da tela de qualquer ponto da arena.
const COMPRIMENTO: float = 2600.0

var _travado: bool = false

@onready var forma: CollisionShape2D = $CollisionShape2D
@onready var linha: Line2D = $Linha
@onready var raio: Polygon2D = $Raio


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	forma.disabled = true
	forma.position.x = COMPRIMENTO / 2.0
	linha.points = PackedVector2Array([Vector2.ZERO, Vector2(COMPRIMENTO, 0.0)])
	raio.visible = false


func _process(_delta: float) -> void:
	if _travado and not raio.visible:
		# Travado: a linha pisca rápido avisando que vai disparar (só visual).
		linha.visible = int(Time.get_ticks_msec() / 60) % 2 == 0


## Aponta a linha para um ponto do mundo (só enquanto não travou).
func mirar(ponto: Vector2) -> void:
	if not _travado:
		rotation = (ponto - global_position).angle()


func travar() -> void:
	_travado = true
	linha.width = 5.0


func disparar() -> void:
	linha.visible = false
	raio.visible = true
	# Ligar a forma (e não monitorable) faz detectar quem já está em cima da linha.
	forma.set_deferred("disabled", false)
