extends CharacterBody2D
## Curupira — movimento lateral com gravidade, game feel, dash e ataque básico.
##
## Animações usadas (criar no SpriteFrames do AnimatedSprite2D com estes nomes exatos):
##   idle   — parado no chão
##   correr — andando no chão
##   pular  — subindo no ar
##   cair   — descendo no ar
##   dash   — durante o dash (0,2 s)
## Se uma animação ainda não existir, o código só não troca para ela (não dá erro).

enum Estado { PARADO, CORRENDO, PULANDO, CAINDO, DASH }

## Valores de movimento (velocidade, pulo, gravidade, dash, game feel). Editar o .tres no inspetor.
@export var dados: MovimentoData

var estado: Estado = Estado.PARADO
## 1 = direita, -1 = esquerda. Define o lado para onde o Curupira atira e dá o dash.
var olhando_para: int = 1

# Contadores regressivos (s). Enquanto > 0, a janela está aberta.
var _tempo_coyote: float = 0.0
var _tempo_buffer_pulo: float = 0.0
var _tempo_dash: float = 0.0
var _tempo_recarga_dash: float = 0.0
# No ar só pode um dash por pulo; volta a valer ao tocar o chão.
var _dash_aereo_disponivel: bool = true

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var atirador: Atirador = $Atirador


func _ready() -> void:
	if dados == null:
		push_warning("Curupira sem MovimentoData no campo 'dados'; usando os valores padrão do GDD.")
		dados = MovimentoData.new()


func _physics_process(delta: float) -> void:
	_atualizar_janelas(delta)

	match estado:
		Estado.DASH:
			_processar_dash(delta)
		_:
			_processar_movimento_normal(delta)

	move_and_slide()
	_atualizar_estado()
	_atualizar_animacao()

	# Segurar o botão atira sem parar; a cadência fica com o Atirador. Não atira durante o dash.
	if estado != Estado.DASH and Input.is_action_pressed("attack_basic"):
		atirador.tentar_atirar(olhando_para)


## Usado pelo sistema de dano: enquanto true, o Curupira não leva golpe.
func esta_invencivel() -> bool:
	return estado == Estado.DASH


func _processar_movimento_normal(delta: float) -> void:
	_aplicar_gravidade(delta)
	_mover_horizontal()
	if _tentar_dash():
		return
	_tentar_pular()
	_cortar_pulo()


## Coyote time: recarrega enquanto está no chão e vai esvaziando no ar.
## Jump buffer: abre a cada aperto de pulo e vai esvaziando.
## Também recarrega o dash aéreo ao tocar o chão e conta a recarga do dash.
func _atualizar_janelas(delta: float) -> void:
	if is_on_floor():
		_tempo_coyote = dados.coyote_time
		_dash_aereo_disponivel = true
	else:
		_tempo_coyote -= delta

	if Input.is_action_just_pressed("jump"):
		_tempo_buffer_pulo = dados.jump_buffer
	else:
		_tempo_buffer_pulo -= delta

	_tempo_recarga_dash -= delta


func _aplicar_gravidade(delta: float) -> void:
	if not is_on_floor():
		velocity.y += dados.gravidade * delta


func _mover_horizontal() -> void:
	# get_axis já anula esquerda + direita juntas. signf deixa o analógico com
	# velocidade fixa (sem "andar devagar" com o analógico meio inclinado).
	var direcao: float = signf(Input.get_axis("move_left", "move_right"))
	velocity.x = direcao * dados.velocidade
	if direcao != 0.0:
		olhando_para = int(direcao)
		sprite.flip_h = olhando_para < 0


## O pulo sai quando as duas janelas estão abertas ao mesmo tempo:
## houve aperto recente (buffer) e o Curupira está/estava no chão (coyote).
func _tentar_pular() -> void:
	if _tempo_buffer_pulo > 0.0 and _tempo_coyote > 0.0:
		velocity.y = -dados.velocidade_pulo
		# Zera as duas para o mesmo aperto não gerar um segundo pulo.
		_tempo_buffer_pulo = 0.0
		_tempo_coyote = 0.0
		# Pulo vindo do buffer cujo botão já foi solto antes de tocar o chão: vira pulo curto.
		if not Input.is_action_pressed("jump"):
			velocity.y *= dados.corte_pulo


## Pulo variável: soltar o botão durante a subida corta a velocidade, e o pulo fica mais baixo.
func _cortar_pulo() -> void:
	if Input.is_action_just_released("jump") and velocity.y < 0.0:
		velocity.y *= dados.corte_pulo


## Retorna true se o dash começou neste frame.
func _tentar_dash() -> bool:
	if not Input.is_action_just_pressed("dash") or _tempo_recarga_dash > 0.0:
		return false
	var no_ar: bool = not is_on_floor()
	if no_ar and not _dash_aereo_disponivel:
		return false
	if no_ar:
		_dash_aereo_disponivel = false

	estado = Estado.DASH
	_tempo_dash = dados.duracao_dash
	# Dash reto na horizontal, para o lado em que está olhando
	# (_mover_horizontal já virou o Curupira se havia direção apertada).
	velocity = Vector2(olhando_para * dados.distancia_dash / dados.duracao_dash, 0.0)
	return true


## Durante o dash a velocidade é constante e a gravidade não age.
## Ao acabar, volta ao movimento normal já neste frame (sem um frame parado).
func _processar_dash(delta: float) -> void:
	_tempo_dash -= delta
	# is_zero_approx: 0,2 - 12 × (1/60) dá 0,0000000001 em float, não 0. Sem isso
	# o dash ganharia um 13º frame (325 px e invencibilidade a mais).
	if _tempo_dash > 0.0 and not is_zero_approx(_tempo_dash):
		velocity.y = 0.0
		return
	estado = Estado.CAINDO  # provisório; _atualizar_estado corrige depois do move_and_slide
	velocity = Vector2.ZERO
	_tempo_recarga_dash = dados.recarga_dash
	_processar_movimento_normal(delta)


## O estado é derivado da física depois do move_and_slide.
## O dash é a exceção: só sai dele quando o tempo acaba (_processar_dash).
func _atualizar_estado() -> void:
	if estado == Estado.DASH:
		return
	if is_on_floor():
		estado = Estado.CORRENDO if velocity.x != 0.0 else Estado.PARADO
	else:
		estado = Estado.PULANDO if velocity.y < 0.0 else Estado.CAINDO


func _atualizar_animacao() -> void:
	match estado:
		Estado.PARADO:
			_tocar(&"idle")
		Estado.CORRENDO:
			_tocar(&"correr")
		Estado.PULANDO:
			_tocar(&"pular")
		Estado.CAINDO:
			_tocar(&"cair")
		Estado.DASH:
			_tocar(&"dash")


func _tocar(nome: StringName) -> void:
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(nome):
		return
	if sprite.animation != nome or not sprite.is_playing():
		sprite.play(nome)
