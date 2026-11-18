extends SceneTree
## Teste das cenas de abertura (headless): A avança uma cena por vez, dois apertos seguidos
## durante a troca contam um só, a última cena leva ao mapa e Start pula direto para o mapa.
## Tira um print de cada cena se FOTOS estiver ligado (precisa de tela, ex.: xvfb-run).

const CENA: String = "res://scenes/abertura.tscn"

var frame := 0
var etapa := 0
var espera := 0
var fotos := OS.get_environment("FOTOS") != ""
var pasta := OS.get_environment("PASTA_FOTOS")
var falhas := 0


func _initialize() -> void:
	_abrir()


func _abrir() -> void:
	var cena: Node = load(CENA).instantiate()
	root.add_child(cena)
	current_scene = cena


func _apertar(acao: String) -> void:
	var ev := InputEventAction.new()
	ev.action = acao
	ev.pressed = true
	Input.parse_input_event(ev)
	var solta := InputEventAction.new()
	solta.action = acao
	solta.pressed = false
	Input.parse_input_event(solta)


func _ok(cond: bool, txt: String) -> void:
	print(("OK   " if cond else "FALHA ") + txt)
	if not cond:
		falhas += 1


func _foto(nome: String) -> void:
	if fotos:
		root.get_texture().get_image().save_png("%s/%s.png" % [pasta, nome])


func _process(_d: float) -> bool:
	frame += 1
	if espera > 0:
		espera -= 1
		return false
	var cena: Node = current_scene
	match etapa:
		0:
			_ok(cena.name == "Abertura", "abre a abertura")
			_ok(cena.indice == 0, "começa na cena 1")
			_ok(cena.get_node("%Imagem").texture != null, "a imagem da cena 1 está na tela")
			_ok(cena.get_node("%Texto").text.begins_with("O Curupira"), "texto da cena 1: " + cena.get_node("%Texto").text)
			etapa = 1
			espera = 30
		1, 2, 3:
			_foto("abertura_%d" % etapa)
			_apertar("ui_accept")
			if etapa == 1:
				# segundo aperto no meio da troca: não pode pular a cena 2
				_apertar("ui_accept")
			etapa += 1
			espera = 30
			_ok(cena.indice == etapa - 2, "A na cena %d" % (etapa - 1))
		4:
			_ok(cena.indice == 3, "chegou na cena 4 sem pular nenhuma (indice %d)" % cena.indice)
			_foto("abertura_4")
			_apertar("ui_accept")
			etapa = 5
			espera = 40
		5:
			_ok(cena.name == "Mapa" or cena.scene_file_path.ends_with("mapa.tscn"), "A na última cena leva ao mapa (%s)" % cena.scene_file_path)
			# de novo, agora pulando com Start
			cena.queue_free()
			_abrir()
			etapa = 6
			espera = 10
		6:
			_apertar("pause")
			etapa = 7
			espera = 10
		7:
			_ok(cena.scene_file_path.ends_with("mapa.tscn"), "Start pula direto para o mapa (%s)" % cena.scene_file_path)
			print("FALHAS: %d" % falhas)
			return true
	return false
