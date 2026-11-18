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
##   beijos  — faz bico (aviso) e manda N corações que perseguem o Curupira ondulando; um
##             tiro estoura cada um. O que encosta, além do golpe, encanta: puxa o Curupira
##             para o lado do Boto por um tempo (CoracaoBoto, curupira.gd);
##   chapeu  — sorteia a ordem: vai baixo e volta alto, ou vai alto e volta baixo. No aviso,
##             tira o chapéu da cabeça, puxa o braço para trás e segura; ao mesmo tempo afunda
##             (ou sobe) até a nadadeira ficar na altura da ida. Quem mostra a altura é ele, sem
##             marca na tela. Arremessa: o chapéu sai da nadadeira e vai reto; ele volta para a
##             linha d'água e pega o chapéu de volta;
##   salto   — sorteia a forma. Por cima: brilha e afunda reto (aviso) e salta num arco alto
##             até o outro lado, soltando bolhas que descem balançando. Rasante: brilha, deita
##             para a frente e bate a cauda (aviso) e salta baixo e reto, deitado, na altura do
##             peito do Curupira (abaixa-se ou dá dash).
## Encadeado (primeiro de um combo): o jato pula a parada do fim.
## Os tiros saem dos pontos "bico" e "nadadeira" do desenho, quadro a quadro.
## Em volta dele, a água se mexe (AguaBoto: anéis, espuma e gotinhas) e respinga quando ele
## afunda, sobe ou salta.
##
## Animações usadas (boto_frames.tres):
##   idle, aviso_jato, jato, fim_jato, aviso_beijos, beijos, fim_beijos, aviso_chapeu,
##   segura_chapeu, arremesso, fim_arremesso, sem_chapeu, pega_chapeu, mergulho, salto,
##   aviso_rasante, rasante, emergir, derrota, dano e transicao (usadas pela base Chefe)
## O desenho olha para a esquerda; no lado esquerdo ele vira para olhar a arena.

## Brilho de aviso do Boto: azul de água. Só visual.
const COR_AVISO_BOTO: Color = Color(0.8, 1.1, 1.8)
## A linha d'água (origem do Boto) fica abaixo da areia (px). Vem do desenho da arena.
const DESNIVEL_AGUA: float = 24.0
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
	if not await _ir_para_altura(_y_para_ponto_em(y_jato, &"jato", "bico"), ajuste):
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


