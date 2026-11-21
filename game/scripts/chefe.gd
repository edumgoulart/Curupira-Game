class_name Chefe
extends Node2D
## Base de todos os chefes: o que é igual em todos fica aqui, e cada chefe (Mula, Cuca...)
## herda e só implementa os próprios ataques.
##
## Regras do GDD que valem para todos: leva dano o tempo todo, a vida aparece no HUD (hud_chefe.gd)
## e todo ataque tem aviso visual antes do golpe.
##
## A luta é uma máquina de estados simples (EstadoLuta) que roda em loop:
##   ESPERANDO (pausa) -> sorteia uma jogada da fase atual -> ATACANDO -> ESPERANDO ...
## Uma jogada é um ataque só ou um combo (ComboChefe: dois ataques, o segundo começa assim que
## o corpo fica livre do primeiro, com os perigos do primeiro ainda na tela).
## Quando a vida passa do limiar da próxima fase, no fim do ataque em andamento:
##   TRANSICAO (limpa a tela, animação "transicao", tremor e clarão) -> combo da fase nova.
## O chefe leva dano o tempo todo, até na transição.
##
## Fases por dificuldade: vêm do .tres (ChefeData.fases_normal / fases_expert), pela dificuldade
## escolhida na tela de seleção (GameState.dificuldade).
##
## Sorteio em "saco": cada ataque da fase sai uma vez por rodada, em ordem embaralhada.
## Antes era "qualquer um menos o último", que com dois ataques virava sempre A, B, A, B.
##
## Cada ataque é uma rotina curta no script do chefe (aviso, ação, fim), escrita com
## "await esperar(s)". Assim um ataque se lê de cima a baixo, na ordem em que acontece,
## e os tempos vêm todos do .tres de dados. esperar() conta pelo relógio do chefe
## (fator_tempo: a Bolha Abissal deixa tudo mais lento) e para sozinho se o chefe for derrotado.
## Um ataque "encadeado" (o primeiro de um combo) não espera os próprios projéteis e pula a
## janela de recuperação do fim (tonta, cansada...): ela fica para o fim do combo.
##
## Nós que a cena do chefe precisa ter: AnimatedSprite2D (SpriteFrames do gerador de pixel
## art, escala 4), Vida, Hurtbox (layer enemy), Contato (Hitbox, layer enemy_hitbox).
## O desenho olha para a esquerda; virar(true) espelha para a direita.
##
## Animações que a base usa: idle, dano (susto ao levar golpe parado; sem laço),
## transicao (troca de fase; sem laço) e derrota. Sem "dano"/"transicao" ele só pisca.

## Emitido quando a vida chega a zero. A arena escuta para a vitória/salvar progresso.
signal chefe_derrotado
## Emitido quando a luta passa para a próxima fase (0 = fase 1).
signal fase_mudou(fase: int)
## Um passo da física, já multiplicado pelo relógio do chefe. Quem espera usa este sinal.
signal _passo(delta: float)

enum EstadoLuta { ESPERANDO, ATACANDO, TRANSICAO, DERROTADO }

## Meia largura da arena (px): as paredes ficam em ±960 (arena centrada na câmera).
const ARENA_MEIA_LARGURA: float = 960.0

## Cor do brilho durante os avisos (telegrafo visual). Só visual.
const COR_AVISO: Color = Color(1.6, 0.9, 0.5)
## Cor do chefe enquanto está envenenado / lento. Só visual.
const COR_VENENO: Color = Color(0.6, 1.25, 0.55)
const COR_LENTO: Color = Color(0.65, 0.8, 1.45)
## Envenenamento: um pulso de dano por segundo (GDD: "20 de dano por segundo").
const INTERVALO_VENENO: float = 1.0

# Retorno do golpe (só visual): pisca branco, tranco do desenho e susto.
## Força e duração (s) do pisca branco a cada acerto.
const PISCA_FORCA: float = 0.85
const PISCA_DURACAO: float = 0.1
## Tranco: o desenho recua 1 pixel da arte (4 px na tela), para longe do Curupira, e volta.
const TRANCO_PX: float = 4.0
## Tempo mínimo entre dois sustos (pose "dano"), para a rajada de folhas não travar a pose (s).
const INTERVALO_SUSTO: float = 0.8
## Faísca no ponto onde o tiro bateu (curupira/efeitos/acerto). No máximo uma a cada
## INTERVALO_ACERTO s, para os ataques contínuos não encherem a tela.
const CENA_ACERTO: PackedScene = preload("res://scenes/efeito_acerto.tscn")
const INTERVALO_ACERTO: float = 0.05

