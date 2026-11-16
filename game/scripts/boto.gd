extends Chefe
## Boto cor-de-rosa — terceiro chefe. Fica na água, num dos lados da península.
## Ataques, fases e combos por dificuldade no boto.tres.
## Encostar no corpo também machuca, inclusive durante o salto.
##
## Cada ataque, na ordem em que acontece:
##   jato    — sorteia a altura: alto (acerta o Curupira em pé; abaixa-se) ou baixo (rente à
##             areia; pula-se). No aviso, afunda (ou sobe) na água até o bico ficar nessa
##             altura, incha puxando água, e a água começa a sair do bico, fina, crescendo.
##             Então o jato sai reto da boca até a outra margem. Volta para a linha d'água no
##             fim do jato e fica parado (janela);
##   beijos  — faz bico (aviso) e manda N corações lentos e ondulando; um tiro estoura cada um;
##   chapeu  — gira o chapéu (aviso; a linha fina mostra a altura da ida) e arremessa.
##             Sorteia a ordem: vai baixo e volta alto, ou vai alto e volta baixo. Ele pega
##             de volta;
##   salto   — brilha e mergulha (aviso) e salta num arco por cima da areia até o outro lado,
##             soltando bolhas. Cada bolha desce devagar balançando.
## Encadeado (primeiro de um combo): o jato pula a parada do fim.
## Os tiros saem dos pontos "bico" e "nadadeira" do desenho, quadro a quadro.
## Em volta dele, a água se mexe (AguaBoto: anéis, espuma e gotinhas) e respinga quando ele
## afunda, sobe ou salta.
##
## Animações usadas (boto_frames.tres):
##   idle, aviso_jato, jato, fim_jato, aviso_beijos, beijos, fim_beijos, aviso_chapeu,
##   arremesso, sem_chapeu, pega_chapeu, mergulho, salto, emergir, derrota,
##   dano e transicao (usadas pela base Chefe)
## O desenho olha para a esquerda; no lado esquerdo ele vira para olhar a arena.

## Brilho de aviso do Boto: azul de água. Só visual.
const COR_AVISO_BOTO: Color = Color(0.8, 1.1, 1.8)
## A linha d'água (origem do Boto) fica abaixo da areia (px). Vem do desenho da arena.
const DESNIVEL_AGUA: float = 24.0
## Linha de aviso do chapéu: cor, espessura (1 pixel da arte) e pisca. Começa esta distância à
## frente do bico, ainda sobre a água. Só visual.
const COR_LINHA_AVISO: Color = Color(0.75, 0.92, 1.0, 0.75)
const ESPESSURA_LINHA_AVISO: float = 4.0
const PISCA_LINHA_AVISO: float = 0.12
const INICIO_LINHA_AVISO: float = 180.0
## Aviso do jato: a água crescendo no bico troca de desenho a cada tanto (s), para pulsar.
const PISCA_CRESCIDA: float = 0.08
## Afundar ou subir mais que isto (px) faz a água respingar.
const MOVIMENTO_RESPINGO: float = 16.0
## Derrotado afundado (no meio do jato): tempo para voltar à linha d'água (s). Só visual.
const VOLTA_NA_DERROTA: float = 0.4

## Os dois pontos na água entre os quais o Boto salta. Ficam na arena (ajustáveis no editor).
@export var lado_esquerdo: Marker2D
@export var lado_direito: Marker2D

var _no_lado_direito: bool = true
# Altura (global) da linha d'água, onde o Boto fica parado. O jato afunda ele; o fim volta.
var _y_agua: float = 0.0
# No ar, no salto: a água em volta some e a derrota não puxa ele para a linha d'água.
var _no_ar: bool = false
var _agua: AguaBoto

@onready var _d: BotoData = dados as BotoData


func _ready() -> void:
	super._ready()
	if lado_direito:
		global_position = lado_direito.global_position
	_y_agua = global_position.y
	_agua = AguaBoto.new()
	_agua.linha_agua = _y_agua
	add_child(_agua)
	_olhar_para_arena()


func _executar(nome: StringName, encadeado: bool = false) -> void:
	match nome:
		&"jato":
			await _jato(encadeado)
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


## Na transição de fase ele olha para a arena (não sai da água).
func _virar_para_alvo() -> void:
	_olhar_para_arena()


## Na "transicao" ele gira fora da água: respingo grande em ~0,48 s e outro na volta em ~1,58 s.
func _efeitos_da_transicao() -> void:
	if not await esperar(0.48):
		return
	EfeitosTela.tremer(self, 7.0, 0.2)
	if await esperar(1.1):
		EfeitosTela.tremer(self, 4.0, 0.15)


