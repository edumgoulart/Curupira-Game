class_name Chefe
extends Node2D
## Base de todos os chefes: o que é igual em todos fica aqui, e cada chefe (Mula, Cuca...)
## herda e só implementa os próprios ataques.
##
## Regras do GDD que valem para todos: leva dano o tempo todo, a vida não aparece na tela,
## todo ataque tem aviso visual antes do golpe, e a luta tem três fases.
##
## A luta é uma máquina de estados simples (EstadoLuta) que roda em loop:
##   ESPERANDO (pausa) -> sorteia um ataque da fase atual -> ATACANDO -> ESPERANDO ...
## Cada ataque é uma rotina curta no script do chefe (aviso, ação, fim), escrita com
## "await esperar(s)". Assim um ataque se lê de cima a baixo, na ordem em que acontece,
## e os tempos vêm todos do .tres de dados. esperar() conta pelo relógio do chefe
## (fator_tempo: a Bolha Abissal deixa tudo mais lento) e para sozinho se o chefe for derrotado.
##
## Nós que a cena do chefe precisa ter: AnimatedSprite2D (SpriteFrames do gerador de pixel
## art, escala 4), Vida, Hurtbox (layer enemy), Contato (Hitbox, layer enemy_hitbox).
## O desenho olha para a esquerda; virar(true) espelha para a direita.

## Emitido quando a vida chega a zero. A arena escuta para a vitória/salvar progresso.
signal chefe_derrotado
## Emitido quando a luta passa para a próxima fase (0 = fase 1).
signal fase_mudou(fase: int)
## Um passo da física, já multiplicado pelo relógio do chefe. Quem espera usa este sinal.
signal _passo(delta: float)

enum EstadoLuta { ESPERANDO, ATACANDO, DERROTADO }

## Meia largura da arena (px): as paredes ficam em ±960 (arena centrada na câmera).
const ARENA_MEIA_LARGURA: float = 960.0

## Cor do brilho durante os avisos (telegrafo visual). Só visual.
const COR_AVISO: Color = Color(1.6, 0.9, 0.5)
## Cor do chefe enquanto está envenenado / lento. Só visual.
const COR_VENENO: Color = Color(0.6, 1.25, 0.55)
const COR_LENTO: Color = Color(0.65, 0.8, 1.45)
## Envenenamento: um pulso de dano por segundo (GDD: "20 de dano por segundo").
const INTERVALO_VENENO: float = 1.0

## Números do chefe (vida, tempos, golpes). Cada chefe usa a própria classe (MulaData, CucaData).
@export var dados: ChefeData
## Quem o chefe ataca. Apontar no inspetor da arena (o Curupira).
@export var alvo: Node2D

var derrotado: bool = false
var estado_luta: EstadoLuta = EstadoLuta.ESPERANDO
## Fase atual da luta: 0, 1 ou 2.
var fase: int = 0
## Ataque em andamento (vazio entre ataques).
var ataque_atual: StringName = &""
var _ultimo_ataque: StringName = &""
var _ataque_novo: StringName = &""
var _sorteio := RandomNumberGenerator.new()
# Multiplica a velocidade das animações (ex.: o salto do Boto dura o que o .tres mandar).
var _ritmo_animacao: float = 1.0
var _veneno_por_pulso: int = 0
var _pulsos_veneno: int = 0
var _timer_veneno: Timer
var _tween_pisca: Tween
# Lentidão (Bolha Abissal): quanto o relógio do chefe desacelera (0,4 = 40%) enquanto o timer roda.
var _lentidao: float = 0.0
var _timer_lentidao: Timer

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var vida: Vida = $Vida
# Procura em qualquer nível: a Máquina guarda os dois dentro do Nucleo, que segue a lente.
@onready var hurtbox: Hurtbox = find_child("Hurtbox") as Hurtbox
@onready var contato: Hitbox = find_child("Contato") as Hitbox


