extends SceneTree
## Verificador de desvio (headless). Para cada ataque e cada combo das fases de cada chefe,
## responde: "dá para o Curupira sair sem levar golpe?" e "qual o menor atraso do combo que
## ainda dá?".
##
## Como funciona, em três passos:
##   1. Gravar: roda a luta de verdade (cena da arena, scripts dos chefes, projéteis) com um
##      boneco no lugar do Curupira, força o ataque/combo e grava, quadro a quadro, onde estão
##      as caixas de dano ligadas (layer enemy_hitbox). A arena vira uma grade de 8 × 8 px.
##   2. Procurar: com a gravação, procura uma sequência de comandos do Curupira (parado, andar,
##      pular, pulo curto, abaixar, dash) que nunca encosta numa caixa. Usa os números do
##      MovimentoData (600 px/s, pulo 1100, gravidade 2800, dash 300 px em 0,2 s com recarga
##      de 0,8 s) e a hurtbox real (48 × 172 de pé, 48 × 86 agachado). Dash = invencível.
##   3. Conferir: grava de novo com o boneco seguindo o caminho achado, porque os chefes miram
##      onde o Curupira está (meteoros, leque, laser). Se o caminho continua limpo, o desvio
##      existe de verdade. Se não, procura de novo com a gravação nova (até 4 vezes).
## Resultado "ok" é garantido para aquela posição inicial e sorteio. "falhou" quer dizer que a
## busca não achou caminho (pode ser impossível, ou difícil demais para o limite da busca).
##
## Limites (conservador = pode dizer "falhou" num desvio apertado que existe):
##   - grade de 8 px; a hurtbox vira retângulo (a cápsula tem cantos arredondados);
##   - corações do Boto contam como sólidos (no jogo dá para estourar com tiro);
##   - poças da Cuca ficam de fora (não tiram golpe na hora; veneno só depois de 1 s parado);
##   - o Curupira decide a cada 3 quadros (0,05 s), como um jogador muito bom.
##
## Rodar numa cópia de game/ (ou com o editor fechado), sem limite de quadros por segundo:
##   godot --headless --fixed-fps 60 --disable-vsync --path game --script res://testes/verificar_desvio.gd
## Filtros opcionais depois de "--": chefe=mula  dificuldade=1  so=combos|ataques  rapido
##   (rapido = só o atraso do .tres, sem procurar o mínimo)

const ARENAS := {
	"mula": "res://scenes/level1.tscn",
	"cuca": "res://scenes/level2.tscn",
	"boto": "res://scenes/level3.tscn",
	"maquina": "res://scenes/level4.tscn",
}
const NOMES_DIFICULDADE := ["Normal", "Expert"]
## Sementes do sorteio. O primeiro sorteio de cada uma cai acima (11: 0,83) e abaixo (44: 0,30)
## de 0,5, para os ataques com duas formas sorteadas (jato alto ou baixo, ordem do chapéu, salto
## por cima ou rasante) passarem pelas duas. Antes era [11, 22], e as duas davam 0,83.
const SORTEIOS := [11, 44]
## Atrasos testados para achar o mínimo de cada combo (s).
const ATRASOS := [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]

# Grade: colunas de 8 px a partir de x = -960; linhas de 8 px a partir do chão (y = 340), para cima.
const CELULA: float = 8.0
const X0: float = -960.0
const COLUNAS: int = 240
const LINHAS: int = 62
const CHAO: float = 340.0
const QUADRO: float = 1.0 / 60.0
const QUADROS_POR_DECISAO: int = 3
const LIMITE_BUSCA: int = 60000
const MAX_QUADROS: int = 1200

# Curupira (lidos do MovimentoData e da cena no começo).
var _vel: float = 600.0
var _pulo: float = 1100.0
var _grav: float = 2800.0
var _dash_dist: float = 300.0
var _dash_quadros: int = 12
var _recarga_quadros: int = 48
const MEIA_LARGURA: float = 24.0
const ALTURA_DE_PE: float = 172.0
const ALTURA_AGACHADO: float = 86.0
const MEIO_CORPO: float = 30.0  # raio da cápsula do corpo: até onde chega perto da parede
# A origem do Curupira em pé fica 96 px acima do chão (cápsula do corpo de 192 px).
const ORIGEM_ACIMA_DO_CHAO: float = 96.0

