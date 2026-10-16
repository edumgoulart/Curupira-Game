class_name EfeitoDash
extends Node2D
## Efeito visual do dash do Curupira (só visual, não mexe em movimento nem invencibilidade).
## O Curupira chama comecar() quando o dash sai e terminar() quando ele acaba.
##   - fantasmas: cópias do quadro atual do sprite, em silhueta verde, que ficam para trás
##     e somem (mostram o caminho e que ele está "intocável");
##   - corpo: estica na direção do dash e inclina para a frente; no fim volta com um "pulinho";
##   - clarão: o sprite brilha no instante em que o dash sai;
##   - folhas: uma rajada de folhas no início e um rastro de folhas durante o dash;
##   - vento: riscos de vento do ponto de partida até o corpo, que se recolhem no fim.
## Os fantasmas copiam o quadro que estiver tocando: quando existir a animação "dash" no
## SpriteFrames, eles passam a ter o formato dela sem mudar nada aqui.

## Sprite do Curupira (o efeito copia o quadro dele e estica/inclina ele).
@export var sprite: AnimatedSprite2D

@export_group("Fantasmas")
## Tempo entre um fantasma e o próximo (s).
@export_range(0.01, 0.2, 0.005, "suffix:s") var intervalo_fantasma: float = 0.03
## Quanto tempo cada fantasma leva para sumir (s).
@export_range(0.05, 1.0, 0.01, "suffix:s") var duracao_fantasma: float = 0.25
## Cor do primeiro fantasma (perto do ponto de partida) e do último (perto do corpo).
@export var cor_fantasma_inicio: Color = Color(0.15, 0.75, 0.4, 0.55)
@export var cor_fantasma_fim: Color = Color(0.7, 1.0, 0.55, 0.8)

@export_group("Corpo")
## Quanto o corpo estica (x) e achata (y) durante o dash.
@export var esticar: Vector2 = Vector2(1.25, 0.85)
## Inclinação para a frente durante o dash (graus).
@export_range(0.0, 45.0, 1.0, "suffix:°") var inclinacao: float = 10.0
## Tempo para o corpo voltar ao normal depois do dash (s).
@export_range(0.05, 0.5, 0.01, "suffix:s") var duracao_volta: float = 0.18
## Brilho do clarão no início (1 = sem clarão).
@export_range(1.0, 3.0, 0.1) var brilho_clarao: float = 1.8

@export_group("Vento")
## Tempo para os riscos de vento se recolherem depois do dash (s).
@export_range(0.05, 0.5, 0.01, "suffix:s") var duracao_vento: float = 0.15

const MATERIAL_SILHUETA: Shader = preload("res://scripts/silhueta.gdshader")

var _ativo: bool = false
var _direcao: float = 1.0
var _tempo_fantasma: float = 0.0
var _tempo_dash: float = 0.0
var _duracao_dash: float = 0.2
var _escala_base: Vector2 = Vector2.ONE
var _tween_corpo: Tween
var _material: ShaderMaterial
# Vento: de onde o dash saiu; depois do fim, quanto falta para os riscos sumirem.
var _partida: Vector2 = Vector2.ZERO
var _tempo_recolher: float = 0.0

## Onde os fantasmas e os riscos ficam: fora do Curupira (top_level), para não andarem junto.
@onready var rastro: Node2D = $Rastro
@onready var vento: Node2D = $Vento
@onready var folhas: CPUParticles2D = $Folhas
@onready var rajada: CPUParticles2D = $Rajada


func _ready() -> void:
	if sprite:
		_escala_base = sprite.scale
	_material = ShaderMaterial.new()
	_material.shader = MATERIAL_SILHUETA
	folhas.emitting = false
	vento.visible = false


## direcao: -1 = esquerda, 1 = direita. duracao: duração do dash (s), para o degradê dos fantasmas.
func comecar(direcao: float, duracao: float) -> void:
	_ativo = true
	_direcao = signf(direcao) if direcao != 0.0 else 1.0
	_tempo_fantasma = 0.0
	_tempo_dash = 0.0
	_duracao_dash = maxf(duracao, 0.01)
	_tempo_recolher = 0.0

	# Folhas saem para trás do dash.
	var para_tras := Vector2(-_direcao, -0.35).normalized()
	folhas.direction = para_tras
	rajada.direction = para_tras
	folhas.emitting = true
	rajada.restart()

	_partida = global_position
	vento.visible = true
	vento.modulate.a = 1.0
	_atualizar_vento()

	_criar_fantasma()
	_animar_corpo_inicio()


