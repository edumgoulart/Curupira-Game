class_name Atirador
extends Marker2D
## Dispara o ataque básico e o especial equipados. Filho do Curupira; a posição deste Marker2D
## é o ponto de onde o projétil sai (ajustar no editor, com o Curupira olhando para a direita).
##
## Cuida só da cadência e de criar o projétil. Quem decide QUANDO tentar atirar é o Curupira.

## Avisa que um tiro BÁSICO acertou, com quanto ele carrega o especial (GDD: carga por acerto).
signal acerto_basico(carga: int)
## Avisa que um ataque saiu de fato (básico ou especial). O Curupira usa para tocar a animação de ataque.
signal disparou

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
## multiplicador < 1 deixa a cadência mais lenta (lentidão da poça da Cuca).
func tentar_atirar(direcao: int, multiplicador: float = 1.0) -> void:
	if ataque == null:
		return
	# is_zero_approx: mesmo motivo do dash — 0,2 - 12 × (1/60) não dá 0 exato em float.
	if _tempo_recarga > 0.0 and not is_zero_approx(_tempo_recarga):
		return
	_tempo_recarga = 1.0 / (ataque.tiros_por_segundo * multiplicador)

	var projetil: Projetil = _criar(ataque.cena_projetil, ataque.dano, ataque.velocidade_projetil, direcao)
	projetil.curva = ataque.curva
	projetil.duracao_maxima = ataque.duracao_maxima
	_lancar(projetil)
	# Só o básico carrega o especial: cada acerto soma a carga do ataque equipado.
	var carga: int = ataque.carga_por_acerto
	projetil.acertou.connect(func(_alvo: Area2D) -> void: acerto_basico.emit(carga))
	disparou.emit()


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
		var projetil: Projetil = _criar(especial.cena_projetil, especial.dano, especial.velocidade_projetil, direcao)
		projetil.veneno_por_segundo = especial.veneno_por_segundo
		projetil.duracao_veneno = especial.duracao_veneno
		projetil.lentidao = especial.lentidao
		projetil.duracao_lentidao = especial.duracao_lentidao
		_lancar(projetil)
	disparou.emit()


## Cria o projétil SEM pôr na cena: quem chama ainda preenche curva/veneno antes,
## porque o _ready do projétil já usa esses valores.
func _criar(cena: PackedScene, dano: int, velocidade: float, direcao: int) -> Projetil:
	position.x = _x_base * direcao
	var projetil: Projetil = cena.instantiate()
	projetil.configurar(dano, velocidade, float(direcao))
	projetil.global_position = global_position
	return projetil


func _lancar(projetil: Projetil) -> void:
	# Projétil vai para a cena atual, não para o Curupira: assim não anda junto com ele.
	get_tree().current_scene.add_child(projetil)
