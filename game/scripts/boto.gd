extends Chefe
## Boto cor-de-rosa — terceiro chefe. Fica na água, num dos lados da península.
## Três fases (vida em boto.tres):
##   fase 1: jato, beijos;   fase 2: + chapeu;   fase 3: + salto (troca de lado).
## Encostar no corpo também machuca, inclusive durante o salto.
##
## Cada ataque, na ordem em que acontece:
##   jato    — incha puxando água (aviso) e solta um jato reto da boca, na altura do peito do
##             Curupira, até a outra margem; depois fica parado (janela);
##   beijos  — faz bico e manda N corações lentos e ondulando; um tiro estoura cada um;
##   chapeu  — gira o chapéu (aviso) e arremessa: vai baixo, volta alto, ele pega de volta;
##   salto   — mergulha e salta num arco por cima da areia até o outro lado, soltando bolhas.
## Os tiros saem dos pontos "bico" e "nadadeira" do desenho, quadro a quadro.
##
## Animações usadas (boto_frames.tres):
##   idle, aviso_jato, jato, fim_jato, aviso_beijos, beijos, fim_beijos, aviso_chapeu,
##   arremesso, sem_chapeu, pega_chapeu, mergulho, salto, emergir, derrota
## O desenho olha para a esquerda; no lado esquerdo ele vira para olhar a arena.

## Brilho de aviso do Boto: azul de água. Só visual.
const COR_AVISO_BOTO: Color = Color(0.8, 1.1, 1.8)
## A linha d'água (origem do Boto) fica abaixo da areia (px). Vem do desenho da arena.
const DESNIVEL_AGUA: float = 24.0

## Os dois pontos na água entre os quais o Boto salta. Ficam na arena (ajustáveis no editor).
@export var lado_esquerdo: Marker2D
@export var lado_direito: Marker2D

var _no_lado_direito: bool = true

@onready var _d: BotoData = dados as BotoData


func _ready() -> void:
	super._ready()
	if lado_direito:
		global_position = lado_direito.global_position
	_olhar_para_arena()


func _executar(nome: StringName) -> void:
	match nome:
		&"jato":
			await _jato()
		&"beijos":
			await _beijos()
		&"chapeu":
			await _chapeu()
		&"salto":
			await _salto()


## Direção da arena vista do lado em que o Boto está: -1 = esquerda, 1 = direita.
func _direcao_arena() -> float:
	return -1.0 if _no_lado_direito else 1.0


func _olhar_para_arena() -> void:
	virar(_direcao_arena() > 0.0)


func _jato() -> void:
	avisar(true, COR_AVISO_BOTO)
	reiniciar(&"aviso_jato")
	if not await esperar(_d.aviso_jato):
		return
	avisar(false)
	tocar(&"jato")
	var jato: JatoBoto = _d.cena_jato.instantiate()
	jato.configurar(_direcao_arena(), _d.duracao_jato, _d.golpes_jato)
	jato.global_position = ponto("bico")
	lancar_na_cena(jato)
	if not await esperar(_d.duracao_jato):
		return
	if not await tocar_e_esperar(&"fim_jato"):
		return
	# Parado depois do jato: é a janela para atacar.
	tocar(&"idle")
	await esperar(maxf(_d.parada_apos_jato - FolhaSprites.duracao(sprite, &"fim_jato"), 0.0))


func _beijos() -> void:
	avisar(true, COR_AVISO_BOTO)
	if not await tocar_e_esperar(&"aviso_beijos"):
		return
	avisar(false)
	tocar(&"beijos")
	for i in _d.quantidade_beijos:
		var coracao: CoracaoBoto = _d.cena_coracao.instantiate()
		coracao.dano = _d.golpes_beijo
		coracao.direcao = _direcao_arena()
		coracao.velocidade = _d.velocidade_beijo
		coracao.amplitude = _d.amplitude_beijo
		coracao.frequencia = _d.frequencia_beijo
		coracao.duracao = _d.duracao_beijo
		coracao.global_position = ponto("bico")
		lancar_na_cena(coracao)
		if not await esperar(_d.intervalo_beijos):
			return
	await tocar_e_esperar(&"fim_beijos")


func _chapeu() -> void:
	avisar(true, COR_AVISO_BOTO)
	tocar(&"aviso_chapeu")
	if not await esperar(_d.aviso_chapeu):
		return
	avisar(false)
	if not await tocar_e_esperar(&"arremesso"):
		return
	tocar(&"sem_chapeu")
	var chao: float = _chao_da_arena()
	# Vira baixo, perto da parede do outro lado.
	var virada := Vector2(_direcao_arena() * (ARENA_MEIA_LARGURA - _d.margem_chapeu), chao - _d.altura_ida_chapeu)
	var chapeu: ChapeuBoto = _d.cena_chapeu.instantiate()
	chapeu.dano = _d.golpes_chapeu
	chapeu.lancar(ponto("nadadeira"), virada, self, _d.altura_volta_chapeu - _d.altura_ida_chapeu, _d.duracao_ida_chapeu, _d.duracao_volta_chapeu)
	lancar_na_cena(chapeu)
	if not await esperar(_d.duracao_ida_chapeu + _d.duracao_volta_chapeu):
		return
	await tocar_e_esperar(&"pega_chapeu")


## O chão da arena: a areia fica 24 px (6 px da arte) acima da linha d'água onde o Boto fica.
func _chao_da_arena() -> float:
	var agua: float = lado_direito.global_position.y if lado_direito else global_position.y
	return agua - DESNIVEL_AGUA


func _salto() -> void:
	var destino: Marker2D = lado_esquerdo if _no_lado_direito else lado_direito
	if destino == null:
		return
	if not await tocar_e_esperar(&"mergulho"):
		return
	var de: Vector2 = global_position
	var para: Vector2 = destino.global_position
	# A animação do giro dura o salto inteiro, qualquer que seja a duração no .tres.
	_ritmo_animacao = FolhaSprites.duracao(sprite, &"salto") / _d.duracao_pulo
	reiniciar(&"salto")
	var tempo: float = 0.0
	var bolhas: int = 0
	while tempo < _d.duracao_pulo:
		var dt: float = await passo()
		if derrotado:
			return
		tempo += dt
		var p: float = clampf(tempo / _d.duracao_pulo, 0.0, 1.0)
		global_position = de.lerp(para, p) + Vector2(0.0, -4.0 * _d.altura_pulo * p * (1.0 - p))
		# Bolhas em pontos iguais do caminho (para 3: em 1/4, 2/4 e 3/4 do salto).
		if bolhas < _d.quantidade_bolhas and p >= float(bolhas + 1) / float(_d.quantidade_bolhas + 1):
			bolhas += 1
			_soltar_bolha()
	_ritmo_animacao = 1.0
	_no_lado_direito = not _no_lado_direito
	_olhar_para_arena()
	await tocar_e_esperar(&"emergir")


func _soltar_bolha() -> void:
	var bolha: BolhaBoto = _d.cena_bolha.instantiate()
	bolha.dano = _d.golpes_bolha
	bolha.velocidade = _d.velocidade_bolha
	bolha.global_position = ponto_de_mira()  # sai do corpo do Boto
	lancar_na_cena(bolha)
