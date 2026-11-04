extends SceneTree
## Teste de fumaça das lutas (headless). Roda as quatro arenas por 60 s cada: o Curupira
## fica invencível, anda, agacha, mira, pula, atira e dá dash; o chefe perde vida aos poucos
## para passar pelas três fases. Imprime as trocas de fase e os ataques que apareceram.
## Qualquer erro de script aparece no log. Rodar com o editor fechado (ou numa cópia de game/):
##   godot --headless --path game --script res://testes/teste_lutas.gd

const FASES := ["res://scenes/level1.tscn", "res://scenes/level2.tscn", "res://scenes/level3.tscn", "res://scenes/level4.tscn"]
const QUADROS_POR_FASE := 3600
# Um ataque básico e um especial diferentes por arena, para testar todos (sem salvar o save).
const BASICOS := ["tiro_de_folha", "bola_de_fogo", "feitico_perseguidor", "bolha_agua"]
const ESPECIAIS := ["instinto_selvagem", "canhao_flamejante", "pocao_maldita", "bolha_abissal"]

var _i: int = -1
var _quadro: int = 0
var _nivel: Node
var _cur: Node
var _chefe: Node
var _vistos: Dictionary = {}

func _initialize() -> void:
	_proxima()

func _proxima() -> void:
	if _nivel:
		print("  ataques vistos: ", _vistos.keys(), "  fase final: ", _chefe.fase if _chefe else -1)
		_nivel.queue_free()
	_i += 1
	_quadro = 0
	_vistos = {}
	if _i >= FASES.size():
		print("FIM")
		quit()
		return
	paused = false
	print("== ", FASES[_i], "  (", BASICOS[_i], " + ", ESPECIAIS[_i], ")")
	var game_state: Node = root.get_node("GameState")
	game_state.basico_equipado = "res://dados/ataques/%s.tres" % BASICOS[_i]
	game_state.especial_equipado = "res://dados/ataques/%s.tres" % ESPECIAIS[_i]
	_nivel = load(FASES[_i]).instantiate()
	root.add_child(_nivel)
	current_scene = _nivel
	_cur = _nivel.find_child("Curupira", true, false)
	for n in _nivel.get_children():
		if n is Chefe:
			_chefe = n
	_chefe.fase_mudou.connect(func(f): print("  fase -> ", f, " (quadro ", _quadro, ")"))

func _physics_process(_delta: float) -> bool:
	if _i >= FASES.size():
		return false
	_quadro += 1
	_cur._tempo_invencivel = 999.0
	var t := _quadro % 240
	_soltar_tudo()
	if t < 60: Input.action_press("move_right")
	elif t < 120: Input.action_press("move_left")
	elif t < 150: Input.action_press("crouch")
	elif t < 180: Input.action_press("aim_up"); Input.action_press("aim_lock")
	if _quadro % 90 == 0: Input.action_press("jump")
	if _quadro % 8 < 4: Input.action_press("attack_basic")
	if _quadro % 600 == 300: Input.action_press("attack_special")
	if _quadro % 400 == 399: Input.action_press("dash")
	if _chefe.ataque_atual != &"":
		_vistos[_chefe.ataque_atual] = true
	# Tira 1/40 da vida a cada 80 quadros: passa pelas fases em ~2800 quadros.
	# Os tiros também tiram; a vida não cai abaixo de 10%, para a luta não acabar.
	if _quadro % 80 == 0:
		_chefe.vida.perder(_chefe.vida.maximo / 40)
	_chefe.vida.atual = maxi(_chefe.vida.atual, _chefe.vida.maximo / 10)
	if _quadro >= QUADROS_POR_FASE:
		_proxima()
	return false

func _soltar_tudo() -> void:
	for a in ["move_left", "move_right", "crouch", "aim_up", "aim_lock", "jump", "attack_basic", "attack_special", "dash"]:
		Input.action_release(a)
