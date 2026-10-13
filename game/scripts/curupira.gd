extends CharacterBody2D
## Curupira — movimento lateral com gravidade, game feel, dash, ataques e vida.
##
## Animações usadas (criar no SpriteFrames do AnimatedSprite2D com estes nomes exatos):
##   idle   — parado no chão
##   correr — andando no chão
##   pular  — subindo no ar
##   cair   — descendo no ar
##   dash   — durante o dash (0,2 s)
##   especial — parado disparando um especial contínuo (Canhão Flamejante, 1,5 s)
##   derrota — ao levar o último golpe (sem loop)
## Se uma animação ainda não existir, o código só não troca para ela (não dá erro).

enum Estado { PARADO, CORRENDO, PULANDO, CAINDO, DASH, ESPECIAL, DERROTADO }

## Emitido no último golpe. A arena escuta para mostrar a tela de derrota.
signal derrotado

## Valores de movimento (velocidade, pulo, gravidade, dash, game feel). Editar o .tres no inspetor.
@export var dados: MovimentoData
## Valores de vida (golpes, invencibilidade depois do golpe). Editar o .tres no inspetor.
@export var dados_vida: VidaJogadorData

var estado: Estado = Estado.PARADO
## 1 = direita, -1 = esquerda. Define o lado para onde o Curupira atira e dá o dash.
var olhando_para: int = 1

# Contadores regressivos (s). Enquanto > 0, a janela está aberta.
var _tempo_coyote: float = 0.0
var _tempo_buffer_pulo: float = 0.0
var _tempo_dash: float = 0.0
var _tempo_recarga_dash: float = 0.0
var _tempo_invencivel: float = 0.0
var _tempo_especial: float = 0.0
# No ar só pode um dash por pulo; volta a valer ao tocar o chão.
var _dash_aereo_disponivel: bool = true

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var atirador: Atirador = $Atirador
@onready var vida: Vida = $Vida
@onready var hurtbox: Hurtbox = $Hurtbox
@onready var carga: CargaEspecial = $CargaEspecial


func _ready() -> void:
	if dados == null:
		push_warning("Curupira sem MovimentoData no campo 'dados'; usando os valores padrão do GDD.")
		dados = MovimentoData.new()
	if dados_vida == null:
		push_warning("Curupira sem VidaJogadorData no campo 'dados_vida'; usando os valores padrão do GDD.")
		dados_vida = VidaJogadorData.new()

	# Hurtbox avisa que algo encostou -> take_damage decide se conta -> Vida desconta.
	hurtbox.golpe_recebido.connect(take_damage)
	vida.zerou.connect(_ao_zerar_vida)
	vida.configurar(dados_vida.golpes)

	# Acerto do básico -> Atirador avisa -> carga do especial sobe.
	atirador.acerto_basico.connect(carga.adicionar)
	if atirador.especial:
		carga.configurar(atirador.especial.carga_necessaria)


func _physics_process(delta: float) -> void:
	_atualizar_janelas(delta)

	match estado:
		Estado.DASH:
			_processar_dash(delta)
		Estado.ESPECIAL:
			_processar_especial(delta)
		Estado.DERROTADO:
			_processar_derrotado(delta)
		_:
			_processar_movimento_normal(delta)

	move_and_slide()
	_atualizar_estado()
	_atualizar_animacao()
	_atualizar_invencibilidade(delta)

	# Segurar o botão atira sem parar; a cadência fica com o Atirador.
	# Não atira durante o dash, disparando um especial nem derrotado.
	var pode_atirar: bool = estado != Estado.DASH and estado != Estado.ESPECIAL and estado != Estado.DERROTADO
	if pode_atirar and Input.is_action_pressed("attack_basic"):
		atirador.tentar_atirar(olhando_para)
	# Especial: só com a barra cheia; disparar zera a barra.
	if pode_atirar and Input.is_action_just_pressed("attack_special") and carga.esta_cheia():
		atirador.atirar_especial(olhando_para)
		carga.gastar()
		# Especial contínuo (Canhão Flamejante): fica parado enquanto dispara (GDD).
		if atirador.especial.duracao_disparo > 0.0:
			estado = Estado.ESPECIAL
			_tempo_especial = atirador.especial.duracao_disparo


## Chamado pela Hurtbox quando uma hitbox de inimigo encosta.
## amount = golpes (1 ou 2, conforme o ataque do chefe).
func take_damage(amount: int, _from: Node) -> void:
	# A hurtbox só desliga no fim do frame (set_deferred); esta checagem impede
	# que dois ataques encostando no mesmo frame tirem dois golpes.
	if esta_invencivel():
		return
	vida.perder(amount)
	if vida.esta_viva():
		_tempo_invencivel = dados_vida.invencibilidade_apos_golpe


## Enquanto true, o Curupira não leva golpe: no dash, logo depois de um golpe e derrotado.
func esta_invencivel() -> bool:
	if estado == Estado.DASH or estado == Estado.DERROTADO:
		return true
	return _tempo_invencivel > 0.0 and not is_zero_approx(_tempo_invencivel)


## Liga/desliga a hurtbox pela física em vez de ignorar golpes com if:
## com ela desligada as hitboxes não a enxergam; ao religar, se o Curupira ainda
## estiver dentro de um ataque, conta como encostar de novo e ele leva o golpe.
func _atualizar_invencibilidade(delta: float) -> void:
	_tempo_invencivel -= delta
	hurtbox.ligada = not esta_invencivel()

	# Pisca só na invencibilidade depois do golpe (no dash e derrotado fica visível).
	var piscando: bool = _tempo_invencivel > 0.0 and estado != Estado.DERROTADO
	if piscando:
		sprite.visible = int(_tempo_invencivel / dados_vida.intervalo_piscar) % 2 == 0
	else:
		sprite.visible = true


func _ao_zerar_vida() -> void:
	estado = Estado.DERROTADO
	_tempo_invencivel = 0.0
	derrotado.emit()


## Disparando especial contínuo: não anda, não pula, não dá dash, não vira.
## A gravidade continua (se disparou no ar, cai com o feixe junto).
func _processar_especial(delta: float) -> void:
	velocity.x = 0.0
	_aplicar_gravidade(delta)
	_tempo_especial -= delta
	if _tempo_especial <= 0.0 or is_zero_approx(_tempo_especial):
		estado = Estado.CAINDO  # provisório; _atualizar_estado corrige depois do move_and_slide


## Derrotado: sem controle; só a gravidade age, para ele cair se estava no ar.
func _processar_derrotado(delta: float) -> void:
	velocity.x = 0.0
	_aplicar_gravidade(delta)


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
## Exceções: dash e especial só saem quando o tempo acaba (_processar_dash/_processar_especial);
## o derrotado não sai.
func _atualizar_estado() -> void:
	if estado == Estado.DASH or estado == Estado.ESPECIAL or estado == Estado.DERROTADO:
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
		Estado.ESPECIAL:
			_tocar(&"especial")
		Estado.DERROTADO:
			_tocar(&"derrota")


func _tocar(nome: StringName) -> void:
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(nome):
		return
	if sprite.animation != nome or not sprite.is_playing():
		sprite.play(nome)