var _x_min: float = -930.0
var _x_max: float = 930.0
var _filtros: Dictionary = {}
var _parado_levou: int = 0
var _linhas_relatorio: Array[String] = []


func _initialize() -> void:
	for arg in OS.get_cmdline_user_args():
		var partes: PackedStringArray = arg.split("=")
		_filtros[partes[0]] = partes[1] if partes.size() > 1 else "1"
	_rodar.call_deferred()


func _rodar() -> void:
	var mov: Resource = load("res://dados/curupira_movimento.tres")
	_vel = mov.velocidade
	_pulo = mov.velocidade_pulo
	_grav = mov.gravidade
	_dash_dist = mov.distancia_dash
	_dash_quadros = roundi(mov.duracao_dash / QUADRO)
	_recarga_quadros = roundi(mov.recarga_dash / QUADRO)
	for chefe_id in ARENAS:
		if _filtros.has("chefe") and _filtros["chefe"] != chefe_id:
			continue
		await _verificar_chefe(chefe_id)
	_relatar("FIM")
	var arquivo := FileAccess.open("user://verificar_desvio.txt", FileAccess.WRITE)
	if arquivo:
		arquivo.store_string("\n".join(_linhas_relatorio) + "\n")
	quit()


func _relatar(texto: String) -> void:
	print(texto)
	_linhas_relatorio.append(texto)


func _verificar_chefe(chefe_id: String) -> void:
	var dados: Resource = load("res://dados/chefes/%s.tres" % chefe_id)
	_relatar("\n=== %s ===" % dados.nome)
	# Ataques sozinhos: todos os que aparecem em alguma fase.
	var ataques: Array[StringName] = []
	for lista in [dados.fases_normal, dados.fases_expert]:
		for f in lista:
			for a in f.ataques:
				if a not in ataques:
					ataques.append(a)
	# A dificuldade muda o ataque em alguns chefes (Mula: 3 + 2 meteoros no Expert) e a vida,
	# então cada teste roda com a dificuldade dele no GameState.
	var game_state: Node = root.get_node("GameState")
	if _filtros.get("so", "") != "combos":
		for dif in [0, 1]:
			if _filtros.has("dificuldade") and int(_filtros["dificuldade"]) != dif:
				continue
			game_state.dificuldade = dif
			for a in ataques:
				var r: Dictionary = await _testar(chefe_id, a, &"", 0.0)
				_relatar("  %s ataque %-10s %s" % [NOMES_DIFICULDADE[dif], a, _resumo(r)])
	if _filtros.get("so", "") == "ataques":
		return
	var feitos: Dictionary = {}
	for dif in [0, 1]:
		if _filtros.has("dificuldade") and int(_filtros["dificuldade"]) != dif:
			continue
		game_state.dificuldade = dif
		var fases: Array = dados.fases_expert if dif == 1 else dados.fases_normal
		for i in fases.size():
			for c in fases[i].combos:
				var chave := "%d:%s+%s@%.2f" % [dif, c.primeiro, c.segundo, c.atraso]
				var texto := "  %s fase %d  combo %-22s atraso %.2f: " % [NOMES_DIFICULDADE[dif], i + 1, "%s+%s" % [c.primeiro, c.segundo], c.atraso]
				if feitos.has(chave):
					_relatar(texto + feitos[chave])
					continue
				var r: Dictionary = await _testar(chefe_id, c.primeiro, c.segundo, c.atraso)
				var linha: String = _resumo(r)
				if not _filtros.has("rapido"):
					linha += "  | mínimo: " + await _atraso_minimo(chefe_id, c.primeiro, c.segundo, c.atraso)
				feitos[chave] = linha
				_relatar(texto + linha)