func _ready() -> void:
	add_to_group("chefes")  # o Feitiço Perseguidor procura alvos neste grupo
	hurtbox.golpe_recebido.connect(take_damage)
	hurtbox.efeito_recebido.connect(_ao_receber_efeito)
	_timer_veneno = Timer.new()
	_timer_veneno.wait_time = INTERVALO_VENENO
	# Conta no ritmo da física (60/s fixo), igual ao resto do combate.
	_timer_veneno.process_callback = Timer.TIMER_PROCESS_PHYSICS
	_timer_veneno.timeout.connect(_pulso_veneno)
	add_child(_timer_veneno)
	_timer_lentidao = Timer.new()
	_timer_lentidao.one_shot = true
	_timer_lentidao.process_callback = Timer.TIMER_PROCESS_PHYSICS
	_timer_lentidao.timeout.connect(_fim_lentidao)
	add_child(_timer_lentidao)
	vida.zerou.connect(_ao_zerar_vida)
	vida.configurar(dados.vida)
	contato.dano = dados.golpes_contato
	FolhaSprites.preparar(sprite)
	_preparar_caixas()
	_sorteio.randomize()
	# Começa no próximo frame: o _ready do chefe (filho desta classe) ainda está rodando.
	_lutar.call_deferred()


func _physics_process(delta: float) -> void:
	_passo.emit(delta * fator_tempo())


func _process(_delta: float) -> void:
	# A lentidão também deixa as animações mais lentas.
	sprite.speed_scale = fator_tempo() * _ritmo_animacao


## O laço da luta: pausa, sorteia um ataque da fase, executa, repete.
func _lutar() -> void:
	tocar(&"idle")
	if not await esperar(dados.pausa_entre_ataques):
		return
	while not derrotado:
		_atualizar_fase()
		ataque_atual = _sortear_ataque()
		estado_luta = EstadoLuta.ATACANDO
		await _executar(ataque_atual)
		if derrotado:
			return
		ataque_atual = &""
		estado_luta = EstadoLuta.ESPERANDO
		avisar(false)
		tocar(&"idle")
		if not await esperar(dados.pausa_entre_ataques):
			return


## Cada chefe implementa: um "match nome:" que chama a rotina do ataque com await.
func _executar(_nome: StringName) -> void:
	await esperar(0.5)


func _atualizar_fase() -> void:
	var nova: int = dados.fase_para(float(vida.atual) / float(maxi(vida.maximo, 1)))
	if nova <= fase:
		return
	var antes: Array[StringName] = dados.ataques_da_fase(fase)
	fase = nova
	# O ataque que entrou nesta fase abre a fase, para o jogador ver a novidade.
	_ataque_novo = &""
	for nome in dados.ataques_da_fase(fase):
		if nome not in antes:
			_ataque_novo = nome
			break
	fase_mudou.emit(fase)


## Sorteia um ataque da fase atual, sem repetir o último (quando há mais de um).
func _sortear_ataque() -> StringName:
	if _ataque_novo != &"":
		_ultimo_ataque = _ataque_novo
		_ataque_novo = &""
		return _ultimo_ataque
	var opcoes: Array[StringName] = dados.ataques_da_fase(fase).duplicate()
	if opcoes.size() > 1:
		opcoes.erase(_ultimo_ataque)
	if opcoes.is_empty():
		return &""
	_ultimo_ataque = opcoes[_sorteio.randi_range(0, opcoes.size() - 1)]
	return _ultimo_ataque


## Espera "segundos" no relógio do chefe. Devolve false se o chefe foi derrotado no meio:
## o ataque deve parar ("if not await esperar(x): return").
func esperar(segundos: float) -> bool:
	var falta: float = segundos
	while falta > 0.0 and not is_zero_approx(falta):
		falta -= await _passo
		if derrotado:
			return false
	return not derrotado


## Espera um passo da física e devolve o delta (já com a lentidão).
func passo() -> float:
	return await _passo


## Toca a animação do começo e espera ela terminar (para animações sem loop).
func tocar_e_esperar(nome: StringName) -> bool:
	reiniciar(nome)
	return await esperar(FolhaSprites.duracao(sprite, nome))


## Toca a animação do primeiro quadro (ex.: o coice de cada bola de fogo).
func reiniciar(nome: StringName) -> void:
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(nome):
		return
	sprite.play(nome)
	sprite.set_frame_and_progress(0, 0.0)


