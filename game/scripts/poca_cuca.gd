class_name PocaCuca
extends Area2D
## Poça deixada pela poção da Cuca (GDD: dura 5 s; no máximo duas na arena).
##   VENENO:   tira 1 golpe se o Curupira ficar 1 s SEGUIDO dentro. Sair (ou o dash,
##             que desliga a hurtbox) zera a contagem.
##   LENTIDAO: deixa o Curupira 40% mais lento enquanto estiver dentro.
## Layer enemy_hitbox; mask player. O veneno olha a hurtbox (respeita invencibilidade);
## a lentidão olha o corpo do Curupira (que tem aplicar_lentidao / remover_lentidao).

enum Tipo { VENENO, LENTIDAO }

## Tempo do sumiço no fim da poça (s). Só visual.
const SUMICO: float = 0.4

var tipo: Tipo = Tipo.VENENO
var _duracao: float = 5.0
var _tempo_veneno: float = 1.0
var _golpes_veneno: int = 1
var _fator_lentidao: float = 0.6
var _max_pocas: int = 2
var _tempo: float = 0.0
var _nascimento: int = 0
# Hurtbox -> tempo seguido dentro (veneno).
var _dentro: Dictionary = {}
# Corpos que estão lentos por causa desta poça.
var _lentos: Array[Node] = []


func configurar(novo_tipo: Tipo, dados: CucaData) -> void:
	tipo = novo_tipo
	_duracao = dados.duracao_poca
	_tempo_veneno = dados.tempo_veneno
	_golpes_veneno = dados.golpes_veneno
	_fator_lentidao = 1.0 - dados.lentidao
	_max_pocas = dados.max_pocas


func _ready() -> void:
	_nascimento = Time.get_ticks_msec()
	add_to_group("ataques_chefe")
	add_to_group("pocas_cuca")
	$Veneno.visible = tipo == Tipo.VENENO
	$Lentidao.visible = tipo == Tipo.LENTIDAO
	area_entered.connect(_ao_entrar_area)
	area_exited.connect(func(area: Area2D) -> void: _dentro.erase(area))
	body_entered.connect(_ao_entrar_corpo)
	body_exited.connect(_ao_sair_corpo)
	_limitar_pocas()


## GDD: no máximo duas poças. Se esta passou do limite, some a mais antiga.
func _limitar_pocas() -> void:
	var pocas: Array = get_tree().get_nodes_in_group("pocas_cuca").filter(
		func(p: Node) -> bool: return not p.is_queued_for_deletion())
	while pocas.size() > _max_pocas:
		var mais_antiga: PocaCuca = pocas[0]
		for p in pocas:
			if p._nascimento < mais_antiga._nascimento:
				mais_antiga = p
		pocas.erase(mais_antiga)
		mais_antiga.queue_free()


func _physics_process(delta: float) -> void:
	_tempo += delta
	if _tempo >= _duracao - SUMICO:
		modulate.a = clampf((_duracao - _tempo) / SUMICO, 0.0, 1.0)
	if _tempo >= _duracao:
		queue_free()
		return
	if tipo != Tipo.VENENO:
		return
	for area in _dentro.keys():
		_dentro[area] += delta
		if _dentro[area] > _tempo_veneno or is_equal_approx(_dentro[area], _tempo_veneno):
			_dentro[area] = 0.0
			area.take_damage(_golpes_veneno, self)


func _ao_entrar_area(area: Area2D) -> void:
	if tipo == Tipo.VENENO and area.has_method("take_damage"):
		_dentro[area] = 0.0


func _ao_entrar_corpo(corpo: Node2D) -> void:
	if tipo == Tipo.LENTIDAO and corpo.has_method("aplicar_lentidao"):
		corpo.aplicar_lentidao(self, _fator_lentidao)
		_lentos.append(corpo)


func _ao_sair_corpo(corpo: Node2D) -> void:
	if corpo in _lentos:
		corpo.remover_lentidao(self)
		_lentos.erase(corpo)


func _exit_tree() -> void:
	# A poça sumiu com o Curupira dentro: tira a lentidão dele.
	for corpo in _lentos:
		if is_instance_valid(corpo):
			corpo.remover_lentidao(self)
	_lentos.clear()
