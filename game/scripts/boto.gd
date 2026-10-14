extends Chefe
## Boto cor-de-rosa — terceiro chefe. "Vida alta, mais movimento e dano baixo" (GDD).
## Fica na água, num dos lados da península, e troca de lado pulando por cima da arena.
## Em cada lado faz o mesmo ciclo (~6 s, GDD: "troca de lado a cada 6 s"):
##   ESPERANDO (2 s) -> AVISO_JATO (0,7 s) -> JATO -> PARADA (1,2 s) -> PULANDO -> outro lado
## No pulo solta três bolhas lentas (sem aviso, 1 golpe cada). O jato é horizontal,
## rente ao chão, até a outra parede (1 golpe). Aviso do jato: ele suga água pela boca
## (gotas vindo para a boca + bola de água crescendo) e brilha azul.
## Encostar no corpo também machuca, inclusive durante o pulo.
## Vida, dano recebido, contato e derrota vêm da classe base Chefe (chefe.gd).
##
## Animações usadas (criar no SpriteFrames do AnimatedSprite2D com estes nomes exatos):
##   idle        — esperando na água
##   aviso_jato  — preparando o jato (0,7 s)
##   jato        — soltando o jato
##   parada      — parado depois do jato (1,2 s)
##   pulo        — pulando para o outro lado
##   derrota     — derrotado (sem loop)
## Se uma animação ainda não existir, o código só não troca para ela (não dá erro).
## O desenho olha para a esquerda; no lado esquerdo ele é espelhado para olhar a arena.

enum Estado { ESPERANDO, AVISO_JATO, JATO, PARADA, PULANDO, DERROTADO }

## Brilho de aviso do Boto: azul de água. Só visual.
const COR_AVISO_BOTO: Color = Color(0.8, 1.1, 1.8)

## Os dois pontos na água entre os quais o Boto pula. Ficam na arena (ajustáveis no editor).
@export var lado_esquerdo: Marker2D
@export var lado_direito: Marker2D

var estado: Estado = Estado.ESPERANDO
var _tempo: float = 0.0
var _no_lado_direito: bool = true
var _pulo_de: Vector2 = Vector2.ZERO
var _pulo_para: Vector2 = Vector2.ZERO
var _tempo_pulo: float = 0.0
var _bolhas_soltas: int = 0
var _succao: SuccaoBoto
var _boca_x: float = 0.0

## Os dados com o tipo do Boto (o campo "dados" da base é do tipo genérico ChefeData).
@onready var _d: BotoData = dados as BotoData
## Para onde a água é sugada no aviso do jato (espelhado junto com o desenho).
@onready var boca: Marker2D = $Boca


func _ready() -> void:
	super._ready()
	# Começa no lado direito, olhando para a arena; o primeiro respiro é a pausa normal.
	if lado_direito:
		global_position = lado_direito.global_position
	_boca_x = absf(boca.position.x)
	_olhar_para_arena()
	_entrar(Estado.ESPERANDO, _d.pausa_entre_ataques)


func _physics_process(delta: float) -> void:
	delta *= fator_tempo()  # Bolha Abissal: o relógio do chefe anda mais devagar
	if estado == Estado.DERROTADO:
		return
	if estado == Estado.PULANDO:
		_processar_pulo(delta)
		return
	_tempo -= delta
	if estado == Estado.AVISO_JATO and _succao:
		_succao.mostrar_progresso(1.0 - _tempo / _d.aviso_jato)
	if _tempo > 0.0 and not is_zero_approx(_tempo):
		return

	# O tempo do estado atual acabou: o ciclo é sempre o mesmo em cada lado.
	match estado:
		Estado.ESPERANDO:
			_entrar(Estado.AVISO_JATO, _d.aviso_jato)
		Estado.AVISO_JATO:
			_soltar_jato()
			_entrar(Estado.JATO, _d.duracao_jato)
		Estado.JATO:
			_entrar(Estado.PARADA, _d.parada_apos_jato)
		Estado.PARADA:
			_comecar_pulo()


func _entrar(novo_estado: Estado, duracao: float) -> void:
	estado = novo_estado
	_tempo = duracao
	avisar(estado == Estado.AVISO_JATO, COR_AVISO_BOTO)
	# Aviso do jato: começa a sugar água; em qualquer outro estado a sucção some.
	if estado == Estado.AVISO_JATO:
		_succao = _d.cena_succao.instantiate()
		boca.add_child(_succao)
	elif _succao:
		_succao.queue_free()
		_succao = null
	_atualizar_animacao()


## Direção da arena vista do lado em que o Boto está: -1 = esquerda, 1 = direita.
func _direcao_arena() -> float:
	return -1.0 if _no_lado_direito else 1.0


func _olhar_para_arena() -> void:
	# O PNG olha para a esquerda: espelha quando precisa olhar para a direita.
	sprite.flip_h = _direcao_arena() > 0.0
	boca.position.x = _boca_x * _direcao_arena()


func _soltar_jato() -> void:
	var jato: JatoBoto = _d.cena_jato.instantiate()
	jato.configurar(_direcao_arena(), _d.duracao_jato, _d.golpes_jato)
	# Sai do Boto e vai rente ao chão até a outra parede (a origem dele está no nível do chão).
	jato.global_position = Vector2(global_position.x, global_position.y - _d.altura_jato)
	lancar_na_cena(jato)


func _comecar_pulo() -> void:
	var destino: Marker2D = lado_esquerdo if _no_lado_direito else lado_direito
	_pulo_de = global_position
	_pulo_para = destino.global_position if destino else global_position
	_tempo_pulo = 0.0
	_bolhas_soltas = 0
	_entrar(Estado.PULANDO, _d.duracao_pulo)


## Arco: anda em linha reta entre os dois lados e sobe/desce numa parábola
## (altura máxima no meio do caminho).
func _processar_pulo(delta: float) -> void:
	_tempo_pulo += delta
	var p: float = clampf(_tempo_pulo / _d.duracao_pulo, 0.0, 1.0)
	global_position = _pulo_de.lerp(_pulo_para, p) + Vector2(0.0, -4.0 * _d.altura_pulo * p * (1.0 - p))

	# Bolhas em pontos iguais do caminho (para 3: em 1/4, 2/4 e 3/4 do pulo).
	var proxima: float = float(_bolhas_soltas + 1) / float(_d.quantidade_bolhas + 1)
	if _bolhas_soltas < _d.quantidade_bolhas and p >= proxima:
		_bolhas_soltas += 1
		_soltar_bolha()

	if p >= 1.0:
		_no_lado_direito = not _no_lado_direito
		_olhar_para_arena()
		_entrar(Estado.ESPERANDO, _d.pausa_entre_ataques)


func _soltar_bolha() -> void:
	var bolha: BolhaBoto = _d.cena_bolha.instantiate()
	bolha.dano = _d.golpes_bolha
	bolha.velocidade = _d.velocidade_bolha
	bolha.global_position = ponto_de_mira()  # sai do corpo do Boto
	lancar_na_cena(bolha)


func _ao_ser_derrotado() -> void:
	estado = Estado.DERROTADO
	_atualizar_animacao()


func _atualizar_animacao() -> void:
	match estado:
		Estado.ESPERANDO:
			tocar(&"idle")
		Estado.AVISO_JATO:
			tocar(&"aviso_jato")
		Estado.JATO:
			tocar(&"jato")
		Estado.PARADA:
			tocar(&"parada")
		Estado.PULANDO:
			tocar(&"pulo")
		Estado.DERROTADO:
			tocar(&"derrota")
