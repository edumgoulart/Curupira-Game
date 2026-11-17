class_name ComboChefe
extends Resource
## Dois ataques encadeados: o primeiro deixa perigos soltos na tela (sombras, poças, corações,
## bombas, placas) e, assim que o corpo do chefe fica livre, o segundo começa.
## O chefe só tem um corpo, então nunca faz duas animações ao mesmo tempo: o que fica
## "simultâneo" são os perigos.
##
## O primeiro ataque roda "encadeado": não espera os próprios projéteis e pula a janela de
## recuperação do fim (tonta, cansada, parada). A janela fica para o fim do combo, no segundo.
##
## Todo combo novo tem que passar no verificador de desvio (testes/verificar_desvio.gd):
## ele procura um caminho para o Curupira sair sem levar golpe. O verificador também diz o
## menor atraso que funciona.

## Nome do primeiro ataque (o mesmo nome usado na lista de ataques do chefe).
@export var primeiro: StringName = &""
## Nome do segundo ataque.
@export var segundo: StringName = &""
## Espera entre o corpo ficar livre do primeiro e o começo do segundo (s). Provisório: ajustar
## testando, sem descer do mínimo que o verificador aponta.
@export_range(0.0, 3.0, 0.05, "suffix:s") var atraso: float = 0.0


func nome() -> String:
	return "%s+%s" % [primeiro, segundo]
