extends Node2D
## Mula sem Cabeça — primeiro chefe. Fica parada; alterna entre dois ataques:
##   - três bolas de fogo retas, rente ao chão (aviso 0,5 s, 1 golpe cada);
##   - meteoro com sombra no chão (aviso 1 s, 2 golpes), depois fica parada 1,5 s.
## Estado único (sem fases dentro da luta) e leva dano o tempo todo (regras do GDD).
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

## Emitido quando a vida chega a zero. A arena escuta para a vitória/salvar progresso.
signal chefe_derrotado

## Cor do brilho durante os avisos (telegrafo visual). Só visual.
const COR_AVISO: Color = Color(1.6, 0.9, 0.5)

## Números da Mula (vida, tempos, golpes). Editar o .tres no inspetor.
@export var dados: MulaData
## Quem a Mula ataca. Apontar no inspetor da arena (o Curupira).
@export var alvo: Node2D

var estado: Estado = Estado.ESPERANDO
var _tempo: float = 0.0
var _bolas_restantes: int = 0
var _ultimo_ataque: Ataque = Ataque.NENHUM
var _sorteio := RandomNumberGenerator.new()

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var vida: Vida = $Vida
@onready var hurtbox: Hurtbox = $Hurtbox
@onready var contato: Hitbox = $Contato
## De onde saem as bolas de fogo, na horizontal (a altura vem de dados.altura_bola).
@onready var boca: Marker2D = $Boca
## Altura do chão (pés da Mula): base da altura das bolas e onde o meteoro cai.
@onready var pe: Marker2D = $Pe


func _ready() -> void:
	if dados == null:
		push_warning("Mula sem MulaData no campo 'dados'; usando valores padrão (sem cenas de ataque).")
		dados = MulaData.new()
	_sorteio.randomize()
	hurtbox.golpe_recebido.connect(take_damage)
	vida.zerou.connect(_ao_zerar_vida)
	vida.configurar(dados.vida)
	contato.dano = dados.golpes_contato
	# Começa esperando: dá um respiro ao jogador antes do primeiro ataque.
	_entrar(Estado.ESPERANDO, dados.pausa_entre_ataques)


func _physics_process(delta: float) -> void:
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
			_bolas_restantes = dados.quantidade_bolas
			_entrar(Estado.BOLAS, 0.0)
			_lancar_proxima_bola()
		Estado.BOLAS:
			_lancar_proxima_bola()
		Estado.METEORO:
			_entrar(Estado.PARADA, dados.parada_apos_meteoro)
		Estado.PARADA:
			# A parada já é a pausa depois do meteoro: sorteia o próximo direto.
			_escolher_ataque()


## Chamado pela Hurtbox quando um ataque do Curupira acerta.
func take_damage(amount: int, _from: Node) -> void:
	if estado == Estado.DERROTADA:
		return
	vida.perder(amount)
	# Pisca branco a cada acerto (retorno visual; a vida não aparece na tela).
	sprite.self_modulate = Color(2.0, 2.0, 2.0)
	create_tween().tween_property(sprite, "self_modulate", Color.WHITE, 0.06)


## Sorteia o próximo ataque; nunca dois meteoros seguidos.
func _escolher_ataque() -> void:
	var ataque: Ataque = Ataque.BOLAS
	if _ultimo_ataque != Ataque.METEORO and _sorteio.randi_range(0, 1) == 1:
		ataque = Ataque.METEORO
	_ultimo_ataque = ataque

	match ataque:
		Ataque.BOLAS:
			_entrar(Estado.AVISO_BOLAS, dados.aviso_bolas)
		Ataque.METEORO:
			# A sombra aparece já (é o aviso); o impacto acontece quando o estado acabar.
			_soltar_meteoro()
			_entrar(Estado.METEORO, dados.aviso_meteoro)


func _entrar(novo_estado: Estado, duracao: float) -> void:
	estado = novo_estado
	_tempo = duracao
	var avisando: bool = estado == Estado.AVISO_BOLAS or estado == Estado.METEORO
	sprite.modulate = COR_AVISO if avisando else Color.WHITE
	_atualizar_animacao()


func _lancar_proxima_bola() -> void:
	var bola: BolaDeFogoMula = dados.cena_bola.instantiate()
	bola.dano = dados.golpes_bola
	# Sai na frente da Mula, rente ao chão, e vai reta para o lado do Curupira.
	bola.global_position = Vector2(boca.global_position.x, pe.global_position.y - dados.altura_bola)
	var direcao: float = -1.0
	if alvo and alvo.global_position.x > boca.global_position.x:
		direcao = 1.0
	bola.lancar(direcao, dados.velocidade_horizontal_bola)
	get_tree().current_scene.add_child(bola)

	_bolas_restantes -= 1
	if _bolas_restantes > 0:
		_tempo = dados.intervalo_bolas
	else:
		_entrar(Estado.ESPERANDO, dados.pausa_entre_ataques)


func _soltar_meteoro() -> void:
	var meteoro: Meteoro = dados.cena_meteoro.instantiate()
	meteoro.configurar(dados)
	# Cai onde o Curupira está quando a sombra aparece.
	var x: float = alvo.global_position.x if alvo else global_position.x - 600.0
	meteoro.global_position = Vector2(x, pe.global_position.y)
	get_tree().current_scene.add_child(meteoro)


func _ao_zerar_vida() -> void:
	estado = Estado.DERROTADA
	sprite.modulate = Color.WHITE
	hurtbox.ligada = false
	contato.set_deferred("monitoring", false)
	# Some com bolas e meteoros que ainda estão na tela.
	get_tree().call_group("ataques_chefe", "queue_free")
	_atualizar_animacao()
	chefe_derrotado.emit()
	print("Mula sem Cabeça derrotada!")
	# Provisório até a tela de vitória: some aos poucos.
	create_tween().tween_property(self, "modulate:a", 0.0, 1.0)


func _atualizar_animacao() -> void:
	match estado:
		Estado.ESPERANDO:
			_tocar(&"idle")
		Estado.AVISO_BOLAS:
			_tocar(&"aviso_bolas")
		Estado.BOLAS:
			_tocar(&"bolas")
		Estado.METEORO:
			_tocar(&"meteoro")
		Estado.PARADA:
			_tocar(&"parada")
		Estado.DERROTADA:
			_tocar(&"derrota")


func _tocar(nome: StringName) -> void:
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(nome):
		return
	if sprite.animation != nome or not sprite.is_playing():
		sprite.play(nome)
