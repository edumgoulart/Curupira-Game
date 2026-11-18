class_name MapaData
extends Resource
## Ajustes do mapa do mundo. Distâncias em pixels da arte (na tela, ×4).
## Não são números de combate: dá para mexer à vontade pelo inspetor.

## Velocidade do Curupira andando no mapa (pixels da arte por segundo).
@export_range(10.0, 200.0, 1.0, "suffix:px/s") var velocidade: float = 84.0
## Raio dos pés: o Curupira não chega mais perto que isso da beira do que não é chão.
@export_range(0.0, 8.0, 0.5, "suffix:px") var raio_pes: float = 3.0
## Quanto a câmera demora a alcançar o Curupira (maior = mais rápido). 0 = presa nele.
@export_range(0.0, 20.0, 0.5) var suavidade_camera: float = 6.0
