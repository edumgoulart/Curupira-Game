extends Node
## TEMPORÁRIO (não faz parte do jogo): diretor do teaser da luta contra a Mula.
## Roda como autoload via override.cfg, gravado pelo Movie Maker (--write-movie, 60 fps).
## Controla câmera, câmera lenta, cartelas, os ataques da Mula e um "piloto" do Curupira.

const FASE := "res://scenes/level1.tscn"
const LOGO := preload("res://assets/titulo.png")
const FAIXA := 104.0
const FPS := 60.0
const COR_TEXTO := Color(0.96, 0.92, 0.8)

var cena: Node
var cur: CharacterBody2D
var mula: Node2D
var cam: Camera2D

# Piloto
var piloto := false
var atirando := false
var segurar: Dictionary = {}       # ação -> ticks restantes segurando
var bolas_vistas: Array = []
var modo_bolas := false
var pulou_bolas := false
var deu_dash_bolas := false
var mula_presa := true
var lento_no_dash := false

# Câmera
var tween_cam: Tween
var seguir: Node2D
var zoom_seguir := 1.0
var tremor := 0.0
var golpes := 0

# Tela
var preto: ColorRect
var branco: ColorRect
var texto: Label
var logo: TextureRect
var sub: Label


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	Engine.physics_ticks_per_second = 240  # câmera lenta sem "engasgo" de física
	Engine.max_physics_steps_per_frame = 8
	_montar_tela()
	_roteiro()


# ---------------------------------------------------------------- roteiro

func _roteiro() -> void:
	await _esperar(0.5)
	await _cartao("UMA MÁQUINA QUER AS FLORESTAS DO BRASIL", 3.0)
	await _cartao("ELA PÔS CHIPS NAS LENDAS DO FOLCLORE", 2.8)
	await _plano_abertura()
	await _cartao("SÓ UM FICOU LIVRE", 2.3)
	await _plano_curupira()
	await _plano_bolas()
	await _plano_meteoro()
	await _cartao("A FLORESTA TEM UM PROTETOR", 2.3)
	await _plano_especial()
	await _plano_final()
	await _cartao_final()
	print("TRAILER: golpes levados = ", golpes)
	get_tree().quit()


func _plano_abertura() -> void:
	await _carregar()
	cur.global_position.x = -620.0
	_camera_ja(Vector2(640, 150), 1.9)
	_abrir(0.5)
	_mover_camera(Vector2(0, 0), 1.0, 3.4, Tween.TRANS_SINE)
	await _esperar(2.2)
	mula.avisar(true)
	await _esperar(1.0)
	await _fechar(0.25)
	mula.avisar(false)


func _plano_curupira() -> void:
	await _carregar()
	cur.global_position.x = -640.0
	_camera_ja(_limitar(Vector2(-560, 160), 2.0), 2.0)
	_abrir(0.2)
	piloto = true
	segurar["move_right"] = 120
	await _esperar(0.4)
	atirando = true
	_mover_camera(Vector2(-380, 150), 1.6, 2.2, Tween.TRANS_SINE)
	await _esperar(2.2)
	await _fechar(0.15)


func _plano_bolas() -> void:
	await _carregar()
	cur.global_position.x = -300.0
	_camera_ja(Vector2(130, 110), 1.25)
	_abrir(0.15)
	piloto = true
	atirando = true
	await _esperar(0.5)
	modo_bolas = true
	mula._entrar(mula.Estado.AVISO_BOLAS, mula._d.aviso_bolas)
	await _esperar(3.4)
	await _fechar(0.15)


