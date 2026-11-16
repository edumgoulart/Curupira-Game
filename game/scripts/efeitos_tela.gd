class_name EfeitosTela
extends RefCounted
## Efeitos de tela só visuais, usados no golpe e na troca de fase: tremor da câmera e clarão.
## Funções estáticas: quem chama passa um node qualquer da cena (para achar a câmera e a árvore).
## A câmera é a da arena (fixa); o tremor mexe só no offset dela e volta para zero.

## Camada do clarão: por cima da arena e do HUD, por baixo dos menus de pausa/derrota.
const CAMADA_CLARAO: int = 5

const MATERIAL_CLARAO: Shader = preload("res://scripts/clarao.gdshader")


## Treme a câmera da arena: "forca" em px (some aos poucos) durante "duracao" s.
static func tremer(no: Node, forca: float, duracao: float) -> void:
	var camera: Camera2D = no.get_viewport().get_camera_2d()
	if camera == null:
		return
	var tween: Tween = camera.create_tween()
	var passos: int = maxi(int(duracao / 0.03), 1)
	for i in passos:
		var f: float = forca * (1.0 - float(i) / passos)
		var desvio := Vector2(randf_range(-f, f), randf_range(-f, f))
		tween.tween_property(camera, "offset", desvio, 0.03)
	tween.tween_property(camera, "offset", Vector2.ZERO, 0.03)


## Clarão na tela inteira: começa com a "cor" (alfa = força) e some em "duracao" s.
static func clarao(no: Node, cor: Color, duracao: float) -> void:
	var camada := CanvasLayer.new()
	camada.layer = CAMADA_CLARAO
	var retangulo := ColorRect.new()
	retangulo.color = cor
	retangulo.mouse_filter = Control.MOUSE_FILTER_IGNORE
	retangulo.set_anchors_preset(Control.PRESET_FULL_RECT)
	camada.add_child(retangulo)
	no.get_tree().current_scene.add_child(camada)
	var tween: Tween = camada.create_tween()
	tween.tween_property(retangulo, "color:a", 0.0, duracao)
	tween.tween_callback(camada.queue_free)


## Dá ao sprite um material próprio de pisca branco (clarao.gdshader) e devolve o material.
static func preparar_pisca(sprite: CanvasItem) -> ShaderMaterial:
	var material := ShaderMaterial.new()
	material.shader = MATERIAL_CLARAO
	sprite.material = material
	return material
