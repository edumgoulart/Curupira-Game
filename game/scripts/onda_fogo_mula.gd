class_name OndaFogoMula
extends Hitbox
## Onda de fogo do pisoteio da Mula: corre pelo chão em linha reta até a parede.
## A origem fica no chão. Layer enemy_hitbox; mask player (não enxerga o chão, onde ela corre);
## some quando sai da tela.
## Cresce conforme se afasta da Mula (altura e largura, desenho e caixa de dano juntos): perto
## dela pula-se fácil; longe fica alta demais para pular (pedido do Eduardo: quem vê a onda tem
## que correr para perto da Mula). O crescimento vem do mula.tres.

var velocidade: Vector2 = Vector2.ZERO
## Quanto a escala cresce por pixel andado, e o teto da escala (1 = o tamanho do desenho).
var crescimento: float = 0.0
var escala_max: float = 1.0
var _andou: float = 0.0
var _escala: float = 1.0
var _escala_fogo: Vector2
var _tamanho_base: Vector2
var _pos_forma_base: Vector2

@onready var fogo: Sprite2D = $Fogo
@onready var forma: CollisionShape2D = $CollisionShape2D


## direcao: -1 = esquerda, 1 = direita.
func lancar(direcao: float, nova_velocidade: float, novo_crescimento: float = 0.0, nova_escala_max: float = 1.0) -> void:
	velocidade = Vector2(direcao * nova_velocidade, 0.0)
	crescimento = novo_crescimento
	escala_max = maxf(nova_escala_max, 1.0)


func _ready() -> void:
	super._ready()
	add_to_group("ataques_chefe")
	# As labaredas deitam para trás: o desenho corre para a esquerda.
	if velocidade.x > 0.0:
		fogo.scale.x = -absf(fogo.scale.x)
	_escala_fogo = fogo.scale
	# Cada onda cresce sozinha: a forma da cena é compartilhada, então ganha uma cópia.
	forma.shape = forma.shape.duplicate()
	_tamanho_base = (forma.shape as RectangleShape2D).size
	_pos_forma_base = forma.position
	# Só some em chão e parede (o corpo do Curupira também está na mask; ver Hitbox.e_mundo).
	body_entered.connect(func(corpo: Node2D) -> void:
		if Hitbox.e_mundo(corpo):
			queue_free())
	var aviso_tela := get_node_or_null("VisibleOnScreenNotifier2D") as VisibleOnScreenNotifier2D
	if aviso_tela:
		aviso_tela.screen_exited.connect(queue_free)


func _physics_process(delta: float) -> void:
	position += velocidade * delta
	_andou += absf(velocidade.x) * delta
	_crescer()


## A escala anda em passos de um pixel do desenho (1/4), para a pixel art não borrar.
## O pé da onda fica no chão: a caixa cresce para cima.
func _crescer() -> void:
	var nova: float = minf(snappedf(1.0 + crescimento * _andou, 0.25), escala_max)
	if is_equal_approx(nova, _escala):
		return
	_escala = nova
	fogo.scale = _escala_fogo * _escala
	(forma.shape as RectangleShape2D).size = _tamanho_base * _escala
	forma.position = _pos_forma_base * _escala