func _plano_meteoro() -> void:
	await _carregar()
	cur.global_position.x = -380.0
	_camera_ja(Vector2(-60, 120), 1.2)
	_abrir(0.15)
	piloto = true
	atirando = true
	await _esperar(0.35)
	mula._soltar_meteoro()
	mula._entrar(mula.Estado.METEORO, mula._d.aviso_meteoro)
	_mover_camera(Vector2(-120, 130), 1.25, 0.9, Tween.TRANS_SINE)
	await _esperar(0.45)
	segurar["move_right"] = 70
	await _esperar(0.12)
	segurar["dash"] = 2
	await _esperar(0.43)
	# impacto
	tremor = 22.0
	_clarao(0.35)
	_mover_camera(Vector2(-40, 120), 1.15, 0.6, Tween.TRANS_QUAD)
	await _esperar(1.5)
	await _fechar(0.15)


func _plano_especial() -> void:
	await _carregar()
	cur.global_position.x = -420.0
	_camera_ja(_limitar(Vector2(-380, 170), 1.8), 1.8)
	_abrir(0.15)
	piloto = true
	await _esperar(0.7)
	cur.carga.adicionar(cur.carga.maximo)
	segurar["attack_special"] = 2
	await _esperar(0.1)
	Engine.time_scale = 0.4
	for no in cena.get_children():
		if no is Projetil:
			seguir = no
	zoom_seguir = 1.3
	var vida_antes: int = mula.vida.atual
	var limite := 0
	while mula.vida.atual == vida_antes and limite < 240:
		limite += 1
		await get_tree().process_frame
	seguir = null
	tremor = 18.0
	_clarao(0.3)
	await _esperar(0.35)
	Engine.time_scale = 1.0
	atirando = true
	await _esperar(1.0)
	await _fechar(0.15)


func _plano_final() -> void:
	await _carregar()
	cena.get_node("TelaVitoria").queue_free()  # sem tela de vitória (e sem gravar save)
	cur.global_position.x = -260.0
	mula.vida.atual = 12
	_camera_ja(Vector2(150, 120), 1.2)
	_abrir(0.15)
	piloto = true
	atirando = true
	atirando = false
	await _esperar(0.3)
	segurar["jump"] = 100
	await _esperar(0.12)
	atirando = true
	var limite := 0
	while not mula.derrotado and limite < 300:
		limite += 1
		await get_tree().process_frame
	atirando = false
	Engine.time_scale = 0.2
	_clarao(0.9)
	tremor = 26.0
	_mover_camera(Vector2(560, 170), 1.7, 1.8, Tween.TRANS_SINE)
	# A Mula treme e se apaga (o chip solta).
	var visual: CanvasItem = mula.sprite
	var t := create_tween().set_ignore_time_scale(true).set_parallel()
	t.tween_property(visual, "modulate", Color(1.8, 1.4, 1.0, 1.0), 0.25)
	t.chain().tween_property(visual, "modulate", Color(1, 1, 1, 0.0), 1.4)
	var base_x: float = visual.position.x
	for i in 50:
		visual.position.x = base_x + randf_range(-7.0, 7.0) * (1.0 - i / 50.0)
		await get_tree().process_frame
	visual.position.x = base_x
	await _fechar(0.8)
	Engine.time_scale = 1.0


