class_name BotoData
extends ChefeData
## Números do Boto cor-de-rosa. Os marcados "GDD" vêm do GDD; os "provisório" foram
## combinados com o Arthur e devem ser ajustados testando.
## Nome, vida (GDD: 2000), pausa entre ataques (GDD: 2 s) e contato ficam em ChefeData
## e estão preenchidos no boto.tres.

@export_group("Jato de água")
## Aviso antes do jato (s). GDD: 0,7.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_jato: float = 0.7
## Quanto tempo o jato fica ligado (s). Provisório: 0,4.
## Com o pulo do Curupira, só pulando dá para desviar se o jato durar até ~0,6 s; com 0,4 a
## janela para apertar o pulo é de ~0,27 s antes do jato. Mais tempo = mais difícil.
@export_range(0.1, 3.0, 0.05, "suffix:s") var duracao_jato: float = 0.4
## Altura do centro do jato acima do chão (px). Provisório: 35 (rente ao chão).
@export var altura_jato: float = 35.0
## Golpes do jato. GDD: 1.
@export var golpes_jato: int = 1
## O Boto fica parado depois do jato (s); é a janela para atacar. GDD: 1,2.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_jato: float = 1.2
@export var cena_jato: PackedScene
## Aviso visual do jato: o Boto suga água pela boca.
@export var cena_succao: PackedScene

@export_group("Pulo de um lado para o outro")
## Duração do pulo (s). Provisório: 1,4 (fecha ~6 s por lado, como no GDD).
@export_range(0.3, 4.0, 0.05, "suffix:s") var duracao_pulo: float = 1.4
## Altura do arco do pulo (px). Provisório: 520 (passa por cima do Curupira no meio da arena).
@export var altura_pulo: float = 520.0
## Bolhas soltas durante o pulo. GDD: 3.
@export var quantidade_bolhas: int = 3
## Golpes por bolha. GDD: 1.
@export var golpes_bolha: int = 1
## Velocidade com que as bolhas descem (px/s). Provisório: 120 ("bolhas lentas", GDD).
@export var velocidade_bolha: float = 120.0
@export var cena_bolha: PackedScene
