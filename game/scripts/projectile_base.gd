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
## Desenhos por direção (pixel art não gira). O desenho do node "Visual" é o de lado.
## Para baixo usa os de cima espelhados na vertical. Vazio = só espelha o de lado.
@export var quadros_cima: Array[Texture2D] = []
@export var quadros_diagonal: Array[Texture2D] = []

var dano: int = 1
var velocidade: float = 1000.0
## 1 = direita, -1 = esquerda.
var direcao: float = 1.0
## Mira em graus: 0 = para a frente, -45 = diagonal para cima, -90 = cima, 45 e 90 para baixo.
var angulo_mira: float = 0.0
## Graus por segundo que consegue virar atrás do chefe. 0 = reto.
var curva: float = 0.0
## Tempo máximo no ar (s). 0 = até sair da tela.
var duracao_maxima: float = 0.0
## Veneno aplicado na hurtbox atingida (dano por segundo e duração). 0 = sem veneno.
var veneno_por_segundo: int = 0
var duracao_veneno: float = 0.0
## Lentidão aplicada na hurtbox atingida (0,4 = 40%) e duração. 0 = sem lentidão.
var lentidao: float = 0.0
var duracao_lentidao: float = 0.0

var _velocidade: Vector2 = Vector2.ZERO
var _tempo: float = 0.0


func configurar(novo_dano: int, nova_velocidade: float, nova_direcao: float, novo_angulo: float = 0.0) -> void:
	dano = novo_dano
	velocidade = nova_velocidade
	direcao = nova_direcao
	angulo_mira = novo_angulo


func _ready() -> void:
	var a: float = deg_to_rad(angulo_mira)
	_velocidade = Vector2(direcao * cos(a), sin(a)) * velocidade
	if curva > 0.0:
		# O perseguidor gira inteiro na direção do voo (o desenho aponta para a direita).
		rotation = _velocidade.angle()
		return
	# Reto: escolhe o desenho da direção e espelha; a forma de colisão é simétrica.
	var visual := get_node_or_null("Visual") as AnimacaoQuadros
	var vertical: float = absf(angulo_mira)
	if visual and vertical > 67.0 and not quadros_cima.is_empty():
		visual.trocar_quadros(quadros_cima)
	elif visual and vertical > 22.0 and not quadros_diagonal.is_empty():
		visual.trocar_quadros(quadros_diagonal)
	for filho in get_children():
		if filho is Sprite2D or filho is Polygon2D:
			filho.scale.x = absf(filho.scale.x) * direcao
			# Para baixo: o desenho de cima (ou da diagonal) virado de cabeça para baixo.
			if filho == visual and angulo_mira > 22.0 and vertical > 22.0:
				filho.scale.y = -absf(filho.scale.y)


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
		if lentidao > 0.0 and area.has_method("aplicar_efeito"):
			area.aplicar_efeito(&"lentidao", lentidao, duracao_lentidao)
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
