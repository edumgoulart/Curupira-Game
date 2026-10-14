extends Control
## Seleção de fase (GDD): escolhe o ataque básico, o especial e o chefe, na mesma tela.
## Os ataques são escolhidos aqui e ficam travados durante a luta.
## Só aparecem os ataques liberados: os iniciais + os dos chefes já derrotados
## (campo fase_que_libera de cada ataque no catálogo).
##
## Ids de progresso no GameState: fase1 = Mula sem Cabeça, fase2 = Cuca,
## fase3 = Boto cor-de-rosa, boss = Máquina (liberada depois dos três).

const CENA_MULA: String = "res://scenes/level1.tscn"
const CENA_CUCA: String = "res://scenes/level2.tscn"
const CENA_BOTO: String = "res://scenes/level3.tscn"
const CENA_MAQUINA: String = "res://scenes/level4.tscn"
const CATALOGO: CatalogoAtaques = preload("res://dados/ataques/catalogo.tres")

var _basicos: Array[AtaqueData] = []
var _especiais: Array[EspecialData] = []
var _i_basico: int = 0
var _i_especial: int = 0

@onready var mula: Button = %Mula
@onready var cuca: Button = %Cuca
@onready var boto: Button = %Boto
@onready var maquina: Button = %Maquina
@onready var basico: Button = %Basico
@onready var especial: Button = %Especial
@onready var detalhe_basico: Label = %DetalheBasico
@onready var detalhe_especial: Label = %DetalheEspecial
@onready var aviso: Label = %AtaquesAviso


func _ready() -> void:
	if GameState.concluiu("fase1"):
		mula.text += "  (derrotada)"
	if GameState.concluiu("fase2"):
		cuca.text += "  (derrotada)"
	if GameState.concluiu("fase3"):
		boto.text += "  (derrotado)"
	# A Máquina (chefe final) só libera depois dos três (GDD).
	if GameState.boss_liberado():
		maquina.disabled = false
		maquina.text = "Máquina de IA" + ("  (derrotada)" if GameState.zerou() else "")
		maquina.pressed.connect(func() -> void: get_tree().change_scene_to_file(CENA_MAQUINA))

	_basicos.assign(CATALOGO.basicos.filter(func(a: AtaqueData) -> bool: return GameState.liberado(a.fase_que_libera)))
	_especiais.assign(CATALOGO.especiais.filter(func(e: EspecialData) -> bool: return GameState.liberado(e.fase_que_libera)))
	_i_basico = _indice_equipado(_basicos, GameState.basico_equipado)
	_i_especial = _indice_equipado(_especiais, GameState.especial_equipado)
	aviso.visible = _basicos.size() < CATALOGO.basicos.size() or _especiais.size() < CATALOGO.especiais.size()

	# A (ou clique) troca para o próximo; ◀ / ▶ no direcional troca para os lados.
	basico.pressed.connect(_trocar_basico.bind(1))
	especial.pressed.connect(_trocar_especial.bind(1))
	basico.gui_input.connect(_setas.bind(_trocar_basico))
	especial.gui_input.connect(_setas.bind(_trocar_especial))
	_atualizar_textos()

	# Foco no primeiro chefe: dá para entrar direto na luta com o controle.
	mula.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	# B no controle / Esc no teclado volta para o menu principal.
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_on_voltar_pressed()


## Posição do ataque equipado na lista de liberados; se não estiver (ou não houver escolha), o primeiro.
func _indice_equipado(lista: Array, caminho: String) -> int:
	for i in lista.size():
		if lista[i].resource_path == caminho:
			return i
	return 0


func _setas(event: InputEvent, trocar: Callable) -> void:
	if event.is_action_pressed("ui_left"):
		trocar.call(-1)
		accept_event()  # impede o foco de pular para outro botão
	elif event.is_action_pressed("ui_right"):
		trocar.call(1)
		accept_event()


func _trocar_basico(passo: int) -> void:
	if _basicos.size() < 2:
		return
	_i_basico = wrapi(_i_basico + passo, 0, _basicos.size())
	_salvar_escolha()


func _trocar_especial(passo: int) -> void:
	if _especiais.size() < 2:
		return
	_i_especial = wrapi(_i_especial + passo, 0, _especiais.size())
	_salvar_escolha()


func _salvar_escolha() -> void:
	GameState.equipar(_basicos[_i_basico].resource_path, _especiais[_i_especial].resource_path)
	_atualizar_textos()


func _atualizar_textos() -> void:
	var b: AtaqueData = _basicos[_i_basico]
	var e: EspecialData = _especiais[_i_especial]
	basico.text = "Básico: " + _com_setas(b.nome, _basicos.size())
	especial.text = "Especial: " + _com_setas(e.nome, _especiais.size())
	detalhe_basico.text = "%d de dano · %s tiros/s · +%d de carga por acerto" % [b.dano, _numero(b.tiros_por_segundo), b.carga_por_acerto]
	if b.curva > 0.0:
		detalhe_basico.text += " · persegue o chefe"
	if e.duracao_disparo > 0.0:
		detalhe_especial.text = "até %d de dano em %s s · fica parado disparando" % [e.dano, _numero(e.duracao_disparo)]
	elif e.veneno_por_segundo > 0:
		detalhe_especial.text = "%d de dano + veneno de %d/s por %s s" % [e.dano, e.veneno_por_segundo, _numero(e.duracao_veneno)]
	elif e.lentidao > 0.0:
		detalhe_especial.text = "%d de dano · chefe %d%% mais lento por %s s" % [e.dano, roundi(e.lentidao * 100.0), _numero(e.duracao_lentidao)]
	else:
		detalhe_especial.text = "%d de dano" % e.dano


## Setas só quando há o que escolher.
func _com_setas(nome: String, opcoes: int) -> String:
	return "‹  %s  ›" % nome if opcoes > 1 else nome


## 1.5 -> "1,5"; 5.0 -> "5" (vírgula decimal, como no GDD).
func _numero(valor: float) -> String:
	var texto: String = str(snappedf(valor, 0.1))
	if texto.ends_with(".0"):
		texto = texto.trim_suffix(".0")
	return texto.replace(".", ",")


func _on_mula_pressed() -> void:
	get_tree().change_scene_to_file(CENA_MULA)


func _on_cuca_pressed() -> void:
	get_tree().change_scene_to_file(CENA_CUCA)


func _on_boto_pressed() -> void:
	get_tree().change_scene_to_file(CENA_BOTO)


func _on_voltar_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
