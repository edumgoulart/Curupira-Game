extends SceneTree
## Teste headless das animações de tiro e dos especiais do Curupira, na arena da Mula.
##   1. Bola de Fogo (1,5 tiro/s) com o botão segurado: o coice (quadro 0) só aparece nos tiros e,
##      entre um tiro e outro, a pose fica parada no último quadro.
##   2. Mira travada para cima sem atirar: pose de tiro parada, sem mexer a mão.
##   3. Correndo e atirando: o coice troca de animação sem a passada recomeçar.
##   4. Os quatro especiais na frente, na diagonal para cima, para cima e agachado: a animação certa,
##      o golpe saindo na direção da mira e a volta ao controle.
## Imprime "FALHOU" em cada conferência que não bate e "FIM" no final.
##   godot --headless --path game --fixed-fps 60 --disable-vsync --script res://testes/teste_especiais.gd

const ESPECIAIS := ["instinto_selvagem", "canhao_flamejante", "pocao_maldita", "bolha_abissal"]
const MIRAS := ["frente", "diag_cima", "cima", "agachado"]

var _nivel: Node
var _cur: Node
var _chefe: Node
var _quadro: int = 0
var _passo: int = 0
var _t: int = 0
var _falhas: int = 0
var _log: Array = []
var _caso: int = 0
var _golpe_visto: bool = false
var _anims_vistas: Dictionary = {}


func _initialize() -> void:
	var gs: Node = root.get_node("GameState")
	gs.basico_equipado = "res://dados/ataques/bola_de_fogo.tres"
	gs.especial_equipado = "res://dados/ataques/instinto_selvagem.tres"
	_nivel = load("res://scenes/level1.tscn").instantiate()
	root.add_child(_nivel)
	current_scene = _nivel
	_cur = _nivel.find_child("Curupira", true, false)
	for n in _nivel.get_children():
		if n.has_method("limiares_fase"):
			_chefe = n


func _conferir(ok: bool, texto: String) -> void:
	print(("  ok      " if ok else "  FALHOU  ") + texto)
	if not ok:
		_falhas += 1


func _soltar() -> void:
	for a in ["move_left", "move_right", "crouch", "aim_up", "aim_lock", "jump", "attack_basic", "attack_special", "dash"]:
		Input.action_release(a)


