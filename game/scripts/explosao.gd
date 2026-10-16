extends Node2D
## Pequena explosão (só visual): cresce e some. Usada no impacto da Bola de Fogo e,
## maior, no impacto do meteoro da Mula. O tamanho vem do scale com que ela foi criada
## (1 = normal): quem cria pode aumentar o scale antes de pôr na cena.

const DURACAO: float = 0.25


func _ready() -> void:
	var tamanho: Vector2 = scale
	scale = tamanho * 0.4
	var tween := create_tween().set_parallel()
	tween.tween_property(self, "scale", tamanho * 1.4, DURACAO)
	tween.tween_property(self, "modulate:a", 0.0, DURACAO)
	tween.chain().tween_callback(queue_free)
