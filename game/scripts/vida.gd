class_name Vida
extends Node
## Contador de vida genérico (Curupira em golpes, chefes em pontos de vida).
## Só conta e avisa por sinais; quem é dono decide o que acontece (piscar, perder a fase...).
## O dono chama configurar() no _ready com o valor do seu .tres de dados.

signal vida_mudou(atual: int, maximo: int)
signal zerou

var maximo: int = 1
var atual: int = 1


func configurar(novo_maximo: int) -> void:
	maximo = novo_maximo
	atual = maximo
	vida_mudou.emit(atual, maximo)


func perder(quantidade: int) -> void:
	if atual <= 0:
		return
	atual = maxi(atual - quantidade, 0)
	vida_mudou.emit(atual, maximo)
	if atual == 0:
		zerou.emit()


func esta_viva() -> bool:
	return atual > 0