## Onde a origem do Boto (linha d'água do desenho) precisa ficar para o ponto "nome" do
## desenho, no quadro "quadro" da animação, ficar na altura "y". Ex.: o bico na pose "jato",
## a nadadeira no quadro em que o chapéu sai. Abaixo de _y_agua = afundar; acima = sair mais.
func _y_para_ponto_em(y: float, animacao: StringName, nome: String, quadro: int = 0) -> float:
	var p: Variant = FolhaSprites.ponto_na_pose(sprite, animacao, nome, quadro)
	if p == null:
		return _y_agua
	return y - (_pos_sprite_base.y + (p as Vector2).y * sprite.scale.y)


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
		coracao.curva = _d.curva_beijo
		coracao.amplitude = _d.amplitude_beijo
		coracao.frequencia = _d.frequencia_beijo
		coracao.duracao = _d.duracao_beijo
		coracao.alvo = alvo
		coracao.forca_encanto = _d.forca_encanto
		coracao.duracao_encanto = _d.duracao_encanto
		coracao.x_origem = global_position.x
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
	var y_ida: float = _chao_da_arena() - altura_ida
	# Quem mostra a altura é o próprio Boto: enquanto tira o chapéu e puxa o braço para trás,
	# afunda (ida baixa) ou quase não se mexe (ida alta), até a nadadeira, no quadro em que solta
	# o chapéu (o último do "arremesso"), ficar na altura da ida.
	var soltura: int = sprite.sprite_frames.get_frame_count(&"arremesso") - 1
	var ajuste: float = minf(_d.ajuste_chapeu, _d.aviso_chapeu)
	avisar(true, COR_AVISO_BOTO)
	reiniciar(&"aviso_chapeu")
	if not await _ir_para_altura(_y_para_ponto_em(y_ida, &"arremesso", "nadadeira", soltura), ajuste):
		return
	# Termina de puxar o braço e segura, tremendo, até o fim do aviso.
	var resto: float = _d.aviso_chapeu - ajuste
	var puxando: float = clampf(FolhaSprites.duracao(sprite, &"aviso_chapeu") - ajuste, 0.0, resto)
	if not await esperar(puxando):
		return
	tocar(&"segura_chapeu")
	if not await esperar(resto - puxando):
		return
	avisar(false)
	if not await tocar_e_esperar(&"arremesso"):
		return
	# Sai da nadadeira, já na altura da ida, e vai reto até perto da parede do outro lado.
	var saida := Vector2(ponto("nadadeira").x, y_ida)
	var virada := Vector2(_direcao_arena() * (ARENA_MEIA_LARGURA - _d.margem_chapeu), y_ida)
	var chapeu: ChapeuBoto = _d.cena_chapeu.instantiate()
	chapeu.dano = _d.golpes_chapeu
	chapeu.lancar(saida, virada, self, altura_volta - altura_ida, _d.duracao_ida_chapeu, _d.duracao_volta_chapeu)
	lancar_na_cena(chapeu)
	# Volta para a linha d'água enquanto o chapéu vai, e espera ele voltar.
	tocar(&"fim_arremesso")
	var subida: float = minf(_d.ajuste_chapeu, _d.duracao_ida_chapeu)
	if not await _ir_para_altura(_y_agua, subida):
		return
	tocar(&"sem_chapeu")
	if not await esperar(_d.duracao_ida_chapeu + _d.duracao_volta_chapeu - subida):
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
	# Duas formas, e o aviso diz qual: afundar reto = por cima (arco alto com bolhas);
	# deitar para a frente batendo a cauda = rasante (baixo e reto; abaixa-se).
	var rasante: bool = _sorteio.randf() < _d.chance_rasante
	var de: Vector2 = global_position
	var para: Vector2 = destino.global_position
	var aviso_anim: StringName = &"aviso_rasante" if rasante else &"mergulho"
	var aviso: float = _d.aviso_rasante if rasante else _d.aviso_salto
	avisar(true, COR_AVISO_BOTO)
	if not await tocar_e_esperar(aviso_anim):
		return
	if not await esperar(maxf(aviso - FolhaSprites.duracao(sprite, aviso_anim), 0.0)):
		return
	avisar(false)
	var duracao: float = _d.duracao_rasante if rasante else _d.duracao_pulo
	var altura: float = _subida_do_rasante() if rasante else _d.altura_pulo
	if rasante:
		reiniciar(&"rasante")  # em laço: a cauda batendo
	else:
		# A animação do giro dura o salto inteiro, qualquer que seja a duração no .tres.
		_ritmo_animacao = FolhaSprites.duracao(sprite, &"salto") / duracao
		reiniciar(&"salto")
	# Sai da água: respinga onde ele estava e a água em volta some até ele cair do outro lado.
	_no_ar = true
	_agua.mostrar(false)
	_agua.respingar(de.x)
	var tempo: float = 0.0
	var bolhas: int = 0
	while tempo < duracao:
		var dt: float = await passo()
		if derrotado:
			return
		tempo += dt
		var p: float = clampf(tempo / duracao, 0.0, 1.0)
		var subida: float = _perfil_rasante(p) if rasante else 4.0 * p * (1.0 - p)
		global_position = de.lerp(para, p) + Vector2(0.0, -altura * subida)
		# Bolhas (só por cima) em pontos iguais do caminho (para 5: em 1/6, 2/6... 5/6 do salto).
		if not rasante and bolhas < _d.quantidade_bolhas and p >= float(bolhas + 1) / float(_d.quantidade_bolhas + 1):
			bolhas += 1
			_soltar_bolha()
	_ritmo_animacao = 1.0
	_no_ar = false
	_agua.mostrar(true)
	_agua.respingar(para.x)
	_no_lado_direito = not _no_lado_direito
	_olhar_para_arena()
	await tocar_e_esperar(&"emergir")


## Rasante: quanto a origem sobe acima da água para a barriga (o pé da caixa do desenho
## "rasante", que é o pé da caixa de contato) ficar a altura_rasante acima da areia.
func _subida_do_rasante() -> float:
	var caixa: Rect2 = _caixa_do_desenho(&"rasante")
	var barriga: float = caixa.end.y if caixa.size != Vector2.ZERO else 0.0
	return _y_agua - (_chao_da_arena() - _d.altura_rasante - barriga)


## Forma do rasante (0 = na água, 1 = na altura): sobe rápido no começo, fica reto e desce no
## fim. subida_rasante é a parte do caminho usada para subir (e a mesma para descer).
func _perfil_rasante(p: float) -> float:
	var a: float = _d.subida_rasante
	return sin(PI / 2.0 * clampf(p / a, 0.0, 1.0)) * sin(PI / 2.0 * clampf((1.0 - p) / a, 0.0, 1.0))


func _soltar_bolha() -> void:
	var bolha: BolhaBoto = _d.cena_bolha.instantiate()
	bolha.dano = _d.golpes_bolha
	bolha.velocidade = _d.velocidade_bolha
	bolha.balanco = _d.balanco_bolha
	bolha.frequencia = _d.frequencia_bolha
	bolha.global_position = ponto_de_mira()  # sai do corpo do Boto
	lancar_na_cena(bolha)
