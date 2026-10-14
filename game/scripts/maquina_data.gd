class_name MaquinaData
extends ChefeData
## Números da Máquina de IA (chefe final). Os marcados "GDD" vêm do GDD; os "provisório"
## foram combinados com o Arthur e devem ser ajustados testando.
## Nome, vida (GDD: 2400), pausa entre ataques (GDD: 1,2 s) e contato ficam em ChefeData
## e estão preenchidos no maquina.tres.

@export_group("Raio laser")
## Aviso: a linha fina mostra o trajeto antes do disparo (s). GDD: 0,8.
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_laser: float = 0.8
## No fim do aviso a mira para de seguir o Curupira e trava (s antes do disparo). Combinado: 0,2.
@export_range(0.0, 1.0, 0.05, "suffix:s") var travamento_laser: float = 0.2
## Quanto tempo o laser fica ligado (s). Provisório: 0,4.
@export_range(0.05, 3.0, 0.05, "suffix:s") var duracao_laser: float = 0.4
## Golpes do laser. GDD: 1.
@export var golpes_laser: int = 1
@export var cena_laser: PackedScene

@export_group("Bombas")
## Quantas bombas por ataque. Combinado: 3 (uma no Curupira, as outras ao lado).
@export var quantidade_bombas: int = 3
## Distância entre as bombas (px). Provisório: 300.
@export var distancia_bombas: float = 300.0
## Velocidade de queda das bombas (px/s). Provisório: 900.
@export var velocidade_queda_bomba: float = 900.0
## Tempo no chão até explodir (s); a bomba pisca e mostra a área. GDD: 1,5.
@export_range(0.1, 5.0, 0.05, "suffix:s") var espera_bomba: float = 1.5
## Raio da explosão (px). Provisório: 180.
@export var raio_explosao: float = 180.0
## Golpes da explosão. GDD: 2.
@export var golpes_bomba: int = 2
## A Máquina fica parada ("superaquecida") depois das bombas (s); é a janela para atacar.
## Combinado: 1,2. Esta parada substitui a pausa normal entre ataques.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_bombas: float = 1.2
@export var cena_bomba: PackedScene
