class_name BotoData
extends ChefeData
## Números do Boto cor-de-rosa. Os marcados "GDD" vêm do GDD; os "provisório" ainda não
## estão no GDD (Q16) e devem ser ajustados testando.
## Nome, vida (GDD: 2000), pausa entre ataques (GDD: 2 s), contato e fases ficam em ChefeData
## e estão preenchidos no boto.tres.
## Ataques (nomes usados nas fases): jato, beijos, chapeu, salto.

@export_group("Jato de água")
## Aviso antes do jato: incha e puxa água para o bico (s). GDD: 0,7.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_jato: float = 0.7
## Quanto tempo o jato fica ligado (s). Provisório: 0,5.
@export_range(0.1, 3.0, 0.05, "suffix:s") var duracao_jato: float = 0.5
## Golpes do jato. GDD: 1.
@export var golpes_jato: int = 1
## O Boto fica parado depois do jato (s); é a janela para atacar. GDD: 1,2.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_jato: float = 1.2
@export var cena_jato: PackedScene

@export_group("Beijos de bolha")
## Aviso antes dos beijos (s). Provisório: 0,4.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_beijos: float = 0.4
## Quantos corações. Provisório: 4.
@export var quantidade_beijos: int = 4
## Tempo entre um beijo e o próximo (s). Provisório: 0,45.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_beijos: float = 0.45
## Velocidade dos corações (px/s). Provisório: 280.
@export var velocidade_beijo: float = 280.0
## Altura da onda (px) e ondas por segundo. Provisório: 40 e 0,7.
@export var amplitude_beijo: float = 40.0
@export var frequencia_beijo: float = 0.7
## Depois desse tempo o coração estoura sozinho (s). Provisório: 7.
@export var duracao_beijo: float = 7.0
## Golpes por coração. Provisório: 1.
@export var golpes_beijo: int = 1
@export var cena_coracao: PackedScene

@export_group("Chapéu bumerangue")
## Aviso: gira o chapéu na nadadeira (s). Provisório: 0,6.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_chapeu: float = 0.6
## Tempo da ida e da volta (s). Provisório: 0,9 e 0,9.
@export_range(0.2, 3.0, 0.05, "suffix:s") var duracao_ida_chapeu: float = 0.9
@export_range(0.2, 3.0, 0.05, "suffix:s") var duracao_volta_chapeu: float = 0.9
## Altura da ida (rente ao chão, pula-se por cima) e da volta (abaixa-se), acima do chão (px).
## Provisório: 40 e 220.
@export var altura_ida_chapeu: float = 40.0
@export var altura_volta_chapeu: float = 220.0
## Onde o chapéu vira, medido da parede do outro lado (px). Provisório: 160.
@export var margem_chapeu: float = 160.0
## Golpes do chapéu. Provisório: 1.
@export var golpes_chapeu: int = 1
@export var cena_chapeu: PackedScene

@export_group("Salto para o outro lado")
## Duração do salto (s). Provisório: 1,4.
@export_range(0.3, 4.0, 0.05, "suffix:s") var duracao_pulo: float = 1.4
## Altura do arco do salto (px). Provisório: 520 (passa por cima do Curupira no meio da arena).
@export var altura_pulo: float = 520.0
## Bolhas soltas durante o salto. GDD: 3.
@export var quantidade_bolhas: int = 3
## Golpes por bolha. GDD: 1.
@export var golpes_bolha: int = 1
## Velocidade com que as bolhas descem (px/s). Provisório: 120 ("bolhas lentas", GDD).
@export var velocidade_bolha: float = 120.0
@export var cena_bolha: PackedScene


func _init() -> void:
	ataques_fase_1 = [&"jato", &"beijos"]
	ataques_fase_2 = [&"jato", &"beijos", &"chapeu"]
	ataques_fase_3 = [&"jato", &"beijos", &"chapeu", &"salto"]
