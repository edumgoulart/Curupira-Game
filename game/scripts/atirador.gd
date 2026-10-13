class_name Atirador
extends Marker2D
## Dispara o ataque básico e o especial equipados. Filho do Curupira; a posição deste Marker2D
## é o ponto de onde o projétil sai (ajustar no editor, com o Curupira olhando para a direita).
##
## Cuida só da cadência e de criar o projétil. Quem decide QUANDO tentar atirar é o Curupira.

## Avisa que um tiro BÁSICO acertou, com quanto ele carrega o especial (GDD: carga por acerto).
signal acerto_basico(carga: int)

## Ataque básico equipado. Depois a tela de seleção troca este recurso antes da fase.
@export var ataque: AtaqueData
## Especial equipado. Depois a tela de seleção troca este recurso antes da fase.
@export var especial: EspecialData

var _tempo_recarga: float = 0.0
# Distância horizontal do ponto de tiro ao centro do Curupira, olhando para a direita.
var _x_base: float = 0.0


func _ready() -> void:
	_x_base = absf(position.x)
	# Usa os ataques escolhidos na tela de seleção; se não houver escolha, fica com os do inspetor.
	if GameState.basico_equipado != "":
		ataque = load(GameState.basico_equipado)
	if GameState.especial_equipado != "":
		especial = load(GameState.especial_equipado)


func _physics_process(delta: float) -> void:
	_tempo_recarga -= delta


## Chamado a cada frame enquanto o botão de ataque está segurado.
## Só dispara se a recarga (1 / tiros_por_segundo) já passou.
func tentar_atirar(direcao: int) -> void:
	if ataque == null:
		return
	# is_zero_approx: mesmo motivo do dash — 0,2 - 12 × (1/60) não dá 0 exato em float.
	if _tempo_recarga > 0.0 and not is_zero_approx(_tempo_recarga):
		return
	_tempo_recarga = 1.0 / ataque.tiros_por_segundo

	var projetil: Projetil = _criar(ataque.cena_projetil, ataque.dano, ataque.velocidade_projetil, direcao)
	# Só o básico carrega o especial: cada acerto soma a carga do ataque equipado.
	var carga: int = ataque.carga_por_acerto
	projetil.acertou.connect(func(_alvo: Area2D) -> void: acerto_basico.emit(carga))


## Dispara o especial. Quem confere se a barra está cheia é o Curupira.
## Dois tipos: projétil (sai voando, ex.: Instinto Selvagem) ou feixe preso ao Curupira
## (ex.: Canhão Flamejante, que fica como filho deste Atirador e anda/cai junto com ele).
func atirar_especial(direcao: int) -> void:
	if especial == null:
		return
	var no: Node = especial.cena_projetil.instantiate()
	if no is FeixeCanhao:
		position.x = _x_base * direcao
		no.configurar(especial, float(direcao))
		add_child(no)
	else:
		no.free()
		_criar(especial.cena_projetil, especial.dano, especial.velocidade_projetil, direcao)


func _criar(cena: PackedScene, dano: int, velocidade: float, direcao: int) -> Projetil:
	position.x = _x_base * direcao
	var projetil: Projetil = cena.instantiate()
	projetil.configurar(dano, velocidade, float(direcao))
	projetil.global_position = global_position
	# Projétil vai para a cena atual, não para o Curupira: assim não anda junto com ele.
	get_tree().current_scene.add_child(projetil)
	return projetil