## Linha fina piscando na altura "y", da beira da água até a outra margem, durante o aviso do
## chapéu: diz se a ida vem alta (abaixa-se) ou baixa (pula-se). Some sozinha na derrota/transição.
func _linha_de_aviso(y: float) -> Line2D:
	var linha := Line2D.new()
	linha.add_to_group("ataques_chefe")
	linha.width = ESPESSURA_LINHA_AVISO
	linha.default_color = COR_LINHA_AVISO
	var x0: float = ponto("bico").x + _direcao_arena() * INICIO_LINHA_AVISO
	var x1: float = _direcao_arena() * ARENA_MEIA_LARGURA
	linha.points = PackedVector2Array([Vector2.ZERO, Vector2(x1 - x0, 0.0)])
	lancar_na_cena(linha)
	linha.global_position = Vector2(x0, y)
	var pisca: Tween = linha.create_tween().set_loops()
	pisca.tween_property(linha, "modulate:a", 0.2, PISCA_LINHA_AVISO)
	pisca.tween_property(linha, "modulate:a", 1.0, PISCA_LINHA_AVISO)
	return linha


func _apagar(linha: Line2D) -> void:
	if is_instance_valid(linha):
		linha.queue_free()


func _jato(encadeado: bool) -> void:
	# Alto (abaixa-se) ou baixo (pula-se). Quem mostra a altura é o próprio Boto: ele afunda
	# (ou sobe) até o bico ficar nela, e o jato sai reto.
	var baixo: bool = _sorteio.randf() < _d.chance_jato_baixo
	var altura: float = _d.altura_jato_baixo if baixo else _d.altura_jato_alto
	var duracao: float = _d.duracao_jato_baixo if baixo else _d.duracao_jato
	var y_jato: float = _chao_da_arena() - altura
	# O aviso (aviso_jato) se divide em: ajuste da altura, espera e a água crescendo no bico.
	var ajuste: float = minf(_d.ajuste_jato, _d.aviso_jato)
	var crescida: float = minf(_d.crescida_jato, _d.aviso_jato - ajuste)
	avisar(true, COR_AVISO_BOTO)
	reiniciar(&"aviso_jato")
	if not await _ir_para_altura(_y_para_bico_em(y_jato), ajuste):
		return
	if not await esperar(_d.aviso_jato - ajuste - crescida):
		return
	if not await _crescer_jato(crescida):
		return
	avisar(false)
	tocar(&"jato")
	var jato: JatoBoto = _d.cena_jato.instantiate()
	jato.configurar(_direcao_arena(), duracao, _d.golpes_jato)
	jato.global_position = Vector2(ponto("bico").x, y_jato)
	lancar_na_cena(jato)
	if not await esperar(duracao):
		return
	# Volta para a linha d'água durante o fim do jato (também no combo, antes do próximo ataque).
	reiniciar(&"fim_jato")
	if not await _ir_para_altura(_y_agua, FolhaSprites.duracao(sprite, &"fim_jato")):
		return
	if encadeado:
		return
	# Parado depois do jato: é a janela para atacar.
	tocar(&"idle")
	await esperar(maxf(_d.parada_apos_jato - FolhaSprites.duracao(sprite, &"fim_jato"), 0.0))


## Onde a origem do Boto (linha d'água do desenho) precisa ficar para o bico, na pose "jato",
## ficar na altura "y". Abaixo de _y_agua = afundar; acima = sair mais da água.
func _y_para_bico_em(y: float) -> float:
	var bico: Variant = FolhaSprites.ponto_na_pose(sprite, &"jato", "bico")
	if bico == null:
		return _y_agua
	return y - (_pos_sprite_base.y + (bico as Vector2).y * sprite.scale.y)


## Afunda ou sobe, suave, até a origem ficar em "y", no relógio do chefe (a lentidão também
## vale). Mexendo bastante, a água respinga. false se for derrotado no meio.
func _ir_para_altura(y: float, tempo: float) -> bool:
	var de: float = global_position.y
	if absf(y - de) > MOVIMENTO_RESPINGO:
		_agua.respingar(global_position.x)
	var t: float = 0.0
	while t < tempo:
		t += await passo()
		if derrotado:
			return false
		global_position.y = lerpf(de, y, ease(minf(t / tempo, 1.0), -2.0))
	global_position.y = y
	return true


