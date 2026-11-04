class_name ChefeData
extends Resource
## Dados que todo chefe tem (tabela de chefes do GDD). Cada chefe estende esta
## classe com os números dos próprios ataques (MulaData, CucaData...).

@export_group("Identidade")
## Nome mostrado na tela de vitória.
@export var nome: String = ""
## Artigo do nome, para o texto da vitória ("a" Mula, "a" Cuca, "o" Boto).
@export var artigo: String = "a"
## Id do progresso no GameState (fase1 = Mula, fase2 = Cuca, fase3 = Boto, boss = Máquina).
@export var id_progresso: String = ""
## Ataques que o Curupira ganha ao vencer (texto da tela de vitória). Vazio = não mostra.
@export var recompensa: String = ""
## Texto próprio da tela de vitória. Vazio = "Você libertou <artigo> <nome> do chip da máquina!".
@export var texto_vitoria: String = ""

@export_group("Geral")
## Vida do chefe (GDD).
@export var vida: int = 1000
## Pausa entre um ataque e o próximo (s) (GDD).
@export_range(0.0, 5.0, 0.05, "suffix:s") var pausa_entre_ataques: float = 1.2
## Golpes tirados do Curupira ao encostar no corpo do chefe. Provisório (combinado): 1.
@export var golpes_contato: int = 1

@export_group("Caixas de dano")
## As caixas acompanham a pose: a cada animação, Hurtbox e Contato ganham o tamanho do
## desenho (caixa da animação no .json da folha) vezes estas frações.
## Hurtbox (onde o tiro do Curupira acerta), centrada no desenho. Provisório: 0,8 × 0,85.
@export var fracao_hurtbox: Vector2 = Vector2(0.8, 0.85)
## Contato (o corpo que machuca), presa embaixo do desenho, para o fogo, o cabelo e o chapéu
## não machucarem. Provisório: 0,55 × 0,7.
@export var fracao_contato: Vector2 = Vector2(0.55, 0.7)

@export_group("Fases")
## Fração da vida em que começa a fase 2 (0,667 = quando perde um terço).
## Proposta do GDD (Q16): a cada terço da vida.
@export_range(0.0, 1.0, 0.01) var vida_fase_2: float = 0.667
## Fração da vida em que começa a fase 3.
@export_range(0.0, 1.0, 0.01) var vida_fase_3: float = 0.333
## Ataques sorteados em cada fase (nomes que o script do chefe conhece).
## O primeiro ataque de uma fase nova que não estava na anterior sai logo que a fase começa.
@export var ataques_fase_1: Array[StringName] = []
@export var ataques_fase_2: Array[StringName] = []
@export var ataques_fase_3: Array[StringName] = []


func ataques_da_fase(fase: int) -> Array[StringName]:
	match fase:
		0:
			return ataques_fase_1
		1:
			return ataques_fase_2 if not ataques_fase_2.is_empty() else ataques_fase_1
		_:
			return ataques_fase_3 if not ataques_fase_3.is_empty() else ataques_da_fase(1)


## Em que fase o chefe está com esta fração da vida (0 = fase 1).
func fase_para(fracao_vida: float) -> int:
	if fracao_vida <= vida_fase_3:
		return 2
	if fracao_vida <= vida_fase_2:
		return 1
	return 0
