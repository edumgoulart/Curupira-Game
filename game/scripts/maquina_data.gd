class_name MaquinaData
extends ChefeData
## Números da Máquina de IA (chefe final). Os marcados "GDD" vêm do GDD; os "v1.0"
## foram fechados como valores oficiais da versão 1.0 (GDD, Q16) e podem mudar depois do teste.
## Nome, vida (GDD: 2400), pausa entre ataques (GDD: 1,2 s) e contato ficam em ChefeData
## e estão preenchidos no maquina.tres.
## Avisos: o Eduardo pediu mais tempo para desviar, então subiram (o valor antigo fica anotado).

@export_group("Raio laser")
## Aviso: a linha fina mostra o trajeto antes do disparo (s). GDD: 1,0 (era 0,8).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_laser: float = 1.0
## No fim do aviso a linha para de seguir o Curupira e trava (s antes do disparo).
## v1.0: 0,3 (era 0,2, combinado).
@export_range(0.0, 1.0, 0.05, "suffix:s") var travamento_laser: float = 0.3
## Quanto tempo o laser fica ligado (s). v1.0: 0,4.
@export_range(0.05, 3.0, 0.05, "suffix:s") var duracao_laser: float = 0.4
## Golpes do laser. GDD: 1.
@export var golpes_laser: int = 1
@export var cena_laser: PackedScene

@export_group("Bombas")
## Quantas bombas por ataque. Combinado: 3 (uma no Curupira, as outras ao lado).
@export var quantidade_bombas: int = 3
## Distância entre as bombas (px). v1.0: 300.
@export var distancia_bombas: float = 300.0
## Velocidade de queda das bombas (px/s). v1.0: 900.
@export var velocidade_queda_bomba: float = 900.0
## Tempo no chão até explodir (s); a bomba pisca e mostra a área. GDD: 1,5.
@export_range(0.1, 5.0, 0.05, "suffix:s") var espera_bomba: float = 1.5
## Raio da explosão (px). v1.0: 180.
@export var raio_explosao: float = 180.0
## Golpes da explosão. GDD: 2.
@export var golpes_bomba: int = 2
## A Máquina fica parada ("superaquecida") depois das bombas (s); é a janela para atacar.
## Combinado: 1,2. Esta parada substitui a pausa normal entre ataques.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_bombas: float = 1.2
@export var cena_bomba: PackedScene

@export_group("Piso traiçoeiro (pistões)")
## Aviso: a lente olha para o chão (s).
## v1.0: 0,9 (era 0,5).
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_pistoes: float = 0.9
## Quantas ondas de placas. v1.0: 2.
@export var ondas_pistoes: int = 2
## Tempo entre uma onda e a próxima (s). v1.0: 1,0.
@export_range(0.1, 5.0, 0.05, "suffix:s") var intervalo_ondas_pistoes: float = 1.0
## Velocidade da onda, de placa em placa (px/s). v1.0: 960 na primeira; as seguintes
## vão mais rápido (multiplicador por onda). v1.0: 1,25.
@export var velocidade_onda_pistoes: float = 960.0
@export var aceleracao_onda_pistoes: float = 1.25
## Largura de cada placa (px; o desenho tem 16 px da arte = 64). v1.0: 64.
@export var largura_placa: float = 64.0
## Aviso de cada placa: marcas vermelhas no chão antes de ela saltar (s).
## v1.0: 0,4 (era 0,25).
@export_range(0.0, 2.0, 0.05, "suffix:s") var aviso_placa: float = 0.4
## Golpes de cada placa. v1.0: 1.
@export var golpes_placa: int = 1
@export var cena_placa: PackedScene

@export_group("Varredura")
## Aviso de cada passada: a linha fina mostra o caminho (s). v1.0: 0,8 (era 0,5).
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_varredura: float = 0.8
## Primeira passada: laser reto na altura da cabeça, ligado por (s). v1.0: 0,6.
@export_range(0.05, 3.0, 0.05, "suffix:s") var duracao_varredura_alta: float = 0.6
## Segunda passada: o ponto de impacto corre pelo chão até a parede em (s). v1.0: 0,85.
@export_range(0.1, 3.0, 0.05, "suffix:s") var duracao_varredura_chao: float = 0.85
## Onde a segunda passada começa, medido a partir da Máquina (px). v1.0: 280.
@export var inicio_varredura_chao: float = 280.0
## Golpes do laser da varredura. v1.0: 1.
@export var golpes_varredura: int = 1

