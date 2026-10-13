class_name AtaqueData
extends Resource
## Dados de um ataque básico (projétil). Um .tres por ataque em dados/ataques/.
## Valores de dano, cadência e carga vêm da tabela "Ataques básicos" do GDD.

## Nome mostrado na tela de seleção de ataques.
@export var nome: String = ""
## Dano de cada projétil que acerta o chefe.
@export var dano: int = 1
## Cadência com o botão segurado (tiros por segundo).
@export var tiros_por_segundo: float = 1.0
## Pontos somados à barra do especial (100 pontos) a cada acerto.
@export var carga_por_acerto: int = 1
## Velocidade do projétil (px/s).
@export var velocidade_projetil: float = 1000.0
## Cena do projétil disparado.
@export var cena_projetil: PackedScene
## Quanto o projétil consegue virar atrás do chefe (graus/s). 0 = reto.
## Feitiço Perseguidor (combinado): 540.
@export var curva: float = 0.0
## Tempo máximo do projétil no ar (s). 0 = até sair da tela. Perseguidor (combinado): 3.
@export var duracao_maxima: float = 0.0
## Fase cujo chefe libera este ataque ("" = ataque inicial). Ex.: "fase1" = Mula sem Cabeça.
@export var fase_que_libera: String = ""
