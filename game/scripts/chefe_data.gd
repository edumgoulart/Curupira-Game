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

@export_group("Derrota do Curupira")
## Retrato do chefe zombando, de frente, na carta da tela de derrota (gerador: derrota_px.js).
@export var retrato_derrota: Texture2D
## Frases de deboche da carta de derrota; sai uma por vez, sorteada.
@export var frases_derrota: Array[String] = []

@export_group("Geral")
## Vida do chefe (GDD).
@export var vida: int = 1000
## Vida a mais no Expert, somada à de cima. Mula: +400 (pedido do Eduardo). 0 = a mesma vida.
@export var vida_extra_expert: int = 0
## Pausa entre um ataque e o próximo (s) (GDD).
@export_range(0.0, 5.0, 0.05, "suffix:s") var pausa_entre_ataques: float = 1.2
## Golpes tirados do Curupira ao encostar no corpo do chefe. v1.0 (combinado): 1.
@export var golpes_contato: int = 1

@export_group("Caixas de dano")
## As caixas acompanham a pose: a cada animação, Hurtbox e Contato ganham o tamanho do
## desenho (caixa da animação no .json da folha) vezes estas frações.
## Hurtbox (onde o tiro do Curupira acerta), centrada no desenho. v1.0: 0,8 × 0,85.
@export var fracao_hurtbox: Vector2 = Vector2(0.8, 0.85)
## Contato (o corpo que machuca), presa embaixo do desenho, para o fogo, o cabelo e o chapéu
## não machucarem. v1.0: 0,55 × 0,7.
@export var fracao_contato: Vector2 = Vector2(0.55, 0.7)

@export_group("Fases")
## Fases da luta em cada dificuldade (escolhida na tela de seleção, antes de cada luta).
## Cada fase diz em que fração da vida começa, os ataques sorteados e os combos.
## Combinado com o Eduardo: Normal = 1 fase (Máquina: 2); Expert = 2 fases (Máquina: 3).
@export var fases_normal: Array[FaseChefe] = []
@export var fases_expert: Array[FaseChefe] = []

@export_group("Transição de fase")
## Duração mínima da transição (s): o chefe para, a tela limpa e ele faz a animação
## "transicao". Se a animação for mais longa, vale a animação. Ele continua levando dano.
## v1.0: 1,2.
@export_range(0.0, 5.0, 0.05, "suffix:s") var duracao_transicao: float = 1.2
## Respiro parado depois da transição, antes do primeiro combo da fase nova (s). v1.0: 0,5.
@export_range(0.0, 3.0, 0.05, "suffix:s") var pausa_apos_transicao: float = 0.5


## A vida do chefe na dificuldade escolhida.
func vida_para(dificuldade: int) -> int:
	return vida + (vida_extra_expert if dificuldade == GameState.Dificuldade.EXPERT else 0)


## As fases da dificuldade, da primeira à última (ordenadas pela vida em que começam).
## Expert sem fases próprias usa as do Normal.
func fases_para(dificuldade: int) -> Array[FaseChefe]:
	var lista: Array[FaseChefe] = fases_expert if dificuldade == GameState.Dificuldade.EXPERT and not fases_expert.is_empty() else fases_normal
	lista = lista.duplicate()
	lista.sort_custom(func(a: FaseChefe, b: FaseChefe) -> bool: return a.comeca_com_vida > b.comeca_com_vida)
	return lista
