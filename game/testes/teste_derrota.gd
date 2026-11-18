extends SceneTree
## Teste da carta de derrota (headless): em cada arena, tira parte da vida do chefe, derruba o
## Curupira e confere se a carta aparece com o retrato, uma frase do chefe e a trilha no ponto
## certo. Tira um print de cada carta se FOTOS estiver ligado (precisa de tela, ex.: xvfb-run).

const ARENAS: Array[String] = ["res://scenes/level1.tscn", "res://scenes/level2.tscn", "res://scenes/level3.tscn", "res://scenes/level4.tscn"]
## Quanto da vida do chefe o jogador tirou em cada arena (para ver a trilha em pontos diferentes).
const TIRADO: Array[float] = [0.3, 0.55, 0.8, 0.45]

var etapa := 0
var arena := 0
var espera := 0
var fotos := OS.get_environment("FOTOS") != ""
var pasta := OS.get_environment("PASTA_FOTOS")
var falhas := 0


func _initialize() -> void:
	_abrir()


func _abrir() -> void:
	paused = false
	if current_scene != null:
		current_scene.queue_free()
	var cena: Node = load(ARENAS[arena]).instantiate()
	root.add_child(cena)
	current_scene = cena


func _ok(cond: bool, txt: String) -> void:
	print(("OK   " if cond else "FALHA ") + txt)
	if not cond:
		falhas += 1


func _foto(nome: String) -> void:
	if fotos:
		root.get_texture().get_image().save_png("%s/%s.png" % [pasta, nome])


func _process(_d: float) -> bool:
	if espera > 0:
		espera -= 1
		return false
	var tela: Node = current_scene.get_node("TelaDerrota")
	match etapa:
		0:
			_ok(tela.chefe != null, "%s: a tela de derrota conhece o chefe" % ARENAS[arena])
			var vida: Node = tela.chefe.get_node("Vida")
			vida.atual = int(round(vida.maximo * (1.0 - TIRADO[arena])))
			tela.curupira.derrotado.emit()
			etapa = 1
			espera = 200
		1:
			var dados: ChefeData = tela.chefe.dados
			_ok(tela.visible and paused, "a carta aparece e a luta congela")
			_ok(tela.get_node("%Retrato").texture == dados.retrato_derrota and dados.retrato_derrota != null, "retrato de %s" % dados.nome)
			var frase: String = tela.get_node("%Frase").text
			_ok(dados.frases_derrota.has(frase.trim_prefix("\"").trim_suffix("\"")), "frase do chefe: " + frase)
			var trilha: Node = tela.get_node("%Trilha")
			_ok(absf(trilha.progresso - TIRADO[arena]) < 0.02, "trilha em %.2f (esperado %.2f)" % [trilha.progresso, TIRADO[arena]])
			_ok(trilha.limiares.size() == tela.chefe.limiares_fase().size(), "entalhes das fases: %d" % trilha.limiares.size())
			_ok(tela.get_node("%TentarDeNovo").has_focus(), "foco em Tentar de novo")
			_foto("derrota_%d" % (arena + 1))
			arena += 1
			if arena >= ARENAS.size():
				print("FALHAS: %d" % falhas)
				return true
			_abrir()
			etapa = 0
			espera = 30
	return false