## Menor atraso (dos ATRASOS) em que o combo passa em todas as posições e sorteios.
func _atraso_minimo(chefe_id: String, primeiro: StringName, segundo: StringName, atual: float) -> String:
	for a in ATRASOS:
		if a > atual + 0.001:
			break
		var r: Dictionary = await _testar(chefe_id, primeiro, segundo, a)
		if r["ok"]:
			return "%.1f s" % a
	return "acima de %.2f s" % atual


func _resumo(r: Dictionary) -> String:
	var parado: String = "  [parado leva golpe em %d/%d]" % [r["parado"], r["casos"]]
	if r["ok"]:
		return "ok%s%s" % [" (precisa de dash)" if r["dash"] else "", parado]
	return "FALHOU em %s%s" % [", ".join(r["falhas"]), parado]


## Testa um ataque (segundo vazio) ou combo em várias posições iniciais e sorteios.
func _testar(chefe_id: String, primeiro: StringName, segundo: StringName, atraso: float) -> Dictionary:
	var resultado := {"ok": true, "dash": false, "falhas": [], "casos": 0}
	_parado_levou = 0
	for x in await _posicoes_iniciais(chefe_id):
		for semente in SORTEIOS:
			var r: Dictionary = await _caso(chefe_id, primeiro, segundo, atraso, x, semente)
			if not r["ok"]:
				resultado["ok"] = false
				resultado["falhas"].append("x=%d/s%d" % [x, semente])
			elif r["dash"]:
				resultado["dash"] = true
			resultado["casos"] += 1
	resultado["parado"] = _parado_levou
	return resultado


var _cache_posicoes: Dictionary = {}

## Três pontos de partida: longe, no meio e perto do chefe (fora do corpo dele).
func _posicoes_iniciais(chefe_id: String) -> Array:
	if _cache_posicoes.has(chefe_id):
		return _cache_posicoes[chefe_id]
	var nivel: Node = load(ARENAS[chefe_id]).instantiate()
	root.add_child(nivel)
	await physics_frame
	var chefe: Node2D = _achar_chefe(nivel)
	_ler_limites(nivel)
	var bx: float = chefe.global_position.x
	var lado: float = -1.0 if bx > 0.0 else 1.0  # para onde fica a arena, vista do chefe
	var perto: float = bx + lado * 320.0
	var longe: float = _x_max - 40.0 if lado > 0.0 else _x_min + 40.0
	var lista: Array = [roundf(longe), roundf((perto + longe) / 2.0), roundf(perto)]
	for i in lista.size():
		lista[i] = clampf(lista[i], _x_min + 10.0, _x_max - 10.0)
	nivel.queue_free()
	await physics_frame
	_cache_posicoes[chefe_id] = lista
	return lista


func _achar_chefe(nivel: Node) -> Node2D:
	for n in nivel.get_children():
		if n.has_method("limiares_fase"):
			return n
	return null


## Até onde o corpo do Curupira chega: as paredes da arena e, no Boto, as beiras da areia.
func _ler_limites(nivel: Node) -> void:
	_x_min = -960.0 + MEIO_CORPO
	_x_max = 960.0 - MEIO_CORPO
	for nome in ["LimiteAreiaEsquerdo", "LimiteAreiaDireito"]:
		var parede := nivel.get_node_or_null(nome) as Node2D
		if parede == null:
			continue
		var forma := parede.get_child(0) as CollisionShape2D
		var meia: float = 0.0
		if forma and forma.shape is RectangleShape2D:
			meia = (forma.shape as RectangleShape2D).size.x / 2.0
		var cx: float = forma.global_position.x if forma else parede.global_position.x
		if cx < 0.0:
			_x_min = maxf(_x_min, cx + meia + MEIO_CORPO)
		else:
			_x_max = minf(_x_max, cx - meia - MEIO_CORPO)