## Onde fica um ponto do desenho (boca, mão, lente) no quadro atual, no mundo.
func ponto(nome: String) -> Vector2:
	return FolhaSprites.ponto(sprite, nome, global_position)


## O desenho olha para a esquerda; true vira para a direita (espelha o sprite e os pontos).
func virar(para_direita: bool) -> void:
	sprite.scale.x = -absf(sprite.scale.x) if para_direita else absf(sprite.scale.x)
	_ajustar_caixas()


func olhando_para_direita() -> bool:
	return sprite.scale.x < 0.0


## -1 se o alvo está à esquerda do chefe, 1 se à direita.
func lado_do_alvo() -> float:
	return 1.0 if x_do_alvo() > global_position.x else -1.0


## Anda na horizontal até x, na velocidade dada (px/s). false se foi derrotado no caminho.
func andar_ate(x: float, velocidade: float) -> bool:
	while not is_equal_approx(global_position.x, x):
		var dt: float = await _passo
		if derrotado:
			return false
		global_position.x = move_toward(global_position.x, x, velocidade * dt)
	return true


## Chamado pela Hurtbox quando um ataque do Curupira acerta.
func take_damage(amount: int, _from: Node) -> void:
	if derrotado:
		return
	vida.perder(amount)
	# Pisca branco a cada acerto (retorno visual; a vida não aparece na tela).
	_piscar()


## Pisca branco e volta para a cor base (branca, ou verde se envenenado).
func _piscar() -> void:
	if _tween_pisca:
		_tween_pisca.kill()
	var visual: CanvasItem = _visual_colorido()
	visual.self_modulate = Color(2.0, 2.0, 2.0)
	_tween_pisca = create_tween()
	_tween_pisca.tween_property(visual, "self_modulate", _cor_base(), 0.06)


## Muda a cor base (ex.: ficou envenenado) sem um pisca em andamento desfazer a mudança.
func _atualizar_cor() -> void:
	if _tween_pisca:
		_tween_pisca.kill()
	_visual_colorido().self_modulate = _cor_base()


## O que pisca ao levar dano e fica verde/azul com veneno/lentidão: o sprite.
## Um chefe ainda sem arte (Máquina) devolve o desenho provisório no lugar.
func _visual_colorido() -> CanvasItem:
	return sprite


## Onde os projéteis que perseguem miram: o centro da hurtbox.
func ponto_de_mira() -> Vector2:
	return hurtbox.get_child(0).global_position


func esta_envenenado() -> bool:
	return _pulsos_veneno > 0


func esta_lento() -> bool:
	return not _timer_lentidao.is_stopped()


## Multiplicador do relógio do chefe: 1 = normal; 0,6 = 40% mais lento (Bolha Abissal).
## Cada chefe multiplica o delta por isto: pausas, avisos, pulos e cadência ficam mais lentos.
## Projéteis que o chefe já soltou não são afetados.
func fator_tempo() -> float:
	return 1.0 - _lentidao if esta_lento() else 1.0


func _cor_base() -> Color:
	var cor: Color = Color.WHITE
	if esta_envenenado():
		cor *= COR_VENENO
	if esta_lento():
		cor *= COR_LENTO
	return cor


## Efeitos vindos dos ataques do Curupira pela Hurtbox.
func _ao_receber_efeito(efeito: StringName, intensidade: float, duracao: float) -> void:
	if derrotado:
		return
	match efeito:
		&"veneno":
			# GDD: reaplicar só renova o tempo (não acumula dano por segundo).
			_veneno_por_pulso = int(intensidade * INTERVALO_VENENO)
			_pulsos_veneno = int(round(duracao / INTERVALO_VENENO))
			if _timer_veneno.is_stopped():
				_timer_veneno.start()
			_atualizar_cor()
		&"lentidao":
			# GDD: 40% mais lento por 6 s. Reaplicar renova o tempo.
			_lentidao = clampf(intensidade, 0.0, 0.9)
			_timer_lentidao.start(duracao)
			_atualizar_cor()


func _fim_lentidao() -> void:
	_lentidao = 0.0
	_atualizar_cor()


