class_name Atirador
extends Marker2D
## Dispara o ataque básico equipado. Filho do Curupira; a posição deste Marker2D
## é o ponto de onde o projétil sai (ajustar no editor, com o Curupira olhando para a direita).
##
## Cuida só da cadência e de criar o projétil. Quem decide QUANDO tentar atirar é o Curupira.

## Ataque básico equipado. Depois a tela de seleção troca este recurso antes da fase.
@export var ataque: AtaqueData

var _tempo_recarga: float = 0.0
# Distância horizontal do ponto de tiro ao centro do Curupira, olhando para a direita.
var _x_base: float = 0.0


func _ready() -> void:
	_x_base = absf(position.x)


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

	position.x = _x_base * direcao
	var projetil: Projetil = ataque.cena_projetil.instantiate()
	projetil.configurar(ataque, float(direcao))
	projetil.global_position = global_position
	# Projétil vai para a cena atual, não para o Curupira: assim não anda junto com ele.
	get_tree().current_scene.add_child(projetil)
