class_name Chefe
extends Node2D
## Base de todos os chefes: o que é igual em todos fica aqui, e cada chefe (Mula, Cuca...)
## herda e só implementa a própria máquina de estados e os ataques.
##
## Regras do GDD que valem para todos: leva dano o tempo todo, a vida não aparece na tela,
## todo ataque tem aviso visual antes do golpe.
##
## Nós que a cena do chefe precisa ter: AnimatedSprite2D, Vida, Hurtbox (layer enemy),
## Contato (Hitbox, layer enemy_hitbox).

## Emitido quando a vida chega a zero. A arena escuta para a vitória/salvar progresso.
signal chefe_derrotado

## Cor do brilho durante os avisos (telegrafo visual). Só visual.
const COR_AVISO: Color = Color(1.6, 0.9, 0.5)
## Cor do chefe enquanto está envenenado / lento. Só visual.
const COR_VENENO: Color = Color(0.6, 1.25, 0.55)
const COR_LENTO: Color = Color(0.65, 0.8, 1.45)
## Envenenamento: um pulso de dano por segundo (GDD: "20 de dano por segundo").
const INTERVALO_VENENO: float = 1.0

## Números do chefe (vida, tempos, golpes). Cada chefe usa a própria classe (MulaData, CucaData).
@export var dados: ChefeData
## Quem o chefe ataca. Apontar no inspetor da arena (o Curupira).
@export var alvo: Node2D

var derrotado: bool = false
var _veneno_por_pulso: int = 0
var _pulsos_veneno: int = 0
var _timer_veneno: Timer
var _tween_pisca: Tween
# Lentidão (Bolha Abissal): quanto o relógio do chefe desacelera (0,4 = 40%) enquanto o timer roda.
var _lentidao: float = 0.0
var _timer_lentidao: Timer

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var vida: Vida = $Vida
@onready var hurtbox: Hurtbox = $Hurtbox
@onready var contato: Hitbox = $Contato


func _ready() -> void:
	add_to_group("chefes")  # o Feitiço Perseguidor procura alvos neste grupo
	hurtbox.golpe_recebido.connect(take_damage)
	hurtbox.efeito_recebido.connect(_ao_receber_efeito)
	_timer_veneno = Timer.new()
	_timer_veneno.wait_time = INTERVALO_VENENO
	# Conta no ritmo da física (60/s fixo), igual ao resto do combate.
	_timer_veneno.process_callback = Timer.TIMER_PROCESS_PHYSICS
	_timer_veneno.timeout.connect(_pulso_veneno)
	add_child(_timer_veneno)
	_timer_lentidao = Timer.new()
	_timer_lentidao.one_shot = true
	_timer_lentidao.process_callback = Timer.TIMER_PROCESS_PHYSICS
	_timer_lentidao.timeout.connect(_fim_lentidao)
	add_child(_timer_lentidao)
	vida.zerou.connect(_ao_zerar_vida)
	vida.configurar(dados.vida)
	contato.dano = dados.golpes_contato


## Chamado pela Hurtbox quando um ataque do Curupira acerta.
func take_damage(amount: int, _from: Node) -> void:
	if derrotado:
		return
	vida.perder(amount)
	# Pisca branco a cada acerto (retorno visual; a vida não aparece na tela).
	_piscar()


## Pisca branco e volta para a cor base (branca, ou verde se envenenado).
func _piscar() -> void:
	if _tween_pisca:
		_tween_pisca.kill()
	var visual: CanvasItem = _visual_colorido()
	visual.self_modulate = Color(2.0, 2.0, 2.0)
	_tween_pisca = create_tween()
	_tween_pisca.tween_property(visual, "self_modulate", _cor_base(), 0.06)


## Muda a cor base (ex.: ficou envenenado) sem um pisca em andamento desfazer a mudança.
func _atualizar_cor() -> void:
	if _tween_pisca:
		_tween_pisca.kill()
	_visual_colorido().self_modulate = _cor_base()


