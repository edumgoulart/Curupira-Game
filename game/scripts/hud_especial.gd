class_name HudEspecial
extends Control
## Carga do especial: uma barra de cipó que enche de verde e, cheia, vira brasa
## (cor do cabelo do Curupira) com a cabeça da onça acesa ao lado, avisando que dá
## para disparar o Instinto Selvagem (K / Y).
## Só desenha; quem atualiza é o HUD, chamando mostrar().
##
## A moldura e a onça vêm do gerador de pixel art (hud_px.js), já ampliadas 4×. O
## enchimento é desenhado aqui, em colunas de 1 pixel da arte (4 px), dentro do vão da
## moldura, para continuar parecendo pixel art. Cores e tempos são só visuais.

const MOLDURA: Texture2D = preload("res://assets/pixel/ui/hud_moldura_especial.png")
const ONCA_APAGADA: Texture2D = preload("res://assets/pixel/ui/hud_onca_apagada.png")
const ONCA_ACESA: Texture2D = preload("res://assets/pixel/ui/hud_onca_acesa.png")

const PIXEL: int = 4
## Vão da moldura onde entra o enchimento, em pixels da arte (x, y, largura, altura).
## Tem que bater com HUD_PX.especial.vao no hud_px.js.
const VAO: Rect2i = Rect2i(2, 2, 48, 5)

## Onde fica a onça, em relação ao canto do nó (px de tela).
@export var posicao_onca: Vector2 = Vector2(216, -8)
@export var cor_vazio: Color = Color("1a1420")
@export var cor_enchendo: Color = Color("4e8c33")
@export var cor_enchendo_luz: Color = Color("86b83c")
@export var cor_enchendo_sombra: Color = Color("2c6a2c")
## Cores da brasa quando cheia, da mais escura para a mais clara.
@export var cores_brasa: PackedColorArray = PackedColorArray([
	Color("e8360e"), Color("ff6f1a"), Color("ffa82a"), Color("ffd84a")])

var atual: int = 0
var maximo: int = 100
var _tempo: float = 0.0


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST


func mostrar(novo_atual: int, novo_maximo: int) -> void:
	atual = novo_atual
	maximo = maxi(novo_maximo, 1)
	queue_redraw()


func esta_cheia() -> bool:
	return atual >= maximo


func _process(delta: float) -> void:
	# Só precisa redesenhar a cada frame enquanto a brasa tremula.
	if esta_cheia():
		_tempo += delta
		queue_redraw()


func _draw() -> void:
	var cheia: bool = esta_cheia()
	var colunas: int = int(floor(clampf(float(atual) / float(maximo), 0.0, 1.0) * VAO.size.x))
	var origem := Vector2(VAO.position * PIXEL)
	var altura: float = VAO.size.y * PIXEL

	draw_rect(Rect2(origem, Vector2(VAO.size * PIXEL)), cor_vazio)
	for c in colunas:
		var x: float = origem.x + c * PIXEL
		if cheia:
			# Brasa: cada coluna sobe e desce de cor numa onda que corre para a direita.
			var onda: float = 0.5 + 0.5 * sin(_tempo * 9.0 - c * 0.7)
			var i: int = clampi(int(onda * cores_brasa.size()), 0, cores_brasa.size() - 1)
			draw_rect(Rect2(x, origem.y, PIXEL, altura), cores_brasa[i])
			draw_rect(Rect2(x, origem.y, PIXEL, PIXEL), cores_brasa[mini(i + 1, cores_brasa.size() - 1)])
		else:
			draw_rect(Rect2(x, origem.y, PIXEL, altura), cor_enchendo)
			draw_rect(Rect2(x, origem.y, PIXEL, PIXEL), cor_enchendo_luz)
			draw_rect(Rect2(x, origem.y + altura - PIXEL, PIXEL, PIXEL), cor_enchendo_sombra)
	draw_texture(MOLDURA, Vector2.ZERO)

	var onca_pos: Vector2 = posicao_onca
	if cheia:
		# A onça acesa dá um pulinho de 1 pixel no ritmo da brasa.
		onca_pos.y -= PIXEL if fmod(_tempo, 0.6) < 0.15 else 0
	draw_texture(ONCA_ACESA if cheia else ONCA_APAGADA, onca_pos)
