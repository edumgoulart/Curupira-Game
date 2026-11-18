class_name CenarioMapa
extends Node2D
## Monta o mapa do mundo a partir do que o gerador de pixel art exporta em assets/pixel/mapa/:
##   fundo_1..16.png  chão, rios, mata fechada e o prédio (atrás de tudo), em laço de 2 s;
##   objetos.png      atlas com árvores, palmeiras, samaúma, cerca, portão, bandeiras, as criaturas
##                    libertadas e as camadas de efeito (fogo, névoa, fumaça, luz do caldeirão);
##   andavel.png      máscara do chão: pixel branco = dá para andar;
##   dados.json       onde fica cada objeto, as entradas das áreas, as conversas, o portão e o
##                    ponto de partida.
##
## O que muda com o progresso vem no campo "mostrar" de cada objeto (ver _deve_aparecer): o fogo
## da Mula e a névoa da Cuca só aparecem antes de cada uma ser libertada, e as criaturas, as
## árvores rebrotando e as bandeiras só depois.
##
## Por que assim:
##   - Profundidade: este node tem y-sort, e cada objeto tem a origem na base do tronco. O
##     Curupira (filho deste node, origem nos pés) passa atrás da árvore quando está acima da
##     base dela e na frente quando está abaixo, sem nenhum código de profundidade.
##   - Paredes: em vez de CollisionShape2D (que são do Arthur e teriam de seguir o desenho à mão),
##     o limite é a máscara andavel.png, que sai do mesmo gerador que o desenho. Mudou o mapa,
##     mudou o limite junto. Dá também para pintar a máscara num editor de imagem.
##   - Tudo anima pelo mesmo relógio (fundo e objetos), para o fogo e a fumaça baterem. Objetos
##     grandes e lentos (névoa, brasas) têm menos quadros, espalhados pelo mesmo laço de 2 s.
##   - Camadas de efeito têm "z": -9 fica logo acima do chão (fogo da mata, luz no chão) e 9 por
##     cima de tudo (névoa, fumaça). Sem "z", o objeto entra no y-sort com o Curupira.
##   - Copas grandes ("transparente") ficam translúcidas quando o Curupira passa atrás delas,
##     senão ele some embaixo das castanheiras.

const PASTA: String = "res://assets/pixel/mapa"
## A arte é desenhada em pixels e o jogo mostra cada pixel com 4×4.
const ESCALA: float = 4.0
## Transparência da copa com o Curupira atrás (1 = opaca). Só visual.
const ALFA_COPA: float = 0.45
## Velocidade com que a copa clareia e volta (por segundo). Só visual.
const VELOCIDADE_ALFA: float = 4.0

## Conteúdo de dados.json.
var dados: Dictionary = {}

var _andavel: Image
var _fundo: Sprite2D
var _quadros_fundo: Array[Texture2D] = []
## Objetos animados: cada item é [Sprite2D, Array[Texture2D]].
var _animados: Array = []
## Copas que ficam translúcidas: cada item é [Sprite2D, Rect2 na tela].
var _copas: Array = []
## Onde está o Curupira (pés), para as copas; mapa.gd atualiza a cada quadro.
var ponto_curupira: Vector2 = Vector2(-INF, -INF)
var _fps: float = 8.0
var _tempo: float = 0.0
var _quadro: int = -1
var _portao_trancado: bool = true
var _retangulo_portao: Rect2


func _ready() -> void:
	y_sort_enabled = true
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var lido: Variant = JSON.parse_string(FileAccess.get_file_as_string(PASTA + "/dados.json"))
	if not lido is Dictionary:
		push_error("Mapa: não consegui ler %s/dados.json" % PASTA)
		return
	dados = lido
	_fps = float(dados.get("fps", 8))
	_andavel = (load(PASTA + "/andavel.png") as Texture2D).get_image()
	_portao_trancado = not GameState.boss_liberado()
	var r: Array = dados.portao.retangulo
	_retangulo_portao = Rect2(r[0], r[1], r[2] - r[0], r[3] - r[1])

	for i in int(dados.get("quadros", 16)):
		_quadros_fundo.append(load("%s/fundo_%d.png" % [PASTA, i + 1]))
	_fundo = _camada("Fundo", -10)
	_criar_objetos()
	_trocar_quadro(0)


func _process(delta: float) -> void:
	_tempo += delta
	var q: int = int(_tempo * _fps) % _quadros_fundo.size()
	if q != _quadro:
		_trocar_quadro(q)
	_atualizar_copas(delta)


## Tamanho do mapa na tela (pixels do jogo).
func tamanho() -> Vector2:
	return Vector2(dados.tamanho[0], dados.tamanho[1]) * ESCALA


## Onde o Curupira começa: na volta da última área visitada, ou no pé da samaúma.
func ponto_de_partida(entrada: String) -> Vector2:
	if dados.entradas.has(entrada):
		return _tela(dados.entradas[entrada].volta)
	return _tela(dados.inicio)