## Um caso: primeiro tenta sem dash; se não der, com dash.
func _caso(chefe_id: String, primeiro: StringName, segundo: StringName, atraso: float, x0: float, semente: int) -> Dictionary:
	if await _caso_com(chefe_id, primeiro, segundo, atraso, x0, semente, false):
		return {"ok": true, "dash": false}
	if await _caso_com(chefe_id, primeiro, segundo, atraso, x0, semente, true):
		return {"ok": true, "dash": true}
	return {"ok": false, "dash": true}


## Grava, procura, confere (até 4 voltas).
func _caso_com(chefe_id: String, primeiro: StringName, segundo: StringName, atraso: float, x0: float, semente: int, com_dash: bool) -> bool:
	var caminho: Array = []  # vazio = boneco parado em x0
	for volta in 4:
		var grade: Array = await _gravar(chefe_id, primeiro, segundo, atraso, x0, semente, caminho)
		if caminho.is_empty() and not com_dash:
			# Prova de que a gravação pega golpe: o boneco parado leva?
			var parado: Array = []
			for q in grade.size():
				parado.append([x0, 0.0, false, false])
			if not _caminho_limpo(parado, grade):
				_parado_levou += 1
		if not caminho.is_empty() and _caminho_limpo(caminho, grade):
			return true
		var novo: Array = _procurar(grade, x0, com_dash)
		if _filtros.has("depurar"):
			_depurar(grade, novo, x0, volta)
		if novo.is_empty():
			return false
		caminho = novo
	return false


# --- 1. Gravar ------------------------------------------------------------------

## Roda o ataque/combo de verdade e devolve, por quadro, a máscara de perigo de cada coluna
## (bit r = linha r da grade tem caixa de dano ligada).
func _gravar(chefe_id: String, primeiro: StringName, segundo: StringName, atraso: float, x0: float, semente: int, caminho: Array) -> Array:
	var nivel: Node = load(ARENAS[chefe_id]).instantiate()
	root.add_child(nivel)
	current_scene = nivel
	var chefe: Node2D = _achar_chefe(nivel)
	_ler_limites(nivel)
	# O Curupira de verdade sai de cena; o boneco é quem o chefe mira.
	var curupira := nivel.get_node_or_null("Curupira") as Node2D
	if curupira:
		curupira.process_mode = Node.PROCESS_MODE_DISABLED
		curupira.global_position = Vector2(0.0, 5000.0)
	var boneco := Node2D.new()
	nivel.add_child(boneco)
	boneco.global_position = Vector2(x0, CHAO - ORIGEM_ACIMA_DO_CHAO)
	chefe.alvo = boneco
	# Para o laço normal do chefe (ele começa sozinho) e assume o controle.
	chefe.derrotado = true
	await physics_frame
	await physics_frame
	chefe.derrotado = false
	chefe._sorteio.seed = semente
	chefe.estado_luta = 1  # ATACANDO: sem pose de susto no meio
	var estado := {"fim": false}
	_executar_no_chefe(chefe, primeiro, segundo, atraso, estado)
	var grade: Array = []
	var depois: int = 0
	for q in MAX_QUADROS:
		if not caminho.is_empty():
			var p: Array = caminho[mini(q, caminho.size() - 1)]
			boneco.global_position = Vector2(p[0], CHAO - ORIGEM_ACIMA_DO_CHAO - p[1])
		await physics_frame
		var perigos: int = 0
		grade.append(_mascaras(nivel, chefe, func() -> void: perigos += 1))
		if estado["fim"]:
			depois += 1
			# Acabou o ataque: grava mais um pouco, até os projéteis sumirem (máx. 4 s).
			if (perigos == 0 and depois > 10) or depois > 240:
				break
	nivel.queue_free()
	current_scene = null
	await physics_frame
	return grade


func _executar_no_chefe(chefe: Node, primeiro: StringName, segundo: StringName, atraso: float, estado: Dictionary) -> void:
	if segundo == &"":
		await chefe._executar(primeiro, false)
	else:
		var combo: Resource = load("res://scripts/combo_chefe.gd").new()
		combo.primeiro = primeiro
		combo.segundo = segundo
		combo.atraso = atraso
		await chefe._jogar_combo(combo)
	estado["fim"] = true


