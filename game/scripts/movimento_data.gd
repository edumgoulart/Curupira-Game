class_name MovimentoData
extends Resource
## Valores de movimento de um personagem.
## Fica num .tres separado para balancear pelo inspetor sem mexer no código.

@export_group("Movimento (valores do GDD)")
## Velocidade horizontal (px/s). GDD: 600 — cruza a tela em ~3,2 s.
@export var velocidade: float = 600.0
## Velocidade inicial do pulo, para cima (px/s). GDD: 1100 — sobe ~215 px.
@export var velocidade_pulo: float = 1100.0
## Gravidade do próprio personagem (px/s²), não a global do projeto. GDD: 2800.
@export var gravidade: float = 2800.0

@export_group("Dash (valores do GDD)")
## Distância percorrida pelo dash (px). GDD: 300.
@export var distancia_dash: float = 300.0
## Duração do dash (s). O Curupira fica invencível durante todo esse tempo. GDD: 0,2.
@export_range(0.05, 1.0, 0.01, "suffix:s") var duracao_dash: float = 0.2
## Recarga (s), contada a partir do fim do dash. GDD: 0,8.
@export_range(0.0, 3.0, 0.05, "suffix:s") var recarga_dash: float = 0.8

@export_group("Game feel (provisório, ajustar testando)")
## Tempo (s) em que o pulo ainda sai depois de o personagem sair da borda do chão.
@export_range(0.0, 0.3, 0.01, "suffix:s") var coyote_time: float = 0.1
## Tempo (s) que um aperto de pulo feito no ar fica guardado, esperando o personagem tocar o chão.
@export_range(0.0, 0.3, 0.01, "suffix:s") var jump_buffer: float = 0.1
## Multiplica a velocidade de subida quando o jogador solta o pulo antes do topo.
## 1 = desliga o pulo variável (sempre pulo cheio). Menor = pulo curto mais baixo.
@export_range(0.0, 1.0, 0.05) var corte_pulo: float = 0.5
