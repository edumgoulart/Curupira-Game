class_name ConversaData
extends Resource
## Conversa com uma criatura libertada no mapa do mundo (dados/mapa/conversa_<id>.tres).
## Cada fala é "Quem: texto". "Curupira: ..." é o jogador; qualquer outro nome é a criatura.
## Dá para trocar, tirar ou pôr falas pelo inspetor; a caixa de diálogo mostra uma por vez.

## Nome que aparece no aviso "A / Espaço: conversar".
@export var nome: String = ""
@export var falas: Array[String] = []
