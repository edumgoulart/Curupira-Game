class_name VidaJogadorData
extends Resource
## Valores de vida e dano do Curupira. Editar o .tres no inspetor.

## Golpes que o Curupira aguenta; no último perde a fase. GDD: 4.
@export var golpes: int = 4
## Invencibilidade depois de levar um golpe (s). GDD: 1,5.
@export_range(0.0, 5.0, 0.05, "suffix:s") var invencibilidade_apos_golpe: float = 1.5
## Velocidade do pisca-pisca durante a invencibilidade (s por troca). Só visual, provisório.
@export_range(0.02, 0.5, 0.01, "suffix:s") var intervalo_piscar: float = 0.1
