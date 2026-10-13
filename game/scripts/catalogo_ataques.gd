class_name CatalogoAtaques
extends Resource
## Lista de todos os ataques do jogo. A tela de seleção mostra só os liberados
## (campo fase_que_libera de cada ataque + fases concluídas no GameState).
## Ataque novo = criar o .tres e acrescentar aqui.

@export var basicos: Array[AtaqueData] = []
@export var especiais: Array[EspecialData] = []
