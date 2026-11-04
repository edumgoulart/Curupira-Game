extends Chefe
## Máquina de IA (o Núcleo) — chefe final. Pendurada no trilho do teto por um braço; a origem
## do node é o ponto do trilho. Três fases (vida em maquina.tres):
##   fase 1: laser, bombas;   fase 2: + pistoes;   fase 3: + varredura.
## Não concede ataque.
##
## Cada ataque, na ordem em que acontece:
##   laser      — a lente abre e uma linha fina segue o Curupira; trava e dispara;
##   bombas     — recolhe para o alto, os alçapões do teto abrem e caem N bombas
##                (uma no Curupira, as outras ao lado); depois fica parada (janela);
##   pistoes    — a lente olha o chão e as placas do piso saltam em ondas na direção do Curupira;
##   varredura  — desce até a altura do Curupira: laser reto na altura da cabeça (abaixar),
##                depois mira o chão e o ponto de impacto corre até a parede (pular).
## A hurtbox e o contato ficam no "Nucleo", que acompanha a lente do desenho (ponto "lente")
## a cada frame, porque o corpo desce e sobe dentro das próprias animações.
##
## Animações usadas (maquina_frames.tres):
##   idle, aviso_laser, mirando, laser, fim_laser, aviso_bombas, bombas, fim_bombas,
##   aviso_pistoes, pistoes, descer, varredura, varredura_chao, subir, derrota

## Brilho de aviso da Máquina: vermelho. Só visual.
const COR_AVISO_MAQUINA: Color = Color(1.8, 0.6, 0.6)
## Distância do centro do corpo até a lente, no desenho olhando para a esquerda (px).
const LENTE_AO_CENTRO: Vector2 = Vector2(62.0, 0.0)
## Alçapão que abre no teto em cima de cada bomba. Só visual.
const CENA_ALCAPAO: PackedScene = preload("res://scenes/alcapao_maquina.tscn")
## O chão da arena, medido do trilho (px): a arte põe o teto em 14 e o chão em 220 (× 4).
const ALTURA_DO_CHAO: float = 824.0

@onready var _d: MaquinaData = dados as MaquinaData
## Hurtbox e contato do corpo (seguem a lente).
@onready var nucleo: Node2D = $Nucleo


func _process(delta: float) -> void:
	super._process(delta)
	nucleo.global_position = ponto("lente") + LENTE_AO_CENTRO * Vector2(signf(sprite.scale.x), 1.0)


func _executar(nome: StringName) -> void:
	match nome:
		&"laser":
			await _laser()
		&"bombas":
			await _bombas()
		&"pistoes":
			await _pistoes()
		&"varredura":
			await _varredura()


## Onde a Máquina está pendurada fica fora da arena: o chão é medido a partir do trilho.
func _chao() -> float:
	return global_position.y + ALTURA_DO_CHAO


func _novo_laser(golpes: int) -> LaserMaquina:
	var laser: LaserMaquina = _d.cena_laser.instantiate()
	laser.dano = golpes
	laser.global_position = ponto("lente")
	lancar_na_cena(laser)
	return laser


func _laser() -> void:
	avisar(true, COR_AVISO_MAQUINA)
	reiniciar(&"aviso_laser")
	var laser := _novo_laser(_d.golpes_laser)
	var tempo: float = 0.0
	while tempo < _d.aviso_laser:
		if sprite.animation == &"aviso_laser" and not sprite.is_playing():
			tocar(&"mirando")
		laser.global_position = ponto("lente")
		# A linha acompanha o Curupira e trava no fim do aviso.
		if tempo < _d.aviso_laser - _d.travamento_laser:
			laser.mirar(pos_do_alvo())
		else:
			laser.travar()
		tempo += await passo()
		if derrotado:
			return
	avisar(false)
	tocar(&"laser")
	laser.disparar()
	if not await esperar(_d.duracao_laser):
		return
	laser.queue_free()
	await tocar_e_esperar(&"fim_laser")