## Aviso do jato: a água sai do bico, curta e fina, e vai crescendo até virar o jato. Segue o
## bico quadro a quadro. Os desenhos (jato_crescendo) vêm em pares: tamanho × 2 + variante.
func _crescer_jato(tempo: float) -> bool:
	if tempo <= 0.0:
		return true
	var quadros: Array[Texture2D] = AguaBoto.quadros_do_efeito("jato_crescendo")
	var tamanhos: int = int(quadros.size() / 2.0)
	if tamanhos == 0:
		return await esperar(tempo)
	var agua := Sprite2D.new()
	agua.add_to_group("ataques_chefe")  # some na derrota
	agua.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	agua.centered = false
	agua.offset = -AguaBoto.centro_do_efeito("jato_crescendo")
	# O desenho aponta para a esquerda, como o Boto.
	agua.scale = Vector2(-4.0 * _direcao_arena(), 4.0)
	lancar_na_cena(agua)
	var t: float = 0.0
	while t < tempo:
		var tamanho: int = mini(int(t / tempo * tamanhos), tamanhos - 1)
		agua.texture = quadros[tamanho * 2 + int(t / PISCA_CRESCIDA) % 2]
		agua.global_position = ponto("bico")
		t += await passo()
		if derrotado:
			return false
	agua.queue_free()
	return true


func _beijos() -> void:
	avisar(true, COR_AVISO_BOTO)
	if not await tocar_e_esperar(&"aviso_beijos"):
		return
	if not await esperar(maxf(_d.aviso_beijos - FolhaSprites.duracao(sprite, &"aviso_beijos"), 0.0)):
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
	# Ordem normal: vai baixo (pula-se) e volta alto (abaixa-se). Invertida: o contrário.
	var invertido: bool = _sorteio.randf() < _d.chance_chapeu_invertido
	var altura_ida: float = _d.altura_alta_chapeu if invertido else _d.altura_baixa_chapeu
	var altura_volta: float = _d.altura_baixa_chapeu if invertido else _d.altura_alta_chapeu
	var chao: float = _chao_da_arena()
	avisar(true, COR_AVISO_BOTO)
	tocar(&"aviso_chapeu")
	var linha: Line2D = _linha_de_aviso(chao - altura_ida)
	if not await esperar(_d.aviso_chapeu):
		return
	_apagar(linha)
	avisar(false)
	if not await tocar_e_esperar(&"arremesso"):
		return
	tocar(&"sem_chapeu")
	# Vira na altura da ida, perto da parede do outro lado, e volta na outra altura.
	var virada := Vector2(_direcao_arena() * (ARENA_MEIA_LARGURA - _d.margem_chapeu), chao - altura_ida)
	var chapeu: ChapeuBoto = _d.cena_chapeu.instantiate()
	chapeu.dano = _d.golpes_chapeu
	chapeu.lancar(ponto("nadadeira"), virada, self, altura_volta - altura_ida, _d.duracao_ida_chapeu, _d.duracao_volta_chapeu)
	lancar_na_cena(chapeu)
	if not await esperar(_d.duracao_ida_chapeu + _d.duracao_volta_chapeu):
		return
	await tocar_e_esperar(&"pega_chapeu")


## O chão da arena: a areia fica 24 px (6 px da arte) acima da linha d'água onde o Boto fica.
func _chao_da_arena() -> float:
	return _y_agua - DESNIVEL_AGUA


## Derrotado afundado (no meio do jato): volta para a linha d'água para a animação da derrota.
func _ao_ser_derrotado() -> void:
	if not _no_ar and not is_equal_approx(global_position.y, _y_agua):
		create_tween().tween_property(self, "global_position:y", _y_agua, VOLTA_NA_DERROTA)


func _salto() -> void:
	var destino: Marker2D = lado_esquerdo if _no_lado_direito else lado_direito
	if destino == null:
		return
	var de: Vector2 = global_position
	var para: Vector2 = destino.global_position
	avisar(true, COR_AVISO_BOTO)
	if not await tocar_e_esperar(&"mergulho"):
		return
	if not await esperar(maxf(_d.aviso_salto - FolhaSprites.duracao(sprite, &"mergulho"), 0.0)):
		return
	avisar(false)
	# A animação do giro dura o salto inteiro, qualquer que seja a duração no .tres.
	_ritmo_animacao = FolhaSprites.duracao(sprite, &"salto") / _d.duracao_pulo
	reiniciar(&"salto")
	# Sai da água: respinga onde ele estava e a água em volta some até ele cair do outro lado.
	_no_ar = true
	_agua.mostrar(false)
	_agua.respingar(de.x)
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
	_no_ar = false
	_agua.mostrar(true)
	_agua.respingar(para.x)
	_no_lado_direito = not _no_lado_direito
	_olhar_para_arena()
	await tocar_e_esperar(&"emergir")


func _soltar_bolha() -> void:
	var bolha: BolhaBoto = _d.cena_bolha.instantiate()
	bolha.dano = _d.golpes_bolha
	bolha.velocidade = _d.velocidade_bolha
	bolha.global_position = ponto_de_mira()  # sai do corpo do Boto
	lancar_na_cena(bolha)
