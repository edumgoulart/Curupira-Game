class_name MulaData
extends ChefeData
## Números da Mula sem Cabeça. Os marcados "GDD" vêm da tabela de chefes do GDD;
## os "provisório" ainda não estão no GDD (Q16) e devem ser ajustados testando.
## Avisos: o Eduardo pediu mais tempo para desviar, então todos subiram (o valor antigo fica
## anotado).
## Nome, vida (GDD: 1200), pausa entre ataques (GDD: 1,2 s), contato, fases e combos ficam em
## ChefeData e estão preenchidos no mula.tres.
## Ataques (nomes usados nas fases): bolas, pisoteio, investida, meteoros.

@export_group("Rajada rasteira (bolas)")
## Aviso antes da primeira bola (s). GDD: 0,8 (era 0,5).
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_bolas: float = 0.8
## Quantas bolas por ataque. GDD: 3.
@export var quantidade_bolas: int = 3
## Golpes por bola. GDD: 1.
@export var golpes_bola: int = 1
## Tempo entre uma bola e a próxima (s). Provisório: 0,35.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_bolas: float = 0.35
## Velocidade da bola, reta na horizontal (px/s). Provisório: 700.
## O Curupira anda a 600: não dá para fugir correndo, tem que pular ou dar dash.
@export var velocidade_horizontal_bola: float = 700.0
## Altura do centro da bola acima do chão (px). Provisório: 60 (rente ao chão; pula-se por cima).
@export var altura_bola: float = 60.0
@export var cena_bola: PackedScene

@export_group("Pisoteio (onda de fogo)")
## Aviso: empina e segura no alto (s). Provisório: 1,0 (era 0,8).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_pisoteio: float = 1.0
## Velocidade da onda de fogo pelo chão (px/s). Provisório: 650.
@export var velocidade_onda: float = 650.0
## Golpes da onda. Provisório: 1.
@export var golpes_onda: int = 1
## Quantas ondas por pisada (uma atrás da outra). Provisório: 1.
@export var quantidade_ondas: int = 1
## Tempo entre uma onda e a próxima, quando há mais de uma (s). Provisório: 0,45.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_ondas: float = 0.45
@export var cena_onda: PackedScene

@export_group("Investida")
## Aviso: raspa o casco antes de correr (s). Provisório: 1,1 (era 0,9).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_investida: float = 1.1
## Velocidade da corrida (px/s). Provisório: 1400 (passa-se com o dash, invencível).
@export var velocidade_investida: float = 1400.0
## Golpes de quem for atropelado. Provisório: 1.
@export var golpes_investida: int = 1
## Onde ela para, medido da parede (px), para o corpo não entrar na parede. Provisório: 180.
@export var margem_parede: float = 180.0
## Tonta depois de bater na parede (s); é a janela para atacar. Provisório: 1,4.
## Depois ela fica naquela parede (não volta para o lugar).
@export_range(0.0, 5.0, 0.05, "suffix:s") var tempo_tonta: float = 1.4

@export_group("Chuva de meteoros")
## Quantos meteoros. Provisório: 3 (o primeiro cai onde o Curupira está).
@export var quantidade_meteoros: int = 3
## Distância entre os pontos de queda (px). Provisório: 300.
@export var distancia_meteoros: float = 300.0
## Tempo entre um meteoro e o próximo (s). Provisório: 0,35.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_meteoros: float = 0.35
## Aviso: tempo do brilho no céu até o impacto (s), de cada meteoro. GDD: 1,3 (era 1).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_meteoro: float = 1.3
## Golpes de cada meteoro. GDD: 2.
@export var golpes_meteoro: int = 2
## A Mula fica parada depois dos meteoros (s); é a janela para atacar. GDD: 1,5.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_meteoro: float = 1.5
## Nos últimos X s do aviso a pedra aparece caindo. Provisório: 0,3.
@export_range(0.05, 1.0, 0.05, "suffix:s") var duracao_queda_meteoro: float = 0.3
## Quanto tempo a área do impacto machuca (s). Provisório: 0,15.
@export_range(0.05, 1.0, 0.05, "suffix:s") var duracao_impacto_meteoro: float = 0.15
@export var cena_meteoro: PackedScene