## Máscaras de perigo deste quadro (uma por coluna). contar() é chamado para cada caixa que
## não é o corpo do chefe (para saber quando os projéteis acabaram).
func _mascaras(nivel: Node, chefe: Node, contar: Callable) -> PackedInt64Array:
	var mascaras := PackedInt64Array()
	mascaras.resize(COLUNAS)
	var pilha: Array[Node] = [nivel]
	while not pilha.is_empty():
		var n: Node = pilha.pop_back()
		for filho in n.get_children():
			pilha.append(filho)
		var area := n as Area2D
		if area == null or (area.collision_layer & 16) == 0 or not area.is_inside_tree():
			continue
		if area.get_script() and String(area.get_script().resource_path).ends_with("poca_cuca.gd"):
			continue
		var marcou: bool = false
		for forma in area.get_children():
			if forma is CollisionShape2D and not forma.disabled and forma.shape != null:
				_marcar(mascaras, forma)
				marcou = true
		if marcou and not chefe.is_ancestor_of(area):
			contar.call()
	return mascaras


## Marca na grade as células que a forma cobre (retângulo girado, círculo ou cápsula).
func _marcar(mascaras: PackedInt64Array, forma: CollisionShape2D) -> void:
	var t: Transform2D = forma.global_transform
	var s: Shape2D = forma.shape
	if s is CircleShape2D:
		var c: Vector2 = t.origin
		var r: float = (s as CircleShape2D).radius * t.get_scale().x
		var c0: int = maxi(int(floor((c.x - r - X0) / CELULA)), 0)
		var c1: int = mini(int(floor((c.x + r - X0) / CELULA)), COLUNAS - 1)
		for col in range(c0, c1 + 1):
			var xa: float = X0 + col * CELULA
			var xb: float = xa + CELULA
			# Ponto da coluna mais perto do centro: ali o círculo é mais alto.
			var dx: float = 0.0 if (c.x >= xa and c.x <= xb) else minf(absf(c.x - xa), absf(c.x - xb))
			if dx > r:
				continue
			var meia: float = sqrt(r * r - dx * dx)
			_marcar_faixa(mascaras, col, c.y - meia, c.y + meia)
		return
	var meio: Vector2
	if s is RectangleShape2D:
		meio = (s as RectangleShape2D).size / 2.0
	elif s is CapsuleShape2D:
		meio = Vector2((s as CapsuleShape2D).radius, (s as CapsuleShape2D).height / 2.0)
	else:
		return
	var cantos: Array[Vector2] = [t * Vector2(-meio.x, -meio.y), t * Vector2(meio.x, -meio.y), t * Vector2(meio.x, meio.y), t * Vector2(-meio.x, meio.y)]
	var xmin: float = INF
	var xmax: float = -INF
	for p in cantos:
		xmin = minf(xmin, p.x)
		xmax = maxf(xmax, p.x)
	var c0: int = maxi(int(floor((xmin - X0) / CELULA)), 0)
	var c1: int = mini(int(floor((xmax - X0) / CELULA)), COLUNAS - 1)
	for col in range(c0, c1 + 1):
		var xa: float = maxf(X0 + col * CELULA, xmin)
		var xb: float = minf(X0 + (col + 1) * CELULA, xmax)
		# Faixa vertical do polígono dentro da coluna [xa, xb]: vértices dentro + cortes das arestas.
		var ymin: float = INF
		var ymax: float = -INF
		for i in 4:
			var p: Vector2 = cantos[i]
			var q: Vector2 = cantos[(i + 1) % 4]
			if p.x >= xa and p.x <= xb:
				ymin = minf(ymin, p.y)
				ymax = maxf(ymax, p.y)
			for xc in [xa, xb]:
				if (p.x - xc) * (q.x - xc) <= 0.0 and not is_equal_approx(p.x, q.x):
					var y: float = lerpf(p.y, q.y, (xc - p.x) / (q.x - p.x))
					ymin = minf(ymin, y)
					ymax = maxf(ymax, y)
		if ymin <= ymax:
			_marcar_faixa(mascaras, col, ymin, ymax)


