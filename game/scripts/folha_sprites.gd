class_name FolhaSprites
extends RefCounted
## Lê o .json que o gerador de pixel art grava ao lado de cada folha
## (assets/pixel/<nome>/<nome>.json) e usa ele para:
##   - pôr a âncora do desenho (pés, linha d'água, ponto do teto) na origem do node;
##   - dizer onde fica um ponto do desenho (mão, boca, bico, lente) no quadro que está na tela,
##     para o tiro sair do lugar certo em qualquer animação.
## O .json fica junto do SpriteFrames: <nome>_frames.tres -> <nome>.json.
## No export, incluir "*.json" no filtro de arquivos (não é recurso do Godot).

## A arte é desenhada em 480×270 e o jogo roda em 1920×1080.
const ESCALA: float = 4.0

static var _cache: Dictionary = {}


## Dados da folha do sprite (vazio se o SpriteFrames não veio do gerador).
static func dados(sprite: AnimatedSprite2D) -> Dictionary:
	if sprite == null or sprite.sprite_frames == null:
		return {}
	var caminho: String = sprite.sprite_frames.resource_path.replace("_frames.tres", ".json")
	if not _cache.has(caminho):
		var lido: Dictionary = {}
		if caminho.ends_with(".json") and FileAccess.file_exists(caminho):
			var json: Variant = JSON.parse_string(FileAccess.get_file_as_string(caminho))
			if json is Dictionary:
				lido = json
				# Índice por nome de animação, para achar os pontos rápido.
				var por_nome: Dictionary = {}
				for anim: Dictionary in lido.get("animacoes", []):
					por_nome[StringName(anim.nome)] = anim
				lido["por_nome"] = por_nome
		_cache[caminho] = lido
	return _cache[caminho]


## Centraliza o desenho na âncora e liga o filtro Nearest (pixel art não pode borrar).
## A escala (4, ou -4 para virar) fica com quem usa o sprite.
static func preparar(sprite: AnimatedSprite2D) -> void:
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var d: Dictionary = dados(sprite)
	if d.is_empty():
		return
	sprite.centered = true
	sprite.offset = Vector2(d.celula[0] / 2.0 - d.ancora[0], d.celula[1] / 2.0 - d.ancora[1])


## Ponto do desenho no quadro atual, em pixels da arte, relativo à âncora.
## null se a animação não tem esse ponto.
static func ponto_arte(sprite: AnimatedSprite2D, nome: String) -> Variant:
	var anim: Dictionary = dados(sprite).get("por_nome", {}).get(sprite.animation, {})
	var pontos: Array = anim.get("pontos", {}).get(nome, [])
	if pontos.is_empty():
		return null
	var p: Array = pontos[clampi(sprite.frame, 0, pontos.size() - 1)]
	return Vector2(p[0], p[1])


## Ponto do desenho no mundo (já com escala e espelhamento do sprite).
## Sem o ponto na animação atual, devolve "padrao" (ou a âncora, se padrao for null).
static func ponto(sprite: AnimatedSprite2D, nome: String, padrao: Variant = null) -> Vector2:
	var p: Variant = ponto_arte(sprite, nome)
	if p == null:
		return padrao if padrao != null else sprite.global_position
	# Com centered + offset da âncora, o pixel (0, 0) da âncora é a origem local do sprite.
	return sprite.to_global(p)


## Duração da animação em segundos (quadros / fps), sem contar o speed_scale.
static func duracao(sprite: AnimatedSprite2D, animacao: StringName) -> float:
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(animacao):
		return 0.0
	var fps: float = sprite.sprite_frames.get_animation_speed(animacao)
	return sprite.sprite_frames.get_frame_count(animacao) / fps if fps > 0.0 else 0.0


## Caixa que a animação ocupa (todos os quadros juntos), em pixels da arte, relativa à âncora.
## Rect2 vazio se o .json não tem a caixa.
static func caixa(sprite: AnimatedSprite2D, animacao: StringName) -> Rect2:
	var anim: Dictionary = dados(sprite).get("por_nome", {}).get(animacao, {})
	var c: Array = anim.get("caixa", [])
	if c.size() != 4:
		return Rect2()
	return Rect2(c[0], c[1], c[2] - c[0], c[3] - c[1])
