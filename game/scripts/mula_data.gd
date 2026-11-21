class_name MulaData
extends ChefeData
## Números da Mula sem Cabeça. Os marcados "GDD" vêm da tabela de chefes do GDD;
## os "v1.0" foram fechados como valores oficiais da versão 1.0 (GDD, Q16) e podem mudar depois do teste.
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
## Quantas bolas por ataque no Expert, misturando altas e baixas. Pedido do Eduardo: mais bolas.
@export var quantidade_bolas_expert: int = 5
## Chance de cada bola do Expert ser alta (abaixar) em vez de baixa (pular). Sempre sai pelo
## menos uma de cada. No Normal são todas baixas.
@export_range(0.0, 1.0, 0.05) var chance_bola_alta_expert: float = 0.5
## Altura do centro da bola alta acima do chão (px): passa por cima do Curupira agachado (86 px)
## e acerta ele de pé (172 px). Raio da bola: 21.
@export var altura_bola_alta: float = 140.0
## Espaço mínimo quando a próxima bola muda de altura (s): dá tempo de a Mula trocar de pose
## (o aviso da altura) e de o Curupira passar de pular para abaixar.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_troca_altura: float = 0.55
## Golpes por bola. GDD: 1.
@export var golpes_bola: int = 1
## Tempo entre uma bola e a próxima: sorteado a cada bola entre o mínimo e o máximo (s).
## Pedido do Eduardo: o espaço entre as bolas varia, do de antes (0,35 s, ~245 px) até o dobro,
## para o jogador ter que ler se cabe pular entre elas ou se precisa do dash. v1.0: 0,35 fixo.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_bolas: float = 0.35
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_bolas_max: float = 0.7
## Velocidade da bola, reta na horizontal (px/s). v1.0: 700.
## O Curupira anda a 600: não dá para fugir correndo, tem que pular ou dar dash.
@export var velocidade_horizontal_bola: float = 700.0
## Altura do centro da bola acima do chão (px). v1.0: 60 (rente ao chão; pula-se por cima).
@export var altura_bola: float = 60.0
@export var cena_bola: PackedScene

@export_group("Pisoteio (onda de fogo)")
## Aviso: empina e segura no alto (s). v1.0: 1,0 (era 0,8).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_pisoteio: float = 1.0
## Velocidade da onda de fogo pelo chão (px/s). Pedido do Eduardo: um pouco mais rápida,
## sempre a mesma. v1.0: 650.
@export var velocidade_onda: float = 800.0
## A onda cresce conforme se afasta da Mula (pedido do Eduardo). Depois de andar esta distância
## (px) ela está com escala_onda_longe (3 = 216 px de altura), alta demais para pular: no terço
## da arena mais longe da Mula não se pula mais, e quem vê a onda corre para perto dela.
@export var distancia_onda_longe: float = 850.0
@export_range(1.0, 5.0, 0.25) var escala_onda_longe: float = 3.0
## Tamanho máximo da onda (escala), para não cobrir a tela toda.
@export_range(1.0, 5.0, 0.25) var escala_onda_max: float = 3.5
## Golpes da onda. v1.0: 1.
@export var golpes_onda: int = 1
## Quantas ondas por pisada (uma atrás da outra). v1.0: 1.
@export var quantidade_ondas: int = 1
## Tempo entre uma onda e a próxima, quando há mais de uma (s). v1.0: 0,45.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_ondas: float = 0.45
@export var cena_onda: PackedScene

@export_group("Investida")
## Aviso: raspa o casco antes de correr (s). v1.0: 1,1 (era 0,9).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_investida: float = 1.1
## Velocidade da corrida (px/s). v1.0: 1400 (passa-se com o dash, invencível).
@export var velocidade_investida: float = 1400.0
## Golpes de quem for atropelado. v1.0: 1.
@export var golpes_investida: int = 1
## Onde ela para, medido da parede (px), para o corpo não entrar na parede. v1.0: 180.
@export var margem_parede: float = 180.0
## Tonta depois de bater na parede (s); é a janela para atacar. v1.0: 1,4.
## Depois ela fica naquela parede (não volta para o lugar).
@export_range(0.0, 5.0, 0.05, "suffix:s") var tempo_tonta: float = 1.4

@export_group("Chuva de meteoros")
## Quantos meteoros. v1.0: 3 (o primeiro cai onde o Curupira está).
@export var quantidade_meteoros: int = 3
## Distância entre os pontos de queda (px). v1.0: 300.
@export var distancia_meteoros: float = 300.0
## Tempo entre um meteoro e o próximo (s). v1.0: 0,35.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_meteoros: float = 0.35
## Só no Expert: a chuva cobre a arena toda, menos perto da Mula, em duas ondas (pedido do
## Eduardo). A primeira cai a cada distancia_meteoros a partir do Curupira; a segunda, logo
## depois, nos vãos entre elas. Desvia-se ficando num vão na primeira e voltando para onde uma
## pedra da primeira já caiu na segunda.
## Distância do centro da Mula em que não cai meteoro (px). O corpo dela tem ~200 de cada lado.
@export var zona_livre_mula_expert: float = 220.0
## Antes da chuva do Expert ela cospe uma rajada de pedras para o céu, uma cacetada delas
## (pedido do Eduardo): duração do lançamento (s, no relógio dela) e tempo entre uma pedra e a
## próxima. As pedras que sobem são só visuais; os brilhos aparecem depois.
@export_range(0.1, 4.0, 0.05, "suffix:s") var lancamento_meteoros_expert: float = 1.2
@export_range(0.02, 0.5, 0.01, "suffix:s") var intervalo_pedras_lancamento: float = 0.05
## Quantas pedras saem de cada vez na rajada.
@export_range(1, 6) var pedras_por_vez_lancamento: int = 2
## Os brilhos de cada onda acendem um depois do outro, do mais perto do Curupira ao mais longe,
## com este espaço (s).
@export_range(0.0, 1.0, 0.01, "suffix:s") var intervalo_meteoros_expert: float = 0.1
## A segunda onda só começa a brilhar quando a primeira começa a cair (pedido do Eduardo: os
## brilhos das duas não podem ser iguais). Aviso dela, do primeiro brilho fraco ao impacto (s).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_segunda_onda_expert: float = 1.0
## Só no Expert: quando os meteoros abrem um combo, o brilho dura mais e as pedras caem durante
## o ataque seguinte (ex.: a rajada de bolas). Sozinhos: aviso_meteoro. Hoje o Expert da Mula não
## tem combos (pedido do Eduardo: agachado não dá para fugir dos meteoros), então não é usado.
@export_range(0.1, 4.0, 0.05, "suffix:s") var aviso_meteoro_combo_expert: float = 2.2
## Aviso: tempo do brilho no céu até o impacto (s), de cada meteoro. GDD: 1,3 (era 1).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_meteoro: float = 1.3
## Golpes de cada meteoro. GDD: 2.
@export var golpes_meteoro: int = 2
## A Mula fica parada depois dos meteoros (s); é a janela para atacar. GDD: 1,5.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_meteoro: float = 1.5
## Nos últimos X s do aviso a pedra aparece caindo. v1.0: 0,3.
@export_range(0.05, 1.0, 0.05, "suffix:s") var duracao_queda_meteoro: float = 0.3
## Quanto tempo a área do impacto machuca (s). v1.0: 0,15.
@export_range(0.05, 1.0, 0.05, "suffix:s") var duracao_impacto_meteoro: float = 0.15
@export var cena_meteoro: PackedScene
