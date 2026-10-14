extends Chefe
## Cuca — segundo chefe. Fica parada; alterna entre dois ataques:
##   - feitiço: três bolas de magia em leque, o do meio mirado no Curupira
##     (aviso 0,5 s, 1 golpe cada);
##   - poção: arremessada em arco onde o Curupira está; vira uma poça de veneno ou de
##     lentidão por 5 s (no máximo duas na arena). Depois dela fica parada 1,5 s.
## Estado único (sem fases dentro da luta) e leva dano o tempo todo (regras do GDD).
## Vida, dano recebido, contato e derrota vêm da classe base Chefe (chefe.gd).
##
## Ciclo da máquina de estados:
##   ESPERANDO --sorteio--> AVISO_FEITICO --(lança o leque)--> ESPERANDO
##                     \--> AVISO_POCAO --(joga a poção)--> PARADA --(sem pausa extra)--> sorteio
##
## Animações usadas (criar no SpriteFrames do AnimatedSprite2D com estes nomes exatos):
##   idle           — esperando entre ataques
##   aviso_feitico  — preparando o feitiço (0,5 s)
##   aviso_pocao    — preparando a poção (0,6 s)
##   parada         — parada depois da poção (1,5 s)
##   derrota        — derrotada (sem loop)
## Se uma animação ainda não existir, o código só não troca para ela (não dá erro).

enum Estado { ESPERANDO, AVISO_FEITICO, AVISO_POCAO, PARADA, DERROTADA }
enum Ataque { NENHUM, FEITICO, POCAO }

## Brilho de aviso da Cuca: verde de magia (o da Mula é laranja). Só visual.
const COR_AVISO_CUCA: Color = Color(0.85, 1.6, 0.85)

var estado: Estado = Estado.ESPERANDO
var _tempo: float = 0.0
var _ultimo_ataque: Ataque = Ataque.NENHUM
var _sorteio := RandomNumberGenerator.new()

## Os dados com o tipo da Cuca (o campo "dados" da base é do tipo genérico ChefeData).
@onready var _d: CucaData = dados as CucaData
## De onde saem o feitiço e a poção (as mãos).
@onready var mao: Marker2D = $Mao
## Altura do chão (pés da Cuca): onde a poção cai.
@onready var pe: Marker2D = $Pe


func _ready() -> void:
	super._ready()
	_sorteio.randomize()
	# Começa esperando: dá um respiro ao jogador antes do primeiro ataque.
	_entrar(Estado.ESPERANDO, _d.pausa_entre_ataques)


func _physics_process(delta: float) -> void:
	delta *= fator_tempo()  # Bolha Abissal: o relógio do chefe anda mais devagar
	if estado == Estado.DERROTADA:
		return
	_tempo -= delta
	if _tempo > 0.0 and not is_zero_approx(_tempo):
		return

	# O tempo do estado atual acabou: decide o próximo.
	match estado:
		Estado.ESPERANDO:
			_escolher_ataque()
		Estado.AVISO_FEITICO:
			_lancar_feiticos()
			_entrar(Estado.ESPERANDO, _d.pausa_entre_ataques)
		Estado.AVISO_POCAO:
			_jogar_pocao()
			_entrar(Estado.PARADA, _d.parada_apos_pocao)
		Estado.PARADA:
			# A parada já é a pausa depois da poção: sorteia o próximo direto.
			_escolher_ataque()


## Sorteia o próximo ataque; nunca duas poções seguidas.
func _escolher_ataque() -> void:
	var ataque: Ataque = Ataque.FEITICO
	if _ultimo_ataque != Ataque.POCAO and _sorteio.randi_range(0, 1) == 1:
		ataque = Ataque.POCAO
	_ultimo_ataque = ataque
	match ataque:
		Ataque.FEITICO:
			_entrar(Estado.AVISO_FEITICO, _d.aviso_feitico)
		Ataque.POCAO:
			_entrar(Estado.AVISO_POCAO, _d.aviso_pocao)


func _entrar(novo_estado: Estado, duracao: float) -> void:
	estado = novo_estado
	_tempo = duracao
	avisar(estado == Estado.AVISO_FEITICO or estado == Estado.AVISO_POCAO, COR_AVISO_CUCA)
	_atualizar_animacao()


## Leque: o do meio vai na direção do Curupira; os outros abrem "abertura" graus para cada lado.
func _lancar_feiticos() -> void:
	var origem: Vector2 = mao.global_position
	var alvo_pos: Vector2 = alvo.global_position if alvo else origem + Vector2.LEFT * 600.0
	var direcao_meio: Vector2 = (alvo_pos - origem).normalized()
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


func _jogar_pocao() -> void:
	var tipo: PocaCuca.Tipo = PocaCuca.Tipo.VENENO if _sorteio.randi_range(0, 1) == 0 else PocaCuca.Tipo.LENTIDAO
	var pocao: PocaoCuca = _d.cena_pocao.instantiate()
	pocao.global_position = mao.global_position
	# Cai no chão embaixo do Curupira no momento do arremesso.
	pocao.lancar(Vector2(x_do_alvo(), pe.global_position.y), tipo, _d)
	lancar_na_cena(pocao)


func _ao_ser_derrotado() -> void:
	estado = Estado.DERROTADA
	_atualizar_animacao()


func _atualizar_animacao() -> void:
	match estado:
		Estado.ESPERANDO:
			tocar(&"idle")
		Estado.AVISO_FEITICO:
			tocar(&"aviso_feitico")
		Estado.AVISO_POCAO:
			tocar(&"aviso_pocao")
		Estado.PARADA:
			tocar(&"parada")
		Estado.DERROTADA:
			tocar(&"derrota")