# Transição de fase (só visual; a duração fica no .tres).
const TREMOR_TRANSICAO_PX: float = 14.0
const TREMOR_TRANSICAO_DURACAO: float = 0.6
const COR_CLARAO_TRANSICAO: Color = Color(1.0, 0.96, 0.85, 0.6)
const DURACAO_CLARAO_TRANSICAO: float = 0.45

## Números do chefe (vida, tempos, golpes). Cada chefe usa a própria classe (MulaData, CucaData).
@export var dados: ChefeData
## Quem o chefe ataca. Apontar no inspetor da arena (o Curupira).
@export var alvo: Node2D

var derrotado: bool = false
var estado_luta: EstadoLuta = EstadoLuta.ESPERANDO
## Fase atual da luta (índice em _fases: 0 = primeira).
var fase: int = 0
## Ataque em andamento (vazio entre ataques).
var ataque_atual: StringName = &""
# Fases da dificuldade escolhida, da primeira à última.
var _fases: Array[FaseChefe] = []
# Ataques que ainda faltam sair nesta rodada do saco.
var _saco: Array[StringName] = []
var _ultimo_ataque: StringName = &""
var _ultimo_combo: ComboChefe
# A primeira jogada depois da transição é um combo com novidade: um ataque que entrou na fase
# ou um combo que a fase anterior não tinha.
var _combo_obrigatorio: bool = false
var _ataques_novos: Array[StringName] = []
var _combos_novos: Array[ComboChefe] = []
var _sorteio := RandomNumberGenerator.new()
# Multiplica a velocidade das animações (ex.: o salto do Boto dura o que o .tres mandar).
var _ritmo_animacao: float = 1.0
var _veneno_por_pulso: int = 0
var _pulsos_veneno: int = 0
var _timer_veneno: Timer
var _tween_pisca: Tween
var _tween_tranco: Tween
var _material_pisca: ShaderMaterial
# Onde o desenho fica parado: o tranco mexe nele e as caixas de dano usam este valor.
var _pos_sprite_base: Vector2 = Vector2.ZERO
var _tempo_susto: float = 0.0
var _tempo_acerto: float = 0.0
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
	vida.configurar(dados.vida_para(GameState.dificuldade))
	contato.dano = dados.golpes_contato
	FolhaSprites.preparar(sprite)
	_pos_sprite_base = sprite.position
	_material_pisca = EfeitosTela.preparar_pisca(_visual_colorido())
	sprite.animation_finished.connect(_ao_terminar_animacao)
	_preparar_caixas()
	_carregar_fases()
	_sorteio.randomize()
	# Começa no próximo frame: o _ready do chefe (filho desta classe) ainda está rodando.
	_lutar.call_deferred()


func _physics_process(delta: float) -> void:
	_tempo_susto = maxf(_tempo_susto - delta, 0.0)
	_tempo_acerto = maxf(_tempo_acerto - delta, 0.0)
	_passo.emit(delta * fator_tempo())


func _process(_delta: float) -> void:
	# A lentidão também deixa as animações mais lentas.
	sprite.speed_scale = fator_tempo() * _ritmo_animacao


## O laço da luta: pausa, sorteia uma jogada da fase, executa, repete.
func _lutar() -> void:
	tocar(&"idle")
	if not await esperar(dados.pausa_entre_ataques):
		return
	while not derrotado:
		if _atualizar_fase():
			if not await _transicao_de_fase():
				return
		var combo: ComboChefe = _sortear_combo()
		estado_luta = EstadoLuta.ATACANDO
		if combo:
			if not await _jogar_combo(combo):
				return
		else:
			_ultimo_combo = null
			ataque_atual = _tirar_do_saco()
			await _executar(ataque_atual, false)
		if derrotado:
			return
		ataque_atual = &""
		estado_luta = EstadoLuta.ESPERANDO
		avisar(false)
		tocar(&"idle")
		if not await _pausa(dados.pausa_entre_ataques * fase_atual().fator_pausa):
			return


