extends Chefe
## Cuca — segundo chefe. Três fases (vida em cuca.tres):
##   fase 1: leque, pocao;   fase 2: + bote;   fase 3: + ninar.
## Leva dano o tempo todo. Vida, fases, sorteio e derrota vêm da classe base Chefe.
##
## Cada ataque, na ordem em que acontece:
##   leque  — ergue as garras com bolas verdes (aviso) e empurra: N feitiços em leque,
##            o do meio mirado no Curupira;
##   pocao  — tira a poção do cinto e chacoalha (aviso), joga em arco onde o Curupira está;
##            vira poça de veneno ou de lentidão. Depois fica parada (janela);
##   bote   — agacha com a boca aberta (aviso), desliza de barriga abocanhando até passar do
##            Curupira, levanta e volta andando;
##   ninar  — canta: duas fileiras de notas em onda, com uma brecha entre elas que sobe e desce.
## Os tiros saem dos pontos "garra" e "boca" do desenho, quadro a quadro.
##
## Animações usadas (cuca_frames.tres):
##   idle, aviso_feitico, feitico, fim_feitico, aviso_pocao, pocao, fim_pocao, aviso_bote,
##   bote, levantar, andar, aviso_ninar, ninar, fim_ninar, derrota

## Brilho de aviso da Cuca: verde de magia (o da Mula é laranja). Só visual.
const COR_AVISO_CUCA: Color = Color(0.85, 1.6, 0.85)

@onready var _d: CucaData = dados as CucaData
@onready var _x_inicial: float = global_position.x


func _executar(nome: StringName) -> void:
	match nome:
		&"leque":
			await _leque()
		&"pocao":
			await _pocao()
		&"bote":
			await _bote()
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


func _pocao() -> void:
	avisar(true, COR_AVISO_CUCA)
	reiniciar(&"aviso_pocao")
	if not await esperar(_d.aviso_pocao):
		return
	avisar(false)
	reiniciar(&"pocao")
	_jogar_pocao()
	if not await tocar_e_esperar(&"fim_pocao"):
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


func _bote() -> void:
	var lado: float = lado_do_alvo()
	var destino: float = clampf(x_do_alvo() + lado * _d.alcance_alem_do_alvo, -ARENA_MEIA_LARGURA + 150.0, ARENA_MEIA_LARGURA - 150.0)
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
	if not await tocar_e_esperar(&"levantar"):
		return
	virar(_x_inicial > global_position.x)
	tocar(&"andar")
	if not await andar_ate(_x_inicial, _d.velocidade_volta):
		return
	virar(x_do_alvo() > global_position.x)


func _ninar() -> void:
	avisar(true, COR_AVISO_CUCA)
	if not await tocar_e_esperar(&"aviso_ninar"):
		return
	if not await esperar(maxf(_d.aviso_ninar - FolhaSprites.duracao(sprite, &"aviso_ninar"), 0.0)):
		return
	avisar(false)
	tocar(&"ninar")
	var lado: float = lado_do_alvo()
	var tempo: float = 0.0
	var proxima: float = 0.0
	while tempo < _d.duracao_ninar:
		if tempo >= proxima:
			proxima += _d.intervalo_notas
			# A brecha entre as duas fileiras sobe e desce com o tempo.
			var onda: float = sin(tempo * TAU * _d.frequencia_brecha) * _d.amplitude_brecha
			for altura in [_d.altura_fileira_baixa, _d.altura_fileira_alta]:
				_soltar_nota(Vector2(ponto("boca").x, global_position.y - altura - onda), lado)
		var dt: float = await passo()
		if derrotado:
			return
		tempo += dt
	await tocar_e_esperar(&"fim_ninar")


func _soltar_nota(posicao: Vector2, lado: float) -> void:
	var nota: ProjetilChefe = _d.cena_nota.instantiate()
	nota.dano = _d.golpes_nota
	# Nunca abaixo do chão: a fileira baixa desce no máximo até rente a ele.
	nota.global_position = Vector2(posicao.x, minf(posicao.y, global_position.y - 30.0))
	nota.lancar(Vector2(lado * _d.velocidade_notas, 0.0))
	lancar_na_cena(nota)


func _ao_ser_derrotado() -> void:
	contato.dano = dados.golpes_contato
