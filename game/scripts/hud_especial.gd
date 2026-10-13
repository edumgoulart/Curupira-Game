class_name HudEspecial
extends Control
## Barra de carga do especial: enche em verde e, cheia, pulsa laranja-fogo
## (cor do cabelo do Curupira) para avisar que dá para disparar (K / Y).
## Só desenha; quem atualiza é o HUD, chamando mostrar(). Cores só visuais.

@export var cor_fundo: Color = Color(0.09, 0.15, 0.08, 0.85)
@export var cor_enchendo: Color = Color(0.36, 0.62, 0.28)
@export var cor_cheia: Color = Color(0.96, 0.4, 0.16)
@export var cor_brilho: Color = Color(1.0, 0.8, 0.34)
@export var cor_borda: Color = Color(0.33, 0.21, 0.12)

var atual: int = 0
var maximo: int = 100
var _tempo: float = 0.0


func mostrar(novo_atual: int, novo_maximo: int) -> void:
	atual = novo_atual
	maximo = maxi(novo_maximo, 1)
	queue_redraw()


func _process(delta: float) -> void:
	# Só precisa redesenhar a cada frame enquanto pulsa.
	if atual >= maximo:
		_tempo += delta
		queue_redraw()


func _draw() -> void:
	var cheia: bool = atual >= maximo
	var fracao: float = clampf(float(atual) / float(maximo), 0.0, 1.0)

	_caixa(Rect2(Vector2.ZERO, size), cor_fundo, cor_borda, 3)
	if fracao > 0.0:
		var cor: Color = cor_enchendo
		if cheia:
			# Pulsa entre o laranja e o amarelo-brasa (~1,5 vez por segundo).
			cor = cor_cheia.lerp(cor_brilho, 0.5 + 0.5 * sin(_tempo * TAU * 1.5))
		var interno := Rect2(Vector2(4, 4), Vector2((size.x - 8) * fracao, size.y - 8))
		_caixa(interno, cor, Color.TRANSPARENT, 0)


func _caixa(rect: Rect2, fundo: Color, borda: Color, largura: int) -> void:
	var estilo := StyleBoxFlat.new()
	estilo.bg_color = fundo
	estilo.border_color = borda
	estilo.set_border_width_all(largura)
	estilo.set_corner_radius_all(int(rect.size.y / 2.0))
	draw_style_box(estilo, rect)
