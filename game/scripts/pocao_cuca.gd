class_name PocaoCuca
extends Area2D
## Poção da Cuca: arremessada em arco para cair onde o Curupira estava. Não machuca
## por si só; ao bater no chão vira uma poça (veneno ou lentidão).
## Layer enemy_hitbox; mask world (só precisa saber quando bate no chão).

var tipo: PocaCuca.Tipo = PocaCuca.Tipo.VENENO
var dados: CucaData
var _velocidade: Vector2 = Vector2.ZERO
var _gravidade: float = 0.0
var _chao_y: float = 0.0


## Calcula a velocidade inicial para a poção sair de onde está e cair em "destino".
## A velocidade horizontal é fixa, então o tempo de voo depende da distância.
func lancar(destino: Vector2, novo_tipo: PocaCuca.Tipo, novos_dados: CucaData) -> void:
	tipo = novo_tipo
	dados = novos_dados
	_gravidade = dados.gravidade_pocao
	_chao_y = destino.y
	var dx: float = destino.x - global_position.x
	var dy: float = destino.y - global_position.y
	var tempo_voo: float = maxf(absf(dx) / dados.velocidade_horizontal_pocao, 0.3)
	# Movimento uniformemente variado: dy = vy·t + g·t²/2  ->  vy = (dy - g·t²/2) / t
	_velocidade = Vector2(dx / tempo_voo, (dy - 0.5 * _gravidade * tempo_voo * tempo_voo) / tempo_voo)


func _ready() -> void:
	add_to_group("ataques_chefe")
	body_entered.connect(_ao_bater)
	# A cor do frasco já mostra o tipo da poça (verde = veneno, roxo = lentidão).
	$Veneno.visible = tipo == PocaCuca.Tipo.VENENO
	$Lentidao.visible = tipo == PocaCuca.Tipo.LENTIDAO


func _physics_process(delta: float) -> void:
	_velocidade.y += _gravidade * delta
	position += _velocidade * delta
	rotation += 8.0 * delta  # gira no ar (só visual)


func _ao_bater(_corpo: Node2D) -> void:
	var poca: PocaCuca = dados.cena_poca.instantiate()
	poca.configurar(tipo, dados)
	poca.global_position = Vector2(global_position.x, _chao_y)
	# call_deferred: estamos dentro de um sinal de colisão, e o Godot não deixa criar
	# áreas de colisão no meio do cálculo da física ("flushing queries"). Adia para o fim do frame.
	get_tree().current_scene.add_child.call_deferred(poca)
	queue_free()
