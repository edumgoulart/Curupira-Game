extends Node2D
## Pequena explosão (só visual): cresce e some. Usada no impacto da Bola de Fogo.

const DURACAO: float = 0.25


func _ready() -> void:
	scale = Vector2.ONE * 0.4
	var tween := create_tween().set_parallel()
	tween.tween_property(self, "scale", Vector2.ONE * 1.4, DURACAO)
	tween.tween_property(self, "modulate:a", 0.0, DURACAO)
	tween.chain().tween_callback(queue_free)
