extends SceneTree
## Teste de regressão (headless): os tiros dos chefes que somem ao bater num corpo têm que dar
## dano no Curupira. O bug era o tiro encostar primeiro no corpo dele (maior que a hurtbox),
## sumir e não dar dano (Hitbox.e_mundo). Lança cada tiro várias vezes contra o Curupira, de pé,
## agachado e caindo, variando a posição de saída para mudar o quadro em que ele encosta.
##
## Rodar numa cópia de game/ (ou com o editor fechado):
##   godot --headless --fixed-fps 60 --disable-vsync --path game --script res://testes/teste_dano_projeteis.gd

const CHAO: float = 340.0
const X_CURUPIRA: float = -540.0
const DESLOCAMENTOS := [0.0, 2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0]

var _falhas: int = 0


func _initialize() -> void:
	_rodar.call_deferred()


func _rodar() -> void:
	# [nome, cena, altura do centro acima do chão, velocidade, pose do Curupira]
	var casos := [
		["bola baixa, de pé", "res://scenes/bola_de_fogo_mula.tscn", 60.0, 700.0, "pe"],
		["bola alta, de pé", "res://scenes/bola_de_fogo_mula.tscn", 140.0, 700.0, "pe"],
		["bola baixa, agachado", "res://scenes/bola_de_fogo_mula.tscn", 60.0, 700.0, "agachado"],
		["bola baixa, caindo", "res://scenes/bola_de_fogo_mula.tscn", 60.0, 700.0, "caindo"],
		["onda, de pé", "res://scenes/onda_fogo_mula.tscn", 0.0, 800.0, "pe"],
		["onda, agachado", "res://scenes/onda_fogo_mula.tscn", 0.0, 800.0, "agachado"],
		["onda, caindo", "res://scenes/onda_fogo_mula.tscn", 0.0, 800.0, "caindo"],
		["bolha do Boto, de pé", "res://scenes/bolha_boto.tscn", 0.0, 0.0, "pe"],
	]
	for c in casos:
		var acertos: int = 0
		for d in DESLOCAMENTOS:
			if await _caso(c[1], c[2], c[3], c[4], d):
				acertos += 1
		var ok: bool = acertos == DESLOCAMENTOS.size()
		if not ok:
			_falhas += 1
		print("  %-24s %d/%d %s" % [c[0], acertos, DESLOCAMENTOS.size(), "ok" if ok else "FALHOU"])
	print("FIM: %s" % ("tudo ok" if _falhas == 0 else "%d caso(s) falharam" % _falhas))
	quit(1 if _falhas > 0 else 0)


## true se o tiro tirou vida do Curupira.
func _caso(cena: String, altura: float, velocidade: float, pose: String, deslocamento: float) -> bool:
	var nivel: Node = load("res://scenes/level1.tscn").instantiate()
	root.add_child(nivel)
	current_scene = nivel
	# Para o chefe: só o tiro de teste pode machucar.
	for n in nivel.get_children():
		if n.has_method("_executar"):
			n.derrotado = true
			n.process_mode = Node.PROCESS_MODE_DISABLED
	var curupira: Node2D = nivel.get_node("Curupira")
	for i in 20:
		await physics_frame
	var vida_antes: int = curupira.vida.atual
	if pose == "agachado":
		Input.action_press(&"crouch")
	for i in 5:
		await physics_frame
	var tiro: Node2D = load(cena).instantiate()
	if pose == "caindo":
		# Pula e solta o tiro para chegar quando ele já está descendo.
		Input.action_press(&"jump")
		await physics_frame
		Input.action_release(&"jump")
	if velocidade > 0.0:
		var distancia: float = (velocidade + 0.0) * (0.62 if pose == "caindo" else 0.4)
		tiro.global_position = Vector2(curupira.global_position.x + distancia + deslocamento, CHAO - altura)
		tiro.lancar(-1.0, velocidade)
	else:
		# Bolha do Boto: desce reta (sem balanço) em cima da cabeça do Curupira.
		tiro.balanco = 0.0
		tiro.global_position = Vector2(curupira.global_position.x + deslocamento - 7.0, CHAO - 320.0)
	nivel.add_child(tiro)
	for i in 90:
		await physics_frame
	Input.action_release(&"crouch")
	var acertou: bool = curupira.vida.atual < vida_antes
	nivel.queue_free()
	current_scene = null
	await physics_frame
	return acertou