func _physics_process(_delta: float) -> bool:
	_quadro += 1
	_t += 1
	_cur._tempo_invencivel = 999.0
	# O chefe não pode morrer nem atrapalhar a conta.
	_chefe.vida.atual = _chefe.vida.maximo
	_soltar()
	var spr: AnimatedSprite2D = _cur.sprite
	match _passo:
		0:  # espera o chão
			if _t > 60:
				_proximo()
		1:  # Bola de Fogo segurada por 2 s
			Input.action_press("attack_basic")
			_log.append([String(spr.animation), spr.frame])
			if _t >= 120:
				var zeros := 0
				var parado_no_fim := 0
				var entre := 0
				for i in range(1, _log.size()):
					if _log[i][1] == 0 and _log[i - 1][1] != 0:
						zeros += 1
				# Depois do coice (0,2 s = 12 quadros), fica no último quadro até o próximo tiro.
				for i in range(20, 38):
					entre += 1
					if _log[i][0] == "atirar" and _log[i][1] == 3:
						parado_no_fim += 1
				_conferir(zeros >= 2 and zeros <= 4, "coices em 2 s de Bola de Fogo (1,5/s): %d" % zeros)
				_conferir(parado_no_fim == entre, "entre os tiros a mão fica firme no último quadro (%d/%d)" % [parado_no_fim, entre])
				_proximo()
		2:  # mira travada para cima, sem atirar
			Input.action_press("aim_lock")
			Input.action_press("aim_up")
			if _t > 10:
				_log.append([String(spr.animation), spr.frame])
			if _t >= 50:
				var iguais := _log.filter(func(e): return e[0] == "atirar_cima" and e[1] == 3).size()
				_conferir(iguais == _log.size(), "mira travada sem atirar: pose parada (%d/%d quadros em atirar_cima/3)" % [iguais, _log.size()])
				_proximo()
		3:  # correndo e atirando: o coice troca sem recomeçar a passada
			Input.action_press("move_right" if (_quadro / 120) % 2 == 0 else "move_left")
			Input.action_press("attack_basic")
			_log.append([String(spr.animation), spr.frame])
			if _t >= 100:
				var trocas := 0
				var saltos := 0
				for i in range(1, _log.size()):
					var a: String = _log[i - 1][0]
					var b: String = _log[i][0]
					if a != b and a.begins_with("correr") and b.begins_with("correr"):
						trocas += 1
						# a passada segue: mesmo quadro ou o seguinte
						var d: int = (_log[i][1] - _log[i - 1][1] + 6) % 6
						if d > 1:
							saltos += 1
				_conferir(trocas >= 2, "correndo, o coice liga e desliga (%d trocas)" % trocas)
				_conferir(saltos == 0, "correndo, a passada não pula de quadro na troca (%d saltos)" % saltos)
				_proximo()
		4:  # especiais
			var esp: int = _caso / MIRAS.size()
			var mira: String = MIRAS[_caso % MIRAS.size()]
			if _t == 1:
				_cur.atirador.especial = load("res://dados/ataques/%s.tres" % ESPECIAIS[esp])
				_cur.carga.adicionar(1000)
				_golpe_visto = false
				_anims_vistas = {}
			# Segura a mira antes e durante o aperto (agachar leva uns quadros).
			if _t < 40:
				match mira:
					"diag_cima":
						Input.action_press("aim_up"); Input.action_press("move_right")
					"cima":
						Input.action_press("aim_up")
					"agachado":
						Input.action_press("crouch")
				if _t == 30:
					Input.action_press("attack_special")
			if _cur.estado == 6:  # Estado.ESPECIAL
				_anims_vistas[String(spr.animation)] = true
			if not _golpe_visto:
				_procurar_golpe(esp, mira)
			if _t >= 220:
				var tipo: String = _cur.atirador.especial.animacao
				var base := "especial_%s_%s" % [tipo, mira]
				_conferir(_anims_vistas.has(base + "_inicio") and _anims_vistas.has(base + "_fim"),
					"%s %s: animações %s" % [ESPECIAIS[esp], mira, ", ".join(_anims_vistas.keys())])
				_conferir(_golpe_visto, "%s %s: golpe saiu na direção certa" % [ESPECIAIS[esp], mira])
				_conferir(_cur.estado != 6, "%s %s: voltou ao controle" % [ESPECIAIS[esp], mira])
				_caso += 1
				_t = 0
				if _caso >= ESPECIAIS.size() * MIRAS.size():
					_proximo()
		5:  # interromper a volta andando
			if _t == 1:
				_cur.atirador.especial = load("res://dados/ataques/instinto_selvagem.tres")
				_cur.carga.adicionar(1000)
				Input.action_press("attack_special")
			# O preparo dura 0,2 s; depois do golpe, andar devolve o controle na hora.
			if _t > 16:
				Input.action_press("move_right")
			if _t == 24:
				_conferir(_cur.estado != 6, "andar interrompe a volta do especial (estado %d)" % _cur.estado)
				_proximo()
		6:
			print("FIM", "  (", _falhas, " falhas)")
			quit()
	return false


func _proximo() -> void:
	_passo += 1
	_t = 0
	_log = []
	print("-- passo ", _passo)


## Procura o golpe do especial: um projétil novo com o dano do especial, ou o feixe no Atirador.
## Confere a direção: frente e agachado retos; diagonal e cima subindo.
func _procurar_golpe(_esp: int, mira: String) -> void:
	var dados: Resource = _cur.atirador.especial
	var angulo_esperado: float = {"frente": 0.0, "agachado": 0.0, "diag_cima": -45.0, "cima": -90.0}[mira]
	for filho in _cur.atirador.get_children():
		if _classe(filho) == &"FeixeCanhao":
			var esperado: float = deg_to_rad(angulo_esperado * _cur.olhando_para)
			_golpe_visto = absf(filho.rotation - esperado) < 0.01
			if not _golpe_visto:
				print("    feixe com rotação ", rad_to_deg(filho.rotation), " (esperado ", angulo_esperado, ")")
			return
	for n in _nivel.get_children():
		if _classe(n) == &"Projetil" and n.dano == dados.dano and n.get_meta("visto", false) == false:
			n.set_meta("visto", true)
			_golpe_visto = is_equal_approx(n.angulo_mira, angulo_esperado)
			if not _golpe_visto:
				print("    projétil com ângulo ", n.angulo_mira, " (esperado ", angulo_esperado, ")")
			return


# Sem citar as classes pelo nome: no modo --script este arquivo compila antes dos autoloads, e o
# Projetil puxa o Chefe, que puxa o GameState.
func _classe(n: Node) -> StringName:
	var s: Script = n.get_script()
	return s.get_global_name() if s else &""
