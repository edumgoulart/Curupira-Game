extends Chefe
## Cuca — segundo chefe. Ataques, fases e combos por dificuldade no cuca.tres.
## Leva dano o tempo todo. Vida, fases, sorteio, combos e derrota vêm da classe base Chefe.
##
## Cada ataque, na ordem em que acontece (o aviso é a animação aviso_*):
##   leque  — ergue as garras com bolas verdes (aviso) e empurra: N feitiços em leque, o do meio
##            mirado no Curupira;
##   pocao  — tira a poção do cinto e chacoalha (aviso) e joga em arco até onde o Curupira está;
##            vira poça de veneno ou de lentidão. Depois fica parada;
##   bote   — agacha com a boca aberta (aviso), desliza de barriga abocanhando até a parede do lado
##            do Curupira e levanta. Fica lá: não volta de costas para o lugar (isso prendia o
##            Curupira). Os ataques seguintes saem de onde ela está, espelhados;
##   ninar  — canta uma melodia: as notas vêm uma de cada vez, graves (rente ao chão; pula-se) ou
##            agudas (na altura do peito; abaixa-se), cada tipo de uma cor.
##            Antes eram duas fileiras com uma brecha menor que o Curupira: não dava para passar.
## Os tiros saem dos pontos "garra" e "boca" do desenho, quadro a quadro.
## Encadeado (primeiro de um combo): a poção pula a parada do fim e o bote pula o "levantar".
##
## Animações usadas (cuca_frames.tres):
##   idle, aviso_feitico, feitico, fim_feitico, aviso_pocao, pocao, fim_pocao, aviso_bote,
##   bote, levantar, aviso_ninar, ninar, fim_ninar, derrota,
##   dano e transicao (usadas pela base Chefe)

## Brilho de aviso da Cuca: verde de magia (o da Mula é laranja). Só visual.
const COR_AVISO_CUCA: Color = Color(0.85, 1.6, 0.85)
## Cor das notas: grave (pula-se) quente, aguda (abaixa-se) fria. Só visual.
const COR_NOTA_GRAVE: Color = Color(1.0, 0.75, 0.35)
const COR_NOTA_AGUDA: Color = Color(0.55, 0.9, 1.0)

@onready var _d: CucaData = dados as CucaData


func _executar(nome: StringName, encadeado: bool = false) -> void:
	# Todo ataque começa de frente para o Curupira (ela pode estar em qualquer lado).
	_virar_para_alvo()
	match nome:
		&"leque":
			await _leque()
		&"pocao":
			await _pocao(encadeado)
		&"bote":
			await _bote(encadeado)
		&"ninar":
			await _ninar()


func _leque() -> void:
	avisar(true, COR_AVISO_CUCA)
	reiniciar(&"aviso_feitico")
	if not await esperar(_d.aviso_feitico):
		return
	avisar(false)
	reiniciar(&"feitico")
	_lancar_feiticos()
	if not await esperar(FolhaSprites.duracao(sprite, &"feitico")):
		return
	await tocar_e_esperar(&"fim_feitico")


## Leque: o do meio vai na direção do Curupira; os outros abrem "abertura" graus para cada lado.
func _lancar_feiticos() -> void:
	var origem: Vector2 = ponto("garra")
	var direcao_meio: Vector2 = (pos_do_alvo() - origem).normalized()
	var n: int = _d.quantidade_feiticos
	for i in n:
		# i = 0..n-1  ->  deslocamento -1..+1 (para 3: -1, 0, +1)
		var deslocamento: float = 0.0 if n == 1 else (i - (n - 1) / 2.0)
		var direcao: Vector2 = direcao_meio.rotated(deg_to_rad(_d.abertura_feitico * deslocamento))
		var feitico: ProjetilChefe = _d.cena_feitico.instantiate()
		feitico.dano = _d.golpes_feitico
		feitico.global_position = origem
		feitico.lancar(direcao * _d.velocidade_feitico)
		lancar_na_cena(feitico)


func _pocao(encadeado: bool) -> void:
	avisar(true, COR_AVISO_CUCA)
	reiniciar(&"aviso_pocao")
	if not await esperar(_d.aviso_pocao):
		return
	avisar(false)
	reiniciar(&"pocao")
	_jogar_pocao()
	if not await tocar_e_esperar(&"fim_pocao"):
		return
	if encadeado:
		return
	# Parada depois da poção: é a janela para atacar.
	tocar(&"idle")
	await esperar(maxf(_d.parada_apos_pocao - FolhaSprites.duracao(sprite, &"fim_pocao"), 0.0))


func _jogar_pocao() -> void:
	var tipo: PocaCuca.Tipo = PocaCuca.Tipo.VENENO if _sorteio.randi_range(0, 1) == 0 else PocaCuca.Tipo.LENTIDAO
	var pocao: PocaoCuca = _d.cena_pocao.instantiate()
	pocao.global_position = ponto("garra")
	# Cai no chão embaixo do Curupira no momento do arremesso (a origem da Cuca fica nos pés).
	pocao.lancar(Vector2(x_do_alvo(), global_position.y), tipo, _d)
	lancar_na_cena(pocao)


func _bote(encadeado: bool) -> void:
	var lado: float = lado_do_alvo()
	# Vai até a parede do lado do Curupira: para passar, tem que pular por cima ou dar dash.
	var destino: float = lado * (ARENA_MEIA_LARGURA - _d.margem_parede_bote)
	avisar(true, COR_AVISO_CUCA)
	virar(lado > 0.0)
	reiniciar(&"aviso_bote")
	if not await esperar(_d.aviso_bote):
		return
	avisar(false)
	contato.dano = _d.golpes_bote
	tocar(&"bote")
	if not await andar_ate(destino, _d.velocidade_bote):
		return
	contato.dano = dados.golpes_contato
	if encadeado:
		# Levanta já virando para o próximo ataque do combo.
		_virar_para_alvo()
		return
	if not await tocar_e_esperar(&"levantar"):
		return
	# Fica nesta parede e só se vira para o Curupira.
	_virar_para_alvo()


func _ninar() -> void:
	var lado: float = lado_do_alvo()
	avisar(true, COR_AVISO_CUCA)
	if not await tocar_e_esperar(&"aviso_ninar"):
		return
	if not await esperar(maxf(_d.aviso_ninar - FolhaSprites.duracao(sprite, &"aviso_ninar"), 0.0)):
		return
	avisar(false)
	tocar(&"ninar")
	for i in _d.quantidade_notas:
		var aguda: bool = _sorteio.randf() < _d.chance_nota_aguda
		_soltar_nota(aguda, lado)
		if not await esperar(_d.intervalo_notas):
			return
	await tocar_e_esperar(&"fim_ninar")


## Grave: rente ao chão (pula-se). Aguda: na altura do peito (abaixa-se).
func _soltar_nota(aguda: bool, lado: float) -> void:
	var nota: ProjetilChefe = _d.cena_nota.instantiate()
	nota.dano = _d.golpes_nota
	nota.modulate = COR_NOTA_AGUDA if aguda else COR_NOTA_GRAVE
	var altura: float = _d.altura_nota_aguda if aguda else _d.altura_nota_grave
	nota.global_position = Vector2(ponto("boca").x, global_position.y - altura)
	nota.lancar(Vector2(lado * _d.velocidade_notas, 0.0))
	lancar_na_cena(nota)


func _ao_ser_derrotado() -> void:
	contato.dano = dados.golpes_contato