func terminar() -> void:
	if not _ativo:
		return
	_ativo = false
	folhas.emitting = false
	_criar_fantasma()
	_tempo_recolher = duracao_vento
	_animar_corpo_fim()


func _physics_process(delta: float) -> void:
	if _ativo:
		_tempo_fantasma += delta
		_tempo_dash += delta
		while _tempo_fantasma >= intervalo_fantasma:
			_tempo_fantasma -= intervalo_fantasma
			_criar_fantasma()
		_atualizar_vento()
	elif _tempo_recolher > 0.0:
		_tempo_recolher -= delta
		_atualizar_vento()
		if _tempo_recolher <= 0.0:
			vento.visible = false


## Cópia do quadro atual do sprite, parada onde o Curupira estava, que some aos poucos.
func _criar_fantasma() -> void:
	if sprite == null or sprite.sprite_frames == null:
		return
	if not sprite.sprite_frames.has_animation(sprite.animation):
		return
	var textura: Texture2D = sprite.sprite_frames.get_frame_texture(sprite.animation, sprite.frame)
	if textura == null:
		return
	var fantasma := Sprite2D.new()
	fantasma.texture = textura
	fantasma.centered = sprite.centered
	fantasma.offset = sprite.offset
	fantasma.flip_h = sprite.flip_h
	fantasma.material = _material
	# Os primeiros (perto da partida) mais escuros; os últimos (perto do corpo) mais claros.
	var p: float = clampf(_tempo_dash / _duracao_dash, 0.0, 1.0)
	fantasma.modulate = cor_fantasma_inicio.lerp(cor_fantasma_fim, p)
	rastro.add_child(fantasma)
	fantasma.global_transform = sprite.global_transform

	var tween := fantasma.create_tween()
	tween.tween_property(fantasma, "modulate:a", 0.0, duracao_fantasma)
	tween.tween_callback(fantasma.queue_free)


## Estica e inclina para a frente na hora, com um clarão rápido.
func _animar_corpo_inicio() -> void:
	if sprite == null:
		return
	if _tween_corpo:
		_tween_corpo.kill()
	sprite.scale = _escala_base * esticar
	sprite.rotation = deg_to_rad(inclinacao) * _direcao
	sprite.modulate = Color(brilho_clarao, brilho_clarao, brilho_clarao)
	_tween_corpo = create_tween()
	_tween_corpo.tween_property(sprite, "modulate", Color.WHITE, 0.12)


## Volta ao tamanho e ao prumo com um leve exagero (efeito de mola).
func _animar_corpo_fim() -> void:
	if sprite == null:
		return
	if _tween_corpo:
		_tween_corpo.kill()
	sprite.modulate = Color.WHITE
	_tween_corpo = create_tween().set_parallel()
	_tween_corpo.tween_property(sprite, "scale", _escala_base, duracao_volta) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_tween_corpo.tween_property(sprite, "rotation", 0.0, duracao_volta) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


## Cada risco vai da cauda até logo atrás do corpo. Durante o dash a cauda fica parada no
## ponto de partida (o risco cresce); depois do fim ela corre até o corpo (o risco se recolhe).
func _atualizar_vento() -> void:
	var riscos: Array[Node] = vento.get_children()
	for i in riscos.size():
		var risco: Line2D = riscos[i] as Line2D
		if risco == null:
			continue
		# A altura de cada risco é a posição dele na cena (ajustável no editor).
		var altura: Vector2 = Vector2(0.0, risco.position.y)
		var cabeca: Vector2 = global_position + altura - Vector2(_direcao * 30.0, 0.0)
		var cauda: Vector2 = _partida + altura
		if not _ativo and duracao_vento > 0.0:
			var p: float = 1.0 - clampf(_tempo_recolher / duracao_vento, 0.0, 1.0)
			cauda = cauda.lerp(cabeca, p)
		# O Line2D desenha a partir da própria posição: desconta a altura dele.
		risco.points = PackedVector2Array([cauda - altura, cabeca - altura])
