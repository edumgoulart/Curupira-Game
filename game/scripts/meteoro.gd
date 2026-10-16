class_name Meteoro
extends Node2D
## Meteoro da Mula. Nasce no chão, no ponto onde vai cair:
##   1. a sombra aparece e cresce durante o aviso (é o telegrafo);
##   2. nos últimos instantes a bola de fogo aparece caindo do alto;
##   3. no impacto a área machuca por um instante, o fogo estoura e tudo some.
## O fogo é só visual; quem machuca é a área "Impacto" (Hitbox).

signal impactou

## Altura de onde o fogo começa a cair, acima do chão (px). Só visual.
const ALTURA_QUEDA: float = 1200.0
## Tamanho da explosão do impacto (1 = a da Bola de Fogo do Curupira). Só visual.
const TAMANHO_ESTOURO: float = 1.5

## Explosão criada no impacto. Só visual.
@export var cena_estouro: PackedScene

var _aviso: float = 1.0
var _queda: float = 0.3
var _duracao_impacto: float = 0.15
var _golpes: int = 2
var _tempo: float = 0.0
var _impactou: bool = false

@onready var sombra: Polygon2D = $Sombra
@onready var fogo: Node2D = $Fogo
@onready var impacto: Hitbox = $Impacto
@onready var forma_impacto: CollisionShape2D = $Impacto/CollisionShape2D
## Altura final do fogo (a cabeça da bola encostando no chão), lida da cena.
@onready var _y_final_fogo: float = fogo.position.y


func configurar(dados: MulaData) -> void:
	_aviso = dados.aviso_meteoro
	_queda = dados.duracao_queda_meteoro
	_duracao_impacto = dados.duracao_impacto_meteoro
	_golpes = dados.golpes_meteoro


func _ready() -> void:
	add_to_group("ataques_chefe")
	impacto.dano = _golpes
	forma_impacto.disabled = true
	fogo.visible = false
	_atualizar_visual()


func _physics_process(delta: float) -> void:
	_tempo += delta
	_atualizar_visual()
	if not _impactou and _passou(_aviso):
		_impactou = true
		# Ligar a forma (e não monitorable) faz a hitbox detectar quem já está em cima.
		forma_impacto.set_deferred("disabled", false)
		sombra.visible = false
		_estourar()
		impactou.emit()
	if _passou(_aviso + _duracao_impacto):
		queue_free()


func _atualizar_visual() -> void:
	var progresso: float = clampf(_tempo / _aviso, 0.0, 1.0)
	sombra.scale = Vector2.ONE * lerpf(0.3, 1.0, progresso)
	sombra.modulate.a = lerpf(0.35, 0.85, progresso)
	var inicio_queda: float = _aviso - _queda
	if _tempo >= inicio_queda and not _impactou:
		fogo.visible = true
		var q: float = clampf((_tempo - inicio_queda) / _queda, 0.0, 1.0)
		fogo.position.y = lerpf(_y_final_fogo - ALTURA_QUEDA, _y_final_fogo, q)


## Impacto: a bola some num estouro. O estouro vai para a arena (e não fica no meteoro)
## para terminar de sumir mesmo depois que o meteoro já foi apagado.
func _estourar() -> void:
	fogo.visible = false
	if cena_estouro == null:
		return
	var estouro: Node2D = cena_estouro.instantiate()
	estouro.scale = Vector2.ONE * TAMANHO_ESTOURO
	estouro.position = position + Vector2(0.0, -40.0)
	get_parent().add_child.call_deferred(estouro)


## Compara tempo com tolerância (somas de 1/60 não batem exato em float).
func _passou(instante: float) -> bool:
	return _tempo > instante or is_equal_approx(_tempo, instante)
