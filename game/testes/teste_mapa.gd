extends SceneTree
## Teste do mapa do mundo (headless): anda com o Curupira, confere as entradas das quatro áreas,
## o painel abrindo e o portão trancado bloqueando. Depois abre o mapa com os três seres
## libertados: confere o fogo e a névoa sumindo, as criaturas, a conversa com cada uma e a copa
## da samaúma ficando translúcida com o Curupira atrás. Tira prints se FOTOS estiver ligado.

var mapa: Node
var cur: Node2D
var cen: Node2D
var gs: Node
var frame := 0
var etapa := 0
var ids := ["mula", "cuca", "boto", "maquina"]
var i_id := 0
var passos := 0
var fotos := OS.get_environment("FOTOS") != ""
var pasta := OS.get_environment("PASTA_FOTOS")
var falhas := 0


func _initialize() -> void:
	gs = root.get_node("GameState")
	gs.entrada_mapa = ""
	mapa = load("res://scenes/mapa.tscn").instantiate()
	root.add_child(mapa)


func _foto(nome: String) -> void:
	if fotos:
		root.get_texture().get_image().save_png("%s/%s.png" % [pasta, nome])


func _ok(cond: bool, txt: String) -> void:
	print(("OK   " if cond else "FALHA ") + txt)
	if not cond:
		falhas += 1


func _soltar() -> void:
	for a in ["move_left", "move_right", "aim_up", "crouch"]:
		Input.action_release(a)


