extends CharacterBody2D
## Curupira — movimento lateral com gravidade, game feel, dash, mira em 8 direções, agachar,
## ataques e vida.
##
## Mira (GDD): cima e baixo mudam a direção do tiro.
##   de pé: frente, diagonal para cima (cima + frente) e cima; andando: frente ou diagonal;
##   baixo no chão agacha (atira para a frente, rente ao chão, e fica com hitbox baixa);
##   travar a mira (aim_lock) segura no lugar e libera a diagonal para baixo;
##   no ar: cima, diagonal para cima, frente, diagonal para baixo e baixo.
## O tiro sai da mão desenhada no quadro atual (ponto "mao" do curupira.json).
##
## Animações usadas (curupira_frames.tres, gerado pelo gerador de pixel art):
##   idle, correr, pular, cair, pouso, dash, freio, dano, derrota,
##   atirar, atirar_diag_cima, atirar_cima, atirar_diag_baixo,
##   correr_atirar, correr_atirar_diag_cima (+ as versões "_coice"),
##   ar_atirar_cima, ar_atirar_diag_cima, ar_atirar_lado, ar_atirar_diag_baixo, ar_atirar_baixo,
##   abaixar, agachado, agachado_atirar, levantar,
##   especial_<tipo>_<mira>_inicio / _loop / _fim, com tipo = animacao do EspecialData
##   (onca, canhao, pocao, bolha) e mira = frente, diag_cima, cima ou agachado.
## Se uma animação ainda não existir, toca a idle no lugar (não dá erro).
##
## Tiro: as animações de tiro parado, no ar e agachado são um coice só (sem loop). Cada tiro
## recomeça o coice do quadro 0; sem atirar, ficam paradas no último quadro (braço firme). Assim a
## mão mexe no ritmo do ataque equipado, e com a mira travada ela fica parada. Correndo, as pernas
## não podem parar: a cada tiro troca por um instante para a "_coice", no mesmo quadro das pernas.
##
## Especial: ESPECIAL tem três partes (FaseEspecial). O golpe sai quando acaba o "_inicio"; o
## Canhão segura o "_loop" enquanto o feixe dura; o "_fim" é a volta, que andar, pular, dar dash
## ou atirar interrompem. Sai na mira: cima e diagonal para cima; o resto vai para a frente.
## O dash tem efeito próprio (fantasmas, folhas, vento, corpo esticado) no node EfeitoDash.
## Encanto (coração do Boto): puxado para o lado do Boto por um tempo; visual no EfeitoEncanto.

enum Estado { PARADO, CORRENDO, PULANDO, CAINDO, AGACHADO, DASH, ESPECIAL, DERROTADO }
## Partes do especial: preparo (até o golpe sair), disparando (Canhão: o feixe) e recuperando.
enum FaseEspecial { PREPARO, DISPARANDO, RECUPERANDO }

## Ângulos da mira (graus de tela; o lado vem de olhando_para).
const MIRA_CIMA: float = -90.0
const MIRA_DIAG_CIMA: float = -45.0
const MIRA_FRENTE: float = 0.0
const MIRA_DIAG_BAIXO: float = 45.0
const MIRA_BAIXO: float = 90.0
## Altura da cápsula agachado, em fração da de pé (GDD: ~40%). Só a forma; o desenho é da folha.
const ALTURA_AGACHADO: float = 0.5
## Quanto tempo a pose de dano fica na tela depois de um golpe (s), se a animação "dano" não
## existir. Com ela, vale a duração da animação (0,33 s). Só visual.
const DURACAO_POSE_DANO: float = 0.2
## Retorno do golpe (só visual): pisca branco e tremor da câmera.
const PISCA_DANO_DURACAO: float = 0.15
const TREMOR_DANO_PX: float = 9.0
const TREMOR_DANO_DURACAO: float = 0.25
## Quanto tempo o braço fica no coice depois de um tiro correndo (s). Só visual.
const DURACAO_COICE_CORRENDO: float = 0.1
## Animações da corrida: todas com o mesmo número de quadros, para trocar sem as pernas pularem.
const ANIMACOES_CORRIDA: Array[StringName] = [
	&"correr", &"correr_atirar", &"correr_atirar_coice", &"correr_atirar_diag_cima", &"correr_atirar_diag_cima_coice",
]

