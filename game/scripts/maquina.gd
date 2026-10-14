extends Chefe
## Máquina de IA — chefe final. "Vida alta e dano alto, os maiores entre todos" (GDD).
## Fica parada no lado direito da sala; sorteia entre dois ataques (nunca bombas duas vezes):
##   - raio laser: uma linha fina sai do LED e acompanha o Curupira; no fim do aviso trava
##     e o laser dispara nessa direção (aviso 0,8 s, 1 golpe);
##   - bombas: três caem do teto (uma onde o Curupira está, duas ao lado); no chão piscam e
##     mostram a área por 1,5 s e explodem (2 golpes). Depois a Máquina fica parada 1,2 s.
## Estado único e leva dano o tempo todo (regras do GDD). Não concede ataque.
## Vida, dano recebido, contato e derrota vêm da classe base Chefe (chefe.gd).
##
## Ciclo da máquina de estados:
##   ESPERANDO --sorteio--> AVISO_LASER -> LASER --------------------------> ESPERANDO
##                     \--> BOMBAS (até as três explodirem) -> PARADA --(sem pausa extra)--> sorteio
##
## Animações usadas (criar no SpriteFrames do AnimatedSprite2D quando houver arte):
##   idle, aviso_laser, laser, bombas, parada, derrota
## Enquanto não há arte, o desenho provisório (retângulo com LED) fica em VisualProvisorio.

enum Estado { ESPERANDO, AVISO_LASER, LASER, BOMBAS, PARADA, DERROTADA }
enum Ataque { NENHUM, LASER, BOMBAS }

## Brilho de aviso da Máquina: vermelho. Só visual.
const COR_AVISO_MAQUINA: Color = Color(1.8, 0.6, 0.6)
## Altura de onde as bombas caem, acima do chão (px). Só visual (o topo da tela).
const ALTURA_QUEDA_BOMBA: float = 1100.0

var estado: Estado = Estado.ESPERANDO
var _tempo: float = 0.0
var _ultimo_ataque: Ataque = Ataque.NENHUM
var _sorteio := RandomNumberGenerator.new()
var _laser: LaserMaquina
var _bombas_pendentes: int = 0

## Os dados com o tipo da Máquina (o campo "dados" da base é do tipo genérico ChefeData).
@onready var _d: MaquinaData = dados as MaquinaData
## De onde sai o laser (o LED).
@onready var led: Marker2D = $Led
## Altura do chão (base da Máquina): onde as bombas caem.
@onready var pe: Marker2D = $Pe
## Desenho provisório (retângulo com LED). Fica dentro do sprite para herdar o brilho de aviso.
@onready var visual_provisorio: Polygon2D = $AnimatedSprite2D/VisualProvisorio
@onready var luz_led: Polygon2D = $AnimatedSprite2D/VisualProvisorio/Led


func _ready() -> void:
	super._ready()
	_sorteio.randomize()
	_entrar(Estado.ESPERANDO, _d.pausa_entre_ataques)


func _physics_process(delta: float) -> void:
	delta *= fator_tempo()  # Bolha Abissal: o relógio do chefe anda mais devagar
	if estado == Estado.DERROTADA:
		return
	if estado == Estado.BOMBAS:
		return  # espera as bombas explodirem (sinal explodiu)
	_tempo -= delta
	if estado == Estado.AVISO_LASER and _laser:
		# A linha acompanha o Curupira e trava no fim do aviso.
		if _tempo > _d.travamento_laser:
			_laser.mirar(alvo.global_position if alvo else led.global_position + Vector2.LEFT)
		else:
			_laser.travar()
	if _tempo > 0.0 and not is_zero_approx(_tempo):
		return

	match estado:
		Estado.ESPERANDO:
			_escolher_ataque()
		Estado.AVISO_LASER:
			_laser.disparar()
			_entrar(Estado.LASER, _d.duracao_laser)
		Estado.LASER:
			_laser.queue_free()
			_laser = null
			_entrar(Estado.ESPERANDO, _d.pausa_entre_ataques)
		Estado.PARADA:
			# A parada já é a pausa depois das bombas: sorteia o próximo direto.
			_escolher_ataque()


## Sorteia o próximo ataque; nunca bombas duas vezes seguidas.
func _escolher_ataque() -> void:
	var ataque: Ataque = Ataque.LASER
	if _ultimo_ataque != Ataque.BOMBAS and _sorteio.randi_range(0, 1) == 1:
		ataque = Ataque.BOMBAS
	_ultimo_ataque = ataque
	match ataque:
		Ataque.LASER:
			_laser = _d.cena_laser.instantiate()
			_laser.dano = _d.golpes_laser
			_laser.global_position = led.global_position
			lancar_na_cena(_laser)
			_laser.mirar(alvo.global_position if alvo else led.global_position + Vector2.LEFT)
			_entrar(Estado.AVISO_LASER, _d.aviso_laser)
		Ataque.BOMBAS:
			_soltar_bombas()
			_entrar(Estado.BOMBAS, 0.0)


func _entrar(novo_estado: Estado, duracao: float) -> void:
	estado = novo_estado
	_tempo = duracao
	avisar(estado == Estado.AVISO_LASER or estado == Estado.BOMBAS, COR_AVISO_MAQUINA)
	# LED aceso forte enquanto ataca; apagado ("superaquecido") na parada. Só visual.
	match estado:
		Estado.AVISO_LASER, Estado.LASER, Estado.BOMBAS:
			luz_led.modulate = Color(1.6, 1.6, 1.6)
		Estado.PARADA:
			luz_led.modulate = Color(0.35, 0.35, 0.35)
		_:
			luz_led.modulate = Color.WHITE
	_atualizar_animacao()


## Uma bomba onde o Curupira está e as outras ao lado, alternando (para 3: 0, -d, +d).
func _soltar_bombas() -> void:
	var centro: float = x_do_alvo()
	_bombas_pendentes = _d.quantidade_bombas
	for i in _d.quantidade_bombas:
		var passo: int = (i + 1) / 2
		var lado: float = -1.0 if i % 2 == 1 else 1.0
		var x: float = clampf(centro + lado * passo * _d.distancia_bombas, -900.0, 900.0)
		var bomba: BombaMaquina = _d.cena_bomba.instantiate()
		bomba.configurar(_d)
		bomba.global_position = Vector2(x, pe.global_position.y)
		bomba.get_node("Corpo").position.y = -ALTURA_QUEDA_BOMBA
		bomba.explodiu.connect(_ao_explodir_bomba)
		lancar_na_cena(bomba)


func _ao_explodir_bomba() -> void:
	_bombas_pendentes -= 1
	if _bombas_pendentes <= 0 and estado == Estado.BOMBAS:
		_entrar(Estado.PARADA, _d.parada_apos_bombas)


## Sem arte ainda: o retângulo provisório é o que pisca e muda de cor.
func _visual_colorido() -> CanvasItem:
	return visual_provisorio


func _ao_ser_derrotado() -> void:
	estado = Estado.DERROTADA
	if _laser:
		_laser = null  # já é apagado junto com os outros ataques (grupo ataques_chefe)
	luz_led.modulate = Color(0.2, 0.2, 0.2)
	_atualizar_animacao()


func _atualizar_animacao() -> void:
	match estado:
		Estado.ESPERANDO:
			tocar(&"idle")
		Estado.AVISO_LASER:
			tocar(&"aviso_laser")
		Estado.LASER:
			tocar(&"laser")
		Estado.BOMBAS:
			tocar(&"bombas")
		Estado.PARADA:
			tocar(&"parada")
		Estado.DERROTADA:
			tocar(&"derrota")