func _cartao_final() -> void:
	logo.visible = true
	sub.visible = true
	sub.text = "EM BREVE"
	logo.modulate.a = 0.0
	sub.modulate.a = 0.0
	logo.scale = Vector2.ONE * 0.92
	var t := create_tween().set_parallel()
	t.tween_property(logo, "modulate:a", 1.0, 1.0)
	t.tween_property(logo, "scale", Vector2.ONE, 5.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	t.tween_property(sub, "modulate:a", 1.0, 0.8).set_delay(1.6)
	await _esperar(4.6)
	var t2 := create_tween().set_parallel()
	t2.tween_property(logo, "modulate:a", 0.0, 0.8)
	t2.tween_property(sub, "modulate:a", 0.0, 0.8)
	await _esperar(1.1)


# ---------------------------------------------------------------- cena

func _carregar() -> void:
	preto.modulate.a = 1.0
	piloto = false
	atirando = false
	segurar.clear()
	_soltar_tudo()
	bolas_vistas.clear()
	modo_bolas = false
	pulou_bolas = false
	deu_dash_bolas = false
	lento_no_dash = false
	seguir = null
	tremor = 0.0
	Engine.time_scale = 1.0
	get_tree().change_scene_to_file(FASE)
	cena = null
	while cena == null:
		await get_tree().process_frame
		var c := get_tree().current_scene
		if c != null and c.scene_file_path == FASE and c.is_node_ready():
			cena = c
	cur = cena.get_node("Curupira")
	mula = cena.get_node("Mula")
	cam = cena.get_node("Camera2D")
	cena.get_node("HUD").visible = false
	mula._entrar(mula.Estado.ESPERANDO, 999.0)
	cur.vida.vida_mudou.connect(func(_a: int, _m: int) -> void: golpes += 1)
	await _esperar(0.05)


func _physics_process(_delta: float) -> void:
	if cena == null or not is_instance_valid(mula):
		return
	# A Mula só ataca quando o roteiro manda.
	if mula_presa and not mula.derrotado:
		if mula.estado == mula.Estado.ESPERANDO and mula._tempo < 900.0:
			mula._tempo = 999.0
		elif mula.estado == mula.Estado.PARADA and mula._tempo < 0.05:
			mula._entrar(mula.Estado.ESPERANDO, 999.0)
	if not piloto:
		return
	_pilotar()


func _pilotar() -> void:
	# Bolas de fogo: pula a primeira (e a segunda junto) e atravessa a terceira com dash.
	if modo_bolas:
		for no in get_tree().get_nodes_in_group("ataques_chefe"):
			if no is BolaDeFogoMula and not bolas_vistas.has(no):
				bolas_vistas.append(no)
		if not pulou_bolas and bolas_vistas.size() >= 1 and is_instance_valid(bolas_vistas[0]):
			if bolas_vistas[0].global_position.x - cur.global_position.x < 175.0:
				pulou_bolas = true
				segurar["jump"] = 100
		if not deu_dash_bolas and bolas_vistas.size() >= 3 and is_instance_valid(bolas_vistas[2]) and cur.is_on_floor():
			if bolas_vistas[2].global_position.x - cur.global_position.x < 150.0:
				deu_dash_bolas = true
				segurar["dash"] = 2
				lento_no_dash = true
	if lento_no_dash and cur.estado == cur.Estado.DASH:
		lento_no_dash = false
		_camera_lenta(0.22, 0.9)

	if atirando:
		Input.action_press("attack_basic")
	else:
		Input.action_release("attack_basic")
	for acao in segurar.keys():
		if segurar[acao] > 0:
			if not Input.is_action_pressed(acao):
				Input.action_press(acao)
			segurar[acao] -= 1
		else:
			Input.action_release(acao)
			segurar.erase(acao)


func _soltar_tudo() -> void:
	for acao in ["move_left", "move_right", "jump", "dash", "attack_basic", "attack_special"]:
		Input.action_release(acao)


func _camera_lenta(escala: float, duracao_saida: float) -> void:
	Engine.time_scale = escala
	await _esperar(duracao_saida)
	var t := create_tween().set_ignore_time_scale(true)
	t.tween_property(Engine, "time_scale", 1.0, 0.3)


# ---------------------------------------------------------------- câmera

func _limitar(p: Vector2, z: float) -> Vector2:
	var mx := 960.0 - 960.0 / z
	var my := 540.0 - 540.0 / z
	return Vector2(clampf(p.x, -mx, mx), clampf(p.y, -my, my))


func _camera_ja(p: Vector2, z: float) -> void:
	if tween_cam:
		tween_cam.kill()
	cam.zoom = Vector2.ONE * z
	cam.position = _limitar(p, z)


func _mover_camera(p: Vector2, z: float, dur: float, trans: Tween.TransitionType) -> void:
	if tween_cam:
		tween_cam.kill()
	tween_cam = create_tween().set_parallel().set_ignore_time_scale(true)
	tween_cam.tween_property(cam, "zoom", Vector2.ONE * z, dur).set_trans(trans).set_ease(Tween.EASE_IN_OUT)
	tween_cam.tween_property(cam, "position", _limitar(p, z), dur).set_trans(trans).set_ease(Tween.EASE_IN_OUT)


func _process(_delta: float) -> void:
	if cam == null or not is_instance_valid(cam):
		return
	if seguir and is_instance_valid(seguir):
		var z: float = lerpf(cam.zoom.x, zoom_seguir, 0.05)
		cam.zoom = Vector2.ONE * z
		cam.position = cam.position.lerp(_limitar(seguir.global_position + Vector2(0, -40), z), 0.12)
	cam.offset = Vector2(randf_range(-1, 1), randf_range(-1, 1)) * tremor
	tremor = move_toward(tremor, 0.0, 40.0 / FPS)


# ---------------------------------------------------------------- tela

func _montar_tela() -> void:
	var camada := CanvasLayer.new()
	camada.layer = 120
	add_child(camada)
	branco = ColorRect.new()
	branco.color = Color(1, 0.95, 0.85)
	branco.size = Vector2(1920, 1080)
	branco.modulate.a = 0.0
	var aditivo := CanvasItemMaterial.new()
	aditivo.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	branco.material = aditivo
	camada.add_child(branco)
	for topo in [true, false]:
		var faixa := ColorRect.new()
		faixa.color = Color.BLACK
		faixa.size = Vector2(1920, FAIXA)
		faixa.position = Vector2(0, 0 if topo else 1080 - FAIXA)
		camada.add_child(faixa)
	preto = ColorRect.new()
	preto.color = Color.BLACK
	preto.size = Vector2(1920, 1080)
	camada.add_child(preto)

	var fonte := FontVariation.new()
	var sistema := SystemFont.new()
	sistema.font_weight = 700
	fonte.base_font = sistema
	fonte.spacing_glyph = 10
	var ajustes := LabelSettings.new()
	ajustes.font = fonte
	ajustes.font_size = 64
	ajustes.font_color = COR_TEXTO
	texto = Label.new()
	texto.label_settings = ajustes
	texto.size = Vector2(1920, 1080)
	texto.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	texto.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	texto.modulate.a = 0.0
	camada.add_child(texto)

	logo = TextureRect.new()
	logo.texture = LOGO
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	logo.size = Vector2(1100, 550)
	logo.position = Vector2(410, 190)
	logo.pivot_offset = logo.size / 2.0
	logo.visible = false
	camada.add_child(logo)

	var ajustes_sub := ajustes.duplicate()
	ajustes_sub.font_size = 40
	sub = Label.new()
	sub.label_settings = ajustes_sub
	sub.size = Vector2(1920, 80)
	sub.position = Vector2(0, 780)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub.visible = false
	camada.add_child(sub)


func _cartao(frase: String, dur: float) -> void:
	preto.modulate.a = 1.0
	texto.text = frase
	var t := create_tween().set_ignore_time_scale(true)
	t.tween_property(texto, "modulate:a", 1.0, 0.6)
	t.tween_interval(maxf(dur - 1.1, 0.1))
	t.tween_property(texto, "modulate:a", 0.0, 0.5)
	await _esperar(dur)


func _abrir(dur: float) -> void:
	var t := create_tween().set_ignore_time_scale(true)
	t.tween_property(preto, "modulate:a", 0.0, dur)


func _fechar(dur: float) -> void:
	var t := create_tween().set_ignore_time_scale(true)
	t.tween_property(preto, "modulate:a", 1.0, dur)
	await _esperar(dur)


func _clarao(forca: float) -> void:
	branco.modulate.a = forca
	var t := create_tween().set_ignore_time_scale(true)
	t.tween_property(branco, "modulate:a", 0.0, 0.35)


func _esperar(seg: float) -> void:
	for i in int(round(seg * FPS)):
		await get_tree().process_frame