## Cada chefe implementa: um "match nome:" que chama a rotina do ataque com await.
## encadeado = é o primeiro de um combo: não espera os projéteis e pula a recuperação do fim.
func _executar(_nome: StringName, _encadeado: bool = false) -> void:
	await esperar(0.5)


## Os dois ataques do combo, um atrás do outro. false se o chefe foi derrotado no meio.
func _jogar_combo(combo: ComboChefe) -> bool:
	_ultimo_combo = combo
	ataque_atual = combo.primeiro
	await _executar(combo.primeiro, true)
	if derrotado:
		return false
	_ultimo_ataque = combo.primeiro
	# Passou do limiar da próxima fase no meio do primeiro: a transição vem antes do segundo.
	if _fase_pela_vida() > fase:
		return true
	if not await esperar(combo.atraso):
		return false
	ataque_atual = combo.segundo
	await _executar(combo.segundo, false)
	_ultimo_ataque = combo.segundo
	return not derrotado


## A pausa entre jogadas. Acaba antes se a vida passou do limiar da próxima fase,
## para a transição não esperar a pausa inteira. false se o chefe foi derrotado.
func _pausa(segundos: float) -> bool:
	var falta: float = segundos
	while falta > 0.0 and not is_zero_approx(falta):
		if _fase_pela_vida() > fase:
			break
		falta -= await _passo
		if derrotado:
			return false
	return not derrotado


# --- Fases -------------------------------------------------------------------

func _carregar_fases() -> void:
	if not _fases.is_empty():
		return
	_fases = dados.fases_para(GameState.dificuldade)
	if _fases.is_empty():
		push_error("%s sem fases no .tres (fases_normal vazio)." % dados.nome)
		_fases.append(FaseChefe.new())


## A fase em andamento (ataques, combos, chance de combo).
func fase_atual() -> FaseChefe:
	_carregar_fases()
	return _fases[fase]


## Quantas fases a luta tem nesta dificuldade.
func quantidade_fases() -> int:
	_carregar_fases()
	return _fases.size()


## Frações da vida em que cada fase depois da primeira começa (os entalhes da barra do HUD).
func limiares_fase() -> PackedFloat32Array:
	_carregar_fases()
	var lista := PackedFloat32Array()
	for i in range(1, _fases.size()):
		lista.append(_fases[i].comeca_com_vida)
	return lista


## A fase que a vida atual pede (a última cujo limiar já passou).
func _fase_pela_vida() -> int:
	var fracao: float = float(vida.atual) / float(maxi(vida.maximo, 1))
	var nova: int = 0
	for i in range(1, _fases.size()):
		if fracao <= _fases[i].comeca_com_vida:
			nova = i
	return nova


## Passa para a fase que a vida pede. true se mudou (aí vem a transição).
func _atualizar_fase() -> bool:
	var nova: int = _fase_pela_vida()
	if nova <= fase:
		return false
	var ataques_antes: Array[StringName] = fase_atual().ataques
	var combos_antes: Array[String] = []
	for c in fase_atual().combos:
		combos_antes.append(c.nome())
	fase = nova
	_ataques_novos.clear()
	for nome in fase_atual().ataques:
		if nome not in ataques_antes:
			_ataques_novos.append(nome)
	_combos_novos.clear()
	for c in fase_atual().combos:
		if c.nome() not in combos_antes:
			_combos_novos.append(c)
	_saco.clear()
	_combo_obrigatorio = true
	return true


