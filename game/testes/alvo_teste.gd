extends Node2D
## Boneco de treino para testar ataques do Curupira sem chefe.
## Mostra acertos, dano total e dano por segundo (desde o primeiro acerto).
## Hurtbox no layer "enemy", igual a um chefe.

var acertos: int = 0
var dano_total: int = 0
var _tempo_primeiro_acerto: float = -1.0

@onready var texto: Label = $Texto
@onready var visual: Polygon2D = $Visual


func _ready() -> void:
	_atualizar_texto()


func take_damage(amount: int, _from: Node) -> void:
	var agora: float = Time.get_ticks_msec() / 1000.0
	if _tempo_primeiro_acerto < 0.0:
		_tempo_primeiro_acerto = agora
	acertos += 1
	dano_total += amount
	_atualizar_texto()
	# Pisca branco para dar retorno visual do acerto.
	visual.modulate = Color(3, 3, 3)
	create_tween().tween_property(visual, "modulate", Color.WHITE, 0.08)


func _atualizar_texto() -> void:
	var dano_por_segundo: float = 0.0
	var decorrido: float = Time.get_ticks_msec() / 1000.0 - _tempo_primeiro_acerto
	if _tempo_primeiro_acerto >= 0.0 and decorrido > 0.0:
		dano_por_segundo = dano_total / decorrido
	texto.text = "Acertos: %d\nDano: %d\nDano/s: %.1f" % [acertos, dano_total, dano_por_segundo]
