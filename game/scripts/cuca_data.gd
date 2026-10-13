class_name CucaData
extends ChefeData
## Números da Cuca. Os marcados "GDD" vêm do GDD; os "provisório" foram combinados
## com o Arthur e devem ser ajustados testando.
## Nome, vida (GDD: 1600), pausa entre ataques (GDD: 1,6 s) e contato ficam em ChefeData
## e estão preenchidos no cuca.tres.

@export_group("Feitiço (três em leque)")
## Aviso antes do feitiço (s). GDD: 0,5.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_feitico: float = 0.5
## Golpes por feitiço. GDD: 1.
@export var golpes_feitico: int = 1
## Quantos feitiços no leque. Combinado: 3.
@export var quantidade_feiticos: int = 3
## Ângulo entre um feitiço e o vizinho (graus). O do meio mira no Curupira. Provisório: 15.
@export_range(0.0, 45.0, 1.0, "suffix:°") var abertura_feitico: float = 15.0
## Velocidade dos feitiços (px/s). Combinado: 700.
@export var velocidade_feitico: float = 700.0
@export var cena_feitico: PackedScene

@export_group("Poção")
## Aviso antes de jogar a poção (s). GDD: 0,6.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_pocao: float = 0.6
## A Cuca fica parada depois da poção (s); é a janela para atacar. Combinado: 1,5.
## Esta parada substitui a pausa normal entre ataques.
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
