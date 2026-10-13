extends Node

#Arquivo para salvar info que o user quer que tenha quando abrir o jogo, audio, video, progresso
# Neste codigo, progresso:  Quais inimgos foram derrotados, ja da pra enfrentar o boss final?
const SAVE_PATH := "user://save.cfg"

# A ordem aqui define a ordem no level_select.
const FASES := ["fase1", "fase2", "fase3"]
const BOSS := "boss"

var concluidas: Array[String] = []
# Ataques escolhidos na seleção (caminho do .tres). "" = usa o padrão do Curupira
# (Tiro de Folha / Instinto Selvagem). Salvos junto com o progresso.
var basico_equipado: String = ""
var especial_equipado: String = ""


# Lê o save ao abrir o jogo: assim, vencer uma fase aberta direto (F6) não
# grava por cima do arquivo e apaga o progresso que já existia.
func _ready() -> void:
	carregar()


func tem_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func concluiu(id: String) -> bool:
	return id in concluidas


func marcar_concluida(id: String) -> void:
	if not concluiu(id):
		concluidas.append(id)
		salvar()


func boss_liberado() -> bool:
	for fase in FASES:
		if not concluiu(fase):
			return false
	return true


func zerou() -> bool:
	return concluiu(BOSS)


## Um ataque está liberado se é inicial ("") ou se a fase que o libera foi concluída.
func liberado(fase_que_libera: String) -> bool:
	return fase_que_libera == "" or concluiu(fase_que_libera)


## Guarda a escolha da tela de seleção (só pode trocar antes da fase, GDD).
func equipar(caminho_basico: String, caminho_especial: String) -> void:
	basico_equipado = caminho_basico
	especial_equipado = caminho_especial
	salvar()

# Mem para Save, chamada pela funçao marcar concluida ao derrotar o boss
func salvar() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("progresso", "concluidas", concluidas)
	cfg.set_value("equipamento", "basico", basico_equipado)
	cfg.set_value("equipamento", "especial", especial_equipado)
	var erro := cfg.save(SAVE_PATH)
	if erro != OK:
		push_error("Falha ao salvar: %s" % error_string(erro))

# Save para Mem, chamada pelo main_menu
func carregar() -> bool:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		return false
	concluidas.assign(cfg.get_value("progresso", "concluidas", []))
	basico_equipado = cfg.get_value("equipamento", "basico", "")
	especial_equipado = cfg.get_value("equipamento", "especial", "")
	return true


func apagar_save() -> void:
	concluidas.clear()
	basico_equipado = ""
	especial_equipado = ""
	if tem_save():
		DirAccess.remove_absolute(SAVE_PATH)