func _process(_d: float) -> bool:
	frame += 1
	if frame == 3:
		cur = mapa.get_node("Mundo/Curupira")
		cen = mapa.get_node("Mundo")
		print("inicio ", cur.position, " objetos ", cen.get_child_count())
		_ok(cen.pode_andar(cur.position), "ponto de partida é chão")
	if frame == 8:
		_foto("mapa_inicio")
		etapa = 1
		passos = 0
		Input.action_press("crouch")
	if etapa == 1:
		passos += 1
		if passos == 1:
			set_meta("p0", cur.position)
		if passos == 40:
			_soltar()
			_ok(cur.position.y > get_meta("p0").y + 20, "anda para baixo (%s -> %s), anim %s" % [get_meta("p0"), cur.position, cur.get_node("Sprite").animation])
			_foto("mapa_andando")
			etapa = 2
			_ir_para(ids[0])
	elif etapa == 2:
		# anda em direção ao centro da entrada até chegar ou desistir
		var id: String = ids[i_id]
		var e: Dictionary = cen.dados.entradas[id]
		var alvo := Vector2(e.centro[0], e.centro[1]) * 4.0
		var d := alvo - cur.position
		_soltar()
		if d.x > 6: Input.action_press("move_right")
		elif d.x < -6: Input.action_press("move_left")
		if d.y > 6: Input.action_press("crouch")
		elif d.y < -6: Input.action_press("aim_up")
		passos += 1
		var area: String = cen.entrada_em(cur.position)
		if area == id or passos > 400:
			_soltar()
			_ok(area == id, "chega na entrada %s em %d quadros (pos %s, área '%s', aviso '%s')" % [id, passos, cur.position / 4.0, area, mapa.get_node("%Aviso").text.replace("\n", " | ")])
			_foto("area_" + id)
			if id == "mula":
				etapa = 3
				passos = 0
			else:
				_proxima()
	elif etapa == 3:
		passos += 1
		if passos == 3:
			_apertar("ui_accept")
		if passos == 10:
			var painel: CanvasLayer = mapa.get_node("PainelFase")
			_ok(painel.visible and paused, "A abre o painel da Mula (título '%s', situação '%s')" % [painel.get_node("%Titulo").text, painel.get_node("%Situacao").text])
			_foto("painel_mula")
			_apertar("ui_cancel")
		if passos == 16:
			_ok(not mapa.get_node("PainelFase").visible and not paused, "B fecha o painel")
			_proxima()
	elif etapa == 9:
		# portão: trancado bloqueia, aberto deixa passar
		var r: Array = cen.dados.portao.retangulo
		var meio := Vector2((r[0] + r[2]) / 2.0, (r[1] + r[3]) / 2.0) * 4.0
		cen._portao_trancado = true
		_ok(not cen.pode_andar(meio), "portão trancado bloqueia")
		_ok(cen.perto_do_portao_trancado(Vector2(cen.dados.portao.aviso[0], cen.dados.portao.aviso[1]) * 4.0), "aviso do portão trancado")
		cen._portao_trancado = false
		_ok(cen.pode_andar(meio), "portão aberto deixa passar")
		# antes de libertar: fogo e névoa no mapa, nenhuma criatura
		_ok(cen.has_node("FogoMata") and cen.has_node("Nevoa") and not cen.has_node("MulaLivre"), "antes: fogo e névoa, sem criaturas")
		_ok(cen.conversa_em(Vector2(cen.dados.conversas.mula.centro[0], cen.dados.conversas.mula.centro[1]) * 4.0) == "", "antes: não dá para conversar")
		# de novo, com os três libertados
		mapa.queue_free()
		gs.concluidas.assign(["fase1", "fase2", "fase3"])
		mapa = load("res://scenes/mapa.tscn").instantiate()
		root.add_child(mapa)
		etapa = 10
		passos = 0
	elif etapa == 10:
		passos += 1
		if passos == 3:
			cur = mapa.get_node("Mundo/Curupira")
			cen = mapa.get_node("Mundo")
			_ok(not cen.has_node("FogoMata") and not cen.has_node("Nevoa") and cen.has_node("Brotos"), "depois: o fogo apagou, a névoa levantou e brotou mato")
			_ok(cen.has_node("MulaLivre") and cen.has_node("CucaLivre") and cen.has_node("BotoLivre"), "depois: as três criaturas no mapa")
			etapa = 11
			i_id = 0
			passos = 0
	elif etapa == 11:
		# conversa com cada criatura: A abre, A mostra o texto inteiro e passa, até fechar
		var id: String = ["mula", "cuca", "boto"][i_id]
		passos += 1
		if passos == 1:
			var c: Dictionary = cen.dados.conversas[id]
			cur.position = Vector2(c.centro[0], c.centro[1]) * 4.0
			mapa.get_node("Camera").position = cur.position
		if passos == 4:
			_ok(cen.pode_andar(cur.position), "%s: dá para pisar onde se conversa" % id)
			_ok(mapa.get_node("%Aviso").text.ends_with("conversar"), "%s: aviso '%s'" % [id, mapa.get_node("%Aviso").text.replace("\n", " | ")])
			_apertar("ui_accept")
		if passos == 30:
			var dl: Node = mapa.get_node("DialogoMapa")
			_ok(dl.aberto and dl.visible, "%s: A abre a conversa ('%s: %s')" % [id, dl.get_node("%Quem").text, dl.get_node("%Texto").text])
			_ok(cur.estado == cur.Estado.TRAVADO, "%s: o Curupira fica parado conversando" % id)
			_foto("conversa_" + id)
		if passos > 30 and passos % 6 == 0:
			_apertar("ui_accept")
		if passos > 30 and not mapa.get_node("DialogoMapa").aberto:
			_ok(cur.estado != cur.Estado.TRAVADO and passos < 200, "%s: a conversa termina e o Curupira anda de novo (%d quadros)" % [id, passos])
			i_id += 1
			passos = 0
			if i_id >= 3:
				etapa = 12
	elif etapa == 12:
		passos += 1
		var sam: Sprite2D = cen.get_node("Samauma")
		if passos == 1:
			cur.position = sam.position + Vector2(0, -40)
		if passos == 40:
			_ok(sam.modulate.a < 0.6, "copa da samaúma translúcida com o Curupira atrás (alfa %.2f)" % sam.modulate.a)
			_foto("atras_da_samauma")
			cur.position = sam.position + Vector2(0, 60)
		if passos == 80:
			_ok(sam.modulate.a > 0.95, "copa volta ao normal com o Curupira na frente (alfa %.2f)" % sam.modulate.a)
			print("FALHAS: ", falhas)
			quit(1 if falhas else 0)
	return false


## Evento de verdade (action_press só muda o estado, não chega no _unhandled_input).
func _apertar(acao: String) -> void:
	for apertado in [true, false]:
		var ev := InputEventAction.new()
		ev.action = acao
		ev.pressed = apertado
		Input.parse_input_event(ev)


func _ir_para(id: String) -> void:
	# começa da volta da área (onde o Curupira aparece depois da luta)
	cur.position = cen.ponto_de_partida(id)
	mapa.get_node("Camera").position = cur.position
	passos = 0


func _proxima() -> void:
	i_id += 1
	if i_id >= ids.size():
		etapa = 9
		return
	etapa = 2
	_ir_para(ids[i_id])