func _pulso_veneno() -> void:
	if derrotado or _pulsos_veneno <= 0:
		_timer_veneno.stop()
		return
	_pulsos_veneno -= 1
	vida.perder(_veneno_por_pulso)
	if _pulsos_veneno <= 0:
		_timer_veneno.stop()
		_atualizar_cor()


## Liga/desliga o brilho de aviso antes de um ataque (cada chefe pode usar a sua cor).
func avisar(ligado: bool, cor: Color = COR_AVISO) -> void:
	sprite.modulate = cor if ligado else Color.WHITE


## Posição X do alvo (o Curupira); sem alvo, um ponto à esquerda do chefe.
func x_do_alvo() -> float:
	return alvo.global_position.x if alvo else global_position.x - 600.0


## Posição do alvo; sem alvo, um ponto à esquerda do chefe.
func pos_do_alvo() -> Vector2:
	return alvo.global_position if alvo else global_position + Vector2.LEFT * 600.0


## Põe um ataque (projétil, poça...) na cena atual, e não no chefe: assim ele não anda junto.
func lancar_na_cena(no: Node) -> void:
	get_tree().current_scene.add_child(no)


## Toca a animação se ela existir no SpriteFrames (se não existir, não dá erro).
## Se já é a que está tocando, continua de onde estava.
func tocar(nome: StringName) -> void:
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(nome):
		return
	if sprite.animation != nome or not sprite.is_playing():
		sprite.play(nome)


## Caixas de dano que acompanham a pose. Só quando Hurtbox e Contato são filhos diretos do
## chefe: a Máquina guarda os dois no Nucleo, que segue a lente, e tem caixas fixas.
func _preparar_caixas() -> void:
	if hurtbox.get_parent() != self or contato.get_parent() != self:
		return
	# Formas próprias desta instância (a cena compartilha os sub_resources).
	for area: Area2D in [hurtbox, contato]:
		var forma := area.get_child(0) as CollisionShape2D
		forma.shape = RectangleShape2D.new()
	sprite.animation_changed.connect(_ajustar_caixas)
	_ajustar_caixas()


func _ajustar_caixas() -> void:
	if hurtbox.get_parent() != self or not sprite.animation_changed.is_connected(_ajustar_caixas):
		return
	var arte: Rect2 = FolhaSprites.caixa(sprite, sprite.animation)
	if arte.size == Vector2.ZERO:
		return
	# Da arte (relativa à âncora = origem do sprite) para o chefe, com escala e espelhamento.
	var a: Vector2 = sprite.position + arte.position * sprite.scale
	var b: Vector2 = sprite.position + arte.end * sprite.scale
	var caixa := Rect2(a, Vector2.ZERO).expand(b)
	var tam_h: Vector2 = caixa.size * dados.fracao_hurtbox
	_por_caixa(hurtbox, caixa.get_center(), tam_h)
	var tam_c: Vector2 = caixa.size * dados.fracao_contato
	_por_caixa(contato, Vector2(caixa.get_center().x, caixa.end.y - tam_c.y / 2.0), tam_c)


func _por_caixa(area: Area2D, centro: Vector2, tamanho: Vector2) -> void:
	var forma := area.get_child(0) as CollisionShape2D
	(forma.shape as RectangleShape2D).size = tamanho
	forma.position = centro


## Cada chefe sobrescreve para limpar o que é dele (ex.: voltar ao lugar).
func _ao_ser_derrotado() -> void:
	pass


func _ao_zerar_vida() -> void:
	derrotado = true
	estado_luta = EstadoLuta.DERROTADO
	_ritmo_animacao = 1.0
	_pulsos_veneno = 0
	_timer_veneno.stop()
	_timer_lentidao.stop()
	_atualizar_cor()
	avisar(false)
	hurtbox.ligada = false
	contato.set_deferred("monitoring", false)
	# Some com projéteis, poças etc. que ainda estão na tela.
	get_tree().call_group("ataques_chefe", "queue_free")
	_ao_ser_derrotado()
	reiniciar(&"derrota")
	chefe_derrotado.emit()
	print("%s derrotado(a)!" % dados.nome)