## A troca de fase: o chefe para, a tela fica limpa e ele faz a animação "transicao", com
## tremor e clarão. Continua levando dano. false se for derrotado no meio.
func _transicao_de_fase() -> bool:
	estado_luta = EstadoLuta.TRANSICAO
	ataque_atual = &""
	avisar(false)
	_ritmo_animacao = 1.0
	# Some com tudo o que o chefe deixou na tela: a fase nova começa limpa.
	get_tree().call_group("ataques_chefe", "queue_free")
	fase_mudou.emit(fase)
	_virar_para_alvo()
	EfeitosTela.tremer(self, TREMOR_TRANSICAO_PX, TREMOR_TRANSICAO_DURACAO)
	EfeitosTela.clarao(self, COR_CLARAO_TRANSICAO, DURACAO_CLARAO_TRANSICAO)
	_piscar(1.0, 0.4)
	var duracao: float = maxf(FolhaSprites.duracao(sprite, &"transicao"), dados.duracao_transicao)
	reiniciar(&"transicao")
	_efeitos_da_transicao()  # sem await: roda junto com a espera abaixo
	if not await esperar(duracao):
		return false
	tocar(&"idle")
	if not await esperar(dados.pausa_apos_transicao):
		return false
	estado_luta = EstadoLuta.ESPERANDO
	return true


## Tremores e afins no meio da animação "transicao" (ex.: a pisada da Mula). Cada chefe
## sobrescreve com os momentos do próprio desenho; roda em paralelo com a transição.
func _efeitos_da_transicao() -> void:
	pass


## Para onde o chefe olha na transição. Cada chefe pode mudar (o Boto olha para a arena).
func _virar_para_alvo() -> void:
	virar(lado_do_alvo() > 0.0)


# --- Sorteio -----------------------------------------------------------------

## Combo ou nada (null = a jogada é um ataque só, tirado do saco).
func _sortear_combo() -> ComboChefe:
	var f: FaseChefe = fase_atual()
	var obrigatorio: bool = _combo_obrigatorio
	_combo_obrigatorio = false
	if f.combos.is_empty():
		return null
	var opcoes: Array[ComboChefe] = []
	if obrigatorio:
		# Logo depois da transição: um combo com novidade (ataque novo ou combo novo).
		for c in f.combos:
			if c.primeiro in _ataques_novos or c.segundo in _ataques_novos or c in _combos_novos:
				opcoes.append(c)
	elif _sorteio.randf() >= f.chance_combo:
		return null
	else:
		# Nem o mesmo combo duas vezes, nem um combo que começa com o ataque que acabou de sair.
		for c in f.combos:
			if c != _ultimo_combo and c.primeiro != _ultimo_ataque:
				opcoes.append(c)
	if opcoes.is_empty():
		if not obrigatorio:
			return null  # o único combo possível acabou de sair: vai um ataque sozinho
		opcoes = f.combos.duplicate()
	var combo: ComboChefe = opcoes[_sorteio.randi_range(0, opcoes.size() - 1)]
	# Os ataques do combo contam como já usados nesta rodada do saco.
	_saco.erase(combo.primeiro)
	_saco.erase(combo.segundo)
	return combo


## O próximo ataque do saco. Saco vazio: enche de novo com os ataques da fase, embaralhados.
func _tirar_do_saco() -> StringName:
	if _saco.is_empty():
		_encher_saco()
	if _saco.is_empty():
		return &""
	_ultimo_ataque = _saco.pop_back()
	return _ultimo_ataque


func _encher_saco() -> void:
	_saco = fase_atual().ataques.duplicate()
	# Embaralha (Fisher-Yates): cada ordem tem a mesma chance.
	for i in range(_saco.size() - 1, 0, -1):
		var j: int = _sorteio.randi_range(0, i)
		var troca: StringName = _saco[i]
		_saco[i] = _saco[j]
		_saco[j] = troca
	# A rodada nova não começa com o último ataque da anterior (sem repetir na emenda).
	# O próximo sai do fim da lista (pop_back).
	if _saco.size() > 1 and _saco.back() == _ultimo_ataque:
		var ultimo: int = _saco.size() - 1
		_saco[ultimo] = _saco[0]
		_saco[0] = _ultimo_ataque


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
func take_damage(amount: int, from: Node) -> void:
	if derrotado:
		return
	vida.perder(amount)
	# Retorno a cada acerto (só visual): faísca onde bateu, pisca branco, recua um pixel e,
	# se estiver parado, faz a pose de susto.
	_soltar_faisca(from)
	_piscar()
	_dar_tranco()
	_assustar()