func _bombas() -> void:
	avisar(true, COR_AVISO_MAQUINA)
	if not await tocar_e_esperar(&"aviso_bombas"):
		return
	avisar(false)
	tocar(&"bombas")
	# Uma bomba onde o Curupira está e as outras ao lado, alternando (para 3: 0, -d, +d).
	var centro: float = x_do_alvo()
	var pendentes: Array[int] = [_d.quantidade_bombas]
	for i in _d.quantidade_bombas:
		var passo_lado: int = (i + 1) / 2
		var lado: float = -1.0 if i % 2 == 1 else 1.0
		var x: float = clampf(centro + lado * passo_lado * _d.distancia_bombas, -ARENA_MEIA_LARGURA + 60.0, ARENA_MEIA_LARGURA - 60.0)
		var alcapao: Node2D = CENA_ALCAPAO.instantiate()
		alcapao.global_position = Vector2(x, global_position.y)
		lancar_na_cena(alcapao)
		get_tree().create_timer(2.0, false).timeout.connect(alcapao.queue_free)
		var bomba: BombaMaquina = _d.cena_bomba.instantiate()
		bomba.configurar(_d)
		bomba.global_position = Vector2(x, _chao())
		bomba.get_node("Corpo").position.y = global_position.y - _chao()
		bomba.explodiu.connect(func() -> void: pendentes[0] -= 1)
		lancar_na_cena(bomba)
	while pendentes[0] > 0:
		await passo()
		if derrotado:
			return
	if not await tocar_e_esperar(&"fim_bombas"):
		return
	# Parada depois das bombas: é a janela para atacar.
	tocar(&"idle")
	await esperar(maxf(_d.parada_apos_bombas - FolhaSprites.duracao(sprite, &"fim_bombas"), 0.0))


func _pistoes() -> void:
	avisar(true, COR_AVISO_MAQUINA)
	reiniciar(&"aviso_pistoes")
	if not await esperar(_d.aviso_pistoes):
		return
	avisar(false)
	tocar(&"pistoes")
	var lado: float = lado_do_alvo()
	var inicio: float = global_position.x
	var fim: float = lado * ARENA_MEIA_LARGURA
	var velocidade: float = _d.velocidade_onda_pistoes
	var duracao_total: float = 0.0
	for onda in _d.ondas_pistoes:
		# Placas lado a lado, saindo de baixo da Máquina até a parede do lado do Curupira.
		var x: float = inicio
		while (fim - x) * lado > 0.0:
			var placa: PlacaMaquina = _d.cena_placa.instantiate()
			var atraso: float = absf(x - inicio) / velocidade
			placa.configurar(atraso, _d.aviso_placa, _d.golpes_placa)
			placa.global_position = Vector2(x, _chao())
			lancar_na_cena(placa)
			duracao_total = maxf(duracao_total, atraso)
			x += lado * _d.largura_placa
		if not await esperar(_d.intervalo_ondas_pistoes):
			return
		velocidade *= _d.aceleracao_onda_pistoes
	await esperar(maxf(duracao_total - _d.intervalo_ondas_pistoes, 0.0) + _d.aviso_placa)


func _varredura() -> void:
	avisar(true, COR_AVISO_MAQUINA)
	if not await tocar_e_esperar(&"descer"):
		return
	tocar(&"varredura")
	var lado: float = lado_do_alvo()
	# 1ª passada: reta, na altura da lente (a cabeça do Curupira em pé).
	var laser := _novo_laser(_d.golpes_varredura)
	laser.rotation = 0.0 if lado > 0.0 else PI
	laser.travar()
	if not await esperar(_d.aviso_varredura):
		return
	avisar(false)
	laser.disparar()
	if not await esperar(_d.duracao_varredura_alta):
		return
	laser.queue_free()
	# 2ª passada: mira o chão perto dela e o ponto de impacto corre até a parede.
	avisar(true, COR_AVISO_MAQUINA)
	tocar(&"varredura_chao")
	laser = _novo_laser(_d.golpes_varredura)
	var x0: float = global_position.x + lado * _d.inicio_varredura_chao
	var x1: float = lado * ARENA_MEIA_LARGURA
	_apontar_no_chao(laser, x0)
	laser.travar()
	if not await esperar(_d.aviso_varredura):
		return
	avisar(false)
	laser.disparar()
	var tempo: float = 0.0
	while tempo < _d.duracao_varredura_chao:
		_apontar_no_chao(laser, lerpf(x0, x1, tempo / _d.duracao_varredura_chao))
		tempo += await passo()
		if derrotado:
			return
	laser.queue_free()
	await tocar_e_esperar(&"subir")


## Laser da lente até o ponto (x, chão), cortado no chão.
func _apontar_no_chao(laser: LaserMaquina, x: float) -> void:
	laser.global_position = ponto("lente")
	var alvo_chao := Vector2(x, _chao())
	laser.apontar(alvo_chao)
	laser.definir_comprimento(laser.global_position.distance_to(alvo_chao))


## Sem arte nova não há mais desenho provisório: quem pisca é o sprite.
func _visual_colorido() -> CanvasItem:
	return sprite


func ponto_de_mira() -> Vector2:
	return nucleo.global_position
