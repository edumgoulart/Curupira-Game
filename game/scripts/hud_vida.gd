class_name HudVida
extends Control
## Vida do Curupira: retrato num aro de madeira e um coração por golpe que ele aguenta.
## Só desenha; quem atualiza é o HUD, chamando mostrar() e mostrar_especial().
##
## As imagens vêm do gerador de pixel art (art/pixel/gerador/hud_px.js) já ampliadas 4×,
## então tudo aqui anda em passos de 4 px (1 pixel da arte) para não borrar o desenho.
##
## O retrato muda de cara conforme a luta, nesta prioridade:
##   dor (logo depois de levar um golpe) > fúria (especial cheio) > assustado (1 golpe) > normal.
## O coração perdido treme e pisca antes de apagar; com 1 golpe sobrando, o último pula.
## Tempos e espaçamentos abaixo são só visuais (não são valores de combate).

const RETRATO_NORMAL: Texture2D = preload("res://assets/pixel/ui/hud_retrato_normal.png")
const RETRATO_DOR: Texture2D = preload("res://assets/pixel/ui/hud_retrato_dor.png")
const RETRATO_ASSUSTADO: Texture2D = preload("res://assets/pixel/ui/hud_retrato_assustado.png")
const RETRATO_FURIA: Texture2D = preload("res://assets/pixel/ui/hud_retrato_furia.png")
const CORACAO_CHEIO: Texture2D = preload("res://assets/pixel/ui/hud_coracao_cheio.png")
const CORACAO_VAZIO: Texture2D = preload("res://assets/pixel/ui/hud_coracao_vazio.png")

## Um pixel da arte na tela (a arte é 480×270 mostrada 4×).
const PIXEL: int = 4

## Onde fica o primeiro coração, em relação ao canto do nó (px de tela).
@export var inicio_coracoes: Vector2 = Vector2(136, 16)
## Distância de um coração para o próximo (px de tela).
@export var passo_coracoes: int = 44
## Quanto tempo o retrato fica com cara de dor e o coração perdido treme (s).
@export var duracao_dor: float = 0.6

var atual: int = 0
var maximo: int = 0
var especial_cheio: bool = false
var _tempo: float = 0.0
var _tempo_dor: float = 0.0
# Corações que acabaram de apagar (do índice atual até o anterior), para tremer.
var _perdidos_de: int = 0
var _perdidos_ate: int = 0


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST


func mostrar(novo_atual: int, novo_maximo: int) -> void:
	if novo_atual < atual and maximo > 0:
		_tempo_dor = duracao_dor
		_perdidos_de = novo_atual
		_perdidos_ate = atual
	atual = novo_atual
	maximo = novo_maximo
	queue_redraw()


func mostrar_especial(cheio: bool) -> void:
	if cheio == especial_cheio:
		return
	especial_cheio = cheio
	queue_redraw()


func _process(delta: float) -> void:
	_tempo += delta
	if _tempo_dor > 0.0:
		_tempo_dor = maxf(_tempo_dor - delta, 0.0)
	# Redesenha todo frame só quando algo se mexe (coração pulando/tremendo).
	if _tempo_dor > 0.0 or atual == 1:
		queue_redraw()


func _draw() -> void:
	draw_texture(_retrato(), Vector2.ZERO)
	for i in maximo:
		var pos: Vector2 = inicio_coracoes + Vector2(i * passo_coracoes, 0)
		var cheio: bool = i < atual
		if _tempo_dor > 0.0 and i >= _perdidos_de and i < _perdidos_ate:
			# Treme de um lado para o outro e pisca entre cheio e vazio antes de apagar.
			pos.x += PIXEL * (1 if fmod(_tempo, 0.1) < 0.05 else -1)
			cheio = fmod(_tempo, 0.16) < 0.08
		elif cheio and atual == 1:
			# Último golpe: o coração dá um pulinho de 1 pixel, como um batimento acelerado.
			pos.y -= PIXEL if fmod(_tempo, 0.5) < 0.12 else 0
		draw_texture(CORACAO_CHEIO if cheio else CORACAO_VAZIO, pos)


func _retrato() -> Texture2D:
	if _tempo_dor > 0.0 or (atual == 0 and maximo > 0):
		return RETRATO_DOR
	if especial_cheio:
		return RETRATO_FURIA
	if atual == 1:
		return RETRATO_ASSUSTADO
	return RETRATO_NORMAL