## Faísca de acerto onde o ataque do Curupira estava ao bater ("from" é o projétil).
func _soltar_faisca(from: Node) -> void:
	if _tempo_acerto > 0.0 or not (from is Node2D):
		return
	_tempo_acerto = INTERVALO_ACERTO
	var faisca: Node2D = CENA_ACERTO.instantiate()
	faisca.global_position = (from as Node2D).global_position
	get_tree().current_scene.add_child(faisca)


## Pisca branco (shader clarao.gdshader) e volta ao desenho normal. Vale por cima do brilho
## de aviso e da cor de veneno/lentidão, que antes deixavam o pisca avermelhado.
func _piscar(forca: float = PISCA_FORCA, duracao: float = PISCA_DURACAO) -> void:
	if _tween_pisca:
		_tween_pisca.kill()
	_material_pisca.set_shader_parameter("forca", forca)
	_tween_pisca = create_tween()
	_tween_pisca.tween_property(_material_pisca, "shader_parameter/forca", 0.0, duracao)


## O desenho recua um pixel para longe do Curupira e volta. As caixas de dano não mexem.
func _dar_tranco() -> void:
	if _tween_tranco:
		_tween_tranco.kill()
	var recuo := Vector2(-lado_do_alvo() * TRANCO_PX, 0.0)
	_tween_tranco = create_tween()
	_tween_tranco.tween_property(sprite, "position", _pos_sprite_base + recuo, 0.03)
	_tween_tranco.tween_property(sprite, "position", _pos_sprite_base, 0.07)


## Pose "dano" só quando o chefe está parado entre ataques (não corta ataque nem aviso)
## e no máximo uma vez a cada INTERVALO_SUSTO.
func _assustar() -> void:
	if derrotado or estado_luta != EstadoLuta.ESPERANDO or _tempo_susto > 0.0:
		return
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(&"dano"):
		return
	_tempo_susto = INTERVALO_SUSTO
	reiniciar(&"dano")


func _ao_terminar_animacao() -> void:
	# Fim do susto: volta a respirar (se nada começou no meio).
	if sprite.animation == &"dano" and estado_luta == EstadoLuta.ESPERANDO:
		tocar(&"idle")


## Muda a cor base (ex.: ficou envenenado). O pisca é outro canal (shader), não atrapalha.
func _atualizar_cor() -> void:
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
## O ritmo da fase acelera tudo do mesmo jeito (Mula no Expert).
## Projéteis que o chefe já soltou não são afetados.
func fator_tempo() -> float:
	return (1.0 - _lentidao if esta_lento() else 1.0) * fase_atual().ritmo


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
	var caixa: Rect2 = _caixa_do_desenho(sprite.animation)
	if caixa.size == Vector2.ZERO:
		return
	var tam_h: Vector2 = caixa.size * dados.fracao_hurtbox
	_por_caixa(hurtbox, caixa.get_center(), tam_h)
	var tam_c: Vector2 = caixa.size * dados.fracao_contato
	_por_caixa(contato, Vector2(caixa.get_center().x, caixa.end.y - tam_c.y / 2.0), tam_c)


## Caixa do desenho numa animação, relativa ao chefe (com escala e espelhamento).
## ZERO se a folha não tiver a caixa dessa animação.
func _caixa_do_desenho(animacao: StringName) -> Rect2:
	var arte: Rect2 = FolhaSprites.caixa(sprite, animacao)
	if arte.size == Vector2.ZERO:
		return Rect2()
	# Da arte (relativa à âncora = origem do sprite) para o chefe.
	var a: Vector2 = _pos_sprite_base + arte.position * sprite.scale
	var b: Vector2 = _pos_sprite_base + arte.end * sprite.scale
	return Rect2(a, Vector2.ZERO).expand(b)


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
	if _tween_tranco:
		_tween_tranco.kill()
	sprite.position = _pos_sprite_base
	hurtbox.ligada = false
	contato.set_deferred("monitoring", false)
	# Some com projéteis, poças etc. que ainda estão na tela.
	get_tree().call_group("ataques_chefe", "queue_free")
	_ao_ser_derrotado()
	reiniciar(&"derrota")
	chefe_derrotado.emit()
	print("%s derrotado(a)!" % dados.nome)
