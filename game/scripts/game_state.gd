extends Node

#Arquivo para salvar info que o user quer que tenha quando abrir o jogo, audio, video, progresso
# Neste codigo, progresso:  Quais inimgos foram derrotados, ja da pra enfrentar o boss final?
const SAVE_PATH := "user://save.cfg"

# A ordem aqui define a ordem no level_select.
const FASES := ["fase1", "fase2", "fase3"]
const BOSS := "boss"
# Para testar: com true, a Máquina e todos os ataques ficam liberados na seleção, sem
# precisar vencer as fases. Só vale rodando pelo editor (debug); o jogo exportado ignora.
const LIBERAR_TUDO_PARA_TESTE := true

## Dificuldade, escolhida na tela de seleção antes de cada luta (combinado com o Eduardo).
## Normal: Mula, Cuca e Boto com 1 fase, Máquina com 2. Expert: 2 fases, Máquina com 3,
## e combos mais frequentes. As fases de cada chefe ficam no .tres dele (ChefeData).
enum Dificuldade { NORMAL, EXPERT }
const NOMES_DIFICULDADE := ["Normal", "Expert"]

var concluidas: Array[String] = []
## Chefes vencidos no Expert (só um selo na seleção; vencer no Normal já libera tudo).
var concluidas_expert: Array[String] = []
var dificuldade: Dificuldade = Dificuldade.NORMAL
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
	var mudou: bool = false
	if not concluiu(id):
		concluidas.append(id)
		mudou = true
	if dificuldade == Dificuldade.EXPERT and not concluiu_expert(id):
		concluidas_expert.append(id)
		mudou = true
	if mudou:
		salvar()


func concluiu_expert(id: String) -> bool:
	return id in concluidas_expert


## Guarda a dificuldade escolhida na seleção (vale para a próxima luta).
func escolher_dificuldade(nova: Dificuldade) -> void:
	dificuldade = nova
	salvar()


func nome_dificuldade() -> String:
	return NOMES_DIFICULDADE[dificuldade]


func boss_liberado() -> bool:
	if _liberar_para_teste():
		return true
	for fase in FASES:
		if not concluiu(fase):
			return false
	return true


func zerou() -> bool:
	return concluiu(BOSS)


## Um ataque está liberado se é inicial ("") ou se a fase que o libera foi concluída.
func liberado(fase_que_libera: String) -> bool:
	return fase_que_libera == "" or concluiu(fase_que_libera) or _liberar_para_teste()


func _liberar_para_teste() -> bool:
	return LIBERAR_TUDO_PARA_TESTE and OS.is_debug_build()


## Guarda a escolha da tela de seleção (só pode trocar antes da fase, GDD).
func equipar(caminho_basico: String, caminho_especial: String) -> void:
	basico_equipado = caminho_basico
	especial_equipado = caminho_especial
	salvar()

# Mem para Save, chamada pela funçao marcar concluida ao derrotar o boss
func salvar() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("progresso", "concluidas", concluidas)
	cfg.set_value("progresso", "concluidas_expert", concluidas_expert)
	cfg.set_value("opcoes", "dificuldade", dificuldade)
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
	concluidas_expert.assign(cfg.get_value("progresso", "concluidas_expert", []))
	dificuldade = clampi(int(cfg.get_value("opcoes", "dificuldade", Dificuldade.NORMAL)), 0, Dificuldade.size() - 1) as Dificuldade
	basico_equipado = cfg.get_value("equipamento", "basico", "")
	especial_equipado = cfg.get_value("equipamento", "especial", "")
	return true


func apagar_save() -> void:
	concluidas.clear()
	concluidas_expert.clear()
	dificuldade = Dificuldade.NORMAL
	basico_equipado = ""
	especial_equipado = ""
	if tem_save():
		DirAccess.remove_absolute(SAVE_PATH)