## Emitido no último golpe. A arena escuta para mostrar a tela de derrota.
signal derrotado

## Valores de movimento (velocidade, pulo, gravidade, dash, game feel). Editar o .tres no inspetor.
@export var dados: MovimentoData
## Valores de vida (golpes, invencibilidade depois do golpe). Editar o .tres no inspetor.
@export var dados_vida: VidaJogadorData

## Quanto tempo a pose de ataque fica na tela depois de soltar o botão (s).
## Com o botão segurado ela não cai entre um tiro e outro, mesmo com cadência lenta.
const DURACAO_POSE_ATAQUE: float = 0.3

var estado: Estado = Estado.PARADO
## 1 = direita, -1 = esquerda. Define o lado para onde o Curupira atira e dá o dash.
var olhando_para: int = 1
## Mira atual em graus (MIRA_*).
var mira: float = MIRA_FRENTE

# Contadores regressivos (s). Enquanto > 0, a janela está aberta.
var _tempo_coyote: float = 0.0
var _tempo_buffer_pulo: float = 0.0
var _tempo_dash: float = 0.0
var _tempo_recarga_dash: float = 0.0
var _tempo_invencivel: float = 0.0
var _tempo_especial: float = 0.0
var _tempo_ataque: float = 0.0
var _tempo_pouso: float = 0.0
var _tempo_dano: float = 0.0
var _tempo_coice: float = 0.0
# Especial em andamento: parte, mira travada no aperto ("frente", "diag_cima", "cima", "agachado")
# e o aviso de que o golpe sai neste frame (depois de o Atirador ir para a mão do golpe).
var _fase_especial: FaseEspecial = FaseEspecial.PREPARO
var _mira_especial: String = "frente"
var _soltar_especial: bool = false
var _material_pisca: ShaderMaterial
var _tween_pisca: Tween
var _estava_no_ar: bool = false
# Formas de pé e agachado (corpo e hurtbox), trocadas ao agachar.
var _formas_de_pe: Array = []
var _formas_agachado: Array = []
# No ar só pode um dash por pulo; volta a valer ao tocar o chão.
var _dash_aereo_disponivel: bool = true
# Lentidão ativa: quem está deixando lento (ex.: poça da Cuca) -> fator de velocidade.
var _lentidoes: Dictionary = {}
# Encanto (coração do Boto): tempo que falta e velocidade do puxão (o sinal é o lado).
var _tempo_encanto: float = 0.0
var _puxao_encanto: float = 0.0
var _efeito_encanto: EfeitoEncanto

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var atirador: Atirador = $Atirador
@onready var vida: Vida = $Vida
@onready var hurtbox: Hurtbox = $Hurtbox
@onready var carga: CargaEspecial = $CargaEspecial
@onready var efeito_dash: EfeitoDash = $EfeitoDash
@onready var forma_corpo: CollisionShape2D = $CollisionShape2D
@onready var forma_hurtbox: CollisionShape2D = $Hurtbox/CollisionShape2D


