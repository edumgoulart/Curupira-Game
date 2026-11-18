extends Control
## Trilha do progresso na carta de derrota: uma linha de tinta da largura do controle, com um
## entalhe onde a luta muda de fase e o chip do chefe na ponta direita. O Curupira (filho
## "Corredor") corre do começo até onde o jogador chegou (fração da vida que o chefe perdeu).
## Só desenha; quem chama mostrar() é a tela de derrota.

const PIXEL: float = 4.0

@export var cor_tinta: Color = Color("4a3628")
@export var cor_caminho: Color = Color("c81e14")
@export var cor_falta: Color = Color("bfae88")
## Tempo do Curupira correndo até o ponto onde parou (s).
@export var duracao_corrida: float = 1.2

## Fração da vida do chefe já tirada (0 = nem encostou, 1 = venceu).
var progresso: float = 0.0
## Onde cada fase começa, em fração da vida que sobra (Chefe.limiares_fase()).
var limiares: PackedFloat32Array = PackedFloat32Array()
var _andou: float = 0.0

@onready var corredor: AnimatedSprite2D = $Corredor
@onready var chip: TextureRect = $Chip


func mostrar(novo_progresso: float, novos_limiares: PackedFloat32Array) -> void:
	progresso = clampf(novo_progresso, 0.0, 1.0)
	limiares = novos_limiares
	_andou = 0.0
	corredor.play(&"andar_lado")
	var tween: Tween = create_tween()
	tween.tween_property(self, "_andou", progresso, duracao_corrida * maxf(progresso, 0.15)).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_SINE)
	tween.tween_callback(func() -> void: corredor.play(&"parado_lado"))


func _fim_x() -> float:
	return size.x - chip.size.x - PIXEL * 2.0


func _process(_delta: float) -> void:
	corredor.position = Vector2(snappedf(_fim_x() * _andou, PIXEL), size.y / 2.0)
	queue_redraw()


func _draw() -> void:
	var meio: float = snappedf(size.y / 2.0, PIXEL)
	var fim: float = _fim_x()
	var feito: float = snappedf(fim * _andou, PIXEL)
	# trilha: tinta embaixo, o que falta tracejado, o caminho feito em vermelho
	draw_rect(Rect2(0, meio - PIXEL, fim, PIXEL * 3.0), cor_tinta)
	var x: float = feito
	while x < fim - PIXEL:
		draw_rect(Rect2(x, meio, PIXEL * 2.0, PIXEL), cor_falta)
		x += PIXEL * 4.0
	draw_rect(Rect2(0, meio, feito, PIXEL), cor_caminho)
	# ponta esquerda arredondada e um entalhe por troca de fase
	draw_rect(Rect2(-PIXEL, meio - PIXEL * 2.0, PIXEL, PIXEL * 5.0), cor_tinta)
	for limiar in limiares:
		var lx: float = snappedf(fim * (1.0 - limiar), PIXEL)
		draw_rect(Rect2(lx - PIXEL / 2.0, meio - PIXEL * 3.0, PIXEL, PIXEL * 7.0), cor_tinta)
