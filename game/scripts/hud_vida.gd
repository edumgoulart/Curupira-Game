class_name HudVida
extends Control
## Vida do Curupira em círculos: vermelho = golpe que ainda aguenta, cinza = golpe perdido.
## Só desenha; quem atualiza é o HUD, chamando mostrar().
## Cores e tamanhos são só visuais — ajustar no inspetor.

@export var raio: float = 22.0
@export var espacamento: float = 14.0
@export var cor_cheia: Color = Color(0.85, 0.12, 0.12)
@export var cor_vazia: Color = Color(0.4, 0.4, 0.4)
@export var cor_contorno: Color = Color(0.1, 0.1, 0.1)

var atual: int = 0
var maximo: int = 0


func mostrar(novo_atual: int, novo_maximo: int) -> void:
	atual = novo_atual
	maximo = novo_maximo
	queue_redraw()


func _draw() -> void:
	for i in maximo:
		var centro := Vector2(raio + i * (2.0 * raio + espacamento), size.y / 2.0)
		var cor: Color = cor_cheia if i < atual else cor_vazia
		draw_circle(centro, raio, cor)
		draw_arc(centro, raio, 0.0, TAU, 32, cor_contorno, 3.0, true)