func _ready() -> void:
	if dados == null:
		push_warning("Curupira sem MovimentoData no campo 'dados'; usando os valores padrão do GDD.")
		dados = MovimentoData.new()
	if dados_vida == null:
		push_warning("Curupira sem VidaJogadorData no campo 'dados_vida'; usando os valores padrão do GDD.")
		dados_vida = VidaJogadorData.new()

	# Hurtbox avisa que algo encostou -> take_damage decide se conta -> Vida desconta.
	hurtbox.golpe_recebido.connect(take_damage)
	# Efeitos de estado que chegam pela hurtbox (hoje só o encanto do Boto).
	hurtbox.efeito_recebido.connect(_ao_receber_efeito)
	vida.zerou.connect(_ao_zerar_vida)
	vida.configurar(dados_vida.golpes)

	# Acerto do básico -> Atirador avisa -> carga do especial sobe.
	atirador.acerto_basico.connect(carga.adicionar)
	if atirador.especial:
		carga.configurar(atirador.especial.carga_necessaria)
	# Ataque saiu (básico ou especial) -> Atirador avisa -> animação de ataque.
	atirador.disparou.connect(_ao_disparar)

	# Pixel art: âncora nos pés, filtro Nearest; o Atirador vai para a mão a cada frame.
	FolhaSprites.preparar(sprite)
	_material_pisca = EfeitosTela.preparar_pisca(sprite)
	atirador.seguindo_mao = true
	_preparar_formas_agachado()
	_efeito_encanto = EfeitoEncanto.new()
	_efeito_encanto.desenho = sprite
	add_child(_efeito_encanto)


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
	mira = _calcular_mira()
	# Segurar o botão atira sem parar; a cadência fica com o Atirador.
	# A pose de tiro entra antes da animação, para o tiro sair da mão já esticada.
	var pode_atirar: bool = _pode_atirar()
	var atirando: bool = pode_atirar and Input.is_action_pressed("attack_basic")
	if atirando:
		_tempo_ataque = maxf(_tempo_ataque, DURACAO_POSE_ATAQUE)
	_atualizar_animacao()
	_por_atirador_na_mao()
	_atualizar_invencibilidade(delta)
	_efeito_encanto.mostrar(esta_encantado())

	if atirando:
		atirador.tentar_atirar(olhando_para, fator_lentidao(), mira)
	# O golpe do especial sai aqui, com o Atirador já na mão da pose do golpe.
	if _soltar_especial:
		_soltar_especial = false
		if estado != Estado.DERROTADO:
			atirador.atirar_especial(olhando_para, _angulo_especial())
	# Especial: só com a barra cheia; disparar zera a barra.
	if pode_atirar and Input.is_action_just_pressed("attack_special") and carga.esta_cheia() and atirador.especial:
		carga.gastar()
		_comecar_especial()


## Lentidão (GDD: deixa movimentos e ataques mais lentos). Quem deixa lento chama
## aplicar_lentidao ao encostar e remover_lentidao ao sair. Pulo e dash não mudam.
func aplicar_lentidao(fonte: Node, fator: float) -> void:
	_lentidoes[fonte] = fator
	sprite.self_modulate = Color(0.7, 0.75, 1.3)  # azulado enquanto lento (só visual)


func remover_lentidao(fonte: Node) -> void:
	_lentidoes.erase(fonte)
	if _lentidoes.is_empty():
		sprite.self_modulate = Color.WHITE


## 1 = normal; 0,6 = 40% mais lento. Com duas fontes ao mesmo tempo, vale a mais forte.
func fator_lentidao() -> float:
	var fator: float = 1.0
	for f in _lentidoes.values():
		fator = minf(fator, f)
	return fator


## Efeito de estado vindo da hurtbox. Quem causa só chama aplicar_efeito nela.
## &"encanto" (coração do Boto): por "duracao" segundos o Curupira é puxado na horizontal, a
## "intensidade" px/s (negativa = para a esquerda); não anda, não abaixa nem dá dash, mas pula
## e atira. Chega junto com o golpe do coração, então não olha a invencibilidade de depois do
## golpe; só o dash (o coração nem encosta) e a derrota impedem.
func _ao_receber_efeito(efeito: StringName, intensidade: float, duracao: float) -> void:
	if efeito != &"encanto" or estado == Estado.DASH or estado == Estado.DERROTADO:
		return
	_tempo_encanto = maxf(_tempo_encanto, duracao)
	_puxao_encanto = intensidade


func esta_encantado() -> bool:
	return _tempo_encanto > 0.0 and estado != Estado.DERROTADO


