class_name CargaEspecial
extends Node
## Barra do especial (GDD: 100 pontos). Sobe por ACERTOS do ataque básico, não por dano.
## Só conta e avisa por sinal; o Curupira decide quando gastar e o HUD desenha.

signal carga_mudou(atual: int, maximo: int)

var maximo: int = 100
var atual: int = 0


func configurar(novo_maximo: int) -> void:
	maximo = novo_maximo
	atual = 0
	carga_mudou.emit(atual, maximo)


func adicionar(quantidade: int) -> void:
	if atual >= maximo:
		return
	atual = mini(atual + quantidade, maximo)
	carga_mudou.emit(atual, maximo)


func esta_cheia() -> bool:
	return atual >= maximo


func gastar() -> void:
	atual = 0
	carga_mudou.emit(atual, maximo)
