class_name Projetil
extends Area2D
## Projétil do Curupira (hitbox): usado pelo básico e pelo especial.
## Vai em linha reta, ou persegue o chefe se "curva" > 0 (Feitiço Perseguidor).
## Pode envenenar o chefe ao acertar (Poção Maldita). Quem dispara chama configurar()
## e preenche curva / veneno antes de pôr na cena.
##
## Colisão resolvida por layer/mask na cena (sem if no código):
##   layer = player_hitbox; mask = world (some ao bater na parede) + enemy (acerta hurtbox de chefe).
## Ao encostar numa área com take_damage (uma Hurtbox), causa dano, avisa "acertou" e some.

## Emitido quando acerta uma hurtbox. O Atirador usa para carregar o especial.
signal acertou(alvo: Area2D)

## Efeito criado no ponto de impacto (ex.: pequena explosão da Bola de Fogo). Opcional, só visual.
@export var cena_impacto: PackedScene

var dano: int = 1
var velocidade: float = 1000.0
## 1 = direita, -1 = esquerda.
var direcao: float = 1.0
## Graus por segundo que consegue virar atrás do chefe. 0 = reto.
var curva: float = 0.0
## Tempo máximo no ar (s). 0 = até sair da tela.
var duracao_maxima: float = 0.0
## Veneno aplicado na hurtbox atingida (dano por segundo e duração). 0 = sem veneno.
var veneno_por_segundo: int = 0
var duracao_veneno: float = 0.0

var _velocidade: Vector2 = Vector2.ZERO
var _tempo: float = 0.0


func configurar(novo_dano: int, nova_velocidade: float, nova_direcao: float) -> void:
	dano = novo_dano
	velocidade = nova_velocidade
	direcao = nova_direcao


func _ready() -> void:
	_velocidade = Vector2(direcao * velocidade, 0.0)
	if curva > 0.0:
		# O perseguidor gira inteiro na direção do voo (o desenho aponta para a direita).
		rotation = _velocidade.angle()
		return
	# Reto: espelha só o visual; a forma de colisão é simétrica.
	for filho in get_children():
		if filho is Sprite2D or filho is Polygon2D:
			filho.scale.x = absf(filho.scale.x) * direcao


func _physics_process(delta: float) -> void:
	_tempo += delta
	if duracao_maxima > 0.0 and _tempo >= duracao_maxima:
		queue_free()
		return
	if curva > 0.0:
		_perseguir(delta)
	position += _velocidade * delta


## Vira a velocidade na direção do chefe mais próximo, no máximo "curva" graus por segundo.
## Os chefes ficam no grupo "chefes" (classe Chefe).
func _perseguir(delta: float) -> void:
	var alvo: Chefe = null
	for chefe in get_tree().get_nodes_in_group("chefes"):
		if chefe.derrotado:
			continue
		if alvo == null or global_position.distance_to(chefe.ponto_de_mira()) < global_position.distance_to(alvo.ponto_de_mira()):
			alvo = chefe
	if alvo == null:
		return
	var desejado: float = (alvo.ponto_de_mira() - global_position).angle()
	var diferenca: float = wrapf(desejado - _velocidade.angle(), -PI, PI)
	var maximo: float = deg_to_rad(curva) * delta
	_velocidade = _velocidade.rotated(clampf(diferenca, -maximo, maximo))
	rotation = _velocidade.angle()


func _on_area_entered(area: Area2D) -> void:
	if area.has_method("take_damage"):
		area.take_damage(dano, self)
		if veneno_por_segundo > 0 and area.has_method("aplicar_efeito"):
			area.aplicar_efeito(&"veneno", veneno_por_segundo, duracao_veneno)
		acertou.emit(area)
	_impactar()


func _on_body_entered(_body: Node2D) -> void:
	_impactar()


func _on_screen_exited() -> void:
	queue_free()


func _impactar() -> void:
	if cena_impacto:
		var efeito: Node2D = cena_impacto.instantiate()
		efeito.global_position = global_position
		get_tree().current_scene.add_child(efeito)
	queue_free()