## Chamado pela Hurtbox quando uma hitbox de inimigo encosta.
## amount = golpes (1 ou 2, conforme o ataque do chefe).
func take_damage(amount: int, _from: Node) -> void:
	# A hurtbox só desliga no fim do frame (set_deferred); esta checagem impede
	# que dois ataques encostando no mesmo frame tirem dois golpes.
	if esta_invencivel():
		return
	vida.perder(amount)
	_retorno_do_golpe()
	if vida.esta_viva():
		_tempo_invencivel = dados_vida.invencibilidade_apos_golpe
		var duracao: float = FolhaSprites.duracao(sprite, &"dano")
		_tempo_dano = duracao if duracao > 0.0 else DURACAO_POSE_DANO
		# A pose de dano recomeça do primeiro quadro (o tranco), mesmo se já estava nela.
		if sprite.sprite_frames and sprite.sprite_frames.has_animation(&"dano"):
			sprite.play(&"dano")
			sprite.set_frame_and_progress(0, 0.0)


## Pisca branco e treme a câmera: o golpe tem que ser sentido, não só um "vermelhinho".
func _retorno_do_golpe() -> void:
	if _tween_pisca:
		_tween_pisca.kill()
	_material_pisca.set_shader_parameter("forca", 1.0)
	_tween_pisca = create_tween()
	_tween_pisca.tween_property(_material_pisca, "shader_parameter/forca", 0.0, PISCA_DANO_DURACAO)
	EfeitosTela.tremer(self, TREMOR_DANO_PX, TREMOR_DANO_DURACAO)


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


## Não atira durante o dash, disparando um especial nem derrotado.
func _pode_atirar() -> bool:
	return estado != Estado.DASH and estado != Estado.ESPECIAL and estado != Estado.DERROTADO


## Chamado pelo Atirador a cada ataque que sai. O projétil já nasce na mão; aqui só a pose.
## Recomeça o coice do primeiro quadro (parado, agachado e no ar); correndo, liga o coice por um
## instante, sem mexer no quadro das pernas. No especial a pose é dele.
func _ao_disparar() -> void:
	if estado == Estado.ESPECIAL:
		return
	_tempo_ataque = maxf(_tempo_ataque, DURACAO_POSE_ATAQUE)
	if estado == Estado.CORRENDO:
		_tempo_coice = DURACAO_COICE_CORRENDO
	elif String(sprite.animation).contains("atirar") and not sprite.sprite_frames.get_animation_loop(sprite.animation):
		sprite.play(sprite.animation)
		sprite.set_frame_and_progress(0, 0.0)


## Põe o Atirador no ponto "mao" do quadro atual (com escala e lado do sprite).
func _por_atirador_na_mao() -> void:
	var mao: Variant = FolhaSprites.ponto_arte(sprite, "mao")
	if mao == null:
		# Animação sem mão desenhada (ex.: idle): usa a pose de tiro equivalente.
		mao = Vector2(12.0, -36.0) if estado != Estado.AGACHADO else Vector2(16.0, -6.0)
	atirador.global_position = sprite.to_global(mao)


## Direção do tiro conforme cima/baixo, o lado e se está no chão (regras no topo do script).
func _calcular_mira() -> float:
	var vertical: float = signf(Input.get_axis("aim_up", "crouch"))
	var frente: bool = Input.get_axis("move_left", "move_right") != 0.0
	if estado == Estado.AGACHADO:
		return MIRA_FRENTE
	if vertical < 0.0:
		return MIRA_DIAG_CIMA if frente else MIRA_CIMA
	if vertical > 0.0:
		if not is_on_floor():
			return MIRA_DIAG_BAIXO if frente else MIRA_BAIXO
		if _mira_travada():
			return MIRA_DIAG_BAIXO
	return MIRA_FRENTE


## Segurando aim_lock no chão: fica parado e mira em qualquer direção do chão.
func _mira_travada() -> bool:
	return is_on_floor() and Input.is_action_pressed("aim_lock")


## Formas agachado: a mesma cápsula, mais baixa, com a base no mesmo lugar (os pés).
func _preparar_formas_agachado() -> void:
	for forma in [forma_corpo, forma_hurtbox]:
		var de_pe := forma.shape as CapsuleShape2D
		_formas_de_pe.append([de_pe, forma.position])
		if de_pe == null:
			_formas_agachado.append([forma.shape, forma.position])
			continue
		var baixa := de_pe.duplicate() as CapsuleShape2D
		baixa.height = maxf(de_pe.height * ALTURA_AGACHADO, baixa.radius * 2.0)
		var base: float = forma.position.y + de_pe.height / 2.0
		_formas_agachado.append([baixa, Vector2(forma.position.x, base - baixa.height / 2.0)])


