class_name ChefeData
extends Resource
## Dados que todo chefe tem (tabela de chefes do GDD). Cada chefe estende esta
## classe com os números dos próprios ataques (MulaData, CucaData...).

@export_group("Identidade")
## Nome mostrado na tela de vitória.
@export var nome: String = ""
## Id do progresso no GameState (fase1 = Mula, fase2 = Cuca, fase3 = Boto, boss = Máquina).
@export var id_progresso: String = ""
## Ataques que o Curupira ganha ao vencer (texto da tela de vitória).
@export var recompensa: String = ""

@export_group("Geral")
## Vida do chefe (GDD).
@export var vida: int = 1000
## Pausa entre um ataque e o próximo (s) (GDD).
@export_range(0.0, 5.0, 0.05, "suffix:s") var pausa_entre_ataques: float = 1.2
## Golpes tirados do Curupira ao encostar no corpo do chefe. Provisório (combinado): 1.
@export var golpes_contato: int = 1
