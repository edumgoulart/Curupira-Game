extends Node2D
## Cena de teste de vida/dano: o level1 (com o espinho) + vida na tela.
## Mostra a vida do Curupira e reinicia a cena 2 s depois da derrota.

@onready var curupira: CharacterBody2D = $Level1/Curupira
@onready var texto: Label = $Texto


func _ready() -> void:
	curupira.vida.vida_mudou.connect(_ao_mudar_vida)
	curupira.derrotado.connect(_ao_ser_derrotado)
	_ao_mudar_vida(curupira.vida.atual, curupira.vida.maximo)


func _ao_mudar_vida(atual: int, maximo: int) -> void:
	texto.text = "Vida: %d / %d" % [atual, maximo]


func _ao_ser_derrotado() -> void:
	texto.text = "Derrota! Reiniciando em 2 s..."
	await get_tree().create_timer(2.0).timeout
	get_tree().reload_current_scene()