func _usar_formas(agachado: bool) -> void:
	var lista: Array = _formas_agachado if agachado else _formas_de_pe
	var formas: Array = [forma_corpo, forma_hurtbox]
	for i in formas.size():
		if formas[i].shape != lista[i][0]:
			formas[i].set_deferred("shape", lista[i][0])
			formas[i].set_deferred("position", lista[i][1])


## Aperto do especial: trava a mira (cima e diagonal para cima saem na mira; agachado sai rente ao
## chão; o resto vai para a frente) e começa o preparo. O golpe sai quando a animação do preparo acaba.
func _comecar_especial() -> void:
	if estado == Estado.AGACHADO:
		_mira_especial = "agachado"
	elif mira == MIRA_CIMA:
		_mira_especial = "cima"
	elif mira == MIRA_DIAG_CIMA:
		_mira_especial = "diag_cima"
	else:
		_mira_especial = "frente"
	estado = Estado.ESPECIAL
	_fase_especial = FaseEspecial.PREPARO
	_tempo_especial = FolhaSprites.duracao(sprite, _animacao_especial())
	_tempo_ataque = 0.0
	_tempo_dano = 0.0


## Ângulo do golpe do especial (graus, como a mira do tiro).
func _angulo_especial() -> float:
	match _mira_especial:
		"cima":
			return MIRA_CIMA
		"diag_cima":
			return MIRA_DIAG_CIMA
	return MIRA_FRENTE


## Nome da animação da parte atual do especial (ex.: especial_onca_diag_cima_inicio).
func _animacao_especial() -> StringName:
	var tipo: String = atirador.especial.animacao if atirador.especial else "onca"
	var parte: String = ["inicio", "loop", "fim"][_fase_especial]
	return StringName("especial_%s_%s_%s" % [tipo, _mira_especial, parte])


## Especial: não anda e não vira; a gravidade continua (se disparou no ar, cai junto).
## Preparo -> golpe sai -> (Canhão: segura o feixe por duracao_disparo) -> volta.
## Na volta, andar, pular, dar dash ou atirar devolve o controle na hora.
func _processar_especial(delta: float) -> void:
	if _fase_especial == FaseEspecial.RECUPERANDO and _quer_sair_do_especial():
		estado = Estado.CAINDO  # provisório; _atualizar_estado corrige depois do move_and_slide
		_processar_movimento_normal(delta)
		return
	velocity.x = 0.0
	_aplicar_gravidade(delta)
	_tempo_especial -= delta
	if _tempo_especial > 0.0 and not is_zero_approx(_tempo_especial):
		return
	match _fase_especial:
		FaseEspecial.PREPARO:
			_soltar_especial = true
			if atirador.especial.duracao_disparo > 0.0:
				_fase_especial = FaseEspecial.DISPARANDO
				_tempo_especial = atirador.especial.duracao_disparo
			else:
				_fase_especial = FaseEspecial.RECUPERANDO
				_tempo_especial = FolhaSprites.duracao(sprite, _animacao_especial())
		FaseEspecial.DISPARANDO:
			_fase_especial = FaseEspecial.RECUPERANDO
			_tempo_especial = FolhaSprites.duracao(sprite, _animacao_especial())
		FaseEspecial.RECUPERANDO:
			estado = Estado.CAINDO  # provisório; _atualizar_estado corrige depois do move_and_slide


func _quer_sair_do_especial() -> bool:
	return Input.get_axis("move_left", "move_right") != 0.0 or _tempo_buffer_pulo > 0.0 \
		or Input.is_action_just_pressed("dash") or Input.is_action_pressed("attack_basic")


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
## Também recarrega o dash aéreo ao tocar o chão e conta a recarga do dash e a pose de ataque.
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
	_tempo_encanto -= delta
	_tempo_ataque -= delta
	_tempo_pouso -= delta
	_tempo_dano -= delta
	_tempo_coice -= delta


