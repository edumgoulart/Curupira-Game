class_name CucaData
extends ChefeData
## Números da Cuca. Os marcados "GDD" vêm do GDD; os "provisório" foram combinados
## com o Arthur e devem ser ajustados testando.
## Nome, vida (GDD: 1600), pausa entre ataques (GDD: 1,6 s), contato, fases e combos ficam em
## ChefeData e estão preenchidos no cuca.tres.
## Ataques (nomes usados nas fases): leque, pocao, bote, ninar.
## Avisos: o Eduardo pediu mais tempo para desviar, então todos subiram (o valor antigo fica
## anotado).

@export_group("Feitiço (três em leque)")
## Aviso antes do feitiço (s). GDD: 0,8 (era 0,5).
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_feitico: float = 0.8
## Golpes por feitiço. GDD: 1.
@export var golpes_feitico: int = 1
## Quantos feitiços no leque. Combinado: 3.
@export var quantidade_feiticos: int = 3
## Ângulo entre um feitiço e o vizinho (graus). O do meio mira no Curupira. Provisório: 20.
@export_range(0.0, 45.0, 1.0, "suffix:°") var abertura_feitico: float = 20.0
## Velocidade dos feitiços (px/s). Combinado: 700.
@export var velocidade_feitico: float = 700.0
@export var cena_feitico: PackedScene

@export_group("Poção")
## Aviso antes de jogar a poção (s). GDD: 0,8 (era 0,6).
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_pocao: float = 0.8
## A Cuca fica parada depois da poção (s); é a janela para atacar. Combinado: 1,5.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_pocao: float = 1.5
## Velocidade horizontal da poção em arco (px/s). Provisório: 600.
@export var velocidade_horizontal_pocao: float = 600.0
## Gravidade da poção (px/s²). Provisório: 1800. Maior = arco mais baixo.
@export var gravidade_pocao: float = 1800.0
@export var cena_pocao: PackedScene

@export_group("Poça")
## Quanto tempo a poça fica na arena (s). GDD: 5.
@export_range(0.5, 20.0, 0.5, "suffix:s") var duracao_poca: float = 5.0
## Máximo de poças ao mesmo tempo; a mais antiga some quando cai uma nova. GDD: 2.
@export var max_pocas: int = 2
## Veneno: tempo seguido dentro da poça para perder um golpe (s). GDD: 1.
@export_range(0.1, 5.0, 0.1, "suffix:s") var tempo_veneno: float = 1.0
## Veneno: golpes tirados. GDD: 1.
@export var golpes_veneno: int = 1
## Lentidão: quanto o Curupira fica mais lento dentro da poça (0,4 = 40%). GDD: 40%.
@export_range(0.0, 0.9, 0.05) var lentidao: float = 0.4
@export var cena_poca: PackedScene

@export_group("Bote de jacaré")
## Aviso: agacha com a bocarra aberta (s). Provisório: 0,9 (era 0,6).
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_bote: float = 0.9
## Velocidade do deslize de barriga (px/s). Provisório: 1100.
@export var velocidade_bote: float = 1100.0
## Onde ela para, medido da parede (px). Desliza até a parede do lado do Curupira e fica lá.
## Provisório: 150 (o mesmo limite de antes).
@export var margem_parede_bote: float = 150.0
## Golpes de quem for abocanhado. Provisório: 1.
@export var golpes_bote: int = 1

@export_group("Canção de ninar (melodia)")
## As notas vêm uma de cada vez: grave (rente ao chão; pula-se) ou aguda (na altura do peito;
## abaixa-se). Antes eram duas fileiras com uma brecha menor que o Curupira em pé.
## Aviso antes da primeira nota (s). Provisório: 0,9.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_ninar: float = 0.9
## Quantas notas por canção. Provisório: 6.
@export var quantidade_notas: int = 6
## Tempo entre uma nota e a próxima (s). Provisório: 0,7 (dá para pular uma e abaixar para a
## seguinte: o pulo dura ~0,79 s).
@export_range(0.1, 2.0, 0.05, "suffix:s") var intervalo_notas: float = 0.7
## Velocidade das notas (px/s). Provisório: 400.
@export var velocidade_notas: float = 400.0
## Altura do meio da nota acima do chão (px); a nota tem raio 14.
## Grave: 36 (de 22 a 50 px; acerta o Curupira agachado, pula-se). Provisório.
## Aguda: 128 (de 114 a 142 px; passa por cima do Curupira agachado, que tem 86). Provisório.
@export var altura_nota_grave: float = 36.0
@export var altura_nota_aguda: float = 128.0
## Chance de cada nota ser aguda (o resto é grave). Provisório: 0,5.
@export_range(0.0, 1.0, 0.05) var chance_nota_aguda: float = 0.5
## Golpes por nota. Provisório: 1.
@export var golpes_nota: int = 1
@export var cena_nota: PackedScene
