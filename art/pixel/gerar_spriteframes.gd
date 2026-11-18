extends SceneTree
## Gera um SpriteFrames (.tres) para cada folha de personagem em res://assets/pixel/<nome>/<nome>.json.
## Cada animação do JSON vira uma animação do SpriteFrames, com fps e loop; cada quadro é um
## AtlasTexture recortando a célula da folha (linha = animação, coluna = quadro).
## Uso, com o editor fechado ou numa cópia do projeto:
##   godot --path game --headless --script $PWD/art/pixel/gerar_spriteframes.gd

const PASTA := "res://assets/pixel"


func _initialize() -> void:
	var dir := DirAccess.open(PASTA)
	for nome in dir.get_directories():
		var caminho_json := "%s/%s/%s.json" % [PASTA, nome, nome]
		if not FileAccess.file_exists(caminho_json):
			continue
		var meta: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(caminho_json))
		var textura: Texture2D = load("%s/%s/%s" % [PASTA, nome, meta.imagem])
		var w: int = int(meta.celula[0])
		var h: int = int(meta.celula[1])
		var quadros := SpriteFrames.new()
		quadros.remove_animation(&"default")
		for anim: Dictionary in meta.animacoes:
			var n := StringName(anim.nome)
			quadros.add_animation(n)
			quadros.set_animation_speed(n, float(anim.fps))
			quadros.set_animation_loop(n, bool(anim.loop))
			for i in int(anim.quadros):
				var recorte := AtlasTexture.new()
				recorte.atlas = textura
				recorte.region = Rect2(i * w, int(anim.linha) * h, w, h)
				recorte.filter_clip = true
				quadros.add_frame(n, recorte)
		var destino := "%s/%s/%s_frames.tres" % [PASTA, nome, nome]
		print(destino, " -> ", error_string(ResourceSaver.save(quadros, destino)))
	quit()
