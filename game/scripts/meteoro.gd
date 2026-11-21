class_name Meteoro
extends Node2D
## Meteoro da Mula. Nasce no chão, no ponto onde vai cair:
##   1. durante o aviso (é o telegrafo), um brilho no alto da tela, bem em cima do ponto, fica
##      mais forte e pisca mais rápido; no chão a sombra cresce;
##   2. nos últimos instantes a bola de fogo cai do alto, saindo do brilho (que some quando ela
##      passa por ele);
##   3. no impacto a área machuca por um instante, o fogo estoura e tudo some.
## O fogo e o brilho são só visuais; quem machuca é a área "Impacto" (Hitbox).
## O brilho é criado aqui por código (não está na cena) e fica no meteoro: some junto com ele.

signal impactou

## Altura de onde o fogo começa a cair, acima do chão (px). Só visual.
const ALTURA_QUEDA: float = 1200.0

## Brilho no céu: 6 forças × 2 piscadas (quadro = 2 × força + piscada), do gerador de pixel art.
const QUADROS_BRILHO: Array[Texture2D] = [
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_1.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_2.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_3.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_4.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_5.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_6.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_7.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_8.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_9.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_10.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_11.png"),
	preload("res://assets/pixel/mula/efeitos/brilho_meteoro_12.png"),
]
const FORCAS_BRILHO: int = 6
## Centro do desenho do brilho (efeitos.json da Mula, "centro").
const CENTRO_BRILHO: Vector2 = Vector2(13, 13)
## Distância do brilho até a borda de cima da tela (px): abaixo da barra de vida do chefe.
const MARGEM_BRILHO: float = 150.0
## Piscadas por segundo, do começo ao fim do aviso (pisca mais rápido perto da queda).
const PISCA_BRILHO_INICIO: float = 6.0
const PISCA_BRILHO_FIM: float = 16.0

## Explosão criada no impacto. Só visual.
@export var cena_estouro: PackedScene

var _aviso: float = 1.0
## Tempo escondido antes de o aviso começar (s): a segunda onda da chuva do Expert só começa a
## brilhar quando a primeira já está caindo.
var _espera: float = 0.0
var _queda: float = 0.3
var _duracao_impacto: float = 0.15
var _golpes: int = 2
var _tempo: float = 0.0
var _impactou: bool = false
var _brilho: Sprite2D
var _pisca: float = 0.0

@onready var sombra: AnimacaoQuadros = $Sombra
@onready var fogo: Node2D = $Fogo
@onready var impacto: Hitbox = $Impacto
@onready var forma_impacto: CollisionShape2D = $Impacto/CollisionShape2D
## Altura final do fogo (a cabeça da bola encostando no chão), lida da cena.
@onready var _y_final_fogo: float = fogo.position.y


## aviso < 0 = o aviso_meteoro dos dados (o combo do Expert passa um mais longo).
## espera = tempo escondido (sem brilho nem sombra) antes de o aviso começar.
func configurar(dados: MulaData, aviso: float = -1.0, espera: float = 0.0) -> void:
	_aviso = dados.aviso_meteoro if aviso < 0.0 else aviso
	_espera = maxf(espera, 0.0)
	_queda = dados.duracao_queda_meteoro
	_duracao_impacto = dados.duracao_impacto_meteoro
	_golpes = dados.golpes_meteoro


func _ready() -> void:
	add_to_group("ataques_chefe")
	impacto.dano = _golpes
	forma_impacto.disabled = true
	fogo.visible = false
	_criar_brilho()
	_atualizar_visual()
	visible = _espera <= 0.0


func _physics_process(delta: float) -> void:
	if _espera > 0.0:
		_espera -= delta
		if _espera > 0.0:
			return
		visible = true
	_tempo += delta
	_pisca += delta * lerpf(PISCA_BRILHO_INICIO, PISCA_BRILHO_FIM, _forca_do_aviso())
	_atualizar_visual()
	if not _impactou and _passou(_aviso):
		_impactou = true
		# Ligar a forma (e não monitorable) faz a hitbox detectar quem já está em cima.
		forma_impacto.set_deferred("disabled", false)
		sombra.visible = false
		_estourar()
		impactou.emit()
	if _passou(_aviso + _duracao_impacto):
		queue_free()


func _atualizar_visual() -> void:
	# A sombra cresce pelos quadros da animação (pixel art não escala nem fica transparente).
	sombra.mostrar_progresso(clampf(_tempo / _aviso, 0.0, 1.0))
	var inicio_queda: float = _aviso - _queda
	if _tempo >= inicio_queda and not _impactou:
		fogo.visible = true
		var q: float = clampf((_tempo - inicio_queda) / _queda, 0.0, 1.0)
		fogo.position.y = lerpf(_y_final_fogo - ALTURA_QUEDA, _y_final_fogo, q)
	_atualizar_brilho()


## O brilho fica no alto da tela visível (a câmera é fixa), na mesma coluna do ponto de queda.
func _criar_brilho() -> void:
	_brilho = Sprite2D.new()
	_brilho.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_brilho.scale = Vector2(4.0, 4.0)
	_brilho.centered = false
	_brilho.offset = -CENTRO_BRILHO
	add_child(_brilho)
	var topo_da_tela: float = (get_viewport().get_canvas_transform().affine_inverse() * Vector2.ZERO).y
	_brilho.global_position = Vector2(global_position.x, topo_da_tela + MARGEM_BRILHO)


## Força do aviso de 0 a 1: do nascimento até a pedra começar a cair.
func _forca_do_aviso() -> float:
	return clampf(_tempo / maxf(_aviso - _queda, 0.01), 0.0, 1.0)


func _atualizar_brilho() -> void:
	if _brilho == null:
		return
	# Some quando a pedra passa por ele (ela sai do brilho) ou no impacto.
	var pedra_passou: bool = fogo.visible and fogo.global_position.y > _brilho.global_position.y
	_brilho.visible = not _impactou and not pedra_passou
	var forca: int = mini(int(_forca_do_aviso() * FORCAS_BRILHO), FORCAS_BRILHO - 1)
	_brilho.texture = QUADROS_BRILHO[forca * 2 + int(_pisca) % 2]


## Impacto: a bola some num estouro. O estouro vai para a arena (e não fica no meteoro)
## para terminar de sumir mesmo depois que o meteoro já foi apagado.
func _estourar() -> void:
	fogo.visible = false
	if cena_estouro == null:
		return
	var estouro: Node2D = cena_estouro.instantiate()
	estouro.position = position + Vector2(0.0, -40.0)
	get_parent().add_child.call_deferred(estouro)


## Compara tempo com tolerância (somas de 1/60 não batem exato em float).
func _passou(instante: float) -> bool:
	return _tempo > instante or is_equal_approx(_tempo, instante)
