class_name MulaData
extends Resource
## Números da Mula sem Cabeça. Os marcados "GDD" vêm da tabela de chefes do GDD;
## os "provisório" foram combinados com o Arthur e devem ser ajustados testando.

@export_group("Identidade (GDD)")
## Nome mostrado na tela de vitória.
@export var nome: String = "Mula sem Cabeça"
## Id do progresso no GameState (fase1 = Mula, fase2 = Cuca, fase3 = Boto, boss = Máquina).
@export var id_progresso: String = "fase1"
## Ataques que o Curupira ganha ao vencer (texto da tela de vitória). GDD: Bola de Fogo e Canhão Flamejante.
@export var recompensa: String = "Bola de Fogo e Canhão Flamejante"

@export_group("Geral (GDD)")
## Vida da Mula. GDD: 1200.
@export var vida: int = 1200
## Pausa entre um ataque e o próximo (s). GDD: 1,2.
@export_range(0.0, 5.0, 0.05, "suffix:s") var pausa_entre_ataques: float = 1.2
## Golpes tirados do Curupira ao encostar no corpo da Mula. Provisório (combinado): 1.
@export var golpes_contato: int = 1

@export_group("Três bolas de fogo")
## Aviso antes da primeira bola (s). GDD: 0,5.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_bolas: float = 0.5
## Quantas bolas por ataque. GDD: 3.
@export var quantidade_bolas: int = 3
## Golpes por bola. GDD: 1.
@export var golpes_bola: int = 1
## Tempo entre uma bola e a próxima (s). Provisório: 0,35.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_bolas: float = 0.35
## Velocidade da bola, reta na horizontal (px/s). Provisório: 700.
## O Curupira anda a 600: não dá para fugir correndo, tem que pular ou dar dash.
@export var velocidade_horizontal_bola: float = 700.0
## Altura do centro da bola acima do chão (px). Provisório: 60.
## Com 60 ela pega o Curupira parado (corpo de 0 a 128 px) e passa por baixo de um pulo
## bem cronometrado. Mais alto = mais difícil de pular; acima de ~150 ela passa por cima dele parado.
@export var altura_bola: float = 60.0
@export var cena_bola: PackedScene

@export_group("Meteoro")
## Aviso: tempo da sombra no chão até o impacto (s). GDD: 1.
@export_range(0.1, 3.0, 0.05, "suffix:s") var aviso_meteoro: float = 1.0
## Golpes do meteoro. GDD: 2.
@export var golpes_meteoro: int = 2
## A Mula fica parada depois do meteoro (s); é a janela para atacar. GDD: 1,5.
## Esta parada substitui a pausa normal entre ataques.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_meteoro: float = 1.5
## Nos últimos X s do aviso a pedra aparece caindo. Provisório: 0,3.
@export_range(0.05, 1.0, 0.05, "suffix:s") var duracao_queda_meteoro: float = 0.3
## Quanto tempo a área do impacto machuca (s). Provisório: 0,15.
@export_range(0.05, 1.0, 0.05, "suffix:s") var duracao_impacto_meteoro: float = 0.15
@export var cena_meteoro: PackedScene