## Liga os bits das linhas entre y_cima e y_baixo (coordenadas do mundo) na coluna.
func _marcar_faixa(mascaras: PackedInt64Array, col: int, y_cima: float, y_baixo: float) -> void:
	var h0: float = CHAO - y_baixo  # altura da parte de baixo da forma
	var h1: float = CHAO - y_cima
	if h1 < 0.0 or h0 >= LINHAS * CELULA:
		return
	var r0: int = maxi(int(floor(h0 / CELULA)), 0)
	var r1: int = mini(int(floor(h1 / CELULA)), LINHAS - 1)
	var bits: int = ((1 << (r1 - r0 + 1)) - 1) << r0
	mascaras[col] = mascaras[col] | bits


# --- 2. Procurar ----------------------------------------------------------------

## Máscara das linhas ocupadas pelo Curupira com os pés a "h" px do chão.
func _bits_corpo(h: float, agachado: bool) -> int:
	var altura: float = ALTURA_AGACHADO if agachado else ALTURA_DE_PE
	var r0: int = int(floor(h / CELULA))
	var r1: int = mini(int(floor((h + altura - 1.0) / CELULA)), LINHAS - 1)
	return ((1 << (r1 - r0 + 1)) - 1) << r0


func _bate(grade: Array, q: int, x: float, h: float, agachado: bool) -> bool:
	var m: PackedInt64Array = grade[mini(q, grade.size() - 1)]
	var c0: int = maxi(int(floor((x - MEIA_LARGURA - X0) / CELULA)), 0)
	var c1: int = mini(int(floor((x + MEIA_LARGURA - 1.0 - X0) / CELULA)), COLUNAS - 1)
	var corpo: int = _bits_corpo(h, agachado)
	for col in range(c0, c1 + 1):
		if m[col] & corpo:
			return true
	return false


## Busca em profundidade com memória. Estado = [x, h, vy, agachado, dash_resta, dash_dir,
## recarga, dash_aereo, cortou]. Devolve o caminho quadro a quadro [x, h, agachado, invencível]
## ou [] se não achou.
func _procurar(grade: Array, x0: float, com_dash: bool) -> Array:
	var fim: int = grade.size()
	var vistos: Dictionary = {}
	# Nós: [quadro, estado, pai, trecho (quadros deste passo)]
	var nos: Array = [[0, [x0, 0.0, 0.0, false, 0, 0.0, 0, true, false], -1, [[x0, 0.0, false, false]]]]
	var pilha: Array[int] = [0]
	var gastos: int = 0
	while not pilha.is_empty():
		var i: int = pilha.pop_back()
		var no: Array = nos[i]
		if no[0] >= fim:
			return _montar_caminho(nos, i)
		gastos += 1
		if gastos > LIMITE_BUSCA:
			return []
		var filhos: Array = []
		for acao in _acoes(no[1], com_dash):
			var r: Array = _simular(grade, no[0], no[1], acao)
			if r.is_empty():
				continue
			var e: Array = r[0]
			# Estados quase iguais (mesma célula, velocidade parecida) contam como o mesmo.
			var chave: String = "%d|%d|%d|%d|%s|%d|%d|%d|%s|%s" % [r[1], roundi(e[0] / 8.0), roundi(e[1] / 8.0), roundi(e[2] / 100.0), e[3], e[4], roundi(e[5]), ceili(e[6] / 6.0), e[7], e[8]]
			if vistos.has(chave):
				continue
			vistos[chave] = true
			nos.append([r[1], e, i, r[2]])
			filhos.append(nos.size() - 1)
		# O primeiro da lista é explorado primeiro.
		filhos.reverse()
		pilha.append_array(filhos)
	return []


func _montar_caminho(nos: Array, i: int) -> Array:
	var trechos: Array = []
	while i >= 0:
		trechos.push_front(nos[i][3])
		i = nos[i][2]
	var caminho: Array = []
	for t in trechos:
		caminho.append_array(t)
	return caminho


