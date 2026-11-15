class_name HudChefe
extends Control
## Barra de vida do chefe, no alto da tela: nome do chefe em cima e uma barra de metal com o
## chip na ponta (o chip que a Máquina cravou nos seres folclóricos).
## Só desenha; quem liga no chefe é o HUD, chamando configurar(), mostrar() e esconder().
##
## Detalhes visuais:
## - na entrada a barra enche do zero (mostra quanto o chefe aguenta);
## - o golpe deixa um rastro claro que desce até a vida nova depois de um instante;
## - dois entalhes marcam onde a luta muda de fase (vida_fase_2 e vida_fase_3 do .tres);
## - o LED do chip pisca e se apaga quando o chefe é libertado, e a barra some.
## A moldura vem do gerador de pixel art (hud_px.js), já ampliada 4×. Cores e tempos são
## só visuais.

const MOLDURA: Texture2D = preload("res://assets/pixel/ui/hud_moldura_chefe.png")
const FONTE: Font = preload("res://assets/pixel/ui/fonte_pixel.fnt")

const PIXEL: int = 4
## Vão da moldura onde entra o enchimento, em pixels da arte (x, y, largura, altura).
## Tem que bater com HUD_PX.chefe.vao no hud_px.js.
const VAO: Rect2i = Rect2i(14, 3, 151, 4)
## LED do chip na moldura, em pixels da arte.
const LED: Rect2i = Rect2i(5, 4, 2, 2)

@export var tamanho_fonte: int = 48
@export var cor_nome: Color = Color("fff6e8")
@export var cor_sombra_nome: Color = Color("1e0e16")
@export var cor_vazio: Color = Color("1a0e14")
@export var cor_vida: Color = Color("c81e28")
@export var cor_vida_luz: Color = Color("ff6a5a")
@export var cor_vida_sombra: Color = Color("8a1420")
@export var cor_rastro: Color = Color("ffe0a0")
@export var cor_entalhe: Color = Color("12161a")
@export var cor_led_apagado: Color = Color("4a1418")
## Tempo que a barra leva para encher na entrada (s).
@export var duracao_entrada: float = 0.8
## Quanto o rastro claro espera antes de descer, e quanto leva descendo (s).
@export var espera_rastro: float = 0.35
@export var duracao_rastro: float = 0.4

var nome: String = ""
var entalhes: PackedFloat32Array = PackedFloat32Array()
## Fração de vida mostrada (0 a 1) e a do rastro, que fica para trás um instante.
var fracao: float = 0.0
var fracao_rastro: float = 0.0
var _alvo: float = 1.0
var _liberto: bool = false
var _tempo: float = 0.0
var _tween_rastro: Tween
var _tween_entrada: Tween


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	visible = false


## Chamado uma vez pelo HUD com os dados do chefe da arena.
func configurar(novo_nome: String, limiares_fase: PackedFloat32Array) -> void:
	nome = novo_nome
	entalhes = limiares_fase
	visible = true
	_tween_entrada = create_tween().set_parallel()
	_tween_entrada.tween_property(self, "fracao", _alvo, duracao_entrada)
	_tween_entrada.tween_property(self, "fracao_rastro", _alvo, duracao_entrada)


func mostrar(atual: int, maximo: int) -> void:
	var nova: float = clampf(float(atual) / float(maxi(maximo, 1)), 0.0, 1.0)
	if is_equal_approx(nova, _alvo):
		return
	_alvo = nova
	if _tween_entrada:
		_tween_entrada.kill()  # levou golpe ainda enchendo: pula para a vida certa
	fracao = nova
	if _tween_rastro:
		_tween_rastro.kill()
	_tween_rastro = create_tween()
	_tween_rastro.tween_interval(espera_rastro)
	_tween_rastro.tween_property(self, "fracao_rastro", nova, duracao_rastro)


## O chefe foi libertado: o LED apaga e a barra some devagar.
func esconder() -> void:
	_liberto = true
	var saida := create_tween()
	saida.tween_interval(0.6)
	saida.tween_property(self, "modulate:a", 0.0, 0.8)
	saida.tween_callback(hide)


func _process(delta: float) -> void:
	_tempo += delta
	queue_redraw()


func _draw() -> void:
	var largura_moldura: float = MOLDURA.get_width()
	var x0: float = (size.x - largura_moldura) / 2.0
	var y_barra: float = tamanho_fonte + PIXEL * 3

	# Nome do chefe centralizado, com sombra de 1 pixel da arte.
	var largura_nome: float = FONTE.get_string_size(nome, HORIZONTAL_ALIGNMENT_LEFT, -1, tamanho_fonte).x
	var pos_nome := Vector2(floorf((size.x - largura_nome) / 2.0 / PIXEL) * PIXEL, tamanho_fonte)
	draw_string(FONTE, pos_nome + Vector2(PIXEL, PIXEL), nome, HORIZONTAL_ALIGNMENT_LEFT, -1, tamanho_fonte, cor_sombra_nome)
	draw_string(FONTE, pos_nome, nome, HORIZONTAL_ALIGNMENT_LEFT, -1, tamanho_fonte, cor_nome)

	var origem := Vector2(x0, y_barra) + Vector2(VAO.position * PIXEL)
	var altura: float = VAO.size.y * PIXEL
	draw_rect(Rect2(origem, Vector2(VAO.size * PIXEL)), cor_vazio)
	# Em colunas de 1 pixel da arte; arredonda para cima para o último ponto de vida aparecer.
	var colunas_vida: int = int(ceil(fracao * VAO.size.x))
	var colunas_rastro: int = int(ceil(fracao_rastro * VAO.size.x))
	if colunas_rastro > colunas_vida:
		draw_rect(Rect2(origem.x + colunas_vida * PIXEL, origem.y,
				(colunas_rastro - colunas_vida) * PIXEL, altura), cor_rastro)
	if colunas_vida > 0:
		var w: float = colunas_vida * PIXEL
		draw_rect(Rect2(origem, Vector2(w, altura)), cor_vida)
		draw_rect(Rect2(origem, Vector2(w, PIXEL)), cor_vida_luz)
		draw_rect(Rect2(origem.x, origem.y + altura - PIXEL, w, PIXEL), cor_vida_sombra)
	# Entalhes das fases: uma coluna escura onde a luta muda.
	for limiar in entalhes:
		var c: int = roundi(limiar * VAO.size.x)
		draw_rect(Rect2(origem.x + c * PIXEL, origem.y, PIXEL, altura), cor_entalhe)

	draw_texture(MOLDURA, Vector2(x0, y_barra))
	# LED do chip: pisca enquanto o chefe está possuído, apaga quando é libertado.
	if _liberto or fmod(_tempo, 1.0) > 0.7:
		draw_rect(Rect2(Vector2(x0, y_barra) + Vector2(LED.position * PIXEL), Vector2(LED.size * PIXEL)), cor_led_apagado)
