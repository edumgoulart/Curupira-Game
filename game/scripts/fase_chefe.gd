class_name FaseChefe
extends Resource
## Uma fase da luta de um chefe: quando ela começa e o que o chefe faz nela.
## Cada chefe tem uma lista de fases por dificuldade (ChefeData.fases_normal / fases_expert).
##
## Combinado com o Eduardo:
##   Normal — Mula, Cuca e Boto: 1 fase; Máquina: 2 (troca na metade da vida).
##   Expert — Mula, Cuca e Boto: 2 fases (metade); Máquina: 3 (terços).
## Na fase com combos, o chefe às vezes encadeia dois ataques (ComboChefe) em vez de um só.

## Fração da vida em que a fase começa. A primeira fase usa 1,0 (o começo da luta);
## 0,5 = quando o chefe perde metade da vida.
@export_range(0.0, 1.0, 0.01) var comeca_com_vida: float = 1.0
## Ataques sorteados um de cada vez, em "saco": cada um sai uma vez por rodada, em ordem
## embaralhada (nomes que o script do chefe conhece).
@export var ataques: Array[StringName] = []
## Combos possíveis nesta fase. Vazio = a fase não tem combos.
@export var combos: Array[ComboChefe] = []
## Chance de a próxima jogada ser um combo em vez de um ataque só (0 a 1). Provisório: ajustar
## testando. A primeira jogada depois da transição é sempre um combo, para mostrar a novidade.
@export_range(0.0, 1.0, 0.05) var chance_combo: float = 0.0
## Multiplica a pausa entre ataques do chefe nesta fase (1 = a pausa do GDD). Provisório: 1.
@export_range(0.2, 2.0, 0.05) var fator_pausa: float = 1.0