## O que pisca ao levar dano e fica verde/azul com veneno/lentidão: o sprite.
## Um chefe ainda sem arte (Máquina) devolve o desenho provisório no lugar.
func _visual_colorido() -> CanvasItem:
	return sprite


## Onde os projéteis que perseguem miram: o centro da hurtbox.
func ponto_de_mira() -> Vector2:
	return hurtbox.get_child(0).global_position


func esta_envenenado() -> bool:
	return _pulsos_veneno > 0


func esta_lento() -> bool:
	return not _timer_lentidao.is_stopped()


## Multiplicador do relógio do chefe: 1 = normal; 0,6 = 40% mais lento (Bolha Abissal).
## Cada chefe multiplica o delta por isto: pausas, avisos, pulos e cadência ficam mais lentos.
## Projéteis que o chefe já soltou não são afetados.
func fator_tempo() -> float:
	return 1.0 - _lentidao if esta_lento() else 1.0


func _cor_base() -> Color:
	var cor: Color = Color.WHITE
	if esta_envenenado():
		cor *= COR_VENENO
	if esta_lento():
		cor *= COR_LENTO
	return cor


## Efeitos vindos dos ataques do Curupira pela Hurtbox.
func _ao_receber_efeito(efeito: StringName, intensidade: float, duracao: float) -> void:
	if derrotado:
		return
	match efeito:
		&"veneno":
			# GDD: reaplicar só renova o tempo (não acumula dano por segundo).
			_veneno_por_pulso = int(intensidade * INTERVALO_VENENO)
			_pulsos_veneno = int(round(duracao / INTERVALO_VENENO))
			if _timer_veneno.is_stopped():
				_timer_veneno.start()
			_atualizar_cor()
		&"lentidao":
			# GDD: 40% mais lento por 6 s. Reaplicar renova o tempo.
			_lentidao = clampf(intensidade, 0.0, 0.9)
			_timer_lentidao.start(duracao)
			_atualizar_cor()


func _fim_lentidao() -> void:
	_lentidao = 0.0
	_atualizar_cor()


func _pulso_veneno() -> void:
	if derrotado or _pulsos_veneno <= 0:
		_timer_veneno.stop()
		return
	_pulsos_veneno -= 1
	vida.perder(_veneno_por_pulso)
	if _pulsos_veneno <= 0:
		_timer_veneno.stop()
		_atualizar_cor()


## Liga/desliga o brilho de aviso antes de um ataque (cada chefe pode usar a sua cor).
func avisar(ligado: bool, cor: Color = COR_AVISO) -> void:
	sprite.modulate = cor if ligado else Color.WHITE


## Posição X do alvo (o Curupira); sem alvo, um ponto à esquerda do chefe.
func x_do_alvo() -> float:
	return alvo.global_position.x if alvo else global_position.x - 600.0


## Põe um ataque (projétil, poça...) na cena atual, e não no chefe: assim ele não anda junto.
func lancar_na_cena(no: Node) -> void:
	get_tree().current_scene.add_child(no)


## Toca a animação se ela existir no SpriteFrames (se não existir, não dá erro).
func tocar(nome: StringName) -> void:
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(nome):
		return
	if sprite.animation != nome or not sprite.is_playing():
		sprite.play(nome)


## Cada chefe sobrescreve para parar a própria máquina de estados.
func _ao_ser_derrotado() -> void:
	pass


func _ao_zerar_vida() -> void:
	derrotado = true
	_pulsos_veneno = 0
	_timer_veneno.stop()
	_timer_lentidao.stop()
	_atualizar_cor()
	avisar(false)
	hurtbox.ligada = false
	contato.set_deferred("monitoring", false)
	# Some com projéteis, poças etc. que ainda estão na tela.
	get_tree().call_group("ataques_chefe", "queue_free")
	_ao_ser_derrotado()
	chefe_derrotado.emit()
	print("%s derrotado(a)!" % dados.nome)
	# Provisório até a tela de vitória: some aos poucos.
	create_tween().tween_property(self, "modulate:a", 0.0, 1.0)
