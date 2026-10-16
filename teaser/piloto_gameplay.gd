extends Node
## TEMPORÁRIO (não faz parte do jogo): piloto automático para gravar gameplay da Mula.
## Roda como autoload via override.cfg. Argumentos (depois de --): "hud" ou "limpo".
## A Mula luta normalmente (ataques sorteados); o piloto desvia, atira e usa o especial.

const FASE := "res://scenes/level1.tscn"
const CASA_X := -330.0          # onde ele gosta de ficar
const LIMITE_DIREITA := -60.0   # passou daqui, volta para a casa

var com_hud := true
var cena: Node
var cur: CharacterBody2D
var mula: Node2D
var segurar: Dictionary = {}
var indice_bola: Dictionary = {}
var ultima_bola_t := -10.0
var contagem_volley := 0
var t := 0.0
var golpes := 0
var voltando := false
var proximo_pulo_livre := 2.0
var fim_t := -1.0
var sorteio := RandomNumberGenerator.new()


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	sorteio.seed = 6
	var args := OS.get_cmdline_user_args()
	com_hud = not args.has("limpo")
	get_tree().change_scene_to_file.call_deferred(FASE)


func _physics_process(delta: float) -> void:
	if cena == null:
		var c := get_tree().current_scene
		if c == null or c.scene_file_path != FASE or not c.is_node_ready():
			return
		cena = c
		cur = cena.get_node("Curupira")
		mula = cena.get_node("Mula")
		cena.get_node("HUD").visible = com_hud
		cur.vida.vida_mudou.connect(func(_a: int, _m: int) -> void: golpes += 1)
		cur.hurtbox.golpe_recebido.connect(func(n: int, de: Node) -> void:
			print("  golpe t=%.2f x=%.0f y=%.0f estado=%d de=%s (%.0f,%.0f) n=%d chao=%s mula=%d" % [t, cur.global_position.x, cur.global_position.y, cur.estado, de.name, de.global_position.x, de.global_position.y, n, cur.is_on_floor(), mula.estado]))
	t += delta
	if get_tree().paused:
		# Tela de vitória aberta: grava mais um pouco e encerra.
		if fim_t < 0.0:
			fim_t = Time.get_ticks_msec()
			print("GAMEPLAY: vitória em ", snappedf(t, 0.1), " s; golpes levados = ", golpes)
			_esperar_e_sair()
		return
	if cur.estado == cur.Estado.DERROTADO:
		print("GAMEPLAY: Curupira derrotado em ", t)
		get_tree().quit()
		return
	if mula.derrotado:
		_soltar_tudo()
		return
	_pilotar()
	_aplicar_entradas()


func _esperar_e_sair() -> void:
	for i in 150:
		await get_tree().process_frame
	get_tree().quit()


func _pilotar() -> void:
	var x: float = cur.global_position.x
	var no_chao: bool = cur.is_on_floor()
	var dash_pronto: bool = cur._tempo_recarga_dash <= 0.0 and cur.estado != cur.Estado.DASH
	var ocupado: bool = cur.estado == cur.Estado.DASH or segurar.has("jump") or segurar.has("dash")

	# Bolas de fogo: numera dentro de cada leva de três.
	var bolas: Array = []
	for no in get_tree().get_nodes_in_group("ataques_chefe"):
		if no is BolaDeFogoMula:
			if not indice_bola.has(no):
				if t - ultima_bola_t > 0.7:
					contagem_volley = 0
				indice_bola[no] = contagem_volley
				contagem_volley += 1
				ultima_bola_t = t
			bolas.append(no)
	var meteoros: Array = get_tree().get_nodes_in_group("ataques_chefe").filter(
		func(n: Node) -> bool: return n is Meteoro)

	# 1) Meteoro em cima: foge para o centro (longe da parede), com dash se der.
	for m in meteoros:
		if absf(m.global_position.x - x) < 260.0:
			var dx_m: float = x - m.global_position.x
			var lado: float = signf(dx_m) if absf(dx_m) > 20.0 else (1.0 if x < 120.0 else -1.0)
			if lado > 0.0 and x > 200.0:
				lado = -1.0  # a Mula está ali
			elif lado < 0.0 and x < -760.0:
				lado = 1.0   # parede
			_mover(lado, 4)
			if no_chao and dash_pronto and not ocupado:
				segurar["dash"] = 2
			_atirar(lado > 0.0)
			return

	# 2) Bola chegando pela frente: pula (as duas primeiras) ou atravessa com dash (a terceira).
	var mais_perto: Node2D = null
	var menor := INF
	for b in bolas:
		var dx: float = b.global_position.x - x
		if dx > 25.0 and dx < menor:
			menor = dx
			mais_perto = b
	# Caindo em cima de uma bola: dash no ar (invencível) para atravessar.
	if mais_perto and menor < 120.0 and not no_chao and cur.velocity.y > 0.0 \
			and cur._dash_aereo_disponivel and dash_pronto and not segurar.has("dash"):
		if cur.olhando_para != 1:
			_mover(1.0, 1)
		segurar["dash"] = 2
	if mais_perto and menor < 170.0 and no_chao and not ocupado:
		var idx: int = indice_bola.get(mais_perto, 0)
		if idx >= 2 and dash_pronto:
			if cur.olhando_para != 1:
				_mover(1.0, 1)
			segurar["dash"] = 2
		else:
			segurar["jump"] = 26
	if mais_perto and menor < 600.0:
		voltando = false
		_atirar(true)
		return

	# Meteoro caindo longe: fica parado atirando (não anda para perto dele).
	if not meteoros.is_empty():
		if cur.olhando_para != 1:
			_mover(1.0, 1)
		_atirar(true)
		return

	# 3) Sem perigo: volta para a casa, usa o especial, dá uns pulos atirando.
	if x > LIMITE_DIREITA:
		voltando = true
	if voltando:
		if x > CASA_X + 30.0:
			_mover(-1.0, 1)
			if no_chao and dash_pronto and not ocupado and x > CASA_X + 250.0 and sorteio.randf() < 0.05:
				segurar["dash"] = 2
			_atirar(false)
			return
		voltando = false
	if cur.olhando_para != 1:
		_mover(1.0, 1)
	if cur.carga.esta_cheia() and bolas.is_empty() and no_chao and not ocupado:
		segurar["attack_special"] = 2
	elif t > proximo_pulo_livre and no_chao and not ocupado and bolas.is_empty() \
			and (mula.estado == mula.Estado.ESPERANDO or mula.estado == mula.Estado.PARADA):
		segurar["jump"] = sorteio.randi_range(10, 26)
		proximo_pulo_livre = t + sorteio.randf_range(1.5, 3.5)
	_atirar(true)


func _mover(lado: float, ticks: int) -> void:
	segurar["move_right" if lado > 0.0 else "move_left"] = ticks
	segurar.erase("move_left" if lado > 0.0 else "move_right")
	Input.action_release("move_left" if lado > 0.0 else "move_right")


func _atirar(sim: bool) -> void:
	if sim:
		Input.action_press("attack_basic")
	else:
		Input.action_release("attack_basic")


func _aplicar_entradas() -> void:
	for acao in segurar.keys():
		if segurar[acao] > 0:
			if not Input.is_action_pressed(acao):
				Input.action_press(acao)
			segurar[acao] -= 1
		else:
			Input.action_release(acao)
			segurar.erase(acao)


func _soltar_tudo() -> void:
	segurar.clear()
	for acao in ["move_left", "move_right", "jump", "dash", "attack_basic", "attack_special"]:
		Input.action_release(acao)
