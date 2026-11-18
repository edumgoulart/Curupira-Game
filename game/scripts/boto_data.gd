class_name BotoData
extends ChefeData
## Números do Boto cor-de-rosa. Os marcados "GDD" vêm do GDD; os "provisório" ainda não
## estão no GDD (Q16) e devem ser ajustados testando.
## Nome, vida (GDD: 2000), pausa entre ataques (GDD: 2 s), contato, fases e combos ficam em ChefeData
## e estão preenchidos no boto.tres.
## Avisos: o Eduardo pediu mais tempo para desviar, então subiram (o valor antigo fica anotado).
## Ataques (nomes usados nas fases): jato, beijos, chapeu, salto.

@export_group("Jato de água")
## Aviso antes do jato: incha e puxa água para o bico (s). GDD: 0,9 (era 0,7).
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_jato: float = 0.9
## Quanto tempo o jato alto fica ligado (s). Provisório: 0,5.
@export_range(0.1, 3.0, 0.05, "suffix:s") var duracao_jato: float = 0.5
## Quanto tempo o jato baixo fica ligado (s). Mais curto, porque pular por cima pede tempo
## certo: o Curupira fica acima de 60 px por ~0,67 s num pulo. Provisório: 0,35.
@export_range(0.1, 3.0, 0.05, "suffix:s") var duracao_jato_baixo: float = 0.35
## Chance de o jato vir baixo (pula-se) em vez de alto (abaixa-se). Provisório: 0,5.
@export_range(0.0, 1.0, 0.05) var chance_jato_baixo: float = 0.5
## Altura do meio do jato acima da areia (px). O jato tem 28 px de espessura.
## Alto: acerta o Curupira em pé (172 px de altura) e passa 30 px por cima dele agachado
## (86 px). Antes ficava a ~200 px e passava por cima do Curupira em pé. Provisório: 130.
@export var altura_jato_alto: float = 130.0
## Baixo: rente à areia; pula-se por cima. Provisório: 40.
@export var altura_jato_baixo: float = 40.0
## No começo do aviso, o Boto afunda (ou sobe) até o bico ficar na altura do jato, que sai
## reto. Tempo desse ajuste (s), dentro do aviso. Provisório: 0,3.
@export_range(0.0, 3.0, 0.05, "suffix:s") var ajuste_jato: float = 0.3
## No fim do aviso, a água começa a sair do bico, fina, e vai crescendo até virar o jato.
## Tempo dessa crescida (s), dentro do aviso. Provisório: 0,5.
@export_range(0.0, 3.0, 0.05, "suffix:s") var crescida_jato: float = 0.5
## Golpes do jato. GDD: 1.
@export var golpes_jato: int = 1
## O Boto fica parado depois do jato (s); é a janela para atacar. GDD: 1,2.
@export_range(0.0, 5.0, 0.05, "suffix:s") var parada_apos_jato: float = 1.2
@export var cena_jato: PackedScene

@export_group("Beijos de bolha")
## Aviso antes dos beijos (s). Se a animação "aviso_beijos" for mais longa, vale ela.
## Provisório: 0,6 (era 0,4, e não era usado: valia só a animação).
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_beijos: float = 0.6
## Quantos corações. Provisório: 4.
@export var quantidade_beijos: int = 4
## Tempo entre um beijo e o próximo (s). Provisório: 0,45.
@export_range(0.05, 2.0, 0.05, "suffix:s") var intervalo_beijos: float = 0.45
## Velocidade dos corações (px/s). Eles perseguem o Curupira, então são mais lentos que ele
## (600). Provisório: 240 (era 280, em linha reta).
@export var velocidade_beijo: float = 240.0
## Quanto o coração consegue virar por segundo atrás do Curupira (graus/s). Pouco = curva
## larga, dá para despistar correndo ou pulando. Provisório: 90.
@export var curva_beijo: float = 90.0
## Ondulação para os lados do caminho: altura (px) e ondas por segundo. Provisório: 24 e 0,9
## (era 40 e 0,7, na vertical).
@export var amplitude_beijo: float = 24.0
@export var frequencia_beijo: float = 0.9
## Depois desse tempo o coração estoura sozinho (s). Provisório: 6 (era 7).
@export var duracao_beijo: float = 6.0
## Golpes por coração. Provisório: 1.
@export var golpes_beijo: int = 1
## Encanto (lenda do Boto): o coração que encosta, além do golpe, puxa o Curupira na direção
## do Boto por um tempo; ele não anda nem dá dash, mas pula e atira. Velocidade do puxão
## (px/s; andar é 600) e duração (s). Provisório: 300 e 1.
@export var forca_encanto: float = 300.0
@export_range(0.0, 3.0, 0.05, "suffix:s") var duracao_encanto: float = 1.0
@export var cena_coracao: PackedScene

