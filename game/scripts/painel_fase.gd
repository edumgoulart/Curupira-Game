class_name PainelFase
extends CanvasLayer
## Painel que abre quando o Curupira entra na área de um chefe no mapa do mundo: mostra o chefe,
## e ali se escolhe o ataque básico, o especial e a dificuldade antes de lutar (GDD: os ataques só
## trocam antes da fase, nunca durante a luta). Substitui a antiga tela de seleção de fase; a lógica
## de escolha veio do antigo level_select (apagado).
## Só aparecem os ataques liberados: os iniciais + os dos chefes já derrotados
## (campo fase_que_libera de cada ataque no catálogo).
## Fica com process_mode "sempre" e pausa o mapa enquanto está aberto.

signal lutar(id_area: String)
signal fechou

const CATALOGO: CatalogoAtaques = preload("res://dados/ataques/catalogo.tres")
## O que cada dificuldade muda, mostrado embaixo do botão.
const DETALHE_DIFICULDADE := [
	"Mula, Cuca e Boto numa fase só · Máquina em duas",
	"Duas fases e mais combos · Máquina em três",
]

var _id_area: String = ""
var _basicos: Array[AtaqueData] = []
var _especiais: Array[EspecialData] = []
var _i_basico: int = 0
var _i_especial: int = 0

@onready var titulo: Label = %Titulo
@onready var situacao: Label = %Situacao
@onready var basico: Button = %Basico
@onready var especial: Button = %Especial
@onready var detalhe_basico: Label = %DetalheBasico
@onready var detalhe_especial: Label = %DetalheEspecial
@onready var aviso: Label = %AtaquesAviso
@onready var dificuldade: Button = %Dificuldade
@onready var detalhe_dificuldade: Label = %DetalheDificuldade
@onready var botao_lutar: Button = %Lutar


func _ready() -> void:
	visible = false
	# A (ou clique) troca para o próximo; ◀ / ▶ no direcional troca para os lados.
	basico.pressed.connect(_trocar_basico.bind(1))
	especial.pressed.connect(_trocar_especial.bind(1))
	basico.gui_input.connect(_setas.bind(_trocar_basico))
	especial.gui_input.connect(_setas.bind(_trocar_especial))
	dificuldade.pressed.connect(_trocar_dificuldade.bind(1))
	dificuldade.gui_input.connect(_setas.bind(_trocar_dificuldade))


## Abre o painel do chefe da área.
func abrir(id_area: String, chefe: ChefeData) -> void:
	_id_area = id_area
	titulo.text = chefe.nome
	situacao.text = _situacao(chefe)
	_basicos.assign(CATALOGO.basicos.filter(func(a: AtaqueData) -> bool: return GameState.liberado(a.fase_que_libera)))
	_especiais.assign(CATALOGO.especiais.filter(func(e: EspecialData) -> bool: return GameState.liberado(e.fase_que_libera)))
	_i_basico = _indice_equipado(_basicos, GameState.basico_equipado)
	_i_especial = _indice_equipado(_especiais, GameState.especial_equipado)
	aviso.visible = _basicos.size() < CATALOGO.basicos.size() or _especiais.size() < CATALOGO.especiais.size()
	_atualizar_textos()
	get_tree().paused = true
	visible = true
	# Foco no "Lutar!": dá para entrar direto na luta apertando A de novo.
	botao_lutar.grab_focus()


func fechar() -> void:
	visible = false
	get_tree().paused = false
	fechou.emit()


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	# B no controle / Esc no teclado fecha e volta a andar no mapa.
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("pause"):
		get_viewport().set_input_as_handled()
		fechar()


func _situacao(chefe: ChefeData) -> String:
	var palavra: String = "derrotado" if chefe.artigo == "o" else "derrotada"
	if GameState.concluiu_expert(chefe.id_progresso):
		return "%s · Expert" % palavra.capitalize()
	if GameState.concluiu(chefe.id_progresso):
		return palavra.capitalize()
	if chefe.id_progresso == GameState.BOSS:
		return "Quem prendeu os seres da floresta nos chips"
	return "Ainda presa ao chip da máquina" if chefe.artigo == "a" else "Ainda preso ao chip da máquina"


## Posição do ataque equipado na lista de liberados; se não estiver (ou não houver escolha), o primeiro.
func _indice_equipado(lista: Array, caminho: String) -> int:
	for i in lista.size():
		if lista[i].resource_path == caminho:
			return i
	return 0


func _setas(event: InputEvent, trocar: Callable) -> void:
	if event.is_action_pressed("ui_left"):
		trocar.call(-1)
		get_viewport().set_input_as_handled()  # impede o foco de pular para outro botão
	elif event.is_action_pressed("ui_right"):
		trocar.call(1)
		get_viewport().set_input_as_handled()


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


func _trocar_dificuldade(passo: int) -> void:
	var nova: int = wrapi(GameState.dificuldade + passo, 0, GameState.NOMES_DIFICULDADE.size())
	GameState.escolher_dificuldade(nova as GameState.Dificuldade)
	_atualizar_textos()


func _salvar_escolha() -> void:
	GameState.equipar(_basicos[_i_basico].resource_path, _especiais[_i_especial].resource_path)
	_atualizar_textos()


func _atualizar_textos() -> void:
	var b: AtaqueData = _basicos[_i_basico]
	var e: EspecialData = _especiais[_i_especial]
	dificuldade.text = "Dificuldade: " + _com_setas(GameState.nome_dificuldade(), GameState.NOMES_DIFICULDADE.size())
	detalhe_dificuldade.text = DETALHE_DIFICULDADE[GameState.dificuldade]
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


func _on_lutar_pressed() -> void:
	get_tree().paused = false
	lutar.emit(_id_area)


func _on_voltar_pressed() -> void:
	fechar()