func _aplicar_gravidade(delta: float) -> void:
	if not is_on_floor():
		velocity.y += dados.gravidade * delta


func _mover_horizontal() -> void:
	# Encantado: anda sozinho para o lado do Boto, olhando para ele.
	if esta_encantado():
		velocity.x = _puxao_encanto * fator_lentidao()
		if _puxao_encanto != 0.0:
			olhando_para = int(signf(_puxao_encanto))
			sprite.scale.x = absf(sprite.scale.x) * olhando_para
		return
	# get_axis já anula esquerda + direita juntas. signf deixa o analógico com
	# velocidade fixa (sem "andar devagar" com o analógico meio inclinado).
	var direcao: float = signf(Input.get_axis("move_left", "move_right"))
	# Agachado ou com a mira travada não anda, mas ainda vira para mirar do outro lado.
	var parado_no_lugar: bool = is_on_floor() and (_mira_travada() or Input.get_axis("aim_up", "crouch") > 0.0)
	velocity.x = 0.0 if parado_no_lugar else direcao * dados.velocidade * fator_lentidao()
	if direcao != 0.0:
		olhando_para = int(direcao)
		# Vira pela escala (e não flip_h), para a âncora dos pés e os pontos da folha virarem juntos.
		sprite.scale.x = absf(sprite.scale.x) * olhando_para


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
	if not Input.is_action_just_pressed("dash") or _tempo_recarga_dash > 0.0 or esta_encantado():
		return false
	var no_ar: bool = not is_on_floor()
	if no_ar and not _dash_aereo_disponivel:
		return false
	if no_ar:
		_dash_aereo_disponivel = false

	estado = Estado.DASH
	_tempo_dash = dados.duracao_dash
	# O dash corta a pose de ataque; sem isso, o resto dela voltaria a tocar ao fim do dash.
	_tempo_ataque = 0.0
	# Dash reto na horizontal, para o lado em que está olhando
	# (_mover_horizontal já virou o Curupira se havia direção apertada).
	velocity = Vector2(olhando_para * dados.distancia_dash / dados.duracao_dash, 0.0)
	efeito_dash.comecar(olhando_para, dados.duracao_dash)
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
	efeito_dash.terminar()
	_processar_movimento_normal(delta)


## O estado é derivado da física depois do move_and_slide.
## Exceções: dash e especial só saem quando o tempo acaba (_processar_dash/_processar_especial);
## o derrotado não sai.
func _atualizar_estado() -> void:
	if estado == Estado.DASH or estado == Estado.ESPECIAL or estado == Estado.DERROTADO:
		# O especial agachado continua com a caixa baixa.
		_usar_formas(estado == Estado.ESPECIAL and _mira_especial == "agachado")
		return
	if is_on_floor():
		if _estava_no_ar:
			_tempo_pouso = FolhaSprites.duracao(sprite, &"pouso")
		var agachar: bool = Input.get_axis("aim_up", "crouch") > 0.0 and not Input.is_action_pressed("aim_lock") and not esta_encantado()
		if agachar:
			estado = Estado.AGACHADO
		else:
			estado = Estado.CORRENDO if velocity.x != 0.0 else Estado.PARADO
	else:
		estado = Estado.PULANDO if velocity.y < 0.0 else Estado.CAINDO
	_estava_no_ar = not is_on_floor()
	_usar_formas(estado == Estado.AGACHADO)


