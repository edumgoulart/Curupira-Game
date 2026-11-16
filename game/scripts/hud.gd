extends CanvasLayer
## HUD da luta: vida do Curupira e carga do especial no canto inferior esquerdo (GDD) e a
## barra de vida do chefe no alto da tela.
## CanvasLayer: fica fixo na tela, por cima da arena, sem depender da câmera.
##
## O HUD só liga sinais: cada parte (HudVida, HudEspecial, HudChefe) desenha a si mesma
## e não conhece o Curupira nem o chefe. Assim dá para trocar o visual sem mexer na luta.

## O Curupira da arena. Apontar no inspetor da cena da arena.
@export var curupira: Node
## O chefe da arena. Apontar no inspetor da cena da arena. Vazio = sem barra do chefe.
@export var chefe: Chefe

@onready var vida: HudVida = %Vida
@onready var especial: HudEspecial = %Especial
@onready var barra_chefe: HudChefe = %Chefe


func _ready() -> void:
	_ligar_curupira()
	_ligar_chefe()


func _ligar_curupira() -> void:
	if curupira == null:
		push_warning("HUD sem Curupira no campo 'curupira'; vida e especial não vão aparecer.")
		return
	# Mostra os valores atuais já na entrada: o Curupira configura vida e carga antes do HUD existir.
	var vida_curupira: Vida = curupira.vida
	vida_curupira.vida_mudou.connect(vida.mostrar)
	vida.mostrar(vida_curupira.atual, vida_curupira.maximo)

	var carga: CargaEspecial = curupira.carga
	carga.carga_mudou.connect(_ao_mudar_carga)
	_ao_mudar_carga(carga.atual, carga.maximo)


func _ligar_chefe() -> void:
	if chefe == null:
		push_warning("HUD sem chefe no campo 'chefe'; a barra de vida do chefe não vai aparecer.")
		return
	# Os entalhes dependem da dificuldade (Normal: Mula, Cuca e Boto sem troca de fase).
	barra_chefe.configurar(chefe.dados.nome, chefe.limiares_fase())
	chefe.vida.vida_mudou.connect(barra_chefe.mostrar)
	barra_chefe.mostrar(chefe.vida.atual, chefe.vida.maximo)
	chefe.chefe_derrotado.connect(barra_chefe.esconder)


func _ao_mudar_carga(atual: int, maximo: int) -> void:
	especial.mostrar(atual, maximo)
	# Com o especial cheio, o retrato do Curupira fica com cara de fúria (cabelo em chamas).
	vida.mostrar_especial(especial.esta_cheia())