## Comandos possíveis no estado: [direção, pular, agachar, dash, cortar o pulo].
func _acoes(e: Array, com_dash: bool) -> Array:
	var no_chao: bool = e[1] <= 0.0 and e[2] <= 0.0
	var lista: Array = [[0, false, false, false, false], [-1, false, false, false, false], [1, false, false, false, false]]
	if no_chao:
		lista.append([0, true, false, false, false])
		lista.append([-1, true, false, false, false])
		lista.append([1, true, false, false, false])
		lista.append([0, false, true, false, false])
	elif e[2] > 0.0 and not e[8]:
		lista.append([0, false, false, false, true])
		lista.append([-1, false, false, false, true])
		lista.append([1, false, false, false, true])
	if com_dash and e[6] <= 0 and (no_chao or e[7]):
		lista.append([-1, false, false, true, false])
		lista.append([1, false, false, true, false])
	return lista


## Aplica um comando por QUADROS_POR_DECISAO quadros (o dash inteiro, se for dash).
## Devolve [estado_novo, quadro_novo, trecho] ou [] se encostou numa caixa.
func _simular(grade: Array, q: int, e0: Array, acao: Array) -> Array:
	var e: Array = e0.duplicate()
	var trecho: Array = []
	var quadros: int = QUADROS_POR_DECISAO
	if acao[3]:
		e[4] = _dash_quadros
		e[5] = float(acao[0])
		if e[1] > 0.0 or e[2] > 0.0:
			e[7] = false
		quadros = _dash_quadros
	if acao[1]:
		e[2] = _pulo
		e[8] = false
	if acao[4]:
		e[2] *= 0.5  # soltar o botão de pulo subindo (corte_pulo 0,5)
		e[8] = true
	e[3] = acao[2]
	for k in quadros:
		var invencivel: bool = e[4] > 0
		if e[4] > 0:
			e[0] += e[5] * _dash_dist / _dash_quadros
			e[4] -= 1
			e[2] = 0.0
			if e[4] == 0:
				e[6] = _recarga_quadros
		else:
			if e[6] > 0:
				e[6] -= 1
			if not e[3]:
				e[0] += acao[0] * _vel * QUADRO
			if e[1] > 0.0 or e[2] > 0.0:
				e[2] -= _grav * QUADRO
				e[1] += e[2] * QUADRO
				if e[1] <= 0.0:
					e[1] = 0.0
					e[2] = 0.0
					e[7] = true
					e[8] = false
		e[0] = clampf(e[0], _x_min, _x_max)
		var qq: int = q + k + 1
		if not invencivel and _bate(grade, qq, e[0], e[1], e[3]):
			return []
		trecho.append([e[0], e[1], e[3], invencivel])
	return [e, q + quadros, trecho]


# --- 3. Conferir ----------------------------------------------------------------

func _caminho_limpo(caminho: Array, grade: Array) -> bool:
	for q in range(1, mini(caminho.size(), grade.size())):
		var p: Array = caminho[q]
		if not p[3] and _bate(grade, q, p[0], p[1], p[2]):
			return false
	return true



## Mostra a gravação e o caminho achado (filtro "depurar").
func _depurar(grade: Array, caminho: Array, x0: float, volta: int) -> void:
	print("    [depurar] x0=%d volta=%d quadros=%d caminho=%d" % [x0, volta, grade.size(), caminho.size()])
	for q in range(0, grade.size(), 15):
		var m: PackedInt64Array = grade[q]
		var cols: Array = []
		for col in COLUNAS:
			if m[col] != 0:
				cols.append(col)
		var faixa: String = "-" if cols.is_empty() else "x %d..%d (%d col)" % [X0 + cols[0] * CELULA, X0 + (cols[-1] + 1) * CELULA, cols.size()]
		var p: String = ""
		if q < caminho.size():
			p = "  curupira x=%d h=%d%s%s" % [caminho[q][0], caminho[q][1], " agach" if caminho[q][2] else "", " DASH" if caminho[q][3] else ""]
		print("      q%4d perigo %s%s" % [q, faixa, p])