## Se dá para pisar nesse ponto (posição na tela). Fora do mapa, na água, na mata fechada e
## nos troncos, não. O portão trancado também não.
func pode_andar(p: Vector2) -> bool:
	var a: Vector2 = p / ESCALA
	if _portao_trancado and _retangulo_portao.has_point(a):
		return false
	var x: int = floori(a.x)
	var y: int = floori(a.y)
	if x < 0 or y < 0 or x >= _andavel.get_width() or y >= _andavel.get_height():
		return false
	return _andavel.get_pixel(x, y).a > 0.5


## Id da área cuja entrada está nesse ponto ("mula", "cuca", "boto", "maquina"), ou "".
func entrada_em(p: Vector2) -> String:
	var a: Vector2 = p / ESCALA
	for id: String in dados.entradas:
		var e: Dictionary = dados.entradas[id]
		if a.distance_to(Vector2(e.centro[0], e.centro[1])) <= float(e.raio):
			return id
	return ""


## Id da criatura libertada com quem dá para conversar nesse ponto ("mula", "cuca", "boto"), ou "".
func conversa_em(p: Vector2) -> String:
	var a: Vector2 = p / ESCALA
	for id: String in dados.get("conversas", {}):
		var c: Dictionary = dados.conversas[id]
		if _deve_aparecer(c.get("mostrar", "")) and a.distance_to(Vector2(c.centro[0], c.centro[1])) <= float(c.raio):
			return id
	return ""


## Perto do portão trancado da empresa (para avisar por que não abre).
func perto_do_portao_trancado(p: Vector2) -> bool:
	if not _portao_trancado:
		return false
	var c: Array = dados.portao.aviso
	return (p / ESCALA).distance_to(Vector2(c[0], c[1])) <= float(dados.portao.raio)


func _tela(par: Array) -> Vector2:
	return Vector2(par[0], par[1]) * ESCALA


func _camada(nome: String, z: int) -> Sprite2D:
	var s := Sprite2D.new()
	s.name = nome
	s.centered = false
	s.scale = Vector2(ESCALA, ESCALA)
	s.z_index = z
	add_child(s)
	return s


func _criar_objetos() -> void:
	var atlas: Texture2D = load(PASTA + "/objetos.png")
	for o: Dictionary in dados.objetos:
		if not _deve_aparecer(o.get("mostrar", "")):
			continue
		var quadros: Array[Texture2D] = []
		for q: Array in o.quadros:
			var recorte := AtlasTexture.new()
			recorte.atlas = atlas
			recorte.region = Rect2(q[0], q[1], o.tamanho[0], o.tamanho[1])
			quadros.append(recorte)
		var s := Sprite2D.new()
		s.name = String(o.nome).to_pascal_case()
		s.centered = false
		# A origem fica na base (o pé da árvore): é ela que o y-sort compara com os pés do Curupira.
		s.offset = Vector2(o.deslocamento[0], o.deslocamento[1])
		s.position = _tela(o.pos)
		s.scale = Vector2(ESCALA, ESCALA)
		s.texture = quadros[0]
		if o.has("z"):
			s.z_index = int(o.z)
		add_child(s)
		if quadros.size() > 1:
			_animados.append([s, quadros])
		if o.get("transparente", false):
			var canto: Vector2 = s.position + s.offset * ESCALA
			_copas.append([s, Rect2(canto, Vector2(o.tamanho[0], o.tamanho[1]) * ESCALA)])


## "trancado"/"aberto": portão da empresa; "concluiu:fase1": só depois de libertar a Mula
## (bandeira, criatura, árvores rebrotando); "nao_concluiu:fase1": só antes (fogo, névoa).
func _deve_aparecer(regra: String) -> bool:
	if regra == "":
		return true
	if regra == "trancado":
		return _portao_trancado
	if regra == "aberto":
		return not _portao_trancado
	if regra.begins_with("concluiu:"):
		return GameState.concluiu(regra.trim_prefix("concluiu:"))
	if regra.begins_with("nao_concluiu:"):
		return not GameState.concluiu(regra.trim_prefix("nao_concluiu:"))
	return true


## A copa clareia quando o meio do corpo do Curupira está dentro dela e os pés estão atrás do
## tronco (acima da base); na frente da árvore, ele já aparece por cima pelo y-sort.
func _atualizar_copas(delta: float) -> void:
	var corpo: Vector2 = ponto_curupira + Vector2(0.0, -20.0 * ESCALA)
	for item: Array in _copas:
		var s: Sprite2D = item[0]
		var atras: bool = ponto_curupira.y < s.position.y and (item[1] as Rect2).has_point(corpo)
		s.modulate.a = move_toward(s.modulate.a, ALFA_COPA if atras else 1.0, VELOCIDADE_ALFA * delta)


func _trocar_quadro(q: int) -> void:
	_quadro = q
	_fundo.texture = _quadros_fundo[q]
	# um objeto com n quadros espalhados pelo laço mostra o quadro q·n/16
	for item: Array in _animados:
		var lista: Array = item[1]
		(item[0] as Sprite2D).texture = lista[q * lista.size() / _quadros_fundo.size()]