@export_group("Chapéu bumerangue")
## Aviso: tira o chapéu da cabeça, puxa o braço para trás e segura, na altura da ida (s).
## Provisório: 0,8 (era 0,6).
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_chapeu: float = 0.8
## No começo do aviso, o Boto afunda (ou sobe) até a nadadeira ficar na altura da ida, e o
## chapéu sai reto dela. Tempo desse ajuste (s), dentro do aviso; o mesmo tempo para voltar à
## linha d'água depois de jogar. Provisório: 0,3.
@export_range(0.0, 3.0, 0.05, "suffix:s") var ajuste_chapeu: float = 0.3
## Tempo da ida e da volta (s). Provisório: 0,9 e 0,9.
@export_range(0.2, 3.0, 0.05, "suffix:s") var duracao_ida_chapeu: float = 0.9
@export_range(0.2, 3.0, 0.05, "suffix:s") var duracao_volta_chapeu: float = 0.9
## As duas alturas do chapéu acima do chão (px); ele tem raio 36.
## Baixa: rente ao chão, pula-se por cima. Provisório: 40.
## Alta: acerta o Curupira em pé (172 px) e passa 18 px por cima dele agachado (86 px):
## abaixa-se. Antes a volta passava a 220, por cima do Curupira em pé. Provisório: 140.
@export var altura_baixa_chapeu: float = 40.0
@export var altura_alta_chapeu: float = 140.0
## Chance de inverter a ordem: vai alto (abaixa-se) e volta baixo (pula-se). Provisório: 0,5.
@export_range(0.0, 1.0, 0.05) var chance_chapeu_invertido: float = 0.5
## Onde o chapéu vira, medido da parede do outro lado (px). Provisório: 160.
@export var margem_chapeu: float = 160.0
## Golpes do chapéu. Provisório: 1.
@export var golpes_chapeu: int = 1
@export var cena_chapeu: PackedScene

@export_group("Salto para o outro lado")
## O salto tem duas formas, sorteadas: por cima (arco alto soltando bolhas; passa-se por baixo
## dele e entre as bolhas) ou rasante (baixo e reto, deitado; abaixa-se ou dá dash).
## Chance do rasante. Provisório: 0,5.
@export_range(0.0, 1.0, 0.05) var chance_rasante: float = 0.5
## Aviso antes do salto por cima (s): o Boto brilha e afunda reto. Se a animação "mergulho"
## for mais longa, vale ela. Provisório: 0,8.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_salto: float = 0.8
## Duração do salto por cima (s). Provisório: 1,4.
@export_range(0.3, 4.0, 0.05, "suffix:s") var duracao_pulo: float = 1.4
## Altura do arco do salto (px). Provisório: 520 (passa por cima do Curupira no meio da arena).
@export var altura_pulo: float = 520.0
## Bolhas soltas durante o salto por cima. GDD: 5 (era 3; o Eduardo pediu mais difícil).
@export var quantidade_bolhas: int = 5
## Golpes por bolha. GDD: 1.
@export var golpes_bolha: int = 1
## Velocidade com que as bolhas descem (px/s). Provisório: 200 (era 120).
@export var velocidade_bolha: float = 200.0
## Balanço das bolhas para os lados: largura (px) e idas e voltas por segundo.
## Provisório: 48 e 1,6 (era 30 e 1,2).
@export var balanco_bolha: float = 48.0
@export var frequencia_bolha: float = 1.6
@export var cena_bolha: PackedScene
## Aviso antes do rasante (s): o Boto brilha, deita para a frente e bate a cauda. Se a
## animação "aviso_rasante" for mais longa, vale ela. Provisório: 0,8.
@export_range(0.0, 3.0, 0.05, "suffix:s") var aviso_rasante: float = 0.8
## Duração do rasante, de uma margem à outra (s). Provisório: 1,2.
@export_range(0.3, 4.0, 0.05, "suffix:s") var duracao_rasante: float = 1.2
## Altura da barriga do Boto (parte de baixo do desenho e da caixa de contato) acima da areia
## no rasante (px). Acima do Curupira agachado (86) e abaixo dele em pé (172). Provisório: 120.
@export var altura_rasante: float = 120.0
## Parte do caminho (0 a 0,5) em que ele sai da água subindo, e a mesma parte no fim, descendo.
## Pequena, para já estar na altura do rasante quando passa da beira da areia. Provisório: 0,12.
@export_range(0.01, 0.5, 0.01) var subida_rasante: float = 0.12

