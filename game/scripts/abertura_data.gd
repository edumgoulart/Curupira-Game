class_name AberturaData
extends Resource
## Dados das cenas de abertura (abertura.tscn): uma imagem e um texto por cena, na mesma ordem.
## Ficam aqui, e não no script, para trocar o texto ou a imagem pelo inspetor.

## Imagens em pixel art de 480×270 (assets/pixel/abertura/cena_N.png, geradas pelo gerador).
@export var imagens: Array[Texture2D] = []
## Uma ou duas frases por cena, mostradas na faixa de baixo.
@export var textos: Array[String] = []
## Tempo da troca de uma cena para a outra (escurece e clareia).
@export_range(0.0, 2.0, 0.05, "suffix:s") var duracao_troca: float = 0.3
