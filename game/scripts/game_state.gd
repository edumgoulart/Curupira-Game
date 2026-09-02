extends Node

#Arquivo para salvar info que o user quer que tenha quando abrir o jogo, audio, video, progresso
# Neste codigo, progresso:  Quais inimgos foram derrotados, ja da pra enfrentar o boss final?
const SAVE_PATH := "user://save.cfg"

# A ordem aqui define a ordem no level_select.
const FASES := ["fase1", "fase2", "fase3"]
const BOSS := "boss"

var concluidas: Array[String] = []


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

# Mem para Save, chamada pela funçao marcar concluida ao derrotar o boss
func salvar() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("progresso", "concluidas", concluidas)
	var erro := cfg.save(SAVE_PATH)
	if erro != OK:
		push_error("Falha ao salvar: %s" % error_string(erro))

# Save para Mem, chamada pelo main_menu
func carregar() -> bool:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		return false
	concluidas.assign(cfg.get_value("progresso", "concluidas", []))
	return true


func apagar_save() -> void:
	concluidas.clear()
	if tem_save():
		DirAccess.remove_absolute(SAVE_PATH)
