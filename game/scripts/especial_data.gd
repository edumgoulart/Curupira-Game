class_name EspecialData
extends Resource
## Dados de um ataque especial. Um .tres por especial em dados/ataques/.
## Valores de dano vêm da tabela "Especiais" do GDD.

## Nome mostrado na tela de seleção de ataques.
@export var nome: String = ""
## Dano total do especial. Instinto Selvagem (GDD): 150. Canhão Flamejante (GDD): até 200.
@export var dano: int = 150
## Velocidade do projétil (px/s), para especiais que são projétil. Instinto Selvagem: 1200 (combinado).
@export var velocidade_projetil: float = 1200.0
## Quanto tempo o Curupira fica parado disparando (s). 0 = dispara e segue (Instinto Selvagem).
## Canhão Flamejante (GDD): 1,5.
@export_range(0.0, 5.0, 0.05, "suffix:s") var duracao_disparo: float = 0.0
## Em quantos pulsos o dano é dividido, para especiais contínuos (feixe). 0 = acerto único.
## Canhão Flamejante (combinado): 10 pulsos de 20.
@export var pulsos: int = 0
## Pontos de carga para poder disparar. GDD: a barra tem 100 pontos.
@export var carga_necessaria: int = 100
## Cena do especial: um Projetil (sai voando) ou um FeixeCanhao (preso ao Curupira).
@export var cena_projetil: PackedScene
## Fase cujo chefe libera este especial ("" = especial inicial). Ex.: "fase1" = Mula sem Cabeça.
@export var fase_que_libera: String = ""