func _atualizar_animacao() -> void:
	# No especial a pose de dano não entra (o pisca e o tremor do golpe continuam).
	if _tempo_dano > 0.0 and estado != Estado.DERROTADO and estado != Estado.DASH and estado != Estado.ESPECIAL:
		_tocar(&"dano")
		return
	var atacando: bool = _tempo_ataque > 0.0 and _pode_atirar()
	match estado:
		Estado.PARADO:
			if atacando or _mira_travada():
				_tocar_tiro(_animacao_de_tiro_de_pe(), &"atirar")
			elif _tempo_pouso > 0.0:
				_tocar(&"pouso")
			else:
				_tocar(&"idle")
		Estado.CORRENDO:
			if atacando:
				var nome: String = "correr_atirar_diag_cima" if mira == MIRA_DIAG_CIMA else "correr_atirar"
				if _tempo_coice > 0.0:
					nome += "_coice"
				_tocar_correndo(StringName(nome))
			else:
				_tocar_correndo(&"correr")
		Estado.PULANDO, Estado.CAINDO:
			if atacando:
				_tocar_tiro(_animacao_de_tiro_no_ar(), &"pular")
			else:
				_tocar(&"pular" if estado == Estado.PULANDO else &"cair")
		Estado.AGACHADO:
			if atacando:
				_tocar_tiro(&"agachado_atirar", &"agachado")
			elif sprite.animation == &"abaixar" and sprite.is_playing():
				pass  # termina de descer
			elif sprite.animation != &"agachado" and sprite.animation != &"abaixar" and sprite.animation != &"agachado_atirar":
				_tocar(&"abaixar", &"agachado")
			else:
				_tocar(&"agachado")
		Estado.DASH:
			_tocar(&"dash")
		Estado.ESPECIAL:
			_tocar(_animacao_especial(), &"atirar")
		Estado.DERROTADO:
			_tocar(&"derrota")


func _animacao_de_tiro_de_pe() -> StringName:
	match mira:
		MIRA_CIMA:
			return &"atirar_cima"
		MIRA_DIAG_CIMA:
			return &"atirar_diag_cima"
		MIRA_DIAG_BAIXO:
			return &"atirar_diag_baixo"
	return &"atirar"


func _animacao_de_tiro_no_ar() -> StringName:
	match mira:
		MIRA_CIMA:
			return &"ar_atirar_cima"
		MIRA_DIAG_CIMA:
			return &"ar_atirar_diag_cima"
		MIRA_DIAG_BAIXO:
			return &"ar_atirar_diag_baixo"
		MIRA_BAIXO:
			return &"ar_atirar_baixo"
	return &"ar_atirar_lado"


## Pose de tiro (coice sem loop). Ao entrar nela sem ter atirado (mira travada, troca de direção,
## pouso), começa no último quadro, com o braço firme; quem recomeça o coice é o _ao_disparar.
func _tocar_tiro(nome: StringName, reserva: StringName) -> void:
	var antes: StringName = sprite.animation
	_tocar(nome, reserva)
	if sprite.animation != antes and sprite.sprite_frames and not sprite.sprite_frames.get_animation_loop(sprite.animation):
		sprite.set_frame_and_progress(sprite.sprite_frames.get_frame_count(sprite.animation) - 1, 0.0)


## Corrida: troca entre correr, correr atirando e o coice mantendo o quadro das pernas
## (sem isso a passada recomeçaria a cada tiro).
func _tocar_correndo(nome: StringName) -> void:
	var antes: StringName = sprite.animation
	var quadro: int = sprite.frame
	var progresso: float = sprite.frame_progress
	_tocar(nome, &"correr_atirar" if String(nome).ends_with("_coice") else &"correr")
	if sprite.animation != antes and antes in ANIMACOES_CORRIDA and sprite.animation in ANIMACOES_CORRIDA:
		sprite.set_frame_and_progress(quadro, progresso)


## Se a animação ainda não existir no SpriteFrames, toca a reserva (idle por padrão):
## sem isso o sprite ficaria preso na última animação tocada (ex.: mão estendida do ataque).
func _tocar(nome: StringName, reserva: StringName = &"idle") -> void:
	if sprite.sprite_frames == null:
		return
	if not sprite.sprite_frames.has_animation(nome):
		if not sprite.sprite_frames.has_animation(reserva):
			return
		nome = reserva
	if sprite.animation == nome:
		# Já é esta. Com loop, só garante que está tocando. Sem loop e já terminada, fica no
		# último frame: chamar play() de novo faria ela recomeçar do zero (virando um loop).
		if not sprite.is_playing() and sprite.sprite_frames.get_animation_loop(nome):
			sprite.play(nome)
		return
	sprite.play(nome)
