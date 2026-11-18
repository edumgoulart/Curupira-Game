#!/usr/bin/env python3
"""Lê o JSON que exportar.html escreve (chrome --dump-dom) e grava as folhas em <destino>.
Uso: python3 exportar.py dom.html <destino>   (destino = game/assets/pixel)"""
import base64, html, json, os, re, sys

dom, destino = sys.argv[1], sys.argv[2]
texto = open(dom, encoding='utf-8').read()
ini = texto.index('<pre id="saida">') + len('<pre id="saida">')
dados = html.unescape(texto[ini:texto.index('</pre>', ini)])
if dados.startswith('ERRO'):
    sys.exit(dados)
dados = json.loads(dados)

def gravar(caminho, b64):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, 'wb') as f:
        f.write(base64.b64decode(b64))

def gravar_json(caminho, obj):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    texto = json.dumps(obj, ensure_ascii=False, indent=1)
    # pares [x, y] numa linha só
    texto = re.sub(r'\[\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*\]', r'[\1, \2]', texto)
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(texto + '\n')

for nome, p in dados['personagens'].items():
    gravar(f'{destino}/{nome}/{nome}.png', p['png'])
    gravar_json(f'{destino}/{nome}/{nome}.json', p['meta'])

efeitos = {}
for chave, e in dados['efeitos'].items():
    for i, q in enumerate(e['quadros'], 1):
        gravar(f"{destino}/{e['pasta']}/efeitos/{e['nome']}_{i}.png", q)
    meta = {k: v for k, v in e.items() if k not in ('quadros', 'pasta')}
    meta['quadros'] = len(e['quadros'])
    efeitos.setdefault(e['pasta'], {})[e['nome']] = meta
for pasta, lista in efeitos.items():
    gravar_json(f'{destino}/{pasta}/efeitos/efeitos.json', lista)

for nome, a in dados['arenas'].items():
    for i, q in enumerate(a['fundo'], 1):
        gravar(f'{destino}/arenas/{nome}/fundo_{i}.png', q)
    if a['frente']:
        for i, q in enumerate(a['frente'], 1):
            gravar(f'{destino}/arenas/{nome}/frente_{i}.png', q)
    gravar_json(f'{destino}/arenas/{nome}/arena.json', {'fps': a['fps'], 'quadros': len(a['fundo']), 'tem_frente': bool(a['frente']), 'chao_y': a['chao_y'], 'curupira_x': a['curupira_x'], 'tamanho': [480, 270]})
# mapa do mundo: fundo e frente animados, máscara de onde dá para andar, atlas dos objetos e os dados
# (dados.json e não mapa.json: o gerar_spriteframes.gd trata <pasta>/<pasta>.json como folha de personagem)
m = dados.get('mapa')
if m:
    for i, (f, fr) in enumerate(zip(m['fundo'], m['frente']), 1):
        gravar(f'{destino}/mapa/fundo_{i}.png', f)
        gravar(f'{destino}/mapa/frente_{i}.png', fr)
    gravar(f'{destino}/mapa/andavel.png', m['andavel'])
    gravar(f'{destino}/mapa/objetos.png', m['objetos'])
    gravar_json(f'{destino}/mapa/dados.json', m['dados'])
# fonte em BMFont (texto): o Godot importa o .fnt como FontFile
for nome, f in dados.get('fontes', {}).items():
    gravar(f'{destino}/ui/fonte_{nome}.png', f['png'])
    linhas = [f'info face="{nome}" size={f["tamanho"]} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=0 aa=1 padding=0,0,0,0 spacing=1,1',
              f'common lineHeight={f["altura_linha"]} base={f["base"]} scaleW={f["largura"]} scaleH={f["altura"]} pages=1 packed=0',
              f'page id=0 file="fonte_{nome}.png"', f'chars count={len(f["glifos"])}']
    for g in f['glifos']:
        linhas.append(f'char id={g["id"]} x={g["x"]} y={g["y"]} width={g["w"]} height={g["h"]} xoffset={g["xoffset"]} yoffset={g["yoffset"]} xadvance={g["xadvance"]} page=0 chnl=15')
    with open(f'{destino}/ui/fonte_{nome}.fnt', 'w', encoding='utf-8') as arq:
        arq.write('\n'.join(linhas) + '\n')
for nome, u in dados.get('ui', {}).items():
    gravar(f'{destino}/ui/{nome}.png', u['png'])
print('ok', len(dados['personagens']), 'personagens,', len(dados['efeitos']), 'efeitos,', len(dados['arenas']), 'arenas')
