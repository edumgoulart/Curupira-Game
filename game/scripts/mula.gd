extends Chefe
## Mula sem Cabeça — primeiro chefe. Fica parada; alterna entre dois ataques:
##   - três bolas de fogo retas, rente ao chão (aviso 0,5 s, 1 golpe cada);
##   - meteoro com sombra no chão (aviso 1 s, 2 golpes), depois fica parada 1,5 s.
## Estado único (sem fases dentro da luta) e leva dano o tempo todo (regras do GDD).
## Vida, dano recebido, contato e derrota vêm da classe base Chefe (chefe.gd).
##
## Ciclo da máquina de estados:
##   ESPERANDO --sorteio--> AVISO_BOLAS -> BOLAS --------------> ESPERANDO
##                     \--> METEORO -> PARADA --(sem pausa extra)--> sorteio
##
## Animações usadas (criar no SpriteFrames do AnimatedSprite2D com estes nomes exatos):
##   idle          — esperando entre ataques
##   aviso_bolas   — preparando as bolas de fogo (0,5 s)
##   bolas         — cuspindo as bolas
##   meteoro       — lançando o meteoro para cima (dura o aviso, 1 s)
##   parada        — cansada depois do meteoro (1,5 s)
##   derrota       — derrotada (sem loop)
## Se uma animação ainda não existir, o código só não troca para ela (não dá erro).

enum Estado { ESPERANDO, AVISO_BOLAS, BOLAS, METEORO, PARADA, DERROTADA }
enum Ataque { NENHUM, BOLAS, METEORO }

var estado: Estado = Estado.ESPERANDO
var _tempo: float = 0.0
var _bolas_restantes: int = 0
var _ultimo_ataque: Ataque = Ataque.NENHUM
var _sorteio := RandomNumberGenerator.new()

## Os dados com o tipo da Mula (o campo "dados" da base é do tipo genérico ChefeData).
@onready var _d: MulaData = dados as MulaData
## De onde saem as bolas de fogo, na horizontal (a altura vem de altura_bola).
@onready var boca: Marker2D = $Boca
## Altura do chão (pés da Mula): base da altura das bolas e onde o meteoro cai.
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
		Estado.AVISO_BOLAS:
			_bolas_restantes = _d.quantidade_bolas
			_entrar(Estado.BOLAS, 0.0)
			_lancar_proxima_bola()
		Estado.BOLAS:
			_lancar_proxima_bola()
		Estado.METEORO:
			_entrar(Estado.PARADA, _d.parada_apos_meteoro)
		Estado.PARADA:
			# A parada já é a pausa depois do meteoro: sorteia o próximo direto.
			_escolher_ataque()


## Sorteia o próximo ataque; nunca dois meteoros seguidos.
func _escolher_ataque() -> void:
	var ataque: Ataque = Ataque.BOLAS
	if _ultimo_ataque != Ataque.METEORO and _sorteio.randi_range(0, 1) == 1:
		ataque = Ataque.METEORO
	_ultimo_ataque = ataque

	match ataque:
		Ataque.BOLAS:
			_entrar(Estado.AVISO_BOLAS, _d.aviso_bolas)
		Ataque.METEORO:
			# A sombra aparece já (é o aviso); o impacto acontece quando o estado acabar.
			_soltar_meteoro()
			_entrar(Estado.METEORO, _d.aviso_meteoro)


func _entrar(novo_estado: Estado, duracao: float) -> void:
	estado = novo_estado
	_tempo = duracao
	avisar(estado == Estado.AVISO_BOLAS or estado == Estado.METEORO)
	_atualizar_animacao()


func _lancar_proxima_bola() -> void:
	var bola: BolaDeFogoMula = _d.cena_bola.instantiate()
	bola.dano = _d.golpes_bola
	# Sai na frente da Mula, rente ao chão, e vai reta para o lado do Curupira.
	bola.global_position = Vector2(boca.global_position.x, pe.global_position.y - _d.altura_bola)
	var direcao: float = 1.0 if x_do_alvo() > boca.global_position.x else -1.0
	bola.lancar(direcao, _d.velocidade_horizontal_bola)
	lancar_na_cena(bola)

	_bolas_restantes -= 1
	if _bolas_restantes > 0:
		_tempo = _d.intervalo_bolas
	else:
		_entrar(Estado.ESPERANDO, _d.pausa_entre_ataques)


func _soltar_meteoro() -> void:
	var meteoro: Meteoro = _d.cena_meteoro.instantiate()
	meteoro.configurar(_d)
	# Cai onde o Curupira está quando a sombra aparece.
	meteoro.global_position = Vector2(x_do_alvo(), pe.global_position.y)
	lancar_na_cena(meteoro)


func _ao_ser_derrotado() -> void:
	estado = Estado.DERROTADA
	_atualizar_animacao()


func _atualizar_animacao() -> void:
	match estado:
		Estado.ESPERANDO:
			tocar(&"idle")
		Estado.AVISO_BOLAS:
			tocar(&"aviso_bolas")
		Estado.BOLAS:
			tocar(&"bolas")
		Estado.METEORO:
			tocar(&"meteoro")
		Estado.PARADA:
			tocar(&"parada")
		Estado.DERROTADA:
			tocar(&"derrota")
