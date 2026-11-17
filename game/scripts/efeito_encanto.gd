class_name EfeitoEncanto
extends Node2D
## Visual do encanto do Boto no Curupira (lenda: o Boto encanta e leva para o rio).
## Enquanto ligado, o desenho fica rosado, pulsando, e coraçõezinhos sobem da cabeça.
## Só visual: o puxão fica no curupira.gd, que liga e desliga este efeito.

const COR: Color = Color(1.0, 0.55, 0.8)
const PULSO_HZ: float = 3.0
const INTERVALO_CORACAO: float = 0.2
const SUBIDA_CORACAO: float = 56.0
const VIDA_CORACAO: float = 0.6
## Onde os corações nascem, em relação à origem do Curupira (o meio do corpo).
const ALTURA_CABECA: float = 100.0
const ESPALHA_X: float = 24.0
## Os mesmos corações do Boto (efeitos do gerador, 9 × 9 px, centro 4,4).
const TEXTURA: Texture2D = preload("res://assets/pixel/boto/efeitos/coracao_1.png")

## Quem fica rosado (o AnimatedSprite2D do Curupira). Usa o modulate, que nada mais usa nele.
var desenho: CanvasItem

var _ligado: bool = false
var _tempo: float = 0.0
var _proximo: float = 0.0


func mostrar(ligado: bool) -> void:
	if ligado == _ligado:
		return
	_ligado = ligado
	_tempo = 0.0
	_proximo = 0.0
	if not ligado and desenho:
		desenho.modulate = Color.WHITE


func _process(delta: float) -> void:
	if not _ligado:
		return
	_tempo += delta
	if desenho:
		var pulso: float = 0.5 + 0.5 * sin(_tempo * TAU * PULSO_HZ)
		desenho.modulate = Color.WHITE.lerp(COR, 0.5 + 0.5 * pulso)
	_proximo -= delta
	if _proximo <= 0.0:
		_proximo = INTERVALO_CORACAO
		_soltar_coracao()


func _soltar_coracao() -> void:
	var coracao := Sprite2D.new()
	coracao.texture = TEXTURA
	coracao.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	coracao.scale = Vector2(4.0, 4.0)
	coracao.position = Vector2(randf_range(-ESPALHA_X, ESPALHA_X), -ALTURA_CABECA)
	add_child(coracao)
	var sobe: Tween = coracao.create_tween().set_parallel()
	sobe.tween_property(coracao, "position:y", coracao.position.y - SUBIDA_CORACAO, VIDA_CORACAO)
	sobe.tween_property(coracao, "modulate:a", 0.0, VIDA_CORACAO).set_ease(Tween.EASE_IN)
	sobe.chain().tween_callback(coracao.queue_free)
